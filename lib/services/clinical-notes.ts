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
