import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataGrid } from '@/components/data-grid'
import { PatientDocument } from '@/types'
import { createClient } from '@supabase/supabase-js'
import { toast } from "@/components/ui/use-toast"
import { DocumentUploadDialog } from '@/components/document-upload-dialog'
import { PlusCircle } from 'lucide-react'
import { format } from 'date-fns'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface DocumentsTabProps {
  patientId: string
}

export function DocumentsTab({ patientId }: DocumentsTabProps) {
  const [documents, setDocuments] = useState<PatientDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadingDocument, setIsUploadingDocument] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [patientId])

  const fetchDocuments = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('patient_documents')
        .select('*')
        .eq('patient_id', patientId)

      if (error) throw error
      setDocuments(data)
    } catch (error) {
      console.error("Error fetching documents:", error)
      toast({
        title: "Error",
        description: "Failed to fetch documents. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUploadDocument = async (newDocument: Omit<PatientDocument, 'id'>) => {
    try {
      const file = newDocument.file
      if (!file) throw new Error("No file provided")

      const fileExt = file.name.split('.').pop()
      const fileName = `${patientId}/${Date.now()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('patient-documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: insertData, error: insertError } = await supabase
        .from('patient_documents')
        .insert({
          patient_id: patientId,
          file_name: newDocument.file_name,
          file_type: newDocument.file_type,
          upload_date: new Date().toISOString(),
          file_url: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/patient-documents/${fileName}`
        })
        .select()

      if (insertError) throw insertError

      if (insertData && insertData.length > 0) {
        setDocuments(prevDocuments => [...prevDocuments, insertData[0]])
        toast({
          title: "Success",
          description: "Document uploaded successfully.",
        })
      } else {
        throw new Error("No data returned after insert")
      }
    } catch (error) {
      console.error("Error uploading document:", error)
      toast({
        title: "Error",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteDocuments = async (selectedDocuments: PatientDocument[]) => {
    try {
      for (const document of selectedDocuments) {
        const { error: deleteError } = await supabase
          .from('patient_documents')
          .delete()
          .eq('id', document.id)

        if (deleteError) throw deleteError

        const { error: storageError } = await supabase.storage
          .from('patient-documents')
          .remove([`${patientId}/${document.file_name}`])

        if (storageError) throw storageError
      }
      setDocuments(documents.filter(document => !selectedDocuments.some(selected => selected.id === document.id)))
      toast({
        title: "Success",
        description: "Selected documents deleted successfully.",
      })
    } catch (error) {
      console.error("Error deleting documents:", error)
      toast({
        title: "Error",
        description: "Failed to delete documents. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) return <div>Loading documents...</div>

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Patient Documents</CardTitle>
          <Button onClick={() => setIsUploadingDocument(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Upload New Document
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <DataGrid
          data={documents}
          columns={[
            { header: 'File Name', accessorKey: 'file_name' },
            { header: 'File Type', accessorKey: 'file_type' },
            { 
              header: 'Upload Date', 
              accessorKey: 'upload_date',
              cell: ({ row }) => format(new Date(row.original.upload_date), 'MMM d, yyyy')
            },
            {
              header: 'Actions',
              cell: ({ row }) => (
                <a href={row.original.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                  View
                </a>
              ),
            },
          ]}
          onDelete={handleDeleteDocuments}
        />
      </CardContent>
      <DocumentUploadDialog
        isOpen={isUploadingDocument}
        onClose={() => setIsUploadingDocument(false)}
        onUploadDocument={handleUploadDocument}
        patientId={patientId}
      />
    </Card>
  )
}

