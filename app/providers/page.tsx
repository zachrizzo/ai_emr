'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Provider, Location } from '@/types'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from '@/components/ui/use-toast'
import { AddProviderDialog } from '@/components/add-provider-dialog'
import { ConfirmDeleteModal } from '@/components/confirm-delete-modal'
import { supabase } from '@/lib/supabase'
import { Checkbox } from "@/components/ui/checkbox"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/components/auth/auth-provider'
import { Skeleton } from "@/components/ui/skeleton"
import { useProviders } from '@/contexts/ProviderContext'
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

export default function ProvidersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddingProvider, setIsAddingProvider] = useState(false)
  const [selectedProviders, setSelectedProviders] = useState<string[]>([])
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const router = useRouter()
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const { providers, isLoading, error } = useProviders()
  const { locations } = useLocations()

  const addProviderMutation = useMutation({
    mutationFn: async (newProvider: Omit<Provider, 'id'>) => {
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session?.user?.id)
        .single()

      if (!userData?.organization_id) {
        throw new Error('No organization found')
      }

      const { data, error } = await supabase
        .from('providers')
        .insert([{ ...newProvider, organization_id: userData.organization_id }])
        .select()

      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['providers'] })
      setIsAddingProvider(false)
      toast({
        title: 'Success',
        description: 'Provider added successfully',
      })
    },
    onError: (error) => {
      console.error('Error adding provider:', error)
      toast({
        title: 'Error',
        description: 'Failed to add provider',
        variant: 'destructive',
      })
    },
  })

  const deleteProviderMutation = useMutation({
    mutationFn: async (providerIds: string[]) => {
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session?.user?.id)
        .single()

      if (!userData?.organization_id) {
        throw new Error('No organization found')
      }

      // First verify the providers exist and aren't already deleted
      const { data: existing, error: checkError } = await supabase
        .from('providers')
        .select('id')
        .in('id', providerIds)
        .eq('organization_id', userData.organization_id)
        .is('deleted_at', null)

      if (checkError) throw checkError
      if (!existing?.length) throw new Error('No valid providers to delete')

      const { error } = await supabase
        .from('providers')
        .delete()
        .in('id', existing.map(p => p.id))

      if (error) throw error
      return existing
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['providers'] })
      setSelectedProviders([])
      toast({
        title: "Success",
        description: `${data.length} provider(s) removed successfully`,
      })
      setIsConfirmingDelete(false)
    },
    onError: (error: any) => {
      console.error("Delete mutation error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to remove providers. Please try again.",
        variant: "destructive",
      })
    },
  })

  const handleAddProvider = (newProvider: Omit<Provider, 'id'>) => {
    addProviderMutation.mutate(newProvider)
  }

  const handleDeleteSelectedProviders = () => {
    if (selectedProviders.length === 0) {
      toast({
        title: 'No providers selected',
        description: 'Please select providers to delete',
        variant: 'destructive'
      })
      return
    }
    setIsConfirmingDelete(true)
  }

  const confirmDeleteSelectedProviders = () => {
    deleteProviderMutation.mutate(selectedProviders)
  }

  const handleProviderSelection = (providerId: string, isChecked: boolean) => {
    setSelectedProviders(prev =>
      isChecked ? [...prev, providerId] : prev.filter(id => id !== providerId)
    )
  }

  const filteredProviders = providers?.filter(provider =>
    provider.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
    provider.email.toLowerCase().includes(searchTerm.toLowerCase())
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
  if (error) return <div>Error: {(error as Error).message}</div>

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Providers</CardTitle>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Search providers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[300px]"
            />
            <Button onClick={() => setIsAddingProvider(true)}>Add Provider</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex justify-end">
            <Button
              variant="destructive"
              onClick={handleDeleteSelectedProviders}
              disabled={selectedProviders.length === 0}
            >
              Delete Selected
            </Button>
          </div>
          <ConfirmDeleteModal
            isOpen={isConfirmingDelete}
            onClose={() => setIsConfirmingDelete(false)}
            onConfirm={confirmDeleteSelectedProviders}
            itemName="provider(s)"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Checkbox
                    checked={selectedProviders.length === filteredProviders.length && filteredProviders.length > 0}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedProviders(filteredProviders.map(p => p.id))
                      } else {
                        setSelectedProviders([])
                      }
                    }}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProviders.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedProviders.includes(provider.id)}
                      onCheckedChange={(checked) => handleProviderSelection(provider.id, checked as boolean)}
                      aria-label={`Select ${provider.full_name}`}
                    />
                  </TableCell>
                  <TableCell>{provider.full_name}</TableCell>
                  <TableCell>{provider.specialty}</TableCell>
                  <TableCell>{provider.phone_number}</TableCell>
                  <TableCell>{provider.email}</TableCell>
                  <TableCell>{locations?.find(l => l.id === provider.location_id)?.name || 'No location'}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/providers/${provider.id}`)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <AddProviderDialog
        isOpen={isAddingProvider}
        onClose={() => setIsAddingProvider(false)}
        onAddProvider={handleAddProvider}
        locations={locations || []}
        organizationId={session?.user?.organization_id || ''}
      />
    </div>
  )
}

