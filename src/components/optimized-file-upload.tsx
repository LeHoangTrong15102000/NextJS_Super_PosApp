'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Upload } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface OptimizedFileUploadProps {
  value?: string
  onChange: (url: string) => void
  onFileChange: (file: File | null) => void
  placeholder?: string
  className?: string
}

export default function OptimizedFileUpload({
  value,
  onChange,
  onFileChange,
  placeholder = 'Upload',
  className = 'aspect-square w-[100px] h-[100px] rounded-md object-cover'
}: OptimizedFileUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const urlRef = useRef<string | null>(null)

  // Tạo preview URL với proper cleanup
  const previewUrl = useMemo(() => {
    if (file) {
      // Cleanup previous URL
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
      }

      // Create new URL
      const url = URL.createObjectURL(file)
      urlRef.current = url
      return url
    }
    return value
  }, [file, value])

  // Cleanup khi component unmount hoặc file thay đổi
  useEffect(() => {
    return () => {
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current)
        urlRef.current = null
      }
    }
  }, [])

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0]

      if (selectedFile) {
        // Validate file type
        if (!selectedFile.type.startsWith('image/')) {
          alert('Vui lòng chọn file hình ảnh')
          return
        }

        // Validate file size (5MB)
        if (selectedFile.size > 5 * 1024 * 1024) {
          alert('File quá lớn. Vui lòng chọn file nhỏ hơn 5MB')
          return
        }

        setFile(selectedFile)
        onChange(`http://localhost:3000/${selectedFile.name}`)
        onFileChange(selectedFile)
      }
    },
    [onChange, onFileChange]
  )

  const handleClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  return (
    <div className='flex gap-2 items-start justify-start'>
      <Avatar className={className}>
        <AvatarImage src={previewUrl} />
        <AvatarFallback className='rounded-none'>{placeholder}</AvatarFallback>
      </Avatar>

      <input type='file' accept='image/*' ref={inputRef} onChange={handleFileChange} className='hidden' />

      <button
        className='flex aspect-square w-[100px] items-center justify-center rounded-md border border-dashed hover:bg-gray-50 transition-colors'
        type='button'
        onClick={handleClick}
      >
        <Upload className='h-4 w-4 text-muted-foreground' />
        <span className='sr-only'>Upload</span>
      </button>
    </div>
  )
}
