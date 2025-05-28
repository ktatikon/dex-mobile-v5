import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Camera,
  Phone,
  MapPin,
  Calendar,
  Globe,
  Check,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, ProfileFormValues } from '@/schemas/profileSchema';
import { UserService, UserProfile } from '@/services/userService';

const ProfileSettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [initials, setInitials] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Set up form with react-hook-form and zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      birthdate: '',
      location: '',
      bio: '',
      website: ''
    }
  });

  // Fetch user data from Supabase using UserService
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        console.log('No user found in auth context');
        return;
      }

      console.log('Fetching user data for auth_id:', user.id);
      setIsLoading(true);

      try {
        // Use UserService to get or create user profile
        const { data: profile, error, created } = await UserService.getOrCreateUserProfile(user);

        if (error) {
          console.error('UserService error:', error);
          toast({
            title: "Profile Error",
            description: UserService.getErrorMessage(error),
            variant: "destructive",
          });
          return;
        }

        if (!profile) {
          console.error('No profile returned from UserService');
          toast({
            title: "Profile Error",
            description: "Failed to load or create user profile.",
            variant: "destructive",
          });
          return;
        }

        console.log('User profile loaded/created successfully:', profile);
        setUserData(profile);

        // Set form values
        setValue('full_name', profile.full_name || '');
        setValue('email', profile.email || '');
        setValue('phone', profile.phone || '');
        setValue('birthdate', profile.birthdate || '');
        setValue('location', profile.location || '');
        setValue('bio', profile.bio || '');
        setValue('website', profile.website || '');

        // Set initials for avatar
        const nameParts = (profile.full_name || '').split(' ').filter((part: string) => part.length > 0);
        if (nameParts.length >= 2) {
          setInitials(`${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase());
        } else if (nameParts.length === 1 && nameParts[0].length > 0) {
          setInitials(nameParts[0][0].toUpperCase());
        } else {
          setInitials('U');
        }

        // Check if user has an avatar
        if (profile.avatar_url) {
          try {
            // Get the public URL for the avatar
            const { data: publicUrlData } = supabase
              .storage
              .from('avatars')
              .getPublicUrl(profile.avatar_url);

            if (publicUrlData?.publicUrl) {
              setAvatarUrl(publicUrlData.publicUrl);
            }
          } catch (avatarError) {
            console.warn('Error loading avatar:', avatarError);
            // Don't fail the whole operation for avatar issues
          }
        }

        // Show success message if profile was created
        if (created) {
          toast({
            title: "Profile Created",
            description: "Your profile has been set up. Please update your information.",
            variant: "default",
          });
        }

      } catch (error) {
        console.error('Unexpected error in fetchUserData:', error);
        toast({
          title: "Unexpected Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [user, setValue, toast]);

  const handleFormSubmit = (_data: ProfileFormValues) => {
    // Show confirmation dialog
    setShowConfirmDialog(true);
  };

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !userData) {
      console.error('Missing user or userData for profile update');
      return;
    }

    console.log('Updating profile with data:', data);
    setIsLoading(true);

    try {
      // Validate the data using UserService
      const validation = UserService.validateProfileData({
        full_name: data.full_name,
        email: data.email,
        phone: data.phone,
        website: data.website
      });

      if (!validation.isValid) {
        throw new Error(validation.errors[0]);
      }

      // Check if email is being changed and if it already exists
      if (data.email !== userData.email) {
        const { inUse, error: checkError } = await UserService.isEmailInUse(data.email, user.id);

        if (checkError) {
          console.error('Error checking email uniqueness:', checkError);
          throw new Error('Failed to validate email address');
        }

        if (inUse) {
          throw new Error('This email address is already in use by another account');
        }
      }

      // Prepare update data
      const updateData = {
        full_name: data.full_name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        birthdate: data.birthdate || null,
        location: data.location?.trim() || null,
        bio: data.bio?.trim() || null,
        website: data.website?.trim() || null
      };

      console.log('Sending update to UserService:', updateData);

      // Try to update user data using UserService
      let result = await UserService.updateUserProfile(user.id, updateData);

      // If user not found, try to use upsert to ensure the user exists
      if (result.error && result.error.code === 'USER_NOT_FOUND') {
        console.log('User not found, attempting upsert operation...');

        result = await UserService.upsertUserProfile(user, updateData);

        if (result.error) {
          console.error('UserService upsert error:', result.error);
          throw new Error(UserService.getErrorMessage(result.error));
        }
      } else if (result.error) {
        console.error('UserService update error:', result.error);
        throw new Error(UserService.getErrorMessage(result.error));
      }

      if (!result.data) {
        throw new Error('Failed to update profile - no data returned');
      }

      console.log('Profile updated successfully:', result.data);

      // Update local state with the returned data
      setUserData(result.data);

      // Update initials
      const nameParts = data.full_name.trim().split(' ').filter((part: string) => part.length > 0);
      if (nameParts.length >= 2) {
        setInitials(`${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase());
      } else if (nameParts.length === 1 && nameParts[0].length > 0) {
        setInitials(nameParts[0][0].toUpperCase());
      } else {
        setInitials('U');
      }

      setIsEditing(false);
      setShowConfirmDialog(false);

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
        variant: "default",
      });

    } catch (error: any) {
      console.error('Error updating profile:', error);

      let errorMessage = error.message || "Failed to update profile. Please try again.";

      // Provide more specific error messages
      if (errorMessage.includes('email') && errorMessage.includes('already in use')) {
        errorMessage = "This email address is already in use by another account. Please use a different email.";
      } else if (errorMessage.includes('unique constraint')) {
        errorMessage = "This email address is already in use. Please use a different email.";
      }

      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form to current user data
    if (userData) {
      setValue('full_name', userData.full_name);
      setValue('email', userData.email);
      setValue('phone', userData.phone);
      setValue('birthdate', userData.birthdate || '');
      setValue('location', userData.location || '');
      setValue('bio', userData.bio || '');
      setValue('website', userData.website || '');
    }
    setIsEditing(false);
  };

  const handleUploadPhoto = () => {
    // Trigger the hidden file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !userData) return;

    // Validate file type
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const allowedExts = ['jpg', 'jpeg', 'png', 'gif'];

    if (!fileExt || !allowedExts.includes(fileExt)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file (JPG, PNG, or GIF).",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 2MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Create a unique file name
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;

      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Update the user record with the new avatar URL
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: data.path })
        .eq('auth_id', user.id);

      if (updateError) throw updateError;

      // Get the public URL
      const { data: publicUrlData } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(data.path);

      // Update state
      setAvatarUrl(publicUrlData.publicUrl);
      setUserData({
        ...userData,
        avatar_url: data.path
      });

      toast({
        title: "Photo Uploaded",
        description: "Your profile photo has been updated successfully.",
        variant: "default",
      });
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="container mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => navigate('/settings')}
          aria-label="Back to Settings"
        >
          <ArrowLeft className="text-white" size={26} />
        </Button>
        <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
      </div>

      {isLoading && !userData ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 text-white animate-spin" />
        </div>
      ) : (
        <>
          {/* Profile Photo */}
          <Card className="bg-black border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Left column with avatar */}
                <div className="relative">
                  <Avatar className="h-24 w-24 border-2 border-dex-secondary/30">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt="Profile" />
                    ) : (
                      <AvatarImage src="/placeholder-avatar.svg" alt="Profile" />
                    )}
                    <AvatarFallback className="bg-dex-secondary/20 text-white text-3xl">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    variant="primary"
                    size="icon"
                    className="absolute bottom-0 right-0 rounded-full h-11 w-11 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    onClick={handleUploadPhoto}
                    disabled={isUploading}
                    aria-label="Upload photo"
                  >
                    {isUploading ? (
                      <Loader2 size={20} className="text-white animate-spin" />
                    ) : (
                      <Camera size={26} className="text-white" />
                    )}
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/jpeg,image/png,image/gif"
                    className="hidden"
                  />
                </div>

                {/* Right column with user details */}
                {userData && (
                  <div className="flex-1">
                    <div className="mb-3">
                      <h2 className="text-xl font-bold text-white">{userData.full_name}</h2>
                      <p className="text-dex-text-secondary text-sm">{userData.email}</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-3">
                      <div className="flex items-center gap-2 text-dex-text-secondary">
                        <Phone size={18} className="text-dex-text-secondary min-w-[18px]" />
                        <span className="truncate">{userData.phone}</span>
                      </div>

                      {userData.location && (
                        <div className="flex items-center gap-2 text-dex-text-secondary">
                          <MapPin size={18} className="text-dex-text-secondary min-w-[18px]" />
                          <span className="truncate">{userData.location}</span>
                        </div>
                      )}

                      {userData.website && (
                        <div className="flex items-center gap-2 text-dex-text-secondary">
                          <Globe size={18} className="text-dex-text-secondary min-w-[18px]" />
                          <span className="truncate">{userData.website}</span>
                        </div>
                      )}

                      {userData.birthdate && (
                        <div className="flex items-center gap-2 text-dex-text-secondary">
                          <Calendar size={18} className="text-dex-text-secondary min-w-[18px]" />
                          <span className="truncate">{userData.birthdate}</span>
                        </div>
                      )}
                    </div>

                    {userData.bio && (
                      <p className="text-white text-sm mb-4">{userData.bio}</p>
                    )}
                  </div>
                )}
              </div>

              {!isEditing ? (
                <Button
                  variant="primary"
                  className="w-full font-medium text-base min-h-[44px]"
                  onClick={() => setIsEditing(true)}
                  disabled={isLoading}
                >
                  Edit Profile
                </Button>
              ) : (
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="full_name" className="text-white text-sm">Full Name</Label>
                      <Input
                        id="full_name"
                        {...register('full_name')}
                        className={`bg-dex-dark border-dex-secondary/30 text-white min-h-[44px] ${errors.full_name ? 'border-red-500' : ''}`}
                      />
                      {errors.full_name && (
                        <p className="text-red-500 text-xs mt-1">{errors.full_name.message}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="email" className="text-white text-sm">Email</Label>
                      <Input
                        id="email"
                        {...register('email')}
                        className={`bg-dex-dark border-dex-secondary/30 text-white min-h-[44px] ${errors.email ? 'border-red-500' : ''}`}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="phone" className="text-white text-sm">Phone</Label>
                      <Input
                        id="phone"
                        {...register('phone')}
                        className={`bg-dex-dark border-dex-secondary/30 text-white min-h-[44px] ${errors.phone ? 'border-red-500' : ''}`}
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="location" className="text-white text-sm">Location</Label>
                      <Input
                        id="location"
                        {...register('location')}
                        className="bg-dex-dark border-dex-secondary/30 text-white min-h-[44px]"
                        placeholder="City, Country"
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="website" className="text-white text-sm">Website</Label>
                      <Input
                        id="website"
                        {...register('website')}
                        className={`bg-dex-dark border-dex-secondary/30 text-white min-h-[44px] ${errors.website ? 'border-red-500' : ''}`}
                        placeholder="https://example.com"
                      />
                      {errors.website && (
                        <p className="text-red-500 text-xs mt-1">{errors.website.message}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="birthdate" className="text-white text-sm">Birthdate</Label>
                      <Input
                        id="birthdate"
                        type="date"
                        {...register('birthdate')}
                        className="bg-dex-dark border-dex-secondary/30 text-white min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="bio" className="text-white text-sm">Bio</Label>
                    <Textarea
                      id="bio"
                      {...register('bio')}
                      className="bg-dex-dark border-dex-secondary/30 text-white min-h-[80px] rounded-lg p-3"
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="flex gap-3 pt-3">
                    <Button
                      type="submit"
                      variant="primary"
                      className="flex-1 font-medium text-base min-h-[44px]"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      ) : (
                        <Check size={20} className="mr-2" />
                      )}
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 font-medium text-base min-h-[44px]"
                      onClick={handleCancel}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Account Activity */}
      <Card className="bg-black border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white text-xl">Account Activity</CardTitle>
          <CardDescription className="text-dex-text-secondary text-base">
            Recent login activity and security events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border-b border-dex-secondary/20 rounded-lg hover:bg-dex-secondary/5">
              <div>
                <p className="text-white font-medium text-base">Login from new device</p>
                <p className="text-sm text-dex-text-secondary">MacBook Pro • San Francisco, CA</p>
              </div>
              <p className="text-sm text-dex-text-secondary">Today, 10:30 AM</p>
            </div>

            <div className="flex justify-between items-center p-4 border-b border-dex-secondary/20 rounded-lg hover:bg-dex-secondary/5">
              <div>
                <p className="text-white font-medium text-base">Password changed</p>
                <p className="text-sm text-dex-text-secondary">Security update</p>
              </div>
              <p className="text-sm text-dex-text-secondary">Yesterday, 2:15 PM</p>
            </div>

            <div className="flex justify-between items-center p-4 rounded-lg hover:bg-dex-secondary/5">
              <div>
                <p className="text-white font-medium text-base">Login from new location</p>
                <p className="text-sm text-dex-text-secondary">iPhone • New York, NY</p>
              </div>
              <p className="text-sm text-dex-text-secondary">May 15, 9:45 AM</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card className="bg-black border-dex-secondary/30 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white text-xl">Connected Accounts</CardTitle>
          <CardDescription className="text-dex-text-secondary text-base">
            Manage your connected social accounts and services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border-b border-dex-secondary/20 rounded-lg hover:bg-dex-secondary/5">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium text-base">Facebook</p>
                  <p className="text-sm text-dex-text-secondary">Connected</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="text-white min-h-[44px] px-4"
              >
                Disconnect
              </Button>
            </div>

            <div className="flex justify-between items-center p-4 border-b border-dex-secondary/20 rounded-lg hover:bg-dex-secondary/5">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-black border border-dex-secondary/30 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium text-base">Twitter</p>
                  <p className="text-sm text-dex-text-secondary">Not connected</p>
                </div>
              </div>
              <Button
                variant="primary"
                className="min-h-[44px] px-4 text-white"
              >
                Connect
              </Button>
            </div>

            <div className="flex justify-between items-center p-4 rounded-lg hover:bg-dex-secondary/5">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-purple-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium text-base">Instagram</p>
                  <p className="text-sm text-dex-text-secondary">Not connected</p>
                </div>
              </div>
              <Button
                variant="primary"
                className="min-h-[44px] px-4 text-white"
              >
                Connect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-dex-dark border-dex-secondary/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Save Changes?</AlertDialogTitle>
            <AlertDialogDescription className="text-dex-text-secondary">
              Are you sure you want to save these changes to your profile?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-transparent border-dex-secondary/30 text-white hover:bg-dex-secondary/10"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-dex-primary text-white hover:bg-dex-primary/90"
              onClick={() => onSubmit(getValues())}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProfileSettingsPage;
