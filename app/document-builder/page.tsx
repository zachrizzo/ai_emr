'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DocumentBuilderProvider, useDocumentBuilder, DocumentTemplate } from './document-builder-context'
import { Button } from "@/components/ui/button"
import { toast } from '@/components/ui/use-toast'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PlusCircle, UserPlus } from 'lucide-react'
import { DataGrid } from '@/components/data-grid'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { AssignTemplateModal } from '@/components/assign-template-modal'
import { useUser } from '@/contexts/UserContext'

function DocumentBuilderContent() {
  const { templates, createNewTemplate, fetchTemplates, isLoading } = useDocumentBuilder()
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [templateTags, setTemplateTags] = useState('')
  const [isAddingTemplate, setIsAddingTemplate] = useState(false)
  const [selectedTemplates, setSelectedTemplates] = useState<DocumentTemplate[]>([])
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const router = useRouter()
  const { user } = useUser()

  useEffect(() => {
    if (user) {
      fetchTemplates()
    }
  }, [fetchTemplates, user])

  const handleNewTemplate = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a template.",
        variant: "destructive",
      })
      return
    }

    try {
      const newTemplate = await createNewTemplate()
      if (newTemplate?.id) {
        router.push(`/document-builder/${newTemplate.id}`)
      } else {
        throw new Error('Failed to create template')
      }
    } catch (error) {
      console.error('Error creating new template:', error)
      toast({
        title: "Error",
        description: "Failed to create a new template. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEditTemplate = (templateId: string) => {
    router.push(`/document-builder/${templateId}`)
  }

  const handleDeleteTemplates = async (templatesToDelete: DocumentTemplate[]) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete templates.",
        variant: "destructive",
      })
      return
    }

    if (!supabase) {
      toast({
        title: "Error",
        description: "Database connection not available.",
        variant: "destructive",
      })
      return
    }

    try {
      const templateIds = templatesToDelete.map(template => template.id)
      const { error } = await supabase
        .from('document_templates')
        .delete()
        .in('id', templateIds)
        .eq('organization_id', user.organization_id)

      if (error) throw error

      toast({
        title: "Success",
        description: `${templatesToDelete.length} template(s) deleted successfully`,
      })
      fetchTemplates()
      setSelectedTemplates([])
    } catch (error) {
      console.error('Error deleting templates:', error)
      toast({
        title: "Error",
        description: "Failed to delete templates. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleAssignTemplate = () => {
    if (selectedTemplates.length > 0) {
      setIsAssignModalOpen(true)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="w-48 h-8 bg-muted animate-pulse rounded" />
            <div className="flex items-center space-x-2">
              <div className="w-32 h-10 bg-muted animate-pulse rounded" />
              <div className="w-32 h-10 bg-muted animate-pulse rounded" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded">
                  <div className="space-y-2">
                    <div className="w-48 h-5 bg-muted animate-pulse rounded" />
                    <div className="w-32 h-4 bg-muted animate-pulse rounded" />
                    <div className="w-24 h-4 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="flex space-x-2">
                    <div className="w-20 h-8 bg-muted animate-pulse rounded" />
                    <div className="w-20 h-8 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return <div>Please log in to access the document builder.</div>
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Document Templates</CardTitle>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setIsAddingTemplate(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Template
            </Button>
            <Button
              onClick={handleAssignTemplate}
              disabled={selectedTemplates.length === 0}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Assign Template
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DataGrid
            columns={[
              { header: 'Name', accessorKey: 'name' },
              { header: 'Description', accessorKey: 'description' },
              { header: 'Tags', accessorKey: 'tags', cell: ({ row }) => row.original.tags.join(', ') },
              { header: 'Last Updated', accessorKey: 'updated_at', cell: ({ row }) => new Date(row.original.updated_at).toLocaleString() },
            ]}
            data={templates}
            onEdit={(template) => handleEditTemplate(template.id)}
            onDelete={handleDeleteTemplates}
            onRowSelectionChange={setSelectedTemplates}
          />
        </CardContent>
      </Card>

      {isAddingTemplate && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Create New Template</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Enter template name"
                />
              </div>
              <div>
                <Label htmlFor="templateDescription">Template Description</Label>
                <Input
                  id="templateDescription"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  placeholder="Enter template description"
                />
              </div>
              <div>
                <Label htmlFor="templateTags">Template Tags (comma-separated)</Label>
                <Input
                  id="templateTags"
                  value={templateTags}
                  onChange={(e) => setTemplateTags(e.target.value)}
                  placeholder="Enter tags"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddingTemplate(false)}>Cancel</Button>
                <Button onClick={handleNewTemplate}>Create Template</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <AssignTemplateModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        templates={selectedTemplates}
      />
    </div>
  )
}

export default function DocumentBuilder() {
  return (
    <DocumentBuilderProvider>
      <DndProvider backend={HTML5Backend}>
        <DocumentBuilderContent />
      </DndProvider>
    </DocumentBuilderProvider>
  )
}

