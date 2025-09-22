import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { Loader } from './components/Loader';
import { ResultCard } from './components/ResultCard';
import { FunnelResult } from './components/FunnelResult';
import { generateSocialPosts, generatePostImage, generateContentFunnel } from './services/geminiService';
import type { SocialPost, GeneratedContent, FunnelStep } from './types';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const PLACEHOLDER_IMAGE_URL = `data:image/svg+xml,${encodeURIComponent(`
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="#F3F4F6"/>
    <path d="M416 128H96C78.3 128 64 142.3 64 160V352C64 369.7 78.3 384 96 384H416C433.7 384 448 369.7 448 352V160C448 142.3 433.7 128 416 128ZM224 256C224 242.7 234.7 232 248 232C261.3 232 272 242.7 272 256C272 269.3 261.3 280 248 280C234.7 280 224 269.3 224 256ZM416 352H96V259.9L156.4 208.7C160.1 205.4 165.6 205.1 169.6 208.1L224 248L300.9 191.1C305.1 187.5 311.2 187.8 315.1 191.8L416 292.7V352Z" fill="#CBD5E1"/>
    <text x="50%" y="75%" dominant-baseline="middle" text-anchor="middle" font-family="Hind Siliguri, sans-serif" font-size="28" fill="#9CA3AF" font-weight="500">ছবি তৈরি করা যায় নি</text>
</svg>
`)}`;


const ApiKeyModal: React.FC<{ onSave: (key: string) => void }> = ({ onSave }) => {
    const [localApiKey, setLocalApiKey] = useState('');

    const handleSaveClick = () => {
        if (localApiKey.trim()) {
            onSave(localApiKey.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl max-w-md w-full">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">API Key প্রয়োজন</h2>
                <p className="text-gray-600 mb-6 text-center">
                    এই অ্যাপটি ব্যবহার করার জন্য আপনার Google AI Studio API Key প্রয়োজন।
                </p>
                <input
                    type="password"
                    value={localApiKey}
                    onChange={(e) => setLocalApiKey(e.target.value)}
                    placeholder="আপনার API Key লিখুন"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-300 mb-4"
                />
                <button
                    onClick={handleSaveClick}
                    disabled={!localApiKey.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold px-8 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    সেভ করুন ও শুরু করুন
                </button>
                 <p className="text-xs text-gray-500 mt-4 text-center">
                    আপনার API Key আপনার ব্রাউজারে স্থানীয়ভাবে সংরক্ষিত থাকবে।
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline ml-1 font-medium">
                        এখান থেকে কী নিন
                    </a>
                </p>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [mode, setMode] = useState<'posts' | 'funnel'>('posts');
    const [productName, setProductName] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
    const [funnelContent, setFunnelContent] = useState<FunnelStep[] | null>(null);


     useEffect(() => {
        const savedKey = localStorage.getItem('gemini-api-key');
        if (savedKey) {
            setApiKey(savedKey);
        }
    }, []);

    const handleSaveKey = (key: string) => {
        localStorage.setItem('gemini-api-key', key);
        setApiKey(key);
    };

    const handleClearKey = () => {
        localStorage.removeItem('gemini-api-key');
        setApiKey(null);
    };


    const handleGenerate = useCallback(async () => {
        if (!productName.trim()) {
            setError('অনুগ্রহ করে পণ্যের নাম লিখুন।');
            return;
        }
        if (!apiKey) {
            setError('API Key পাওয়া যায়নি। অনুগ্রহ করে আপনার কী সেট করুন।');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedContent([]);
        setFunnelContent(null);

        try {
            if (mode === 'posts') {
                setLoadingMessage('আপনার জন্য বিভিন্ন ধরণের পোস্ট তৈরি করা হচ্ছে...');
                const posts: SocialPost[] = await generateSocialPosts(productName, apiKey);
                
                // Add an initial delay to space out the text generation from the first image generation.
                if (posts.length > 0) {
                    setLoadingMessage(`API ব্যবহারের সীমা ঠিক রাখতে প্রথম ছবি তৈরির আগে ৬০ সেকেন্ড অপেক্ষা করা হচ্ছে...`);
                    await sleep(60000);
                }

                const finalContent: GeneratedContent[] = [];
                for (let i = 0; i < posts.length; i++) {
                    const post = posts[i];
                    setLoadingMessage(`পোস্ট ${i + 1}/${posts.length}-এর জন্য ছবি তৈরি করা হচ্ছে...`);
                    const imageBase64 = await generatePostImage(post.image_prompt, post.type, apiKey, aspectRatio);
                    
                    finalContent.push({
                        ...post,
                        imageUrl: imageBase64
                            ? `data:image/jpeg;base64,${imageBase64}`
                            : PLACEHOLDER_IMAGE_URL
                    });

                    if (i < posts.length - 1) {
                        setLoadingMessage(`API ব্যবহারের সীমা ঠিক রাখতে পরবর্তী ছবির জন্য ৬০ সেকেন্ড অপেক্ষা করা হচ্ছে...`);
                        await sleep(60000); 
                    }
                }
                setGeneratedContent(finalContent);
            } else { // mode === 'funnel'
                setLoadingMessage('আপনার জন্য ৩-ধাপের কনটেন্ট ফানেল তৈরি করা হচ্ছে...');
                const funnelSteps = await generateContentFunnel(productName, apiKey);
                setFunnelContent(funnelSteps);
            }

        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'কিছু একটা সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    }, [productName, apiKey, mode, aspectRatio]);

    if (!apiKey) {
        return <ApiKeyModal onSave={handleSaveKey} />;
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <Header onClearKey={handleClearKey} />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-lg">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-700 mb-2 text-center">আপনার পণ্যের জন্য কনটেন্ট বানান</h2>
                    <p className="text-center text-gray-500 mb-6">আপনার প্রয়োজন অনুযায়ী সোশ্যাল মিডিয়া পোস্ট অথবা সম্পূর্ণ কনটেন্ট ফানেল তৈরি করুন।</p>
                    
                     <div className="flex justify-center gap-2 mb-6">
                        <button
                            onClick={() => setMode('posts')}
                            disabled={isLoading}
                            className={`px-6 py-2 font-semibold rounded-full transition-all duration-300 ${
                                mode === 'posts' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            সোশ্যাল পোস্ট
                        </button>
                        <button
                            onClick={() => setMode('funnel')}
                            disabled={isLoading}
                            className={`px-6 py-2 font-semibold rounded-full transition-all duration-300 ${
                                mode === 'funnel' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            কনটেন্ট ফানেল
                        </button>
                    </div>

                    {mode === 'posts' && (
                        <div className="mb-6">
                            <p className="text-center text-gray-600 font-medium mb-3">ছবির অনুপাত (Aspect Ratio):</p>
                            <div className="flex justify-center gap-2">
                                {(['1:1', '16:9', '9:16'] as const).map(ratio => (
                                    <button
                                        key={ratio}
                                        onClick={() => setAspectRatio(ratio)}
                                        disabled={isLoading}
                                        className={`px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
                                            aspectRatio === ratio ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        {ratio}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}


                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                            placeholder="যেমন: দেশি গরুর ঘি, জামদানি শাড়ি"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-300"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={isLoading}
                            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold px-8 py-3 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'জেনারেট হচ্ছে...' : 'জেনারেট করুন'}
                        </button>
                    </div>
                     {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
                </div>

                {isLoading && (
                    <div className="text-center mt-12">
                        <Loader />
                        <p className="text-lg text-gray-600 mt-4 animate-pulse">{loadingMessage}</p>
                    </div>
                )}
                
                {generatedContent.length > 0 && mode === 'posts' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                        {generatedContent.map((content, index) => (
                            <ResultCard key={index} content={content} />
                        ))}
                    </div>
                )}

                {funnelContent && mode === 'funnel' && (
                     <div className="mt-12 max-w-4xl mx-auto">
                        <FunnelResult steps={funnelContent} />
                    </div>
                )}
            </main>
            <footer className="text-center py-6 text-gray-500 text-sm">
                <p>Powered by Gemini API</p>
            </footer>
        </div>
    );
};

export default App;
