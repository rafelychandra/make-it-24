import { useState, useEffect, useRef, useCallback } from 'react';
import { GameMode, CardItem, HistoryItem, CardSuit } from '../types';
import { solve24 } from '../utils/solver';
import { evaluateExpression } from '../utils/parser';
import ModeSelector from './ModeSelector';
import NumberDisplay from './NumberDisplay';
import ExpressionInput from './ExpressionInput';
import GameControls from './GameControls';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Flame,
  Clock,
  Volume2,
  VolumeX,
  HelpCircle,
  Lightbulb,
  XCircle,
  History,
  TrendingUp,
  RotateCcw,
  BookOpen
} from 'lucide-react';

// Card names mapping
const CARD_LABELS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS: CardSuit[] = ['hearts', 'diamonds', 'clubs', 'spades'];

// Generate beep sounds via Web Audio API 
function playBeep(type: 'success' | 'fail' | 'tick' | 'victory') {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'success') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'fail') {
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.setValueAtTime(146.83, ctx.currentTime + 0.1); // D3
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else if (type === 'tick') {
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'victory') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.24); // C6
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    }
  } catch (e) {
    // Audio synthesis blocked or unsupported
  }
}

export default function GameDashboard() {
  // Game Setup States
  const [mode, setMode] = useState<GameMode>('NORMAL');
  const [numbers, setNumbers] = useState<number[]>([]);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [solverResult, setSolverResult] = useState<string | null>(null);

  // Gameplay State
  const [expression, setExpression] = useState<string>('');
  const [score, setScore] = useState<number>(() => {
    const saved = localStorage.getItem('make24_score');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [streak, setStreak] = useState<number>(() => {
    const saved = localStorage.getItem('make24_streak');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [bestStreak, setBestStreak] = useState<number>(() => {
    const saved = localStorage.getItem('make24_best_streak');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Sound Config
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Timer States
  const [timer, setTimer] = useState<number>(60);
  const [timerActive, setTimerActive] = useState<boolean>(false);

  // Modal / Feedbacks overlays
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [feedbackType, setFeedbackType] = useState<'win' | 'fail' | 'timeout' | 'no-sol-correct' | 'no-sol-wrong'>('win');
  const [feedbackTitle, setFeedbackTitle] = useState<string>('');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [showHowToModal, setShowHowToModal] = useState<boolean>(() => {
    const hasVisited = localStorage.getItem('make24_visited');
    if (!hasVisited) {
      localStorage.setItem('make24_visited', 'true');
      return true;
    }
    return false;
  });

  // Logs / History list
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('make24_history');
    return saved ? JSON.parse(saved) : [];
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger Sound Side Effect safely
  const triggerSound = useCallback((type: 'success' | 'fail' | 'tick' | 'victory') => {
    if (soundEnabled) {
      playBeep(type);
    }
  }, [soundEnabled]);

  // Persist storage whenever statistics change
  useEffect(() => {
    localStorage.setItem('make24_score', score.toString());
    localStorage.setItem('make24_streak', streak.toString());
    if (streak > bestStreak) {
      setBestStreak(streak);
      localStorage.setItem('make24_best_streak', streak.toString());
    }
  }, [score, streak, bestStreak]);

  useEffect(() => {
    localStorage.setItem('make24_history', JSON.stringify(history));
  }, [history]);

  // Start new round numbers generation
  const generateNewRound = useCallback((forcedMode?: GameMode) => {
    const activeMode = forcedMode || mode;
    const newNumbers: number[] = [];
    const newCards: CardItem[] = [];

    // Helper to generate a random suit
    const getRandomSuit = (): CardSuit => SUITS[Math.floor(Math.random() * SUITS.length)];

    for (let i = 0; i < 4; i++) {
      if (activeMode === 'NORMAL') {
        // Random number from 1 to 10 inclusive
        const val = Math.floor(Math.random() * 10) + 1;
        newNumbers.push(val);
      } else {
        // Playing cards value: 1 to 13 inclusive
        let val = Math.floor(Math.random() * 13) + 1;
        let suit = getRandomSuit();
        
        // Ensure unique card combinations in the hand (value and suit together must be unique)
        while (newCards.some(c => c.value === val && c.suit === suit)) {
          val = Math.floor(Math.random() * 13) + 1;
          suit = getRandomSuit();
        }

        newNumbers.push(val);
        newCards.push({
          id: `card-${Date.now()}-${i}-${val}`,
          value: val,
          suit: suit,
          label: CARD_LABELS[val - 1]
        });
      }
    }

    // Solve first in background
    const solution = solve24(newNumbers);

    setNumbers(newNumbers);
    setCards(newCards);
    setSolverResult(solution);
    setExpression('');
    setTimer(60);
    setTimerActive(true);
    setShowFeedbackModal(false);
  }, [mode]);

  // Generate initial round on mount
  useEffect(() => {
    generateNewRound();
  }, []);

  // Timer Logic
  useEffect(() => {
    if (!timerActive || showHowToModal) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          // Timer Timeout
          setTimerActive(false);
          handleRoundTimeout();
          return 0;
        }
        if (prev <= 11) {
          triggerSound('tick');
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, triggerSound, showHowToModal]);

  // Handle timeout condition
  const handleRoundTimeout = () => {
    triggerSound('fail');
    setStreak(0);
    setFeedbackType('timeout');
    setFeedbackTitle('Waktu Habis!');
    setFeedbackMessage(
      solverResult
        ? `Waktu 60 detik telah berlalu. Salah satu solusi yang memungkinkan adalah: ${solverResult}`
        : 'Waktu habis dan set angka ini memang tidak memiliki solusi sama sekali!'
    );
    setShowFeedbackModal(true);

    const loggedItem: HistoryItem = {
      id: `history-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
      mode,
      numbers,
      expression: 'TIMEOUT',
      success: false,
      type: 'incorrect-formula',
    };
    setHistory(prev => [loggedItem, ...prev].slice(0, 50));
  };

  // Derive used indices from parsing the active arithmetic formula
  const getUsedIndices = (): number[] => {
    // Normalize spaces and extract numbers using regex safely
    const cleanExpr = expression.replace(/\s+/g, '');
    const tokens: string[] = [];
    let i = 0;
    while (i < cleanExpr.length) {
      const char = cleanExpr[i];
      if ('+-*/()'.includes(char)) {
        i++;
      } else if (/[0-9]/.test(char)) {
        let numStr = '';
        while (i < cleanExpr.length && /[0-9.]/.test(cleanExpr[i])) {
          numStr += cleanExpr[i];
          i++;
        }
        tokens.push(numStr);
      } else {
        i++;
      }
    }

    const foundNumbers = tokens.map(t => parseFloat(t)).filter(n => !isNaN(n));
    const indices: number[] = [];
    const matched = new Set<number>();

    foundNumbers.forEach((num) => {
      const originalTarget = mode === 'NORMAL' ? numbers : cards.map(c => c.value);
      const matchIndex = originalTarget.findIndex((val, idx) => val === num && !matched.has(idx));
      if (matchIndex !== -1) {
        matched.add(matchIndex);
        indices.push(matchIndex);
      }
    });

    return indices;
  };

  const usedIndices = getUsedIndices();

  // Handle Card tap/click
  const handleCardClick = (value: number, index: number) => {
    if (usedIndices.includes(index) || showFeedbackModal) return;
    
    // Add white space padding if preceding character is not operator/bracket, to make it tidy
    const trimmed = expression.trim();
    const needsSpace = trimmed.length > 0 && !'+-*/('.includes(trimmed[trimmed.length - 1]);
    setExpression((prev) => `${prev}${needsSpace ? ' ' : ''}${value}`);
  };

  // SUBMIT equation logic
  const handleSubmit = () => {
    if (showFeedbackModal) return;

    setTimerActive(false);
    const targetSet = mode === 'NORMAL' ? numbers : cards.map((c) => c.value);
    const result = evaluateExpression(expression, targetSet);

    if (result.success && result.value !== undefined) {
      // Must be mathematically close to 24
      const isExactly24 = Math.abs(result.value - 24) < 1e-5;

      if (isExactly24) {
        // Success win!
        triggerSound('victory');
        setScore((prev) => prev + 10);
        setStreak((prev) => prev + 1);
        setFeedbackType('win');
        setFeedbackTitle('Luar Biasa!');
        setFeedbackMessage(`Jawaban Anda BENAR! Formula "${expression}" berhasil menghasilkan nilai tepat 24.`);
        setShowFeedbackModal(true);

        const loggedItem: HistoryItem = {
          id: `history-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          timestamp: Date.now(),
          mode,
          numbers: targetSet,
          expression,
          success: true,
          type: 'solved',
        };
        setHistory(prev => [loggedItem, ...prev].slice(0, 50));
      } else {
        // Wrong math total (e.g. they built 25 instead of 24)
        triggerSound('fail');
        setStreak(0);
        setFeedbackType('fail');
        setFeedbackTitle('Belum Tepat!');
        const textVal = Number.isInteger(result.value) ? result.value : result.value.toFixed(2);
        setFeedbackMessage(
          `Hasil dari formula Anda adalah ${textVal} (Bukan 24). Silakan coba lagi atau acak angka baru.`
        );
        setShowFeedbackModal(true);

        const loggedItem: HistoryItem = {
          id: `history-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          timestamp: Date.now(),
          mode,
          numbers: targetSet,
          expression,
          success: false,
          type: 'incorrect-formula',
        };
        setHistory(prev => [loggedItem, ...prev].slice(0, 50));
      }
    } else {
      // Parser error / Syntax failure
      triggerSound('fail');
      setFeedbackType('fail');
      setFeedbackTitle('Format Formula Salah!');
      setFeedbackMessage(result.error || 'Terjadi kesalahan pada rumus matematika Anda.');
      setShowFeedbackModal(true);
    }
  };

  // NO SOLUTION button logic
  const handleNoSolution = () => {
    if (showFeedbackModal) return;

    setTimerActive(false);
    const targetSet = mode === 'NORMAL' ? numbers : cards.map((c) => c.value);

    if (solverResult === null) {
      // Safe win: Yes, indeed there is no mathematically valid solution
      triggerSound('victory');
      setScore((prev) => prev + 15); // Extra reward for difficult no solution detection
      setStreak((prev) => prev + 1);
      setFeedbackType('no-sol-correct');
      setFeedbackTitle('Sangat Jenius!');
      setFeedbackMessage(
        `Benar sekali! Keempat angka (${targetSet.join(', ')}) memang tidak memiliki solusi matematika untuk dibuat menjadi 24.`
      );
      setShowFeedbackModal(true);

      const loggedItem: HistoryItem = {
        id: `history-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
        mode,
        numbers: targetSet,
        expression: 'TIDAK ADA SOLUSI',
        success: true,
        type: 'no-solution-passed',
      };
      setHistory(prev => [loggedItem, ...prev].slice(0, 50));
    } else {
      // Oh, there was a background solution! Hand user the failure
      triggerSound('fail');
      setStreak(0);
      setFeedbackType('no-sol-wrong');
      setFeedbackTitle('Kurang Teliti!');
      setFeedbackMessage(
        `Ternyata kombinasi angka (${targetSet.join(', ')}) memiliki setidaknya satu solusi valid! Contohnya: ${solverResult}`
      );
      setShowFeedbackModal(true);

      const loggedItem: HistoryItem = {
        id: `history-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
        mode,
        numbers: targetSet,
        expression: 'TIDAK ADA SOLUSI (SALAH)',
        success: false,
        type: 'no-solution-failed',
      };
      setHistory(prev => [loggedItem, ...prev].slice(0, 50));
    }
  };

  const resetAllStats = () => {
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setHistory([]);
    localStorage.removeItem('make24_score');
    localStorage.removeItem('make24_streak');
    localStorage.removeItem('make24_best_streak');
    localStorage.removeItem('make24_history');
    generateNewRound();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-12 font-sans selection:bg-indigo-505 selection:text-white transition-colors duration-300 relative overflow-hidden">
      
      {/* Sleek Dot Grid Decorative Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Top Header Navigation Panel */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 py-4 px-6 sticky top-0 z-10 shadow-lg shadow-black/30 transition-colors duration-300">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo & Headline */}
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 text-white font-black text-lg shadow-lg shadow-indigo-505/20 animate-pulse">
              24
            </span>
            <div>
              <h1 className="text-xl font-black tracking-wider bg-gradient-to-r from-white via-slate-205 to-indigo-305 bg-clip-text text-transparent">
                MAKE IT 24
              </h1>
              <p className="text-[9px] text-slate-400 font-bold tracking-widest font-mono uppercase">
                ALGORITHMIC GAME COGNITION • ENGINE V1
              </p>
            </div>
          </div>

          {/* Audio & Manual buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Matikan Suara' : 'Aktifkan Suara'}
              className="p-2.5 rounded-xl border border-slate-805 bg-slate-900 hover:bg-slate-805 text-slate-455 hover:text-white transition cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
            </button>

            <button
              id="how-to-play-toggle"
              onClick={() => setShowHowToModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 font-bold font-mono text-[11px] uppercase tracking-wider border border-slate-800 rounded-xl bg-slate-900 hover:bg-slate-805 hover:border-indigo-500/40 text-slate-300 transition cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              Cara Bermain
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-6xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start relative z-1">
        
        {/* LEFT COLUMN: STATS BOARD */}
        <section id="stats-hero" className="lg:col-span-1 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
            
            <h3 className="font-bold font-mono text-[10px] uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
              Statistik Game
            </h3>

            {/* Score item */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850/85">
                <span className="text-[9px] text-slate-500 block uppercase font-mono font-bold tracking-wider">Skor</span>
                <span id="score-counter" className="text-3xl font-black font-mono text-indigo-405">
                  {score}
                </span>
              </div>

              {/* Streak item */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850/85 relative overflow-hidden">
                <span className="text-[9px] text-slate-500 block uppercase font-mono font-bold tracking-wider">Streak</span>
                <div className="flex items-center gap-1.5">
                  <span id="streak-counter" className="text-3xl font-black font-mono text-amber-500">
                    {streak}
                  </span>
                  {streak >= 3 && (
                    <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-bounce" />
                  )}
                </div>
              </div>
            </div>

            {/* Best Score Memory info */}
            <div className="mt-4 pt-4 border-t border-slate-805/60 flex justify-between text-xs text-slate-400">
              <span className="font-mono text-[9px] uppercase tracking-wider">Terbaik:</span>
              <span id="best-streak-display" className="font-bold text-slate-200 font-mono">
                {bestStreak} Ronde
              </span>
            </div>

            {/* Reset Stats triggers */}
            <div className="mt-5">
              <button
                onClick={() => {
                  if (confirm('Konfirmasi reset seluruh statistik skor dan history bermain?')) {
                    resetAllStats();
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-[9px] font-bold font-mono uppercase tracking-wider text-slate-500 hover:text-rose-455 hover:bg-rose-955/20 border border-slate-800 border-dashed transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Semua Data
              </button>
            </div>
          </div>

          {/* TIMER DASH PANEL */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl transition ${timer <= 10 ? 'bg-rose-955/35 animate-bounce border border-rose-900/30' : 'bg-slate-950 border border-slate-855'}`}>
                <Clock className={`w-5 h-5 ${timer <= 10 ? 'text-rose-500' : 'text-indigo-400'}`} />
              </div>
              <div>
                <span className="text-[9px] text-slate-505 block font-bold font-mono uppercase tracking-wider">Sisa Waktu</span>
                <span
                  id="timer-countdown"
                  className={`text-2xl font-black font-mono leading-none ${timer <= 10 ? 'text-rose-455 animate-pulse' : 'text-slate-250'}`}
                >
                  {timer}s
                </span>
              </div>
            </div>

            {/* Progress Circular Timer */}
            <div className="relative w-11 h-11">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  strokeWidth="3"
                  className="stroke-slate-950 fill-none"
                />
                <circle
                  cx="22"
                  cy="22"
                  r="18"
                  strokeWidth="3"
                  className={`transition-all duration-1000 fill-none ${timer <= 10 ? 'stroke-rose-500' : 'stroke-indigo-500'}`}
                  strokeDasharray={113}
                  strokeDashoffset={113 - (113 * timer) / 60}
                />
              </svg>
            </div>
          </div>
        </section>

        {/* CENTER / RIGHT COLUMNS: PLAYSTAGE */}
        <section id="game-arena" className="lg:col-span-3 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-805 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            
            {/* Stage title */}
            <div className="text-center max-w-md mx-auto mb-4">
              <h2 className="font-black text-xl text-slate-100 tracking-wide">
                Susun Angka Menjadi 24
              </h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Gunakan keempat angka di bawah dengan operator matematika (+, -, *, /) tepat satu kali demi meraih nilai akhir 24.
              </p>
            </div>

            {/* MODE TOGGLER */}
            <ModeSelector
              currentMode={mode}
              onModeChange={(newM) => {
                setMode(newM);
                generateNewRound(newM);
              }}
              disabled={showFeedbackModal}
            />

            {/* NUMBER REVEAL AREA */}
            <NumberDisplay
              mode={mode}
              numbers={numbers}
              cards={cards}
              usedIndices={usedIndices}
              onCardClick={handleCardClick}
              disabled={showFeedbackModal}
            />

            {/* MATHEMATICAL EXPRESSION INPUT FIELD */}
            <ExpressionInput
              expression={expression}
              onExpressionChange={setExpression}
              targetNumbers={mode === 'NORMAL' ? numbers : cards.map((c) => c.value)}
              onSubmit={handleSubmit}
              disabled={showFeedbackModal}
            />

            {/* FEEDBACK & OPERATION TRIGGER HANDLERS */}
            <GameControls
              onSubmit={handleSubmit}
              onNoSolution={handleNoSolution}
              onResetInput={() => setExpression('')}
              onNextRound={() => generateNewRound()}
              canSubmit={expression.trim().length > 0 && evaluateExpression(expression, mode === 'NORMAL' ? numbers : cards.map(c => c.value)).success}
              canClear={expression.length > 0}
              disabled={showFeedbackModal}
            />
          </div>

          {/* PREVIOUS ACTION HISTORY CARDS */}
          {history.length > 0 && (
            <div className="bg-slate-905 border border-slate-850 rounded-3xl p-6 shadow-2xl">
              <h3 className="font-bold font-mono text-[10px] uppercase text-slate-400 tracking-widest mb-4 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-indigo-400" />
                Riwayat Bermain (Ronde Sebelumnya)
              </h3>

              <div id="history-scroll-box" className="max-h-56 overflow-y-auto space-y-2 pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center text-xs p-3 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-950/70 transition"
                  >
                    <div className="flex flex-col gap-1 leading-none">
                      <span className="font-mono font-bold text-slate-200 tracking-wider">
                        [ {item.numbers.join(', ')} ]
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">
                        {item.mode === 'NORMAL' ? 'Normal' : 'Remi'} • {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-indigo-300 bg-indigo-950/20 border border-indigo-900/30 px-2.5 py-1 rounded-lg font-bold">
                        {item.expression}
                      </span>
                      <span
                        className={`font-mono uppercase px-2.5 py-0.5 rounded text-[9px] tracking-wider font-semibold ${
                          item.success
                            ? 'bg-emerald-955/40 text-emerald-400 border border-emerald-900/30'
                            : 'bg-rose-955/20 text-rose-455 border border-rose-900/30'
                        }`}
                      >
                        {item.success ? 'Berhasil' : 'Gagal'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* FOOTER & TRADEMARK */}
      <footer className="max-w-6xl mx-auto px-4 mt-16 pb-8 pt-6 border-t border-slate-900/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4 relative z-1">
        <div>
          <span>© {new Date().getFullYear()} Make It 24 Game. All Rights Reserved.</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-widest uppercase bg-slate-900/40 border border-slate-800/50 px-3.5 py-1.5 rounded-full">
          <span>Created by</span>
          <span className="font-extrabold text-indigo-400">Rafely Chandra Rizkilillah</span>
        </div>
      </footer>

      {/* FEEDBACK OVERLAY MODAL (AnimatePresence) */}
      <AnimatePresence>
        {showFeedbackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              className="absolute inset-0 bg-slate-950/85 backdrop-blur cursor-pointer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFeedbackModal(false)}
              title="Ketuk untuk menutup"
            />

            <motion.div
              id="feedback-modal-card"
              className="relative bg-slate-900 border border-slate-805 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl z-10 text-center"
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.4 }}
            >
              {/* Close Button "✕" at Top Right to exit */}
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="absolute top-4 right-4 text-slate-450 hover:text-white font-bold p-1 rounded-lg cursor-pointer transition-colors"
                title="Tutup halaman"
                id="btn-feedback-modal-close"
              >
                ✕
              </button>

              {/* Dynamic Trophy/Error Icons */}
              <div className="flex justify-center mb-4">
                {feedbackType === 'win' || feedbackType === 'no-sol-correct' ? (
                  <button
                    onClick={() => setShowFeedbackModal(false)}
                    title="Tutup halaman"
                    className="w-16 h-16 rounded-full bg-indigo-955/35 border border-indigo-500/20 flex items-center justify-center animate-bounce cursor-pointer hover:scale-110 active:scale-95 transition-all outline-none hover:bg-indigo-900/45 hover:border-indigo-500/40"
                  >
                    <Trophy className="w-8 h-8 text-indigo-405" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowFeedbackModal(false)}
                    title="Tutup halaman"
                    className="w-16 h-16 rounded-full bg-rose-955/20 border border-rose-900/30 flex items-center justify-center animate-pulse cursor-pointer hover:scale-110 active:scale-95 transition-all outline-none hover:bg-rose-950/30 hover:border-rose-500/40"
                  >
                    <XCircle className="w-8 h-8 text-rose-455" />
                  </button>
                )}
              </div>

              <h3 className="text-2xl font-black text-slate-105 tracking-wide font-sans">
                {feedbackTitle}
              </h3>
              
              <p className="text-sm text-slate-450 mt-2 leading-relaxed font-sans text-center">
                {feedbackMessage}
              </p>

              {/* Score adjustment badge details */}
              <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950 text-xs font-bold font-mono uppercase tracking-wider text-slate-300 border border-slate-800">
                {(feedbackType === 'win' || feedbackType === 'no-sol-correct') ? (
                  <>
                    <span className="text-indigo-400 font-extrabold">+ {feedbackType === 'no-sol-correct' ? '15' : '10'}</span>
                    <span>SKOR BERHASIL</span>
                  </>
                ) : (
                  <>
                    <span className="text-rose-455 font-extrabold">0 / STREAK RESET</span>
                    <span>SKOR GAGAL</span>
                  </>
                )}
              </div>

              <div className="mt-6">
                <button
                  id="btn-modal-dismiss-next"
                  onClick={() => generateNewRound()}
                  className="w-full py-3.5 px-6 rounded-2xl bg-indigo-650 hover:bg-indigo-600 text-white font-extrabold text-sm tracking-wider uppercase font-mono shadow-lg shadow-indigo-900/20 transition cursor-pointer"
                >
                  Mulai Ronde Selanjutnya
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        {/* HOW TO PLAY DIALOG */}
        <AnimatePresence>
          {showHowToModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                className="absolute inset-0 bg-slate-950/85 backdrop-blur"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHowToModal(false)}
              />

              <motion.div
                id="howto-modal-card"
                className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl z-10 text-left max-h-[90vh] overflow-y-auto"
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 20, opacity: 0 }}
              >
                <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                  <h3 className="text-lg font-black text-slate-100 flex items-center gap-1.5 uppercase font-mono tracking-wider">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    Misi Utama Make It 24
                  </h3>
                  <button
                    onClick={() => setShowHowToModal(false)}
                    className="text-slate-450 hover:text-white font-bold p-1 rounded-lg shrink-0 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="text-xs sm:text-sm text-slate-305 space-y-3.5 leading-relaxed font-sans">
                  <p>
                    <strong>Make It 24</strong> adalah permainan asah otak matematika klasik. Tujuan utama Anda adalah menyusun formula matematika dari 4 angka acak yang tersedia sehingga menghasilkan kalkulasi tepat <strong>24</strong>.
                  </p>

                  <div className="space-y-1.5 pl-2 border-l-2 border-indigo-500">
                    <p>
                      <strong>1. Aturan Angka:</strong> Anda wajib menggunakan keempat angka/kartu di layar <strong>tepat satu kali</strong>. Tidak kurang, tidak lebih.
                    </p>
                    <p>
                      <strong>2. Operasi Aritmatika:</strong> Anda boleh menggunakan simbol penjumlahan (<code>+</code>), pengurangan (<code>-</code>), perkalian (<code>*</code>), pembagian (<code>/</code>), dan tanda kurung (<code>()</code>).
                    </p>
                    <p>
                      <strong>3. Kartu Remi (Playing Cards):</strong> Pada mode ini, nilai kartu didefinisikan sebagai: <code>A = 1</code>, <code>J = 11</code>, <code>Q = 12</code>, <code>K = 13</code>.
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3.5 border border-slate-850 rounded-xl font-mono text-xs text-slate-450">
                    <strong>Contoh Tangan:</strong> [3, 3, 8, 8] <br />
                    <strong>Solusi valid:</strong> 8 / (3 - (8 / 3)) <br />
                    <strong>Penjelasan:</strong> 8 dibagi (3 dikurangi 8/3) = 8 / (1/3) = 24.
                  </div>

                  <p>
                    <strong>Tombol "Tidak Bisa Dihitung" (No Solution):</strong> <br />
                    Ada beberapa kombinasi angka yang secara matematis tidak memiliki solusi (misalnya <code>1, 1, 1, 1</code>). Jika Anda buntu dan yakin tidak ada formula yang bisa menghasilkan 24, ketuk tombol <strong>Tidak Bisa Dihitung</strong>. 
                  </p>
                  
                  <div className="text-xs text-amber-350 bg-amber-955/15 p-3 rounded-xl border border-amber-900/20">
                    • Tebakan benar <strong>Tidak Bisa Dihitung</strong> bernilai +15 poin! <br />
                    • Namun jika ternyata ada solusi valid, Anda gagal dan streak Anda akan ter-reset.
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-805">
                  <button
                    onClick={() => setShowHowToModal(false)}
                    className="w-full py-3.5 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs uppercase font-mono tracking-wider transition cursor-pointer text-center"
                  >
                    Saya Mengerti, Ayo Main!
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      
    </div>
  );
}
