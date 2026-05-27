export type GameMode = 'NORMAL' | 'CARDS';

export type CardSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export interface CardItem {
  id: string;
  value: number; // 1 to 13
  suit: CardSuit;
  label: string; // 'A', '2'-'10', 'J', 'Q', 'K'
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  mode: GameMode;
  numbers: number[];
  expression: string;
  success: boolean;
  type: 'solved' | 'no-solution-passed' | 'no-solution-failed' | 'incorrect-formula';
}
