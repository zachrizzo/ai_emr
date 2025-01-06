'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { Patient } from '@/types'
import { PersonalInformationTab } from '@/components/patient-tabs/personal-information-tab'
import { MedicalHistoryTab } from '@/components/patient-tabs/medical-history-tab'
import { LifestyleTab } from '@/components/patient-tabs/lifestyle-tab'
import { AppointmentsTab } from '@/components/patient-tabs/appointments-tab'
import { MedicationsTab } from '@/components/patient-tabs/medications-tab'
import { ImmunizationsTab } from '@/components/patient-tabs/immunizations-tab'
import { DocumentsTab } from '@/components/patient-tabs/documents-tab'
import { NotesTab } from '@/components/patient-tabs/notes-tab'
import { ArrowLeft } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ClinicalNote, CreateClinicalNoteParams, UpdateClinicalNoteParams } from '@/types/notes'
import { createClinicalNote, updateClinicalNote } from '@/lib/services/clinical-notes'
import { useUser } from '@/lib/hooks/use-user'

export default function PatientDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useUser()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeNote, setActiveNote] = useState<ClinicalNote | null>(null)

  useEffect(() => {
    async function loadPatient() {
      try {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('id', params.id)
          .single()

        if (error) throw error
        setPatient(data)
      } catch (error) {
        console.error('Error loading patient:', error)
        toast({
          title: 'Error',
          description: 'Failed to load patient details.',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadPatient()
  }, [params.id])

  const handleCreateNote = async (noteData: CreateClinicalNoteParams) => {
    try {
      if (!user?.id || !user.organization_id) {
        throw new Error('User not authenticated or missing organization')
      }

      await createClinicalNote({
        ...noteData,
        provider_id: user.id,
        patient_id: params.id,
        organization_id: user.organization_id,
      })

      toast({
        title: 'Note Created',
        description: 'The clinical note has been saved successfully.',
      })
    } catch (error) {
      console.error('Error creating note:', error)
      toast({
        title: 'Error',
        description: 'Failed to create the clinical note. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateNote = async (noteId: string, noteData: UpdateClinicalNoteParams) => {
    try {
      if (!user) return;
      await updateClinicalNote(noteId, user.organization_id, noteData)
      setActiveNote(null)
      toast({
        title: 'Note Updated',
        description: 'The clinical note has been updated successfully.',
      })
    } catch (error) {
      console.error('Error updating note:', error)
      toast({
        title: 'Error',
        description: 'Failed to update the clinical note. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleEditNote = (note: ClinicalNote | null) => {
    setActiveNote(note)
  }

  if (isLoading) return <div>Loading patient details...</div>
  if (!patient) return <div>Patient not found</div>
  if (!user) return <div>Loading user details...</div>

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">{`${patient.first_name} ${patient.last_name}`}</h1>
      </div>

      <Tabs defaultValue="personal">
        <TabsList className="grid grid-cols-8 w-full">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="medical">Medical History</TabsTrigger>
          <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="immunizations">Immunizations</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="notes">Clinical Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <PersonalInformationTab patientId={patient.id} />
        </TabsContent>

        <TabsContent value="medical">
          <MedicalHistoryTab patientId={patient.id} />
        </TabsContent>

        <TabsContent value="lifestyle">
          <LifestyleTab patientId={patient.id} />
        </TabsContent>

        <TabsContent value="appointments">
          <AppointmentsTab patientId={patient.id} />
        </TabsContent>

        <TabsContent value="medications">
          <MedicationsTab patientId={patient.id} />
        </TabsContent>

        <TabsContent value="immunizations">
          <ImmunizationsTab patientId={patient.id} />
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsTab patientId={patient.id} />
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <NotesTab
            patientId={patient.id}
            providerId={user.id}
            organizationId={user.organization_id}
            activeNote={activeNote}
            onCreateNote={handleCreateNote}
            onUpdateNote={handleUpdateNote}
            onEditNote={handleEditNote}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

