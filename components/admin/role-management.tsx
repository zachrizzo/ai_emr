'use client'

import { useState, useEffect } from 'react'
import { Role } from '@/types/role'
import { Permission } from '@/types/permission'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/lib/supabase'

export function RoleManagement({ organizationId }: { organizationId: string }) {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [newRoleName, setNewRoleName] = useState('')
  const [editingRole, setEditingRole] = useState<Role | null>(null)

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
  }, [organizationId])

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*, role_permissions(permission_id)')
        .eq('organization_id', organizationId)
      if (error) throw error
      setRoles(data.map(role => ({
        ...role,
        permissions: role.role_permissions.map((rp: any) => rp.permission_id)
      })))
    } catch (error) {
      console.error('Error fetching roles:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch roles',
        variant: 'destructive'
      })
    }
  }

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
      if (error) throw error
      setPermissions(data)
    } catch (error) {
      console.error('Error fetching permissions:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch permissions',
        variant: 'destructive'
      })
    }
  }

  const handleAddRole = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .insert([
          { name: newRoleName, organization_id: organizationId }
        ])
        .select()
      if (error) throw error
      setRoles([...roles, data[0]])
      setNewRoleName('')
      toast({
        title: 'Success',
        description: 'Role added successfully'
      })
    } catch (error) {
      console.error('Error adding role:', error)
      toast({
        title: 'Error',
        description: 'Failed to add role',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateRole = async (updatedRole: Role) => {
    try {
      const { error } = await supabase
        .from('roles')
        .update({ name: updatedRole.name })
        .eq('id', updatedRole.id)
      if (error) throw error

      // Update role permissions
      await supabase
        .from('role_permissions')
        .delete()
        .eq('role_id', updatedRole.id)

      if (updatedRole.permissions && updatedRole.permissions.length > 0) {
        const rolePermissions = updatedRole.permissions.map(permissionId => ({
          role_id: updatedRole.id,
          permission_id: permissionId
        }))

        const { error: insertError } = await supabase
          .from('role_permissions')
          .insert(rolePermissions)

        if (insertError) throw insertError
      }

      setRoles(roles.map(role => role.id === updatedRole.id ? updatedRole : role))
      setEditingRole(null)
      toast({
        title: 'Success',
        description: 'Role updated successfully'
      })
    } catch (error) {
      console.error('Error updating role:', error)
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', roleId)
      if (error) throw error
      setRoles(roles.filter(role => role.id !== roleId))
      toast({
        title: 'Success',
        description: 'Role deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting role:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete role',
        variant: 'destructive'
      })
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Role Management</h2>
      <div className="mb-4">
        <Input
          placeholder="New role name"
          value={newRoleName}
          onChange={(e) => setNewRoleName(e.target.value)}
          className="mr-2"
        />
        <Button onClick={handleAddRole}>Add Role</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role Name</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((role) => (
            <TableRow key={role.id}>
              <TableCell>{role.name}</TableCell>
              <TableCell>
                <Button onClick={() => setEditingRole(role)} className="mr-2">Edit</Button>
                <Button onClick={() => handleDeleteRole(role.id)} variant="destructive">Delete</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {editingRole && (
        <Dialog open={true} onOpenChange={() => setEditingRole(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Role: {editingRole.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="roleName">Role Name</Label>
                <Input
                  id="roleName"
                  value={editingRole.name}
                  onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Permissions</Label>
                {permissions.map((permission) => (
                  <div key={permission.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`permission-${permission.id}`}
                      checked={editingRole.permissions?.includes(permission.id)}
                      onCheckedChange={(checked) => {
                        const updatedPermissions = checked
                          ? [...(editingRole.permissions || []), permission.id]
                          : editingRole.permissions?.filter(id => id !== permission.id) || []
                        setEditingRole({ ...editingRole, permissions: updatedPermissions })
                      }}
                    />
                    <Label htmlFor={`permission-${permission.id}`}>{permission.name}</Label>
                  </div>
                ))}
              </div>
              <Button onClick={() => handleUpdateRole(editingRole)}>Update Role</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

