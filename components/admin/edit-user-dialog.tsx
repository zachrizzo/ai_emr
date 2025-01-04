import { useState, useEffect } from 'react'
import { User } from '@/types/user'
import { Role } from '@/types/role'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface EditUserDialogProps {
  user: User
  onClose: () => void
  onUpdate: (updatedUser: User) => void
  roles: Role[]
}

export function EditUserDialog({ user, onClose, onUpdate, roles }: EditUserDialogProps) {
  const [editedUser, setEditedUser] = useState<User>({
    ...user,
    roles: user.roles || []
  })

  useEffect(() => {
    setEditedUser({
      ...user,
      roles: user.roles || []
    })
  }, [user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(editedUser)
  }

  const handleRoleChange = (value: string) => {
    const selectedRole = roles.find(role => role.id === value)
    if (selectedRole) {
      setEditedUser(prevUser => ({
        ...prevUser,
        roles: [selectedRole]
      }))
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={editedUser.full_name || ''}
              onChange={(e) => setEditedUser(prevUser => ({ ...prevUser, full_name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={editedUser.email || ''}
              onChange={(e) => setEditedUser(prevUser => ({ ...prevUser, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              value={editedUser.phone_number || ''}
              onChange={(e) => setEditedUser(prevUser => ({ ...prevUser, phone_number: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="roles">Roles</Label>
            <Select
              value={editedUser.roles[0]?.id || ''}
              onValueChange={handleRoleChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit">Update User</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

