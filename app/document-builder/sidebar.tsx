'use client'

import { useDrag } from 'react-dnd'
import { Button } from '@/components/ui/button'

const elementTypes = [
  { type: 'staticText', label: 'Static Text' },
  { type: 'text', label: 'Text Field' },
  { type: 'checkbox', label: 'Checkbox' },
  { type: 'dropdown', label: 'Dropdown' },
  { type: 'radio', label: 'Radio Button' },
]

function DraggableElement({ type, label }: { type: string; label: string }) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'formElement',
    item: { type, label },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))

  return (
    <div
      ref={drag}
      className={`p-2 mb-2 bg-gray-100 rounded cursor-move ${isDragging ? 'opacity-50' : ''}`}
    >
      {label}
    </div>
  )
}

export function Sidebar() {
  return (
    <div className="w-64 bg-white p-4 border-r">
      <h2 className="text-lg font-semibold mb-4">Elements</h2>
      {elementTypes.map((element) => (
        <DraggableElement
          key={element.type}
          type={element.type}
          label={element.label}
        />
      ))}
    </div>
  )
}

