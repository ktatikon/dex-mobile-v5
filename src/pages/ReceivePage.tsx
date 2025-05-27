import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWalletData } from '@/hooks/useWalletData';
import { useToast } from '@/hooks/use-toast';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Copy,
  Download,
  Share2,
  Info,
  RefreshCw
} from 'lucide-react';
import TokenIcon from '@/components/TokenIcon';
import { Token } from '@/types';
import QRCode from 'react-qr-code';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ReceivePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { walletTokens, address, refreshData } = useWalletData();

  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [qrValue, setQrValue] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('address');

  // Get preselected token from location state if available
  useEffect(() => {
    if (location.state?.preSelectedToken) {
      setSelectedToken(location.state.preSelectedToken);
    } else if (walletTokens.length > 0) {
      setSelectedToken(walletTokens[0]);
    }
  }, [location.state, walletTokens]);

  // Update QR code value when token or amount changes
  useEffect(() => {
    if (selectedToken) {
      const baseValue = `${address}`;
      const tokenParam = `?token=${selectedToken.symbol}`;
      const amountParam = amount ? `&amount=${amount}` : '';

      setQrValue(baseValue + tokenParam + amountParam);
    } else {
      setQrValue(address);
    }
  }, [selectedToken, amount, address]);

  // Handle copy address to clipboard
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Address Copied",
      description: "Wallet address copied to clipboard",
    });
  };

  // Handle copy payment link to clipboard
  const handleCopyPaymentLink = () => {
    const baseUrl = window.location.origin;
    const paymentLink = `${baseUrl}/pay?address=${address}&token=${selectedToken?.symbol || ''}&amount=${amount || ''}`;

    navigator.clipboard.writeText(paymentLink);
    toast({
      title: "Payment Link Copied",
      description: "Payment link copied to clipboard",
    });
  };

  // Handle download QR code
  const handleDownloadQR = () => {
    const canvas = document.getElementById('qr-code-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const pngUrl = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `${selectedToken?.symbol || 'wallet'}-qr-code.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(svgUrl);
    };
    img.src = svgUrl;
  };

  // Handle share payment info
  const handleShare = async () => {
    const shareData = {
      title: `Receive ${selectedToken?.symbol || 'Crypto'}`,
      text: `Send ${amount ? amount + ' ' : ''}${selectedToken?.symbol || 'crypto'} to my wallet`,
      url: `${window.location.origin}/pay?address=${address}&token=${selectedToken?.symbol || ''}&amount=${amount || ''}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        throw new Error('Web Share API not supported');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      handleCopyPaymentLink();
    }
  };

  return (
    <div className="container mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => navigate('/wallet-dashboard')}
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </Button>
        <h1 className="text-2xl font-bold text-white">Receive Crypto</h1>
      </div>

      <Card className="bg-black border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-xl">Receive Details</CardTitle>
          <CardDescription className="text-dex-text-secondary">
            Select a token and share your address to receive crypto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Token Selection */}
            <div className="grid gap-2">
              <Label htmlFor="token" className="text-white">Select Token</Label>
              <Select
                value={selectedToken?.id}
                onValueChange={(value) => {
                  const token = walletTokens.find(t => t.id === value);
                  setSelectedToken(token || null);
                }}
              >
                <SelectTrigger className="bg-dex-dark border-dex-secondary/30 text-white min-h-[44px]">
                  <SelectValue placeholder="Select token">
                    {selectedToken && (
                      <div className="flex items-center gap-2">
                        <TokenIcon token={selectedToken} size="xs" />
                        <span>{selectedToken.symbol}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-dex-dark border-dex-secondary/30 text-white max-h-[300px]">
                  {walletTokens.map(token => (
                    <SelectItem key={token.id} value={token.id} className="py-2 text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">
                      <div className="flex items-center gap-2">
                        <TokenIcon token={token} size="xs" />
                        <span>{token.symbol}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Amount (Optional) */}
            <div className="grid gap-2">
              <Label htmlFor="amount" className="text-white">Amount (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="bg-dex-dark border-dex-secondary/30 text-white min-h-[44px]"
                  placeholder="0.00"
                  type="number"
                  step="any"
                />
                {selectedToken && (
                  <div className="bg-dex-dark border border-dex-secondary/30 rounded-md px-3 flex items-center min-w-[100px] justify-center">
                    <span className="text-white">{selectedToken.symbol}</span>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Enter an amount to include in the QR code (optional)
              </p>
            </div>

            {/* Tabs for Address and QR Code */}
            <Tabs defaultValue="address" className="w-full mt-6" onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-dex-dark/50 p-1.5 rounded-lg border border-dex-secondary/20 shadow-[0_2px_8px_rgba(0,0,0,0.2)] gap-1.5">
                <TabsTrigger
                  value="address"
                  className="flex items-center justify-center gap-2 py-2.5 px-2 h-12 min-h-[48px] rounded-lg text-center text-white transition-all duration-200
                  bg-dex-secondary text-dex-text-primary
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-dex-primary data-[state=active]:to-dex-primary/80
                  data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-dex-primary/20
                  data-[state=active]:border data-[state=active]:border-white/10"
                >
                  <span className="font-medium">Wallet Address</span>
                </TabsTrigger>
                <TabsTrigger
                  value="qr"
                  className="flex items-center justify-center gap-2 py-2.5 px-2 h-12 min-h-[48px] rounded-lg text-center text-white transition-all duration-200
                  bg-dex-secondary text-dex-text-primary
                  data-[state=active]:bg-gradient-to-r data-[state=active]:from-dex-primary data-[state=active]:to-dex-primary/80
                  data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-dex-primary/20
                  data-[state=active]:border data-[state=active]:border-white/10"
                >
                  <span className="font-medium">QR Code</span>
                </TabsTrigger>
              </TabsList>

              {/* Address Tab Content */}
              <TabsContent value="address" className="mt-0">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="wallet-address" className="text-white">Your Wallet Address</Label>
                    <div className="flex gap-2">
                      <Input
                        id="wallet-address"
                        value={address}
                        readOnly
                        className="bg-dex-dark border-dex-secondary/30 text-white min-h-[44px] font-mono text-sm"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="min-h-[44px] border-dex-secondary/30"
                        onClick={handleCopyAddress}
                      >
                        <Copy size={20} />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400">
                      Share this address to receive {selectedToken?.symbol || 'crypto'} in your wallet
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 mt-6">
                    <Button
                      variant="outline"
                      className="flex-1 min-h-[44px] border-dex-secondary/30 text-white"
                      onClick={handleCopyPaymentLink}
                    >
                      <Copy size={18} className="mr-2" />
                      Copy Payment Link
                    </Button>
                    <Button
                      variant="primary"
                      className="flex-1 min-h-[44px]"
                      onClick={handleShare}
                    >
                      <Share2 size={18} className="mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* QR Code Tab Content */}
              <TabsContent value="qr" className="mt-0">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="bg-white p-4 rounded-lg">
                    <QRCode
                      id="qr-code-svg"
                      value={qrValue}
                      size={200}
                      level="H"
                      fgColor="#000000"
                      bgColor="#FFFFFF"
                    />
                  </div>
                  <canvas id="qr-code-canvas" style={{ display: 'none' }} />

                  <div className="text-center">
                    <p className="text-white font-medium">
                      {selectedToken ? selectedToken.symbol : 'Wallet'} QR Code
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Scan this QR code to send {selectedToken?.symbol || 'crypto'} to your wallet
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    className="min-h-[44px] w-full sm:w-auto"
                    onClick={handleDownloadQR}
                  >
                    <Download size={18} className="mr-2" />
                    Download QR Code
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="bg-black border-dex-secondary/30 shadow-lg shadow-dex-secondary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-xl">Important Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-dex-text-secondary">
            <div className="flex gap-3">
              <Info className="text-dex-primary min-w-[20px]" size={20} />
              <p>Make sure to double-check the token you're receiving. Different tokens may have different network requirements.</p>
            </div>
            <div className="flex gap-3">
              <Info className="text-dex-primary min-w-[20px]" size={20} />
              <p>Some tokens may require a memo or tag in addition to the address. Check with the sender if needed.</p>
            </div>
            <div className="flex gap-3">
              <Info className="text-dex-primary min-w-[20px]" size={20} />
              <p>Transactions may take some time to be confirmed on the blockchain. Check your transaction history for updates.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReceivePage;
