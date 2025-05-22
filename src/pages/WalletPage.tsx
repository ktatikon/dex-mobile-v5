
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TokenListItem from '@/components/TokenListItem';
import { calculateTotalBalance, formatCurrency, mockWallet } from '@/services/mockData';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Wallet, Shield, Flame, Plus, ChevronDown, Usb, Check, AlertCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import TokenIcon from '@/components/TokenIcon';

// Hardware wallet options
interface HardwareWallet {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
}

const hardwareWallets: HardwareWallet[] = [
  {
    id: 'ledger',
    name: 'Ledger',
    icon: '/hardware-wallets/ledger.svg',
    connected: false
  },
  {
    id: 'trezor',
    name: 'Trezor',
    icon: '/hardware-wallets/trezor.svg',
    connected: true
  },
  {
    id: 'safepal',
    name: 'SafePal',
    icon: '/hardware-wallets/safepal.svg',
    connected: false
  },
  {
    id: 'keystone',
    name: 'Keystone',
    icon: '/hardware-wallets/keystone.svg',
    connected: false
  },
  {
    id: 'ellipal',
    name: 'Ellipal',
    icon: '/hardware-wallets/ellipal.svg',
    connected: false
  }
];

// Additional altcoins for the Hot Wallet
const additionalAltcoins = [
  {
    id: "dogecoin",
    symbol: "DOGE",
    name: "Dogecoin",
    logo: "/crypto-icons/doge.svg",
    decimals: 8,
    balance: "1250.75",
    price: 0.12,
    priceChange24h: 2.3,
  },
  {
    id: "polkadot",
    symbol: "DOT",
    name: "Polkadot",
    logo: "/crypto-icons/dot.svg",
    decimals: 10,
    balance: "45.32",
    price: 5.87,
    priceChange24h: -1.2,
  },
  {
    id: "avalanche",
    symbol: "AVAX",
    name: "Avalanche",
    logo: "/crypto-icons/avax.svg",
    decimals: 18,
    balance: "12.75",
    price: 28.45,
    priceChange24h: 4.8,
  },
  {
    id: "chainlink",
    symbol: "LINK",
    name: "Chainlink",
    logo: "/crypto-icons/link.svg",
    decimals: 18,
    balance: "35.42",
    price: 13.28,
    priceChange24h: 3.1,
  },
  {
    id: "polygon",
    symbol: "MATIC",
    name: "Polygon",
    logo: "/crypto-icons/matic.svg",
    decimals: 18,
    balance: "325.67",
    price: 0.58,
    priceChange24h: 1.9,
  }
];

const WalletPage: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { address, tokens } = mockWallet;
  const [activeWalletType, setActiveWalletType] = useState<'hot' | 'cold'>('hot');
  const [selectedHardwareWallet, setSelectedHardwareWallet] = useState<HardwareWallet | null>(null);

  // Combine original tokens with additional altcoins
  const allTokens = [...tokens, ...additionalAltcoins];

  // Sort tokens by value (balance * price)
  const sortedTokens = [...allTokens].sort((a, b) => {
    const aValue = parseFloat(a.balance || '0') * (a.price || 0);
    const bValue = parseFloat(b.balance || '0') * (b.price || 0);
    return bValue - aValue;
  });

  // Split tokens between hot and cold wallets for demo purposes
  const hotWalletTokens = sortedTokens.slice(0, Math.ceil(sortedTokens.length / 2) + 2); // Add more tokens to hot wallet
  const coldWalletTokens = sortedTokens.slice(Math.ceil(sortedTokens.length / 2) + 2);

  const totalBalance = calculateTotalBalance(allTokens);
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

  const handleConnectHardwareWallet = (wallet: HardwareWallet) => {
    setSelectedHardwareWallet(wallet);
    toast({
      title: `Connecting to ${wallet.name}`,
      description: "Please follow the instructions on your device",
    });
  };

  const handleAddWallet = () => {
    toast({
      title: "Add New Wallet",
      description: "This feature will be available soon",
    });
  };

  return (
    <div className="pb-20">
      <Card className="p-4 mb-6 bg-dex-dark text-white border-dex-secondary/30 shadow-lg shadow-dex-secondary/10 backdrop-blur-sm">
        <h2 className="text-lg font-semibold mb-1">Wallet</h2>

        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="text-2xl font-bold text-white">${formatCurrency(totalBalance)}</div>
            <button
              className="text-sm text-gray-400 hover:text-white flex items-center gap-1 transition-all duration-200"
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

          <div className="flex gap-3">
            <Button
              variant="primary"
              className="h-11 min-w-[110px] px-4 py-3 rounded-lg flex items-center justify-center"
              onClick={() => navigate('/send')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
              >
                <path d="M12 5v14"/>
                <path d="M5 12h14"/>
              </svg>
              Send
            </Button>

            <Button
              variant="outline"
              className="h-11 min-w-[110px] px-4 py-3 rounded-lg border-dex-secondary/30 text-white flex items-center justify-center"
              onClick={() => navigate('/receive')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2"
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
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-dex-dark/50 p-1.5 rounded-lg border border-dex-secondary/20 shadow-[0_2px_8px_rgba(0,0,0,0.2)] gap-1.5">
            <TabsTrigger
              value="hot"
              className="flex items-center justify-center gap-2 py-2.5 px-2 h-12 min-h-[48px] rounded-lg text-center text-white transition-all duration-200
              bg-dex-secondary text-dex-text-primary
              data-[state=active]:bg-gradient-to-r data-[state=active]:from-dex-primary data-[state=active]:to-dex-primary/80
              data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-dex-primary/20
              data-[state=active]:border data-[state=active]:border-white/10"
              onClick={() => setActiveWalletType('hot')}
            >
              <Flame size={18} />
              <span className="font-medium">Hot Wallet</span>
            </TabsTrigger>
            <TabsTrigger
              value="cold"
              className="flex items-center justify-center gap-2 py-2.5 px-2 h-12 min-h-[48px] rounded-lg text-center text-white transition-all duration-200
              bg-dex-secondary text-dex-text-primary
              data-[state=active]:bg-gradient-to-r data-[state=active]:from-dex-primary data-[state=active]:to-dex-primary/80
              data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-dex-primary/20
              data-[state=active]:border data-[state=active]:border-white/10"
              onClick={() => setActiveWalletType('cold')}
            >
              <Shield size={18} />
              <span className="font-medium">Cold Wallet</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hot">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Hot Wallet</h2>
              <div className="text-sm font-medium text-white">
                ${formatCurrency(hotWalletBalance)}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full mb-4 flex justify-between items-center h-14 px-4 py-3 bg-dex-secondary/10 border-dex-secondary/20 text-white hover:bg-dex-secondary/20"
                >
                  <div className="flex items-center gap-3">
                    <Flame size={22} className="text-dex-primary" />
                    <span className="font-medium">Hot Wallet Cryptocurrencies</span>
                  </div>
                  <ChevronDown size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[calc(100vw-32px)] max-h-[70vh] overflow-y-auto bg-dex-tertiary border border-dex-secondary/30 text-white rounded-xl shadow-lg"
                align="center"
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-white font-semibold px-4 py-3 sticky top-0 bg-dex-tertiary z-10">
                  Select Cryptocurrency
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-dex-secondary/30" />

                {hotWalletTokens.map(token => (
                  <DropdownMenuItem
                    key={token.id}
                    className="py-4 px-4 hover:bg-dex-secondary/50 focus:bg-dex-secondary/50 cursor-pointer min-h-[72px]"
                    onClick={() => handleGoToSwap(token)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <TokenIcon token={token} size="sm" />
                        <div>
                          <div className="font-medium text-white">{token.symbol}</div>
                          <div className="text-sm text-gray-400">{token.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-white">
                          {parseFloat(token.balance || '0').toFixed(token.decimals > 6 ? 4 : 2)}
                        </div>
                        <div className="text-sm text-dex-primary">
                          ${(parseFloat(token.balance || '0') * (token.price || 0)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Card className="p-0 bg-dex-dark text-white border-dex-secondary/10 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.2)] backdrop-blur-sm mb-4">
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
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Cold Wallet</h2>
              <div className="text-sm font-medium text-white">
                ${formatCurrency(coldWalletBalance)}
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full mb-4 flex justify-between items-center h-14 px-4 py-3 bg-dex-secondary/10 border-dex-secondary/20 text-white hover:bg-dex-secondary/20"
                >
                  <div className="flex items-center gap-3">
                    <Shield size={22} className="text-dex-positive" />
                    <span className="font-medium">Hardware Wallet Connection</span>
                  </div>
                  <ChevronDown size={20} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[calc(100vw-32px)] max-h-[70vh] overflow-y-auto bg-dex-tertiary border border-dex-secondary/30 text-white rounded-xl shadow-lg"
                align="center"
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-white font-semibold px-4 py-3 sticky top-0 bg-dex-tertiary z-10">
                  Connect Hardware Wallet
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-dex-secondary/30" />

                {hardwareWallets.map(wallet => (
                  <DropdownMenuItem
                    key={wallet.id}
                    className="py-4 px-4 hover:bg-dex-secondary/50 focus:bg-dex-secondary/50 cursor-pointer min-h-[72px]"
                    onClick={() => handleConnectHardwareWallet(wallet)}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center">
                          <Usb size={22} className="text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{wallet.name}</div>
                          <div className="text-sm text-gray-400">Hardware Wallet</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {wallet.connected ? (
                          <div className="flex items-center text-dex-positive">
                            <Check size={18} className="mr-1" />
                            <span>Connected</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-400">
                            <AlertCircle size={18} className="mr-1" />
                            <span>Not Connected</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Card className="p-0 bg-dex-dark text-white border-dex-secondary/10 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.2)] backdrop-blur-sm mb-4">
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

            <Button
              variant="primary"
              className="w-full h-14 flex items-center justify-center gap-2 px-4 py-3 text-base font-medium shadow-md shadow-dex-primary/30 hover:shadow-lg hover:shadow-dex-primary/40"
              onClick={handleAddWallet}
            >
              <Plus size={22} strokeWidth={2.5} />
              <span className="font-medium">Add Wallet</span>
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default WalletPage;
