'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
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
import { AssignedDocuments } from '@/components/patient-portal/assigned-documents'
import { ArrowLeft } from 'lucide-react'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function PatientDetailsPage({ params }: { params: { id: string } }) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchPatient()
  }, [params.id])

  const fetchPatient = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setPatient(data)
    } catch (error) {
      console.error("Error fetching patient:", error)
      toast({
        title: "Error",
        description: "Failed to fetch patient data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (!patient) return <div>Patient not found</div>

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">{patient.full_name}</h1>
        <Button onClick={() => router.push('/patients')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patients List
        </Button>
      </div>
      <Tabs defaultValue="personal">
        <TabsList>
          <TabsTrigger value="personal">Personal Information</TabsTrigger>
          <TabsTrigger value="medical">Medical History</TabsTrigger>
          <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="immunizations">Immunizations</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
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
          <div className="mt-4">
            {/* If you have additional content, add it here */}
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-8">
        <AssignedDocuments patientId={patient.id} />
      </div>
    </div>
  )
}

