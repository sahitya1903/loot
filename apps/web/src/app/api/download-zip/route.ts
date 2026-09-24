import { NextRequest, NextResponse } from 'next/server'
import archiver from 'archiver'
import { applyWatermark, isVideoFile, isHeicFile } from '@/lib/watermark'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { files, watermarkUrl } = body as {
      files: Array<{ url: string; filename: string }>
      watermarkUrl?: string
    }

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Validate all URLs are from CloudFront
    for (const file of files) {
      if (!file.url || !file.url.startsWith('https://') || !file.url.includes('cloudfront.net')) {
        return NextResponse.json({ error: 'Invalid URL in files' }, { status: 400 })
      }
    }

    // Fetch watermark once if provided
    let watermarkBuffer: Buffer | null = null
    if (watermarkUrl) {
      try {
        const wmResponse = await fetch(watermarkUrl)
        if (wmResponse.ok) {
          watermarkBuffer = Buffer.from(await wmResponse.arrayBuffer())
        }
      } catch {
        // Continue without watermark
      }
    }

    // Create a zip archive
    const archive = archiver('zip', { zlib: { level: 5 } })

    // Track used filenames to avoid duplicates
    const usedFilenames = new Map<string, number>()

    // Fetch all files and add to archive
    for (const file of files) {
      try {
        const response = await fetch(file.url)
        if (!response.ok) continue

        const arrayBuffer = await response.arrayBuffer()
        let buffer: Buffer = Buffer.from(arrayBuffer)

        // Apply watermark to images (not videos)
        let outputFilename = file.filename
        if (watermarkBuffer && !isVideoFile(file.filename)) {
          try {
            const isHeic = isHeicFile(file.filename)
            const { buffer: wmBuffer, converted } = await applyWatermark(
              buffer,
              watermarkBuffer,
              isHeic
            )
            buffer = Buffer.from(wmBuffer)
            if (converted) {
              outputFilename = outputFilename
                .replace(/\.heic$/i, '.jpg')
                .replace(/\.heif$/i, '.jpg')
            }
          } catch (wmErr) {
            console.error(`Watermark failed for ${file.filename}:`, wmErr)
          }
        }

        // Handle duplicate filenames
        let filename = outputFilename
        const count = usedFilenames.get(filename) || 0
        if (count > 0) {
          const ext = filename.lastIndexOf('.')
          if (ext > 0) {
            filename = `${filename.substring(0, ext)}_${count}${filename.substring(ext)}`
          } else {
            filename = `${filename}_${count}`
          }
        }
        usedFilenames.set(outputFilename, count + 1)

        archive.append(buffer, { name: filename })
      } catch (e) {
        console.error(`Failed to fetch file: ${file.filename}`, e)
        // Continue with other files
      }
    }

    // Finalize the archive
    archive.finalize()

    // Convert archive stream to buffer
    const chunks: Buffer[] = []
    for await (const chunk of archive) {
      chunks.push(Buffer.from(chunk))
    }
    const zipBuffer = Buffer.concat(chunks)

    // Return the zip file
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Disposition': 'attachment; filename="loot-media.zip"',
        'Content-Type': 'application/zip',
      },
    })
  } catch (error) {
    console.error('Zip download error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
