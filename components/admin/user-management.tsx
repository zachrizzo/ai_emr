'use client'

import { useState, useEffect, useCallback } from 'react'
import { User } from '@/types/user'
import { Role } from '@/types/role'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { toast } from '@/components/ui/use-toast'
import { CreateUser } from './create-user'
import { EditUserDialog } from './edit-user-dialog'
import { supabase } from '@/utils/supabase-config'

export function UserManagement({ organizationId }: { organizationId: string | null }) {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [roleFilter, setRoleFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const fetchUsers = useCallback(async () => {
    if (!organizationId) {
      console.warn("No organization ID provided")
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .eq('organization_id', organizationId)

      if (usersError) throw usersError

      const { data: userRolesData, error: userRolesError } = await supabase
        .from('user_roles')
        .select('user_id, roles(*)')

      if (userRolesError) throw userRolesError

      const usersWithRoles = usersData.map(user => ({
        ...user,
        roles: userRolesData
          .filter(ur => ur.user_id === user.id)
          .map(ur => ur.roles)
      }))

      setUsers(usersWithRoles)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [organizationId])

  const fetchRoles = useCallback(async () => {
    if (!organizationId) {
      console.warn("No organization ID provided")
      return
    }

    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('organization_id', organizationId)

      if (error) throw error

      setRoles(data || [])
    } catch (error) {
      console.error('Error fetching roles:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch roles',
        variant: 'destructive'
      })
    }
  }, [organizationId])

  useEffect(() => {
    if (organizationId) {
      fetchUsers()
      fetchRoles()
    }
  }, [organizationId, fetchUsers, fetchRoles])

  const filteredUsers = users.filter(user => {
    const fullName = user.full_name?.toLowerCase() ?? '';
    const email = user.email?.toLowerCase() ?? '';
    const userRoles = user.roles?.map(role => role.name.toLowerCase()) ?? [];

    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
      email.includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || userRoles.includes(roleFilter.toLowerCase());
    return matchesSearch && matchesRole;
  });

  const handleSelectUser = (uid: string) => {
    setSelectedUsers(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    )
  }

  const handleSelectAll = () => {
    setSelectedUsers(selectedUsers.length === filteredUsers.length ? [] : filteredUsers.map(user => user.id))
  }

  const handleBulkAction = async (action: 'enable' | 'disable' | 'delete') => {
    try {
      for (const uid of selectedUsers) {
        if (action === 'delete') {
          await supabase.from('users').delete().eq('id', uid)
        } else {
          await supabase
            .from('users')
            .update({ status: action === 'enable' ? 'active' : 'inactive' })
            .eq('id', uid)
        }
      }

      await fetchUsers()
      setSelectedUsers([])
      toast({
        title: 'Success',
        description: `Successfully ${action}d selected users`,
      })
    } catch (error) {
      console.error(`Error performing bulk action ${action}:`, error)
      toast({
        title: 'Error',
        description: `Failed to ${action} users`,
        variant: 'destructive'
      })
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
  }

  const handleUpdateUser = async (updatedUser: User) => {
    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: updatedUser.full_name,
          email: updatedUser.email,
          phone_number: updatedUser.phone_number,
        })
        .eq('id', updatedUser.id)

      if (updateError) throw updateError

      // Update user roles
      const { error: deleteRolesError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', updatedUser.id)

      if (deleteRolesError) throw deleteRolesError

      if (updatedUser.roles && updatedUser.roles.length > 0) {
        const newUserRoles = updatedUser.roles.map(role => ({
          user_id: updatedUser.id,
          role_id: role.id
        }))

        const { error: insertRolesError } = await supabase
          .from('user_roles')
          .insert(newUserRoles)

        if (insertRolesError) throw insertRolesError
      }

      await fetchUsers()
      setEditingUser(null)
      toast({
        title: 'Success',
        description: 'User updated successfully'
      })
    } catch (error) {
      console.error('Error updating user:', error)
      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive'
      })
    }
  }

  if (isLoading) return <div>Loading users...</div>

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[300px]"
            />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.name}>{role.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <CreateUser onSuccess={fetchUsers} organizationId={organizationId} roles={roles} />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => handleBulkAction('enable')}
              disabled={selectedUsers.length === 0}
              variant="secondary"
            >
              Enable
            </Button>
            <Button
              onClick={() => handleBulkAction('disable')}
              disabled={selectedUsers.length === 0}
              variant="secondary"
            >
              Disable
            </Button>
            <Button
              onClick={() => handleBulkAction('delete')}
              disabled={selectedUsers.length === 0}
              variant="destructive"
            >
              Delete
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onCheckedChange={() => handleSelectUser(user.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user.full_name ? user.full_name.split(' ').map(n => n[0]).join('') : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.full_name || 'No Name'}</span>
                        <span className="text-sm text-muted-foreground">{user.email || 'No Email'}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.roles?.map(role => role.name).join(', ') || 'No Roles'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {user.status || 'Unknown'}
                    </span>
                  </TableCell>
                  <TableCell>{user.last_sign_in_at || 'Never'}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleEditUser(user)}>Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {editingUser && (
        <EditUserDialog
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdate={handleUpdateUser}
          roles={roles}
        />
      )}
    </>
  )
}

