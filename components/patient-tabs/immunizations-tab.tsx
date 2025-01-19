import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataGrid } from '@/components/data-grid'
import { Immunization } from '@/types'
import { createClient } from '@supabase/supabase-js'
import { toast } from "@/components/ui/use-toast"
import { EditImmunizationDialog } from '@/components/edit-immunization-dialog'
import { PlusCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useUser } from '@/contexts/UserContext'
import { supabase } from '@/utils/supabase-config'


interface ImmunizationsTabProps {
  patientId: string
}

export function ImmunizationsTab({ patientId }: ImmunizationsTabProps) {
  const [immunizations, setImmunizations] = useState<Immunization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingImmunization, setIsEditingImmunization] = useState(false)
  const { userData } = useUser()

  useEffect(() => {
    fetchImmunizations()
  }, [patientId])

  const fetchImmunizations = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('immunizations')
        .select('*')
        .eq('patient_id', patientId)

      if (error) throw error
      setImmunizations(data)
    } catch (error) {
      console.error("Error fetching immunizations:", error)
      toast({
        title: "Error",
        description: "Failed to fetch immunizations. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateImmunization = async (updatedImmunization: Immunization) => {
    try {
      const { data, error } = await supabase
        .from('immunizations')
        .upsert({
          ...updatedImmunization,
          patient_id: patientId,
          organization_id: userData?.organization_id,
          administered_by: userData?.id
        })
        .select()

      if (error) {
        console.error('Supabase error details:', error)
        throw error
      }

      if (data && data.length > 0) {
        if (updatedImmunization.id) {
          setImmunizations(prevImmunizations =>
            prevImmunizations.map(item => item.id === updatedImmunization.id ? data[0] : item)
          )
        } else {
          setImmunizations(prevImmunizations => [...prevImmunizations, data[0]])
        }

        toast({
          title: "Success",
          description: `Immunization ${updatedImmunization.id ? 'updated' : 'added'} successfully.`,
        })
        setIsEditingImmunization(false)
      } else {
        throw new Error("No data returned after upsert")
      }
    } catch (error) {
      console.error("Error updating immunization:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update immunization. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteImmunizations = async (selectedImmunizations: Immunization[]) => {
    try {
      for (const immunization of selectedImmunizations) {
        const { error } = await supabase
          .from('immunizations')
          .delete()
          .eq('id', immunization.id)

        if (error) throw error
      }
      setImmunizations(immunizations.filter(immunization => !selectedImmunizations.some(selected => selected.id === immunization.id)))
      toast({
        title: "Success",
        description: "Selected immunizations deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting immunizations:", error)
      toast({
        title: "Error",
        description: "Failed to delete immunizations. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) return <div>Loading immunizations...</div>

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Immunizations</CardTitle>
          <Button onClick={() => setIsEditingImmunization(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Immunization
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataGrid
          data={immunizations}
          columns={[
            { header: 'Vaccine Name', accessorKey: 'vaccine_name' },
            {
              header: 'Date Administered',
              accessorKey: 'date_administered',
              cell: ({ row }) => format(new Date(row.original.date_administered), 'MMM d, yyyy')
            },
            { header: 'Provider', accessorKey: 'provider' },
            { header: 'Notes', accessorKey: 'notes' },
          ]}
          onEdit={(immunization) => setIsEditingImmunization(true)}
          onDelete={handleDeleteImmunizations}
        />
      </CardContent>
      <EditImmunizationDialog
        isOpen={isEditingImmunization}
        onClose={() => setIsEditingImmunization(false)}
        onUpdateImmunization={handleUpdateImmunization}
        immunizations={immunizations}
        patientId={patientId}
      />
    </Card>
  )
}

