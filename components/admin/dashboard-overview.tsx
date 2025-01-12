'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/utils/supabase-config'
import { useAuth } from '@/components/auth/auth-provider'

interface DashboardOverviewProps {
  organizationId: string | null;
}

export function DashboardOverview({ organizationId }: DashboardOverviewProps) {
  const { user: authUser, loading: authLoading } = useAuth();

  // Query for users and their counts
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['dashboard-users', organizationId],
    queryFn: async () => {
      if (!organizationId || !supabase || !authUser) return null;

      // Verify the current user's authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Authentication failed');

      const [totalUsers, activeUsers, pendingUsers] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact' }).eq('organization_id', organizationId),
        supabase.from('users').select('*', { count: 'exact' }).eq('organization_id', organizationId).eq('status', 'active'),
        supabase.from('users').select('*', { count: 'exact' }).eq('organization_id', organizationId).eq('status', 'pending')
      ]);

      if (totalUsers.error) throw totalUsers.error;
      if (activeUsers.error) throw activeUsers.error;
      if (pendingUsers.error) throw pendingUsers.error;

      return {
        total: totalUsers.count || 0,
        active: activeUsers.count || 0,
        pending: pendingUsers.count || 0
      };
    },
    enabled: !!organizationId && !!supabase && !!authUser
  });

  // Query for patients, providers, and locations
  const { data: entityData, isLoading: entityLoading } = useQuery({
    queryKey: ['dashboard-entities', organizationId],
    queryFn: async () => {
      if (!organizationId || !supabase || !authUser) return null;

      // Verify the current user's authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Authentication failed');

      const [patients, providers, locations] = await Promise.all([
        supabase.from('patients').select('*').eq('organization_id', organizationId).is('deleted_at', null),
        supabase.from('providers').select('*').eq('organization_id', organizationId).is('deleted_at', null),
        supabase.from('locations').select('*').eq('organization_id', organizationId).is('deleted_at', null)
      ]);

      if (patients.error) throw patients.error;
      if (providers.error) throw providers.error;
      if (locations.error) throw locations.error;

      return {
        patients: patients.data || [],
        providers: providers.data || [],
        locations: locations.data || []
      };
    },
    enabled: !!organizationId && !!supabase && !!authUser
  });

  // Query for activity logs
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['dashboard-activity', organizationId],
    queryFn: async () => {
      if (!organizationId || !supabase || !authUser) return null;

      // Verify the current user's authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Authentication failed');

      // First get all users for the organization
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('organization_id', organizationId);

      if (usersError) throw usersError;
      const userIds = users.map(user => user.id);

      const [failedLogins, recentAlerts] = await Promise.all([
        supabase.from('activity_logs')
          .select('*', { count: 'exact' })
          .in('user_id', userIds)
          .eq('action', 'failed_login'),
        supabase.from('activity_logs')
          .select('*')
          .in('user_id', userIds)
          .order('timestamp', { ascending: false })
          .limit(5)
      ]);

      if (failedLogins.error) throw failedLogins.error;
      if (recentAlerts.error) throw recentAlerts.error;

      return {
        failedLogins: failedLogins.count || 0,
        recentAlerts: recentAlerts.data || []
      };
    },
    enabled: !!organizationId && !!supabase && !!authUser
  });

  const isLoading = authLoading || usersLoading || entityLoading || activityLoading;

  if (isLoading) {
    return (
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
        <Card className="col-span-full">
          <CardHeader>
            <Skeleton className="h-6 w-[150px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-[72px] w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{usersData?.total || 0}</div>
          <p className="text-xs text-muted-foreground">
            {/* Placeholder for percentage change */}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Active Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{usersData?.active || 0}</div>
          <p className="text-xs text-muted-foreground">
            {/* Placeholder for percentage change */}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Pending Account Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{usersData?.pending || 0}</div>
          <p className="text-xs text-muted-foreground">
            {/* Placeholder for change from yesterday */}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Failed Login Attempts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activityData?.failedLogins || 0}</div>
          <p className="text-xs text-muted-foreground">
            {/* Placeholder for change in the last hour */}
          </p>
        </CardContent>
      </Card>
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {activityData?.recentAlerts && activityData.recentAlerts.length > 0 ? (
            <div className="space-y-4">
              {activityData.recentAlerts.map((alert, index) => (
                <Alert key={index} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{alert.action || 'Alert'}</AlertTitle>
                  <AlertDescription>
                    {alert.details || 'No description available.'}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No recent alerts</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

