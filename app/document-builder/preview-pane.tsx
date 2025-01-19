'use client'

import React, { useCallback, useRef } from 'react'
import { useDocumentBuilder } from './document-builder-context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { CalendarIcon, Image as ImageIcon, Upload, X, PenTool } from 'lucide-react'
import { Element } from './types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useDropzone } from 'react-dropzone'
import SignatureCanvas from 'react-signature-canvas'
import type { FileWithPath } from 'react-dropzone'
import { CheckboxGroup } from './form-elements/checkbox'

export function PreviewPane() {
  const { currentTemplate } = useDocumentBuilder()
  const [formValues, setFormValues] = React.useState<Record<string, any>>({})

  const handleChange = (id: string, value: any) => {
    setFormValues(prev => ({ ...prev, [id]: value }))
  }

  const renderElement = (element: Element) => {
    switch (element.type) {
      case 'text':
      case 'number':
        return (
          <Input
            id={element.id}
            type={element.type}
            placeholder={element.placeholder}
            value={formValues[element.id] || ''}
            onChange={(e) => handleChange(element.id, e.target.value)}
            className="w-full"
          />
        )

      case 'textarea':
        return (
          <textarea
            id={element.id}
            placeholder={element.placeholder}
            value={formValues[element.id] || ''}
            onChange={(e) => handleChange(element.id, e.target.value)}
            className="w-full min-h-[100px] resize-none rounded-md border p-3"
          />
        )

      case 'date':
        const dateValue = formValues[element.id] ? new Date(formValues[element.id]) : undefined
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateValue && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateValue ? format(dateValue, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateValue}
                onSelect={(date) => handleChange(element.id, date)}
                initialFocus
                disabled={(date) => {
                  if (element.validation?.min && date < new Date(element.validation.min)) return true
                  if (element.validation?.max && date > new Date(element.validation.max)) return true
                  return false
                }}
              />
            </PopoverContent>
          </Popover>
        )

      case 'select':
        return (
          <Select
            value={formValues[element.id] || ''}
            onValueChange={(value) => handleChange(element.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder={element.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {element.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'radio':
        return (
          <RadioGroup
            value={formValues[element.id] || ''}
            onValueChange={(value) => handleChange(element.id, value)}
          >
            {element.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${element.id}-${option}`} />
                <Label htmlFor={`${element.id}-${option}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )

      case 'checkbox':
        return (
          <CheckboxGroup
            label={element.label}
            description={element.description}
            options={element.options}
            value={formValues[element.id] || []}
            required={element.required}
            onChange={(value) => handleChange(element.id, value)}
            isPreview={true}
          />
        )

      case 'table':
        if (!element.tableConfig?.columns) return null
        const tableValue = formValues[element.id] || Array(element.tableConfig.minRows || 1).fill({})

        return (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  {element.tableConfig.columns.map((column) => (
                    <TableHead key={column.id}>{column.header}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableValue.map((row: any, rowIndex: number) => (
                  <TableRow key={rowIndex}>
                    {element.tableConfig!.columns.map((column) => (
                      <TableCell key={column.id}>
                        {column.type === 'select' ? (
                          <Select
                            value={row[column.id] || ''}
                            onValueChange={(value) => {
                              const newValue = [...tableValue]
                              newValue[rowIndex] = { ...row, [column.id]: value }
                              handleChange(element.id, newValue)
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {column.options?.map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : column.type === 'staticText' ? (
                          <div className="text-sm text-muted-foreground">
                            {column.staticValue || ''}
                          </div>
                        ) : (
                          <Input
                            type={column.type}
                            value={row[column.id] || ''}
                            onChange={(e) => {
                              const newValue = [...tableValue]
                              newValue[rowIndex] = { ...row, [column.id]: e.target.value }
                              handleChange(element.id, newValue)
                            }}
                          />
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {tableValue.length < (element.tableConfig.maxRows || 10) && (
              <div className="p-4 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    handleChange(element.id, [...tableValue, {}])
                  }}
                >
                  Add Row
                </Button>
              </div>
            )}
          </div>
        )

      case 'staticText':
        return <p className="text-muted-foreground">{element.value}</p>

      case 'image':
        const onDrop = useCallback((acceptedFiles: FileWithPath[]) => {
          const file = acceptedFiles[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
              handleChange(element.id, e.target?.result)
            }
            reader.readAsDataURL(file)
          }
        }, [element.id])

        const { getRootProps, getInputProps } = useDropzone({
          onDrop,
          accept: {
            'image/*': element.imageConfig?.acceptedTypes || ['.jpg', '.jpeg', '.png', '.gif']
          },
          maxSize: (element.imageConfig?.maxSize || 5) * 1024 * 1024,
          multiple: false
        })

        return (
          <div className="space-y-4">
            {formValues[element.id] ? (
              <div className="relative aspect-video rounded-lg overflow-hidden border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={formValues[element.id]}
                  alt="Uploaded image"
                  className="object-cover w-full h-full"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                  onClick={() => handleChange(element.id, '')}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 transition-colors",
                  "flex flex-col items-center justify-center gap-2 text-center",
                  "hover:border-primary hover:bg-primary/5 cursor-pointer"
                )}
              >
                <input {...getInputProps()} />
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {element.imageConfig?.acceptedTypes?.join(', ') || 'JPG, PNG, GIF'} up to {element.imageConfig?.maxSize || 5}MB
                  </p>
                </div>
              </div>
            )}
          </div>
        )

      case 'signature':
        const signatureRef = useRef<SignatureCanvas>(null)
        const signatureConfig = element.signatureConfig || {
          penColor: '#000000',
          backgroundColor: '#ffffff',
          width: 500,
          height: 200
        }

        return (
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              {formValues[element.id] ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={formValues[element.id]}
                    alt="Signature"
                    className="w-full"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                    onClick={() => {
                      signatureRef.current?.clear()
                      handleChange(element.id, '')
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <SignatureCanvas
                    ref={signatureRef}
                    penColor={signatureConfig.penColor}
                    backgroundColor={signatureConfig.backgroundColor}
                    canvasProps={{
                      width: signatureConfig.width,
                      height: signatureConfig.height,
                      className: 'w-full h-full'
                    }}
                    onEnd={() => {
                      if (signatureRef.current) {
                        handleChange(element.id, signatureRef.current.toDataURL())
                      }
                    }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-muted-foreground">
                      Sign above
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        signatureRef.current?.clear()
                        handleChange(element.id, '')
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4">
        {currentTemplate?.content.map((element) => (
          <div
            key={element.id}
            className={cn(
              "space-y-2",
              element.layout === 'full' ? 'col-span-2' : 'col-span-1'
            )}
          >
            {element.type !== 'checkbox' && (
              <Label className="text-base font-medium">
                {element.label}
                {element.required && <span className="text-destructive ml-1">*</span>}
              </Label>
            )}
            {element.description && (
              <p className="text-sm text-muted-foreground">{element.description}</p>
            )}
            {renderElement(element)}
          </div>
        ))}
      </div>
    </div>
  )
}

