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
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

function EditTemplateContent({ id }: { id: string }) {
  const { currentTemplate, saveTemplate, loadTemplate, isLoading, addElement, updateElement, removeElement, moveElement } = useDocumentBuilder()
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [templateTags, setTemplateTags] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadTemplate(id)
  }, [id, loadTemplate])

  useEffect(() => {
    if (currentTemplate) {
      setTemplateName(currentTemplate.name)
      setTemplateDescription(currentTemplate.description)
      setTemplateTags(currentTemplate.tags.join(', '))
    }
  }, [currentTemplate])

  const handleChange = useCallback((name: string, description: string, tags: string) => {
    setTemplateName(name)
    setTemplateDescription(description)
    setTemplateTags(tags)
    setHasUnsavedChanges(true)
  }, [])

  const handleSave = async () => {
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
  }

  const handleInputChange = (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setter(newValue)
    handleChange(
      setter === setTemplateName ? newValue : templateName,
      setter === setTemplateDescription ? newValue : templateDescription,
      setter === setTemplateTags ? newValue : templateTags
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <div className="w-64 h-8 bg-muted animate-pulse rounded" />
          </CardHeader>
          <div className="flex justify-between items-center mb-4 px-6">
            <div className="w-32 h-10 bg-muted animate-pulse rounded" />
            <div className="space-x-2 flex">
              <div className="w-32 h-10 bg-muted animate-pulse rounded" />
              <div className="w-32 h-10 bg-muted animate-pulse rounded" />
            </div>
          </div>
          <CardContent>
            <div className="space-y-4 mb-4">
              {/* Template Info Skeleton */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="w-24 h-4 bg-muted animate-pulse rounded" />
                  <div className="w-full h-10 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>

            {/* Tabs Skeleton */}
            <div className="w-full mt-4">
              <div className="flex border-b space-x-2 mb-4">
                <div className="w-20 h-8 bg-muted animate-pulse rounded" />
                <div className="w-20 h-8 bg-muted animate-pulse rounded" />
              </div>

              {/* Editor Content Skeleton */}
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 border rounded">
                    <div className="space-y-3">
                      <div className="w-48 h-5 bg-muted animate-pulse rounded" />
                      <div className="w-full h-24 bg-muted animate-pulse rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Edit Template: {templateName}</CardTitle>
        </CardHeader>
        <div className="flex justify-between items-center mb-4 px-6">
          <Button onClick={() => router.push('/document-builder')}>Back to Templates</Button>
          <div className="space-x-2">
            <Button onClick={() => exportToPDF(currentTemplate?.content || [])}>Export to PDF</Button>
            <Button onClick={handleSave} disabled={isSaving || !hasUnsavedChanges}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Saved'}
            </Button>
          </div>
        </div>
        <CardContent>
          <div className="space-y-4 mb-4">
            <div>
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={handleInputChange(setTemplateName)}
                placeholder="Enter template name"
              />
            </div>
            <div>
              <Label htmlFor="templateDescription">Template Description</Label>
              <Input
                id="templateDescription"
                value={templateDescription}
                onChange={handleInputChange(setTemplateDescription)}
                placeholder="Enter template description"
              />
            </div>
            <div>
              <Label htmlFor="templateTags">Template Tags (comma-separated)</Label>
              <Input
                id="templateTags"
                value={templateTags}
                onChange={handleInputChange(setTemplateTags)}
                placeholder="Enter tags"
              />
            </div>
          </div>

          <Tabs defaultValue="edit" className="w-full mt-4">
            <TabsList>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="edit">
              <EditorPane
                addElement={addElement}
                updateElement={updateElement}
                removeElement={removeElement}
                moveElement={moveElement}
              />
            </TabsContent>
            <TabsContent value="preview">
              <PreviewPane />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
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

