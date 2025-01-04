'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Team } from '@/types/team'

interface EditTeamDialogProps {
  team: Team;
  onClose: () => void;
  onUpdateTeam: (updatedTeam: Team) => void;
}

export function EditTeamDialog({ team, onClose, onUpdateTeam }: EditTeamDialogProps) {
  const [editedTeam, setEditedTeam] = useState<Team>(team)

  useEffect(() => {
    setEditedTeam(team)
  }, [team])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdateTeam(editedTeam)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Team</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Team Name</Label>
            <Input
              id="name"
              value={editedTeam.name}
              onChange={(e) => setEditedTeam({ ...editedTeam, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={editedTeam.description}
              onChange={(e) => setEditedTeam({ ...editedTeam, description: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={editedTeam.status}
              onValueChange={(value) => setEditedTeam({ ...editedTeam, status: value as 'active' | 'inactive' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="meetingSchedule">Meeting Schedule (optional)</Label>
            <Input
              id="meetingSchedule"
              value={editedTeam.meetingSchedule || ''}
              onChange={(e) => setEditedTeam({ ...editedTeam, meetingSchedule: e.target.value })}
            />
          </div>
          <Button type="submit">Update Team</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

