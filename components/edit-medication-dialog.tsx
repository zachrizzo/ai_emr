import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Medication } from '@/types'

interface EditMedicationDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpdateMedication: (medication: Medication) => void
  medications: Medication[]
  patientId: string
}

export function EditMedicationDialog({
  isOpen,
  onClose,
  onUpdateMedication,
  medications,
  patientId
}: EditMedicationDialogProps) {
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingMedication) {
      onUpdateMedication({
        ...editingMedication,
        patient_id: patientId
      })
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Medication</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="medication_name">Medication Name</Label>
              <Input
                id="medication_name"
                value={editingMedication?.medication_name || ''}
                onChange={(e) => setEditingMedication(prev => ({ ...prev!, medication_name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="dosage">Dosage</Label>
              <Input
                id="dosage"
                value={editingMedication?.dosage || ''}
                onChange={(e) => setEditingMedication(prev => ({ ...prev!, dosage: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="frequency">Frequency</Label>
              <Input
                id="frequency"
                value={editingMedication?.frequency || ''}
                onChange={(e) => setEditingMedication(prev => ({ ...prev!, frequency: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={editingMedication?.start_date || ''}
                onChange={(e) => setEditingMedication(prev => ({ ...prev!, start_date: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={editingMedication?.end_date || ''}
                onChange={(e) => setEditingMedication(prev => ({ ...prev!, end_date: e.target.value }))}
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

