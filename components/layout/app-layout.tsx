'use client'

import { useUser } from '@/contexts/UserContext'
import { Sidebar } from '@/components/sidebar'

interface AppLayoutProps {
    children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
    const { user, loading } = useUser()

    // During loading, show the content without the sidebar
    if (loading) {
        return <>{children}</>
    }

    // If no user after loading is complete, show content without sidebar
    if (!user) {
        return <>{children}</>
    }

    return (
        <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    )
}
