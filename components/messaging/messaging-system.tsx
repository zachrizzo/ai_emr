'use client'

import { useState, useEffect, useCallback } from 'react';
import { ConversationList } from './conversation-list';
import { ConversationView } from './conversation-view';
import { Conversation, Message } from '@/types';
import { supabase } from '@/lib/supabase';
import { toast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';

interface MessagingSystemProps {
  initialConversationId?: string;
  initialMessageId?: string;
}

export function MessagingSystem({ initialConversationId, initialMessageId }: MessagingSystemProps) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | undefined>(initialMessageId);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const fetchConversations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')

      if (error) throw error;

      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch conversations',
        variant: 'destructive',
      });
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const subscription = supabase
      .channel('public:conversations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'conversations' }, (payload) => {
        console.log('New conversation inserted:', payload.new);
        setConversations(prev => [...prev, payload.new]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, (payload) => {
        console.log('Conversation updated:', payload.new);
        setConversations(prev => prev.map(conv => conv.id === payload.new.id ? payload.new : conv));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'conversations' }, (payload) => {
        console.log('Conversation deleted:', payload.old);
        setConversations(prev => prev.filter(conv => conv.id !== payload.old.id));
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setSelectedMessageId(undefined);
  };

  const handleAddConversation = async (newConversation: Omit<Conversation, 'id' | 'created_at' | 'messages' | 'lastMessageTimestamp'>) => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert([{ ...newConversation, created_at: new Date().toISOString(), messages: [] }])
        .select();

      if (error) throw error;

      if (data) {
        const createdConversation = { ...data[0], messages: [] } as Conversation;
        setConversations(prev => [...prev, createdConversation]);
        setSelectedConversation(createdConversation);
      }
    } catch (error) {
      console.error('Error adding conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to add conversation',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation) return;

    const newMessage: Message = {
      id: uuidv4(),
      sender_id: 'currentUser', // Replace with actual user ID from Supabase auth
      conversation_id: selectedConversation.id,
      content,
      created_at: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([newMessage])
        .select();

      if (error) throw error;

      if (data) {
        // Update the selected conversation with the new message
        const updatedConversation = {
          ...selectedConversation,
          messages: [...selectedConversation.messages, data[0]],
          lastMessageTimestamp: new Date().toISOString(),
        };

        setSelectedConversation(updatedConversation);
        setConversations(prev => prev.map(c => c.id === updatedConversation.id ? updatedConversation : c));

        // Update the conversation's last message timestamp in Supabase
        await supabase
          .from('conversations')
          .update({ lastMessageTimestamp: new Date().toISOString() })
          .eq('id', selectedConversation.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {selectedConversation ? (
        <div className="flex-1 overflow-hidden">
          <ConversationView
            conversation={selectedConversation}
            onBack={() => setSelectedConversation(null)}
            sendMessage={handleSendMessage}
            selectedMessageId={selectedMessageId}
          />
        </div>
      ) : (
        <ConversationList
          conversations={conversations}
          onSelectConversation={handleSelectConversation}
          onAddConversation={handleAddConversation}
        />
      )}
    </div>
  );
}

