import { NextRequest, NextResponse } from 'next/server'
import { applyWatermark, isVideoContentType, isHeicContentType, isHeicFile } from '@/lib/watermark'

// Cache watermark buffers by URL to avoid re-fetching for each download
const watermarkCache = new Map<string, { buffer: Buffer; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

async function getWatermarkBuffer(watermarkUrl: string): Promise<Buffer | null> {
  const cached = watermarkCache.get(watermarkUrl)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.buffer
  }

  try {
    const response = await fetch(watermarkUrl)
    if (!response.ok) return null
    const buffer = Buffer.from(await response.arrayBuffer())
    watermarkCache.set(watermarkUrl, { buffer, timestamp: Date.now() })
    return buffer
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get('url')
    const filename = request.nextUrl.searchParams.get('filename') || 'file'
    const watermarkUrl = request.nextUrl.searchParams.get('watermarkUrl')

    if (!url || !url.startsWith('https://') || !url.includes('cloudfront.net')) {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const response = await fetch(url)

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch media' }, { status: response.status })
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'

    // Apply watermark if provided and this is an image (not video)
    const isHeic = isHeicContentType(contentType) || isHeicFile(filename)
    if (watermarkUrl && !isVideoContentType(contentType)) {
      const watermarkBuffer = await getWatermarkBuffer(watermarkUrl)
      if (watermarkBuffer) {
        const imageBuffer = Buffer.from(await response.arrayBuffer())
        const { buffer: watermarkedBuffer, converted } = await applyWatermark(
          imageBuffer,
          watermarkBuffer,
          isHeic
        )

        const outputFilename = converted
          ? filename.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg')
          : filename
        const outputContentType = converted ? 'image/jpeg' : contentType

        return new NextResponse(new Uint8Array(watermarkedBuffer), {
          headers: {
            'Content-Disposition': `attachment; filename="${outputFilename}"`,
            'Content-Type': outputContentType,
          },
        })
      }
    }

    return new NextResponse(response.body, {
      headers: {
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Type': contentType,
      },
    })
  } catch (error) {
    console.error('Download proxy error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
