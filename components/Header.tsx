import React from 'react';
import HomeIcon from './icons/HomeIcon';

// Fix: Refactored Header to be a static component, removing page state and navigation.
// This resolves the children prop error by removing the component that caused it,
// and aligns with the single-page application structure.
const Header: React.FC = () => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-white">Bangla Social Scheduler</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-indigo-600 text-white">
              <HomeIcon className="w-5 h-5" />
              Home
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
