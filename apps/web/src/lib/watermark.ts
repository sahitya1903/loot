import sharp from 'sharp'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const convert = require('heic-convert')

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.avi', '.mkv']
const HEIC_EXTENSIONS = ['.heic', '.heif']

export function isVideoFile(filename: string): boolean {
  const lower = filename.toLowerCase()
  return VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

export function isVideoContentType(contentType: string): boolean {
  return contentType.startsWith('video/')
}

export function isHeicFile(filename: string): boolean {
  const lower = filename.toLowerCase()
  return HEIC_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

export function isHeicContentType(contentType: string): boolean {
  return contentType === 'image/heic' || contentType === 'image/heif'
}

/**
 * Converts a HEIC/HEIF buffer to JPEG.
 */
async function convertHeicToJpeg(buffer: Buffer): Promise<Buffer> {
  const result = await convert({
    buffer: Uint8Array.from(buffer),
    format: 'JPEG',
    quality: 1,
  })
  return Buffer.from(result)
}

/**
 * Composites a watermark image onto the bottom-right corner of an image.
 * For HEIC/HEIF images, converts to JPEG first, then applies watermark.
 * Returns { buffer, converted } where converted indicates if format changed.
 */
export async function applyWatermark(
  imageBuffer: Buffer,
  watermarkBuffer: Buffer,
  isHeic: boolean = false
): Promise<{ buffer: Buffer; converted: boolean }> {
  let processBuffer = imageBuffer
  const converted = isHeic

  if (isHeic) {
    processBuffer = await convertHeicToJpeg(imageBuffer)
  }

  const metadata = await sharp(processBuffer).metadata()
  const imageWidth = metadata.width || 1000

  const targetWidth = Math.round(imageWidth * 0.15)

  // Resize watermark and apply 75% opacity
  const resizedWatermark = await sharp(watermarkBuffer)
    .resize({ width: targetWidth })
    .ensureAlpha()
    .composite([
      {
        input: Buffer.from([255, 255, 255, Math.round(255 * 0.75)]),
        raw: { width: 1, height: 1, channels: 4 },
        tile: true,
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer()

  const result = await sharp(processBuffer)
    .composite([
      {
        input: resizedWatermark,
        gravity: 'southeast',
      },
    ])
    .toBuffer()

  return { buffer: result, converted }
}
