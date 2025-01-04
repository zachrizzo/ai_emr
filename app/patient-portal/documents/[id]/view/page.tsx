'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { format } from 'date-fns'

interface FormSubmission {
  id: string
  assigned_form_id: string
  patient_id: string
  created_at: string
  form_data: Array<{
    id: number
    question: string
    answer: string
  }>
}

export default function ViewSubmissionPage({ params }: { params: { id: string } }) {
  const [submission, setSubmission] = useState<FormSubmission | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchSubmission = async () => {
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from('form_submissions')
          .select('*')
          .eq('assigned_form_id', params.id)
          .single()

        if (error) throw error

        setSubmission(data as FormSubmission)
      } catch (error) {
        console.error('Error fetching submission:', error)
        toast({
          title: "Error",
          description: "Failed to fetch submission. Please try again.",
          variant: "destructive",
        })
        router.push('/patient-portal')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubmission()
  }, [params.id, router])

  if (isLoading) return <div>Loading...</div>
  if (!submission) return <div>Submission not found.</div>

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Submitted Document</CardTitle>
      </CardHeader>
      <CardContent>
        {submission.form_data.map((item) => (
          <div key={item.id} className="mb-4">
            <h3 className="font-semibold">{item.question}</h3>
            <p>{item.answer}</p>
          </div>
        ))}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          <p>Submitted: {format(new Date(submission.created_at), 'MMMM d, yyyy HH:mm:ss')}</p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => router.back()}>Back</Button>
        </div>
      </CardFooter>
    </Card>
  )
}

