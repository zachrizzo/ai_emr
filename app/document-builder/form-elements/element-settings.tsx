'use client'

import React from 'react'
import { Element, TableColumn } from '../types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { LayoutControl } from './layout-control'
import { X, Plus, Trash } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ElementSettingsProps {
    element: Element
    onUpdateElement: (id: string, updates: Partial<Element>) => void
    onClose: () => void
}

export function ElementSettings({ element, onUpdateElement, onClose }: ElementSettingsProps) {
    const handleUpdate = (updates: Partial<Element>) => {
        onUpdateElement(element.id, updates)
    }

    const [newOption, setNewOption] = React.useState('')

    const handleAddOption = () => {
        if (!newOption.trim()) return
        const currentOptions = element.options || []
        handleUpdate({ options: [...currentOptions, newOption.trim()] })
        setNewOption('')
    }

    const handleRemoveOption = (indexToRemove: number) => {
        const currentOptions = element.options || []
        handleUpdate({
            options: currentOptions.filter((_, index) => index !== indexToRemove)
        })
    }

    return (
        <Popover open={true} onOpenChange={onClose}>
            <PopoverTrigger asChild>
                <div />
            </PopoverTrigger>
            <PopoverContent
                className="w-80"
                align="end"
                side="left"
                sideOffset={5}
                alignOffset={0}
                avoidCollisions={true}
                collisionPadding={16}
                sticky="always"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Element Settings</h3>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Label</Label>
                        <Input
                            value={element.label}
                            onChange={(e) => handleUpdate({ label: e.target.value })}
                            placeholder="Enter label"
                        />
                    </div>

                    {(element.type === 'select' || element.type === 'radio' || element.type === 'checkbox') && (
                        <div className="space-y-2">
                            <Label>{element.type === 'select' ? 'Options' : element.type === 'radio' ? 'Radio Options' : 'Checkboxes'}</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={newOption}
                                    onChange={(e) => setNewOption(e.target.value)}
                                    placeholder={`Add new ${element.type === 'select' ? 'option' : element.type === 'radio' ? 'radio option' : 'checkbox'}`}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            handleAddOption()
                                        }
                                    }}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={handleAddOption}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {(element.options || []).map((option, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                                        <span className="flex-1 text-sm">{option}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
                                            onClick={() => handleRemoveOption(index)}
                                        >
                                            <Trash className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {element.type !== 'staticText' && element.type !== 'button' && (
                        <div className="space-y-2">
                            <Label>Placeholder</Label>
                            <Input
                                value={element.placeholder || ''}
                                onChange={(e) => handleUpdate({ placeholder: e.target.value })}
                                placeholder="Enter placeholder text"
                            />
                        </div>
                    )}

                    {element.type === 'button' && (
                        <>
                            <div className="space-y-2">
                                <Label>Style</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['default', 'outline', 'secondary', 'destructive', 'ghost', 'link'].map((variant) => (
                                        <Button
                                            key={variant}
                                            variant={element.buttonConfig?.variant === variant ? 'default' : 'outline'}
                                            size="sm"
                                            className="w-full"
                                            onClick={() => {
                                                const newConfig = {
                                                    ...(element.buttonConfig || {}),
                                                    variant
                                                } as NonNullable<Element['buttonConfig']>
                                                handleUpdate({ buttonConfig: newConfig })
                                            }}
                                        >
                                            {variant.charAt(0).toUpperCase() + variant.slice(1)}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Size</Label>
                                <div className="flex gap-2">
                                    {['default', 'sm', 'lg'].map((size) => (
                                        <Button
                                            key={size}
                                            variant={element.buttonConfig?.size === size ? 'default' : 'outline'}
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => {
                                                const newConfig = {
                                                    ...(element.buttonConfig || {}),
                                                    size
                                                } as NonNullable<Element['buttonConfig']>
                                                handleUpdate({ buttonConfig: newConfig })
                                            }}
                                        >
                                            {size === 'sm' ? 'Small' : size === 'lg' ? 'Large' : 'Default'}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Action</Label>
                                <div className="flex gap-2">
                                    <Button
                                        variant={element.buttonConfig?.action !== 'navigate' ? 'default' : 'outline'}
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => handleUpdate({
                                            buttonConfig: {
                                                ...element.buttonConfig,
                                                action: 'submit'
                                            }
                                        })}
                                    >
                                        Submit Form
                                    </Button>
                                    <Button
                                        variant={element.buttonConfig?.action === 'navigate' ? 'default' : 'outline'}
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => handleUpdate({
                                            buttonConfig: {
                                                ...element.buttonConfig,
                                                action: 'navigate'
                                            }
                                        })}
                                    >
                                        Navigate
                                    </Button>
                                </div>
                            </div>
                            {element.buttonConfig?.action === 'navigate' && (
                                <>
                                    <div className="space-y-2">
                                        <Label>URL</Label>
                                        <Input
                                            value={element.buttonConfig?.url ?? ''}
                                            onChange={(e) => handleUpdate({
                                                buttonConfig: {
                                                    ...element.buttonConfig,
                                                    url: e.target.value
                                                }
                                            })}
                                            placeholder="Enter URL"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Open in</Label>
                                        <div className="flex gap-2">
                                            <Button
                                                variant={element.buttonConfig?.target?.toString() !== '_blank' ? 'default' : 'outline'}
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => handleUpdate({
                                                    buttonConfig: {
                                                        ...element.buttonConfig,
                                                        target: '_self'
                                                    }
                                                })}
                                            >
                                                Same Window
                                            </Button>
                                            <Button
                                                variant={element.buttonConfig?.target?.toString() === '_blank' ? 'default' : 'outline'}
                                                size="sm"
                                                className="flex-1"
                                                onClick={() => handleUpdate({
                                                    buttonConfig: {
                                                        ...element.buttonConfig,
                                                        target: '_blank'
                                                    }
                                                })}
                                            >
                                                New Tab
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                            value={element.description || ''}
                            onChange={(e) => handleUpdate({ description: e.target.value })}
                            placeholder="Enter description"
                        />
                    </div>

                    {element.type !== 'staticText' && element.type !== 'button' && (
                        <div className="flex items-center justify-between">
                            <Label>Required</Label>
                            <Switch
                                checked={element.required || false}
                                onCheckedChange={(checked) => handleUpdate({ required: checked })}
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Layout</Label>
                        <LayoutControl
                            layout={element.layout || 'full'}
                            onChange={(layout) => handleUpdate({ layout })}
                        />
                    </div>

                    {element.type === 'date' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Allow Past Dates</Label>
                                <Switch
                                    checked={element.dateConfig?.allowPastDates ?? true}
                                    onCheckedChange={(checked) => handleUpdate({
                                        dateConfig: {
                                            ...(element.dateConfig || {}),
                                            allowPastDates: checked
                                        }
                                    })}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label>Allow Future Dates</Label>
                                <Switch
                                    checked={element.dateConfig?.allowFutureDates ?? true}
                                    onCheckedChange={(checked) => handleUpdate({
                                        dateConfig: {
                                            ...(element.dateConfig || {}),
                                            allowFutureDates: checked
                                        }
                                    })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Min Date</Label>
                                <Input
                                    type="date"
                                    value={element.dateConfig?.minDate || ''}
                                    onChange={(e) => handleUpdate({
                                        dateConfig: {
                                            ...(element.dateConfig || {}),
                                            minDate: e.target.value
                                        }
                                    })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Max Date</Label>
                                <Input
                                    type="date"
                                    value={element.dateConfig?.maxDate || ''}
                                    onChange={(e) => handleUpdate({
                                        dateConfig: {
                                            ...(element.dateConfig || {}),
                                            maxDate: e.target.value
                                        }
                                    })}
                                />
                            </div>
                        </div>
                    )}

                    {element.type === 'number' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Min Value</Label>
                                <Input
                                    type="number"
                                    value={element.validation?.min || ''}
                                    onChange={(e) => handleUpdate({
                                        validation: {
                                            ...(element.validation || {}),
                                            min: e.target.value ? Number(e.target.value) : undefined
                                        }
                                    })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Max Value</Label>
                                <Input
                                    type="number"
                                    value={element.validation?.max || ''}
                                    onChange={(e) => handleUpdate({
                                        validation: {
                                            ...(element.validation || {}),
                                            max: e.target.value ? Number(e.target.value) : undefined
                                        }
                                    })}
                                />
                            </div>
                        </div>
                    )}

                    {element.type === 'table' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Table Columns</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleUpdate({
                                        tableConfig: {
                                            columns: [
                                                ...(element.tableConfig?.columns || []),
                                                {
                                                    id: crypto.randomUUID(),
                                                    header: 'New Column',
                                                    type: 'text'
                                                }
                                            ],
                                            minRows: element.tableConfig?.minRows || 1,
                                            maxRows: element.tableConfig?.maxRows || 10
                                        }
                                    })}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Column
                                </Button>
                            </div>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {(element.tableConfig?.columns || []).map((column, index) => (
                                    <div key={column.id} className="space-y-2 p-3 rounded-md bg-muted/50">
                                        <div className="flex items-center gap-2">
                                            <Input
                                                value={column.header}
                                                onChange={(e) => {
                                                    const updatedColumns = [...(element.tableConfig?.columns || [])]
                                                    updatedColumns[index] = {
                                                        ...updatedColumns[index],
                                                        header: e.target.value
                                                    }
                                                    handleUpdate({
                                                        tableConfig: {
                                                            ...element.tableConfig,
                                                            columns: updatedColumns
                                                        }
                                                    })
                                                }}
                                                className="flex-1"
                                                placeholder="Column name"
                                            />
                                            <Select
                                                value={column.type}
                                                onValueChange={(value) => {
                                                    const type = value as TableColumn['type']
                                                    const updatedColumns = [...(element.tableConfig?.columns || [])]
                                                    updatedColumns[index] = {
                                                        ...updatedColumns[index],
                                                        type,
                                                        ...(type === 'select' ? { options: [] } : { options: undefined }),
                                                        ...(type === 'staticText' ? { staticValue: '' } : { staticValue: undefined })
                                                    }
                                                    handleUpdate({
                                                        tableConfig: {
                                                            ...element.tableConfig,
                                                            columns: updatedColumns
                                                        }
                                                    })
                                                }}
                                            >
                                                <SelectTrigger className="w-[120px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="text">Text</SelectItem>
                                                    <SelectItem value="number">Number</SelectItem>
                                                    <SelectItem value="date">Date</SelectItem>
                                                    <SelectItem value="select">Select</SelectItem>
                                                    <SelectItem value="staticText">Static Text</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 hover:bg-destructive hover:text-destructive-foreground"
                                                onClick={() => {
                                                    const updatedColumns = element.tableConfig?.columns.filter((_, i) => i !== index) || []
                                                    handleUpdate({
                                                        tableConfig: {
                                                            ...element.tableConfig,
                                                            columns: updatedColumns
                                                        }
                                                    })
                                                }}
                                            >
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </div>

                                        {column.type === 'select' && (
                                            <div className="space-y-2 pl-2 mt-2">
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={newOption}
                                                        onChange={(e) => setNewOption(e.target.value)}
                                                        placeholder="Add option"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault()
                                                                if (!newOption.trim()) return
                                                                const updatedColumns = [...(element.tableConfig?.columns || [])]
                                                                const currentOptions = updatedColumns[index].options || []
                                                                if (!currentOptions.includes(newOption.trim())) {
                                                                    updatedColumns[index] = {
                                                                        ...updatedColumns[index],
                                                                        options: [...currentOptions, newOption.trim()]
                                                                    }
                                                                    handleUpdate({
                                                                        tableConfig: {
                                                                            ...element.tableConfig,
                                                                            columns: updatedColumns
                                                                        }
                                                                    })
                                                                    setNewOption('')
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => {
                                                            if (!newOption.trim()) return
                                                            const updatedColumns = [...(element.tableConfig?.columns || [])]
                                                            const currentOptions = updatedColumns[index].options || []
                                                            if (!currentOptions.includes(newOption.trim())) {
                                                                updatedColumns[index] = {
                                                                    ...updatedColumns[index],
                                                                    options: [...currentOptions, newOption.trim()]
                                                                }
                                                                handleUpdate({
                                                                    tableConfig: {
                                                                        ...element.tableConfig,
                                                                        columns: updatedColumns
                                                                    }
                                                                })
                                                                setNewOption('')
                                                            }
                                                        }}
                                                    >
                                                        Add
                                                    </Button>
                                                </div>
                                                <div className="space-y-1 max-h-[150px] overflow-y-auto">
                                                    {(column.options || []).map((option, optionIndex) => (
                                                        <div key={optionIndex} className="flex items-center justify-between bg-background/50 px-2 py-1 rounded">
                                                            <span className="text-sm">{option}</span>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 hover:bg-destructive hover:text-destructive-foreground"
                                                                onClick={() => {
                                                                    const updatedColumns = [...(element.tableConfig?.columns || [])]
                                                                    updatedColumns[index] = {
                                                                        ...updatedColumns[index],
                                                                        options: column.options?.filter((_, i) => i !== optionIndex)
                                                                    }
                                                                    handleUpdate({
                                                                        tableConfig: {
                                                                            ...element.tableConfig,
                                                                            columns: updatedColumns
                                                                        }
                                                                    })
                                                                }}
                                                            >
                                                                <Trash className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    {(!column.options || column.options.length === 0) && (
                                                        <p className="text-sm text-muted-foreground py-1">No options added yet</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {column.type === 'staticText' && (
                                            <div className="space-y-2 pl-2 mt-2">
                                                <div className="flex gap-2">
                                                    <Input
                                                        value={column.staticValue || ''}
                                                        onChange={(e) => {
                                                            const updatedColumns = [...(element.tableConfig?.columns || [])]
                                                            updatedColumns[index] = {
                                                                ...updatedColumns[index],
                                                                staticValue: e.target.value
                                                            }
                                                            handleUpdate({
                                                                tableConfig: {
                                                                    ...element.tableConfig,
                                                                    columns: updatedColumns
                                                                }
                                                            })
                                                        }}
                                                        placeholder="Enter static text"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-2">
                                <Label>Min Rows</Label>
                                <Input
                                    type="number"
                                    value={element.tableConfig?.minRows || 1}
                                    onChange={(e) => handleUpdate({
                                        tableConfig: {
                                            columns: element.tableConfig?.columns || [],
                                            minRows: Math.max(1, Number(e.target.value)),
                                            maxRows: element.tableConfig?.maxRows
                                        }
                                    })}
                                    min="1"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Max Rows</Label>
                                <Input
                                    type="number"
                                    value={element.tableConfig?.maxRows || 10}
                                    onChange={(e) => handleUpdate({
                                        tableConfig: {
                                            columns: element.tableConfig?.columns || [],
                                            minRows: element.tableConfig?.minRows || 1,
                                            maxRows: Math.max(
                                                Number(element.tableConfig?.minRows || 1),
                                                Number(e.target.value)
                                            )
                                        }
                                    })}
                                    min={element.tableConfig?.minRows || 1}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
