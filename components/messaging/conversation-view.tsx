'use client'

import { useState, useEffect, useRef } from 'react'
import { Conversation, Message } from '@/types'
import { MessageInput } from './message-input'
import { Button } from '@/components/ui/button'
import { ArrowLeft, MoreVertical } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'

interface ConversationViewProps {
  conversation: Conversation
  onBack: () => void
  sendMessage: (content: string) => void
  selectedMessageId?: string
}

export function ConversationView({ conversation, onBack, sendMessage, selectedMessageId }: ConversationViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Fetch initial messages for the conversation
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: true }); // Order messages by timestamp

        if (error) throw error;

        setMessages(data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();

    // Subscribe to new messages for the conversation
    const subscription = supabase
      .channel(`public:messages:conversation-${conversation.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversation.id}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [conversation.id]);

  useEffect(() => {
    // Scroll to the selected message or the bottom of the conversation
    if (selectedMessageId) {
      const messageElement = document.getElementById(`message-${selectedMessageId}`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedMessageId, messages]);

  return (
    <div className="flex flex-col h-full">
      {/* ... (header and back button remain the same) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            id={`message-${message.id}`}
            className={`mb-4 flex ${message.sender_id === 'currentUser' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg ${message.sender_id === 'currentUser' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              <p>{message.content}</p>
              <div className="text-xs mt-1 opacity-70">
                {format(new Date(message.created_at), 'MMMM d, yyyy HH:mm')}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t p-4">
        <MessageInput onSendMessage={sendMessage} />
      </div>
    </div>
  )
}

