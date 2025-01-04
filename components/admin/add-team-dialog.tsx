'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Team } from '@/types/team'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface AddTeamDialogProps {
  onAddTeam: (newTeam: Omit<Team, 'id' | 'created_at' | 'last_update'>) => void
}

export function AddTeamDialog({ onAddTeam }: AddTeamDialogProps) {
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'inactive',
    tags: [] as string[],
    meeting_schedule: '',
    leader: '',
    members: [] as string[],
    organization_id: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddTeam(newTeam)
    setNewTeam({
      name: '',
      description: '',
      status: 'active',
      tags: [],
      meeting_schedule: '',
      leader: '',
      members: [],
      organization_id: ''
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Team</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Team</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Team Name</Label>
            <Input
              id="name"
              value={newTeam.name}
              onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={newTeam.description}
              onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={newTeam.status}
              onValueChange={(value) => setNewTeam({ ...newTeam, status: value as 'active' | 'inactive' })}
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
              value={newTeam.meeting_schedule}
              onChange={(e) => setNewTeam({ ...newTeam, meeting_schedule: e.target.value })}
            />
          </div>
          <Button type="submit">Add Team</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

