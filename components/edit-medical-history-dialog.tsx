import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { MedicalHistory } from '@/types'

interface EditMedicalHistoryDialogProps {
  isOpen: boolean
  onClose: () => void
  onUpdateMedicalHistory: (medicalHistory: MedicalHistory) => void
  onAddMedicalHistory: (medicalHistory: Omit<MedicalHistory, 'id'>) => void
  medicalHistory: MedicalHistory[]
  patientId: string
}

export function EditMedicalHistoryDialog({
  isOpen,
  onClose,
  onUpdateMedicalHistory,
  onAddMedicalHistory,
  medicalHistory,
  patientId
}: EditMedicalHistoryDialogProps) {
  const [editingHistory, setEditingHistory] = useState<MedicalHistory | null>(null)

  useEffect(() => {
    if (isOpen && !editingHistory) {
      setEditingHistory({
        patient_id: patientId,
        condition_name: '',
        condition_type: '',
        severity: '',
        onset_date: '',
        resolution_date: null,
        is_active: true,
        family_member: null,
        notes: '',
        date_recorded: new Date().toISOString().split('T')[0]
      })
    }
  }, [isOpen, patientId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingHistory) {
      if ('id' in editingHistory) {
        onUpdateMedicalHistory(editingHistory as MedicalHistory)
      } else {
        onAddMedicalHistory(editingHistory)
      }
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingHistory?.id ? 'Edit' : 'Add'} Medical History</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="condition_name">Condition Name</Label>
            <Input
              id="condition_name"
              value={editingHistory?.condition_name || ''}
              onChange={(e) => setEditingHistory(prev => ({ ...prev!, condition_name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="condition_type">Condition Type</Label>
            <Select
              value={editingHistory?.condition_type || ''}
              onValueChange={(value) => setEditingHistory(prev => ({ ...prev!, condition_type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select condition type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Chronic">Chronic</SelectItem>
                <SelectItem value="Acute">Acute</SelectItem>
                <SelectItem value="Surgery">Surgery</SelectItem>
                <SelectItem value="Family History">Family History</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="severity">Severity</Label>
            <Select
              value={editingHistory?.severity || ''}
              onValueChange={(value) => setEditingHistory(prev => ({ ...prev!, severity: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mild">Mild</SelectItem>
                <SelectItem value="Moderate">Moderate</SelectItem>
                <SelectItem value="Severe">Severe</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="onset_date">Onset Date</Label>
            <Input
              id="onset_date"
              type="date"
              value={editingHistory?.onset_date || ''}
              onChange={(e) => setEditingHistory(prev => ({ ...prev!, onset_date: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="resolution_date">Resolution Date</Label>
            <Input
              id="resolution_date"
              type="date"
              value={editingHistory?.resolution_date || ''}
              onChange={(e) => setEditingHistory(prev => ({ ...prev!, resolution_date: e.target.value }))}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_active"
              checked={editingHistory?.is_active || false}
              onCheckedChange={(checked) => setEditingHistory(prev => ({ ...prev!, is_active: checked as boolean }))}
            />
            <Label htmlFor="is_active">Is Active</Label>
          </div>
          <div>
            <Label htmlFor="family_member">Family Member (if applicable)</Label>
            <Input
              id="family_member"
              value={editingHistory?.family_member || ''}
              onChange={(e) => setEditingHistory(prev => ({ ...prev!, family_member: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={editingHistory?.notes || ''}
              onChange={(e) => setEditingHistory(prev => ({ ...prev!, notes: e.target.value }))}
            />
          </div>
          <Button type="submit">{editingHistory?.id ? 'Update' : 'Add'} Medical History</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

