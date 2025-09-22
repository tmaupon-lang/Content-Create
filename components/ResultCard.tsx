
import React, { useState } from 'react';
import type { GeneratedContent } from '../types';
import { CopyIcon } from './icons/CopyIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface ResultCardProps {
    content: GeneratedContent;
}

export const ResultCard: React.FC<ResultCardProps> = ({ content }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(content.text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = content.imageUrl;
        link.download = `${content.type.replace(/\s/g, '_')}_post_image.jpeg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-transform transform hover:-translate-y-2 duration-300">
            <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-4">
                 <h3 className="text-xl font-bold text-center text-gray-700">{content.type}</h3>
            </div>
            
            <img src={content.imageUrl} alt={`Generated for ${content.type}`} className="w-full h-80 object-cover" />
            
            <div className="p-6">
                <p className="text-gray-700 whitespace-pre-wrap mb-6">{content.text}</p>
                
                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={handleCopy}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${
                            copied 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        <CopyIcon />
                        {copied ? 'কপি হয়েছে!' : 'কপি করুন'}
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-all duration-300"
                    >
                        <DownloadIcon />
                        ডাউনলোড
                    </button>
                </div>
            </div>
        </div>
    );
};
