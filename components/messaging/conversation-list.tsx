'use client'

import { useState, useEffect, useCallback } from 'react';
import { Conversation } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AddConversationDialog } from './add-conversation-dialog';
import { supabase } from '@/utils/supabase-config';
import { toast } from '@/components/ui/use-toast';

interface ConversationListProps {
  conversations: Conversation[];
  onSelectConversation: (conversation: Conversation) => void;
  onAddConversation: (newConversation: Omit<Conversation, 'id' | 'created_at' | 'messages' | 'lastMessageTimestamp'>) => void;
}

export function ConversationList({ conversations, onSelectConversation, onAddConversation }: ConversationListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredConversations = conversations.filter(conversation =>
    conversation.participants.some(participant =>
      participant.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <Input
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <AddConversationDialog onAddConversation={onAddConversation} />
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.map(conversation => (
          <Button
            key={conversation.id}
            variant="ghost"
            className="w-full justify-start px-4 py-3 text-left"
            onClick={() => onSelectConversation(conversation)}
          >
            <Avatar className="mr-3">
              <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${conversation.participants[0]}`} />
              <AvatarFallback>{conversation.participants[0]?.charAt(0) || 'U'}</AvatarFallback> {/* Handle undefined participant */}
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{conversation.participants.join(', ')}</div>
              <div className="text-sm text-gray-500 truncate">
                {conversation.type === 'patient' ? 'Patient' : 'Team'} conversation
              </div>
            </div>
            <div className="text-xs text-gray-500">
              {conversation.lastMessageTimestamp ? new Date(conversation.lastMessageTimestamp).toLocaleString() : 'No messages yet'}
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}

