'use client'

import React, { useRef } from 'react'
import { Element } from '../types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Grip, Trash2, Settings2 } from 'lucide-react'
import { useDrag, useDrop } from 'react-dnd'
import { cn } from '@/lib/utils'
import { ElementSettings } from './element-settings'

interface FormElementProps {
  element: Element
  index: number
  onUpdateElement: (id: string, updates: Partial<Element>) => void
  onRemoveElement: (id: string) => void
  onMoveElement: (dragIndex: number, hoverIndex: number) => void
  className?: string
}

interface DragItem {
  index: number
  id: string
  type: string
}

export function FormElement({ element, index, onUpdateElement, onRemoveElement, onMoveElement, className }: FormElementProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [showSettings, setShowSettings] = React.useState(false)

  const [{ handlerId }, drop] = useDrop<DragItem, void, { handlerId: string | symbol | null }>({
    accept: 'FORM_ELEMENT',
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

      onMoveElement(dragIndex, hoverIndex)
      item.index = hoverIndex
    },
  })

  const [{ isDragging }, drag] = useDrag({
    type: 'FORM_ELEMENT',
    item: () => {
      return { id: element.id, index }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  })

  const opacity = isDragging ? 0 : 1
  drag(drop(ref))

  return (
    <div
      ref={ref}
      style={{ opacity }}
      className={cn(
        "group relative transition-all duration-200",
        element.layout === 'half' ? 'w-[calc(50%-1rem)] min-w-[300px]' : 'w-full',
        className
      )}
      data-handler-id={handlerId}
    >
      <Card className="relative m-1">
        <CardContent className="p-4">
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move">
            <Grip className="h-4 w-4" />
          </div>
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full bg-background shadow-sm hover:bg-accent"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full bg-background shadow-sm hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => onRemoveElement(element.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          {element.type === 'button' ? (
            <div className="w-full">
              {element.buttonConfig?.action === 'navigate' && element.buttonConfig.url ? (
                <a
                  href={element.buttonConfig.url}
                  target={element.buttonConfig.target || '_self'}
                  className="block w-full"
                >
                  <Button
                    variant={element.buttonConfig?.variant || 'default'}
                    size={element.buttonConfig?.size || 'default'}
                    className="w-full text-center"
                    type="button"
                  >
                    {element.label}
                  </Button>
                </a>
              ) : (
                <Button
                  variant={element.buttonConfig?.variant || 'default'}
                  size={element.buttonConfig?.size || 'default'}
                  className="w-full text-center"
                  type={element.buttonConfig?.action === 'submit' ? 'submit' : 'button'}
                >
                  {element.label}
                </Button>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              {element.label || `Untitled ${element.type}`}
            </div>
          )}
        </CardContent>
      </Card>
      {showSettings && (
        <ElementSettings
          element={element}
          onUpdateElement={onUpdateElement}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

