'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { ChevronRight, ChevronLeft, Calendar, Clock, FileText, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { ClinicalNote } from '@/types/notes'
import { cn } from '@/lib/utils'
import { Badge } from "@/components/ui/badge"

interface PreviousSessionNotesProps {
    notes: ClinicalNote[]
    onSelectNote: (note: ClinicalNote) => void
    isExpanded: boolean
    onToggleExpand: () => void
}

export function PreviousSessionNotes({
    notes,
    onSelectNote,
    isExpanded,
    onToggleExpand
}: PreviousSessionNotesProps) {
    const [expandedNoteId, setExpandedNoteId] = useState<string | null>(null)

    // Group notes by appointment date
    const groupedNotes = notes.reduce((acc, note) => {
        const date = format(new Date(note.created_at), 'yyyy-MM-dd')
        if (!acc[date]) {
            acc[date] = []
        }
        acc[date].push(note)
        return acc
    }, {} as Record<string, ClinicalNote[]>)

    // Sort dates in descending order
    const sortedDates = Object.keys(groupedNotes).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

    const handleNoteClick = (noteId: string) => {
        setExpandedNoteId(expandedNoteId === noteId ? null : noteId)
    }

    const renderNoteContent = (note: ClinicalNote, isExpanded: boolean) => {
        if (!isExpanded) {
            return (
                <div className="text-sm font-medium line-clamp-2">
                    {note.content.subjective || 'No subjective data'}
                </div>
            )
        }

        return (
            <div className="space-y-3">
                {note.content.subjective && (
                    <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Subjective</div>
                        <div className="text-sm">{note.content.subjective}</div>
                    </div>
                )}
                {note.content.objective && (
                    <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Objective</div>
                        <div className="text-sm">{note.content.objective}</div>
                    </div>
                )}
                {note.content.assessment && (
                    <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Assessment</div>
                        <div className="text-sm">{note.content.assessment}</div>
                    </div>
                )}
                {note.content.plan && (
                    <div>
                        <div className="text-xs font-medium text-muted-foreground mb-1">Plan</div>
                        <div className="text-sm">{note.content.plan}</div>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="relative flex h-full">
            {/* Toggle Button - Always visible */}
            <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpand}
                className="absolute -left-10 top-1/2 -translate-y-1/2 h-24 px-1.5 bg-background border-y border-l rounded-l-lg hover:bg-accent"
            >
                {isExpanded ? (
                    <ChevronRight className="h-5 w-5" />
                ) : (
                    <>
                        <ChevronLeft className="h-5 w-5" />
                        <span className="rotate-90 text-sm font-medium ml-1">History</span>
                    </>
                )}
            </Button>

            {/* Panel Content */}
            <div
                className={cn(
                    "border-l bg-background transition-all duration-300 overflow-hidden",
                    isExpanded ? "w-96" : "w-0"
                )}
            >
                {isExpanded && (
                    <div className="h-full flex flex-col">
                        <div className="flex items-center justify-between p-3 border-b bg-muted/50">
                            <CardTitle className="text-sm font-medium">Previous Sessions</CardTitle>
                            <Badge variant="outline" className="text-xs">
                                {notes.length} notes
                            </Badge>
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-3 space-y-4">
                                {sortedDates.map((date) => (
                                    <div key={date} className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            {format(new Date(date), 'MMMM d, yyyy')}
                                        </div>
                                        <div className="space-y-2 pl-6">
                                            {groupedNotes[date].map((note) => (
                                                <Card
                                                    key={note.id}
                                                    className={cn(
                                                        "cursor-pointer transition-colors",
                                                        expandedNoteId === note.id ? "bg-accent" : "hover:bg-accent/50"
                                                    )}
                                                >
                                                    <CardContent className="p-3">
                                                        <div className="space-y-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                    <Clock className="h-3 w-3" />
                                                                    {format(new Date(note.created_at), 'h:mm a')}
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 w-6 p-0"
                                                                    onClick={() => handleNoteClick(note.id)}
                                                                >
                                                                    {expandedNoteId === note.id ? (
                                                                        <ChevronUp className="h-4 w-4" />
                                                                    ) : (
                                                                        <ChevronDown className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                            {renderNoteContent(note, expandedNoteId === note.id)}
                                                            {note.tags && note.tags.length > 0 && (
                                                                <div className="flex gap-1 flex-wrap">
                                                                    {note.tags.map((tag, index) => (
                                                                        <Badge
                                                                            key={index}
                                                                            variant="secondary"
                                                                            className="text-[10px] px-1 py-0"
                                                                        >
                                                                            {tag}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="w-full justify-start text-xs text-muted-foreground hover:text-foreground gap-1"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    onSelectNote(note)
                                                                }}
                                                            >
                                                                <ExternalLink className="h-3 w-3" />
                                                                Open in editor
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </div>
        </div>
    )
}

