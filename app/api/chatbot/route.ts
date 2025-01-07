import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get the request body
    const { message, conversationId, patientId } = await request.json()

    // Get conversation history
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      throw messagesError
    }

    // Get patient context if patientId is provided
    let patientContext = ''
    if (patientId) {
      const { data: patient, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single()

      if (!patientError && patient) {
        patientContext = `Current patient context: ${JSON.stringify(patient)}.`
      }
    }

    // Prepare messages for OpenAI
    const chatMessages = [
      {
        role: 'system',
        content: `You are a medical assistant AI helping with an Electronic Medical Records system. ${patientContext} Please provide accurate and relevant information while maintaining HIPAA compliance.`
      },
      ...(messages || []).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: chatMessages as any[],
      temperature: 0.7,
      max_tokens: 500
    })

    const aiResponse = completion.choices[0].message.content

    return NextResponse.json({ response: aiResponse })
  } catch (error) {
    console.error('Chatbot API error:', error)
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    )
  }
}
