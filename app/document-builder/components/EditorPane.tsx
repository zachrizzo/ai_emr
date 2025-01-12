import React from 'react'
import { Sidebar } from './Sidebar'
import { DropZone } from '../drop-zone'
import { Element } from '../types'

interface EditorPaneProps {
  addElement: (element: Omit<Element, 'id'>) => void
  updateElement: (id: string, updates: Partial<Element>) => void
  removeElement: (id: string) => void
  moveElement: (dragIndex: number, hoverIndex: number) => void
}

export function EditorPane({ addElement, updateElement, removeElement, moveElement }: EditorPaneProps) {
  return (
    <div className="flex gap-4">
      <Sidebar onAddElements={addElement} />
      <div className="flex-1">
        <DropZone
          onUpdateElement={updateElement}
          onRemoveElement={removeElement}
          onMoveElement={moveElement}
        />
      </div>
    </div>
  )
}

