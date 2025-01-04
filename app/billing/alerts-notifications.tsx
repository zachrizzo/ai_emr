'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Alert {
  id: string
  type: 'Overdue Balance' | 'Claim Rejection' | 'Eligibility Expiration'
  patientName: string
  message: string
  date: string
}

const mockAlerts: Alert[] = [
  { id: '1', type: 'Overdue Balance', patientName: 'John Doe', message: 'Balance overdue by 30 days', date: '2023-06-01' },
  { id: '2', type: 'Claim Rejection', patientName: 'Jane Smith', message: 'Claim rejected due to incorrect coding', date: '2023-06-02' },
  { id: '3', type: 'Eligibility Expiration', patientName: 'Alice Johnson', message: 'Insurance eligibility expires in 7 days', date: '2023-06-03' },
]

export function AlertsNotifications() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts)
  const [newAlert, setNewAlert] = useState<Omit<Alert, 'id' | 'date'>>({
    type: 'Overdue Balance',
    patientName: '',
    message: '',
  })

  const handleAddAlert = () => {
    const alert: Alert = {
      ...newAlert,
      id: (alerts.length + 1).toString(),
      date: new Date().toISOString().split('T')[0],
    }
    setAlerts([...alerts, alert])
    setNewAlert({ type: 'Overdue Balance', patientName: '', message: '' })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Alerts & Notifications</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Alert</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Alert</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="alertType" className="text-right">
                  Type
                </Label>
                <select
                  id="alertType"
                  value={newAlert.type}
                  onChange={(e) => setNewAlert({ ...newAlert, type: e.target.value as Alert['type'] })}
                  className="col-span-3"
                >
                  <option value="Overdue Balance">Overdue Balance</option>
                  <option value="Claim Rejection">Claim Rejection</option>
                  <option value="Eligibility Expiration">Eligibility Expiration</option>
                </select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="patientName" className="text-right">
                  Patient Name
                </Label>
                <Input
                  id="patientName"
                  value={newAlert.patientName}
                  onChange={(e) => setNewAlert({ ...newAlert, patientName: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="message" className="text-right">
                  Message
                </Label>
                <Input
                  id="message"
                  value={newAlert.message}
                  onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                  className="col-span-3"
                />
              </div>
            </div>
            <Button onClick={handleAddAlert}>Add Alert</Button>
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Patient Name</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((alert) => (
            <TableRow key={alert.id}>
              <TableCell>{alert.type}</TableCell>
              <TableCell>{alert.patientName}</TableCell>
              <TableCell>{alert.message}</TableCell>
              <TableCell>{alert.date}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

