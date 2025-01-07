'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { NoteTemplate } from '@/types/notes'
import { FileText, Search, Tag, Clock, Check } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from "@/components/ui/use-toast"

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
    const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')

    // Get unique specialties and categories
    const specialties = ['all', ...new Set(templates.map(t => t.specialty || 'uncategorized'))]
    const categories = ['all', ...new Set(templates.map(t => t.category || 'uncategorized'))]

    // Filter templates based on search and filters
    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.content.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesSpecialty = selectedSpecialty === 'all' || template.specialty === selectedSpecialty
        const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
        return matchesSearch && matchesSpecialty && matchesCategory
    })

    const handleTemplateSelect = (template: NoteTemplate) => {
        onSelectTemplate(template)
        toast({
            title: 'Template Selected',
            description: `Template "${template.name}" has been loaded into the editor.`,
        })
    }

    return (
        <div className="space-y-4">
            {/* Search and Filters */}
            <div className="space-y-3">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                        <SelectTrigger>
                            <SelectValue placeholder="Specialty" />
                        </SelectTrigger>
                        <SelectContent>
                            {specialties.map((specialty) => (
                                <SelectItem key={specialty} value={specialty}>
                                    {specialty.charAt(0).toUpperCase() + specialty.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                            <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((category) => (
                                <SelectItem key={category} value={category}>
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Template List */}
            <ScrollArea className="h-[calc(100vh-400px)]">
                <div className="space-y-2">
                    {filteredTemplates.map((template) => (
                        <Card
                            key={template.id}
                            className={`p-3 cursor-pointer transition-colors hover:bg-accent ${selectedTemplate?.id === template.id ? 'border-primary bg-accent' : ''
                                }`}
                            onClick={() => handleTemplateSelect(template)}
                        >
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4" />
                                        <span className="font-medium">{template.name}</span>
                                    </div>
                                    {selectedTemplate?.id === template.id && (
                                        <Check className="h-4 w-4 text-primary" />
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-1">
                                    {template.specialty && (
                                        <Badge variant="secondary">
                                            {template.specialty}
                                        </Badge>
                                    )}
                                    {template.category && (
                                        <Badge variant="outline">
                                            {template.category}
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                        Updated {format(new Date(template.updated_at), 'MMM d, yyyy')}
                                    </span>
                                </div>

                                <div className="text-sm text-muted-foreground line-clamp-2">
                                    {template.content.substring(0, 150)}...
                                </div>
                            </div>
                        </Card>
                    ))}

                    {filteredTemplates.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-4">
                            No templates found matching your criteria.
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}
