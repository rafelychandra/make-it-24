import { CardItem, GameMode } from '../types';
import { motion } from 'motion/react';

interface NumberDisplayProps {
  mode: GameMode;
  numbers: number[];
  cards: CardItem[];
  usedIndices: number[];
  onCardClick: (value: number, index: number) => void;
  disabled: boolean;
}

// Crisp inline SVGs for playing card suits
const SuitIcon = ({ suit, className = 'w-6 h-6' }: { suit: CardItem['suit']; className?: string }) => {
  switch (suit) {
    case 'hearts':
      return (
        <svg viewBox="0 0 24 24" className={`${className} fill-red-500 text-red-500`}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      );
    case 'diamonds':
      return (
        <svg viewBox="0 0 24 24" className={`${className} fill-red-500 text-red-500`}>
          <path d="M12 2L2 12l10 10 10-10L12 2z" />
        </svg>
      );
    case 'spades':
      return (
        <svg viewBox="0 0 24 24" className={`${className} fill-slate-800 text-slate-800`}>
          <path d="M12 2C9 2 6.5 4.5 6.5 7.5C6.5 9.2 7.2 10.7 8.5 12C7.2 13.5 4.5 15.5 4.5 18.5C4.5 20.5 6 21 7.5 21C9.5 21 11 18.5 12 18C13 18.5 15 21 17 21C18.5 21 20 20.5 20 18.5C20 15.5 17.3 13.5 16 12C17.3 10.7 18 9.2 18 7.5C18 4.5 15.5 2 12 2Z" />
          <path d="M12 16v5h-2s.5-1 2-2z" className="opacity-40" />
        </svg>
      );
    case 'clubs':
      return (
        <svg viewBox="0 0 24 24" className={`${className} fill-slate-800 text-slate-800`}>
          <circle cx="12" cy="7.5" r="3.5" />
          <circle cx="7.7" cy="13.5" r="3.5" />
          <circle cx="16.3" cy="13.5" r="3.5" />
          <path d="M12 12.5v7.5h-2s.5-1 2-2z" className="opacity-40" />
        </svg>
      );
  }
};

export default function NumberDisplay({
  mode,
  numbers,
  cards,
  usedIndices,
  onCardClick,
  disabled,
}: NumberDisplayProps) {
  
  if (mode === 'NORMAL') {
    return (
      <div id="numbers-grid-normal" className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto my-6 px-4">
        {numbers.map((num, idx) => {
          const isUsed = usedIndices.includes(idx);
          return (
            <motion.button
              key={`num-${idx}-${num}`}
              id={`normal-num-${idx}`}
              disabled={disabled}
              onClick={() => onCardClick(num, idx)}
              className={`relative h-28 sm:h-32 flex flex-col items-center justify-center rounded-2xl select-none transition-all duration-300 border ${
                isUsed
                  ? 'bg-slate-950 border-slate-900 text-slate-650 scale-95 opacity-40 cursor-not-allowed shadow-inner'
                  : 'bg-slate-905 border-slate-800 hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 text-slate-100 cursor-pointer shadow-md'
              }`}
              initial={{ scale: 0.3, opacity: 0, rotate: -15 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, delay: idx * 0.08 }}
              whileTap={{ scale: isUsed ? 0.95 : 0.92 }}
            >
              {/* Used Badge */}
              {isUsed && (
                <span className="absolute top-2 right-2 text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-500">
                  USED
                </span>
              )}
              
              <span className="text-4xl sm:text-5xl font-black tracking-tight font-sans text-white">
                {num}
              </span>
              <span className="text-[9px] text-slate-500 mt-1 uppercase font-semibold font-mono tracking-wider">
                Select Card
              </span>
            </motion.button>
          );
        })}
      </div>
    );
  }

  // Cards mode
  return (
    <div id="numbers-grid-cards" className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto my-6 px-4">
      {cards.map((card, idx) => {
        const isUsed = usedIndices.includes(idx);
        const isRed = card.suit === 'hearts' || card.suit === 'diamonds';

        return (
          <div key={`card-${card.id}`} className="perspective-1000 flex justify-center">
            <motion.button
              id={`card-btn-${idx}`}
              disabled={disabled}
              onClick={() => onCardClick(card.value, idx)}
              className={`relative w-36 h-52 sm:w-40 sm:h-56 rounded-2xl shadow-xl select-none outline-none overflow-hidden transition-all duration-300 border bg-white ${
                isUsed
                  ? 'border-slate-800 opacity-25 scale-95 cursor-not-allowed shadow-inner'
                  : 'border-slate-200 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-2 cursor-pointer'
              }`}
              initial={{ rotateY: 180, opacity: 0, scale: 0.8 }}
              animate={{ rotateY: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: idx * 0.12, type: 'spring', stiffness: 120 }}
              whileTap={{ scale: isUsed ? 0.95 : 0.92 }}
            >
              {/* Border Decorator */}
              <div className={`absolute inset-1.5 rounded-xl border border-dashed transition-colors ${
                isUsed ? 'border-slate-300' : isRed ? 'border-red-200' : 'border-slate-200'
              }`} />

              {/* CARD FRONT face content */}
              <div className="absolute inset-4 flex flex-col justify-between pointer-events-none">
                {/* Top Left Mini Card Suit */}
                <div className="flex flex-col items-center leading-none">
                  <span className={`text-xl sm:text-2xl font-black ${isRed ? 'text-red-500' : 'text-slate-950'}`}>
                    {card.label}
                  </span>
                  <SuitIcon suit={card.suit} className="w-4 h-4 mt-0.5" />
                </div>

                {/* Big Center Suit Logo */}
                <div className="flex justify-center items-center w-full grow my-2">
                  <SuitIcon suit={card.suit} className="w-12 h-12" />
                </div>

                {/* Bottom Right Mini Card Suit (Rotated) */}
                <div className="flex flex-col items-center leading-none self-end rotate-180">
                  <span className={`text-xl sm:text-2xl font-black ${isRed ? 'text-red-500' : 'text-slate-950'}`}>
                    {card.label}
                  </span>
                  <SuitIcon suit={card.suit} className="w-4 h-4 mt-0.5" />
                </div>
              </div>

              {/* Overlay for Used Card */}
              {isUsed && (
                <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center backdrop-blur-[0.5px]">
                  <span className="text-[10px] sm:text-xs rotate-[-15deg] font-extrabold px-2.5 py-1 rounded border-2 border-slate-600 text-slate-700 bg-white shadow tracking-wider font-mono">
                    USED
                  </span>
                </div>
              )}
            </motion.button>
          </div>
        );
      })}
    </div>
  );
}
