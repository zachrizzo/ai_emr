'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { LayoutControl } from './layout-control'
import { Element } from '../types'

interface StaticTextProps extends Element {
  onUpdateElement: (id: string, updates: Partial<Element>) => void;
}

export function StaticText({ id, label, layout, onUpdateElement }: StaticTextProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Static Text</h3>
        <LayoutControl
          layout={layout}
          onChange={(newLayout) => onUpdateElement(id, { layout: newLayout })}
        />
      </div>
      <Input
        type="text"
        value={label}
        onChange={(e) => onUpdateElement(id, { label: e.target.value })}
        placeholder="Enter static text"
      />
    </div>
  )
}

