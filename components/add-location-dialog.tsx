import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Location } from '@/types'

interface AddLocationDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddLocation: (location: Omit<Location, 'id' | 'created_at' | 'updated_at'>) => void
}

export function AddLocationDialog({ isOpen, onClose, onAddLocation }: AddLocationDialogProps) {
  const [newLocation, setNewLocation] = useState<Omit<Location, 'id' | 'created_at' | 'updated_at'>>({
    name: '',
    address: '',
    phone_number: '',
    email: '',
    notes: '',
    latitude: null,
    longitude: null,
    status: 'Active',
    manager_name: '',
    operating_hours: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddLocation(newLocation)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Location</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={newLocation.name}
              onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={newLocation.address}
              onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              value={newLocation.phone_number}
              onChange={(e) => setNewLocation({ ...newLocation, phone_number: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={newLocation.email}
              onChange={(e) => setNewLocation({ ...newLocation, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="manager_name">Manager Name</Label>
            <Input
              id="manager_name"
              value={newLocation.manager_name}
              onChange={(e) => setNewLocation({ ...newLocation, manager_name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="operating_hours">Operating Hours</Label>
            <Textarea
              id="operating_hours"
              value={newLocation.operating_hours}
              onChange={(e) => setNewLocation({ ...newLocation, operating_hours: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={newLocation.notes}
              onChange={(e) => setNewLocation({ ...newLocation, notes: e.target.value })}
            />
          </div>
          <Button type="submit">Add Location</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

