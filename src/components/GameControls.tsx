import { Check, HelpCircle, RefreshCw } from 'lucide-react';

interface GameControlsProps {
  onSubmit: () => void;
  onNoSolution: () => void;
  onResetInput: () => void;
  onNextRound: () => void;
  canSubmit: boolean;
  canClear: boolean;
  disabled: boolean;
}

export default function GameControls({
  onSubmit,
  onNoSolution,
  onResetInput,
  onNextRound,
  canSubmit,
  canClear,
  disabled,
}: GameControlsProps) {

  return (
    <div id="game-controls-container" className="flex flex-col gap-3 max-w-2xl mx-auto my-6 px-4">
      {/* Primary Action Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* SUBMIT ANSWER */}
        <button
          id="btn-submit-answer"
          onClick={onSubmit}
          disabled={disabled || !canSubmit}
          className={`flex items-center justify-center gap-2 h-14 rounded-2xl font-bold uppercase tracking-wider text-sm shadow transition-all duration-300 border select-none ${
            disabled || !canSubmit
              ? 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed shadow-inner'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-505 cursor-pointer shadow-indigo-950 hover:shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          <Check className="w-5 h-5" />
          Submit Answer
        </button>

        {/* NO SOLUTION (Assert) */}
        <button
          id="btn-no-solution"
          onClick={onNoSolution}
          disabled={disabled}
          className={`flex items-center justify-center gap-2 h-14 rounded-2xl font-bold uppercase tracking-wider text-sm shadow transition-all duration-300 border select-none ${
            disabled
              ? 'bg-slate-950 text-slate-600 border-slate-900 cursor-not-allowed shadow-inner'
              : 'bg-amber-950/20 hover:bg-amber-950/40 text-amber-300 border-amber-500/30 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
          }`}
        >
          <HelpCircle className="w-5 h-5 animate-pulse text-amber-400" />
          No Solution
        </button>
      </div>

      {/* Utilities Action Row */}
      <div className="flex justify-between items-center gap-4 mt-2 bg-slate-900 border border-slate-800 rounded-2xl p-3">
        <button
          id="btn-clear-formula"
          onClick={onResetInput}
          disabled={disabled || !canClear}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider select-none border transition ${
            !canClear || disabled
              ? 'text-slate-600 border-transparent bg-transparent cursor-not-allowed'
              : 'text-slate-400 border-slate-800 bg-slate-950 hover:bg-slate-850 hover:border-slate-700 cursor-pointer shadow-sm'
          }`}
        >
          Clear Formula
        </button>

        <span className="text-[10px] text-slate-500 font-mono hidden sm:inline max-w-[280px] text-center uppercase tracking-wider">
          Use all 4 numbers once to reach 24.
        </span>

        <button
          id="btn-next-round-skip"
          onClick={onNextRound}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold font-mono uppercase tracking-wider bg-indigo-950/30 border border-indigo-900/40 text-indigo-300 hover:bg-indigo-950/60 hover:border-indigo-500 transition shadow-sm cursor-pointer hover:shadow"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          New Deal
        </button>
      </div>
    </div>
  );
}
