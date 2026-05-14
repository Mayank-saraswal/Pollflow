'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useMediaUpload } from '@/hooks/use-media-upload'
import { cn } from '@/lib/utils'
import { POLL_LIMITS } from '@/lib/constants'

interface MediaUploaderProps {
  onUploadComplete: (url: string) => void
  accept?: 'image' | 'all'
  className?: string
}

export function MediaUploader({ onUploadComplete, accept = 'image', className }: MediaUploaderProps) {
  const { isUploading, progress, url, error, upload, reset } = useMediaUpload()
  const [preview, setPreview] = useState<string | null>(null)

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      // Show preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => setPreview(e.target?.result as string)
        reader.readAsDataURL(file)
      }

      const uploadedUrl = await upload(file)
      if (uploadedUrl) {
        onUploadComplete(uploadedUrl)
      }
    },
    [upload, onUploadComplete]
  )

  const imageAccept: Record<string, string[]> = {
    'image/*': POLL_LIMITS.ALLOWED_IMAGE_TYPES.map((t) => `.${t.split('/')[1]}`),
  }
  const accepted: Record<string, string[]> =
    accept === 'image'
      ? imageAccept
      : {
          ...imageAccept,
          'video/*': POLL_LIMITS.ALLOWED_VIDEO_TYPES.map((t) => `.${t.split('/')[1]}`),
        }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accepted,
    maxSize: POLL_LIMITS.MAX_MEDIA_SIZE_MB * 1024 * 1024,
    multiple: false,
    disabled: isUploading,
  })

  const handleClear = () => {
    setPreview(null)
    reset()
  }

  if (url && preview) {
    return (
      <div className={cn('relative rounded-lg overflow-hidden group', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Upload preview" className="w-full h-32 object-cover rounded-lg" />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleClear}
            className="gap-1"
          >
            <X className="size-3" />
            Remove
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all',
        isDragActive
          ? 'border-white bg-white/10'
          : 'border-white/[0.08] hover:border-white/50 hover:bg-white/[0.06]',
        isUploading && 'pointer-events-none opacity-60',
        className
      )}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 text-white animate-spin" />
          <Progress value={progress} className="w-32 h-1.5" />
          <p className="text-xs text-white/50">{progress}%</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          {isDragActive ? (
            <Upload className="size-6 text-white" />
          ) : (
            <ImageIcon className="size-6 text-white/50" />
          )}
          <p className="text-xs text-white/50">
            {isDragActive ? 'Drop to upload' : 'Drag & drop or click to upload'}
          </p>
          <p className="text-xs text-white/30">
            Up to {POLL_LIMITS.MAX_MEDIA_SIZE_MB}MB
          </p>
        </div>
      )}
      {error && <p className="text-xs text-destructive mt-2">{error}</p>}
    </div>
  )
}
