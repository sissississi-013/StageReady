export interface Comment {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  color: string;
  isQuestion?: boolean;
}

export enum SummaryStyle {
  CASUAL = 'Casual Blog Post',
  ACADEMIC = 'Academic Abstract',
  LINKEDIN = 'LinkedIn Thought Leader',
}

export type StreamStatus = 'idle' | 'streaming' | 'ended';
