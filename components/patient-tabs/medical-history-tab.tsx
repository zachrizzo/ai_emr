import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataGrid } from '@/components/data-grid'
import { MedicalHistory } from '@/types'
import { createClient } from '@supabase/supabase-js'
import { toast } from "@/components/ui/use-toast"
import { EditMedicalHistoryDialog } from '@/components/edit-medical-history-dialog'
import { PlusCircle } from 'lucide-react'
import { format } from 'date-fns'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface MedicalHistoryTabProps {
  patientId: string
}

export function MedicalHistoryTab({ patientId }: MedicalHistoryTabProps) {
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditingMedicalHistory, setIsEditingMedicalHistory] = useState(false)

  useEffect(() => {
    fetchMedicalHistory()
  }, [patientId])

  const fetchMedicalHistory = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('medical_history')
        .select('*')
        .eq('patient_id', patientId)

      if (error) throw error
      setMedicalHistory(data)
    } catch (error) {
      console.error("Error fetching medical history:", error)
      toast({
        title: "Error",
        description: "Failed to fetch medical history. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateMedicalHistory = async (updatedHistory: MedicalHistory) => {
    try {
      const { data, error } = await supabase
        .from('medical_history')
        .upsert(updatedHistory)
        .select()

      if (error) throw error

      setMedicalHistory(prevHistory =>
        prevHistory.map(item => item.id === updatedHistory.id ? data[0] : item)
      )
      toast({
        title: "Success",
        description: "Medical history updated successfully.",
      })
    } catch (error) {
      console.error("Error updating medical history:", error)
      toast({
        title: "Error",
        description: "Failed to update medical history. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAddMedicalHistory = async (newHistory: Omit<MedicalHistory, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('medical_history')
        .insert({ ...newHistory, patient_id: patientId })
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        setMedicalHistory(prevHistory => [...prevHistory, data[0]])
        toast({
          title: "Success",
          description: "Medical history added successfully.",
        })
      } else {
        throw new Error("No data returned after insert")
      }
    } catch (error) {
      console.error("Error adding medical history:", error)
      toast({
        title: "Error",
        description: "Failed to add medical history. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMedicalHistory = async (selectedHistory: MedicalHistory[]) => {
    try {
      for (const history of selectedHistory) {
        const { error } = await supabase
          .from('medical_history')
          .delete()
          .eq('id', history.id)

        if (error) throw error
      }
      setMedicalHistory(medicalHistory.filter(history => !selectedHistory.some(selected => selected.id === history.id)))
      toast({
        title: "Success",
        description: "Selected medical history entries deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting medical history:", error)
      toast({
        title: "Error",
        description: "Failed to delete medical history. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) return <div>Loading medical history...</div>

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Medical History</CardTitle>
          <Button onClick={() => setIsEditingMedicalHistory(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Medical History
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataGrid
          data={medicalHistory}
          columns={[
            { 
              header: 'Condition',
              accessorKey: 'condition_name',
            },
            { 
              header: 'Type',
              accessorKey: 'condition_type',
            },
            { 
              header: 'Severity',
              accessorKey: 'severity',
            },
            { 
              header: 'Onset Date',
              accessorKey: 'onset_date',
              cell: ({ row }) => format(new Date(row.original.onset_date), 'MMM d, yyyy')
            },
            { 
              header: 'Status',
              accessorKey: 'is_active',
              cell: ({ row }) => row.original.is_active ? 'Active' : 'Resolved'
            },
            { 
              header: 'Family Member',
              accessorKey: 'family_member',
            },
          ]}
          onEdit={(history) => setIsEditingMedicalHistory(true)}
          onDelete={handleDeleteMedicalHistory}
        />
      </CardContent>
      <EditMedicalHistoryDialog
        isOpen={isEditingMedicalHistory}
        onClose={() => setIsEditingMedicalHistory(false)}
        onUpdateMedicalHistory={handleUpdateMedicalHistory}
        onAddMedicalHistory={handleAddMedicalHistory}
        medicalHistory={medicalHistory}
        patientId={patientId}
      />
    </Card>
  )
}

