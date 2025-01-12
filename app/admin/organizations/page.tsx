'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Organization } from '@/types/organization'
import { DataGrid } from '@/components/data-grid'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { OrganizationForm } from '@/components/admin/organization-form'
import { ConfirmDeleteModal } from '@/components/confirm-delete-modal';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null)
  const [organizationToDelete, setOrganizationToDelete] = useState<Organization | null>(null)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from('organizations').select('*')
      if (error) throw error
      setOrganizations(data)
    } catch (error) {
      console.error('Error fetching organizations:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch organizations',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateOrganization = async (organization: Omit<Organization, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase.from('organizations').insert([organization]).select()
      if (error) throw error;
      setOrganizations(prev => [...prev, data[0]])
      setShowForm(false)
      toast({
        title: 'Success',
        description: 'Organization created successfully',
      })
    } catch (error) {
      console.error('Error creating organization:', error)
      toast({
        title: 'Error',
        description: 'Failed to create organization',
        variant: 'destructive'
      })
    }
  }

  const handleUpdateOrganization = async (organization: Omit<Organization, "id" | "created_at" | "updated_at">) => {
    if (!editingOrganization) return;

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          ...organization,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingOrganization.id);

      if (error) throw error;

      setEditingOrganization(null);
      fetchOrganizations();
    } catch (error) {
      console.error('Error updating organization:', error);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!organizationToDelete) return;

    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', organizationToDelete.id)

      if (error) throw error;

      setOrganizations(prev => prev.filter(org => org.id !== organizationToDelete.id))
      toast({
        title: 'Success',
        description: 'Organization deleted successfully',
      })
    } catch (error) {
      console.error('Error deleting organization:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete organization',
        variant: 'destructive'
      })
    } finally {
      setOrganizationToDelete(null)
      setIsConfirmingDelete(false)
    }
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Organizations</CardTitle>
          <Button onClick={() => setShowForm(true)}>Add Organization</Button>
        </CardHeader>
        <CardContent>
          <DataGrid
            columns={[
              { header: 'Name', accessorKey: 'name' },
              { header: 'Address', accessorKey: 'address' },
              { header: 'Phone Number', accessorKey: 'phone_number' },
              { header: 'Email', accessorKey: 'email' },
              { header: 'Status', accessorKey: 'status' },
            ]}
            data={organizations}
            onEdit={(row) => setEditingOrganization(row)}
            onDelete={(rows) => {
              setOrganizationToDelete(rows[0])
              setIsConfirmingDelete(true)
            }}
          />
        </CardContent>
      </Card>
      {showForm && (
        <OrganizationForm
          onSubmit={handleCreateOrganization}
          onCancel={() => setShowForm(false)}
        />
      )}
      {editingOrganization && (
        <OrganizationForm
          initialOrganization={editingOrganization}
          onSubmit={handleUpdateOrganization}
          onCancel={() => setEditingOrganization(null)}
        />
      )}
      <ConfirmDeleteModal
        isOpen={isConfirmingDelete}
        onClose={() => setIsConfirmingDelete(false)}
        onConfirm={handleDeleteOrganization}
        itemName="organization"
      />
    </div>
  )
}

