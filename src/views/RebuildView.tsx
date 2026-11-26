import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Goal, GoalCategory } from '../types';
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Calendar,
  Sparkles,
  BookOpen,
  Briefcase,
  Heart,
  Palette,
  Activity,
  Smile,
  Compass,
  Share2,
  ShieldCheck,
  Check,
  PauseCircle,
  PlayCircle,
  XCircle,
} from 'lucide-react';
import { getActiveSharedSupporterItems } from '../utils/careRelay';
import { CarePlanProposalPanel } from '../components/CarePlanProposalPanel';

export const RebuildView: React.FC = () => {
  const {
    goals,
    addGoal,
    deleteGoal,
    toggleMilestone,
    addGoalNote,
    addCalendarEvent,
    sharedSupporterItems,
    shareItemWithSupporter,
    revokeSharedSupporterItem,
    personalizedSupportPlan,
    savePersonalizedSupportPlan,
    carePlanProposals,
    refreshClientAssignments,
    serverAuthToken,
  } = useApp();

  const handlePlanActivityStatus = (
    approachId: string,
    status: 'active' | 'paused' | 'discontinued'
  ) => {
    if (!personalizedSupportPlan) return;
    const updated = {
      ...personalizedSupportPlan,
      updatedAt: new Date().toISOString(),
      educationalActivities: (personalizedSupportPlan.educationalActivities || []).map(a =>
        a.id === approachId ? { ...a, status } : a
      ),
    };
    savePersonalizedSupportPlan(updated);
    if (serverAuthToken) {
      fetch('/api/support-plan', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify(updated),
      }).catch(() => {});
    }
  };

  const [calendarSavedGoalId, setCalendarSavedGoalId] = useState<string | null>(null);
  const activeSharedIds = new Set(getActiveSharedSupporterItems(sharedSupporterItems).map(i => i.id));

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'goals' | 'weekly_planner'>('goals');
  const [weeklyPlans, setWeeklyPlans] = useState<Record<string, string[]>>({
    Monday: ['Morning light + hydration'],
    Wednesday: ['Calm 20-min outdoor walk'],
    Saturday: ['Coffee or call with trusted supporter'],
  });
  const [planDay, setPlanDay] = useState('Monday');
  const [planActivity, setPlanActivity] = useState('');

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<GoalCategory>('routine');
  const [formFrequency, setFormFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [formTargetDate, setFormTargetDate] = useState('');
  const [milestonesInput, setMilestonesInput] = useState<string[]>(['Step 1', 'Step 2']);
  const [newMilestoneText, setNewMilestoneText] = useState('');

  // Note addition state
  const [addingNoteGoalId, setAddingNoteGoalId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const categories: { key: GoalCategory; label: string; icon: any; color: string }[] = [
    { key: 'routine', label: 'Healthy Routines', icon: Sparkles, color: 'text-indigo-700 bg-indigo-50' },
    { key: 'physical', label: 'Physical Activity', icon: Activity, color: 'text-teal-700 bg-teal-50' },
    { key: 'education', label: 'Education & Study', icon: BookOpen, color: 'text-sky-700 bg-sky-50' },
    { key: 'career', label: 'Career & Skills', icon: Briefcase, color: 'text-indigo-700 bg-indigo-50' },
    { key: 'creative', label: 'Creative Interests', icon: Palette, color: 'text-purple-700 bg-purple-50' },
    { key: 'family', label: 'Family & Relationships', icon: Heart, color: 'text-amber-700 bg-amber-50' },
    { key: 'social', label: 'Social Participation', icon: Smile, color: 'text-rose-700 bg-rose-50' },
    { key: 'personal', label: 'Personal Development', icon: Compass, color: 'text-slate-700 bg-slate-100' },
  ];

  const LIFE_GOAL_STARTERS: {
    title: string;
    category: GoalCategory;
    frequency: 'daily' | 'weekly' | 'custom';
    description: string;
    milestones: string[];
  }[] = [
    {
      title: 'Steady Sleep & Morning Routine',
      category: 'routine',
      frequency: 'daily',
      description: 'Anchor predictable wake-up, sunlight, and screens-off wind-down hours.',
      milestones: ['Screens off 45m before bed', 'Morning water + 15m outdoor light'],
    },
    {
      title: 'Return to Study / Coursework Rhythm',
      category: 'education',
      frequency: 'daily',
      description: 'Rebuild academic confidence with calm 25-minute distraction-free study blocks.',
      milestones: ['Prepare quiet study desk', 'Complete 3 focused 25m blocks this week'],
    },
    {
      title: 'Work Readiness & Skill Practice',
      category: 'career',
      frequency: 'weekly',
      description: 'Refresh practical skills, CV/portfolio updates, or steady work attendance.',
      milestones: ['Update weekly skill checklist', 'Complete one practical project task'],
    },
    {
      title: 'Calm Family Meal or Check-In',
      category: 'family',
      frequency: 'weekly',
      description: 'Re-establish low-pressure quality time with trusted family or elders.',
      milestones: ['Share one quiet meal without phones', 'Agree on weekly check-in slot'],
    },
    {
      title: 'Afternoon Movement & Stress Outlet',
      category: 'physical',
      frequency: 'daily',
      description: 'Replace peak evening restlessness with brisk walking, cycling, or stretching.',
      milestones: ['Walk 20 minutes during peak craving hour', 'Log post-walk energy feeling'],
    },
    {
      title: 'Healthy Community & Peer Participation',
      category: 'social',
      frequency: 'weekly',
      description: 'Join sober sports, reading circles, library sessions, or volunteer activities.',
      milestones: ['Pick one alcohol/substance-free group activity', 'Attend first session'],
    },
  ];

  const handleAddStarterGoal = (starter: (typeof LIFE_GOAL_STARTERS)[number]) => {
    addGoal(
      {
        title: starter.title,
        description: starter.description,
        category: starter.category,
        frequency: starter.frequency,
        completed: false,
      },
      starter.milestones
    );
  };

  const handleSaveGoalToCalendar = (goal: Goal) => {
    const todayISO = new Date().toISOString().split('T')[0];
    addCalendarEvent({
      title: `Goal Focus: ${goal.title}`,
      date: goal.targetDate || todayISO,
      startTime: '08:00',
      category: 'personal_goal',
      notes: goal.description || undefined,
      reminder: true,
      completed: false,
    });
    setCalendarSavedGoalId(goal.id);
    setTimeout(() => setCalendarSavedGoalId(null), 2400);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    addGoal(
      {
        title: formTitle,
        description: formDescription,
        category: formCategory,
        frequency: formFrequency,
        targetDate: formTargetDate || undefined,
        completed: false,
      },
      milestonesInput.filter(m => m.trim().length > 0)
    );

    setIsModalOpen(false);
    setFormTitle('');
    setFormDescription('');
    setMilestonesInput(['Step 1', 'Step 2']);
  };

  const handleAddMilestoneInput = () => {
    if (newMilestoneText.trim()) {
      setMilestonesInput([...milestonesInput, newMilestoneText.trim()]);
      setNewMilestoneText('');
    }
  };

  const handleSaveGoalNote = (goalId: string) => {
    if (noteText.trim()) {
      addGoalNote(goalId, noteText.trim());
      setNoteText('');
      setAddingNoteGoalId(null);
    }
  };

  const filteredGoals = goals.filter(
    g => activeCategoryFilter === 'all' || g.category === activeCategoryFilter
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-800 uppercase tracking-wider mb-1">
            <Target className="w-4 h-4" />
            <span>Rebuild My Life · Community Reinforcement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Rebuild My Life &amp; Weekly Plan</h1>
          <p className="text-sm text-slate-600 mt-1">
            Meaningful everyday living across education, work, relationships, and rest—at your own realistic rhythm.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="inline-flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setViewMode('goals')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                viewMode === 'goals' ? 'bg-white text-indigo-950 shadow-2xs' : 'text-slate-600'
              }`}
            >
              8 Life Pathways
            </button>
            <button
              type="button"
              onClick={() => setViewMode('weekly_planner')}
              className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                viewMode === 'weekly_planner' ? 'bg-white text-indigo-950 shadow-2xs' : 'text-slate-600'
              }`}
            >
              Flexible Weekly Plan
            </button>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-indigo-800 hover:bg-indigo-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Goal</span>
          </button>
        </div>
      </div>

      {/* Anti-Productivity Pressure Notice */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950">
        <strong>Gentle Principle:</strong> Rest and quiet stability count just as much as finished tasks. Never equate rigid productivity with recovery—adjust or pause goals anytime without guilt.
      </div>

      {/* 2-Way Clinician Care Plan Proposals */}
      <CarePlanProposalPanel
        mode="user"
        serverAuthToken={serverAuthToken}
        proposals={carePlanProposals}
        onUpdated={refreshClientAssignments}
      />

      {/* Personalized Support Plan Card (Synchronized from Understand My Situation / Clinician Updates) */}
      {personalizedSupportPlan &&
        ((personalizedSupportPlan.educationalActivities || []).length > 0 ||
          personalizedSupportPlan.objectives.length > 0 ||
          (personalizedSupportPlan.supportNeeds || []).length > 0 ||
          (personalizedSupportPlan.interventions || []).length > 0 ||
          Boolean(personalizedSupportPlan.professionalGuidance)) && (
        <section className="bg-white border border-indigo-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-800">
                Active Personalized Support Plan · Status:{' '}
                {(personalizedSupportPlan.carePlanStatus || 'active').replace(/_/g, ' ')} · Review:{' '}
                {personalizedSupportPlan.reviewDate || 'Flexible'}
              </div>
              <h2 className="text-base font-extrabold text-slate-900 mt-0.5">
                My Combined Pathways &amp; Clinician-Guided Plan
              </h2>
              {personalizedSupportPlan.responsibleTherapistName && (
                <div className="text-[11px] text-emerald-800 font-semibold mt-0.5">
                  Coordinated with Clinician: {personalizedSupportPlan.responsibleTherapistName}
                  {personalizedSupportPlan.nextFollowUpDate
                    ? ` · Next Follow-Up: ${personalizedSupportPlan.nextFollowUpDate}`
                    : ''}
                </div>
              )}
            </div>
            <span className="text-[11px] text-slate-500">
              Pause or discontinue self-guided activities anytime
            </span>
          </div>

          {(personalizedSupportPlan.objectives.length > 0 ||
            (personalizedSupportPlan.supportNeeds || []).length > 0 ||
            (personalizedSupportPlan.interventions || []).length > 0 ||
            personalizedSupportPlan.professionalGuidance ||
            personalizedSupportPlan.progressObservations) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {personalizedSupportPlan.objectives.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-1">
                  <div className="font-bold text-indigo-950">Shared Recovery Objectives</div>
                  <ul className="list-disc pl-4 text-slate-700 space-y-0.5">
                    {personalizedSupportPlan.objectives.map((obj, idx) => (
                      <li key={idx}>{obj}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(personalizedSupportPlan.supportNeeds || []).length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900">Identified Support Needs</div>
                  <ul className="list-disc pl-4 text-slate-700 space-y-0.5">
                    {(personalizedSupportPlan.supportNeeds || []).map((need, idx) => (
                      <li key={idx}>{need}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(personalizedSupportPlan.interventions || []).length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900">Planned Interventions</div>
                  <ul className="list-disc pl-4 text-slate-700 space-y-0.5">
                    {(personalizedSupportPlan.interventions || []).map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {(personalizedSupportPlan.professionalGuidance || personalizedSupportPlan.progressObservations) && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/75 border border-emerald-200 space-y-1">
                  <div className="font-bold text-emerald-950">Clinician Guidance &amp; Observations</div>
                  {personalizedSupportPlan.professionalGuidance && (
                    <p className="text-slate-700">{personalizedSupportPlan.professionalGuidance}</p>
                  )}
                  {personalizedSupportPlan.progressObservations && (
                    <p className="text-emerald-900 text-[11px]">
                      <strong>Progress Note:</strong> {personalizedSupportPlan.progressObservations}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {(personalizedSupportPlan.educationalActivities || []).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(personalizedSupportPlan.educationalActivities || []).map(app => (
                <div
                  key={app.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-2.5 text-xs"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="font-bold text-slate-900">{app.title}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          app.source === 'clinician_assigned'
                            ? 'bg-purple-100 text-purple-900'
                            : 'bg-indigo-100 text-indigo-900'
                        }`}
                      >
                        {app.source === 'clinician_assigned' ? 'Clinician-Assigned' : 'Self-Guided'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{app.reason}</p>
                  </div>

                  {app.source === 'self_guided' && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handlePlanActivityStatus(app.id, 'active')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                          app.status === 'active'
                            ? 'bg-indigo-950 text-white'
                            : 'bg-white border border-slate-200 text-slate-700'
                        }`}
                      >
                        <PlayCircle className="w-3 h-3" />
                        <span>Active</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePlanActivityStatus(app.id, 'paused')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                          app.status === 'paused'
                            ? 'bg-amber-600 text-white'
                            : 'bg-white border border-slate-200 text-slate-700'
                        }`}
                      >
                        <PauseCircle className="w-3 h-3" />
                        <span>Pause</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePlanActivityStatus(app.id, 'discontinued')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer ${
                          app.status === 'discontinued'
                            ? 'bg-slate-700 text-white'
                            : 'bg-white border border-slate-200 text-slate-600'
                        }`}
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Stop</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {viewMode === 'weekly_planner' ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Flexible Weekly Intention Planner</h2>
            <p className="text-xs text-slate-600">
              Plan gentle, realistic activities across your week (hobbies, study blocks, family time, or rest).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={planDay}
              onChange={e => setPlanDay(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
            >
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <input
              type="text"
              value={planActivity}
              onChange={e => setPlanActivity(e.target.value)}
              placeholder="Add a gentle, realistic activity or rest block..."
              className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
            />
            <button
              type="button"
              onClick={() => {
                if (!planActivity.trim()) return;
                setWeeklyPlans(prev => ({
                  ...prev,
                  [planDay]: [...(prev[planDay] || []), planActivity.trim()],
                }));
                setPlanActivity('');
              }}
              className="px-4 py-2 rounded-xl bg-indigo-950 text-white text-xs font-bold cursor-pointer"
            >
              + Add to {planDay}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
              <div key={day} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-extrabold text-indigo-950">{day}</div>
                {(weeklyPlans[day] || []).length === 0 ? (
                  <p className="text-[11px] text-slate-400 italic">Open / rest day</p>
                ) : (
                  <ul className="space-y-1">
                    {(weeklyPlans[day] || []).map((item, idx) => (
                      <li key={idx} className="text-xs text-slate-700 bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between gap-1">
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setWeeklyPlans(prev => ({
                              ...prev,
                              [day]: (prev[day] || []).filter((_, i) => i !== idx),
                            }))
                          }
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
      <>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveCategoryFilter('all')}
          className={`min-h-[40px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeCategoryFilter === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Focus Areas
        </button>
        {categories.map(c => {
          const Icon = c.icon;
          return (
            <button
              key={c.key}
              onClick={() => setActiveCategoryFilter(c.key)}
              className={`min-h-[40px] px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeCategoryFilter === c.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* 6 Life-Area Goal Starters (Education, Work, Routine, Family, Wellbeing, Community) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>1-Click Life Continuity Goal Starters</span>
          </span>
          <span className="text-[11px] text-slate-500">
            Stay strictly private — or opt-in share a single goal milestone with Supporter Mode
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {LIFE_GOAL_STARTERS.map(starter => (
            <button
              key={starter.title}
              type="button"
              onClick={() => handleAddStarterGoal(starter)}
              className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-950 text-xs font-semibold transition-colors cursor-pointer"
            >
              + {starter.title}
            </button>
          ))}
        </div>
      </div>

      {/* Goals Cards Grid */}
      {filteredGoals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGoals.map(goal => {
            const cat = categories.find(c => c.key === goal.category) || categories[0];
            const Icon = cat.icon;
            const completedCount = goal.milestones.filter(m => m.completed).length;
            const totalCount = goal.milestones.length;
            const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : goal.completed ? 100 : 0;

            return (
              <div
                key={goal.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md flex items-center gap-1.5 ${cat.color}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.label}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-mono capitalize">
                        {goal.frequency}
                      </span>
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{goal.title}</h3>
                  {(goal.updatedByRole === 'therapist' || goal.createdByRole === 'therapist') && (
                    <div className="text-[11px] font-semibold text-emerald-800 mb-1.5">
                      {goal.updatedByRole === 'therapist'
                        ? `Updated by Therapist${goal.updatedByTherapistName ? ` (${goal.updatedByTherapistName})` : ''}`
                        : 'Suggested by Clinician · Therapist-Guided Goal'}
                      {goal.therapistChangeNote ? ` — ${goal.therapistChangeNote}` : ''}
                    </div>
                  )}
                  {goal.description && <p className="text-xs text-slate-600 mb-4">{goal.description}</p>}

                  {/* Progress Bar */}
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                      <span>Milestones:</span>
                      <span>
                        {completedCount} / {totalCount} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-700 h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestones Checklist */}
                  <div className="space-y-2 mb-4">
                    {goal.milestones.map(m => (
                      <button
                        key={m.id}
                        onClick={() => toggleMilestone(goal.id, m.id)}
                        className={`w-full p-2.5 rounded-xl border text-left text-xs transition-colors flex items-center gap-2.5 ${
                          m.completed
                            ? 'bg-indigo-50/50 border-indigo-200 text-slate-700 line-through'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                        }`}
                      >
                        {m.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-indigo-700 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <span>{m.title}</span>
                      </button>
                    ))}
                  </div>

                  {/* Recent Progress Notes */}
                  {goal.progressNotes.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Reflection Note
                      </span>
                      {goal.progressNotes.slice(0, 2).map(n => (
                        <div key={n.id} className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                          <span className="font-semibold text-slate-700 font-mono text-[10px] block">{n.date}</span>
                          {n.note}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Quick Progress Note */}
                <div className="pt-4 mt-3 border-t border-slate-100">
                  {addingNoteGoalId === goal.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder="Add a brief reflection or breakthrough..."
                        className="w-full p-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setAddingNoteGoalId(null)}
                          className="px-2.5 py-1 text-xs text-slate-500"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveGoalNote(goal.id)}
                          className="px-3 py-1 bg-indigo-800 text-white rounded-lg text-xs font-semibold"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setAddingNoteGoalId(goal.id)}
                        className="text-xs font-semibold text-indigo-800 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Note</span>
                      </button>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSaveGoalToCalendar(goal)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-800 hover:text-indigo-950 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          {calendarSavedGoalId === goal.id ? (
                            <>
                              <Check className="w-3 h-3 text-indigo-700" />
                              <span>In Calendar</span>
                            </>
                          ) : (
                            <>
                              <Calendar className="w-3 h-3 text-indigo-700" />
                              <span>Save to Calendar</span>
                            </>
                          )}
                        </button>

                        {activeSharedIds.has(`share-goal-${goal.id}`) ? (
                          <button
                            type="button"
                            onClick={() => revokeSharedSupporterItem(`share-goal-${goal.id}`)}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-rose-50 text-amber-900 hover:text-rose-800 border border-amber-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            title="Revoke shared view from Supporter Mode immediately"
                          >
                            <ShieldCheck className="w-3 h-3" />
                            <span>Shared · Revoke</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              shareItemWithSupporter({
                                id: `share-goal-${goal.id}`,
                                kind: 'goal_milestone',
                                title: goal.title,
                                detail: `${completedCount}/${totalCount} milestones completed (${pct}%). Progress notes remain private.`,
                                targetDate: goal.targetDate,
                                consentGranted: true,
                              })
                            }
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            title="Share ONLY this goal title & percentage with Role 02 Supporter Mode"
                          >
                            <Share2 className="w-3 h-3" />
                            <span>Share Goal Only</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs">
          <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No goals in this category yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Rebuilding everyday routines happens in gradual, gentle steps. Pick an activity that brings you calm or purpose.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2 bg-indigo-800 hover:bg-indigo-900 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            Create Goal
          </button>
        </div>
      )}
      </>
      )}

      {/* CREATE GOAL MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateGoal}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h3 className="text-lg font-bold text-slate-900">Create a New Life Goal</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Goal Title *</label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="e.g., Daily 20-min Morning Walk, Reconnect with Painting"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={formDescription}
                onChange={e => setFormDescription(e.target.value)}
                placeholder="Why is this meaningful for your personal recovery and wellbeing?"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value as GoalCategory)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {categories.map(c => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Frequency</label>
                <select
                  value={formFrequency}
                  onChange={e => setFormFrequency(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="daily">Daily Habit</option>
                  <option value="weekly">Weekly Routine</option>
                  <option value="custom">Ongoing Target</option>
                </select>
              </div>
            </div>

            {/* Milestones list */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gentle Milestones (Small Steps)
              </label>
              <div className="space-y-2 mb-2">
                {milestonesInput.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={m}
                      onChange={e => {
                        const copy = [...milestonesInput];
                        copy[i] = e.target.value;
                        setMilestonesInput(copy);
                      }}
                      className="flex-1 p-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setMilestonesInput(milestonesInput.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMilestoneText}
                  onChange={e => setNewMilestoneText(e.target.value)}
                  placeholder="Add another milestone..."
                  className="flex-1 p-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddMilestoneInput}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold"
                >
                  + Add
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-indigo-800 hover:bg-indigo-900 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Create Goal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
