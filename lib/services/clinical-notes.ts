import { supabase } from '@/utils/supabase-config'
import { ClinicalNote, CreateClinicalNoteParams, UpdateClinicalNoteParams } from '@/types/notes'

export async function getClinicalNotes(patientId: string, organizationId: string): Promise<ClinicalNote[]> {
    const { data, error } = await supabase
        .from('clinical_notes')
        .select(`
            id,
            patient_id,
            provider_id,
            appointment_id,
            organization_id,
            content,
            type,
            status,
            version,
            parent_note_id,
            template_id,
            metadata,
            tags,
            is_deleted,
            created_at,
            updated_at,
            signed_at,
            signed_by
        `)
        .eq('patient_id', patientId)
        .eq('organization_id', organizationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching clinical notes:', error)
        throw error
    }

    console.log('Raw notes data:', data)
    return data?.map(note => ({
        ...note,
        tags: note.tags || [],
        is_deleted: note.is_deleted || false
    })) || []
}

export async function createClinicalNote(note: CreateClinicalNoteParams): Promise<ClinicalNote> {
    const { data, error } = await supabase
        .from('clinical_notes')
        .insert([note])
        .select()

    if (error) throw error
    return {
        ...data[0],
        tags: data[0].tags || [],
        is_deleted: data[0].is_deleted || false
    }
}

export async function updateClinicalNote(id: string, note: UpdateClinicalNoteParams): Promise<ClinicalNote> {
    const { data, error } = await supabase
        .from('clinical_notes')
        .update(note)
        .eq('id', id)
        .select()

    if (error) throw error
    return {
        ...data[0],
        tags: data[0].tags || [],
        is_deleted: data[0].is_deleted || false
    }
}

export async function deleteClinicalNote(noteId: string): Promise<void> {
    const { error } = await supabase
        .from('clinical_notes')
        .update({ is_deleted: true })
        .eq('id', noteId)

    if (error) {
        console.error('Error deleting clinical note:', error)
        throw error
    }
}

export function subscribeToClinicalNotes(
    patientId: string,
    organizationId: string,
    onInsert: () => void,
    onUpdate: () => void,
    onDelete: () => void
): () => void {
    const subscription = supabase
        .channel('clinical_notes_changes')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'clinical_notes',
                filter: `patient_id=eq.${patientId} AND organization_id=eq.${organizationId} AND is_deleted=eq.false`
            },
            (payload) => {
                console.log('Note inserted:', payload)
                onInsert()
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'clinical_notes',
                filter: `patient_id=eq.${patientId} AND organization_id=eq.${organizationId} AND is_deleted=eq.false`
            },
            (payload) => {
                // Only trigger reload if content was changed
                if (payload.new && 'content' in payload.new) {
                    console.log('Note content updated:', payload)
                    onUpdate()
                }
            }
        )
        .on(
            'postgres_changes',
            {
                event: 'DELETE',
                schema: 'public',
                table: 'clinical_notes',
                filter: `patient_id=eq.${patientId} AND organization_id=eq.${organizationId}`
            },
            (payload) => {
                console.log('Note deleted:', payload)
                onDelete()
            }
        )
        .subscribe()

    return () => {
        subscription.unsubscribe()
    }
}
