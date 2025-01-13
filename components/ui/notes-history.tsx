import React from 'react'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SessionNote } from '@/types/notes'
import { format } from 'date-fns'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface NotesHistoryProps {
    notes: SessionNote[]
    onSelectNote: (note: SessionNote) => void
    activeNoteId: string | null
}

export function NotesHistory({ notes, onSelectNote, activeNoteId }: NotesHistoryProps) {
    const lastThreeSessions = notes.slice(0, 3)

    return (
        <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-4">
                {lastThreeSessions.map((note) => (
                    <Popover key={note.id}>
                        <PopoverTrigger asChild>
                            <Card
                                className={`cursor-pointer transition-colors ${note.id === activeNoteId ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                                    }`}
                            >
                                <CardHeader>
                                    <CardTitle className="text-lg">
                                        {format(new Date(note.created_at), 'MMM d, yyyy - HH:mm')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div>
                                            <strong>Subjective:</strong>
                                            <div dangerouslySetInnerHTML={{ __html: truncateHTML(note.content.subjective, 100) }} />
                                        </div>
                                        <div>
                                            <strong>Assessment:</strong>
                                            <div dangerouslySetInnerHTML={{ __html: truncateHTML(note.content.assessment, 100) }} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 max-h-[80vh] overflow-y-auto">
                            <h3 className="font-semibold mb-2">Full Session Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <strong>Subjective:</strong>
                                    <div dangerouslySetInnerHTML={{ __html: note.content.subjective }} />
                                </div>
                                <div>
                                    <strong>Objective:</strong>
                                    <div dangerouslySetInnerHTML={{ __html: note.content.objective }} />
                                </div>
                                <div>
                                    <strong>Assessment:</strong>
                                    <div dangerouslySetInnerHTML={{ __html: note.content.assessment }} />
                                </div>
                                <div>
                                    <strong>Plan:</strong>
                                    <div dangerouslySetInnerHTML={{ __html: note.content.plan }} />
                                </div>
                            </div>
                            <Button
                                className="mt-4 w-full"
                                onClick={() => onSelectNote(note)}
                            >
                                Edit This Note
                            </Button>
                        </PopoverContent>
                    </Popover>
                ))}
            </div>
        </ScrollArea>
    )
}

function truncateHTML(html: string, maxLength: number): string {
    if (!html) return ''
    const div = document.createElement('div')
    div.innerHTML = html
    const text = div.textContent || div.innerText || ''
    if (text.length <= maxLength) return html
    return text.slice(0, maxLength) + '...'
}
