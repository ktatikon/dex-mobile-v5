
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';

const KYCForm = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    dateOfBirth: '',
    address: '',
    governmentId: null as File | null,
  });

  // Check if we have a redirect path from location state or sessionStorage
  const redirectPath = location.state?.from?.pathname || sessionStorage.getItem('redirectAfterKyc') || '/';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, governmentId: e.target.files[0] });
    }
  };

  // Add a state to track if KYC is submitted successfully
  const [kycSubmitted, setKycSubmitted] = useState(false);

  // Effect to handle auto-approval and navigation
  useEffect(() => {
    if (kycSubmitted && user) {
      // For demo purposes, auto-approve KYC after submission
      const approveKyc = async () => {
        try {
          const { data: userData } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', user.id)
            .single();

          if (userData) {
            await supabase
              .from('kyc')
              .update({ status: 'approved' })
              .eq('user_id', userData.id);

            // Navigate to the original path or home
            // Use window.location for a full page refresh to ensure clean state
            window.location.href = redirectPath;
            // Clear the stored path
            sessionStorage.removeItem('redirectAfterKyc');
          }
        } catch (error) {
          console.error('Error auto-approving KYC:', error);
        }
      };

      // Set a timer to auto-approve
      const timer = setTimeout(() => {
        approveKyc();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [kycSubmitted, user, navigate, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Upload ID document
      let governmentIdUrl = '';
      if (formData.governmentId) {
        const fileName = `${user.id}/${Date.now()}_${formData.governmentId.name}`;
        const { error: uploadError, data } = await supabase.storage
          .from('kyc')
          .upload(fileName, formData.governmentId);

        if (uploadError) throw uploadError;
        governmentIdUrl = data.path;
      }

      // Get user's ID from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      let userId;

      if (userError) {
        // If user doesn't exist in the users table, create one
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            auth_id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || 'User',
            phone: user.user_metadata?.phone || null,
          })
          .select('id')
          .single();

        if (createError) throw createError;
        userId = newUser?.id;
      } else {
        userId = userData.id;
      }

      // Submit KYC data
      if (userId) {
        const { error: kycError } = await supabase.from('kyc').insert({
          user_id: userId,
          government_id_url: governmentIdUrl,
          date_of_birth: formData.dateOfBirth,
          address: formData.address,
          status: 'pending', // Set initial status
          submitted_at: new Date().toISOString(),
        });

        if (kycError) throw kycError;

        toast({
          title: "Success",
          description: "Your KYC information has been submitted for review.",
        });

        // Mark KYC as submitted to trigger the auto-approval effect
        setKycSubmitted(true);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-dex-dark via-dex-primary/20 to-dex-secondary/20 p-4">
      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() => {
            // Force navigation to home page
            window.location.href = '/';
          }}
          className="bg-dex-dark/50 text-white hover:bg-dex-dark hover:text-dex-accent border-dex-primary/30"
        >
          Back to Home
        </Button>
      </div>

      <Card className="w-full max-w-md bg-dex-dark/80 backdrop-blur-lg border border-dex-primary/30 text-white shadow-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">KYC Verification</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth" className="text-white">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="bg-dex-dark/70 border-dex-primary/30 text-white placeholder-gray-400 focus:ring-dex-accent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-white">Address</Label>
              <Input
                id="address"
                required
                placeholder="Enter your full address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="bg-dex-dark/70 border-dex-primary/30 text-white placeholder-gray-400 focus:ring-dex-accent"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="governmentId" className="text-white">Government ID</Label>
              <Input
                id="governmentId"
                type="file"
                required
                accept="image/*"
                onChange={handleFileChange}
                className="bg-dex-dark/70 border-dex-primary/30 text-white file:text-white file:bg-dex-primary/50 file:border-0 file:px-4 file:py-2 file:rounded-md"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-dex-accent hover:bg-dex-accent/90 text-white"
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit KYC'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default KYCForm;
