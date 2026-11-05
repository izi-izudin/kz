export type CalculatorMode = 'standard' | 'scientific';

export type AppTab = 'calculator' | 'scientific' | 'ai' | 'finance' | 'history_settings';

export type AiSubTab = 'assistant' | 'photo' | 'voice' | 'explainer';

export type FinanceSubTab = 'discount' | 'tax' | 'loan' | 'savings' | 'profit' | 'tip';

export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
  mode: 'standard' | 'scientific' | 'ai' | 'finance' | 'voice';
  category?: string;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  language: 'id' | 'en';
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  decimalPlaces: number; // -1 for auto, or 2, 4, 6, 8
  thousandSeparator: 'dot' | 'comma'; // 'dot' -> 1.000,50 | 'comma' -> 1,000.50
  angleUnit: 'deg' | 'rad';
}

export interface AiSolution {
  expression: string;
  result: string;
  formula?: string;
  steps: string[];
  explanation: string;
  canInsertToCalc: boolean;
  insertValue?: string;
  isOfflineMode?: boolean;
}

export interface ChallengeQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}
