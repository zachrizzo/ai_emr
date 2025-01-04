'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { PatientForm } from '@/components/patient-form'
import { Patient } from '@/types'
import { Checkbox } from "@/components/ui/checkbox"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { supabase } from '@/lib/supabase'
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@/contexts/UserContext'

function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[100px]" />
        <div className="flex space-x-2">
          <Skeleton className="h-9 w-[300px]" />
          <Skeleton className="h-9 w-[100px]" />
        </div>
      </div>
      <div className="border rounded-lg">
        <div className="border-b">
          <div className="grid grid-cols-7 gap-4 p-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-4" />
            ))}
          </div>
        </div>
        <div className="space-y-2 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-7 gap-4">
              {Array.from({ length: 7 }).map((_, j) => (
                <Skeleton key={j} className="h-8" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isAddingPatient, setIsAddingPatient] = useState(false)
  const [selectedPatients, setSelectedPatients] = useState<string[]>([])
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false)
  const router = useRouter()
  const { user } = useUser()
  const queryClient = useQueryClient()

  console.log('Current user state:', user ? 'Logged in' : 'No user');

  const { data: organizationId } = useQuery({
    queryKey: ['organizationId'],
    queryFn: async () => {
      console.log('Fetching organization ID for user:', user?.id);
      const { data, error } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user?.id)
        .single()

      if (error) {
        console.error('Error fetching organization ID:', error);
        throw error;
      }
      console.log('Retrieved organization ID:', data?.organization_id);
      return data?.organization_id
    },
    enabled: !!user,
  })

  console.log('Organization ID query result:', organizationId);

  const { data: patients, isLoading, error } = useQuery({
    queryKey: ['patients', organizationId],
    queryFn: async () => {
      console.log('Attempting to fetch patients for organization:', organizationId);
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('organization_id', organizationId)
        .is('deleted_at', null)

      if (error) {
        console.error('Fetch error:', error);
        throw error;
      }
      console.log('Fetched patients:', data);
      console.log('Number of patients retrieved:', data?.length || 0);
      return data || []
    },
    enabled: !!organizationId,
    refetchOnWindowFocus: true,
    staleTime: 0,
  })

  console.log('Query states:', {
    isLoading,
    hasError: !!error,
    hasPatients: !!patients,
    patientCount: patients?.length || 0
  });

  const addPatientMutation = useMutation({
    mutationFn: async (newPatient: Omit<Patient, 'id'>) => {
      const { data, error } = await supabase
        .from('patients')
        .insert([{ ...newPatient, organization_id: organizationId }])
        .select()

      if (error) throw error
      return data[0]
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['patients'])
      setIsAddingPatient(false)
      toast({
        title: "Success",
        description: "Patient added successfully",
      })
    },
    onError: (error) => {
      console.error("Error adding patient:", error)
      toast({
        title: "Error",
        description: "Failed to add patient. Please try again.",
        variant: "destructive",
      })
    },
  })

  const deletePatientsMutation = useMutation({
    mutationFn: async (patientIds: string[]) => {
      // First verify the patients exist and aren't already deleted
      const { data: existing, error: checkError } = await supabase
        .from('patients')
        .select('id')
        .in('id', patientIds)
        .is('deleted_at', null);

      if (checkError) {
        throw checkError;
      }

      if (!existing?.length) {
        throw new Error('No valid patients to delete');
      }

      // Perform the delete which will trigger our soft delete
      const { error } = await supabase
        .from('patients')
        .delete()
        .in('id', existing.map(p => p.id));

      if (error) {
        throw error;
      }

      return existing;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['patients']);
      setSelectedPatients([]);
      toast({
        title: "Success",
        description: `${data.length} patient(s) removed successfully`,
      });
    },
    onError: (error: any) => {
      console.error("Delete mutation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove patients. Please try again.",
        variant: "destructive",
      });
    },
  });
  const handleAddPatient = (newPatient: Omit<Patient, 'id'>) => {
    addPatientMutation.mutate(newPatient)
  }

  const handleDeletePatients = () => {
    if (selectedPatients.length > 0) {
      console.log('Attempting to delete patients:', selectedPatients);
      deletePatientsMutation.mutate(selectedPatients);
    } else {
      toast({
        title: "Error",
        description: "No patients selected for deletion.",
        variant: "destructive",
      });
    }
  };

  const handlePatientSelection = (patientId: string, isChecked: boolean) => {
    setSelectedPatients(prev =>
      isChecked ? [...prev, patientId] : prev.filter(id => id !== patientId)
    )
  }

  const filteredPatients = patients?.filter(patient =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  console.log('Filtered patients:', filteredPatients.length, 'Search term:', searchTerm);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardContent className="pt-6">
            <TableSkeleton />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Patients</CardTitle>
          <div className="flex space-x-2">
            <Input
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Dialog open={isAddingPatient} onOpenChange={setIsAddingPatient}>
              <DialogTrigger asChild>
                <Button>Add Patient</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Patient</DialogTitle>
                </DialogHeader>
                <PatientForm onSubmit={handleAddPatient} onCancel={() => setIsAddingPatient(false)} organizationId={organizationId || ''} />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <PatientTableSkeleton />
          ) : (
            <>
              <div className="mb-4 flex justify-end space-x-2">
                <Button
                  variant="destructive"
                  onClick={() => setIsAlertDialogOpen(true)}
                  disabled={selectedPatients.length === 0}
                >
                  Delete Selected
                </Button>
              </div>
              <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the selected patient records from the active list.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsAlertDialogOpen(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                      handleDeletePatients();
                      setIsAlertDialogOpen(false);
                    }}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Checkbox
                        checked={selectedPatients.length === filteredPatients.length && filteredPatients.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPatients(filteredPatients.map(p => p.id))
                          } else {
                            setSelectedPatients([])
                          }
                        }}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Date of Birth</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPatients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPatients.includes(patient.id)}
                          onCheckedChange={(checked) => handlePatientSelection(patient.id, checked as boolean)}
                          aria-label={`Select ${patient.full_name}`}
                        />
                      </TableCell>
                      <TableCell>{patient.full_name}</TableCell>
                      <TableCell>{patient.date_of_birth}</TableCell>
                      <TableCell>{patient.gender}</TableCell>
                      <TableCell>{patient.email}</TableCell>
                      <TableCell>{patient.phone_number}</TableCell>
                      <TableCell>
                        <Button variant="outline" onClick={() => router.push(`/patients/${patient.id}`)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

