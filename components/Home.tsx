
import React from 'react';
import type { FullSchedule, Post } from '../types';
import DaySchedule from './DaySchedule';
import { BANGLA_DAYS } from '../constants';

interface HomeProps {
  schedule: FullSchedule;
  updatePost: (dayIndex: number, slotIndex: number, newPost: Partial<Post>) => void;
  generatePost: (prompt: string, dayIndex: number, slotIndex: number) => Promise<void>;
  loadingStates: boolean[][];
}

const Home: React.FC<HomeProps> = ({ schedule, updatePost, generatePost, loadingStates }) => {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="space-y-8">
        {schedule.map((daySchedule, dayIndex) => (
          <DaySchedule
            key={dayIndex}
            day={BANGLA_DAYS[dayIndex]}
            schedule={daySchedule}
            dayIndex={dayIndex}
            updatePost={updatePost}
            generatePost={generatePost}
            loadingStates={loadingStates[dayIndex]}
          />
        ))}
      </div>
    </div>
  );
};

export default Home;
