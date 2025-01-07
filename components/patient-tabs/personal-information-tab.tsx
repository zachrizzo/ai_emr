'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Patient, EmergencyContact, Insurance } from '@/types'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { EditPatientDialog } from '@/components/edit-patient-dialog'
import { User } from '@supabase/supabase-js'

interface PersonalInformationTabProps {
  patientId: string
}

const isValidExpirationDate = (date: string) => {
  const expirationDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of day for comparison
  return expirationDate > today; // Changed from >= to >
};

export function PersonalInformationTab({ patientId }: PersonalInformationTabProps) {
  const [patient, setPatient] = useState<Patient | null>(null)
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([])
  const [insurances, setInsurances] = useState<Insurance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    fetchPersonalInformation()
  }, [patientId])

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    fetchCurrentUser()
  }, [])

  const fetchPersonalInformation = async () => {
    setIsLoading(true)
    try {
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single()

      if (patientError) throw patientError
      setPatient(patientData)

      const { data: emergencyContactsData, error: emergencyContactsError } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('patient_id', patientId)
        .eq('organization_id', patientData.organization_id)

      if (emergencyContactsError) throw emergencyContactsError
      setEmergencyContacts(emergencyContactsData)

      const { data: insurancesData, error: insurancesError } = await supabase
        .from('insurances')
        .select('*')
        .eq('patient_id', patientId)

      if (insurancesError) throw insurancesError
      setInsurances(insurancesData)
    } catch (error) {
      console.error("Error fetching personal information:", error)
      toast({
        title: "Error",
        description: "Failed to fetch personal information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdatePatient = async (updatedPatient: Patient, updatedEmergencyContacts: EmergencyContact[], updatedInsurances: Insurance[]) => {
    if (!currentUser) {
      toast({
        title: "Error",
        description: "You must be logged in to update patient information.",
        variant: "destructive",
      })
      return
    }

    try {
      // Update patient information
      const { error: patientError } = await supabase
        .from('patients')
        .update(updatedPatient)
        .eq('id', patientId)

      if (patientError) throw patientError

      // Update emergency contacts
      for (const contact of updatedEmergencyContacts) {
        if (contact.id) {
          // Update existing contact
          const { error } = await supabase
            .from('emergency_contacts')
            .update({
              name: contact.name,
              relationship: contact.relationship,
              phone_number: contact.phone_number
            })
            .eq('id', contact.id)
          if (error) throw error
        } else {
          // Add new contact
          const { error } = await supabase
            .from('emergency_contacts')
            .insert({
              patient_id: patientId,
              organization_id: updatedPatient.organization_id,
              name: contact.name,
              relationship: contact.relationship,
              phone_number: contact.phone_number
            })
          if (error) throw error
        }
      }

      // Delete removed contacts
      const existingContactIds = emergencyContacts.map(c => c.id).filter(id => id !== undefined && id !== null) as string[]
      const updatedContactIds = updatedEmergencyContacts.map(c => c.id).filter(id => id !== undefined && id !== null) as string[]
      const deletedContactIds = existingContactIds.filter(id => !updatedContactIds.includes(id))

      for (const id of deletedContactIds) {
        const { error } = await supabase
          .from('emergency_contacts')
          .delete()
          .eq('id', id)
        if (error) throw error
      }

      // Update insurance information
      for (const insurance of updatedInsurances) {
        if (!isValidExpirationDate(insurance.expiration_date)) {
          toast({
            title: "Error",
            description: `Invalid expiration date for insurance: ${insurance.provider_name}. Please select a future date.`,
            variant: "destructive",
          });
          return; // Exit the function early
        }

        if (insurance.id) {
          // Update existing insurance
          const { error } = await supabase
            .from('insurances')
            .update({
              provider_name: insurance.provider_name,
              policy_number: insurance.policy_number,
              coverage_details: insurance.coverage_details,
              expiration_date: insurance.expiration_date,
              updated_at: new Date().toISOString(),
              created_by: currentUser.id
            })
            .eq('id', insurance.id)
          if (error) throw error
        } else {
          // Add new insurance
          const { error } = await supabase
            .from('insurances')
            .insert({
              patient_id: patientId,
              organization_id: updatedPatient.organization_id,
              provider_name: insurance.provider_name,
              policy_number: insurance.policy_number,
              coverage_details: insurance.coverage_details,
              expiration_date: insurance.expiration_date,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              created_by: currentUser.id
            })
          if (error) throw error
        }
      }

      // Delete removed insurances
      const existingInsuranceIds = insurances.map(i => i.id)
      const updatedInsuranceIds = updatedInsurances.map(i => i.id)
      const deletedInsuranceIds = existingInsuranceIds.filter(id => !updatedInsuranceIds.includes(id))

      for (const id of deletedInsuranceIds) {
        const { error } = await supabase
          .from('insurances')
          .delete()
          .eq('id', id)
        if (error) throw error
      }

      setPatient(updatedPatient)
      setEmergencyContacts(updatedEmergencyContacts)
      setInsurances(updatedInsurances)
      toast({
        title: "Success",
        description: "Patient information updated successfully.",
      })
    } catch (error) {
      console.error("Error updating patient:", error)
      let errorMessage = "Failed to update patient information. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error);
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  if (isLoading) return <div>Loading personal information...</div>
  if (!patient) return <div>No personal information available.</div>

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Personal Information</CardTitle>
          <Button onClick={() => setIsEditDialogOpen(true)}>Edit Information</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><strong>Name:</strong> {patient.first_name} {patient.last_name}</p>
            <p><strong>Date of Birth:</strong> {format(new Date(patient.date_of_birth), 'MMM d, yyyy')}</p>
            <p><strong>Gender:</strong> {patient.gender}</p>
            <p><strong>Address:</strong> {patient.address}</p>
            <p><strong>Phone:</strong> {patient.phone_number}</p>
            <p><strong>Email:</strong> {patient.email}</p>
          </div>
          <div>
            <p><strong>Preferred Language:</strong> {patient.preferred_language}</p>
            <p><strong>Preferred Communication:</strong> {patient.preferred_communication}</p>
            <p><strong>Cultural Considerations:</strong> {patient.cultural_considerations}</p>
          </div>
        </div>
        <h3 className="text-xl font-semibold mt-4 mb-2">Emergency Contacts</h3>
        {emergencyContacts.map((contact, index) => (
          <div key={contact.id} className="mb-2">
            <p><strong>Contact {index + 1}:</strong> {contact.name}</p>
            <p><strong>Relationship:</strong> {contact.relationship}</p>
            <p><strong>Phone:</strong> {contact.phone_number}</p>
          </div>
        ))}
        <h3 className="text-xl font-semibold mt-4 mb-2">Insurance Information</h3>
        {insurances.map((insurance, index) => (
          <div key={insurance.id} className="mb-2">
            <p><strong>Insurance {index + 1}:</strong> {insurance.provider_name}</p>
            <p><strong>Policy Number:</strong> {insurance.policy_number}</p>
            <p><strong>Coverage Details:</strong> {JSON.stringify(insurance.coverage_details)}</p>
            <p><strong>Expiration Date:</strong> {format(new Date(insurance.expiration_date), 'MMM d, yyyy')}</p>
          </div>
        ))}
      </CardContent>
      <EditPatientDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        patient={patient}
        emergencyContacts={emergencyContacts}
        insurances={insurances}
        onUpdatePatient={handleUpdatePatient}
      />
    </Card>
  )
}

