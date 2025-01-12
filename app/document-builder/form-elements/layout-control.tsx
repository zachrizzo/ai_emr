'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlignJustify, AlignLeft } from 'lucide-react'
import { Element } from '../types'

interface LayoutControlProps {
  layout: Element['layout'];
  onChange: (layout: Element['layout']) => void;
}

export function LayoutControl({ layout, onChange }: LayoutControlProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant={layout === 'full' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('full')}
      >
        <AlignJustify className="h-4 w-4" />
      </Button>
      <Button
        variant={layout === 'half' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('half')}
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
    </div>
  )
}

