'use client'

import { Conversation } from '@/types'
import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'

interface ChartIntegrationProps {
  conversation: Conversation
}

export function ChartIntegration({ conversation }: ChartIntegrationProps) {
  // TODO: Implement chart integration functionality
  return (
    <div className="border-t p-4">
      <Button variant="outline" className="w-full">
        <FileText className="mr-2 h-4 w-4" />
        Update Patient Chart
      </Button>
    </div>
  )
}

