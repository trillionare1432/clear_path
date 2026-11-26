import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Heart,
  Shield,
  Wind,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Smile,
  Clock,
  Sparkles,
  PhoneCall,
  Play,
  RotateCcw,
} from 'lucide-react';
import { playTone } from '../../utils/audio';

import { getActiveSharedSupporterItems } from '../../utils/careRelay';

export const SupporterWellbeingView: React.FC = () => {
  const { sharedSupporterItems } = useApp();
  const activeSharedItems = getActiveSharedSupporterItems(sharedSupporterItems);
  // Boundary Self-Assessment Checklist State
  const [boundaryChecks, setBoundaryChecks] = useState<Record<number, boolean>>({});

  const BOUNDARY_QUESTIONS = [
    { text: 'I make time for my own sleep, meals, and physical movement every day.' },
    { text: 'I recognize that I cannot control another adult’s choices or cravings.' },
    { text: 'I avoid covering up, lying, or making excuses for their substance use.' },
    { text: 'I refrain from doing things for them that they are capable of doing themselves.' },
    { text: 'I have at least one trusted friend, family member, or counselor I can confide in.' },
    { text: 'I step back and pause when conversations become heated or circular.' },
  ];

  const checkedCount = Object.values(boundaryChecks).filter(Boolean).length;
  const boundaryScorePct = Math.round((checkedCount / BOUNDARY_QUESTIONS.length) * 100);

  // 4-7-8 Decompression Breath Pacer
  const [breathRunning, setBreathRunning] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>('Inhale');
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [cyclesDone, setCyclesDone] = useState(0);

  useEffect(() => {
    if (!breathRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev > 1) return prev - 1;

        if (breathPhase === 'Inhale') {
          setBreathPhase('Hold');
          playTone(440, 0.25, 'sine', 0.04);
          return 7;
        } else if (breathPhase === 'Hold') {
          setBreathPhase('Exhale');
          playTone(330, 0.35, 'sine', 0.04);
          return 8;
        } else {
          setBreathPhase('Inhale');
          setCyclesDone(c => c + 1);
          playTone(528, 0.35, 'sine', 0.05);
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [breathRunning, breathPhase]);

  const toggleCheck = (idx: number) => {
    setBoundaryChecks(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-200/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">
            <Heart className="w-4 h-4 text-amber-700" />
            <span>Sustainability &amp; Boundaries</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Supporter Self-Care</h1>
          <p className="editorial-subtitle text-slate-600 mt-1.5 max-w-2xl">
            You cannot pour from an empty cup. Sustainable support requires preserving your own mental health, sleep, and physical boundaries.
          </p>
        </div>
      </div>

      {/* Dedicated Part 5G Section: Supporters May Also Need Professional Care */}
      <div className="bg-orange-50/80 border border-orange-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="editorial-kicker text-orange-900">Caregiver Mental Health</span>
            <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
              Supporters May Also Need Professional Help
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="tel:14405"
              className="px-3.5 py-2 rounded-xl bg-[#9A3412] text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" /> Vimukthi 14405
            </a>
            <a
              href="tel:14416"
              className="px-3.5 py-2 rounded-xl bg-white border border-orange-300 text-orange-950 text-xs font-bold inline-flex items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" /> Tele-MANAS 14416
            </a>
          </div>
        </div>
        <p className="prose-readable-sm text-orange-950">
          Watching someone struggle with substances creates chronic worry, sleep loss, and secondary stress. A supporter cannot carry severe substance dependence alone. Individual counselling or family-based CRAFT therapy for <strong>yourself</strong> is available confidentially via Vimukthi and Tele-MANAS even if your loved one refuses treatment right now.
        </p>
      </div>

      {/* 1. Boundary Self-Assessment */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Healthy Boundary Self-Assessment</h2>
            <p className="text-xs text-slate-500">Check the principles you currently uphold:</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
              {checkedCount} / {BOUNDARY_QUESTIONS.length} Healthy Boundaries Active
            </span>
          </div>
        </div>

        {/* Progress gauge */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-600 rounded-full transition-all duration-300"
            style={{ width: `${boundaryScorePct}%` }}
          />
        </div>

        <div className="space-y-2.5">
          {BOUNDARY_QUESTIONS.map((q, idx) => {
            const isChecked = !!boundaryChecks[idx];
            return (
              <div
                key={idx}
                onClick={() => toggleCheck(idx)}
                className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition-colors ${
                  isChecked
                    ? 'bg-amber-50/60 border-amber-300 text-slate-900'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isChecked ? (
                    <CheckCircle2 className="w-5 h-5 text-amber-700 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                  <span className="prose-readable-sm font-medium">{q.text}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Assessment Feedback */}
        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 prose-readable-sm text-amber-950">
          {checkedCount >= 5 ? (
            <p>
              <strong>Strong, resilient boundaries:</strong> You are balancing empathy with self-preservation. This protects both you and the person you care about.
            </p>
          ) : checkedCount >= 3 ? (
            <p>
              <strong>Good awareness, with room to protect yourself:</strong> Consider setting one small boundary this week — such as not answering repetitive nighttime calls or taking a daily walk.
            </p>
          ) : (
            <p>
              <strong>High risk of supporter burnout:</strong> Carrying someone else&apos;s burden without boundaries often leads to exhaustion and resentment. Call Vimukthi (14405) to speak with a family counselor.
            </p>
          )}
        </div>
      </div>

      {/* 2. Decompression Breath Pacer */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">4-7-8 Decompression Pacer</h2>
            <p className="text-xs text-slate-500">
              Down-regulates your nervous system after a stressful interaction or difficult day
            </p>
          </div>
          <span className="text-xs text-slate-500">Cycles: {cyclesDone}</span>
        </div>

        <div className="flex flex-col items-center justify-center py-6 text-center">
          {/* Animated Breath Ring */}
          <div className="relative w-44 h-44 flex items-center justify-center my-4">
            <div
              className={`absolute inset-0 rounded-full transition-all duration-1000 ${
                breathRunning
                  ? breathPhase === 'Inhale'
                    ? 'bg-amber-200/60 scale-100'
                    : breathPhase === 'Hold'
                    ? 'bg-amber-300/80 scale-105'
                    : 'bg-slate-200/50 scale-75'
                  : 'bg-slate-100 scale-90'
              }`}
            />
            <div className="relative z-10 text-center">
              <div className="text-3xl font-extrabold text-slate-900">
                {breathRunning ? `${secondsLeft}s` : 'Ready'}
              </div>
              <div className="text-xs font-bold text-amber-900 uppercase tracking-wider mt-1">
                {breathRunning ? breathPhase : '4-7-8 Breath'}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {!breathRunning ? (
              <button
                onClick={() => setBreathRunning(true)}
                className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Begin Decompression</span>
              </button>
            ) : (
              <button
                onClick={() => setBreathRunning(false)}
                className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                <span>Pause</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Part 5F Shared Updates Privacy Notice */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900">
            Shared Support Updates ({activeSharedItems.length})
          </h2>
          <span className="text-[11px] font-bold text-orange-800">Consent-Controlled</span>
        </div>
        {activeSharedItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {activeSharedItems.map(item => (
              <div key={item.id} className="p-3.5 rounded-2xl bg-orange-50/50 border border-orange-200 text-xs space-y-1">
                <div className="font-bold text-slate-900">{item.title}</div>
                <div className="text-slate-600">{item.detail}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            No items are currently shared from Personal Journey Mode. Screening records, reflections, and clinical notes are never shared automatically.
          </p>
        )}
      </div>
    </div>
  );
};
