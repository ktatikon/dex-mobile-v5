import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HardwareWalletOption } from './HardwareWalletOptions';
import { Bluetooth, Usb, QrCode, Loader2, Check, X, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { BleClient } from '@capacitor-community/bluetooth-le';
import { Camera, CameraResultType } from '@capacitor/camera';

interface HardwareWalletConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: HardwareWalletOption | null;
  onConnect: (address: string) => void;
}

const HardwareWalletConnectionModal: React.FC<HardwareWalletConnectionModalProps> = ({
  isOpen,
  onClose,
  wallet,
  onConnect
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('usb');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Initialize the active tab based on the wallet's supported connection methods
  React.useEffect(() => {
    if (wallet) {
      if (wallet.supportsUSB) {
        setActiveTab('usb');
      } else if (wallet.supportsBluetooth) {
        setActiveTab('bluetooth');
      } else if (wallet.supportsQRCode) {
        setActiveTab('qrcode');
      }
    }
  }, [wallet]);

  // Handle Bluetooth scanning
  const handleBluetoothScan = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast({
        title: 'Platform Not Supported',
        description: 'Bluetooth scanning is only available on native mobile platforms.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsScanning(true);
      setDevices([]);
      
      // Initialize Bluetooth
      await BleClient.initialize();
      
      // Request Bluetooth permissions
      await BleClient.requestLEScan(
        { services: [] },
        (result) => {
          // Add device to the list if it's not already there
          setDevices((prevDevices) => {
            if (!prevDevices.some((d) => d.device.deviceId === result.device.deviceId)) {
              return [...prevDevices, result];
            }
            return prevDevices;
          });
        }
      );
      
      // Stop scanning after 10 seconds
      setTimeout(async () => {
        await BleClient.stopLEScan();
        setIsScanning(false);
      }, 10000);
    } catch (error) {
      console.error('Error scanning for Bluetooth devices:', error);
      setIsScanning(false);
      toast({
        title: 'Bluetooth Error',
        description: 'Failed to scan for Bluetooth devices. Please check your permissions.',
        variant: 'destructive',
      });
    }
  };

  // Handle USB connection
  const handleUSBConnect = async () => {
    try {
      setConnectionStatus('connecting');
      
      // Simulate USB connection (in a real implementation, this would use WebUSB API)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Generate a random wallet address for demonstration
      const address = `0x${Math.random().toString(16).substring(2, 42)}`;
      
      setConnectionStatus('connected');
      onConnect(address);
      
      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error connecting to USB device:', error);
      setConnectionStatus('error');
      setErrorMessage('Failed to connect to USB device. Please make sure it is properly connected and unlocked.');
    }
  };

  // Handle Bluetooth connection
  const handleBluetoothConnect = async (device: any) => {
    try {
      setSelectedDevice(device);
      setConnectionStatus('connecting');
      
      // Simulate Bluetooth connection (in a real implementation, this would use BLE API)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Generate a random wallet address for demonstration
      const address = `0x${Math.random().toString(16).substring(2, 42)}`;
      
      setConnectionStatus('connected');
      onConnect(address);
      
      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error connecting to Bluetooth device:', error);
      setConnectionStatus('error');
      setErrorMessage('Failed to connect to Bluetooth device. Please make sure it is in pairing mode and try again.');
    }
  };

  // Handle QR code scanning
  const handleQRCodeScan = async () => {
    if (!Capacitor.isNativePlatform()) {
      toast({
        title: 'Platform Not Supported',
        description: 'QR code scanning is only available on native mobile platforms.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setConnectionStatus('connecting');
      
      // Use Capacitor Camera API to scan QR code
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
      });
      
      // In a real implementation, you would process the QR code image here
      // For demonstration, we'll just generate a random wallet address
      const address = `0x${Math.random().toString(16).substring(2, 42)}`;
      
      setConnectionStatus('connected');
      onConnect(address);
      
      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error scanning QR code:', error);
      setConnectionStatus('error');
      setErrorMessage('Failed to scan QR code. Please try again.');
    }
  };

  // Handle retry
  const handleRetry = () => {
    setConnectionStatus('idle');
    setErrorMessage('');
    setSelectedDevice(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-dex-dark border-dex-secondary/30 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            {wallet ? `Connect ${wallet.name}` : 'Connect Hardware Wallet'}
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {wallet?.description || 'Select a connection method for your hardware wallet'}
          </DialogDescription>
        </DialogHeader>

        {wallet && (
          <Tabs defaultValue={activeTab} className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-4 bg-dex-dark/50 p-1.5 rounded-lg border border-dex-secondary/20 shadow-[0_2px_8px_rgba(0,0,0,0.2)] gap-1.5">
              {wallet.supportsUSB && (
                <TabsTrigger
                  value="usb"
                  className="flex items-center justify-center gap-2 py-2.5 px-2 h-12 min-h-[48px] rounded-lg text-center text-white transition-all duration-200
                  bg-dex-secondary text-dex-text-primary
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-dex-primary data-[state=active]:to-dex-primary/80
                  data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-dex-primary/20
                  data-[state=active]:border data-[state=active]:border-white/10"
                >
                  <Usb size={18} />
                  <span className="font-medium">USB</span>
                </TabsTrigger>
              )}
              {wallet.supportsBluetooth && (
                <TabsTrigger
                  value="bluetooth"
                  className="flex items-center justify-center gap-2 py-2.5 px-2 h-12 min-h-[48px] rounded-lg text-center text-white transition-all duration-200
                  bg-dex-secondary text-dex-text-primary
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-dex-primary data-[state=active]:to-dex-primary/80
                  data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-dex-primary/20
                  data-[state=active]:border data-[state=active]:border-white/10"
                >
                  <Bluetooth size={18} />
                  <span className="font-medium">Bluetooth</span>
                </TabsTrigger>
              )}
              {wallet.supportsQRCode && (
                <TabsTrigger
                  value="qrcode"
                  className="flex items-center justify-center gap-2 py-2.5 px-2 h-12 min-h-[48px] rounded-lg text-center text-white transition-all duration-200
                  bg-dex-secondary text-dex-text-primary
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-dex-primary data-[state=active]:to-dex-primary/80
                  data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-dex-primary/20
                  data-[state=active]:border data-[state=active]:border-white/10"
                >
                  <QrCode size={18} />
                  <span className="font-medium">QR Code</span>
                </TabsTrigger>
              )}
            </TabsList>

            {/* USB Connection Tab */}
            <TabsContent value="usb" className="mt-0">
              <div className="space-y-4">
                {connectionStatus === 'idle' && (
                  <>
                    <div className="bg-dex-secondary/10 rounded-lg p-4 border border-dex-secondary/20">
                      <h3 className="text-lg font-medium text-white mb-2">Connect via USB</h3>
                      <ol className="space-y-2 text-gray-400 list-decimal list-inside">
                        <li>Connect your {wallet.name} to your device using a USB cable</li>
                        <li>Unlock your {wallet.name} by entering your PIN</li>
                        <li>Click the Connect button below</li>
                      </ol>
                    </div>
                    <Button
                      variant="primary"
                      className="w-full min-h-[44px]"
                      onClick={handleUSBConnect}
                    >
                      <Usb size={18} className="mr-2" />
                      Connect {wallet.name}
                    </Button>
                  </>
                )}

                {connectionStatus === 'connecting' && (
                  <div className="flex flex-col items-center justify-center py-6">
                    <Loader2 size={48} className="text-dex-primary animate-spin mb-4" />
                    <p className="text-white text-center mb-2">Connecting to {wallet.name}</p>
                    <p className="text-gray-400 text-center text-sm">
                      Please follow the instructions on your device
                    </p>
                  </div>
                )}

                {connectionStatus === 'connected' && (
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="w-16 h-16 rounded-full bg-dex-positive/20 flex items-center justify-center mb-4">
                      <Check size={32} className="text-dex-positive" />
                    </div>
                    <p className="text-white text-center mb-2">Connected Successfully</p>
                    <p className="text-gray-400 text-center text-sm">
                      Your {wallet.name} wallet has been connected
                    </p>
                  </div>
                )}

                {connectionStatus === 'error' && (
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="w-16 h-16 rounded-full bg-dex-negative/20 flex items-center justify-center mb-4">
                      <X size={32} className="text-dex-negative" />
                    </div>
                    <p className="text-white text-center mb-2">Connection Failed</p>
                    <p className="text-gray-400 text-center text-sm mb-4">
                      {errorMessage}
                    </p>
                    <Button
                      variant="outline"
                      className="border-dex-secondary/30"
                      onClick={handleRetry}
                    >
                      <RefreshCw size={18} className="mr-2" />
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Bluetooth Connection Tab */}
            <TabsContent value="bluetooth" className="mt-0">
              <div className="space-y-4">
                {connectionStatus === 'idle' && (
                  <>
                    <div className="bg-dex-secondary/10 rounded-lg p-4 border border-dex-secondary/20">
                      <h3 className="text-lg font-medium text-white mb-2">Connect via Bluetooth</h3>
                      <ol className="space-y-2 text-gray-400 list-decimal list-inside">
                        <li>Turn on Bluetooth on your device</li>
                        <li>Put your {wallet.name} in pairing mode</li>
                        <li>Scan for devices and select your {wallet.name}</li>
                      </ol>
                    </div>

                    <Button
                      variant="primary"
                      className="w-full min-h-[44px]"
                      onClick={handleBluetoothScan}
                      disabled={isScanning}
                    >
                      {isScanning ? (
                        <>
                          <Loader2 size={18} className="mr-2 animate-spin" />
                          Scanning...
                        </>
                      ) : (
                        <>
                          <Bluetooth size={18} className="mr-2" />
                          Scan for Devices
                        </>
                      )}
                    </Button>

                    {devices.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-white font-medium mb-2">Available Devices</h4>
                        <div className="space-y-2">
                          {devices.map((device, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              className="w-full justify-between border-dex-secondary/30 text-white"
                              onClick={() => handleBluetoothConnect(device)}
                            >
                              <span>{device.device.name || `Device ${index + 1}`}</span>
                              <Bluetooth size={16} />
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {connectionStatus === 'connecting' && (
                  <div className="flex flex-col items-center justify-center py-6">
                    <Loader2 size={48} className="text-dex-primary animate-spin mb-4" />
                    <p className="text-white text-center mb-2">Connecting to {selectedDevice?.device.name || wallet.name}</p>
                    <p className="text-gray-400 text-center text-sm">
                      Please follow the instructions on your device
                    </p>
                  </div>
                )}

                {connectionStatus === 'connected' && (
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="w-16 h-16 rounded-full bg-dex-positive/20 flex items-center justify-center mb-4">
                      <Check size={32} className="text-dex-positive" />
                    </div>
                    <p className="text-white text-center mb-2">Connected Successfully</p>
                    <p className="text-gray-400 text-center text-sm">
                      Your {wallet.name} wallet has been connected
                    </p>
                  </div>
                )}

                {connectionStatus === 'error' && (
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="w-16 h-16 rounded-full bg-dex-negative/20 flex items-center justify-center mb-4">
                      <X size={32} className="text-dex-negative" />
                    </div>
                    <p className="text-white text-center mb-2">Connection Failed</p>
                    <p className="text-gray-400 text-center text-sm mb-4">
                      {errorMessage}
                    </p>
                    <Button
                      variant="outline"
                      className="border-dex-secondary/30"
                      onClick={handleRetry}
                    >
                      <RefreshCw size={18} className="mr-2" />
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* QR Code Connection Tab */}
            <TabsContent value="qrcode" className="mt-0">
              <div className="space-y-4">
                {connectionStatus === 'idle' && (
                  <>
                    <div className="bg-dex-secondary/10 rounded-lg p-4 border border-dex-secondary/20">
                      <h3 className="text-lg font-medium text-white mb-2">Connect via QR Code</h3>
                      <ol className="space-y-2 text-gray-400 list-decimal list-inside">
                        <li>Open your {wallet.name} app</li>
                        <li>Navigate to the QR code scanner in your wallet</li>
                        <li>Click the Scan QR Code button below</li>
                        <li>Scan the QR code displayed on your {wallet.name}</li>
                      </ol>
                    </div>
                    <Button
                      variant="primary"
                      className="w-full min-h-[44px]"
                      onClick={handleQRCodeScan}
                    >
                      <QrCode size={18} className="mr-2" />
                      Scan QR Code
                    </Button>
                  </>
                )}

                {connectionStatus === 'connecting' && (
                  <div className="flex flex-col items-center justify-center py-6">
                    <Loader2 size={48} className="text-dex-primary animate-spin mb-4" />
                    <p className="text-white text-center mb-2">Processing QR Code</p>
                    <p className="text-gray-400 text-center text-sm">
                      Please wait while we process the QR code
                    </p>
                  </div>
                )}

                {connectionStatus === 'connected' && (
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="w-16 h-16 rounded-full bg-dex-positive/20 flex items-center justify-center mb-4">
                      <Check size={32} className="text-dex-positive" />
                    </div>
                    <p className="text-white text-center mb-2">Connected Successfully</p>
                    <p className="text-gray-400 text-center text-sm">
                      Your {wallet.name} wallet has been connected
                    </p>
                  </div>
                )}

                {connectionStatus === 'error' && (
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="w-16 h-16 rounded-full bg-dex-negative/20 flex items-center justify-center mb-4">
                      <X size={32} className="text-dex-negative" />
                    </div>
                    <p className="text-white text-center mb-2">Connection Failed</p>
                    <p className="text-gray-400 text-center text-sm mb-4">
                      {errorMessage}
                    </p>
                    <Button
                      variant="outline"
                      className="border-dex-secondary/30"
                      onClick={handleRetry}
                    >
                      <RefreshCw size={18} className="mr-2" />
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <DialogFooter>
          {connectionStatus === 'idle' && (
            <Button
              variant="outline"
              className="border-dex-secondary/30 text-white min-h-[44px]"
              onClick={onClose}
            >
              <X size={18} className="mr-2" />
              Cancel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HardwareWalletConnectionModal;
