'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/utils/supabase-config'
import { toast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { format } from 'date-fns'
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@/contexts/UserContext'

interface DocumentElement {
  id: string
  type: 'text' | 'checkbox' | 'radio' | 'select' | 'textarea'
  label: string
  options?: string[]
  value: string
}

interface AssignedDocument {
  id: string
  document_template_id: string
  assigned_at: string
  due_at: string
  document_templates: {
    name: string
    content: DocumentElement[]
  }
  patient_id: string;
  organization_id: string;
  is_visible_on_portal: boolean;
  status: string;
}

interface FormSubmission {
  id: number
  question: string
  answer: string
}

export default function PatientDocumentPage({ params }: { params: { id: string } }) {
  const [document, setDocument] = useState<AssignedDocument | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const { user } = useUser();

  useEffect(() => {
    const fetchDocument = async () => {
      setIsLoading(true) // Set loading state
      try {
        const { data, error } = await supabase
          .from('assigned_documents')
          .select(`
            *,
            document_templates(name, content)
          `)
          .eq('id', params.id)
          .single()

        if (error) throw error

        if (!data.is_visible_on_portal) {
          throw new Error('Document not accessible')
        }

        setDocument(data as AssignedDocument)
        initializeFormData(data.document_templates.content)
      } catch (error) {
        console.error('Error fetching document:', error)
        toast({
          title: "Error",
          description: "Failed to fetch document. Please try again.",
          variant: "destructive",
        })
        router.push('/patient-portal')
      } finally {
        setIsLoading(false) // Clear loading state
      }
    }

    fetchDocument()
  }, [params.id, router])

  const initializeFormData = (content: DocumentElement[]) => {
    const initialData: Record<string, string> = {}
    content.forEach(element => {
      initialData[element.id] = element.value || ''
    })
    setFormData(initialData)
  }

  const handleInputChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document || !user) return; // Guard clause

    setIsSaving(true);
    try {
      const formSubmissions: FormSubmission[] = document.document_templates.content.map((element, index) => ({
        id: index + 1,
        question: element.label,
        answer: formData[element.id] || ''
      }));

      const { error: insertError } = await supabase
        .from('form_submissions')
        .insert({
          id: uuidv4(),
          assigned_form_id: params.id,
          patient_id: document.patient_id,
          organization_id: user.organization_id, // Use the organization_id from the user context
          created_at: new Date().toISOString(),
          form_data: formSubmissions,
          status: 'completed'
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Document submitted successfully.",
      });
      router.push('/patient-portal'); // Redirect after successful submission
    } catch (error: any) {
      console.error('Error submitting document:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div>Loading...</div> // Loading state
  if (!document) return <div>Document not found.</div>

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>{document.document_templates.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          {document.document_templates.content.map((element) => (
            <div key={element.id} className="mb-4">
              <Label htmlFor={element.id}>{element.label}</Label>
              {element.type === 'text' && (
                <Input
                  id={element.id}
                  value={formData[element.id] || ''}
                  onChange={(e) => handleInputChange(element.id, e.target.value)}
                />
              )}
              {element.type === 'textarea' && (
                <Textarea
                  id={element.id}
                  value={formData[element.id] || ''}
                  onChange={(e) => handleInputChange(element.id, e.target.value)}
                />
              )}
              {element.type === 'checkbox' && (
                <Checkbox
                  id={element.id}
                  checked={formData[element.id] === 'true'}
                  onCheckedChange={(checked) => handleInputChange(element.id, checked ? 'true' : 'false')}
                />
              )}
              {element.type === 'radio' && element.options && (
                <RadioGroup
                  value={formData[element.id]}
                  onValueChange={(value) => handleInputChange(element.id, value)}
                >
                  {element.options.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`${element.id}-${option}`} />
                      <Label htmlFor={`${element.id}-${option}`}>{option}</Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              {element.type === 'select' && element.options && (
                <Select value={formData[element.id]} onValueChange={(value) => handleInputChange(element.id, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {element.options.map((option) => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
          <Button type="submit" disabled={isSaving} onClick={handleSubmit}>
            {isSaving ? 'Submitting...' : 'Submit'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div>
          <p>Assigned: {format(new Date(document.assigned_at), 'MMMM d, yyyy')}</p>
          <p>Due: {format(new Date(document.due_at), 'MMMM d, yyyy')}</p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => router.back()}>Back</Button>
        </div>
      </CardFooter>
    </Card>
  )
}

