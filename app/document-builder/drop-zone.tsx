'use client'

import { useDrop } from 'react-dnd'
import { useDocumentBuilder } from './document-builder-context'
import { FormElement } from './form-elements/form-element'

interface DropZoneProps {
  onUpdateElement: (id: string, updates: Partial<Element>) => void
  onRemoveElement: (id: string) => void
  onMoveElement: (dragIndex: number, hoverIndex: number) => void
}

export function DropZone({ onUpdateElement, onRemoveElement, onMoveElement }: DropZoneProps) {
  const { currentTemplate, addElement } = useDocumentBuilder()

  const [, drop] = useDrop(() => ({
    accept: ['formElement', 'existingElement'],
    drop: (item: { type: string; label: string }, monitor) => {
      if (!monitor.didDrop()) {
        addElement({
          type: item.type as 'staticText' | 'text' | 'checkbox' | 'dropdown' | 'radio',
          label: item.label,
          description: '',
        })
      }
    },
  }), [addElement])

  return (
    <div
      ref={drop}
      className="min-h-[400px] border-2 border-dashed rounded p-4 bg-gray-50"
    >
      <div className="flex flex-wrap -mx-2">
        {currentTemplate && currentTemplate.content && currentTemplate.content.map((element, index) => (
          <FormElement
            key={element.id}
            index={index}
            element={element}
            onUpdateElement={onUpdateElement}
            onRemoveElement={onRemoveElement}
            onMoveElement={onMoveElement}
          />
        ))}
      </div>
      {(!currentTemplate || !currentTemplate.content || currentTemplate.content.length === 0) && (
        <p className="text-center text-gray-500">Drag and drop elements here or use the sidebar to add elements</p>
      )}
    </div>
  )
}

