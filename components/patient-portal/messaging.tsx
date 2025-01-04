'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';

// Mock data
const mockMessages = [
    {
        id: 1,
        sender: 'Dr. Michael Smith',
        senderType: 'doctor',
        message: 'How are you feeling after the last visit? Any improvement with the prescribed medication?',
        timestamp: '2023-12-28 14:30',
        read: true,
    },
    {
        id: 2,
        sender: 'Sarah Johnson',
        senderType: 'patient',
        message: 'Yes, I\'m feeling much better. The fever has gone down and I\'m able to sleep better.',
        timestamp: '2023-12-28 14:35',
        read: true,
    },
    {
        id: 3,
        sender: 'Dr. Michael Smith',
        senderType: 'doctor',
        message: 'That\'s great to hear! Continue the medication for the prescribed duration. Let me know if you experience any side effects.',
        timestamp: '2023-12-28 14:40',
        read: false,
    },
];

export default function MessagingComponent() {
    const [messages, setMessages] = useState(mockMessages);
    const [newMessage, setNewMessage] = useState('');

    const handleSendMessage = () => {
        if (!newMessage.trim()) return;

        const message = {
            id: messages.length + 1,
            sender: 'Sarah Johnson',
            senderType: 'patient',
            message: newMessage,
            timestamp: new Date().toLocaleString(),
            read: true,
        };

        setMessages([...messages, message]);
        setNewMessage('');
    };

    return (
        <div className="h-[600px] flex flex-col">
            <Card className="flex-1">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Messages</h3>
                        <Button variant="outline">Start New Conversation</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6 h-[400px] overflow-y-auto mb-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-4 ${message.senderType === 'patient' ? 'flex-row-reverse' : ''
                                    }`}
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={`/placeholder-${message.senderType}.jpg`} />
                                    <AvatarFallback>
                                        {message.sender
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div
                                    className={`flex-1 max-w-[80%] ${message.senderType === 'patient'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                        } p-3 rounded-lg`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-medium">{message.sender}</span>
                                        <span className="text-xs opacity-70">{message.timestamp}</span>
                                    </div>
                                    <p className="text-sm">{message.message}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Type your message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="flex-1"
                        />
                        <Button onClick={handleSendMessage}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
