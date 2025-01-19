'use client'

import React, { useRef, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Eraser, Undo } from 'lucide-react'

interface SignatureProps {
    label: string
    description?: string
    value: string
    required?: boolean
    onChange: (value: string) => void
    className?: string
}

export function Signature({
    label,
    description,
    value,
    required,
    onChange,
    className
}: SignatureProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null)

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return

        setIsDrawing(true)
        const rect = canvas.getBoundingClientRect()
        const point = getPoint(e, rect)
        setLastPoint(point)
    }

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !canvasRef.current || !lastPoint) return

        const canvas = canvasRef.current
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        const rect = canvas.getBoundingClientRect()
        const point = getPoint(e, rect)

        ctx.beginPath()
        ctx.moveTo(lastPoint.x, lastPoint.y)
        ctx.lineTo(point.x, point.y)
        ctx.strokeStyle = '#000'
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.stroke()

        setLastPoint(point)
        onChange(canvas.toDataURL())
    }

    const stopDrawing = () => {
        setIsDrawing(false)
        setLastPoint(null)
    }

    const clear = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.clearRect(0, 0, canvas.width, canvas.height)
        onChange('')
    }

    const getPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>, rect: DOMRect) => {
        let clientX: number, clientY: number

        if ('touches' in e) {
            clientX = e.touches[0].clientX
            clientY = e.touches[0].clientY
        } else {
            clientX = e.clientX
            clientY = e.clientY
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        }
    }

    React.useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        // Set canvas size
        canvas.width = canvas.offsetWidth
        canvas.height = canvas.offsetHeight

        // Load existing signature
        if (value) {
            const img = new Image()
            img.onload = () => {
                const ctx = canvas.getContext('2d')
                if (ctx) {
                    ctx.drawImage(img, 0, 0)
                }
            }
            img.src = value
        }
    }, [value])

    return (
        <div className={cn("grid gap-2", className)}>
            <div className="flex justify-between items-center">
                <Label className="font-medium">
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </Label>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clear}
                    >
                        <Eraser className="h-4 w-4 mr-2" />
                        Clear
                    </Button>
                </div>
            </div>
            {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <div className="border rounded-md p-4">
                <canvas
                    ref={canvasRef}
                    className="w-full h-[200px] border rounded-md touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                />
            </div>
        </div>
    )
}
