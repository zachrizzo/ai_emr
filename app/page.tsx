'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Overview } from '@/components/overview'
import { RecentPatients } from '@/components/recent-patients'
import { FloatingChat } from '@/components/messaging/floating-chat'
import { useEffect, useState } from 'react'
import { supabase } from '@/utils/supabase-config'
import { useUser } from '@/contexts/UserContext'
import { usePatients } from '@/contexts/PatientContext'
import { useProviders } from '@/contexts/ProviderContext'
import { useLocations } from '@/contexts/LocationContext'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    appointmentsToday: 0,
    newPatientsThisWeek: 0,
    pendingReports: 0,
    patientsChange: 0,
    appointmentsChange: 0,
    activeProviders: 0,
    activeLocations: 0,
    upcomingAppointments: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUser()
  const { patients } = usePatients()
  const { providers } = useProviders()
  const { locations } = useLocations()

  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user?.organization_id || !patients) return

      try {
        // Get total patients and calculate change
        const totalPatients = patients.length

        // Calculate patients added last month
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        const patientsLastMonth = patients.filter(p =>
          new Date(p.created_at) < lastMonth
        ).length

        const patientsChange = patientsLastMonth > 0
          ? ((totalPatients - patientsLastMonth) / patientsLastMonth) * 100
          : 0

        // Get today's appointments
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const { data: todayAppointments } = await supabase
          .from('appointments')
          .select('created_at')
          .eq('organization_id', user.organization_id)
          .gte('appointment_date', today.toISOString())
          .lt('appointment_date', tomorrow.toISOString())

        // Get yesterday's appointments for comparison
        const yesterday = new Date(today)
        yesterday.setDate(yesterday.getDate() - 1)

        const { data: yesterdayAppointments } = await supabase
          .from('appointments')
          .select('created_at')
          .eq('organization_id', user.organization_id)
          .gte('appointment_date', yesterday.toISOString())
          .lt('appointment_date', today.toISOString())

        // Get upcoming appointments (next 7 days)
        const nextWeek = new Date(today)
        nextWeek.setDate(nextWeek.getDate() + 7)

        const { data: upcomingAppointments } = await supabase
          .from('appointments')
          .select('id')
          .eq('organization_id', user.organization_id)
          .gte('appointment_date', today.toISOString())
          .lt('appointment_date', nextWeek.toISOString())

        // Calculate new patients this week
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)

        const newPatientsThisWeek = patients.filter(p =>
          new Date(p.created_at) >= weekAgo
        ).length

        // Get pending reports/documents
        const { data: pendingReports } = await supabase
          .from('documents')
          .select('id')
          .eq('organization_id', user.organization_id)
          .eq('status', 'pending')

        const todayAppointmentsCount = todayAppointments?.length ?? 0
        const yesterdayAppointmentsCount = yesterdayAppointments?.length ?? 0
        const upcomingAppointmentsCount = upcomingAppointments?.length ?? 0
        const pendingReportsCount = pendingReports?.length ?? 0

        setStats({
          totalPatients,
          appointmentsToday: todayAppointmentsCount,
          newPatientsThisWeek,
          pendingReports: pendingReportsCount,
          patientsChange,
          appointmentsChange: todayAppointmentsCount - yesterdayAppointmentsCount,
          activeProviders: providers?.length || 0,
          activeLocations: locations?.length || 0,
          upcomingAppointments: upcomingAppointmentsCount
        })
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardStats()
  }, [user?.organization_id, patients, providers, locations])

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-primary">Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">{stats.activeProviders}</span> Providers •
          <span className="font-medium"> {stats.activeLocations}</span> Locations
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {isLoading ? '...' : stats.totalPatients.toLocaleString()}
            </div>
            <p className="text-xs text-blue-100">
              {stats.patientsChange > 0 ? `+${stats.patientsChange.toFixed(1)}%` : `${stats.patientsChange.toFixed(1)}%`} from last month
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500 to-green-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">Appointments Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {isLoading ? '...' : stats.appointmentsToday}
            </div>
            <p className="text-xs text-green-100">
              {stats.appointmentsChange > 0 ? `+${stats.appointmentsChange}` : stats.appointmentsChange} from yesterday
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">New Patients This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {isLoading ? '...' : stats.newPatientsThisWeek}
            </div>
            <p className="text-xs text-purple-100">
              Last 7 days
            </p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500 to-red-600">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-white">Upcoming Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {isLoading ? '...' : stats.upcomingAppointments}
            </div>
            <p className="text-xs text-red-100">
              Next 7 days
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-full lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Patient Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <Overview />
          </CardContent>
        </Card>
        <Card className="col-span-full lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Recent Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentPatients />
          </CardContent>
        </Card>
      </div>

      <FloatingChat
        initialConversationId="example-conversation-id"
        initialMessageId="example-message-id"
      />
    </div>
  )
}

