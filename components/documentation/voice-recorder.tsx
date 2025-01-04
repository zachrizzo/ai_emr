'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Mic, Square, Loader2 } from 'lucide-react'
import { toast } from "@/components/ui/use-toast"

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
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
    const [audioChunks, setAudioChunks] = useState<Blob[]>([])
    const [duration, setDuration] = useState(0)
    const [isProcessing, setIsProcessing] = useState(false)
    const timerRef = useRef<NodeJS.Timeout>()

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }, [])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const recorder = new MediaRecorder(stream)

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    setAudioChunks((chunks) => [...chunks, event.data])
                }
            }

            recorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
                await processAudioToText(audioBlob)

                // Stop all tracks to release the microphone
                stream.getTracks().forEach(track => track.stop())
            }

            setMediaRecorder(recorder)
            recorder.start()
            onStartRecording()

            // Start duration timer
            setDuration(0)
            timerRef.current = setInterval(() => {
                setDuration(d => d + 1)
            }, 1000)

        } catch (error) {
            console.error('Error accessing microphone:', error)
            toast({
                title: 'Error',
                description: 'Failed to access microphone. Please check your permissions.',
                variant: 'destructive',
            })
        }
    }

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop()
            onStopRecording()

            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
        }
    }

    const processAudioToText = async (audioBlob: Blob) => {
        setIsProcessing(true)
        try {
            // Create a FormData object to send the audio file
            const formData = new FormData()
            formData.append('audio', audioBlob)

            // Send to your transcription service endpoint
            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) throw new Error('Transcription failed')

            const data = await response.json()
            onTranscriptionComplete(data.transcript)

        } catch (error) {
            console.error('Error transcribing audio:', error)
            toast({
                title: 'Error',
                description: 'Failed to transcribe audio. Please try again.',
                variant: 'destructive',
            })
        } finally {
            setIsProcessing(false)
            setAudioChunks([])
        }
    }

    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col items-center gap-4">
                {isRecording ? (
                    <Button
                        variant="destructive"
                        size="lg"
                        className="w-full"
                        onClick={stopRecording}
                    >
                        <Square className="h-4 w-4 mr-2" />
                        Stop Recording
                    </Button>
                ) : (
                    <Button
                        variant="default"
                        size="lg"
                        className="w-full"
                        onClick={startRecording}
                        disabled={isProcessing}
                    >
                        <Mic className="h-4 w-4 mr-2" />
                        Start Recording
                    </Button>
                )}

                {isRecording && (
                    <div className="w-full space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>Recording...</span>
                            <span>{formatDuration(duration)}</span>
                        </div>
                        <Progress value={duration % 60 * (100 / 60)} />
                    </div>
                )}

                {isProcessing && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Transcribing audio...
                    </div>
                )}
            </div>

            <div className="text-sm text-muted-foreground">
                <p>Tips:</p>
                <ul className="list-disc list-inside space-y-1">
                    <li>Speak clearly and at a normal pace</li>
                    <li>Minimize background noise</li>
                    <li>Keep the microphone at a consistent distance</li>
                </ul>
            </div>
        </div>
    )
}
