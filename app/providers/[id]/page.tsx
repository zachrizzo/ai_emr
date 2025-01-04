'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useProviders } from '@/contexts/ProviderContext'
import { useLocations } from '@/contexts/LocationContext'
import { Skeleton } from "@/components/ui/skeleton"
import { EditProviderDialog } from '@/components/edit-provider-dialog'
import { toast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth/auth-provider'
import { useQueryClient } from '@tanstack/react-query'
import { Provider } from '@/types'

function ProviderDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-[200px]" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProviderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { providers, isLoading } = useProviders()
  const { locations } = useLocations()
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const providerId = params?.id as string

  const provider = providers?.find(prov => prov.id === providerId)
  const providerLocation = locations?.find(loc => loc.id === provider?.location_id)

  const handleUpdateProvider = async (updatedProvider: Provider) => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', session?.user?.id)
        .single()

      if (!userData?.organization_id) {
        throw new Error('No organization found')
      }

      const { error } = await supabase
        .from('providers')
        .update({
          full_name: updatedProvider.full_name,
          specialty: updatedProvider.specialty,
          phone_number: updatedProvider.phone_number,
          email: updatedProvider.email,
          location_id: updatedProvider.location_id,
          status: updatedProvider.status,
        })
        .eq('id', providerId)
        .eq('organization_id', userData.organization_id)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['providers'] })
      toast({
        title: 'Success',
        description: 'Provider updated successfully',
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating provider:', error)
      toast({
        title: 'Error',
        description: 'Failed to update provider',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <ProviderDetailSkeleton />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!provider) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Provider not found</h2>
              <Button
                className="mt-4"
                onClick={() => router.push('/providers')}
              >
                Back to Providers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{provider.full_name}</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push('/providers')}
            >
              Back
            </Button>
            <Button
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Specialty</h3>
              <p className="text-gray-700">{provider.specialty}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Phone Number</h3>
              <p className="text-gray-700">{provider.phone_number}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Email</h3>
              <p className="text-gray-700">{provider.email}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Location</h3>
              <p className="text-gray-700">{providerLocation?.name || 'No location assigned'}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Status</h3>
              <p className="text-gray-700">{provider.status}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditProviderDialog
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onUpdateProvider={handleUpdateProvider}
        provider={provider}
        locations={locations || []}
      />
    </div>
  )
}

