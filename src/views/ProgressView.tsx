import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart3,
  CheckCircle2,
  Award,
  Shield,
  Flame,
  Sparkles,
  Target,
  CalendarCheck,
  Heart,
  Brain,
  Lock,
  Send,
  MessageSquare,
  FileText,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Moon,
  TrendingUp,
  Loader2,
  GitCompare,
} from 'lucide-react';
import {
  calculateActivityConsistency,
  calculateGoalProgress,
  calculateMoodDistribution,
  calculateRecoveryStreak,
  calculateAchievementBadges,
} from '../utils/logic';
import {
  computeMonthlyCalendarMap,
  computeRecoveryAnalytics,
} from '../utils/recoveryIntelligence';
import {
  RecoveryReportPeriod,
  RecoveryReportRecord,
  SecureMessageClient,
  TherapistConnectionRecord,
  WeeklyProgressSubmissionClient,
} from '../types';

type ProgressSubTab = 'overview' | 'calendar' | 'analytics' | 'reports';

export const ProgressView: React.FC = () => {
  const {
    language,
    dailyLogs,
    goals,
    calendarEvents,
    habitChallenges,
    gameStats,
    personalOnboarding,
    recoveryReports,
    addRecoveryReport,
    updateRecoveryStartDate,
    serverAuthToken,
    serverAuthUser,
  } = useApp();

  const [subTab, setSubTab] = useState<ProgressSubTab>('overview');
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(7);

  // Editable Recovery Start Date
  const [startDateInput, setStartDateInput] = useState<string>(
    personalOnboarding?.recoveryStartDate || ''
  );
  const [startDateSavedToast, setStartDateSavedToast] = useState(false);

  useEffect(() => {
    setStartDateInput(personalOnboarding?.recoveryStartDate || '');
  }, [personalOnboarding?.recoveryStartDate]);

  // Interactive Monthly Calendar State
  const [calMonthDate, setCalMonthDate] = useState<Date>(() => new Date());
  const [selectedDayStr, setSelectedDayStr] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );

  // AI Weekly / Monthly Recovery Reports
  const [reportGenerating, setReportGenerating] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [compareIdA, setCompareIdA] = useState<string>('');
  const [compareIdB, setCompareIdB] = useState<string>('');

  // Weekly Progress Submission & Therapist Messaging
  const [connections, setConnections] = useState<TherapistConnectionRecord[]>([]);
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyProgressSubmissionClient[]>([]);
  const [messages, setMessages] = useState<SecureMessageClient[]>([]);
  const [wpActivities, setWpActivities] = useState('');
  const [wpGoals, setWpGoals] = useState('');
  const [wpDifficulties, setWpDifficulties] = useState('');
  const [wpHelped, setWpHelped] = useState('');
  const [wpQuestions, setWpQuestions] = useState('');
  const [wpStatusMsg, setWpStatusMsg] = useState<string | null>(null);
  const [msgText, setMsgText] = useState('');

  const loadCareContinuity = useCallback(async () => {
    if (!serverAuthToken || serverAuthUser?.role !== 'user') return;
    try {
      const res = await fetch('/api/care/workspace', {
        headers: { Authorization: `Bearer ${serverAuthToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
        setWeeklyHistory(data.weeklyProgress || []);
        setMessages(data.messages || []);
      }
    } catch {
      // ignore offline
    }
  }, [serverAuthToken, serverAuthUser]);

  useEffect(() => {
    loadCareContinuity();
  }, [loadCareContinuity]);

  useEffect(() => {
    if (recoveryReports.length >= 1 && !compareIdA) {
      setCompareIdA(recoveryReports[0].id);
    }
    if (recoveryReports.length >= 2 && !compareIdB) {
      setCompareIdB(recoveryReports[1].id);
    }
  }, [recoveryReports, compareIdA, compareIdB]);

  const activeTherapistConn = connections.find(c => c.status === 'accepted') || null;

  const handleSaveStartDate = () => {
    updateRecoveryStartDate(startDateInput.trim());
    setStartDateSavedToast(true);
    setTimeout(() => setStartDateSavedToast(false), 2000);
  };

  const handleGenerateAiReport = async (period: RecoveryReportPeriod) => {
    setReportGenerating(true);
    setReportError(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (serverAuthToken) {
        headers.Authorization = `Bearer ${serverAuthToken}`;
      }
      const res = await fetch('/api/ai/recovery-report', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          period,
          language,
          logs: dailyLogs,
          goals,
          careStatus: personalOnboarding?.clinicalTreatmentStatus || 'self_reported_only',
        }),
      });
      if (!res.ok) {
        throw new Error('Could not generate report right now.');
      }
      const data = (await res.json()) as RecoveryReportRecord;
      addRecoveryReport(data);
      setCompareIdA(data.id);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Unable to generate report.');
    } finally {
      setReportGenerating(false);
    }
  };

  const handleSubmitWeeklyProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverAuthToken) return;
    setWpStatusMsg(null);
    const res = await fetch('/api/care/weekly-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({
        therapistId: activeTherapistConn?.therapistId,
        weekStarting: new Date().toISOString().split('T')[0],
        completedActivities: wpActivities.split(',').map(s => s.trim()).filter(Boolean),
        goalsWorkedOn: wpGoals.split(',').map(s => s.trim()).filter(Boolean),
        difficulties: wpDifficulties,
        whatHelped: wpHelped,
        discussionTopics: '',
        questionsForTherapist: wpQuestions,
      }),
    });
    if (res.ok) {
      setWpActivities('');
      setWpGoals('');
      setWpDifficulties('');
      setWpHelped('');
      setWpQuestions('');
      setWpStatusMsg('Weekly progress update submitted securely.');
      loadCareContinuity();
    } else {
      const d = await res.json();
      setWpStatusMsg(d.error || 'Please fill in at least one progress detail.');
    }
  };

  const handleSendAsyncMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverAuthToken || !activeTherapistConn || !msgText.trim()) return;
    const res = await fetch('/api/care/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({
        connectionId: activeTherapistConn.id,
        text: msgText.trim(),
      }),
    });
    if (res.ok) {
      setMsgText('');
      loadCareContinuity();
    }
  };

  const consistency = calculateActivityConsistency(dailyLogs, timeRange);
  const goalStats = calculateGoalProgress(goals);
  const moodDist = calculateMoodDistribution(dailyLogs);
  const streakInfo = calculateRecoveryStreak(dailyLogs, calendarEvents);
  const badges = calculateAchievementBadges(dailyLogs, calendarEvents, goals, gameStats);

  const analytics = useMemo(
    () =>
      computeRecoveryAnalytics(
        dailyLogs,
        calendarEvents,
        goals,
        habitChallenges,
        personalOnboarding?.recoveryStartDate
      ),
    [dailyLogs, calendarEvents, goals, habitChallenges, personalOnboarding?.recoveryStartDate]
  );

  const calYear = calMonthDate.getFullYear();
  const calMonth = calMonthDate.getMonth();
  const calFirstDayIdx = new Date(calYear, calMonth, 1).getDay();
  const monthlyCells = useMemo(
    () => computeMonthlyCalendarMap(calYear, calMonth, dailyLogs, calendarEvents),
    [calYear, calMonth, dailyLogs, calendarEvents]
  );

  const selectedDayLogs = dailyLogs.filter(l => l.date === selectedDayStr && !l.isDraft);
  const selectedDayEvents = calendarEvents.filter(e => e.date === selectedDayStr);

  const totalLogs = analytics.totalLogs;
  const completedEvents = calendarEvents.filter(
    e => e.completionState === 'completed' || (e.completionState === undefined && e.completed)
  ).length;
  const appointmentsAttended = calendarEvents.filter(
    e => e.category === 'appointment' && (e.completionState === 'completed' || e.completed)
  ).length;

  const maxActivities = Math.max(1, ...consistency.map(d => d.activityCount));
  const unlockedBadgesCount = badges.filter(b => b.unlocked).length;

  const renderBadgeIcon = (iconName: string, unlocked: boolean) => {
    const className = `w-5 h-5 ${unlocked ? 'text-indigo-700' : 'text-slate-400'}`;
    switch (iconName) {
      case 'Flame':
        return <Flame className={className} />;
      case 'Shield':
        return <Shield className={className} />;
      case 'CalendarCheck':
        return <CalendarCheck className={className} />;
      case 'Target':
        return <Target className={className} />;
      case 'Award':
        return <Award className={className} />;
      case 'Brain':
        return <Brain className={className} />;
      case 'Heart':
        return <Heart className={className} />;
      case 'Sparkles':
      default:
        return <Sparkles className={className} />;
    }
  };

  const reportA = recoveryReports.find(r => r.id === compareIdA) || null;
  const reportB = recoveryReports.find(r => r.id === compareIdB) || null;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-800 uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Recovery Progress Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Progress &amp; Reports</h1>
          <p className="text-sm text-slate-600 mt-1">
            Calm, non-judgmental tracking of your routines, monthly rhythm, growth signals, and AI summaries.
          </p>
        </div>

        {/* Clean 4 Sub-Tabs */}
        <div className="flex flex-wrap p-1 bg-slate-100 rounded-xl gap-1">
          {(
            [
              { id: 'overview', label: 'Recovery Card' },
              { id: 'calendar', label: 'Monthly Calendar' },
              { id: 'analytics', label: 'Growth Analytics' },
              { id: 'reports', label: 'AI Reports & Care' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                subTab === tab.id ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================
          SUB-TAB 1: PERSONAL RECOVERY CARD & MILESTONES
      ======================================================== */}
      {subTab === 'overview' && (
        <div className="space-y-6">
          {/* Editable Recovery Card Banner */}
          <section className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-md border border-indigo-800/40 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="p-3.5 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl shrink-0">
                  <Flame className="w-8 h-8 text-amber-300" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                      Personal Recovery Card
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-500/30 text-indigo-100 border border-indigo-400/30">
                      {personalOnboarding?.clinicalTreatmentStatus === 'clinician_confirmed_treatment'
                        ? 'Clinician-Confirmed Care'
                        : 'Self-Reported Journey'}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {analytics.totalDaysSinceStart !== null
                      ? `Day ${analytics.totalDaysSinceStart} since your chosen start date`
                      : streakInfo.currentStreak > 0
                      ? `${streakInfo.currentStreak} Day${streakInfo.currentStreak === 1 ? '' : 's'} Active Continuity`
                      : 'Begin whenever you feel ready'}
                  </h2>
                  <p className="text-xs sm:text-sm text-indigo-100/85 mt-1 max-w-xl">
                    Every check-in counts. Difficult days or unlogged pauses never erase your past effort or bring shame.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-indigo-700/50 pt-4 md:pt-0 md:pl-6 shrink-0">
                <div className="text-center px-3">
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-indigo-200">
                    {analytics.logsLast7Days}
                  </div>
                  <div className="text-[11px] text-indigo-200/75 uppercase tracking-wider font-medium">
                    7-Day Logs
                  </div>
                </div>
                <div className="w-px h-10 bg-indigo-700/50" />
                <div className="text-center px-3">
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-300">
                    {streakInfo.longestStreak}
                  </div>
                  <div className="text-[11px] text-amber-200/75 uppercase tracking-wider font-medium">
                    Best Streak
                  </div>
                </div>
              </div>
            </div>

            {/* Editable Start Date Row */}
            <div className="pt-4 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="text-indigo-100/85">
                <strong>Recovery Start Date:</strong> Optional and editable anytime — set the date that feels meaningful to you.
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDateInput}
                  onChange={e => setStartDateInput(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white/15 border border-white/25 text-white text-xs font-semibold"
                />
                <button
                  type="button"
                  onClick={handleSaveStartDate}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-indigo-950 font-extrabold cursor-pointer"
                >
                  {startDateSavedToast ? 'Saved' : 'Save Date'}
                </button>
              </div>
            </div>
          </section>

          {/* KPI Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Total Check-ins</span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 font-mono">{totalLogs}</div>
              <span className="text-[11px] text-indigo-700 font-medium">Private reflections</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Active Goals</span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 font-mono">
                {goals.filter(g => !g.completed).length}
              </div>
              <span className="text-[11px] text-slate-500">
                {goalStats.completedMilestones} of {goalStats.totalMilestones} steps done
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Routines Completed</span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 font-mono">{completedEvents}</div>
              <span className="text-[11px] text-teal-700 font-medium">Calendar blocks finished</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Appointments Attended</span>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 font-mono">
                {appointmentsAttended}
              </div>
              <span className="text-[11px] text-rose-700 font-medium">Clinician / care visits</span>
            </div>
          </div>

          {/* Goal Milestones */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Goal Milestones</h2>
              <span className="text-xs font-bold text-indigo-800 font-mono">
                {goalStats.completedMilestones}/{goalStats.totalMilestones} Steps Done
              </span>
            </div>

            {goals.length === 0 ? (
              <p className="text-xs text-slate-500">
                No personal goals added yet. Open Rebuild My Life to create gentle life milestones.
              </p>
            ) : (
              <div className="space-y-4">
                {goals.map(goal => {
                  const totalMs = goal.milestones.length;
                  const doneMs = goal.milestones.filter(m => m.completed).length;
                  const pct = totalMs > 0 ? Math.round((doneMs / totalMs) * 100) : goal.completed ? 100 : 0;

                  return (
                    <div key={goal.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 truncate max-w-[240px]">{goal.title}</span>
                        <span className="font-mono text-slate-500">
                          {doneMs}/{totalMs} steps ({pct}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-700 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Milestone Badges */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Personal Recovery Badges</h2>
                <p className="text-xs text-slate-500">
                  Celebrating self-care follow-through and rebuilding habits — never tied to streak punishment.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto bg-indigo-50 border border-indigo-200/60 rounded-xl px-3 py-1.5">
                <Sparkles className="w-4 h-4 text-indigo-700" />
                <span className="text-xs font-bold text-indigo-800 font-mono">
                  {unlockedBadgesCount} / {badges.length} Unlocked
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {badges.map(badge => (
                <div
                  key={badge.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                    badge.unlocked
                      ? 'bg-gradient-to-b from-white to-indigo-50/40 border-indigo-200/90 shadow-xs'
                      : 'bg-slate-50/70 border-slate-200/70 opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          badge.unlocked
                            ? 'bg-indigo-100 border border-indigo-200 text-indigo-800'
                            : 'bg-slate-200/60 border border-slate-200 text-slate-400'
                        }`}
                      >
                        {renderBadgeIcon(badge.iconName, badge.unlocked)}
                      </div>
                      <span
                        className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full tracking-wider ${
                          badge.unlocked ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {badge.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{badge.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{badge.description}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    {badge.unlocked ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Unlocked</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Lock className="w-3 h-3 text-slate-400" />
                          In Progress
                        </span>
                        <span className="font-mono">{badge.progress}%</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 2: INTERACTIVE MONTHLY CALENDAR (4 STATES)
      ======================================================== */}
      {subTab === 'calendar' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-indigo-700" />
                  <span>
                    {calMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Unlogged days stay neutral — only days you explicitly mark as skipped appear as skipped.
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCalMonthDate(new Date(calYear, calMonth - 1, 1))}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    setCalMonthDate(now);
                    setSelectedDayStr(now.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setCalMonthDate(new Date(calYear, calMonth + 1, 1))}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 4-State Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-teal-900">
                <span className="w-3 h-3 rounded bg-teal-500 inline-block" />
                Completed
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-amber-900">
                <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
                Partial
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                <span className="w-3 h-3 rounded bg-slate-400 inline-block" />
                Skipped (Explicit)
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-500">
                <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300 inline-block" />
                Unlogged (Neutral)
              </span>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-bold text-slate-400">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: calFirstDayIdx }).map((_, idx) => (
                <div key={`blank-${idx}`} className="h-16 sm:h-20 rounded-xl bg-slate-50/40" />
              ))}
              {monthlyCells.map(cell => {
                const isSelected = cell.date === selectedDayStr;
                const stateStyle =
                  cell.state === 'completed'
                    ? 'bg-teal-50 border-teal-300 text-teal-950'
                    : cell.state === 'partial'
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : cell.state === 'skipped'
                    ? 'bg-slate-200/70 border-slate-300 text-slate-700'
                    : 'bg-white border-slate-200 text-slate-500';

                return (
                  <button
                    key={cell.date}
                    type="button"
                    onClick={() => setSelectedDayStr(cell.date)}
                    className={`h-16 sm:h-20 p-2 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${stateStyle} ${
                      isSelected ? 'ring-2 ring-indigo-700 shadow-xs' : 'hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold font-mono">{cell.dayNumber}</span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          cell.state === 'completed'
                            ? 'bg-teal-600'
                            : cell.state === 'partial'
                            ? 'bg-amber-500'
                            : cell.state === 'skipped'
                            ? 'bg-slate-500'
                            : 'bg-slate-200'
                        }`}
                      />
                    </div>
                    <div className="text-[10px] font-semibold truncate capitalize">
                      {cell.state === 'unlogged'
                        ? 'Unlogged'
                        : `${cell.state}${cell.logsCount > 0 ? ` · ${cell.logsCount} log` : ''}`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Inspector */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Day Details · {selectedDayStr}
            </h3>

            {selectedDayLogs.length === 0 && selectedDayEvents.length === 0 ? (
              <p className="text-xs text-slate-500">
                No journal logs or scheduled events recorded on {selectedDayStr} (Unlogged).
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div className="font-bold text-slate-700">Daily Logs ({selectedDayLogs.length})</div>
                  {selectedDayLogs.map(log => (
                    <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <div className="font-bold capitalize text-indigo-950">
                        Mood: {log.mood || 'Not set'}
                      </div>
                      {log.quickNote && <p className="text-slate-700">{log.quickNote}</p>}
                      {log.completedActivities.length > 0 && (
                        <div className="text-[11px] text-teal-800 font-medium">
                          Activities: {log.completedActivities.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <div className="font-bold text-slate-700">
                    Scheduled Routines &amp; Visits ({selectedDayEvents.length})
                  </div>
                  {selectedDayEvents.map(ev => (
                    <div key={ev.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900">{ev.title}</div>
                        {ev.startTime && <div className="text-[11px] text-slate-500">{ev.startTime}</div>}
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-bold capitalize">
                        {ev.completionState || (ev.completed ? 'completed' : 'planned')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 3: GROWTH ANALYTICS (NO ARBITRARY SCORES)
      ======================================================== */}
      {subTab === 'analytics' && (
        <div className="space-y-6">
          {/* Growth & Routine Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-700" />
                <span>7d vs Prior 7d Logs</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                {analytics.logsLast7Days} <span className="text-sm text-slate-400">vs {analytics.logsPrev7Days}</span>
              </div>
              <span className="text-[11px] text-slate-500">30d total: {analytics.logsLast30Days}</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                <Moon className="w-3.5 h-3.5 text-sky-600" />
                <span>Avg Logged Sleep</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                {analytics.avgSleepHours !== null ? `${analytics.avgSleepHours}h` : '—'}
              </div>
              <span className="text-[11px] text-slate-500">From optional daily check-ins</span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Avg Craving Intensity</div>
              <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                {analytics.avgCravingIntensity !== null ? `${analytics.avgCravingIntensity}/10` : '—'}
              </div>
              <span className="text-[11px] text-slate-500">
                {analytics.avgCravingFrequency !== null
                  ? `Avg freq: ${analytics.avgCravingFrequency}/day`
                  : 'Optional in Daily Log'}
              </span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="text-xs font-semibold text-slate-500">Steady Routine Days</div>
              <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
                {analytics.steadyRoutineRatePct !== null ? `${analytics.steadyRoutineRatePct}%` : '—'}
              </div>
              <span className="text-[11px] text-teal-700 font-medium">
                {analytics.steadyRoutineDaysCount} steady day(s) · {analytics.habitCompletionCount} habits
              </span>
            </div>
          </div>

          {/* Activity Consistency SVG Bar Chart */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Activity Consistency</h2>
                <p className="text-xs text-slate-500">
                  Healthy actions recorded per day (pure count — no synthetic score)
                </p>
              </div>
              <div className="flex p-1 bg-slate-100 rounded-xl">
                {([7, 30, 90] as const).map(range => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer ${
                      timeRange === range ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    {range}d
                  </button>
                ))}
              </div>
            </div>

            <div className="h-44 w-full flex items-end gap-1 sm:gap-2 pt-6">
              {consistency.map((item, idx) => {
                const heightPercent =
                  item.activityCount > 0 ? Math.max(15, (item.activityCount / maxActivities) * 100) : 4;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10 shadow-sm font-mono">
                      {item.date}: {item.activityCount} acts
                    </div>
                    <div
                      className={`w-full rounded-t-md transition-all duration-300 ${
                        item.activityCount > 0 ? 'bg-indigo-700 group-hover:bg-indigo-800' : 'bg-slate-100'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[9px] sm:text-[10px] text-slate-400 mt-2 font-mono truncate max-w-full">
                      {timeRange === 7 ? item.dayLabel : item.date.slice(8)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mood Distribution + Top Triggers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h2 className="text-base font-bold text-slate-900">Logged Mood Distribution</h2>
                <span className="text-xs text-slate-500">Observed counts</span>
              </div>

              <div className="space-y-3">
                {[
                  { type: 'peaceful', label: 'Peaceful', count: moodDist.peaceful, color: 'bg-indigo-500' },
                  { type: 'steady', label: 'Steady', count: moodDist.steady, color: 'bg-teal-500' },
                  { type: 'hopeful', label: 'Hopeful', count: moodDist.hopeful, color: 'bg-sky-500' },
                  { type: 'challenged', label: 'Challenged', count: moodDist.challenged, color: 'bg-amber-500' },
                  { type: 'heavy', label: 'Heavy', count: moodDist.heavy, color: 'bg-slate-400' },
                ].map(m => {
                  const total = Math.max(1, totalLogs);
                  const pct = Math.round((m.count / total) * 100);
                  return (
                    <div key={m.type} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 font-medium">{m.label}</span>
                        <span className="font-mono text-slate-500">{m.count} logs</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className={`${m.color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Observed Triggers &amp; Tags</h2>
                <span className="text-xs text-slate-500">From your logs</span>
              </div>

              {analytics.topTriggers.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No trigger tags recorded yet. Adding tags like #stress or #evening in Daily Log helps spot patterns calmly.
                </p>
              ) : (
                <div className="space-y-2.5">
                  {analytics.topTriggers.map(item => (
                    <div
                      key={item.tag}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <span className="font-semibold text-slate-800">#{item.tag}</span>
                      <span className="font-mono font-bold text-indigo-900">{item.count}x</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 4: AI REPORTS, ARCHIVE COMPARISON & THERAPIST CARE
      ======================================================== */}
      {subTab === 'reports' && (
        <div className="space-y-6">
          {/* AI Weekly & Monthly Report Generator */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>AI Recovery Reflection Reports</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generates a non-diagnostic summary of your logged strengths, triggers, sleep, and gentle next steps — stored in history for comparison.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  disabled={reportGenerating}
                  onClick={() => handleGenerateAiReport('weekly')}
                  className="px-4 py-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {reportGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                  <span>Generate Weekly Report</span>
                </button>
                <button
                  type="button"
                  disabled={reportGenerating}
                  onClick={() => handleGenerateAiReport('monthly')}
                  className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <span>Generate Monthly Report</span>
                </button>
              </div>
            </div>

            {reportError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {reportError}
              </div>
            )}

            {recoveryReports.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                No AI reflection reports generated yet. Generate your first Weekly or Monthly reflection above.
              </div>
            ) : (
              <div className="space-y-4">
                {recoveryReports.length >= 2 && (
                  <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-indigo-950 inline-flex items-center gap-1.5">
                        <GitCompare className="w-4 h-4 text-indigo-700" />
                        <span>Compare Two Historical Reports</span>
                      </span>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <select
                          value={compareIdA}
                          onChange={e => setCompareIdA(e.target.value)}
                          className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-white font-semibold"
                        >
                          {recoveryReports.map(r => (
                            <option key={r.id} value={r.id}>
                              {r.period.toUpperCase()} · {r.periodStart} to {r.periodEnd}
                            </option>
                          ))}
                        </select>
                        <span className="text-slate-500">vs</span>
                        <select
                          value={compareIdB}
                          onChange={e => setCompareIdB(e.target.value)}
                          className="px-2.5 py-1 rounded-lg border border-indigo-200 bg-white font-semibold"
                        >
                          {recoveryReports.map(r => (
                            <option key={r.id} value={r.id}>
                              {r.period.toUpperCase()} · {r.periodStart} to {r.periodEnd}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {reportA && reportB && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        {[reportA, reportB].map((rep, idx) => (
                          <div key={`${rep.id}-${idx}`} className="bg-white rounded-xl border border-indigo-100 p-3.5 space-y-2">
                            <div className="font-bold text-indigo-950 capitalize">
                              {rep.period} ({rep.periodStart} &rarr; {rep.periodEnd})
                            </div>
                            <div className="flex flex-wrap gap-2 text-[11px] font-mono text-slate-600">
                              <span>Logs: {rep.metricsSnapshot.logsCount}</span>
                              <span>· Acts: {rep.metricsSnapshot.completedActivitiesCount}</span>
                              <span>· Steady: {rep.metricsSnapshot.steadyRoutineDays}d</span>
                              {rep.metricsSnapshot.avgSleepHours !== null && (
                                <span>· Sleep: {rep.metricsSnapshot.avgSleepHours}h</span>
                              )}
                            </div>
                            <p className="text-slate-700 leading-relaxed">{rep.summary}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3">
                  {recoveryReports.slice(0, 6).map(rep => (
                    <article key={rep.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 font-bold uppercase text-[10px]">
                            {rep.period}
                          </span>
                          <span className="font-bold text-slate-900 font-mono">
                            {rep.periodStart} to {rep.periodEnd}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">{rep.careStatusNote}</span>
                      </div>
                      <p className="text-slate-800 leading-relaxed">{rep.summary}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <div className="font-bold text-teal-900 mb-0.5">Observed Strengths</div>
                          <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                            {rep.strengths.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="font-bold text-indigo-900 mb-0.5">Gentle Next Steps</div>
                          <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                            {rep.gentleNextSteps.map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200/70">
                        {rep.routineAndSleepNote}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Existing Weekly Progress Submission & Async Therapist Messages */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-800" />
                  <span>Share Weekly Progress with Therapist</span>
                </h2>
                <p className="text-xs text-slate-500">
                  {activeTherapistConn
                    ? `Submits to authorized therapist: ${activeTherapistConn.therapistName}`
                    : 'Connect an approved therapist in Get My Report to share'}
                </p>
              </div>

              {!serverAuthToken || serverAuthUser?.role !== 'user' ? (
                <p className="text-xs text-slate-500 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  Sign in with a standard account to submit persistent weekly updates to an authorized therapist.
                </p>
              ) : (
                <form onSubmit={handleSubmitWeeklyProgress} className="space-y-3 text-xs">
                  {wpStatusMsg && (
                    <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 font-semibold">
                      {wpStatusMsg}
                    </div>
                  )}
                  <input
                    type="text"
                    value={wpActivities}
                    onChange={e => setWpActivities(e.target.value)}
                    placeholder="Activities completed (comma-separated)..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                  <input
                    type="text"
                    value={wpGoals}
                    onChange={e => setWpGoals(e.target.value)}
                    placeholder="Goals worked on this week..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                  <textarea
                    rows={2}
                    value={wpDifficulties}
                    onChange={e => setWpDifficulties(e.target.value)}
                    placeholder="Difficulties encountered..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                  <textarea
                    rows={2}
                    value={wpHelped}
                    onChange={e => setWpHelped(e.target.value)}
                    placeholder="What helped you stay steady?"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                  <input
                    type="text"
                    value={wpQuestions}
                    onChange={e => setWpQuestions(e.target.value)}
                    placeholder="Questions for your next appointment..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-indigo-950 text-white font-bold cursor-pointer"
                  >
                    Submit Weekly Progress
                  </button>
                </form>
              )}

              {weeklyHistory.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {weeklyHistory.slice(0, 3).map(w => (
                    <div key={w.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="font-bold text-indigo-950">Week of {w.weekStarting}</div>
                      {w.therapistResponse && (
                        <div className="text-teal-900 font-semibold">
                          Therapist Response: {w.therapistResponse}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-800" />
                <span>Async Therapist Messages</span>
              </h2>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
                Not an emergency service: therapists do not provide live 24/7 response. For urgent crises call 14405, 1056, or 112.
              </div>

              {!activeTherapistConn ? (
                <p className="text-xs text-slate-500 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  No active therapist connection yet. Visit Get My Report &rarr; Share with My Therapist to invite an approved clinician.
                </p>
              ) : (
                <>
                  <div className="space-y-2 max-h-56 overflow-y-auto p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    {messages.length === 0 ? (
                      <p className="text-xs text-slate-500">No messages yet.</p>
                    ) : (
                      messages.map(m => (
                        <div
                          key={m.id}
                          className={`p-2.5 rounded-xl text-xs max-w-[85%] ${
                            m.senderRole === 'user'
                              ? 'bg-indigo-950 text-white ml-auto'
                              : 'bg-white border border-slate-200 text-slate-900'
                          }`}
                        >
                          <div className="font-bold opacity-80 mb-0.5">{m.senderName}</div>
                          <div>{m.text}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <form onSubmit={handleSendAsyncMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={msgText}
                      onChange={e => setMsgText(e.target.value)}
                      placeholder="Write an asynchronous note to your therapist..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-indigo-950 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send</span>
                    </button>
                  </form>
                </>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Ethical Analytics Notice */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
        <Shield className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800">Ethical Healthcare Privacy Notice: </span>
          ClearPath AI never assigns artificial numerical recovery scores, clinical severity algorithms, or risk ratings. Your progress reflects the real daily steps, sleep, check-ins, and plans you choose to record.
        </div>
      </div>
    </div>
  );
};
