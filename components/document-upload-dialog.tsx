import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PatientDocument } from '@/types'

interface DocumentUploadDialogProps {
  isOpen: boolean
  onClose: () => void
  onUploadDocument: (document: Omit<PatientDocument, 'id' | 'file_url'> & { file: File }) => void
  patientId: string
}

export function DocumentUploadDialog({
  isOpen,
  onClose,
  onUploadDocument,
  patientId
}: DocumentUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setFileName(selectedFile.name)
      setFileType(selectedFile.type)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (file) {
      const newDocument: Omit<PatientDocument, 'id' | 'file_url'> & { file: File } = {
        patient_id: patientId,
        file_name: fileName,
        file_type: fileType,
        upload_date: new Date().toISOString(),
        file: file
      }
      onUploadDocument(newDocument)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="file">Select File</Label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="fileName">File Name</Label>
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="fileType">File Type</Label>
              <Input
                id="fileType"
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Upload</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

