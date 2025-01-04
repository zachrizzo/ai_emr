import { supabase } from '@/lib/supabase'
import { ClinicalNote, CreateClinicalNoteParams, UpdateClinicalNoteParams } from '@/types/notes'

export async function getClinicalNotes(patientId: string, organizationId: string) {
    // First get the notes
    const { data: notes, error: notesError } = await supabase
        .from('clinical_notes')
        .select(`
            *,
            provider:users(id, full_name)
        `)
        .eq('patient_id', patientId)
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

    if (notesError) throw notesError

    // Then get related data for each note
    const notesWithRelations = await Promise.all(notes.map(async (note) => {
        const [
            { data: sections },
            { data: comments },
            { data: voiceRecording }
        ] = await Promise.all([
            supabase
                .from('note_sections')
                .select('*')
                .eq('note_id', note.id)
                .order('order_index'),
            supabase
                .from('note_comments')
                .select('*')
                .eq('note_id', note.id)
                .order('created_at'),
            supabase
                .from('voice_recordings')
                .select('*')
                .eq('note_id', note.id)
                .single()
        ])

        return {
            ...note,
            sections: sections || [],
            comments: comments || [],
            voice_recording: voiceRecording || null
        }
    }))

    return notesWithRelations as ClinicalNote[]
}

export async function getClinicalNoteById(noteId: string, organizationId: string) {
    // First get the note
    const { data: note, error: noteError } = await supabase
        .from('clinical_notes')
        .select(`
            *,
            provider:users(id, full_name)
        `)
        .eq('id', noteId)
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .single()

    if (noteError) throw noteError

    // Then get related data
    const [
        { data: sections },
        { data: comments },
        { data: voiceRecording }
    ] = await Promise.all([
        supabase
            .from('note_sections')
            .select('*')
            .eq('note_id', noteId)
            .order('order_index'),
        supabase
            .from('note_comments')
            .select('*')
            .eq('note_id', noteId)
            .order('created_at'),
        supabase
            .from('voice_recordings')
            .select('*')
            .eq('note_id', noteId)
            .single()
    ])

    return {
        ...note,
        sections: sections || [],
        comments: comments || [],
        voice_recording: voiceRecording || null
    } as ClinicalNote
}

export async function createClinicalNote(params: CreateClinicalNoteParams) {
    const {
        patient_id,
        provider_id,
        organization_id,
        appointment_id,
        content,
        type,
        template_id,
        metadata,
        tags,
        sections = []
    } = params

    // Start a transaction
    const { data: note, error: noteError } = await supabase
        .from('clinical_notes')
        .insert({
            patient_id,
            provider_id,
            organization_id,
            appointment_id,
            content,
            type,
            template_id,
            metadata,
            tags,
            created_by: provider_id,
            is_deleted: false,
            status: 'draft',
            recorded_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .select()
        .single()

    if (noteError) throw noteError

    // Insert sections if provided
    if (sections.length > 0) {
        const { error: sectionsError } = await supabase
            .from('note_sections')
            .insert(
                sections.map(section => ({
                    ...section,
                    note_id: note.id
                }))
            )

        if (sectionsError) throw sectionsError
    }

    return note
}

export async function updateClinicalNote(noteId: string, organizationId: string, params: UpdateClinicalNoteParams) {
    const {
        content,
        metadata,
        tags,
        sections,
        status
    } = params

    // Verify note belongs to organization
    const { data: existingNote, error: verifyError } = await supabase
        .from('clinical_notes')
        .select('id')
        .eq('id', noteId)
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .single()

    if (verifyError || !existingNote) {
        throw new Error('Note not found or access denied')
    }

    // Update the note
    const { data: note, error: noteError } = await supabase
        .from('clinical_notes')
        .update({
            content,
            metadata,
            tags,
            status,
            updated_at: new Date().toISOString()
        })
        .eq('id', noteId)
        .select()
        .single()

    if (noteError) throw noteError

    // Update sections if provided
    if (sections) {
        // Delete existing sections
        const { error: deleteError } = await supabase
            .from('note_sections')
            .delete()
            .eq('note_id', noteId)

        if (deleteError) throw deleteError

        // Insert new sections
        const { error: sectionsError } = await supabase
            .from('note_sections')
            .insert(
                sections.map(section => ({
                    ...section,
                    note_id: noteId
                }))
            )

        if (sectionsError) throw sectionsError
    }

    return note
}

export async function deleteClinicalNote(noteId: string, organizationId: string) {
    // Verify note belongs to organization
    const { data: existingNote, error: verifyError } = await supabase
        .from('clinical_notes')
        .select('id')
        .eq('id', noteId)
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .single()

    if (verifyError || !existingNote) {
        throw new Error('Note not found or access denied')
    }

    // Soft delete the note
    const { error } = await supabase
        .from('clinical_notes')
        .update({
            is_deleted: true,
            updated_at: new Date().toISOString()
        })
        .eq('id', noteId)

    if (error) throw error
}

// Subscribe to note changes
export function subscribeToClinicalNotes(
    patientId: string,
    organizationId: string,
    onInsert?: (payload: any) => void,
    onUpdate?: (payload: any) => void,
    onDelete?: (payload: any) => void
) {
    const channel = supabase.channel(`clinical_notes:${patientId}:${organizationId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'clinical_notes',
                filter: `patient_id=eq.${patientId} AND organization_id=eq.${organizationId}`
            },
            (payload) => onInsert?.(payload)
        )
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'clinical_notes',
                filter: `patient_id=eq.${patientId} AND organization_id=eq.${organizationId}`
            },
            (payload) => onUpdate?.(payload)
        )
        .on(
            'postgres_changes',
            {
                event: 'DELETE',
                schema: 'public',
                table: 'clinical_notes',
                filter: `patient_id=eq.${patientId} AND organization_id=eq.${organizationId}`
            },
            (payload) => onDelete?.(payload)
        )
        .subscribe()

    return () => {
        supabase.removeChannel(channel)
    }
}
