export enum Page {
  Home,
  Settings,
}

export interface Post {
  prompt: string;
  isPromptSaved: boolean;
  generatedText: string | null;
  generatedImage: string | null; // Storing as base64 string
}

export type DayScheduleData = [Post, Post, Post];

export type FullSchedule = DayScheduleData[];
