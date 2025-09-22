import React, { useState } from 'react';
import type { FunnelStep } from '../types';
import { ClipboardIcon } from './icons/ClipboardIcon';
import { ClipboardCheckIcon } from './icons/ClipboardCheckIcon';

const CopyButton: React.FC<{ textToCopy: string }> = ({ textToCopy }) => {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
         <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold transition-all duration-300 ${
                copied 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
        >
            {copied ? <ClipboardCheckIcon /> : <ClipboardIcon />}
            {copied ? 'কপি হয়েছে' : 'কপি'}
        </button>
    );
};

const FunnelStepCard: React.FC<{ step: FunnelStep, color: string }> = ({ step, color }) => {
    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden transition-transform transform hover:-translate-y-1 duration-300">
            <div className={`p-5 border-l-8 ${color}`}>
                 <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">{step.stage}</h3>
                 <p className="text-lg font-semibold text-gray-700 mb-4">{step.headline}</p>

                 <div className="space-y-4 text-gray-600">
                     <div>
                        <div className="flex justify-between items-center mb-1">
                             <h4 className="font-semibold text-gray-800">কনটেন্ট:</h4>
                             <CopyButton textToCopy={step.content} />
                        </div>
                        <p className="whitespace-pre-wrap bg-gray-50 p-3 rounded-md">{step.content}</p>
                     </div>
                     <div>
                         <h4 className="font-semibold text-gray-800 mb-1">কল টু অ্যাকশন:</h4>
                         <p className="whitespace-pre-wrap bg-gray-50 p-3 rounded-md">{step.call_to_action}</p>
                     </div>
                      <div>
                         <h4 className="font-semibold text-gray-800 mb-1">ভিজ্যুয়াল আইডিয়া:</h4>
                         <p className="whitespace-pre-wrap bg-gray-50 p-3 rounded-md italic">{step.visual_idea}</p>
                     </div>
                 </div>
            </div>
        </div>
    );
};


export const FunnelResult: React.FC<{ steps: FunnelStep[] }> = ({ steps }) => {
    const colors = ["border-blue-500", "border-purple-500", "border-green-500"];
    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-gray-700 text-center">আপনার ৩-ধাপের কনটেন্ট ফানেল</h2>
            {steps.map((step, index) => (
                <FunnelStepCard key={index} step={step} color={colors[index % colors.length]} />
            ))}
        </div>
    );
};
