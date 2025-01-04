'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface DeniedClaim {
  id: string
  patientName: string
  dateOfService: string
  amount: number
  reason: string
  status: 'New' | 'In Progress' | 'Appealed' | 'Resolved'
}

const mockDeniedClaims: DeniedClaim[] = [
  { id: '1', patientName: 'John Doe', dateOfService: '2023-05-15', amount: 500.00, reason: 'Missing information', status: 'New' },
  { id: '2', patientName: 'Jane Smith', dateOfService: '2023-05-20', amount: 750.00, reason: 'Service not covered', status: 'In Progress' },
  { id: '3', patientName: 'Alice Johnson', dateOfService: '2023-05-25', amount: 1000.00, reason: 'Incorrect coding', status: 'Appealed' },
]

export function DenialManagement() {
  const [deniedClaims, setDeniedClaims] = useState<DeniedClaim[]>(mockDeniedClaims)
  const [selectedClaim, setSelectedClaim] = useState<DeniedClaim | null>(null)
  const [appealNote, setAppealNote] = useState('')

  const handleAppeal = () => {
    if (selectedClaim) {
      const updatedClaims = deniedClaims.map(claim =>
        claim.id === selectedClaim.id ? { ...claim, status: 'Appealed' } : claim
      )
      setDeniedClaims(updatedClaims)
      setSelectedClaim(null)
      setAppealNote('')
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Denial Management</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient Name</TableHead>
            <TableHead>Date of Service</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deniedClaims.map((claim) => (
            <TableRow key={claim.id}>
              <TableCell>{claim.patientName}</TableCell>
              <TableCell>{claim.dateOfService}</TableCell>
              <TableCell>${claim.amount.toFixed(2)}</TableCell>
              <TableCell>{claim.reason}</TableCell>
              <TableCell>{claim.status}</TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setSelectedClaim(claim)}>
                      Appeal
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Appeal Denied Claim</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div>
                        <p><strong>Patient:</strong> {selectedClaim?.patientName}</p>
                        <p><strong>Date of Service:</strong> {selectedClaim?.dateOfService}</p>
                        <p><strong>Amount:</strong> ${selectedClaim?.amount.toFixed(2)}</p>
                        <p><strong>Reason for Denial:</strong> {selectedClaim?.reason}</p>
                      </div>
                      <Textarea
                        placeholder="Enter appeal notes..."
                        value={appealNote}
                        onChange={(e) => setAppealNote(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleAppeal}>Submit Appeal</Button>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

