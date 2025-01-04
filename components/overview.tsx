'use client'

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { usePatients } from '@/contexts/PatientContext'

export function Overview() {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUser()
  const { patients } = usePatients()

  useEffect(() => {
    const fetchMonthlyStats = async () => {
      if (!user?.organization_id || !patients) return

      try {
        const months = Array.from({ length: 12 }, (_, i) => {
          const date = new Date()
          date.setMonth(date.getMonth() - (11 - i))
          return {
            start: new Date(date.getFullYear(), date.getMonth(), 1).toISOString(),
            end: new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString(),
            name: date.toLocaleString('default', { month: 'short' })
          }
        })

        const monthlyData = await Promise.all(
          months.map(async ({ start, end, name }) => {
            // Get appointments for this month
            const { data: appointments } = await supabase
              .from('appointments')
              .select('id, status')
              .eq('organization_id', user.organization_id)
              .gte('appointment_date', start)
              .lt('appointment_date', end)

            // Calculate appointment statistics
            const completedAppointments = appointments?.filter(a => a.status === 'Completed').length || 0
            const cancelledAppointments = appointments?.filter(a => a.status === 'Cancelled').length || 0
            const noShowAppointments = appointments?.filter(a => a.status === 'No Show').length || 0

            // Get new patients for this month using the context
            const newPatients = patients.filter(p => {
              const createdAt = new Date(p.created_at)
              return createdAt >= new Date(start) && createdAt < new Date(end)
            }).length

            return {
              name,
              'Completed Appointments': completedAppointments,
              'Cancelled': cancelledAppointments,
              'No Shows': noShowAppointments,
              'New Patients': newPatients
            }
          })
        )

        setData(monthlyData)
      } catch (error) {
        console.error('Error fetching monthly stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMonthlyStats()
  }, [user?.organization_id, patients])

  if (isLoading) {
    return <div>Loading statistics...</div>
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => value.toString()}
        />
        <Tooltip />
        <Legend />
        <Bar
          name="Completed Appointments"
          dataKey="Completed Appointments"
          fill="#22c55e"
          radius={[4, 4, 0, 0]}
          stackId="appointments"
        />
        <Bar
          name="Cancelled"
          dataKey="Cancelled"
          fill="#f97316"
          radius={[4, 4, 0, 0]}
          stackId="appointments"
        />
        <Bar
          name="No Shows"
          dataKey="No Shows"
          fill="#ef4444"
          radius={[4, 4, 0, 0]}
          stackId="appointments"
        />
        <Bar
          name="New Patients"
          dataKey="New Patients"
          fill="#8b5cf6"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

