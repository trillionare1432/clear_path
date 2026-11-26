import React from 'react';
import { useApp } from '../../context/AppContext';
import { LEARNER_PATHWAYS, LEARNER_LESSONS, LEARNER_SCENARIOS } from '../../constants/learnerData';
import {
  BarChart3,
  Award,
  BookOpen,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  Flame,
} from 'lucide-react';

export const LearnerAnalyticsView: React.FC = () => {
  const {
    completedLessonIds,
    savedScenarioAttempts,
    quizAttempts,
    learnerEvents,
  } = useApp();

  const totalLessons = LEARNER_LESSONS.length;
  const completedLessons = completedLessonIds.length;
  const overallLessonPct = Math.round((completedLessons / totalLessons) * 100);

  const totalScenarios = LEARNER_SCENARIOS.length;
  const solvedScenarios = Object.keys(savedScenarioAttempts).length;

  // Quiz statistics
  const totalQuizzes = quizAttempts.length;
  const averageQuizPct = totalQuizzes > 0
    ? Math.round(
        (quizAttempts.reduce((acc, q) => acc + (q.score / q.totalQuestions) * 100, 0)) /
          totalQuizzes
      )
    : 0;

  // Compute 7-day activity check
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    const hasEvent = learnerEvents.some(e => e.date === dateStr && e.completed);
    const hasQuiz = quizAttempts.some(q => q.date === dateStr);
    return {
      dateStr,
      dayLabel,
      active: hasEvent || hasQuiz,
    };
  });

  const activeDaysCount = last7Days.filter(d => d.active).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
          Progress & Metrics
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-2">
          Learning Analytics
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
          Visual tracking of your curriculum progress, scenario mastery, and retention scores computed from your real private activity.
        </p>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Overall Curriculum</span>
            <BookOpen className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{overallLessonPct}%</div>
          <div className="text-[11px] text-slate-400">
            {completedLessons} of {totalLessons} lessons completed
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Scenario Mastery</span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {solvedScenarios} / {totalScenarios}
          </div>
          <div className="text-[11px] text-slate-400">Real dilemmas solved</div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Quiz Accuracy</span>
            <Award className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {totalQuizzes > 0 ? `${averageQuizPct}%` : '—'}
          </div>
          <div className="text-[11px] text-slate-400">
            Across {totalQuizzes} concept checks
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>7-Day Consistency</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{activeDaysCount} / 7 days</div>
          <div className="text-[11px] text-slate-400">Active study days this week</div>
        </div>
      </div>

      {/* 7-Day Consistency Visual Strip */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Recent 7-Day Activity Rhythm</h3>
          <span className="text-xs text-slate-400">Real session completions</span>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {last7Days.map((d, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1.5">
              <div
                className={`w-full h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                  d.active
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {d.active ? '✓' : '—'}
              </div>
              <span className="text-[11px] font-semibold text-slate-500">{d.dayLabel}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pathway Completion Progress Bars */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">Progress by Learning Pathway</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Completion across all 8 specialized curriculum pathways.
          </p>
        </div>

        <div className="space-y-4">
          {LEARNER_PATHWAYS.map(p => {
            const pLessons = LEARNER_LESSONS.filter(l => l.pathwayId === p.id);
            const done = pLessons.filter(l => completedLessonIds.includes(l.id)).length;
            const pct = pLessons.length > 0 ? Math.round((done / pLessons.length) * 100) : 0;

            return (
              <div key={p.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      0{p.number}. {p.title}
                    </span>
                    <span className="text-[10px] text-slate-400">({p.malayalamTitle})</span>
                  </div>
                  <span className="font-bold text-indigo-700">{pct}% ({done}/{pLessons.length})</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Milestone Badges */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-600" />
          <span>Curriculum Milestones</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`p-4 rounded-2xl border ${
            completedLessons >= 1
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">First Step</span>
              {completedLessons >= 1 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            <p className="text-[11px] leading-relaxed">Completed your first scientific lesson.</p>
          </div>

          <div className={`p-4 rounded-2xl border ${
            solvedScenarios >= 1
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">Decision Navigator</span>
              {solvedScenarios >= 1 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            <p className="text-[11px] leading-relaxed">Explored an interactive peer dilemma.</p>
          </div>

          <div className={`p-4 rounded-2xl border ${
            totalQuizzes >= 1
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
              : 'bg-slate-50 border-slate-200 text-slate-400'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold">Knowledge Checked</span>
              {totalQuizzes >= 1 && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
            </div>
            <p className="text-[11px] leading-relaxed">Verified your understanding with a quiz.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
