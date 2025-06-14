
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signUp: (email: string, password: string, metadata: { full_name: string; phone: string }) => Promise<{ needsVerification: boolean; email: string }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
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
    // Set up auth state listener with email confirmation handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', event, session?.user?.email);

        // Handle email confirmation
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
          console.log('✅ Email confirmed, initializing user profile...');

          // Initialize user profile after email confirmation
          try {
            const { data: initResult, error: initError } = await supabase.rpc('initialize_user_profile', {
              user_id: session.user.id,
              user_email: session.user.email,
              user_name: session.user.user_metadata?.full_name || 'User'
            });

            if (initError) {
              console.warn('⚠️ Profile initialization failed after email confirmation:', initError);
              // Try to show a helpful message to the user
              toast({
                title: "Welcome to V-DEX!",
                description: "Your email is verified. You can now access your account.",
                variant: "default",
              });
            } else {
              console.log('✅ User profile initialized successfully after email confirmation');
              toast({
                title: "Welcome to V-DEX!",
                description: "Your account has been verified and set up successfully.",
                variant: "default",
              });
            }
          } catch (profileError) {
            console.warn('⚠️ Profile initialization error after email confirmation:', profileError);
            // Still show welcome message even if profile init fails
            toast({
              title: "Welcome to V-DEX!",
              description: "Your email is verified. You can now access your account.",
              variant: "default",
            });
          }
        }

        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false); // Ensure loading stops on auth state change
      }
    );

    // Check for existing session with timeout
    const sessionTimeout = setTimeout(() => {
      console.warn('⚠️ Auth session check timed out, proceeding without authentication');
      setLoading(false);
    }, 10000); // 10 second timeout

    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        clearTimeout(sessionTimeout);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((error) => {
        clearTimeout(sessionTimeout);
        console.error('❌ Auth session check failed:', error);
        setLoading(false); // Still stop loading even on error
      });

    return () => {
      subscription.unsubscribe();
      clearTimeout(sessionTimeout);
    };
  }, []);

  const signUp = async (email: string, password: string, metadata: { full_name: string; phone: string }): Promise<{ needsVerification: boolean; email: string }> => {
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

      // Safe email redirect URL - handle tunnel URLs
      const currentOrigin = window.location.origin;
      const emailRedirectTo = currentOrigin ? `${currentOrigin}/auth/confirm` : '/auth/confirm';

      // Signup with Supabase (email verification required)
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

      // 🎯 SUCCESS: Supabase auth.signUp() succeeded!
      // Email verification is now required before profile initialization
      console.log('✅ Supabase auth user created successfully:', userId);
      console.log('📧 Verification email sent to:', data.user?.email);
      console.log('⏳ User must verify email before profile initialization');

      // Enhanced logging for debugging
      console.log('🔍 Auth user details:', {
        id: data.user?.id,
        email: data.user?.email,
        email_confirmed_at: data.user?.email_confirmed_at,
        metadata: data.user?.user_metadata,
        created_at: data.user?.created_at
      });

      // Return success with verification requirement
      return {
        needsVerification: true,
        email: normalizedEmail
      };

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
      console.error('🚨 Signup error occurred:', error);

      // Enhanced error logging for debugging
      console.error('🔍 Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      });

      // Check if this is a timeout error
      if (error.message && error.message.includes('timeout')) {
        console.error('⏱️ Signup timeout detected - this should be resolved now');
      }

      // Enhanced error handling with specific messages
      let errorMessage = 'Registration failed. Please try again.';

      if (error.message) {
        if (error.message.includes('Email already in use')) {
          errorMessage = 'An account with this email address already exists. Please try logging in instead.';
        } else if (error.message.includes('Invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('Password')) {
          errorMessage = 'Password must be at least 6 characters long.';
        } else if (error.message.includes('phone')) {
          errorMessage = 'Please enter a valid phone number or leave it empty.';
        } else if (error.message.includes('Database error')) {
          errorMessage = 'Database error saving new user. Please try again or contact support if the issue persists.';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });

      throw new Error(errorMessage);
    }
  };

  const resendVerification = async (email: string) => {
    try {
      console.log('🔄 Resending verification email to:', email);

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      });

      if (error) {
        throw new Error(`Failed to resend verification email: ${error.message}`);
      }

      console.log('✅ Verification email resent successfully');

      toast({
        title: "Verification Email Sent",
        description: "Please check your email for the verification link.",
        variant: "default",
      });

    } catch (error: any) {
      console.error('🚨 Resend verification error:', error);

      toast({
        title: "Failed to Resend Email",
        description: error.message || "Please try again later.",
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
    resendVerification,
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
