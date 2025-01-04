'use client'

import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { formatDistanceToNow } from 'date-fns'

interface RecentPatient {
  id: string
  full_name: string
  email: string
  created_at: string
}

export function RecentPatients() {
  const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUser()

  useEffect(() => {
    const fetchRecentPatients = async () => {
      if (!user?.organization_id) return

      try {
        const { data, error } = await supabase
          .from('patients')
          .select('id, full_name, email, created_at')
          .eq('organization_id', user.organization_id)
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(5)

        if (error) throw error
        setRecentPatients(data || [])
      } catch (error) {
        console.error('Error fetching recent patients:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecentPatients()
  }, [user?.organization_id])

  if (isLoading) {
    return <div>Loading recent patients...</div>
  }

  return (
    <div className="space-y-8">
      {recentPatients.map((patient) => (
        <div key={patient.id} className="flex items-center">
          <Avatar className="h-9 w-9">
            <AvatarImage src={`https://avatar.vercel.sh/${patient.full_name}.png`} alt={patient.full_name} />
            <AvatarFallback>{patient.full_name.split(' ').map((n) => n[0]).join('')}</AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{patient.full_name}</p>
            <p className="text-sm text-muted-foreground">{patient.email}</p>
          </div>
          <div className="ml-auto font-medium">
            {formatDistanceToNow(new Date(patient.created_at), { addSuffix: true })}
          </div>
        </div>
      ))}
    </div>
  )
}

