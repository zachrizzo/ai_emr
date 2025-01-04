'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClaimsManagement } from './claims-management'
import { CodeAssistance } from './code-assistance'
import { FeeSchedules } from './fee-schedules'
import { EligibilityVerification } from './eligibility-verification'
import { PaymentProcessing } from './payment-processing'
import { ReportingAnalytics } from './reporting-analytics'
import { DenialManagement } from './denial-management'
import { AlertsNotifications } from './alerts-notifications'

export default function BillingDashboard() {
  const [activeTab, setActiveTab] = useState('claims')

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Billing Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$124,750.50</div>
            <p className="text-xs text-muted-foreground">+20.1% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">-5 from last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,230.00</div>
            <p className="text-xs text-muted-foreground">+$2,100 from last month</p>
          </CardContent>
        </Card>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="coding">Coding</TabsTrigger>
          <TabsTrigger value="fees">Fee Schedules</TabsTrigger>
          <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="denials">Denials</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>
        <TabsContent value="claims">
          <ClaimsManagement />
        </TabsContent>
        <TabsContent value="coding">
          <CodeAssistance />
        </TabsContent>
        <TabsContent value="fees">
          <FeeSchedules />
        </TabsContent>
        <TabsContent value="eligibility">
          <EligibilityVerification />
        </TabsContent>
        <TabsContent value="payments">
          <PaymentProcessing />
        </TabsContent>
        <TabsContent value="reports">
          <ReportingAnalytics />
        </TabsContent>
        <TabsContent value="denials">
          <DenialManagement />
        </TabsContent>
        <TabsContent value="alerts">
          <AlertsNotifications />
        </TabsContent>
      </Tabs>
    </div>
  )
}

