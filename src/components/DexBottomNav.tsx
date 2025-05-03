
import React from 'react';
import { Link } from 'react-router-dom';

interface DexNavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface DexBottomNavProps {
  activeRoute: string;
}

const DexBottomNav: React.FC<DexBottomNavProps> = ({ activeRoute }) => {
  const navItems: DexNavItem[] = [
    {
      label: 'Home',
      icon: (
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
        >
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      path: '/'
    },
    {
      label: 'Swap',
      icon: (
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
        >
          <path d="M17 2v20l-5-5-5 5V2"/>
        </svg>
      ),
      path: '/swap'
    },
    {
      label: 'Wallet',
      icon: (
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
        >
          <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/>
          <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/>
          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
        </svg>
      ),
      path: '/wallet'
    },
    {
      label: 'Activity',
      icon: (
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
        >
          <path d="M12 2v20"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      ),
      path: '/activity'
    }
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-dex-dark border-t border-gray-800 px-6 py-3 z-10">
      <div className="flex justify-between items-center">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path}
            className={`flex flex-col items-center ${
              activeRoute === item.path 
                ? 'text-dex-primary' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default DexBottomNav;
