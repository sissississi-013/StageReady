export interface Comment {
  id: string;
  username: string;
  text: string;
  timestamp: number;
  color: string;
  isQuestion?: boolean;
  wantsToRaiseHand?: boolean;
  raiseHandReason?: string;
}

export interface RaisedHand {
  id: string;
  username: string;
  reason: string;
  timestamp: number;
  color: string;
  status: 'pending' | 'invited' | 'declined';
}

export interface CoHost {
  username: string;
  color: string;
  status: 'connecting' | 'active' | 'disconnected';
  avatarUrl: string;
}

export enum SummaryStyle {
  CASUAL = 'Casual Blog Post',
  ACADEMIC = 'Academic Abstract',
  LINKEDIN = 'LinkedIn Thought Leader',
}

export type StreamStatus = 'idle' | 'streaming' | 'ended';
