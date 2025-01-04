'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Location } from '@/types'

interface EditLocationDialogProps {
    isOpen: boolean
    onClose: () => void
    onUpdateLocation: (location: Location) => void
    location: Location
}

export function EditLocationDialog({ isOpen, onClose, onUpdateLocation, location }: EditLocationDialogProps) {
    const [editedLocation, setEditedLocation] = useState<Location>(location)

    useEffect(() => {
        setEditedLocation(location)
    }, [location])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onUpdateLocation(editedLocation)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Location</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={editedLocation.name}
                            onChange={(e) => setEditedLocation({ ...editedLocation, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                            id="address"
                            value={editedLocation.address}
                            onChange={(e) => setEditedLocation({ ...editedLocation, address: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="phone_number">Phone Number</Label>
                        <Input
                            id="phone_number"
                            value={editedLocation.phone_number}
                            onChange={(e) => setEditedLocation({ ...editedLocation, phone_number: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={editedLocation.email}
                            onChange={(e) => setEditedLocation({ ...editedLocation, email: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="status">Status</Label>
                        <Select
                            value={editedLocation.status}
                            onValueChange={(value: "Active" | "Inactive") => setEditedLocation({ ...editedLocation, status: value })}
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
                    <Button type="submit">Update Location</Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
