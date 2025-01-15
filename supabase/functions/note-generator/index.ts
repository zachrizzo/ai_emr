/// <reference types="@supabase/supabase-js" />
/// <reference lib="deno.ns" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import OpenAI from "https://esm.sh/openai@4.20.1"
import { corsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  const origin = req.headers.get('origin')

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) })
  }

  try {
    // Verify authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    // Create Supabase client to verify the token
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    )

    // Verify the JWT
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Invalid Authorization token')
    }

    const { message, patientContext, currentSection, organizationId, patientId } = await req.json()

    if (!organizationId) {
      throw new Error('Organization ID is required')
    }

    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    })

    // Get patient's previous notes if patientId is provided
    let patientHistory = ""
    if (patientId) {
      const { data: previousNotes, error: notesError } = await supabaseClient
        .from('session_notes')
        .select('content, created_at')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!notesError && previousNotes?.length > 0) {
        patientHistory = `Previous visit notes:\n${previousNotes
          .map(note => `${note.created_at}: ${JSON.stringify(note.content)}`)
          .join('\n')}`
      }
    }

    // Prepare system message with context
    const systemMessage = {
      role: "system",
      content: `You are a medical scribe assistant helping to write detailed medical notes.
                You are currently focusing on the ${currentSection} section of the SOAP note.
                ${patientContext ? `Current Visit Context: ${JSON.stringify(patientContext)}` : ''}
                ${patientHistory}

                Instructions:
                1. Write in a professional medical style
                2. Be detailed but concise
                3. Use proper medical terminology
                4. Focus specifically on the ${currentSection} section
                5. Format the response in a way that fits naturally into a medical note
                6. Do not include any patient identifying information
                7. Maintain HIPAA compliance
                8. If there are previous notes, use them for context but focus on the current visit`
    }

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        systemMessage,
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const content = completion.choices[0].message.content

    if (!content) {
      throw new Error('No response generated')
    }

    return new Response(
      JSON.stringify({ response: content }),
      {
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      }
    )
  } catch (error) {
    console.error("Edge function error:", error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal Server Error",
        details: error instanceof Error ? error.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
      }
    )
  }
})
