'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { TipTapEditor } from "@/components/documentation/tiptap-editor"
import { NotesHistory } from "@/components/documentation/notes-history"
import { VoiceRecorder } from "@/components/documentation/voice-recorder"
import { NoteTemplateSelector } from "@/components/documentation/note-template-selector"
import { AIAssistant } from "@/components/documentation/ai-assistant"
import { ClinicalNote, CreateClinicalNoteParams, UpdateClinicalNoteParams, NoteTemplate } from '@/types/notes'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { Mic, MicOff, Trash2 } from 'lucide-react'
import { toast } from "@/components/ui/use-toast"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { getClinicalNotes, deleteClinicalNote, subscribeToClinicalNotes } from '@/lib/services/clinical-notes'

interface Appointment {
    id: string
    appointment_date: string
    reason_for_visit: string
}

interface NotesTabProps {
    patientId: string
    providerId: string
    organizationId: string
    activeNote: ClinicalNote | null
    onCreateNote: (note: CreateClinicalNoteParams) => Promise<void>
    onUpdateNote: (noteId: string, note: UpdateClinicalNoteParams) => Promise<void>
    onEditNote: (note: ClinicalNote | null) => void
}

export function NotesTab({
    patientId,
    providerId,
    organizationId,
    activeNote,
    onCreateNote,
    onUpdateNote,
    onEditNote
}: NotesTabProps) {
    const [notes, setNotes] = useState<ClinicalNote[]>([])
    const [templates, setTemplates] = useState<NoteTemplate[]>([])
    const [appointments, setAppointments] = useState<Appointment[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<NoteTemplate | null>(null)
    const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null)
    const [editorContent, setEditorContent] = useState('')
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTranscript, setRecordingTranscript] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [noteToDelete, setNoteToDelete] = useState<ClinicalNote | null>(null)

    useEffect(() => {
        loadNotes()
        loadTemplates()
        loadAppointments()

        // Subscribe to real-time updates
        const unsubscribe = subscribeToClinicalNotes(
            patientId,
            organizationId,
            () => loadNotes(), // on insert
            () => loadNotes(), // on update
            () => loadNotes()  // on delete
        )

        return () => {
            unsubscribe()
        }
    }, [patientId, organizationId])

    useEffect(() => {
        if (activeNote) {
            setEditorContent(activeNote.content)
            setSelectedAppointment(activeNote.appointment_id || null)
        } else if (selectedTemplate) {
            setEditorContent(selectedTemplate.content)
        } else {
            setEditorContent('')
        }
    }, [activeNote, selectedTemplate])

    async function loadNotes() {
        try {
            const data = await getClinicalNotes(patientId, organizationId)
            setNotes(data)
            setIsLoading(false)
        } catch (error) {
            console.error('Error loading notes:', error)
            toast({
                title: 'Error',
                description: 'Failed to load notes. Please try again.',
                variant: 'destructive',
            })
        }
    }

    async function loadTemplates() {
        try {
            const { data, error } = await supabase
                .from('note_templates')
                .select('*')
                .eq('organization_id', organizationId)
                .eq('is_active', true)

            if (error) throw error
            setTemplates(data || [])
        } catch (error) {
            console.error('Error loading templates:', error)
        }
    }

    async function loadAppointments() {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select('id, appointment_date, reason_for_visit')
                .eq('patient_id', patientId)
                .order('appointment_date', { ascending: false })

            if (error) throw error
            setAppointments(data || [])
        } catch (error) {
            console.error('Error loading appointments:', error)
        }
    }

    const handleCreateNote = async () => {
        const noteData: CreateClinicalNoteParams = {
            patient_id: patientId,
            provider_id: providerId,
            organization_id: organizationId,
            appointment_id: selectedAppointment || undefined,
            content: editorContent,
            type: isRecording ? 'voice' : selectedTemplate ? 'template' : 'manual',
            template_id: selectedTemplate?.id,
            tags: [],
            sections: [
                {
                    section_type: 'subjective',
                    title: 'Subjective',
                    content: '',
                    order_index: 0
                },
                {
                    section_type: 'objective',
                    title: 'Objective',
                    content: '',
                    order_index: 1
                },
                {
                    section_type: 'assessment',
                    title: 'Assessment',
                    content: '',
                    order_index: 2
                },
                {
                    section_type: 'plan',
                    title: 'Plan',
                    content: '',
                    order_index: 3
                }
            ]
        }

        await onCreateNote(noteData)
        setEditorContent('')
        setSelectedTemplate(null)
        setSelectedAppointment(null)
        loadNotes()
    }

    const handleUpdateNote = async () => {
        if (!activeNote) return

        const noteData: UpdateClinicalNoteParams = {
            content: editorContent,
            status: 'draft'
        }

        await onUpdateNote(activeNote.id, noteData)
        loadNotes()
    }

    const handleVoiceRecordingComplete = (transcript: string) => {
        setRecordingTranscript(transcript)
        setEditorContent((prev) => prev + '\n' + transcript)
    }

    const handleTemplateSelect = (template: NoteTemplate) => {
        setSelectedTemplate(template)
    }

    const handleAIAssist = (suggestion: string) => {
        setEditorContent((prev) => prev + '\n' + suggestion)
    }

    const handleDeleteNote = async (note: ClinicalNote) => {
        try {
            await deleteClinicalNote(note.id, organizationId)
            if (activeNote?.id === note.id) {
                onEditNote(null)
            }
            toast({
                title: 'Note Deleted',
                description: 'The clinical note has been deleted successfully.',
            })
            loadNotes()
        } catch (error) {
            console.error('Error deleting note:', error)
            toast({
                title: 'Error',
                description: 'Failed to delete the note. Please try again.',
                variant: 'destructive',
            })
        }
    }

    return (
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
            {/* Left Sidebar - Note History */}
            <Card className="col-span-3 p-4">
                <h3 className="font-semibold mb-4">Note History</h3>
                <ScrollArea className="h-[calc(100vh-300px)]">
                    <NotesHistory
                        notes={notes}
                        onSelectNote={onEditNote}
                        activeNoteId={activeNote?.id}
                        onDeleteNote={setNoteToDelete}
                    />
                </ScrollArea>
            </Card>

            {/* Main Content - Note Editor */}
            <div className="col-span-6 space-y-4">
                <Card className="p-4">
                    <div className="flex flex-col gap-4">
                        {/* Header with controls */}
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">
                                {activeNote ? 'Edit Note' : 'New Note'}
                            </h3>
                            <div className="flex items-center gap-4">
                                {/* Appointment Selector */}
                                <Select
                                    value={selectedAppointment || ''}
                                    onValueChange={setSelectedAppointment}
                                >
                                    <SelectTrigger className="w-[250px]">
                                        <SelectValue placeholder="Link to appointment..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {appointments.map((appointment) => (
                                            <SelectItem key={appointment.id} value={appointment.id}>
                                                {format(new Date(appointment.appointment_date), 'MMM d, yyyy h:mm a')} - {appointment.reason_for_visit}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Voice Recording Toggle */}
                                <Button
                                    variant={isRecording ? "destructive" : "secondary"}
                                    size="icon"
                                    onClick={() => setIsRecording(!isRecording)}
                                >
                                    {isRecording ? (
                                        <MicOff className="h-4 w-4" />
                                    ) : (
                                        <Mic className="h-4 w-4" />
                                    )}
                                </Button>

                                {/* Save/Update Button */}
                                {activeNote ? (
                                    <Button onClick={handleUpdateNote}>Update Note</Button>
                                ) : (
                                    <Button onClick={handleCreateNote}>Create Note</Button>
                                )}
                            </div>
                        </div>

                        {/* Voice Recorder (when active) */}
                        {isRecording && (
                            <div className="border rounded-lg p-4 bg-muted/50">
                                <VoiceRecorder
                                    isRecording={isRecording}
                                    onStartRecording={() => setIsRecording(true)}
                                    onStopRecording={() => setIsRecording(false)}
                                    onTranscriptionComplete={handleVoiceRecordingComplete}
                                />
                            </div>
                        )}

                        {/* Editor */}
                        <TipTapEditor
                            content={editorContent}
                            onChange={setEditorContent}
                            editable={!isRecording}
                        />
                    </div>
                </Card>
            </div>

            {/* Right Sidebar - Tools */}
            <Card className="col-span-3 p-4">
                <Tabs defaultValue="templates">
                    <TabsList className="grid grid-cols-2 w-full">
                        <TabsTrigger value="templates">Templates</TabsTrigger>
                        <TabsTrigger value="ai">AI Assist</TabsTrigger>
                    </TabsList>

                    <TabsContent value="templates">
                        <NoteTemplateSelector
                            templates={templates}
                            selectedTemplate={selectedTemplate}
                            onSelectTemplate={handleTemplateSelect}
                        />
                    </TabsContent>

                    <TabsContent value="ai">
                        <AIAssistant
                            noteContent={editorContent}
                            onSuggestion={handleAIAssist}
                        />
                    </TabsContent>
                </Tabs>
            </Card>

            {/* Delete Note Dialog */}
            <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Note</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this note? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (noteToDelete) {
                                    handleDeleteNote(noteToDelete)
                                    setNoteToDelete(null)
                                }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
