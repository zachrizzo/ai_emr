'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { ClinicalNote } from '@/types/notes'
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from 'date-fns'
import { useUser } from '@/lib/hooks/use-user'
import { toast } from '@/components/ui/use-toast'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface NotesHistoryProps {
    patientId: string
    onEdit: (note: ClinicalNote) => void
}

export function NotesHistory({ patientId, onEdit }: NotesHistoryProps) {
    const [notes, setNotes] = useState<ClinicalNote[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { user } = useUser()

    useEffect(() => {
        const fetchNotes = async () => {
            try {
                if (!user?.organization_id) throw new Error('No organization found for user')

                const { data, error } = await supabase
                    .from('clinical_notes')
                    .select(`
            *,
            provider:providers(id, full_name)
          `)
                    .eq('patient_id', patientId)
                    .eq('organization_id', user.organization_id)
                    .order('created_at', { ascending: false })

                if (error) throw error

                setNotes(data as ClinicalNote[])
            } catch (error) {
                console.error('Error fetching notes:', error)
                toast({
                    title: 'Error',
                    description: 'Failed to load notes history.',
                    variant: 'destructive',
                })
            } finally {
                setIsLoading(false)
            }
        }

        fetchNotes()
    }, [patientId, user?.organization_id])

    if (isLoading) {
        return <div>Loading notes history...</div>
    }

    return (
        <Card>
            <CardContent className="p-4">
                <h2 className="text-xl font-bold mb-4">Notes History</h2>
                <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-4">
                        {notes.map((note) => (
                            <Card key={note.id} className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-medium">
                                            {note.provider && typeof note.provider === 'object' && 'full_name' in note.provider
                                                ? note.provider.full_name
                                                : 'Unknown Provider'}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onEdit(note)}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        Edit
                                    </button>
                                </div>
                                <div className="text-sm whitespace-pre-wrap">{note.content}</div>
                                {note.tags && note.tags.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {note.tags.map((tag, index) => (
                                            <span
                                                key={index}
                                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
