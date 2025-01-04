'use client'

import { useDocumentBuilder } from '../document-builder-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Checkbox as UICheckbox } from '@/components/ui/checkbox'

export function Checkbox({ id, label, description, value }: { id: string; label: string; description: string; value: string }) {
  const { updateElement, removeElement } = useDocumentBuilder()

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
      <div className="flex items-center space-x-2">
        <UICheckbox 
          id={`checkbox-${id}`} 
          checked={value === 'true'}
          onCheckedChange={(checked) => updateElement(id, { value: checked ? 'true' : 'false' })}
        />
        <label
          htmlFor={`checkbox-${id}`}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
        </label>
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

