'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { supabase } from '@/utils/supabase-config'
import { toast } from '@/components/ui/use-toast'

export function NavBar() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      })
      router.push('/login')
    } catch (error) {
      console.error('Error during logout:', error)
      toast({
        title: "Logout Failed",
        description: "An error occurred during logout. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/admin/dashboard" className="text-xl font-bold">
          EMR Admin
        </Link>
        <Button onClick={handleLogout} variant="ghost">
          Logout
        </Button>
      </div>
    </nav>
  )
}

