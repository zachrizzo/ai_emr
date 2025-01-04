'use client'

import { format } from 'date-fns'
import { ClinicalNote } from '@/types/notes'
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { FileText, Clock, Tag, Trash2 } from 'lucide-react'

interface NotesHistoryProps {
    notes: ClinicalNote[]
    onSelectNote: (note: ClinicalNote) => void
    onDeleteNote: (note: ClinicalNote) => void
    activeNoteId?: string
}

export function NotesHistory({
    notes,
    onSelectNote,
    onDeleteNote,
    activeNoteId
}: NotesHistoryProps) {
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft':
                return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
            case 'final':
                return 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
            case 'signed':
                return 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
            case 'amended':
                return 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20'
            default:
                return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20'
        }
    }

    return (
        <div className="space-y-4">
            {notes.map((note) => (
                <div
                    key={note.id}
                    className={cn(
                        "relative group border rounded-lg transition-colors",
                        activeNoteId === note.id ? "border-primary" : "border-transparent hover:border-border"
                    )}
                >
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full justify-start text-left p-3 space-y-2 rounded-lg",
                            activeNoteId === note.id && "bg-accent"
                        )}
                        onClick={() => onSelectNote(note)}
                    >
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">
                                {format(new Date(note.created_at), 'MMM d, yyyy')}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{format(new Date(note.created_at), 'h:mm a')}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            <Badge variant="secondary" className={getStatusColor(note.status)}>
                                {note.status}
                            </Badge>
                            {note.type && (
                                <Badge variant="outline">
                                    {note.type}
                                </Badge>
                            )}
                        </div>
                        {note.tags && note.tags.length > 0 && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                                <Tag className="h-3 w-3" />
                                <span>{note.tags.join(', ')}</span>
                            </div>
                        )}
                        {note.provider && (
                            <div className="text-sm text-muted-foreground mt-2">
                                By: {note.provider.full_name}
                            </div>
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                            e.stopPropagation()
                            onDeleteNote(note)
                        }}
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ))}
        </div>
    )
}
