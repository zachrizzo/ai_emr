import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import OpenAI from "https://esm.sh/openai@4.20.1"
import { corsHeaders } from "../_shared/cors.ts"

// Function to get embeddings for a text
async function getEmbedding(openai: OpenAI, text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  })
  return response.data[0].embedding
}

// Function to format record content for embedding
function formatRecordContent(record: any, recordType: string): string {
  switch (recordType) {
    case 'patient':
      return `Patient: ${record.first_name} ${record.last_name}, DOB: ${record.date_of_birth},
              Gender: ${record.gender}, Contact: ${record.phone_number}, ${record.email}`
    case 'appointment':
      return `Appointment on ${record.appointment_date} for ${record.reason_for_visit}.
              Status: ${record.status}, Type: ${record.appointment_type},
              Notes: ${record.notes || 'No notes'}`
    case 'medication':
      return `Medication: ${record.name}, Dosage: ${record.dosage},
              Instructions: ${record.instructions}, Status: ${record.status}`
    default:
      return JSON.stringify(record)
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    })

    // Get unprocessed items from the queue
    const { data: queueItems, error: queueError } = await supabaseClient
      .from('embedding_refresh_queue')
      .select('*')
      .eq('processed', false)
      .limit(10)

    if (queueError) {
      throw new Error(`Failed to fetch queue items: ${queueError.message}`)
    }

    if (!queueItems || queueItems.length === 0) {
      return new Response(
        JSON.stringify({ message: "No items to process" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // Process each queue item
    for (const item of queueItems) {
      try {
        // Fetch the record data
        const { data: record, error: recordError } = await supabaseClient
          .from(item.record_type + 's') // Add 's' for table name
          .select('*')
          .eq('id', item.record_id)
          .single()

        if (recordError || !record) {
          console.error(`Failed to fetch record: ${recordError?.message}`)
          continue
        }

        // Format the record content
        const content = formatRecordContent(record, item.record_type)

        // Generate embedding
        const embedding = await getEmbedding(openai, content)

        // Store the embedding
        const { error: embeddingError } = await supabaseClient
          .from('record_embeddings')
          .upsert({
            record_type: item.record_type,
            record_id: item.record_id,
            content,
            embedding,
            organization_id: item.organization_id
          })

        if (embeddingError) {
          throw new Error(`Failed to store embedding: ${embeddingError.message}`)
        }

        // Mark queue item as processed
        await supabaseClient
          .from('embedding_refresh_queue')
          .update({ processed: true })
          .eq('id', item.id)

      } catch (error) {
        console.error(`Error processing queue item ${item.id}:`, error)
      }
    }

    return new Response(
      JSON.stringify({ message: `Processed ${queueItems.length} items` }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error: unknown) {
    console.error("Edge function error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error"
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
