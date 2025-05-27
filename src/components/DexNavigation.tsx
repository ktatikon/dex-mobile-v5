
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

// Custom icons with our color scheme
const HomeIcon = ({ size = 26, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const MarketIcon = ({ size = 26, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="2" y="2" width="20" height="20" rx="2" />
    <path d="M7 12v-2" />
    <path d="M12 12V8" />
    <path d="M17 12v-4" />
    <path d="M7 16v-2" />
    <path d="M12 16v-2" />
    <path d="M17 16v-2" />
  </svg>
);

const TradeIcon = ({ size = 26, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 3 L21 8 L16 13" />
    <path d="M21 8 L3 8" />
    <path d="M8 21 L3 16 L8 11" />
    <path d="M3 16 L21 16" />
  </svg>
);

const WalletIcon = ({ size = 26, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z" />
    <path d="M14 6V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2" />
    <path d="M18 12h.01" />
  </svg>
);

const ProfileIcon = ({ size = 26, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const DexNavigation = () => {
  const location = useLocation();
  const { t } = useTranslation('navigation');
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-dex-secondary/30 py-2 px-2 flex justify-between items-center z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
      <Link to="/" className="flex-1">
        <div className={`nav-item ${isActive('/') ? 'text-dex-primary' : 'text-white'}`}>
          <HomeIcon size={26} className={`nav-icon ${isActive('/') ? 'text-dex-primary' : 'text-white'}`} />
          <span className="nav-text">{t('menu.home', 'Home')}</span>
          {isActive('/') && <div className="nav-indicator"></div>}
        </div>
      </Link>

      <Link to="/trade" className="flex-1">
        <div className={`nav-item ${isActive('/trade') ? 'text-dex-primary' : 'text-white'}`}>
          <MarketIcon size={26} className={`nav-icon ${isActive('/trade') ? 'text-dex-primary' : 'text-white'}`} />
          <span className="nav-text">{t('menu.market', 'Market')}</span>
          {isActive('/trade') && <div className="nav-indicator"></div>}
        </div>
      </Link>

      <Link to="/wallet-dashboard" className="flex-1">
        <div className={`nav-item ${isActive('/wallet-dashboard') ? 'text-dex-primary' : 'text-white'}`}>
          <WalletIcon size={26} className={`nav-icon ${isActive('/wallet-dashboard') ? 'text-dex-primary' : 'text-white'}`} />
          <span className="nav-text">{t('menu.wallet', 'Wallet')}</span>
          {isActive('/wallet-dashboard') && <div className="nav-indicator"></div>}
        </div>
      </Link>

      <Link to="/portfolio" className="flex-1">
        <div className={`nav-item ${isActive('/portfolio') ? 'text-dex-primary' : 'text-white'}`}>
          <ProfileIcon size={26} className={`nav-icon ${isActive('/portfolio') ? 'text-dex-primary' : 'text-white'}`} />
          <span className="nav-text">{t('menu.portfolio', 'Portfolio')}</span>
          {isActive('/portfolio') && <div className="nav-indicator"></div>}
        </div>
      </Link>
    </nav>
  );
};

export default DexNavigation;
