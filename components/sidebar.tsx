'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { LayoutDashboard, Users, UserCog, MapPin, Calendar, FileText, Settings, ChevronLeft, ChevronRight, Edit, List, DollarSign, ShieldCheck, CheckSquare, User, Printer } from 'lucide-react'

function getUncompletedTasksCount() {
  // This is a mock implementation. In a real app, you'd fetch this from your state or API
  return 3; // Change this to 0 to test when there are no uncompleted tasks
}

const sidebarItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, notificationCount: getUncompletedTasksCount },
  { name: 'Patients', href: '/patients', icon: Users },
  { name: 'Providers', href: '/providers', icon: UserCog },
  { name: 'Locations', href: '/locations', icon: MapPin },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Document Builder', href: '/document-builder', icon: Edit },
  { name: 'Fax', href: '/fax', icon: Printer },
  { name: 'Billing', href: '/billing', icon: DollarSign },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Admin Dashboard', href: '/admin/dashboard', icon: ShieldCheck },
  { name: 'Profile', href: '/profile', icon: User },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={cn(
      "flex flex-col border-r bg-gray-100/40 transition-all duration-300 ease-in-out dark:bg-gray-800/40",
      isCollapsed ? "w-[60px]" : "w-[200px]"
    )}>
      <div className="flex h-[60px] items-center justify-between px-2 py-2">
        {!isCollapsed && (
          <Link className="flex items-center gap-2 font-semibold" href="/">
            <FileText className="h-6 w-6" />
            <span className="">EMR System</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-2 py-2">
          {sidebarItems.map((item) => (
            <Button
              key={item.name}
              asChild
              variant="ghost"
              className={cn(
                "w-full justify-start",
                pathname === item.href && "bg-gray-200 dark:bg-gray-700",
                isCollapsed && "justify-center"
              )}
            >
              <Link href={item.href} className="relative">
                <item.icon className={cn("h-4 w-4", isCollapsed ? "mr-0" : "mr-2")} />
                {!isCollapsed && <span>{item.name}</span>}
                {item.notificationCount && item.notificationCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center z-[100]">
                    {item.notificationCount()}
                  </span>
                )}
              </Link>
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

