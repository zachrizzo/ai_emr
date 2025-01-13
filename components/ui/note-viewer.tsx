import React from 'react'
import { SessionNote } from '@/types/notes'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from 'date-fns'
import { X } from 'lucide-react'

interface NoteViewerProps {
    note: SessionNote
    onClose: () => void
    onEdit: () => void
}

export function NoteViewer({ note, onClose, onEdit }: NoteViewerProps) {
    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold">
                    Session Note: {format(new Date(note.created_at), 'MMMM d, yyyy')}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {Object.entries(note.content).map(([key, value]) => (
                        <div key={key} className="space-y-2">
                            <h3 className="text-lg font-semibold capitalize">{key}</h3>
                            <div className="pl-4 border-l-2 border-primary" dangerouslySetInnerHTML={{ __html: value }} />
                        </div>
                    ))}
                </div>
                <Button onClick={onEdit} className="mt-6">Edit Note</Button>
            </CardContent>
        </Card>
    )
}
