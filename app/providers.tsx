'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { AuthProvider } from '@/components/auth/auth-provider'
import { UserProvider } from '@/contexts/UserContext'
import { LocationProvider } from '@/contexts/LocationContext'
import { ProviderProvider } from '@/contexts/ProviderContext'
import { PatientProvider } from '@/contexts/PatientContext'
import { AppointmentProvider } from '@/contexts/AppointmentContext'
import { Toaster } from '@/components/ui/toaster'
import { AppLayout } from '@/components/layout/app-layout'

export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000, // 1 minute
                        refetchOnWindowFocus: false,
                    },
                },
            })
    )

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <UserProvider>
                    <LocationProvider>
                        <ProviderProvider>
                            <PatientProvider>
                                <AppointmentProvider>
                                    <AppLayout>
                                        {children}
                                    </AppLayout>
                                    <Toaster />
                                </AppointmentProvider>
                            </PatientProvider>
                        </ProviderProvider>
                    </LocationProvider>
                </UserProvider>
            </AuthProvider>
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    )
}
