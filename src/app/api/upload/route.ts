import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadMediaBuffer } from '@/lib/azure-storage'
import { apiSuccess, apiError, handleServerError } from '@/lib/api-response'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return apiError('Unauthorized', 401)

    const formData = await req.formData()
    const file     = formData.get('file') as File | null

    if (!file) return apiError('No file provided', 400)

    const maxSize = 100 * 1024 * 1024 // 100 MB hard cap
    if (file.size > maxSize) {
      return apiError('File exceeds 100MB limit', 400)
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadMediaBuffer(buffer, file.type, file.name)

    return apiSuccess({
      url:       result.url,
      blobName:  result.blobName,
      mediaType: result.mediaType,
      sizeBytes: result.sizeBytes,
    }, 'Uploaded successfully', 201)
  } catch (err) {
    return handleServerError(err)
  }
}
