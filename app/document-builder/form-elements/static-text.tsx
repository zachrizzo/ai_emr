'use client'

import { useDocumentBuilder } from '../document-builder-context'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { LayoutControl } from './layout-control'

export function StaticText({ id, label, description, layout }: { id: string; label: string; description: string; layout: 'full' | 'half' }) {
  const { updateElement, removeElement } = useDocumentBuilder()

  return (
    <div className="relative pt-8">
      <div className="absolute top-0 right-0">
        <LayoutControl 
          layout={layout} 
          onLayoutChange={(newLayout) => updateElement(id, { layout: newLayout })} 
        />
      </div>
      <Input
        value={label}
        onChange={(e) => updateElement(id, { label: e.target.value })}
        className="font-bold mb-2"
        placeholder="Enter title"
      />
      <Textarea
        value={description}
        onChange={(e) => updateElement(id, { description: e.target.value })}
        className="mb-2"
        placeholder="Enter text content"
      />
      <Button
        onClick={() => removeElement(id)}
        variant="destructive"
        size="sm"
      >
        Remove
      </Button>
    </div>
  )
}

