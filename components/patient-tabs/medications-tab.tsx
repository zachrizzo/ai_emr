import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataGrid } from '@/components/data-grid'
import { Medication } from '@/types'
import { createClient } from '@supabase/supabase-js'
import { toast } from "@/components/ui/use-toast"
import { EditMedicationDialog } from '@/components/edit-medication-dialog'
import { PlusCircle } from 'lucide-react'
import { format } from 'date-fns'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface MedicationsTabProps {
  patientId: string
}

export function MedicationsTab({ patientId }: MedicationsTabProps) {
  const [medications, setMedications] = useState<Medication[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingMedication, setIsEditingMedication] = useState(false)

  useEffect(() => {
    fetchMedications()
  }, [patientId])

  const fetchMedications = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .eq('patient_id', patientId)

      if (error) throw error
      setMedications(data)
    } catch (error) {
      console.error("Error fetching medications:", error)
      toast({
        title: "Error",
        description: "Failed to fetch medications. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateMedication = async (updatedMedication: Medication) => {
    try {
      const { data, error } = await supabase
        .from('medications')
        .upsert({ ...updatedMedication, patient_id: patientId })
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        setMedications(prevMedications =>
          prevMedications.map(item => item.id === updatedMedication.id ? data[0] : item)
        )
        toast({
          title: "Success",
          description: "Medication updated successfully.",
        })
      } else {
        throw new Error("No data returned after upsert")
      }
    } catch (error) {
      console.error("Error updating medication:", error)
      toast({
        title: "Error",
        description: "Failed to update medication. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMedications = async (selectedMedications: Medication[]) => {
    try {
      for (const medication of selectedMedications) {
        const { error } = await supabase
          .from('medications')
          .delete()
          .eq('id', medication.id)

        if (error) throw error
      }
      setMedications(medications.filter(medication => !selectedMedications.some(selected => selected.id === medication.id)))
      toast({
        title: "Success",
        description: "Selected medications deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting medications:", error)
      toast({
        title: "Error",
        description: "Failed to delete medications. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) return <div>Loading medications...</div>

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Medications</CardTitle>
          <Button onClick={() => setIsEditingMedication(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Medication
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataGrid
          data={medications}
          columns={[
            { header: 'Medication Name', accessorKey: 'medication_name' },
            { header: 'Dosage', accessorKey: 'dosage' },
            { header: 'Frequency', accessorKey: 'frequency' },
            { 
              header: 'Start Date', 
              accessorKey: 'start_date',
              cell: ({ row }) => format(new Date(row.original.start_date), 'MMM d, yyyy')
            },
            { 
              header: 'End Date', 
              accessorKey: 'end_date',
              cell: ({ row }) => row.original.end_date ? format(new Date(row.original.end_date), 'MMM d, yyyy') : 'Ongoing'
            },
          ]}
          onEdit={(medication) => setIsEditingMedication(true)}
          onDelete={handleDeleteMedications}
        />
      </CardContent>
      <EditMedicationDialog
        isOpen={isEditingMedication}
        onClose={() => setIsEditingMedication(false)}
        onUpdateMedication={handleUpdateMedication}
        medications={medications}
        patientId={patientId}
      />
    </Card>
  )
}

