'use client'

import { useState, useRef, useEffect } from 'react'
import {
    MessageCircle,
    X,
    Bot,
    Send,
    Plus,
    MoreVertical,
    Pencil,
    Trash2,
    Search,
    Paperclip,
    Mic,
    MicOff,
    FileIcon,
    Download,
    File
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
import { Textarea } from '@/components/ui/textarea'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Message {
    role: 'user' | 'assistant'
    content: string
    created_at: string
    attachments?: string[] // URLs to attached files
}

interface Conversation {
    id: string
    name: string
    patientId?: string
    messages: Message[]
    created_at: string
    updated_at: string
}

const EDGE_FUNCTION_URL = 'http://127.0.0.1:54321/functions/v1/chatbot-emr'

export function FloatingAIChat() {
    const [isOpen, setIsOpen] = useState(false)
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
    const [query, setQuery] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [newConversationName, setNewConversationName] = useState('')
    const [editingConversation, setEditingConversation] = useState<Conversation | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [isRecording, setIsRecording] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const { toast } = useToast()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const audioChunksRef = useRef<Blob[]>([])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        if (isOpen) {
            scrollToBottom()
            fetchConversations()
        }
    }, [isOpen])

    useEffect(() => {
        if (selectedConversation?.messages) {
            scrollToBottom()
        }
    }, [selectedConversation?.messages])

    const fetchConversations = async () => {
        try {
            const { data: conversations, error: fetchError } = await supabase
                .from('conversations')
                .select('*')
                .order('updated_at', { ascending: false })

            if (fetchError) throw fetchError

            if (conversations) {
                // Fetch messages for each conversation
                const conversationsWithMessages = await Promise.all(
                    conversations.map(async (conv) => {
                        const { data: messages, error: messagesError } = await supabase
                            .from('messages')
                            .select('*')
                            .eq('conversation_id', conv.id)
                            .order('created_at', { ascending: true })

                        if (messagesError) throw messagesError

                        return {
                            ...conv,
                            messages: messages || []
                        }
                    })
                )
                setConversations(conversationsWithMessages)
            }
        } catch (error) {
            console.error('Error fetching conversations:', error)
            toast({
                title: 'Error',
                description: 'Failed to fetch conversations.',
                variant: 'destructive'
            })
        }
    }

    const createNewConversation = async (name: string) => {
        try {
            const conversationId = crypto.randomUUID()
            const newConversation = {
                id: conversationId,
                name,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                messages: []
            }

            const { error: insertError } = await supabase
                .from('conversations')
                .insert({
                    id: conversationId,
                    name,
                    created_at: newConversation.created_at,
                    updated_at: newConversation.updated_at
                })

            if (insertError) throw insertError

            setConversations(prev => [newConversation, ...prev])
            setSelectedConversation(newConversation)
            setNewConversationName('')
        } catch (error) {
            console.error('Error creating conversation:', error)
            toast({
                title: 'Error',
                description: 'Failed to create conversation.',
                variant: 'destructive'
            })
        }
    }

    const deleteConversation = async (id: string) => {
        try {
            const { error } = await supabase
                .from('conversations')
                .delete()
                .eq('id', id)

            if (error) throw error

            setConversations(prev => prev.filter(conv => conv.id !== id))
            if (selectedConversation?.id === id) {
                setSelectedConversation(null)
            }

            toast({
                title: 'Success',
                description: 'Conversation deleted successfully.',
            })
        } catch (error) {
            console.error('Error deleting conversation:', error)
            toast({
                title: 'Error',
                description: 'Failed to delete conversation.',
                variant: 'destructive'
            })
        }
    }

    const updateConversationName = async (id: string, newName: string) => {
        try {
            const { error } = await supabase
                .from('conversations')
                .update({ name: newName })
                .eq('id', id)

            if (error) throw error

            setConversations(prev => prev.map(conv =>
                conv.id === id ? { ...conv, name: newName } : conv
            ))
            if (selectedConversation?.id === id) {
                setSelectedConversation(prev => prev ? { ...prev, name: newName } : null)
            }

            toast({
                title: 'Success',
                description: 'Conversation name updated successfully.',
            })
        } catch (error) {
            console.error('Error updating conversation:', error)
            toast({
                title: 'Error',
                description: 'Failed to update conversation name.',
                variant: 'destructive'
            })
        }
    }

    const filteredConversations = conversations.filter(conv => {
        const matchesName = conv.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesContent = conv.messages.some(msg =>
            msg.content.toLowerCase().includes(searchTerm.toLowerCase())
        )
        return matchesName || matchesContent
    })

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        // Validate file types and sizes
        const validFiles = files.filter(file => {
            // Check file size (e.g., 10MB limit)
            const maxSize = 10 * 1024 * 1024 // 10MB in bytes
            if (file.size > maxSize) {
                toast({
                    title: 'File too large',
                    description: `${file.name} exceeds the 10MB limit`,
                    variant: 'destructive'
                })
                return false
            }

            // Check file type
            const allowedTypes = [
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/webp',
                'application/pdf',
                'text/plain',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ]
            if (!allowedTypes.includes(file.type)) {
                toast({
                    title: 'Invalid file type',
                    description: `${file.name} is not a supported file type`,
                    variant: 'destructive'
                })
                return false
            }

            return true
        })

        setSelectedFiles(prev => [...prev, ...validFiles])
    }

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    }

    const getFilePreview = (file: File) => {
        if (file.type.startsWith('image/')) {
            return URL.createObjectURL(file)
        }
        return null
    }

    const cleanupPreviews = () => {
        selectedFiles.forEach(file => {
            const preview = getFilePreview(file)
            if (preview) {
                URL.revokeObjectURL(preview)
            }
        })
    }

    useEffect(() => {
        return () => cleanupPreviews()
    }, [selectedFiles])

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            audioChunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
                // Here you would typically send the audioBlob to your speech-to-text service
                // For now, we'll just show a success message
                toast({
                    title: 'Recording completed',
                    description: 'Speech-to-text conversion would happen here.',
                })
            }

            mediaRecorder.start()
            setIsRecording(true)
        } catch (error) {
            console.error('Error accessing microphone:', error)
            toast({
                title: 'Error',
                description: 'Could not access microphone. Please check permissions.',
                variant: 'destructive'
            })
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
        }
    }

    const uploadFiles = async (files: File[]): Promise<string[]> => {
        const uploadPromises = files.map(async (file) => {
            // Create a clean filename by removing special characters and spaces
            const cleanFileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase()
            const fileExt = cleanFileName.split('.').pop()
            const uniqueId = crypto.randomUUID()
            const fileName = `${uniqueId}.${fileExt}`

            // Determine the appropriate folder based on file type
            const fileType = file.type.split('/')[0] // 'image', 'video', 'audio', etc.
            const folder = fileType || 'other'
            const filePath = `${folder}/${fileName}`

            try {
                console.log('Uploading file:', { fileName, fileType, filePath })

                const { error: uploadError, data } = await supabase.storage
                    .from('chat-attachments')
                    .upload(filePath, file, {
                        cacheControl: '3600',
                        upsert: false,
                        contentType: file.type
                    })

                if (uploadError) {
                    console.error('Upload error:', uploadError)
                    throw uploadError
                }

                // Get the public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('chat-attachments')
                    .getPublicUrl(filePath)

                console.log('File uploaded successfully:', { filePath, publicUrl })

                // Verify the URL is accessible
                try {
                    const response = await fetch(publicUrl, { method: 'HEAD' })
                    if (!response.ok) {
                        console.error('URL verification failed:', { publicUrl, status: response.status })
                        throw new Error(`URL verification failed: ${response.status}`)
                    }
                } catch (error) {
                    console.error('Error verifying URL:', error)
                    throw error
                }

                return publicUrl
            } catch (error) {
                console.error('Error uploading file:', error)
                throw error
            }
        })

        try {
            const urls = await Promise.all(uploadPromises)
            console.log('All files uploaded successfully:', urls)
            return urls
        } catch (error) {
            console.error('Error uploading files:', error)
            toast({
                title: 'Upload Error',
                description: 'Failed to upload one or more files. Please try again.',
                variant: 'destructive'
            })
            throw error
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedConversation || (!query.trim() && selectedFiles.length === 0)) return

        setIsLoading(true)
        const currentQuery = query
        setQuery('')

        try {
            // Upload files if any
            let attachmentUrls: string[] = []
            if (selectedFiles.length > 0) {
                toast({
                    title: 'Uploading files',
                    description: 'Please wait while we upload your files...'
                })

                try {
                    attachmentUrls = await uploadFiles(selectedFiles)
                    toast({
                        title: 'Files uploaded',
                        description: `Successfully uploaded ${attachmentUrls.length} file(s)`
                    })
                } catch (error) {
                    console.error('File upload error:', error)
                    toast({
                        title: 'Upload Error',
                        description: 'Failed to upload files. Please try again.',
                        variant: 'destructive'
                    })
                    setIsLoading(false)
                    return
                }
            }

            // Optimistically add user message
            const userMessage = {
                role: 'user' as const,
                content: currentQuery,
                created_at: new Date().toISOString(),
                attachments: attachmentUrls
            }
            setSelectedConversation(prev => prev ? {
                ...prev,
                messages: [...prev.messages, userMessage]
            } : null)

            // Clear selected files
            setSelectedFiles([])
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }

            const body = JSON.stringify({
                message: currentQuery,
                conversationId: selectedConversation.id,
                patientId: selectedConversation.patientId,
                attachments: attachmentUrls
            })


            // Send message to Edge Function
            const response = await fetch(EDGE_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
                },
                credentials: 'include',
                mode: 'cors',
                body: body
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.error('Edge function error:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                })
                throw new Error(errorData.error || `Error: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()

            // Update conversation with AI response
            setSelectedConversation(prev => {
                if (!prev) return null
                const updatedMessages = [...prev.messages]
                // Remove optimistically added message if it exists
                const lastMessage = updatedMessages[updatedMessages.length - 1]
                if (lastMessage.role === 'user' && lastMessage.content === currentQuery) {
                    updatedMessages.pop()
                }
                // Add the actual messages
                return {
                    ...prev,
                    messages: [
                        ...updatedMessages,
                        userMessage,
                        {
                            role: 'assistant',
                            content: data.response,
                            created_at: new Date().toISOString()
                        }
                    ]
                }
            })

        } catch (error) {
            console.error('Error in handleSubmit:', error)
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to get AI response',
                variant: 'destructive'
            })

            // Revert optimistic update
            setSelectedConversation(prev => {
                if (!prev) return null
                const messages = prev.messages.filter(msg =>
                    !(msg.role === 'user' && msg.content === currentQuery)
                )
                return { ...prev, messages }
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {!isOpen ? (
                <button
                    onClick={() => setIsOpen(true)}
                    className="flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                >
                    <MessageCircle className="w-7 h-7" />
                </button>
            ) : (
                <div className="w-[800px] h-[600px] bg-background border rounded-lg shadow-lg flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b">
                        <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5" />
                            <h2 className="font-semibold">AI Assistant</h2>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-secondary rounded-md"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex flex-1 overflow-hidden">
                        {/* Conversations Sidebar */}
                        <div className="w-1/3 border-r flex flex-col">
                            <div className="p-4 space-y-4 border-b">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search conversations..."
                                        className="pl-9"
                                    />
                                </div>
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button className="w-full">
                                            <Plus className="w-4 h-4 mr-2" />
                                            New Chat
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>New Conversation</DialogTitle>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-4 items-center gap-4">
                                                <Label htmlFor="name" className="text-right">Name</Label>
                                                <Input
                                                    id="name"
                                                    value={newConversationName}
                                                    onChange={(e) => setNewConversationName(e.target.value)}
                                                    className="col-span-3"
                                                    placeholder="Enter conversation name..."
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => createNewConversation(newConversationName)}
                                            disabled={!newConversationName.trim()}
                                        >
                                            Create
                                        </Button>
                                    </DialogContent>
                                </Dialog>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                {filteredConversations.map((conv) => (
                                    <div
                                        key={conv.id}
                                        className={`flex items-center justify-between p-3 hover:bg-secondary/50 cursor-pointer ${selectedConversation?.id === conv.id ? 'bg-secondary' : ''
                                            }`}
                                    >
                                        <div
                                            className="flex-1 truncate mr-2"
                                            onClick={() => setSelectedConversation(conv)}
                                        >
                                            <h3 className="font-medium truncate">{conv.name}</h3>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(conv.updated_at), 'MMM d, yyyy HH:mm')}
                                            </p>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setEditingConversation(conv)
                                                        setIsEditDialogOpen(true)
                                                    }}
                                                >
                                                    <Pencil className="w-4 h-4 mr-2" />
                                                    Rename
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={() => deleteConversation(conv.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className="flex-1 flex flex-col">
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {selectedConversation ? (
                                    selectedConversation.messages.map((message, index) => (
                                        <div
                                            key={index}
                                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div
                                                className={`max-w-[80%] p-3 rounded-lg ${message.role === 'user'
                                                    ? 'bg-primary text-primary-foreground ml-4'
                                                    : 'bg-muted mr-4'
                                                    }`}
                                            >
                                                <div className="flex flex-col">
                                                    <div className="text-sm break-words">
                                                        {message.content}
                                                    </div>
                                                    {message.attachments && message.attachments.length > 0 && (
                                                        <div className="mt-2 space-y-2">
                                                            {message.attachments.map((url, i) => {
                                                                const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                                                                return isImage ? (
                                                                    <div key={i} className="relative group">
                                                                        <img
                                                                            src={url}
                                                                            alt={`Attachment ${i + 1}`}
                                                                            className="max-h-48 rounded-md"
                                                                        />
                                                                        <a
                                                                            href={url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md"
                                                                        >
                                                                            <Download className="h-6 w-6 text-white" />
                                                                        </a>
                                                                    </div>
                                                                ) : (
                                                                    <a
                                                                        key={i}
                                                                        href={url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="flex items-center gap-2 text-xs hover:underline"
                                                                    >
                                                                        <FileIcon className="h-4 w-4" />
                                                                        <span>Attachment {i + 1}</span>
                                                                    </a>
                                                                )
                                                            })}
                                                        </div>
                                                    )}
                                                    <div className="text-xs opacity-70 mt-1">
                                                        {format(new Date(message.created_at), 'HH:mm')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center justify-center h-full text-muted-foreground">
                                        Select or create a conversation to start chatting
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="p-4 border-t space-y-4">
                                {selectedFiles.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedFiles.map((file, index) => {
                                            const preview = getFilePreview(file)
                                            return (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-2 bg-secondary p-2 rounded-md"
                                                >
                                                    {preview ? (
                                                        <div className="relative group">
                                                            <img
                                                                src={preview}
                                                                alt={file.name}
                                                                className="h-16 w-16 object-cover rounded"
                                                            />
                                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8"
                                                                    onClick={() => removeFile(index)}
                                                                >
                                                                    <X className="h-4 w-4 text-white" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-2">
                                                                <FileIcon className="h-4 w-4" />
                                                                <span className="text-sm truncate max-w-[200px]">
                                                                    {file.name}
                                                                </span>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6"
                                                                onClick={() => removeFile(index)}
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                                <form onSubmit={handleSubmit} className="space-y-2">
                                    <div className="relative">
                                        <Textarea
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder={selectedConversation ? "Ask me anything..." : "Select a conversation first..."}
                                            disabled={isLoading || !selectedConversation}
                                            className="min-h-[100px] pr-24"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault()
                                                    handleSubmit(e)
                                                }
                                            }}
                                        />
                                        <div className="absolute bottom-2 right-2 flex items-center gap-2">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileSelect}
                                                className="hidden"
                                                multiple
                                            />
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isLoading || !selectedConversation}
                                            >
                                                <Paperclip className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                onClick={isRecording ? stopRecording : startRecording}
                                                disabled={isLoading || !selectedConversation}
                                            >
                                                {isRecording ? (
                                                    <MicOff className="h-4 w-4 text-destructive" />
                                                ) : (
                                                    <Mic className="h-4 w-4" />
                                                )}
                                            </Button>
                                            <Button type="submit" size="icon" disabled={isLoading || !selectedConversation}>
                                                {isLoading ? (
                                                    <span className="animate-spin">⌛</span>
                                                ) : (
                                                    <Send className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Conversation Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Conversation</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right">Name</Label>
                            <Input
                                id="edit-name"
                                value={editingConversation?.name || ''}
                                onChange={(e) => setEditingConversation(prev =>
                                    prev ? { ...prev, name: e.target.value } : null
                                )}
                                className="col-span-3"
                            />
                        </div>
                    </div>
                    <Button
                        onClick={() => {
                            if (editingConversation) {
                                updateConversationName(editingConversation.id, editingConversation.name)
                                setIsEditDialogOpen(false)
                                setEditingConversation(null)
                            }
                        }}
                        disabled={!editingConversation?.name.trim()}
                    >
                        Save
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    )
}
