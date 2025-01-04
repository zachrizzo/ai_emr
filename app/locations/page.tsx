'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Location } from '@/types'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from '@/components/ui/use-toast'
import { AddLocationDialog } from '@/components/add-location-dialog'
import { ConfirmDeleteModal } from '@/components/confirm-delete-modal'
import { supabase } from '@/lib/supabase'
import { Checkbox } from "@/components/ui/checkbox"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/components/auth/auth-provider'
import { Skeleton } from "@/components/ui/skeleton"
import { useLocations } from '@/contexts/LocationContext'

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[100px]" />
        <div className="flex space-x-2">
          <Skeleton className="h-9 w-[300px]" />
          <Skeleton className="h-9 w-[100px]" />
        </div>
      </div>
      <div className="mb-4 flex justify-end">
        <Skeleton className="h-9 w-[120px]" />
      </div>
      <div className="border rounded-lg">
        <div className="border-b">
          <div className="grid grid-cols-7 gap-4 p-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-4" />
            ))}
          </div>
        </div>
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-7 gap-4">
              {Array.from({ length: 7 }).map((_, j) => (
                <Skeleton key={j} className="h-8" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LocationsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddingLocation, setIsAddingLocation] = useState(false)
  const [selectedLocations, setSelectedLocations] = useState<string[]>([])
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const { locations, isLoading, error } = useLocations()

  const addLocationMutation = useMutation({
    mutationFn: async (newLocation: Omit<Location, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session?.user?.id)
        .single()

      if (!userData?.organization_id) {
        throw new Error('No organization found')
      }

      const { data, error } = await supabase
        .from('locations')
        .insert([{ ...newLocation, organization_id: userData.organization_id }])
        .select()
      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      setIsAddingLocation(false)
      toast({
        title: 'Success',
        description: 'Location added successfully'
      })
    },
    onError: (error) => {
      console.error('Error adding location:', error)
      toast({
        title: 'Error',
        description: 'Failed to add location',
        variant: 'destructive'
      })
    },
  })

  const deleteLocationsMutation = useMutation({
    mutationFn: async (locationIds: string[]) => {
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session?.user?.id)
        .single()

      if (!userData?.organization_id) {
        throw new Error('No organization found')
      }

      // First verify the locations exist and aren't already deleted
      const { data: existing, error: checkError } = await supabase
        .from('locations')
        .select('id')
        .in('id', locationIds)
        .eq('organization_id', userData.organization_id)
        .is('deleted_at', null)

      if (checkError) throw checkError
      if (!existing?.length) throw new Error('No valid locations to delete')

      const { error } = await supabase
        .from('locations')
        .delete()
        .in('id', existing.map(l => l.id))

      if (error) throw error
      return existing
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      setSelectedLocations([])
      toast({
        title: 'Success',
        description: `${data.length} location(s) removed successfully`,
      })
      setIsConfirmingDelete(false)
    },
    onError: (error: any) => {
      console.error('Delete mutation error:', error)
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove locations',
        variant: 'destructive'
      })
      setIsConfirmingDelete(false)
    },
  })

  const handleAddLocation = (newLocation: Omit<Location, 'id' | 'created_at' | 'updated_at'>) => {
    addLocationMutation.mutate(newLocation)
  }

  const handleDeleteLocations = () => {
    deleteLocationsMutation.mutate(selectedLocations)
  }

  const handleLocationSelection = (locationId: string, isChecked: boolean) => {
    setSelectedLocations(prev =>
      isChecked ? [...prev, locationId] : prev.filter(id => id !== locationId)
    )
  }

  const filteredLocations = locations?.filter(location =>
    location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    location.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <TableSkeleton />
          </CardContent>
        </Card>
      </div>
    )
  }
  if (error) return <div>Error: {error.message}</div>

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Locations</CardTitle>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[300px]"
            />
            <Button onClick={() => setIsAddingLocation(true)}>Add Location</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-end">
            <Button
              variant="destructive"
              onClick={() => setIsConfirmingDelete(true)}
              disabled={selectedLocations.length === 0}
            >
              Delete Selected
            </Button>
          </div>
          <ConfirmDeleteModal
            isOpen={isConfirmingDelete}
            onClose={() => setIsConfirmingDelete(false)}
            onConfirm={handleDeleteLocations}
            itemName="location(s)"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Checkbox
                    checked={selectedLocations.length === filteredLocations.length && filteredLocations.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedLocations(filteredLocations.map(l => l.id))
                      } else {
                        setSelectedLocations([])
                      }
                    }}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedLocations.includes(location.id)}
                      onCheckedChange={(checked) => handleLocationSelection(location.id, checked as boolean)}
                      aria-label={`Select ${location.name}`}
                    />
                  </TableCell>
                  <TableCell>{location.name}</TableCell>
                  <TableCell>{location.address}</TableCell>
                  <TableCell>{location.phone_number}</TableCell>
                  <TableCell>{location.email}</TableCell>
                  <TableCell>{location.status}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/locations/${location.id}`)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AddLocationDialog
        isOpen={isAddingLocation}
        onClose={() => setIsAddingLocation(false)}
        onAddLocation={handleAddLocation}
      />
    </div>
  )
}

