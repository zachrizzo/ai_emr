'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Provider, Location } from '@/types'

interface EditProviderDialogProps {
    isOpen: boolean
    onClose: () => void
    onUpdateProvider: (provider: Provider) => void
    provider: Provider
    locations: Location[]
}

export function EditProviderDialog({ isOpen, onClose, onUpdateProvider, provider, locations }: EditProviderDialogProps) {
    const [editedProvider, setEditedProvider] = useState<Provider>(provider)

    useEffect(() => {
        setEditedProvider(provider)
    }, [provider])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const providerToUpdate = {
            ...editedProvider,
            location_id: editedProvider.location_id === 'none' ? undefined : editedProvider.location_id
        }
        onUpdateProvider(providerToUpdate)
        onClose()
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Provider</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="first_name">First Name</Label>
                        <Input
                            id="first_name"
                            value={editedProvider.first_name}
                            onChange={(e) => setEditedProvider({ ...editedProvider, first_name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input
                            id="last_name"
                            value={editedProvider.last_name}
                            onChange={(e) => setEditedProvider({ ...editedProvider, last_name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="specialty">Specialty</Label>
                        <Input
                            id="specialty"
                            value={editedProvider.specialty}
                            onChange={(e) => setEditedProvider({ ...editedProvider, specialty: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="phone_number">Phone Number</Label>
                        <Input
                            id="phone_number"
                            value={editedProvider.phone_number}
                            onChange={(e) => setEditedProvider({ ...editedProvider, phone_number: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={editedProvider.email}
                            onChange={(e) => setEditedProvider({ ...editedProvider, email: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="location">Location</Label>
                        <Select
                            value={editedProvider.location_id || 'none'}
                            onValueChange={(value) => setEditedProvider({ ...editedProvider, location_id: value })}
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
                            value={editedProvider.status}
                            onValueChange={(value: "Active" | "Inactive") => setEditedProvider({ ...editedProvider, status: value })}
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
                    <Button type="submit">Update Provider</Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
