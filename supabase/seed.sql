-- Seed script for test data

-- Create test user in auth.users (this is handled by Supabase Auth)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Create the user with a properly hashed password
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        invited_at,
        confirmation_token,
        confirmation_sent_at,
        recovery_token,
        recovery_sent_at,
        email_change_token_new,
        email_change,
        email_change_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        created_at,
        updated_at,
        phone,
        phone_confirmed_at,
        phone_change,
        phone_change_token,
        phone_change_sent_at,
        email_change_token_current,
        email_change_confirm_status,
        banned_until,
        reauthentication_token,
        reauthentication_sent_at
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'zachcilwa@gmail.com',
        '$2a$10$5I5qV6S9.v.uEPFM1sE3wOo8rPE3Dw9uUH6T5LHCYtbhIJ4w3Qxb2',  -- This is 'Zach013074!'
        now(),
        null,
        '',
        null,
        '',
        null,
        '',
        '',
        null,
        now(),
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object(
            'first_name', 'Zach',
            'last_name', 'Cilwa',
            'avatar_url', 'https://api.dicebear.com/7.x/avataaars/svg?seed=zachcilwa'
        ),
        false,
        now(),
        now(),
        null,
        null,
        '',
        '',
        null,
        '',
        0,
        null,
        '',
        null
    )
    RETURNING id INTO v_user_id;

    -- Add the user to auth.identities
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        created_at,
        updated_at,
        last_sign_in_at
    )
    VALUES (
        v_user_id,
        v_user_id,
        jsonb_build_object(
            'sub', v_user_id,
            'email', 'zachcilwa@gmail.com'
        ),
        'email',
        'zachcilwa@gmail.com',
        now(),
        now(),
        now()
    );

    -- Wait for the trigger to create the user record
    PERFORM pg_sleep(1);

    -- Update user profile with additional information
    UPDATE users
    SET
        first_name = 'Zach',
        last_name = 'Cilwa',
        role = 'provider',
        phone_number = '(555) 987-6543'
    WHERE id = v_user_id;

    -- Create test organization
    WITH new_org AS (
        INSERT INTO organizations (name, type, address, phone_number, email, website)
        VALUES (
            'Cilwa Medical Center',
            'hospital',
            '123 Healthcare Ave, Phoenix, AZ 85001',
            '(555) 123-4567',
            'info@cilwamedical.com',
            'www.cilwamedical.com'
        )
        RETURNING id
    )
    -- Add user as organization member and update user's organization
    , org_member AS (
        INSERT INTO organization_members (organization_id, user_id, role)
        SELECT id, v_user_id, 'admin'
        FROM new_org
        RETURNING organization_id
    )
    -- Create locations
    , new_locations AS (
        INSERT INTO locations (
            organization_id,
            name,
            address,
            phone_number,
            email,
            status,
            manager_name,
            operating_hours,
            timezone,
            capacity,
            is_primary
        )
        SELECT
            organization_id,
            name,
            address || ', ' || state || ' ' || zip_code,
            phone,
            email,
            'active',
            'Dr. ' || (ARRAY['John Smith', 'Sarah Johnson', 'Michael Chen', 'Emily Davis'])[floor(random() * 4 + 1)],
            'Mon-Fri: 8:00 AM - 5:00 PM',
            'America/Phoenix',
            CASE type
                WHEN 'hospital' THEN 500
                WHEN 'clinic' THEN 200
                ELSE 100
            END,
            name = 'Main Hospital'
        FROM org_member,
        (VALUES
            ('Main Hospital', '123 Healthcare Ave', 'AZ', '85001', '(555) 123-4567', 'main@cilwamedical.com', 'hospital'),
            ('North Clinic', '456 Medical Pkwy', 'AZ', '85254', '(555) 234-5678', 'north@cilwamedical.com', 'clinic'),
            ('South Clinic', '789 Health Blvd', 'AZ', '85282', '(555) 345-6789', 'south@cilwamedical.com', 'clinic'),
            ('East Valley Center', '321 Care Way', 'AZ', '85201', '(555) 456-7890', 'east@cilwamedical.com', 'urgent_care')
        ) AS l(name, address, state, zip_code, phone, email, type)
        RETURNING id, organization_id
    )
    -- Update user's organization
    , user_org_update AS (
        UPDATE users
        SET organization_id = (SELECT organization_id FROM org_member)
        WHERE id = v_user_id
    )
    -- Create test patients
    , new_patient AS (
        INSERT INTO patients (
            organization_id,
            first_name,
            last_name,
            date_of_birth,
            gender,
            email,
            phone_number,
            address,
            preferred_language,
            preferred_communication,
            cultural_considerations
        )
        SELECT
            organization_id,
            first_name,
            last_name,
            date_of_birth,
            gender,
            lower(first_name || last_name) || '@email.com',
            '(555) ' || floor(random() * 900 + 100)::text || '-' || floor(random() * 9000 + 1000)::text,
            floor(random() * 999 + 1)::text || ' Patient St, Phoenix, AZ ' || (floor(random() * 89 + 10) + 85000)::text,
            'English',
            'email',
            CASE WHEN random() < 0.3 THEN 'Prefers same-gender provider' ELSE NULL END
        FROM org_member
        CROSS JOIN (
            VALUES
                ('John', 'Doe', '1980-01-15'::date, 'male'),
                ('Jane', 'Smith', '1975-03-22'::date, 'female'),
                ('Robert', 'Johnson', '1990-07-10'::date, 'male'),
                ('Maria', 'Garcia', '1988-11-05'::date, 'female'),
                ('David', 'Chen', '1965-09-30'::date, 'male'),
                ('Sarah', 'Wilson', '1992-04-18'::date, 'female'),
                ('Michael', 'Brown', '1970-12-25'::date, 'male'),
                ('Emily', 'Davis', '1985-06-08'::date, 'female')
        ) AS p(first_name, last_name, date_of_birth, gender)
        RETURNING id, organization_id
    )
    -- Create emergency contacts for all patients
    , emergency_contacts AS (
        INSERT INTO emergency_contacts (
            patient_id,
            name,
            relationship,
            phone_number,
            organization_id
        )
        SELECT
            id,
            'Emergency Contact for ' || first_name || ' ' || last_name,
            (ARRAY['Spouse', 'Parent', 'Sibling', 'Child'])[floor(random() * 4 + 1)],
            '(555) ' || floor(random() * 900 + 100)::text || '-' || floor(random() * 9000 + 1000)::text,
            organization_id
        FROM patients
        WHERE id IN (SELECT id FROM new_patient)
    )
    -- Create additional providers
    , additional_providers AS (
        INSERT INTO providers (
            first_name,
            last_name,
            specialty,
            phone_number,
            email,
            organization_id,
            location_id
        )
        SELECT
            first_name,
            last_name,
            specialty,
            '(555) ' || floor(random() * 900 + 100)::text || '-' || floor(random() * 9000 + 1000)::text,
            lower(first_name || last_name) || '@cilwamedical.com',
            nl.organization_id,
            nl.id
        FROM new_locations nl
        CROSS JOIN (
            VALUES
                ('Sarah', 'Johnson', 'Family Medicine'),
                ('Michael', 'Chen', 'Internal Medicine'),
                ('Emily', 'Rodriguez', 'Pediatrics'),
                ('David', 'Kim', 'Cardiology'),
                ('Lisa', 'Patel', 'Neurology'),
                ('James', 'Wilson', 'Orthopedics'),
                ('Maria', 'Garcia', 'Dermatology'),
                ('Robert', 'Lee', 'Psychiatry')
        ) AS p(first_name, last_name, specialty)
        WHERE nl.id IN (
            SELECT id FROM new_locations
            ORDER BY random()
            LIMIT 1
        )
        RETURNING id, organization_id
    )
    -- Create appointments for each patient with different providers
    , new_appointments AS (
        INSERT INTO appointments (
            organization_id,
            patient_id,
            provider_id,
            location_id,
            appointment_date,
            duration_minutes,
            status,
            reason_for_visit,
            appointment_type,
            visit_type
        )
        SELECT
            np.organization_id,
            np.id,
            p.id,
            l.id,
            now() + (floor(random() * 30) || ' days')::interval + (floor(random() * 8) || ' hours')::interval,
            CASE WHEN random() < 0.3 THEN 60 ELSE 30 END,
            (ARRAY['scheduled', 'checked_in', 'in_progress', 'completed'])[floor(random() * 4 + 1)]::appointment_status,
            (ARRAY['Annual checkup', 'Follow-up', 'Consultation', 'Urgent care', 'Routine examination'])[floor(random() * 5 + 1)],
            (ARRAY['routine', 'urgent', 'follow_up', 'specialist', 'procedure'])[floor(random() * 5 + 1)],
            (ARRAY['in_person', 'video', 'phone'])[floor(random() * 3 + 1)]::appointment_visit_type
        FROM new_patient np
        CROSS JOIN additional_providers p
        CROSS JOIN new_locations l
        WHERE random() < 0.3
        RETURNING id, organization_id, patient_id, provider_id
    )
    -- Create note template
    , new_templates AS (
        INSERT INTO note_templates (
            name,
            content,
            specialty,
            category,
            organization_id,
            created_by
        )
        SELECT
            name,
            content,
            specialty,
            category,
            organization_id,
            v_user_id
        FROM new_appointments
        CROSS JOIN (
            VALUES
                ('General Examination Template', 'Chief Complaint:\n\nHistory of Present Illness:\n\nReview of Systems:\n\nPhysical Examination:\n\nAssessment:\n\nPlan:', 'General Medicine', 'examination'),
                ('Follow-up Visit Template', 'Progress Notes:\n\nCurrent Symptoms:\n\nMedication Review:\n\nPlan:', 'General Medicine', 'follow_up'),
                ('Specialist Consultation Template', 'Reason for Consultation:\n\nHistory:\n\nFindings:\n\nRecommendations:', 'Specialty Care', 'consultation'),
                ('Urgent Care Template', 'Chief Complaint:\n\nHistory:\n\nExamination:\n\nDiagnosis:\n\nTreatment Plan:', 'Urgent Care', 'urgent')
        ) AS t(name, content, specialty, category)
        GROUP BY name, content, specialty, category, organization_id
        RETURNING id, specialty
    )
    -- Create clinical notes for appointments
    , new_notes AS (
        INSERT INTO clinical_notes (
            patient_id,
            provider_id,
            appointment_id,
            organization_id,
            content,
            type,
            status,
            template_id,
            metadata,
            tags
        )
        SELECT
            na.patient_id,
            v_user_id,
            na.id,
            na.organization_id,
            '{"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Visit notes for appointment"}]}]}'::jsonb,
            CASE WHEN random() < 0.7 THEN 'template' ELSE 'manual' END,
            (ARRAY['draft', 'final', 'signed'])[floor(random() * 3 + 1)],
            nt.id,
            jsonb_build_object(
                'specialty', nt.specialty,
                'visit_type', 'routine'
            ),
            ARRAY['routine', 'follow_up']
        FROM new_appointments na
        CROSS JOIN new_templates nt
        WHERE random() < 0.8
        RETURNING id, patient_id, provider_id
    )
    -- Create note sections for each note
    , note_sections AS (
        INSERT INTO note_sections (note_id, section_type, title, content, order_index)
        SELECT
            new_notes.id,
            section_type,
            title,
            jsonb_build_object(
                'content',
                CASE section_type
                    WHEN 'subjective' THEN 'Patient presents with ' ||
                        (ARRAY['mild symptoms', 'moderate discomfort', 'significant concerns', 'follow-up needs'])[floor(random() * 4 + 1)]
                    WHEN 'objective' THEN 'Examination reveals ' ||
                        (ARRAY['normal findings', 'slight abnormalities', 'significant findings', 'improved condition'])[floor(random() * 4 + 1)]
                    WHEN 'assessment' THEN 'Assessment indicates ' ||
                        (ARRAY['good progress', 'stable condition', 'needs monitoring', 'requires follow-up'])[floor(random() * 4 + 1)]
                    WHEN 'plan' THEN 'Plan includes ' ||
                        (ARRAY['continued monitoring', 'medication adjustment', 'follow-up in 2 weeks', 'referral to specialist'])[floor(random() * 4 + 1)]
                END
            ),
            order_index
        FROM new_notes
        CROSS JOIN (
            SELECT 'subjective' as section_type, 'Subjective' as title, 0 as order_index
            UNION ALL
            SELECT 'objective', 'Objective', 1
            UNION ALL
            SELECT 'assessment', 'Assessment', 2
            UNION ALL
            SELECT 'plan', 'Plan', 3
        ) sections
    )
    -- Create some test comments
    INSERT INTO note_comments (
        note_id,
        user_id,
        content
    )
    SELECT
        nn.id,
        CASE WHEN random() < 0.7 THEN nn.provider_id ELSE v_user_id END,
        (ARRAY[
            'Follow-up required in 2 weeks',
            'Patient showing good progress',
            'Medication adjusted based on response',
            'Labs ordered for next visit',
            'Referral to specialist recommended',
            'Patient education provided',
            'Symptoms improving with current treatment'
        ])[floor(random() * 7 + 1)]
    FROM new_notes nn
    WHERE random() < 0.5;

END $$;
