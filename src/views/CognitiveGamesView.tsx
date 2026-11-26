import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { SCIENTIFIC_GAMES } from '../constants/initialData';
import { evaluateGoNoGoTrial } from '../utils/logic';
import {
  playTone,
  playHarmonicSuccess,
  playSoftTap,
  playGentleNotice,
  playCelebration,
  isSoundEnabled,
  setSoundEnabled,
} from '../utils/audio';
import {
  Gamepad2,
  ShieldCheck,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2,
  Volume2,
  VolumeX,
  Award,
  Zap,
  Target,
  Grid3X3,
  Waves,
  Brain,
  ArrowRight,
} from 'lucide-react';
import {
  UrgeWaveRiderGame,
  TriggerDetectiveGame,
  DualFocusNBackGame,
} from '../components/ExtraCognitiveGames';
import { RedHelpDot } from '../components/RedHelpDot';

export const CognitiveGamesView: React.FC = () => {
  const { gameStats, recordGameScore } = useApp();
  const [selectedGameId, setSelectedGameId] = useState<string>('go-no-go');
  const [soundOn, setSoundOn] = useState<boolean>(true);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
  };

  // ============================================================
  // GAME 1: GO / NO-GO (Focus & Impulse Shield)
  // ============================================================
  const [g1Pace, setG1Pace] = useState<'gentle' | 'standard' | 'rapid'>('standard');
  const [g1Running, setG1Running] = useState(false);
  const [g1TrialIndex, setG1TrialIndex] = useState(0);
  const [g1CurrentStimulus, setG1CurrentStimulus] = useState<'go' | 'no-go' | null>(null);
  const [g1Score, setG1Score] = useState(0);
  const [g1Streak, setG1Streak] = useState(0);
  const [g1ReactionTimes, setG1ReactionTimes] = useState<number[]>([]);
  const [g1Feedback, setG1Feedback] = useState<{ text: string; type: 'success' | 'warning' | 'miss' } | null>(null);
  const [g1GameOver, setG1GameOver] = useState(false);
  const g1StimulusTimeRef = useRef<number>(0);
  const g1RespondedRef = useRef<boolean>(false);
  const g1TimerRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================
  // GAME 2: STROOP CONFLICT CHALLENGE
  // ============================================================
  type ColorKey = 'red' | 'blue' | 'green' | 'amber';
  const STROOP_COLORS: { key: ColorKey; label: string; textClass: string; bgClass: string; hex: string }[] = [
    { key: 'red', label: 'RED', textClass: 'text-rose-600', bgClass: 'bg-rose-500 hover:bg-rose-600', hex: '#e11d48' },
    { key: 'blue', label: 'BLUE', textClass: 'text-sky-600', bgClass: 'bg-sky-500 hover:bg-sky-600', hex: '#0284c7' },
    { key: 'green', label: 'GREEN', textClass: 'text-indigo-600', bgClass: 'bg-indigo-600 hover:bg-indigo-700', hex: '#059669' },
    { key: 'amber', label: 'AMBER', textClass: 'text-amber-600', bgClass: 'bg-amber-500 hover:bg-amber-600', hex: '#d97706' },
  ];

  const [gStroopRunning, setGStroopRunning] = useState(false);
  const [gStroopRound, setGStroopRound] = useState(0);
  const [gStroopWord, setGStroopWord] = useState<ColorKey>('blue');
  const [gStroopInk, setGStroopInk] = useState<ColorKey>('red');
  const [gStroopScore, setGStroopScore] = useState(0);
  const [gStroopTimes, setGStroopTimes] = useState<number[]>([]);
  const [gStroopFeedback, setGStroopFeedback] = useState<string | null>(null);
  const [gStroopGameOver, setGStroopGameOver] = useState(false);
  const gStroopStartTimeRef = useRef<number>(0);

  // ============================================================
  // GAME 3: PATTERN RECALL (Working Memory Matrix)
  // ============================================================
  const [gPatRunning, setGPatRunning] = useState(false);
  const [gPatLevel, setGPatLevel] = useState(1);
  const [gPatSequence, setGPatSequence] = useState<number[]>([]);
  const [gPatPlayerInput, setGPatPlayerInput] = useState<number[]>([]);
  const [gPatActiveTile, setGPatActiveTile] = useState<number | null>(null);
  const [gPatPhase, setGPatPhase] = useState<'showing' | 'recalling' | 'success' | 'failed'>('showing');
  const [gPatScore, setGPatScore] = useState(0);
  const [gPatGameOver, setGPatGameOver] = useState(false);

  // ============================================================
  // GAME 4: DOT-PROBE (Attentional Shift)
  // ============================================================
  const [g2Running, setG2Running] = useState(false);
  const [g2TrialIndex, setG2TrialIndex] = useState(0);
  const [g2Phase, setG2Phase] = useState<'fixation' | 'cues' | 'probe'>('fixation');
  const [g2ProbeSide, setG2ProbeSide] = useState<'left' | 'right'>('left');
  const [g2CalmSide, setG2CalmSide] = useState<'left' | 'right'>('left');
  const [g2Score, setG2Score] = useState(0);
  const [g2Times, setG2Times] = useState<number[]>([]);
  const [g2GameOver, setG2GameOver] = useState(false);
  const g2StartTimeRef = useRef<number>(0);

  // ============================================================
  // GAME 5: ZEN RIPPLE & RESONANT BREATH
  // ============================================================
  const [gZenBreathPhase, setGZenBreathPhase] = useState<'Inhale (Deep)' | 'Hold' | 'Exhale (Gentle)' | 'Rest'>('Inhale (Deep)');
  const [gZenSecondsLeft, setGZenSecondsLeft] = useState(4);
  const [gZenCycles, setGZenCycles] = useState(0);
  const [gZenRipples, setGZenRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const [gZenSensoryIndex, setGZenSensoryIndex] = useState(5);
  const [gZenSensoryItems, setGZenSensoryItems] = useState<string[]>([]);
  const [gZenSensoryInput, setGZenSensoryInput] = useState('');

  // Clean timers on unmount
  useEffect(() => {
    return () => {
      if (g1TimerRef.current) clearTimeout(g1TimerRef.current);
    };
  }, []);

  // ----------------------------------------------------
  // LOGIC: GAME 1 (GO / NO-GO)
  // ----------------------------------------------------
  const paceDurations = {
    gentle: { display: 1100, pause: 800 },
    standard: { display: 850, pause: 600 },
    rapid: { display: 650, pause: 450 },
  };

  const startGoNoGo = () => {
    setG1Running(true);
    setG1TrialIndex(0);
    setG1Score(0);
    setG1Streak(0);
    setG1ReactionTimes([]);
    setG1Feedback(null);
    setG1GameOver(false);
    nextGoNoGoTrial(0);
  };

  const nextGoNoGoTrial = (trial: number) => {
    if (trial >= 14) {
      setG1Running(false);
      setG1GameOver(true);
      recordGameScore('go-no-go', g1Score);
      playCelebration();
      return;
    }

    setG1TrialIndex(trial);
    g1RespondedRef.current = false;
    setG1CurrentStimulus(null);
    setG1Feedback(null);

    const pace = paceDurations[g1Pace];
    const pause = pace.pause + Math.random() * 400;

    g1TimerRef.current = setTimeout(() => {
      // 70% Go, 30% No-Go
      const stim: 'go' | 'no-go' = Math.random() < 0.7 ? 'go' : 'no-go';
      setG1CurrentStimulus(stim);
      g1StimulusTimeRef.current = Date.now();

      if (stim === 'go') {
        playTone(520, 0.1, 'sine', 0.04);
      } else {
        playTone(320, 0.12, 'triangle', 0.04);
      }

      g1TimerRef.current = setTimeout(() => {
        // User did not respond in time
        if (!g1RespondedRef.current) {
          const evalRes = evaluateGoNoGoTrial(stim, false);
          setG1Score(prev => prev + evalRes.scoreDelta);
          if (evalRes.feedback === 'correct_rejection') {
            setG1Feedback({ text: 'Inhibition Success (+20)', type: 'success' });
            setG1Streak(prev => prev + 1);
            playHarmonicSuccess();
          } else {
            setG1Feedback({ text: 'Missed Target', type: 'miss' });
            setG1Streak(0);
            playGentleNotice();
          }
        }
        setG1CurrentStimulus(null);
        setTimeout(() => nextGoNoGoTrial(trial + 1), 400);
      }, pace.display);
    }, pause);
  };

  const handleGoNoGoTap = () => {
    if (!g1Running || !g1CurrentStimulus || g1RespondedRef.current) return;
    g1RespondedRef.current = true;
    const rt = Date.now() - g1StimulusTimeRef.current;
    setG1ReactionTimes(prev => [...prev, rt]);

    const evalRes = evaluateGoNoGoTrial(g1CurrentStimulus, true, rt);
    setG1Score(prev => prev + evalRes.scoreDelta);

    if (evalRes.feedback === 'correct_hit') {
      setG1Feedback({ text: `Hit! ${rt}ms (+15)`, type: 'success' });
      setG1Streak(prev => prev + 1);
      playSoftTap();
    } else {
      setG1Feedback({ text: 'False Alarm (-25)', type: 'warning' });
      setG1Streak(0);
      playGentleNotice();
    }
  };

  // ----------------------------------------------------
  // LOGIC: GAME 2 (STROOP)
  // ----------------------------------------------------
  const startStroop = () => {
    setGStroopRunning(true);
    setGStroopRound(0);
    setGStroopScore(0);
    setGStroopTimes([]);
    setGStroopFeedback(null);
    setGStroopGameOver(false);
    nextStroopTrial(0);
  };

  const nextStroopTrial = (round: number) => {
    if (round >= 10) {
      setGStroopRunning(false);
      setGStroopGameOver(true);
      recordGameScore('stroop', gStroopScore);
      playCelebration();
      return;
    }

    setGStroopRound(round);
    setGStroopFeedback(null);

    // Pick random word and random ink color
    const wordIndex = Math.floor(Math.random() * STROOP_COLORS.length);
    let inkIndex = Math.floor(Math.random() * STROOP_COLORS.length);
    // 70% of time make it incongruent for cognitive conflict
    if (Math.random() < 0.7) {
      while (inkIndex === wordIndex) {
        inkIndex = Math.floor(Math.random() * STROOP_COLORS.length);
      }
    }

    setGStroopWord(STROOP_COLORS[wordIndex].key);
    setGStroopInk(STROOP_COLORS[inkIndex].key);
    gStroopStartTimeRef.current = Date.now();
  };

  const handleStroopChoice = (chosenColor: ColorKey) => {
    if (!gStroopRunning) return;
    const rt = Date.now() - gStroopStartTimeRef.current;
    setGStroopTimes(prev => [...prev, rt]);

    const isCorrect = chosenColor === gStroopInk;
    if (isCorrect) {
      const bonus = rt < 900 ? 25 : rt < 1400 ? 18 : 12;
      setGStroopScore(prev => prev + bonus);
      setGStroopFeedback(`Correct! ${rt}ms (+${bonus})`);
      playHarmonicSuccess();
    } else {
      setGStroopScore(prev => Math.max(0, prev - 10));
      setGStroopFeedback('Conflict Overrode! Match ink color, not text (-10)');
      playGentleNotice();
    }

    setTimeout(() => nextStroopTrial(gStroopRound + 1), 600);
  };

  // ----------------------------------------------------
  // LOGIC: GAME 3 (PATTERN RECALL MATRIX)
  // ----------------------------------------------------
  const startPatternRecall = () => {
    setGPatRunning(true);
    setGPatLevel(1);
    setGPatScore(0);
    setGPatGameOver(false);
    playLevelPattern(1);
  };

  const playLevelPattern = (level: number) => {
    setGPatPhase('showing');
    setGPatPlayerInput([]);
    setGPatActiveTile(null);

    // Generate sequence of length = level + 2
    const len = level + 2;
    const newSeq: number[] = [];
    for (let i = 0; i < len; i++) {
      newSeq.push(Math.floor(Math.random() * 9));
    }
    setGPatSequence(newSeq);

    // Playback sequence
    newSeq.forEach((tileIdx, step) => {
      setTimeout(() => {
        setGPatActiveTile(tileIdx);
        playTone(350 + tileIdx * 60, 0.2, 'sine', 0.08);
        setTimeout(() => {
          setGPatActiveTile(null);
        }, 320);
      }, (step + 1) * 600);
    });

    // Switch to recalling phase
    setTimeout(() => {
      setGPatPhase('recalling');
    }, (len + 1) * 600);
  };

  const handlePatternTileClick = (tileIdx: number) => {
    if (!gPatRunning || gPatPhase !== 'recalling') return;

    playTone(350 + tileIdx * 60, 0.15, 'sine', 0.08);
    const nextInput = [...gPatPlayerInput, tileIdx];
    setGPatPlayerInput(nextInput);

    const curStep = nextInput.length - 1;
    if (nextInput[curStep] !== gPatSequence[curStep]) {
      // Mistake
      setGPatPhase('failed');
      playGentleNotice();
      setTimeout(() => {
        setGPatRunning(false);
        setGPatGameOver(true);
        recordGameScore('pattern-recall', gPatScore);
      }, 1000);
      return;
    }

    // Correct so far
    if (nextInput.length === gPatSequence.length) {
      // Completed level!
      setGPatPhase('success');
      const pts = gPatLevel * 30;
      setGPatScore(prev => prev + pts);
      playHarmonicSuccess();

      if (gPatLevel >= 6) {
        setTimeout(() => {
          setGPatRunning(false);
          setGPatGameOver(true);
          recordGameScore('pattern-recall', gPatScore + pts);
          playCelebration();
        }, 800);
      } else {
        setTimeout(() => {
          const nextLvl = gPatLevel + 1;
          setGPatLevel(nextLvl);
          playLevelPattern(nextLvl);
        }, 1200);
      }
    }
  };

  // ----------------------------------------------------
  // LOGIC: GAME 4 (DOT-PROBE)
  // ----------------------------------------------------
  const startDotProbe = () => {
    setG2Running(true);
    setG2TrialIndex(0);
    setG2Score(0);
    setG2Times([]);
    setG2GameOver(false);
    nextDotProbeTrial(0);
  };

  const nextDotProbeTrial = (trial: number) => {
    if (trial >= 8) {
      setG2Running(false);
      setG2GameOver(true);
      recordGameScore('dot-probe', g2Score);
      playCelebration();
      return;
    }

    setG2TrialIndex(trial);
    setG2Phase('fixation');

    const calmSide: 'left' | 'right' = Math.random() < 0.5 ? 'left' : 'right';
    setG2CalmSide(calmSide);
    // In Attentional Bias Modification, target probe appears behind calm grounding anchor 85% of time
    const probeSide = Math.random() < 0.85 ? calmSide : (calmSide === 'left' ? 'right' : 'left');
    setG2ProbeSide(probeSide);

    // Fixation cross for 500ms
    setTimeout(() => {
      setG2Phase('cues');
      // Cues visible for 500ms
      setTimeout(() => {
        setG2Phase('probe');
        g2StartTimeRef.current = Date.now();
      }, 500);
    }, 600);
  };

  const handleDotProbeClick = (side: 'left' | 'right') => {
    if (!g2Running || g2Phase !== 'probe') return;
    const rt = Date.now() - g2StartTimeRef.current;
    setG2Times(prev => [...prev, rt]);

    if (side === g2ProbeSide) {
      const bonus = rt < 600 ? 25 : rt < 1000 ? 15 : 10;
      setG2Score(prev => prev + bonus);
      playSoftTap();
    } else {
      playGentleNotice();
    }

    setTimeout(() => nextDotProbeTrial(g2TrialIndex + 1), 400);
  };

  // ----------------------------------------------------
  // LOGIC: GAME 5 (ZEN RIPPLE & BREATH)
  // ----------------------------------------------------
  const handleZenCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setGZenRipples(prev => [...prev.slice(-6), { id, x, y }]);
    playTone(528, 0.4, 'sine', 0.06);

    setTimeout(() => {
      setGZenRipples(prev => prev.filter(r => r.id !== id));
    }, 1200);
  };

  // Breath cycle pacer timer: Inhale (4s), Hold (7s), Exhale (8s)
  useEffect(() => {
    if (selectedGameId !== 'somatic-grounding') return;

    const interval = setInterval(() => {
      setGZenSecondsLeft(prev => {
        if (prev > 1) return prev - 1;

        // Transition breath phases
        if (gZenBreathPhase === 'Inhale (Deep)') {
          setGZenBreathPhase('Hold');
          playTone(440, 0.3, 'sine', 0.05);
          return 7;
        } else if (gZenBreathPhase === 'Hold') {
          setGZenBreathPhase('Exhale (Gentle)');
          playTone(330, 0.4, 'sine', 0.05);
          return 8;
        } else {
          setGZenBreathPhase('Inhale (Deep)');
          setGZenCycles(c => c + 1);
          playTone(528, 0.4, 'sine', 0.06);
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedGameId, gZenBreathPhase]);

  const addSensoryItem = () => {
    if (!gZenSensoryInput.trim()) return;
    setGZenSensoryItems(prev => [...prev, `${gZenSensoryIndex}: ${gZenSensoryInput.trim()}`]);
    setGZenSensoryInput('');
    playHarmonicSuccess();
    if (gZenSensoryIndex > 1) {
      setGZenSensoryIndex(prev => prev - 1);
    }
  };

  const activeGame = SCIENTIFIC_GAMES.find(g => g.id === selectedGameId) || SCIENTIFIC_GAMES[0];

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Title & Introduction */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-800 uppercase tracking-wider mb-1">
            <Gamepad2 className="w-4 h-4 text-amber-600" />
            <span>Prefrontal & Craving-Reset Lab</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-indigo-950">Cognitive Lab</h1>
            <RedHelpDot role="personal" tabKey="games" compact />
          </div>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Eight interactive exercises designed to build impulse control, crave-surfing endurance, trigger agility, and calm focus.
          </p>
        </div>

        {/* Audio Mute / Unmute Toggle */}
        <button
          onClick={toggleSound}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-colors self-start sm:self-auto cursor-pointer ${
            soundOn
              ? 'bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100'
              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
          }`}
          title="Toggle soothing harmonic sound cues"
        >
          {soundOn ? <Volume2 className="w-4 h-4 text-indigo-700" /> : <VolumeX className="w-4 h-4" />}
          <span>{soundOn ? 'Sound: ON' : 'Muted'}</span>
        </button>
      </div>

      {/* 8-Game Selector Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {SCIENTIFIC_GAMES.map(game => {
          const isSelected = game.id === selectedGameId;
          const stats = gameStats[game.id];
          return (
            <button
              key={game.id}
              onClick={() => setSelectedGameId(game.id)}
              className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-950 border-indigo-950 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-900 hover:border-indigo-300'
              }`}
            >
              <div
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  isSelected ? 'text-amber-300' : 'text-slate-400'
                }`}
              >
                {game.category}
              </div>
              <div
                className={`text-xs sm:text-sm font-bold mt-0.5 line-clamp-1 ${
                  isSelected ? 'text-white' : 'text-slate-900'
                }`}
              >
                {game.title.split('(')[0]}
              </div>
              <div
                className={`text-[11px] font-mono-tabular font-medium mt-1 ${
                  isSelected ? 'text-indigo-200' : 'text-indigo-700'
                }`}
              >
                Best: {stats?.highScores || 0} pts
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Game Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        {/* Game Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-100 gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-bold text-indigo-800">{activeGame.evidenceBadge}</span>
              <span aria-hidden="true">·</span>
              <span>{activeGame.duration}</span>
            </div>
            <h2 className="text-xl font-extrabold text-indigo-950 mt-1">{activeGame.title}</h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{activeGame.subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Sessions Completed</div>
              <div className="text-sm font-extrabold font-mono-tabular text-indigo-950">
                {gameStats[selectedGameId]?.sessionsPlayed || 0}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* GAME 1: FOCUS & IMPULSE SHIELD (GO / NO-GO) */}
        {/* ============================================================ */}
        {selectedGameId === 'go-no-go' && (
          <div className="space-y-6">
            {!g1Running && !g1GameOver && (
              <div className="max-w-xl mx-auto text-center space-y-6 py-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto shadow-inner">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">How to play</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    When you see a <strong className="text-indigo-700">Green Circle</strong>, tap the screen immediately.
                    When you see an <strong className="text-amber-700">Amber Square</strong>, <strong className="text-rose-700">WITHHOLD</strong> your tap.
                    This trains prefrontal cortical stop-signals against automatic cravings.
                  </p>
                </div>

                {/* Pace Selector */}
                <div className="flex items-center justify-center gap-2 pt-2">
                  <span className="text-xs font-semibold text-slate-500 mr-2">Pace:</span>
                  {(['gentle', 'standard', 'rapid'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setG1Pace(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                        g1Pace === p
                          ? 'bg-indigo-700 text-white border-indigo-700 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  onClick={startGoNoGo}
                  className="px-8 py-3.5 bg-indigo-800 hover:bg-indigo-900 text-white font-semibold rounded-2xl shadow-sm text-sm transition-transform active:scale-95 inline-flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start 14-Trial Exercise</span>
                </button>
              </div>
            )}

            {g1Running && (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Trial {g1TrialIndex + 1} / 14</span>
                  <div className="flex items-center gap-4">
                    <span>Streak: <strong className="text-indigo-700">{g1Streak}</strong></span>
                    <span>Score: <strong className="text-slate-800">{g1Score}</strong> pts</span>
                  </div>
                </div>

                {/* Interactive Stimulation Canvas */}
                <div
                  onClick={handleGoNoGoTap}
                  className="h-72 sm:h-80 w-full rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer select-none relative overflow-hidden transition-colors hover:bg-slate-100/60 active:bg-slate-200/50"
                >
                  {g1CurrentStimulus === 'go' && (
                    <div className="flex flex-col items-center animate-scale-in">
                      <div className="w-32 h-32 rounded-full bg-indigo-500 border-4 border-white shadow-xl flex items-center justify-center text-white font-bold text-xl ring-8 ring-indigo-200/60">
                        TAP!
                      </div>
                      <span className="text-xs font-bold text-indigo-800 mt-3 uppercase tracking-wider">
                        Target Stimulus · Tap Anywhere
                      </span>
                    </div>
                  )}

                  {g1CurrentStimulus === 'no-go' && (
                    <div className="flex flex-col items-center animate-scale-in">
                      <div className="w-32 h-32 rounded-2xl bg-amber-500 border-4 border-white shadow-xl flex items-center justify-center text-white font-bold text-xl ring-8 ring-amber-200/60">
                        STOP!
                      </div>
                      <span className="text-xs font-bold text-amber-800 mt-3 uppercase tracking-wider">
                        Caution Stimulus · Do NOT Tap!
                      </span>
                    </div>
                  )}

                  {!g1CurrentStimulus && (
                    <div className="text-center text-slate-400">
                      <div className="w-4 h-4 rounded-full bg-slate-300 mx-auto mb-2" />
                      <span className="text-xs font-medium">Focus on the center...</span>
                    </div>
                  )}

                  {/* Feedback overlay */}
                  {g1Feedback && (
                    <div
                      className={`absolute bottom-4 px-4 py-1.5 rounded-full text-xs font-bold shadow-xs ${
                        g1Feedback.type === 'success'
                          ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : g1Feedback.type === 'warning'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {g1Feedback.text}
                    </div>
                  )}
                </div>

                <div className="text-center text-xs text-slate-400">
                  Tap anywhere on the box when the green circle appears. Stay still when the amber square appears.
                </div>
              </div>
            )}

            {g1GameOver && (
              <div className="max-w-md mx-auto text-center space-y-5 py-6">
                <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center mx-auto">
                  <Award className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Session Complete!</h3>
                  <p className="text-xs text-slate-500 mt-1">Excellent impulse inhibition workout.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div className="text-left">
                    <span className="text-[11px] text-slate-400 uppercase font-bold">Final Score</span>
                    <div className="text-2xl font-bold text-indigo-700">{g1Score} pts</div>
                  </div>
                  <div className="text-left">
                    <span className="text-[11px] text-slate-400 uppercase font-bold">Avg Reaction</span>
                    <div className="text-2xl font-bold text-slate-800">
                      {g1ReactionTimes.length > 0
                        ? Math.round(g1ReactionTimes.reduce((a, b) => a + b, 0) / g1ReactionTimes.length)
                        : 0}{' '}
                      <span className="text-xs font-normal text-slate-500">ms</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={startGoNoGo}
                  className="px-6 py-2.5 bg-indigo-800 hover:bg-indigo-900 text-white font-semibold rounded-xl text-xs flex items-center gap-2 mx-auto transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Train Again</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* GAME 2: STROOP CONFLICT RESOLUTION */}
        {/* ============================================================ */}
        {selectedGameId === 'stroop' && (
          <div className="space-y-6">
            {!gStroopRunning && !gStroopGameOver && (
              <div className="max-w-xl mx-auto text-center space-y-6 py-6">
                <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                  <Brain className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Stroop Conflict Challenge</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    A word will appear (e.g. "RED") written in a conflicting color ink (e.g. blue).
                    <strong className="text-slate-900"> Tap the color of the INK, not what the word reads!</strong>
                    This exercises prefrontal cognitive flexibility and forces your brain to suppress automatic urges.
                  </p>
                </div>

                <button
                  onClick={startStroop}
                  className="px-8 py-3.5 bg-indigo-800 hover:bg-indigo-900 text-white font-semibold rounded-2xl shadow-sm text-sm transition-transform active:scale-95 inline-flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start 10-Round Challenge</span>
                </button>
              </div>
            )}

            {gStroopRunning && (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Round {gStroopRound + 1} / 10</span>
                  <span>Score: <strong className="text-indigo-700">{gStroopScore}</strong> pts</span>
                </div>

                {/* Stimulus Word */}
                <div className="h-44 sm:h-52 w-full rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center select-none">
                  <div
                    className={`text-4xl sm:text-5xl font-black tracking-wider transition-transform ${
                      STROOP_COLORS.find(c => c.key === gStroopInk)?.textClass
                    }`}
                  >
                    {STROOP_COLORS.find(c => c.key === gStroopWord)?.label}
                  </div>
                  <span className="text-xs text-slate-400 mt-3 font-medium">
                    What COLOR is the ink above?
                  </span>
                  {gStroopFeedback && (
                    <div className="text-xs font-bold text-slate-700 mt-2 bg-white px-3 py-1 rounded-full border border-slate-200">
                      {gStroopFeedback}
                    </div>
                  )}
                </div>

                {/* Ink Color Response Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {STROOP_COLORS.map(c => (
                    <button
                      key={c.key}
                      onClick={() => handleStroopChoice(c.key)}
                      className={`py-4 rounded-xl text-white font-bold text-sm shadow-xs transition-transform active:scale-95 ${c.bgClass}`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {gStroopGameOver && (
              <div className="max-w-md mx-auto text-center space-y-5 py-6">
                <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center mx-auto">
                  <Award className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Challenge Completed!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    You practiced overriding automatic, impulsive cognitive pathways.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <div className="text-left">
                    <span className="text-[11px] text-slate-400 uppercase font-bold">Total Score</span>
                    <div className="text-2xl font-bold text-indigo-700">{gStroopScore} pts</div>
                  </div>
                  <div className="text-left">
                    <span className="text-[11px] text-slate-400 uppercase font-bold">Avg Reaction</span>
                    <div className="text-2xl font-bold text-slate-800">
                      {gStroopTimes.length > 0
                        ? Math.round(gStroopTimes.reduce((a, b) => a + b, 0) / gStroopTimes.length)
                        : 0}{' '}
                      <span className="text-xs font-normal text-slate-500">ms</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={startStroop}
                  className="px-6 py-2.5 bg-indigo-800 hover:bg-indigo-900 text-white font-semibold rounded-xl text-xs flex items-center gap-2 mx-auto transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Play Again</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* GAME 3: PATTERN RECALL (WORKING MEMORY MATRIX) */}
        {/* ============================================================ */}
        {selectedGameId === 'pattern-recall' && (
          <div className="space-y-6">
            {!gPatRunning && !gPatGameOver && (
              <div className="max-w-xl mx-auto text-center space-y-6 py-6">
                <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto shadow-inner">
                  <Grid3X3 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Working Memory Matrix</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    Watch the sequence of glowing tiles across the 3x3 matrix, accompanied by harmonic tones.
                    Repeat the sequence exactly from memory. Each level adds one more step to expand your working memory.
                  </p>
                </div>

                <button
                  onClick={startPatternRecall}
                  className="px-8 py-3.5 bg-indigo-800 hover:bg-indigo-900 text-white font-semibold rounded-2xl shadow-sm text-sm transition-transform active:scale-95 inline-flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Memory Matrix</span>
                </button>
              </div>
            )}

            {gPatRunning && (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Level {gPatLevel} / 6</span>
                  <div className="flex items-center gap-3">
                    <span className="text-indigo-800 font-bold bg-indigo-50 px-2 py-0.5 rounded">
                      {gPatPhase === 'showing' ? 'Observe the Pattern...' : 'Your Turn: Repeat Sequence'}
                    </span>
                    <span>Score: <strong className="text-slate-800">{gPatScore}</strong> pts</span>
                  </div>
                </div>

                {/* 3x3 Grid */}
                <div className="max-w-xs mx-auto grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(tileIdx => {
                    const isGlow = gPatActiveTile === tileIdx;
                    return (
                      <button
                        key={tileIdx}
                        disabled={gPatPhase !== 'recalling'}
                        onClick={() => handlePatternTileClick(tileIdx)}
                        className={`h-20 sm:h-24 rounded-xl border transition-all duration-150 flex items-center justify-center text-xs font-bold ${
                          isGlow
                            ? 'bg-indigo-500 border-indigo-600 shadow-md scale-95 ring-4 ring-indigo-300'
                            : gPatPhase === 'recalling'
                            ? 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 active:scale-95 cursor-pointer'
                            : 'bg-white border-slate-200 cursor-default'
                        }`}
                      >
                        <span className="opacity-0">Tile</span>
                      </button>
                    );
                  })}
                </div>

                <div className="text-center text-xs text-slate-500">
                  Input: {gPatPlayerInput.length} / {gPatSequence.length} tiles
                </div>
              </div>
            )}

            {gPatGameOver && (
              <div className="max-w-md mx-auto text-center space-y-5 py-6">
                <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center mx-auto">
                  <Award className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Matrix Completed!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Reached Level {gPatLevel} with {gPatScore} points.
                  </p>
                </div>

                <button
                  onClick={startPatternRecall}
                  className="px-6 py-2.5 bg-indigo-800 hover:bg-indigo-900 text-white font-semibold rounded-xl text-xs flex items-center gap-2 mx-auto transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Try Again</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* GAME 4: ATTENTIONAL SHIFT (DOT-PROBE) */}
        {/* ============================================================ */}
        {selectedGameId === 'dot-probe' && (
          <div className="space-y-6">
            {!g2Running && !g2GameOver && (
              <div className="max-w-xl mx-auto text-center space-y-6 py-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center mx-auto shadow-inner">
                  <Target className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Attentional Bias Retraining</h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                    Two cue cards flash for half a second. A dot (•) will then appear. Tap the side where the dot appears as quickly as possible.
                    Over trials, the dot consistently appears behind calming anchors, retraining your eyes away from stress cues.
                  </p>
                </div>

                <button
                  onClick={startDotProbe}
                  className="px-8 py-3.5 bg-indigo-800 hover:bg-indigo-900 text-white font-semibold rounded-2xl shadow-sm text-sm transition-transform active:scale-95 inline-flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start 8-Trial Training</span>
                </button>
              </div>
            )}

            {g2Running && (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Trial {g2TrialIndex + 1} / 8</span>
                  <span>Score: <strong className="text-indigo-700">{g2Score}</strong> pts</span>
                </div>

                <div className="grid grid-cols-2 gap-4 h-64 sm:h-72">
                  {(['left', 'right'] as const).map(side => {
                    const isCalm = g2CalmSide === side;
                    const hasProbe = g2Phase === 'probe' && g2ProbeSide === side;

                    return (
                      <button
                        key={side}
                        onClick={() => handleDotProbeClick(side)}
                        disabled={g2Phase !== 'probe'}
                        className="h-full rounded-2xl border-2 border-slate-200 bg-slate-50 flex items-center justify-center transition-all p-4 relative"
                      >
                        {g2Phase === 'fixation' && (
                          <span className="text-2xl font-light text-slate-400">+</span>
                        )}

                        {g2Phase === 'cues' && (
                          <div className="text-center p-3">
                            <span className="text-xs sm:text-sm font-bold text-slate-700">
                              {isCalm ? '🌱 Fresh Green River' : '⚡ Deadline & Tension'}
                            </span>
                          </div>
                        )}

                        {hasProbe && (
                          <div className="w-8 h-8 rounded-full bg-indigo-700 shadow-md flex items-center justify-center text-white text-lg font-bold animate-ping">
                            •
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="text-center text-xs text-slate-400">
                  {g2Phase === 'probe' ? 'Tap the side with the dot immediately!' : 'Focus on the center...'}
                </div>
              </div>
            )}

            {g2GameOver && (
              <div className="max-w-md mx-auto text-center space-y-5 py-6">
                <div className="w-14 h-14 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center mx-auto">
                  <Award className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Attentional Shift Complete!</h3>
                <div className="text-2xl font-bold text-indigo-700">{g2Score} pts</div>

                <button
                  onClick={startDotProbe}
                  className="px-6 py-2.5 bg-indigo-800 hover:bg-indigo-900 text-white font-semibold rounded-xl text-xs flex items-center gap-2 mx-auto transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Train Again</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* GAME 5: ZEN RIPPLE & RESONANT BREATH */}
        {/* ============================================================ */}
        {selectedGameId === 'somatic-grounding' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Interactive Resonant Breathing Circle */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-800 mb-4">
                  4-7-8 Parasympathetic Vagal Pacer
                </div>

                {/* Animated Pulsing Ring */}
                <div className="relative w-48 h-48 flex items-center justify-center my-4">
                  <div
                    className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                      gZenBreathPhase === 'Inhale (Deep)'
                        ? 'bg-indigo-200/60 scale-100'
                        : gZenBreathPhase === 'Hold'
                        ? 'bg-teal-200/80 scale-105'
                        : 'bg-slate-200/50 scale-75'
                    }`}
                  />
                  <div className="relative z-10 text-center">
                    <div className="text-3xl font-extrabold text-slate-900">{gZenSecondsLeft}s</div>
                    <div className="text-xs font-semibold text-indigo-900 uppercase tracking-wider mt-1">
                      {gZenBreathPhase}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 mt-2">
                  Completed Cycles: <strong className="text-slate-800">{gZenCycles}</strong>
                </div>
              </div>

              {/* Right Column: Zen Ripple Tap Canvas */}
              <div
                onClick={handleZenCanvasClick}
                className="bg-indigo-900 text-indigo-50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer relative overflow-hidden min-h-[260px] select-none"
              >
                <Waves className="w-8 h-8 text-indigo-300/80 mb-2" />
                <h4 className="text-sm font-bold text-white">Interactive Ripple Pond</h4>
                <p className="text-xs text-indigo-200/70 mt-1 max-w-xs">
                  Tap anywhere to create soothing acoustic water ripples and slow down sympathetic arousal.
                </p>

                {gZenRipples.map(ripple => (
                  <div
                    key={ripple.id}
                    style={{ left: ripple.x, top: ripple.y }}
                    className="absolute w-2 h-2 -ml-1 -mt-1 rounded-full border border-indigo-300 pointer-events-none animate-ping opacity-75"
                  />
                ))}
              </div>
            </div>

            {/* Sensory 5-4-3-2-1 DBT Grounding Steps */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                DBT Sensory 5-4-3-2-1 Grounding Log
              </h4>
              <p className="text-xs text-slate-500 mb-3">
                Name {gZenSensoryIndex} {gZenSensoryIndex === 5 ? 'things you can see right now' : gZenSensoryIndex === 4 ? 'things you can physically touch' : gZenSensoryIndex === 3 ? 'sounds you can hear' : gZenSensoryIndex === 2 ? 'scents you can smell' : 'one positive thing about yourself'}.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={gZenSensoryInput}
                  onChange={e => setGZenSensoryInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addSensoryItem()}
                  placeholder="Type an anchor..."
                  className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
                />
                <button
                  onClick={addSensoryItem}
                  className="px-4 py-2 bg-indigo-800 hover:bg-indigo-900 text-white text-xs font-semibold rounded-xl"
                >
                  Log Step
                </button>
              </div>

              {gZenSensoryItems.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {gZenSensoryItems.map((item, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-lg border border-indigo-100"
                    >
                      ✓ {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* GAMES 6, 7, 8: NEW COGNITIVE & CRAVING LABS */}
        {/* ============================================================ */}
        {selectedGameId === 'urge-wave-rider' && (
          <UrgeWaveRiderGame onRecordScore={recordGameScore} />
        )}
        {selectedGameId === 'trigger-detective' && (
          <TriggerDetectiveGame onRecordScore={recordGameScore} />
        )}
        {selectedGameId === 'dual-n-back' && (
          <DualFocusNBackGame onRecordScore={recordGameScore} />
        )}

        {/* Scientific Rationale Accordion */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-start gap-3 text-xs text-slate-500 leading-relaxed bg-slate-50/60 p-4 rounded-2xl">
          <Info className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-700 font-semibold">Clinical Basis: </strong>
            {activeGame.scientificRationale}
          </div>
        </div>
      </div>
    </div>
  );
};
