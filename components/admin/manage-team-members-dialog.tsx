'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Team } from '@/types/team'
import { User } from '@/types/user'
import { toast } from '@/components/ui/use-toast'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface ManageTeamMembersDialogProps {
  team: Team;
  onClose: () => void;
  onUpdateTeam: (updatedTeam: Team) => void;
}

export function ManageTeamMembersDialog({ team, onClose, onUpdateTeam }: ManageTeamMembersDialogProps) {
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedMembers, setSelectedMembers] = useState<string[]>(team.members?.map(member => member.id) || [])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const usersRef = collection(db, 'users')
      const querySnapshot = await getDocs(usersRef)
      const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User))
      setAllUsers(usersData)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const updatedTeam = {
        ...team,
        members: selectedMembers.map(memberId => doc(db, 'users', memberId))
      }
      await onUpdateTeam(updatedTeam)
      toast({
        title: 'Success',
        description: 'Team members updated successfully',
      })
      onClose()
    } catch (error) {
      console.error('Error updating team members:', error)
      toast({
        title: 'Error',
        description: 'Failed to update team members',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleMember = (userId: string) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Manage Team Members</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="max-h-[300px] overflow-y-auto">
            {allUsers.map(user => (
              <div key={user.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`user-${user.id}`}
                  checked={selectedMembers.includes(user.id)}
                  onCheckedChange={() => toggleMember(user.id)}
                />
                <Label htmlFor={`user-${user.id}`}>{user.name}</Label>
              </div>
            ))}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Team Members'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

