'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserManagement } from '@/components/admin/user-management'
import { ActivityLogs } from '@/components/admin/activity-logs'
import { DashboardOverview } from '@/components/admin/dashboard-overview'
import { SecuritySettings } from '@/components/admin/security-settings'
import { TeamManagement } from '@/components/admin/team-management'
import { RolesAndPermissions } from '@/components/admin/roles-and-permissions'
import { toast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import { Skeleton } from '@/components/ui/skeleton'

function LoadingSkeleton() {
  return (
    <div className="container mx-auto p-4">
      <div className="h-9 w-2/3 mb-6">
        <Skeleton className="h-full w-full" />
      </div>
      <div className="space-y-4">
        <div className="flex space-x-2 bg-muted p-1 rounded-md w-fit">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24" />
          ))}
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-[100px]" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-7 w-[60px] mb-1" />
                    <Skeleton className="h-4 w-[100px]" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-6 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

interface Organization {
  id: string;
  name: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [organizationId, setOrganizationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUserAndOrganization = async () => {
      try {
        if (!supabase) throw new Error('Supabase client not initialized')

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError) throw userError

        if (!user) {
          router.push('/login')
          return
        }

        const { data: userData, error: profileError } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single()

        if (profileError) throw profileError

        if (!userData?.organization_id) {
          throw new Error('User is not associated with an organization')
        }

        setOrganizationId(userData.organization_id)

        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', userData.organization_id)
          .single()

        if (orgError) throw orgError

        setOrganization(orgData)
      } catch (error) {
        console.error("Error fetching user and organization:", error)
        toast({
          title: "Error",
          description: "Could not retrieve user or organization details.",
          variant: "destructive",
        })
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserAndOrganization()
  }, [router])

  if (isLoading) {
    return <LoadingSkeleton />
  }

  if (!organization) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">No organization found. Please contact your administrator.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard for {organization.name}</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardContent>
              <DashboardOverview organizationId={organizationId} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="users">
          <UserManagement organizationId={organizationId} />
        </TabsContent>
        <TabsContent value="roles">
          <RolesAndPermissions organizationId={organizationId!} />
        </TabsContent>
        <TabsContent value="teams">
          <Card>
            <CardContent>
              <TeamManagement organizationId={organizationId} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="logs">
          <Card>
            <CardContent>
              <ActivityLogs organizationId={organizationId} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="security">
          <Card>
            <CardContent>
              <SecuritySettings organizationId={organizationId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

