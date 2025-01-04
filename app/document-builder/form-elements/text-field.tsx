'use client'

import { useDocumentBuilder } from '../document-builder-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export function TextField({ id, label, description, value }: { id: string; label: string; description: string; value: string }) {
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
      <Input 
        type="text" 
        className="w-full px-3 py-2 border rounded" 
        placeholder="Enter text" 
        value={value}
        onChange={(e) => updateElement(id, { value: e.target.value })}
      />
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

