import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import OpenAI from 'https://esm.sh/openai@4.28.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { audioData } = await req.json()

    if (!audioData) {
      return new Response(
        JSON.stringify({ error: 'Audio data is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Convert base64 to blob
    const binaryStr = atob(audioData)
    const bytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i)
    }
    const audioBlob = new Blob([bytes], { type: 'audio/webm' })

    // Convert Blob to File for OpenAI
    const audioFile = new File([audioBlob], 'recording.webm', {
      type: audioBlob.type,
      lastModified: new Date().getTime(),
    })

    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: Deno.env.get('OPENAI_API_KEY')!,
    })

    // Transcribe audio
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      response_format: 'verbose_json',
    })

    // Generate summary using GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a medical transcriptionist. Create a structured medical note from the transcribed audio.
Format the response as a JSON object with the following sections:
{
  "subjective": "<p>Patient's situation from their perspective, including their reactions, emotions, understanding of their condition...</p>",
  "objective": "<p>Clinical observations, reported diagnoses, and medical facts mentioned by the provider...</p>",
  "assessment": "<p>Diagnoses, clinical impressions, and medical conclusions...</p>",
  "plan": "<p>Treatment plans, medications, follow-up instructions...</p>"
}

Important rules:
1. Extract ALL relevant information from the transcription
2. If something is mentioned, it MUST be included in the appropriate section
3. For the Subjective section:
   - Include how the patient is receiving the information
   - Include any emotional responses or concerns expressed
   - Include the patient's understanding of their condition
   - Include any reactions to treatment plans or diagnoses
   - Even if the patient doesn't speak, include their implied response (e.g., "Patient was informed of their lymphoma diagnosis")
4. For the Objective section:
   - Include any diagnoses or conditions mentioned as established facts
   - Include any clinical observations or statements made by the provider
   - Include any test results or findings mentioned
   - If the provider states a condition as fact (e.g., "you have lymphoma"), this is an objective finding
5. For conversations about diagnoses:
   - Put the diagnosis discussion in Assessment if it's new or being evaluated
   - Put established diagnoses in Objective
   - Put patient reactions or concerns in Subjective
   - Put treatment decisions and next steps in Plan
6. Never return "No information provided" if there is relevant information
7. Use proper HTML formatting:
   - <p> for paragraphs
   - <strong> for diagnoses and important points
   - <ul>/<li> for lists
8. If a section truly has no relevant information, use "<p>No relevant clinical findings in transcription.</p>"

Example of proper section usage:
{
  "subjective": "<p>Patient was informed of their lymphoma diagnosis. Patient's understanding and reaction to the diagnosis was noted during the conversation.</p>",
  "objective": "<p><strong>Established diagnosis:</strong> Patient has confirmed lymphoma.</p>",
  "assessment": "<p>Evaluating treatment options for lymphoma management.</p>",
  "plan": "<p><ul><li>Discussing chemotherapy as primary treatment option</li><li>Patient instructed to report any breathing difficulties</li></ul></p>"
}`
        },
        {
          role: 'user',
          content: transcription.text
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    })

    // Parse and validate the JSON response
    let summary
    try {
      summary = JSON.parse(completion.choices[0].message.content)
      // Ensure all required sections exist
      const requiredSections = ['subjective', 'objective', 'assessment', 'plan']
      for (const section of requiredSections) {
        if (!summary[section]) {
          summary[section] = '<p>No information provided.</p>'
        }
      }
    } catch (error) {
      console.error('Error parsing GPT response:', error)
      summary = {
        subjective: '<p>Error processing transcription.</p>',
        objective: '<p>Error processing transcription.</p>',
        assessment: '<p>Error processing transcription.</p>',
        plan: '<p>Error processing transcription.</p>'
      }
    }

    // Log the response for debugging
    console.log('Processed summary:', summary)

    return new Response(
      JSON.stringify({
        transcript: transcription.text,
        summary,
        metadata: {
          duration: transcription.duration,
          language: transcription.language
        }
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to process audio' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    )
  }
})
