import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// Error type for proper error handling
interface ChatError {
  message: string;
  code?: string;
  details?: unknown;
}

// Helper function to safely extract error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unknown error occurred';
};

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  message_text: string | null;
  message_type: 'text' | 'image' | 'file' | 'system';
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  is_read: boolean;
  created_at: string;
  sender?: {
    full_name: string;
    email: string;
  };
}

export interface ChatRoom {
  id: string;
  user_id: string;
  support_agent_id: string | null;
  status: 'open' | 'closed' | 'waiting' | 'in_progress';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string | null;
  subject: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  messages?: ChatMessage[];
  unread_count?: number;
}

interface ChatContextType {
  currentRoom: ChatRoom | null;
  rooms: ChatRoom[];
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;

  // Room management
  createRoom: (subject: string, category?: string, priority?: string) => Promise<ChatRoom | null>;
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: () => void;
  closeRoom: (roomId: string) => Promise<void>;

  // Message management
  sendMessage: (text: string, type?: 'text' | 'image' | 'file') => Promise<void>;
  sendFile: (file: File) => Promise<void>;
  markMessagesAsRead: (roomId: string) => Promise<void>;

  // Real-time updates
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

const ChatContext = createContext<ChatContextType>({} as ChatContextType);

export const ChatProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentRoom, setCurrentRoom] = useState<ChatRoom | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  const fetchRooms = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          messages:chat_messages(count)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setRooms(data || []);
    } catch (err: unknown) {
      console.error('Error fetching rooms:', err);
      setError(getErrorMessage(err));
      toast({
        title: "Error",
        description: "Failed to load chat rooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const fetchMessages = useCallback(async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:sender_id(full_name, email)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      setMessages(data || []);
    } catch (err: unknown) {
      console.error('Error fetching messages:', err);
      setError(getErrorMessage(err));
    }
  }, []);

  // Initialize real-time subscriptions
  useEffect(() => {
    if (!user) return;

    setConnectionStatus('connecting');

    // Subscribe to chat rooms changes
    const roomsSubscription = supabase
      .channel('chat_rooms_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_rooms',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Room change received:', payload);
          fetchRooms();
        }
      )
      .subscribe((status) => {
        console.log('Rooms subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setConnectionStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('error');
        }
      });

    // Subscribe to messages changes
    const messagesSubscription = supabase
      .channel('chat_messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          console.log('Message change received:', payload);
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new as ChatMessage;
            if (currentRoom && newMessage.room_id === currentRoom.id) {
              fetchMessages(currentRoom.id);
            }
          }
        }
      )
      .subscribe();

    // Initial data fetch
    fetchRooms();

    return () => {
      roomsSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
      setIsConnected(false);
      setConnectionStatus('disconnected');
    };
  }, [user, currentRoom?.id, fetchRooms, fetchMessages]);

  const createRoom = async (subject: string, category?: string, priority: string = 'medium'): Promise<ChatRoom | null> => {
    if (!user) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_rooms')
        .insert({
          user_id: user.id,
          subject,
          category,
          priority: priority as ChatRoom['priority'],
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      // Add user as participant
      await supabase
        .from('chat_participants')
        .insert({
          room_id: data.id,
          user_id: user.id,
          role: 'user'
        });

      // Send welcome message
      await supabase
        .from('chat_messages')
        .insert({
          room_id: data.id,
          sender_id: user.id,
          message_text: `Chat session started. Subject: ${subject}`,
          message_type: 'system'
        });

      await fetchRooms();
      return data;
    } catch (err: unknown) {
      console.error('Error creating room:', err);
      setError(getErrorMessage(err));
      toast({
        title: "Error",
        description: "Failed to create chat room",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      if (!room) return;

      setCurrentRoom(room);
      await fetchMessages(roomId);
      await markMessagesAsRead(roomId);
    } catch (err: unknown) {
      console.error('Error joining room:', err);
      setError(getErrorMessage(err));
    }
  };

  const leaveRoom = () => {
    setCurrentRoom(null);
    setMessages([]);
  };

  const closeRoom = async (roomId: string) => {
    try {
      const { error } = await supabase
        .from('chat_rooms')
        .update({
          status: 'closed',
          closed_at: new Date().toISOString()
        })
        .eq('id', roomId);

      if (error) throw error;

      await fetchRooms();
      if (currentRoom?.id === roomId) {
        leaveRoom();
      }

      toast({
        title: "Success",
        description: "Chat session closed",
      });
    } catch (err: unknown) {
      console.error('Error closing room:', err);
      setError(getErrorMessage(err));
      toast({
        title: "Error",
        description: "Failed to close chat session",
        variant: "destructive",
      });
    }
  };

  const sendMessage = async (text: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (!user || !currentRoom || !text.trim()) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: currentRoom.id,
          sender_id: user.id,
          message_text: text,
          message_type: type
        });

      if (error) throw error;

      // Update room's updated_at timestamp
      await supabase
        .from('chat_rooms')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentRoom.id);

    } catch (err: unknown) {
      console.error('Error sending message:', err);
      setError(getErrorMessage(err));
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const sendFile = async (file: File) => {
    if (!user || !currentRoom) return;

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${currentRoom.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(fileName);

      // Send message with attachment
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: currentRoom.id,
          sender_id: user.id,
          message_text: `Sent a file: ${file.name}`,
          message_type: file.type.startsWith('image/') ? 'image' : 'file',
          attachment_url: publicUrl,
          attachment_name: file.name,
          attachment_size: file.size
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "File sent successfully",
      });
    } catch (err: unknown) {
      console.error('Error sending file:', err);
      setError(getErrorMessage(err));
      toast({
        title: "Error",
        description: "Failed to send file",
        variant: "destructive",
      });
    }
  };

  const markMessagesAsRead = async (roomId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ is_read: true })
        .eq('room_id', roomId)
        .neq('sender_id', user.id);

      if (error) throw error;
    } catch (err: unknown) {
      console.error('Error marking messages as read:', err);
    }
  };

  return (
    <ChatContext.Provider value={{
      currentRoom,
      rooms,
      messages,
      loading,
      error,
      createRoom,
      joinRoom,
      leaveRoom,
      closeRoom,
      sendMessage,
      sendFile,
      markMessagesAsRead,
      isConnected,
      connectionStatus
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
