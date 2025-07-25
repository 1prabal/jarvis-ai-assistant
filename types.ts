
export enum AssistantState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  SPEAKING = 'SPEAKING',
  ERROR = 'ERROR',
}

export interface Source {
  uri: string;
  title: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  sources?: Source[];
}
