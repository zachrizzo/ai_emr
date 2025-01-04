'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Patient, Medication, Insurance } from '@/types'
import { toast } from '@/components/ui/use-toast'
import { Plus, Minus } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export function AddPatientDialog() {
  const [newPatient, setNewPatient] = useState<Omit<Patient, 'id'>>({
    personalInfo: {
      fullName: '',
      dateOfBirth: '',
      gender: 'Male',
      address: '',
      phoneNumbers: {
        mobile: '',
        home: '',
        work: ''
      },
      email: '',
      emergencyContact: {
        name: '',
        relationship: '',
        phoneNumber: ''
      }
    },
    insuranceInfo: [{
      provider: '',
      policyNumber: '',
      groupNumber: '',
      subscriberName: '',
      relationshipToSubscriber: '',
      coverageStartDate: '',
      coverageEndDate: ''
    }],
    medicalHistory: {
      pastMedicalConditions: [],
      surgicalHistory: [],
      hospitalizations: [],
      familyMedicalHistory: [],
      chronicConditions: []
    },
    allergies: [],
    currentMedications: [{
      name: '',
      dosage: '',
      frequency: '',
      startDate: '',
      endDate: ''
    }],
    immunizationRecords: [],
    previousDoctors: [],
    lifestyleInfo: {
      smokingStatus: 'never',
      alcoholUse: '',
      drugUse: '',
      dietAndExercise: '',
      occupation: '',
      stressLevels: '',
      mentalHealthStatus: ''
    },
    currentSymptoms: [{
      description: '',
      duration: '',
      severity: ''
    }],
    vitalSigns: {
      height: 0,
      weight: 0,
      bmi: 0,
      bloodPressure: '',
      heartRate: 0,
      respiratoryRate: 0,
      temperature: 0,
      oxygenSaturation: 0
    },
    consentDocuments: [{
      type: '',
      signedDate: ''
    }],
    visits: [],
    preferences: {
      preferredPharmacy: '',
      languagePreference: '',
      preferredCommunicationMethod: 'phone',
      culturalConsiderations: ''
    },
    documents: []
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert([newPatient])
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        toast({
          title: 'Success',
          description: 'Patient added successfully'
        })

        // Reset form
        setNewPatient({
          personalInfo: {
            fullName: '',
            dateOfBirth: '',
            gender: 'Male',
            address: '',
            phoneNumbers: { mobile: '', home: '', work: '' },
            email: '',
            emergencyContact: { name: '', relationship: '', phoneNumber: '' }
          },
          insuranceInfo: [{ provider: '', policyNumber: '', groupNumber: '', subscriberName: '', relationshipToSubscriber: '', coverageStartDate: '', coverageEndDate: '' }],
          medicalHistory: { pastMedicalConditions: [], surgicalHistory: [], hospitalizations: [], familyMedicalHistory: [], chronicConditions: [] },
          allergies: [],
          currentMedications: [{ name: '', dosage: '', frequency: '', startDate: '', endDate: '' }],
          immunizationRecords: [],
          previousDoctors: [],
          lifestyleInfo: { smokingStatus: 'never', alcoholUse: '', drugUse: '', dietAndExercise: '', occupation: '', stressLevels: '', mentalHealthStatus: '' },
          currentSymptoms: [{ description: '', duration: '', severity: '' }],
          vitalSigns: { height: 0, weight: 0, bmi: 0, bloodPressure: '', heartRate: 0, respiratoryRate: 0, temperature: 0, oxygenSaturation: 0 },
          consentDocuments: [{ type: '', signedDate: '' }],
          visits: [],
          preferences: { preferredPharmacy: '', languagePreference: '', preferredCommunicationMethod: 'phone', culturalConsiderations: '' },
          documents: []
        })
      }
    } catch (error) {
      console.error('Error adding patient:', error)
      toast({
        title: 'Error',
        description: 'Failed to add patient. Please try again.',
        variant: 'destructive'
      })
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Add Patient</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Patient</DialogTitle>
          <DialogDescription>Enter patient information across multiple sections</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="medical">Medical</TabsTrigger>
              <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
              <TabsTrigger value="insurance">Insurance</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>
            <TabsContent value="personal" className="space-y-4">
              {/* Personal Information Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={newPatient.personalInfo.fullName}
                    onChange={(e) => setNewPatient({
                      ...newPatient,
                      personalInfo: { ...newPatient.personalInfo, fullName: e.target.value }
                    })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={newPatient.personalInfo.dateOfBirth}
                    onChange={(e) => setNewPatient({
                      ...newPatient,
                      personalInfo: { ...newPatient.personalInfo, dateOfBirth: e.target.value }
                    })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={newPatient.personalInfo.gender}
                    onValueChange={(value) => setNewPatient({
                      ...newPatient,
                      personalInfo: { ...newPatient.personalInfo, gender: value as 'Male' | 'Female' | 'Other' }
                    })}
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
                  <Input
                    id="address"
                    value={newPatient.personalInfo.address}
                    onChange={(e) => setNewPatient({
                      ...newPatient,
                      personalInfo: { ...newPatient.personalInfo, address: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newPatient.personalInfo.email}
                    onChange={(e) => setNewPatient({
                      ...newPatient,
                      personalInfo: { ...newPatient.personalInfo, email: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="phoneHome">Home Phone</Label>
                  <Input
                    id="phoneHome"
                    value={newPatient.personalInfo.phoneNumbers.home}
                    onChange={(e) => setNewPatient({
                      ...newPatient,
                      personalInfo: {
                        ...newPatient.personalInfo,
                        phoneNumbers: { ...newPatient.personalInfo.phoneNumbers, home: e.target.value }
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="phoneMobile">Mobile Phone</Label>
                  <Input
                    id="phoneMobile"
                    value={newPatient.personalInfo.phoneNumbers.mobile}
                    onChange={(e) => setNewPatient({
                      ...newPatient,
                      personalInfo: {
                        ...newPatient.personalInfo,
                        phoneNumbers: { ...newPatient.personalInfo.phoneNumbers, mobile: e.target.value }
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="phoneWork">Work Phone</Label>
                  <Input
                    id="phoneWork"
                    value={newPatient.personalInfo.phoneNumbers.work}
                    onChange={(e) => setNewPatient({
                      ...newPatient,
                      personalInfo: {
                        ...newPatient.personalInfo,
                        phoneNumbers: { ...newPatient.personalInfo.phoneNumbers, work: e.target.value }
                      }
                    })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Emergency Contact</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="emergencyName">Name</Label>
                    <Input
                      id="emergencyName"
                      value={newPatient.personalInfo.emergencyContact.name}
                      onChange={(e) => setNewPatient({
                        ...newPatient,
                        personalInfo: {
                          ...newPatient.personalInfo,
                          emergencyContact: { ...newPatient.personalInfo.emergencyContact, name: e.target.value }
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyRelationship">Relationship</Label>
                    <Input
                      id="emergencyRelationship"
                      value={newPatient.personalInfo.emergencyContact.relationship}
                      onChange={(e) => setNewPatient({
                        ...newPatient,
                        personalInfo: {
                          ...newPatient.personalInfo,
                          emergencyContact: { ...newPatient.personalInfo.emergencyContact, relationship: e.target.value }
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyPhone">Phone</Label>
                    <Input
                      id="emergencyPhone"
                      value={newPatient.personalInfo.emergencyContact.phoneNumber}
                      onChange={(e) => setNewPatient({
                        ...newPatient,
                        personalInfo: {
                          ...newPatient.personalInfo,
                          emergencyContact: { ...newPatient.personalInfo.emergencyContact, phoneNumber: e.target.value }
                        }
                      })}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="medical" className="space-y-4">
              {/* Medical History Fields */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Medical History</h3>
                <div>
                  <Label htmlFor="pastConditions">Past Medical Conditions</Label>
                  <Textarea
                    id="pastConditions"
                    value={newPatient.medicalHistory.pastMedicalConditions.join(', ')}
                    onChange={(e) => setNewPatient({
                      ...newPatient,
                      medicalHistory: {
                        ...newPatient.medicalHistory,
                        pastMedicalConditions: e.target.value.split(', ')
                      }
                    })}
                    placeholder="Enter conditions separated by commas"
                  />
                </div>
                <div>
                  <Label htmlFor="surgicalHistory">Surgical History</Label>
                  <Textarea
                    id="surgicalHistory"
                    value={newPatient.medicalHistory.surgicalHistory.join(', ')}
                    onChange={(e) => setNewPatient({
                      ...newPatient,
                      medicalHistory: {
                        ...newPatient.medicalHistory,
                        surgicalHistory: e.target.value.split(', ')
                      }
                    })}
                    placeholder="Enter surgeries separated by commas"
                  />
                </div>
                <div>
                  <Label htmlFor="familyHistory">Family Medical History</Label>
                  <Textarea
                    id="familyHistory"
                    value={newPatient.medicalHistory.familyMedicalHistory.join(', ')}
                    onChange={(e) => setNewPatient({
                      ...newPatient,
                      medicalHistory: {
                        ...newPatient.medicalHistory,
                        familyMedicalHistory: e.target.value.split(', ')
                      }
                    })}
                    placeholder="Enter family medical history separated by commas"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Allergies</h3>
                <div>
                  <Label htmlFor="allergies"><Label htmlFor="allergies">Allergies</Label>
                    <Textarea
                      id="allergies"
                      value={newPatient.allergies.join(', ')}
                      onChange={(e) => setNewPatient({
                        ...newPatient,
                        allergies: e.target.value.split(', ')
                      })}
                      placeholder="Enter allergies separated by commas"
                    />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Current Medications</h3>
                {newPatient.currentMedications.map((medication, index) => (
                  <div key={index} className="grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Medication Name"
                      value={medication.name}
                      onChange={(e) => {
                        const updatedMedications = [...newPatient.currentMedications];
                        updatedMedications[index].name = e.target.value;
                        setNewPatient({
                          ...newPatient,
                          currentMedications: updatedMedications
                        });
                      }}
                    />
                    <Input
                      placeholder="Dosage"
                      value={medication.dosage}
                      onChange={(e) => {
                        const updatedMedications = [...newPatient.currentMedications];
                        updatedMedications[index].dosage = e.target.value;
                        setNewPatient({
                          ...newPatient,
                          currentMedications: updatedMedications
                        });
                      }}
                    />
                    <Input
                      placeholder="Frequency"
                      value={medication.frequency}
                      onChange={(e) => {
                        const updatedMedications = [...newPatient.currentMedications];
                        updatedMedications[index].frequency = e.target.value;
                        setNewPatient({
                          ...newPatient,
                          currentMedications: updatedMedications
                        });
                      }}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  onClick={() => setNewPatient({
                    ...newPatient,
                    currentMedications: [...newPatient.currentMedications, { name: '', dosage: '', frequency: '', startDate: '', endDate: '' }]
                  })}
                >
                  Add Medication
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="lifestyle" className="space-y-4">
              {/* Lifestyle Information Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smokingStatus">Smoking Status</Label>
                  <Select
                    value={newPatient.lifestyleInfo.smokingStatus}
                    onValueChange={(value) => setNewPatient({
                      ...newPatient,
                      lifestyleInfo: { ...newPatient.lifestyleInfo, smokingStatus: value as 'current' | 'former' | 'never' }
                    })}
                  >
                    <SelectTrigger id="smokingStatus">
                      <SelectValue placeholder="Select smoking status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="current">Current</SelectItem>
                      <SelectItem value="former">Former</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="alcoholUse">Alcohol Use</Label>
                  <Input
                    id="alcoholUse"
                    value={newPatient.lifestyleInfo.alcoholUse}
                    onChange={(e) => setNewPatient({
                      ...newPatient,
                      lifestyleInfo: { ...newPatient.lifestyleInfo, alcoholUse: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="drugUse">Drug Use</Label>
                  <Input
                    id="drugUse"
                    value={newPatient.lifestyleInfo.drugUse}
                    onChange={(e) => setNewPatient({
                      ...newPatient,
                      lifestyleInfo: { ...newPatient.lifestyleInfo, drugUse: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="dietAndExercise">Diet and Exercise</Label>
                  <Textarea
                    id="dietAndExercise"
                    value={newPatient.lifestyleInfo.dietAndExercise}
                    onChange={(e) => setNewPatient({
                      ...newPatient,
                      lifestyleInfo: { ...newPatient.lifestyleInfo, dietAndExercise: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="occupation">Occupation</Label>
                  <Input
                    id="occupation"
                    value={newPatient.lifestyleInfo.occupation}
                    onChange={(e) => setNewPatient({
                      ...newPatient,
                      lifestyleInfo: { ...newPatient.lifestyleInfo, occupation: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="stressLevels">Stress Levels</Label>
                  <Input
                    id="stressLevels"
                    value={newPatient.lifestyleInfo.stressLevels}
                    onChange={(e) => setNewPatient({
                      ...newPatient,
                      lifestyleInfo: { ...newPatient.lifestyleInfo, stressLevels: e.target.value }
                    })}
                  />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="insurance" className="space-y-4">
              {/* Insurance Information Fields */}
              {newPatient.insuranceInfo.map((insurance, index) => (
                <div key={index} className="space-y-2 border p-4 rounded">
                  <h3 className="text-lg font-semibold">Insurance {index + 1}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`provider-${index}`}>Provider</Label>
                      <Input
                        id={`provider-${index}`}
                        value={insurance.provider}
                        onChange={(e) => {
                          const updatedInsurance = [...newPatient.insuranceInfo];
                          updatedInsurance[index].provider = e.target.value;
                          setNewPatient({
                            ...newPatient,
                            insuranceInfo: updatedInsurance
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`policyNumber-${index}`}>Policy Number</Label>
                      <Input
                        id={`policyNumber-${index}`}
                        value={insurance.policyNumber}
                        onChange={(e) => {
                          const updatedInsurance = [...newPatient.insuranceInfo];
                          updatedInsurance[index].policyNumber = e.target.value;
                          setNewPatient({
                            ...newPatient,
                            insuranceInfo: updatedInsurance
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`groupNumber-${index}`}>Group Number</Label>
                      <Input
                        id={`groupNumber-${index}`}
                        value={insurance.groupNumber}
                        onChange={(e) => {
                          const updatedInsurance = [...newPatient.insuranceInfo];
                          updatedInsurance[index].groupNumber = e.target.value;
                          setNewPatient({
                            ...newPatient,
                            insuranceInfo: updatedInsurance
                          });
                        }}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`subscriberName-${index}`}>Subscriber Name</Label>
                      <Input
                        id={`subscriberName-${index}`}
                        value={insurance.subscriberName}
                        onChange={(e) => {
                          const updatedInsurance = [...newPatient.insuranceInfo];
                          updatedInsurance[index].subscriberName = e.target.value;
                          setNewPatient({
                            ...newPatient,
                            insuranceInfo: updatedInsurance
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                onClick={() => setNewPatient({
                  ...newPatient,
                  insuranceInfo: [...newPatient.insuranceInfo, { provider: '', policyNumber: '', groupNumber: '', subscriberName: '', relationshipToSubscriber: '', coverageStartDate: '', coverageEndDate: '' }]
                })}
              >
                Add Insurance
              </Button>
            </TabsContent>
            <TabsContent value="preferences" className="space-y-4">
              {/* Patient Preferences Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="preferredPharmacy">Preferred Pharmacy</Label>
                  <Input
                    id="preferredPharmacy"
                    value={newPatient.preferences.preferredPharmacy}
                    onChange={(e) => setNewPatient({
                      ...newPatient,
                      preferences: { ...newPatient.preferences, preferredPharmacy: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="languagePreference">Language Preference</Label>
                  <Input
                    id="languagePreference"
                    value={newPatient.preferences.languagePreference}
                    onChange={(e) => setNewPatient({
                      ...newPatient,
                      preferences: { ...newPatient.preferences, languagePreference: e.target.value }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="communicationMethod">Preferred Communication Method</Label>
                  <Select
                    value={newPatient.preferences.preferredCommunicationMethod}
                    onValueChange={(value) => setNewPatient({
                      ...newPatient,
                      preferences: { ...newPatient.preferences, preferredCommunicationMethod: value as 'phone' | 'email' | 'text' }
                    })}
                  >
                    <SelectTrigger id="communicationMethod">
                      <SelectValue placeholder="Select communication method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="culturalConsiderations">Cultural Considerations</Label>
                  <Textarea
                    id="culturalConsiderations"
                    value={newPatient.preferences.culturalConsiderations}
                    onChange={(e) => setNewPatient({
                      ...newPatient,
                      preferences: { ...newPatient.preferences, culturalConsiderations: e.target.value }
                    })}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <div className="mt-6 flex justify-end space-x-2">
            <Button type="button" variant="outline">Cancel</Button>
            <Button type="submit">Add Patient</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

