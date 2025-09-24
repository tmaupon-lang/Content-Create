
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Home from './components/Home';
import Settings from './components/Settings';
import type { FullSchedule, Post } from './types';
import { Page } from './types';
import { INITIAL_SCHEDULE, TIME_SLOTS } from './constants';
import { generatePostAndImage } from './services/geminiService';

const App: React.FC = () => {
  const [page, setPage] = useState<Page>(Page.Home);
  const [apiKey, setApiKey] = useState<string>('');
  const [schedule, setSchedule] = useState<FullSchedule>(INITIAL_SCHEDULE);
  const [error, setError] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<boolean[][]>(
    Array(7).fill(Array(3).fill(false))
  );

  useEffect(() => {
    const savedApiKey = localStorage.getItem('gemini_api_key');
    const savedSchedule = localStorage.getItem('social_schedule');
    if (savedSchedule) {
      setSchedule(JSON.parse(savedSchedule));
    }
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setPage(Page.Home);
    } else {
      setPage(Page.Settings);
    }
  }, []);

  const handleSetApiKey = (newApiKey: string) => {
    setApiKey(newApiKey);
    // Navigate to home after setting key, assuming the user wants to start using the app.
    if (page !== Page.Home) {
      setPage(Page.Home);
    }
  };

  const updatePost = useCallback((dayIndex: number, slotIndex: number, newPostData: Partial<Post>) => {
    setSchedule(prevSchedule => {
      const newSchedule = JSON.parse(JSON.stringify(prevSchedule));
      newSchedule[dayIndex][slotIndex] = { ...newSchedule[dayIndex][slotIndex], ...newPostData };
      localStorage.setItem('social_schedule', JSON.stringify(newSchedule));
      return newSchedule;
    });
  }, []);

  const setLoading = (dayIndex: number, slotIndex: number, isLoading: boolean) => {
    setLoadingStates(prev => {
      const newStates = prev.map(row => [...row]);
      newStates[dayIndex][slotIndex] = isLoading;
      return newStates;
    });
  };

  const generatePost = useCallback(async (prompt: string, dayIndex: number, slotIndex: number) => {
    if (!apiKey) {
      setError("API Key is not set. Please add your Gemini API key in the Settings page to proceed.");
      setPage(Page.Settings);
      return;
    }
    
    setError(null);
    setLoading(dayIndex, slotIndex, true);

    try {
      const timeSlot = TIME_SLOTS[slotIndex];
      const result = await generatePostAndImage(prompt, timeSlot, apiKey);
      updatePost(dayIndex, slotIndex, {
        generatedText: result.text,
        generatedImage: result.imageUrl,
      });
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      
      if (errorMessage.includes('API key not valid')) {
         setError("আপনার API কী টি সঠিক নয়। অনুগ্রহ করে Settings পেজে গিয়ে সঠিক কী দিন। (Your API Key is not valid. Please check it in the Settings page.)");
         setPage(Page.Settings);
      } else if (errorMessage.includes('Imagen API is only accessible to billed users')) {
        setError("ছবি তৈরি করা সম্ভব হয়নি। Imagen API ব্যবহার করার জন্য আপনার Google Cloud প্রজেক্টে বিলিং চালু করতে হবে। (Image generation failed. The Imagen API requires a Google Cloud project with billing enabled.)");
      }
      else {
        setError(`An error occurred: ${errorMessage}`);
      }
    } finally {
      setLoading(dayIndex, slotIndex, false);
    }
  }, [updatePost, apiKey]);
  
  const renderPage = () => {
    switch (page) {
      case Page.Settings:
        return <Settings apiKey={apiKey} setApiKey={handleSetApiKey} />;
      case Page.Home:
      default:
        return (
            <Home 
              schedule={schedule} 
              updatePost={updatePost} 
              generatePost={generatePost}
              loadingStates={loadingStates}
            />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Header page={page} setPage={setPage} />
      <main>
        {error && (
          <div className="container mx-auto p-4">
            <div className="bg-red-800 border border-red-600 text-white px-4 py-3 rounded-lg relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
              <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Close">
                <span className="text-2xl" aria-hidden="true">&times;</span>
              </button>
            </div>
          </div>
        )}
        {page === Page.Home && !apiKey && (
           <div className="container mx-auto p-4">
            <div className="bg-blue-800 border border-blue-600 text-white px-4 py-3 rounded-lg relative" role="alert">
              <strong className="font-bold">Welcome! </strong>
              <span className="block sm:inline">Please go to the <button onClick={() => setPage(Page.Settings)} className="font-bold underline">Settings</button> page to enter your Gemini API key to start generating content.</span>
            </div>
          </div>
        )}
        {renderPage()}
      </main>
    </div>
  );
};

export default App;
