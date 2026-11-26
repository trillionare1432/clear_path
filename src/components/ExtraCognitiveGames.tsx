import React, { useState, useEffect, useRef } from 'react';
import {
  playHarmonicSuccess,
  playSoftTap,
  playGentleNotice,
  playCelebration,
} from '../utils/audio';
import { Play, RotateCcw, Award, Waves, ShieldAlert, Brain } from 'lucide-react';

interface GameCallbackProps {
  onRecordScore: (gameId: string, score: number) => void;
}

// ============================================================
// GAME 6: URGE WAVE RIDER (Interactive Wave Surfing Lab)
// ============================================================
export const UrgeWaveRiderGame: React.FC<GameCallbackProps> = ({ onRecordScore }) => {
  const [phase, setPhase] = useState<'MENU' | 'PLAYING' | 'SUMMARY'>('MENU');
  const [elapsed, setElapsed] = useState(0); // 0 to 45 seconds
  const [stability, setStability] = useState(100);
  const [anchorsHit, setAnchorsHit] = useState(0);
  const [beatReady, setBeatReady] = useState(false);
  const [feedback, setFeedback] = useState<string>('Watch the crest. Exhale steadily.');
  const timerRef = useRef<number | null>(null);

  const TOTAL_SECONDS = 40;
  // Simulate physiological urge wave peaking at ~14s and naturally subsiding
  const waveIntensity = Math.round(
    Math.max(8, Math.sin((elapsed / TOTAL_SECONDS) * Math.PI) * 85 + (elapsed < 22 ? Math.sin(elapsed * 1.4) * 10 : 0))
  );

  useEffect(() => {
    if (phase !== 'PLAYING') return;
    timerRef.current = window.setInterval(() => {
      setElapsed(prev => {
        const next = prev + 1;
        if (next % 4 === 0) {
          setBeatReady(true);
          playSoftTap();
        }
        if (next >= TOTAL_SECONDS) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPhase('SUMMARY');
          const finalScore = Math.round(stability + anchorsHit * 15);
          onRecordScore('urge-wave-rider', finalScore);
          playCelebration();
          return TOTAL_SECONDS;
        }
        return next;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, stability, anchorsHit, onRecordScore]);

  const startWave = () => {
    setElapsed(0);
    setStability(100);
    setAnchorsHit(0);
    setBeatReady(false);
    setFeedback('Stay calm as the wave rises.');
    setPhase('PLAYING');
  };

  const handleSteadyPulse = () => {
    if (phase !== 'PLAYING') return;
    if (beatReady) {
      setBeatReady(false);
      setAnchorsHit(h => h + 1);
      setStability(s => Math.min(100, s + 4));
      setFeedback('Anchored cleanly. Notice the urge passing.');
      playHarmonicSuccess();
    } else {
      setStability(s => Math.max(40, s - 3));
      setFeedback('Wait for the golden exhale chime.');
      playGentleNotice();
    }
  };

  return (
    <div className="space-y-6">
      {phase === 'MENU' && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-950 text-amber-400 flex items-center justify-center mx-auto">
            <Waves className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-extrabold text-indigo-950">Ride the 40-Second Urge Curve</h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
            Urges feel permanent at their peak, yet fade fast when observed without reacting. Tap{' '}
            <strong>"Exhale Anchor"</strong> whenever the golden pulse lights up every 4 seconds.
          </p>
          <button
            type="button"
            onClick={startWave}
            className="px-6 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 text-amber-400" />
            <span>Start Wave Session</span>
          </button>
        </div>
      )}

      {phase === 'PLAYING' && (
        <div className="bg-indigo-950 text-white rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tabular">
            <span>Time: {elapsed}s / {TOTAL_SECONDS}s</span>
            <span className="text-amber-300">Urge Crest Level: {waveIntensity}%</span>
            <span>Balance Score: {stability + anchorsHit * 15}</span>
          </div>

          {/* Visual Wave Curve Bar */}
          <div className="bg-indigo-900/60 border border-indigo-800 rounded-xl p-4 space-y-3">
            <div className="flex justify-between text-[11px] text-indigo-200">
              <span>Trigger Onset</span>
              <span>Natural Peak</span>
              <span>Calm Settling</span>
            </div>
            <div className="h-24 flex items-end gap-1">
              {Array.from({ length: 20 }).map((_, i) => {
                const segTime = (i / 19) * TOTAL_SECONDS;
                const h = Math.max(12, Math.sin((segTime / TOTAL_SECONDS) * Math.PI) * 92);
                const passed = elapsed >= segTime;
                return (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className={`flex-1 rounded-t-md transition-colors ${
                      passed ? 'bg-amber-400' : 'bg-indigo-700/60'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-indigo-100 font-medium">{feedback}</p>
            <button
              type="button"
              onClick={handleSteadyPulse}
              className={`px-6 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer shrink-0 ${
                beatReady
                  ? 'bg-amber-400 text-indigo-950 shadow-lg scale-105'
                  : 'bg-indigo-800 text-indigo-200 border border-indigo-700'
              }`}
            >
              {beatReady ? 'Tap Now · Exhale Anchor' : 'Observe Breath...'}
            </button>
          </div>
        </div>
      )}

      {phase === 'SUMMARY' && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 text-center space-y-4">
          <Award className="w-10 h-10 text-amber-600 mx-auto" />
          <h3 className="text-lg font-extrabold text-indigo-950">Wave Settled Safely</h3>
          <p className="text-xs text-slate-600">
            Final Score: <strong className="font-mono-tabular text-indigo-950">{stability + anchorsHit * 15} pts</strong> ·{' '}
            Anchors Hit: <strong className="font-mono-tabular">{anchorsHit}</strong>
          </p>
          <button
            type="button"
            onClick={startWave}
            className="px-5 py-2.5 rounded-xl bg-indigo-950 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Play Again</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================
// GAME 7: TRIGGER DETECTIVE (REFRAME RUSH)
// ============================================================
const DETECTIVE_CARDS = [
  {
    cue: '8:30 PM · Exhausted after work, passing an old hangout spot.',
    options: [
      { label: 'Call a safe family member & cross to a bright main street', correct: true },
      { label: 'Stop outside for 5 minutes just to test my willpower', correct: false },
      { label: 'Tell myself tonight does not count', correct: false },
    ],
  },
  {
    cue: '11:00 PM · Intense loneliness and scrolling makes urges spike.',
    options: [
      { label: 'Stay scrolling until 2 AM hoping it fades', correct: false },
      { label: 'Splash cold water on wrists, dock phone across room & breathe', correct: true },
      { label: 'Text old using acquaintances out of boredom', correct: false },
    ],
  },
  {
    cue: 'Friend says: "Come on, just one puff won’t break your streak."',
    options: [
      { label: 'Feel guilty and stay quiet without leaving', correct: false },
      { label: 'Give a firm 5-second exit line & switch location immediately', correct: true },
      { label: 'Debate why they are wrong for 15 minutes', correct: false },
    ],
  },
  {
    cue: 'Sudden panic over an exam deadline or family conflict.',
    options: [
      { label: 'Use 4-7-8 exhale + pick one tiny 10-min task step', correct: true },
      { label: 'Look for a chemical shortcut to shut thoughts down', correct: false },
      { label: 'Isolate in a dark locked room all day', correct: false },
    ],
  },
  {
    cue: 'Sunday afternoon · Zero scheduled plans and rising restlessness.',
    options: [
      { label: 'Wait passively until evening cravings build', correct: false },
      { label: 'Walk 20 minutes outdoors or visit a sports/library space', correct: true },
      { label: 'Skip meals and nap awkwardly at 4 PM', correct: false },
    ],
  },
];

export const TriggerDetectiveGame: React.FC<GameCallbackProps> = ({ onRecordScore }) => {
  const [phase, setPhase] = useState<'MENU' | 'PLAYING' | 'SUMMARY'>('MENU');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const startGame = () => {
    setRound(0);
    setScore(0);
    setFeedback(null);
    setPhase('PLAYING');
  };

  const handleChoice = (isCorrect: boolean) => {
    if (isCorrect) {
      const gained = 30;
      const nextScore = score + gained;
      setScore(nextScore);
      setFeedback('Sharp counter-move (+30 pts)');
      playHarmonicSuccess();
      advance(nextScore);
    } else {
      setFeedback('Risky impulse trap — pivot to safety & environmental exits.');
      playGentleNotice();
      advance(score);
    }
  };

  const advance = (currentScore: number) => {
    setTimeout(() => {
      setFeedback(null);
      if (round + 1 >= DETECTIVE_CARDS.length) {
        setPhase('SUMMARY');
        onRecordScore('trigger-detective', currentScore);
        playCelebration();
      } else {
        setRound(r => r + 1);
      }
    }, 850);
  };

  const card = DETECTIVE_CARDS[round];

  return (
    <div className="space-y-6">
      {phase === 'MENU' && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-950 text-amber-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-extrabold text-indigo-950">Trigger Detective: Reframe Rush</h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
            Practice fast "If-Then" implementation moves across 5 everyday trigger moments so your brain defaults cleanly to protective habits.
          </p>
          <button
            type="button"
            onClick={startGame}
            className="px-6 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 text-amber-400" />
            <span>Start 5-Scene Triage</span>
          </button>
        </div>
      )}

      {phase === 'PLAYING' && card && (
        <div className="bg-white border border-indigo-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono-tabular text-slate-500">
            <span>Case {round + 1} / {DETECTIVE_CARDS.length}</span>
            <span className="font-bold text-indigo-950">Score: {score}</span>
          </div>
          <div className="p-4 rounded-xl bg-indigo-950 text-white text-sm font-bold leading-relaxed">
            {card.cue}
          </div>
          <div className="space-y-2">
            {card.options.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                disabled={Boolean(feedback)}
                onClick={() => handleChoice(opt.correct)}
                className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/60 text-left text-xs font-semibold text-slate-800 transition-colors cursor-pointer"
              >
                {opt.label}
              </button>
            ))}
          </div>
          {feedback && (
            <div className="text-xs font-bold text-indigo-900 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2">
              {feedback}
            </div>
          )}
        </div>
      )}

      {phase === 'SUMMARY' && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 text-center space-y-4">
          <Award className="w-10 h-10 text-amber-600 mx-auto" />
          <h3 className="text-lg font-extrabold text-indigo-950">Triage Complete</h3>
          <p className="text-xs text-slate-600">
            Final Score: <strong className="font-mono-tabular text-indigo-950">{score} / {DETECTIVE_CARDS.length * 30} pts</strong>
          </p>
          <button
            type="button"
            onClick={startGame}
            className="px-5 py-2.5 rounded-xl bg-indigo-950 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Play Again</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================
// GAME 8: DUAL FOCUS N-BACK TRAIL (2-Back Working Memory)
// ============================================================
export const DualFocusNBackGame: React.FC<GameCallbackProps> = ({ onRecordScore }) => {
  const SYMBOLS = ['▲', '◆', '●', '■'];
  const [phase, setPhase] = useState<'MENU' | 'PLAYING' | 'SUMMARY'>('MENU');
  const [sequence, setSequence] = useState<{ cell: number; sym: string }[]>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [respondedThisStep, setRespondedThisStep] = useState(false);
  const [statusMsg, setStatusMsg] = useState('Watch positions carefully...');

  const TOTAL_STEPS = 14;

  const generateSequence = () => {
    const seq: { cell: number; sym: string }[] = [];
    for (let i = 0; i < TOTAL_STEPS; i++) {
      // Force occasional intentional 2-back matches ~35%
      if (i >= 2 && Math.random() < 0.35) {
        seq.push({ cell: seq[i - 2].cell, sym: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)] });
      } else {
        seq.push({
          cell: Math.floor(Math.random() * 9),
          sym: SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        });
      }
    }
    return seq;
  };

  useEffect(() => {
    if (phase !== 'PLAYING') return;
    const t = window.setTimeout(() => {
      if (stepIdx + 1 >= TOTAL_STEPS) {
        setPhase('SUMMARY');
        onRecordScore('dual-n-back', score);
        playCelebration();
      } else {
        setStepIdx(s => s + 1);
        setRespondedThisStep(false);
        setStatusMsg(stepIdx + 1 < 2 ? 'Remember this position...' : 'Match 2 steps ago?');
      }
    }, 1800);
    return () => clearTimeout(t);
  }, [phase, stepIdx, score, onRecordScore]);

  const startGame = () => {
    setSequence(generateSequence());
    setStepIdx(0);
    setScore(0);
    setRespondedThisStep(false);
    setStatusMsg('Remember this starting tile...');
    setPhase('PLAYING');
  };

  const handleMatchTap = () => {
    if (phase !== 'PLAYING' || stepIdx < 2 || respondedThisStep) return;
    setRespondedThisStep(true);
    const isPosMatch = sequence[stepIdx]?.cell === sequence[stepIdx - 2]?.cell;
    if (isPosMatch) {
      setScore(s => s + 25);
      setStatusMsg('Exact 2-back position match (+25)');
      playHarmonicSuccess();
    } else {
      setScore(s => Math.max(0, s - 10));
      setStatusMsg('Not a 2-back match (-10)');
      playGentleNotice();
    }
  };

  const currentItem = sequence[stepIdx];

  return (
    <div className="space-y-6">
      {phase === 'MENU' && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-950 text-amber-400 flex items-center justify-center mx-auto">
            <Brain className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-extrabold text-indigo-950">2-Back Working Memory Trail</h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
            Tiles light up one by one on the 3×3 matrix. Tap <strong>"Position Match (2-Back)"</strong> whenever the lit square matches where it was <strong>two turns earlier</strong>.
          </p>
          <button
            type="button"
            onClick={startGame}
            className="px-6 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-4 h-4 text-amber-400" />
            <span>Start 2-Back Run</span>
          </button>
        </div>
      )}

      {phase === 'PLAYING' && currentItem && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center space-y-5">
          <div className="w-full flex items-center justify-between text-xs font-mono-tabular text-slate-600">
            <span>Step {stepIdx + 1} / {TOTAL_STEPS}</span>
            <span className="font-bold text-indigo-950">Score: {score}</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 w-52 h-52">
            {Array.from({ length: 9 }).map((_, idx) => {
              const active = currentItem.cell === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-xl border flex items-center justify-center text-xl font-bold transition-all ${
                    active
                      ? 'bg-indigo-950 border-indigo-900 text-amber-400 shadow-md scale-105'
                      : 'bg-white border-slate-200 text-slate-200'
                  }`}
                >
                  {active ? currentItem.sym : ''}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">{statusMsg}</span>
            <button
              type="button"
              disabled={stepIdx < 2 || respondedThisStep}
              onClick={handleMatchTap}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-extrabold cursor-pointer transition-colors"
            >
              Position Match (2 Steps Ago)
            </button>
          </div>
        </div>
      )}

      {phase === 'SUMMARY' && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 text-center space-y-4">
          <Award className="w-10 h-10 text-amber-600 mx-auto" />
          <h3 className="text-lg font-extrabold text-indigo-950">2-Back Block Completed</h3>
          <p className="text-xs text-slate-600">
            Session Score: <strong className="font-mono-tabular text-indigo-950">{score} pts</strong>
          </p>
          <button
            type="button"
            onClick={startGame}
            className="px-5 py-2.5 rounded-xl bg-indigo-950 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Play Again</span>
          </button>
        </div>
      )}
    </div>
  );
};
