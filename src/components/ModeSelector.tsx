import { GameMode } from '../types';
import { motion } from 'motion/react';
import { Hash, Club } from 'lucide-react';

interface ModeSelectorProps {
  currentMode: GameMode;
  onModeChange: (mode: GameMode) => void;
  disabled: boolean;
}

export default function ModeSelector({ currentMode, onModeChange, disabled }: ModeSelectorProps) {
  return (
    <div id="mode-selector-container" className="flex flex-col sm:flex-row gap-4 justify-center items-center my-4 w-full">
      <button
        id="mode-btn-normal"
        disabled={disabled}
        onClick={() => onModeChange('NORMAL')}
        className={`relative flex items-center justify-center gap-3 px-6 py-4 rounded-2xl w-full sm:w-64 border transition-all duration-300 select-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${
          currentMode === 'NORMAL'
            ? 'bg-indigo-950/40 text-indigo-300 border-indigo-500/50 shadow-lg shadow-indigo-900/20'
            : 'bg-slate-900 hover:bg-slate-850 text-slate-400 border-slate-800 hover:border-slate-700 shadow-sm'
        }`}
      >
        <Hash className={`w-5 h-5 ${currentMode === 'NORMAL' ? 'text-indigo-400' : 'text-slate-500'}`} />
        <div className="text-left">
          <div className="font-bold text-sm tracking-wide">Angka Normal</div>
          <div className={`text-[10px] uppercase font-mono ${currentMode === 'NORMAL' ? 'text-indigo-300/80' : 'text-slate-500'}`}>
            Mulai 1 s.d 10
          </div>
        </div>
        {currentMode === 'NORMAL' && (
          <motion.div
            layoutId="activeModeIndicator"
            className="absolute inset-0 border-2 border-indigo-500 rounded-2xl pointer-events-none"
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
        )}
      </button>

      <button
        id="mode-btn-cards"
        disabled={disabled}
        onClick={() => onModeChange('CARDS')}
        className={`relative flex items-center justify-center gap-3 px-6 py-4 rounded-2xl w-full sm:w-64 border transition-all duration-300 select-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${
          currentMode === 'CARDS'
            ? 'bg-indigo-950/40 text-indigo-300 border-indigo-500/50 shadow-lg shadow-indigo-900/20'
            : 'bg-slate-900 hover:bg-slate-850 text-slate-400 border-slate-800 hover:border-slate-700 shadow-sm'
        }`}
      >
        <Club className={`w-5 h-5 ${currentMode === 'CARDS' ? 'text-indigo-400' : 'text-slate-500'}`} />
        <div className="text-left">
          <div className="font-bold text-sm tracking-wide">Kartu Remi</div>
          <div className={`text-[10px] uppercase font-mono ${currentMode === 'CARDS' ? 'text-indigo-300/80' : 'text-slate-500'}`}>
            Standard Playing Cards
          </div>
        </div>
        {currentMode === 'CARDS' && (
          <motion.div
            layoutId="activeModeIndicator"
            className="absolute inset-0 border-2 border-indigo-500 rounded-2xl pointer-events-none"
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          />
        )}
      </button>
    </div>
  );
}
