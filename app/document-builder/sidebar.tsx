'use client'

import { useDrag } from 'react-dnd'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Type,
  TextQuote,
  CheckSquare,
  List,
  CircleDot,
  Calendar,
  FileSignature,
  Table,
  Image as ImageIcon,
  AlignLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'

const elementCategories = [
  {
    title: 'Basic Elements',
    items: [
      { type: 'staticText', label: 'Static Text', icon: TextQuote, description: 'Add non-editable text' },
      { type: 'text', label: 'Text Field', icon: Type, description: 'Single or multi-line text input' },
      { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, description: 'Yes/No selection' },
      { type: 'dropdown', label: 'Dropdown', icon: List, description: 'Select from options' },
      { type: 'radio', label: 'Radio Group', icon: CircleDot, description: 'Choose one option' },
    ]
  },
  {
    title: 'Advanced Elements',
    items: [
      { type: 'date', label: 'Date Picker', icon: Calendar, description: 'Select a date' },
      { type: 'signature', label: 'Signature', icon: FileSignature, description: 'Digital signature field' },
      { type: 'table', label: 'Table', icon: Table, description: 'Data in rows and columns' },
      { type: 'image', label: 'Image', icon: ImageIcon, description: 'Upload and display images' },
      { type: 'section', label: 'Section', icon: AlignLeft, description: 'Group related fields' },
    ]
  }
]

function DraggableElement({ type, label, icon: Icon, description }: {
  type: string
  label: string
  icon: any
  description: string
}) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'formElement',
    item: { type, label },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))

  return (
    <div
      ref={drag as unknown as React.LegacyRef<HTMLDivElement>}
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg cursor-move transition-all",
        "hover:bg-accent hover:text-accent-foreground",
        "active:scale-95",
        isDragging && "opacity-50 bg-accent"
      )}
    >
      <div className="p-2 rounded-md bg-primary/10">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <Card className="w-80">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Form Elements</h2>
        <p className="text-sm text-muted-foreground">Drag and drop elements to build your form</p>
      </div>
      <ScrollArea className="h-[calc(100vh-16rem)] p-4">
        <div className="space-y-6">
          {elementCategories.map((category, i) => (
            <div key={category.title}>
              {i > 0 && <Separator className="my-4" />}
              <h3 className="text-sm font-medium mb-3">{category.title}</h3>
              <div className="space-y-2">
                {category.items.map((element) => (
                  <DraggableElement
                    key={element.type}
                    type={element.type}
                    label={element.label}
                    icon={element.icon}
                    description={element.description}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  )
}

