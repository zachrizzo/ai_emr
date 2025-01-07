/// <reference types="@supabase/supabase-js" />
/// <reference lib="deno.ns" />

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
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
        const response = await fetch(url)

        if (!response.ok) {
            console.error('Failed to fetch image:', {
                url,
                status: response.status,
                statusText: response.statusText
            })
            throw new Error(`Failed to fetch image: ${response.statusText}`)
        }

        const contentType = response.headers.get('content-type')
        if (!contentType?.startsWith('image/')) {
            console.error('Invalid content type:', { url, contentType })
            throw new Error(`Invalid content type: ${contentType}`)
        }

        const blob = await response.blob()
        const buffer = await blob.arrayBuffer()
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
        const mimeType = contentType || 'image/jpeg'
        const base64Url = `data:${mimeType};base64,${base64}`

        console.log('Successfully converted image to base64:', {
            url,
            mimeType,
            size: buffer.byteLength
        })

        return base64Url
    } catch (error) {
        console.error('Error converting image to base64:', error)
        throw error
    }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const { message, conversationId, patientId, attachments } = await req.json()

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // Initialize OpenAI
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

    // Get patient context if patientId is provided
    let patientContext = ""
    if (patientId) {
      const { data: patient, error: patientError } = await supabaseClient
        .from("patients")
        .select("*")
        .eq("id", patientId)
        .single()

      if (!patientError && patient) {
        patientContext = `Current patient context: ${JSON.stringify(patient)}.`
      }
    }

    // Perform vector search using the user's message
    const messageEmbedding = await getEmbedding(openai, message)
    const relevantRecords = await performVectorSearch(supabaseClient, messageEmbedding)

    // Format relevant records as context
    const relevantContext = relevantRecords.length > 0
      ? `Here is some relevant information from the medical records: ${JSON.stringify(relevantRecords)}`
      : ""

    // Prepare messages for OpenAI
    const chatMessages = [
      {
        role: "system",
        content: `You are a medical assistant AI helping with an Electronic Medical Records system.
                 ${patientContext}
                 ${relevantContext}
                 Please provide accurate and relevant information while maintaining HIPAA compliance.
                 When referencing information from the medical records, be specific about the source and date of the information.
                 When analyzing images, provide detailed observations and any relevant medical insights.`
      }
    ]

    // Add previous messages
    for (const msg of messages || []) {
      chatMessages.push({
        role: msg.role,
        content: msg.content
      })
    }

    // Prepare the user's message with any attachments
    let userMessageContent: any[] = []

    // Add any image attachments first
    if (attachments && attachments.length > 0) {
        console.log('Processing attachments:', attachments)
        for (const attachment of attachments) {
            if (attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
                try {
                    console.log('Converting image to base64:', attachment)
                    const base64Image = await imageUrlToBase64(attachment)
                    userMessageContent.push({
                        type: "image_url",
                        image_url: {
                            url: base64Image
                        }
                    })
                    console.log('Successfully added image to message content')
                } catch (error) {
                    console.error(`Error processing image ${attachment}:`, error)
                }
            }
        }
    }

    // Add the text message
    userMessageContent.push({
        type: "text",
        text: message || "What is this?"
    })

    // Create the message in the exact format from the example
    const userMessage = {
        role: "user",
        content: userMessageContent
    }

    chatMessages.push(userMessage)

    console.log('Sending to OpenAI:', JSON.stringify(chatMessages, null, 2))

    // Get AI response using new OpenAI API syntax
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatMessages,
      temperature: 1,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      response_format: { type: "text" }
    })

    const aiResponse = completion.choices[0].message.content || "Sorry, I could not process your request."

    // Save both messages to the database
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

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/chatbot-emr' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
