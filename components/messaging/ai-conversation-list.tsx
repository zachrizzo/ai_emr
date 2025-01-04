'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Pencil, Trash2 } from 'lucide-react'

interface AIConversation {
  id: string
  name: string
}

interface AIConversationListProps {
  conversations: AIConversation[]
  onSelectConversation: (conversation: AIConversation) => void
  onAddConversation: (name: string) => void
  onDeleteConversation: (id: string) => void
  onEditConversation: (id: string, newName: string) => void
}

export function AIConversationList({
  conversations,
  onSelectConversation,
  onAddConversation,
  onDeleteConversation,
  onEditConversation
}: AIConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [newConversationName, setNewConversationName] = useState('')
  const [editingConversation, setEditingConversation] = useState<AIConversation | null>(null)

  const filteredConversations = conversations.filter(conversation =>
    conversation.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleAddConversation = () => {
    if (newConversationName.trim()) {
      onAddConversation(newConversationName.trim())
      setNewConversationName('')
    }
  }

  const handleEditConversation = () => {
    if (editingConversation && editingConversation.name.trim()) {
      onEditConversation(editingConversation.id, editingConversation.name.trim())
      setEditingConversation(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <Input
          placeholder="Search AI conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-2"
        />
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full">New AI Conversation</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New AI Conversation</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={newConversationName}
                  onChange={(e) => setNewConversationName(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <Button onClick={handleAddConversation}>Create</Button>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.map(conversation => (
          <div key={conversation.id} className="flex items-center justify-between p-2 hover:bg-gray-100">
            <Button
              variant="ghost"
              className="w-full justify-start text-left"
              onClick={() => onSelectConversation(conversation)}
            >
              {conversation.name}
            </Button>
            <div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit AI Conversation</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="edit-name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="edit-name"
                        value={editingConversation?.name || ''}
                        onChange={(e) => setEditingConversation(prev => prev ? {...prev, name: e.target.value} : null)}
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <Button onClick={handleEditConversation}>Save</Button>
                </DialogContent>
              </Dialog>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteConversation(conversation.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

