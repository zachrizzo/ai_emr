'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from '@/components/ui/use-toast'
import { AddTeamDialog } from './add-team-dialog'
import { EditTeamDialog } from './edit-team-dialog'
import { ManageTeamMembersDialog } from './manage-team-members-dialog'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Team } from '@/types/team'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface TeamManagementProps {
  organizationId: string | null;
}

export function TeamManagement({ organizationId }: TeamManagementProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [managingTeamMembers, setManagingTeamMembers] = useState<Team | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])

  useEffect(() => {
    if (organizationId) {
      fetchTeams()
    }
  }, [organizationId])

  const fetchTeams = async () => {
    if (!organizationId) return

    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTeams(data || [])
    } catch (error) {
      console.error('Error fetching teams:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch teams',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddTeam = async (newTeam: Omit<Team, 'id' | 'created_at' | 'last_update'>) => {
    if (!organizationId) return

    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([{
          ...newTeam,
          organization_id: organizationId,
          created_at: new Date().toISOString(),
          last_update: {
            date: new Date().toISOString(),
            updater_id: 'currentUserId' // Replace with actual current user ID
          }
        }])
        .select()

      if (error) throw error

      if (data) {
        toast({
          title: 'Success',
          description: 'Team added successfully'
        })
        fetchTeams()
      }
    } catch (error) {
      console.error('Error adding team:', error)
      toast({
        title: 'Error',
        description: 'Failed to add team',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateTeam = async (updatedTeam: Team) => {
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          ...updatedTeam,
          last_update: {
            date: new Date().toISOString(),
            updater_id: 'currentUserId' // Replace with actual current user ID
          }
        })
        .eq('id', updatedTeam.id)
        .eq('organization_id', organizationId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Team updated successfully'
      })
      fetchTeams()
      setEditingTeam(null)
      setManagingTeamMembers(null)
    } catch (error) {
      console.error('Error updating team:', error)
      toast({
        title: 'Error',
        description: 'Failed to update team',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteTeam = async (teamId: string) => {
    if (!organizationId) return

    if (window.confirm('Are you sure you want to delete this team?')) {
      try {
        const { error } = await supabase
          .from('teams')
          .delete()
          .eq('id', teamId)
          .eq('organization_id', organizationId)

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Team deleted successfully'
        })
        fetchTeams()
      } catch (error) {
        console.error('Error deleting team:', error)
        toast({
          title: 'Error',
          description: 'Failed to delete team',
          variant: 'destructive'
        })
      }
    }
  }

  const handleBulkDelete = async () => {
    if (!organizationId) return

    if (window.confirm(`Are you sure you want to delete ${selectedTeams.length} teams?`)) {
      try {
        const { error } = await supabase
          .from('teams')
          .delete()
          .in('id', selectedTeams)
          .eq('organization_id', organizationId)

        if (error) throw error

        toast({
          title: 'Success',
          description: 'Teams deleted successfully'
        })
        setSelectedTeams([])
        fetchTeams()
      } catch (error) {
        console.error('Error deleting teams:', error)
        toast({
          title: 'Error',
          description: 'Failed to delete teams',
          variant: 'destructive'
        })
      }
    }
  }

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || team.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Team Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-4">
              <Skeleton className="h-10 w-[300px]" />
              <Skeleton className="h-10 w-[180px]" />
              <Skeleton className="h-10 w-[100px]" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Team Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <Input
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={(value: 'all' | 'active' | 'inactive') => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <AddTeamDialog onAddTeam={handleAddTeam} />
            {selectedTeams.length > 0 && (
              <Button variant="destructive" onClick={handleBulkDelete}>
                Delete Selected ({selectedTeams.length})
              </Button>
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedTeams.length === filteredTeams.length && filteredTeams.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedTeams(filteredTeams.map(team => team.id))
                      } else {
                        setSelectedTeams([])
                      }
                    }}
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedTeams.includes(team.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTeams([...selectedTeams, team.id])
                        } else {
                          setSelectedTeams(selectedTeams.filter(id => id !== team.id))
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>{team.name}</TableCell>
                  <TableCell>{team.description}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${team.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {team.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingTeam(team)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setManagingTeamMembers(team)}>
                        Members
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteTeam(team.id)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {editingTeam && (
        <EditTeamDialog
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onUpdateTeam={handleUpdateTeam}
        />
      )}
      {managingTeamMembers && (
        <ManageTeamMembersDialog
          team={managingTeamMembers}
          onClose={() => setManagingTeamMembers(null)}
          onUpdateTeam={handleUpdateTeam}
        />
      )}
    </div>
  )
}

