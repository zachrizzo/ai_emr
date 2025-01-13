'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sparkles, RefreshCw, X, ChevronDown, ChevronUp, Maximize2, FileText } from 'lucide-react'
import { getSupabaseConfig } from '@/utils/supabase-config'
import { SessionNote } from '@/types/notes'
import { useToast } from "@/components/ui/use-toast"
import { useUser } from '@/contexts/UserContext'
import { TipTapEditor } from "@/components/ui/tiptap-editor"

interface AIAssistantProps {
    noteContent: SessionNote['content']
    onSuggestion: (suggestion: string, action: 'append' | 'replace') => void
    patientData: {
        appointmentType: string
        reasonForVisit: string
        patientId: string
    }
    currentSection: keyof SessionNote['content']
}

export function AIAssistant({ noteContent, onSuggestion, patientData, currentSection }: AIAssistantProps) {
    const { toast } = useToast()
    const { functionURL, supabaseAnonKey } = getSupabaseConfig()
    const { userData } = useUser()
    const [isOpen, setIsOpen] = useState(false)
    const [suggestion, setSuggestion] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [isResizing, setIsResizing] = useState(false)
    const [popoverSize, setPopoverSize] = useState({ width: 400, height: 300 })
    const popoverRef = useRef<HTMLDivElement>(null)
    const resizeRef = useRef<HTMLDivElement>(null)

    const generateSuggestion = async () => {
        if (!userData?.organization_id) {
            toast({
                title: "Error",
                description: "No organization selected.",
                variant: "destructive"
            })
            return
        }

        setIsGenerating(true)
        try {
            // Create section-specific prompts with context handling
            const sectionPrompts = {
                subjective: {
                    new: "Write a concise subjective note for the patient named Zach. Focus only on the key symptoms and complaints.",
                    continue: "Add to Zach's existing subjective note, keeping it focused and relevant to today's visit."
                },
                objective: {
                    new: "Write a brief, focused objective note for Zach's examination findings and vital signs.",
                    continue: "Add any new examination findings for Zach, keeping the note concise and relevant."
                },
                assessment: {
                    new: "Write a clear, concise assessment of Zach's current condition and main diagnoses.",
                    continue: "Update the assessment for Zach based on today's findings, keeping it brief and focused."
                },
                plan: {
                    new: "Write a clear, actionable treatment plan for Zach with specific next steps.",
                    continue: "Update Zach's treatment plan with any new recommendations, keeping it specific and actionable."
                }
            }

            const existingContent = noteContent[currentSection]?.trim()
            const prompt = existingContent
                ? sectionPrompts[currentSection].continue
                : sectionPrompts[currentSection].new

            const body = JSON.stringify({
                message: `${prompt}

                This is for a ${patientData.appointmentType} visit.
                Reason for visit: ${patientData.reasonForVisit}

                Key requirements:
                - Keep the note brief and focused
                - Use clear, direct language
                - Include only essential information
                - Make it specific to Zach's case

                Format using HTML:
                - Use <p> for short, clear paragraphs
                - Use <strong> for key points
                - Use <ul> with <li> for brief bullet points
                - Use <div class="task-list-item"><input type="checkbox" disabled> for specific follow-up tasks

                ${existingContent ? `Current content to build upon:\n${existingContent}\n\nPlease maintain consistency while keeping it concise.` : ''}`,
                patientContext: {
                    appointmentType: patientData.appointmentType,
                    reasonForVisit: patientData.reasonForVisit,
                    currentContent: existingContent,
                    format: "html",
                    section: currentSection,
                    hasExistingContent: Boolean(existingContent),
                    patientName: "Zach",
                    preferences: {
                        style: "concise",
                        format: "direct"
                    }
                },
                currentSection: String(currentSection),
                organizationId: userData.organization_id,
                patientId: patientData.patientId
            })

            const response = await fetch(`${functionURL}note-generator`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseAnonKey}`,
                    'x-client-info': 'ai_emr@0.1.0',
                },
                credentials: 'omit',
                mode: 'cors',
                body
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw new Error(errorData.error || `Error: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            if (!data.response) throw new Error('No content received from AI')
            setSuggestion(data.response)
        } catch (error) {
            toast({
                title: "Error generating suggestion",
                description: error instanceof Error ? error.message : "An unexpected error occurred",
                variant: "destructive",
            })
        } finally {
            setIsGenerating(false)
        }
    }

    const handleAppend = () => {
        if (!suggestion.trim()) return
        onSuggestion(suggestion.trim(), 'append')
        setSuggestion('')
        setIsOpen(false)
    }

    const handleReplace = () => {
        if (!suggestion.trim()) return
        onSuggestion(suggestion.trim(), 'replace')
        setSuggestion('')
        setIsOpen(false)
    }

    useEffect(() => {
        if (isOpen && popoverRef.current) {
            const popoverRect = popoverRef.current.getBoundingClientRect()
            const isPartiallyOffscreen = popoverRect.bottom > window.innerHeight

            if (isPartiallyOffscreen) {
                const scrollAmount = popoverRect.bottom - window.innerHeight + 20
                window.scrollBy({ top: scrollAmount, behavior: 'smooth' })
            }
        }
    }, [isOpen, isExpanded])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing || !popoverRef.current) return

            const popoverRect = popoverRef.current.getBoundingClientRect()
            const deltaX = (e.clientX - popoverRect.left - popoverSize.width) * 0.5
            const deltaY = (e.clientY - popoverRect.top - popoverSize.height) * 0.5

            const newWidth = Math.max(300, Math.min(800, popoverSize.width + deltaX))
            const newHeight = Math.max(200, Math.min(600, popoverSize.height + deltaY))

            setPopoverSize({ width: newWidth, height: newHeight })
        }

        const handleMouseUp = () => {
            setIsResizing(false)
        }

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isResizing, popoverSize])

    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault()
        setIsResizing(true)
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 relative group hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                    onClick={() => {
                        setIsOpen(true)
                        if (!suggestion) {
                            generateSuggestion()
                        }
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-md" />
                    <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                    <span className="relative">AI Assist</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                ref={popoverRef}
                className="p-4 w-[700px] shadow-lg border-primary/20"
                style={{
                    height: `${popoverSize.height}px`,
                    resize: 'both',
                    overflow: 'auto'
                }}
            >
                <div className="h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                AI Suggestion
                            </h4>
                            {isGenerating && (
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="h-1.5 w-1.5 bg-primary rounded-full animate-bounce" />
                                </div>
                            )}
                        </div>
                        <div className="space-x-2 flex items-center">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={generateSuggestion}
                                disabled={isGenerating}
                                className="hover:bg-primary/5 hover:text-primary transition-colors"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                                Regenerate
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSuggestion('')}
                                className="hover:bg-destructive/5 hover:text-destructive transition-colors"
                            >
                                <X className="h-4 w-4 mr-2" />
                                Clear
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="hover:bg-primary/5 hover:text-primary transition-colors"
                            >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>

                    <div className="flex-grow overflow-auto relative">
                        <div className={`transition-opacity duration-300 ${isGenerating ? 'opacity-50' : 'opacity-100'}`}>
                            <TipTapEditor
                                content={suggestion}
                                onChange={setSuggestion}
                                editable={!isGenerating}
                                placeholder={isGenerating ? 'Generating suggestion...' : 'Click generate to get AI suggestions...'}
                            />
                        </div>
                        {isGenerating && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                                        <div className="w-2 h-2 bg-primary rounded-full animate-ping [animation-delay:-0.3s]" />
                                        <div className="w-2 h-2 bg-primary rounded-full animate-ping [animation-delay:-0.6s]" />
                                    </div>
                                    <p className="text-sm text-muted-foreground animate-pulse">Crafting your note with AI magic...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between mt-4">
                        <div className="space-x-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleAppend}
                                disabled={!suggestion || isGenerating}
                                className="hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                            >
                                Append
                            </Button>
                            <Button
                                size="sm"
                                variant="default"
                                onClick={handleReplace}
                                disabled={!suggestion || isGenerating}
                                className="bg-primary hover:bg-primary/90 transition-colors"
                            >
                                Replace
                            </Button>
                        </div>
                    </div>

                    <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-60 mt-4' : 'max-h-0'}`}
                    >
                        <div className="border-t pt-4">
                            <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                Current {String(currentSection)} Content
                            </h5>
                            <div className="border rounded p-2 max-h-40 overflow-y-auto bg-muted/5">
                                <div dangerouslySetInnerHTML={{ __html: noteContent[currentSection] }} />
                            </div>
                        </div>
                    </div>

                    <div
                        ref={resizeRef}
                        className="absolute bottom-2 right-2 w-6 h-6 flex items-center justify-center cursor-se-resize hover:text-primary transition-colors duration-200"
                        onMouseDown={startResizing}
                    >
                        <Maximize2 className="w-4 h-4 text-muted-foreground transform rotate-90" />
                    </div>
                    <div className="absolute bottom-2 right-9 text-xs text-muted-foreground">
                        Drag to resize
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
