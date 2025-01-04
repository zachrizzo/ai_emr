'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface Claim {
  id: string
  patientName: string
  dateOfService: string
  totalAmount: number
  status: 'Pending' | 'Submitted' | 'Paid' | 'Denied'
}

const mockClaims: Claim[] = [
  { id: '1', patientName: 'John Doe', dateOfService: '2023-06-01', totalAmount: 150.00, status: 'Pending' },
  { id: '2', patientName: 'Jane Smith', dateOfService: '2023-06-02', totalAmount: 200.00, status: 'Submitted' },
  { id: '3', patientName: 'Alice Johnson', dateOfService: '2023-06-03', totalAmount: 175.00, status: 'Paid' },
  { id: '4', patientName: 'Bob Brown', dateOfService: '2023-06-04', totalAmount: 225.00, status: 'Denied' },
]

export function ClaimsManagement() {
  const [claims, setClaims] = useState<Claim[]>(mockClaims)
  const [newClaim, setNewClaim] = useState<Omit<Claim, 'id'>>({
    patientName: '',
    dateOfService: '',
    totalAmount: 0,
    status: 'Pending'
  })

  const handleSubmitClaim = () => {
    const claim: Claim = {
      ...newClaim,
      id: (claims.length + 1).toString()
    }
    setClaims([...claims, claim])
    setNewClaim({
      patientName: '',
      dateOfService: '',
      totalAmount: 0,
      status: 'Pending'
    })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Claims Management</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>New Claim</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Claim</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="patientName" className="text-right">
                  Patient Name
                </Label>
                <Input
                  id="patientName"
                  value={newClaim.patientName}
                  onChange={(e) => setNewClaim({ ...newClaim, patientName: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dateOfService" className="text-right">
                  Date of Service
                </Label>
                <Input
                  id="dateOfService"
                  type="date"
                  value={newClaim.dateOfService}
                  onChange={(e) => setNewClaim({ ...newClaim, dateOfService: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="totalAmount" className="text-right">
                  Total Amount
                </Label>
                <Input
                  id="totalAmount"
                  type="number"
                  value={newClaim.totalAmount}
                  onChange={(e) => setNewClaim({ ...newClaim, totalAmount: parseFloat(e.target.value) })}
                  className="col-span-3"
                />
              </div>
            </div>
            <Button onClick={handleSubmitClaim}>Submit Claim</Button>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient Name</TableHead>
            <TableHead>Date of Service</TableHead>
            <TableHead>Total Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {claims.map((claim) => (
            <TableRow key={claim.id}>
              <TableCell>{claim.patientName}</TableCell>
              <TableCell>{claim.dateOfService}</TableCell>
              <TableCell>${claim.totalAmount.toFixed(2)}</TableCell>
              <TableCell>{claim.status}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm">View</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

