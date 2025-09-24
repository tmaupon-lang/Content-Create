
import React from 'react';
import type { DayScheduleData, Post } from '../types';
import PostSlot from './PostSlot';
import { TIME_SLOTS } from '../constants';

interface DayScheduleProps {
  day: string;
  schedule: DayScheduleData;
  dayIndex: number;
  updatePost: (dayIndex: number, slotIndex: number, newPost: Partial<Post>) => void;
  generatePost: (prompt: string, dayIndex: number, slotIndex: number) => Promise<void>;
  loadingStates: boolean[];
}

const DaySchedule: React.FC<DayScheduleProps> = ({ day, schedule, dayIndex, updatePost, generatePost, loadingStates }) => {
  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 backdrop-blur-lg">
      <h3 className="text-2xl font-bold text-center text-indigo-400 mb-6">{day}</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {schedule.map((post, slotIndex) => (
          <PostSlot
            key={slotIndex}
            post={post}
            dayIndex={dayIndex}
            slotIndex={slotIndex}
            timeSlot={TIME_SLOTS[slotIndex]}
            updatePost={updatePost}
            generatePost={generatePost}
            isLoading={loadingStates[slotIndex]}
          />
        ))}
      </div>
    </div>
  );
};

export default DaySchedule;
