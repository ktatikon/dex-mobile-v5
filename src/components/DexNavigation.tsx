
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart2, Wallet, History } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DexNavigation = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dex-dark/90 backdrop-blur-md border-t border-dex-secondary/20 p-3 flex justify-around items-center z-50 shadow-lg shadow-dex-secondary/5">
      <Link to="/">
        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 ${
            isActive('/') ? 'text-dex-secondary font-medium' : 'text-white'
          } transition-all duration-200 hover:text-dex-secondary/80`}
        >
          <Home size={20} />
          <span className="text-xs">Home</span>
        </Button>
      </Link>

      <Link to="/trade">
        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 ${
            isActive('/trade') ? 'text-dex-secondary font-medium' : 'text-white'
          } transition-all duration-200 hover:text-dex-secondary/80`}
        >
          <BarChart2 size={20} />
          <span className="text-xs">Market</span>
        </Button>
      </Link>

      <Link to="/transactions">
        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 ${
            isActive('/transactions') ? 'text-dex-secondary font-medium' : 'text-white'
          } transition-all duration-200 hover:text-dex-secondary/80`}
        >
          <History size={20} />
          <span className="text-xs">Transactions</span>
        </Button>
      </Link>

      <Link to="/wallet">
        <Button
          variant="ghost"
          size="sm"
          className={`flex flex-col items-center gap-1 ${
            isActive('/wallet') ? 'text-dex-secondary font-medium' : 'text-white'
          } transition-all duration-200 hover:text-dex-secondary/80`}
        >
          <Wallet size={20} />
          <span className="text-xs">Wallet</span>
        </Button>
      </Link>
    </nav>
  );
};

export default DexNavigation;
