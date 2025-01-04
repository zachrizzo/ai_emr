'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Payment {
  id: string
  patientName: string
  amount: number
  date: string
  method: 'Credit Card' | 'ACH' | 'Cash' | 'Check'
}

const mockPayments: Payment[] = [
  { id: '1', patientName: 'John Doe', amount: 100.00, date: '2023-06-01', method: 'Credit Card' },
  { id: '2', patientName: 'Jane Smith', amount: 75.50, date: '2023-06-02', method: 'ACH' },
  { id: '3', patientName: 'Alice Johnson', amount: 50.00, date: '2023-06-03', method: 'Cash' },
]

export function PaymentProcessing() {
  const [payments, setPayments] = useState<Payment[]>(mockPayments)
  const [newPayment, setNewPayment] = useState({
    patientName: '',
    amount: '',
    method: 'Credit Card' as Payment['method'],
  })

  const handleAddPayment = () => {
    const payment: Payment = {
      id: (payments.length + 1).toString(),
      patientName: newPayment.patientName,
      amount: parseFloat(newPayment.amount),
      date: new Date().toISOString().split('T')[0],
      method: newPayment.method,
    }
    setPayments([...payments, payment])
    setNewPayment({ patientName: '', amount: '', method: 'Credit Card' })
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Payment Processing</h2>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Add New Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="patientName">Patient Name</Label>
              <Input
                id="patientName"
                value={newPayment.patientName}
                onChange={(e) => setNewPayment({ ...newPayment, patientName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={newPayment.amount}
                onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="method">Payment Method</Label>
              <select
                id="method"
                value={newPayment.method}
                onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value as Payment['method'] })}
                className="w-full p-2 border rounded"
              >
                <option value="Credit Card">Credit Card</option>
                <option value="ACH">ACH</option>
                <option value="Cash">Cash</option>
                <option value="Check">Check</option>
              </select>
            </div>
          </div>
          <Button onClick={handleAddPayment} className="mt-4">Add Payment</Button>
        </CardContent>
      </Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Patient Name</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Method</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>{payment.patientName}</TableCell>
              <TableCell>${payment.amount.toFixed(2)}</TableCell>
              <TableCell>{payment.date}</TableCell>
              <TableCell>{payment.method}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

