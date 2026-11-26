import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Heart,
  CheckCircle2,
  Smile,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  calculateSupportPlanProgress,
  calculateSupporterWeeklyActivity,
  calculateSupporterMoodDistribution,
} from '../../utils/logic';

export const SupporterProgressView: React.FC = () => {
  const { supportPlans, supporterEvents, supporterReflections } = useApp();

  const [timeRange, setTimeRange] = useState<7 | 30>(7);

  const planStats = calculateSupportPlanProgress(supportPlans);
  const weeklyActivity = calculateSupporterWeeklyActivity(supporterEvents, supporterReflections, timeRange);
  const moodDistribution = calculateSupporterMoodDistribution(supporterReflections);

  const maxActivityCount = Math.max(...weeklyActivity.map(d => d.actionsCount), 3);

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-200/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">
            <TrendingUp className="w-4 h-4 text-amber-700" />
            <span>Reflective Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Supporter Progress & Wellbeing</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Visualize your consistency, review plan milestones, and monitor your emotional equilibrium over time.
          </p>
        </div>

        {/* Range Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setTimeRange(7)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              timeRange === 7 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeRange(30)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              timeRange === 30 ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {/* Top 3 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Plan Action Items
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-amber-800">
            {planStats.completedTasks} / {planStats.totalTasks}
          </div>
          <p className="text-xs text-slate-500">
            {planStats.percentageCompleted}% of coordinated steps completed
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Reflections Logged
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-800">
            {supporterReflections.length}
          </div>
          <p className="text-xs text-slate-500">
            Personal processing entries in your journal
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Scheduled Events
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-teal-800">
            {supporterEvents.filter(e => e.completed).length} / {supporterEvents.length}
          </div>
          <p className="text-xs text-slate-500">
            Completed conversations and self-care routines
          </p>
        </div>
      </div>

      {/* 1. DATA VISUALIZATION: Activity Trend Chart */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Weekly Supporter Activity</h2>
            <p className="text-xs text-slate-500">
              Completed check-ins, journal entries, and scheduled actions
            </p>
          </div>
          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
            {weeklyActivity.filter(d => d.actionsCount > 0).length} active days
          </span>
        </div>

        {/* SVG / HTML Bar Chart */}
        <div className="h-48 sm:h-56 flex items-end justify-between gap-2 pt-6 pb-2 px-2 border-b border-slate-100">
          {weeklyActivity.map((day, idx) => {
            const heightPct = Math.max(8, Math.round((day.actionsCount / maxActivityCount) * 100));
            const hasActivity = day.actionsCount > 0;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                {/* Count tooltip on hover */}
                <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  {day.actionsCount}
                </span>

                {/* Bar */}
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full max-w-[36px] rounded-t-xl transition-all duration-300 ${
                    hasActivity
                      ? 'bg-amber-600 group-hover:bg-amber-700 shadow-xs'
                      : 'bg-slate-100'
                  }`}
                />

                {/* Day label */}
                <span className="text-[11px] font-medium text-slate-500 mt-1 truncate">
                  {day.dayLabel}
                </span>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-amber-600" />
            <span>Active Day (Entries & Events)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded bg-slate-200" />
            <span>Rest / Inactive Day</span>
          </div>
        </div>
      </div>

      {/* 2. Emotional Balance Distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Mood Distribution */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Supporter Emotional States</h3>
            <span className="text-xs text-slate-400">From Journal Entries</span>
          </div>

          <div className="space-y-3">
            {[
              { key: 'steady', label: 'Steady & Grounded', color: 'bg-amber-600' },
              { key: 'encouraged', label: 'Encouraged & Hopeful', color: 'bg-emerald-600' },
              { key: 'patient', label: 'Patient & Mindful', color: 'bg-teal-600' },
              { key: 'overwhelmed', label: 'Overwhelmed', color: 'bg-indigo-600' },
              { key: 'concerned', label: 'Heavy / Concerned', color: 'bg-rose-500' },
            ].map(m => {
              const count = (moodDistribution as any)[m.key] || 0;
              const total = supporterReflections.length;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;

              return (
                <div key={m.key} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{m.label}</span>
                    <span className="text-slate-500 font-mono">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${m.color} rounded-full transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {supporterReflections.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">
              Check in daily via your dashboard or journal to view your emotional distribution.
            </p>
          )}
        </div>

        {/* Burnout Prevention & Balance Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Boundaries & Self-Care</h3>
            <Shield className="w-4 h-4 text-amber-700" />
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Supporting someone through substance concerns is a marathon, not a sprint. Maintaining your personal routines is what makes your care sustainable.
          </p>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2 text-xs text-amber-950">
            <div className="font-bold uppercase tracking-wider">Supporter Rule of Thumb</div>
            <p>
              "I cannot control another person’s choices, but I can control how I respond, how I listen, and how I protect my own peace of mind."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
