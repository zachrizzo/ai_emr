'use client'

import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FloatingChatProps {
  initialConversationId?: string
  initialMessageId?: string
}

export function FloatingChat({
  initialConversationId,
  initialMessageId,
}: FloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      ) : (
        <div className="w-96 h-[600px] bg-background border rounded-lg shadow-lg flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Chat</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-secondary rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {/* Chat messages will go here */}
          </div>
          <div className="p-4 border-t">
            <textarea
              placeholder="Type a message..."
              className="w-full p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

