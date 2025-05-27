-- Create notification_settings table
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  price_alerts BOOLEAN DEFAULT true,
  trade_confirmations BOOLEAN DEFAULT true,
  security_alerts BOOLEAN DEFAULT true,
  market_updates BOOLEAN DEFAULT false,
  promotional_emails BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Set up RLS policies for notification_settings table
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to select their own notification settings
CREATE POLICY "Users can view their own notification settings"
  ON public.notification_settings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own notification settings
CREATE POLICY "Users can insert their own notification settings"
  ON public.notification_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own notification settings
CREATE POLICY "Users can update their own notification settings"
  ON public.notification_settings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
