'use client'

import { useState, useEffect } from 'react'
import { FormSubmission } from '@/types'
import { supabase } from '@/utils/supabase-config'
import { toast } from '@/components/ui/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { format } from 'date-fns'
import { useUser } from '@/contexts/UserContext'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface SubmittedDocumentViewProps {
  assignedDocumentId: string
  submissionId: string
}

export function SubmittedDocumentView({ assignedDocumentId, submissionId }: SubmittedDocumentViewProps) {
  const [submission, setSubmission] = useState<FormSubmission | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (assignedDocumentId && submissionId && user) {
      fetchSubmission()
    }
  }, [assignedDocumentId, submissionId, user])

  const fetchSubmission = async () => {
    if (!user) return
    setIsLoading(true)

    try {
      const { data, error } = await supabase
        .from('form_submissions')
        .select(`
          *,
          assigned_documents!inner(
            id,
            patient_id,
            organization_id,
            document_templates(
              name,
              description
            )
          )
        `)
        .eq('id', submissionId)
        .eq('assigned_form_id', assignedDocumentId)
        .eq('organization_id', user.organization_id)
        .single()

      if (error) throw error

      console.log('Fetched submission:', data)
      setSubmission(data)
    } catch (error) {
      console.error('Error fetching submission:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch submission. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Submission Not Found</h2>
              <p className="mb-4">The requested form submission could not be found.</p>
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <Button onClick={() => router.back()} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {submission.assigned_documents.document_templates.name}
          </CardTitle>
          <CardDescription>
            Submitted on {format(new Date(submission.created_at), 'MMMM d, yyyy')} at {format(new Date(submission.created_at), 'HH:mm')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submission.form_data && Array.isArray(submission.form_data) && (
            <div className="space-y-6">
              {submission.form_data.map((item: any, index: number) => (
                <div key={index} className="border-b border-gray-200 pb-4 last:border-0">
                  <h3 className="font-medium text-gray-900 mb-2">{item.question}</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {typeof item.answer === 'boolean'
                      ? (item.answer ? 'Yes' : 'No')
                      : item.answer || 'No answer provided'}
                  </p>
                </div>
              ))}
            </div>
          )}
          {(!submission.form_data || !Array.isArray(submission.form_data) || submission.form_data.length === 0) && (
            <div className="text-center text-gray-500 py-4">
              No form data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

