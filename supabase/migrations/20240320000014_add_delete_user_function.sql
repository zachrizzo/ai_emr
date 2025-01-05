-- Create a function to delete a user completely
create or replace function delete_user_complete(p_email text)
returns void
language plpgsql
security definer
as $$
declare
    v_user_id uuid;
    v_clinical_note_ids uuid[];
begin
    -- Get the user ID from auth.users
    select id into v_user_id
    from auth.users
    where email = p_email;

    if v_user_id is not null then
        -- Get all clinical note IDs related to the user's templates
        select array_agg(id) into v_clinical_note_ids
        from public.clinical_notes
        where template_id in (
            select id from public.note_templates where created_by = v_user_id
        );

        -- Delete from all related tables in the correct order
        if v_clinical_note_ids is not null then
            delete from public.note_sections where note_id = any(v_clinical_note_ids);
            delete from public.note_comments where note_id = any(v_clinical_note_ids);
            delete from public.clinical_notes where id = any(v_clinical_note_ids);
        end if;

        delete from public.note_templates where created_by = v_user_id;
        delete from public.organization_members where user_id = v_user_id;
        delete from public.users where id = v_user_id;
        delete from auth.users where id = v_user_id;
    end if;
end;
$$;
