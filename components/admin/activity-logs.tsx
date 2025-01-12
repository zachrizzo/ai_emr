'use client'

import { useState, useEffect } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/utils/supabase-config'
import { toast } from '@/components/ui/use-toast'

interface ActivityLog {
  id: string
  user: string
  action: string
  details: string
  timestamp: string
  user_id: string
}

export function ActivityLogs({ organizationId }: { organizationId: string | null }) {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAction, setFilterAction] = useState('')

  useEffect(() => {
    if (organizationId) {
      fetchLogs()
    }
  }, [organizationId])

  const fetchLogs = async () => {
    if (!organizationId) return

    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('organization_id', organizationId)
      if (usersError) throw usersError

      const userIds = users.map((user) => user.id)

      const { data: logsData, error: logsError } = await supabase
        .from('activity_logs')
        .select('*')
        .in('user_id', userIds)

      if (logsError) throw logsError
      setLogs(logsData)
    } catch (error) {
      console.error("Error fetching logs:", error)
      toast({
        title: "Error",
        description: "Failed to fetch activity logs",
        variant: "destructive",
      })
    }
  }

  const filteredLogs = logs.filter(log =>
    (log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterAction === '' || filterAction === 'all' || log.action === filterAction)
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Input
          placeholder="Search logs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="Login">Login</SelectItem>
            <SelectItem value="Update Patient">Update Patient</SelectItem>
            <SelectItem value="Create Appointment">Create Appointment</SelectItem>
            <SelectItem value="Permission Change">Permission Change</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Details</TableHead>
            <TableHead>Timestamp</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>{log.user}</TableCell>
              <TableCell>{log.action}</TableCell>
              <TableCell>{log.details}</TableCell>
              <TableCell>{log.timestamp}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

