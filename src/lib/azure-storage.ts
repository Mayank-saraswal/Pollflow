import {
  BlobServiceClient,
} from '@azure/storage-blob'
import { nanoid } from 'nanoid'

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING!
const containerName    = process.env.AZURE_STORAGE_CONTAINER_NAME ?? 'pollflow-media'

// Singleton client
let blobServiceClient: BlobServiceClient | null = null

function getClient(): BlobServiceClient {
  if (!blobServiceClient) {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
  }
  return blobServiceClient
}

export type MediaType = 'image' | 'gif' | 'video'

const ALLOWED_TYPES: Record<MediaType, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp'],
  gif:   ['image/gif'],
  video: ['video/mp4', 'video/webm'],
}

const MAX_SIZES: Record<MediaType, number> = {
  image: 10  * 1024 * 1024,  // 10 MB
  gif:   20  * 1024 * 1024,  // 20 MB
  video: 100 * 1024 * 1024,  // 100 MB
}

function detectMediaType(mimeType: string): MediaType | null {
  for (const [type, mimes] of Object.entries(ALLOWED_TYPES)) {
    if (mimes.includes(mimeType)) return type as MediaType
  }
  return null
}

export interface UploadResult {
  url:       string
  blobName:  string
  mediaType: MediaType
  sizeBytes: number
}

export async function uploadMediaBuffer(
  buffer: Buffer,
  mimeType: string,
  originalName: string
): Promise<UploadResult> {
  const mediaType = detectMediaType(mimeType)
  if (!mediaType) {
    throw new Error(`Unsupported media type: ${mimeType}`)
  }
  if (buffer.byteLength > MAX_SIZES[mediaType]) {
    throw new Error(
      `File too large. Max size for ${mediaType}: ${MAX_SIZES[mediaType] / 1024 / 1024}MB`
    )
  }

  const ext      = originalName.split('.').pop() ?? 'bin'
  const blobName = `${mediaType}s/${nanoid(12)}.${ext}`

  const client    = getClient()
  const container = client.getContainerClient(containerName)

  // Ensure container exists with public read for blobs
  await container.createIfNotExists({ access: 'blob' })

  const blockClient = container.getBlockBlobClient(blobName)
  await blockClient.uploadData(buffer, {
    blobHTTPHeaders: {
      blobContentType:  mimeType,
      blobCacheControl: 'public, max-age=31536000, immutable',
    },
  })

  return {
    url:      blockClient.url,
    blobName,
    mediaType,
    sizeBytes: buffer.byteLength,
  }
}

export async function deleteBlob(blobName: string): Promise<void> {
  try {
    const client    = getClient()
    const container = client.getContainerClient(containerName)
    const blob      = container.getBlockBlobClient(blobName)
    await blob.deleteIfExists()
  } catch {
    // Non-fatal
  }
}
