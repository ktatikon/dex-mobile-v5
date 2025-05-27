
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
      label: 'Markets',
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
      path: '/trade'
    },
    {
      label: 'Futures',
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
          <rect width="18" height="18" x="3" y="3" rx="2"/>
          <path d="M7 7h10"/>
          <path d="M7 12h10"/>
          <path d="M7 17h10"/>
        </svg>
      ),
      path: '/futures'
    },
    {
      label: 'Portfolio',
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
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      path: '/portfolio'
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
