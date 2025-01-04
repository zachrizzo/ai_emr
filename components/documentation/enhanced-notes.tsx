'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import TipTapEditor from '@/components/documentation/tiptap-editor'
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ClinicalNote } from '@/types/notes'
import { Mic, Plus, X } from 'lucide-react'

interface EnhancedNotesProps {
    patientId: string
    providerId: string
    onSave: (note: { content: string; metadata: { type: 'voice' | 'manual'; tags: string[] } }) => void
    initialNote?: ClinicalNote | null
}

export function EnhancedNotes({ patientId, providerId, onSave, initialNote }: EnhancedNotesProps) {
    const [content, setContent] = useState(initialNote?.content || '')
    const [isRecording, setIsRecording] = useState(false)
    const [tags, setTags] = useState<string[]>(initialNote?.tags || [])
    const [newTag, setNewTag] = useState('')

    useEffect(() => {
        if (initialNote) {
            setContent(initialNote.content)
            setTags(initialNote.tags || [])
        }
    }, [initialNote])

    const handleSave = () => {
        onSave({
            content,
            metadata: {
                type: 'manual',
                tags
            }
        })
        if (!initialNote) {
            setContent('')
            setTags([])
        }
    }

    const handleAddTag = () => {
        if (newTag.trim() && !tags.includes(newTag.trim())) {
            setTags([...tags, newTag.trim()])
            setNewTag('')
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove))
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleAddTag()
        }
    }

    return (
        <Card>
            <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">{initialNote ? 'Edit Note' : 'New Note'}</h2>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className={isRecording ? 'bg-red-100' : ''}
                            onClick={() => setIsRecording(!isRecording)}
                        >
                            <Mic className={`h-4 w-4 ${isRecording ? 'text-red-500' : ''}`} />
                        </Button>
                        <Button onClick={handleSave}>
                            Save Note
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 min-h-[32px]">
                    {tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                            {tag}
                            <button
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-1 hover:text-red-500"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                    <div className="flex items-center gap-2">
                        <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Add tag..."
                            className="h-8 w-32"
                        />
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleAddTag}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="min-h-[400px] border rounded-lg">
                    <TipTapEditor
                        content={content}
                        onChange={setContent}
                        editable={true}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
