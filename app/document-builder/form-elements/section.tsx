'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { Element } from '../types'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface SectionProps {
    label: string
    description?: string
    elements: Element[]
    collapsible?: boolean
    required?: boolean
    className?: string
    onAddElement: () => void
    onRemoveElement: (id: string) => void
    onToggleCollapsible: () => void
}

export function Section({
    label,
    description,
    elements,
    collapsible = false,
    required,
    className,
    onAddElement,
    onRemoveElement,
    onToggleCollapsible
}: SectionProps) {
    const [isOpen, setIsOpen] = React.useState(true)

    return (
        <div className={cn("grid gap-2", className)}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Label className="font-medium">
                        {label}
                        {required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    <div className="flex items-center gap-2">
                        <Switch
                            checked={collapsible}
                            onCheckedChange={onToggleCollapsible}
                        />
                        <Label className="text-sm text-muted-foreground">Collapsible</Label>
                    </div>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onAddElement}
                >
                    Add Element
                </Button>
            </div>
            {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <div className="border rounded-lg">
                {collapsible ? (
                    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 hover:bg-accent">
                            <h3 className="text-sm font-medium">Section Content</h3>
                            {isOpen ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <div className="p-4 pt-0 space-y-4">
                                {elements.length > 0 ? (
                                    elements.map((element) => (
                                        <div
                                            key={element.id}
                                            className="flex items-center justify-between p-2 bg-accent/50 rounded"
                                        >
                                            <span className="text-sm">{element.label}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onRemoveElement(element.id)}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                Remove
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No elements added to this section yet
                                    </p>
                                )}
                            </div>
                        </CollapsibleContent>
                    </Collapsible>
                ) : (
                    <div className="p-4 space-y-4">
                        {elements.length > 0 ? (
                            elements.map((element) => (
                                <div
                                    key={element.id}
                                    className="flex items-center justify-between p-2 bg-accent/50 rounded"
                                >
                                    <span className="text-sm">{element.label}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onRemoveElement(element.id)}
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    >
                                        Remove
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center">
                                No elements added to this section yet
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
