'use client'

import { useState } from 'react'
import { NoteTemplate } from '@/types/notes'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Search, FileText } from 'lucide-react'

interface NoteTemplateSelectorProps {
    templates: NoteTemplate[]
    selectedTemplate: NoteTemplate | null
    onSelectTemplate: (template: NoteTemplate) => void
}

export function NoteTemplateSelector({
    templates,
    selectedTemplate,
    onSelectTemplate
}: NoteTemplateSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

    const categories = Array.from(
        new Set(templates.map(template => template.category).filter((category): category is string => !!category))
    )

    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.content.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = !selectedCategory || template.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search templates..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                />
            </div>

            {categories.length > 0 && (
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-2 pb-4">
                        <Button
                            variant={selectedCategory === null ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setSelectedCategory(null)}
                        >
                            All
                        </Button>
                        {categories.map((category) => (
                            <Button
                                key={category}
                                variant={selectedCategory === category ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => setSelectedCategory(category)}
                            >
                                {category}
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            )}

            <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                    {filteredTemplates.map((template) => (
                        <Button
                            key={template.id}
                            variant="ghost"
                            className={cn(
                                "w-full justify-start p-3",
                                selectedTemplate?.id === template.id && "bg-accent"
                            )}
                            onClick={() => onSelectTemplate(template)}
                        >
                            <div className="flex items-start gap-2">
                                <FileText className="h-4 w-4 mt-1" />
                                <div className="flex flex-col items-start gap-1 text-left">
                                    <span className="font-medium">{template.name}</span>
                                    {template.specialty && (
                                        <Badge variant="outline" className="text-xs">
                                            {template.specialty}
                                        </Badge>
                                    )}
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {template.content}
                                    </p>
                                </div>
                            </div>
                        </Button>
                    ))}

                    {filteredTemplates.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-4">
                            No templates found
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}
