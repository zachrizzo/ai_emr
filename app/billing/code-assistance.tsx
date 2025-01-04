'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface Code {
  code: string
  description: string
  type: 'ICD-10' | 'CPT' | 'HCPCS'
}

const mockCodes: Code[] = [
  { code: 'E11.9', description: 'Type 2 diabetes mellitus without complications', type: 'ICD-10' },
  { code: '99213', description: 'Office or other outpatient visit for the evaluation and management of an established patient', type: 'CPT' },
  { code: 'J0696', description: 'Injection, ceftriaxone sodium, per 250 mg', type: 'HCPCS' },
]

export function CodeAssistance() {
  const [searchTerm, setSearchTerm] = useState('')
  const [codes, setCodes] = useState<Code[]>(mockCodes)

  const filteredCodes = codes.filter(
    (code) =>
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Code Assistance</h2>
      <div className="flex space-x-2 mb-4">
        <Input
          placeholder="Search codes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Button>Search</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCodes.map((code) => (
            <TableRow key={code.code}>
              <TableCell>{code.code}</TableCell>
              <TableCell>{code.description}</TableCell>
              <TableCell>{code.type}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

