import {
  CalendarEvent,
  DailyLog,
  Goal,
  HabitChallenge,
  OpportunityCatalogItem,
  OpportunityProfile,
  PersonalOnboarding,
  PersonalizedLifePathway,
  RecoveryPassport,
  RecoveryPassportSectionKey,
} from '../types';

export interface MonthlyCalendarCell {
  date: string;
  dayNumber: number;
  state: 'completed' | 'partial' | 'skipped' | 'unlogged';
  logsCount: number;
  eventsCompleted: number;
  eventsPartial: number;
  eventsSkipped: number;
  eventsPlanned: number;
}

export interface RecoveryAnalyticsSummary {
  totalDaysSinceStart: number | null;
  recoveryStartDate: string | null;
  totalLogs: number;
  logsLast7Days: number;
  logsPrev7Days: number;
  logsLast30Days: number;
  moodCounts: Record<string, number>;
  avgCravingFrequency: number | null;
  avgCravingIntensity: number | null;
  recentAvgCravingIntensity: number | null;
  prevAvgCravingIntensity: number | null;
  topTriggers: Array<{ tag: string; count: number }>;
  avgSleepHours: number | null;
  steadyRoutineRatePct: number | null;
  steadyRoutineDaysCount: number;
  habitCompletionCount: number;
  goalsCompletedCount: number;
  goalsTotalCount: number;
}

export interface OpportunityMatchResult {
  item: OpportunityCatalogItem;
  matchScore: number;
  reasons: string[];
  skillGaps: string[];
  stepPathway: string[];
}

export function generatePersonalizedLifePathway(
  onboarding: PersonalOnboarding
): PersonalizedLifePathway {
  const status = onboarding.clinicalTreatmentStatus || 'self_reported_only';
  const isFormalTreatmentConfirmed =
    status === 'clinician_confirmed_treatment' || status === 'completed_formal_care';

  let careStatusLabel = 'Self-Reported Reflection (Non-Diagnostic)';
  let careStatusDetail =
    'Based solely on what you shared voluntarily here. This is not a medical diagnosis or formal clinical intake.';

  if (status === 'clinician_confirmed_treatment') {
    careStatusLabel = 'Clinician-Confirmed Care (Self-Reported Enrollment)';
    careStatusDetail =
      'You indicated you are already in formal clinical or de-addiction care. ClearPath supports daily routine and life rebuilding alongside your doctor or counsellor.';
  } else if (status === 'completed_formal_care') {
    careStatusLabel = 'Post-Treatment Continuity';
    careStatusDetail =
      'You shared that you completed formal care and are focusing on steady aftercare, triggers, and rebuilding skills or work.';
  } else if (status === 'no_formal_treatment') {
    careStatusLabel = 'Exploring Without Formal Treatment';
    careStatusDetail =
      'Self-guided reflection only. If cravings, withdrawal, or safety concerns feel heavy, free confidential help is available anytime at 14405.';
  }

  const stage = onboarding.journeyStage || 'starting_change';
  const needs = onboarding.immediateNeeds || [];
  const goals = onboarding.personalGoals || [];

  const focusAreas: string[] = [];
  if (stage === 'exploring' || stage === 'starting_change') {
    focusAreas.push('Calm daily routine & craving awareness');
  } else if (stage === 'active_recovery') {
    focusAreas.push('Evening trigger protection & steady sleep');
  } else {
    focusAreas.push('Long-term stability, skills & livelihood growth');
  }

  if (needs.includes('craving_support') || onboarding.primaryNeed === 'cravings') {
    focusAreas.push('2-minute craving wave resets');
  }
  if (
    needs.includes('education_skills') ||
    needs.includes('job_livelihood') ||
    goals.some((g) => /skill|job|study|career|business|educat/i.test(g))
  ) {
    focusAreas.push('Verified Kerala/India skills, training & work readiness');
  }
  if (needs.includes('sleep_routine')) {
    focusAreas.push('Predictable sleep & daily anchor habits');
  }
  if (onboarding.familySocialSupport === 'limited' || needs.includes('family_communication')) {
    focusAreas.push('Safe social circles & calm communication');
  }
  if (focusAreas.length < 2) {
    focusAreas.push('Non-judgmental daily check-ins & life goals');
  }

  let firstGentleStep = 'Take one 15-second mood & routine check-in in Daily Log today.';
  if (needs.includes('professional_care') || onboarding.currentlyInProfessionalCare === 'no') {
    firstGentleStep =
      'Review nearby verified Kerala clinics or call toll-free 14405 if you ever want confidential human support.';
  } else if (needs.includes('job_livelihood') || needs.includes('education_skills')) {
    firstGentleStep =
      'Complete your non-clinical Opportunity Profile to match verified ASAP Kerala, NAPS, or Skill India pathways.';
  }

  const weeklyRhythm =
    onboarding.reminderPreference === 'weekly_only'
      ? 'Low-pressure weekly rhythm: 1–2 short check-ins + a Friday progress reflection.'
      : 'Gentle daily rhythm: 1 short check-in, 1 evening calm reset when needed, and 1 skill/life step per week.';

  const recommendedTabs = [
    {
      tabKey: 'dailylog',
      label: 'Daily Log',
      reason: 'Track mood, triggers, sleep, and optional craving notes privately.',
    },
    {
      tabKey: 'progress',
      label: 'Progress & Reports',
      reason: 'Inspect your monthly calendar, personal growth trends, and AI weekly/monthly reports.',
    },
    {
      tabKey: 'opportunities',
      label: 'Opportunities & Skills',
      reason: 'Explore multi-sector courses, apprenticeships, 8 life pathways, and your non-clinical Recovery Passport.',
    },
    {
      tabKey: 'tools',
      label: 'Support Pathways',
      reason: 'Short CBT tools, motivation exercises, and Kerala 14405 care map.',
    },
  ];

  const recommendedDevTrackIds = ['dev-independence'];
  if (needs.includes('education_skills') || goals.some((g) => /study|educat/i.test(g))) {
    recommendedDevTrackIds.push('dev-education', 'dev-digital');
  }
  if (needs.includes('job_livelihood') || goals.some((g) => /job|work|career|trade/i.test(g))) {
    recommendedDevTrackIds.push('dev-vocational', 'dev-career');
  }
  if (goals.some((g) => /business|venture|shop/i.test(g))) {
    recommendedDevTrackIds.push('dev-entrepreneurship', 'dev-financial');
  }
  if (onboarding.familySocialSupport === 'limited') {
    recommendedDevTrackIds.push('dev-social');
  }

  return {
    careStatusLabel,
    careStatusDetail,
    isFormalTreatmentConfirmed,
    focusAreas: Array.from(new Set(focusAreas)).slice(0, 4),
    firstGentleStep,
    weeklyRhythm,
    recommendedTabs,
    recommendedDevTrackIds: Array.from(new Set(recommendedDevTrackIds)),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Produces a day-by-day map for a calendar month.
 * Strictly distinguishes `unlogged` (no logs and no events) from `skipped` (user explicitly marked skipped).
 */
export function computeMonthlyCalendarMap(
  year: number,
  monthZeroIndexed: number,
  dailyLogs: DailyLog[],
  calendarEvents: CalendarEvent[]
): MonthlyCalendarCell[] {
  const daysInMonth = new Date(year, monthZeroIndexed + 1, 0).getDate();
  const cells: MonthlyCalendarCell[] = [];

  for (let day = 1; day <= daysInMonth; day += 1) {
    const mm = String(monthZeroIndexed + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${year}-${mm}-${dd}`;

    const dayLogs = dailyLogs.filter((l) => l.date === dateStr && !l.isDraft);
    const dayEvents = calendarEvents.filter((e) => e.date === dateStr);

    let eventsCompleted = 0;
    let eventsPartial = 0;
    let eventsSkipped = 0;
    let eventsPlanned = 0;

    dayEvents.forEach((ev) => {
      const explicit = ev.completionState;
      if (explicit === 'skipped') eventsSkipped += 1;
      else if (explicit === 'partial') eventsPartial += 1;
      else if (explicit === 'completed' || (explicit === undefined && ev.completed)) eventsCompleted += 1;
      else eventsPlanned += 1;
    });

    const hasRoutineCompleted = dayLogs.some((l) => l.routineSteady === true || l.completedActivities.length > 0);
    const hasOnlySkippedEvents =
      dayLogs.length === 0 && dayEvents.length > 0 && eventsSkipped === dayEvents.length;

    let state: MonthlyCalendarCell['state'] = 'unlogged';

    if (dayLogs.length === 0 && dayEvents.length === 0) {
      state = 'unlogged';
    } else if (hasOnlySkippedEvents) {
      state = 'skipped';
    } else if (
      (dayLogs.length > 0 && (hasRoutineCompleted || eventsCompleted > 0 || dayEvents.length === 0)) &&
      eventsPartial === 0 &&
      eventsSkipped === 0
    ) {
      state = 'completed';
    } else if (eventsCompleted > 0 && dayLogs.length === 0 && eventsPartial === 0 && eventsSkipped === 0 && eventsPlanned === 0) {
      state = 'completed';
    } else {
      state = 'partial';
    }

    cells.push({
      date: dateStr,
      dayNumber: day,
      state,
      logsCount: dayLogs.length,
      eventsCompleted,
      eventsPartial,
      eventsSkipped,
      eventsPlanned,
    });
  }

  return cells;
}

function diffDaysInclusive(startDateStr: string, todayDateStr: string): number | null {
  const start = new Date(`${startDateStr}T00:00:00Z`);
  const end = new Date(`${todayDateStr}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const diff = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return diff >= 0 ? diff + 1 : 0;
}

/**
 * Computes calm, descriptive recovery & personal growth metrics.
 * Intentionally omits arbitrary recovery percentages, diagnostic labels, or setback shaming.
 */
export function computeRecoveryAnalytics(
  dailyLogs: DailyLog[],
  _calendarEvents: CalendarEvent[],
  goals: Goal[],
  habitChallenges: HabitChallenge[],
  recoveryStartDate?: string,
  referenceDateStr: string = new Date().toISOString().split('T')[0]
): RecoveryAnalyticsSummary {
  const submittedLogs = dailyLogs.filter((l) => !l.isDraft);
  const refMs = new Date(`${referenceDateStr}T23:59:59Z`).getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  const isWithinWindow = (dateStr: string, startDaysAgo: number, endDaysAgo: number) => {
    const t = new Date(`${dateStr}T12:00:00Z`).getTime();
    if (Number.isNaN(t)) return false;
    const daysAgo = Math.floor((refMs - t) / dayMs);
    return daysAgo >= endDaysAgo && daysAgo < startDaysAgo;
  };

  const logsLast7 = submittedLogs.filter((l) => isWithinWindow(l.date, 7, 0));
  const logsPrev7 = submittedLogs.filter((l) => isWithinWindow(l.date, 14, 7));
  const logsLast30 = submittedLogs.filter((l) => isWithinWindow(l.date, 30, 0));

  const moodCounts: Record<string, number> = {};
  const triggerCounts: Record<string, number> = {};
  const freqValues: number[] = [];
  const intensityValues: number[] = [];
  const sleepValues: number[] = [];
  let steadyRoutineAsked = 0;
  let steadyRoutineYes = 0;

  submittedLogs.forEach((l) => {
    if (l.mood) moodCounts[l.mood] = (moodCounts[l.mood] || 0) + 1;
    l.tags.forEach((tag) => {
      const clean = tag.trim();
      if (clean) triggerCounts[clean] = (triggerCounts[clean] || 0) + 1;
    });
    if (typeof l.cravingFrequency === 'number' && !Number.isNaN(l.cravingFrequency)) {
      freqValues.push(l.cravingFrequency);
    }
    if (typeof l.cravingIntensity === 'number' && !Number.isNaN(l.cravingIntensity)) {
      intensityValues.push(l.cravingIntensity);
    }
    if (typeof l.sleepHours === 'number' && !Number.isNaN(l.sleepHours) && l.sleepHours > 0) {
      sleepValues.push(l.sleepHours);
    }
    if (typeof l.routineSteady === 'boolean') {
      steadyRoutineAsked += 1;
      if (l.routineSteady) steadyRoutineYes += 1;
    }
  });

  const avg = (arr: number[]) =>
    arr.length > 0 ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : null;

  const recentIntensities = logsLast7
    .map((l) => l.cravingIntensity)
    .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));
  const prevIntensities = logsPrev7
    .map((l) => l.cravingIntensity)
    .filter((v): v is number => typeof v === 'number' && !Number.isNaN(v));

  const topTriggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([tag, count]) => ({ tag, count }));

  const habitCompletionCount = habitChallenges.reduce((sum, h) => sum + h.completedDates.length, 0);

  return {
    totalDaysSinceStart: recoveryStartDate ? diffDaysInclusive(recoveryStartDate, referenceDateStr) : null,
    recoveryStartDate: recoveryStartDate || null,
    totalLogs: submittedLogs.length,
    logsLast7Days: logsLast7.length,
    logsPrev7Days: logsPrev7.length,
    logsLast30Days: logsLast30.length,
    moodCounts,
    avgCravingFrequency: avg(freqValues),
    avgCravingIntensity: avg(intensityValues),
    recentAvgCravingIntensity: avg(recentIntensities),
    prevAvgCravingIntensity: avg(prevIntensities),
    topTriggers,
    avgSleepHours: avg(sleepValues),
    steadyRoutineRatePct:
      steadyRoutineAsked > 0 ? Math.round((steadyRoutineYes / steadyRoutineAsked) * 100) : null,
    steadyRoutineDaysCount: steadyRoutineYes,
    habitCompletionCount,
    goalsCompletedCount: goals.filter((g) => g.completed).length,
    goalsTotalCount: goals.length,
  };
}

export function matchOpportunitiesAndSkillGaps(
  profile: OpportunityProfile | null,
  catalog: OpportunityCatalogItem[],
  sectorFilter: string = 'all',
  query: string = ''
): OpportunityMatchResult[] {
  const q = query.trim().toLowerCase();
  const userSkills = (profile?.currentSkills || []).map((s) => s.toLowerCase().trim()).filter(Boolean);
  const preferredSectors = profile?.preferredSectors || [];

  const filtered = catalog.filter((item) => {
    if (sectorFilter !== 'all' && !item.sectors.includes(sectorFilter as any)) return false;
    if (!q) return true;
    const hay = `${item.title} ${item.provider} ${item.skillsTargeted.join(' ')} ${item.eligibility}`.toLowerCase();
    return hay.includes(q);
  });

  return filtered
    .map((item) => {
      let score = 40;
      const reasons: string[] = [];

      const sectorOverlap = item.sectors.filter((s) => preferredSectors.includes(s));
      if (sectorOverlap.length > 0) {
        score += 35;
        reasons.push('Matches your selected sector interest');
      }

      if (profile?.workPreference === 'apprenticeship' && item.type === 'apprenticeship') {
        score += 15;
        reasons.push('Paid on-the-job apprenticeship pathway');
      } else if (profile?.workPreference === 'self_employed' && item.type === 'micro_enterprise') {
        score += 15;
        reasons.push('Supports micro-enterprise & self-employment');
      } else if (profile?.workPreference === 'training_first' && item.type === 'training') {
        score += 12;
        reasons.push('Hands-on skill training before job entry');
      }

      const matchedSkills: string[] = [];
      const skillGaps: string[] = [];

      item.skillsTargeted.forEach((target) => {
        const words = target.toLowerCase().split(/[\s,&/]+/).filter((w) => w.length > 2);
        const hasMatch = userSkills.some((us) => words.some((w) => us.includes(w) || target.toLowerCase().includes(us)));
        if (hasMatch) matchedSkills.push(target);
        else skillGaps.push(target);
      });

      if (matchedSkills.length > 0) {
        score += Math.min(15, matchedSkills.length * 6);
        reasons.push(`Builds on your background (${matchedSkills[0]})`);
      } else if (skillGaps.length > 0) {
        reasons.push(`Helps you gain ${skillGaps[0]}`);
      }

      const stepPathway = [
        `Check eligibility on ${item.provider}: ${item.eligibility}`,
        skillGaps.length > 0
          ? `Prepare or start foundation module in ${skillGaps[0]}`
          : 'Organize academic/ID certificates and update your non-clinical Resume',
        'Save opportunity and sync registration or interview deadline to your Calendar',
      ];

      return {
        item,
        matchScore: Math.min(99, score),
        reasons: reasons.length > 0 ? reasons : ['Verified public Kerala / Government of India pathway'],
        skillGaps,
        stepPathway,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

const CLINICAL_KEYWORDS_BLOCKLIST = /\b(substance|craving|relapse|withdrawal|addiction|de-addiction|cannabis|alcohol|opioid|nicotine|mdma|therapy note|clinical)\b/i;

/**
 * Strictly exports ONLY explicitly consented, non-clinical items from Recovery Passport.
 * Substance use logs, cravings, and clinical notes are architecturally excluded.
 */
export function buildConsentedPassportExport(passport: RecoveryPassport): {
  headline: string;
  publicBio: string;
  clinicalIsolationNotice: string;
  sections: Record<RecoveryPassportSectionKey, Array<{ title: string; subtitle?: string; dateLabel?: string }>>;
  totalSharedItems: number;
} {
  const sections: Record<
    RecoveryPassportSectionKey,
    Array<{ title: string; subtitle?: string; dateLabel?: string }>
  > = {
    acquiredSkills: [],
    completedTraining: [],
    qualifications: [],
    achievements: [],
    workExperience: [],
    personalGoals: [],
    certifications: [],
  };

  let totalSharedItems = 0;

  passport.items.forEach((item) => {
    const sectionAllowed = Boolean(passport.sectionConsent?.[item.section]);
    if (!sectionAllowed || !item.shareWithProviders) return;

    // Extra defensive guardrail: strip accidental clinical terms from non-clinical export
    const combinedText = `${item.title} ${item.subtitle || ''}`;
    if (CLINICAL_KEYWORDS_BLOCKLIST.test(combinedText)) return;

    sections[item.section].push({
      title: item.title,
      subtitle: item.subtitle,
      dateLabel: item.dateLabel,
    });
    totalSharedItems += 1;
  });

  return {
    headline: passport.headline,
    publicBio: passport.publicBio,
    clinicalIsolationNotice:
      'Non-Clinical Portfolio Only: Substance-use history, craving logs, triggers, and therapy notes are strictly excluded.',
    sections,
    totalSharedItems,
  };
}
