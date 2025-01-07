'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Sparkles, Plus, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AIAssistantProps {
    noteContent: string
    onSuggestion: (suggestion: string) => void
    patientData?: {
        age?: number;
        gender?: string;
        medicalHistory?: any[];
        medications?: any[];
    }
}

interface Suggestion {
    id: string
    text: string
    type: 'completion' | 'analysis' | 'summary' | 'custom' | 'soap' | 'differential' | 'plan'
}

export function AIAssistant({
    noteContent,
    onSuggestion,
    patientData
}: AIAssistantProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [customPrompt, setCustomPrompt] = useState('')
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [error, setError] = useState<string | null>(null)
    const [loadingType, setLoadingType] = useState<Suggestion['type'] | null>(null)

    const generateSuggestion = async (type: Suggestion['type'], customText?: string) => {
        setIsLoading(true)
        setLoadingType(type)
        setError(null)

        try {
            let prompt = ''
            switch (type) {
                case 'completion':
                    prompt = `Complete this clinical note naturally: ${noteContent}`
                    break
                case 'analysis':
                    prompt = `Analyze these symptoms and suggest possible conditions, considering patient context (${patientData ? `Age: ${patientData.age}, Gender: ${patientData.gender}` : 'No context available'}): ${noteContent}`
                    break
                case 'summary':
                    prompt = `Create a concise medical summary of this note: ${noteContent}`
                    break
                case 'soap':
                    prompt = `Convert this note into SOAP format (Subjective, Objective, Assessment, Plan): ${noteContent}`
                    break
                case 'differential':
                    prompt = `Create a differential diagnosis based on these symptoms, considering patient history: ${noteContent}`
                    break
                case 'plan':
                    prompt = `Suggest a treatment plan based on the assessment: ${noteContent}`
                    break
                case 'custom':
                    prompt = customText || customPrompt
                    break
            }

            const response = await fetch('/api/ai/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, patientData })
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => null)
                throw new Error(errorData?.error || 'Failed to generate suggestion')
            }

            const data = await response.json()
            const newSuggestion: Suggestion = {
                id: Date.now().toString(),
                text: data.suggestion,
                type
            }

            setSuggestions(prev => [newSuggestion, ...prev])
            setCustomPrompt('')
            toast({
                title: 'Suggestion Generated',
                description: 'New AI suggestion is ready to use.',
            })
        } catch (error) {
            console.error('Error generating suggestion:', error)
            setError(error instanceof Error ? error.message : 'Failed to generate AI suggestion')
            toast({
                title: 'Error',
                description: 'Failed to generate AI suggestion. Please try again.',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
            setLoadingType(null)
        }
    }

    const handleApplySuggestion = (suggestion: Suggestion) => {
        onSuggestion(suggestion.text)
        toast({
            title: 'Suggestion Applied',
            description: 'The AI suggestion has been added to your note.',
        })
    }

    const quickActions = [
        {
            label: 'Complete the current thought',
            type: 'completion' as const,
            description: 'AI will help complete your current sentence or paragraph'
        },
        {
            label: 'Analyze symptoms',
            type: 'analysis' as const,
            description: 'Analyze mentioned symptoms and suggest possible conditions'
        },
        {
            label: 'Generate SOAP Note',
            type: 'soap' as const,
            description: 'Convert current note into SOAP format'
        },
        {
            label: 'Differential Diagnosis',
            type: 'differential' as const,
            description: 'Create differential diagnosis based on symptoms'
        },
        {
            label: 'Treatment Plan',
            type: 'plan' as const,
            description: 'Suggest treatment plan based on assessment'
        },
        {
            label: 'Summarize note',
            type: 'summary' as const,
            description: 'Create a concise summary of the current note'
        }
    ]

    return (
        <div className="space-y-4">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Quick Actions */}
            <div className="space-y-2">
                <h3 className="font-medium">Quick Actions</h3>
                <div className="grid gap-2">
                    {quickActions.map((action) => (
                        <Button
                            key={action.type}
                            variant="outline"
                            className="justify-start relative"
                            onClick={() => generateSuggestion(action.type)}
                            disabled={isLoading}
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            {action.label}
                            {isLoading && loadingType === action.type && (
                                <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                </div>
                            )}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Custom Prompt */}
            <div className="space-y-2">
                <h3 className="font-medium">Custom Prompt</h3>
                <div className="flex gap-2">
                    <Textarea
                        placeholder="Enter your custom prompt..."
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        className="min-h-[80px]"
                        disabled={isLoading}
                    />
                    <Button
                        variant="outline"
                        onClick={() => generateSuggestion('custom')}
                        disabled={isLoading || !customPrompt.trim()}
                        className="h-auto relative"
                    >
                        {isLoading && loadingType === 'custom' ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Plus className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Suggestions History */}
            <div className="space-y-2">
                <h3 className="font-medium">Recent Suggestions</h3>
                <ScrollArea className="h-[200px]">
                    <div className="space-y-2">
                        {suggestions.map((suggestion) => (
                            <Card key={suggestion.id} className="p-3">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1">
                                        <div className="text-sm text-muted-foreground mb-1">
                                            {suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1)}
                                        </div>
                                        <div className="text-sm whitespace-pre-wrap">{suggestion.text}</div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleApplySuggestion(suggestion)}
                                    >
                                        Apply
                                    </Button>
                                </div>
                            </Card>
                        ))}

                        {suggestions.length === 0 && !isLoading && (
                            <div className="text-center text-sm text-muted-foreground py-4">
                                No suggestions yet. Try one of the quick actions above.
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>
        </div>
    )
}
