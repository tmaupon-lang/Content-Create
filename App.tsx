import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Loader } from './components/Loader';
import { ResultCard } from './components/ResultCard';
import { FunnelResult } from './components/FunnelResult';
import { generateSingleSocialPost, generatePostImage, generateContentFunnel } from './services/geminiService';
import type { SocialPost, GeneratedContent, FunnelStep } from './types';

const PLACEHOLDER_IMAGE_URL = `data:image/svg+xml,${encodeURIComponent(`
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="#F3F4F6"/>
    <path d="M416 128H96C78.3 128 64 142.3 64 160V352C64 369.7 78.3 384 96 384H416C433.7 384 448 369.7 448 352V160C448 142.3 433.7 128 416 128ZM224 256C224 242.7 234.7 232 248 232C261.3 232 272 242.7 272 256C272 269.3 261.3 280 248 280C234.7 280 224 269.3 224 256ZM416 352H96V259.9L156.4 208.7C160.1 205.4 165.6 205.1 169.6 208.1L224 248L300.9 191.1C305.1 187.5 311.2 187.8 315.1 191.8L416 292.7V352Z" fill="#CBD5E1"/>
    <text x="50%" y="75%" dominant-baseline="middle" text-anchor="middle" font-family="Hind Siliguri, sans-serif" font-size="28" fill="#9CA3AF" font-weight="500">ছবি তৈরি হচ্ছে...</text>
</svg>
`)}`;

const App: React.FC = () => {
    const [mode, setMode] = useState<'posts' | 'funnel'>('posts');
    const [productName, setProductName] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
    const [funnelContent, setFunnelContent] = useState<FunnelStep[] | null>(null);

    const handleGenerate = useCallback(async () => {
        if (!productName.trim()) {
            setError('অনুগ্রহ করে পণ্যের নাম লিখুন।');
            return;
        }

        setIsLoading(true);
        setError(null);
        setGeneratedContent([]);
        setFunnelContent(null);

        try {
            if (mode === 'posts') {
                const postTypes = [
                    'তথ্যমূলক ও আবেগঘন',
                    'মজার / ভাইরাল মিম',
                    'আর্জেন্ট সেল পোস্ট',
                    'কথোপকথন শুরু করার মতো প্রশ্ন'
                ];

                setLoadingMessage('আপনার জন্য পোস্টের লেখা তৈরি করা হচ্ছে...');

                const textGenerationPromises = postTypes.map(type => 
                    generateSingleSocialPost(productName, type)
                );

                const textResults = await Promise.allSettled(textGenerationPromises);

                const initialContent: GeneratedContent[] = [];
                const successfulPosts: { post: SocialPost, index: number }[] = [];

                textResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        const post = result.value;
                        const contentIndex = initialContent.length;
                        initialContent.push({
                            ...post,
                            imageUrl: PLACEHOLDER_IMAGE_URL
                        });
                        successfulPosts.push({ post, index: contentIndex });
                    } else {
                        console.error(`Failed to generate post of type: ${postTypes[index]}`, result.reason);
                        initialContent.push({
                            type: `${postTypes[index]} (ব্যর্থ)`,
                            text: `দুঃখিত, এই পোস্টটি তৈরি করা যায় নি। অনুগ্রহ করে আবার চেষ্টা করুন।\nত্রুটি: ${result.reason instanceof Error ? result.reason.message : 'অজানা সমস্যা'}`,
                            image_prompt: '',
                            imageUrl: PLACEHOLDER_IMAGE_URL.replace('ছবি তৈরি হচ্ছে...', 'ত্রুটি')
                        });
                    }
                });

                setGeneratedContent(initialContent);
                setLoadingMessage('পোস্টের জন্য ছবি তৈরি করা হচ্ছে...');

                if (successfulPosts.length === 0) {
                    setIsLoading(false);
                    if(initialContent.length > 0) {
                       setLoadingMessage('পোস্ট তৈরি করা যায় নি।');
                       setTimeout(() => setLoadingMessage(''), 2000);
                    }
                    return;
                }
                
                const imageGenerationPromises = successfulPosts.map(({ post, index }) => {
                    return generatePostImage(post.image_prompt, post.type, aspectRatio)
                        .then(imageResult => {
                            setGeneratedContent(prevContent => {
                                const newContent = [...prevContent];
                                if (newContent[index]) {
                                    newContent[index].imageUrl = imageResult
                                        ? `data:image/jpeg;base64,${imageResult}`
                                        : PLACEHOLDER_IMAGE_URL.replace('ছবি তৈরি হচ্ছে...', 'ছবি তৈরি করা যায় নি');
                                }
                                return newContent;
                            });
                        })
                        .catch(err => {
                            console.error(`Error generating image for post index ${index}:`, err);
                            setGeneratedContent(prevContent => {
                                const newContent = [...prevContent];
                                if (newContent[index]) {
                                    newContent[index].imageUrl = PLACEHOLDER_IMAGE_URL.replace('ছবি তৈরি হচ্ছে...', 'ছবি তৈরি করা যায় নি');
                                }
                                return newContent;
                            });
                        });
                });

                await Promise.all(imageGenerationPromises);
                setLoadingMessage('সব পোস্ট তৈরি হয়ে গেছে!');

            } else { // mode === 'funnel'
                setLoadingMessage('আপনার জন্য ৩-ধাপের কনটেন্ট ফানেল তৈরি করা হচ্ছে...');
                const funnelSteps = await generateContentFunnel(productName);
                setFunnelContent(funnelSteps);
            }
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : 'কিছু একটা সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
            setTimeout(() => setLoadingMessage(''), 2000);
        }
    }, [productName, mode, aspectRatio]);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <Header />
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
