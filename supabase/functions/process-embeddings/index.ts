import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import OpenAI from "https://esm.sh/openai@4.20.1"
import { corsHeaders } from "../_shared/cors.ts"

// Function to get embeddings for a text
async function getEmbedding(openai: OpenAI, text: string) {
  console.log('Getting embedding for text:', text.substring(0, 100) + '...')
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  })
  console.log('Embedding generated, length:', response.data[0].embedding.length)
  return response.data[0].embedding
}

// Function to format record content for embedding
function formatRecordContent(record: any, recordType: string): string {
  console.log(`Formatting content for ${recordType} record:`, record.id)
  const content = (() => {
    switch (recordType) {
      case 'patient':
        return `Patient: ${record.first_name} ${record.last_name}, DOB: ${record.date_of_birth},
                Gender: ${record.gender}, Contact: ${record.phone_number}, ${record.email}`
      case 'appointment':
        const appointmentDate = new Date(record.appointment_date).toLocaleString()
        return `Appointment Details:
                Patient ID: ${record.patient_id}
                Date and Time: ${appointmentDate}
                Provider ID: ${record.provider_id}
                Type: ${record.appointment_type}
                Visit Type: ${record.visit_type || 'in_person'}
                Status: ${record.status}
                Reason: ${record.reason_for_visit || 'No reason provided'}
                Duration: ${record.duration_minutes} minutes
                Notes: ${record.notes || 'No notes'}
                Location ID: ${record.location_id || 'No location'}
                Created At: ${new Date(record.created_at).toLocaleString()}
                Last Updated: ${new Date(record.updated_at).toLocaleString()}`
      case 'medication':
        return `Medication: ${record.name}, Dosage: ${record.dosage},
                Instructions: ${record.instructions}, Status: ${record.status}`
      case 'note':
        return `Clinical Note:
                Patient ID: ${record.patient_id}
                Provider ID: ${record.provider_id}
                Date: ${new Date(record.created_at).toLocaleString()}
                Type: ${record.note_type}
                Content: ${record.content}
                Status: ${record.status}`
      default:
        return JSON.stringify(record)
    }
  })()
  console.log('Formatted content:', content)
  return content
}

// Function to get the correct table name
function getTableName(recordType: string): string {
  const tableMap: { [key: string]: string } = {
    'patient': 'patients',
    'provider': 'providers',
    'appointment': 'appointments',
    'medication': 'medications',
    'note': 'clinical_notes'
  }
  return tableMap[recordType] || recordType
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    })

    // Get and validate request payload
    const rawPayload = await req.json()
    console.log('Raw request payload:', rawPayload)

    // Extract data from either direct payload or database trigger payload
    let record_type, record_id, organization_id, trigger_id;

    if (rawPayload.type && rawPayload.table === 'embedding_refresh_queue') {
      // This is a database trigger payload
      console.log('Processing database trigger payload')
      record_type = rawPayload.record.record_type
      record_id = rawPayload.record.record_id
      organization_id = rawPayload.record.organization_id
      trigger_id = rawPayload.record.id
    } else {
      // This is a direct API call payload
      console.log('Processing direct API call payload')
      record_type = rawPayload.record_type
      record_id = rawPayload.record_id
      organization_id = rawPayload.organization_id
      trigger_id = rawPayload.trigger_id
    }

    console.log('Extracted payload:', {
      record_type,
      record_id,
      organization_id,
      trigger_id
    })

    if (!record_type || !record_id || !organization_id) {
      console.error('Invalid payload:', { record_type, record_id, organization_id })
      throw new Error('Missing required fields: record_type, record_id, and organization_id are required')
    }

    // If we have a specific record to process, handle it directly
    if (record_type && record_id && organization_id) {
      console.log(`Processing single record: ${record_type} ${record_id}`)

      const tableName = getTableName(record_type)
      console.log(`Using table name: ${tableName}`)

      // Fetch the record
      const { data: record, error: recordError } = await supabaseClient
        .from(tableName)
        .select('*')
        .eq('id', record_id)
        .single()

      if (recordError || !record) {
        console.error('Failed to fetch record:', recordError)
        throw new Error(`Failed to fetch record: ${recordError?.message}`)
      }
      console.log('Successfully fetched record:', record.id)

      // Format and create embedding
      const content = formatRecordContent(record, record_type)
      const embedding = await getEmbedding(openai, content)

      console.log('Attempting to store embedding...', {
        record_type,
        record_id,
        organization_id,
        content_length: content.length,
        embedding_length: embedding.length
      })

      // Use upsert instead of update/insert
      const { data: upsertData, error: upsertError } = await supabaseClient
        .from('record_embeddings')
        .upsert({
          record_type,
          record_id,
          content,
          embedding,
          organization_id
        }, {
          onConflict: 'record_type,record_id'
        })
        .select()

      if (upsertError) {
        console.error('Failed to upsert embedding:', {
          error: upsertError,
          errorMessage: upsertError.message,
          errorDetails: upsertError.details,
          errorHint: upsertError.hint,
          data: {
            record_type,
            record_id,
            organization_id,
            content_length: content.length,
            embedding_length: embedding.length
          }
        })
        throw new Error(`Failed to store embedding: ${upsertError.message}`)
      }

      console.log('Successfully upserted embedding:', {
        record_id,
        embedding_length: embedding.length
      })

      // Double check the record exists
      const { data: checkData, error: checkError } = await supabaseClient
        .from('record_embeddings')
        .select('*')
        .eq('record_type', record_type)
        .eq('record_id', record_id)
        .single()

      if (checkError || !checkData) {
        console.error('Failed to verify embedding exists after upsert:', {
          error: checkError,
          exists: !!checkData
        })
      } else {
        console.log('Verified embedding exists:', {
          id: checkData.id,
          record_type: checkData.record_type,
          record_id: checkData.record_id,
          content_length: checkData.content.length,
          embedding_length: checkData.embedding.length
        })
      }

      // Mark queue item as processed if we have a trigger_id
      if (trigger_id) {
        console.log('Marking queue item as processed:', trigger_id)
        const { error: queueUpdateError } = await supabaseClient
          .from('embedding_refresh_queue')
          .update({ processed: true })
          .eq('id', trigger_id)

        if (queueUpdateError) {
          console.error(`Failed to mark queue item ${trigger_id} as processed:`, queueUpdateError)
        } else {
          console.log('Successfully marked queue item as processed:', trigger_id)
        }
      }

      return new Response(
        JSON.stringify({
          message: "Successfully processed record",
          record_type,
          record_id
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Otherwise, process the queue in batches
    let totalProcessed = 0
    let hasMoreItems = true
    const BATCH_SIZE = 10

    while (hasMoreItems) {
      // Get next batch of unprocessed items
      const { data: queueItems, error: queueError } = await supabaseClient
        .from('embedding_refresh_queue')
        .select('*')
        .eq('processed', false)
        .limit(BATCH_SIZE)

      if (queueError) {
        throw new Error(`Failed to fetch queue items: ${queueError.message}`)
      }

      if (!queueItems || queueItems.length === 0) {
        hasMoreItems = false
        break
      }

      console.log(`Processing batch of ${queueItems.length} items`)

      // Process each queue item in the current batch
      for (const item of queueItems) {
        try {
          console.log(`Processing item ${item.id} for record type ${item.record_type}`)

          const tableName = getTableName(item.record_type)
          console.log(`Using table name: ${tableName}`)

          const { data: record, error: recordError } = await supabaseClient
            .from(tableName)
            .select('*')
            .eq('id', item.record_id)
            .single()

          if (recordError || !record) {
            console.error(`Failed to fetch record: ${recordError?.message}`)
            await supabaseClient
              .from('embedding_refresh_queue')
              .update({ processed: true })
              .eq('id', item.id)
            continue
          }

          const content = formatRecordContent(record, item.record_type)
          const embedding = await getEmbedding(openai, content)

          // First try to update existing embedding
          const { error: updateError } = await supabaseClient
            .from('record_embeddings')
            .update({
              content,
              embedding,
              organization_id: item.organization_id
            })
            .match({
              record_type: item.record_type,
              record_id: item.record_id
            })

          // If no rows were updated, insert new embedding
          if (updateError) {
            const { error: insertError } = await supabaseClient
              .from('record_embeddings')
              .insert({
                record_type: item.record_type,
                record_id: item.record_id,
                content,
                embedding,
                organization_id: item.organization_id
              })

            if (insertError) {
              throw new Error(`Failed to store embedding: ${insertError.message}`)
            }
          }

          const { error: queueUpdateError } = await supabaseClient
            .from('embedding_refresh_queue')
            .update({ processed: true })
            .eq('id', item.id)

          if (queueUpdateError) {
            console.error(`Failed to mark item ${item.id} as processed:`, queueUpdateError)
          } else {
            console.log(`Successfully processed item ${item.id}`)
            totalProcessed++
          }

        } catch (error) {
          console.error(`Error processing queue item ${item.id}:`, error)
          await supabaseClient
            .from('embedding_refresh_queue')
            .update({ processed: true })
            .eq('id', item.id)
        }
      }

      // Add a small delay between batches to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    return new Response(
      JSON.stringify({
        message: `Completed processing queue`,
        totalProcessed,
        hasMoreItems: false
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    console.error("Edge function error:", error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal Server Error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
