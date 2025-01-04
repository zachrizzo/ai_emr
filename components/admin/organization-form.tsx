'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Organization } from '@/types/organization'

interface OrganizationFormProps {
  initialOrganization?: Organization
  onSubmit: (organization: Omit<Organization, 'id' | 'created_at' | 'updated_at'>) => void
  onCancel: () => void
}

export function OrganizationForm({ initialOrganization, onSubmit, onCancel }: OrganizationFormProps) {
  const [organization, setOrganization] = useState<Omit<Organization, 'id' | 'created_at' | 'updated_at'>>(
    initialOrganization || {
      name: '',
      address: '',
      phone_number: '',
      email: '',
      website: '',
      status: 'active'
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(organization)
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialOrganization ? 'Edit' : 'Create'} Organization</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={organization.name}
              onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={organization.address}
              onChange={(e) => setOrganization({ ...organization, address: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              value={organization.phone_number}
              onChange={(e) => setOrganization({ ...organization, phone_number: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={organization.email}
              onChange={(e) => setOrganization({ ...organization, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={organization.website}
              onChange={(e) => setOrganization({ ...organization, website: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={organization.status} onValueChange={value => setOrganization({ ...organization, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

