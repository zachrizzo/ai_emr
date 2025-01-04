import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Immunization } from '@/types'

interface EditImmunizationDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpdateImmunization: (immunization: Immunization) => void
  immunizations: Immunization[]
  patientId: string
}

export function EditImmunizationDialog({
  isOpen,
  onClose,
  onUpdateImmunization,
  immunizations,
  patientId
}: EditImmunizationDialogProps) {
  const [editingImmunization, setEditingImmunization] = useState<Immunization | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingImmunization) {
      onUpdateImmunization({
        ...editingImmunization,
        patient_id: patientId
      })
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Immunization</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="vaccine_name">Vaccine Name</Label>
              <Input
                id="vaccine_name"
                value={editingImmunization?.vaccine_name || ''}
                onChange={(e) => setEditingImmunization(prev => ({ ...prev!, vaccine_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="date_administered">Date Administered</Label>
              <Input
                id="date_administered"
                type="date"
                value={editingImmunization?.date_administered || ''}
                onChange={(e) => setEditingImmunization(prev => ({ ...prev!, date_administered: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="provider">Provider</Label>
              <Input
                id="provider"
                value={editingImmunization?.provider || ''}
                onChange={(e) => setEditingImmunization(prev => ({ ...prev!, provider: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={editingImmunization?.notes || ''}
                onChange={(e) => setEditingImmunization(prev => ({ ...prev!, notes: e.target.value }))}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

