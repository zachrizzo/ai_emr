'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { DateConfig } from '../types'

interface DatePickerProps {
    label: string
    description?: string
    value: string
    required?: boolean
    placeholder?: string
    onChange: (value: string) => void
    className?: string
    config?: DateConfig
}

export function DatePicker({
    label,
    description,
    value,
    required,
    placeholder = "Select a date",
    onChange,
    className,
    config
}: DatePickerProps) {
    const date = value ? new Date(value) : undefined

    const isDateDisabled = (date: Date) => {
        if (!config) return false

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (!config.allowPastDates && date < today) return true
        if (!config.allowFutureDates && date > today) return true

        if (config.minDate && date < new Date(config.minDate)) return true
        if (config.maxDate && date > new Date(config.maxDate)) return true

        return false
    }

    return (
        <div className={cn("grid gap-2", className)}>
            <Label className="font-medium">
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : placeholder}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(date) => onChange(date?.toISOString() || '')}
                        disabled={isDateDisabled}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
