'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface FeeSchedule {
  id: string
  serviceName: string
  code: string
  fee: number
  payerType: 'Medicare' | 'Medicaid' | 'Private Insurance' | 'Self-Pay'
}

const mockFeeSchedules: FeeSchedule[] = [
  { id: '1', serviceName: 'Office Visit, Established Patient', code: '99213', fee: 100.00, payerType: 'Medicare' },
  { id: '2', serviceName: 'Office Visit, New Patient', code: '99203', fee: 150.00, payerType: 'Private Insurance' },
  { id: '3', serviceName: 'Flu Vaccine', code: '90686', fee: 40.00, payerType: 'Medicaid' },
]

export function FeeSchedules() {
  const [feeSchedules, setFeeSchedules] = useState<FeeSchedule[]>(mockFeeSchedules)
  const [newFeeSchedule, setNewFeeSchedule] = useState<Omit<FeeSchedule, 'id'>>({
    serviceName: '',
    code: '',
    fee: 0,
    payerType: 'Medicare'
  })

  const handleAddFeeSchedule = () => {
    const feeSchedule: FeeSchedule = {
      ...newFeeSchedule,
      id: (feeSchedules.length + 1).toString()
    }
    setFeeSchedules([...feeSchedules, feeSchedule])
    setNewFeeSchedule({
      serviceName: '',
      code: '',
      fee: 0,
      payerType: 'Medicare'
    })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Fee Schedules</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Fee Schedule</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Fee Schedule</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="serviceName" className="text-right">
                  Service Name
                </Label>
                <Input
                  id="serviceName"
                  value={newFeeSchedule.serviceName}
                  onChange={(e) => setNewFeeSchedule({ ...newFeeSchedule, serviceName: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right">
                  Code
                </Label>
                <Input
                  id="code"
                  value={newFeeSchedule.code}
                  onChange={(e) => setNewFeeSchedule({ ...newFeeSchedule, code: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fee" className="text-right">
                  Fee
                </Label>
                <Input
                  id="fee"
                  type="number"
                  value={newFeeSchedule.fee}
                  onChange={(e) => setNewFeeSchedule({ ...newFeeSchedule, fee: parseFloat(e.target.value) })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payerType" className="text-right">
                  Payer Type
                </Label>
                <Select
                  value={newFeeSchedule.payerType}
                  onValueChange={(value) => setNewFeeSchedule({ ...newFeeSchedule, payerType: value as FeeSchedule['payerType'] })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select payer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Medicare">Medicare</SelectItem>
                    <SelectItem value="Medicaid">Medicaid</SelectItem>
                    <SelectItem value="Private Insurance">Private Insurance</SelectItem>
                    <SelectItem value="Self-Pay">Self-Pay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleAddFeeSchedule}>Add Fee Schedule</Button>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Fee</TableHead>
            <TableHead>Payer Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feeSchedules.map((feeSchedule) => (
            <TableRow key={feeSchedule.id}>
              <TableCell>{feeSchedule.serviceName}</TableCell>
              <TableCell>{feeSchedule.code}</TableCell>
              <TableCell>${feeSchedule.fee.toFixed(2)}</TableCell>
              <TableCell>{feeSchedule.payerType}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

