
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TokenListItem from '@/components/TokenListItem';
import { calculateTotalBalance, formatCurrency, mockWallet } from '@/services/mockData';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Wallet, Shield, Flame } from 'lucide-react';

const WalletPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { address, tokens } = mockWallet;
  const [activeWalletType, setActiveWalletType] = useState<'hot' | 'cold'>('hot');

  // Sort tokens by value (balance * price)
  const sortedTokens = [...tokens].sort((a, b) => {
    const aValue = parseFloat(a.balance || '0') * (a.price || 0);
    const bValue = parseFloat(b.balance || '0') * (b.price || 0);
    return bValue - aValue;
  });

  // Split tokens between hot and cold wallets for demo purposes
  const hotWalletTokens = sortedTokens.slice(0, Math.ceil(sortedTokens.length / 2));
  const coldWalletTokens = sortedTokens.slice(Math.ceil(sortedTokens.length / 2));

  const totalBalance = calculateTotalBalance(tokens);
  const hotWalletBalance = calculateTotalBalance(hotWalletTokens);
  const coldWalletBalance = calculateTotalBalance(coldWalletTokens);

  const handleCopyAddress = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(address)
        .then(() => {
          toast({
            title: "Address Copied",
            description: "Wallet address copied to clipboard",
          });
        })
        .catch(() => {
          toast({
            title: "Failed to copy",
            description: "Could not copy address to clipboard",
            variant: "destructive",
          });
        });
    }
  };

  const handleGoToSwap = (token: any) => {
    navigate('/swap', { state: { preSelectedToken: token } });
  };

  return (
    <div className="pb-20">
      <Card className="p-4 mb-6 bg-dex-dark text-white border-dex-secondary/30 shadow-lg shadow-dex-secondary/10 backdrop-blur-sm">
        <h2 className="text-lg font-semibold mb-1">Wallet</h2>

        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-2xl font-bold text-dex-secondary">${formatCurrency(totalBalance)}</div>
            <button
              className="text-sm text-gray-400 hover:text-dex-secondary flex items-center gap-1 transition-all duration-200"
              onClick={handleCopyAddress}
            >
              {address}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            </button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="glossy"
              size="sm"
              className="h-9"
              onClick={() => navigate('/send')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1"
              >
                <path d="M12 5v14"/>
                <path d="M5 12h14"/>
              </svg>
              Send
            </Button>

            <Button
              variant="glossy"
              size="sm"
              className="h-9"
              onClick={() => navigate('/receive')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-1"
              >
                <path d="M12 19V5"/>
                <path d="M5 12h14"/>
              </svg>
              Receive
            </Button>
          </div>
        </div>
      </Card>

      <div className="mb-4">
        <Tabs defaultValue="hot" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-dex-dark/50 p-1 rounded-lg border border-dex-secondary/20 shadow-md shadow-dex-secondary/10">
            <TabsTrigger
              value="hot"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-dex-secondary data-[state=active]:to-dex-secondary/80 data-[state=active]:text-black data-[state=active]:shadow-md data-[state=active]:shadow-dex-secondary/20 data-[state=active]:border data-[state=active]:border-white/10 transition-all duration-200"
              onClick={() => setActiveWalletType('hot')}
            >
              <Flame size={16} />
              <span>Hot Wallet</span>
            </TabsTrigger>
            <TabsTrigger
              value="cold"
              className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-dex-secondary data-[state=active]:to-dex-secondary/80 data-[state=active]:text-black data-[state=active]:shadow-md data-[state=active]:shadow-dex-secondary/20 data-[state=active]:border data-[state=active]:border-white/10 transition-all duration-200"
              onClick={() => setActiveWalletType('cold')}
            >
              <Shield size={16} />
              <span>Cold Wallet</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hot">
            <div className="mb-2 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Hot Wallet</h2>
              <div className="text-sm text-gray-400">
                ${formatCurrency(hotWalletBalance)}
              </div>
            </div>
            <Card className="p-0 bg-dex-dark text-white border-dex-secondary/30 shadow-lg shadow-dex-secondary/10 backdrop-blur-sm">
              {hotWalletTokens.map(token => (
                <TokenListItem
                  key={token.id}
                  token={token}
                  onSelect={() => handleGoToSwap(token)}
                />
              ))}
              {hotWalletTokens.length === 0 && (
                <div className="p-4 text-center text-gray-400">
                  No tokens in hot wallet
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="cold">
            <div className="mb-2 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Cold Wallet</h2>
              <div className="text-sm text-gray-400">
                ${formatCurrency(coldWalletBalance)}
              </div>
            </div>
            <Card className="p-0 bg-dex-dark text-white border-dex-secondary/30 shadow-lg shadow-dex-secondary/10 backdrop-blur-sm">
              {coldWalletTokens.map(token => (
                <TokenListItem
                  key={token.id}
                  token={token}
                  onSelect={() => handleGoToSwap(token)}
                />
              ))}
              {coldWalletTokens.length === 0 && (
                <div className="p-4 text-center text-gray-400">
                  No tokens in cold wallet
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WalletPage;
