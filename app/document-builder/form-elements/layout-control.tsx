'use client'

import { Button } from '@/components/ui/button'
import { LayoutType } from '../document-builder-context'
import { AlignJustify, AlignLeft } from 'lucide-react'

interface LayoutControlProps {
  layout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
}

export function LayoutControl({ layout, onLayoutChange }: LayoutControlProps) {
  return (
    <div className="flex space-x-2 mb-2">
      <Button
        size="sm"
        variant={layout === 'full' ? 'default' : 'outline'}
        onClick={() => onLayoutChange('full')}
        title="Full width"
      >
        <AlignJustify size={16} />
      </Button>
      <Button
        size="sm"
        variant={layout === 'half' ? 'default' : 'outline'}
        onClick={() => onLayoutChange('half')}
        title="Half width"
      >
        <AlignLeft size={16} />
      </Button>
    </div>
  )
}

