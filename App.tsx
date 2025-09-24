import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Home from './components/Home';
import type { FullSchedule, Post } from './types';
import { INITIAL_SCHEDULE, TIME_SLOTS } from './constants';
import { generatePostAndImage } from './services/geminiService';

const App: React.FC = () => {
  // Fix: Removed page and apiKey state management to align with new single-page structure and API key guidelines.
  const [schedule, setSchedule] = useState<FullSchedule>(INITIAL_SCHEDULE);
  const [error, setError] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<boolean[][]>(
    Array(7).fill(Array(3).fill(false))
  );

  useEffect(() => {
    // Fix: Removed API key loading from localStorage and navigation to settings.
    const savedSchedule = localStorage.getItem('social_schedule');
    if (savedSchedule) {
      setSchedule(JSON.parse(savedSchedule));
    }
  }, []);

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
    // Fix: Removed apiKey check and passing to service, as it's now handled via environment variables.
    setError(null);
    setLoading(dayIndex, slotIndex, true);

    try {
      const timeSlot = TIME_SLOTS[slotIndex];
      const result = await generatePostAndImage(prompt, timeSlot);
      updatePost(dayIndex, slotIndex, {
        generatedText: result.text,
        generatedImage: result.imageUrl,
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(dayIndex, slotIndex, false);
    }
  }, [updatePost]);


  // Fix: Removed renderPage function and multi-page logic. The app now only displays the Home component.
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <Header />
      <main>
        {error && (
          <div className="container mx-auto p-4">
            <div className="bg-red-800 border border-red-600 text-white px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
            </div>
          </div>
        )}
        <Home 
          schedule={schedule} 
          updatePost={updatePost} 
          generatePost={generatePost}
          loadingStates={loadingStates}
        />
      </main>
    </div>
  );
};

export default App;
