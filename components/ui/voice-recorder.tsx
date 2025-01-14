'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/components/ui/use-toast'
import { Mic, Square, Pause, Play, Loader2 } from 'lucide-react'
import { Card } from './card'
import { cn } from '@/lib/utils'

interface VoiceRecorderProps {
    onTranscriptionComplete: (sections: {
        subjective?: string;
        objective?: string;
        assessment?: string;
        plan?: string;
    }) => void;
    isRecording: boolean;
    onToggleRecording: () => void;
}

export function VoiceRecorder({
    onTranscriptionComplete,
    isRecording,
    onToggleRecording,
}: VoiceRecorderProps) {
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
    const [audioChunks, setAudioChunks] = useState<Blob[]>([])
    const [duration, setDuration] = useState(0)
    const [isProcessing, setIsProcessing] = useState(false)
    const [processingStage, setProcessingStage] = useState<'recording' | 'transcribing' | 'analyzing' | 'summarizing' | null>(null)
    const [audioLevel, setAudioLevel] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const [transcriptionResult, setTranscriptionResult] = useState<{
        transcript: string
        summary: {
            subjective: string
            objective: string
            assessment: string
            plan: string
        }
    } | null>(null)
    const [showResults, setShowResults] = useState(false)
    const [showStopTransition, setShowStopTransition] = useState(false)

    const streamRef = useRef<MediaStream | null>(null)
    const animationFrameRef = useRef<number>()
    const startTimeRef = useRef<number>(0)
    const audioContextRef = useRef<AudioContext | null>(null)
    const analyserRef = useRef<AnalyserNode | null>(null)
    const durationIntervalRef = useRef<NodeJS.Timeout>()
    const audioLevelIntervalRef = useRef<NodeJS.Timeout>()

    const cleanup = () => {
        // Clear intervals
        if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current)
            durationIntervalRef.current = undefined
        }
        if (audioLevelIntervalRef.current) {
            clearInterval(audioLevelIntervalRef.current)
            audioLevelIntervalRef.current = undefined
        }

        // Stop animation frame
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = undefined
        }

        // Close audio context
        if (audioContextRef.current?.state !== 'closed') {
            try {
                audioContextRef.current?.close()
            } catch (error) {
                console.error('Error closing audio context:', error)
            }
        }
        audioContextRef.current = null
        analyserRef.current = null

        // Stop media tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }

        // Reset states
        setMediaRecorder(null)
        setAudioChunks([])
        setDuration(0)
        setAudioLevel(0)
        setIsPaused(false)
        startTimeRef.current = 0
    }

    useEffect(() => {
        return cleanup
    }, [])

    const updateAudioLevel = () => {
        if (!analyserRef.current || !audioContextRef.current || isPaused) return

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
        analyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        setAudioLevel(average)
    }

    const handleStopRecording = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            try {
                setShowStopTransition(true)
                setIsProcessing(true)
                mediaRecorder.stop()
            } catch (error) {
                console.error('Error stopping recording:', error)
                cleanup()
                setShowStopTransition(false)
                setIsProcessing(false)
                if (typeof onToggleRecording === 'function') {
                    onToggleRecording()
                }
            }
        }
    }

    useEffect(() => {
        if (isRecording) {
            handleStartRecording()
        } else {
            // Only stop recording if we have an active recorder
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                handleStopRecording()
            }
        }
    }, [isRecording])

    const handleRecordingComplete = async (audioBlob: Blob) => {
        try {
            setProcessingStage('transcribing')
            const reader = new FileReader()
            reader.readAsDataURL(audioBlob)
            reader.onloadend = async () => {
                try {
                    const base64Audio = reader.result as string
                    const base64Data = base64Audio.split(',')[1]

                    setProcessingStage('analyzing')
                    const response = await fetch('https://lrcjwwqslypchbxlkduw.supabase.co/functions/v1/transcribe-audio', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ audioData: base64Data }),
                    })

                    if (!response.ok) {
                        const errorData = await response.text()
                        throw new Error(`Failed to process audio: ${errorData}`)
                    }

                    setProcessingStage('summarizing')
                    const result = await response.json()
                    console.log('Transcription result:', result)
                    setTranscriptionResult(result)
                    setShowResults(true)
                    setProcessingStage(null)
                } catch (error) {
                    console.error('Error in reader.onloadend:', error)
                    toast({
                        title: 'Error',
                        description: error instanceof Error ? error.message : 'Failed to process audio recording',
                        variant: 'destructive',
                    })
                } finally {
                    setProcessingStage(null)
                }
            }
        } catch (error) {
            console.error('Error processing audio:', error)
            toast({
                title: 'Error',
                description: 'Failed to process audio recording',
                variant: 'destructive',
            })
            onToggleRecording()
            setProcessingStage(null)
        }
    }

    const handleStartRecording = async () => {
        try {
            cleanup()
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream

            // Set up audio analysis
            audioContextRef.current = new AudioContext()
            analyserRef.current = audioContextRef.current.createAnalyser()
            const source = audioContextRef.current.createMediaStreamSource(stream)
            source.connect(analyserRef.current)
            analyserRef.current.fftSize = 256

            // Start audio level updates
            audioLevelIntervalRef.current = setInterval(updateAudioLevel, 100)

            const recorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            })

            let chunks: Blob[] = []
            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data)
                }
            }

            recorder.onstop = async () => {
                try {
                    // Wait a bit to ensure all chunks are collected
                    await new Promise(resolve => setTimeout(resolve, 100))

                    if (chunks.length === 0) {
                        throw new Error('No audio data recorded')
                    }

                    const audioBlob = new Blob(chunks, { type: 'audio/webm;codecs=opus' })
                    if (audioBlob.size === 0) {
                        throw new Error('No audio data recorded')
                    }

                    await handleRecordingComplete(audioBlob)
                } catch (error) {
                    console.error('Error processing recording:', error)
                    toast({
                        title: 'Error',
                        description: error instanceof Error ? error.message : 'Failed to process audio recording',
                        variant: 'destructive',
                    })
                    setShowStopTransition(false)
                    setIsProcessing(false)
                    cleanup()
                }
            }

            setMediaRecorder(recorder)
            recorder.start(1000)
            startTimeRef.current = Date.now()

            // Use interval for duration update
            durationIntervalRef.current = setInterval(() => {
                if (!isPaused) {
                    setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
                }
            }, 1000)

        } catch (error) {
            console.error('Error starting recording:', error)
            toast({
                title: 'Error',
                description: 'Failed to start recording. Please check your microphone permissions.',
                variant: 'destructive',
            })
            cleanup()
            if (typeof onToggleRecording === 'function') {
                onToggleRecording()
            }
        }
    }

    const handlePauseResume = () => {
        if (!mediaRecorder) return
        try {
            if (mediaRecorder.state === 'recording') {
                mediaRecorder.pause()
                setIsPaused(true)
                // Pause duration updates
                if (durationIntervalRef.current) {
                    clearInterval(durationIntervalRef.current)
                }
                // Pause audio level updates
                if (audioLevelIntervalRef.current) {
                    clearInterval(audioLevelIntervalRef.current)
                }
            } else if (mediaRecorder.state === 'paused') {
                mediaRecorder.resume()
                setIsPaused(false)
                // Resume duration updates
                durationIntervalRef.current = setInterval(() => {
                    setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
                }, 1000)
                // Resume audio level updates
                audioLevelIntervalRef.current = setInterval(updateAudioLevel, 100)
            }
        } catch (error) {
            console.error('Error toggling pause state:', error)
            cleanup()
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (showResults && transcriptionResult) {
        return (
            <Card className="p-6 space-y-6">
                <div className="flex justify-between items-center border-b pb-4">
                    <div>
                        <h3 className="text-lg font-semibold">Recording Results</h3>
                        <p className="text-sm text-muted-foreground">Review and apply the transcribed note sections</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setShowResults(false)
                                setTranscriptionResult(null)
                                onToggleRecording()
                            }}
                        >
                            Record New
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setShowResults(false)
                                setTranscriptionResult(null)
                            }}
                        >
                            Discard
                        </Button>
                    </div>
                </div>
                <div className="grid gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm">Raw Transcription</h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    onTranscriptionComplete({ subjective: transcriptionResult.transcript })
                                    setShowResults(false)
                                    setTranscriptionResult(null)
                                }}
                            >
                                Use as Subjective Only
                            </Button>
                        </div>
                        <div className="bg-muted/50 p-4 rounded-lg text-sm leading-relaxed max-h-48 overflow-y-auto">
                            {transcriptionResult.transcript}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-medium text-sm border-b pb-2">Structured Medical Note</h4>
                        <div className="grid gap-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-sm font-medium text-muted-foreground">Subjective</h5>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            onTranscriptionComplete({ subjective: transcriptionResult.summary.subjective })
                                            setShowResults(false)
                                            setTranscriptionResult(null)
                                        }}
                                    >
                                        Apply to Subjective
                                    </Button>
                                </div>
                                <div
                                    className="bg-muted/50 p-4 rounded-lg text-sm leading-relaxed max-h-32 overflow-y-auto"
                                    dangerouslySetInnerHTML={{ __html: transcriptionResult.summary.subjective }}
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-sm font-medium text-muted-foreground">Objective</h5>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            onTranscriptionComplete({ objective: transcriptionResult.summary.objective })
                                            setShowResults(false)
                                            setTranscriptionResult(null)
                                        }}
                                    >
                                        Apply to Objective
                                    </Button>
                                </div>
                                <div
                                    className="bg-muted/50 p-4 rounded-lg text-sm leading-relaxed max-h-32 overflow-y-auto"
                                    dangerouslySetInnerHTML={{ __html: transcriptionResult.summary.objective }}
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-sm font-medium text-muted-foreground">Assessment</h5>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            onTranscriptionComplete({ assessment: transcriptionResult.summary.assessment })
                                            setShowResults(false)
                                            setTranscriptionResult(null)
                                        }}
                                    >
                                        Apply to Assessment
                                    </Button>
                                </div>
                                <div
                                    className="bg-muted/50 p-4 rounded-lg text-sm leading-relaxed max-h-32 overflow-y-auto"
                                    dangerouslySetInnerHTML={{ __html: transcriptionResult.summary.assessment }}
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-sm font-medium text-muted-foreground">Plan</h5>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            onTranscriptionComplete({ plan: transcriptionResult.summary.plan })
                                            setShowResults(false)
                                            setTranscriptionResult(null)
                                        }}
                                    >
                                        Apply to Plan
                                    </Button>
                                </div>
                                <div
                                    className="bg-muted/50 p-4 rounded-lg text-sm leading-relaxed max-h-32 overflow-y-auto"
                                    dangerouslySetInnerHTML={{ __html: transcriptionResult.summary.plan }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="border-t pt-4 flex justify-end gap-3">
                        <Button
                            variant="default"
                            onClick={() => {
                                if (transcriptionResult?.summary) {
                                    onTranscriptionComplete(transcriptionResult.summary);
                                    setShowResults(false);
                                    setTranscriptionResult(null);
                                }
                            }}
                        >
                            Apply All Sections
                        </Button>
                    </div>
                </div>
            </Card>
        )
    }

    return (
        <Card className="p-4">
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {isRecording ? (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={handleStopRecording}
                                    disabled={isProcessing || showStopTransition}
                                    className="h-10 w-10 relative"
                                >
                                    {isProcessing || showStopTransition ? (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="h-8 w-8 rounded-full border-2 border-primary animate-ping absolute" />
                                            <Loader2 className="h-5 w-5 animate-spin relative z-10" />
                                        </div>
                                    ) : (
                                        <Square className="h-5 w-5" />
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handlePauseResume}
                                    disabled={isProcessing || showStopTransition}
                                    className="h-10 w-10"
                                >
                                    {isPaused ? (
                                        <Play className="h-5 w-5" />
                                    ) : (
                                        <Pause className="h-5 w-5" />
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <Button
                                variant="default"
                                size="icon"
                                onClick={onToggleRecording}
                                disabled={isProcessing || showStopTransition}
                                className="h-10 w-10 relative group"
                            >
                                <div className="absolute inset-0 bg-primary/10 rounded-full scale-150 group-hover:scale-175 transition-transform duration-300" />
                                <Mic className="h-5 w-5 relative z-10" />
                            </Button>
                        )}
                    </div>
                    {isRecording && (
                        <div className="flex flex-col items-end gap-1">
                            <span className="text-sm font-medium">
                                {formatTime(duration)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {isPaused ? "Paused" : showStopTransition ? "Finalizing recording..." : "Recording"}
                            </span>
                        </div>
                    )}
                </div>
                {showStopTransition && !processingStage && (
                    <div className="relative mt-4">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 animate-pulse rounded-lg" />
                        <div className="relative p-6">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <div className="flex items-center justify-center gap-1 h-8">
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="w-1 bg-primary/60 rounded-full animate-waveform"
                                            style={{
                                                height: '100%',
                                                animationDelay: `${i * 0.1}s`
                                            }}
                                        />
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                                        <Loader2 className="h-5 w-5 animate-spin relative z-10" />
                                    </div>
                                    <span className="text-sm font-medium bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent animate-gradient">
                                        Processing your recording...
                                    </span>
                                </div>
                                <div className="relative h-24 w-24">
                                    <svg className="absolute inset-0 animate-spin-slow" viewBox="0 0 100 100">
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="45"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="text-primary/20"
                                        />
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="45"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeDasharray="283"
                                            strokeDashoffset="100"
                                            className="text-primary animate-progress"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {isRecording && !showStopTransition && (
                    <div className="space-y-3">
                        <div className="relative h-12 flex items-center justify-center">
                            <div className="flex items-center justify-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="w-1 bg-primary rounded-full transition-all duration-200 ease-in-out"
                                        style={{
                                            height: `${Math.max(15, Math.min(40, audioLevel / 6.4))}px`,
                                            opacity: isPaused ? 0.3 : 0.8,
                                            transform: `scaleY(${isPaused ? 0.5 : 1})`,
                                            animationDelay: `${i * 0.1}s`
                                        }}
                                    />
                                ))}
                            </div>
                            {!isPaused && (
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <div className="w-2 h-2 bg-primary/30 rounded-full animate-ping" />
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-center text-muted-foreground">
                            {isPaused
                                ? "Recording paused"
                                : "Recording in progress..."
                            }
                        </p>
                    </div>
                )}
                {(isProcessing || showStopTransition) && !showResults && (
                    <div className="relative mt-4">
                        <div className="relative py-8">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                {/* Simplified Processing Animation */}
                                <div className="relative">
                                    <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping opacity-25" />
                                    <div className="relative z-10 h-16 w-16 rounded-full border-2 border-primary/30 flex items-center justify-center">
                                        <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                                    </div>
                                </div>

                                {/* Status Text */}
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-sm font-medium text-primary/80">
                                        {processingStage ? (
                                            <>
                                                {processingStage === 'transcribing' && 'Transcribing...'}
                                                {processingStage === 'analyzing' && 'Analyzing...'}
                                                {processingStage === 'summarizing' && 'Summarizing...'}
                                            </>
                                        ) : (
                                            'Processing...'
                                        )}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        <div className="h-1 w-1 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="h-1 w-1 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="h-1 w-1 bg-primary/60 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <style jsx global>{`
                @keyframes wave {
                    0%, 100% {
                        transform: scaleY(0.3);
                    }
                    50% {
                        transform: scaleY(1);
                    }
                }
            `}</style>
        </Card>
    )
}
