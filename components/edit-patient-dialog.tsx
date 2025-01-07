'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Patient, EmergencyContact, Insurance } from '@/types'
import { PlusCircle, Trash2 } from 'lucide-react'

interface EditPatientDialogProps {
  isOpen: boolean
  onClose: () => void
  patient: Patient
  emergencyContacts: EmergencyContact[]
  insurances: Insurance[]
  onUpdatePatient: (updatedPatient: Patient, updatedEmergencyContacts: EmergencyContact[], updatedInsurances: Insurance[]) => void
}

interface CoverageDetails {
  deductible?: number;
  coinsurance?: number;
  copay?: number;
  outOfPocketMax?: number;
}

export function EditPatientDialog({ isOpen, onClose, patient, emergencyContacts, insurances, onUpdatePatient }: EditPatientDialogProps) {
  const [editedPatient, setEditedPatient] = useState<Patient>(patient)
  const [editedEmergencyContacts, setEditedEmergencyContacts] = useState<EmergencyContact[]>(emergencyContacts)
  const [editedInsurances, setEditedInsurances] = useState<Insurance[]>(insurances)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdatePatient(editedPatient, editedEmergencyContacts, editedInsurances)
    onClose()
  }

  const addEmergencyContact = () => {
    setEditedEmergencyContacts([...editedEmergencyContacts, {
      id: null,
      patient_id: patient.id,
      name: '',
      relationship: '',
      phone_number: '',
      organization_id: patient.organization_id
    }])
  }

  const removeEmergencyContact = (index: number) => {
    setEditedEmergencyContacts(editedEmergencyContacts.filter((_, i) => i !== index))
  }

  const addInsurance = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setEditedInsurances([...editedInsurances, {
      id: 0,
      patient_id: patient.id,
      provider_name: '',
      policy_number: '',
      coverage_details: {},
      expiration_date: tomorrow.toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      organization_id: patient.organization_id,
      created_by: patient.id
    }])
  }

  const removeInsurance = (index: number) => {
    setEditedInsurances(editedInsurances.filter((_, i) => i !== index))
  }

  const updateCoverageDetails = (index: number, field: keyof CoverageDetails, value: string) => {
    const newInsurances = [...editedInsurances]
    const coverageDetails = newInsurances[index].coverage_details as CoverageDetails
    coverageDetails[field] = value ? Number(value) : undefined
    newInsurances[index].coverage_details = coverageDetails
    setEditedInsurances(newInsurances)
  }

  const getTodayString = () => {
    return new Date().toISOString().split('T')[0]
  }

  const getTomorrowString = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Patient Information</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={editedPatient.first_name}
                onChange={(e) => setEditedPatient({ ...editedPatient, first_name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={editedPatient.last_name}
                onChange={(e) => setEditedPatient({ ...editedPatient, last_name: e.target.value })}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={editedPatient.date_of_birth}
              onChange={(e) => setEditedPatient({ ...editedPatient, date_of_birth: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select
              value={editedPatient.gender}
              onValueChange={(value) => setEditedPatient({ ...editedPatient, gender: value })}
            >
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={editedPatient.address}
              onChange={(e) => setEditedPatient({ ...editedPatient, address: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone_number">Phone Number</Label>
              <Input
                id="phone_number"
                value={editedPatient.phone_number}
                onChange={(e) => setEditedPatient({ ...editedPatient, phone_number: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editedPatient.email}
                onChange={(e) => setEditedPatient({ ...editedPatient, email: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="preferred_language">Preferred Language</Label>
            <Input
              id="preferred_language"
              value={editedPatient.preferred_language}
              onChange={(e) => setEditedPatient({ ...editedPatient, preferred_language: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="preferred_communication">Preferred Communication</Label>
            <Select
              value={editedPatient.preferred_communication}
              onValueChange={(value) => setEditedPatient({ ...editedPatient, preferred_communication: value })}
            >
              <SelectTrigger id="preferred_communication">
                <SelectValue placeholder="Select preferred communication" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="text">Text</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="cultural_considerations">Cultural Considerations</Label>
            <Textarea
              id="cultural_considerations"
              value={editedPatient.cultural_considerations}
              onChange={(e) => setEditedPatient({ ...editedPatient, cultural_considerations: e.target.value })}
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Emergency Contacts</h3>
            {editedEmergencyContacts.map((contact, index) => (
              <div key={index} className="grid grid-cols-3 gap-4 mb-4 p-4 border rounded-lg relative">
                <div>
                  <Label htmlFor={`contact-name-${index}`}>Name</Label>
                  <Input
                    id={`contact-name-${index}`}
                    placeholder="Name"
                    value={contact.name}
                    onChange={(e) => {
                      const newContacts = [...editedEmergencyContacts]
                      newContacts[index].name = e.target.value
                      setEditedEmergencyContacts(newContacts)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor={`contact-relationship-${index}`}>Relationship</Label>
                  <Input
                    id={`contact-relationship-${index}`}
                    placeholder="Relationship"
                    value={contact.relationship}
                    onChange={(e) => {
                      const newContacts = [...editedEmergencyContacts]
                      newContacts[index].relationship = e.target.value
                      setEditedEmergencyContacts(newContacts)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor={`contact-phone-${index}`}>Phone</Label>
                  <Input
                    id={`contact-phone-${index}`}
                    placeholder="Phone"
                    value={contact.phone_number}
                    onChange={(e) => {
                      const newContacts = [...editedEmergencyContacts]
                      newContacts[index].phone_number = e.target.value
                      setEditedEmergencyContacts(newContacts)
                    }}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeEmergencyContact(index)}
                  className="absolute top-2 right-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addEmergencyContact}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Emergency Contact
            </Button>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Insurance Information</h3>
            {editedInsurances.map((insurance, index) => (
              <div key={index} className="grid grid-cols-2 gap-4 mb-4 p-4 border rounded-lg relative">
                <div>
                  <Label htmlFor={`insurance-provider-${index}`}>Provider Name</Label>
                  <Input
                    id={`insurance-provider-${index}`}
                    placeholder="Provider Name"
                    value={insurance.provider_name}
                    onChange={(e) => {
                      const newInsurances = [...editedInsurances]
                      newInsurances[index].provider_name = e.target.value
                      setEditedInsurances(newInsurances)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor={`insurance-policy-${index}`}>Policy Number</Label>
                  <Input
                    id={`insurance-policy-${index}`}
                    placeholder="Policy Number"
                    value={insurance.policy_number}
                    onChange={(e) => {
                      const newInsurances = [...editedInsurances]
                      newInsurances[index].policy_number = e.target.value
                      setEditedInsurances(newInsurances)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor={`insurance-deductible-${index}`}>Deductible ($)</Label>
                  <Input
                    id={`insurance-deductible-${index}`}
                    type="number"
                    placeholder="Deductible"
                    value={(insurance.coverage_details as CoverageDetails).deductible || ''}
                    onChange={(e) => updateCoverageDetails(index, 'deductible', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`insurance-coinsurance-${index}`}>Coinsurance (%)</Label>
                  <Input
                    id={`insurance-coinsurance-${index}`}
                    type="number"
                    placeholder="Coinsurance"
                    value={(insurance.coverage_details as CoverageDetails).coinsurance || ''}
                    onChange={(e) => updateCoverageDetails(index, 'coinsurance', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`insurance-copay-${index}`}>Copay ($)</Label>
                  <Input
                    id={`insurance-copay-${index}`}
                    type="number"
                    placeholder="Copay"
                    value={(insurance.coverage_details as CoverageDetails).copay || ''}
                    onChange={(e) => updateCoverageDetails(index, 'copay', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`insurance-out-of-pocket-${index}`}>Out-of-Pocket Maximum ($)</Label>
                  <Input
                    id={`insurance-out-of-pocket-${index}`}
                    type="number"
                    placeholder="Out-of-Pocket Maximum"
                    value={(insurance.coverage_details as CoverageDetails).outOfPocketMax || ''}
                    onChange={(e) => updateCoverageDetails(index, 'outOfPocketMax', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`insurance-expiration-${index}`}>Expiration Date</Label>
                  <Input
                    id={`insurance-expiration-${index}`}
                    type="date"
                    min={getTomorrowString()}
                    value={insurance.expiration_date ? insurance.expiration_date.split('T')[0] : getTomorrowString()}
                    onChange={(e) => {
                      const newInsurances = [...editedInsurances]
                      newInsurances[index].expiration_date = e.target.value ? new Date(e.target.value).toISOString() : getTomorrowString()
                      setEditedInsurances(newInsurances)
                    }}
                    required
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeInsurance(index)}
                  className="absolute top-2 right-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={addInsurance}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Insurance
            </Button>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

