'use client'

import React, { useCallback } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Image, Upload, X } from 'lucide-react'
import { useDropzone } from 'react-dropzone'

interface ImageUploadProps {
    label: string
    description?: string
    value: string
    required?: boolean
    onChange: (value: string) => void
    className?: string
    maxSize?: number // in MB
    acceptedTypes?: string[]
}

export function ImageUpload({
    label,
    description,
    value,
    required,
    onChange,
    className,
    maxSize = 5, // 5MB default
    acceptedTypes = ['image/jpeg', 'image/png', 'image/gif']
}: ImageUploadProps) {
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                onChange(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }, [onChange])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': acceptedTypes
        },
        maxSize: maxSize * 1024 * 1024,
        multiple: false
    })

    const clearImage = () => {
        onChange('')
    }

    return (
        <div className={cn("grid gap-2", className)}>
            <div className="flex justify-between items-center">
                <Label className="font-medium">
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {value && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearImage}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Remove
                    </Button>
                )}
            </div>
            {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
            )}
            {value ? (
                <div className="relative aspect-video rounded-lg overflow-hidden border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={value}
                        alt="Uploaded image"
                        className="object-cover w-full h-full"
                    />
                </div>
            ) : (
                <div
                    {...getRootProps()}
                    className={cn(
                        "border-2 border-dashed rounded-lg p-8 transition-colors",
                        "flex flex-col items-center justify-center gap-2 text-center",
                        isDragActive && "border-primary bg-primary/5",
                        "hover:border-primary hover:bg-primary/5 cursor-pointer"
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        {isDragActive ? (
                            <Upload className="h-6 w-6 text-primary" />
                        ) : (
                            <Image className="h-6 w-6 text-primary" />
                        )}
                    </div>
                    <div>
                        <p className="text-sm font-medium">
                            {isDragActive ? 'Drop the image here' : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {acceptedTypes.join(', ')} up to {maxSize}MB
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}
