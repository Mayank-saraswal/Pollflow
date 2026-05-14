'use client'

import { useState, useCallback } from 'react'
import axios from 'axios'

export interface UploadState {
  isUploading: boolean
  progress:    number
  url:         string | null
  error:       string | null
}

export function useMediaUpload() {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress:    0,
    url:         null,
    error:       null,
  })

  const upload = useCallback(async (file: File): Promise<string | null> => {
    const MAX_MB = 100
    const MAX_B  = MAX_MB * 1024 * 1024
    if (file.size > MAX_B) {
      setState((s) => ({ ...s, error: `File exceeds ${MAX_MB}MB limit` }))
      return null
    }

    setState({ isUploading: true, progress: 0, url: null, error: null })

    try {
      const form = new FormData()
      form.append('file', file)

      const { data } = await axios.post('/api/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round(((e.loaded ?? 0) / (e.total ?? 1)) * 100)
          setState((s) => ({ ...s, progress: pct }))
        },
      })

      const url = data.data.url as string
      setState({ isUploading: false, progress: 100, url, error: null })
      return url
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.error as string) ?? 'Upload failed'
        : 'Upload failed'
      setState({ isUploading: false, progress: 0, url: null, error: msg })
      return null
    }
  }, [])

  const reset = useCallback(() => {
    setState({ isUploading: false, progress: 0, url: null, error: null })
  }, [])

  return { ...state, upload, reset }
}
