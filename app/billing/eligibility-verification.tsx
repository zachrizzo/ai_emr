'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface EligibilityResult {
  status: 'Eligible' | 'Not Eligible' | 'Pending'
  planName: string
  effectiveDate: string
  copay: number
  deductible: number
  outOfPocketMax: number
}

export function EligibilityVerification() {
  const [patientInfo, setPatientInfo] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    insuranceId: '',
  })
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null)

  const handleVerify = () => {
    // Simulating an API call to verify eligibility
    setTimeout(() => {
      setEligibilityResult({
        status: 'Eligible',
        planName: 'Gold Health Plan',
        effectiveDate: '2023-01-01',
        copay: 20,
        deductible: 1000,
        outOfPocketMax: 5000,
      })
    }, 1000)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Eligibility Verification</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={patientInfo.firstName}
            onChange={(e) => setPatientInfo({ ...patientInfo, firstName: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={patientInfo.lastName}
            onChange={(e) => setPatientInfo({ ...patientInfo, lastName: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={patientInfo.dateOfBirth}
            onChange={(e) => setPatientInfo({ ...patientInfo, dateOfBirth: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="insuranceId">Insurance ID</Label>
          <Input
            id="insuranceId"
            value={patientInfo.insuranceId}
            onChange={(e) => setPatientInfo({ ...patientInfo, insuranceId: e.target.value })}
          />
        </div>
      </div>
      <Button onClick={handleVerify}>Verify Eligibility</Button>
      {eligibilityResult && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Eligibility Result</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Status:</strong> {eligibilityResult.status}</p>
            <p><strong>Plan Name:</strong> {eligibilityResult.planName}</p>
            <p><strong>Effective Date:</strong> {eligibilityResult.effectiveDate}</p>
            <p><strong>Copay:</strong> ${eligibilityResult.copay}</p>
            <p><strong>Deductible:</strong> ${eligibilityResult.deductible}</p>
            <p><strong>Out-of-Pocket Maximum:</strong> ${eligibilityResult.outOfPocketMax}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

