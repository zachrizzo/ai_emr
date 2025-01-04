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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface ImmunizationsTabProps {
  patientId: string
}

export function ImmunizationsTab({ patientId }: ImmunizationsTabProps) {
  const [immunizations, setImmunizations] = useState<Immunization[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingImmunization, setIsEditingImmunization] = useState(false)

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
        .upsert({ ...updatedImmunization, patient_id: patientId })
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        setImmunizations(prevImmunizations =>
          prevImmunizations.map(item => item.id === updatedImmunization.id ? data[0] : item)
        )
        toast({
          title: "Success",
          description: "Immunization updated successfully.",
        })
      } else {
        throw new Error("No data returned after upsert")
      }
    } catch (error) {
      console.error("Error updating immunization:", error)
      toast({
        title: "Error",
        description: "Failed to update immunization. Please try again.",
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

