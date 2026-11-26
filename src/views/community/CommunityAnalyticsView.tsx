import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BarChart3,
  DollarSign,
  ShieldCheck,
  Layers,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  RefreshCw,
} from 'lucide-react';
import { calculateCommunityImpactMetrics } from '../../utils/logic';
import { PROGRAMME_CATEGORY_OPTIONS, KERALA_DISTRICTS } from '../../constants/communityData';
import { calculateActivityVsOutcomes } from '../../utils/careRelay';

interface ServerAnalyticsData {
  dataSourcesNotice: string;
  verifiedServiceData: {
    verifiedOrgsCount: number;
    verifiedProgrammesCount: number;
    pendingVerificationCount: number;
    byDistrict: Record<string, { verifiedProgrammes: number; totalRegistrations: number }>;
  };
  anonymousEvaluations: {
    preCount: number;
    postCount: number;
    preAvgScorePct: number | null;
    postAvgScorePct: number | null;
    reportedBarriers: Record<string, number>;
  };
}

export const CommunityAnalyticsView: React.FC = () => {
  const {
    communityProgrammes,
    communityEvents,
    communityTasks,
    communityFeedback,
    careRelays,
    language,
    realtimeTick,
  } = useApp();

  const [serverAnalytics, setServerAnalytics] = useState<ServerAnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Pre/Post Evaluation Form State
  const [evalProgrammeId, setEvalProgrammeId] = useState('general');
  const [evalDistrict, setEvalDistrict] = useState('Ernakulam');
  const [evalPhase, setEvalPhase] = useState<'pre' | 'post'>('pre');
  const [evalScore, setEvalScore] = useState(3);
  const [evalMaxScore, setEvalMaxScore] = useState(5);
  const [evalBarrier, setEvalBarrier] = useState('');
  const [evalNote, setEvalNote] = useState('');
  const [evalSubmitting, setEvalSubmitting] = useState(false);
  const [evalStatusMsg, setEvalStatusMsg] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    setLoadingAnalytics(true);
    try {
      const res = await fetch('/api/community/analytics');
      if (res.ok) {
        const data: ServerAnalyticsData = await res.json();
        setServerAnalytics(data);
      }
    } catch {
      // keep existing workspace metrics
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics, realtimeTick]);

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    setEvalSubmitting(true);
    setEvalStatusMsg(null);
    try {
      const res = await fetch('/api/community/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programmeId: evalProgrammeId,
          district: evalDistrict,
          phase: evalPhase,
          score: Number(evalScore),
          maxScore: Number(evalMaxScore) || 5,
          accessibilityBarrier: evalBarrier.trim() || undefined,
          feedbackNote: evalNote.trim() || undefined,
        }),
      });
      if (res.ok) {
        setEvalStatusMsg('Anonymous pre/post evaluation recorded.');
        setEvalBarrier('');
        setEvalNote('');
        await loadAnalytics();
      }
    } finally {
      setEvalSubmitting(false);
    }
  };

  const metrics = calculateCommunityImpactMetrics(
    communityProgrammes,
    communityEvents,
    communityTasks,
    communityFeedback
  );

  const activityVsOutcomes = calculateActivityVsOutcomes(
    communityProgrammes,
    communityEvents,
    communityFeedback,
    careRelays,
    KERALA_DISTRICTS
  );

  const categoryCounts: Record<string, number> = {};
  for (const prog of communityProgrammes) {
    categoryCounts[prog.category] = (categoryCounts[prog.category] || 0) + 1;
  }

  const recentEventsWithAttendance = communityEvents
    .filter(e => e.expectedAttendance > 0 || e.actualAttendance > 0)
    .slice(-6);

  const maxAttendance = Math.max(
    1,
    ...recentEventsWithAttendance.map(e => Math.max(e.expectedAttendance, e.actualAttendance))
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>{language === 'ml' ? 'പ്രവർത്തന വിശകലനം' : 'Operations & Learning Analytics'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {language === 'ml' ? 'ഇംപാക്റ്റ് & പ്രോഗ്രാം അനലിറ്റിക്സ്' : 'Community Impact & Programme Analytics'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {language === 'ml'
              ? 'യഥാർത്ഥത്തിൽ രേഖപ്പെടുത്തിയ പങ്കാളിത്തം, പൂർത്തിയാക്കിയ ഇവന്റുകൾ, ബഡ്ജറ്റ് വിവരങ്ങൾ എന്നിവയുടെ അടിസ്ഥാനത്തിലുള്ള വിശകലനം.'
              : 'Empirical operational insights strictly derived from actual recorded attendance, verified org directories, and anonymous pre/post knowledge evaluations.'}
          </p>
        </div>

        <button
          type="button"
          onClick={loadAnalytics}
          disabled={loadingAnalytics}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingAnalytics ? 'animate-spin' : ''}`} />
          <span>Sync Analytics</span>
        </button>
      </div>

      {/* Part 7E Ethical Reach vs Efficacy Disclaimer */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-950">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong className="block font-extrabold mb-0.5">Measurement Boundary (Reach vs. Prevention Efficacy)</strong>
          <span>
            Attendance counts measure event reach — not proof of prevention efficacy. Evaluate alongside pre/post knowledge assessments and participant feedback.
          </span>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Verified Attendance
          </span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">
            {metrics.totalActualAttendance}
          </div>
          <span className="text-[11px] text-teal-800 font-medium">
            {metrics.totalExpectedAttendance} projected reach (event reach only)
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Event Delivery Rate
          </span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">
            {metrics.totalEvents > 0
              ? `${Math.round((metrics.completedEvents / metrics.totalEvents) * 100)}%`
              : '0%'}
          </div>
          <span className="text-[11px] text-slate-500">
            {metrics.completedEvents} of {metrics.totalEvents} executed
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Task Execution Rate
          </span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">
            {metrics.taskCompletionRatePct}%
          </div>
          <span className="text-[11px] text-indigo-700 font-medium">
            {metrics.completedTasks} of {metrics.totalTasks} completed
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Budget Utilization
          </span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">
            {metrics.budgetUtilizationPct}%
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            ₹{metrics.totalSpent.toLocaleString()} of ₹{metrics.totalBudget.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Live Server Public Directory & Pre/Post Knowledge Evaluation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Aggregated Server Stats */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              Server-Verified Programmes &amp; Pre/Post Learning Outcomes
            </h2>
            <ShieldCheck className="w-4 h-4 text-teal-700" />
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-slate-500 block">Verified Orgs / Programmes</span>
              <strong className="text-lg font-mono text-slate-900">
                {serverAnalytics?.verifiedServiceData.verifiedOrgsCount ?? 0} orgs ·{' '}
                {serverAnalytics?.verifiedServiceData.verifiedProgrammesCount ?? 0} live
              </strong>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-slate-500 block">Pending Verification</span>
              <strong className="text-lg font-mono text-amber-800">
                {serverAnalytics?.verifiedServiceData.pendingVerificationCount ?? 0}
              </strong>
            </div>
            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80">
              <span className="text-indigo-900 block font-semibold">
                Pre-Session Avg ({serverAnalytics?.anonymousEvaluations.preCount ?? 0})
              </span>
              <strong className="text-xl font-mono text-indigo-950">
                {serverAnalytics?.anonymousEvaluations.preAvgScorePct !== null &&
                serverAnalytics?.anonymousEvaluations.preAvgScorePct !== undefined
                  ? `${serverAnalytics.anonymousEvaluations.preAvgScorePct}%`
                  : 'No data'}
              </strong>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
              <span className="text-emerald-900 block font-semibold">
                Post-Session Avg ({serverAnalytics?.anonymousEvaluations.postCount ?? 0})
              </span>
              <strong className="text-xl font-mono text-emerald-950">
                {serverAnalytics?.anonymousEvaluations.postAvgScorePct !== null &&
                serverAnalytics?.anonymousEvaluations.postAvgScorePct !== undefined
                  ? `${serverAnalytics.anonymousEvaluations.postAvgScorePct}%`
                  : 'No data'}
              </strong>
            </div>
          </div>

          {serverAnalytics &&
            Object.keys(serverAnalytics.anonymousEvaluations.reportedBarriers).length > 0 && (
              <div className="pt-2 space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Reported Accessibility / Language Barriers
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(serverAnalytics.anonymousEvaluations.reportedBarriers).map(
                    ([barrier, cnt]) => (
                      <span
                        key={barrier}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 text-xs text-slate-700 font-medium"
                      >
                        {barrier} ({cnt})
                      </span>
                    )
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Submit Anonymous Pre/Post Evaluation */}
        <form
          onSubmit={handleSubmitEvaluation}
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-teal-800" />
              <h2 className="text-base font-bold text-slate-900">
                Log Anonymous Pre/Post Knowledge Evaluation
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Assessment Phase
              </label>
              <select
                value={evalPhase}
                onChange={e => setEvalPhase(e.target.value as 'pre' | 'post')}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
              >
                <option value="pre">Pre-Programme Baseline</option>
                <option value="post">Post-Programme Check</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                District
              </label>
              <select
                value={evalDistrict}
                onChange={e => setEvalDistrict(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
              >
                {KERALA_DISTRICTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Programme
              </label>
              <select
                value={evalProgrammeId}
                onChange={e => setEvalProgrammeId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
              >
                <option value="general">General Community Session</option>
                {communityProgrammes.map(p => (
                  <option key={p.id} value={p.id}>{p.title.slice(0, 32)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Score Achieved
              </label>
              <input
                type="number"
                min={0}
                max={evalMaxScore}
                value={evalScore}
                onChange={e => setEvalScore(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Max Score
              </label>
              <input
                type="number"
                min={1}
                value={evalMaxScore}
                onChange={e => setEvalMaxScore(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Barrier (Optional)
              </label>
              <input
                type="text"
                value={evalBarrier}
                onChange={e => setEvalBarrier(e.target.value)}
                placeholder="e.g. Needs Malayalam handouts"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div>
            <input
              type="text"
              value={evalNote}
              onChange={e => setEvalNote(e.target.value)}
              placeholder="Optional anonymous participant feedback..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            {evalStatusMsg ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {evalStatusMsg}
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">Zero personal identifiers stored.</span>
            )}
            <button
              type="submit"
              disabled={evalSubmitting}
              className="px-4 py-2 rounded-xl bg-teal-900 hover:bg-indigo-900 disabled:opacity-60 text-white text-xs font-bold cursor-pointer"
            >
              {evalSubmitting ? 'Submitting...' : 'Submit Evaluation'}
            </button>
          </div>
        </form>
      </div>

      {/* SVG Chart 1: Attendance by Event (Expected vs Actual) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Event Participation: Projected vs Actual Reached
            </h2>
            <p className="text-xs text-slate-500">
              Comparison of expected student/community capacity against verified participants
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-teal-700" />
              <span>Actual Reached</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-slate-200" />
              <span>Projected</span>
            </div>
          </div>
        </div>

        {recentEventsWithAttendance.length > 0 ? (
          <div className="h-56 w-full flex items-end gap-3 sm:gap-6 pt-6">
            {recentEventsWithAttendance.map((ev, idx) => {
              const actualPct =
                ev.actualAttendance > 0 ? Math.max(10, (ev.actualAttendance / maxAttendance) * 100) : 0;
              const expectedPct =
                ev.expectedAttendance > 0
                  ? Math.max(10, (ev.expectedAttendance / maxAttendance) * 100)
                  : 0;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10 font-mono">
                    {ev.title}: {ev.actualAttendance} / {ev.expectedAttendance}
                  </div>

                  <div className="w-full flex items-end justify-center gap-1 h-full">
                    <div
                      className="w-1/2 max-w-[24px] bg-slate-200 rounded-t-md transition-all duration-300"
                      style={{ height: `${expectedPct}%` }}
                    />
                    <div
                      className="w-1/2 max-w-[24px] bg-teal-700 group-hover:bg-teal-800 rounded-t-md transition-all duration-300"
                      style={{ height: `${actualPct}%` }}
                    />
                  </div>

                  <span className="text-[10px] text-slate-500 mt-2 font-mono truncate max-w-full text-center">
                    {ev.title.slice(0, 10)}...
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <p className="text-xs text-slate-500">
              No participation data available yet. Schedule activities and record verified attendance to view comparative reach graphs.
            </p>
          </div>
        )}
      </div>

      {/* Grid: Programme Distribution by Category & Budget Utilization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              Programme Category Distribution
            </h2>
            <Layers className="w-4 h-4 text-teal-700" />
          </div>

          {communityProgrammes.length > 0 ? (
            <div className="space-y-3">
              {PROGRAMME_CATEGORY_OPTIONS.map(cat => {
                const count = categoryCounts[cat.id] || 0;
                const total = Math.max(1, communityProgrammes.length);
                const pct = Math.round((count / total) * 100);

                if (count === 0) return null;

                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{cat.label}</span>
                      <span className="font-mono text-slate-500">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-teal-700 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500">
              No programmes created to analyze category balance.
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Resource &amp; Budget Allocation</h2>
            <DollarSign className="w-4 h-4 text-teal-700" />
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                  Total Dedicated Budget
                </span>
                <div className="text-xl font-bold font-mono text-teal-950 mt-0.5">
                  ₹{metrics.totalBudget.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Total Expenditure
                </span>
                <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">
                  ₹{metrics.totalSpent.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-medium">Budget Efficiency</span>
                <span className="font-mono font-bold text-teal-800">
                  {metrics.budgetUtilizationPct}% utilized
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${metrics.budgetUtilizationPct}%` }}
                />
              </div>
            </div>

            <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
              Budgets help schools and NGOs track grant compliance and ensure awareness printouts, guest speakers, and refreshments stay within planned parameters.
            </div>
          </div>
        </div>
      </div>

      {/* Separated Activity Outputs vs Verified Outcomes & Geographic Gaps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              Operational Activity Counts
            </h2>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-200">
              Activities Delivered
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-slate-500 block">Published Programmes</span>
              <strong className="text-xl font-mono text-slate-900">
                {activityVsOutcomes.activities.programmesPublished}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-slate-500 block">Draft / Pending Review</span>
              <strong className="text-xl font-mono text-amber-800">
                {activityVsOutcomes.activities.programmesDraftOrPending}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-slate-500 block">Events Completed</span>
              <strong className="text-xl font-mono text-slate-900">
                {activityVsOutcomes.activities.eventsHeld}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-slate-500 block">Participant Registrations</span>
              <strong className="text-xl font-mono text-teal-900">
                {activityVsOutcomes.activities.participantRegistrations}
              </strong>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              Outcomes, Care Relays &amp; District Gaps
            </h2>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200">
              Anonymised Outcomes
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-slate-500 block">Avg Clarity / Usefulness</span>
              <strong className="text-xl font-mono text-indigo-950">
                {activityVsOutcomes.outcomes.averageClarityRating} / {activityVsOutcomes.outcomes.averageUsefulnessRating}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-slate-500 block">Care Relays Initiated</span>
              <strong className="text-xl font-mono text-slate-900">
                {activityVsOutcomes.outcomes.careRelaysInitiated}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-slate-500 block">Contact / Confirmed</span>
              <strong className="text-xl font-mono text-teal-900">
                {activityVsOutcomes.outcomes.careRelaysContactOrConfirmed}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
              <span className="text-slate-500 block">Uncovered Districts</span>
              <strong className="text-xl font-mono text-amber-800">
                {activityVsOutcomes.outcomes.uncoveredDistrictCount}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Ethical Assurance & Kerala/India Dataset Context */}
      <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900">Verifiable Operational Reporting &amp; Activity-vs-Outcome Boundary: </span>
            Charts above separate <strong>operational activity outputs</strong> (events delivered, seats filled, tasks finished) from <strong>participant attitude &amp; learning indicators</strong> (anonymous pre/post clarity scores, feedback usefulness ratings, and care relay connections). Attendance volume alone never proves long-term substance abstinence. Zero Role 01 personal logs or clinical notes ever enter Role 04 analytics.
          </div>
        </div>
        <div className="pl-8 text-[11px] text-slate-500">
          Benchmark references: MoSJE &amp; NDDTC AIIMS (2019), NFHS-5 Kerala (2019–21), NIMHANS NMHS Treatment Gap, Kerala Vimukthi Mission (14405), and Tele-MANAS (14416).
        </div>
      </div>
    </div>
  );
};
