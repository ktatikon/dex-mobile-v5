import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { User } from '@supabase/supabase-js';

export type UserProfile = Tables<'users'>;
export type UserProfileInsert = TablesInsert<'users'>;
export type UserProfileUpdate = TablesUpdate<'users'>;

export interface UserServiceError {
  code: string;
  message: string;
  details?: string;
}

export class UserService {
  /**
   * Get user profile by auth_id
   */
  static async getUserProfile(authId: string): Promise<{
    data: UserProfile | null;
    error: UserServiceError | null;
  }> {
    try {
      console.log('UserService: Fetching user profile for auth_id:', authId);

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', authId)
        .maybeSingle();

      if (error) {
        console.error('UserService: Error fetching user profile:', error);
        return {
          data: null,
          error: {
            code: error.code || 'FETCH_ERROR',
            message: error.message,
            details: error.details
          }
        };
      }

      console.log('UserService: User profile fetched successfully:', data);
      return { data, error: null };

    } catch (error: any) {
      console.error('UserService: Unexpected error in getUserProfile:', error);
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error.message || 'An unexpected error occurred'
        }
      };
    }
  }

  /**
   * Create a new user profile
   */
  static async createUserProfile(
    authUser: User,
    additionalData?: Partial<UserProfileInsert>
  ): Promise<{
    data: UserProfile | null;
    error: UserServiceError | null;
  }> {
    try {
      console.log('UserService: Creating user profile for:', authUser.id);

      const profileData: UserProfileInsert = {
        auth_id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || 'User',
        phone: authUser.user_metadata?.phone || '',
        status: 'active',
        ...additionalData
      };

      const { data, error } = await supabase
        .from('users')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error('UserService: Error creating user profile:', error);
        return {
          data: null,
          error: {
            code: error.code || 'CREATE_ERROR',
            message: error.message,
            details: error.details
          }
        };
      }

      console.log('UserService: User profile created successfully:', data);
      return { data, error: null };

    } catch (error: any) {
      console.error('UserService: Unexpected error in createUserProfile:', error);
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error.message || 'An unexpected error occurred'
        }
      };
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(
    authId: string,
    updateData: UserProfileUpdate
  ): Promise<{
    data: UserProfile | null;
    error: UserServiceError | null;
  }> {
    try {
      console.log('UserService: Updating user profile for auth_id:', authId);
      console.log('UserService: Update data:', updateData);

      // First, verify the user exists
      const { data: existingUser, error: fetchError } = await this.getUserProfile(authId);

      if (fetchError) {
        console.error('UserService: Error fetching user for update:', fetchError);
        return {
          data: null,
          error: fetchError
        };
      }

      if (!existingUser) {
        console.error('UserService: User not found for update, auth_id:', authId);
        return {
          data: null,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User profile not found. Please ensure your profile exists before updating.',
            details: `No user found with auth_id: ${authId}`
          }
        };
      }

      // Add updated_at timestamp
      const dataWithTimestamp = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      console.log('UserService: Performing UPDATE operation for existing user');
      const { data, error } = await supabase
        .from('users')
        .update(dataWithTimestamp)
        .eq('auth_id', authId)
        .select()
        .single();

      if (error) {
        console.error('UserService: Error updating user profile:', error);

        // Check if this is a unique constraint violation
        if (error.code === '23505' && error.message.includes('email')) {
          return {
            data: null,
            error: {
              code: 'EMAIL_ALREADY_EXISTS',
              message: 'This email address is already in use by another account.',
              details: error.details
            }
          };
        }

        return {
          data: null,
          error: {
            code: error.code || 'UPDATE_ERROR',
            message: error.message,
            details: error.details
          }
        };
      }

      if (!data) {
        console.error('UserService: No data returned from update operation');
        return {
          data: null,
          error: {
            code: 'UPDATE_NO_DATA',
            message: 'Update operation completed but no data was returned.',
            details: 'This might indicate the user was not found or RLS policies prevented the update.'
          }
        };
      }

      console.log('UserService: User profile updated successfully:', data);
      return { data, error: null };

    } catch (error: any) {
      console.error('UserService: Unexpected error in updateUserProfile:', error);
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error.message || 'An unexpected error occurred'
        }
      };
    }
  }

  /**
   * Check if email is already in use by another user
   */
  static async isEmailInUse(
    email: string,
    excludeAuthId?: string
  ): Promise<{
    inUse: boolean;
    error: UserServiceError | null;
  }> {
    try {
      console.log('UserService: Checking email availability:', email);

      let query = supabase
        .from('users')
        .select('id, email')
        .eq('email', email.trim().toLowerCase());

      if (excludeAuthId) {
        query = query.neq('auth_id', excludeAuthId);
      }

      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('UserService: Error checking email availability:', error);
        return {
          inUse: false,
          error: {
            code: error.code || 'CHECK_ERROR',
            message: error.message,
            details: error.details
          }
        };
      }

      const inUse = !!data;
      console.log('UserService: Email availability check result:', { email, inUse });

      return { inUse, error: null };

    } catch (error: any) {
      console.error('UserService: Unexpected error in isEmailInUse:', error);
      return {
        inUse: false,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error.message || 'An unexpected error occurred'
        }
      };
    }
  }

  /**
   * Upsert user profile (update if exists, create if not)
   */
  static async upsertUserProfile(
    authUser: User,
    updateData?: Partial<UserProfileUpdate>
  ): Promise<{
    data: UserProfile | null;
    error: UserServiceError | null;
    created: boolean;
  }> {
    try {
      console.log('UserService: Upserting user profile for:', authUser.id);

      // Prepare the profile data for upsert
      const profileData = {
        auth_id: authUser.id,
        email: authUser.email || '',
        full_name: authUser.user_metadata?.full_name || 'User',
        phone: authUser.user_metadata?.phone || '',
        status: 'active' as const,
        ...updateData,
        updated_at: new Date().toISOString()
      };

      console.log('UserService: Performing UPSERT operation with data:', profileData);

      // Use PostgreSQL UPSERT (INSERT ... ON CONFLICT ... DO UPDATE)
      const { data, error } = await supabase
        .from('users')
        .upsert(profileData, {
          onConflict: 'auth_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('UserService: Error in upsert operation:', error);

        // Check if this is a unique constraint violation on email
        if (error.code === '23505' && error.message.includes('email')) {
          return {
            data: null,
            error: {
              code: 'EMAIL_ALREADY_EXISTS',
              message: 'This email address is already in use by another account.',
              details: error.details
            },
            created: false
          };
        }

        return {
          data: null,
          error: {
            code: error.code || 'UPSERT_ERROR',
            message: error.message,
            details: error.details
          },
          created: false
        };
      }

      if (!data) {
        console.error('UserService: No data returned from upsert operation');
        return {
          data: null,
          error: {
            code: 'UPSERT_NO_DATA',
            message: 'Upsert operation completed but no data was returned.'
          },
          created: false
        };
      }

      // Determine if this was a create or update operation
      // If created_at and updated_at are very close, it was likely created
      const created = data.created_at === data.updated_at;

      console.log(`UserService: User profile ${created ? 'created' : 'updated'} successfully:`, data);
      return { data, error: null, created };

    } catch (error: any) {
      console.error('UserService: Unexpected error in upsertUserProfile:', error);
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error.message || 'An unexpected error occurred'
        },
        created: false
      };
    }
  }

  /**
   * Get or create user profile (ensures user profile exists)
   */
  static async getOrCreateUserProfile(authUser: User): Promise<{
    data: UserProfile | null;
    error: UserServiceError | null;
    created: boolean;
  }> {
    try {
      console.log('UserService: Getting or creating user profile for:', authUser.id);

      // First, try to get existing profile
      const { data: existingProfile, error: fetchError } = await this.getUserProfile(authUser.id);

      if (fetchError) {
        return { data: null, error: fetchError, created: false };
      }

      if (existingProfile) {
        console.log('UserService: Found existing user profile');
        return { data: existingProfile, error: null, created: false };
      }

      // Profile doesn't exist, create it
      console.log('UserService: User profile not found, creating new one');
      const { data: newProfile, error: createError } = await this.createUserProfile(authUser);

      if (createError) {
        return { data: null, error: createError, created: false };
      }

      return { data: newProfile, error: null, created: true };

    } catch (error: any) {
      console.error('UserService: Unexpected error in getOrCreateUserProfile:', error);
      return {
        data: null,
        error: {
          code: 'UNEXPECTED_ERROR',
          message: error.message || 'An unexpected error occurred'
        },
        created: false
      };
    }
  }

  /**
   * Validate profile data before submission
   */
  static validateProfileData(data: {
    full_name: string;
    email: string;
    phone: string;
    website?: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate full name
    if (!data.full_name || data.full_name.trim().length < 2) {
      errors.push('Full name must be at least 2 characters long');
    }

    // Validate email
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!data.email || !emailRegex.test(data.email)) {
      errors.push('Please provide a valid email address');
    }

    // Validate phone
    const phoneRegex = /^[+]?[0-9\s\-\(\)]{5,20}$/;
    if (!data.phone || !phoneRegex.test(data.phone)) {
      errors.push('Please provide a valid phone number');
    }

    // Validate website if provided
    if (data.website && data.website.trim()) {
      if (!data.website.startsWith('http://') && !data.website.startsWith('https://')) {
        errors.push('Website must start with http:// or https://');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get user-friendly error message from UserServiceError
   */
  static getErrorMessage(error: UserServiceError): string {
    switch (error.code) {
      case '23505': // Unique constraint violation
        if (error.message.includes('email')) {
          return 'This email address is already in use';
        } else if (error.message.includes('phone')) {
          return 'This phone number is already in use';
        }
        return 'A unique constraint was violated. Please check your data.';

      case '23514': // Check constraint violation
        if (error.message.includes('email_format')) {
          return 'Please provide a valid email address format';
        } else if (error.message.includes('phone_format')) {
          return 'Please provide a valid phone number format';
        } else if (error.message.includes('full_name_not_empty')) {
          return 'Full name cannot be empty';
        }
        return 'Data validation failed. Please check your input.';

      case 'PGRST116':
        return 'User profile not found';

      case 'USER_NOT_FOUND':
        return 'User profile not found. Please ensure your account is properly set up.';

      case 'EMAIL_ALREADY_EXISTS':
        return 'This email address is already in use by another account.';

      case 'UPDATE_NO_DATA':
        return 'Profile update failed. You may not have permission to update this profile.';

      case 'UPSERT_NO_DATA':
        return 'Profile save failed. Please check your permissions and try again.';

      case 'FETCH_ERROR':
      case 'CREATE_ERROR':
      case 'UPDATE_ERROR':
      case 'UPSERT_ERROR':
      case 'CHECK_ERROR':
        return error.message || 'A database error occurred';

      case 'UNEXPECTED_ERROR':
        return error.message || 'An unexpected error occurred. Please try again.';

      default:
        return error.message || 'An unexpected error occurred';
    }
  }
}
