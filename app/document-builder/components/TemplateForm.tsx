import React from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface TemplateFormProps {
  templateName: string
  templateDescription: string
  templateTags: string
  onNameChange: (name: string) => void
  onDescriptionChange: (description: string) => void
  onTagsChange: (tags: string) => void
  onSave: () => void
  isSaving: boolean
}

export function TemplateForm({
  templateName,
  templateDescription,
  templateTags,
  onNameChange,
  onDescriptionChange,
  onTagsChange,
  onSave,
  isSaving
}: TemplateFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="template-name">Template Name</Label>
        <Input
          id="template-name"
          value={templateName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Enter template name"
        />
      </div>
      <div>
        <Label htmlFor="template-description">Template Description</Label>
        <Input
          id="template-description"
          value={templateDescription}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Enter template description"
        />
      </div>
      <div>
        <Label htmlFor="template-tags">Template Tags (comma-separated)</Label>
        <Input
          id="template-tags"
          value={templateTags}
          onChange={(e) => onTagsChange(e.target.value)}
          placeholder="Enter tags"
        />
      </div>
      <Button onClick={onSave} disabled={isSaving}>
        {isSaving ? 'Saving...' : 'Save Template'}
      </Button>
    </div>
  )
}

