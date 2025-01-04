'use client'

import { useState } from 'react'
import { useDocumentBuilder } from '../document-builder-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export function RadioButton({ id, label, description, options = [], value }: { id: string; label: string; description: string; options?: string[]; value: string }) {
  const { updateElement, removeElement } = useDocumentBuilder()
  const [newOption, setNewOption] = useState('')

  const addOption = () => {
    if (newOption) {
      updateElement(id, { options: [...options, newOption] })
      setNewOption('')
    }
  }

  return (
    <div className="mb-4 p-4 border rounded">
      <Label htmlFor={`label-${id}`}>Label</Label>
      <Input
        id={`label-${id}`}
        value={label}
        onChange={(e) => updateElement(id, { label: e.target.value })}
        className="mb-2"
      />
      <Label htmlFor={`description-${id}`}>Description</Label>
      <Input
        id={`description-${id}`}
        value={description}
        onChange={(e) => updateElement(id, { description: e.target.value })}
        className="mb-2"
      />
      <RadioGroup value={value} onValueChange={(newValue) => updateElement(id, { value: newValue })}>
        {options.map((option, index) => (
          <div key={index} className="flex items-center space-x-2">
            <RadioGroupItem value={option} id={`option-${id}-${index}`} />
            <Label htmlFor={`option-${id}-${index}`}>{option}</Label>
          </div>
        ))}
      </RadioGroup>
      <div className="mt-2 flex space-x-2">
        <Input
          value={newOption}
          onChange={(e) => setNewOption(e.target.value)}
          placeholder="Add option"
        />
        <Button onClick={addOption}>Add</Button>
      </div>
      <Button
        onClick={() => removeElement(id)}
        variant="destructive"
        size="sm"
        className="mt-2"
      >
        Remove
      </Button>
    </div>
  )
}

