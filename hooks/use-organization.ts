import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface Organization {
  id: string
  name: string
  type: string
  status: string
}

export function useOrganization() {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchOrganization() {
      try {
        // Get the current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        // Get the user's organization
        const { data: userData } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single()

        if (userData?.organization_id) {
          // Get organization details
          const { data: orgData } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', userData.organization_id)
            .single()

          if (orgData) {
            setOrganization(orgData)
          }
        }
      } catch (error) {
        console.error('Error fetching organization:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrganization()
  }, [])

  return { organization, loading }
}
