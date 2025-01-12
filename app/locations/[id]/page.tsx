'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLocations } from '@/contexts/LocationContext'
import { Skeleton } from "@/components/ui/skeleton"
import { EditLocationDialog } from '@/components/edit-location-dialog'
import { toast } from '@/components/ui/use-toast'
import { supabase } from '@/utils/supabase-config'
import { useAuth } from '@/components/auth/auth-provider'
import { useQueryClient } from '@tanstack/react-query'
import { Location } from '@/types'

function LocationDetailSkeleton() {
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

export default function LocationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { locations, isLoading } = useLocations()
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const locationId = params?.id as string

  const location = locations?.find(loc => loc.id === locationId)

  const handleUpdateLocation = async (updatedLocation: Location) => {
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
        .from('locations')
        .update({
          name: updatedLocation.name,
          address: updatedLocation.address,
          phone_number: updatedLocation.phone_number,
          email: updatedLocation.email,
          status: updatedLocation.status,
        })
        .eq('id', locationId)
        .eq('organization_id', userData.organization_id)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['locations'] })
      toast({
        title: 'Success',
        description: 'Location updated successfully',
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating location:', error)
      toast({
        title: 'Error',
        description: 'Failed to update location',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <LocationDetailSkeleton />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!location) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Location not found</h2>
              <Button
                className="mt-4"
                onClick={() => router.push('/locations')}
              >
                Back to Locations
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
          <CardTitle>{location.name}</CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push('/locations')}
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
              <h3 className="font-semibold mb-2">Address</h3>
              <p className="text-gray-700">{location.address}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Phone Number</h3>
              <p className="text-gray-700">{location.phone_number}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Email</h3>
              <p className="text-gray-700">{location.email}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Status</h3>
              <p className="text-gray-700">{location.status}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditLocationDialog
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onUpdateLocation={handleUpdateLocation}
        location={location}
      />
    </div>
  )
}

