'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Send } from 'lucide-react'
import { AIConversationList } from './ai-conversation-list'

interface AIConversation {
  id: string
  name: string
  messages: { role: 'user' | 'assistant'; content: string }[]
}

export function AIAssistant() {
  const [conversations, setConversations] = useState<AIConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<AIConversation | null>(null)
  const [query, setQuery] = useState('')

  const handleAddConversation = (name: string) => {
    const newConversation: AIConversation = {
      id: Date.now().toString(),
      name,
      messages: []
    }
    setConversations([...conversations, newConversation])
  }

  const handleDeleteConversation = (id: string) => {
    setConversations(conversations.filter(c => c.id !== id))
    if (selectedConversation?.id === id) {
      setSelectedConversation(null)
    }
  }

  const handleEditConversation = (id: string, newName: string) => {
    setConversations(conversations.map(c => 
      c.id === id ? { ...c, name: newName } : c
    ))
    if (selectedConversation?.id === id) {
      setSelectedConversation({ ...selectedConversation, name: newName })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedConversation) return

    const updatedConversation = {
      ...selectedConversation,
      messages: [
        ...selectedConversation.messages,
        { role: 'user' as const, content: query }
      ]
    }

    setSelectedConversation(updatedConversation)
    setConversations(conversations.map(c => 
      c.id === updatedConversation.id ? updatedConversation : c
    ))

    // TODO: Implement actual AI query logic
    const aiResponse = `AI response to: "${query}"`
    
    const finalConversation = {
      ...updatedConversation,
      messages: [
        ...updatedConversation.messages,
        { role: 'assistant' as const, content: aiResponse }
      ]
    }

    setSelectedConversation(finalConversation)
    setConversations(conversations.map(c => 
      c.id === finalConversation.id ? finalConversation : c
    ))

    setQuery('')
  }

  return (
    <div className="flex h-full">
      <div className="w-1/3 border-r">
        <AIConversationList
          conversations={conversations}
          onSelectConversation={setSelectedConversation}
          onAddConversation={handleAddConversation}
          onDeleteConversation={handleDeleteConversation}
          onEditConversation={handleEditConversation}
        />
      </div>
      <div className="w-2/3 p-4 flex flex-col">
        {selectedConversation ? (
          <>
            <h3 className="text-lg font-semibold mb-4">{selectedConversation.name}</h3>
            <div className="flex-1 overflow-y-auto mb-4">
              {selectedConversation.messages.map((message, index) => (
                <div key={index} className={`mb-2 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <span className={`inline-block p-2 rounded-lg ${message.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    {message.content}
                  </span>
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex items-center">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about patients or medical info..."
                className="flex-1 mr-2"
              />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select or create an AI conversation to get started.
          </div>
        )}
      </div>
    </div>
  )
}

