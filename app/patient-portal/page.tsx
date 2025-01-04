'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bell, Calendar, FileText, MessageSquare, Activity } from 'lucide-react'

// Mock data
const patientInfo = {
  name: 'Sarah Johnson',
  age: 34,
  nextAppointment: '2024-01-15 10:30 AM',
  unreadMessages: 3,
  pendingForms: 2,
}

const recentVisits = [
  {
    date: '2023-12-20',
    doctor: 'Dr. Michael Smith',
    type: 'Annual Physical',
    notes: 'Regular checkup, all vitals normal. Follow-up in 12 months.',
  },
  {
    date: '2023-11-15',
    doctor: 'Dr. Emily Chen',
    type: 'Flu Symptoms',
    notes: 'Prescribed antibiotics, rest recommended.',
  },
]

const vitals = {
  bloodPressure: '120/80',
  heartRate: '72 bpm',
  temperature: '98.6°F',
  weight: '145 lbs',
  lastUpdated: '2023-12-20',
}

export default function PatientPortal() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src="/placeholder-avatar.jpg" />
            <AvatarFallback>SJ</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{patientInfo.name}</h1>
            <p className="text-muted-foreground">Patient ID: #123456</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2">
          <Bell className="h-4 w-4" />
          Notifications
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Next Appointment</p>
              <p className="text-lg font-semibold">{patientInfo.nextAppointment}</p>
            </div>
            <Calendar className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Unread Messages</p>
              <p className="text-lg font-semibold">{patientInfo.unreadMessages}</p>
            </div>
            <MessageSquare className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Pending Forms</p>
              <p className="text-lg font-semibold">{patientInfo.pendingForms}</p>
            </div>
            <FileText className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm text-muted-foreground">Health Score</p>
              <p className="text-lg font-semibold">92/100</p>
            </div>
            <Activity className="h-8 w-8 text-primary" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="visits">Recent Visits</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Latest Vitals</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Blood Pressure</span>
                    <span className="font-medium">{vitals.bloodPressure}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Heart Rate</span>
                    <span className="font-medium">{vitals.heartRate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temperature</span>
                    <span className="font-medium">{vitals.temperature}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weight</span>
                    <span className="font-medium">{vitals.weight}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Last updated: {vitals.lastUpdated}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Upcoming Appointments</h3>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Calendar className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-medium">Annual Physical</p>
                      <p className="text-sm text-muted-foreground">
                        {patientInfo.nextAppointment}
                      </p>
                    </div>
                  </div>
                  <Button className="w-full">Schedule New Appointment</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="visits">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Recent Visits</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {recentVisits.map((visit, index) => (
                  <div key={index} className="border-b last:border-0 pb-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{visit.type}</p>
                        <p className="text-sm text-muted-foreground">{visit.doctor}</p>
                      </div>
                      <span className="text-sm text-muted-foreground">{visit.date}</span>
                    </div>
                    <p className="text-sm">{visit.notes}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Messages</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full">New Message</Button>
                <p className="text-center text-muted-foreground">
                  No messages to display
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Documents & Forms</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Medical History Update</p>
                      <p className="text-sm text-muted-foreground">Due by Jan 15, 2024</p>
                    </div>
                  </div>
                  <Button>Fill Out</Button>
                </div>
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5" />
                    <div>
                      <p className="font-medium">Insurance Information</p>
                      <p className="text-sm text-muted-foreground">Due by Jan 20, 2024</p>
                    </div>
                  </div>
                  <Button>Fill Out</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

