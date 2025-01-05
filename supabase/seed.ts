const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

interface Patient {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    gender: string;
    email: string;
    phone_number: string;
    address: string;
    organization_id: string;
    preferred_language: string;
    preferred_communication: string;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seed() {
    try {
        // Delete existing user using SQL
        const { error: sqlError } = await supabase.rpc('delete_user_complete', {
            p_email: 'zachcilwa@gmail.com'
        });

        if (sqlError) {
            console.log('Error deleting user:', sqlError);
        }

        // Create user with the Supabase Admin API
        const { data: user, error } = await supabase.auth.admin.createUser({
            email: 'zachcilwa@gmail.com',
            password: 'Zach013074!',
            email_confirm: true,
            user_metadata: {
                first_name: 'Zach',
                last_name: 'Cilwa',
                avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zachcilwa',
            },
        });

        if (error) throw error;
        console.log('User created:', user);

        // Create organization
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .insert([{
                name: 'Cilwa Medical Center',
                type: 'hospital',
                address: '123 Healthcare Ave, Phoenix, AZ 85001',
                phone_number: '(555) 123-4567',
                email: 'info@cilwamedical.com',
                website: 'www.cilwamedical.com'
            }])
            .select()
            .single();

        if (orgError) throw orgError;
        console.log('Organization created:', org);

        // Add or update user profile
        const { error: upsertError } = await supabase
            .from('users')
            .upsert([{
                id: user.user.id,
                email: 'zachcilwa@gmail.com',
                first_name: 'Zach',
                last_name: 'Cilwa',
                role: 'provider',
                organization_id: org.id,
                phone_number: '(555) 987-6543'
            }], {
                onConflict: 'id'
            });

        if (upsertError) throw upsertError;
        console.log('User profile created/updated');

        // Delete existing organization member if exists
        await supabase
            .from('organization_members')
            .delete()
            .eq('user_id', user.user.id);

        // Add organization member
        const { error: memberError } = await supabase
            .from('organization_members')
            .insert([{
                organization_id: org.id,
                user_id: user.user.id,
                role: 'admin'
            }]);

        if (memberError) throw memberError;
        console.log('Organization member created');

        // Create locations
        const locations = [
            {
                name: 'Main Hospital',
                address: '123 Healthcare Ave, Phoenix, AZ 85001',
                phone_number: '(555) 123-4567',
                email: 'main@cilwamedical.com',
                organization_id: org.id,
                status: 'active',
                manager_name: 'Dr. John Smith',
                operating_hours: 'Mon-Fri: 8:00 AM - 5:00 PM',
                timezone: 'America/Phoenix',
                capacity: 500,
                is_primary: true
            },
            {
                name: 'North Clinic',
                address: '456 Medical Pkwy, Scottsdale, AZ 85254',
                phone_number: '(555) 234-5678',
                email: 'north@cilwamedical.com',
                organization_id: org.id,
                status: 'active',
                manager_name: 'Dr. Sarah Johnson',
                operating_hours: 'Mon-Fri: 8:00 AM - 5:00 PM',
                timezone: 'America/Phoenix',
                capacity: 200,
                is_primary: false
            }
        ];

        const { data: createdLocations, error: locError } = await supabase
            .from('locations')
            .insert(locations)
            .select();

        if (locError) throw locError;
        console.log('Locations created:', createdLocations);

        // Create providers
        const providers = [
            {
                first_name: 'Sarah',
                last_name: 'Johnson',
                specialty: 'Family Medicine',
                phone_number: '(555) 111-2222',
                email: 'sarah.johnson@cilwamedical.com',
                organization_id: org.id,
                location_id: createdLocations[0].id
            },
            {
                first_name: 'Michael',
                last_name: 'Chen',
                specialty: 'Internal Medicine',
                phone_number: '(555) 333-4444',
                email: 'michael.chen@cilwamedical.com',
                organization_id: org.id,
                location_id: createdLocations[1].id
            }
        ];

        const { data: createdProviders, error: provError } = await supabase
            .from('providers')
            .insert(providers)
            .select();

        if (provError) throw provError;
        console.log('Providers created:', createdProviders);

        // Create patients
        const patients = [
            {
                first_name: 'John',
                last_name: 'Doe',
                date_of_birth: '1980-01-15',
                gender: 'male',
                email: 'john.doe@email.com',
                phone_number: '(555) 555-1212',
                address: '123 Patient St, Phoenix, AZ 85001',
                organization_id: org.id,
                preferred_language: 'English',
                preferred_communication: 'email'
            },
            {
                first_name: 'Jane',
                last_name: 'Smith',
                date_of_birth: '1975-03-22',
                gender: 'female',
                email: 'jane.smith@email.com',
                phone_number: '(555) 555-3434',
                address: '456 Patient Ave, Phoenix, AZ 85016',
                organization_id: org.id,
                preferred_language: 'English',
                preferred_communication: 'phone'
            }
        ];

        const { data: createdPatients, error: patError } = await supabase
            .from('patients')
            .insert(patients)
            .select();

        if (patError) throw patError;
        console.log('Patients created:', createdPatients);

        // Create appointments
        const appointments = (createdPatients as Patient[]).map((patient) => ({
            organization_id: org.id,
            patient_id: patient.id,
            provider_id: createdProviders[0].id,
            location_id: createdLocations[0].id,
            appointment_date: new Date(Date.now() + Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
            duration_minutes: 30,
            status: 'scheduled',
            reason_for_visit: 'Annual checkup',
            visit_type: 'in_person'
        }));

        const { data: createdAppointments, error: apptError } = await supabase
            .from('appointments')
            .insert(appointments)
            .select();

        if (apptError) throw apptError;
        console.log('Appointments created:', createdAppointments);

    } catch (err) {
        console.error('Error seeding data:', err);
    }
}

seed();
