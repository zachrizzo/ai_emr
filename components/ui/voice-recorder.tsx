'use client'

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Mic, MicOff } from 'lucide-react'

interface VoiceRecorderProps {
    isRecording: boolean
    onStartRecording: () => void
    onStopRecording: () => void
    onTranscriptionComplete: (transcript: string) => void
}

export function VoiceRecorder({
    isRecording,
    onStartRecording,
    onStopRecording,
    onTranscriptionComplete
}: VoiceRecorderProps) {
    const [transcript, setTranscript] = useState('')

    useEffect(() => {
        let recognition: SpeechRecognition | null = null

        if (isRecording) {
            recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
            recognition.continuous = true
            recognition.interimResults = true

            recognition.onresult = (event) => {
                const current = event.resultIndex
                const transcriptText = event.results[current][0].transcript
                setTranscript(transcriptText)
            }

            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error)
            }

            recognition.start()
        }

        return () => {
            if (recognition) {
                recognition.stop()
            }
        }
    }, [isRecording])

    const handleStopRecording = () => {
        onStopRecording()
        onTranscriptionComplete(transcript)
        setTranscript('')
    }

    return (
        <div className="flex flex-col items-center gap-4">
            <Button
                variant={isRecording ? "destructive" : "default"}
                size="lg"
                onClick={isRecording ? handleStopRecording : onStartRecording}
            >
                {isRecording ? (
                    <>
                        <MicOff className="mr-2 h-4 w-4" /> Stop Recording
                    </>
                ) : (
                    <>
                        <Mic className="mr-2 h-4 w-4" /> Start Recording
                    </>
                )}
            </Button>
            {isRecording && (
                <div className="text-sm text-muted-foreground">
                    Recording... {transcript}
                </div>
            )}
        </div>
    )
}
