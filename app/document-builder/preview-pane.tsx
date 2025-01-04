'use client'

import { useDocumentBuilder } from './document-builder-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

export function PreviewPane() {
  const { currentTemplate } = useDocumentBuilder()

  const renderElement = (element: any) => {
    switch (element.type) {
      case 'staticText':
        return (
          <div key={element.id} className="mb-4">
            <h3 className="font-bold">{element.label}</h3>
            <p>{element.description}</p>
          </div>
        )
      case 'text':
        return (
          <div key={element.id} className="mb-4">
            <Label htmlFor={`preview-${element.id}`} className="font-bold">{element.label}</Label>
            {element.description && <p className="text-sm text-gray-500 mb-1">{element.description}</p>}
            <Input id={`preview-${element.id}`} placeholder="Enter text" />
          </div>
        )
      case 'checkbox':
        return (
          <div key={element.id} className="mb-4 flex items-center space-x-2">
            <Checkbox id={`preview-${element.id}`} />
            <Label htmlFor={`preview-${element.id}`} className="font-bold">{element.label}</Label>
            {element.description && <p className="text-sm text-gray-500">{element.description}</p>}
          </div>
        )
      case 'dropdown':
        return (
          <div key={element.id} className="mb-4">
            <Label htmlFor={`preview-${element.id}`} className="font-bold">{element.label}</Label>
            {element.description && <p className="text-sm text-gray-500 mb-1">{element.description}</p>}
            <Select>
              <SelectTrigger id={`preview-${element.id}`}>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {element.options?.map((option: string, index: number) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case 'radio':
        return (
          <div key={element.id} className="mb-4">
            <Label className="font-bold">{element.label}</Label>
            {element.description && <p className="text-sm text-gray-500 mb-1">{element.description}</p>}
            <RadioGroup>
              {element.options?.map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`preview-${element.id}-${index}`} />
                  <Label htmlFor={`preview-${element.id}-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )
      default:
        return null
    }
  }

  if (!currentTemplate || !currentTemplate.content || currentTemplate.content.length === 0) {
    return (
      <div className="bg-white p-4 border rounded">
        <h2 className="text-lg font-semibold mb-4">Preview</h2>
        <p>No elements to preview. Add some elements to your form to see a preview.</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-4 border rounded">
      <h2 className="text-lg font-semibold mb-4">Preview</h2>
      <div className="flex flex-wrap -mx-2">
        {currentTemplate.content.map((element) => (
          <div key={element.id} className={`p-2 ${element.layout === 'half' ? 'w-1/2' : 'w-full'}`}>
            {renderElement(element)}
          </div>
        ))}
      </div>
    </div>
  )
}

