'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'
import Link from 'next/link'
import { useUser } from '@/contexts/UserContext'
import { format } from 'date-fns'

interface FormSubmission {
  id: string
  status: string
  form_data: any
  created_at: string
}

interface AssignedDocument {
  id: string
  template_id: string
  template_name: string
  assigned_at: string
  due_at: string
  status: 'pending' | 'overdue' | 'completed'
  submissionId?: string
  formSubmission?: FormSubmission
}

export function AssignedDocuments({ patientId }: { patientId: string }) {
  const [documents, setDocuments] = useState<AssignedDocument[]>([])
  const { user } = useUser()

  useEffect(() => {
    if (user) {
      fetchAssignedDocuments()
    }
  }, [patientId, user])

  const fetchAssignedDocuments = async () => {
    if (!user || !supabase) return

    try {
      // First fetch assigned documents
      const { data: assignedDocs, error: assignedError } = await supabase
        .from('assigned_documents')
        .select(`
          *,
          document_templates(name)
        `)
        .eq('patient_id', patientId)
        .eq('organization_id', user.organization_id)
        .order('assigned_at', { ascending: false })

      if (assignedError) {
        console.error('Error fetching assigned documents:', assignedError)
        throw assignedError
      }

      console.log('Assigned Documents:', assignedDocs)

      if (!assignedDocs || assignedDocs.length === 0) {
        console.log('No assigned documents found')
        setDocuments([])
        return
      }

      // Log the IDs we're searching for
      console.log('Searching for submissions with assigned_form_ids:', assignedDocs.map(doc => doc.id))

      // First try to get ALL submissions with full joins to debug
      const { data: allSubmissions, error: allSubmissionsError } = await supabase
        .from('form_submissions')
        .select(`
          *,
          assigned_documents!inner (
            id,
            patient_id,
            organization_id,
            document_templates (
              name
            )
          )
        `)

      console.log('ALL submissions with joins:', allSubmissions)
      if (allSubmissionsError) {
        console.error('Error fetching all submissions:', allSubmissionsError)
      }

      // Try a simpler query first
      const { data: simpleSubmissions, error: simpleError } = await supabase
        .from('form_submissions')
        .select('*')
        .limit(1)

      console.log('Simple submissions query result:', simpleSubmissions)
      if (simpleError) {
        console.error('Error with simple query:', simpleError)
      }

      // Now try with explicit organization check
      const { data: submissions, error: submissionsError } = await supabase
        .from('form_submissions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('organization_id', user.organization_id)
        .in('assigned_form_id', assignedDocs.map(doc => doc.id))
        .eq('status', 'completed')
        .is('deleted_at', null)
        .is('archived_at', null)

      if (submissionsError) {
        console.error('Error fetching submissions:', submissionsError)
        throw submissionsError
      }


      // Process and combine the data
      const processedDocs: AssignedDocument[] = assignedDocs.map(doc => {
        // Find submission for this specific document
        const submission = submissions?.find(sub => {
          const matches = sub.assigned_form_id === doc.id
          console.log(`Checking submission ${sub.id} against doc ${doc.id}:`, matches)
          return matches
        })

        const status: 'pending' | 'overdue' | 'completed' = submission ? 'completed' :
          (doc.due_at && new Date(doc.due_at) < new Date()) ? 'overdue' :
            'pending'

        const result = {
          id: doc.id,
          template_id: doc.document_template_id,
          template_name: doc.document_templates.name,
          assigned_at: doc.assigned_at,
          due_at: doc.due_at,
          status,
          submissionId: submission?.id,
          formSubmission: submission
        }

        console.log(`Processed document ${doc.id}:`, result)
        return result
      })

      console.log('Final Processed Documents:', processedDocs)
      setDocuments(processedDocs)
    } catch (error) {
      console.error('Error fetching assigned documents:', error)
      toast({
        title: "Error",
        description: "Failed to fetch assigned documents. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assigned Documents</CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length > 0 ? (
          <ul>
            {documents.map(document => (
              <li key={document.id} className="mb-4">
                <div>
                  <h3 className="font-medium text-lg">{document.template_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Assigned: {format(new Date(document.assigned_at), 'MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Due: {format(new Date(document.due_at), 'MMMM d, yyyy')}
                  </p>
                  <p className="text-sm text-muted-foreground">Status: {document.status}</p>
                </div>
                {document.status === 'completed' && document.submissionId && (
                  <div className="mt-2">
                    <Button asChild>
                      <Link href={`/patient-portal/documents/${document.id}/view/${document.submissionId}`}>
                        View Submission
                      </Link>
                    </Button>
                  </div>
                )}
                {document.status !== 'completed' && (
                  <div className="mt-2">
                    <Button asChild>
                      <Link href={`/patient-portal/documents/${document.id}`}>
                        Complete Document
                      </Link>
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p>No assigned documents found.</p>
        )}
      </CardContent>
    </Card>
  )
}

