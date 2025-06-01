
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signUp: (email: string, password: string, metadata: { full_name: string; phone: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
  validateSession: () => Promise<{ isValid: boolean; session: Session | null; error?: string }>;
  forceSessionRefresh: () => Promise<{ success: boolean; session: Session | null; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata: { full_name: string; phone: string }) => {
    try {
      // Form validation
      if (!email || email.trim() === '') {
        throw new Error('Email is required');
      }
      if (!password || password.trim() === '') {
        throw new Error('Password is required');
      }
      if (!metadata.full_name || metadata.full_name.trim() === '') {
        throw new Error('Full name is required');
      }
      // Phone is now optional - allow empty phone numbers
      // if (!metadata.phone || metadata.phone.trim() === '') {
      //   throw new Error('Phone number is required');
      // }

      // Input format validation
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      const phoneRegex = /^[+]?[0-9\s\-\(\)]{5,20}$/;

      if (!emailRegex.test(email.trim())) {
        throw new Error('Invalid email format');
      }

      // Updated phone validation: allow empty phone or validate format
      if (metadata.phone && metadata.phone.trim() !== '' && !phoneRegex.test(metadata.phone)) {
        throw new Error('Phone number must be 5-20 characters and contain only digits, spaces, hyphens, parentheses, and optional leading plus sign');
      }
      if (metadata.full_name.trim().length === 0) {
        throw new Error('Full name cannot be empty');
      }

      // Normalize email
      const normalizedEmail = email.trim().toLowerCase();

      // Check email uniqueness
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (checkError) {
        throw new Error('Unable to verify email availability');
      }

      if (existingUser) {
        throw new Error('Email already in use');
      }

      // Safe email redirect URL
      const emailRedirectTo = window.location.origin ? `${window.location.origin}/auth` : '/auth';

      // Signup with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: metadata,
          emailRedirectTo
        },
      });

      if (error) {
        throw new Error(`Registration failed: ${error.message}`);
      }

      const userId = data.user?.id;
      if (!userId) {
        throw new Error('Failed to create user account');
      }

      // Check for existing auth_id to prevent constraint violations
      const { data: existingAuthId } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', userId)
        .maybeSingle();

      if (existingAuthId) {
        throw new Error('User ID already exists in database');
      }

      // 🎯 SUCCESS: Supabase auth.signUp() succeeded!
      // Database triggers will handle profile creation automatically
      console.log('✅ Supabase auth user created successfully:', userId);
      console.log('📧 Email verification will be sent to:', data.user?.email);
      console.log('� Database triggers will create user profile automatically');

      // Handle immediate session (rare case)
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);

        toast({
          title: "Registration Successful",
          description: "Your account has been created and you are now logged in.",
        });
        return; // SUCCESS EXIT - immediate session
      }

      // Show success message for email verification flow
      toast({
        title: "Registration Successful",
        description: "Please check your email for the verification link.",
      });

      return; // SUCCESS EXIT - email verification flow

    } catch (error: any) {
      console.error('Signup error:', {
        message: error.message,
        stack: error.stack,
      });

      toast({
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });

      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Validate required fields
      if (!email || email.trim() === '') {
        throw new Error('Email is required');
      }
      if (!password || password.trim() === '') {
        throw new Error('Password is required');
      }

      // Normalize email
      const normalizedEmail = email.trim().toLowerCase();

      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        // Handle specific error cases
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please check your credentials and try again.');
        }
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Please verify your email address before logging in. Check your inbox for the verification link.');
        }
        if (error.message.includes('Too many requests')) {
          throw new Error('Too many login attempts. Please wait a few minutes before trying again.');
        }

        // Generic error fallback
        throw new Error(`Login failed: ${error.message}`);
      }

    } catch (error: any) {
      // Show user-friendly error message
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });

      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const validateSession = async (): Promise<{ isValid: boolean; session: Session | null; error?: string }> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        // Handle specific Supabase auth errors
        if (error.message.includes('AuthSessionMissingError')) {
          return { isValid: false, session: null, error: 'Authentication session missing. Please sign in again.' };
        }
        return { isValid: false, session: null, error: error.message };
      }

      if (!session) {
        return { isValid: false, session: null, error: 'No active session found' };
      }

      // Verify session is not expired
      if (session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
        return { isValid: false, session: null, error: 'Session has expired. Please sign in again.' };
      }

      return { isValid: true, session, error: undefined };
    } catch (error: any) {
      // Handle AuthSessionMissingError specifically
      if (error.name === 'AuthSessionMissingError' || error.message.includes('Auth session missing')) {
        return { isValid: false, session: null, error: 'Authentication session missing. Please sign in again.' };
      }
      return { isValid: false, session: null, error: error.message || 'Unknown validation error' };
    }
  };

  const forceSessionRefresh = async (): Promise<{ success: boolean; session: Session | null; error?: string }> => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error) {
        // Handle specific refresh errors
        if (error.message.includes('AuthSessionMissingError') || error.message.includes('Auth session missing')) {
          return { success: false, session: null, error: 'Authentication session missing. Please sign in again.' };
        }
        if (error.message.includes('refresh_token_not_found')) {
          return { success: false, session: null, error: 'Session expired. Please sign in again.' };
        }
        return { success: false, session: null, error: `Session refresh failed: ${error.message}` };
      }

      if (session) {
        // Update context state
        setSession(session);
        setUser(session.user);
        return { success: true, session, error: undefined };
      } else {
        return { success: false, session: null, error: 'No session returned from refresh' };
      }
    } catch (error: any) {
      // Handle AuthSessionMissingError specifically
      if (error.name === 'AuthSessionMissingError' || error.message.includes('Auth session missing')) {
        return { success: false, session: null, error: 'Authentication session missing. Please sign in again.' };
      }
      return { success: false, session: null, error: `Force session refresh failed: ${error.message}` };
    }
  };

  // Create the context value with all required functions
  const contextValue: AuthContextType = {
    session,
    user,
    signUp,
    signIn,
    signOut,
    loading,
    validateSession,
    forceSessionRefresh
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
