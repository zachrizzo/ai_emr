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
import { TipTapEditor } from "@/components/ui/tiptap-editor"
import { NotesHistory } from "@/components/ui/notes-history"
import { VoiceRecorder } from "@/components/ui/voice-recorder"
import { NoteTemplateSelector } from "@/components/ui/note-template-selector"
import { AIAssistant } from "@/components/ui/ai-assistant"
import { Patient, Appointment, SessionNote, CreateSessionNoteParams, UpdateSessionNoteParams, NoteTemplate } from '@/types/notes'
import { format } from 'date-fns'
import { Mic, MicOff, Save, FileText, Sparkles, X, ChevronLeft, ChevronRight, Search, ArrowLeft } from 'lucide-react'
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
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SessionNotesHistoryGrid } from "@/components/ui/session-notes-history-grid"
import { NoteViewer } from "@/components/ui/note-viewer"
import { supabase } from '@/utils/supabase-config'
import { getClinicalNotes, deleteClinicalNote, subscribeToClinicalNotes } from '@/lib/services/clinical-notes'
import { useAppointments } from '@/contexts/AppointmentContext'
import { useUser } from '@/contexts/UserContext'
import { cn } from "@/lib/utils"

interface NotesTabProps {
    patientId: string
    providerId: string
    organizationId: string
    activeNote: SessionNote | null
    onCreateNote: (note: CreateSessionNoteParams) => Promise<void>
    onUpdateNote: (noteId: string, note: UpdateSessionNoteParams) => Promise<void>
    onEditNote: (note: SessionNote | null) => void
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
    const { userData } = useUser()
    const [notes, setNotes] = useState<SessionNote[]>([])
    const [templates, setTemplates] = useState<NoteTemplate[]>([])
    const { appointments, isLoading: isLoadingAppointments, fetchAppointments } = useAppointments()
    const [selectedTemplate, setSelectedTemplate] = useState<NoteTemplate | null>(null)
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
    const [noteContent, setNoteContent] = useState<SessionNote['content']>({
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
    })
    const [isRecording, setIsRecording] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [noteToDelete, setNoteToDelete] = useState<SessionNote | null>(null)
    const [showSidebar, setShowSidebar] = useState(true)
    const [undoHistory, setUndoHistory] = useState<{ [key: string]: string[] }>({
        subjective: [],
        objective: [],
        assessment: [],
        plan: [],
    })
    const [isCreatingNewNote, setIsCreatingNewNote] = useState(false)
    const [selectedNote, setSelectedNote] = useState<SessionNote | null>(null)

    useEffect(() => {
        if (userData?.organization_id) {
            loadNotes()
            loadTemplates()
            fetchAppointments(patientId)

            const unsubscribe = subscribeToClinicalNotes(
                patientId,
                organizationId,
                () => loadNotes(),
                () => loadNotes(),
                () => loadNotes()
            )

            return () => {
                unsubscribe()
            }
        }
    }, [patientId, organizationId, userData?.organization_id])

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

    const handleCreateNote = async () => {
        if (!selectedAppointment) {
            toast({
                title: 'Error',
                description: 'Please select an appointment before creating a note.',
                variant: 'destructive'
            })
            return
        }

        try {
            const newNote: CreateSessionNoteParams = {
                appointment_id: selectedAppointment.id,
                patient_id: patientId,
                provider_id: providerId,
                organization_id: organizationId,
                content: noteContent,
                template_id: selectedTemplate?.id
            }
            await onCreateNote(newNote)
            setNoteContent({
                subjective: '',
                objective: '',
                assessment: '',
                plan: '',
            })
            setSelectedTemplate(null)
            setSelectedAppointment(null)
            toast({
                title: 'Session note created successfully!',
                variant: 'default'
            })
            loadNotes()
        } catch (error) {
            console.error('Error creating session note:', error)
            toast({
                title: 'Error creating session note',
                description: 'An unexpected error occurred.',
                variant: 'destructive'
            })
        }
    }

    const handleUpdateNote = async () => {
        if (!selectedNote) return

        try {
            await onUpdateNote(selectedNote.id, {
                content: noteContent,
            })
            toast({
                title: 'Session note updated successfully!',
                variant: 'default'
            })
            setSelectedNote(null)
            loadNotes()
        } catch (error) {
            console.error('Error updating session note:', error)
            toast({
                title: 'Error updating session note',
                description: 'An unexpected error occurred.',
                variant: 'destructive'
            })
        }
    }

    const handleVoiceRecordingComplete = (sections: {
        subjective?: string;
        objective?: string;
        assessment?: string;
        plan?: string;
    }) => {
        // Save current content to undo history for each section
        Object.keys(sections).forEach((section) => {
            const key = section as keyof typeof sections;
            if (sections[key]) {
                setUndoHistory(prev => ({
                    ...prev,
                    [key]: [...(prev[key] || []), noteContent[key]]
                }));
            }
        });

        // Update each section's content
        setNoteContent(prevContent => ({
            ...prevContent,
            ...Object.keys(sections).reduce((acc, section) => {
                const key = section as keyof typeof sections;
                if (sections[key]) {
                    acc[key] = sections[key]!;
                }
                return acc;
            }, {} as typeof prevContent)
        }));

        // Reset recording state
        setIsRecording(false);
    };

    const handleTemplateSelect = (template: NoteTemplate | null) => {
        setSelectedTemplate(template)
        if (template) {
            setNoteContent({
                ...noteContent,
                ...template.content
            })
        }
    }

    const handleAIAssist = (suggestion: string, action: 'append' | 'replace', section: keyof SessionNote['content']) => {
        // Get the current editor content
        const currentContent = noteContent[section]

        // Save current content to undo history before modifying
        setUndoHistory(prev => ({
            ...prev,
            [section]: [...(prev[section] || []), currentContent]
        }))

        // Update the editor content
        const newContent = action === 'append'
            ? `${currentContent || ''}${suggestion}`
            : suggestion

        // Update the state
        setNoteContent(prev => ({
            ...prev,
            [section]: newContent
        }))
    }

    const handleNoteSelection = (note: SessionNote) => {
        setSelectedNote(note)
        setNoteContent(note.content)
        setSelectedAppointment(appointments.find(a => a.id === note.appointment_id) || null)
        setIsCreatingNewNote(false)
    }

    return (
        <div className="flex h-[calc(100vh-200px)]">
            {/* Main Content */}
            <div className="flex-grow space-y-4 overflow-y-auto p-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Session Notes</h2>
                    <Button variant="outline" size="sm" onClick={() => setShowSidebar(!showSidebar)}>
                        {showSidebar ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                </div>

                {!selectedAppointment && !isCreatingNewNote ? (
                    <>
                        <Button onClick={() => setIsCreatingNewNote(true)} className="mb-4">
                            Create New Note
                        </Button>
                        {selectedNote ? (
                            <NoteViewer
                                note={selectedNote}
                                onClose={() => setSelectedNote(null)}
                                onEdit={() => {
                                    setIsCreatingNewNote(false)
                                    setSelectedAppointment(appointments.find(a => a.id === selectedNote.appointment_id) || null)
                                }}
                            />
                        ) : (
                            <SessionNotesHistoryGrid
                                notes={notes}
                                onSelectNote={handleNoteSelection}
                            />
                        )}
                    </>
                ) : isCreatingNewNote && !selectedAppointment ? (
                    <>
                        <Button variant="outline" onClick={() => setIsCreatingNewNote(false)} className="mb-4">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to History
                        </Button>
                        <Select
                            value={selectedAppointment?.id ?? ''}
                            onValueChange={(value: string) => {
                                const appointment = appointments.find((a: Appointment) => a.id === value)
                                if (appointment) {
                                    setSelectedAppointment(appointment)
                                    setIsCreatingNewNote(false)
                                }
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select appointment to create a new note..." />
                            </SelectTrigger>
                            <SelectContent>
                                {(appointments as Appointment[]).map((appointment: Appointment) => (
                                    <SelectItem key={appointment.id} value={appointment.id}>
                                        {format(new Date(appointment.appointment_date), 'MMM d, yyyy')} {appointment.appointment_time} - {appointment.reason_for_visit}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </>
                ) : (
                    <>
                        {/* Existing appointment selector */}
                        <Select
                            value={selectedAppointment?.id || ''}
                            onValueChange={(value) => setSelectedAppointment(appointments.find(a => a.id === value) || null)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select appointment..." />
                            </SelectTrigger>
                            <SelectContent>
                                {appointments.map((appointment) => (
                                    <SelectItem key={appointment.id} value={appointment.id}>
                                        {format(new Date(appointment.appointment_date), 'MMM d, yyyy')} {appointment.appointment_time} - {appointment.reason_for_visit}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Note editor */}
                        {selectedAppointment && (
                            <Card className="p-4">
                                <div className="flex flex-col gap-4">
                                    {/* Header Controls */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">
                                                {activeNote ? 'Edit Session Note' : 'New Session Note'}
                                            </h3>
                                            {selectedTemplate && (
                                                <Badge variant="secondary" className="gap-1">
                                                    Template: {selectedTemplate.name}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-4 w-4 p-0 hover:bg-transparent"
                                                        onClick={() => handleTemplateSelect(null)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4">
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
                                            <Button
                                                onClick={activeNote ? handleUpdateNote : handleCreateNote}
                                                className="gap-2"
                                            >
                                                <Save className="h-4 w-4" />
                                                {activeNote ? 'Update' : 'Save'}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Voice Recorder */}
                                    {isRecording && (
                                        <div className="border rounded-lg p-4 bg-muted/50 mb-4">
                                            <VoiceRecorder
                                                isRecording={isRecording}
                                                onToggleRecording={() => setIsRecording(!isRecording)}
                                                onTranscriptionComplete={handleVoiceRecordingComplete}
                                            />
                                        </div>
                                    )}

                                    {/* SOAP Note Structure with Integrated AI */}
                                    <div className="space-y-6">
                                        {(Object.keys(noteContent) as Array<keyof SessionNote['content']>).map((section) => (
                                            <div key={section} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
                                                        {section}
                                                        <AIAssistant
                                                            noteContent={noteContent}
                                                            onSuggestion={(suggestion, action) => handleAIAssist(suggestion, action, section)}
                                                            patientData={{
                                                                appointmentType: selectedAppointment.visit_type,
                                                                reasonForVisit: selectedAppointment.reason_for_visit,
                                                                patientId: patientId
                                                            }}
                                                            currentSection={section}
                                                        />
                                                    </h3>
                                                </div>
                                                <div className={cn(
                                                    "rounded-lg border bg-card",
                                                    section === 'assessment' && "border-l-4 border-l-blue-500",
                                                    section === 'plan' && "border-l-4 border-l-green-500",
                                                    section === 'subjective' && "border-l-4 border-l-purple-500",
                                                    section === 'objective' && "border-l-4 border-l-orange-500"
                                                )}>
                                                    <TipTapEditor
                                                        content={noteContent[section]}
                                                        onChange={(value) => {
                                                            setNoteContent(prev => ({
                                                                ...prev,
                                                                [section]: value
                                                            }))
                                                        }}
                                                        editable={!isRecording}
                                                        placeholder={`Enter ${section} information...`}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        )}
                    </>
                )}
            </div>

            {/* Right Sidebar - Previous Sessions and Templates */}
            {showSidebar && (
                <Card className="w-80 p-4 ml-4 overflow-y-auto">
                    <Tabs defaultValue="previous-sessions">
                        <TabsList className="w-full">
                            <TabsTrigger value="previous-sessions" className="flex-1">Previous Sessions</TabsTrigger>
                            <TabsTrigger value="templates" className="flex-1">Templates</TabsTrigger>
                        </TabsList>
                        <TabsContent value="previous-sessions">
                            <NotesHistory
                                notes={notes}
                                onSelectNote={(note) => {
                                    onEditNote(note)
                                    setNoteContent(note.content)
                                    setSelectedAppointment(appointments.find(a => a.id === note.appointment_id) || null)
                                    setIsCreatingNewNote(false)
                                }}
                                activeNoteId={activeNote?.id}
                            />
                        </TabsContent>
                        <TabsContent value="templates">
                            <NoteTemplateSelector
                                templates={templates}
                                selectedTemplate={selectedTemplate}
                                onSelectTemplate={handleTemplateSelect}
                            />
                        </TabsContent>
                    </Tabs>
                </Card>
            )}
        </div>
    )
}
