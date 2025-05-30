import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { performAMLCheck, validateAddress } from '@/services/amlService';
import type { AMLFormData, BlockchainNetwork, AMLCheckRequest } from '@/types/aml';
import { NETWORK_CONFIG, RISK_LEVEL_CONFIG } from '@/types/aml';

interface AMLCheckerProps {
  onCheckComplete?: (check: AMLCheckRequest) => void;
}

const AMLChecker: React.FC<AMLCheckerProps> = ({ onCheckComplete }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<AMLFormData>({
    chain: 'ethereum',
    address: ''
  });
  const [isChecking, setIsChecking] = useState(false);
  const [lastResult, setLastResult] = useState<AMLCheckRequest | null>(null);

  const handleChainChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      chain: value as BlockchainNetwork
    }));
    // Clear address when chain changes to avoid confusion
    setFormData(prev => ({
      ...prev,
      address: ''
    }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      address: e.target.value.trim()
    }));
  };

  const isValidAddress = formData.address && validateAddress(formData.address, formData.chain);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to perform AML checks",
        variant: "destructive",
      });
      return;
    }

    if (!isValidAddress) {
      toast({
        title: "Invalid Address",
        description: `Please enter a valid ${NETWORK_CONFIG[formData.chain].name} address`,
        variant: "destructive",
      });
      return;
    }

    setIsChecking(true);
    try {
      const result = await performAMLCheck(user.id, formData);
      
      if (result.success && result.checkId) {
        toast({
          title: "AML Check Completed",
          description: "Address analysis has been completed successfully",
        });
        
        // Trigger refresh of history if callback provided
        if (onCheckComplete) {
          // In a real implementation, we'd fetch the complete check data
          // For now, we'll create a mock result
          const mockCheck: AMLCheckRequest = {
            id: result.checkId,
            user_id: user.id,
            chain: formData.chain,
            address: formData.address,
            status: 'completed',
            created_at: new Date().toISOString()
          };
          onCheckComplete(mockCheck);
        }
        
        // Clear form
        setFormData(prev => ({ ...prev, address: '' }));
      } else {
        toast({
          title: "Check Failed",
          description: result.error || "Failed to perform AML check",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('AML check error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred during the AML check",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card className="bg-dex-dark/80 border-dex-secondary/30 shadow-lg shadow-dex-secondary/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Shield className="h-5 w-5 text-dex-primary" />
          AML Address Checker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Chain Selection */}
          <div className="space-y-2">
            <Label htmlFor="chain" className="text-white">
              Select Blockchain Network
            </Label>
            <Select value={formData.chain} onValueChange={handleChainChange}>
              <SelectTrigger className="bg-dex-secondary/20 border-dex-secondary/30 text-white">
                <SelectValue placeholder="Choose blockchain network" />
              </SelectTrigger>
              <SelectContent className="bg-dex-dark border-dex-secondary/30">
                {Object.entries(NETWORK_CONFIG).map(([key, config]) => (
                  <SelectItem 
                    key={key} 
                    value={key}
                    className="text-white hover:bg-dex-secondary/20"
                  >
                    {config.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Address Input */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-white">
              Recipient Wallet Address
            </Label>
            <Input
              id="address"
              type="text"
              placeholder={`Enter ${NETWORK_CONFIG[formData.chain].name} address (e.g., ${NETWORK_CONFIG[formData.chain].examples[0]})`}
              value={formData.address}
              onChange={handleAddressChange}
              className="bg-dex-secondary/20 border-dex-secondary/30 text-white placeholder:text-gray-400"
              disabled={isChecking}
            />
            {formData.address && !isValidAddress && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Invalid {NETWORK_CONFIG[formData.chain].name} address format
              </p>
            )}
            {formData.address && isValidAddress && (
              <p className="text-sm text-green-400 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Valid {NETWORK_CONFIG[formData.chain].name} address
              </p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-dex-primary hover:bg-dex-primary/80 text-white min-h-[44px]"
            disabled={!isValidAddress || isChecking}
          >
            {isChecking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing Address...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Check Address for Suspicious Activity
              </>
            )}
          </Button>
        </form>

        {/* Network Info */}
        <div className="p-4 bg-dex-secondary/10 rounded-lg border border-dex-secondary/20">
          <h4 className="text-sm font-medium text-white mb-2">
            {NETWORK_CONFIG[formData.chain].name} Address Format
          </h4>
          <p className="text-xs text-gray-400 mb-2">
            Example: {NETWORK_CONFIG[formData.chain].examples[0]}
          </p>
          <p className="text-xs text-gray-400">
            Length: {NETWORK_CONFIG[formData.chain].addressLength.join(' or ')} characters
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AMLChecker;
