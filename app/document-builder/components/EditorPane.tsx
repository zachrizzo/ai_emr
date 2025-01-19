'use client'

import React, { useRef } from 'react'
import { Element, ElementType } from '../types'
import { FormElement } from '../form-elements/form-element'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useDocumentBuilder } from '../document-builder-context'
import { v4 as uuidv4 } from 'uuid'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { cn } from '@/lib/utils'
import {
  Type,
  FileText,
  Calendar,
  ListChecks,
  CheckSquare,
  Table2,
  Text,
  Hash,
  Image as ImageIcon,
  PenTool,
  GripHorizontal,
  Plus,
  MousePointer
} from 'lucide-react'

interface EditorPaneProps {
  addElement: (element: Omit<Element, 'id'>) => void
  updateElement: (id: string, updates: Partial<Element>) => void
  removeElement: (id: string) => void
  moveElement: (dragIndex: number, hoverIndex: number) => void
}

interface ElementTypeDefinition {
  type: ElementType
  label: string
  icon: React.ReactNode
  description: string
}

type DraggableElementProps = ElementTypeDefinition & {
  onAddElement: (type: ElementType) => void
}

const elementTypes: ElementTypeDefinition[] = [
  {
    type: 'text',
    label: 'Text Field',
    icon: <Type className="h-4 w-4" />,
    description: 'Single line text input'
  },
  {
    type: 'textarea',
    label: 'Text Area',
    icon: <FileText className="h-4 w-4" />,
    description: 'Multi-line text input'
  },
  {
    type: 'number',
    label: 'Number',
    icon: <Hash className="h-4 w-4" />,
    description: 'Numeric input field'
  },
  {
    type: 'date',
    label: 'Date Picker',
    icon: <Calendar className="h-4 w-4" />,
    description: 'Date selection field'
  },
  {
    type: 'select',
    label: 'Dropdown',
    icon: <ListChecks className="h-4 w-4" />,
    description: 'Single selection from options'
  },
  {
    type: 'radio',
    label: 'Radio Group',
    icon: <ListChecks className="h-4 w-4" />,
    description: 'Single selection from radio buttons'
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: <CheckSquare className="h-4 w-4" />,
    description: 'Yes/No checkbox field'
  },
  {
    type: 'button',
    label: 'Button',
    icon: <MousePointer className="h-4 w-4" />,
    description: 'Clickable button element'
  },
  {
    type: 'table',
    label: 'Table',
    icon: <Table2 className="h-4 w-4" />,
    description: 'Multi-column data table'
  },
  {
    type: 'image',
    label: 'Image Upload',
    icon: <ImageIcon className="h-4 w-4" />,
    description: 'Image upload field'
  },
  {
    type: 'signature',
    label: 'Signature',
    icon: <PenTool className="h-4 w-4" />,
    description: 'Digital signature field'
  },
  {
    type: 'staticText',
    label: 'Static Text',
    icon: <Text className="h-4 w-4" />,
    description: 'Non-editable text block'
  }
]

const DraggableElement = ({
  type,
  label,
  icon,
  description,
  onAddElement
}: DraggableElementProps) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'NEW_ELEMENT',
    item: { type },
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult()
      if (item && dropResult) {
        onAddElement(type)
      }
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }))

  drag(elementRef)

  return (
    <div ref={elementRef} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <Button
        variant="outline"
        className="w-full justify-start cursor-move"
        type="button"
      >
        <GripHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
        {icon}
        <span className="ml-2">{label}</span>
      </Button>
      <div className="text-xs text-muted-foreground pl-9">
        {description}
      </div>
    </div>
  )
}

export function EditorPane({ addElement, updateElement, removeElement, moveElement }: EditorPaneProps) {
  const { currentTemplate } = useDocumentBuilder()
  const dropRef = useRef<HTMLDivElement>(null)

  const handleAddElement = (type: ElementType) => {
    const newElement: Omit<Element, 'id'> = {
      type,
      label: `New ${type} field`,
      description: '',
      value: '',
      options: type === 'select' || type === 'radio' ? ['Option 1'] : [],
      layout: 'full',
      required: false,
      ...(type === 'table' && {
        tableConfig: {
          columns: [{ id: uuidv4(), header: 'Column 1', type: 'text' }],
          minRows: 1,
          maxRows: 10
        }
      })
    }
    addElement(newElement)
  }

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ['NEW_ELEMENT', 'FORM_ELEMENT'],
    drop: () => ({}),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }))

  drop(dropRef)

  return (
    <div className="flex gap-6">
      {/* Element Toolbar */}
      <div className="w-48 flex-shrink-0">
        <div className="space-y-2">
          <h3 className="font-medium text-sm">Form Elements</h3>
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-4 pr-4">
              {elementTypes.map((elementType) => (
                <DraggableElement
                  key={elementType.type}
                  {...elementType}
                  onAddElement={handleAddElement}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      <Separator orientation="vertical" />

      {/* Form Builder Area */}
      <div className="flex-1">
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div
            ref={dropRef}
            className={cn(
              "min-h-[calc(100vh-320px)] rounded-lg transition-colors relative p-4",
              isOver && "bg-accent/50",
              (!currentTemplate?.content || currentTemplate.content.length === 0) && "border-2 border-dashed"
            )}
          >
            {(!currentTemplate?.content || currentTemplate.content.length === 0) ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Plus className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>Drag and drop elements here to build your form</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {currentTemplate?.content.map((element, index) => (
                  <div
                    key={element.id}
                    className={cn(
                      "transition-all duration-200",
                      element.layout === 'half' ? 'w-[calc(50%-8px)]' : 'w-full'
                    )}
                  >
                    <FormElement
                      element={element}
                      index={index}
                      onUpdateElement={updateElement}
                      onRemoveElement={removeElement}
                      onMoveElement={moveElement}
                    />
                  </div>
                ))}
                <div
                  className={cn(
                    "w-full h-24 rounded-lg border-2 border-dashed transition-colors",
                    isOver && "border-primary bg-primary/5"
                  )}
                />
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}

