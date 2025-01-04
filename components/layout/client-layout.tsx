'use client'

import { FloatingChat } from '@/components/messaging/floating-chat'
import { cn } from '@/lib/utils'
import { GripVertical } from 'lucide-react'
import { useState, useRef } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export function ClientLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isDragging, setIsDragging] = useState(false)
    const [chatPosition, setChatPosition] = useState({ x: 0, y: 0 })
    const chatRef = useRef<HTMLDivElement>(null)
    const [queryClient] = useState(() => new QueryClient())

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        setIsDragging(true)
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && chatRef.current) {
            const newX = e.clientX - chatRef.current.offsetWidth / 2
            const newY = e.clientY - chatRef.current.offsetHeight / 2
            setChatPosition({ x: newX, y: newY })
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    return (
        <QueryClientProvider client={queryClient}>
            <div
                className="relative"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            >
                <div
                    ref={chatRef}
                    onMouseDown={handleMouseDown}
                    style={{
                        position: 'fixed',
                        bottom: 20,
                        right: 20,
                        transform: `translate(${chatPosition.x}px, ${chatPosition.y}px)`,
                        zIndex: 9999,
                    }}
                    className={cn(
                        "transition-transform duration-300 ease-in-out",
                        isDragging && "cursor-grabbing"
                    )}
                >
                    <FloatingChat
                        initialConversationId="example-conversation-id"
                        initialMessageId="example-message-id"
                    />
                    <div
                        className="absolute top-2 left-2 cursor-grab p-1 rounded hover:bg-gray-100"
                        onMouseDown={handleMouseDown}
                    >
                        <GripVertical size={16} />
                    </div>
                </div>
                {children}
            </div>
        </QueryClientProvider>
    )
}
