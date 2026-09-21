import { NextRequest, NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink, mkdtemp } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'

export const maxDuration = 30

const execFileAsync = promisify(execFile)

/**
 * API route that proxies a CloudFront signed HEIC URL, converts to JPEG
 * using the native `heif-convert` tool, and returns the JPEG.
 *
 * Usage: GET /api/heic-convert?url=<encoded-cloudfront-signed-url>
 */
export async function GET(request: NextRequest) {
  let tempDir: string | null = null

  try {
    const url = request.nextUrl.searchParams.get('url')

    if (!url || !url.startsWith('https://') || !url.includes('cloudfront.net')) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    // Fetch the HEIC image from CloudFront server-side (no CORS issues)
    const response = await fetch(url)

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      )
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Check if it's actually a HEIC file
    if (!isHeicImage(buffer)) {
      // Not HEIC — just return the original image
      const contentType = response.headers.get('content-type') || 'image/jpeg'
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, s-maxage=604800',
        },
      })
    }

    // Create temp directory and files
    tempDir = await mkdtemp(path.join(tmpdir(), 'heic-'))
    const inputPath = path.join(tempDir, 'input.heic')
    const outputPath = path.join(tempDir, 'output.jpg')

    await writeFile(inputPath, buffer)

    // Convert using native heif-convert (fast, reliable)
    await execFileAsync('heif-convert', [inputPath, outputPath, '-q', '85'], {
      timeout: 30000,
    })

    const jpegBuffer = await readFile(outputPath)

    return new NextResponse(jpegBuffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('HEIC conversion error:', message)
    return NextResponse.json({ error: 'Conversion failed', detail: message }, { status: 500 })
  } finally {
    // Clean up temp files
    if (tempDir) {
      try {
        const inputPath = path.join(tempDir, 'input.heic')
        const outputPath = path.join(tempDir, 'output.jpg')
        await unlink(inputPath).catch(() => {})
        await unlink(outputPath).catch(() => {})
        const { rmdir } = await import('fs/promises')
        await rmdir(tempDir).catch(() => {})
      } catch {
        /* ignore cleanup errors */
      }
    }
  }
}

/**
 * Checks if a buffer is a HEIC/HEIF image by examining magic bytes.
 */
function isHeicImage(buffer: Buffer): boolean {
  if (buffer.length < 12) return false
  const ftypSignature = buffer.slice(4, 8).toString('ascii')
  if (ftypSignature !== 'ftyp') return false
  const brand = buffer.slice(8, 12).toString('ascii')
  const heicBrands = ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1']
  return heicBrands.includes(brand)
}
