import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import {
  UserRole,
  Language,
  PersonalOnboarding,
  DailyLog,
  CalendarEvent,
  Goal,
  SupportCenter,
  SupporterOnboarding,
  SupportPlan,
  SupporterCalendarEvent,
  SupporterReflection,
  ConversationPlan,
  LearnerOnboarding,
  LearnerCalendarEvent,
  LearnerJournalEntry,
  QuizAttempt,
  CommunityOnboarding,
  CommunityOrganisation,
  CommunityMember,
  CommunityProgramme,
  CommunityEvent,
  CommunityTask,
  CommunityCampaign,
  CommunityFeedbackEntry,
  UserProfile,
  MotivationAnchor,
  LearnerCustomPlan,
  LearnerCertificate,
  TriggerJournalEntry,
  HabitChallenge,
  EarlySupportAssessment,
  UnifiedNotification,
  ConsentPreferences,
  ClearPathMission,
  InnovationExchangeItem,
  AchievementTimelineItem,
  PortalMode,
  ServerAuthUser,
  TherapistAssignmentRecord,
  AppointmentNoteClient,
  CarePlanProposalClient,
  SubstanceConcernRecord,
  PersonalizedSupportPlanRecord,
  AiChatRole,
  AiChatContextRef,
  AiChatMessage,
  AiChatSession,
  PersonalizationProfile,
  RecoveryReportRecord,
  OpportunityProfile,
  SavedOpportunityRecord,
  OpportunityApplication,
  RecoveryPassport,
  PersonalDevTrackProgress,
} from '../types';
import { TRANSLATIONS } from '../constants/translations';
import { LEARNER_LESSONS } from '../constants/learnerData';
import {
  INITIAL_SEED_DATA,
  INITIAL_SUPPORTER_DATA,
  VERIFIED_SUPPORT_CENTERS,
} from '../constants/initialData';
import {
  INITIAL_CLEARPATH_MISSIONS,
  SEEDED_EXCHANGE_TEMPLATES,
} from '../constants/featureCatalog';
import { validateExportImportData } from '../utils/logic';
import {
  CareRelayRecord,
  CareRelayStatus,
  SharedItemKind,
  SharedSupporterItem,
  SupportNeedFocus,
  buildReferralHandoffSummary,
  canTransitionCareRelay,
  sanitizeSharedSupporterItem,
} from '../utils/careRelay';
import {
  GLOBAL_STORAGE_KEYS,
  SCOPED_STORAGE_KEYS,
  clearScopedVault,
  getVaultScope,
  purgeLegacyUnscopedWorkspaceKeys,
  readScopedJson,
  readScopedString,
  removeScopedKey,
  writeScopedString,
} from '../utils/vaultStorage';

interface AppContextType {
  currentRole: UserRole | null;
  setRole: (role: UserRole | null) => void;
  portalMode: PortalMode;
  setPortalMode: (mode: PortalMode) => void;
  serverAuthToken: string | null;
  serverAuthUser: ServerAuthUser | null;
  setServerSession: (token: string, user: ServerAuthUser) => void;
  clearServerSession: () => void;
  clientAssignments: TherapistAssignmentRecord[];
  clientAppointments: AppointmentNoteClient[];
  carePlanProposals: CarePlanProposalClient[];
  realtimeStatus: 'connecting' | 'connected' | 'offline';
  realtimeTick: number;
  refreshClientAssignments: () => Promise<void>;
  language: Language;
  setLanguage: (lang: Language) => void;
  themeMode: 'day' | 'night';
  setThemeMode: (mode: 'day' | 'night') => void;
  toggleThemeMode: () => void;
  t: (key: string) => string;

  // ==========================================
  // ROLE 01: PERSONAL JOURNEY
  // ==========================================
  personalOnboarding: PersonalOnboarding | null;
  savePersonalOnboarding: (onboarding: PersonalOnboarding) => void;

  dailyLogs: DailyLog[];
  addDailyLog: (log: Omit<DailyLog, 'id' | 'timestamp'>) => DailyLog;
  updateDailyLog: (id: string, log: Partial<DailyLog>) => void;
  deleteDailyLog: (id: string) => void;

  calendarEvents: CalendarEvent[];
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => CalendarEvent;
  updateCalendarEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;
  toggleCalendarEvent: (id: string) => void;

  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'milestones' | 'progressNotes'>, initialMilestones?: string[]) => Goal;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  toggleMilestone: (goalId: string, milestoneId: string) => void;
  addGoalNote: (goalId: string, noteText: string) => void;

  // Cognitive Games & Tools (Role 01)
  gameStats: Record<string, { highScores: number; sessionsPlayed: number; lastPlayed?: string }>;
  recordGameScore: (gameId: string, score: number) => void;
  toolCompletions: Record<string, { completedAt: string; responses: Record<number, string> }>;
  saveToolCompletion: (toolId: string, responses: Record<number, string>) => void;

  // Substance Identification & Personalized Support Plan (Role 01)
  substanceConcerns: SubstanceConcernRecord[];
  saveSubstanceConcerns: (concerns: SubstanceConcernRecord[]) => void;
  upsertSubstanceConcern: (concern: SubstanceConcernRecord) => void;
  removeSubstanceConcern: (id: string) => void;
  personalizedSupportPlan: PersonalizedSupportPlanRecord | null;
  savePersonalizedSupportPlan: (plan: PersonalizedSupportPlanRecord) => void;

  // Recovery Intelligence, Opportunities, Passport & Personal Development (Role 01)
  recoveryReports: RecoveryReportRecord[];
  addRecoveryReport: (report: RecoveryReportRecord) => void;
  opportunityProfile: OpportunityProfile | null;
  saveOpportunityProfile: (profile: OpportunityProfile) => void;
  savedOpportunities: SavedOpportunityRecord[];
  toggleOpportunitySave: (opportunityId: string, personalNote?: string) => void;
  opportunityApplications: OpportunityApplication[];
  addOpportunityApplication: (app: Omit<OpportunityApplication, 'id' | 'updatedAt'>) => OpportunityApplication;
  updateOpportunityApplication: (id: string, updates: Partial<OpportunityApplication>) => void;
  deleteOpportunityApplication: (id: string) => void;
  syncInterviewToCalendar: (applicationId: string, date: string, time?: string, label?: string) => void;
  recoveryPassport: RecoveryPassport;
  saveRecoveryPassport: (passport: RecoveryPassport) => void;
  personalDevProgress: Record<string, PersonalDevTrackProgress>;
  togglePersonalDevStep: (trackId: string, stepId: string) => void;
  updateRecoveryStartDate: (dateStr: string) => void;

  // ==========================================
  // ROLE 02: SUPPORTER WORKSPACE
  // ==========================================
  supporterOnboarding: SupporterOnboarding | null;
  saveSupporterOnboarding: (onboarding: SupporterOnboarding) => void;

  supportPlans: SupportPlan[];
  addSupportPlan: (
    plan: Omit<SupportPlan, 'id' | 'createdAt' | 'tasks'>,
    initialTasks?: string[]
  ) => SupportPlan;
  updateSupportPlan: (id: string, updates: Partial<SupportPlan>) => void;
  deleteSupportPlan: (id: string) => void;
  toggleSupportPlanTask: (planId: string, taskId: string) => void;
  addSupportPlanTask: (planId: string, taskTitle: string) => void;

  supporterEvents: SupporterCalendarEvent[];
  addSupporterCalendarEvent: (event: Omit<SupporterCalendarEvent, 'id'>) => SupporterCalendarEvent;
  updateSupporterCalendarEvent: (id: string, updates: Partial<SupporterCalendarEvent>) => void;
  deleteSupporterCalendarEvent: (id: string) => void;
  toggleSupporterCalendarEvent: (id: string) => void;

  supporterReflections: SupporterReflection[];
  addSupporterReflection: (reflection: Omit<SupporterReflection, 'id' | 'timestamp'>) => SupporterReflection;
  updateSupporterReflection: (id: string, updates: Partial<SupporterReflection>) => void;
  deleteSupporterReflection: (id: string) => void;

  savedConversationPlans: ConversationPlan[];
  saveConversationPlan: (plan: Omit<ConversationPlan, 'id' | 'createdAt'>) => ConversationPlan;
  deleteConversationPlan: (id: string) => void;

  completedEducationModuleIds: string[];
  toggleCompletedEducationModule: (moduleId: string) => void;

  // ==========================================
  // ROLE 03: LEARNER WORKSPACE
  // ==========================================
  learnerOnboarding: LearnerOnboarding | null;
  saveLearnerOnboarding: (onboarding: LearnerOnboarding) => void;

  completedLessonIds: string[];
  toggleCompleteLesson: (lessonId: string) => void;

  bookmarkedLessonIds: string[];
  toggleBookmarkLesson: (lessonId: string) => void;

  savedScenarioAttempts: Record<string, { choiceIndex: number; completedAt: string }>;
  saveScenarioAttempt: (scenarioId: string, choiceIndex: number) => void;

  learnerEvents: LearnerCalendarEvent[];
  addLearnerEvent: (event: Omit<LearnerCalendarEvent, 'id'>) => LearnerCalendarEvent;
  updateLearnerEvent: (id: string, updates: Partial<LearnerCalendarEvent>) => void;
  deleteLearnerEvent: (id: string) => void;
  toggleLearnerEvent: (id: string) => void;

  learnerJournalEntries: LearnerJournalEntry[];
  addLearnerJournalEntry: (entry: Omit<LearnerJournalEntry, 'id' | 'timestamp'>) => LearnerJournalEntry;
  deleteLearnerJournalEntry: (id: string) => void;

  quizAttempts: QuizAttempt[];
  saveQuizAttempt: (attempt: Omit<QuizAttempt, 'id' | 'timestamp'>) => QuizAttempt;

  learnerStudyDates: string[];
  recordLearnerStudyDay: (dateStr?: string) => void;

  // ==========================================
  // ROLE 04: COMMUNITY BUILDER WORKSPACE
  // ==========================================
  communityOnboarding: CommunityOnboarding | null;
  saveCommunityOnboarding: (onboarding: CommunityOnboarding, org?: Partial<CommunityOrganisation>) => void;

  communityOrg: CommunityOrganisation | null;
  updateCommunityOrg: (org: Partial<CommunityOrganisation>) => void;

  communityMembers: CommunityMember[];
  addCommunityMember: (member: Omit<CommunityMember, 'id' | 'joinedAt'>) => CommunityMember;
  updateCommunityMember: (id: string, member: Partial<CommunityMember>) => void;
  deleteCommunityMember: (id: string) => void;

  communityProgrammes: CommunityProgramme[];
  addCommunityProgramme: (prog: Omit<CommunityProgramme, 'id' | 'createdAt' | 'spent'>) => CommunityProgramme;
  updateCommunityProgramme: (id: string, prog: Partial<CommunityProgramme>) => void;
  deleteCommunityProgramme: (id: string) => void;

  communityEvents: CommunityEvent[];
  addCommunityEvent: (event: Omit<CommunityEvent, 'id' | 'actualAttendance'>) => CommunityEvent;
  updateCommunityEvent: (id: string, event: Partial<CommunityEvent>) => void;
  deleteCommunityEvent: (id: string) => void;

  communityTasks: CommunityTask[];
  addCommunityTask: (task: Omit<CommunityTask, 'id'>) => CommunityTask;
  updateCommunityTask: (id: string, task: Partial<CommunityTask>) => void;
  deleteCommunityTask: (id: string) => void;
  toggleCommunityTask: (id: string) => void;

  communityCampaigns: CommunityCampaign[];
  addCommunityCampaign: (campaign: Omit<CommunityCampaign, 'id' | 'spent'>) => CommunityCampaign;
  updateCommunityCampaign: (id: string, campaign: Partial<CommunityCampaign>) => void;
  deleteCommunityCampaign: (id: string) => void;

  communityFeedback: CommunityFeedbackEntry[];
  addCommunityFeedback: (entry: Omit<CommunityFeedbackEntry, 'id'>) => CommunityFeedbackEntry;
  deleteCommunityFeedback: (id: string) => void;

  bookmarkedResourceIds: string[];
  toggleBookmarkResource: (resourceId: string) => void;

  // ==========================================
  // CLEAR PATH AI: USER PROFILE & AUTH
  // ==========================================
  userProfile: UserProfile | null;
  vaultScope: string;
  saveUserProfile: (profile: UserProfile, options?: { isNewSignup?: boolean }) => void;
  logoutUser: () => void;
  resetGuestVault: () => void;

  // ==========================================
  // ROLE 01: MOTIVATION BAR
  // ==========================================
  motivationAnchor: MotivationAnchor;
  saveMotivationWhy: (why: string) => void;

  // ==========================================
  // ROLE 03: CUSTOM LEARNER PLAN & CERTIFICATE
  // ==========================================
  learnerCustomPlan: LearnerCustomPlan | null;
  saveLearnerCustomPlan: (plan: LearnerCustomPlan) => void;
  togglePlanDayCompleted: (dayNumber: number) => void;
  learnerCertificate: LearnerCertificate | null;
  issueLearnerCertificate: (recipientName: string) => LearnerCertificate;

  // ==========================================
  // GOOGLE MAPS PLATFORM QUOTA STATUS
  // ==========================================
  gmpQuotaExceeded: boolean;

  // ==========================================
  // CLEARPATH AI CONNECTED ECOSYSTEM
  // ==========================================
  triggerEntries: TriggerJournalEntry[];
  addTriggerEntry: (entry: Omit<TriggerJournalEntry, 'id' | 'timestamp'>) => TriggerJournalEntry;
  deleteTriggerEntry: (id: string) => void;

  habitChallenges: HabitChallenge[];
  toggleHabitChallengeDay: (challengeId: string, dateStr?: string) => void;
  addHabitChallenge: (title: string, category: HabitChallenge['category'], targetDays: number) => void;

  earlyAssessments: EarlySupportAssessment[];
  saveEarlyAssessment: (assessment: Omit<EarlySupportAssessment, 'id' | 'date'>) => EarlySupportAssessment;

  notifications: UnifiedNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearViewedNotifications: () => void;
  addNotification: (notif: Omit<UnifiedNotification, 'id' | 'timestamp' | 'read'>) => void;

  timelineEvents: AchievementTimelineItem[];
  addTimelineEvent: (evt: Omit<AchievementTimelineItem, 'id' | 'date'>) => void;

  dismissedIntroRoles: UserRole[];
  dismissRoleIntro: (role: UserRole) => void;

  consentPrefs: ConsentPreferences;
  updateConsentPrefs: (updates: Partial<ConsentPreferences>) => void;

  missions: ClearPathMission[];
  toggleMissionStep: (missionId: string, stepIdx: number) => void;
  addMission: (mission: Omit<ClearPathMission, 'id' | 'completedStepIndices'>) => void;

  exchangeItems: InnovationExchangeItem[];
  publishToExchange: (item: Omit<InnovationExchangeItem, 'id' | 'adaptedCount' | 'createdAt'>) => void;
  adaptExchangeTemplate: (id: string) => void;

  // ==========================================
  // SHARED RESOURCES & BACKUP
  // ==========================================
  supportCenters: SupportCenter[];
  savedCenterIds: string[];
  toggleSaveCenter: (centerId: string) => void;

  // ==========================================
  // CARE RELAY & CONSENT-SCOPED SUPPORTER BRIDGE
  // ==========================================
  careRelays: CareRelayRecord[];
  createCareRelay: (input: {
    center: SupportCenter;
    supportNeed: SupportNeedFocus;
    preferredLanguage: 'en' | 'ml';
    preferredCallbackWindow?: string;
    consentGranted: boolean;
    includeDistrictInSummary?: boolean;
  }) => CareRelayRecord | null;
  updateCareRelayStatus: (
    id: string,
    status: CareRelayStatus,
    details?: { note?: string; appointmentDate?: string; appointmentTime?: string }
  ) => void;
  revokeCareRelayConsent: (id: string) => void;
  deleteCareRelay: (id: string) => void;

  sharedSupporterItems: SharedSupporterItem[];
  shareItemWithSupporter: (input: {
    id?: string;
    kind: SharedItemKind;
    title: string;
    detail: string;
    targetDate?: string;
    consentGranted: boolean;
  }) => SharedSupporterItem | null;
  revokeSharedSupporterItem: (id: string) => void;

  exportBackup: () => void;
  importBackup: (jsonStr: string) => { success: boolean; error?: string };
  clearAllLocalData: () => void;

  // ==========================================
  // SHARED BRIEF PERSONALIZED AI CHAT & NAVIGATION
  // ==========================================
  aiChatSessions: AiChatSession[];
  activeAiSessionId: string | null;
  isAiDrawerOpen: boolean;
  aiPendingContext: AiChatContextRef | null;
  aiLoading: boolean;
  personalizationProfile: PersonalizationProfile;
  openAiAssistant: (options?: {
    role?: AiChatRole;
    contextRef?: AiChatContextRef;
    initialQuestion?: string;
    newChat?: boolean;
    asDrawer?: boolean;
  }) => void;
  closeAiAssistant: () => void;
  clearAiPendingContext: () => void;
  createNewAiSession: (role?: AiChatRole, contextRef?: AiChatContextRef) => AiChatSession;
  selectAiSession: (sessionId: string) => void;
  deleteAiSession: (sessionId: string) => void;
  clearAllAiSessions: () => void;
  sendAiChatMessage: (text: string, options?: { role?: AiChatRole; contextRef?: AiChatContextRef; sessionId?: string }) => Promise<void>;
  registerRoleTabNavigator: (fn: (role: UserRole, tab?: string) => void) => void;
  navigateToRoleTab: (role: UserRole, tab?: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ...GLOBAL_STORAGE_KEYS,
  ...SCOPED_STORAGE_KEYS,
};

const SCOPED_KEY_SET = new Set<string>(Object.values(SCOPED_STORAGE_KEYS));

const DEFAULT_MOTIVATION_ANCHOR: MotivationAnchor = {
  personalWhy: 'For my clarity of mind, my loved ones, and rebuilding a peaceful, steady life.',
  favoriteQuotes: [],
};

const DEFAULT_CONSENT_PREFS: ConsentPreferences = {
  receiveCrossRoleAnnouncements: true,
  shareAnonymizedLearningGaps: false,
  allowOptionalActionBridges: true,
};

const DEFAULT_RECOVERY_PASSPORT: RecoveryPassport = {
  headline: '',
  publicBio: '',
  sectionConsent: {
    acquiredSkills: true,
    completedTraining: true,
    qualifications: true,
    achievements: true,
    workExperience: true,
    personalGoals: true,
    certifications: true,
  },
  items: [],
  updatedAt: '',
};

const DEFAULT_HABIT_CHALLENGES_LIST: HabitChallenge[] = [
  {
    id: 'hab-sleep-reset',
    title: 'Consistent Screens-Off Sleep Window',
    titleMl: 'കൃത്യസമയത്ത് ഉറക്കം ക്രമീകരിക്കൽ',
    category: 'sleep',
    targetDays: 7,
    completedDates: [],
    active: true,
  },
  {
    id: 'hab-morning-hydrate',
    title: '10-Minute Morning Hydration & Stretch',
    titleMl: 'രാവിലെ 10 മിനിറ്റ് വ്യായാമവും വെള്ളവും',
    category: 'hydration',
    targetDays: 7,
    completedDates: [],
    active: true,
  },
  {
    id: 'hab-evening-walk',
    title: 'Evening Walk During Peak Craving Hour',
    titleMl: 'വൈകുന്നേരത്തെ നടത്തവും മനഃശാന്തിയും',
    category: 'movement',
    targetDays: 14,
    completedDates: [],
    active: true,
  },
];

const LEGACY_SEEDED_NOTIF_IDS = new Set(['notif-vimukthi', 'notif-games-upgrade', 'notif-learn-sim']);

function readInitialProfileAndScope(): { profile: UserProfile | null; scope: string } {
  purgeLegacyUnscopedWorkspaceKeys();
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    const profile: UserProfile | null = stored ? JSON.parse(stored) : null;
    return { profile, scope: getVaultScope(profile) };
  } catch {
    return { profile: null, scope: 'guest' };
  }
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const initialSessionRef = useRef<{ profile: UserProfile | null; scope: string } | null>(null);
  if (!initialSessionRef.current) {
    initialSessionRef.current = readInitialProfileAndScope();
  }
  const initialScope = initialSessionRef.current.scope;
  const activeScopeRef = useRef<string>(initialScope);
  const [vaultScope, setVaultScope] = useState<string>(initialScope);

  const readStorageItem = (scope: string, key: string): string | null => {
    if (SCOPED_KEY_SET.has(key)) {
      return readScopedString(scope, key);
    }
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const writeStorageItem = (key: string, value: string) => {
    if (SCOPED_KEY_SET.has(key)) {
      writeScopedString(activeScopeRef.current, key, value);
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore storage failure
    }
  };

  const removeStorageItem = (key: string) => {
    if (SCOPED_KEY_SET.has(key)) {
      removeScopedKey(activeScopeRef.current, key);
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  };

  // Safe initializers from active account/guest vault
  const [currentRole, setCurrentRoleState] = useState<UserRole | null>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.ROLE);
      return (stored as UserRole) || null;
    } catch {
      return null;
    }
  });

  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.LANG);
      return (stored as Language) || 'en';
    } catch {
      return 'en';
    }
  });

  const [themeMode, setThemeModeState] = useState<'day' | 'night'>(() => {
    try {
      const saved = readStorageItem(initialScope, STORAGE_KEYS.THEME_MODE);
      return saved === 'night' ? 'night' : 'day';
    } catch {
      return 'day';
    }
  });

  useEffect(() => {
    try {
      document.documentElement.classList.remove('monochrome-mode');
      document.documentElement.classList.toggle('dark-mode', themeMode === 'night');
      writeStorageItem(STORAGE_KEYS.THEME_MODE, themeMode);
    } catch {
      // ignore storage failure
    }
  }, [themeMode]);

  const setThemeMode = (mode: 'day' | 'night') => {
    setThemeModeState(mode);
  };

  const toggleThemeMode = () => {
    setThemeModeState(prev => (prev === 'day' ? 'night' : 'day'));
  };

  // Role 01 State
  const [personalOnboarding, setPersonalOnboarding] = useState<PersonalOnboarding | null>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.ONBOARDING_P1);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.LOGS_P1);
      if (!stored) return [];
      const parsed: DailyLog[] = JSON.parse(stored);
      // Clean out any legacy mock/fake seed logs
      return parsed.filter(l => !l.id.startsWith('seed-'));
    } catch {
      return [];
    }
  });

  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.EVENTS_P1);
      if (!stored) return [];
      const parsed: CalendarEvent[] = JSON.parse(stored);
      // Clean out any legacy mock/fake seed events
      return parsed.filter(e => !e.id.startsWith('seed-'));
    } catch {
      return [];
    }
  });

  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.GOALS_P1);
      if (!stored) return [];
      const parsed: Goal[] = JSON.parse(stored);
      // Clean out any legacy mock/fake seed goals
      return parsed.filter(g => !g.id.startsWith('seed-'));
    } catch {
      return [];
    }
  });

  const [gameStats, setGameStats] = useState<Record<string, { highScores: number; sessionsPlayed: number; lastPlayed?: string }>>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.GAME_STATS);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [toolCompletions, setToolCompletions] = useState<Record<string, { completedAt: string; responses: Record<number, string> }>>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.TOOL_COMPLETIONS);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [substanceConcerns, setSubstanceConcerns] = useState<SubstanceConcernRecord[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.SUBSTANCE_CONCERNS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [personalizedSupportPlan, setPersonalizedSupportPlan] = useState<PersonalizedSupportPlanRecord | null>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.PERSONALIZED_SUPPORT_PLAN);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [recoveryReports, setRecoveryReports] = useState<RecoveryReportRecord[]>(() =>
    readScopedJson<RecoveryReportRecord[]>(initialScope, STORAGE_KEYS.RECOVERY_REPORTS, [])
  );

  const [opportunityProfile, setOpportunityProfile] = useState<OpportunityProfile | null>(() =>
    readScopedJson<OpportunityProfile | null>(initialScope, STORAGE_KEYS.OPPORTUNITY_PROFILE, null)
  );

  const [savedOpportunities, setSavedOpportunities] = useState<SavedOpportunityRecord[]>(() =>
    readScopedJson<SavedOpportunityRecord[]>(initialScope, STORAGE_KEYS.SAVED_OPPORTUNITIES, [])
  );

  const [opportunityApplications, setOpportunityApplications] = useState<OpportunityApplication[]>(() =>
    readScopedJson<OpportunityApplication[]>(initialScope, STORAGE_KEYS.OPPORTUNITY_APPLICATIONS, [])
  );

  const [recoveryPassport, setRecoveryPassport] = useState<RecoveryPassport>(() =>
    readScopedJson<RecoveryPassport>(initialScope, STORAGE_KEYS.RECOVERY_PASSPORT, DEFAULT_RECOVERY_PASSPORT)
  );

  const [personalDevProgress, setPersonalDevProgress] = useState<Record<string, PersonalDevTrackProgress>>(() =>
    readScopedJson<Record<string, PersonalDevTrackProgress>>(initialScope, STORAGE_KEYS.PERSONAL_DEV_PROGRESS, {})
  );

  // Role 02 Supporter State
  const [supporterOnboarding, setSupporterOnboarding] = useState<SupporterOnboarding | null>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.ONBOARDING_P2);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [supportPlans, setSupportPlans] = useState<SupportPlan[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.SUPPORT_PLANS);
      if (!stored) return [];
      const parsed: SupportPlan[] = JSON.parse(stored);
      return parsed.filter(p => !p.id.startsWith('sp-seed-') && !p.id.startsWith('demo-'));
    } catch {
      return [];
    }
  });

  const [supporterEvents, setSupporterEvents] = useState<SupporterCalendarEvent[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.SUPPORTER_EVENTS);
      if (!stored) return [];
      const parsed: SupporterCalendarEvent[] = JSON.parse(stored);
      return parsed.filter(e => !e.id.startsWith('se-') && !e.id.startsWith('demo-'));
    } catch {
      return [];
    }
  });

  const [supporterReflections, setSupporterReflections] = useState<SupporterReflection[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.SUPPORTER_REFLECTIONS);
      if (!stored) return [];
      const parsed: SupporterReflection[] = JSON.parse(stored);
      return parsed.filter(r => !r.id.startsWith('sref-') && !r.id.startsWith('demo-'));
    } catch {
      return [];
    }
  });

  const [savedConversationPlans, setSavedConversationPlans] = useState<ConversationPlan[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.SAVED_CONVERSATIONS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [completedEducationModuleIds, setCompletedEducationModuleIds] = useState<string[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.COMPLETED_EDU_MODULES);
      return stored ? JSON.parse(stored) : ['edu-dependency-science'];
    } catch {
      return ['edu-dependency-science'];
    }
  });

  // Role 03 Learner State (Strictly isolated, zero fake data)
  const [learnerOnboarding, setLearnerOnboarding] = useState<LearnerOnboarding | null>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.ONBOARDING_P3);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.COMPLETED_LESSONS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [bookmarkedLessonIds, setBookmarkedLessonIds] = useState<string[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.BOOKMARKED_LESSONS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [savedScenarioAttempts, setSavedScenarioAttempts] = useState<Record<string, { choiceIndex: number; completedAt: string }>>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.SCENARIO_ATTEMPTS);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [learnerEvents, setLearnerEvents] = useState<LearnerCalendarEvent[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.LEARNER_EVENTS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [learnerJournalEntries, setLearnerJournalEntries] = useState<LearnerJournalEntry[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.LEARNER_JOURNAL);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.QUIZ_ATTEMPTS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [learnerStudyDates, setLearnerStudyDates] = useState<string[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.LEARNER_STUDY_DATES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Role 04 Community Builder State (Strictly isolated, starts clean)
  const [communityOnboarding, setCommunityOnboarding] = useState<CommunityOnboarding | null>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.ONBOARDING_P4);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [communityOrg, setCommunityOrg] = useState<CommunityOrganisation | null>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.ORG_P4);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [communityMembers, setCommunityMembers] = useState<CommunityMember[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.MEMBERS_P4);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [communityProgrammes, setCommunityProgrammes] = useState<CommunityProgramme[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.PROGRAMMES_P4);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.EVENTS_P4);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [communityTasks, setCommunityTasks] = useState<CommunityTask[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.TASKS_P4);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [communityCampaigns, setCommunityCampaigns] = useState<CommunityCampaign[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.CAMPAIGNS_P4);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [communityFeedback, setCommunityFeedback] = useState<CommunityFeedbackEntry[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.FEEDBACK_P4);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [bookmarkedResourceIds, setBookmarkedResourceIds] = useState<string[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.BOOKMARKED_RESOURCES_P4);
      return stored ? JSON.parse(stored) : ['res-school-module'];
    } catch {
      return ['res-school-module'];
    }
  });

  // Shared Centers
  const [savedCenterIds, setSavedCenterIds] = useState<string[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.SAVED_CENTERS);
      return stored ? JSON.parse(stored) : ['vimukthi-central'];
    } catch {
      return ['vimukthi-central'];
    }
  });

  // Care Relay records (stored locally, never transmitted automatically)
  const [careRelays, setCareRelays] = useState<CareRelayRecord[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.CARE_RELAYS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Opt-in single-item sharing with Supporter Mode (Role 02)
  const [sharedSupporterItems, setSharedSupporterItems] = useState<SharedSupporterItem[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.SHARED_SUPPORTER_ITEMS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // ==========================================
  // CLEAR PATH AI: USER PROFILE, PORTAL & SERVER AUTH
  // ==========================================
  const [portalMode, setPortalMode] = useState<PortalMode>('none');
  const [serverAuthToken, setServerAuthTokenState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.SERVER_AUTH_TOKEN);
    } catch {
      return null;
    }
  });
  const [serverAuthUser, setServerAuthUserState] = useState<ServerAuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SERVER_AUTH_USER);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [clientAssignments, setClientAssignments] = useState<TherapistAssignmentRecord[]>([]);
  const [clientAppointments, setClientAppointments] = useState<AppointmentNoteClient[]>([]);
  const [carePlanProposals, setCarePlanProposals] = useState<CarePlanProposalClient[]>([]);
  const [realtimeStatus, setRealtimeStatus] = useState<'connecting' | 'connected' | 'offline'>('offline');
  const [realtimeTick, setRealtimeTick] = useState(0);

  const setServerSession = (token: string, user: ServerAuthUser) => {
    setServerAuthTokenState(token);
    setServerAuthUserState(user);
    try {
      localStorage.setItem(STORAGE_KEYS.SERVER_AUTH_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.SERVER_AUTH_USER, JSON.stringify(user));
    } catch {
      // ignore storage quota errors
    }
  };

  const clearServerSession = () => {
    const token = serverAuthToken;
    setServerAuthTokenState(null);
    setServerAuthUserState(null);
    setClientAssignments([]);
    setClientAppointments([]);
    setCarePlanProposals([]);
    setRealtimeStatus('offline');
    setPortalMode('none');
    try {
      localStorage.removeItem(STORAGE_KEYS.SERVER_AUTH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.SERVER_AUTH_USER);
    } catch {
      // ignore
    }
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
  };

  const role1HydratedUserRef = useRef<string | null>(null);
  const role1SyncTimerRef = useRef<number | null>(null);

  const refreshClientAssignments = async () => {
    if (!serverAuthToken || serverAuthUser?.role !== 'user') {
      setClientAssignments([]);
      setClientAppointments([]);
      return;
    }
    try {
      const [careRes, planRes, role1Res] = await Promise.all([
        fetch('/api/care/workspace', {
          headers: { Authorization: `Bearer ${serverAuthToken}` },
        }),
        fetch('/api/support-plan', {
          headers: { Authorization: `Bearer ${serverAuthToken}` },
        }),
        fetch('/api/role1/state', {
          headers: { Authorization: `Bearer ${serverAuthToken}` },
        }),
      ]);
      if (careRes.ok) {
        const data = await careRes.json();
        setClientAssignments(Array.isArray(data.assignments) ? data.assignments : []);
        setClientAppointments(Array.isArray(data.appointmentNotes) ? data.appointmentNotes : []);
        setCarePlanProposals(Array.isArray(data.carePlanProposals) ? data.carePlanProposals : []);
        if (Array.isArray(data.substanceConcerns) && data.substanceConcerns.length > 0) {
          setSubstanceConcerns(data.substanceConcerns);
          writeStorageItem(STORAGE_KEYS.SUBSTANCE_CONCERNS, JSON.stringify(data.substanceConcerns));
        }
      }
      if (planRes.ok) {
        const planData = await planRes.json();
        if (planData.plan) {
          setPersonalizedSupportPlan(planData.plan);
          writeStorageItem(STORAGE_KEYS.PERSONALIZED_SUPPORT_PLAN, JSON.stringify(planData.plan));
        }
      }
      if (role1Res.ok) {
        const r1 = await role1Res.json();

        // Merge Daily Logs (preserve clinician review notes from server)
        if (Array.isArray(r1.dailyLogs)) {
          setDailyLogs(prev => {
            const map = new Map<string, DailyLog>();
            prev.forEach(item => map.set(item.id, item));
            (r1.dailyLogs as DailyLog[]).forEach(srvItem => {
              const local = map.get(srvItem.id);
              map.set(
                srvItem.id,
                local
                  ? {
                      ...local,
                      clinicianReviewNote: srvItem.clinicianReviewNote ?? local.clinicianReviewNote,
                      reviewedByTherapistName:
                        srvItem.reviewedByTherapistName ?? local.reviewedByTherapistName,
                      reviewedAt: srvItem.reviewedAt ?? local.reviewedAt,
                    }
                  : srvItem
              );
            });
            const merged = Array.from(map.values()).sort((a, b) =>
              b.timestamp.localeCompare(a.timestamp)
            );
            writeStorageItem(STORAGE_KEYS.LOGS_P1, JSON.stringify(merged));
            return merged;
          });
        }

        // Merge Goals (prefer newer updatedAt so therapist edits & deletions reflect cleanly)
        if (Array.isArray(r1.goals)) {
          setGoals(prev => {
            const map = new Map<string, Goal>();
            prev.forEach(g => map.set(g.id, g));
            (r1.goals as Goal[]).forEach(srvGoal => {
              const local = map.get(srvGoal.id);
              const srvTime = srvGoal.updatedAt || srvGoal.createdAt || '';
              const locTime = local?.updatedAt || local?.createdAt || '';
              if (!local || srvTime >= locTime) {
                map.set(srvGoal.id, srvGoal);
              }
            });
            const merged = Array.from(map.values()).sort((a, b) =>
              b.createdAt.localeCompare(a.createdAt)
            );
            writeStorageItem(STORAGE_KEYS.GOALS_P1, JSON.stringify(merged));
            return merged;
          });
        }

        // Merge Calendar Events
        if (Array.isArray(r1.calendarEvents)) {
          setCalendarEvents(prev => {
            const map = new Map<string, CalendarEvent>();
            prev.forEach(e => map.set(e.id, e));
            (r1.calendarEvents as CalendarEvent[]).forEach(srvEvt => {
              const local = map.get(srvEvt.id);
              const srvTime = srvEvt.updatedAt || srvEvt.date || '';
              const locTime = local?.updatedAt || local?.date || '';
              if (!local || srvTime >= locTime) {
                map.set(srvEvt.id, srvEvt);
              }
            });
            const merged = Array.from(map.values()).sort((a, b) =>
              a.date.localeCompare(b.date)
            );
            writeStorageItem(STORAGE_KEYS.EVENTS_P1, JSON.stringify(merged));
            return merged;
          });
        }

        // Merge Early Assessments
        if (Array.isArray(r1.earlyAssessments)) {
          setEarlyAssessments(prev => {
            const map = new Map<string, EarlySupportAssessment>();
            prev.forEach(a => map.set(a.id, a));
            (r1.earlyAssessments as EarlySupportAssessment[]).forEach(srvAss => {
              map.set(srvAss.id, srvAss);
            });
            const merged = Array.from(map.values());
            writeStorageItem(STORAGE_KEYS.EARLY_ASSESSMENTS, JSON.stringify(merged));
            return merged;
          });
        }

        if (r1.personalOnboarding && typeof r1.personalOnboarding === 'object') {
          setPersonalOnboarding(prev => prev || (r1.personalOnboarding as PersonalOnboarding));
          if (!personalOnboarding) {
            writeStorageItem(STORAGE_KEYS.ONBOARDING_P1, JSON.stringify(r1.personalOnboarding));
          }
        }

        if (Array.isArray(r1.recoveryReports)) {
          setRecoveryReports(prev => {
            const map = new Map<string, RecoveryReportRecord>();
            prev.forEach(r => map.set(r.id, r));
            (r1.recoveryReports as RecoveryReportRecord[]).forEach(r => map.set(r.id, r));
            const merged = Array.from(map.values()).sort((a, b) =>
              b.generatedAt.localeCompare(a.generatedAt)
            );
            writeStorageItem(STORAGE_KEYS.RECOVERY_REPORTS, JSON.stringify(merged));
            return merged;
          });
        }

        if (r1.opportunityProfile && typeof r1.opportunityProfile === 'object') {
          setOpportunityProfile(prev => {
            const srv = r1.opportunityProfile as OpportunityProfile;
            if (!prev || (srv.updatedAt || '') >= (prev.updatedAt || '')) {
              writeStorageItem(STORAGE_KEYS.OPPORTUNITY_PROFILE, JSON.stringify(srv));
              return srv;
            }
            return prev;
          });
        }

        if (Array.isArray(r1.savedOpportunities)) {
          setSavedOpportunities(prev => {
            const map = new Map<string, SavedOpportunityRecord>();
            prev.forEach(s => map.set(s.opportunityId, s));
            (r1.savedOpportunities as SavedOpportunityRecord[]).forEach(s => map.set(s.opportunityId, s));
            const merged = Array.from(map.values());
            writeStorageItem(STORAGE_KEYS.SAVED_OPPORTUNITIES, JSON.stringify(merged));
            return merged;
          });
        }

        if (Array.isArray(r1.opportunityApplications)) {
          setOpportunityApplications(prev => {
            const map = new Map<string, OpportunityApplication>();
            prev.forEach(a => map.set(a.id, a));
            (r1.opportunityApplications as OpportunityApplication[]).forEach(srv => {
              const loc = map.get(srv.id);
              if (!loc || (srv.updatedAt || '') >= (loc.updatedAt || '')) map.set(srv.id, srv);
            });
            const merged = Array.from(map.values()).sort((a, b) =>
              (b.updatedAt || '').localeCompare(a.updatedAt || '')
            );
            writeStorageItem(STORAGE_KEYS.OPPORTUNITY_APPLICATIONS, JSON.stringify(merged));
            return merged;
          });
        }

        if (r1.recoveryPassport && typeof r1.recoveryPassport === 'object') {
          setRecoveryPassport(prev => {
            const srv = r1.recoveryPassport as RecoveryPassport;
            if (!prev.updatedAt || (srv.updatedAt || '') >= prev.updatedAt) {
              writeStorageItem(STORAGE_KEYS.RECOVERY_PASSPORT, JSON.stringify(srv));
              return srv;
            }
            return prev;
          });
        }

        if (Array.isArray(r1.personalDevProgress)) {
          setPersonalDevProgress(prev => {
            const next = { ...prev };
            (r1.personalDevProgress as PersonalDevTrackProgress[]).forEach(srv => {
              const loc = next[srv.trackId];
              if (!loc || (srv.updatedAt || '') >= (loc.updatedAt || '')) {
                next[srv.trackId] = srv;
              }
            });
            writeStorageItem(STORAGE_KEYS.PERSONAL_DEV_PROGRESS, JSON.stringify(next));
            return next;
          });
        }

        role1HydratedUserRef.current = serverAuthUser.id;
      }
    } catch {
      // ignore offline
    }
  };

  const saveSubstanceConcerns = (concerns: SubstanceConcernRecord[]) => {
    setSubstanceConcerns(concerns);
    writeStorageItem(STORAGE_KEYS.SUBSTANCE_CONCERNS, JSON.stringify(concerns));
    if (serverAuthToken && serverAuthUser?.role === 'user' && concerns.length > 0) {
      fetch('/api/substances/concerns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify({ concerns }),
      }).catch(() => {});
    }
  };

  const upsertSubstanceConcern = (concern: SubstanceConcernRecord) => {
    setSubstanceConcerns(prev => {
      const exists = prev.some(c => c.id === concern.id);
      const next = exists ? prev.map(c => (c.id === concern.id ? concern : c)) : [concern, ...prev];
      writeStorageItem(STORAGE_KEYS.SUBSTANCE_CONCERNS, JSON.stringify(next));
      if (serverAuthToken && serverAuthUser?.role === 'user') {
        fetch('/api/substances/concerns', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${serverAuthToken}`,
          },
          body: JSON.stringify({ concerns: [concern] }),
        }).catch(() => {});
      }
      return next;
    });
  };

  const removeSubstanceConcern = (id: string) => {
    setSubstanceConcerns(prev => {
      const next = prev.filter(c => c.id !== id);
      writeStorageItem(STORAGE_KEYS.SUBSTANCE_CONCERNS, JSON.stringify(next));
      return next;
    });
    if (serverAuthToken && serverAuthUser?.role === 'user') {
      fetch(`/api/substances/concerns/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${serverAuthToken}` },
      }).catch(() => {});
    }
  };

  const savePersonalizedSupportPlan = (plan: PersonalizedSupportPlanRecord) => {
    setPersonalizedSupportPlan(plan);
    writeStorageItem(STORAGE_KEYS.PERSONALIZED_SUPPORT_PLAN, JSON.stringify(plan));
    if (serverAuthToken && serverAuthUser?.role === 'user') {
      fetch('/api/support-plan', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify(plan),
      }).catch(() => {});
    }
  };

  const refreshClientAssignmentsRef = useRef(refreshClientAssignments);
  refreshClientAssignmentsRef.current = refreshClientAssignments;

  useEffect(() => {
    if (serverAuthToken && serverAuthUser?.role === 'user') {
      role1HydratedUserRef.current = null;
      refreshClientAssignments();
    } else {
      role1HydratedUserRef.current = null;
      setClientAssignments([]);
      setClientAppointments([]);
      setCarePlanProposals([]);
    }
  }, [serverAuthToken, serverAuthUser?.id, serverAuthUser?.role]);

  const [userProfile, setUserProfileState] = useState<UserProfile | null>(
    () => initialSessionRef.current?.profile ?? null
  );

  const syncedLocalProfileRef = useRef<string | null>(null);

  // Ensure any locally signed-in Role 1 profile automatically synchronizes with backend DB so real users appear in real time
  useEffect(() => {
    if (!userProfile || serverAuthToken || portalMode !== 'none') return;
    const syncKey = `${userProfile.id}:${userProfile.username}`;
    if (syncedLocalProfileRef.current === syncKey) return;
    syncedLocalProfileRef.current = syncKey;

    fetch('/api/auth/sync-local-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: userProfile.username,
        name: userProfile.name,
        profileId: userProfile.id,
        ageRange: userProfile.ageRange,
      }),
    })
      .then(async res => {
        if (!res.ok) return null;
        return res.json();
      })
      .then(data => {
        if (data?.token && data?.user) {
          setServerSession(data.token, data.user);
        }
      })
      .catch(() => {
        syncedLocalProfileRef.current = null;
      });
  }, [userProfile, serverAuthToken, portalMode]);

  // Real-Time WebSocket (/ws) + Server-Sent Events (SSE) Synchronization
  useEffect(() => {
    if (!serverAuthToken) {
      setRealtimeStatus('offline');
      return;
    }

    setRealtimeStatus('connecting');
    let closedByCleanup = false;
    let ws: WebSocket | null = null;
    let wsReconnectTimer: number | null = null;
    let wsPingTimer: number | null = null;

    const handleRealtimePush = () => {
      setRealtimeTick(t => t + 1);
      if (serverAuthUser?.role === 'user') {
        refreshClientAssignmentsRef.current();
      }
    };

    const connectWebSocket = () => {
      if (closedByCleanup || typeof WebSocket === 'undefined') return;
      try {
        const wsProto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(`${wsProto}//${window.location.host}/ws?token=${encodeURIComponent(serverAuthToken)}`);
        ws.onopen = () => {
          setRealtimeStatus('connected');
          if (wsPingTimer) window.clearInterval(wsPingTimer);
          wsPingTimer = window.setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 25000);
        };
        ws.onmessage = msg => {
          try {
            const parsed = JSON.parse(String(msg.data || '{}'));
            if (parsed?.event === 'pong' || parsed?.event === 'ws:connected') return;
            handleRealtimePush();
          } catch {
            handleRealtimePush();
          }
        };
        ws.onerror = () => {
          if (!closedByCleanup) setRealtimeStatus('connecting');
        };
        ws.onclose = () => {
          if (wsPingTimer) {
            window.clearInterval(wsPingTimer);
            wsPingTimer = null;
          }
          if (!closedByCleanup) {
            wsReconnectTimer = window.setTimeout(connectWebSocket, 4000);
          }
        };
      } catch {
        // SSE remains active fallback
      }
    };

    connectWebSocket();

    const eventNames = [
      'connection:updated',
      'message:created',
      'message:read',
      'report:shared',
      'report:revoked',
      'appointment:updated',
      'assignment:updated',
      'goal:updated',
      'plan_proposal:updated',
      'support_plan:updated',
      'role1_state:updated',
      'availability:updated',
      'programme:updated',
      'directory:updated',
      'user:registered',
      'patient:assigned',
      'notification:new',
    ];

    const es =
      typeof EventSource !== 'undefined'
        ? new EventSource(`/api/realtime/stream?token=${encodeURIComponent(serverAuthToken)}`)
        : null;

    if (es) {
      es.onopen = () => setRealtimeStatus('connected');
      es.onerror = () => setRealtimeStatus('connecting');
      eventNames.forEach(ev => es.addEventListener(ev, handleRealtimePush));
    }

    return () => {
      closedByCleanup = true;
      if (wsReconnectTimer) window.clearTimeout(wsReconnectTimer);
      if (wsPingTimer) window.clearInterval(wsPingTimer);
      if (ws) {
        try {
          ws.close();
        } catch {
          // ignore
        }
      }
      if (es) {
        eventNames.forEach(ev => es.removeEventListener(ev, handleRealtimePush));
        es.close();
      }
      setRealtimeStatus('offline');
    };
  }, [serverAuthToken, serverAuthUser?.id, serverAuthUser?.role]);

  // Resilient low-cost sync heartbeat when SSE is reconnecting/offline or for live chat rooms
  useEffect(() => {
    if (!serverAuthToken) return;
    if (realtimeStatus === 'connected') return;
    const timer = window.setInterval(() => {
      setRealtimeTick(t => t + 1);
      if (serverAuthUser?.role === 'user') {
        refreshClientAssignmentsRef.current();
      }
    }, 4000);
    return () => window.clearInterval(timer);
  }, [serverAuthToken, serverAuthUser?.role, realtimeStatus]);

  const mapReasonToRole = (reason?: UserProfile['primaryReason']): UserRole => {
    switch (reason) {
      case 'supporter':
        return 'supporter';
      case 'learner':
        return 'learner';
      case 'community':
        return 'community';
      case 'recovery':
      default:
        return 'personal';
    }
  };

  // ==========================================
  // ROLE 01: MOTIVATION BAR
  // ==========================================
  const [motivationAnchor, setMotivationAnchorState] = useState<MotivationAnchor>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.MOTIVATION_ANCHOR);
      return stored
        ? JSON.parse(stored)
        : {
            personalWhy: 'For my clarity of mind, my loved ones, and rebuilding a peaceful, steady life.',
            favoriteQuotes: [],
          };
    } catch {
      return {
        personalWhy: 'For my clarity of mind, my loved ones, and rebuilding a peaceful, steady life.',
        favoriteQuotes: [],
      };
    }
  });

  const saveMotivationWhy = (why: string) => {
    setMotivationAnchorState(prev => {
      const updated = { ...prev, personalWhy: why };
      writeStorageItem(STORAGE_KEYS.MOTIVATION_ANCHOR, JSON.stringify(updated));
      return updated;
    });
  };

  // ==========================================
  // CLEARPATH AI CONNECTED ECOSYSTEM STATES
  // ==========================================
  const [triggerEntries, setTriggerEntries] = useState<TriggerJournalEntry[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.TRIGGER_ENTRIES);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addTriggerEntry = (entry: Omit<TriggerJournalEntry, 'id' | 'timestamp'>): TriggerJournalEntry => {
    const newEntry: TriggerJournalEntry = {
      ...entry,
      id: 'trig-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      timestamp: new Date().toISOString(),
    };
    setTriggerEntries(prev => {
      const updated = [newEntry, ...prev];
      writeStorageItem(STORAGE_KEYS.TRIGGER_ENTRIES, JSON.stringify(updated));
      return updated;
    });
    return newEntry;
  };

  const deleteTriggerEntry = (id: string) => {
    setTriggerEntries(prev => {
      const updated = prev.filter(t => t.id !== id);
      writeStorageItem(STORAGE_KEYS.TRIGGER_ENTRIES, JSON.stringify(updated));
      return updated;
    });
  };

  const DEFAULT_HABIT_CHALLENGES = DEFAULT_HABIT_CHALLENGES_LIST;

  const [habitChallenges, setHabitChallenges] = useState<HabitChallenge[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.HABIT_CHALLENGES);
      return stored ? JSON.parse(stored) : DEFAULT_HABIT_CHALLENGES;
    } catch {
      return DEFAULT_HABIT_CHALLENGES;
    }
  });

  const toggleHabitChallengeDay = (challengeId: string, dateStr?: string) => {
    const day = dateStr || new Date().toISOString().split('T')[0];
    setHabitChallenges(prev => {
      const updated = prev.map(ch => {
        if (ch.id !== challengeId) return ch;
        const exists = ch.completedDates.includes(day);
        return {
          ...ch,
          completedDates: exists
            ? ch.completedDates.filter(d => d !== day)
            : [...ch.completedDates, day],
        };
      });
      writeStorageItem(STORAGE_KEYS.HABIT_CHALLENGES, JSON.stringify(updated));
      return updated;
    });
  };

  const addHabitChallenge = (title: string, category: HabitChallenge['category'], targetDays: number) => {
    const newCh: HabitChallenge = {
      id: 'hab-' + Date.now(),
      title,
      titleMl: title,
      category,
      targetDays,
      completedDates: [],
      active: true,
    };
    setHabitChallenges(prev => {
      const updated = [newCh, ...prev];
      writeStorageItem(STORAGE_KEYS.HABIT_CHALLENGES, JSON.stringify(updated));
      return updated;
    });
  };

  const [earlyAssessments, setEarlyAssessments] = useState<EarlySupportAssessment[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.EARLY_ASSESSMENTS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Auto-sync Role 01 dailyLogs, goals, calendarEvents, and earlyAssessments to backend for logged-in users
  useEffect(() => {
    if (!serverAuthToken || serverAuthUser?.role !== 'user') return;
    if (role1HydratedUserRef.current !== serverAuthUser.id) return;

    if (role1SyncTimerRef.current) {
      window.clearTimeout(role1SyncTimerRef.current);
    }
    role1SyncTimerRef.current = window.setTimeout(() => {
      fetch('/api/role1/state', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify({
          dailyLogs,
          goals,
          calendarEvents,
          earlyAssessments,
          personalOnboarding,
          recoveryReports,
          opportunityProfile,
          savedOpportunities,
          opportunityApplications,
          recoveryPassport,
          personalDevProgress: Object.values(personalDevProgress),
        }),
      }).catch(() => {});
    }, 350);

    return () => {
      if (role1SyncTimerRef.current) {
        window.clearTimeout(role1SyncTimerRef.current);
      }
    };
  }, [
    serverAuthToken,
    serverAuthUser?.id,
    serverAuthUser?.role,
    dailyLogs,
    goals,
    calendarEvents,
    earlyAssessments,
    personalOnboarding,
    recoveryReports,
    opportunityProfile,
    savedOpportunities,
    opportunityApplications,
    recoveryPassport,
    personalDevProgress,
  ]);

  const [timelineEvents, setTimelineEvents] = useState<AchievementTimelineItem[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.TIMELINE_EVENTS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addTimelineEvent = (evt: Omit<AchievementTimelineItem, 'id' | 'date'>) => {
    const newEvt: AchievementTimelineItem = {
      ...evt,
      id: 'tl-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
      date: new Date().toISOString().split('T')[0],
    };
    setTimelineEvents(prev => {
      const updated = [newEvt, ...prev].slice(0, 40);
      writeStorageItem(STORAGE_KEYS.TIMELINE_EVENTS, JSON.stringify(updated));
      return updated;
    });
  };

  const [dismissedIntroRoles, setDismissedIntroRoles] = useState<UserRole[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.DISMISSED_INTROS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const dismissRoleIntro = (role: UserRole) => {
    setDismissedIntroRoles(prev => {
      if (prev.includes(role)) return prev;
      const updated = [...prev, role];
      writeStorageItem(STORAGE_KEYS.DISMISSED_INTROS, JSON.stringify(updated));
      return updated;
    });
  };

  const saveEarlyAssessment = (assessment: Omit<EarlySupportAssessment, 'id' | 'date'>): EarlySupportAssessment => {
    const newAss: EarlySupportAssessment = {
      ...assessment,
      id: 'ea-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
    };
    setEarlyAssessments(prev => {
      const updated = [newAss, ...prev];
      writeStorageItem(STORAGE_KEYS.EARLY_ASSESSMENTS, JSON.stringify(updated));
      return updated;
    });
    addTimelineEvent({
      role: 'personal',
      title: assessment.mode === 'deep' ? 'Deep-Dive Assessment Completed' : 'Early Support Check Completed',
      detail: assessment.recommendedPathway,
      category: 'assessment',
    });
    addNotification({
      title: assessment.mode === 'deep' ? 'Deep-Dive Support Plan Ready' : 'Support Pathway Updated',
      titleMl: 'നിങ്ങളുടെ വ്യക്തിഗത നിർദ്ദേശങ്ങൾ തയ്യാർ',
      message: assessment.recommendedPathway,
      messageMl: assessment.recommendedPathway,
      category: 'personal',
      targetRole: 'personal',
      deepLinkTab: 'navigator',
      priority: 'normal',
    });
    return newAss;
  };

  // REAL NOTIFICATIONS ONLY (Zero fake default notifications)
  const [notifications, setNotifications] = useState<UnifiedNotification[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.NOTIFICATIONS);
      if (!stored) return [];
      const parsed: UnifiedNotification[] = JSON.parse(stored);
      return parsed.filter(n => !LEGACY_SEEDED_NOTIF_IDS.has(n.id));
    } catch {
      return [];
    }
  });

  const markNotificationRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => (n.id === id ? { ...n, read: true } : n));
      writeStorageItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
      return updated;
    });
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      writeStorageItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
      return updated;
    });
  };

  const clearViewedNotifications = () => {
    setNotifications(prev => {
      const updated = prev.filter(n => !n.read);
      writeStorageItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
      return updated;
    });
  };

  const addNotification = (notif: Omit<UnifiedNotification, 'id' | 'timestamp' | 'read'>) => {
    const newN: UnifiedNotification = {
      ...notif,
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).slice(2, 5),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications(prev => {
      const updated = [newN, ...prev].slice(0, 20);
      writeStorageItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
      return updated;
    });
  };

  const [consentPrefs, setConsentPrefs] = useState<ConsentPreferences>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.CONSENT_PREFS);
      return stored
        ? JSON.parse(stored)
        : {
            receiveCrossRoleAnnouncements: true,
            shareAnonymizedLearningGaps: false,
            allowOptionalActionBridges: true,
          };
    } catch {
      return {
        receiveCrossRoleAnnouncements: true,
        shareAnonymizedLearningGaps: false,
        allowOptionalActionBridges: true,
      };
    }
  });

  const updateConsentPrefs = (updates: Partial<ConsentPreferences>) => {
    setConsentPrefs(prev => {
      const updated = { ...prev, ...updates };
      writeStorageItem(STORAGE_KEYS.CONSENT_PREFS, JSON.stringify(updated));
      return updated;
    });
  };

  const [missions, setMissions] = useState<ClearPathMission[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.MISSIONS);
      return stored ? JSON.parse(stored) : INITIAL_CLEARPATH_MISSIONS;
    } catch {
      return INITIAL_CLEARPATH_MISSIONS;
    }
  });

  const toggleMissionStep = (missionId: string, stepIdx: number) => {
    let completedMissionTitle: string | null = null;
    setMissions(prev => {
      const updated = prev.map(m => {
        if (m.id !== missionId) return m;
        const exists = m.completedStepIndices.includes(stepIdx);
        const nextSteps = exists
          ? m.completedStepIndices.filter(i => i !== stepIdx)
          : [...m.completedStepIndices, stepIdx];
        if (!exists && nextSteps.length === m.steps.length) {
          completedMissionTitle = m.title;
        }
        return {
          ...m,
          completedStepIndices: nextSteps,
        };
      });
      writeStorageItem(STORAGE_KEYS.MISSIONS, JSON.stringify(updated));
      return updated;
    });
    if (completedMissionTitle) {
      addTimelineEvent({
        role: currentRole || 'personal',
        title: `Quest Completed: ${completedMissionTitle}`,
        detail: 'Science insight unlocked in Personal Action Quests',
        category: 'quest',
      });
      addNotification({
        title: `Quest Completed: ${completedMissionTitle}`,
        titleMl: `ക്വസ്റ്റ് പൂർത്തിയായി: ${completedMissionTitle}`,
        message: 'You unlocked a new neurobiology & prevention science brief.',
        messageMl: 'പുതിയ ശാസ്ത്രീയ അറിവ് അൺലോക്ക് ചെയ്തു.',
        category: currentRole || 'personal',
        targetRole: currentRole || 'personal',
        deepLinkTab: currentRole === 'learner' ? 'missions' : 'ecosystem',
        priority: 'normal',
      });
    }
  };

  const addMission = (mission: Omit<ClearPathMission, 'id' | 'completedStepIndices'>) => {
    const newM: ClearPathMission = {
      ...mission,
      id: 'mission-' + Date.now(),
      completedStepIndices: [],
    };
    setMissions(prev => {
      const updated = [newM, ...prev];
      writeStorageItem(STORAGE_KEYS.MISSIONS, JSON.stringify(updated));
      return updated;
    });
  };

  const [exchangeItems, setExchangeItems] = useState<InnovationExchangeItem[]>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.EXCHANGE_ITEMS);
      return stored ? JSON.parse(stored) : SEEDED_EXCHANGE_TEMPLATES;
    } catch {
      return SEEDED_EXCHANGE_TEMPLATES;
    }
  });

  const publishToExchange = (item: Omit<InnovationExchangeItem, 'id' | 'adaptedCount' | 'createdAt'>) => {
    const newItem: InnovationExchangeItem = {
      ...item,
      id: 'ex-' + Date.now(),
      adaptedCount: 0,
      createdAt: new Date().toISOString(),
    };
    setExchangeItems(prev => {
      const updated = [newItem, ...prev];
      writeStorageItem(STORAGE_KEYS.EXCHANGE_ITEMS, JSON.stringify(updated));
      return updated;
    });
  };

  const adaptExchangeTemplate = (id: string) => {
    const found = exchangeItems.find(item => item.id === id);
    if (!found) return;
    setExchangeItems(prev => {
      const updated = prev.map(it => (it.id === id ? { ...it, adaptedCount: it.adaptedCount + 1 } : it));
      writeStorageItem(STORAGE_KEYS.EXCHANGE_ITEMS, JSON.stringify(updated));
      return updated;
    });
    // Also convert into a draft community programme for real execution!
    addCommunityProgramme({
      title: `${found.title} (Adapted)`,
      category: 'community_education',
      objective: found.templateSummary,
      targetAudience: found.targetAudience,
      location: `${communityOrg?.district || found.district} Campus`,
      district: communityOrg?.district || found.district,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      coordinatorId: communityMembers[0]?.id || 'lead',
      teamMemberIds: [],
      requiredResources: found.steps.join(' · '),
      budget: 0,
      status: 'planning',
      expectedOutcomes: 'Interactive prevention participation & anonymous feedback capture',
    });
  };

  // ==========================================
  // ROLE 03: CUSTOM LEARNER PLAN & CERTIFICATE
  // ==========================================
  const [learnerCustomPlan, setLearnerCustomPlanState] = useState<LearnerCustomPlan | null>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.LEARNER_CUSTOM_PLAN);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const saveLearnerCustomPlan = (plan: LearnerCustomPlan) => {
    setLearnerCustomPlanState(plan);
    writeStorageItem(STORAGE_KEYS.LEARNER_CUSTOM_PLAN, JSON.stringify(plan));
  };

  const togglePlanDayCompleted = (dayNumber: number) => {
    setLearnerCustomPlanState(prev => {
      if (!prev) return null;
      const updatedDays = prev.days.map(d =>
        d.dayNumber === dayNumber
          ? { ...d, completed: !d.completed, completedAt: !d.completed ? new Date().toISOString() : undefined }
          : d
      );
      const updated = { ...prev, days: updatedDays };
      writeStorageItem(STORAGE_KEYS.LEARNER_CUSTOM_PLAN, JSON.stringify(updated));
      return updated;
    });
  };

  const [learnerCertificate, setLearnerCertificateState] = useState<LearnerCertificate | null>(() => {
    try {
      const stored = readStorageItem(initialScope, STORAGE_KEYS.LEARNER_CERTIFICATE);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const issueLearnerCertificate = (recipientName: string): LearnerCertificate => {
    const cert: LearnerCertificate = {
      id: `cert-${Date.now()}`,
      recipientName: recipientName.trim() || 'Verified Learner',
      courseTitle: 'Comprehensive Substance Prevention & Cognitive Neurobiology Mastery',
      completedDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      modulesCompletedCount: Math.max(completedLessonIds.length, 5),
      verificationCode: `CP-PHOENIX-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      scorePercentage: 96,
    };
    setLearnerCertificateState(cert);
    writeStorageItem(STORAGE_KEYS.LEARNER_CERTIFICATE, JSON.stringify(cert));
    addTimelineEvent({
      role: 'learner',
      title: 'Prevention Science Certificate Issued',
      detail: cert.verificationCode,
      category: 'learning',
    });
    addNotification({
      title: 'ClearPath AI Certificate Issued',
      titleMl: 'ക്ലിയർപാത്ത് എഐ സർട്ടിഫിക്കറ്റ് തയ്യാർ',
      message: `Issued for ${cert.recipientName} (${cert.verificationCode}).`,
      messageMl: `${cert.recipientName}-ന് സർട്ടിഫിക്കറ്റ് ലഭ്യമായി.`,
      category: 'learner',
      targetRole: 'learner',
      deepLinkTab: 'certificate',
      priority: 'normal',
    });
    return cert;
  };

  // ==========================================
  // GOOGLE MAPS PLATFORM QUOTA EVENT
  // ==========================================
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);
  useEffect(() => {
    const handleQuota = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // ==========================================
  // SHARED BRIEF PERSONALIZED AI CHAT & NAVIGATION
  // ==========================================
  const [aiChatSessions, setAiChatSessions] = useState<AiChatSession[]>(() =>
    readScopedJson<AiChatSession[]>(initialScope, STORAGE_KEYS.AI_CHAT_SESSIONS, [])
  );
  const [activeAiSessionId, setActiveAiSessionId] = useState<string | null>(() => {
    const existing = readScopedJson<AiChatSession[]>(initialScope, STORAGE_KEYS.AI_CHAT_SESSIONS, []);
    return existing[0]?.id || null;
  });
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [aiPendingContext, setAiPendingContext] = useState<AiChatContextRef | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const roleTabNavigatorRef = useRef<((role: UserRole, tab?: string) => void) | null>(null);

  const registerRoleTabNavigator = (fn: (role: UserRole, tab?: string) => void) => {
    roleTabNavigatorRef.current = fn;
  };

  const navigateToRoleTab = (role: UserRole, tab?: string) => {
    setIsAiDrawerOpen(false);
    if (roleTabNavigatorRef.current) {
      roleTabNavigatorRef.current(role, tab);
    } else {
      setRole(role);
    }
  };

  // Re-hydrate every workspace state cleanly from a specific account/guest vault
  const loadScopeIntoState = (targetScope: string, overrideRole?: UserRole | null) => {
    activeScopeRef.current = targetScope;
    setVaultScope(targetScope);

    const nextRole =
      overrideRole !== undefined
        ? overrideRole
        : (readScopedString(targetScope, STORAGE_KEYS.ROLE) as UserRole | null);
    setCurrentRoleState(nextRole || null);
    if (nextRole) {
      writeScopedString(targetScope, STORAGE_KEYS.ROLE, nextRole);
    } else if (overrideRole === null) {
      removeScopedKey(targetScope, STORAGE_KEYS.ROLE);
    }

    // Role 01
    setPersonalOnboarding(readScopedJson<PersonalOnboarding | null>(targetScope, STORAGE_KEYS.ONBOARDING_P1, null));
    setDailyLogs(
      readScopedJson<DailyLog[]>(targetScope, STORAGE_KEYS.LOGS_P1, []).filter(l => !l.id.startsWith('seed-'))
    );
    setCalendarEvents(
      readScopedJson<CalendarEvent[]>(targetScope, STORAGE_KEYS.EVENTS_P1, []).filter(e => !e.id.startsWith('seed-'))
    );
    setGoals(
      readScopedJson<Goal[]>(targetScope, STORAGE_KEYS.GOALS_P1, []).filter(g => !g.id.startsWith('seed-'))
    );
    setGameStats(readScopedJson(targetScope, STORAGE_KEYS.GAME_STATS, {}));
    setToolCompletions(readScopedJson(targetScope, STORAGE_KEYS.TOOL_COMPLETIONS, {}));
    setSubstanceConcerns(
      readScopedJson<SubstanceConcernRecord[]>(targetScope, STORAGE_KEYS.SUBSTANCE_CONCERNS, [])
    );
    setPersonalizedSupportPlan(
      readScopedJson<PersonalizedSupportPlanRecord | null>(
        targetScope,
        STORAGE_KEYS.PERSONALIZED_SUPPORT_PLAN,
        null
      )
    );
    setMotivationAnchorState(
      readScopedJson<MotivationAnchor>(targetScope, STORAGE_KEYS.MOTIVATION_ANCHOR, DEFAULT_MOTIVATION_ANCHOR)
    );
    setRecoveryReports(
      readScopedJson<RecoveryReportRecord[]>(targetScope, STORAGE_KEYS.RECOVERY_REPORTS, [])
    );
    setOpportunityProfile(
      readScopedJson<OpportunityProfile | null>(targetScope, STORAGE_KEYS.OPPORTUNITY_PROFILE, null)
    );
    setSavedOpportunities(
      readScopedJson<SavedOpportunityRecord[]>(targetScope, STORAGE_KEYS.SAVED_OPPORTUNITIES, [])
    );
    setOpportunityApplications(
      readScopedJson<OpportunityApplication[]>(targetScope, STORAGE_KEYS.OPPORTUNITY_APPLICATIONS, [])
    );
    setRecoveryPassport(
      readScopedJson<RecoveryPassport>(targetScope, STORAGE_KEYS.RECOVERY_PASSPORT, DEFAULT_RECOVERY_PASSPORT)
    );
    setPersonalDevProgress(
      readScopedJson<Record<string, PersonalDevTrackProgress>>(
        targetScope,
        STORAGE_KEYS.PERSONAL_DEV_PROGRESS,
        {}
      )
    );

    // Role 02
    setSupporterOnboarding(readScopedJson<SupporterOnboarding | null>(targetScope, STORAGE_KEYS.ONBOARDING_P2, null));
    setSupportPlans(
      readScopedJson<SupportPlan[]>(targetScope, STORAGE_KEYS.SUPPORT_PLANS, []).filter(
        p => !p.id.startsWith('sp-seed-') && !p.id.startsWith('demo-')
      )
    );
    setSupporterEvents(
      readScopedJson<SupporterCalendarEvent[]>(targetScope, STORAGE_KEYS.SUPPORTER_EVENTS, []).filter(
        e => !e.id.startsWith('se-') && !e.id.startsWith('demo-')
      )
    );
    setSupporterReflections(
      readScopedJson<SupporterReflection[]>(targetScope, STORAGE_KEYS.SUPPORTER_REFLECTIONS, []).filter(
        r => !r.id.startsWith('sref-') && !r.id.startsWith('demo-')
      )
    );
    setSavedConversationPlans(readScopedJson<ConversationPlan[]>(targetScope, STORAGE_KEYS.SAVED_CONVERSATIONS, []));
    setCompletedEducationModuleIds(
      readScopedJson<string[]>(targetScope, STORAGE_KEYS.COMPLETED_EDU_MODULES, ['edu-dependency-science'])
    );

    // Role 03
    setLearnerOnboarding(readScopedJson<LearnerOnboarding | null>(targetScope, STORAGE_KEYS.ONBOARDING_P3, null));
    setCompletedLessonIds(readScopedJson<string[]>(targetScope, STORAGE_KEYS.COMPLETED_LESSONS, []));
    setBookmarkedLessonIds(readScopedJson<string[]>(targetScope, STORAGE_KEYS.BOOKMARKED_LESSONS, []));
    setSavedScenarioAttempts(readScopedJson(targetScope, STORAGE_KEYS.SCENARIO_ATTEMPTS, {}));
    setLearnerEvents(readScopedJson<LearnerCalendarEvent[]>(targetScope, STORAGE_KEYS.LEARNER_EVENTS, []));
    setLearnerJournalEntries(readScopedJson<LearnerJournalEntry[]>(targetScope, STORAGE_KEYS.LEARNER_JOURNAL, []));
    setQuizAttempts(readScopedJson<QuizAttempt[]>(targetScope, STORAGE_KEYS.QUIZ_ATTEMPTS, []));
    setLearnerStudyDates(readScopedJson<string[]>(targetScope, STORAGE_KEYS.LEARNER_STUDY_DATES, []));
    setLearnerCustomPlanState(
      readScopedJson<LearnerCustomPlan | null>(targetScope, STORAGE_KEYS.LEARNER_CUSTOM_PLAN, null)
    );
    setLearnerCertificateState(
      readScopedJson<LearnerCertificate | null>(targetScope, STORAGE_KEYS.LEARNER_CERTIFICATE, null)
    );

    // Role 04
    setCommunityOnboarding(readScopedJson<CommunityOnboarding | null>(targetScope, STORAGE_KEYS.ONBOARDING_P4, null));
    setCommunityOrg(readScopedJson<CommunityOrganisation | null>(targetScope, STORAGE_KEYS.ORG_P4, null));
    setCommunityMembers(readScopedJson<CommunityMember[]>(targetScope, STORAGE_KEYS.MEMBERS_P4, []));
    setCommunityProgrammes(readScopedJson<CommunityProgramme[]>(targetScope, STORAGE_KEYS.PROGRAMMES_P4, []));
    setCommunityEvents(readScopedJson<CommunityEvent[]>(targetScope, STORAGE_KEYS.EVENTS_P4, []));
    setCommunityTasks(readScopedJson<CommunityTask[]>(targetScope, STORAGE_KEYS.TASKS_P4, []));
    setCommunityCampaigns(readScopedJson<CommunityCampaign[]>(targetScope, STORAGE_KEYS.CAMPAIGNS_P4, []));
    setCommunityFeedback(readScopedJson<CommunityFeedbackEntry[]>(targetScope, STORAGE_KEYS.FEEDBACK_P4, []));
    setBookmarkedResourceIds(
      readScopedJson<string[]>(targetScope, STORAGE_KEYS.BOOKMARKED_RESOURCES_P4, ['res-school-module'])
    );

    // Ecosystem & Shared
    setTriggerEntries(readScopedJson<TriggerJournalEntry[]>(targetScope, STORAGE_KEYS.TRIGGER_ENTRIES, []));
    setHabitChallenges(
      readScopedJson<HabitChallenge[]>(targetScope, STORAGE_KEYS.HABIT_CHALLENGES, DEFAULT_HABIT_CHALLENGES_LIST)
    );
    setEarlyAssessments(readScopedJson<EarlySupportAssessment[]>(targetScope, STORAGE_KEYS.EARLY_ASSESSMENTS, []));
    setNotifications(
      readScopedJson<UnifiedNotification[]>(targetScope, STORAGE_KEYS.NOTIFICATIONS, []).filter(
        n => !LEGACY_SEEDED_NOTIF_IDS.has(n.id)
      )
    );
    setConsentPrefs(
      readScopedJson<ConsentPreferences>(targetScope, STORAGE_KEYS.CONSENT_PREFS, DEFAULT_CONSENT_PREFS)
    );
    setMissions(readScopedJson<ClearPathMission[]>(targetScope, STORAGE_KEYS.MISSIONS, INITIAL_CLEARPATH_MISSIONS));
    setExchangeItems(
      readScopedJson<InnovationExchangeItem[]>(targetScope, STORAGE_KEYS.EXCHANGE_ITEMS, SEEDED_EXCHANGE_TEMPLATES)
    );
    setTimelineEvents(readScopedJson<AchievementTimelineItem[]>(targetScope, STORAGE_KEYS.TIMELINE_EVENTS, []));
    setDismissedIntroRoles(readScopedJson<UserRole[]>(targetScope, STORAGE_KEYS.DISMISSED_INTROS, []));
    setSavedCenterIds(readScopedJson<string[]>(targetScope, STORAGE_KEYS.SAVED_CENTERS, ['vimukthi-central']));
    setCareRelays(readScopedJson<CareRelayRecord[]>(targetScope, STORAGE_KEYS.CARE_RELAYS, []));
    setSharedSupporterItems(
      readScopedJson<SharedSupporterItem[]>(targetScope, STORAGE_KEYS.SHARED_SUPPORTER_ITEMS, [])
    );
    const loadedChats = readScopedJson<AiChatSession[]>(targetScope, STORAGE_KEYS.AI_CHAT_SESSIONS, []);
    setAiChatSessions(loadedChats);
    setActiveAiSessionId(loadedChats[0]?.id || null);
    setIsAiDrawerOpen(false);
    setAiPendingContext(null);
  };

  const saveUserProfile = (profile: UserProfile, options?: { isNewSignup?: boolean }) => {
    const nextScope = getVaultScope(profile);
    const isNewSignup = Boolean(options?.isNewSignup);
    const isSwitchingScope = activeScopeRef.current !== nextScope || isNewSignup;

    if (isNewSignup) {
      clearScopedVault(nextScope);
    }

    const activeOrIntendedRole = isNewSignup
      ? profile.lastSelectedRole || mapReasonToRole(profile.primaryReason)
      : profile.lastSelectedRole || currentRole || mapReasonToRole(profile.primaryReason);

    const syncedProfile: UserProfile = {
      ...profile,
      lastSelectedRole: activeOrIntendedRole,
    };

    setUserProfileState(syncedProfile);
    writeStorageItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(syncedProfile));

    if (profile.language) {
      setLanguage(profile.language);
    }

    if (isSwitchingScope) {
      loadScopeIntoState(nextScope, activeOrIntendedRole);
    } else if (!currentRole && activeOrIntendedRole) {
      setCurrentRoleState(activeOrIntendedRole);
      writeScopedString(nextScope, STORAGE_KEYS.ROLE, activeOrIntendedRole);
    }
  };

  const logoutUser = () => {
    setUserProfileState(null);
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    clearServerSession();
    loadScopeIntoState('guest', null);
  };

  const resetGuestVault = () => {
    setUserProfileState(null);
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    clearScopedVault('guest');
    loadScopeIntoState('guest', null);
  };

  // Role Setter (persists lastSelectedRole inside profile when signed in)
  const setRole = (role: UserRole | null) => {
    setCurrentRoleState(role);
    if (role) {
      writeStorageItem(STORAGE_KEYS.ROLE, role);
      if (userProfile && userProfile.lastSelectedRole !== role) {
        const updatedProfile = { ...userProfile, lastSelectedRole: role };
        setUserProfileState(updatedProfile);
        writeStorageItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updatedProfile));
      }
    } else {
      removeStorageItem(STORAGE_KEYS.ROLE);
    }
  };

  // Language Setter
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    writeStorageItem(STORAGE_KEYS.LANG, lang);
  };

  const t = (key: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    return dict[key] || TRANSLATIONS.en[key] || key;
  };

  // ==========================================
  // ROLE 01 HANDLERS
  // ==========================================
  const savePersonalOnboarding = (data: PersonalOnboarding) => {
    setPersonalOnboarding(data);
    writeStorageItem(STORAGE_KEYS.ONBOARDING_P1, JSON.stringify(data));
  };

  const addDailyLog = (logData: Omit<DailyLog, 'id' | 'timestamp'>): DailyLog => {
    const newLog: DailyLog = {
      ...logData,
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };
    const updated = [newLog, ...dailyLogs];
    setDailyLogs(updated);
    writeStorageItem(STORAGE_KEYS.LOGS_P1, JSON.stringify(updated));
    addTimelineEvent({
      role: 'personal',
      title: 'Private Daily Check-In Recorded',
      detail: `Mood: ${logData.mood || 'steady'}`,
      category: 'checkin',
    });
    return newLog;
  };

  const updateDailyLog = (id: string, updates: Partial<DailyLog>) => {
    const now = new Date().toISOString();
    const updated = dailyLogs.map(l => (l.id === id ? { ...l, ...updates, updatedAt: now } : l));
    setDailyLogs(updated);
    writeStorageItem(STORAGE_KEYS.LOGS_P1, JSON.stringify(updated));
  };

  const deleteDailyLog = (id: string) => {
    const updated = dailyLogs.filter(l => l.id !== id);
    setDailyLogs(updated);
    writeStorageItem(STORAGE_KEYS.LOGS_P1, JSON.stringify(updated));
  };

  const addCalendarEvent = (eventData: Omit<CalendarEvent, 'id'>): CalendarEvent => {
    const now = new Date().toISOString();
    const completionState =
      eventData.completionState || (eventData.completed ? 'completed' : 'planned');
    const newEvent: CalendarEvent = {
      ...eventData,
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      completionState,
      completed: completionState === 'completed',
      createdByRole: eventData.createdByRole || 'user',
      updatedAt: now,
    };
    const updated = [...calendarEvents, newEvent];
    setCalendarEvents(updated);
    writeStorageItem(STORAGE_KEYS.EVENTS_P1, JSON.stringify(updated));
    return newEvent;
  };

  const updateCalendarEvent = (id: string, updates: Partial<CalendarEvent>) => {
    const now = new Date().toISOString();
    const updated = calendarEvents.map(e => {
      if (e.id !== id) return e;
      const merged = { ...e, ...updates, updatedAt: now };
      if (updates.completionState !== undefined) {
        merged.completed = updates.completionState === 'completed';
      } else if (updates.completed !== undefined) {
        merged.completionState = updates.completed ? 'completed' : 'planned';
      }
      return merged;
    });
    setCalendarEvents(updated);
    writeStorageItem(STORAGE_KEYS.EVENTS_P1, JSON.stringify(updated));
  };

  const deleteCalendarEvent = (id: string) => {
    const updated = calendarEvents.filter(e => e.id !== id);
    setCalendarEvents(updated);
    writeStorageItem(STORAGE_KEYS.EVENTS_P1, JSON.stringify(updated));
  };

  const toggleCalendarEvent = (id: string) => {
    const now = new Date().toISOString();
    const updated = calendarEvents.map(e => {
      if (e.id !== id) return e;
      const nextCompleted = !e.completed;
      return {
        ...e,
        completed: nextCompleted,
        completionState: (nextCompleted ? 'completed' : 'planned') as CalendarEvent['completionState'],
        updatedAt: now,
      };
    });
    setCalendarEvents(updated);
    writeStorageItem(STORAGE_KEYS.EVENTS_P1, JSON.stringify(updated));
  };

  const addGoal = (
    goalData: Omit<Goal, 'id' | 'createdAt' | 'milestones' | 'progressNotes'>,
    initialMilestones?: string[]
  ): Goal => {
    const now = new Date().toISOString();
    const newGoal: Goal = {
      ...goalData,
      id: 'goal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: now,
      createdByRole: goalData.createdByRole || 'user',
      updatedAt: now,
      milestones: (initialMilestones || []).map((mTitle, idx) => ({
        id: `ms_${Date.now()}_${idx}`,
        title: mTitle,
        completed: false,
      })),
      progressNotes: [],
    };
    const updated = [newGoal, ...goals];
    setGoals(updated);
    writeStorageItem(STORAGE_KEYS.GOALS_P1, JSON.stringify(updated));
    return newGoal;
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    const now = new Date().toISOString();
    const updated = goals.map(g => (g.id === id ? { ...g, ...updates, updatedAt: now } : g));
    setGoals(updated);
    writeStorageItem(STORAGE_KEYS.GOALS_P1, JSON.stringify(updated));
  };

  const deleteGoal = (id: string) => {
    const updated = goals.filter(g => g.id !== id);
    setGoals(updated);
    writeStorageItem(STORAGE_KEYS.GOALS_P1, JSON.stringify(updated));
  };

  const toggleMilestone = (goalId: string, milestoneId: string) => {
    const now = new Date().toISOString();
    const updated = goals.map(g => {
      if (g.id !== goalId) return g;
      const updatedMs = g.milestones.map(m => (m.id === milestoneId ? { ...m, completed: !m.completed } : m));
      const allDone = updatedMs.length > 0 && updatedMs.every(m => m.completed);
      return { ...g, milestones: updatedMs, completed: allDone, updatedAt: now };
    });
    setGoals(updated);
    writeStorageItem(STORAGE_KEYS.GOALS_P1, JSON.stringify(updated));
  };

  const addGoalNote = (goalId: string, noteText: string) => {
    const now = new Date().toISOString();
    const updated = goals.map(g => {
      if (g.id !== goalId) return g;
      const newNote = {
        id: 'note_' + Date.now(),
        date: now.split('T')[0],
        note: noteText,
      };
      return { ...g, progressNotes: [newNote, ...g.progressNotes], updatedAt: now };
    });
    setGoals(updated);
    writeStorageItem(STORAGE_KEYS.GOALS_P1, JSON.stringify(updated));
  };

  const recordGameScore = (gameId: string, score: number) => {
    const prev = gameStats[gameId] || { highScores: 0, sessionsPlayed: 0 };
    const updated = {
      ...gameStats,
      [gameId]: {
        highScores: Math.max(prev.highScores, score),
        sessionsPlayed: prev.sessionsPlayed + 1,
        lastPlayed: new Date().toISOString(),
      },
    };
    setGameStats(updated);
    writeStorageItem(STORAGE_KEYS.GAME_STATS, JSON.stringify(updated));
  };

  const saveToolCompletion = (toolId: string, responses: Record<number, string>) => {
    const updated = {
      ...toolCompletions,
      [toolId]: {
        completedAt: new Date().toISOString(),
        responses,
      },
    };
    setToolCompletions(updated);
    writeStorageItem(STORAGE_KEYS.TOOL_COMPLETIONS, JSON.stringify(updated));
  };

  const addRecoveryReport = (report: RecoveryReportRecord) => {
    setRecoveryReports(prev => {
      const next = [report, ...prev.filter(r => r.id !== report.id)].slice(0, 60);
      writeStorageItem(STORAGE_KEYS.RECOVERY_REPORTS, JSON.stringify(next));
      return next;
    });
  };

  const saveOpportunityProfile = (profile: OpportunityProfile) => {
    const next: OpportunityProfile = { ...profile, updatedAt: new Date().toISOString() };
    setOpportunityProfile(next);
    writeStorageItem(STORAGE_KEYS.OPPORTUNITY_PROFILE, JSON.stringify(next));
  };

  const toggleOpportunitySave = (opportunityId: string, personalNote?: string) => {
    setSavedOpportunities(prev => {
      const exists = prev.some(s => s.opportunityId === opportunityId);
      const next = exists
        ? prev.filter(s => s.opportunityId !== opportunityId)
        : [{ opportunityId, savedAt: new Date().toISOString(), personalNote }, ...prev];
      writeStorageItem(STORAGE_KEYS.SAVED_OPPORTUNITIES, JSON.stringify(next));
      return next;
    });
  };

  const addOpportunityApplication = (
    app: Omit<OpportunityApplication, 'id' | 'updatedAt'>
  ): OpportunityApplication => {
    const created: OpportunityApplication = {
      ...app,
      id: 'app_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      updatedAt: new Date().toISOString(),
    };
    setOpportunityApplications(prev => {
      const next = [created, ...prev];
      writeStorageItem(STORAGE_KEYS.OPPORTUNITY_APPLICATIONS, JSON.stringify(next));
      return next;
    });
    return created;
  };

  const updateOpportunityApplication = (id: string, updates: Partial<OpportunityApplication>) => {
    const now = new Date().toISOString();
    setOpportunityApplications(prev => {
      const next = prev.map(a => (a.id === id ? { ...a, ...updates, updatedAt: now } : a));
      writeStorageItem(STORAGE_KEYS.OPPORTUNITY_APPLICATIONS, JSON.stringify(next));
      return next;
    });
  };

  const deleteOpportunityApplication = (id: string) => {
    setOpportunityApplications(prev => {
      const next = prev.filter(a => a.id !== id);
      writeStorageItem(STORAGE_KEYS.OPPORTUNITY_APPLICATIONS, JSON.stringify(next));
      return next;
    });
  };

  const syncInterviewToCalendar = (
    applicationId: string,
    date: string,
    time?: string,
    label?: string
  ) => {
    const targetApp = opportunityApplications.find(a => a.id === applicationId);
    if (!targetApp || !date) return;
    const title = label || `Career / Skill Step: ${targetApp.title}`;
    const createdEvent = addCalendarEvent({
      title,
      date,
      startTime: time || undefined,
      category: 'personal_goal',
      notes: `Synced from Opportunities (${targetApp.organization})`,
      reminder: true,
      completed: false,
      completionState: 'planned',
    });
    updateOpportunityApplication(applicationId, {
      interviewDate: date,
      interviewTime: time || undefined,
      linkedCalendarEventId: createdEvent.id,
      status: targetApp.status === 'saved' ? 'interview_scheduled' : targetApp.status,
    });
  };

  const saveRecoveryPassport = (passport: RecoveryPassport) => {
    const next: RecoveryPassport = { ...passport, updatedAt: new Date().toISOString() };
    setRecoveryPassport(next);
    writeStorageItem(STORAGE_KEYS.RECOVERY_PASSPORT, JSON.stringify(next));
  };

  const togglePersonalDevStep = (trackId: string, stepId: string) => {
    const now = new Date().toISOString();
    setPersonalDevProgress(prev => {
      const current = prev[trackId] || { trackId, completedStepIds: [], updatedAt: now };
      const exists = current.completedStepIds.includes(stepId);
      const nextSteps = exists
        ? current.completedStepIds.filter(id => id !== stepId)
        : [...current.completedStepIds, stepId];
      const next = {
        ...prev,
        [trackId]: {
          ...current,
          completedStepIds: nextSteps,
          updatedAt: now,
        },
      };
      writeStorageItem(STORAGE_KEYS.PERSONAL_DEV_PROGRESS, JSON.stringify(next));
      return next;
    });
  };

  const updateRecoveryStartDate = (dateStr: string) => {
    setPersonalOnboarding(prev => {
      const base: PersonalOnboarding = prev || {
        primaryNeed: 'daily_structure',
        assistanceTypes: [],
        language,
        storagePreference: 'private',
        supportPreferences: {
          reminders: true,
          trustedSupporter: false,
          professionalFinder: false,
        },
        completed: false,
      };
      const next: PersonalOnboarding = {
        ...base,
        recoveryStartDate: dateStr,
      };
      writeStorageItem(STORAGE_KEYS.ONBOARDING_P1, JSON.stringify(next));
      return next;
    });
  };

  // ==========================================
  // ROLE 02: SUPPORTER HANDLERS
  // ==========================================
  const saveSupporterOnboarding = (data: SupporterOnboarding) => {
    setSupporterOnboarding(data);
    writeStorageItem(STORAGE_KEYS.ONBOARDING_P2, JSON.stringify(data));
  };

  const addSupportPlan = (
    planData: Omit<SupportPlan, 'id' | 'createdAt' | 'tasks'>,
    initialTasks?: string[]
  ): SupportPlan => {
    const newPlan: SupportPlan = {
      ...planData,
      id: 'splan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
      tasks: (initialTasks || []).map((tTitle, idx) => ({
        id: `spt_${Date.now()}_${idx}`,
        title: tTitle,
        completed: false,
      })),
    };
    const updated = [newPlan, ...supportPlans];
    setSupportPlans(updated);
    writeStorageItem(STORAGE_KEYS.SUPPORT_PLANS, JSON.stringify(updated));
    return newPlan;
  };

  const updateSupportPlan = (id: string, updates: Partial<SupportPlan>) => {
    const updated = supportPlans.map(p => (p.id === id ? { ...p, ...updates } : p));
    setSupportPlans(updated);
    writeStorageItem(STORAGE_KEYS.SUPPORT_PLANS, JSON.stringify(updated));
  };

  const deleteSupportPlan = (id: string) => {
    const updated = supportPlans.filter(p => p.id !== id);
    setSupportPlans(updated);
    writeStorageItem(STORAGE_KEYS.SUPPORT_PLANS, JSON.stringify(updated));
  };

  const toggleSupportPlanTask = (planId: string, taskId: string) => {
    const updated = supportPlans.map(p => {
      if (p.id !== planId) return p;
      const updatedTasks = p.tasks.map(t => (t.id === taskId ? { ...t, completed: !t.completed } : t));
      const allDone = updatedTasks.length > 0 && updatedTasks.every(t => t.completed);
      return { ...p, tasks: updatedTasks, completed: allDone };
    });
    setSupportPlans(updated);
    writeStorageItem(STORAGE_KEYS.SUPPORT_PLANS, JSON.stringify(updated));
  };

  const addSupportPlanTask = (planId: string, taskTitle: string) => {
    const updated = supportPlans.map(p => {
      if (p.id !== planId) return p;
      const newTask = {
        id: `spt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: taskTitle,
        completed: false,
      };
      return { ...p, tasks: [...p.tasks, newTask] };
    });
    setSupportPlans(updated);
    writeStorageItem(STORAGE_KEYS.SUPPORT_PLANS, JSON.stringify(updated));
  };

  const addSupporterCalendarEvent = (
    eventData: Omit<SupporterCalendarEvent, 'id'>
  ): SupporterCalendarEvent => {
    const newEvent: SupporterCalendarEvent = {
      ...eventData,
      id: 'sevt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    };
    const updated = [...supporterEvents, newEvent];
    setSupporterEvents(updated);
    writeStorageItem(STORAGE_KEYS.SUPPORTER_EVENTS, JSON.stringify(updated));
    return newEvent;
  };

  const updateSupporterCalendarEvent = (id: string, updates: Partial<SupporterCalendarEvent>) => {
    const updated = supporterEvents.map(e => (e.id === id ? { ...e, ...updates } : e));
    setSupporterEvents(updated);
    writeStorageItem(STORAGE_KEYS.SUPPORTER_EVENTS, JSON.stringify(updated));
  };

  const deleteSupporterCalendarEvent = (id: string) => {
    const updated = supporterEvents.filter(e => e.id !== id);
    setSupporterEvents(updated);
    writeStorageItem(STORAGE_KEYS.SUPPORTER_EVENTS, JSON.stringify(updated));
  };

  const toggleSupporterCalendarEvent = (id: string) => {
    const updated = supporterEvents.map(e => (e.id === id ? { ...e, completed: !e.completed } : e));
    setSupporterEvents(updated);
    writeStorageItem(STORAGE_KEYS.SUPPORTER_EVENTS, JSON.stringify(updated));
  };

  const addSupporterReflection = (
    reflectionData: Omit<SupporterReflection, 'id' | 'timestamp'>
  ): SupporterReflection => {
    const newReflection: SupporterReflection = {
      ...reflectionData,
      id: 'sref_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };
    const updated = [newReflection, ...supporterReflections];
    setSupporterReflections(updated);
    writeStorageItem(STORAGE_KEYS.SUPPORTER_REFLECTIONS, JSON.stringify(updated));
    return newReflection;
  };

  const updateSupporterReflection = (id: string, updates: Partial<SupporterReflection>) => {
    const updated = supporterReflections.map(r => (r.id === id ? { ...r, ...updates } : r));
    setSupporterReflections(updated);
    writeStorageItem(STORAGE_KEYS.SUPPORTER_REFLECTIONS, JSON.stringify(updated));
  };

  const deleteSupporterReflection = (id: string) => {
    const updated = supporterReflections.filter(r => r.id !== id);
    setSupporterReflections(updated);
    writeStorageItem(STORAGE_KEYS.SUPPORTER_REFLECTIONS, JSON.stringify(updated));
  };

  const saveConversationPlan = (
    planData: Omit<ConversationPlan, 'id' | 'createdAt'>
  ): ConversationPlan => {
    const newPlan: ConversationPlan = {
      ...planData,
      id: 'cplan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };
    const updated = [newPlan, ...savedConversationPlans];
    setSavedConversationPlans(updated);
    writeStorageItem(STORAGE_KEYS.SAVED_CONVERSATIONS, JSON.stringify(updated));
    return newPlan;
  };

  const deleteConversationPlan = (id: string) => {
    const updated = savedConversationPlans.filter(p => p.id !== id);
    setSavedConversationPlans(updated);
    writeStorageItem(STORAGE_KEYS.SAVED_CONVERSATIONS, JSON.stringify(updated));
  };

  const toggleCompletedEducationModule = (moduleId: string) => {
    const updated = completedEducationModuleIds.includes(moduleId)
      ? completedEducationModuleIds.filter(id => id !== moduleId)
      : [...completedEducationModuleIds, moduleId];
    setCompletedEducationModuleIds(updated);
    writeStorageItem(STORAGE_KEYS.COMPLETED_EDU_MODULES, JSON.stringify(updated));
  };

  // ==========================================
  // ROLE 03: LEARNER HANDLERS
  // ==========================================
  const saveLearnerOnboarding = (data: LearnerOnboarding) => {
    setLearnerOnboarding(data);
    writeStorageItem(STORAGE_KEYS.ONBOARDING_P3, JSON.stringify(data));
  };

  const recordLearnerStudyDay = (dateStr?: string) => {
    const day = dateStr || new Date().toISOString().split('T')[0];
    setLearnerStudyDates(prev => {
      if (prev.includes(day)) return prev;
      const updated = [...prev, day].sort();
      writeStorageItem(STORAGE_KEYS.LEARNER_STUDY_DATES, JSON.stringify(updated));
      return updated;
    });
  };

  const toggleCompleteLesson = (lessonId: string) => {
    const alreadyDone = completedLessonIds.includes(lessonId);
    const updated = alreadyDone
      ? completedLessonIds.filter(id => id !== lessonId)
      : [...completedLessonIds, lessonId];
    setCompletedLessonIds(updated);
    writeStorageItem(STORAGE_KEYS.COMPLETED_LESSONS, JSON.stringify(updated));
    if (!alreadyDone) {
      recordLearnerStudyDay();
    }
  };

  const toggleBookmarkLesson = (lessonId: string) => {
    const updated = bookmarkedLessonIds.includes(lessonId)
      ? bookmarkedLessonIds.filter(id => id !== lessonId)
      : [...bookmarkedLessonIds, lessonId];
    setBookmarkedLessonIds(updated);
    writeStorageItem(STORAGE_KEYS.BOOKMARKED_LESSONS, JSON.stringify(updated));
  };

  const saveScenarioAttempt = (scenarioId: string, choiceIndex: number) => {
    const updated = {
      ...savedScenarioAttempts,
      [scenarioId]: {
        choiceIndex,
        completedAt: new Date().toISOString(),
      },
    };
    setSavedScenarioAttempts(updated);
    writeStorageItem(STORAGE_KEYS.SCENARIO_ATTEMPTS, JSON.stringify(updated));
    recordLearnerStudyDay();
  };

  const addLearnerEvent = (eventData: Omit<LearnerCalendarEvent, 'id'>): LearnerCalendarEvent => {
    const newEvent: LearnerCalendarEvent = {
      ...eventData,
      id: 'levt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    };
    const updated = [...learnerEvents, newEvent];
    setLearnerEvents(updated);
    writeStorageItem(STORAGE_KEYS.LEARNER_EVENTS, JSON.stringify(updated));
    return newEvent;
  };

  const updateLearnerEvent = (id: string, updates: Partial<LearnerCalendarEvent>) => {
    const updated = learnerEvents.map(e => (e.id === id ? { ...e, ...updates } : e));
    setLearnerEvents(updated);
    writeStorageItem(STORAGE_KEYS.LEARNER_EVENTS, JSON.stringify(updated));
  };

  const deleteLearnerEvent = (id: string) => {
    const updated = learnerEvents.filter(e => e.id !== id);
    setLearnerEvents(updated);
    writeStorageItem(STORAGE_KEYS.LEARNER_EVENTS, JSON.stringify(updated));
  };

  const toggleLearnerEvent = (id: string) => {
    const updated = learnerEvents.map(e => (e.id === id ? { ...e, completed: !e.completed } : e));
    setLearnerEvents(updated);
    writeStorageItem(STORAGE_KEYS.LEARNER_EVENTS, JSON.stringify(updated));
  };

  const addLearnerJournalEntry = (
    entryData: Omit<LearnerJournalEntry, 'id' | 'timestamp'>
  ): LearnerJournalEntry => {
    const newEntry: LearnerJournalEntry = {
      ...entryData,
      id: 'lj_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };
    const updated = [newEntry, ...learnerJournalEntries];
    setLearnerJournalEntries(updated);
    writeStorageItem(STORAGE_KEYS.LEARNER_JOURNAL, JSON.stringify(updated));
    recordLearnerStudyDay();
    return newEntry;
  };

  const deleteLearnerJournalEntry = (id: string) => {
    const updated = learnerJournalEntries.filter(e => e.id !== id);
    setLearnerJournalEntries(updated);
    writeStorageItem(STORAGE_KEYS.LEARNER_JOURNAL, JSON.stringify(updated));
  };

  const saveQuizAttempt = (attemptData: Omit<QuizAttempt, 'id' | 'timestamp'>): QuizAttempt => {
    const newAttempt: QuizAttempt = {
      ...attemptData,
      id: 'qa_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };
    const updated = [newAttempt, ...quizAttempts];
    setQuizAttempts(updated);
    writeStorageItem(STORAGE_KEYS.QUIZ_ATTEMPTS, JSON.stringify(updated));
    recordLearnerStudyDay();
    return newAttempt;
  };

  // ==========================================
  // ROLE 04: COMMUNITY BUILDER HANDLERS
  // ==========================================
  const saveCommunityOnboarding = (onboarding: CommunityOnboarding, org?: Partial<CommunityOrganisation>) => {
    setCommunityOnboarding(onboarding);
    writeStorageItem(STORAGE_KEYS.ONBOARDING_P4, JSON.stringify(onboarding));
    if (org && org.name) {
      const newOrg: CommunityOrganisation = {
        id: 'org-' + Date.now(),
        name: org.name,
        type: org.type || onboarding.orgType,
        district: org.district || onboarding.district,
        address: org.address || '',
        coordinatorName: org.coordinatorName || 'Lead Coordinator',
        coordinatorDesignation: org.coordinatorDesignation || onboarding.roleResponsibility,
        coordinatorEmail: org.coordinatorEmail || '',
        coordinatorPhone: org.coordinatorPhone || '',
        description: org.description || 'Community prevention & support workspace',
        createdAt: new Date().toISOString(),
      };
      setCommunityOrg(newOrg);
      writeStorageItem(STORAGE_KEYS.ORG_P4, JSON.stringify(newOrg));
    }
  };

  const updateCommunityOrg = (updates: Partial<CommunityOrganisation>) => {
    setCommunityOrg(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...updates };
      writeStorageItem(STORAGE_KEYS.ORG_P4, JSON.stringify(updated));
      return updated;
    });
  };

  const addCommunityMember = (member: Omit<CommunityMember, 'id' | 'joinedAt'>): CommunityMember => {
    const newMember: CommunityMember = {
      ...member,
      id: 'cm-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      joinedAt: new Date().toISOString(),
    };
    setCommunityMembers(prev => {
      const updated = [newMember, ...prev];
      writeStorageItem(STORAGE_KEYS.MEMBERS_P4, JSON.stringify(updated));
      return updated;
    });
    return newMember;
  };

  const updateCommunityMember = (id: string, updates: Partial<CommunityMember>) => {
    setCommunityMembers(prev => {
      const updated = prev.map(m => (m.id === id ? { ...m, ...updates } : m));
      writeStorageItem(STORAGE_KEYS.MEMBERS_P4, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteCommunityMember = (id: string) => {
    setCommunityMembers(prev => {
      const updated = prev.filter(m => m.id !== id);
      writeStorageItem(STORAGE_KEYS.MEMBERS_P4, JSON.stringify(updated));
      return updated;
    });
  };

  const addCommunityProgramme = (prog: Omit<CommunityProgramme, 'id' | 'createdAt' | 'spent'>): CommunityProgramme => {
    const newProg: CommunityProgramme = {
      ...prog,
      id: 'cp-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      spent: 0,
      createdAt: new Date().toISOString(),
    };
    setCommunityProgrammes(prev => {
      const updated = [newProg, ...prev];
      writeStorageItem(STORAGE_KEYS.PROGRAMMES_P4, JSON.stringify(updated));
      return updated;
    });
    addTimelineEvent({
      role: 'community',
      title: `Programme Created: ${prog.title}`,
      detail: `${prog.district} · ${prog.targetAudience}`,
      category: 'community',
    });
    addNotification({
      title: `New Programme Added: ${prog.title}`,
      titleMl: `പുതിയ പദ്ധതി ചേർത്തു: ${prog.title}`,
      message: `${prog.district} · ${prog.targetAudience}`,
      messageMl: `${prog.district} · ${prog.targetAudience}`,
      category: 'community',
      targetRole: 'community',
      deepLinkTab: 'programmes',
      priority: 'normal',
    });
    return newProg;
  };

  const updateCommunityProgramme = (id: string, updates: Partial<CommunityProgramme>) => {
    setCommunityProgrammes(prev => {
      const updated = prev.map(p => (p.id === id ? { ...p, ...updates } : p));
      writeStorageItem(STORAGE_KEYS.PROGRAMMES_P4, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteCommunityProgramme = (id: string) => {
    setCommunityProgrammes(prev => {
      const updated = prev.filter(p => p.id !== id);
      writeStorageItem(STORAGE_KEYS.PROGRAMMES_P4, JSON.stringify(updated));
      return updated;
    });
  };

  const addCommunityEvent = (event: Omit<CommunityEvent, 'id' | 'actualAttendance'>): CommunityEvent => {
    const newEvent: CommunityEvent = {
      ...event,
      id: 'ce-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      actualAttendance: 0,
    };
    setCommunityEvents(prev => {
      const updated = [...prev, newEvent].sort((a, b) => a.date.localeCompare(b.date));
      writeStorageItem(STORAGE_KEYS.EVENTS_P4, JSON.stringify(updated));
      return updated;
    });
    return newEvent;
  };

  const updateCommunityEvent = (id: string, updates: Partial<CommunityEvent>) => {
    setCommunityEvents(prev => {
      const updated = prev.map(e => (e.id === id ? { ...e, ...updates } : e));
      writeStorageItem(STORAGE_KEYS.EVENTS_P4, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteCommunityEvent = (id: string) => {
    setCommunityEvents(prev => {
      const updated = prev.filter(e => e.id !== id);
      writeStorageItem(STORAGE_KEYS.EVENTS_P4, JSON.stringify(updated));
      return updated;
    });
  };

  const addCommunityTask = (task: Omit<CommunityTask, 'id'>): CommunityTask => {
    const newTask: CommunityTask = {
      ...task,
      id: 'ct-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    };
    setCommunityTasks(prev => {
      const updated = [newTask, ...prev];
      writeStorageItem(STORAGE_KEYS.TASKS_P4, JSON.stringify(updated));
      return updated;
    });
    return newTask;
  };

  const updateCommunityTask = (id: string, updates: Partial<CommunityTask>) => {
    setCommunityTasks(prev => {
      const updated = prev.map(t => (t.id === id ? { ...t, ...updates } : t));
      writeStorageItem(STORAGE_KEYS.TASKS_P4, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteCommunityTask = (id: string) => {
    setCommunityTasks(prev => {
      const updated = prev.filter(t => t.id !== id);
      writeStorageItem(STORAGE_KEYS.TASKS_P4, JSON.stringify(updated));
      return updated;
    });
  };

  const toggleCommunityTask = (id: string) => {
    setCommunityTasks(prev => {
      const updated = prev.map(t =>
        t.id === id
          ? {
              ...t,
              status: t.status === 'completed' ? ('in_progress' as const) : ('completed' as const),
            }
          : t
      );
      writeStorageItem(STORAGE_KEYS.TASKS_P4, JSON.stringify(updated));
      return updated;
    });
  };

  const addCommunityCampaign = (campaign: Omit<CommunityCampaign, 'id' | 'spent'>): CommunityCampaign => {
    const newCamp: CommunityCampaign = {
      ...campaign,
      id: 'cc-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      spent: 0,
    };
    setCommunityCampaigns(prev => {
      const updated = [newCamp, ...prev];
      writeStorageItem(STORAGE_KEYS.CAMPAIGNS_P4, JSON.stringify(updated));
      return updated;
    });
    return newCamp;
  };

  const updateCommunityCampaign = (id: string, updates: Partial<CommunityCampaign>) => {
    setCommunityCampaigns(prev => {
      const updated = prev.map(c => (c.id === id ? { ...c, ...updates } : c));
      writeStorageItem(STORAGE_KEYS.CAMPAIGNS_P4, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteCommunityCampaign = (id: string) => {
    setCommunityCampaigns(prev => {
      const updated = prev.filter(c => c.id !== id);
      writeStorageItem(STORAGE_KEYS.CAMPAIGNS_P4, JSON.stringify(updated));
      return updated;
    });
  };

  const addCommunityFeedback = (entry: Omit<CommunityFeedbackEntry, 'id'>): CommunityFeedbackEntry => {
    const newFb: CommunityFeedbackEntry = {
      ...entry,
      id: 'cf-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
    };
    setCommunityFeedback(prev => {
      const updated = [newFb, ...prev];
      writeStorageItem(STORAGE_KEYS.FEEDBACK_P4, JSON.stringify(updated));
      return updated;
    });
    return newFb;
  };

  const deleteCommunityFeedback = (id: string) => {
    setCommunityFeedback(prev => {
      const updated = prev.filter(f => f.id !== id);
      writeStorageItem(STORAGE_KEYS.FEEDBACK_P4, JSON.stringify(updated));
      return updated;
    });
  };

  const toggleBookmarkResource = (resourceId: string) => {
    setBookmarkedResourceIds(prev => {
      const exists = prev.includes(resourceId);
      const updated = exists ? prev.filter(id => id !== resourceId) : [...prev, resourceId];
      writeStorageItem(STORAGE_KEYS.BOOKMARKED_RESOURCES_P4, JSON.stringify(updated));
      return updated;
    });
  };

  // Support Centers toggle
  const toggleSaveCenter = (centerId: string) => {
    const updated = savedCenterIds.includes(centerId)
      ? savedCenterIds.filter(id => id !== centerId)
      : [...savedCenterIds, centerId];
    setSavedCenterIds(updated);
    writeStorageItem(STORAGE_KEYS.SAVED_CENTERS, JSON.stringify(updated));
  };

  // Care Relay handlers
  const createCareRelay = (input: {
    center: SupportCenter;
    supportNeed: SupportNeedFocus;
    preferredLanguage: 'en' | 'ml';
    preferredCallbackWindow?: string;
    consentGranted: boolean;
    includeDistrictInSummary?: boolean;
  }): CareRelayRecord | null => {
    const summaryResult = buildReferralHandoffSummary({
      centerName: input.center.name,
      district: input.center.district,
      supportNeed: input.supportNeed,
      preferredLanguage: input.preferredLanguage,
      preferredCallbackWindow: input.preferredCallbackWindow,
      consentGranted: input.consentGranted,
      includeDistrictInSummary: input.includeDistrictInSummary,
    });
    if (!summaryResult.allowed) return null;

    const now = new Date().toISOString();
    const record: CareRelayRecord = {
      id: 'relay-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      centerId: input.center.id,
      centerName: input.center.name,
      centerPhone: input.center.phone,
      district: input.center.district,
      supportNeed: input.supportNeed,
      status: 'request_initiated',
      consentGranted: true,
      consentNote: summaryResult.consentNote,
      sharedSummaryText: summaryResult.summaryText,
      preferredLanguage: input.preferredLanguage,
      preferredCallbackWindow: input.preferredCallbackWindow?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
      statusHistory: [
        {
          status: 'request_initiated',
          timestamp: now,
          note: 'Consent-scoped call sheet prepared locally.',
        },
      ],
    };

    setCareRelays(prev => {
      const updated = [record, ...prev];
      writeStorageItem(STORAGE_KEYS.CARE_RELAYS, JSON.stringify(updated));
      return updated;
    });
    return record;
  };

  const updateCareRelayStatus = (
    id: string,
    status: CareRelayStatus,
    details?: { note?: string; appointmentDate?: string; appointmentTime?: string }
  ) => {
    const now = new Date().toISOString();
    setCareRelays(prev => {
      const updated = prev.map(r => {
        if (r.id !== id) return r;
        if (!canTransitionCareRelay(r.status, status)) return r;
        return {
          ...r,
          status,
          appointmentDate: details?.appointmentDate ?? r.appointmentDate,
          appointmentTime: details?.appointmentTime ?? r.appointmentTime,
          updatedAt: now,
          statusHistory: [
            ...r.statusHistory,
            {
              status,
              timestamp: now,
              note: details?.note,
            },
          ],
        };
      });
      writeStorageItem(STORAGE_KEYS.CARE_RELAYS, JSON.stringify(updated));
      return updated;
    });
  };

  const revokeCareRelayConsent = (id: string) => {
    const now = new Date().toISOString();
    setCareRelays(prev => {
      const updated = prev.map(r =>
        r.id === id
          ? {
              ...r,
              consentGranted: false,
              status: 'closed' as CareRelayStatus,
              revokedAt: now,
              updatedAt: now,
              consentNote: 'User revoked sharing consent.',
              sharedSummaryText: '[Consent revoked by user — call sheet cleared]',
              statusHistory: [
                ...r.statusHistory,
                {
                  status: 'closed' as CareRelayStatus,
                  timestamp: now,
                  note: 'Consent revoked by user.',
                },
              ],
            }
          : r
      );
      writeStorageItem(STORAGE_KEYS.CARE_RELAYS, JSON.stringify(updated));
      return updated;
    });
  };

  const deleteCareRelay = (id: string) => {
    setCareRelays(prev => {
      const updated = prev.filter(r => r.id !== id);
      writeStorageItem(STORAGE_KEYS.CARE_RELAYS, JSON.stringify(updated));
      return updated;
    });
  };

  const shareItemWithSupporter = (input: {
    id?: string;
    kind: SharedItemKind;
    title: string;
    detail: string;
    targetDate?: string;
    consentGranted: boolean;
  }): SharedSupporterItem | null => {
    const item = sanitizeSharedSupporterItem({
      id: input.id || 'share-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      kind: input.kind,
      title: input.title,
      detail: input.detail,
      targetDate: input.targetDate,
      consentGranted: input.consentGranted,
      createdAt: new Date().toISOString(),
    });
    if (!item) return null;

    setSharedSupporterItems(prev => {
      const filtered = prev.filter(existing => existing.id !== item.id);
      const updated = [item, ...filtered];
      writeStorageItem(STORAGE_KEYS.SHARED_SUPPORTER_ITEMS, JSON.stringify(updated));
      return updated;
    });
    return item;
  };

  const revokeSharedSupporterItem = (id: string) => {
    const now = new Date().toISOString();
    setSharedSupporterItems(prev => {
      const updated = prev.map(item =>
        item.id === id
          ? { ...item, consentGranted: false, revokedAt: now }
          : item
      );
      writeStorageItem(STORAGE_KEYS.SHARED_SUPPORTER_ITEMS, JSON.stringify(updated));
      return updated;
    });
  };

  // Backup Export / Import / Clear
  const exportBackup = () => {
    const stateSnapshot = {
      currentRole,
      language,
      // Role 01
      personalOnboarding,
      dailyLogs,
      calendarEvents,
      goals,
      gameStats,
      toolCompletions,
      recoveryReports,
      opportunityProfile,
      savedOpportunities,
      opportunityApplications,
      recoveryPassport,
      personalDevProgress,
      // Role 02 Supporter
      supporterOnboarding,
      supportPlans,
      supporterEvents,
      supporterReflections,
      savedConversationPlans,
      completedEducationModuleIds,
      // Role 03 Learner
      learnerOnboarding,
      completedLessonIds,
      bookmarkedLessonIds,
      savedScenarioAttempts,
      learnerEvents,
      learnerJournalEntries,
      quizAttempts,
      // Role 04 Community Builder
      communityOnboarding,
      communityOrg,
      communityMembers,
      communityProgrammes,
      communityEvents,
      communityTasks,
      communityCampaigns,
      communityFeedback,
      bookmarkedResourceIds,
      // Shared & Care Relay
      savedCenterIds,
      careRelays,
      sharedSupporterItems,
      aiChatSessions,
      exportedAt: new Date().toISOString(),
      app: 'ClearPath AI',
    };
    const blob = new Blob([JSON.stringify(stateSnapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clearpath_ai_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBackup = (jsonStr: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonStr);
      const validation = validateExportImportData(parsed);
      if (!validation.valid || !validation.state) {
        return { success: false, error: validation.error || 'Invalid format' };
      }
      if (validation.state.dailyLogs) {
        setDailyLogs(validation.state.dailyLogs);
        writeStorageItem(STORAGE_KEYS.LOGS_P1, JSON.stringify(validation.state.dailyLogs));
      }
      if (validation.state.calendarEvents) {
        setCalendarEvents(validation.state.calendarEvents);
        writeStorageItem(STORAGE_KEYS.EVENTS_P1, JSON.stringify(validation.state.calendarEvents));
      }
      if (validation.state.goals) {
        setGoals(validation.state.goals);
        writeStorageItem(STORAGE_KEYS.GOALS_P1, JSON.stringify(validation.state.goals));
      }
      if (validation.state.supportPlans) {
        setSupportPlans(validation.state.supportPlans);
        writeStorageItem(STORAGE_KEYS.SUPPORT_PLANS, JSON.stringify(validation.state.supportPlans));
      }
      if (validation.state.supporterEvents) {
        setSupporterEvents(validation.state.supporterEvents);
        writeStorageItem(STORAGE_KEYS.SUPPORTER_EVENTS, JSON.stringify(validation.state.supporterEvents));
      }
      if (validation.state.supporterReflections) {
        setSupporterReflections(validation.state.supporterReflections);
        writeStorageItem(STORAGE_KEYS.SUPPORTER_REFLECTIONS, JSON.stringify(validation.state.supporterReflections));
      }
      if (parsed.learnerEvents) {
        setLearnerEvents(parsed.learnerEvents);
        writeStorageItem(STORAGE_KEYS.LEARNER_EVENTS, JSON.stringify(parsed.learnerEvents));
      }
      if (parsed.learnerJournalEntries) {
        setLearnerJournalEntries(parsed.learnerJournalEntries);
        writeStorageItem(STORAGE_KEYS.LEARNER_JOURNAL, JSON.stringify(parsed.learnerJournalEntries));
      }
      if (parsed.communityProgrammes) {
        setCommunityProgrammes(parsed.communityProgrammes);
        writeStorageItem(STORAGE_KEYS.PROGRAMMES_P4, JSON.stringify(parsed.communityProgrammes));
      }
      if (parsed.communityEvents) {
        setCommunityEvents(parsed.communityEvents);
        writeStorageItem(STORAGE_KEYS.EVENTS_P4, JSON.stringify(parsed.communityEvents));
      }
      if (parsed.communityTasks) {
        setCommunityTasks(parsed.communityTasks);
        writeStorageItem(STORAGE_KEYS.TASKS_P4, JSON.stringify(parsed.communityTasks));
      }
      if (parsed.communityMembers) {
        setCommunityMembers(parsed.communityMembers);
        writeStorageItem(STORAGE_KEYS.MEMBERS_P4, JSON.stringify(parsed.communityMembers));
      }
      if (parsed.communityOrg) {
        setCommunityOrg(parsed.communityOrg);
        writeStorageItem(STORAGE_KEYS.ORG_P4, JSON.stringify(parsed.communityOrg));
      }
      if (parsed.careRelays && Array.isArray(parsed.careRelays)) {
        setCareRelays(parsed.careRelays);
        writeStorageItem(STORAGE_KEYS.CARE_RELAYS, JSON.stringify(parsed.careRelays));
      }
      if (parsed.sharedSupporterItems && Array.isArray(parsed.sharedSupporterItems)) {
        setSharedSupporterItems(parsed.sharedSupporterItems);
        writeStorageItem(STORAGE_KEYS.SHARED_SUPPORTER_ITEMS, JSON.stringify(parsed.sharedSupporterItems));
      }
      if (validation.state.language) {
        setLanguage(validation.state.language);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to parse JSON file' };
    }
  };

  const clearAllLocalData = () => {
    clearScopedVault(activeScopeRef.current);
    loadScopeIntoState(activeScopeRef.current, null);
  };

  // Add saved status to centers
  const supportCenters = VERIFIED_SUPPORT_CENTERS.map(c => ({
    ...c,
    isSaved: savedCenterIds.includes(c.id),
  }));

  const createNewAiSession = (roleOverride?: AiChatRole, contextRef?: AiChatContextRef): AiChatSession => {
    const now = new Date().toISOString();
    const resolvedRole: AiChatRole = roleOverride || currentRole || 'home';
    const newSession: AiChatSession = {
      id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: contextRef?.topicTitle ? contextRef.topicTitle.slice(0, 42) : 'New Chat',
      role: resolvedRole,
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    setAiChatSessions(prev => {
      const updated = [newSession, ...prev].slice(0, 30);
      writeStorageItem(STORAGE_KEYS.AI_CHAT_SESSIONS, JSON.stringify(updated));
      return updated;
    });
    setActiveAiSessionId(newSession.id);
    if (contextRef) {
      setAiPendingContext(contextRef);
    }
    return newSession;
  };

  const selectAiSession = (sessionId: string) => {
    setActiveAiSessionId(sessionId);
  };

  const deleteAiSession = (sessionId: string) => {
    setAiChatSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      writeStorageItem(STORAGE_KEYS.AI_CHAT_SESSIONS, JSON.stringify(updated));
      if (activeAiSessionId === sessionId) {
        setActiveAiSessionId(updated[0]?.id || null);
      }
      return updated;
    });
  };

  const clearAllAiSessions = () => {
    setAiChatSessions([]);
    setActiveAiSessionId(null);
    writeStorageItem(STORAGE_KEYS.AI_CHAT_SESSIONS, JSON.stringify([]));
  };

  const clearAiPendingContext = () => setAiPendingContext(null);

  const computePersonalizationProfile = (): PersonalizationProfile => {
    const activeRole = currentRole || userProfile?.lastSelectedRole || 'personal';
    const name = userProfile?.name?.trim() || '';
    const district = communityOrg?.district || communityOnboarding?.district || '';
    const recentMood = dailyLogs[0]?.mood || '';
    const topGoal =
      goals[0]?.title || supportPlans[0]?.title || communityProgrammes[0]?.title || '';
    const nextLesson =
      LEARNER_LESSONS.find(l => !completedLessonIds.includes(l.id)) || LEARNER_LESSONS[0];
    const gameCount = Object.values(gameStats).reduce((s, g) => s + (g.sessionsPlayed || 0), 0);

    let nextActionLabel = 'Open Care Finder';
    let nextActionRole: UserRole = activeRole;
    let nextActionTab = 'navigator';
    let tailoredTip =
      'Take one calm 2-minute step today. Everything here stays private until you share it.';
    let tailoredTipMl =
      'ഇന്ന് 2 മിനിറ്റ് ചെറിയൊരു ചുവട് വെക്കൂ. നിങ്ങളുടെ വിവരങ്ങൾ സ്വകാര്യമായി സുരക്ഷിതമാണ്.';

    if (activeRole === 'supporter') {
      nextActionRole = 'supporter';
      if (supportPlans.length === 0) {
        nextActionLabel = 'Start First Support Plan';
        nextActionTab = 'plan';
        tailoredTip =
          'Pick one calm step for this week and write a gentle opener before talking.';
        tailoredTipMl =
          'ഈ ആഴ്ചത്തേക്ക് ചെറിയൊരു കെയർ പ്ലാൻ തുടങ്ങി ശാന്തമായി സംസാരിക്കാം.';
      } else {
        nextActionLabel = 'Prepare Talk Lines';
        nextActionTab = 'talk';
        tailoredTip = `Active focus: ${supportPlans[0].title}. Kind questions work much better than pressure.`;
        tailoredTipMl = 'കുറ്റപ്പെടുത്താതെ സ്നേഹത്തോടെയുള്ള ചെറിയ ചോദ്യങ്ങളാണ് ഏറ്റവും ഫലപ്രദം.';
      }
    } else if (activeRole === 'learner') {
      nextActionRole = 'learner';
      if (nextLesson) {
        nextActionLabel = `Read: ${nextLesson.title}`;
        nextActionTab = 'interactive';
        tailoredTip = `${completedLessonIds.length} lessons done. Tap any confusing line to ask AI right inside the lesson.`;
        tailoredTipMl = `${completedLessonIds.length} പാഠങ്ങൾ പൂർത്തിയാക്കി. സംശയമുണ്ടെങ്കിൽ വായനയ്ക്കിടയിൽ തന്നെ AI-യോട് ചോദിക്കാം.`;
      }
    } else if (activeRole === 'community') {
      nextActionRole = 'community';
      if (communityProgrammes.length === 0) {
        nextActionLabel = 'Plan First Programme';
        nextActionTab = 'generator';
        tailoredTip =
          'Start with a short interactive workshop blueprint tailored to your district.';
        tailoredTipMl =
          'നിങ്ങളുടെ ജില്ലയ്ക്ക് അനുയോജ്യമായ ചെറിയൊരു വർക്ക്ഷോപ്പ് പ്ലാൻ തയ്യാറാക്കാം.';
      } else {
        nextActionLabel = 'Check District Needs';
        nextActionTab = 'gaps';
        tailoredTip = `You track ${communityProgrammes.length} local programmes. Focus where free help is still missing.`;
        tailoredTipMl = `നിങ്ങൾ ${communityProgrammes.length} പദ്ധതികൾ നയിക്കുന്നു. കൂടുതൽ സഹായം വേണ്ട ഇടങ്ങളിൽ ശ്രദ്ധിക്കാം.`;
      }
    } else {
      nextActionRole = 'personal';
      if (
        recentMood === 'heavy' ||
        recentMood === 'restless' ||
        recentMood === 'difficult' ||
        recentMood === 'challenged'
      ) {
        nextActionLabel = 'Open Calm Tools (2 Min)';
        nextActionTab = 'tools';
        tailoredTip =
          'Things feel heavy right now. Try a 2-minute breathing or urge-wave tool first.';
        tailoredTipMl = 'ഇപ്പോൾ അല്പം പ്രയാസമാണെങ്കിൽ 2 മിനിറ്റ് ശ്വാസവ്യായാമം പരീക്ഷിക്കൂ.';
      } else if (dailyLogs.length === 0) {
        nextActionLabel = 'Write First Check-In';
        nextActionTab = 'dailylog';
        tailoredTip =
          'One quiet 20-second check-in helps personalize your calm tools and AI guide.';
        tailoredTipMl = 'ചെറിയൊരു ചെക്ക്-ഇൻ രേഖപ്പെടുത്തുന്നത് നിങ്ങൾക്ക് കൂടുതൽ സഹായകരമാകും.';
      } else {
        nextActionLabel = 'Play a 2-Min Focus Game';
        nextActionTab = 'games';
        tailoredTip = `${dailyLogs.length} check-ins & ${gameCount} focus sessions logged. Keep steady one day at a time.`;
        tailoredTipMl = `${dailyLogs.length} ചെക്ക്-ഇന്നുകളും ${gameCount} ഫോക്കസ് സെഷനുകളും പൂർത്തിയാക്കി.`;
      }
    }

    const statsSummary =
      activeRole === 'supporter'
        ? `plans=${supportPlans.length}, notes=${supporterReflections.length}`
        : activeRole === 'learner'
          ? `lessons=${completedLessonIds.length}, quizzes=${quizAttempts.length}`
          : activeRole === 'community'
            ? `programmes=${communityProgrammes.length}, events=${communityEvents.length}`
            : `checkIns=${dailyLogs.length}, goals=${goals.length}, games=${gameCount}`;

    return {
      name,
      ageRange: userProfile?.ageRange || personalOnboarding?.ageRange,
      primaryReason: userProfile?.primaryReason || personalOnboarding?.primaryNeed,
      preferredRhythm: userProfile?.preferredRhythm,
      district: district || undefined,
      recentMood: recentMood || undefined,
      topGoal: topGoal || undefined,
      nextLessonTitle: nextLesson?.title,
      nextActionLabel,
      nextActionRole,
      nextActionTab,
      tailoredTip,
      tailoredTipMl,
      statsSummary,
    };
  };

  const personalizationProfile = computePersonalizationProfile();

  const sendAiChatMessage = async (
    text: string,
    options?: { role?: AiChatRole; contextRef?: AiChatContextRef; sessionId?: string }
  ) => {
    const clean = text.trim();
    if (!clean) return;

    const targetRole: AiChatRole = options?.role || currentRole || 'home';
    const ctxRef = options?.contextRef || aiPendingContext || undefined;
    let targetId = options?.sessionId || activeAiSessionId;
    let currentSession = targetId ? aiChatSessions.find(s => s.id === targetId) : undefined;

    if (!currentSession) {
      const created = createNewAiSession(targetRole, ctxRef);
      targetId = created.id;
      currentSession = created;
    }

    const now = new Date().toISOString();
    const userMsg: AiChatMessage = {
      id: `msg_${Date.now()}_u`,
      sender: 'user',
      text: clean,
      timestamp: now,
      contextRef: ctxRef,
    };

    const historySnapshot = currentSession.messages.slice(-8).map(m => ({
      role: m.sender,
      text: m.text,
    }));

    setAiChatSessions(prev => {
      const updated = prev.map(s =>
        s.id === targetId
          ? {
              ...s,
              title: s.messages.length === 0 ? (ctxRef?.topicTitle ? ctxRef.topicTitle.slice(0, 42) : clean.slice(0, 42)) : s.title,
              updatedAt: now,
              messages: [...s.messages, userMsg],
            }
          : s
      );
      writeStorageItem(STORAGE_KEYS.AI_CHAT_SESSIONS, JSON.stringify(updated));
      return updated;
    });
    setAiPendingContext(null);
    setAiLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: clean,
          role: targetRole,
          language,
          history: historySnapshot,
          pageContext: ctxRef,
          personalization: {
            name: personalizationProfile.name,
            ageRange: personalizationProfile.ageRange,
            primaryReason: personalizationProfile.primaryReason,
            preferredRhythm: personalizationProfile.preferredRhythm,
            district: personalizationProfile.district,
            mood: personalizationProfile.recentMood,
            topGoal: personalizationProfile.topGoal,
            nextLessonTitle: personalizationProfile.nextLessonTitle,
            statsSummary: personalizationProfile.statsSummary,
          },
        }),
      });
      const data = await res.json();
      const assistantMsg: AiChatMessage = {
        id: `msg_${Date.now()}_a`,
        sender: 'assistant',
        text: String(data?.reply || 'Please try asking in a few words and I will help right away.'),
        timestamp: new Date().toISOString(),
        followUpSuggestions: Array.isArray(data?.followUpSuggestions) ? data.followUpSuggestions : undefined,
        suggestedAction: data?.suggestedAction || null,
        needsEmergencyHelp: Boolean(data?.needsEmergencyHelp),
        source: data?.source === 'gemini' ? 'gemini' : 'fallback',
      };
      setAiChatSessions(prev => {
        const updated = prev.map(s =>
          s.id === targetId
            ? {
                ...s,
                title: s.title === 'New Chat' && data?.titleSuggestion ? String(data.titleSuggestion).slice(0, 46) : s.title,
                updatedAt: assistantMsg.timestamp,
                messages: [...s.messages, assistantMsg],
              }
            : s
        );
        writeStorageItem(STORAGE_KEYS.AI_CHAT_SESSIONS, JSON.stringify(updated));
        return updated;
      });
    } catch {
      const fallbackMsg: AiChatMessage = {
        id: `msg_${Date.now()}_f`,
        sender: 'assistant',
        text:
          language === 'ml'
            ? 'ക്ഷമിക്കണം, കണക്ഷൻ ലഭിച്ചില്ല. അടിയന്തര സഹായത്തിന് 14405 അല്ലെങ്കിൽ 112 വിളിക്കുക.'
            : 'I could not reach the server right now. For urgent help anytime, call 14405 (Vimukthi) or 112.',
        timestamp: new Date().toISOString(),
        source: 'fallback',
      };
      setAiChatSessions(prev => {
        const updated = prev.map(s =>
          s.id === targetId
            ? { ...s, updatedAt: fallbackMsg.timestamp, messages: [...s.messages, fallbackMsg] }
            : s
        );
        writeStorageItem(STORAGE_KEYS.AI_CHAT_SESSIONS, JSON.stringify(updated));
        return updated;
      });
    } finally {
      setAiLoading(false);
    }
  };

  const openAiAssistant = (options?: {
    role?: AiChatRole;
    contextRef?: AiChatContextRef;
    initialQuestion?: string;
    newChat?: boolean;
    asDrawer?: boolean;
  }) => {
    const resolvedRole: AiChatRole = options?.role || currentRole || 'home';
    const existing = activeAiSessionId ? aiChatSessions.find(s => s.id === activeAiSessionId) : undefined;
    let sessionToUse = existing;

    if (options?.newChat || !sessionToUse || (options?.contextRef && sessionToUse.messages.length > 0)) {
      sessionToUse = createNewAiSession(resolvedRole, options?.contextRef);
    } else if (options?.contextRef) {
      setAiPendingContext(options.contextRef);
    }

    if (options?.asDrawer !== false) {
      setIsAiDrawerOpen(true);
    }

    if (options?.initialQuestion && options.initialQuestion.trim()) {
      void sendAiChatMessage(options.initialQuestion, {
        role: resolvedRole,
        contextRef: options?.contextRef,
        sessionId: sessionToUse.id,
      });
    }
  };

  const closeAiAssistant = () => setIsAiDrawerOpen(false);

  return (
    <AppContext.Provider
      value={{
        currentRole,
        setRole,
        portalMode,
        setPortalMode,
        serverAuthToken,
        serverAuthUser,
        setServerSession,
        clearServerSession,
        clientAssignments,
        clientAppointments,
        carePlanProposals,
        realtimeStatus,
        realtimeTick,
        refreshClientAssignments,
        language,
        setLanguage,
        themeMode,
        setThemeMode,
        toggleThemeMode,
        t,

        // Role 01
        personalOnboarding,
        savePersonalOnboarding,
        dailyLogs,
        addDailyLog,
        updateDailyLog,
        deleteDailyLog,
        calendarEvents,
        addCalendarEvent,
        updateCalendarEvent,
        deleteCalendarEvent,
        toggleCalendarEvent,
        goals,
        addGoal,
        updateGoal,
        deleteGoal,
        toggleMilestone,
        addGoalNote,
        gameStats,
        recordGameScore,
        toolCompletions,
        saveToolCompletion,
        substanceConcerns,
        saveSubstanceConcerns,
        upsertSubstanceConcern,
        removeSubstanceConcern,
        personalizedSupportPlan,
        savePersonalizedSupportPlan,
        recoveryReports,
        addRecoveryReport,
        opportunityProfile,
        saveOpportunityProfile,
        savedOpportunities,
        toggleOpportunitySave,
        opportunityApplications,
        addOpportunityApplication,
        updateOpportunityApplication,
        deleteOpportunityApplication,
        syncInterviewToCalendar,
        recoveryPassport,
        saveRecoveryPassport,
        personalDevProgress,
        togglePersonalDevStep,
        updateRecoveryStartDate,

        // Role 02 Supporter
        supporterOnboarding,
        saveSupporterOnboarding,
        supportPlans,
        addSupportPlan,
        updateSupportPlan,
        deleteSupportPlan,
        toggleSupportPlanTask,
        addSupportPlanTask,
        supporterEvents,
        addSupporterCalendarEvent,
        updateSupporterCalendarEvent,
        deleteSupporterCalendarEvent,
        toggleSupporterCalendarEvent,
        supporterReflections,
        addSupporterReflection,
        updateSupporterReflection,
        deleteSupporterReflection,
        savedConversationPlans,
        saveConversationPlan,
        deleteConversationPlan,
        completedEducationModuleIds,
        toggleCompletedEducationModule,

        // Role 03 Learner
        learnerOnboarding,
        saveLearnerOnboarding,
        completedLessonIds,
        toggleCompleteLesson,
        bookmarkedLessonIds,
        toggleBookmarkLesson,
        savedScenarioAttempts,
        saveScenarioAttempt,
        learnerEvents,
        addLearnerEvent,
        updateLearnerEvent,
        deleteLearnerEvent,
        toggleLearnerEvent,
        learnerJournalEntries,
        addLearnerJournalEntry,
        deleteLearnerJournalEntry,
        quizAttempts,
        saveQuizAttempt,
        learnerStudyDates,
        recordLearnerStudyDay,

        // Role 04 Community Builder
        communityOnboarding,
        saveCommunityOnboarding,
        communityOrg,
        updateCommunityOrg,
        communityMembers,
        addCommunityMember,
        updateCommunityMember,
        deleteCommunityMember,
        communityProgrammes,
        addCommunityProgramme,
        updateCommunityProgramme,
        deleteCommunityProgramme,
        communityEvents,
        addCommunityEvent,
        updateCommunityEvent,
        deleteCommunityEvent,
        communityTasks,
        addCommunityTask,
        updateCommunityTask,
        deleteCommunityTask,
        toggleCommunityTask,
        communityCampaigns,
        addCommunityCampaign,
        updateCommunityCampaign,
        deleteCommunityCampaign,
        communityFeedback,
        addCommunityFeedback,
        deleteCommunityFeedback,
        bookmarkedResourceIds,
        toggleBookmarkResource,

        // Clear Path AI: Auth & Profile
        userProfile,
        vaultScope,
        saveUserProfile,
        logoutUser,
        resetGuestVault,

        // Role 01: Motivation Anchor
        motivationAnchor,
        saveMotivationWhy,

        // Role 03: Learner Custom Plan & Certificate
        learnerCustomPlan,
        saveLearnerCustomPlan,
        togglePlanDayCompleted,
        learnerCertificate,
        issueLearnerCertificate,

        // Google Maps Platform Quota
        gmpQuotaExceeded,

        // ClearPath AI Connected Ecosystem
        triggerEntries,
        addTriggerEntry,
        deleteTriggerEntry,
        habitChallenges,
        toggleHabitChallengeDay,
        addHabitChallenge,
        earlyAssessments,
        saveEarlyAssessment,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        clearViewedNotifications,
        addNotification,
        timelineEvents,
        addTimelineEvent,
        dismissedIntroRoles,
        dismissRoleIntro,
        consentPrefs,
        updateConsentPrefs,
        missions,
        toggleMissionStep,
        addMission,
        exchangeItems,
        publishToExchange,
        adaptExchangeTemplate,

        // Shared & Backup
        supportCenters,
        savedCenterIds,
        toggleSaveCenter,
        careRelays,
        createCareRelay,
        updateCareRelayStatus,
        revokeCareRelayConsent,
        deleteCareRelay,
        sharedSupporterItems,
        shareItemWithSupporter,
        revokeSharedSupporterItem,
        exportBackup,
        importBackup,
        clearAllLocalData,

        // Unified Brief Personalized AI & Cross-Role Nav
        aiChatSessions,
        activeAiSessionId,
        isAiDrawerOpen,
        aiPendingContext,
        aiLoading,
        personalizationProfile,
        openAiAssistant,
        closeAiAssistant,
        clearAiPendingContext,
        createNewAiSession,
        selectAiSession,
        deleteAiSession,
        clearAllAiSessions,
        sendAiChatMessage,
        registerRoleTabNavigator,
        navigateToRoleTab,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
