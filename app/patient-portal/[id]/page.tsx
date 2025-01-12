'use client'

import { useState, useEffect } from 'react'
import { AssignedDocuments } from '@/components/patient-portal/assigned-documents'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/utils/supabase-config'
import { toast } from '@/components/ui/use-toast'
import { useParams } from 'next/navigation'
import { SubmittedDocumentView } from '@/components/submitted-document-view'

export default function PatientPortal() {
  const { id } = useParams()
  const [patientName, setPatientName] = useState<string | null>(null)

  useEffect(() => {
    const fetchPatientName = async () => {
      try {
        const { data, error } = await supabase
          .from('patients')
          .select('full_name')
          .eq('id', id)
          .single()

        if (error) throw error
        setPatientName(data.full_name)
      } catch (error: any) {
        console.error('Error fetching patient name:', error)
        toast({
          title: 'Error',
          description: error.message || 'An unexpected error occurred. Please try again.',
          variant: 'destructive',
        })
      }
    }

    fetchPatientName()
  }, [id])

  if (!patientName) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Patient Portal: {patientName}</CardTitle>
        </CardHeader>
        <CardContent>
          <AssignedDocuments patientId={id as string} />
          <div className="mt-4">
            <SubmittedDocumentView assignedDocumentId={id as string} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

