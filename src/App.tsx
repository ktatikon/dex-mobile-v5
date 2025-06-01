
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { KYCProvider } from "@/contexts/KYCContext";
import { MarketDataProvider } from "@/contexts/MarketDataContext";
import { TestnetProvider } from "@/contexts/TestnetContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import PrivateRoute from "@/components/PrivateRoute";
import DexNavigation from "@/components/DexNavigation";
import DexHeader from "@/components/DexHeader";
import HomePageWithErrorBoundary from "./pages/HomePageWithErrorBoundary";
import NotFound from "./pages/NotFound";
import AuthPage from "./pages/AuthPage";
import TradePage from "./pages/TradePage";
import ExplorePage from "./pages/ExplorePage";
import PortfolioPageWithErrorBoundary from "./pages/PortfolioPageWithErrorBoundary";
import SettingsPage from "./pages/SettingsPage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";

import WalletGenerationPage from "./pages/WalletGenerationPage";
import WalletDetailsPage from "./pages/WalletDetailsPage";
import WalletDashboardPageWithErrorBoundary from "./pages/WalletDashboardPageWithErrorBoundary";
import WalletSettingsPage from "./pages/WalletSettingsPage";
import WalletImportPage from "./pages/WalletImportPage";
import TestnetWalletPageWithErrorBoundary from "./pages/TestnetWalletPageWithErrorBoundary";
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
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import LiveChatPage from "./pages/LiveChatPage";
import P2PComingSoonPage from "./pages/P2PComingSoonPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminUserManagementPage from "./pages/AdminUserManagementPage";

import AdminRoute from "./components/AdminRoute";
import AdminTestnetRoute from "./components/AdminTestnetRoute";
import AdminHeader from "./components/AdminHeader";
import { AdminProvider } from "./contexts/AdminContext";
import { useState } from "react";

const queryClient = new QueryClient();

const App = () => {
  const [wallet, setWallet] = useState(null);

  const handleConnectWallet = async () => {
    try {
      // Production wallet connection logic
      if (typeof window !== 'undefined' && window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts.length > 0) {
          setWallet({
            address: accounts[0],
            balance: '0.0', // Will be fetched from blockchain
            network: 'Ethereum'
          });
        }
      } else {
        console.warn('No wallet provider found');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const handleDisconnectWallet = () => {
    setWallet(null);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AdminProvider>
          <KYCProvider>
            <MarketDataProvider>
              <TestnetProvider>
                <ChatProvider>
                  <LanguageProvider>
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
                          <HomePageWithErrorBoundary />
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
                path="/wallet-generation"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <WalletGenerationPage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />


              <Route
                path="/wallet-details/:walletId"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <WalletDetailsPage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/wallet-dashboard"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <WalletDashboardPageWithErrorBoundary />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/wallet-settings"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <WalletSettingsPage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/wallet-import"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <WalletImportPage />
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
                        <PortfolioPageWithErrorBoundary />
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
                path="/testnet-wallet"
                element={
                  <PrivateRoute>
                    <AdminTestnetRoute requiredRole="report_viewer">
                      <DexHeader
                        wallet={wallet}
                        onConnectWallet={handleConnectWallet}
                        onDisconnectWallet={handleDisconnectWallet}
                      />
                      <div className="pt-16 pb-20">
                        <div className="container mx-auto px-4 mb-4">
                          <TestnetWalletPageWithErrorBoundary />
                        </div>
                        <DexNavigation />
                      </div>
                    </AdminTestnetRoute>
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
              <Route
                path="/privacy-policy"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <PrivacyPolicyPage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/terms-of-service"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <TermsOfServicePage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />
              <Route
                path="/live-chat"
                element={
                  <PrivateRoute>
                    <DexHeader
                      wallet={wallet}
                      onConnectWallet={handleConnectWallet}
                      onDisconnectWallet={handleDisconnectWallet}
                    />
                    <div className="pt-16 pb-20">
                      <div className="container mx-auto px-4 mb-4">
                        <LiveChatPage />
                      </div>
                      <DexNavigation />
                    </div>
                  </PrivateRoute>
                }
              />

              {/* P2P Coming Soon Route */}
              <Route
                path="/p2p-coming-soon"
                element={
                  <PrivateRoute>
                    <P2PComingSoonPage />
                  </PrivateRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <PrivateRoute>
                    <AdminRoute>
                      <AdminHeader title="Admin Dashboard" />
                      <div className="pt-16 pb-20">
                        <AdminDashboardPage />
                      </div>
                    </AdminRoute>
                  </PrivateRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <PrivateRoute>
                    <AdminRoute requiredRole="user_manager">
                      <AdminHeader title="User Management" />
                      <div className="pt-16 pb-20">
                        <AdminUserManagementPage />
                      </div>
                    </AdminRoute>
                  </PrivateRoute>
                }
              />



              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
              </BrowserRouter>
            </TooltipProvider>
                </LanguageProvider>
              </ChatProvider>
          </TestnetProvider>
        </MarketDataProvider>
      </KYCProvider>
      </AdminProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
