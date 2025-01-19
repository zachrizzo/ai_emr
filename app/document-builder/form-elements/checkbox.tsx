'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface CheckboxGroupProps {
  label: string
  description?: string
  options?: string[]
  value?: string[]
  required?: boolean
  onChange: (value: string[]) => void
  className?: string
  isPreview?: boolean
}

export function CheckboxGroup({
  label,
  description,
  options = [],
  value = [],
  required,
  onChange,
  className,
  isPreview = false
}: CheckboxGroupProps) {
  const handleCheckedChange = (checked: boolean, option: string) => {
    if (!isPreview) {
      if (checked) {
        onChange([...value, option])
      } else {
        onChange(value.filter(v => v !== option))
      }
    }
  }

  return (
    <div className={cn("grid gap-4", className)}>
      <div className="flex flex-col gap-1">
        <Label className="font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="grid gap-3">
        {Array.isArray(options) && options.length > 0 ? (
          options.map((option) => (
            <div key={option} className="flex items-center space-x-2">
              <Checkbox
                id={`checkbox-${option}`}
                checked={value.includes(option)}
                onCheckedChange={(checked) => handleCheckedChange(checked as boolean, option)}
                disabled={isPreview}
                className={cn(
                  "h-4 w-4 rounded border border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
                  isPreview ? "cursor-default pointer-events-none" : "cursor-pointer"
                )}
              />
              <Label
                htmlFor={`checkbox-${option}`}
                className={cn(
                  "text-sm font-normal leading-none",
                  isPreview ? "cursor-default select-none" : "cursor-pointer"
                )}
              >
                {option}
              </Label>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No checkboxes added yet</p>
        )}
      </div>
    </div>
  )
}

