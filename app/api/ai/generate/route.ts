import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { auth } from '@/lib/auth'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: Request) {
    try {
        // Check authentication
        const session = await auth()
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        // Parse request body
        const { prompt, patientData } = await req.json()

        // Construct system message with patient context
        let systemMessage = 'You are an AI medical assistant helping a healthcare provider with clinical documentation.'
        if (patientData) {
            systemMessage += `\nPatient Context:\n- Age: ${patientData.age || 'Unknown'}\n- Gender: ${patientData.gender || 'Unknown'}`
            if (patientData.medicalHistory?.length) {
                systemMessage += '\n- Medical History: ' + patientData.medicalHistory.map((h: any) => h.condition_name).join(', ')
            }
            if (patientData.medications?.length) {
                systemMessage += '\n- Current Medications: ' + patientData.medications.map((m: any) => m.medication_name).join(', ')
            }
        }

        // Generate AI response
        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 500
        })

        // Return the suggestion
        return NextResponse.json({
            suggestion: completion.choices[0].message.content
        })
    } catch (error) {
        console.error('Error in AI generation:', error)
        return new NextResponse(
            JSON.stringify({ error: 'Failed to generate AI suggestion' }),
            { status: 500 }
        )
    }
}
