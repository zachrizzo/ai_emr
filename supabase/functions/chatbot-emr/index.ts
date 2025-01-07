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
  limit: number = 5
) {
  const { data: similarRecords, error } = await supabaseClient.rpc(
    'match_records',
    {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: limit
    }
  )

  if (error) {
    console.error('Error performing vector search:', error)
    return []
  }

  return similarRecords
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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { message, conversationId, patientId, attachments } = await req.json()

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
    const messageEmbedding = await getEmbedding(openai, message)
    const relevantRecords = await performVectorSearch(supabaseClient, messageEmbedding)

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
                 3. ALWAYS structure your response with HTML tags for better readability
                 4. Example format:
                    <h3>Patient Information</h3>
                    <p>Patient: <a href="/patients/123">John Doe</a></p>
                    <p>Provider: <a href="/providers/456">Dr. Smith</a></p>

                 Please provide accurate and relevant information while maintaining HIPAA compliance.`
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})
