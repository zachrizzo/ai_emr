import { supabase } from '@/utils/supabase-config'

export async function getClinicalNotes(patientId: string, organizationId: string) {
  const { data, error } = await supabase
    .from('clinical_notes')
    .select(`
      *,
      provider:providers(id, first_name, last_name)
    `)
    .eq('patient_id', patientId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createClinicalNote(note: any) {
  const { data, error } = await supabase
    .from('clinical_notes')
    .insert([note])
    .select()

  if (error) throw error
  return data[0]
}

export async function updateClinicalNote(id: string, note: any) {
  const { data, error } = await supabase
    .from('clinical_notes')
    .update(note)
    .eq('id', id)
    .select()

  if (error) throw error
  return data[0]
}

export async function deleteClinicalNote(id: string) {
  const { error } = await supabase
    .from('clinical_notes')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export function subscribeToClinicalNotes(
  patientId: string,
  organizationId: string,
  onInsert: () => void,
  onUpdate: () => void,
  onDelete: () => void
) {
  const channel = supabase
    .channel('clinical-notes-changes')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'clinical_notes',
        filter: `patient_id=eq.${patientId} AND organization_id=eq.${organizationId}`
      },
      () => onInsert()
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'clinical_notes',
        filter: `patient_id=eq.${patientId} AND organization_id=eq.${organizationId}`
      },
      () => onUpdate()
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'clinical_notes',
        filter: `patient_id=eq.${patientId} AND organization_id=eq.${organizationId}`
      },
      () => onDelete()
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
