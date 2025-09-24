
import type { FullSchedule, Post } from './types';

export const BANGLA_DAYS: string[] = [
  'শনিবার', 'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার'
];

export const TIME_SLOTS: string[] = ['সকাল', 'দুপুর', 'রাত'];

export const INITIAL_POST: Post = {
  prompt: '',
  isPromptSaved: false,
  generatedText: null,
  generatedImage: null,
};

export const INITIAL_SCHEDULE: FullSchedule = Array(7).fill(
    [
        {...INITIAL_POST},
        {...INITIAL_POST},
        {...INITIAL_POST}
    ]
);
