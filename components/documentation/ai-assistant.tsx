'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Sparkles, Plus } from 'lucide-react'

interface AIAssistantProps {
    noteContent: string
    onSuggestion: (suggestion: string) => void
}

interface Suggestion {
    id: string
    text: string
    type: 'completion' | 'analysis' | 'summary' | 'custom'
}

export function AIAssistant({
    noteContent,
    onSuggestion
}: AIAssistantProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [customPrompt, setCustomPrompt] = useState('')
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])

    const generateSuggestion = async (type: Suggestion['type'], prompt?: string) => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/ai/suggest', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: noteContent,
                    type,
                    prompt
                }),
            })

            if (!response.ok) throw new Error('Failed to generate suggestion')

            const data = await response.json()
            const newSuggestion: Suggestion = {
                id: Date.now().toString(),
                text: data.suggestion,
                type
            }

            setSuggestions(prev => [newSuggestion, ...prev])
        } catch (error) {
            console.error('Error generating suggestion:', error)
            toast({
                title: 'Error',
                description: 'Failed to generate AI suggestion. Please try again.',
                variant: 'destructive',
            })
        } finally {
            setIsLoading(false)
            setCustomPrompt('')
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
            label: 'Summarize note',
            type: 'summary' as const,
            description: 'Create a concise summary of the current note'
        }
    ]

    return (
        <div className="space-y-4">
            {/* Quick Actions */}
            <div className="space-y-2">
                <h3 className="font-medium">Quick Actions</h3>
                <div className="grid gap-2">
                    {quickActions.map((action) => (
                        <Button
                            key={action.type}
                            variant="outline"
                            className="justify-start"
                            onClick={() => generateSuggestion(action.type)}
                            disabled={isLoading}
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            {action.label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Custom Prompt */}
            <div className="space-y-2">
                <h3 className="font-medium">Custom Prompt</h3>
                <div className="flex gap-2">
                    <Textarea
                        placeholder="Enter your prompt..."
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        className="min-h-[80px]"
                    />
                    <Button
                        variant="secondary"
                        onClick={() => generateSuggestion('custom', customPrompt)}
                        disabled={isLoading || !customPrompt.trim()}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Suggestions */}
            <div className="space-y-2">
                <h3 className="font-medium">Suggestions</h3>
                {isLoading ? (
                    <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                            {suggestions.map((suggestion) => (
                                <Card key={suggestion.id} className="p-3">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium capitalize">
                                                {suggestion.type}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleApplySuggestion(suggestion)}
                                            >
                                                Apply
                                            </Button>
                                        </div>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                            {suggestion.text}
                                        </p>
                                    </div>
                                </Card>
                            ))}

                            {suggestions.length === 0 && (
                                <div className="text-center text-sm text-muted-foreground py-4">
                                    No suggestions yet. Try one of the quick actions or enter a custom prompt.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                )}
            </div>
        </div>
    )
}
