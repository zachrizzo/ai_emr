import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { UserPlus, Send, Clock, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'

interface Collaborator {
    id: string
    name: string
    email: string
    avatar?: string
    role: string
    status: 'online' | 'offline' | 'away'
    lastActive?: string
}

interface Comment {
    id: string
    userId: string
    userName: string
    userAvatar?: string
    content: string
    timestamp: string
    status: 'sent' | 'delivered' | 'read'
}

interface CollaborationProps {
    noteId: string
    currentUserId: string
}

export function Collaboration({ noteId, currentUserId }: CollaborationProps) {
    // Placeholder data - replace with real data from your backend
    const [collaborators] = useState<Collaborator[]>([
        {
            id: '1',
            name: 'Dr. Sarah Wilson',
            email: 'sarah.wilson@hospital.com',
            role: 'Primary Physician',
            status: 'online',
            avatar: '/avatars/sarah.jpg'
        },
        {
            id: '2',
            name: 'Dr. James Chen',
            email: 'james.chen@hospital.com',
            role: 'Specialist',
            status: 'away',
            lastActive: '5m ago',
            avatar: '/avatars/james.jpg'
        },
        {
            id: '3',
            name: 'Nurse Emily Brown',
            email: 'emily.brown@hospital.com',
            role: 'Nurse',
            status: 'offline',
            lastActive: '1h ago',
            avatar: '/avatars/emily.jpg'
        }
    ])

    const [comments] = useState<Comment[]>([
        {
            id: '1',
            userId: '1',
            userName: 'Dr. Sarah Wilson',
            content: 'Updated patient vitals in the latest note.',
            timestamp: '2024-01-20T10:30:00Z',
            status: 'read'
        },
        {
            id: '2',
            userId: '2',
            userName: 'Dr. James Chen',
            content: 'Reviewed the medication changes. Looks good to proceed.',
            timestamp: '2024-01-20T11:15:00Z',
            status: 'delivered'
        }
    ])

    const [newComment, setNewComment] = useState('')

    const getStatusColor = (status: Collaborator['status']) => {
        switch (status) {
            case 'online':
                return 'bg-green-500'
            case 'away':
                return 'bg-yellow-500'
            case 'offline':
                return 'bg-gray-400'
        }
    }

    const getCommentStatusIcon = (status: Comment['status']) => {
        switch (status) {
            case 'sent':
                return <Clock className="h-3 w-3 text-muted-foreground" />
            case 'delivered':
                return <CheckCircle2 className="h-3 w-3 text-blue-500" />
            case 'read':
                return <CheckCircle2 className="h-3 w-3 text-green-500" />
        }
    }

    return (
        <div className="flex flex-col h-full">
            {/* Collaborators Section */}
            <Card className="mb-4">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-semibold">Collaborators</CardTitle>
                        <Button variant="outline" size="sm">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[120px]">
                        <div className="space-y-4">
                            {collaborators.map((collaborator) => (
                                <div key={collaborator.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <Avatar>
                                                <AvatarImage src={collaborator.avatar} />
                                                <AvatarFallback>
                                                    {collaborator.name.split(' ').map(n => n[0]).join('')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span
                                                className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(collaborator.status)}`}
                                            />
                                        </div>
                                        <div>
                                            <div className="font-medium">{collaborator.name}</div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                <Badge variant="secondary" className="text-xs">
                                                    {collaborator.role}
                                                </Badge>
                                                {collaborator.status !== 'online' && collaborator.lastActive && (
                                                    <span className="text-xs">Last active: {collaborator.lastActive}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Comments Section */}
            <Card className="flex-1">
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold">Comments</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col h-[calc(100%-5rem)]">
                    <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-4">
                            {comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={comment.userAvatar} />
                                        <AvatarFallback>
                                            {comment.userName.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{comment.userName}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(comment.timestamp), 'MMM d, h:mm a')}
                                            </span>
                                        </div>
                                        <p className="text-sm mt-1">{comment.content}</p>
                                        <div className="flex justify-end mt-1">
                                            {getCommentStatusIcon(comment.status)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="mt-4 flex gap-2">
                        <Input
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="flex-1"
                        />
                        <Button size="icon">
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
