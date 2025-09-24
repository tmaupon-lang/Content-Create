import React from 'react';
import HomeIcon from './icons/HomeIcon';
import SettingsIcon from './icons/SettingsIcon';
import { Page } from '../types';

interface HeaderProps {
  page: Page;
  setPage: (page: Page) => void;
}

const Header: React.FC<HeaderProps> = ({ page, setPage }) => {
  const navItemClasses = "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors";
  const activeClasses = "bg-indigo-600 text-white";
  const inactiveClasses = "text-gray-300 hover:bg-gray-700 hover:text-white";

  return (
    <header className="bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-white">Bangla Social Scheduler</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(Page.Home)}
              className={`${navItemClasses} ${page === Page.Home ? activeClasses : inactiveClasses}`}
              aria-current={page === Page.Home ? 'page' : undefined}
            >
              <HomeIcon className="w-5 h-5" />
              Home
            </button>
            <button
              onClick={() => setPage(Page.Settings)}
              className={`${navItemClasses} ${page === Page.Settings ? activeClasses : inactiveClasses}`}
              aria-current={page === Page.Settings ? 'page' : undefined}
            >
              <SettingsIcon className="w-5 h-5" />
              Settings
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
