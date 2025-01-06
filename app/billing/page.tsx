'use client'

import { useState, useEffect } from 'react'
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
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { formatCurrency } from '@/lib/utils'
import { useOrganization } from '@/hooks/use-organization'

export default function BillingDashboard() {
  const [activeTab, setActiveTab] = useState('claims')
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    pendingClaims: 0,
    outstandingBalance: 0,
    revenueChange: 0,
    claimsChange: 0,
    balanceChange: 0
  })

  const supabase = createClientComponentClient()
  const { organization } = useOrganization()

  useEffect(() => {
    if (!organization?.id) return

    const fetchMetrics = async () => {
      // Get total revenue (sum of completed payments for current month)
      const { data: revenueData } = await supabase
        .from('payments')
        .select('amount')
        .eq('organization_id', organization.id)
        .eq('status', 'completed')
        .gte('payment_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

      const totalRevenue = revenueData?.reduce((sum, payment) => sum + payment.amount, 0) || 0

      // Get previous month's revenue for comparison
      const { data: lastMonthRevenue } = await supabase
        .from('payments')
        .select('amount')
        .eq('organization_id', organization.id)
        .eq('status', 'completed')
        .gte('payment_date', new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString())
        .lt('payment_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

      const lastMonthTotal = lastMonthRevenue?.reduce((sum, payment) => sum + payment.amount, 0) || 0
      const revenueChange = lastMonthTotal ? ((totalRevenue - lastMonthTotal) / lastMonthTotal) * 100 : 0

      // Get pending claims count
      const { count: pendingClaims } = await supabase
        .from('insurance_claims')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .eq('status', 'pending')

      // Get last week's pending claims for comparison
      const { count: lastWeekClaims } = await supabase
        .from('insurance_claims')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organization.id)
        .eq('status', 'pending')
        .lt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      const claimsChange = (pendingClaims || 0) - (lastWeekClaims || 0)

      // Get total outstanding balance
      const { data: outstandingData } = await supabase
        .from('invoices')
        .select('balance_due')
        .eq('organization_id', organization.id)
        .eq('status', 'pending')

      const outstandingBalance = outstandingData?.reduce((sum, invoice) => sum + invoice.balance_due, 0) || 0

      // Get last month's outstanding balance for comparison
      const { data: lastMonthBalance } = await supabase
        .from('invoices')
        .select('balance_due')
        .eq('organization_id', organization.id)
        .eq('status', 'pending')
        .lt('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

      const lastMonthOutstanding = lastMonthBalance?.reduce((sum, invoice) => sum + invoice.balance_due, 0) || 0
      const balanceChange = outstandingBalance - lastMonthOutstanding

      setMetrics({
        totalRevenue,
        pendingClaims: pendingClaims || 0,
        outstandingBalance,
        revenueChange,
        claimsChange,
        balanceChange
      })
    }

    fetchMetrics()
    // Set up real-time subscription for updates
    const channel = supabase
      .channel('billing-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          filter: `organization_id=eq.${organization.id}`
        },
        () => fetchMetrics()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'insurance_claims',
          filter: `organization_id=eq.${organization.id}`
        },
        () => fetchMetrics()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'invoices',
          filter: `organization_id=eq.${organization.id}`
        },
        () => fetchMetrics()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [organization?.id])

  if (!organization?.id) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Billing Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.revenueChange >= 0 ? '+' : ''}{metrics.revenueChange.toFixed(1)}% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pendingClaims}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.claimsChange >= 0 ? '+' : ''}{metrics.claimsChange} from last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.outstandingBalance)}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.balanceChange >= 0 ? '+' : ''}{formatCurrency(Math.abs(metrics.balanceChange))} from last month
            </p>
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

