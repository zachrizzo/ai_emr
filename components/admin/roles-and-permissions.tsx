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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlusCircle, Search, Edit, Trash2 } from 'lucide-react'
import { supabase } from '@/utils/supabase-config'

interface GroupedPermissions {
  [category: string]: Permission[];
}

export function RolesAndPermissions({ organizationId }: { organizationId: string }) {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<GroupedPermissions>({})
  const [newRoleName, setNewRoleName] = useState('')
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [permissionSearchTerm, setPermissionSearchTerm] = useState('')

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

      const groupedPermissions: GroupedPermissions = {}
      data.forEach((permission: Permission) => {
        const parts = permission.name.split('_')
        // Get the category (last part)
        const category = parts[parts.length - 1]
        // Get the action (all parts except the last one)
        const action = parts.slice(0, -1).join(' ')

        if (!groupedPermissions[category]) {
          groupedPermissions[category] = []
        }
        groupedPermissions[category].push({
          ...permission,
          displayName: `${action} ${category}`, // For display purposes
          name: permission.name, // Keep original name for value
          category: category
        })
      })
      setPermissions(groupedPermissions)
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

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredPermissions = Object.entries(permissions).reduce((acc, [category, perms]) => {
    const filtered = perms.filter(permission =>
      permission.name.toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
      category.toLowerCase().includes(permissionSearchTerm.toLowerCase())
    )
    if (filtered.length > 0) {
      acc[category] = filtered
    }
    return acc
  }, {} as GroupedPermissions)

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Roles and Permissions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-64">
            <Input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Role
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Role</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Role Name
                  </Label>
                  <Input
                    id="name"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    className="col-span-3"
                  />
                </div>
              </div>
              <Button onClick={handleAddRole}>Add Role</Button>
            </DialogContent>
          </Dialog>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoles.map((role) => (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell>
                  {role.permissions?.length || 0} permissions assigned
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => setEditingRole(role)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteRole(role.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      {editingRole && (
        <Dialog open={true} onOpenChange={() => setEditingRole(null)}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Role: {editingRole.name}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="roleName" className="text-right">
                  Role Name
                </Label>
                <Input
                  id="roleName"
                  value={editingRole.name}
                  onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid gap-2">
                <Label className="mb-2">Permissions</Label>
                <Input
                  type="text"
                  placeholder="Search permissions..."
                  value={permissionSearchTerm}
                  onChange={(e) => setPermissionSearchTerm(e.target.value)}
                  className="mb-2"
                />
                <div className="space-y-4 max-h-[40vh] overflow-y-auto">
                  {Object.entries(filteredPermissions).map(([category, categoryPermissions]) => (
                    <div key={category}>
                      <h3 className="font-semibold mb-2 capitalize">{category}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {categoryPermissions.map((permission) => (
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
                            <Label htmlFor={`permission-${permission.id}`} className="text-sm capitalize">
                              {permission.displayName}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Button onClick={() => handleUpdateRole(editingRole)}>Update Role</Button>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  )
}

