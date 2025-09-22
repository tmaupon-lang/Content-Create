import React from 'react';

interface HeaderProps {
    onClearKey?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onClearKey }) => {
    return (
        <header className="bg-white shadow-md">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                 <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    ই-কমার্স কনটেন্ট জিনি
                </h1>
                {onClearKey && (
                     <button 
                        onClick={onClearKey}
                        className="text-sm font-medium text-gray-600 hover:text-purple-700 transition-colors px-3 py-2 rounded-md bg-gray-100 hover:bg-purple-100"
                     >
                        API Key পরিবর্তন করুন
                     </button>
                )}
            </div>
        </header>
    );
};