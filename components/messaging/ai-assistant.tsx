'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Bot, Send } from 'lucide-react'
import { AIConversationList } from './ai-conversation-list'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/utils/supabase-config'

interface AIConversation {
  id: string
  name: string
  patientId?: string
  messages: { role: 'user' | 'assistant'; content: string }[]
}

export function AIAssistant() {
  const [conversations, setConversations] = useState<AIConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<AIConversation | null>(null)
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleAddConversation = async (name: string, patientId?: string) => {
    try {
      const newConversation: AIConversation = {
        id: Date.now().toString(),
        name,
        patientId,
        messages: []
      }

      const { data, error } = await supabase
        .from('conversations')
        .insert([{
          id: newConversation.id,
          name: newConversation.name,
          patient_id: patientId
        }])
        .select()

      if (error) throw error

      setConversations([...conversations, newConversation])
      setSelectedConversation(newConversation)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create conversation',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteConversation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', id)

      if (error) throw error

      setConversations(conversations.filter(c => c.id !== id))
      if (selectedConversation?.id === id) {
        setSelectedConversation(null)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete conversation',
        variant: 'destructive'
      })
    }
  }

  const handleEditConversation = async (id: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update({ name: newName })
        .eq('id', id)

      if (error) throw error

      setConversations(conversations.map(c =>
        c.id === id ? { ...c, name: newName } : c
      ))
      if (selectedConversation?.id === id) {
        setSelectedConversation({ ...selectedConversation, name: newName })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update conversation',
        variant: 'destructive'
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedConversation || !query.trim()) return

    setIsLoading(true)

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          conversationId: selectedConversation.id,
          patientId: selectedConversation.patientId,
        }),
      })

      if (!response.ok) throw new Error('Failed to get AI response')

      const data = await response.json()

      const updatedConversation = {
        ...selectedConversation,
        messages: [
          ...selectedConversation.messages,
          { role: 'user' as const, content: query },
          { role: 'assistant' as const, content: data.response }
        ]
      }

      setSelectedConversation(updatedConversation)
      setConversations(conversations.map(c =>
        c.id === updatedConversation.id ? updatedConversation : c
      ))

      setQuery('')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to get AI response',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{selectedConversation.name}</h3>
              {selectedConversation.patientId && (
                <span className="text-sm text-gray-500">
                  Patient ID: {selectedConversation.patientId}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {selectedConversation.messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                      }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about patient records, appointments, or medical info..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <span className="animate-spin">⌛</span>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4">
            <Bot className="h-12 w-12" />
            <p>Select or create an AI conversation to get started.</p>
          </div>
        )}
      </div>
    </div>
  )
}

