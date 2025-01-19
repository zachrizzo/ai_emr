'use client'

import React, { useMemo } from 'react'
import { useDrop } from 'react-dnd'
import { useDocumentBuilder } from './document-builder-context'
import { FormElement } from './form-elements/form-element'
import { Element, ElementType } from './types'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

interface DragItem {
  type: string
  label: string
  layout?: 'full' | 'half'
}

interface DropZoneProps {
  onUpdateElement: (id: string, updates: Partial<Element>) => void
  onRemoveElement: (id: string) => void
  onMoveElement: (dragIndex: number, hoverIndex: number) => void
}

export function DropZone({ onUpdateElement, onRemoveElement, onMoveElement }: DropZoneProps) {
  const { currentTemplate, addElement } = useDocumentBuilder()

  // Calculate layout information for the current state
  const layoutInfo = useMemo(() => {
    if (!currentTemplate?.content) return { rows: [] }

    const rows: { elements: Element[], isComplete: boolean }[] = []
    let currentRow: Element[] = []

    currentTemplate.content.forEach((element) => {
      if (element.layout === 'full') {
        if (currentRow.length > 0) {
          rows.push({ elements: currentRow, isComplete: currentRow.length === 2 })
          currentRow = []
        }
        rows.push({ elements: [element], isComplete: true })
      } else {
        // For half-width elements
        if (currentRow.length === 2) {
          rows.push({ elements: currentRow, isComplete: true })
          currentRow = [element]
        } else {
          currentRow.push(element)
        }
      }
    })

    // Add any remaining elements
    if (currentRow.length > 0) {
      rows.push({ elements: currentRow, isComplete: currentRow.length === 2 })
    }

    return { rows }
  }, [currentTemplate?.content])

  const [{ isOver, canDrop, draggedItemLayout }, dropRef] = useDrop<
    DragItem,
    void,
    { isOver: boolean; canDrop: boolean; draggedItemLayout: 'full' | 'half' | null }
  >({
    accept: 'formElement',
    drop: (item: DragItem, monitor) => {
      if (!monitor.didDrop()) {
        const baseElement: Omit<Element, 'id'> = {
          type: item.type as ElementType,
          label: item.label,
          description: '',
          value: '',
          options: [],
          layout: item.layout || 'full'
        }

        if (item.type === 'table') {
          addElement({
            ...baseElement,
            tableConfig: {
              columns: [
                { id: uuidv4(), header: 'Column 1', type: 'text' }
              ],
              minRows: 1,
              maxRows: 10
            }
          })
        } else {
          addElement(baseElement)
        }
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
      draggedItemLayout: monitor.getItem()?.layout || null,
    }),
  })

  const hasElements = currentTemplate?.content && currentTemplate.content.length > 0

  // Determine if a drop position is valid based on the current layout
  const isValidDropPosition = (rowIndex: number, position: 'left' | 'right' | 'full') => {
    if (!draggedItemLayout) return false

    const row = layoutInfo.rows[rowIndex]
    if (!row) return true // New row is always valid

    if (draggedItemLayout === 'full') {
      // Full-width elements can only be dropped in empty rows or at the end
      return row.elements.length === 0
    }

    if (position === 'full') return false // Half-width items can't be dropped in full positions

    // For half-width elements
    if (row.elements.length === 0) return true
    if (row.elements.length === 1 && row.elements[0].layout === 'half') {
      return position === 'right' // Can only drop on right side of a single half-width element
    }
    return false
  }

  const getDropIndicator = (rowIndex: number) => {
    if (!isOver || !canDrop) return null

    const row = layoutInfo.rows[rowIndex]
    const showLeftHalf = isValidDropPosition(rowIndex, 'left')
    const showRightHalf = isValidDropPosition(rowIndex, 'right')
    const showFull = isValidDropPosition(rowIndex, 'full')

    return (
      <div className="absolute inset-0 pointer-events-none">
        {showFull && (
          <div className="absolute inset-0 border-2 border-primary border-dashed rounded-lg" />
        )}
        {(showLeftHalf || showRightHalf) && (
          <div className="absolute inset-0 flex">
            {showLeftHalf && (
              <div className="w-1/2 border-2 border-primary border-dashed rounded-l-lg" />
            )}
            {showRightHalf && (
              <div className="w-1/2 border-2 border-primary border-dashed rounded-r-lg" />
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <Card className="flex-1 h-[calc(100vh-16rem)] overflow-hidden">
      <ScrollArea className="h-full">
        <div
          ref={dropRef as unknown as React.LegacyRef<HTMLDivElement>}
          className={cn(
            "min-h-[calc(100vh-16rem)] p-6 transition-colors",
            "relative",
            !hasElements && "flex items-center justify-center",
            isOver && canDrop && "bg-primary/5",
            !hasElements && !isOver && "bg-muted/30"
          )}
        >
          {hasElements ? (
            <div className="space-y-4">
              {layoutInfo.rows.map((row, rowIndex) => (
                <div key={rowIndex} className="relative">
                  <div className={cn(
                    "grid gap-4",
                    row.elements.length === 2 ? "grid-cols-2" : "grid-cols-1"
                  )}>
                    {row.elements.map((element, elementIndex) => (
                      <FormElement
                        key={element.id}
                        element={element}
                        index={currentTemplate.content.findIndex(e => e.id === element.id)}
                        onUpdateElement={onUpdateElement}
                        onRemoveElement={onRemoveElement}
                        onMoveElement={(dragIndex, hoverIndex) => {
                          const dragElement = currentTemplate.content[dragIndex]
                          const hoverElement = currentTemplate.content[hoverIndex]

                          // Prevent full-width elements from being placed between half-width elements
                          if (dragElement.layout === 'full') {
                            const prevElement = hoverIndex > 0 ? currentTemplate.content[hoverIndex - 1] : null
                            const nextElement = hoverIndex < currentTemplate.content.length - 1 ? currentTemplate.content[hoverIndex + 1] : null

                            if ((prevElement?.layout === 'half' && nextElement?.layout === 'half') ||
                              (hoverElement.layout === 'half')) {
                              return
                            }
                          }

                          onMoveElement(dragIndex, hoverIndex)
                        }}
                        className={cn(
                          element.layout === 'full' && "col-span-2",
                          'relative'
                        )}
                      />
                    ))}
                  </div>
                  {getDropIndicator(rowIndex)}
                </div>
              ))}
              {/* Add an empty row at the end for dropping */}
              <div className="relative h-16">
                {getDropIndicator(layoutInfo.rows.length)}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-3 max-w-sm mx-auto">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium">Start Building Your Form</h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop elements from the sidebar to start building your form. Elements will appear here.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  )
}

