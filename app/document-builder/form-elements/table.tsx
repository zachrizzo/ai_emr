'use client'

import React, { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { Plus, Trash2, GripVertical, Settings2, ChevronDown } from 'lucide-react'
import {
    Table as TableUI,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { v4 as uuidv4 } from 'uuid'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'

interface Column {
    id: string
    header: string
    type: 'text' | 'number' | 'date' | 'select'
    options?: string[]
}

interface TableProps {
    label: string
    description?: string
    columns: Column[]
    minRows?: number
    maxRows?: number
    required?: boolean
    onUpdateColumns: (columns: Column[]) => void
    className?: string
}

export function Table({
    label,
    description,
    columns,
    minRows = 1,
    maxRows = 10,
    required,
    onUpdateColumns,
    className
}: TableProps) {
    const [newOptions, setNewOptions] = useState<{ [key: string]: string }>({})

    const addColumn = () => {
        onUpdateColumns([
            ...columns,
            { id: uuidv4(), header: 'New Column', type: 'text' }
        ])
    }

    const updateColumn = (id: string, updates: Partial<Column>) => {
        onUpdateColumns(
            columns.map(col => col.id === id ? { ...col, ...updates } : col)
        )
    }

    const removeColumn = (id: string) => {
        onUpdateColumns(columns.filter(col => col.id !== id))
    }

    const addOption = (columnId: string) => {
        if (!newOptions[columnId]?.trim()) return
        const column = columns.find(col => col.id === columnId)
        if (column) {
            const currentOptions = column.options || []
            if (!currentOptions.includes(newOptions[columnId].trim())) {
                updateColumn(columnId, {
                    options: [...currentOptions, newOptions[columnId].trim()]
                })
            }
        }
        setNewOptions(prev => ({ ...prev, [columnId]: '' }))
    }

    const removeOption = (columnId: string, optionToRemove: string) => {
        const column = columns.find(col => col.id === columnId)
        if (column && column.options) {
            updateColumn(columnId, {
                options: column.options.filter(opt => opt !== optionToRemove)
            })
        }
    }

    return (
        <div className={cn("grid gap-2", className)}>
            <div className="flex justify-between items-center">
                <Label className="font-medium">
                    {label}
                    {required && <span className="text-destructive ml-1">*</span>}
                </Label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addColumn}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Column
                </Button>
            </div>
            {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <div className="border rounded-md">
                <TableUI>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-10"></TableHead>
                            {columns.map((column) => (
                                <TableHead key={column.id}>
                                    <div className="flex items-center gap-2">
                                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                                        <div className="flex-1">
                                            <Input
                                                value={column.header}
                                                onChange={(e) => updateColumn(column.id, { header: e.target.value })}
                                                className="h-8"
                                                placeholder="Column name"
                                            />
                                        </div>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Settings2 className="h-4 w-4" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80" align="end">
                                                <div className="grid gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Column Type</Label>
                                                        <Select
                                                            value={column.type}
                                                            onValueChange={(value) => {
                                                                const type = value as Column['type']
                                                                updateColumn(column.id, {
                                                                    type,
                                                                    ...(type === 'select' ? {
                                                                        options: []
                                                                    } : {
                                                                        options: undefined
                                                                    })
                                                                })
                                                            }}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="text">Text</SelectItem>
                                                                <SelectItem value="number">Number</SelectItem>
                                                                <SelectItem value="date">Date</SelectItem>
                                                                <SelectItem value="select">Select</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    {column.type === 'select' && (
                                                        <>
                                                            <Separator className="my-2" />
                                                            <div className="space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <Label>Select Options</Label>
                                                                </div>
                                                                <Card className="p-3">
                                                                    <div className="space-y-3">
                                                                        <div className="flex gap-2">
                                                                            <Input
                                                                                value={newOptions[column.id] || ''}
                                                                                onChange={(e) => setNewOptions(prev => ({
                                                                                    ...prev,
                                                                                    [column.id]: e.target.value
                                                                                }))}
                                                                                placeholder="Add new option"
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter') {
                                                                                        e.preventDefault()
                                                                                        addOption(column.id)
                                                                                    }
                                                                                }}
                                                                            />
                                                                            <Button
                                                                                type="button"
                                                                                size="sm"
                                                                                onClick={() => addOption(column.id)}
                                                                            >
                                                                                Add
                                                                            </Button>
                                                                        </div>
                                                                        <ScrollArea className="h-[150px]">
                                                                            <div className="space-y-2 pr-4">
                                                                                {column.options?.map((option) => (
                                                                                    <div key={option} className="flex items-center justify-between bg-secondary/50 px-3 py-1.5 rounded-md">
                                                                                        <span className="text-sm">{option}</span>
                                                                                        <Button
                                                                                            type="button"
                                                                                            variant="ghost"
                                                                                            size="icon"
                                                                                            className="h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
                                                                                            onClick={() => removeOption(column.id, option)}
                                                                                        >
                                                                                            <Trash2 className="h-3 w-3" />
                                                                                        </Button>
                                                                                    </div>
                                                                                ))}
                                                                                {(!column.options || column.options.length === 0) && (
                                                                                    <p className="text-sm text-muted-foreground py-1">No options added yet</p>
                                                                                )}
                                                                            </div>
                                                                        </ScrollArea>
                                                                    </div>
                                                                </Card>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeColumn(column.id)}
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell className="text-center text-muted-foreground" colSpan={columns.length + 1}>
                                Table data will appear here
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </TableUI>
            </div>
            <p className="text-xs text-muted-foreground">
                Min rows: {minRows}, Max rows: {maxRows}
            </p>
        </div>
    )
}
