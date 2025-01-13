'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { SessionNote } from '@/types/notes'
import { Sparkles, ArrowRight, RefreshCw, X, ArrowDown, Replace, ChevronDown, ChevronUp, Maximize2 } from 'lucide-react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { TipTapEditor } from "./tiptap-editor"
import { supabase } from '@/utils/supabase-config'

interface AIAssistantProps {
    noteContent: SessionNote['content']
    onSuggestion: (suggestion: string, section: keyof SessionNote['content'], action: 'append' | 'replace') => void
    patientData: {
        appointmentType?: string
        reasonForVisit?: string
        age?: number
        gender?: string
        medicalHistory?: any[]
        medications?: any[]
    }
    currentSection: keyof SessionNote['content']
}

export function AIAssistant({ noteContent, onSuggestion, patientData, currentSection }: AIAssistantProps) {
    const [suggestion, setSuggestion] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [popoverSize, setPopoverSize] = useState({ width: 600, height: 400 })
    const popoverRef = useRef<HTMLDivElement>(null)
    const resizeRef = useRef<HTMLDivElement>(null)
    const [isResizing, setIsResizing] = useState(false)

    const handleGenerateSuggestion = async () => {
        setIsGenerating(true)
        try {
            const { data: { functionURL } } = await supabase.functions.invoke('chatbot-emr', {
                body: {
                    message: `Please help me write the ${String(currentSection)} section of a medical note. Here's the context:
          Appointment Type: ${patientData.appointmentType}
          Reason for Visit: ${patientData.reasonForVisit}
          Current Content: ${noteContent[currentSection]}
          Patient Age: ${patientData.age}
          Patient Gender: ${patientData.gender}
          Medical History: ${JSON.stringify(patientData.medicalHistory)}
          Current Medications: ${JSON.stringify(patientData.medications)}

          Please provide a detailed and professional ${String(currentSection)} section following medical documentation best practices.`,
                    patientData: patientData
                }
            })

            if (functionURL) {
                setSuggestion(functionURL)
            }
        } catch (error) {
            console.error('Error generating AI suggestion:', error)
        } finally {
            setIsGenerating(false)
            setIsOpen(true)
        }
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
            if (!isResizing) return

            const newWidth = Math.max(300, e.clientX - (popoverRef.current?.getBoundingClientRect().left || 0))
            const newHeight = Math.max(200, e.clientY - (popoverRef.current?.getBoundingClientRect().top || 0))

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
    }, [isResizing])

    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault()
        setIsResizing(true)
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    onClick={handleGenerateSuggestion}
                    disabled={isGenerating}
                    size="sm"
                >
                    <Sparkles className="h-4 w-4 mr-2" />
                    {isGenerating ? 'Generating...' : 'Generate Suggestion'}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="p-6 overflow-hidden"
                align="start"
                ref={popoverRef}
                style={{
                    width: `${popoverSize.width}px`,
                    height: `${popoverSize.height}px`,
                }}
            >
                <div className="space-y-2 p-4 h-full flex flex-col">
                    <div className="flex justify-between items-center">
                        <h4 className="text-sm font-semibold">AI Suggestion</h4>
                        <div className="space-x-2 flex items-center">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleGenerateSuggestion}
                                disabled={isGenerating}
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Regenerate
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSuggestion('')}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Clear
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setIsExpanded(!isExpanded)}
                            >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    <div className="flex-grow overflow-auto">
                        <TipTapEditor
                            content={suggestion}
                            onChange={setSuggestion}
                            editable={true}
                            placeholder="AI suggestion will appear here..."
                        />
                    </div>
                    <div className="flex justify-between">
                        <Button
                            onClick={() => {
                                onSuggestion(suggestion, currentSection, 'append')
                                setIsOpen(false)
                            }}
                            size="sm"
                        >
                            <ArrowDown className="h-4 w-4 mr-2" />
                            Append to Current Text
                        </Button>
                        <Button
                            onClick={() => {
                                onSuggestion(suggestion, currentSection, 'replace')
                                setIsOpen(false)
                            }}
                            size="sm"
                        >
                            <Replace className="h-4 w-4 mr-2" />
                            Replace Current Text
                        </Button>
                    </div>
                </div>
                <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-60' : 'max-h-0'
                        }`}
                >
                    <div className="p-4 border-t">
                        <h5 className="text-sm font-semibold mb-2">Current {String(currentSection)} Content</h5>
                        <div className="border rounded p-2 max-h-40 overflow-y-auto">
                            <div dangerouslySetInnerHTML={{ __html: noteContent[currentSection] }} />
                        </div>
                    </div>
                </div>
                <div
                    ref={resizeRef}
                    className="absolute bottom-2 right-2 w-6 h-6 flex items-center justify-center cursor-se-resize transition-colors duration-200"
                    onMouseDown={startResizing}
                >
                    <Maximize2 className="w-4 h-4 text-muted-foreground transform rotate-90" />
                </div>
                <div className="absolute bottom-2 right-9 text-xs text-muted-foreground">
                    Drag to resize
                </div>
            </PopoverContent>
        </Popover>
    )
}
