'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { DocumentBuilderProvider, useDocumentBuilder } from '../document-builder-context'
import { EditorPane } from '../components/EditorPane'
import { PreviewPane } from '../preview-pane'
import { exportToPDF } from '../pdf-export'
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/use-toast'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Save, ArrowLeft, FileDown, Eye, Edit2, ChevronLeft, ChevronRight, Settings } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { cn } from '@/lib/utils'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

function EditTemplateContent({ id }: { id: string }) {
  const { currentTemplate, saveTemplate, loadTemplate, isLoading, addElement, updateElement, removeElement, moveElement } = useDocumentBuilder()
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [templateTags, setTemplateTags] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [activeTab, setActiveTab] = useState('edit')
  const router = useRouter()
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(true)

  // Only load template once on mount or when ID changes
  useEffect(() => {
    if (!currentTemplate || currentTemplate.id !== id) {
      loadTemplate(id)
    }
  }, [id, loadTemplate, currentTemplate])

  // Update local state only when template changes
  useEffect(() => {
    if (currentTemplate && !hasUnsavedChanges) {
      setTemplateName(currentTemplate.name)
      setTemplateDescription(currentTemplate.description)
      setTemplateTags(currentTemplate.tags.join(', '))
    }
  }, [currentTemplate, hasUnsavedChanges])

  const handleChange = useCallback((name: string, description: string, tags: string) => {
    setTemplateName(name)
    setTemplateDescription(description)
    setTemplateTags(tags)
    setHasUnsavedChanges(true)
  }, [])

  const handleInputChange = useCallback((setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.preventDefault()
    const newValue = e.target.value
    setter(newValue)
    handleChange(
      setter === setTemplateName ? newValue : templateName,
      setter === setTemplateDescription ? newValue : templateDescription,
      setter === setTemplateTags ? newValue : templateTags
    )
  }, [handleChange, templateName, templateDescription, templateTags, setTemplateName])

  const handleSave = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }

    if (templateName.trim() === '') {
      toast({
        title: "Error",
        description: "Template name cannot be empty",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      await saveTemplate(templateName, templateDescription, templateTags.split(',').map(tag => tag.trim()))
      toast({
        title: "Success",
        description: "Template saved successfully",
      })
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Error saving template:', error)
      toast({
        title: "Error",
        description: "Failed to save template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }, [templateName, templateDescription, templateTags, saveTemplate])

  // Only show loading state on initial load
  if (isLoading && !currentTemplate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <form onSubmit={handleSave} className="h-full">
        {/* Header */}
        <div className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => router.push('/document-builder')}
                  className="hover:bg-accent"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <div>
                  <h1 className="text-2xl font-bold">{templateName || 'Untitled Template'}</h1>
                  <p className="text-muted-foreground text-sm">
                    {currentTemplate?.created_at ? `Created ${new Date(currentTemplate.created_at).toLocaleDateString()}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => exportToPDF(currentTemplate?.content || [])}
                >
                  <FileDown className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || !hasUnsavedChanges}
                  className={cn(
                    "min-w-[100px]",
                    hasUnsavedChanges && "animate-pulse"
                  )}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className={cn("h-4 w-4 mr-2", hasUnsavedChanges && "text-yellow-500")} />
                  )}
                  {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Saved'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Template Details Panel */}
            <div className={cn(
              "transition-all duration-200 ease-in-out",
              isDetailsExpanded ? "lg:col-span-3" : "lg:col-span-1"
            )}>
              <Card className="relative h-full">
                <Collapsible open={isDetailsExpanded} onOpenChange={setIsDetailsExpanded}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -right-3 top-1/2 transform -translate-y-1/2 z-10 bg-background border shadow-sm"
                    >
                      {isDetailsExpanded ? (
                        <ChevronLeft className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className={cn(
                    "p-6 space-y-4",
                    !isDetailsExpanded && "hidden"
                  )}>
                    <div className="flex items-center gap-2 mb-4">
                      <Settings className="h-4 w-4" />
                      <h2 className="font-semibold">Template Details</h2>
                    </div>
                    <div>
                      <Label htmlFor="templateName" className="text-sm font-medium">Template Name</Label>
                      <Input
                        id="templateName"
                        value={templateName}
                        onChange={handleInputChange(setTemplateName)}
                        placeholder="Enter template name"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="templateDescription" className="text-sm font-medium">Description</Label>
                      <Textarea
                        id="templateDescription"
                        value={templateDescription}
                        onChange={handleInputChange(setTemplateDescription)}
                        placeholder="Enter template description"
                        className="mt-1.5 min-h-[100px]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="templateTags" className="text-sm font-medium">Tags</Label>
                      <Input
                        id="templateTags"
                        value={templateTags}
                        onChange={handleInputChange(setTemplateTags)}
                        placeholder="Enter tags (comma-separated)"
                        className="mt-1.5"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Separate tags with commas (e.g., medical, intake, consent)
                      </p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </div>

            {/* Editor/Preview Area */}
            <Card className={cn(
              "transition-all duration-200 ease-in-out",
              isDetailsExpanded ? "lg:col-span-9" : "lg:col-span-11"
            )}>
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="flex items-center justify-between mb-6">
                    <TabsList className="grid grid-cols-2 w-[200px]">
                      <TabsTrigger value="edit" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Edit2 className="h-4 w-4 mr-2" />
                        Editor
                      </TabsTrigger>
                      <TabsTrigger value="preview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </TabsTrigger>
                    </TabsList>
                  </div>
                  <TabsContent value="edit" className="border rounded-lg p-4">
                    <EditorPane
                      addElement={addElement}
                      updateElement={updateElement}
                      removeElement={removeElement}
                      moveElement={moveElement}
                    />
                  </TabsContent>
                  <TabsContent value="preview" className="border rounded-lg p-4">
                    <PreviewPane />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}

export default function EditTemplatePage({ params }: { params: { id: string } }) {
  return (
    <DocumentBuilderProvider>
      <DndProvider backend={HTML5Backend}>
        <EditTemplateContent id={params.id} />
      </DndProvider>
    </DocumentBuilderProvider>
  )
}

