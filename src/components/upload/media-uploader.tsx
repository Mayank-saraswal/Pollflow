'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  ImagePlus, Video, X, Loader2,
  Upload, CheckCircle2, AlertTriangle
} from 'lucide-react'
import { useMediaUpload } from '@/hooks/use-media-upload'
import { cn } from '@/lib/utils'
import { POLL_LIMITS } from '@/lib/constants'

interface Props {
  value?:    string | null
  onChange:  (url: string | null) => void
  accept?:   'image' | 'video' | 'any'
  label?:    string
  className?: string
}

export function MediaUploader({
  value,
  onChange,
  accept = 'any',
  label = 'Upload media',
  className,
}: Props) {
  const { isUploading: uploading, progress, error, upload, reset } = useMediaUpload()

  const acceptMap = {
    image: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
    video: { 'video/*': ['.mp4', '.webm'] },
    any:   {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      'video/*': ['.mp4', '.webm'],
    },
  }

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return
      const url = await upload(file)
      if (url) onChange(url)
    },
    [upload, onChange]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptMap[accept],
    maxFiles: 1,
    disabled: uploading,
  })

  const isImage = value && !value.includes('.mp4') && !value.includes('.webm')
  const isVideo = value && (value.includes('.mp4') || value.includes('.webm'))

  if (value) {
    return (
      <div className={cn('relative rounded-xl overflow-hidden border border-white/[0.08]', className)}>
        {isImage && (
          <img src={value} alt="Upload preview"
            className="w-full max-h-48 object-cover" />
        )}
        {isVideo && (
          <video src={value} controls
            className="w-full max-h-48 object-cover" />
        )}
        <button
          type="button"
          onClick={() => { onChange(null); reset() }}
          className="absolute top-2 right-2 p-1.5 rounded-full
                    bg-black/60 backdrop-blur-sm text-white/70
                    hover:text-white hover:bg-black/80 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5
                       px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
          <CheckCircle2 className="w-3 h-3 text-green-400" />
          <span className="font-body text-white/70 text-xs">Uploaded</span>
        </div>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        'h-32 rounded-xl border border-dashed border-white/[0.10]',
        'cursor-pointer transition-all duration-200',
        isDragActive
          ? 'border-white/[0.30] bg-white/[0.05]'
          : 'hover:border-white/[0.18] hover:bg-white/[0.02]',
        uploading && 'pointer-events-none',
        className
      )}
    >
      <input {...getInputProps()} />

      {uploading ? (
        <>
          <Loader2 className="w-6 h-6 text-white/40 animate-spin" />
          <div className="flex flex-col items-center gap-1.5 w-full px-8">
            <div className="h-1 w-full bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full bg-white/60 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-body text-white/30 text-xs">{progress}%</span>
          </div>
        </>
      ) : error ? (
        <>
          <AlertTriangle className="w-6 h-6 text-red-400" />
          <p className="font-body text-red-400 text-xs text-center px-4">
            {error}
          </p>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            {accept === 'video'
              ? <Video className="w-6 h-6 text-white/25" />
              : <ImagePlus className="w-6 h-6 text-white/25" />}
          </div>
          <div className="text-center">
            <p className="font-body text-white/40 text-sm">
              {isDragActive ? 'Drop it here' : label}
            </p>
            <p className="font-body text-white/20 text-xs mt-0.5">
              {accept === 'video'
                ? 'MP4, WebM up to 100MB'
                : 'JPG, PNG, GIF, WebP up to 20MB'}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
