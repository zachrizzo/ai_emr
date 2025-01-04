'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import { Role } from '@/types/role'

interface CreateUserProps {
  onSuccess: () => void;
  organizationId: string | null;
  roles: Role[];
}

export function CreateUser({ onSuccess, organizationId, roles }: CreateUserProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    roles: [] as string[],
    phone_number: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!organizationId) {
      toast({
        title: 'Error',
        description: 'No organization selected',
        variant: 'destructive'
      })
      return
    }

    try {
      // Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newUser.email,
        password: 'temporaryPassword123!', // You should generate a random password or let the user set it
      })

      if (authError) throw authError

      if (authData.user) {
        // Create the user profile in the users table
        const { data: userData, error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: authData.user.id,
              email: newUser.email,
              full_name: newUser.full_name,
              phone_number: newUser.phone_number,
              organization_id: organizationId,
              status: 'active',
            },
          ])
          .select()

        if (profileError) throw profileError

        // Add user role
        if (newUser.roles.length > 0) {
          const { error: userRoleError } = await supabase
            .from('user_roles')
            .insert({ user_id: authData.user.id, role_id: newUser.roles[0] })

          if (userRoleError) throw userRoleError
        }

        setIsOpen(false)
        setNewUser({
          email: '',
          full_name: '',
          roles: [],
          phone_number: '',
        })

        onSuccess()
        
        toast({
          title: 'Success',
          description: 'User created successfully'
        })
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast({
        title: 'Error',
        description: 'Failed to create user',
        variant: 'destructive'
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>Create User</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={newUser.full_name}
              onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              value={newUser.phone_number}
              onChange={(e) => setNewUser({ ...newUser, phone_number: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="roles">Roles</Label>
            <Select
              value={newUser.roles[0] || ''}
              onValueChange={(value) => setNewUser({ ...newUser, roles: value ? [value] : [] })}
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
          <Button type="submit">Create User</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

