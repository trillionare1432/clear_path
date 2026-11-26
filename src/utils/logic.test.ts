import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateActivityConsistency,
  calculateGoalProgress,
  calculateMoodDistribution,
  filterCalendarEvents,
  evaluateGoNoGoTrial,
  validateExportImportData,
  calculateSupportPlanProgress,
  calculateSupporterWeeklyActivity,
  calculateSupporterMoodDistribution,
  calculateLearnerCurriculumProgress,
  evaluateLearnerQuizScore,
  calculateRecoveryStreak,
  calculateAchievementBadges,
  calculateCommunityImpactMetrics,
  filterCommunityProgrammes,
  filterCommunityEvents,
  summarizeCommunityNeeds,
} from './logic';
import {
  generatePersonalizedLifePathway,
  computeMonthlyCalendarMap,
  computeRecoveryAnalytics,
  matchOpportunitiesAndSkillGaps,
  buildConsentedPassportExport,
} from './recoveryIntelligence';
import { VERIFIED_OPPORTUNITY_CATALOG, OPPORTUNITY_SECTOR_LABELS } from '../constants/opportunityCatalog';
import {
  DailyLog,
  Goal,
  CalendarEvent,
  SupportPlan,
  SupporterCalendarEvent,
  SupporterReflection,
  CommunityProgramme,
  CommunityEvent,
  CommunityTask,
  CommunityFeedbackEntry,
} from '../types';

test('calculateActivityConsistency aggregates activities correctly over 7 days', () => {
  const referenceDate = '2026-11-10T12:00:00.000Z';
  const mockLogs: DailyLog[] = [
    {
      id: '1',
      date: '2026-11-10',
      timestamp: new Date().toISOString(),
      type: 'quick',
      completedActivities: ['Morning walk', 'Mindful breathing'],
      tags: [],
    },
    {
      id: '2',
      date: '2026-11-10',
      timestamp: new Date().toISOString(),
      type: 'detailed',
      completedActivities: ['Journaling'],
      tags: [],
    },
    {
      id: '3',
      date: '2026-11-09',
      timestamp: new Date().toISOString(),
      type: 'quick',
      completedActivities: ['Reading'],
      tags: [],
    },
    {
      id: 'draft-1',
      date: '2026-11-10',
      timestamp: new Date().toISOString(),
      type: 'detailed',
      completedActivities: ['Ignored draft'],
      tags: [],
      isDraft: true,
    },
  ];

  const result = calculateActivityConsistency(mockLogs, 7, referenceDate);
  assert.equal(result.length, 7);

  const todayResult = result[result.length - 1];
  assert.equal(todayResult.date, '2026-11-10');
  assert.equal(todayResult.activityCount, 3);
  assert.equal(todayResult.hasLog, true);

  const yesterdayResult = result[result.length - 2];
  assert.equal(yesterdayResult.activityCount, 1);
});

test('calculateGoalProgress calculates percentages and milestone counts accurately', () => {
  const mockGoals: Goal[] = [
    {
      id: 'g1',
      title: 'Daily walk',
      description: 'Physical rebuild',
      category: 'physical',
      frequency: 'daily',
      milestones: [
        { id: 'm1', title: '15 min', completed: true },
        { id: 'm2', title: '30 min', completed: true },
        { id: 'm3', title: '45 min', completed: false },
      ],
      progressNotes: [],
      completed: false,
      createdAt: '2026-11-01',
    },
    {
      id: 'g2',
      title: 'Call supporter',
      description: 'Social reconnect',
      category: 'social',
      frequency: 'weekly',
      milestones: [{ id: 'm4', title: 'Pick time', completed: true }],
      progressNotes: [],
      completed: true,
      createdAt: '2026-11-02',
    },
  ];

  const progress = calculateGoalProgress(mockGoals);
  assert.equal(progress.totalGoals, 2);
  assert.equal(progress.completedGoals, 1);
  assert.equal(progress.totalMilestones, 4);
  assert.equal(progress.completedMilestones, 3);
  assert.equal(progress.percentageCompleted, 75);
});

test('calculateMoodDistribution counts valid non-draft moods correctly', () => {
  const mockLogs: DailyLog[] = [
    { id: '1', date: '2026-11-10', timestamp: '', type: 'quick', mood: 'hopeful', completedActivities: [], tags: [] },
    { id: '2', date: '2026-11-09', timestamp: '', type: 'quick', mood: 'hopeful', completedActivities: [], tags: [] },
    { id: '3', date: '2026-11-08', timestamp: '', type: 'quick', mood: 'challenged', completedActivities: [], tags: [] },
    { id: '4', date: '2026-11-07', timestamp: '', type: 'quick', mood: 'peaceful', completedActivities: [], tags: [] },
    { id: 'draft', date: '2026-11-06', timestamp: '', type: 'quick', mood: 'heavy', completedActivities: [], tags: [], isDraft: true },
  ];

  const distribution = calculateMoodDistribution(mockLogs);
  assert.equal(distribution.hopeful, 2);
  assert.equal(distribution.challenged, 1);
  assert.equal(distribution.peaceful, 1);
  assert.equal(distribution.heavy, 0);
});

test('filterCalendarEvents filters by date and category accurately', () => {
  const events: CalendarEvent[] = [
    { id: 'e1', title: 'Doctor Visit', date: '2026-11-12', category: 'appointment', reminder: true, completed: false },
    { id: 'e2', title: 'Art Therapy', date: '2026-11-12', category: 'healthy_activity', reminder: false, completed: false },
    { id: 'e3', title: 'Study session', date: '2026-11-13', category: 'learning', reminder: true, completed: false },
  ];

  const dateFiltered = filterCalendarEvents(events, '2026-11-12');
  assert.equal(dateFiltered.length, 2);

  const categoryFiltered = filterCalendarEvents(events, undefined, 'appointment');
  assert.equal(categoryFiltered.length, 1);
  assert.equal(categoryFiltered[0].title, 'Doctor Visit');
});

test('evaluateGoNoGoTrial enforces inhibition scoring rules', () => {
  const hit = evaluateGoNoGoTrial('go', true, 350);
  assert.equal(hit.isCorrect, true);
  assert.equal(hit.feedback, 'correct_hit');
  assert.equal(hit.scoreDelta, 15);

  const miss = evaluateGoNoGoTrial('go', false);
  assert.equal(miss.isCorrect, false);
  assert.equal(miss.feedback, 'miss');
  assert.equal(miss.scoreDelta, 0);

  const correctRejection = evaluateGoNoGoTrial('no-go', false);
  assert.equal(correctRejection.isCorrect, true);
  assert.equal(correctRejection.feedback, 'correct_rejection');
  assert.equal(correctRejection.scoreDelta, 20);

  const falseAlarm = evaluateGoNoGoTrial('no-go', true);
  assert.equal(falseAlarm.isCorrect, false);
  assert.equal(falseAlarm.feedback, 'false_alarm');
  assert.equal(falseAlarm.scoreDelta, -10);
});

test('validateExportImportData detects corrupted vs valid payloads', () => {
  assert.equal(validateExportImportData(null).valid, false);
  assert.equal(validateExportImportData('random string').valid, false);
  assert.equal(validateExportImportData({ irrelevant: true }).valid, false);

  const validData = {
    currentRole: 'personal',
    dailyLogs: [],
    calendarEvents: [],
    language: 'en',
  };
  const res = validateExportImportData(validData);
  assert.equal(res.valid, true);
  assert.equal(res.state?.currentRole, 'personal');
});

// ==========================================
// SUPPORTER (ROLE 02) UNIT TESTS
// ==========================================

test('calculateSupportPlanProgress computes plans and task completion percentages accurately', () => {
  const mockPlans: SupportPlan[] = [
    {
      id: 'sp1',
      title: 'Family Approach Plan',
      objective: 'Open communication and finding clinical assessment',
      relationshipCategory: 'Family Member',
      tasks: [
        { id: 't1', title: 'Read conversation guide', completed: true },
        { id: 't2', title: 'Schedule quiet conversation time', completed: true },
        { id: 't3', title: 'Find 2 verified Kerala centers', completed: false },
      ],
      completed: false,
      createdAt: '2026-11-01',
    },
    {
      id: 'sp2',
      title: 'Boundary Self-Care',
      objective: 'Prevent burnout and seek supporter peer group',
      relationshipCategory: 'Self Care',
      tasks: [
        { id: 't4', title: 'Call Vimukthi for family guidance', completed: true },
      ],
      completed: true,
      createdAt: '2026-11-02',
    },
  ];

  const progress = calculateSupportPlanProgress(mockPlans);
  assert.equal(progress.totalPlans, 2);
  assert.equal(progress.completedPlans, 1);
  assert.equal(progress.totalTasks, 4);
  assert.equal(progress.completedTasks, 3);
  assert.equal(progress.percentageCompleted, 75); // 3 of 4 = 75%
});

test('calculateSupporterWeeklyActivity aggregates completed events and reflections', () => {
  const referenceDate = '2026-11-10T12:00:00.000Z';
  const mockEvents: SupporterCalendarEvent[] = [
    {
      id: 'se1',
      title: 'Follow-up tea',
      date: '2026-11-10',
      category: 'family_activity',
      reminder: true,
      completed: true,
    },
    {
      id: 'se2',
      title: 'Uncompleted task',
      date: '2026-11-10',
      category: 'conversation_prep',
      reminder: false,
      completed: false,
    },
  ];

  const mockReflections: SupporterReflection[] = [
    {
      id: 'sr1',
      date: '2026-11-10',
      timestamp: '',
      type: 'quick',
      mood: 'encouraged',
      tags: [],
    },
    {
      id: 'sr2',
      date: '2026-11-09',
      timestamp: '',
      type: 'detailed',
      mood: 'steady',
      tags: [],
    },
    {
      id: 'draft',
      date: '2026-11-10',
      timestamp: '',
      type: 'quick',
      isDraft: true,
      tags: [],
    },
  ];

  const result = calculateSupporterWeeklyActivity(mockEvents, mockReflections, 7, referenceDate);
  assert.equal(result.length, 7);

  const today = result[result.length - 1];
  assert.equal(today.date, '2026-11-10');
  assert.equal(today.actionsCount, 2); // 1 completed event + 1 valid reflection
  assert.equal(today.hasReflection, true);
});

test('calculateSupporterMoodDistribution tallies supporter emotional check-ins', () => {
  const mockReflections: SupporterReflection[] = [
    { id: '1', date: '2026-11-10', timestamp: '', type: 'quick', mood: 'encouraged', tags: [] },
    { id: '2', date: '2026-11-09', timestamp: '', type: 'quick', mood: 'encouraged', tags: [] },
    { id: '3', date: '2026-11-08', timestamp: '', type: 'quick', mood: 'concerned', tags: [] },
    { id: '4', date: '2026-11-07', timestamp: '', type: 'quick', mood: 'drained', tags: [] },
    { id: 'draft', date: '2026-11-06', timestamp: '', type: 'quick', mood: 'hopeful', tags: [], isDraft: true },
  ];

  const dist = calculateSupporterMoodDistribution(mockReflections);
  assert.equal(dist.encouraged, 2);
  assert.equal(dist.concerned, 1);
  assert.equal(dist.drained, 1);
  assert.equal(dist.hopeful, 0); // Draft is excluded
});

// ==========================================
// ROLE 03: LEARNER LOGIC TESTS
// ==========================================
test('calculateLearnerCurriculumProgress computes accurate percentages and completion states', () => {
  const empty = calculateLearnerCurriculumProgress(16, []);
  assert.equal(empty.completedCount, 0);
  assert.equal(empty.percentage, 0);
  assert.equal(empty.isAllComplete, false);

  const partial = calculateLearnerCurriculumProgress(16, ['l1', 'l2', 'l3', 'l4']);
  assert.equal(partial.completedCount, 4);
  assert.equal(partial.percentage, 25);
  assert.equal(partial.isAllComplete, false);

  const full = calculateLearnerCurriculumProgress(4, ['l1', 'l2', 'l3', 'l4']);
  assert.equal(full.completedCount, 4);
  assert.equal(full.percentage, 100);
  assert.equal(full.isAllComplete, true);
});

test('evaluateLearnerQuizScore validates pass threshold and assigns correct mastery labels', () => {
  const perfect = evaluateLearnerQuizScore(5, 5);
  assert.equal(perfect.percentage, 100);
  assert.equal(perfect.passed, true);
  assert.equal(perfect.masteryLabel, 'Mastery');

  const proficient = evaluateLearnerQuizScore(4, 5);
  assert.equal(proficient.percentage, 80);
  assert.equal(proficient.passed, true);
  assert.equal(proficient.masteryLabel, 'Proficient');

  const failing = evaluateLearnerQuizScore(1, 5);
  assert.equal(failing.percentage, 20);
  assert.equal(failing.passed, false);
  assert.equal(failing.masteryLabel, 'Needs Review');
});

// ==========================================
// ROLE 01: STREAK & ACHIEVEMENT BADGE TESTS
// ==========================================
test('calculateRecoveryStreak calculates consecutive days and longest streak accurately', () => {
  const referenceDate = '2026-11-10T12:00:00.000Z';
  const mockLogs: DailyLog[] = [
    { id: '1', date: '2026-11-10', timestamp: '', type: 'quick', completedActivities: ['Walk'], tags: [] },
    { id: '2', date: '2026-11-09', timestamp: '', type: 'quick', completedActivities: [], tags: [] },
    { id: '3', date: '2026-11-08', timestamp: '', type: 'quick', completedActivities: [], tags: [] },
    // Gap on 2026-11-07
    { id: '4', date: '2026-11-06', timestamp: '', type: 'quick', completedActivities: [], tags: [] },
    { id: '5', date: '2026-11-05', timestamp: '', type: 'quick', completedActivities: [], tags: [] },
  ];

  const streak = calculateRecoveryStreak(mockLogs, [], referenceDate);
  assert.equal(streak.currentStreak, 3);
  assert.equal(streak.longestStreak, 3);
  assert.equal(streak.streakActiveToday, true);

  // If no log today, but logged yesterday
  const streakYesterday = calculateRecoveryStreak(
    mockLogs.filter(l => l.date !== '2026-11-10'),
    [],
    referenceDate
  );
  assert.equal(streakYesterday.currentStreak, 2);
  assert.equal(streakYesterday.streakActiveToday, false);
});

test('calculateAchievementBadges evaluates milestone unlock thresholds and progress', () => {
  const mockLogs: DailyLog[] = [
    { id: '1', date: '2026-11-10', timestamp: '', type: 'quick', completedActivities: [], tags: [] },
  ];
  const mockEvents: CalendarEvent[] = [
    { id: 'e1', title: 'Routine', date: '2026-11-10', category: 'healthy_activity', reminder: false, completed: true },
    { id: 'e2', title: 'Routine 2', date: '2026-11-09', category: 'healthy_activity', reminder: false, completed: true },
  ];
  const mockGoals: Goal[] = [
    {
      id: 'g1',
      title: 'Goal',
      description: '',
      category: 'personal',
      frequency: 'daily',
      milestones: [{ id: 'm1', title: 'Step 1', completed: true }],
      progressNotes: [],
      completed: true,
      createdAt: '2026-11-01',
    },
  ];

  const badges = calculateAchievementBadges(mockLogs, mockEvents, mockGoals, {
    gonogo: { sessionsPlayed: 2 },
  });

  const firstReflection = badges.find(b => b.id === 'first_reflection');
  assert.equal(firstReflection?.unlocked, true);
  assert.equal(firstReflection?.progress, 100);

  const goalBuilder = badges.find(b => b.id === 'first_milestone');
  assert.equal(goalBuilder?.unlocked, true);

  const cognitiveExplorer = badges.find(b => b.id === 'cognitive_explorer');
  assert.equal(cognitiveExplorer?.unlocked, true);

  const streak7 = badges.find(b => b.id === 'streak_7');
  assert.equal(streak7?.unlocked, false);
});

// ==========================================
// ROLE 04: COMMUNITY BUILDER UNIT TESTS
// ==========================================
test('calculateCommunityImpactMetrics computes derived metrics from real records accurately', () => {
  const mockProgrammes: CommunityProgramme[] = [
    {
      id: 'p1',
      title: 'School Drive',
      category: 'school_awareness',
      objective: 'Awareness',
      targetAudience: 'Students',
      location: 'Kochi',
      district: 'Ernakulam',
      startDate: '2026-11-01',
      endDate: '2026-11-20',
      coordinatorId: 'c1',
      teamMemberIds: [],
      requiredResources: '',
      budget: 10000,
      spent: 8000,
      status: 'active',
      expectedOutcomes: 'Reach 200',
      createdAt: '2026-11-01',
    },
    {
      id: 'p2',
      title: 'Teacher Workshop',
      category: 'teacher_training',
      objective: 'Training',
      targetAudience: 'Teachers',
      location: 'Trivandrum',
      district: 'Thiruvananthapuram',
      startDate: '2026-10-01',
      endDate: '2026-10-15',
      coordinatorId: 'c1',
      teamMemberIds: [],
      requiredResources: '',
      budget: 5000,
      spent: 5000,
      status: 'completed',
      expectedOutcomes: 'Train 30',
      createdAt: '2026-10-01',
    },
  ];

  const mockEvents: CommunityEvent[] = [
    {
      id: 'e1',
      programmeId: 'p1',
      title: 'Class Session 1',
      category: 'Classroom',
      date: '2026-11-05',
      startTime: '10:00',
      endTime: '11:00',
      venue: 'Hall A',
      coordinatorId: 'c1',
      description: '',
      targetAudience: 'Students',
      expectedAttendance: 100,
      actualAttendance: 90,
      status: 'completed',
    },
    {
      id: 'e2',
      programmeId: 'p1',
      title: 'Class Session 2',
      category: 'Classroom',
      date: '2026-11-15',
      startTime: '10:00',
      endTime: '11:00',
      venue: 'Hall B',
      coordinatorId: 'c1',
      description: '',
      targetAudience: 'Students',
      expectedAttendance: 100,
      actualAttendance: 0,
      status: 'scheduled',
    },
  ];

  const mockTasks: CommunityTask[] = [
    {
      id: 't1',
      title: 'Print flyers',
      assignedMemberId: 'm1',
      dueDate: '2026-11-04',
      priority: 'high',
      status: 'completed',
      description: '',
    },
    {
      id: 't2',
      title: 'Coordinate speaker',
      assignedMemberId: 'm1',
      dueDate: '2026-11-05',
      priority: 'medium',
      status: 'pending',
      description: '',
    },
  ];

  const mockFeedback: CommunityFeedbackEntry[] = [
    {
      id: 'f1',
      programmeId: 'p1',
      date: '2026-11-05',
      topic: 'Workshop',
      participantGroup: 'Students',
      usefulnessRating: 5,
      clarityRating: 4,
      keyConcernsExpressed: ['Peer pressure at tuition', 'Exam stress'],
      unmetNeedsSuggestions: 'More roleplay',
      anonymous: true,
    },
    {
      id: 'f2',
      programmeId: 'p1',
      date: '2026-11-05',
      topic: 'Workshop',
      participantGroup: 'Students',
      usefulnessRating: 4,
      clarityRating: 4,
      keyConcernsExpressed: ['Peer pressure at tuition'],
      unmetNeedsSuggestions: 'Follow up sessions',
      anonymous: true,
    },
  ];

  const metrics = calculateCommunityImpactMetrics(mockProgrammes, mockEvents, mockTasks, mockFeedback);

  assert.equal(metrics.totalProgrammes, 2);
  assert.equal(metrics.activeProgrammes, 1);
  assert.equal(metrics.completedProgrammes, 1);
  assert.equal(metrics.totalEvents, 2);
  assert.equal(metrics.completedEvents, 1);
  assert.equal(metrics.totalExpectedAttendance, 200);
  assert.equal(metrics.totalActualAttendance, 90);
  assert.equal(metrics.attendanceRatePct, 45); // 90/200 = 45%
  assert.equal(metrics.totalTasks, 2);
  assert.equal(metrics.completedTasks, 1);
  assert.equal(metrics.taskCompletionRatePct, 50);
  assert.equal(metrics.totalBudget, 15000);
  assert.equal(metrics.totalSpent, 13000);
  assert.equal(metrics.budgetUtilizationPct, 87); // 13000/15000 = 86.66% -> 87%
  assert.equal(metrics.averageUsefulnessRating, 4.5);
  assert.equal(metrics.averageClarityRating, 4.0);
  assert.equal(metrics.totalFeedbackCount, 2);
});

test('summarizeCommunityNeeds extracts top non-identifying concerns accurately', () => {
  const mockFeedback: CommunityFeedbackEntry[] = [
    {
      id: 'f1',
      date: '2026-11-05',
      topic: 'Session',
      participantGroup: 'Youth',
      usefulnessRating: 5,
      clarityRating: 5,
      keyConcernsExpressed: ['Synthetic pills near bus stand', 'Academic anxiety'],
      unmetNeedsSuggestions: '',
      anonymous: true,
    },
    {
      id: 'f2',
      date: '2026-11-06',
      topic: 'Session',
      participantGroup: 'Youth',
      usefulnessRating: 4,
      clarityRating: 4,
      keyConcernsExpressed: ['Synthetic pills near bus stand', 'Parent conflict'],
      unmetNeedsSuggestions: '',
      anonymous: true,
    },
  ];

  const summary = summarizeCommunityNeeds(mockFeedback);
  assert.equal(summary.totalResponses, 2);
  assert.equal(summary.averageRating, 4.5);
  assert.equal(summary.topConcerns[0].topic, 'Synthetic pills near bus stand');
  assert.equal(summary.topConcerns[0].count, 2);
});

test('generatePersonalizedLifePathway distinguishes self-reported tracking from clinician-confirmed care', () => {
  const selfPathway = generatePersonalizedLifePathway({
    primaryNeed: 'I want to change my current behaviour.',
    assistanceTypes: [],
    language: 'en',
    storagePreference: 'private',
    supportPreferences: { reminders: true, trustedSupporter: false, professionalFinder: true },
    journeyStage: 'starting_change',
    clinicalTreatmentStatus: 'self_reported_only',
    immediateNeeds: ['sleep_routine', 'education_skills'],
    personalGoals: ['Resume study & courses'],
    completed: true,
  });
  assert.equal(selfPathway.isFormalTreatmentConfirmed, false);
  assert.ok(selfPathway.careStatusLabel.includes('Self-Reported'));
  assert.ok(selfPathway.recommendedDevTrackIds.includes('dev-education'));

  const clinicalPathway = generatePersonalizedLifePathway({
    primaryNeed: 'I am already receiving treatment.',
    assistanceTypes: [],
    language: 'en',
    storagePreference: 'private',
    supportPreferences: { reminders: true, trustedSupporter: false, professionalFinder: true },
    journeyStage: 'active_recovery',
    clinicalTreatmentStatus: 'clinician_confirmed_treatment',
    completed: true,
  });
  assert.equal(clinicalPathway.isFormalTreatmentConfirmed, true);
  assert.ok(clinicalPathway.careStatusLabel.includes('Clinician-Confirmed'));
});

test('computeMonthlyCalendarMap separates unlogged days cleanly from explicitly skipped days', () => {
  const logs: DailyLog[] = [
    {
      id: 'l1',
      date: '2026-11-02',
      timestamp: '2026-11-02T09:00:00Z',
      type: 'quick',
      mood: 'steady',
      completedActivities: ['Morning walk'],
      tags: [],
      routineSteady: true,
    },
  ];
  const events: CalendarEvent[] = [
    {
      id: 'e1',
      title: 'Evening walk',
      date: '2026-11-03',
      category: 'healthy_activity',
      reminder: true,
      completed: false,
      completionState: 'partial',
    },
    {
      id: 'e2',
      title: 'Workshop',
      date: '2026-11-04',
      category: 'learning',
      reminder: true,
      completed: false,
      completionState: 'skipped',
    },
  ];

  const cells = computeMonthlyCalendarMap(2026, 10, logs, events); // November 2026
  const nov1 = cells.find(c => c.date === '2026-11-01');
  const nov2 = cells.find(c => c.date === '2026-11-02');
  const nov3 = cells.find(c => c.date === '2026-11-03');
  const nov4 = cells.find(c => c.date === '2026-11-04');

  assert.equal(nov1?.state, 'unlogged');
  assert.equal(nov2?.state, 'completed');
  assert.equal(nov3?.state, 'partial');
  assert.equal(nov4?.state, 'skipped');
});

test('computeRecoveryAnalytics summarizes cravings, sleep, triggers, and steady days without synthetic recovery %', () => {
  const logs: DailyLog[] = [
    {
      id: 'l1',
      date: '2026-11-20',
      timestamp: '2026-11-20T09:00:00Z',
      type: 'quick',
      mood: 'steady',
      completedActivities: ['Walk'],
      tags: ['stress', 'evening'],
      cravingFrequency: 2,
      cravingIntensity: 4,
      sleepHours: 7,
      routineSteady: true,
    },
    {
      id: 'l2',
      date: '2026-11-22',
      timestamp: '2026-11-22T09:00:00Z',
      type: 'quick',
      mood: 'challenged',
      completedActivities: [],
      tags: ['stress'],
      cravingFrequency: 4,
      cravingIntensity: 6,
      sleepHours: 6,
      routineSteady: false,
    },
  ];
  const summary = computeRecoveryAnalytics(logs, [], [], [], '2026-11-10', '2026-11-22');
  assert.equal(summary.totalDaysSinceStart, 13);
  assert.equal(summary.avgCravingFrequency, 3);
  assert.equal(summary.avgCravingIntensity, 5);
  assert.equal(summary.avgSleepHours, 6.5);
  assert.equal(summary.steadyRoutineRatePct, 50);
  assert.equal(summary.topTriggers[0].tag, 'stress');
  assert.equal(summary.topTriggers[0].count, 2);
  assert.equal('recoveryScorePct' in summary, false);
});

test('matchOpportunitiesAndSkillGaps spans all 10 sectors with official Kerala/India sources', () => {
  assert.equal(Object.keys(OPPORTUNITY_SECTOR_LABELS).length, 10);
  const matches = matchOpportunitiesAndSkillGaps(
    {
      educationLevel: '+2',
      currentSkills: ['Coding', 'Excel'],
      preferredSectors: ['tech_digital', 'skilled_trades'],
      district: 'Kochi',
      workPreference: 'apprenticeship',
      careerObjective: 'Learn IT & EV support',
      updatedAt: '2026-11-22T00:00:00Z',
    },
    VERIFIED_OPPORTUNITY_CATALOG,
    'all',
    ''
  );
  assert.ok(matches.length >= 6);
  assert.ok(matches.every(m => m.item.sourceUrl.startsWith('https://')));
});

test('buildConsentedPassportExport isolates strictly non-clinical items and blocks clinical leaks', () => {
  const result = buildConsentedPassportExport({
    headline: 'Ready for vocational apprenticeship',
    publicBio: 'Organized and dependable trainee.',
    sectionConsent: {
      acquiredSkills: true,
      completedTraining: true,
      qualifications: false,
      achievements: true,
      workExperience: true,
      personalGoals: true,
      certifications: true,
    },
    items: [
      {
        id: 'i1',
        section: 'acquiredSkills',
        title: 'Spreadsheet & Inventory Basics',
        shareWithProviders: true,
      },
      {
        id: 'i2',
        section: 'qualifications',
        title: 'SSLC Certificate',
        shareWithProviders: true, // Section consent is false!
      },
      {
        id: 'i3',
        section: 'achievements',
        title: 'Managed craving episode in therapy',
        shareWithProviders: true, // Blocked by clinical keyword filter!
      },
      {
        id: 'i4',
        section: 'certifications',
        title: 'ASAP Digital Literacy Certificate',
        shareWithProviders: false, // Item consent is false!
      },
    ],
    updatedAt: '2026-11-22T00:00:00Z',
  });

  assert.equal(result.totalSharedItems, 1);
  assert.equal(result.sections.acquiredSkills.length, 1);
  assert.equal(result.sections.qualifications.length, 0);
  assert.equal(result.sections.achievements.length, 0);
  assert.equal(result.sections.certifications.length, 0);
});



