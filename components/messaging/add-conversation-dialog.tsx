'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Conversation } from '@/types'

interface AddConversationDialogProps {
  onAddConversation: (newConversation: Omit<Conversation, 'id' | 'created_at' | 'messages' | 'lastMessageTimestamp'>) => void
}

export function AddConversationDialog({ onAddConversation }: AddConversationDialogProps) {
  const [newConversation, setNewConversation] = useState<Omit<Conversation, 'id' | 'created_at' | 'messages' | 'lastMessageTimestamp'>>({
    participants: [],
    type: 'patient',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    onAddConversation(newConversation)

    setNewConversation({
      participants: [],
      type: 'patient',
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full mt-2">New Conversation</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Conversation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="participants">Participants (comma-separated)</Label>
            <Input
              id="participants"
              value={newConversation.participants.join(', ')}
              onChange={(e) => setNewConversation({ ...newConversation, participants: e.target.value.split(',').map(p => p.trim()) })}
              required
            />
          </div>
          <div>
            <Label htmlFor="type">Conversation Type</Label>
            <Select
              value={newConversation.type}
              onValueChange={(value) => setNewConversation({ ...newConversation, type: value as 'patient' | 'team' })}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select conversation type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patient">Patient</SelectItem>
                <SelectItem value="team">Team</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit">Create Conversation</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

