/// <reference types="@supabase/supabase-js" />
/// <reference lib="deno.ns" />

import "jsr:@supabase/functions-js/edge-runtime.d.ts"
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

// Function to perform vector search
async function performVectorSearch(
  supabaseClient: any,
  embedding: number[],
  organizationId: string,
  limit: number = 5
) {
  console.log('Starting vector search with params:', {
    limit,
    organizationId,
    embeddingLength: embedding.length
  })

  try {
    const { data: similarRecords, error } = await supabaseClient.rpc(
      'match_records',
      {
        match_count: limit,
        match_threshold: 0.5,
        organization_filter: organizationId,
        query_embedding: embedding
      }
    )

    if (error) {
      console.error('Vector search error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })
      return []
    }

    console.log('Vector search results:', {
      recordCount: similarRecords?.length || 0,
      firstRecord: similarRecords?.[0] ? {
        type: similarRecords[0].record_type,
        similarity: similarRecords[0].similarity
      } : null
    })

    return similarRecords || []
  } catch (error) {
    console.error('Unexpected error in vector search:', error)
    return []
  }
}

// Function to convert image URL to base64
async function imageUrlToBase64(url: string): Promise<string> {
    try {
        console.log('Fetching image from URL:', url)
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
        if (url.startsWith('http://127.0.0.1:54321')) {
            url = url.replace('http://127.0.0.1:54321', supabaseUrl)
        }

        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`Failed to fetch image: ${response.statusText}`)
        }

        const contentType = response.headers.get('content-type')
        if (!contentType?.startsWith('image/')) {
            throw new Error(`Invalid content type: ${contentType}`)
        }

        const blob = await response.blob()
        const buffer = await blob.arrayBuffer()
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
        return `data:${contentType};base64,${base64}`
    } catch (error) {
        console.error('Error converting image to base64:', error)
        throw error
    }
}

serve(async (req) => {
  // Get the request origin
  const origin = req.headers.get('origin')

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) })
  }

  try {
    const { message, conversationId, patientId, organizationId, attachments } = await req.json()

    console.log('Request details:', {
      messageLength: message?.length,
      conversationId,
      patientId,
      organizationId,
      hasAttachments: !!attachments?.length
    })

    if (!organizationId) {
      throw new Error('Organization ID is required for vector search')
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    })

    // Get conversation history
    const { data: messages, error: messagesError } = await supabaseClient
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })

    if (messagesError) {
      throw new Error(`Failed to fetch messages: ${messagesError.message}`)
    }

    // Get patient context
    let patientContext = ""
    if (patientId) {
      const { data: patient, error: patientError } = await supabaseClient
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single()

      if (!patientError && patient) {
        patientContext = `Current patient context: The patient being discussed has ID ${patient.id}. Patient details: ${JSON.stringify(patient)}.`
      }
    }

    // Perform vector search
    console.log('Getting embedding for message:', message.substring(0, 100) + '...')
    const messageEmbedding = await getEmbedding(openai, message)
    console.log('Embedding generated, length:', messageEmbedding.length)

    const relevantRecords = await performVectorSearch(supabaseClient, messageEmbedding, organizationId)
    console.log('Relevant records found:', relevantRecords.length)

    // Get all mentioned patients from the search results
    const { data: mentionedPatients, error: patientsError } = await supabaseClient
      .from("patients")
      .select("id, first_name, last_name")
      .order("created_at", { ascending: true })

    const patientLinks = mentionedPatients
      ? `Available patients: ${mentionedPatients.map(p =>
          `<a href="/patients/${p.id}">${p.first_name} ${p.last_name}</a>`
        ).join(', ')}.`
      : ""

    const relevantContext = relevantRecords.length > 0
      ? `Here is some relevant information from the medical records: ${JSON.stringify(relevantRecords)}`
      : ""

    // Prepare system message
    const systemMessage = {
        role: "system",
        content: `You are a medical assistant AI helping with an Electronic Medical Records system.
                 ${patientContext}
                 ${patientLinks}
                 ${relevantContext}

                 IMPORTANT FORMATTING INSTRUCTIONS:
                 1. ALWAYS wrap patient names in HTML links using: <a href="/patients/[patient_id]">[Patient Name]</a>
                 2. ALWAYS wrap provider names in HTML links using: <a href="/providers/[provider_id]">[Provider Name]</a>
                 3. When discussing appointments:
                    - Format dates in a clear, readable format
                    - Include time with the timezone if available
                    - Clearly state the appointment status
                    - Link to both the patient and provider involved
                 4. ALWAYS structure your response with HTML tags for better readability
                 5. Example format:
                    <h3>Appointment Information</h3>
                    <p>Patient: <a href="/patients/123">John Doe</a></p>
                    <p>Provider: <a href="/providers/456">Dr. Smith</a></p>
                    <p>Date: March 28, 2024 at 2:30 PM</p>
                    <p>Status: Scheduled</p>

                 Please provide accurate and relevant information while maintaining HIPAA compliance.
                 When discussing appointments, always include relevant context such as the reason for visit,
                 appointment type, and any notes if available.`
    }

    // Format conversation history
    const conversationHistory = messages?.map(msg => ({
        role: msg.role,
        content: msg.content
    })) || []

    // Prepare user message with attachments
    let userMessageContent = []

    // Process image attachments
    if (attachments?.length > 0) {
        for (const attachment of attachments) {
            if (attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                try {
                    const base64Image = await imageUrlToBase64(attachment)
                    userMessageContent.push({
                        type: "image_url",
                        image_url: {
                            url: base64Image,
                            detail: "auto"  // Can be "low", "high", or "auto"
                        }
                    })
                } catch (error) {
                    console.error(`Error processing image ${attachment}:`, error)
                }
            }
        }
    }

    // Add text message
    userMessageContent.push({
        type: "text",
        text: message || "What is this?"
    })

    // Combine all messages
    const chatMessages = [
        systemMessage,
        ...conversationHistory,
        {
            role: "user",
            content: userMessageContent
        }
    ]

    // Get AI response
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",  // Updated to correct model name
        messages: chatMessages,
        max_tokens: 4096,
        temperature: 0.7,
    })

    const aiResponse = completion.choices[0].message.content || "Sorry, I could not process your request."

    // Save messages to database
    const { error: insertError } = await supabaseClient
      .from("messages")
      .insert([
        {
          conversation_id: conversationId,
          role: "user",
          content: message,
          attachments,
          created_at: new Date().toISOString()
        },
        {
          conversation_id: conversationId,
          role: "assistant",
          content: aiResponse,
          created_at: new Date().toISOString()
        }
      ])

    if (insertError) {
      throw new Error(`Failed to save messages: ${insertError.message}`)
    }

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("Edge function error:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal Server Error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      }
    )
  }
})
