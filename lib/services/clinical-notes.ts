import { createClient } from "@/lib/supabase";
import { ClinicalNote, CreateClinicalNoteParams } from "@/types/notes";

export async function createClinicalNote(
  params: CreateClinicalNoteParams
): Promise<ClinicalNote> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("clinical_notes")
    .insert({
      ...params,
      recorded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateClinicalNote(
  id: string,
  updates: Partial<CreateClinicalNoteParams>
): Promise<ClinicalNote> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("clinical_notes")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getClinicalNotes(
  patientId: string
): Promise<ClinicalNote[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("clinical_notes")
    .select()
    .eq("patient_id", patientId)
    .order("recorded_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getClinicalNote(id: string): Promise<ClinicalNote> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("clinical_notes")
    .select()
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function deleteClinicalNote(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("clinical_notes").delete().eq("id", id);

  if (error) throw error;
}
