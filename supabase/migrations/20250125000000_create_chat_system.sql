-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  support_agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'waiting', 'in_progress')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT,
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message_text TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  attachment_url TEXT,
  attachment_name TEXT,
  attachment_size INTEGER,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create chat_participants table (for future multi-participant support)
CREATE TABLE IF NOT EXISTS public.chat_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'agent', 'admin')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(room_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS chat_rooms_user_id_idx ON public.chat_rooms(user_id);
CREATE INDEX IF NOT EXISTS chat_rooms_status_idx ON public.chat_rooms(status);
CREATE INDEX IF NOT EXISTS chat_rooms_created_at_idx ON public.chat_rooms(created_at);
CREATE INDEX IF NOT EXISTS chat_messages_room_id_idx ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS chat_messages_created_at_idx ON public.chat_messages(created_at);
CREATE INDEX IF NOT EXISTS chat_participants_room_id_idx ON public.chat_participants(room_id);

-- Enable Row Level Security
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_rooms
CREATE POLICY "Users can view their own chat rooms"
  ON public.chat_rooms
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = support_agent_id);

CREATE POLICY "Users can create their own chat rooms"
  ON public.chat_rooms
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat rooms"
  ON public.chat_rooms
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = support_agent_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can view messages in their chat rooms"
  ON public.chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms 
      WHERE id = room_id 
      AND (user_id = auth.uid() OR support_agent_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert messages in their chat rooms"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.chat_rooms 
      WHERE id = room_id 
      AND (user_id = auth.uid() OR support_agent_id = auth.uid())
    )
  );

CREATE POLICY "Users can update their own messages"
  ON public.chat_messages
  FOR UPDATE
  USING (auth.uid() = sender_id);

-- RLS Policies for chat_participants
CREATE POLICY "Users can view participants in their chat rooms"
  ON public.chat_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_rooms 
      WHERE id = room_id 
      AND (user_id = auth.uid() OR support_agent_id = auth.uid())
    )
  );

CREATE POLICY "Users can join their own chat rooms"
  ON public.chat_participants
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.chat_rooms 
      WHERE id = room_id 
      AND (user_id = auth.uid() OR support_agent_id = auth.uid())
    )
  );

-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
SELECT 'chat-attachments', 'chat-attachments', false
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'chat-attachments'
);

-- Storage policies for chat attachments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE name = 'Users can upload chat attachments' AND bucket_id = 'chat-attachments'
  ) THEN
    CREATE POLICY "Users can upload chat attachments"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'chat-attachments' AND
        auth.uid()::text = SUBSTRING(name, 1, POSITION('/' in name) - 1)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM storage.policies 
    WHERE name = 'Users can view chat attachments' AND bucket_id = 'chat-attachments'
  ) THEN
    CREATE POLICY "Users can view chat attachments"
      ON storage.objects
      FOR SELECT
      USING (
        bucket_id = 'chat-attachments' AND
        (
          auth.uid()::text = SUBSTRING(name, 1, POSITION('/' in name) - 1) OR
          EXISTS (
            SELECT 1 FROM public.chat_messages cm
            JOIN public.chat_rooms cr ON cm.room_id = cr.id
            WHERE cm.attachment_url LIKE '%' || name || '%'
            AND (cr.user_id = auth.uid() OR cr.support_agent_id = auth.uid())
          )
        )
      );
  END IF;
END
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_chat_rooms_updated_at 
  BEFORE UPDATE ON public.chat_rooms 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
