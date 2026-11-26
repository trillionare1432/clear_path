import {
  DailyLog,
  Goal,
  CalendarEvent,
  MoodType,
  AppState,
  SupportPlan,
  SupporterCalendarEvent,
  SupporterReflection,
  SupporterMood,
  CommunityProgramme,
  CommunityEvent,
  CommunityTask,
  CommunityFeedbackEntry,
} from '../types';

/**
 * Calculates activity completion counts per day for the last N days (Role 01)
 */
export function calculateActivityConsistency(
  logs: DailyLog[],
  daysCount: number = 7,
  referenceDateStr?: string
): { date: string; dayLabel: string; activityCount: number; hasLog: boolean }[] {
  const reference = referenceDateStr ? new Date(referenceDateStr) : new Date();
  const result: { date: string; dayLabel: string; activityCount: number; hasLog: boolean }[] = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const targetDate = new Date(reference);
    targetDate.setDate(reference.getDate() - i);
    const dateKey = targetDate.toISOString().split('T')[0];
    const dayLabel = targetDate.toLocaleDateString('en-US', { weekday: 'short' });

    const matchingLogs = logs.filter(l => l.date === dateKey && !l.isDraft);
    const totalActivities = matchingLogs.reduce((acc, curr) => acc + (curr.completedActivities?.length || 0), 0);

    result.push({
      date: dateKey,
      dayLabel,
      activityCount: totalActivities,
      hasLog: matchingLogs.length > 0,
    });
  }

  return result;
}

/**
 * Calculates current and longest consecutive active days streak for Role 01
 */
export function calculateRecoveryStreak(
  logs: DailyLog[],
  events: CalendarEvent[],
  referenceDateStr?: string
): { currentStreak: number; longestStreak: number; streakActiveToday: boolean } {
  const validDatesSet = new Set<string>();

  logs.forEach(l => {
    if (!l.isDraft && l.date) {
      validDatesSet.add(l.date);
    }
  });

  events.forEach(e => {
    if (e.completed && e.date) {
      validDatesSet.add(e.date);
    }
  });

  if (validDatesSet.size === 0) {
    return { currentStreak: 0, longestStreak: 0, streakActiveToday: false };
  }

  const sortedDates = Array.from(validDatesSet).sort();
  const refDate = referenceDateStr ? new Date(referenceDateStr) : new Date();
  const todayStr = refDate.toISOString().split('T')[0];

  const yesterday = new Date(refDate);
  yesterday.setDate(refDate.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const streakActiveToday = validDatesSet.has(todayStr);

  // Calculate current streak backward from today or yesterday
  let currentStreak = 0;
  let checkDate = streakActiveToday ? new Date(refDate) : validDatesSet.has(yesterdayStr) ? new Date(yesterday) : null;

  if (checkDate) {
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (validDatesSet.has(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak across all history
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const curDate = new Date(dateStr);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffTime = curDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
    prevDate = curDate;
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    streakActiveToday,
  };
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  category: 'consistency' | 'rebuild' | 'routine' | 'mindfulness';
  unlocked: boolean;
  progress: number; // 0 to 100
  unlockedAt?: string;
  iconName: string;
}

/**
 * Calculates achievement badges for personal recovery engagement
 */
export function calculateAchievementBadges(
  logs: DailyLog[],
  events: CalendarEvent[],
  goals: Goal[],
  gameStats?: Record<string, { sessionsPlayed: number }>
): AchievementBadge[] {
  const streakInfo = calculateRecoveryStreak(logs, events);
  const validLogs = logs.filter(l => !l.isDraft);
  const totalLogs = validLogs.length;
  const completedEvents = events.filter(e => e.completed).length;
  const completedMilestones = goals.reduce((acc, g) => acc + g.milestones.filter(m => m.completed).length, 0);
  const completedGoals = goals.filter(g => g.completed).length;
  const totalGamesPlayed = gameStats ? Object.values(gameStats).reduce((acc, s) => acc + (s.sessionsPlayed || 0), 0) : 0;

  return [
    {
      id: 'first_reflection',
      title: 'First Reflection',
      description: 'Recorded your first personal check-in or mindset note.',
      category: 'mindfulness',
      unlocked: totalLogs >= 1,
      progress: Math.min(100, Math.round((totalLogs / 1) * 100)),
      iconName: 'Sparkles',
    },
    {
      id: 'streak_3',
      title: '3-Day Anchor',
      description: 'Maintained 3 consecutive days of recovery self-care.',
      category: 'consistency',
      unlocked: streakInfo.longestStreak >= 3,
      progress: Math.min(100, Math.round((streakInfo.longestStreak / 3) * 100)),
      iconName: 'Flame',
    },
    {
      id: 'streak_7',
      title: '7-Day Steady Pillar',
      description: 'Completed a full week of consistent daily engagement.',
      category: 'consistency',
      unlocked: streakInfo.longestStreak >= 7,
      progress: Math.min(100, Math.round((streakInfo.longestStreak / 7) * 100)),
      iconName: 'Shield',
    },
    {
      id: 'routine_builder',
      title: 'Routine Architect',
      description: 'Followed through on 5 scheduled healthy routines.',
      category: 'routine',
      unlocked: completedEvents >= 5,
      progress: Math.min(100, Math.round((completedEvents / 5) * 100)),
      iconName: 'CalendarCheck',
    },
    {
      id: 'first_milestone',
      title: 'Goal Builder',
      description: 'Achieved your first tangible life rebuild milestone.',
      category: 'rebuild',
      unlocked: completedMilestones >= 1,
      progress: Math.min(100, Math.round((completedMilestones / 1) * 100)),
      iconName: 'Target',
    },
    {
      id: 'goal_finisher',
      title: 'Rebuild Champion',
      description: 'Completed all milestones for a comprehensive life goal.',
      category: 'rebuild',
      unlocked: completedGoals >= 1,
      progress: Math.min(100, Math.round((completedGoals / 1) * 100)),
      iconName: 'Award',
    },
    {
      id: 'cognitive_explorer',
      title: 'Cognitive Explorer',
      description: 'Engaged with evidence-based cognitive or impulse exercises.',
      category: 'routine',
      unlocked: totalGamesPlayed >= 1,
      progress: Math.min(100, Math.round((totalGamesPlayed / 1) * 100)),
      iconName: 'Brain',
    },
    {
      id: 'mindful_15',
      title: 'Quiet Resilience',
      description: 'Recorded 15 total daily check-ins on your healing journey.',
      category: 'mindfulness',
      unlocked: totalLogs >= 15,
      progress: Math.min(100, Math.round((totalLogs / 15) * 100)),
      iconName: 'Heart',
    },
  ];
}

/**
 * Calculates summary metrics for personal goals and their milestones (Role 01)
 */
export function calculateGoalProgress(goals: Goal[]): {
  totalGoals: number;
  completedGoals: number;
  totalMilestones: number;
  completedMilestones: number;
  percentageCompleted: number;
} {
  if (!goals || goals.length === 0) {
    return {
      totalGoals: 0,
      completedGoals: 0,
      totalMilestones: 0,
      completedMilestones: 0,
      percentageCompleted: 0,
    };
  }

  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.completed).length;

  let totalMilestones = 0;
  let completedMilestones = 0;

  for (const goal of goals) {
    if (goal.milestones && goal.milestones.length > 0) {
      totalMilestones += goal.milestones.length;
      completedMilestones += goal.milestones.filter(m => m.completed).length;
    }
  }

  const rawPercent =
    totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : Math.round((completedGoals / totalGoals) * 100);

  return {
    totalGoals,
    completedGoals,
    totalMilestones,
    completedMilestones,
    percentageCompleted: Math.min(100, Math.max(0, rawPercent)),
  };
}

/**
 * Calculates distribution of moods across valid logs (Role 01)
 */
export function calculateMoodDistribution(logs: DailyLog[]): Record<MoodType, number> {
  const distribution: Record<MoodType, number> = {
    peaceful: 0,
    steady: 0,
    challenged: 0,
    heavy: 0,
    hopeful: 0,
    difficult: 0,
    restless: 0,
    tired: 0,
  };

  for (const log of logs) {
    if (!log.isDraft && log.mood && distribution[log.mood] !== undefined) {
      distribution[log.mood]++;
    }
  }

  return distribution;
}

/**
 * Filter calendar events by date or category (Role 01)
 */
export function filterCalendarEvents(
  events: CalendarEvent[],
  filterDate?: string,
  categoryFilter?: string
): CalendarEvent[] {
  return events.filter(event => {
    const matchesDate = !filterDate || event.date === filterDate;
    const matchesCategory = !categoryFilter || categoryFilter === 'all' || event.category === categoryFilter;
    return matchesDate && matchesCategory;
  });
}

// ==========================================
// ROLE 02: SUPPORTER LOGIC FUNCTIONS
// ==========================================

/**
 * Calculates metrics across Supporter Plans and task completions
 */
export function calculateSupportPlanProgress(plans: SupportPlan[]): {
  totalPlans: number;
  completedPlans: number;
  totalTasks: number;
  completedTasks: number;
  percentageCompleted: number;
} {
  if (!plans || plans.length === 0) {
    return {
      totalPlans: 0,
      completedPlans: 0,
      totalTasks: 0,
      completedTasks: 0,
      percentageCompleted: 0,
    };
  }

  const totalPlans = plans.length;
  const completedPlans = plans.filter(p => p.completed).length;

  let totalTasks = 0;
  let completedTasks = 0;

  for (const plan of plans) {
    if (plan.tasks && plan.tasks.length > 0) {
      totalTasks += plan.tasks.length;
      completedTasks += plan.tasks.filter(t => t.completed).length;
    }
  }

  const rawPercent =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : Math.round((completedPlans / totalPlans) * 100);

  return {
    totalPlans,
    completedPlans,
    totalTasks,
    completedTasks,
    percentageCompleted: Math.min(100, Math.max(0, rawPercent)),
  };
}

/**
 * Calculates Supporter activity consistency (events, completed conversations, reflections) over N days
 */
export function calculateSupporterWeeklyActivity(
  events: SupporterCalendarEvent[],
  reflections: SupporterReflection[],
  daysCount: number = 7,
  referenceDateStr?: string
): { date: string; dayLabel: string; actionsCount: number; hasReflection: boolean }[] {
  const reference = referenceDateStr ? new Date(referenceDateStr) : new Date();
  const result: { date: string; dayLabel: string; actionsCount: number; hasReflection: boolean }[] = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const targetDate = new Date(reference);
    targetDate.setDate(reference.getDate() - i);
    const dateKey = targetDate.toISOString().split('T')[0];
    const dayLabel = targetDate.toLocaleDateString('en-US', { weekday: 'short' });

    const matchingEvents = events.filter(e => e.date === dateKey && e.completed);
    const matchingReflections = reflections.filter(r => r.date === dateKey && !r.isDraft);

    result.push({
      date: dateKey,
      dayLabel,
      actionsCount: matchingEvents.length + matchingReflections.length,
      hasReflection: matchingReflections.length > 0,
    });
  }

  return result;
}

/**
 * Calculates Supporter personal reflection mood distribution
 */
export function calculateSupporterMoodDistribution(
  reflections: SupporterReflection[]
): Record<SupporterMood, number> {
  const distribution: Record<SupporterMood, number> = {
    encouraged: 0,
    steady: 0,
    concerned: 0,
    drained: 0,
    hopeful: 0,
    overwhelmed: 0,
    patient: 0,
  };

  for (const ref of reflections) {
    if (!ref.isDraft && ref.mood && distribution[ref.mood] !== undefined) {
      distribution[ref.mood]++;
    }
  }

  return distribution;
}

/**
 * Evaluates a single trial in the Cognitive Go/No-Go inhibition task (Role 01)
 */
export interface GoNoGoTrialResult {
  isCorrect: boolean;
  trialType: 'go' | 'no-go';
  scoreDelta: number;
  feedback: 'correct_hit' | 'correct_rejection' | 'false_alarm' | 'miss';
}

export function evaluateGoNoGoTrial(
  target: 'go' | 'no-go',
  userResponded: boolean,
  responseTimeMs?: number
): GoNoGoTrialResult {
  if (target === 'go') {
    if (userResponded) {
      const speedBonus = responseTimeMs && responseTimeMs < 400 ? 5 : 0;
      return {
        isCorrect: true,
        trialType: 'go',
        scoreDelta: 10 + speedBonus,
        feedback: 'correct_hit',
      };
    } else {
      return {
        isCorrect: false,
        trialType: 'go',
        scoreDelta: 0,
        feedback: 'miss',
      };
    }
  } else {
    if (!userResponded) {
      return {
        isCorrect: true,
        trialType: 'no-go',
        scoreDelta: 20,
        feedback: 'correct_rejection',
      };
    } else {
      return {
        isCorrect: false,
        trialType: 'no-go',
        scoreDelta: -10,
        feedback: 'false_alarm',
      };
    }
  }
}

/**
 * Safely parses and validates JSON backup data for ClearPath AI
 */
export function validateExportImportData(data: unknown): { valid: boolean; state?: Partial<AppState>; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Input must be a valid JSON object' };
  }

  const obj = data as Record<string, unknown>;

  if (!('currentRole' in obj) && !('dailyLogs' in obj) && !('calendarEvents' in obj) && !('supportPlans' in obj)) {
    return { valid: false, error: 'Not a recognized ClearPath AI backup file' };
  }

  const state: Partial<AppState> = {};

  if (Array.isArray(obj.dailyLogs)) {
    state.dailyLogs = obj.dailyLogs as DailyLog[];
  }
  if (Array.isArray(obj.calendarEvents)) {
    state.calendarEvents = obj.calendarEvents as CalendarEvent[];
  }
  if (Array.isArray(obj.goals)) {
    state.goals = obj.goals as Goal[];
  }
  if (Array.isArray(obj.supportPlans)) {
    state.supportPlans = obj.supportPlans as SupportPlan[];
  }
  if (Array.isArray(obj.supporterEvents)) {
    state.supporterEvents = obj.supporterEvents as SupporterCalendarEvent[];
  }
  if (Array.isArray(obj.supporterReflections)) {
    state.supporterReflections = obj.supporterReflections as SupporterReflection[];
  }
  if (Array.isArray(obj.learnerEvents)) {
    state.learnerEvents = obj.learnerEvents as any;
  }
  if (Array.isArray(obj.learnerJournalEntries)) {
    state.learnerJournalEntries = obj.learnerJournalEntries as any;
  }
  if (typeof obj.language === 'string' && (obj.language === 'en' || obj.language === 'ml')) {
    state.language = obj.language;
  }
  if (typeof obj.currentRole === 'string') {
    state.currentRole = obj.currentRole as any;
  }

  return { valid: true, state };
}

/**
 * Calculates curriculum completion progress across pathways
 */
export function calculateLearnerCurriculumProgress(
  totalLessons: number,
  completedLessonIds: string[]
): { completedCount: number; percentage: number; isAllComplete: boolean } {
  if (totalLessons <= 0) return { completedCount: 0, percentage: 0, isAllComplete: false };
  const count = completedLessonIds.length;
  const pct = Math.min(100, Math.round((count / totalLessons) * 100));
  return {
    completedCount: count,
    percentage: pct,
    isAllComplete: count >= totalLessons,
  };
}

/**
 * Evaluates learner quiz score and determines mastery level
 */
export function evaluateLearnerQuizScore(
  score: number,
  totalQuestions: number
): { percentage: number; passed: boolean; masteryLabel: string } {
  if (totalQuestions <= 0) return { percentage: 0, passed: false, masteryLabel: 'No Questions' };
  const pct = Math.round((score / totalQuestions) * 100);
  const passed = pct >= 70;
  let masteryLabel = 'Needs Review';
  if (pct === 100) masteryLabel = 'Mastery';
  else if (pct >= 80) masteryLabel = 'Proficient';
  else if (pct >= 70) masteryLabel = 'Competent';

  return { percentage: pct, passed, masteryLabel };
}

// ==========================================
// ROLE 04: COMMUNITY BUILDER LOGIC FUNCTIONS
// ==========================================

export interface CommunityImpactMetrics {
  totalProgrammes: number;
  activeProgrammes: number;
  completedProgrammes: number;
  totalEvents: number;
  completedEvents: number;
  totalExpectedAttendance: number;
  totalActualAttendance: number;
  attendanceRatePct: number;
  totalTasks: number;
  completedTasks: number;
  taskCompletionRatePct: number;
  totalBudget: number;
  totalSpent: number;
  budgetUtilizationPct: number;
  averageUsefulnessRating: number;
  averageClarityRating: number;
  totalFeedbackCount: number;
}

/**
 * Computes strictly derived metrics from real stored community programmes, events, tasks, and feedback.
 * Adheres strictly to the NO FAKE DATA principle.
 */
export function calculateCommunityImpactMetrics(
  programmes: CommunityProgramme[],
  events: CommunityEvent[],
  tasks: CommunityTask[],
  feedback: CommunityFeedbackEntry[]
): CommunityImpactMetrics {
  const totalProgrammes = programmes.length;
  const activeProgrammes = programmes.filter(p => p.status === 'active').length;
  const completedProgrammes = programmes.filter(p => p.status === 'completed').length;

  const totalEvents = events.length;
  const completedEvents = events.filter(e => e.status === 'completed').length;
  const totalExpectedAttendance = events.reduce((sum, e) => sum + (e.expectedAttendance || 0), 0);
  const totalActualAttendance = events.reduce((sum, e) => sum + (e.actualAttendance || 0), 0);
  const attendanceRatePct =
    totalExpectedAttendance > 0
      ? Math.min(100, Math.round((totalActualAttendance / totalExpectedAttendance) * 100))
      : 0;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const taskCompletionRatePct =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalBudget = programmes.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalSpent = programmes.reduce((sum, p) => sum + (p.spent || 0), 0);
  const budgetUtilizationPct =
    totalBudget > 0 ? Math.min(100, Math.round((totalSpent / totalBudget) * 100)) : 0;

  const totalFeedbackCount = feedback.length;
  const averageUsefulnessRating =
    totalFeedbackCount > 0
      ? Number((feedback.reduce((sum, f) => sum + f.usefulnessRating, 0) / totalFeedbackCount).toFixed(1))
      : 0;
  const averageClarityRating =
    totalFeedbackCount > 0
      ? Number((feedback.reduce((sum, f) => sum + f.clarityRating, 0) / totalFeedbackCount).toFixed(1))
      : 0;

  return {
    totalProgrammes,
    activeProgrammes,
    completedProgrammes,
    totalEvents,
    completedEvents,
    totalExpectedAttendance,
    totalActualAttendance,
    attendanceRatePct,
    totalTasks,
    completedTasks,
    taskCompletionRatePct,
    totalBudget,
    totalSpent,
    budgetUtilizationPct,
    averageUsefulnessRating,
    averageClarityRating,
    totalFeedbackCount,
  };
}

/**
 * Filters programmes by category, status, or district
 */
export function filterCommunityProgrammes(
  programmes: CommunityProgramme[],
  category?: string,
  status?: string,
  district?: string
): CommunityProgramme[] {
  return programmes.filter(prog => {
    const matchesCategory = !category || category === 'all' || prog.category === category;
    const matchesStatus = !status || status === 'all' || prog.status === status;
    const matchesDistrict = !district || district === 'all' || prog.district === district;
    return matchesCategory && matchesStatus && matchesDistrict;
  });
}

/**
 * Filters community events by date or programme
 */
export function filterCommunityEvents(
  events: CommunityEvent[],
  filterDate?: string,
  programmeId?: string,
  status?: string
): CommunityEvent[] {
  return events.filter(ev => {
    const matchesDate = !filterDate || ev.date === filterDate;
    const matchesProgramme = !programmeId || programmeId === 'all' || ev.programmeId === programmeId;
    const matchesStatus = !status || status === 'all' || ev.status === status;
    return matchesDate && matchesProgramme && matchesStatus;
  });
}

/**
 * Aggregates non-identifying community feedback trends safely
 */
export function summarizeCommunityNeeds(feedback: CommunityFeedbackEntry[]): {
  topConcerns: { topic: string; count: number }[];
  averageRating: number;
  totalResponses: number;
} {
  if (feedback.length === 0) {
    return { topConcerns: [], averageRating: 0, totalResponses: 0 };
  }

  const concernCounts: Record<string, number> = {};
  let totalRatingSum = 0;

  for (const entry of feedback) {
    totalRatingSum += (entry.usefulnessRating + entry.clarityRating) / 2;
    for (const concern of entry.keyConcernsExpressed || []) {
      const normalized = concern.trim();
      if (normalized) {
        concernCounts[normalized] = (concernCounts[normalized] || 0) + 1;
      }
    }
  }

  const sortedConcerns = Object.entries(concernCounts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    topConcerns: sortedConcerns,
    averageRating: Number((totalRatingSum / feedback.length).toFixed(1)),
    totalResponses: feedback.length,
  };
}

