'use client'

import { useParams, useRouter } from 'next/navigation'
import { SubmittedDocumentView } from '@/components/submitted-document-view'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ViewSubmittedDocumentPage() {
  const params = useParams<{ id: string, submissionId: string }>()
  const router = useRouter()

  if (!params.id || !params.submissionId) {
    return <div>Missing document or submission ID.</div>
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
      <SubmittedDocumentView 
        assignedDocumentId={params.id} 
        submissionId={params.submissionId} 
      />
    </div>
  )
}

