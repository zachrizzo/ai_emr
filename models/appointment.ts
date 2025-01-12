import { supabase } from '@/utils/supabase-config';
import { Appointment } from '@/types';

export class AppointmentModel {
  static async create(appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>) {
    // Verify patient exists and belongs to organization
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', appointment.patient_id)
      .eq('organization_id', appointment.organization_id)
      .is('deleted_at', null)
      .single();

    if (patientError || !patientData) {
      throw new Error('Patient not found or does not belong to your organization');
    }

    // Verify provider exists and belongs to organization
    const { data: providerData, error: providerError } = await supabase
      .from('providers')
      .select('id')
      .eq('id', appointment.provider_id)
      .eq('organization_id', appointment.organization_id)
      .is('deleted_at', null)
      .single();

    if (providerError || !providerData) {
      throw new Error('Provider not found or does not belong to your organization');
    }

    // Create appointment
    const { data, error } = await supabase
      .from('appointments')
      .insert(appointment)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, appointment: Partial<Appointment>) {
    const { data, error } = await supabase
      .from('appointments')
      .update(appointment)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string) {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async getById(id: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(id, first_name, last_name, date_of_birth),
        provider:providers(id, first_name, last_name),
        location:locations(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async getByPatient(patientId: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        provider:providers(id, first_name, last_name),
        location:locations(id, name)
      `)
      .eq('patient_id', patientId)
      .order('appointment_date', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getByOrganization(organizationId: string) {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(id, first_name, last_name, date_of_birth),
        provider:providers(id, first_name, last_name),
        location:locations(id, name)
      `)
      .eq('organization_id', organizationId)
      .order('appointment_date', { ascending: false });

    if (error) throw error;
    return data;
  }
}
