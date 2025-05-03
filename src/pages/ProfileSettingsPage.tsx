import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Globe,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ProfileSettingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mock user data
  const [formData, setFormData] = useState({
    displayName: 'John Doe',
    email: user?.email || 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    bio: 'Crypto enthusiast and blockchain developer. Passionate about DeFi and Web3 technologies.',
    location: 'San Francisco, CA',
    website: 'https://johndoe.crypto',
    birthdate: '1990-01-01'
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // In a real app, you would save to backend here
    setIsEditing(false);
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved successfully.",
      variant: "default",
    });
  };

  const handleCancel = () => {
    // Reset form data and exit edit mode
    setIsEditing(false);
  };

  const handleUploadPhoto = () => {
    // In a real app, this would open a file picker
    toast({
      title: "Feature Coming Soon",
      description: "Profile photo upload will be available in a future update.",
      variant: "default",
    });
  };

  return (
    <div className="container mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => navigate('/settings')}
        >
          <ArrowLeft className="text-white" size={20} />
        </Button>
        <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
      </div>

      {/* Profile Photo */}
      <Card className="bg-dex-dark/80 border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10 overflow-hidden">
        <div className="relative">
          <div className="h-32 bg-gradient-to-r from-dex-primary to-dex-secondary/70"></div>
          <div className="absolute -bottom-16 left-4">
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-dex-dark">
                <AvatarImage src="/placeholder-avatar.svg" alt="Profile" />
                <AvatarFallback className="bg-dex-secondary/20 text-white text-4xl">
                  JD
                </AvatarFallback>
              </Avatar>
              <Button
                variant="glossy"
                size="icon"
                className="absolute bottom-2 right-2 rounded-full h-8 w-8"
                onClick={handleUploadPhoto}
              >
                <Camera size={16} className="text-black" />
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="pt-20 pb-6">
          {!isEditing ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-white">{formData.displayName}</h2>
                <p className="text-gray-400">{formData.email}</p>
              </div>

              <p className="text-white">{formData.bio}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-400">
                  <Phone size={16} className="text-dex-secondary" />
                  <span>{formData.phone}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-400">
                  <MapPin size={16} className="text-dex-secondary" />
                  <span>{formData.location}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-400">
                  <Globe size={16} className="text-dex-secondary" />
                  <span>{formData.website}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-400">
                  <Calendar size={16} className="text-dex-secondary" />
                  <span>{formData.birthdate}</span>
                </div>
              </div>

              <Button
                variant="glossy"
                className="mt-4"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="displayName" className="text-white">Display Name</Label>
                  <Input
                    id="displayName"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleChange}
                    className="bg-dex-dark border-dex-secondary/30 text-white"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-white">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="bg-dex-dark border-dex-secondary/30 text-white"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone" className="text-white">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="bg-dex-dark border-dex-secondary/30 text-white"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bio" className="text-white">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    className="bg-dex-dark border-dex-secondary/30 text-white min-h-[100px]"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location" className="text-white">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="bg-dex-dark border-dex-secondary/30 text-white"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="website" className="text-white">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="bg-dex-dark border-dex-secondary/30 text-white"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="birthdate" className="text-white">Birthdate</Label>
                  <Input
                    id="birthdate"
                    name="birthdate"
                    type="date"
                    value={formData.birthdate}
                    onChange={handleChange}
                    className="bg-dex-dark border-dex-secondary/30 text-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="glossy"
                  className="flex-1"
                  onClick={handleSave}
                >
                  <Check size={16} className="mr-2" />
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-dex-secondary/50 text-white"
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Activity */}
      <Card className="bg-dex-dark/80 border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white">Account Activity</CardTitle>
          <CardDescription className="text-gray-400">
            Recent login activity and security events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 border-b border-dex-secondary/10">
              <div>
                <p className="text-white font-medium">Login from new device</p>
                <p className="text-xs text-gray-400">MacBook Pro • San Francisco, CA</p>
              </div>
              <p className="text-xs text-gray-400">Today, 10:30 AM</p>
            </div>

            <div className="flex justify-between items-center p-3 border-b border-dex-secondary/10">
              <div>
                <p className="text-white font-medium">Password changed</p>
                <p className="text-xs text-gray-400">Security update</p>
              </div>
              <p className="text-xs text-gray-400">Yesterday, 2:15 PM</p>
            </div>

            <div className="flex justify-between items-center p-3">
              <div>
                <p className="text-white font-medium">Login from new location</p>
                <p className="text-xs text-gray-400">iPhone • New York, NY</p>
              </div>
              <p className="text-xs text-gray-400">May 15, 9:45 AM</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card className="bg-dex-dark/80 border-dex-secondary/30 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white">Connected Accounts</CardTitle>
          <CardDescription className="text-gray-400">
            Manage your connected social accounts and services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 border-b border-dex-secondary/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">Facebook</p>
                  <p className="text-xs text-gray-400">Connected</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="border-dex-secondary/30 text-white">
                Disconnect
              </Button>
            </div>

            <div className="flex justify-between items-center p-3 border-b border-dex-secondary/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">Twitter</p>
                  <p className="text-xs text-gray-400">Not connected</p>
                </div>
              </div>
              <Button variant="glossy" size="sm">
                Connect
              </Button>
            </div>

            <div className="flex justify-between items-center p-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-medium">Instagram</p>
                  <p className="text-xs text-gray-400">Not connected</p>
                </div>
              </div>
              <Button variant="glossy" size="sm">
                Connect
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettingsPage;
