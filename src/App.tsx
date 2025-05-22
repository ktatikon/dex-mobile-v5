
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { KYCProvider } from "@/contexts/KYCContext";
import PrivateRoute from "@/components/PrivateRoute";
import DexNavigation from "@/components/DexNavigation";
import DexHeader from "@/components/DexHeader";
import HomePage from "./pages/HomePage";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import TradePage from "./pages/TradePage";
import ExplorePage from "./pages/ExplorePage";
import PortfolioPage from "./pages/PortfolioPage";
import SettingsPage from "./pages/SettingsPage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import WalletPage from "./pages/WalletPage";
import ActivityPage from "./pages/ActivityPage";
import BuyPage from "./pages/BuyPage";
import SellPage from "./pages/SellPage";
import LimitPage from "./pages/LimitPage";
import SendPage from "./pages/SendPage";
import ReceivePage from "./pages/ReceivePage";
import KYCPage from "./pages/KYCPage";
import NotificationsPage from "./pages/NotificationsPage";
import SecurityPage from "./pages/SecurityPage";
import FAQPage from "./pages/FAQPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import { useState } from "react";

const queryClient = new QueryClient();

const App = () => {
  const [wallet, setWallet] = useState(null);

  const handleConnectWallet = () => {
    // Mock wallet connection
    setWallet({
      address: '0x1234...5678',
      balance: '10.5',
      network: 'Ethereum'
    });
  };

  const handleDisconnectWallet = () => {
    setWallet(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <KYCProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen dark bg-gradient-to-br from-dex-dark via-dex-primary/10 to-dex-secondary/10">
                <Routes>
                <Route path="/auth" element={<AuthPage />} />
                <Route
                  path="/"
                  element={
                    <PrivateRoute>
                      <DexHeader
                        wallet={wallet}
                        onConnectWallet={handleConnectWallet}
                        onDisconnectWallet={handleDisconnectWallet}
                      />
                      <div className="pt-16 pb-20">
                        <div className="container mx-auto px-4 mb-4">
                          <HomePage />
                        </div>
                        <DexNavigation />
                      </div>
                    </PrivateRoute>
                  }
                />
              <Route
                path="/trade"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <TradePage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />

              <Route
                path="/wallet"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <WalletPage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/activity"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <ActivityPage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/explore"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <ExplorePage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/portfolio"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <PortfolioPage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/buy"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <BuyPage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/sell"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <SellPage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/limit"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <LimitPage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/send"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <SendPage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/receive"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <ReceivePage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <SettingsPage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/profile-settings"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <ProfileSettingsPage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/kyc"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <KYCPage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/transactions"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <ActivityPage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <NotificationsPage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/security"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <SecurityPage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/faq"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <FAQPage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/about"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <AboutPage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/contact"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <ContactPage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
        </KYCProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
