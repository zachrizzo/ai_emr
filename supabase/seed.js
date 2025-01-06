// seed.js

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load both .env and .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log(`Supabase URL: ${supabaseUrl}`);
console.log(`Supabase Service Key: ${supabaseServiceKey}`);

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase URL or Service Role Key in environment variables.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Utility Functions

/**
 * Selects a random element from an array.
 * @param {Array} array - The array to select from.
 * @returns {*} - A random element.
 */
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generates a random integer between min and max (inclusive).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a random date within the next 'n' days.
 * @param {number} days
 * @returns {Date}
 */
function getRandomFutureDate(days) {
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + getRandomInt(1, days));
    futureDate.setHours(getRandomInt(8, 17), getRandomInt(0, 59), 0, 0); // Business hours
    return futureDate;
}

/**
 * Generates a random phone number in the format (555) 123-4567
 * @returns {string}
 */
function generateRandomPhoneNumber() {
    const areaCode = '555'; // Keeping area code consistent for simplicity
    const firstPart = getRandomInt(100, 999);
    const secondPart = getRandomInt(1000, 9999);
    return `(${areaCode}) ${firstPart}-${secondPart}`;
}

/**
 * Generates a random address with a given street number.
 * @param {number} streetNumber
 * @returns {string}
 */
function generateRandomAddress(streetNumber) {
    const streetNames = ['Patient St', 'Health Ave', 'Medical Blvd', 'Care Way', 'Wellness Pkwy'];
    const street = getRandomElement(streetNames);
    const zip = 85000 + getRandomInt(0, 99);
    const cities = ['Phoenix', 'Scottsdale', 'Tempe', 'Mesa', 'Glendale'];
    const city = getRandomElement(cities);
    return `${streetNumber} ${street}, ${city}, AZ ${zip}`;
}

/**
 * Generates a random email based on first and last name.
 * @param {string} firstName
 * @param {string} lastName
 * @returns {string}
 */
function generateRandomEmail(firstName, lastName) {
    const domains = ['email.com', 'cilwamedical.com', 'healthcare.org'];
    return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${getRandomElement(domains)}`;
}

// Main Seed Function
async function seed() {
    try {
        console.log('Starting data seeding...');

        // 1. Check if the user exists
        const targetEmail = 'zachcilwa@gmail.com'; // Define the target email
        const targetPassword = 'Zach013074!'; // Define the target password

        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            throw new Error(`Error listing users: ${listError.message}`);
        }

        // 2. If user exists, delete their data and then delete the user
        const existingUser = existingUsers.users.find(user => user.email === targetEmail);
        if (existingUser) {
            console.log(`Existing user found: ${targetEmail}. Proceeding to delete their data.`);

            // Fetch all organization memberships for the user
            const { data: userOrgs, error: userOrgsError } = await supabase
                .from('organization_members')
                .select('organization_id')
                .eq('user_id', existingUser.id);

            if (userOrgsError) {
                throw new Error(`Error fetching user's organizations: ${userOrgsError.message}`);
            }

            if (userOrgs && userOrgs.length > 0) {
                for (const org of userOrgs) {
                    const organizationId = org.organization_id;

                    // Define the order of deletion to maintain referential integrity
                    const deleteOperations = [
                        supabase.from('note_comments').delete().eq('organization_id', organizationId),
                        supabase.from('note_sections').delete().eq('organization_id', organizationId),
                        supabase.from('clinical_notes').delete().eq('organization_id', organizationId),
                        supabase.from('appointments').delete().eq('organization_id', organizationId),
                        supabase.from('emergency_contacts').delete().eq('organization_id', organizationId),
                        supabase.from('patients').delete().eq('organization_id', organizationId),
                        supabase.from('providers').delete().eq('organization_id', organizationId),
                        supabase.from('note_templates').delete().eq('organization_id', organizationId),
                        supabase.from('locations').delete().eq('organization_id', organizationId),
                        supabase.from('organizations').delete().eq('id', organizationId),
                        supabase.from('users').delete().eq('id', existingUser.id),
                        supabase.from('organization_members').delete().eq('user_id', existingUser.id),
                    ];

                    for (const operation of deleteOperations) {
                        const { error } = await operation;
                        if (error && !error.message.includes('no rows')) {
                            console.warn(`Warning: Error during deletion: ${error.message}`);
                        }
                    }

                    console.log(`Deleted data for organization ID: ${organizationId}`);
                }
            }

            // Finally, delete the user
            const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id);
            if (deleteError) {
                throw new Error(`Error deleting existing user: ${deleteError.message}`);
            }
            console.log(`Deleted existing user with ID: ${existingUser.id}`);
        }

        // 3. Create a new user with fixed credentials
        const { data: userData, error: createError } = await supabase.auth.admin.createUser({
            email: targetEmail,
            password: targetPassword,
            email_confirm: true,
            user_metadata: {
                first_name: 'Zach',
                last_name: 'Cilwa',
                avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=zachcilwa`,
            },
        });

        if (createError) {
            throw new Error(`Error creating user: ${createError.message}`);
        }

        console.log('User created successfully:', userData);
        console.log(`Assigned Password for user: ${targetPassword}`);

        const userId = userData.user.id;

        // 4. Create an organization
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .insert([{
                name: 'Cilwa Medical Center',
                type: 'clinic',
                address: '123 Healthcare Ave, Phoenix, AZ 85001',
                phone_number: generateRandomPhoneNumber(),
                email: 'info@cilwamedical.com',
                website: 'www.cilwamedical.com',
                created_at: new Date(),
                updated_at: new Date(),
            }])
            .select()
            .single();

        if (orgError) {
            throw new Error(`Error creating organization: ${orgError.message}`);
        }

        console.log('Organization created successfully:', org);

        const organizationId = org.id;

        // 5. Upsert user profile in the 'users' table
        const { error: upsertError } = await supabase
            .from('users')
            .upsert([{
                id: userId,
                email: targetEmail,
                first_name: 'Zach',
                last_name: 'Cilwa',
                role: 'admin',
                organization_id: organizationId,
                phone_number: generateRandomPhoneNumber(),
                created_at: new Date(),
                updated_at: new Date(),
            }], {
                onConflict: 'id',
            });

        if (upsertError) {
            throw new Error(`Error upserting user profile: ${upsertError.message}`);
        }

        console.log('User profile created/updated successfully.');

        // 6. Associate the user with the organization as an admin
        // Remove any existing memberships for this user
        const { error: deleteMembershipError } = await supabase
            .from('organization_members')
            .delete()
            .eq('user_id', userId);

        if (deleteMembershipError && !deleteMembershipError.message.includes('no rows')) {
            console.warn(`Warning: Error deleting existing organization memberships: ${deleteMembershipError.message}`);
        }

        // Then, add the user as an admin member
        const { error: memberError } = await supabase
            .from('organization_members')
            .insert([{
                organization_id: organizationId,
                user_id: userId,
                role: 'admin',
                created_at: new Date(),
                updated_at: new Date(),
            }]);

        if (memberError) {
            throw new Error(`Error adding organization member: ${memberError.message}`);
        }

        console.log('Organization membership created successfully.');

        // 7. Create locations associated with the organization
        const locationNames = ['Main Hospital', 'North Clinic', 'South Clinic', 'East Valley Center', 'Westside Urgent Care'];
        const managerNames = ['John Smith', 'Sarah Johnson', 'Michael Chen', 'Emily Davis', 'Robert Lee', 'Linda Martinez', 'David Brown', 'Susan Clark'];

        const locations = locationNames.map(name => ({
            name: name,
            address: generateRandomAddress(getRandomInt(100, 999)),
            phone_number: generateRandomPhoneNumber(),
            email: `${name.toLowerCase().replace(/\s/g, '')}@cilwamedical.com`,
            organization_id: organizationId,
            status: getRandomElement(['active', 'inactive']),
            manager_name: `Dr. ${getRandomElement(managerNames)}`,
            operating_hours: 'Mon-Fri: 8:00 AM - 5:00 PM',
            timezone: 'America/Phoenix',
            capacity: getRandomElement([100, 200, 300, 400, 500]),
            is_primary: name === 'Main Hospital',
            created_at: new Date(),
            updated_at: new Date(),
        }));

        const { data: createdLocations, error: locError } = await supabase
            .from('locations')
            .insert(locations)
            .select();

        if (locError) {
            throw new Error(`Error creating locations: ${locError.message}`);
        }

        if (!createdLocations) {
            throw new Error('No locations were created');
        }

        console.log('Locations created successfully:', createdLocations);

        // 8. Create providers associated with the locations
        const providerFirstNames = ['Sarah', 'Michael', 'Emily', 'David', 'Lisa', 'James', 'Maria', 'Robert', 'Laura', 'Kevin'];
        const providerLastNames = ['Johnson', 'Chen', 'Rodriguez', 'Kim', 'Patel', 'Wilson', 'Garcia', 'Lee', 'Taylor', 'Martinez'];
        const specialties = ['Family Medicine', 'Internal Medicine', 'Pediatrics', 'Cardiology', 'Neurology', 'Orthopedics', 'Dermatology', 'Psychiatry', 'Radiology', 'Oncology'];

        const providers = [];

        for (let i = 0; i < 10; i++) {
            const firstName = getRandomElement(providerFirstNames);
            const lastName = getRandomElement(providerLastNames);
            const specialty = getRandomElement(specialties);
            const location = getRandomElement(createdLocations);
            const email = generateRandomEmail(firstName, lastName);

            providers.push({
                first_name: firstName,
                last_name: lastName,
                specialty: specialty,
                phone_number: generateRandomPhoneNumber(),
                email: email,
                organization_id: organizationId,
                location_id: location.id,
                user_id: userId,
                created_at: new Date(),
                updated_at: new Date(),
            });
        }

        const { data: createdProviders, error: provError } = await supabase
            .from('providers')
            .insert(providers)
            .select();

        if (provError) {
            throw new Error(`Error creating providers: ${provError.message}`);
        }

        console.log('Providers created successfully:', createdProviders);

        // 9. Create patients
        const patientFirstNames = ['John', 'Jane', 'Robert', 'Maria', 'David', 'Sarah', 'Michael', 'Emily', 'William', 'Linda'];
        const patientLastNames = ['Doe', 'Smith', 'Johnson', 'Garcia', 'Chen', 'Wilson', 'Brown', 'Davis', 'Taylor', 'Martinez'];
        const genders = ['male', 'female', 'non_binary', 'prefer_not_to_say'];
        const preferredLanguages = ['English', 'Spanish', 'French', 'Mandarin', 'Arabic'];
        const preferredCommunications = ['email', 'phone', 'sms', 'in_person'];

        const patients = [];

        for (let i = 0; i < 20; i++) {
            const firstName = getRandomElement(patientFirstNames);
            const lastName = getRandomElement(patientLastNames);
            const gender = getRandomElement(genders);
            const email = generateRandomEmail(firstName, lastName);
            const phoneNumber = generateRandomPhoneNumber();
            const address = generateRandomAddress(getRandomInt(100, 999));
            const preferredLanguage = getRandomElement(preferredLanguages);
            const preferredCommunication = getRandomElement(preferredCommunications);
            const culturalConsiderations = Math.random() < 0.3 ? 'Prefers same-gender provider' : null;

            // Random date of birth between 1950 and 2005
            const start = new Date(1950, 0, 1);
            const end = new Date(2005, 11, 31);
            const dob = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
            const dobString = dob.toISOString().split('T')[0];

            patients.push({
                first_name: firstName,
                last_name: lastName,
                date_of_birth: dobString,
                gender: gender,
                email: email,
                phone_number: phoneNumber,
                address: address,
                organization_id: organizationId,
                preferred_language: preferredLanguage,
                preferred_communication: preferredCommunication,
                cultural_considerations: culturalConsiderations,
                created_at: new Date(),
                updated_at: new Date(),
            });
        }

        const { data: createdPatients, error: patError } = await supabase
            .from('patients')
            .insert(patients)
            .select();

        if (patError) {
            throw new Error(`Error creating patients: ${patError.message}`);
        }

        console.log('Patients created successfully:', createdPatients);

        // 10. Create appointments for each patient
        const appointmentStatuses = ['scheduled', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'];
        const reasonsForVisit = ['Annual checkup', 'Follow-up', 'Consultation', 'Urgent care', 'Routine examination', 'Specialist referral'];
        const appointmentTypes = ['routine', 'urgent', 'follow_up', 'specialist', 'procedure'];
        const visitTypes = ['in_person', 'video', 'phone'];

        const appointments = [];

        createdPatients.forEach(patient => {
            const numberOfAppointments = getRandomInt(1, 5);
            for (let i = 0; i < numberOfAppointments; i++) {
                const provider = getRandomElement(createdProviders);
                const location = getRandomElement(createdLocations);
                const appointmentDate = getRandomFutureDate(60);
                const duration = getRandomElement([15, 30, 45, 60]);
                const status = getRandomElement(appointmentStatuses);
                const reason = getRandomElement(reasonsForVisit);
                const type = getRandomElement(appointmentTypes);
                const visitType = getRandomElement(visitTypes);

                appointments.push({
                    organization_id: organizationId,
                    patient_id: patient.id,
                    provider_id: provider.id,
                    location_id: location.id,
                    appointment_date: appointmentDate,
                    duration_minutes: duration,
                    status: status,
                    reason_for_visit: reason,
                    appointment_type: type,
                    visit_type: visitType,
                    created_at: new Date(),
                    updated_at: new Date(),
                });
            }
        });

        const { data: createdAppointments, error: apptError } = await supabase
            .from('appointments')
            .insert(appointments)
            .select();

        if (apptError) {
            throw new Error(`Error creating appointments: ${apptError.message}`);
        }

        console.log('Appointments created successfully:', createdAppointments);

        // 11. Create emergency contacts for each patient
        const relationships = ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Guardian'];
        const emergencyContacts = [];

        createdPatients.forEach(patient => {
            const hasEmergencyContact = Math.random() < 0.8;
            if (hasEmergencyContact) {
                const relationship = getRandomElement(relationships);
                const phoneNumber = generateRandomPhoneNumber();
                const name = `${getRandomElement(['Alice', 'Bob', 'Charlie', 'Diana', 'Ethan', 'Fiona', 'George', 'Hannah'])} ${getRandomElement(['Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson'])}`;

                emergencyContacts.push({
                    patient_id: patient.id,
                    name: name,
                    relationship: relationship,
                    phone_number: phoneNumber,
                    organization_id: organizationId,
                    created_at: new Date(),
                    updated_at: new Date(),
                });
            }
        });

        const { data: createdEmergencyContacts, error: ecError } = await supabase
            .from('emergency_contacts')
            .insert(emergencyContacts)
            .select();

        if (ecError) {
            throw new Error(`Error creating emergency contacts: ${ecError.message}`);
        }

        console.log('Emergency contacts created successfully:', createdEmergencyContacts);

        // 12. Create note templates
        const noteTemplates = [
            {
                name: 'General Examination Template',
                content: 'Chief Complaint:\n\nHistory of Present Illness:\n\nReview of Systems:\n\nPhysical Examination:\n\nAssessment:\n\nPlan:',
                specialty: 'General Medicine',
                category: 'examination',
                organization_id: organizationId,
                created_by: userId,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                name: 'Follow-up Visit Template',
                content: 'Progress Notes:\n\nCurrent Symptoms:\n\nMedication Review:\n\nPlan:',
                specialty: 'General Medicine',
                category: 'follow_up',
                organization_id: organizationId,
                created_by: userId,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                name: 'Specialist Consultation Template',
                content: 'Reason for Consultation:\n\nHistory:\n\nFindings:\n\nRecommendations:',
                specialty: 'Specialty Care',
                category: 'consultation',
                organization_id: organizationId,
                created_by: userId,
                created_at: new Date(),
                updated_at: new Date(),
            },
            {
                name: 'Urgent Care Template',
                content: 'Chief Complaint:\n\nHistory:\n\nExamination:\n\nDiagnosis:\n\nTreatment Plan:',
                specialty: 'Urgent Care',
                category: 'urgent',
                organization_id: organizationId,
                created_by: userId,
                created_at: new Date(),
                updated_at: new Date(),
            },
        ];

        const { data: createdTemplates, error: tmplError } = await supabase
            .from('note_templates')
            .insert(noteTemplates)
            .select();

        if (tmplError) {
            throw new Error(`Error creating note templates: ${tmplError.message}`);
        }

        console.log('Note templates created successfully:', createdTemplates);

        // 13. Create clinical notes for appointments
        const clinicalNotes = [];

        createdAppointments.forEach(appointment => {
            const useTemplate = Math.random() < 0.8;
            const template = useTemplate ? getRandomElement(createdTemplates) : null;
            const type = useTemplate && template ? 'template' : 'manual';
            const status = getRandomElement(['draft', 'final', 'signed']);
            const visitType = appointment.visit_type;

            let content = '';
            if (useTemplate && template) {
                content = template.content;
            } else {
                content = 'Manual note content goes here.';
            }

            const metadata = {
                specialty: useTemplate && template ? template.specialty : 'General',
                visit_type: visitType,
            };

            const tags = ['routine', 'follow_up'];

            clinicalNotes.push({
                patient_id: appointment.patient_id,
                provider_id: userId,
                appointment_id: appointment.id,
                organization_id: organizationId,
                content: content,
                type: type,
                status: status,
                template_id: template ? template.id : null,
                metadata: metadata,
                tags: tags,
                created_at: new Date(),
                updated_at: new Date(),
            });
        });

        const { data: createdClinicalNotes, error: cnError } = await supabase
            .from('clinical_notes')
            .insert(clinicalNotes)
            .select();

        if (cnError) {
            throw new Error(`Error creating clinical notes: ${cnError.message}`);
        }

        console.log('Clinical notes created successfully:', createdClinicalNotes);

        // 14. Create note sections for clinical notes
        const sectionTypes = ['subjective', 'objective', 'assessment', 'plan'];
        const sectionTitles = {
            'subjective': 'Subjective',
            'objective': 'Objective',
            'assessment': 'Assessment',
            'plan': 'Plan',
        };
        const sectionContents = {
            'subjective': ['Patient reports mild headaches.', 'Patient experiences moderate back pain.', 'Patient has significant concerns about recent weight loss.', 'Patient needs follow-up for chronic condition.'],
            'objective': ['Examination reveals normal vital signs.', 'Examination shows slight abnormalities in blood pressure.', 'Examination indicates significant findings in respiratory system.', 'Condition has improved since last visit.'],
            'assessment': ['Assessment indicates good progress.', 'Assessment shows stable condition.', 'Needs monitoring for potential complications.', 'Requires follow-up in two weeks.'],
            'plan': ['Plan includes continued monitoring.', 'Medication adjustment is necessary.', 'Follow-up scheduled in two weeks.', 'Referral to a specialist is recommended.'],
        };

        const noteSections = [];

        createdClinicalNotes.forEach(note => {
            sectionTypes.forEach((type, index) => {
                const content = `${getRandomElement(sectionContents[type])}`;
                noteSections.push({
                    note_id: note.id,
                    section_type: type,
                    title: sectionTitles[type],
                    content: { content: content },
                    order_index: index,
                    created_at: new Date(),
                    updated_at: new Date(),
                });
            });
        });

        const { data: createdNoteSections, error: nsError } = await supabase
            .from('note_sections')
            .insert(noteSections)
            .select();

        if (nsError) {
            throw new Error(`Error creating note sections: ${nsError.message}`);
        }

        console.log('Note sections created successfully:', createdNoteSections);

        // 15. Create comments for clinical notes
        const commentContents = [
            'Follow-up required in 2 weeks.',
            'Patient showing good progress.',
            'Medication adjusted based on response.',
            'Labs ordered for next visit.',
            'Referral to specialist recommended.',
            'Patient education provided.',
            'Symptoms improving with current treatment.',
            'Need to monitor blood pressure regularly.',
            'Discuss lifestyle changes with patient.',
            'Schedule imaging studies for further evaluation.',
        ];

        const noteComments = [];

        createdClinicalNotes.forEach(note => {
            const hasComments = Math.random() < 0.5;
            if (hasComments) {
                const numberOfComments = getRandomInt(1, 3);
                for (let i = 0; i < numberOfComments; i++) {
                    noteComments.push({
                        note_id: note.id,
                        user_id: userId,
                        content: getRandomElement(commentContents),
                        created_at: new Date(),
                        updated_at: new Date(),
                    });
                }
            }
        });

        const { data: createdNoteComments, error: ncError } = await supabase
            .from('note_comments')
            .insert(noteComments)
            .select();

        if (ncError) {
            throw new Error(`Error creating note comments: ${ncError.message}`);
        }

        console.log('Note comments created successfully:', createdNoteComments);

        console.log('Data seeding completed successfully.');

    } catch (err) {
        console.error('Error seeding data:', err);
    }
}

seed();
