
/**
 * LEGACY FILE - DO NOT USE
 *
 * This file is a legacy component that is not used in the main application.
 * It references the deleted WalletPage component.
 * The main application routing is handled in App.tsx.
 *
 * This file is kept for reference only and will be removed in a future update.
 */

import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import DexHeader from '@/components/DexHeader';
import DexBottomNav from '@/components/DexBottomNav';
import HomePage from '@/pages/HomePage';
import SwapPage from '@/pages/SwapPage';
// import WalletPage from '@/pages/WalletPage'; // REMOVED - Use WalletDashboardPage instead
import ActivityPage from '@/pages/ActivityPage';
import SplashScreen from '@/components/SplashScreen';
import { mockWallet } from '@/services/mockData';
import { WalletInfo } from '@/types';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const { toast } = useToast();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);
  const [wallet, setWallet] = useState<WalletInfo | null>(null);

  useEffect(() => {
    // Auto connect wallet for demo purposes
    const autoConnectWallet = () => {
      if (!wallet) {
        setWallet(mockWallet);
      }
    };

    // Wait for splash screen to complete
    if (!showSplash) {
      autoConnectWallet();
    }
  }, [showSplash, wallet]);

  const handleConnectWallet = () => {
    setWallet(mockWallet);
    toast({
      title: "Wallet Connected",
      description: "Successfully connected to your wallet",
    });
  };

  const handleDisconnectWallet = () => {
    setWallet(null);
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <DexHeader
        wallet={wallet}
        onConnectWallet={handleConnectWallet}
        onDisconnectWallet={handleDisconnectWallet}
      />

      <main className="flex-1 px-4 py-4 pb-20 max-w-xl mx-auto w-full">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/swap" element={<SwapPage />} />
          {/* <Route path="/wallet" element={<WalletPage />} /> */}
          <Route path="/wallet" element={<div>Legacy route - use /wallet-dashboard instead</div>} />
          <Route path="/activity" element={<ActivityPage />} />
        </Routes>
      </main>

      <DexBottomNav activeRoute={location.pathname} />
    </div>
  );
};

export default Index;
