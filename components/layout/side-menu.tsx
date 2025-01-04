'use client'

import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Users,
    CalendarDays,
    MessageSquare,
    FileText,
    Settings,
    Menu,
    User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

const menuItems = [
    {
        title: 'Dashboard',
        href: '/',
        icon: LayoutDashboard,
    },
    {
        title: 'Patients',
        href: '/patients',
        icon: Users,
    },
    {
        title: 'Appointments',
        href: '/appointments',
        icon: CalendarDays,
    },
    {
        title: 'Messages',
        href: '/messages',
        icon: MessageSquare,
    },
    {
        title: 'Documents',
        href: '/documents',
        icon: FileText,
    },
    {
        title: 'Profile',
        href: '/profile',
        icon: User,
    },
    {
        title: 'Settings',
        href: '/settings',
        icon: Settings,
    },
]

export function SideMenu() {
    const pathname = usePathname()
    const router = useRouter()
    const [isCollapsed, setIsCollapsed] = useState(false)

    return (
        <div className={cn(
            "flex flex-col border-r bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-300",
            isCollapsed ? "w-16" : "w-64"
        )}>
            <div className="flex h-14 items-center border-b px-3 justify-between">
                {!isCollapsed && (
                    <span className="font-semibold text-lg">EMR System</span>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    <Menu className="h-4 w-4" />
                </Button>
            </div>
            <div className="flex-1 overflow-auto py-2">
                <nav className="grid gap-1 px-2">
                    {menuItems.map((item) => (
                        <Button
                            key={item.href}
                            variant={pathname === item.href ? "secondary" : "ghost"}
                            className={cn(
                                "justify-start",
                                isCollapsed && "justify-center px-2"
                            )}
                            onClick={() => router.push(item.href)}
                        >
                            <item.icon className={cn(
                                "h-4 w-4",
                                isCollapsed ? "mr-0" : "mr-2"
                            )} />
                            {!isCollapsed && <span>{item.title}</span>}
                        </Button>
                    ))}
                </nav>
            </div>
        </div>
    )
}
