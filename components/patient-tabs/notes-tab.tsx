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
import { AIAssistant } from "@/components/messaging/ai-assistant"
import { ClinicalNote, CreateClinicalNoteParams, UpdateClinicalNoteParams, NoteTemplate, SessionNote } from '@/types'
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
import { getClinicalNotes, deleteClinicalNote, subscribeToClinicalNotes, createClinicalNote } from '@/lib/services/clinical-notes'
import { useAppointments } from '@/contexts/AppointmentContext'
import { useUser } from '@/contexts/UserContext'
import { cn } from "@/lib/utils"
import { Appointment } from '@/types/notes'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type NoteSection = 'subjective' | 'objective' | 'assessment' | 'plan'

type NoteContent = {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
}

type UndoHistory = {
    subjective: string[];
    objective: string[];
    assessment: string[];
    plan: string[];
}

interface NotesTabProps {
    patientId: string
    providerId: string
    activeNote: ClinicalNote | null
    onUpdateNote: (noteId: string, note: UpdateClinicalNoteParams) => Promise<void>
    onEditNote: (note: ClinicalNote | null) => void
}

export function NotesTab({
    patientId,
    providerId,
    activeNote,
    onUpdateNote,
    onEditNote
}: NotesTabProps) {
    const { userData, loading: userLoading } = useUser()
    const [notes, setNotes] = useState<ClinicalNote[]>([])
    const [templates, setTemplates] = useState<NoteTemplate[]>([])
    const appointmentContext = useAppointments()
    const appointments = Array.isArray(appointmentContext?.appointments)
        ? appointmentContext.appointments as Appointment[]
        : []
    const isLoadingAppointments = appointmentContext?.isLoading ?? false
    const fetchAppointments = appointmentContext?.fetchAppointments ?? (async () => { })

    const findAppointment = (appointmentId?: string): Appointment | null => {
        if (!appointmentId || !appointments?.length) return null
        return appointments.find(apt => apt.id === appointmentId) ?? null
    }

    // Use organization ID from user data as source of truth
    const organizationId = userData?.organization_id

    const [selectedTemplate, setSelectedTemplate] = useState<NoteTemplate | null>(null)
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
    const [noteContent, setNoteContent] = useState<NoteContent>({
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
    })
    const [isRecording, setIsRecording] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [noteToDelete, setNoteToDelete] = useState<ClinicalNote | null>(null)
    const [showSidebar, setShowSidebar] = useState(true)
    const [undoHistory, setUndoHistory] = useState<UndoHistory>({
        subjective: [],
        objective: [],
        assessment: [],
        plan: [],
    })
    const [isCreatingNewNote, setIsCreatingNewNote] = useState(false)
    const [selectedNote, setSelectedNote] = useState<ClinicalNote | null>(null)

    useEffect(() => {
        console.log('Appointments context:', appointments)
    }, [appointments])

    useEffect(() => {
        // Wait for user data to load
        if (userLoading) return

        if (!organizationId) {
            toast({
                title: 'Error',
                description: 'Please log in with an organization account.',
                variant: 'destructive'
            })
            return
        }

        loadNotes()
        loadTemplates()
        // Fetch appointments when component mounts
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
    }, [patientId, organizationId, userLoading])

    async function loadNotes() {
        if (!organizationId) {
            toast({
                title: 'Error',
                description: 'Please log in with an organization account.',
                variant: 'destructive',
            })
            return
        }

        try {
            console.log('Loading notes for patient:', patientId)
            const data = await getClinicalNotes(patientId, organizationId)
            console.log('Loaded notes:', data)
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
        if (!organizationId) {
            toast({
                title: 'Error',
                description: 'Please log in with an organization account.',
                variant: 'destructive',
            })
            return
        }

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
            toast({
                title: 'Error',
                description: 'Failed to load templates. Please try again.',
                variant: 'destructive',
            })
        }
    }

    const handleCreateNote = async () => {
        if (!organizationId) {
            toast({
                title: 'Error',
                description: 'Please log in with an organization account.',
                variant: 'destructive'
            })
            return
        }

        if (isLoadingAppointments) {
            toast({
                title: 'Loading',
                description: 'Please wait while appointments are being loaded.',
                variant: 'default'
            })
            return
        }

        if (!selectedAppointment) {
            toast({
                title: 'Error',
                description: 'Please select an appointment before creating a note.',
                variant: 'destructive'
            })
            return
        }

        try {
            console.log('Creating note with data:', {
                selectedAppointment,
                patientId,
                providerId,
                organizationId,
                noteContent,
                selectedTemplate: selectedTemplate?.id
            })

            const newNote: CreateClinicalNoteParams = {
                appointment_id: selectedAppointment.id,
                patient_id: patientId,
                provider_id: providerId,
                organization_id: organizationId,
                content: noteContent,
                type: 'manual',
                tags: [],
                ...(selectedTemplate?.id ? { template_id: selectedTemplate.id } : {})
            }

            console.log('Formatted note to save:', JSON.stringify(newNote, null, 2))
            const createdNote = await createClinicalNote(newNote)
            console.log('Note saved successfully:', createdNote)

            setNoteContent({
                subjective: '',
                objective: '',
                assessment: '',
                plan: '',
            })
            setSelectedTemplate(null)
            setSelectedAppointment(null)
            toast({
                title: 'Clinical note created successfully!',
                variant: 'default'
            })
            await loadNotes()
        } catch (error) {
            console.error('Error creating clinical note:', error)
            toast({
                title: 'Error creating clinical note',
                description: error instanceof Error ? error.message : 'An unexpected error occurred.',
                variant: 'destructive'
            })
        }
    }

    const handleUpdateNote = async () => {
        if (!selectedNote) return

        try {
            const updateData: UpdateClinicalNoteParams = {
                content: noteContent,
                status: selectedNote.status,
                metadata: selectedNote.metadata,
                tags: selectedNote.tags
            }

            await onUpdateNote(selectedNote.id, updateData)
            toast({
                title: 'Clinical note updated successfully!',
                variant: 'default'
            })
            setSelectedNote(null)
            loadNotes()
        } catch (error) {
            console.error('Error updating clinical note:', error)
            toast({
                title: 'Error updating clinical note',
                description: error instanceof Error ? error.message : 'An unexpected error occurred.',
                variant: 'destructive'
            })
        }
    }

    const handleVoiceRecordingComplete = (sections: Partial<NoteContent>) => {
        console.log('Voice recording sections to update:', sections)
        const validSections: NoteSection[] = ['subjective', 'objective', 'assessment', 'plan']
        validSections.forEach(section => {
            if (sections[section]) {
                setUndoHistory(prev => ({
                    ...prev,
                    [section]: [...prev[section], noteContent[section]]
                }))
            }
        })

        setNoteContent(prevContent => {
            const newContent = { ...prevContent }
            validSections.forEach(section => {
                if (sections[section]) {
                    newContent[section] = sections[section]!
                }
            })
            console.log('Updated note content after voice recording:', newContent)
            return newContent
        })

        setIsRecording(false)
    }

    const handleTemplateSelect = (template: NoteTemplate | null) => {
        setSelectedTemplate(template)
        if (template) {
            setNoteContent({
                ...noteContent,
                ...template.content
            })
        }
    }

    const handleAIAssist = (suggestion: string, action: 'append' | 'replace', section: NoteSection) => {
        console.log('AI assist:', { suggestion, action, section })
        const currentContent = noteContent[section]

        setUndoHistory(prev => ({
            ...prev,
            [section]: [...prev[section], currentContent]
        }))

        const newContent = action === 'append'
            ? `${currentContent || ''}${suggestion}`
            : suggestion

        console.log('Updated content after AI assist:', { section, newContent })
        setNoteContent(prev => ({
            ...prev,
            [section]: newContent
        }))
    }

    const handleNoteSelection = (note: ClinicalNote) => {
        setSelectedNote(note)
        setNoteContent(note.content)
        setSelectedAppointment(findAppointment(note.appointment_id))
        setIsCreatingNewNote(false)
    }

    const handleAppointmentSelect = (value: string) => {
        const appointment = findAppointment(value)
        setSelectedAppointment(appointment)
        if (appointment) {
            setIsCreatingNewNote(false)
        }
    }

    const handleCreateNewNote = () => {
        console.log('Creating new note, current appointments:', appointments)
        setIsCreatingNewNote(true)
        // Ensure appointments are fetched
        fetchAppointments(patientId)
    }

    const sections: Array<NoteSection> = ['subjective', 'objective', 'assessment', 'plan']

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
                        <Button onClick={handleCreateNewNote} className="mb-4">
                            Create New Note
                        </Button>
                        {selectedNote ? (
                            <NoteViewer
                                note={selectedNote}
                                onClose={() => setSelectedNote(null)}
                                onEdit={() => {
                                    setIsCreatingNewNote(false)
                                    setSelectedAppointment(appointments?.find(a => a.id === selectedNote.appointment_id) || null)
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
                            value={selectedAppointment?.id || ''}
                            onValueChange={handleAppointmentSelect}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select appointment to create a new note..." />
                            </SelectTrigger>
                            <SelectContent>
                                {appointments.map((appointment) => (
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
                            onValueChange={handleAppointmentSelect}
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
                                    <div className="flex flex-col gap-4 pb-4 border-b">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-semibold text-lg">
                                                    {activeNote ? 'Edit Session Note' : 'New Session Note'}
                                                </h3>
                                                <Badge variant="outline" className="text-xs">
                                                    {format(new Date(selectedAppointment?.appointment_date || ''), 'MMM d, yyyy')}
                                                </Badge>
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
                                            <div className="flex items-center gap-2">
                                                {/* AI Assistant Button with Popover */}
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-2 group"
                                                        >
                                                            <Sparkles className="h-4 w-4 text-primary group-hover:animate-pulse" />
                                                            <span className="text-sm">AI Assistant</span>
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent
                                                        side="bottom"
                                                        align="start"
                                                        sideOffset={600}
                                                        alignOffset={-300}
                                                        avoidCollisions={true}
                                                        className="p-0 border-none bg-transparent shadow-none"
                                                    >
                                                        <AIAssistant
                                                            patientId={patientId}
                                                            onUpdateNote={(content) => {
                                                                if (content) {
                                                                    setNoteContent(content)
                                                                }
                                                            }}
                                                        />
                                                    </PopoverContent>
                                                </Popover>

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
                                        <div className="text-sm text-muted-foreground">
                                            {selectedAppointment?.reason_for_visit && (
                                                <span>Reason for visit: {selectedAppointment.reason_for_visit}</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Voice Recorder */}
                                    {isRecording && (
                                        <div className="border rounded-lg p-4 bg-gradient-to-br from-primary/5 via-background to-primary/5 mb-4 relative overflow-hidden">
                                            <div className="absolute inset-0 bg-grid-primary/5 mask-gradient animate-grid-flow" />
                                            <div className="relative z-10">
                                                <VoiceRecorder
                                                    isRecording={isRecording}
                                                    onToggleRecording={() => setIsRecording(!isRecording)}
                                                    onTranscriptionComplete={handleVoiceRecordingComplete}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* SOAP Note Structure */}
                                    <div className="space-y-6">
                                        {sections.map((section: NoteSection) => (
                                            <div key={section} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-lg font-semibold capitalize flex items-center gap-2">
                                                        {section}
                                                    </h3>
                                                </div>
                                                <div className={cn(
                                                    "rounded-lg border bg-card relative group transition-all duration-300",
                                                    "hover:shadow-md hover:border-primary/20",
                                                    section === 'assessment' && "border-l-4 border-l-blue-500",
                                                    section === 'plan' && "border-l-4 border-l-green-500",
                                                    section === 'subjective' && "border-l-4 border-l-purple-500",
                                                    section === 'objective' && "border-l-4 border-l-orange-500"
                                                )}>
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
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
        </div>
    )
}

<style jsx global>{`
    @keyframes grid-flow {
        0% {
            transform: translateY(0) translateX(0);
        }
        100% {
            transform: translateY(-50%) translateX(-50%);
        }
    }

    .animate-grid-flow {
        animation: grid-flow 20s linear infinite;
    }

    .bg-grid-primary {
        background-image: linear-gradient(to right, var(--primary) 1px, transparent 1px),
                         linear-gradient(to bottom, var(--primary) 1px, transparent 1px);
        background-size: 20px 20px;
    }

    .mask-gradient {
        mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
    }
`}</style>

