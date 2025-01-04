'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { EnhancedNotes } from '@/components/documentation/enhanced-notes'
import { NotesHistory } from '@/components/documentation/notes-history'
import { createClinicalNote, updateClinicalNote } from '@/lib/services/clinical-notes'
import { ClinicalNote } from '@/types/notes'
import { useUser } from '@/lib/hooks/use-user'
import { useToast } from '@/components/ui/use-toast'
import { redirect } from 'next/navigation'

export default function PatientNotesPage() {
    const params = useParams()
    const { user } = useUser()
    const { toast } = useToast()
    const [editingNote, setEditingNote] = useState<ClinicalNote | null>(null)

    // Redirect if no patient ID is provided
    if (!params?.id || typeof params.id !== 'string') {
        redirect('/patients')
    }

    const handleSaveNote = async (noteData: {
        content: string
        metadata: {
            type: 'voice' | 'manual'
            tags: string[]
        }
    }) => {
        try {
            if (!user?.id || !user.organization_id) {
                throw new Error('User not authenticated or missing organization')
            }

            if (editingNote) {
                await updateClinicalNote(editingNote.id, {
                    content: noteData.content,
                    type: noteData.metadata.type,
                    tags: noteData.metadata.tags,
                    provider_id: user.id,
                    patient_id: params.id,
                    organization_id: user.organization_id
                })
                setEditingNote(null)
            } else {
                await createClinicalNote({
                    content: noteData.content,
                    type: noteData.metadata.type,
                    tags: noteData.metadata.tags,
                    provider_id: user.id,
                    patient_id: params.id,
                    organization_id: user.organization_id
                })
            }

            toast({
                title: editingNote ? 'Note Updated' : 'Note Created',
                description: 'The clinical note has been saved successfully.',
            })
        } catch (error) {
            console.error('Error saving note:', error)
            toast({
                title: 'Error',
                description: 'Failed to save the clinical note. Please try again.',
                variant: 'destructive',
            })
        }
    }

    const handleEditNote = (note: ClinicalNote) => {
        setEditingNote(note)
    }

    if (!user) {
        return <div>Loading...</div>
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <EnhancedNotes
                        patientId={params.id}
                        providerId={user.id}
                        onSave={handleSaveNote}
                        initialNote={editingNote}
                    />
                </div>
                <div>
                    <NotesHistory
                        patientId={params.id}
                        onEdit={handleEditNote}
                    />
                </div>
            </div>
        </div>
    )
}
