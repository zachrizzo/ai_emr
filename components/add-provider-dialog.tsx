'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Provider, Location } from '@/types'

interface AddProviderDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddProvider: (provider: Omit<Provider, 'id'>) => void
  locations: Location[]
  organizationId: string
}

export function AddProviderDialog({ isOpen, onClose, onAddProvider, locations, organizationId }: AddProviderDialogProps) {
  const [newProvider, setNewProvider] = useState<Omit<Provider, 'id'>>({
    first_name: '',
    last_name: '',
    specialty: '',
    phone_number: '',
    email: '',
    location_id: '',
    status: 'Active',
    organization_id: organizationId
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const providerToAdd = {
      ...newProvider,
      location_id: newProvider.location_id === 'none' ? undefined : newProvider.location_id
    }
    onAddProvider(providerToAdd)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Provider</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              value={newProvider.first_name}
              onChange={(e) => setNewProvider({ ...newProvider, first_name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              value={newProvider.last_name}
              onChange={(e) => setNewProvider({ ...newProvider, last_name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="specialty">Specialty</Label>
            <Input
              id="specialty"
              value={newProvider.specialty}
              onChange={(e) => setNewProvider({ ...newProvider, specialty: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              value={newProvider.phone_number}
              onChange={(e) => setNewProvider({ ...newProvider, phone_number: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={newProvider.email}
              onChange={(e) => setNewProvider({ ...newProvider, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Select
              value={newProvider.location_id}
              onValueChange={(value) => setNewProvider({ ...newProvider, location_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No location</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select
              value={newProvider.status}
              onValueChange={(value: "Active" | "Inactive") => setNewProvider({ ...newProvider, status: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit">Add Provider</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

