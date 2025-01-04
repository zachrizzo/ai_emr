import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Save, Plus, History, Star, Copy } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

interface Template {
    id: string
    name: string
    content: string
    specialty: string
    version: number
    isDefault: boolean
    createdAt: string
    updatedAt: string
    createdBy: string
    tags: string[]
}

interface TemplateVersion {
    version: number
    content: string
    updatedAt: string
    updatedBy: string
}

interface TemplateManagerProps {
    specialty: string
    onSelectTemplate: (content: string) => void
    providerId: string
}

export function TemplateManager({ specialty, onSelectTemplate, providerId }: TemplateManagerProps) {
    const [templates, setTemplates] = useState<Template[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
    const [versions, setVersions] = useState<TemplateVersion[]>([])
    const [isCreating, setIsCreating] = useState(false)
    const [newTemplate, setNewTemplate] = useState({
        name: '',
        content: '',
        tags: '',
    })

    const handleCreateTemplate = () => {
        const template: Template = {
            id: Math.random().toString(36).substr(2, 9),
            name: newTemplate.name,
            content: newTemplate.content,
            specialty,
            version: 1,
            isDefault: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: providerId,
            tags: newTemplate.tags.split(',').map(tag => tag.trim()),
        }

        setTemplates([...templates, template])
        setIsCreating(false)
        setNewTemplate({ name: '', content: '', tags: '' })
    }

    const handleUpdateTemplate = (template: Template, newContent: string) => {
        // Save current version to history
        const newVersion: TemplateVersion = {
            version: template.version,
            content: template.content,
            updatedAt: template.updatedAt,
            updatedBy: template.createdBy,
        }
        setVersions([...versions, newVersion])

        // Update template
        const updatedTemplate = {
            ...template,
            content: newContent,
            version: template.version + 1,
            updatedAt: new Date().toISOString(),
        }

        setTemplates(templates.map(t => t.id === template.id ? updatedTemplate : t))
        setSelectedTemplate(updatedTemplate)
    }

    const handleRestoreVersion = (version: TemplateVersion) => {
        if (selectedTemplate) {
            handleUpdateTemplate(selectedTemplate, version.content)
        }
    }

    const handleDuplicateTemplate = (template: Template) => {
        const duplicatedTemplate: Template = {
            ...template,
            id: Math.random().toString(36).substr(2, 9),
            name: `${template.name} (Copy)`,
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDefault: false,
        }

        setTemplates([...templates, duplicatedTemplate])
    }

    return (
        <div className="grid grid-cols-2 gap-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                        <span>Templates</span>
                        <Button onClick={() => setIsCreating(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            New Template
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px] pr-4">
                        {templates
                            .filter(t => t.specialty === specialty)
                            .map(template => (
                                <div
                                    key={template.id}
                                    className={`p-4 border rounded-lg mb-2 cursor-pointer hover:bg-accent ${selectedTemplate?.id === template.id ? 'border-primary' : ''}`}
                                    onClick={() => setSelectedTemplate(template)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-medium">{template.name}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Version {template.version}
                                            </p>
                                        </div>
                                        {template.isDefault && (
                                            <Badge variant="secondary">
                                                <Star className="h-3 w-3 mr-1" />
                                                Default
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        {template.tags.map((tag, index) => (
                                            <Badge key={index} variant="outline">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </ScrollArea>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>
                        {selectedTemplate ? 'Edit Template' : 'Create Template'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isCreating ? (
                        <div className="space-y-4">
                            <div>
                                <Label>Template Name</Label>
                                <Input
                                    value={newTemplate.name}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                    placeholder="Enter template name..."
                                />
                            </div>
                            <div>
                                <Label>Content</Label>
                                <Textarea
                                    value={newTemplate.content}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                                    placeholder="Enter template content..."
                                    className="min-h-[200px]"
                                />
                            </div>
                            <div>
                                <Label>Tags (comma-separated)</Label>
                                <Input
                                    value={newTemplate.tags}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, tags: e.target.value })}
                                    placeholder="Enter tags..."
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsCreating(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreateTemplate}>
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Template
                                </Button>
                            </div>
                        </div>
                    ) : selectedTemplate ? (
                        <div className="space-y-4">
                            <Textarea
                                value={selectedTemplate.content}
                                onChange={(e) => handleUpdateTemplate(selectedTemplate, e.target.value)}
                                className="min-h-[200px]"
                            />
                            <div className="flex justify-between">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline">
                                            <History className="h-4 w-4 mr-2" />
                                            Version History
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Version History</DialogTitle>
                                        </DialogHeader>
                                        <ScrollArea className="h-[400px]">
                                            {versions.map((version, index) => (
                                                <div
                                                    key={index}
                                                    className="p-4 border rounded-lg mb-2"
                                                >
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h4 className="font-medium">
                                                            Version {version.version}
                                                        </h4>
                                                        <Button
                                                            variant="ghost"
                                                            onClick={() => handleRestoreVersion(version)}
                                                        >
                                                            Restore
                                                        </Button>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        Updated on {new Date(version.updatedAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            ))}
                                        </ScrollArea>
                                    </DialogContent>
                                </Dialog>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => handleDuplicateTemplate(selectedTemplate)}
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Duplicate
                                    </Button>
                                    <Button onClick={() => onSelectTemplate(selectedTemplate.content)}>
                                        Use Template
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            Select a template to edit or create a new one
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
