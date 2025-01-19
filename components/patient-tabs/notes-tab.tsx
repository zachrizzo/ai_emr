'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
    ClinicalNote,
    CreateClinicalNoteParams,
    UpdateClinicalNoteParams,
    NoteTemplate,
    SessionNote,
    NoteContent,
    Appointment as AppointmentType
} from '@/types/notes'
import { Vitals, VitalRanges } from '@/types'
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from '@/components/ui/textarea'
import { debounce } from 'lodash'
import { PreviousSessionNotes } from "@/components/ui/previous-session-notes"
import { AppointmentDetails } from "@/components/ui/appointment-details"
import { AppointmentContextType } from '@/contexts/AppointmentContext'

type NoteSection = 'subjective' | 'objective' | 'assessment' | 'plan'

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

// Add vital ranges constant
const VITAL_RANGES: VitalRanges = {
    temperature: { min: 90, max: 110 },
    blood_pressure_systolic: { min: 60, max: 250 },
    blood_pressure_diastolic: { min: 40, max: 150 },
    heart_rate: { min: 30, max: 250 },
    respiratory_rate: { min: 8, max: 60 },
    oxygen_saturation: { min: 0, max: 100 },
    height: { min: 0, max: 300 },
    weight: { min: 0, max: 700 },
    pain_level: { min: 0, max: 10 },
    blood_glucose: { min: 20, max: 600 }  // Added blood glucose range (mg/dL)
}

// Add validation helper
const isVitalInRange = (field: keyof VitalRanges, value: number): boolean => {
    const range = VITAL_RANGES[field]
    return value >= range.min && value <= range.max
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
    const appointments = appointmentContext.appointments
    const isLoadingAppointments = appointmentContext.isLoading
    const fetchAppointments = appointmentContext.fetchAppointments
    const [vitals, setVitals] = useState<Vitals | null>(null)
    const [newNote, setNewNote] = useState<Partial<CreateClinicalNoteParams>>({
        patient_id: patientId,
        provider_id: providerId,
        content: {
            subjective: '',
            objective: '',
            assessment: '',
            plan: ''
        },
        type: 'manual',
        status: 'draft'
    })
    const [newVitals, setNewVitals] = useState<Partial<Vitals>>({
        patient_id: patientId,
        provider_id: providerId,
        temperature: undefined,
        blood_pressure_systolic: undefined,
        blood_pressure_diastolic: undefined,
        heart_rate: undefined,
        respiratory_rate: undefined,
        oxygen_saturation: undefined,
        height: undefined,
        weight: undefined,
        bmi: undefined,
        pain_level: undefined,
        blood_glucose: undefined
    })

    const findAppointment = (appointmentId?: string): AppointmentType | null => {
        if (!appointmentId || !appointments?.length) return null
        return appointments.find(apt => apt.id === appointmentId) ?? null
    }

    // Use organization ID from user data as source of truth
    const organizationId = userData?.organization_id

    const [selectedTemplate, setSelectedTemplate] = useState<NoteTemplate | null>(null)
    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentType | null>(null)
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
    const [isSaving, setIsSaving] = useState(false)
    const lastSavedContent = useRef<NoteContent | null>(null)
    const lastSavedVitals = useRef<Partial<Vitals> | null>(null)
    const [showPreviousNotes, setShowPreviousNotes] = useState(true)

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
        fetchLatestVitals()

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

    const fetchLatestVitals = async () => {
        try {
            const { data, error } = await supabase
                .from('vitals')
                .select('*')
                .eq('patient_id', patientId)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (error && error.code !== 'PGRST116') throw error
            setVitals(data || null)
        } catch (error) {
            console.error('Error fetching vitals:', error)
        }
    }

    // Debounced save functions
    const debouncedSaveVitals = useCallback(
        debounce(async (vitalsData: Partial<Vitals>) => {
            if (!selectedAppointment || !organizationId) return

            try {
                setIsSaving(true)
                const { error } = await supabase
                    .from('vitals')
                    .insert([{
                        ...vitalsData,
                        appointment_id: selectedAppointment.id,
                        clinical_note_id: selectedNote?.id,
                        organization_id: organizationId,
                        created_at: new Date().toISOString()
                    }])

                if (error) throw error
                lastSavedVitals.current = vitalsData
                fetchLatestVitals()
                toast({
                    title: 'Vitals saved',
                    variant: 'default',
                    duration: 1000
                })
            } catch (error) {
                console.error('Error auto-saving vitals:', error)
                toast({
                    title: 'Error saving vitals',
                    description: 'Your changes will be saved when connection is restored',
                    variant: 'destructive'
                })
            } finally {
                setIsSaving(false)
            }
        }, 1500),
        [selectedAppointment?.id, organizationId, selectedNote?.id]
    )

    const debouncedSaveNote = useCallback(
        debounce(async (noteData: NoteContent) => {
            if (!selectedAppointment || !organizationId || !selectedNote) return

            try {
                setIsSaving(true)
                if (JSON.stringify(noteData) === JSON.stringify(lastSavedContent.current)) {
                    return
                }

                const updateData: UpdateClinicalNoteParams = {
                    content: noteData,
                    status: selectedNote.status,
                    updated_at: new Date().toISOString(),
                    metadata: selectedNote.metadata || {},
                    tags: selectedNote.tags || []
                }

                await onUpdateNote(selectedNote.id, updateData)
                lastSavedContent.current = noteData
                toast({
                    title: 'Note saved',
                    variant: 'default',
                    duration: 1000
                })
            } catch (error) {
                console.error('Error auto-saving note:', error)
                toast({
                    title: 'Error saving note',
                    description: 'Your changes will be saved when connection is restored',
                    variant: 'destructive'
                })
            } finally {
                setIsSaving(false)
            }
        }, 1500),
        [selectedAppointment?.id, organizationId, selectedNote]
    )

    // Update the handleVitalsChange function to handle empty values
    const handleVitalsChange = (field: keyof Vitals, value: number) => {
        if (isNaN(value) || value === null) {
            const updatedVitals = {
                ...newVitals,
                [field]: undefined
            }
            setNewVitals(updatedVitals)
            return
        }

        // Validate the value is within range
        if (!isVitalInRange(field as keyof VitalRanges, value)) {
            toast({
                title: 'Warning',
                description: `${field.replace(/_/g, ' ')} value is outside normal range`,
                variant: 'default'
            })
        }

        const updatedVitals = {
            ...newVitals,
            [field]: value,
            bmi: field === 'height' || field === 'weight'
                ? calculateBMI(
                    field === 'weight' ? value : (newVitals.weight || 0),
                    field === 'height' ? value : (newVitals.height || 0)
                )
                : newVitals.bmi
        }

        // Only save if we have all required values for blood pressure
        if ((field === 'blood_pressure_systolic' || field === 'blood_pressure_diastolic') &&
            (!updatedVitals.blood_pressure_systolic || !updatedVitals.blood_pressure_diastolic)) {
            setNewVitals(updatedVitals)
            return
        }

        setNewVitals(updatedVitals)
        debouncedSaveVitals(updatedVitals)
    }

    // Update the note content change handler
    const handleNoteContentChange = (section: NoteSection, value: string) => {
        const updatedContent = {
            ...noteContent,
            [section]: value
        }
        setNoteContent(updatedContent)
        debouncedSaveNote(updatedContent)
    }

    // Clean up debounced functions on unmount
    useEffect(() => {
        return () => {
            debouncedSaveVitals.cancel()
            debouncedSaveNote.cancel()
        }
    }, [])

    const calculateBMI = (weight: number, height: number) => {
        if (height <= 0) return 0
        const heightInMeters = height / 100
        return Number((weight / (heightInMeters * heightInMeters)).toFixed(1))
    }

    const saveVitals = async () => {
        try {
            const { error } = await supabase
                .from('vitals')
                .insert([{ ...newVitals, created_at: new Date().toISOString() }])

            if (error) throw error
            fetchLatestVitals()
        } catch (error) {
            console.error('Error saving vitals:', error)
        }
    }

    const handleNoteChange = (field: keyof ClinicalNote, value: string) => {
        setNewNote(prev => ({ ...prev, [field]: value }))
    }

    const saveNote = async () => {
        try {
            const { error } = await supabase
                .from('clinical_notes')
                .insert([{
                    ...newNote,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }])

            if (error) throw error
            loadNotes()
            setNewNote({
                patient_id: patientId,
                provider_id: providerId,
                content: {
                    subjective: '',
                    objective: '',
                    assessment: '',
                    plan: ''
                },
                type: 'manual',
                status: 'draft'
            })
        } catch (error) {
            console.error('Error saving note:', error)
        }
    }

    const handleCreateNote = async () => {
        if (!organizationId || !selectedAppointment) {
            toast({
                title: 'Error',
                description: 'Please select an appointment and ensure you are logged in.',
                variant: 'destructive'
            })
            return
        }

        try {
            const newNote: CreateClinicalNoteParams = {
                appointment_id: selectedAppointment.id,
                patient_id: patientId,
                provider_id: providerId,
                organization_id: organizationId,
                content: noteContent,
                type: 'manual',
                status: 'draft',
                tags: [],
                ...(selectedTemplate?.id ? { template_id: selectedTemplate.id } : {})
            }

            await createClinicalNote(newNote)
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
                updated_at: new Date().toISOString(),
                metadata: selectedNote.metadata || {},
                tags: selectedNote.tags || []
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
        const appointment = appointments.find(a => a.id === value)
        setSelectedAppointment(appointment || null)
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
            <div className={cn(
                "flex-grow space-y-4 overflow-y-auto p-4 transition-all duration-300",
                showPreviousNotes ? "mr-8" : "mr-0"
            )}>
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Session Notes</h2>
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
                                {Array.isArray(appointments) && appointments.map((appointment) => (
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
                        {/* Appointment Details */}
                        {selectedAppointment && (
                            <AppointmentDetails appointment={selectedAppointment} />
                        )}

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
                                                            className={cn(
                                                                "gap-2 group relative overflow-hidden border-primary/20",
                                                                "bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-pink-500/10",
                                                                "hover:from-purple-500/20 hover:via-blue-500/20 hover:to-pink-500/20",
                                                                "transition-all duration-500"
                                                            )}
                                                        >
                                                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 animate-gradient-xy" />
                                                            <Sparkles className="h-4 w-4 text-blue-500 animate-pulse group-hover:text-blue-600" />
                                                            <span className="text-sm relative z-10 bg-gradient-to-r from-purple-500 to-blue-500 text-transparent bg-clip-text font-medium">
                                                                AI Assistant
                                                            </span>
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
                                                    variant={isRecording ? "destructive" : "outline"}
                                                    size="sm"
                                                    onClick={() => setIsRecording(!isRecording)}
                                                    className={cn(
                                                        "relative overflow-hidden transition-all duration-300",
                                                        isRecording && "animate-pulse bg-red-500 hover:bg-red-600 border-red-400"
                                                    )}
                                                >
                                                    {isRecording ? (
                                                        <>
                                                            <div className="absolute inset-0 bg-red-500/20 animate-ping" />
                                                            <MicOff className="h-4 w-4 relative z-10" />
                                                        </>
                                                    ) : (
                                                        <Mic className="h-4 w-4 text-red-500" />
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

                                    {/* Vitals Section */}
                                    <Card className="mb-6">
                                        <CardHeader>
                                            <CardTitle className="flex justify-between items-center">
                                                <span>Patient Vitals</span>
                                                {vitals && (
                                                    <span className="text-sm text-muted-foreground">
                                                        Last updated: {format(new Date(vitals.created_at), 'MMM d, yyyy h:mm a')}
                                                    </span>
                                                )}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Temperature (°F)</Label>
                                                    <Input
                                                        type="number"
                                                        value={newVitals.temperature || ''}
                                                        onChange={(e) => handleVitalsChange('temperature', parseFloat(e.target.value))}
                                                        step="0.1"
                                                        placeholder="98.6"
                                                        className={cn(
                                                            newVitals.temperature && !isVitalInRange('temperature', newVitals.temperature) &&
                                                            "border-yellow-500 focus:ring-yellow-500"
                                                        )}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Blood Pressure (Systolic)</Label>
                                                    <Input
                                                        type="number"
                                                        value={newVitals.blood_pressure_systolic || ''}
                                                        onChange={(e) => handleVitalsChange('blood_pressure_systolic', parseInt(e.target.value))}
                                                        placeholder="120"
                                                        className={cn(
                                                            newVitals.blood_pressure_systolic && !isVitalInRange('blood_pressure_systolic', newVitals.blood_pressure_systolic) &&
                                                            "border-yellow-500 focus:ring-yellow-500"
                                                        )}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Blood Pressure (Diastolic)</Label>
                                                    <Input
                                                        type="number"
                                                        value={newVitals.blood_pressure_diastolic || ''}
                                                        onChange={(e) => handleVitalsChange('blood_pressure_diastolic', parseInt(e.target.value))}
                                                        placeholder="80"
                                                        className={cn(
                                                            newVitals.blood_pressure_diastolic && !isVitalInRange('blood_pressure_diastolic', newVitals.blood_pressure_diastolic) &&
                                                            "border-yellow-500 focus:ring-yellow-500"
                                                        )}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Heart Rate (bpm)</Label>
                                                    <Input
                                                        type="number"
                                                        value={newVitals.heart_rate || ''}
                                                        onChange={(e) => handleVitalsChange('heart_rate', parseInt(e.target.value))}
                                                        placeholder="72"
                                                        className={cn(
                                                            newVitals.heart_rate && !isVitalInRange('heart_rate', newVitals.heart_rate) &&
                                                            "border-yellow-500 focus:ring-yellow-500"
                                                        )}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Respiratory Rate</Label>
                                                    <Input
                                                        type="number"
                                                        value={newVitals.respiratory_rate || ''}
                                                        onChange={(e) => handleVitalsChange('respiratory_rate', parseInt(e.target.value))}
                                                        placeholder="16"
                                                        className={cn(
                                                            newVitals.respiratory_rate && !isVitalInRange('respiratory_rate', newVitals.respiratory_rate) &&
                                                            "border-yellow-500 focus:ring-yellow-500"
                                                        )}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>O2 Saturation (%)</Label>
                                                    <Input
                                                        type="number"
                                                        value={newVitals.oxygen_saturation || ''}
                                                        onChange={(e) => handleVitalsChange('oxygen_saturation', parseInt(e.target.value))}
                                                        placeholder="98"
                                                        className={cn(
                                                            newVitals.oxygen_saturation && !isVitalInRange('oxygen_saturation', newVitals.oxygen_saturation) &&
                                                            "border-yellow-500 focus:ring-yellow-500"
                                                        )}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Height (cm)</Label>
                                                    <Input
                                                        type="number"
                                                        value={newVitals.height || ''}
                                                        onChange={(e) => handleVitalsChange('height', parseInt(e.target.value))}
                                                        placeholder="170"
                                                        className={cn(
                                                            newVitals.height && !isVitalInRange('height', newVitals.height) &&
                                                            "border-yellow-500 focus:ring-yellow-500"
                                                        )}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Weight (kg)</Label>
                                                    <Input
                                                        type="number"
                                                        value={newVitals.weight || ''}
                                                        onChange={(e) => handleVitalsChange('weight', parseInt(e.target.value))}
                                                        placeholder="70"
                                                        className={cn(
                                                            newVitals.weight && !isVitalInRange('weight', newVitals.weight) &&
                                                            "border-yellow-500 focus:ring-yellow-500"
                                                        )}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>BMI</Label>
                                                    <Input
                                                        type="number"
                                                        value={newVitals.bmi || ''}
                                                        disabled
                                                        className="bg-muted"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Pain Level (0-10)</Label>
                                                    <Input
                                                        type="number"
                                                        value={newVitals.pain_level || ''}
                                                        onChange={(e) => handleVitalsChange('pain_level', parseInt(e.target.value))}
                                                        min="0"
                                                        max="10"
                                                        placeholder="0"
                                                        className={cn(
                                                            newVitals.pain_level && !isVitalInRange('pain_level', newVitals.pain_level) &&
                                                            "border-yellow-500 focus:ring-yellow-500"
                                                        )}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Blood Glucose (mg/dL)</Label>
                                                    <Input
                                                        type="number"
                                                        value={newVitals.blood_glucose || ''}
                                                        onChange={(e) => handleVitalsChange('blood_glucose', parseInt(e.target.value))}
                                                        placeholder="100"
                                                        className={cn(
                                                            newVitals.blood_glucose && !isVitalInRange('blood_glucose', newVitals.blood_glucose) &&
                                                            "border-yellow-500 focus:ring-yellow-500"
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center mt-4">
                                                <div className="text-sm text-muted-foreground">
                                                    {vitals && (
                                                        <span>Previous vitals available from {format(new Date(vitals.created_at), 'MMM d, yyyy')}</span>
                                                    )}
                                                </div>
                                                <Button onClick={saveVitals} className="gap-2">
                                                    <Save className="h-4 w-4" />
                                                    Save Vitals
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>

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
                                                        onChange={(value) => handleNoteContentChange(section, value)}
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

            {/* Previous Session Notes Panel */}
            <div className="h-full">
                <PreviousSessionNotes
                    notes={notes}
                    onSelectNote={handleNoteSelection}
                    isExpanded={showPreviousNotes}
                    onToggleExpand={() => setShowPreviousNotes(!showPreviousNotes)}
                />
            </div>

            {/* Add saving indicator */}
            {isSaving && (
                <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg flex items-center gap-2">
                    <span className="animate-spin">⌛</span>
                    Saving...
                </div>
            )}
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

    @keyframes gradient-xy {
        0% {
            background-position: 0% 50%;
        }
        50% {
            background-position: 100% 50%;
        }
        100% {
            background-position: 0% 50%;
        }
    }

    .animate-gradient-xy {
        animation: gradient-xy 3s ease infinite;
        background-size: 400% 400%;
    }
`}</style>

