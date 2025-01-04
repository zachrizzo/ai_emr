'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"

interface Patient {
  full_name: string
  date_of_birth: string
  gender: string
  address: string
  phone_number: string
  email: string
  preferred_language: string
  preferred_communication: string
  cultural_considerations: string
  organization_id: string
}

interface PatientFormProps {
  initialPatient?: Patient
  onSubmit: (patient: Patient) => void
  onCancel: () => void
  organizationId: string
}

export function PatientForm({ initialPatient, onSubmit, onCancel, organizationId }: PatientFormProps) {
  const [patient, setPatient] = useState<Patient>(
    initialPatient || {
      full_name: '',
      date_of_birth: '',
      gender: '',
      address: '',
      phone_number: '',
      email: '',
      preferred_language: '',
      preferred_communication: '',
      cultural_considerations: '',
      organization_id: organizationId,
    }
  )
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: { [key: string]: string } = {}

    // Validate required fields
    if (!patient.full_name) newErrors.full_name = "Full name is required"
    if (!patient.date_of_birth) newErrors.date_of_birth = "Date of birth is required"
    if (!patient.gender) newErrors.gender = "Gender is required"
    if (!patient.phone_number) newErrors.phone_number = "Phone number is required"
    if (!patient.email) newErrors.email = "Email is required"
    else if (!/\S+@\S+\.\S+/.test(patient.email)) newErrors.email = "Invalid email address"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      toast({
        title: "Error",
        description: "Please fill out all required fields correctly",
        variant: "destructive",
      })
      return
    }

    onSubmit(patient)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="full_name">Full Name *</Label>
        <Input
          id="full_name"
          value={patient.full_name}
          onChange={(e) => setPatient({ ...patient, full_name: e.target.value })}
          required
          className={errors.full_name ? 'border-red-500' : ''}
        />
        {errors.full_name && <p className="text-red-500 text-sm">{errors.full_name}</p>}
      </div>

      <div>
        <Label htmlFor="date_of_birth">Date of Birth *</Label>
        <Input
          id="date_of_birth"
          type="date"
          value={patient.date_of_birth}
          onChange={(e) => setPatient({ ...patient, date_of_birth: e.target.value })}
          required
          className={errors.date_of_birth ? 'border-red-500' : ''}
        />
        {errors.date_of_birth && <p className="text-red-500 text-sm">{errors.date_of_birth}</p>}
      </div>

      <div>
        <Label htmlFor="gender">Gender *</Label>
        <Select
          value={patient.gender}
          onValueChange={(value) => setPatient({ ...patient, gender: value })}
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
        {errors.gender && <p className="text-red-500 text-sm">{errors.gender}</p>}
      </div>

      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={patient.address}
          onChange={(e) => setPatient({ ...patient, address: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="phone_number">Phone Number *</Label>
        <Input
          id="phone_number"
          value={patient.phone_number}
          onChange={(e) => setPatient({ ...patient, phone_number: e.target.value })}
          required
          className={errors.phone_number ? 'border-red-500' : ''}
        />
        {errors.phone_number && <p className="text-red-500 text-sm">{errors.phone_number}</p>}
      </div>

      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={patient.email}
          onChange={(e) => setPatient({ ...patient, email: e.target.value })}
          required
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
      </div>

      <div>
        <Label htmlFor="preferred_language">Preferred Language</Label>
        <Input
          id="preferred_language"
          value={patient.preferred_language}
          onChange={(e) => setPatient({ ...patient, preferred_language: e.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="preferred_communication">Preferred Communication</Label>
        <Select
          value={patient.preferred_communication}
          onValueChange={(value) => setPatient({ ...patient, preferred_communication: value })}
        >
          <SelectTrigger id="preferred_communication">
            <SelectValue placeholder="Select preferred communication" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Phone">Phone</SelectItem>
            <SelectItem value="Email">Email</SelectItem>
            <SelectItem value="Text">Text</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="cultural_considerations">Cultural Considerations</Label>
        <Textarea
          id="cultural_considerations"
          value={patient.cultural_considerations}
          onChange={(e) => setPatient({ ...patient, cultural_considerations: e.target.value })}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Patient</Button>
      </div>
    </form>
  )
}

