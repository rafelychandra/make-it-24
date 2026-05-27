import React, { useEffect, useState } from 'react';
import { Delete, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { evaluateExpression } from '../utils/parser';

interface ExpressionInputProps {
  expression: string;
  onExpressionChange: (newValue: string) => void;
  targetNumbers: number[];
  onSubmit: () => void;
  disabled: boolean;
}

export default function ExpressionInput({
  expression,
  onExpressionChange,
  targetNumbers,
  onSubmit,
  disabled,
}: ExpressionInputProps) {
  const [liveValue, setLiveValue] = useState<number | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [isEquationPerfect, setIsEquationPerfect] = useState<boolean>(false);

  // Compute live value whenever the expression or targets change
  useEffect(() => {
    if (!expression.trim()) {
      setLiveValue(null);
      setLiveError(null);
      setIsEquationPerfect(false);
      return;
    }

    const trimmed = expression.replace(/\s+/g, '');
    const result = evaluateExpression(trimmed, targetNumbers);

    if (result.success && result.value !== undefined) {
      setLiveValue(result.value);
      setLiveError(null);
      
      // A solution is perfect if it evaluates to exactly 24 (within tolerance)
      const isExactly24 = Math.abs(result.value - 24) < 1e-5;
      setIsEquationPerfect(isExactly24);
    } else {
      setLiveValue(null);
      // Only set error if it's not a trivial incomplete state
      if (
        result.error &&
        !result.error.includes('Silakan masukkan') &&
        !result.error.includes('Formula terputus') &&
        !result.error.includes('buntu')
      ) {
        setLiveError(result.error);
      } else {
        setLiveError(null);
      }
      setIsEquationPerfect(false);
    }
  }, [expression, targetNumbers]);

  const handleKeyPress = (char: string) => {
    if (disabled) return;
    onExpressionChange(expression + char);
  };

  const handleBackspace = () => {
    if (disabled) return;
    // Remove last character
    onExpressionChange(expression.slice(0, -1));
  };

  const handleClear = () => {
    if (disabled) return;
    onExpressionChange('');
  };

  // Keyboard support for direct submission when pressing Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isEquationPerfect && !disabled) {
      onSubmit();
    }
  };

  return (
    <div id="expression-input-wrapper" className="max-w-2xl mx-auto my-6 px-4">
      {/* Real-time Visualizer of current expression */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden text-white backdrop-blur">
        
        {/* Subtle decorative grid lines */}
        <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />

        <div className="flex justify-between items-center mb-1 bg-slate-950/40 px-2.5 py-1 rounded-lg">
          <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase font-bold">
            Formula Editor
          </span>
          {isEquationPerfect ? (
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-extrabold border border-indigo-500/30 px-2 py-0.5 rounded-full animate-pulse font-mono uppercase tracking-wider">
              Siap Dikirim (Tepat 24!)
            </span>
          ) : (
            <span className="text-[10px] bg-slate-800/40 text-slate-400 font-mono border border-slate-800/30 px-2 py-0.5 rounded-full">
              Kalkulasi Aktif
            </span>
          )}
        </div>

        {/* Big Input Screen */}
        <div className="relative flex items-center justify-between gap-4 mt-2 mb-3">
          <input
            id="formula-text-input"
            type="text"
            value={expression}
            onChange={(e) => onExpressionChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Ketik atau klik angka & operator..."
            autoComplete="off"
            className="bg-transparent text-xl sm:text-2xl font-mono font-bold w-full focus:outline-none select-text text-white placeholder-slate-600 tracking-wide"
          />
          
          {expression.length > 0 && !disabled && (
            <button
              id="clear-icon-btn"
              onClick={handleClear}
              className="text-slate-500 hover:text-rose-400 hover:bg-rose-955/20 border border-transparent hover:border-rose-900/40 p-1.5 rounded-xl transition duration-150"
              title="Reset Input"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Live Calculation Evaluator Display */}
        <div className="border-t border-slate-800/80 pt-3 flex flex-wrap items-center justify-between text-sm min-h-10">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Hasil saat ini:</span>
            {liveValue !== null ? (
              <span
                id="live-calc-display"
                className={`font-mono text-xl font-black px-2 py-0.5 rounded transition-all duration-300 ${
                  isEquationPerfect
                    ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.3)] scale-110'
                    : 'text-amber-400'
                }`}
              >
                {Number.isInteger(liveValue) ? liveValue : liveValue.toFixed(4).replace(/\.?0+$/, '')}
              </span>
            ) : (
              <span className="text-slate-500 font-mono">-</span>
            )}
            
            {isEquationPerfect && (
              <CheckCircle2 className="w-5 h-5 text-indigo-400 animate-bounce ml-1 shrink-0" />
            )}
          </div>

          {liveError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-900/35 px-3 py-1.5 rounded-lg max-w-full">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate font-mono">{liveError}</span>
            </div>
          )}
        </div>
      </div>

      {/* Operator & Bracket Buttons Row */}
      <div id="operator-pad" className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-4">
        {/* Math Operators */}
        {['+', '-', '*', '/'].map((op) => (
          <button
            key={op}
            id={`op-pad-${op}`}
            disabled={disabled}
            onClick={() => handleKeyPress(` ${op} `)}
            className="flex items-center justify-center h-12 bg-slate-900 hover:bg-slate-800 text-slate-200 font-mono font-black text-xl border border-slate-800 hover:border-indigo-500 rounded-xl transition shadow-sm cursor-pointer hover:shadow-indigo-505/10 hover:shadow"
          >
            {op === '*' ? '×' : op === '/' ? '÷' : op}
          </button>
        ))}

        {/* Parentheses Brackets */}
        {['(', ')'].map((p) => (
          <button
            key={p}
            id={`op-pad-${p === '(' ? 'left' : 'right'}`}
            disabled={disabled}
            onClick={() => handleKeyPress(p)}
            className="flex items-center justify-center h-12 bg-slate-900 hover:bg-slate-800 text-slate-200 font-mono font-black text-lg border border-slate-800 hover:border-indigo-500 rounded-xl transition shadow-sm cursor-pointer hover:shadow-indigo-505/10 hover:shadow"
          >
            {p}
          </button>
        ))}

        {/* Custom Backspace Action */}
        <button
          id="op-pad-backspace"
          disabled={disabled || expression.length === 0}
          onClick={handleBackspace}
          className="col-span-2 flex items-center justify-center gap-1 h-12 bg-rose-955/10 hover:bg-rose-955/35 text-rose-400 hover:text-rose-350 font-bold border border-rose-900/30 hover:border-rose-800 rounded-xl transition shadow-sm cursor-pointer"
        >
          <Delete className="w-4 h-4" />
          <span className="text-xs font-mono uppercase tracking-wider">Hapus</span>
        </button>
      </div>
    </div>
  );
}
