
import React, { useState } from 'react';
import type { Post } from '../types';
import CopyIcon from './icons/CopyIcon';
import DownloadIcon from './icons/DownloadIcon';
import SparklesIcon from './icons/SparklesIcon';

interface PostSlotProps {
  post: Post;
  dayIndex: number;
  slotIndex: number;
  timeSlot: string;
  updatePost: (dayIndex: number, slotIndex: number, newPost: Partial<Post>) => void;
  generatePost: (prompt: string, dayIndex: number, slotIndex: number) => Promise<void>;
  isLoading: boolean;
}

const PostSlot: React.FC<PostSlotProps> = ({ post, dayIndex, slotIndex, timeSlot, updatePost, generatePost, isLoading }) => {
  const [localPrompt, setLocalPrompt] = useState(post.prompt);
  const [copied, setCopied] = useState(false);

  const handleSavePrompt = () => {
    updatePost(dayIndex, slotIndex, { prompt: localPrompt, isPromptSaved: true });
  };

  const handleEditPrompt = () => {
    updatePost(dayIndex, slotIndex, { isPromptSaved: false });
  };

  const handleGenerate = () => {
    if (post.prompt) {
      generatePost(post.prompt, dayIndex, slotIndex);
    }
  };

  const handleCopy = () => {
    if (post.generatedText) {
      navigator.clipboard.writeText(post.generatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const handleDownload = () => {
    if (post.generatedImage) {
      const link = document.createElement('a');
      link.href = post.generatedImage;
      link.download = `post_${dayIndex}_${slotIndex}.jpeg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
          <p className="text-indigo-300">Generating...</p>
        </div>
      );
    }

    if (post.generatedText && post.generatedImage) {
      return (
        <div className="space-y-4">
          <div className="relative">
            <p className="text-gray-300 bg-gray-900/50 p-3 rounded-md whitespace-pre-wrap">{post.generatedText}</p>
            <button onClick={handleCopy} className="absolute top-2 right-2 p-1.5 bg-gray-700 rounded-full text-gray-300 hover:bg-gray-600 hover:text-white transition">
              <CopyIcon className="w-4 h-4" />
            </button>
            {copied && <span className="absolute top-2 right-10 text-xs bg-green-500 text-white px-2 py-0.5 rounded-md">Copied!</span>}
          </div>
          <div className="relative group">
            <img src={post.generatedImage} alt="Generated Post" className="rounded-lg w-full aspect-square object-cover" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
               <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">
                <DownloadIcon className="w-5 h-5" />
                Download
              </button>
            </div>
          </div>
          <button onClick={handleGenerate} className="w-full mt-2 flex justify-center items-center gap-2 px-4 py-2 border border-indigo-500 text-indigo-400 rounded-md hover:bg-indigo-500 hover:text-white transition">
            <SparklesIcon className="w-5 h-5" />
            Regenerate
          </button>
        </div>
      );
    }

    if (post.isPromptSaved) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
          <p className="text-gray-400">Prompt is saved.</p>
          <div className="flex gap-2">
            <button onClick={handleGenerate} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">
              <SparklesIcon className="w-5 h-5" />
              Generate Post
            </button>
             <button onClick={handleEditPrompt} className="px-4 py-2 border border-gray-600 text-gray-300 rounded-md hover:bg-gray-700 transition">
              Edit Prompt
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
        <textarea
          value={localPrompt}
          onChange={(e) => setLocalPrompt(e.target.value)}
          placeholder={`Enter prompt for ${timeSlot} post...`}
          className="flex-grow w-full bg-gray-900/50 border border-gray-600 rounded-md p-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-2"
        />
        <button
          onClick={handleSavePrompt}
          disabled={!localPrompt.trim()}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition"
        >
          Save Prompt
        </button>
      </div>
    );
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col min-h-[300px]">
      <h4 className="text-lg font-semibold text-white mb-3 border-b border-gray-600 pb-2">{timeSlot}</h4>
      <div className="flex-grow">
        {renderContent()}
      </div>
    </div>
  );
};

export default PostSlot;
