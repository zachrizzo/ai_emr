import React from 'react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { NoteTemplate } from '@/types/notes'

interface NoteTemplateSelectorProps {
    templates: NoteTemplate[]
    selectedTemplate: NoteTemplate | null
    onSelectTemplate: (template: NoteTemplate | null) => void
}

export function NoteTemplateSelector({ templates, selectedTemplate, onSelectTemplate }: NoteTemplateSelectorProps) {
    return (
        <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-2">
                {templates.map((template) => (
                    <Button
                        key={template.id}
                        variant={selectedTemplate?.id === template.id ? "secondary" : "outline"}
                        className="w-full justify-start"
                        onClick={() => onSelectTemplate(template)}
                    >
                        {template.name}
                    </Button>
                ))}
            </div>
        </ScrollArea>
    )
}
