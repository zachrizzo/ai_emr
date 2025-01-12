'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DocumentTemplate } from '@/app/document-builder/document-builder-context'
import { supabase } from '@/utils/supabase-config'
import { toast } from '@/components/ui/use-toast'
import { format, addDays } from 'date-fns'
import { useUser } from '@/contexts/UserContext'

interface Patient {
  id: string
  full_name: string
  date_of_birth: string
  organization_id: string
}

interface AssignTemplateModalProps {
  isOpen: boolean
  onClose: () => void
  templates: DocumentTemplate[]
}

export function AssignTemplateModal({ isOpen, onClose, templates }: AssignTemplateModalProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatients, setSelectedPatients] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const { user } = useUser()

  useEffect(() => {
    if (user) { // Only fetch patients if user is logged in
      fetchPatients()
    }
  }, [user])

  const fetchPatients = async () => {
    if (!user) return; // Don't fetch if no user

    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name, date_of_birth, organization_id')
        .eq('organization_id', user.organization_id) // Filter by organization
        .order('full_name')

      if (error) throw error
      setPatients(data)
    } catch (error) {
      console.error('Error fetching patients:', error)
      toast({
        title: "Error",
        description: "Failed to fetch patients. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAssign = async () => {
    if (!user) return; // Don't assign if no user
    if (templates.length === 0 || selectedPatients.length === 0) return

    try {
      const assignments = templates.flatMap(template =>
        selectedPatients.map(patientId => ({
          document_template_id: template.id,
          patient_id: patientId,
          organization_id: user.organization_id, // Use organization ID from context
          is_visible_on_portal: true,
          assigned_at: new Date().toISOString(),
          due_at: addDays(new Date(), 7).toISOString(),
          created_at: new Date().toISOString(),
        }))
      )

      const { data, error } = await supabase
        .from('assigned_documents')
        .insert(assignments)
        .select()

      if (error) throw error

      toast({
        title: "Success",
        description: `${assignments.length} document(s) assigned to ${selectedPatients.length} patient(s)`,
      })
      onClose()
    } catch (error) {
      console.error('Error assigning documents:', error)
      toast({
        title: "Error",
        description: "Failed to assign documents. Please try again.",
        variant: "destructive",
      })
    }
  }

  const filteredPatients = patients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    format(new Date(patient.date_of_birth), 'MM/dd/yyyy').includes(searchTerm)
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Templates</DialogTitle>
          <DialogDescription>
            Select patients to assign the template(s) to.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input
            placeholder="Search patients by name or DOB (MM/DD/YYYY)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <div className="max-h-[300px] overflow-y-auto rounded-md border border-input">
            {filteredPatients.map(patient => (
              <div key={patient.id} className="flex items-center space-x-2 mb-2 p-2 hover:bg-accent hover:text-accent-foreground">
                <Checkbox
                  id={`patient-${patient.id}`}
                  checked={selectedPatients.includes(patient.id)}
                  onCheckedChange={(checked) => {
                    setSelectedPatients(prev =>
                      checked
                        ? [...prev, patient.id]
                        : prev.filter(id => id !== patient.id)
                    )
                  }}
                />
                <Label htmlFor={`patient-${patient.id}`} className="text-sm">
                  {patient.full_name} ({format(new Date(patient.date_of_birth), 'MM/dd/yyyy')})
                </Label>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAssign} disabled={selectedPatients.length === 0 || templates.length === 0}>
            Assign
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

