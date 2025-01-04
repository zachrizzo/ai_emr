'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface Permission {
  id: string
  name: string
}

interface Role {
  id: string
  name: string
  permissions: string[]
}

const mockPermissions: Permission[] = [
  { id: '1', name: 'View Patients' },
  { id: '2', name: 'Edit Patients' },
  { id: '3', name: 'View Appointments' },
  { id: '4', name: 'Edit Appointments' },
  { id: '5', name: 'View Billing' },
  { id: '6', name: 'Edit Billing' },
]

const mockRoles: Role[] = [
  { id: '1', name: 'Admin', permissions: ['1', '2', '3', '4', '5', '6'] },
  { id: '2', name: 'Doctor', permissions: ['1', '2', '3', '4'] },
  { id: '3', name: 'Nurse', permissions: ['1', '3'] },
  { id: '4', name: 'Receptionist', permissions: ['1', '3', '5'] },
]

export function PermissionManagement() {
  const [roles, setRoles] = useState<Role[]>(mockRoles)
  const [newRole, setNewRole] = useState({ name: '', permissions: [] as string[] })

  const handlePermissionChange = (roleId: string, permissionId: string) => {
    setRoles(roles.map(role => {
      if (role.id === roleId) {
        const updatedPermissions = role.permissions.includes(permissionId)
          ? role.permissions.filter(id => id !== permissionId)
          : [...role.permissions, permissionId]
        return { ...role, permissions: updatedPermissions }
      }
      return role
    }))
  }

  const handleAddRole = () => {
    if (newRole.name) {
      setRoles([...roles, { id: (roles.length + 1).toString(), ...newRole }])
      setNewRole({ name: '', permissions: [] })
    }
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role</TableHead>
            {mockPermissions.map(permission => (
              <TableHead key={permission.id}>{permission.name}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map(role => (
            <TableRow key={role.id}>
              <TableCell>{role.name}</TableCell>
              {mockPermissions.map(permission => (
                <TableCell key={permission.id}>
                  <Checkbox
                    checked={role.permissions.includes(permission.id)}
                    onCheckedChange={() => handlePermissionChange(role.id, permission.id)}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Dialog>
        <DialogTrigger asChild>
          <Button className="mt-4">Add New Role</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Role</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roleName" className="text-right">
                Role Name
              </Label>
              <Input
                id="roleName"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            {mockPermissions.map(permission => (
              <div key={permission.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`permission-${permission.id}`}
                  checked={newRole.permissions.includes(permission.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setNewRole({ ...newRole, permissions: [...newRole.permissions, permission.id] })
                    } else {
                      setNewRole({ ...newRole, permissions: newRole.permissions.filter(id => id !== permission.id) })
                    }
                  }}
                />
                <Label htmlFor={`permission-${permission.id}`}>{permission.name}</Label>
              </div>
            ))}
          </div>
          <Button onClick={handleAddRole}>Add Role</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

