
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 pt-16 pb-24">
      <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>
      <Card className="bg-dex-dark/80 border-dex-primary/30">
        <CardHeader>
          <CardTitle className="text-white">User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-white">
            <div>
              <label className="text-sm text-gray-400">Email</label>
              <p>{user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
