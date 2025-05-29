/**
 * ENHANCED WALLET CONNECTION MANAGER
 * 
 * Fixed hot and cold wallet connection flows with proper error handling,
 * redirect mechanisms, and comprehensive device support.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Wallet,
  Flame,
  Shield,
  Usb,
  Bluetooth,
  QrCode,
  Camera,
  Download,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Info
} from 'lucide-react';

// Import services
import { connectHotWallet, HOT_WALLET_OPTIONS } from '@/services/hotWalletService';
import { 
  enhancedHardwareWalletService, 
  HARDWARE_WALLETS,
  ConnectionResult 
} from '@/services/enhancedHardwareWalletService';
import { comprehensiveWalletService } from '@/services/comprehensiveWalletService';

interface EnhancedWalletConnectionManagerProps {
  onWalletConnected?: (address: string, type: 'hot' | 'hardware') => void;
  className?: string;
}

const EnhancedWalletConnectionManager: React.FC<EnhancedWalletConnectionManagerProps> = ({
  onWalletConnected,
  className = ''
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // State Management
  const [showHotWalletDialog, setShowHotWalletDialog] = useState(false);
  const [showHardwareWalletDialog, setShowHardwareWalletDialog] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'error'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [selectedHardwareWallet, setSelectedHardwareWallet] = useState<string>('');
  const [selectedConnectionMethod, setSelectedConnectionMethod] = useState<'usb' | 'bluetooth' | 'qr'>('usb');
  const [connectedDevices, setConnectedDevices] = useState<any[]>([]);

  /**
   * Handle hot wallet connection with proper error handling and redirects
   */
  const handleHotWalletConnection = async (walletId: string) => {
    if (!user) return;

    setConnecting(true);
    setConnectionStatus('connecting');
    setConnectionProgress(0);
    setConnectionMessage(`Connecting to ${walletId}...`);

    try {
      // Simulate connection progress
      const progressInterval = setInterval(() => {
        setConnectionProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Find wallet configuration
      const wallet = HOT_WALLET_OPTIONS.find(w => w.id === walletId);
      if (!wallet) {
        throw new Error(`Wallet configuration not found for ${walletId}`);
      }

      setConnectionMessage(`Requesting access to ${wallet.name}...`);

      // Attempt connection
      const address = await connectHotWallet(wallet);

      clearInterval(progressInterval);
      setConnectionProgress(100);
      setConnectionStatus('success');
      setConnectionMessage(`Successfully connected to ${wallet.name}!`);

      // Create wallet in database
      await comprehensiveWalletService.createWallet(
        user.id,
        `${wallet.name} Wallet`,
        'hot',
        'ethereum',
        undefined,
        undefined,
        wallet.id
      );

      toast({
        title: "Wallet Connected",
        description: `${wallet.name} has been connected successfully`,
      });

      // Callback and navigation
      if (onWalletConnected) {
        onWalletConnected(address, 'hot');
      }

      // Close dialog after delay
      setTimeout(() => {
        setShowHotWalletDialog(false);
        setConnectionStatus('idle');
        setConnectionProgress(0);
      }, 2000);

    } catch (error: any) {
      setConnectionStatus('error');
      setConnectionProgress(0);
      
      console.error('Hot wallet connection error:', error);
      
      // Handle specific error types
      if (error.message.includes('not found') || error.message.includes('not detected')) {
        setConnectionMessage(`${error.message} The download page has been opened in a new tab.`);
        toast({
          title: "Wallet Not Found",
          description: error.message,
          variant: "destructive",
        });
      } else if (error.message.includes('rejected')) {
        setConnectionMessage(error.message);
        toast({
          title: "Connection Rejected",
          description: "Please approve the connection request in your wallet.",
          variant: "destructive",
        });
      } else {
        setConnectionMessage(`Connection failed: ${error.message}`);
        toast({
          title: "Connection Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    } finally {
      setConnecting(false);
    }
  };

  /**
   * Handle hardware wallet connection with device-specific protocols
   */
  const handleHardwareWalletConnection = async (deviceType: string, connectionMethod: 'usb' | 'bluetooth' | 'qr') => {
    if (!user) return;

    setConnecting(true);
    setConnectionStatus('connecting');
    setConnectionProgress(0);
    setConnectionMessage(`Connecting to ${deviceType} via ${connectionMethod}...`);

    try {
      // Simulate connection progress
      const progressInterval = setInterval(() => {
        setConnectionProgress(prev => Math.min(prev + 15, 85));
      }, 300);

      const device = HARDWARE_WALLETS[deviceType];
      if (!device) {
        throw new Error(`Hardware wallet not supported: ${deviceType}`);
      }

      setConnectionMessage(`Establishing ${connectionMethod.toUpperCase()} connection...`);

      // Attempt hardware wallet connection
      const result: ConnectionResult = await enhancedHardwareWalletService.connectHardwareWallet(
        deviceType,
        connectionMethod
      );

      clearInterval(progressInterval);

      if (!result.success) {
        throw new Error(result.error || 'Hardware wallet connection failed');
      }

      setConnectionProgress(100);
      setConnectionStatus('success');
      setConnectionMessage(`Successfully connected to ${device.name}!`);

      // Create wallet in database
      if (result.address) {
        await comprehensiveWalletService.createWallet(
          user.id,
          `${device.name} Hardware`,
          'hardware',
          'ethereum',
          undefined,
          undefined,
          deviceType
        );

        toast({
          title: "Hardware Wallet Connected",
          description: `${device.name} has been connected successfully`,
        });

        // Callback and navigation
        if (onWalletConnected) {
          onWalletConnected(result.address, 'hardware');
        }
      }

      // Update connected devices
      setConnectedDevices(enhancedHardwareWalletService.getConnectedDevices());

      // Close dialog after delay
      setTimeout(() => {
        setShowHardwareWalletDialog(false);
        setConnectionStatus('idle');
        setConnectionProgress(0);
      }, 2000);

    } catch (error: any) {
      setConnectionStatus('error');
      setConnectionProgress(0);
      
      console.error('Hardware wallet connection error:', error);
      
      setConnectionMessage(`Connection failed: ${error.message}`);
      toast({
        title: "Hardware Wallet Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  /**
   * Get connection method icon
   */
  const getConnectionMethodIcon = (method: string) => {
    switch (method) {
      case 'usb':
        return <Usb size={20} />;
      case 'bluetooth':
        return <Bluetooth size={20} />;
      case 'qr':
        return <QrCode size={20} />;
      default:
        return <Wallet size={20} />;
    }
  };

  /**
   * Get status icon
   */
  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connecting':
        return <Loader2 size={20} className="animate-spin" />;
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={20} className="text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Connection Options */}
      <Card className="p-6 bg-dex-dark border-dex-secondary/30">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-white">
            <Wallet className="h-6 w-6 text-dex-primary" />
            Connect Your Wallet
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Hot Wallet Connection */}
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center gap-3 border-dex-secondary/30 text-white hover:bg-orange-500/10 hover:border-orange-500/30 transition-all"
              onClick={() => setShowHotWalletDialog(true)}
              disabled={connecting}
            >
              <Flame size={32} className="text-orange-500" />
              <div className="text-center">
                <div className="font-medium">Hot Wallets</div>
                <div className="text-xs text-gray-400">MetaMask, Phantom, Trust Wallet</div>
              </div>
            </Button>

            {/* Hardware Wallet Connection */}
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center gap-3 border-dex-secondary/30 text-white hover:bg-blue-500/10 hover:border-blue-500/30 transition-all"
              onClick={() => setShowHardwareWalletDialog(true)}
              disabled={connecting}
            >
              <Shield size={32} className="text-blue-500" />
              <div className="text-center">
                <div className="font-medium">Hardware Wallets</div>
                <div className="text-xs text-gray-400">Ledger, Trezor, Keystone</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Connected Devices */}
      {connectedDevices.length > 0 && (
        <Card className="p-4 bg-dex-dark border-dex-secondary/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">Connected Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {connectedDevices.map((device, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-dex-secondary/20 rounded">
                  <div className="flex items-center gap-2">
                    {getConnectionMethodIcon(device.connectionMethod)}
                    <span className="text-white text-sm">{device.type}</span>
                    <Badge variant="outline" className="text-xs">
                      {device.connectionMethod.toUpperCase()}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => enhancedHardwareWalletService.disconnectDevice(device.id)}
                    className="text-gray-400 hover:text-white"
                  >
                    Disconnect
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hot Wallet Connection Dialog */}
      <Dialog open={showHotWalletDialog} onOpenChange={setShowHotWalletDialog}>
        <DialogContent className="bg-dex-dark border-dex-secondary/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="text-orange-500" />
              Connect Hot Wallet
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {connectionStatus === 'idle' && (
              <>
                <p className="text-gray-400 text-sm">
                  Choose a hot wallet provider. If not installed, you'll be redirected to download.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {HOT_WALLET_OPTIONS.map((wallet) => (
                    <Button
                      key={wallet.id}
                      variant="outline"
                      onClick={() => handleHotWalletConnection(wallet.id)}
                      disabled={connecting}
                      className="h-16 flex flex-col items-center gap-2 border-dex-secondary/30 text-white hover:bg-orange-500/10"
                    >
                      <Flame size={20} className="text-orange-500" />
                      <span className="text-xs">{wallet.name}</span>
                    </Button>
                  ))}
                </div>
              </>
            )}

            {connectionStatus !== 'idle' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon()}
                  <span className="text-sm">{connectionMessage}</span>
                </div>
                
                {connectionStatus === 'connecting' && (
                  <Progress value={connectionProgress} className="w-full" />
                )}

                {connectionStatus === 'error' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setConnectionStatus('idle');
                        setConnectionMessage('');
                      }}
                      className="border-dex-secondary/30 text-white"
                    >
                      Try Again
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowHotWalletDialog(false)}
                      className="border-dex-secondary/30 text-white"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hardware Wallet Connection Dialog */}
      <Dialog open={showHardwareWalletDialog} onOpenChange={setShowHardwareWalletDialog}>
        <DialogContent className="bg-dex-dark border-dex-secondary/30 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="text-blue-500" />
              Connect Hardware Wallet
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {connectionStatus === 'idle' && (
              <Tabs defaultValue="device" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-dex-secondary/20">
                  <TabsTrigger value="device" className="text-white">Select Device</TabsTrigger>
                  <TabsTrigger value="connection" className="text-white">Connection Method</TabsTrigger>
                </TabsList>
                
                <TabsContent value="device" className="space-y-4">
                  <p className="text-gray-400 text-sm">Choose your hardware wallet:</p>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.values(HARDWARE_WALLETS).map((device) => (
                      <Button
                        key={device.id}
                        variant={selectedHardwareWallet === device.id ? "default" : "outline"}
                        onClick={() => setSelectedHardwareWallet(device.id)}
                        className="h-16 flex flex-col items-center gap-2 border-dex-secondary/30 text-white"
                      >
                        <Shield size={20} className="text-blue-500" />
                        <span className="text-xs">{device.name}</span>
                      </Button>
                    ))}
                  </div>
                </TabsContent>
                
                <TabsContent value="connection" className="space-y-4">
                  {selectedHardwareWallet && (
                    <>
                      <p className="text-gray-400 text-sm">
                        Choose connection method for {HARDWARE_WALLETS[selectedHardwareWallet]?.name}:
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        {HARDWARE_WALLETS[selectedHardwareWallet]?.supportedConnections.map((method) => (
                          <Button
                            key={method}
                            variant={selectedConnectionMethod === method ? "default" : "outline"}
                            onClick={() => setSelectedConnectionMethod(method)}
                            className="h-16 flex flex-col items-center gap-2 border-dex-secondary/30 text-white"
                          >
                            {getConnectionMethodIcon(method)}
                            <span className="text-xs">{method.toUpperCase()}</span>
                          </Button>
                        ))}
                      </div>
                      
                      <Button
                        onClick={() => handleHardwareWalletConnection(selectedHardwareWallet, selectedConnectionMethod)}
                        disabled={connecting || !selectedHardwareWallet}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        Connect {HARDWARE_WALLETS[selectedHardwareWallet]?.name}
                      </Button>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            )}

            {connectionStatus !== 'idle' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon()}
                  <span className="text-sm">{connectionMessage}</span>
                </div>
                
                {connectionStatus === 'connecting' && (
                  <Progress value={connectionProgress} className="w-full" />
                )}

                {connectionStatus === 'error' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setConnectionStatus('idle');
                        setConnectionMessage('');
                      }}
                      className="border-dex-secondary/30 text-white"
                    >
                      Try Again
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowHardwareWalletDialog(false)}
                      className="border-dex-secondary/30 text-white"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedWalletConnectionManager;
