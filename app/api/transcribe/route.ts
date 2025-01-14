import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const audioFile = formData.get('audio') as File

        if (!audioFile) {
            return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
        }

        // Initialize OpenAI client
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        })

        // Convert audio to text
        const transcription = await openai.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-1',
            language: 'en',
            response_format: 'verbose_json',
        })

        // Generate a summary using GPT-4
        const completion = await openai.chat.completions.create({
            model: 'gpt-4-turbo-preview',
            messages: [
                {
                    role: 'system',
                    content: 'You are a medical transcriptionist. Create a concise, well-structured summary of the transcribed audio, focusing on key medical information and using proper medical terminology. Format the response in HTML.'
                },
                {
                    role: 'user',
                    content: transcription.text
                }
            ],
            temperature: 0.7,
            max_tokens: 500,
        })

        // Store in Supabase
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { data, error } = await supabase
            .from('voice_recordings')
            .insert({
                transcription: transcription.text,
                summary: completion.choices[0].message.content,
                duration: transcription.duration,
                language: transcription.language,
                status: 'completed'
            })
            .select()
            .single()

        if (error) {
            console.error('Supabase error:', error)
        }

        return NextResponse.json({
            transcript: transcription.text,
            summary: completion.choices[0].message.content,
            metadata: {
                duration: transcription.duration,
                language: transcription.language,
                recordingId: data?.id
            }
        })

    } catch (error) {
        console.error('Transcription error:', error)
        return NextResponse.json(
            { error: 'Failed to process audio' },
            { status: 500 }
        )
    }
}
