'use client'

import { useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { useDocumentBuilder } from '../document-builder-context'
import { StaticText } from './static-text'
import { TextField } from './text-field'
import { Checkbox } from './checkbox'
import { Dropdown } from './dropdown'
import { RadioButton } from './radio-button'
import { GripVertical } from 'lucide-react'

interface DragItem {
  index: number
  id: string
  type: string
}

export function FormElement({ element, index }: { element: any; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { moveElement } = useDocumentBuilder()

  const [{ handlerId }, drop] = useDrop<
    DragItem,
    void,
    { handlerId: string | symbol | null }
  >({
    accept: 'existingElement',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      }
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index

      if (dragIndex === hoverIndex) {
        return
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect()
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2
      const clientOffset = monitor.getClientOffset()
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return
      }

      moveElement(dragIndex, hoverIndex)
      item.index = hoverIndex
    },
  })

  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: 'existingElement',
    item: () => {
      return { id: element.id, index }
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const opacity = isDragging ? 0.5 : 1
  dragPreview(drop(ref))

  const renderElement = () => {
    switch (element.type) {
      case 'staticText':
        return <StaticText {...element} />
      case 'text':
        return <TextField {...element} />
      case 'checkbox':
        return <Checkbox {...element} />
      case 'dropdown':
        return <Dropdown {...element} />
      case 'radio':
        return <RadioButton {...element} />
      default:
        return null
    }
  }

  return (
    <div 
      ref={ref} 
      style={{ opacity }} 
      data-handler-id={handlerId}
      className={`p-2 ${element.layout === 'half' ? 'w-1/2' : 'w-full'}`}
    >
      <div className="relative border rounded bg-white p-4">
        <div 
          ref={drag}
          className="absolute top-2 left-2 cursor-move p-1 rounded hover:bg-gray-100"
          title="Drag to reorder"
        >
          <GripVertical size={16} />
        </div>
        {renderElement()}
      </div>
    </div>
  )
}

