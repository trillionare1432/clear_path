import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import { useApp } from '../context/AppContext';
import { PERMISSION_CATEGORY_META } from '../constants/substanceCatalogue';
import {
  AppointmentNoteClient,
  CalendarEvent,
  CarePlanProposalClient,
  CarePlanRevisionClient,
  ClinicalNoteTypeClient,
  CompactAiRecommendationBar,
  DailyLog,
  EarlySupportAssessment,
  EventCategory,
  Goal,
  GoalCategory,
  PermissionCategory,
  PermissionGrantRecord,
  PersonalizedSupportPlanRecord,
  RecoveryReportRecord,
  ReferralCategoryClient,
  SecureMessageClient,
  ServerAuthUser,
  SharedReportRecordClient,
  SubstanceConcernRecord,
  TherapistAccessCodeClient,
  TherapistAssignmentRecord,
  TherapistAttentionItem,
  TherapistAvailabilityStatus,
  TherapistClinicalNoteClient,
  TherapistConnectionRecord,
  TherapistInvitationRecord,
  TherapistReferralClient,
  TherapistWorkScopeClient,
  UnifiedDirectoryItem,
  WeeklyProgressSubmissionClient,
} from '../types';
import {
  TherapistAttentionPanel,
  CompactAiRecommendationBarView,
} from '../components/TherapistAttentionPanel';
import { CarePlanProposalPanel } from '../components/CarePlanProposalPanel';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Copy,
  Download,
  FileLock2,
  FileText,
  History,
  KeyRound,
  Lock,
  LogOut,
  MessageSquare,
  Moon,
  Pencil,
  PhoneForwarded,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Sun,
  Target,
  Trash2,
  Unlock,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { ClearPathLogo } from '../components/ClearPathLogo';
import { copyPhoneToClipboard } from '../utils/clipboard';

type DashboardSection =
  | 'overview'
  | 'cases'
  | 'case_details'
  | 'support_plans'
  | 'messages'
  | 'schedule_reports';
type Role1SubTab = 'logs' | 'goals' | 'calendar' | 'substances' | 'clinical_vault' | 'care_tools';

interface Role1UserOverviewItem {
  id: string;
  username: string;
  name: string;
  email?: string;
  district: string;
  ageRange: string;
  isYouth?: boolean;
  verificationStatus: string;
  createdAt: string;
  updatedAt?: string;
  isConnected: boolean;
  connectionId: string | null;
  logsCount: number;
  unreviewedLogsCount: number;
  lastLogDate: string | null;
  latestMood: string | null;
  goalsCount: number;
  activeGoalsCount: number;
  completedGoalsCount: number;
  calendarEventsCount: number;
  upcomingEventsCount: number;
  missedEventsCount?: number;
  missedAppointmentsCount?: number;
  substancesCount: number;
  unverifiedSubstancesCount: number;
  substanceNames: string[];
  hasSupportPlan: boolean;
  carePlanStatus?: string | null;
  reviewDate: string | null;
  hasUpcomingReview?: boolean;
}

interface Role1OverviewTotals {
  totalUsers: number;
  activeJourneys: number;
  totalLogs: number;
  unreviewedLogs: number;
  totalGoals: number;
  completedGoals: number;
  totalEvents: number;
  unverifiedSubstances: number;
  youthClientsCount?: number;
  overdueFollowUpsCount?: number;
  upcomingReviewsCount?: number;
}

interface SelectedClientBundle {
  profile: ServerAuthUser;
  connection: TherapistConnectionRecord | null;
  dailyLogs: DailyLog[];
  goals: Goal[];
  calendarEvents: CalendarEvent[];
  earlyAssessments: EarlySupportAssessment[];
  substanceConcerns: SubstanceConcernRecord[];
  supportPlan: PersonalizedSupportPlanRecord | null;
  assignments: TherapistAssignmentRecord[];
  weeklyProgress: WeeklyProgressSubmissionClient[];
  recoveryReports?: RecoveryReportRecord[];
  appointmentNotes: AppointmentNoteClient[];
  messages: SecureMessageClient[];
  reports: SharedReportRecordClient[];
  clinicalNotes?: TherapistClinicalNoteClient[];
  carePlanRevisions?: CarePlanRevisionClient[];
  carePlanProposals?: CarePlanProposalClient[];
  referrals?: TherapistReferralClient[];
  activePermissions?: PermissionCategory[];
  withheldCategories?: PermissionCategory[];
  permissionGrant?: PermissionGrantRecord | null;
  followUpSummary?: {
    missedCalendarActivities?: CalendarEvent[];
    missedOrOverdueEvents: CalendarEvent[];
    overdueGoals: Goal[];
    missedAssignments?: TherapistAssignmentRecord[];
    pendingAssignments: TherapistAssignmentRecord[];
    upcomingAppointments?: AppointmentNoteClient[];
    missedAppointments?: AppointmentNoteClient[];
    recentDifficultDays: DailyLog[] | number;
  };
  measurableIndicators?: {
    goalCompletionPct: number | null;
    completedGoalsCount: number;
    totalGoalsCount: number;
    checkInConsistency7dPct: number;
    uniqueCheckInDays7d: number;
    appointmentAttendancePct: number | null;
    completedAppointmentsCount: number;
    missedAppointmentsCount: number;
    calendarCompletionPct: number | null;
    moodTrendComparison: {
      recent7dPositivePct: number | null;
      prior7dPositivePct: number | null;
      recent7dCount: number;
      prior7dCount: number;
    };
  };
}

const CLINICAL_NOTE_TYPE_OPTIONS: { id: ClinicalNoteTypeClient; label: string }[] = [
  { id: 'session', label: 'Session Observation' },
  { id: 'assessment', label: 'Intake Assessment' },
  { id: 'observation', label: 'Progress Interpretation' },
  { id: 'safeguarding', label: 'Risk & Safety / Safeguarding' },
  { id: 'care_plan_discussion', label: 'Care Plan Rationale' },
  { id: 'referral', label: 'Referral Documentation' },
  { id: 'follow_up', label: 'Follow-Up Reminder' },
];

const REFERRAL_CATEGORY_OPTIONS: { id: ReferralCategoryClient; label: string }[] = [
  { id: 'de_addiction', label: 'De-Addiction / Vimukthi Care' },
  { id: 'mental_health', label: 'Mental Health / Psychiatry' },
  { id: 'medical', label: 'Medical Evaluation' },
  { id: 'rehab', label: 'Rehabilitation & Residential' },
  { id: 'family_support', label: 'Family Counselling' },
  { id: 'emergency', label: 'Emergency / Crisis Support' },
];

const VERIFICATION_STATUS_META: Record<
  string,
  { title: string; summary: string; canUnlock: boolean }
> = {
  registration_incomplete: {
    title: 'Registration Incomplete — Verification Required',
    summary:
      'Your clinician account is saved as an incomplete draft. Use your restricted verification code below to enter immediately, or complete your council license credentials for administrator review.',
    canUnlock: true,
  },
  submitted: {
    title: 'Pending Verification — Clinician Application Submitted',
    summary:
      'Your clinician registration has been recorded and is waiting for approval. Verified restricted therapists can enter their lowercase access code directly below to enter the dashboard.',
    canUnlock: true,
  },
  pending_verification: {
    title: 'Pending Administrator Verification',
    summary:
      'Your credentials are currently queued for review. Client records stay protected until verification is complete. Restricted therapists with an access code can verify below.',
    canUnlock: true,
  },
  rejected: {
    title: 'Verification Needs Attention',
    summary:
      'Your previous verification submission was returned by an administrator. Review any notes or use a valid restricted clinician code if authorized.',
    canUnlock: true,
  },
  suspended: {
    title: 'Clinical Access Suspended',
    summary:
      'This account is temporarily suspended by a Platform Administrator and cannot unlock client workspaces until reinstated.',
    canUnlock: false,
  },
};

const GOAL_CATEGORY_OPTIONS: { id: GoalCategory; label: string }[] = [
  { id: 'routine', label: 'Daily Routine' },
  { id: 'physical', label: 'Physical Health & Sleep' },
  { id: 'personal', label: 'Personal Recovery' },
  { id: 'education', label: 'Education & Study' },
  { id: 'career', label: 'Work & Career' },
  { id: 'family', label: 'Family & Home' },
  { id: 'social', label: 'Social Boundaries' },
  { id: 'creative', label: 'Creative & Focus' },
];

const EVENT_CATEGORY_OPTIONS: { id: EventCategory; label: string }[] = [
  { id: 'appointment', label: 'Clinical / Support Session' },
  { id: 'healthy_activity', label: 'Healthy Routine Activity' },
  { id: 'personal_goal', label: 'Goal Check-In' },
  { id: 'learning', label: 'Learning / CBT Practice' },
  { id: 'supporter_meeting', label: 'Family / Supporter Check-In' },
  { id: 'reflection', label: 'Evening Reflection' },
  { id: 'other', label: 'Other' },
];

const MOOD_LABELS: Record<string, string> = {
  peaceful: 'Peaceful',
  steady: 'Steady',
  hopeful: 'Hopeful',
  challenged: 'Challenged',
  restless: 'Restless',
  tired: 'Tired',
  heavy: 'Heavy',
  difficult: 'Difficult',
};

const AGE_LABELS: Record<string, string> = {
  youth: '13–17 (Youth)',
  young_adult: '18–25 (Young Adult)',
  adult: '26–54 (Adult)',
  senior: '55+ (Senior)',
};

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const WEEKDAYS_MON = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const TherapistDashboardView: React.FC = () => {
  const {
    serverAuthToken,
    serverAuthUser,
    setServerSession,
    clearServerSession,
    setPortalMode,
    themeMode,
    toggleThemeMode,
    realtimeTick,
  } = useApp();

  const isNight = themeMode === 'night';

  const isTherapistSession = Boolean(
    serverAuthToken && serverAuthUser && serverAuthUser.role === 'therapist'
  );
  const isApproved = Boolean(
    isTherapistSession && serverAuthUser?.verificationStatus === 'approved'
  );

  // Unauthenticated inline clinician sign-in / registration form state
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [loginUsername, setLoginUsername] = useState('');
  const [loginQuickCode, setLoginQuickCode] = useState('');
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regSpec, setRegSpec] = useState('Addiction Recovery & CBT');
  const [regLicense, setRegLicense] = useState('');
  const [regDistrict, setRegDistrict] = useState('Ernakulam');
  const [regQuickCode, setRegQuickCode] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  // Restricted quick verification code box ('iamtherapist')
  const [quickCode, setQuickCode] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  // Global feedback banners
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Dashboard navigation
  const [section, setSection] = useState<DashboardSection>('overview');
  const [clientSubTab, setClientSubTab] = useState<Role1SubTab>('logs');

  // Real Role 01 overview + roster state
  const [overviewUsers, setOverviewUsers] = useState<Role1UserOverviewItem[]>([]);
  const [totals, setTotals] = useState<Role1OverviewTotals>({
    totalUsers: 0,
    activeJourneys: 0,
    totalLogs: 0,
    unreviewedLogs: 0,
    totalGoals: 0,
    completedGoals: 0,
    totalEvents: 0,
    unverifiedSubstances: 0,
  });
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [rosterSearch, setRosterSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'needs_review'>('all');

  // Selected client full Role 01 bundle
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [clientBundle, setClientBundle] = useState<SelectedClientBundle | null>(null);
  const [loadingClient, setLoadingClient] = useState(false);

  // Journal & progress log filters + review note drafts
  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState<'all' | 'needs_review' | 'challenged' | 'detailed'>('all');
  const [logTimeframe, setLogTimeframe] = useState<'all' | '7d' | '30d' | 'custom'>('all');
  const [logDateFrom, setLogDateFrom] = useState('');
  const [logDateTo, setLogDateTo] = useState('');
  const [logReviewDrafts, setLogReviewDrafts] = useState<Record<string, string>>({});
  const [editingLogReviewId, setEditingLogReviewId] = useState<string | null>(null);

  // Goal creation & editing state
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDesc, setGoalDesc] = useState('');
  const [goalCategory, setGoalCategory] = useState<GoalCategory>('routine');
  const [goalFrequency, setGoalFrequency] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [goalMilestonesInput, setGoalMilestonesInput] = useState('');
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editGoalDraft, setEditGoalDraft] = useState<{
    title: string;
    description: string;
    category: GoalCategory;
    frequency: 'daily' | 'weekly' | 'custom';
    targetDate: string;
    therapistChangeNote: string;
  }>({
    title: '',
    description: '',
    category: 'routine',
    frequency: 'daily',
    targetDate: '',
    therapistChangeNote: '',
  });
  const [milestoneInputs, setMilestoneInputs] = useState<Record<string, string>>({});
  const [goalNoteInputs, setGoalNoteInputs] = useState<Record<string, string>>({});
  const [confirmDeleteGoalId, setConfirmDeleteGoalId] = useState<string | null>(null);

  // Support Plan editing state
  const [planObjectivesText, setPlanObjectivesText] = useState('');
  const [planSupportNeedsText, setPlanSupportNeedsText] = useState('');
  const [planApproachesText, setPlanApproachesText] = useState('');
  const [planInterventionsText, setPlanInterventionsText] = useState('');
  const [planNextStepsText, setPlanNextStepsText] = useState('');
  const [planGuidanceText, setPlanGuidanceText] = useState('');
  const [planProgressObsText, setPlanProgressObsText] = useState('');
  const [planTherapistName, setPlanTherapistName] = useState('');
  const [planCareStatus, setPlanCareStatus] = useState<'active' | 'under_review' | 'paused' | 'completed'>('active');
  const [planReviewDate, setPlanReviewDate] = useState('');
  const [planNextFollowUpDate, setPlanNextFollowUpDate] = useState('');
  const [savingPlan, setSavingPlan] = useState(false);

  // Client Calendar & Appointment Management state
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [selectedCalDate, setSelectedCalDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newEvtTitle, setNewEvtTitle] = useState('');
  const [newEvtTime, setNewEvtTime] = useState('10:30');
  const [newEvtCategory, setNewEvtCategory] = useState<EventCategory>('appointment');
  const [newEvtNotes, setNewEvtNotes] = useState('');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEventDraft, setEditEventDraft] = useState<{
    title: string;
    date: string;
    startTime: string;
    category: EventCategory;
    notes: string;
    therapistChangeNote: string;
  }>({
    title: '',
    date: todayISO,
    startTime: '',
    category: 'appointment',
    notes: '',
    therapistChangeNote: '',
  });
  const [apptTime, setApptTime] = useState('11:00');
  const [apptNoteText, setApptNoteText] = useState('');
  const [apptNextSteps, setApptNextSteps] = useState('');
  const [apptFollowUpDate, setApptFollowUpDate] = useState('');
  const [savingAppt, setSavingAppt] = useState(false);
  const [apptOutcomeDrafts, setApptOutcomeDrafts] = useState<Record<string, string>>({});

  // Substance review & creation state
  const [substanceReviewDrafts, setSubstanceReviewDrafts] = useState<Record<string, string>>({});
  const [newSubName, setNewSubName] = useState('');
  const [newSubNote, setNewSubNote] = useState('');
  const [newSubIsMed, setNewSubIsMed] = useState(false);

  // Assignments & Messages (for connected clients)
  const [assignTitle, setAssignTitle] = useState('');
  const [assignType, setAssignType] = useState<'cbt_exercise' | 'goal' | 'weekly_plan'>('cbt_exercise');
  const [assignInstructions, setAssignInstructions] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');
  const [msgText, setMsgText] = useState('');
  const [weeklyReplyDrafts, setWeeklyReplyDrafts] = useState<Record<string, string>>({});

  // User Management: Add / Edit Patient state
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addDistrict, setAddDistrict] = useState('Ernakulam');
  const [addAgeRange, setAddAgeRange] = useState('young_adult');
  const [addConcern, setAddConcern] = useState('');
  const [addGoal, setAddGoal] = useState('');
  const [addNote, setAddNote] = useState('');
  const [addingPatient, setAddingPatient] = useState(false);

  const [editingProfileUserId, setEditingProfileUserId] = useState<string | null>(null);
  const [editProfileName, setEditProfileName] = useState('');
  const [editProfileDistrict, setEditProfileDistrict] = useState('');
  const [editProfileAge, setEditProfileAge] = useState('young_adult');

  // Invitations & Consent state
  const [invitations, setInvitations] = useState<TherapistInvitationRecord[]>([]);
  const [incomingConnections, setIncomingConnections] = useState<TherapistConnectionRecord[]>([]);
  const [inviteContact, setInviteContact] = useState('');
  const [invitePurpose, setInvitePurpose] = useState(
    'Collaborative recovery support, daily log review, and goal coordination'
  );
  const [invitePerms, setInvitePerms] = useState<PermissionCategory[]>([
    'background',
    'substances',
    'goals',
    'weekly_reports',
    'assignments',
    'appointments',
  ]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Downloadable / Printable Patient Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTimeframe, setReportTimeframe] = useState<'session' | '7d' | '30d' | 'all' | 'custom'>('30d');
  const [reportFrom, setReportFrom] = useState(() => new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
  const [reportTo, setReportTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportSections, setReportSections] = useState({
    objectiveMetrics: true,
    dailyLogs: true,
    supportPlan: true,
    clinicianGuidance: true,
  });

  // Confidential Clinical Notes Vault State (strictly clinician-only)
  const [noteType, setNoteType] = useState<ClinicalNoteTypeClient>('session');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteFollowUpDate, setNoteFollowUpDate] = useState('');
  const [savingClinicalNote, setSavingClinicalNote] = useState(false);
  const [editingClinicalNoteId, setEditingClinicalNoteId] = useState<string | null>(null);
  const [editClinicalNoteDraft, setEditClinicalNoteDraft] = useState<{
    noteType: ClinicalNoteTypeClient;
    title: string;
    content: string;
    followUpDate: string;
  }>({
    noteType: 'session',
    title: '',
    content: '',
    followUpDate: '',
  });
  const [savingEditClinicalNote, setSavingEditClinicalNote] = useState(false);

  // Care Plan Revision History Accordion
  const [showPlanRevisions, setShowPlanRevisions] = useState(false);

  // Referrals & Urgent Escalation State
  const [refTarget, setRefTarget] = useState('');
  const [refUrgency, setRefUrgency] = useState<'routine' | 'priority' | 'urgent_escalation'>('routine');
  const [refCategory, setRefCategory] = useState<ReferralCategoryClient>('de_addiction');
  const [refDate, setRefDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [refReason, setRefReason] = useState('');
  const [refFollowUp, setRefFollowUp] = useState('');
  const [savingReferral, setSavingReferral] = useState(false);
  const [refFollowUpNotesDrafts, setRefFollowUpNotesDrafts] = useState<Record<string, string>>({});

  // Attention Engine, Clinician Availability & Verified Phone, Plan Proposal Seed
  const [attentionQueue, setAttentionQueue] = useState<TherapistAttentionItem[]>([]);
  const [availStatus, setAvailStatus] = useState<TherapistAvailabilityStatus>(
    serverAuthUser?.availabilityStatus || 'available'
  );
  const [availHours, setAvailHours] = useState(
    serverAuthUser?.availabilityHours || 'Mon-Sat, 9:30 AM - 5:30 PM'
  );
  const [nextSlot, setNextSlot] = useState(serverAuthUser?.nextAvailableSlot || '');
  const [savingAvail, setSavingAvail] = useState(false);
  const [therPhone, setTherPhone] = useState(serverAuthUser?.contactPhone || '');
  const [confirmPhoneOwn, setConfirmPhoneOwn] = useState(false);
  const [whatsappOptIn, setWhatsappOptIn] = useState(serverAuthUser?.whatsappOptIn !== false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);
  const [proposalDraftSeed, setProposalDraftSeed] = useState<{
    title?: string;
    objectives?: string[];
    routines?: string[];
    recommendations?: string[];
    rationale?: string;
  } | null>(null);
  const [directoryServices, setDirectoryServices] = useState<UnifiedDirectoryItem[]>([]);
  const [requestInfoCat, setRequestInfoCat] = useState<PermissionCategory>('cbt_reflections');
  const [requestingInfo, setRequestingInfo] = useState(false);

  // Therapist Custom Access Codes & Admin-assigned Work Scope
  const [customAccessCodes, setCustomAccessCodes] = useState<TherapistAccessCodeClient[]>([]);
  const [workScope, setWorkScope] = useState<TherapistWorkScopeClient | null>(
    serverAuthUser?.workScope || null
  );
  const [newCodeLabel, setNewCodeLabel] = useState('');
  const [newCodeValue, setNewCodeValue] = useState('');
  const [savingAccessCode, setSavingAccessCode] = useState(false);
  const [editingCodeId, setEditingCodeId] = useState<string | null>(null);
  const [editCodeLabel, setEditCodeLabel] = useState('');
  const [editCodeValue, setEditCodeValue] = useState('');

  // AI Clinician Assist State
  const [aiAssistBusy, setAiAssistBusy] = useState(false);
  const [aiAssistResult, setAiAssistResult] = useState<{
    progressSummary?: string;
    synthesisSummary?: string;
    moodAndWellbeingTrend?: string;
    focusAreas?: string[];
    missedActivityFollowUps?: string[];
    carePlanGaps?: string[];
    appointmentPrepQuestions?: string[];
    sessionAgendaPrompts?: string[];
    draftActivities?: { title: string; purpose: string }[];
    compactRecommendationBar?: CompactAiRecommendationBar;
    cautionsAndSafeguards?: string[];
    clinicalBoundaryDisclaimer?: string;
    nonDiagnosticReminder?: string;
  } | null>(null);

  // =========================================================
  // DATA LOADERS (STRICTLY AUTHENTICATED + APPROVED)
  // =========================================================
  const loadOverviewAndInvites = useCallback(async () => {
    if (!serverAuthToken || !isApproved) return;
    setLoadingOverview(true);
    try {
      const [ovRes, wsRes, dirRes, codeRes] = await Promise.all([
        fetch('/api/therapist/role1/overview', {
          headers: { Authorization: `Bearer ${serverAuthToken}` },
        }),
        fetch('/api/care/workspace', {
          headers: { Authorization: `Bearer ${serverAuthToken}` },
        }),
        fetch('/api/directory/unified'),
        fetch('/api/therapists/access-codes', {
          headers: { Authorization: `Bearer ${serverAuthToken}` },
        }),
      ]);
      if (ovRes.ok) {
        const ovData = await ovRes.json();
        const users: Role1UserOverviewItem[] = Array.isArray(ovData.users) ? ovData.users : [];
        setOverviewUsers(users);
        if (ovData.totals) setTotals(ovData.totals);
        if (ovData.workScope) setWorkScope(ovData.workScope);
        setAttentionQueue(Array.isArray(ovData.attentionQueue) ? ovData.attentionQueue : []);
        setSelectedUserId(prev => {
          if (prev && users.some(u => u.id === prev)) return prev;
          return users[0]?.id || null;
        });
      }
      if (wsRes.ok) {
        const wsData = await wsRes.json();
        setInvitations(Array.isArray(wsData.invitations) ? wsData.invitations : []);
        const conns: TherapistConnectionRecord[] = Array.isArray(wsData.connections)
          ? wsData.connections
          : [];
        setIncomingConnections(conns.filter(c => c.status === 'pending'));
      }
      if (dirRes.ok) {
        const dirData = await dirRes.json();
        setDirectoryServices(Array.isArray(dirData.items) ? dirData.items : []);
      }
      if (codeRes.ok) {
        const codeData = await codeRes.json();
        setCustomAccessCodes(Array.isArray(codeData.accessCodes) ? codeData.accessCodes : []);
        if (codeData.workScope) setWorkScope(codeData.workScope);
      }
    } catch {
      setError('Network error while loading clinician workspace.');
    } finally {
      setLoadingOverview(false);
    }
  }, [serverAuthToken, isApproved]);

  const loadSelectedClient = useCallback(
    async (userId: string) => {
      if (!serverAuthToken || !isApproved || !userId) return;
      setLoadingClient(true);
      try {
        const res = await fetch(`/api/therapist/role1/users/${userId}`, {
          headers: { Authorization: `Bearer ${serverAuthToken}` },
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Could not load client Role 01 workspace.');
          return;
        }
        setClientBundle(data);
        const plan: PersonalizedSupportPlanRecord | null = data.supportPlan || null;
        setPlanObjectivesText((plan?.objectives || []).join('\n'));
        setPlanSupportNeedsText((plan?.supportNeeds || []).join('\n'));
        setPlanApproachesText((plan?.approaches || []).join(', '));
        setPlanInterventionsText((plan?.interventions || []).join('\n'));
        setPlanNextStepsText((plan?.nextSteps || []).join('\n'));
        setPlanGuidanceText(plan?.professionalGuidance || '');
        setPlanProgressObsText(plan?.progressObservations || '');
        setPlanTherapistName(plan?.responsibleTherapistName || serverAuthUser?.name || '');
        setPlanCareStatus(plan?.carePlanStatus || 'active');
        setPlanReviewDate(
          plan?.reviewDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
        );
        setPlanNextFollowUpDate(plan?.nextFollowUpDate || '');
      } catch {
        setError('Unable to fetch client journey details.');
      } finally {
        setLoadingClient(false);
      }
    },
    [serverAuthToken, isApproved, serverAuthUser?.name]
  );

  useEffect(() => {
    if (isApproved) {
      loadOverviewAndInvites();
    }
  }, [isApproved, loadOverviewAndInvites]);

  useEffect(() => {
    if (isApproved && selectedUserId) {
      loadSelectedClient(selectedUserId);
    } else {
      setClientBundle(null);
    }
  }, [isApproved, selectedUserId, loadSelectedClient]);

  useEffect(() => {
    if (isApproved && realtimeTick > 0) {
      loadOverviewAndInvites();
      if (selectedUserId) {
        loadSelectedClient(selectedUserId);
      }
    }
  }, [realtimeTick, isApproved, selectedUserId, loadOverviewAndInvites, loadSelectedClient]);

  const handleSaveAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverAuthToken) return;
    setSavingAvail(true);
    setError(null);
    try {
      const res = await fetch('/api/therapists/availability', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify({
          availabilityStatus: availStatus,
          availabilityHours: availHours.trim(),
          nextAvailableSlot: nextSlot.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not update availability.');
        return;
      }
      if (data.user) setServerSession(serverAuthToken, data.user);
      setNotice(`Live availability updated to "${availStatus}".`);
    } catch {
      setError('Network error updating availability.');
    } finally {
      setSavingAvail(false);
    }
  };

  const handleVerifyPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverAuthToken) return;
    setVerifyingPhone(true);
    setError(null);
    try {
      const res = await fetch('/api/therapists/verify-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify({
          contactPhone: therPhone.trim(),
          confirmOwnership: confirmPhoneOwn,
          whatsappOptIn,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not verify clinician phone.');
        return;
      }
      if (data.user) setServerSession(serverAuthToken, data.user);
      setNotice('Clinician contact phone verified and synced with directory.');
    } catch {
      setError('Network error verifying phone.');
    } finally {
      setVerifyingPhone(false);
    }
  };

  const handleCreateAccessCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverAuthToken || !newCodeLabel.trim() || !newCodeValue.trim()) return;
    setSavingAccessCode(true);
    setError(null);
    try {
      const res = await fetch('/api/therapists/access-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify({
          label: newCodeLabel.trim(),
          code: newCodeValue.trim().toLowerCase(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not add custom access code.');
        return;
      }
      setCustomAccessCodes(Array.isArray(data.accessCodes) ? data.accessCodes : []);
      setNewCodeLabel('');
      setNewCodeValue('');
      setNotice('Custom quick-access code created. You can sign in directly with it anytime.');
    } catch {
      setError('Network error saving access code.');
    } finally {
      setSavingAccessCode(false);
    }
  };

  const handleUpdateAccessCode = async (
    codeId: string,
    payload: { label?: string; code?: string; active?: boolean }
  ) => {
    if (!serverAuthToken) return;
    setError(null);
    const res = await fetch(`/api/therapists/access-codes/${codeId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not update access code.');
      return;
    }
    setCustomAccessCodes(Array.isArray(data.accessCodes) ? data.accessCodes : []);
    setEditingCodeId(null);
    setNotice('Access code updated.');
  };

  const handleDeleteAccessCode = async (codeId: string) => {
    if (!serverAuthToken) return;
    setError(null);
    const res = await fetch(`/api/therapists/access-codes/${codeId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${serverAuthToken}` },
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not remove access code.');
      return;
    }
    setCustomAccessCodes(Array.isArray(data.accessCodes) ? data.accessCodes : []);
    setNotice('Custom access code removed.');
  };

  // =========================================================
  // AUTHENTICATION & 'iamtherapist' QUICK-UNLOCK HANDLERS
  // =========================================================
  const handleGateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const cleanName = loginUsername.trim();
    const cleanCode = loginQuickCode.trim();
    if (cleanName.length < 2 || !cleanCode) {
      setError('Please enter Clinician Name or Username and Quick Access Code.');
      return;
    }
    setAuthBusy(true);
    try {
      const res = await fetch('/api/auth/therapist-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: cleanName,
          name: cleanName,
          authorityCode: cleanCode,
          seedSamplePatients: false,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid clinician name or quick access code.');
        return;
      }
      if (data.user?.role !== 'therapist') {
        setError('This portal is restricted to therapist accounts. Please sign in with a clinician account.');
        return;
      }
      setServerSession(data.token, data.user);
      setLoginQuickCode('');
    } catch {
      setError('Network error while signing in.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleGateRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!regName.trim() || regUsername.trim().length < 3 || regPassword.length < 6) {
      setError('Full name, username (min 3 chars), and password (min 6 chars) are required.');
      return;
    }
    setAuthBusy(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          username: regUsername.trim().toLowerCase(),
          password: regPassword,
          role: 'therapist',
          professionalCategory: 'clinical_psychologist',
          licenseNumber: regLicense.trim() || undefined,
          specialization: regSpec.trim() || 'Addiction Recovery & CBT',
          district: regDistrict.trim() || 'Ernakulam',
          saveDraft: !regLicense.trim() && !regQuickCode.trim(),
          quickCode: regQuickCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not create clinician account.');
        return;
      }
      setServerSession(data.token, data.user);
      setRegPassword('');
      setRegQuickCode('');
      setNotice(
        data.user?.verificationStatus === 'approved'
          ? 'Restricted therapist verification accepted. Welcome to your Clinical Dashboard.'
          : 'Account created. Enter your verification code below to enter the dashboard.'
      );
    } catch {
      setError('Network error during registration.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleQuickUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!quickCode || /\s/.test(quickCode) || quickCode !== quickCode.toLowerCase()) {
      setError('Enter the exact lowercase verification code with zero spaces.');
      return;
    }

    if (!serverAuthToken) {
      setError('Active therapist session required.');
      return;
    }

    setUnlocking(true);
    try {
      const res = await fetch('/api/auth/therapist-unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify({ code: quickCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid verification code.');
        return;
      }
      setServerSession(serverAuthToken, data.user);
      setQuickCode('');
      setNotice('Verified. Welcome to your ClearPath Clinical Dashboard.');
    } catch {
      setError('Unable to verify code right now. Please retry.');
    } finally {
      setUnlocking(false);
    }
  };

  // =========================================================
  // ROLE 01 CLIENT MUTATION HANDLERS
  // =========================================================
  const refreshAllForClient = async (userId: string) => {
    await Promise.all([loadOverviewAndInvites(), loadSelectedClient(userId)]);
  };

  const handleSaveLogReview = async (logId: string) => {
    if (!serverAuthToken || !selectedUserId) return;
    const note = (logReviewDrafts[logId] || '').trim();
    if (!note) {
      setError('Please enter clinician feedback before saving.');
      return;
    }
    setError(null);
    const res = await fetch(`/api/therapist/role1/users/${selectedUserId}/logs/${logId}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({ clinicianReviewNote: note }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to save log review.');
      return;
    }
    setEditingLogReviewId(null);
    setNotice('Clinician guidance note saved and synced to the client Daily Log.');
    await refreshAllForClient(selectedUserId);
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverAuthToken || !selectedUserId || !goalTitle.trim()) return;
    setError(null);
    const milestones = goalMilestonesInput
      .split(/\n|,/)
      .map(s => s.trim())
      .filter(Boolean);
    const res = await fetch(`/api/therapist/role1/users/${selectedUserId}/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({
        title: goalTitle.trim(),
        description: goalDesc.trim(),
        category: goalCategory,
        frequency: goalFrequency,
        targetDate: goalTargetDate || undefined,
        milestones,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not create Role 01 goal.');
      return;
    }
    setGoalTitle('');
    setGoalDesc('');
    setGoalTargetDate('');
    setGoalMilestonesInput('');
    setShowGoalForm(false);
    setNotice('Goal added directly to the client Recover & Rebuild plan.');
    await refreshAllForClient(selectedUserId);
  };

  const handlePatchGoal = async (
    goalId: string,
    payload: Record<string, unknown>,
    successText?: string
  ) => {
    if (!serverAuthToken || !selectedUserId) return;
    setError(null);
    const res = await fetch(`/api/therapist/role1/users/${selectedUserId}/goals/${goalId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Could not update goal.');
      return;
    }
    if (successText) setNotice(successText);
    await refreshAllForClient(selectedUserId);
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!serverAuthToken || !selectedUserId) return;
    const res = await fetch(`/api/therapist/role1/users/${selectedUserId}/goals/${goalId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${serverAuthToken}` },
    });
    if (res.ok) {
      setConfirmDeleteGoalId(null);
      setNotice('Goal removed.');
      await refreshAllForClient(selectedUserId);
    }
  };

  const handleSaveSupportPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverAuthToken || !selectedUserId) return;
    setSavingPlan(true);
    setError(null);
    const res = await fetch(`/api/therapist/role1/users/${selectedUserId}/plan`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({
        objectives: planObjectivesText
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean),
        supportNeeds: planSupportNeedsText
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean),
        approaches: planApproachesText
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        interventions: planInterventionsText
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean),
        nextSteps: planNextStepsText
          .split('\n')
          .map(s => s.trim())
          .filter(Boolean),
        professionalGuidance: planGuidanceText.trim(),
        progressObservations: planProgressObsText.trim(),
        responsibleTherapistName: planTherapistName.trim() || serverAuthUser?.name,
        carePlanStatus: planCareStatus,
        reviewDate: planReviewDate,
        nextFollowUpDate: planNextFollowUpDate || undefined,
      }),
    });
    setSavingPlan(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Could not update support plan.');
      return;
    }
    setNotice('Role 01 Care Plan updated and synced.');
    await refreshAllForClient(selectedUserId);
  };

  const handleAddCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverAuthToken || !selectedUserId || !newEvtTitle.trim()) return;
    setError(null);
    const res = await fetch(`/api/therapist/role1/users/${selectedUserId}/calendar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({
        title: newEvtTitle.trim(),
        date: selectedCalDate,
        startTime: newEvtTime || undefined,
        category: newEvtCategory,
        notes: newEvtNotes.trim() || undefined,
        reminder: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not add calendar event.');
      return;
    }
    setNewEvtTitle('');
    setNewEvtNotes('');
    setNotice(`Scheduled "${data.event.title}" onto client calendar (${selectedCalDate}).`);
    await refreshAllForClient(selectedUserId);
  };

  const handlePatchCalendarEvent = async (
    eventId: string,
    payload: Record<string, unknown>,
    successText?: string
  ) => {
    if (!serverAuthToken || !selectedUserId) return;
    const res = await fetch(`/api/therapist/role1/users/${selectedUserId}/calendar/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      if (successText) setNotice(successText);
      setEditingEventId(null);
      await refreshAllForClient(selectedUserId);
    }
  };

  const handleDeleteCalendarEvent = async (eventId: string) => {
    if (!serverAuthToken || !selectedUserId) return;
    const res = await fetch(`/api/therapist/role1/users/${selectedUserId}/calendar/${eventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${serverAuthToken}` },
    });
    if (res.ok) {
      setNotice('Calendar entry removed.');
      await refreshAllForClient(selectedUserId);
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverAuthToken || !selectedUserId || !apptNoteText.trim()) return;
    setSavingAppt(true);
    setError(null);
    try {
      const res = await fetch('/api/care/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify({
          clientId: selectedUserId,
          appointmentDate: selectedCalDate,
          appointmentTime: apptTime || undefined,
          noteText: apptNoteText.trim(),
          agreedNextSteps: apptNextSteps.trim() || undefined,
          followUpReminderDate: apptFollowUpDate || undefined,
          status: 'upcoming',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not schedule clinical appointment.');
        return;
      }
      setApptNoteText('');
      setApptNextSteps('');
      setApptFollowUpDate('');
      setNotice(`Clinical appointment scheduled for ${selectedCalDate} and synced to client view.`);
      await refreshAllForClient(selectedUserId);
    } finally {
      setSavingAppt(false);
    }
  };

  const handleUpdateAppointment = async (
    apptId: string,
    payload: {
      status?: 'upcoming' | 'completed' | 'rescheduled' | 'missed';
      followUpOutcome?: string;
      appointmentDate?: string;
    },
    successMsg?: string
  ) => {
    if (!serverAuthToken || !selectedUserId) return;
    const res = await fetch(`/api/care/appointments/${apptId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Could not update appointment.');
      return;
    }
    if (successMsg) setNotice(successMsg);
    await refreshAllForClient(selectedUserId);
  };

  const handleClarifySubstance = async (concernId: string) => {
    if (!serverAuthToken || !selectedUserId) return;
    const note = (substanceReviewDrafts[concernId] || '').trim();
    if (!note) {
      setError('Enter a clinician clarification note first.');
      return;
    }
    const res = await fetch(
      `/api/therapist/role1/users/${selectedUserId}/substances/${concernId}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify({ clinicianReviewNote: note }),
      }
    );
    if (res.ok) {
      setNotice('Substance concern clarified and marked Clinician Reviewed.');
      await refreshAllForClient(selectedUserId);
    }
  };

  const handleAddSubstanceForClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverAuthToken || !selectedUserId || !newSubName.trim()) return;
    const res = await fetch(`/api/therapist/role1/users/${selectedUserId}/substances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({
        name: newSubName.trim(),
        clinicianReviewNote: newSubNote.trim() || undefined,
        isMedication: newSubIsMed,
      }),
    });
    if (res.ok) {
      setNewSubName('');
      setNewSubNote('');
      setNewSubIsMed(false);
      setNotice('Substance context added to client profile.');
      await refreshAllForClient(selectedUserId);
    }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverAuthToken || !addName.trim()) return;
    setAddingPatient(true);
    setError(null);
    const res = await fetch('/api/therapist/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({
        name: addName.trim(),
        district: addDistrict.trim() || 'Ernakulam',
        ageRange: addAgeRange,
        primaryConcern: addConcern.trim() || undefined,
        initialGoal: addGoal.trim() || undefined,
        initialNote: addNote.trim() || undefined,
      }),
    });
    setAddingPatient(false);
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not add patient.');
      return;
    }
    setShowAddPatientModal(false);
    setAddName('');
    setAddConcern('');
    setAddGoal('');
    setAddNote('');
    setSelectedUserId(data.client.id);
    setClientSubTab('logs');
    setSection('case_details');
    setNotice(`Patient ${data.client.name} added to your caseload.`);
    await loadOverviewAndInvites();
  };

  const handleSaveUserProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverAuthToken || !editingProfileUserId || !editProfileName.trim()) return;
    const res = await fetch(`/api/therapist/role1/users/${editingProfileUserId}/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({
        name: editProfileName.trim(),
        district: editProfileDistrict.trim(),
        ageRange: editProfileAge,
      }),
    });
    if (res.ok) {
      setEditingProfileUserId(null);
      setNotice('Client profile updated.');
      await refreshAllForClient(editingProfileUserId);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverAuthToken || !selectedUserId || !assignTitle.trim() || !assignInstructions.trim())
      return;
    const res = await fetch('/api/care/assignments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({
        clientId: selectedUserId,
        type: assignType,
        title: assignTitle.trim(),
        instructions: assignInstructions.trim(),
        dueDate: assignDueDate || undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Assignment requires an active client connection.');
      return;
    }
    setAssignTitle('');
    setAssignInstructions('');
    setAssignDueDate('');
    setNotice('CBT / weekly activity assigned to client.');
    await refreshAllForClient(selectedUserId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverAuthToken || !clientBundle?.connection || !msgText.trim()) return;
    const res = await fetch('/api/care/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({
        connectionId: clientBundle.connection.id,
        text: msgText.trim(),
      }),
    });
    if (res.ok) {
      setMsgText('');
      if (selectedUserId) await loadSelectedClient(selectedUserId);
    }
  };

  const handleRequestClientInfo = async () => {
    if (!serverAuthToken || !clientBundle?.connection) return;
    const catLabel =
      PERMISSION_CATEGORY_META.find(c => c.id === requestInfoCat)?.label || requestInfoCat;
    setRequestingInfo(true);
    try {
      const res = await fetch('/api/care/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify({
          connectionId: clientBundle.connection.id,
          messageType: 'info_request',
          requestedCategories: [requestInfoCat],
          text: `Quick check-in request: Could you share an update or access to "${catLabel}" before our next session?`,
        }),
      });
      if (res.ok) {
        setNotice(`Sent information update request for ${catLabel}.`);
        if (selectedUserId) await loadSelectedClient(selectedUserId);
      }
    } finally {
      setRequestingInfo(false);
    }
  };

  const handleReplyWeekly = async (wpId: string) => {
    if (!serverAuthToken || !selectedUserId) return;
    const text = (weeklyReplyDrafts[wpId] || '').trim();
    if (!text) return;
    const res = await fetch(`/api/care/weekly-progress/${wpId}/respond`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({ therapistResponse: text }),
    });
    if (res.ok) {
      setWeeklyReplyDrafts(prev => ({ ...prev, [wpId]: '' }));
      setNotice('Clinician response sent.');
      await loadSelectedClient(selectedUserId);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverAuthToken || !inviteContact.trim()) return;
    const res = await fetch('/api/therapist/invite-client', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({
        recipientContact: inviteContact.trim(),
        purpose: invitePurpose.trim(),
        requestedPermissions: invitePerms,
        expiresInDays: 14,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not create invitation.');
      return;
    }
    setInviteContact('');
    setNotice(`Invitation code ${data.invitation.code} generated.`);
    await loadOverviewAndInvites();
  };

  const handleRespondIncoming = async (connectionId: string, action: 'accept' | 'decline') => {
    if (!serverAuthToken) return;
    const res = await fetch(`/api/therapist/connections/${connectionId}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      setNotice(action === 'accept' ? 'Client connection authorized.' : 'Request declined.');
      await loadOverviewAndInvites();
    }
  };

  // =========================================================
  // CONFIDENTIAL NOTES VAULT, REFERRALS, AI ASSIST & REPORT EXPORT
  // =========================================================
  const handleCreateClinicalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverAuthToken || !selectedUserId || !noteTitle.trim() || !noteContent.trim()) return;
    setSavingClinicalNote(true);
    setError(null);
    try {
      const res = await fetch(`/api/therapist/role1/users/${selectedUserId}/clinical-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify({
          noteType,
          title: noteTitle.trim(),
          content: noteContent.trim(),
          followUpDate: noteFollowUpDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not save confidential clinical note.');
        return;
      }
      setNoteTitle('');
      setNoteContent('');
      setNoteFollowUpDate('');
      setNotice('Confidential clinical note sealed in clinician-only vault.');
      await loadSelectedClient(selectedUserId);
    } finally {
      setSavingClinicalNote(false);
    }
  };

  const handleUpdateClinicalNote = async (e: React.FormEvent, noteId: string) => {
    e.preventDefault();
    if (!serverAuthToken || !selectedUserId || !editClinicalNoteDraft.content.trim()) return;
    setSavingEditClinicalNote(true);
    setError(null);
    try {
      const res = await fetch(`/api/therapist/role1/users/${selectedUserId}/clinical-notes/${noteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify({
          noteType: editClinicalNoteDraft.noteType,
          title: editClinicalNoteDraft.title.trim(),
          content: editClinicalNoteDraft.content.trim(),
          followUpDate: editClinicalNoteDraft.followUpDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not update clinical note.');
        return;
      }
      setEditingClinicalNoteId(null);
      setNotice('Encrypted clinical note updated.');
      await loadSelectedClient(selectedUserId);
    } finally {
      setSavingEditClinicalNote(false);
    }
  };

  const handleDeleteClinicalNote = async (noteId: string) => {
    if (!serverAuthToken || !selectedUserId) return;
    const res = await fetch(`/api/therapist/role1/users/${selectedUserId}/clinical-notes/${noteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${serverAuthToken}` },
    });
    if (res.ok) {
      setNotice('Clinical note deleted from vault.');
      await loadSelectedClient(selectedUserId);
    }
  };

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverAuthToken || !selectedUserId || !refTarget.trim() || !refReason.trim()) return;
    setSavingReferral(true);
    setError(null);
    try {
      const res = await fetch(`/api/therapist/role1/users/${selectedUserId}/referrals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify({
          serviceName: refTarget.trim(),
          urgency: refUrgency,
          referralCategory: refCategory,
          referralDate: refDate || undefined,
          reason: refReason.trim(),
          followUpNotes: refFollowUp.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Could not log referral.');
        return;
      }
      setRefTarget('');
      setRefReason('');
      setRefFollowUp('');
      setNotice('Clinical referral / escalation recorded.');
      await loadSelectedClient(selectedUserId);
    } finally {
      setSavingReferral(false);
    }
  };

  const handleUpdateReferral = async (
    referralId: string,
    payload: {
      status?: 'recommended' | 'scheduled' | 'completed' | 'declined';
      followUpNotes?: string;
    }
  ) => {
    if (!serverAuthToken || !selectedUserId) return;
    const res = await fetch(`/api/therapist/role1/users/${selectedUserId}/referrals/${referralId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setNotice('Referral record updated.');
      await loadSelectedClient(selectedUserId);
    }
  };

  const handleRunAiClinicianAssist = async () => {
    if (!serverAuthToken || !selectedUserId) return;
    setAiAssistBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/therapist-assist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify({ clientId: selectedUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not generate AI clinician synthesis.');
        return;
      }
      setAiAssistResult(data);
    } catch {
      setError('Network error while running AI Clinician Assist.');
    } finally {
      setAiAssistBusy(false);
    }
  };

  const openPatientReport = async (userId: string) => {
    setSelectedUserId(userId);
    if (!clientBundle || clientBundle.profile.id !== userId) {
      await loadSelectedClient(userId);
    }
    setReportModalOpen(true);
  };

  // =========================================================
  // DERIVED FILTERS & CALENDAR CELLS
  // =========================================================
  const filteredRoster = useMemo(() => {
    const q = rosterSearch.trim().toLowerCase();
    return overviewUsers.filter(u => {
      if (
        userFilter === 'active' &&
        u.logsCount === 0 &&
        u.goalsCount === 0 &&
        u.calendarEventsCount === 0
      ) {
        return false;
      }
      if (
        userFilter === 'needs_review' &&
        u.unreviewedLogsCount === 0 &&
        u.unverifiedSubstancesCount === 0
      ) {
        return false;
      }
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.district.toLowerCase().includes(q) ||
        u.substanceNames.some(s => s.toLowerCase().includes(q))
      );
    });
  }, [overviewUsers, rosterSearch, userFilter]);

  const filteredLogs = useMemo(() => {
    const logs = clientBundle?.dailyLogs || [];
    const q = logSearch.trim().toLowerCase();
    const todayStr = new Date().toISOString().split('T')[0];
    const windowStart =
      logTimeframe === '7d'
        ? new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
        : logTimeframe === '30d'
        ? new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
        : logTimeframe === 'custom'
        ? logDateFrom || '1970-01-01'
        : '1970-01-01';
    const windowEnd = logTimeframe === 'custom' ? logDateTo || '2099-12-31' : todayStr;
    return logs.filter(log => {
      if (logTimeframe !== 'all' && (log.date < windowStart || log.date > windowEnd)) return false;
      if (logFilter === 'needs_review' && log.clinicianReviewNote) return false;
      if (logFilter === 'detailed' && log.type !== 'detailed') return false;
      if (
        logFilter === 'challenged' &&
        !['challenged', 'heavy', 'difficult', 'restless'].includes(log.mood || '')
      ) {
        return false;
      }
      if (!q) return true;
      return (
        log.quickNote?.toLowerCase().includes(q) ||
        log.personalReflection?.toLowerCase().includes(q) ||
        log.detailedQuestions?.difficulties?.toLowerCase().includes(q) ||
        log.detailedQuestions?.wentWell?.toLowerCase().includes(q) ||
        log.mood?.toLowerCase().includes(q) ||
        log.tags.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [clientBundle?.dailyLogs, logSearch, logFilter, logTimeframe, logDateFrom, logDateTo]);

  const calendarCells = useMemo(() => {
    const first = new Date(calYear, calMonth, 1);
    const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
    const startOffset = (first.getDay() + 6) % 7; // Monday = 0
    const cells: { iso: string | null; day: number | null }[] = [];
    for (let i = 0; i < startOffset; i++) cells.push({ iso: null, day: null });
    for (let d = 1; d <= totalDays; d++) {
      const mStr = String(calMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      cells.push({ iso: `${calYear}-${mStr}-${dStr}`, day: d });
    }
    return cells;
  }, [calYear, calMonth]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    (clientBundle?.calendarEvents || []).forEach(evt => {
      if (!map[evt.date]) map[evt.date] = [];
      map[evt.date].push(evt);
    });
    return map;
  }, [clientBundle?.calendarEvents]);

  const selectedDayEvents = useMemo(
    () =>
      (eventsByDate[selectedCalDate] || []).slice().sort((a, b) =>
        (a.startTime || '').localeCompare(b.startTime || '')
      ),
    [eventsByDate, selectedCalDate]
  );

  // Palette Tokens: Deep Mulberry Plum (#4A154B) + Clinical Sage Mint (#059669)
  const canvasClass = isNight
    ? 'min-h-screen bg-[#120C18] text-[#F5F0FA] flex flex-col'
    : 'min-h-screen bg-[#FAF8FC] text-[#1E1426] flex flex-col';
  const surfaceClass = isNight
    ? 'bg-[#1B1224] border border-[#342444]'
    : 'bg-white border border-[#E6DFEC]';
  const subtleClass = isNight
    ? 'bg-[#241830] border border-[#3B294E]'
    : 'bg-[#F5F1F9] border border-[#E6DFEC]';
  const mutedClass = isNight ? 'text-[#B9A7C9]' : 'text-[#5D4C6E]';
  const inputClass = isNight
    ? 'bg-[#120C18] border border-[#3B294E] text-[#F5F0FA] placeholder-[#7B698C] focus:outline-none focus:ring-2 focus:ring-[#10B981]/40'
    : 'bg-[#FAF8FC] border border-[#DED5E7] text-[#1E1426] placeholder-[#8A7A9A] focus:outline-none focus:ring-2 focus:ring-[#4A154B]/30';

  const verificationMeta =
    VERIFICATION_STATUS_META[serverAuthUser?.verificationStatus || 'submitted'] ||
    VERIFICATION_STATUS_META.submitted;

  const navigateSection = (target: DashboardSection) => {
    setSection(target);
    if (target === 'case_details') setClientSubTab('logs');
    else if (target === 'support_plans') setClientSubTab('goals');
    else if (target === 'messages') setClientSubTab('care_tools');
    else if (target === 'schedule_reports') setClientSubTab('calendar');
  };

  const openClientCare = (userId: string, subTab: Role1SubTab = 'logs') => {
    setSelectedUserId(userId);
    setClientSubTab(subTab);
    if (subTab === 'goals') setSection('support_plans');
    else if (subTab === 'care_tools') setSection('messages');
    else if (subTab === 'calendar') setSection('schedule_reports');
    else setSection('case_details');
    setAiAssistResult(null);
  };

  // Filtered Patient Report Data (Timeframe + Objective vs Subjective separation)
  const compiledPatientReport = useMemo(() => {
    if (!clientBundle) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    let fromDate = '1970-01-01';
    let toDate = '2099-12-31';
    if (reportTimeframe === 'session') {
      fromDate = todayStr;
      toDate = todayStr;
    } else if (reportTimeframe === '7d') {
      fromDate = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      toDate = todayStr;
    } else if (reportTimeframe === '30d') {
      fromDate = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      toDate = todayStr;
    } else if (reportTimeframe === 'custom') {
      fromDate = reportFrom || '1970-01-01';
      toDate = reportTo || '2099-12-31';
    }

    const inWindow = (iso?: string) => {
      if (!iso) return true;
      const d = iso.slice(0, 10);
      return d >= fromDate && d <= toDate;
    };

    const logs = clientBundle.dailyLogs.filter(l => inWindow(l.date));
    const goals = clientBundle.goals;
    const completedGoals = goals.filter(g => g.completed).length;
    const events = clientBundle.calendarEvents.filter(ev => inWindow(ev.date));
    const completedEvents = events.filter(ev => ev.completed).length;

    return {
      fromDate: reportTimeframe === 'all' ? 'All Recorded History' : fromDate,
      toDate: reportTimeframe === 'all' ? todayStr : toDate,
      generatedAt: new Date().toLocaleString(),
      logs,
      goals,
      completedGoals,
      events,
      completedEvents,
      substances: clientBundle.substanceConcerns,
      supportPlan: clientBundle.supportPlan,
      assignments: clientBundle.assignments,
      referrals: clientBundle.referrals || [],
      measurableIndicators: clientBundle.measurableIndicators,
      followUpSummary: clientBundle.followUpSummary,
    };
  }, [clientBundle, reportTimeframe, reportFrom, reportTo]);

  const handleDownloadPatientPdf = () => {
    if (!clientBundle || !compiledPatientReport) return;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 44;
    const maxWidth = pageWidth - margin * 2;
    let y = 50;

    const ensureSpace = (needed = 24) => {
      if (y + needed > doc.internal.pageSize.getHeight() - 48) {
        doc.addPage();
        y = 48;
      }
    };

    const writeWrapped = (
      text: string,
      fontSize = 10,
      bold = false,
      color: [number, number, number] = [30, 20, 38]
    ) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line: string) => {
        ensureSpace(fontSize + 6);
        doc.text(line, margin, y);
        y += fontSize + 5;
      });
    };

    writeWrapped('ClearPath AI — Clinical Client Progress Report', 15, true, [74, 21, 75]);
    writeWrapped(
      `Client: ${clientBundle.profile.name} (@${clientBundle.profile.username})  |  District: ${clientBundle.profile.district || 'Kerala'}  |  Age Group: ${AGE_LABELS[clientBundle.profile.ageRange || ''] || clientBundle.profile.ageRange || 'Adult'}`,
      9.5,
      true,
      [55, 65, 81]
    );
    writeWrapped(
      `Clinician: ${serverAuthUser?.name || 'Verified Clinician'}  |  Window: ${compiledPatientReport.fromDate} to ${compiledPatientReport.toDate}  |  Generated: ${compiledPatientReport.generatedAt}`,
      9,
      false,
      [75, 85, 99]
    );
    y += 4;
    writeWrapped(
      'CLINICAL BOUNDARY NOTICE: This structured report separates objective activity metrics, client self-reported logs, and clinician guidance. It supports continuity of care and is NOT a medical cure guarantee, diagnosis, or relapse prediction.',
      8.5,
      true,
      [146, 64, 14]
    );
    y += 10;

    if (reportSections.objectiveMetrics) {
      const mi = compiledPatientReport.measurableIndicators;
      writeWrapped('1. OBJECTIVE ACTIVITY & ENGAGEMENT METRICS', 11, true, [5, 150, 105]);
      writeWrapped(
        `Goals Completed: ${compiledPatientReport.completedGoals}/${compiledPatientReport.goals.length} (${mi?.goalCompletionPct ?? 0}%)  |  7-Day Check-In Consistency: ${mi?.checkInConsistency7dPct ?? 0}% (${mi?.uniqueCheckInDays7d ?? 0}/7 days)  |  Scheduled Events Done: ${compiledPatientReport.completedEvents}/${compiledPatientReport.events.length}`,
        9.5
      );
      if (mi) {
        writeWrapped(
          `Appointment Attendance: ${mi.appointmentAttendancePct !== null ? `${mi.appointmentAttendancePct}%` : 'N/A'} (${mi.completedAppointmentsCount} completed, ${mi.missedAppointmentsCount} missed)  |  Positive Mood Rate: ${mi.moodTrendComparison.recent7dPositivePct !== null ? `${mi.moodTrendComparison.recent7dPositivePct}%` : 'N/A'} last 7d vs ${mi.moodTrendComparison.prior7dPositivePct !== null ? `${mi.moodTrendComparison.prior7dPositivePct}%` : 'N/A'} prior 7d`,
          9
        );
      }
      compiledPatientReport.goals.forEach(g => {
        const msDone = g.milestones.filter(m => m.completed).length;
        writeWrapped(
          `• [${g.completed ? 'DONE' : 'ACTIVE'}] ${g.title} (${g.category}, ${msDone}/${g.milestones.length} milestones)`,
          9.5
        );
      });
      y += 8;
    }

    if (reportSections.dailyLogs) {
      writeWrapped('2. SUBJECTIVE CLIENT SELF-REPORTS & DAILY JOURNALS', 11, true, [74, 21, 75]);
      if (compiledPatientReport.logs.length === 0) {
        writeWrapped('No journal entries recorded inside the selected time frame.', 9.5);
      } else {
        compiledPatientReport.logs.forEach(log => {
          writeWrapped(
            `${log.date} · ${log.type === 'detailed' ? 'Detailed Reflection' : 'Quick Check-In'} · Mood: ${MOOD_LABELS[log.mood || ''] || log.mood || 'Not specified'}`,
            9.5,
            true
          );
          if (log.quickNote) writeWrapped(`  Entry: ${log.quickNote}`, 9);
          if (log.personalReflection) writeWrapped(`  Reflection: ${log.personalReflection}`, 9);
          if (log.detailedQuestions?.difficulties) writeWrapped(`  Challenges: ${log.detailedQuestions.difficulties}`, 9);
          if (log.detailedQuestions?.wentWell) writeWrapped(`  Went Well: ${log.detailedQuestions.wentWell}`, 9);
          if (reportSections.clinicianGuidance && log.clinicianReviewNote) {
            writeWrapped(`  [Clinician Observation] ${log.clinicianReviewNote}`, 9, true, [5, 150, 105]);
          }
          y += 3;
        });
      }
      y += 8;
    }

    if (reportSections.supportPlan && compiledPatientReport.supportPlan) {
      const sp = compiledPatientReport.supportPlan;
      writeWrapped('3. PERSONALIZED SUPPORT PLAN & CLINICIAN GUIDANCE', 11, true, [74, 21, 75]);
      writeWrapped(
        `Care Plan Status: ${(sp.carePlanStatus || 'active').replace(/_/g, ' ').toUpperCase()}  |  Review Date: ${sp.reviewDate || 'Flexible'}  |  Clinician: ${sp.responsibleTherapistName || serverAuthUser?.name || 'Treating Clinician'}`,
        9
      );
      if (sp.objectives.length > 0) {
        writeWrapped(`Objectives: ${sp.objectives.join(' ; ')}`, 9.5);
      }
      if (sp.supportNeeds && sp.supportNeeds.length > 0) {
        writeWrapped(`Support Needs: ${sp.supportNeeds.join(' ; ')}`, 9.5);
      }
      if (sp.approaches.length > 0) {
        writeWrapped(`Approaches: ${sp.approaches.join(', ')}`, 9.5);
      }
      if (sp.interventions && sp.interventions.length > 0) {
        writeWrapped(`Interventions: ${sp.interventions.join(' ; ')}`, 9.5);
      }
      if (reportSections.clinicianGuidance && sp.professionalGuidance) {
        writeWrapped(`Clinician Guidance: ${sp.professionalGuidance}`, 9.5);
      }
      if (reportSections.clinicianGuidance && sp.progressObservations) {
        writeWrapped(`Progress Observations: ${sp.progressObservations}`, 9.5);
      }
      if (compiledPatientReport.referrals.length > 0) {
        writeWrapped(
          `Referrals Recorded (${compiledPatientReport.referrals.length}): ${compiledPatientReport.referrals
            .map(r => `${r.serviceName} [${r.status}]`)
            .join(', ')}`,
          9
        );
      }
    }

    const safeSlug = clientBundle.profile.username.replace(/[^a-z0-9_-]/gi, '_');
    doc.save(`clearpath_clinical_report_${safeSlug}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // =========================================================
  // TOP COMMAND HEADER (SHARED ACROSS GATE & DASHBOARD)
  // =========================================================
  const renderHeader = () => (
    <header
      className={`sticky top-0 z-30 min-h-16 py-2 border-b backdrop-blur-md px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 ${
        reportModalOpen ? 'print:hidden ' : ''
      }${
        isNight ? 'bg-[#160F1E]/95 border-[#342444]' : 'bg-white/95 border-[#E6DFEC]'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <ClearPathLogo size="sm" subtitle="Therapist Clinical Console" />
      </div>

      {isApproved && (
        <nav
          aria-label="Therapist workspace sections"
          className={`hidden md:flex flex-wrap items-center gap-1 p-1 rounded-xl ${
            isNight ? 'bg-[#241830]' : 'bg-[#F3EEF8]'
          }`}
        >
          {(
            [
              { id: 'overview', label: 'Overview', count: incomingConnections.length || undefined },
              { id: 'cases', label: 'My Cases', count: overviewUsers.length },
              { id: 'case_details', label: 'Case Details' },
              { id: 'support_plans', label: 'Support Plans' },
              { id: 'messages', label: 'Messages', count: clientBundle?.messages.length },
              { id: 'schedule_reports', label: 'Schedule & Reports' },
            ] as { id: DashboardSection; label: string; count?: number }[]
          ).map(item => {
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateSection(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  active ? 'bg-[#4A154B] text-white' : `${mutedClass} hover:opacity-100`
                }`}
              >
                <span>{item.label}</span>
                {typeof item.count === 'number' && item.count > 0 && (
                  <span
                    className={`tabular-nums text-[11px] ${
                      active ? 'text-[#6EE7B7]' : 'opacity-70'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      )}

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={toggleThemeMode}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${subtleClass}`}
          title="Switch Day / Night Theme"
        >
          {isNight ? (
            <Sun className="w-3.5 h-3.5 text-amber-300" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-[#4A154B]" />
          )}
          <span className="hidden sm:inline">{isNight ? 'Day' : 'Night'}</span>
        </button>

        <button
          type="button"
          onClick={() => setPortalMode('none')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${subtleClass}`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exit Portal</span>
        </button>

        {isTherapistSession && (
          <button
            type="button"
            onClick={() => {
              clearServerSession();
              setPortalMode('none');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${
              isNight
                ? 'bg-rose-950/60 text-rose-200 border border-rose-800/70'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        )}
      </div>
    </header>
  );

  // =========================================================
  // GATE 1: STRICT AUTHENTICATION REQUIRED BEFORE PORTAL ACCESS
  // =========================================================
  if (!isTherapistSession) {
    return (
      <div className={canvasClass}>
        {renderHeader()}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className={`${surfaceClass} rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-5`}>
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-[#4A154B] text-[#6EE7B7] shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className={`text-[11px] font-bold uppercase tracking-wider ${mutedClass}`}>
                  Restricted Clinical Workspace
                </div>
                <h1 className="text-xl font-bold mt-0.5">Therapist Authentication Required</h1>
                <p className={`text-xs mt-1 leading-relaxed ${mutedClass}`}>
                  Client recovery records, Role 01 journals, and treatment plans are strictly restricted to authenticated, verified therapists.
                </p>
              </div>
            </div>

            {error && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  isNight
                    ? 'bg-rose-950/60 border border-rose-800 text-rose-200'
                    : 'bg-rose-50 border border-rose-200 text-rose-900'
                }`}
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {notice && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  isNight
                    ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-200'
                    : 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{notice}</span>
              </div>
            )}

            <div className={`grid grid-cols-2 p-1 rounded-xl text-xs font-bold gap-1 ${subtleClass}`}>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('signin');
                  setError(null);
                }}
                className={`py-2 rounded-lg cursor-pointer ${
                  authTab === 'signin' ? 'bg-[#4A154B] text-white' : mutedClass
                }`}
              >
                Clinician Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('signup');
                  setError(null);
                }}
                className={`py-2 rounded-lg cursor-pointer ${
                  authTab === 'signup' ? 'bg-[#4A154B] text-white' : mutedClass
                }`}
              >
                Register Clinician
              </button>
            </div>

            {authTab === 'signin' ? (
              <form onSubmit={handleGateLogin} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold mb-1">Clinician Name or Username *</label>
                  <input
                    type="text"
                    value={loginUsername}
                    onChange={e => setLoginUsername(e.target.value)}
                    placeholder="e.g. Dr. Ananya Menon"
                    required
                    className={`w-full px-3 py-2.5 rounded-xl ${inputClass}`}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Quick Access Code *</label>
                  <input
                    type="text"
                    value={loginQuickCode}
                    onChange={e => setLoginQuickCode(e.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                    placeholder="Enter iamtherapist or your custom code"
                    className={`w-full px-3 py-2.5 rounded-xl font-mono ${inputClass}`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={authBusy}
                  className="w-full py-2.5 rounded-xl bg-[#4A154B] hover:bg-[#3A103B] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Stethoscope className="w-4 h-4 text-[#6EE7B7]" />
                  <span>{authBusy ? 'Authenticating...' : 'Sign In to Therapist Portal'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleGateRegister} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={regName}
                      onChange={e => setRegName(e.target.value)}
                      placeholder="Dr. Ananya Menon"
                      required
                      className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">Username *</label>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value)}
                      placeholder="dr_ananya"
                      required
                      className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Password (6+ chars) *</label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder="Min. 6 chars"
                      required
                      className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">License ID (optional draft)</label>
                    <input
                      type="text"
                      value={regLicense}
                      onChange={e => setRegLicense(e.target.value)}
                      placeholder="RCI / NMC ID"
                      className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Practice Area</label>
                    <input
                      type="text"
                      value={regSpec}
                      onChange={e => setRegSpec(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">District</label>
                    <input
                      type="text"
                      value={regDistrict}
                      onChange={e => setRegDistrict(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Restricted Quick Verification Code (optional — skips pending queue)
                  </label>
                  <input
                    type="text"
                    value={regQuickCode}
                    onChange={e => setRegQuickCode(e.target.value)}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    placeholder="Lowercase restricted therapist code (no spaces)"
                    className={`w-full px-3 py-2 rounded-xl font-mono ${inputClass}`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={authBusy}
                  className="w-full py-2.5 rounded-xl bg-[#4A154B] hover:bg-[#3A103B] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <ShieldCheck className="w-4 h-4 text-[#6EE7B7]" />
                  <span>{authBusy ? 'Creating...' : 'Create Clinician Account'}</span>
                </button>
              </form>
            )}
          </div>
        </main>
      </div>
    );
  }

  // =========================================================
  // GATE 2: PENDING VERIFICATION + QUICK RESTRICTED ACCESS CODE BOX
  // =========================================================
  if (!isApproved) {
    return (
      <div className={canvasClass}>
        {renderHeader()}
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-5">
          {error && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-2 ${
                isNight
                  ? 'bg-rose-950/50 border border-rose-800 text-rose-200'
                  : 'bg-rose-50 border border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button type="button" onClick={() => setError(null)} className="font-bold underline cursor-pointer">
                Dismiss
              </button>
            </div>
          )}

          {/* Pending / Unverified Status Card */}
          <section className={`${surfaceClass} rounded-2xl p-6 sm:p-7 space-y-5`}>
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-xl shrink-0 ${
                  serverAuthUser?.verificationStatus === 'suspended'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-[#4A154B] text-[#6EE7B7]'
                }`}
              >
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <div className={`text-xs font-semibold ${mutedClass}`}>
                  Verification Status ·{' '}
                  <span className="font-bold uppercase text-[#059669]">
                    {(serverAuthUser?.verificationStatus || 'submitted').replace(/_/g, ' ')}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold">{verificationMeta.title}</h1>
                <p className={`text-xs sm:text-sm leading-relaxed ${mutedClass}`}>
                  {verificationMeta.summary}
                </p>
              </div>
            </div>

            {serverAuthUser?.verificationNote && (
              <div
                className={`p-3.5 rounded-xl text-xs space-y-1 ${
                  isNight
                    ? 'bg-amber-950/40 border border-amber-700/60 text-amber-200'
                    : 'bg-amber-50 border border-amber-200 text-amber-950'
                }`}
              >
                <div className="font-bold">Administrator Review Note</div>
                <p>{serverAuthUser.verificationNote}</p>
              </div>
            )}

            <div className={`p-4 rounded-xl text-xs grid grid-cols-1 sm:grid-cols-3 gap-3 ${subtleClass}`}>
              <div>
                <div className={mutedClass}>Clinician</div>
                <div className="font-bold mt-0.5">
                  {serverAuthUser?.name} (@{serverAuthUser?.username})
                </div>
              </div>
              <div>
                <div className={mutedClass}>Practice Area</div>
                <div className="font-bold mt-0.5">
                  {serverAuthUser?.specialization || serverAuthUser?.areaOfPractice || 'Clinical Support'}
                </div>
              </div>
              <div>
                <div className={mutedClass}>License / Council ID</div>
                <div className="font-bold mt-0.5 tabular-nums">
                  {serverAuthUser?.licenseNumber || 'Pending credential'}
                </div>
              </div>
            </div>
          </section>

          {/* Compact Quick Restricted Access Code Box right below Pending Verification */}
          {verificationMeta.canUnlock && (
            <section className={`${surfaceClass} rounded-2xl p-5 sm:p-6 space-y-3.5`}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-[#059669]/15 text-[#059669] shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold">
                    Quick Restricted Access — Enter Verification Code
                  </h2>
                  <p className={`text-xs mt-0.5 leading-relaxed ${mutedClass}`}>
                    Authorized therapists can enter <strong>iamtherapist</strong> or their personal lowercase quick-access code (no spaces) below to enter the Clinical Dashboard immediately.
                  </p>
                </div>
              </div>

              <form onSubmit={handleQuickUnlock} className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={quickCode}
                  onChange={e => setQuickCode(e.target.value)}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Enter verification code (lowercase, no spaces)"
                  required
                  className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs font-mono ${inputClass}`}
                />
                <button
                  type="submit"
                  disabled={unlocking || !quickCode}
                  className="px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] disabled:opacity-60 text-white text-xs font-bold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <Unlock className="w-4 h-4" />
                  <span>{unlocking ? 'Verifying...' : 'Verify & Enter Dashboard'}</span>
                </button>
              </form>
            </section>
          )}
        </main>
      </div>
    );
  }

  // =========================================================
  // AUTHENTICATED THERAPIST DASHBOARD WORKSPACE
  // =========================================================
  return (
    <div className={canvasClass}>
      {renderHeader()}

      {/* Mobile Section Tabs */}
      <div
        className={`md:hidden border-b px-4 py-2 flex flex-wrap gap-1.5 ${
          reportModalOpen ? 'print:hidden ' : ''
        }${
          isNight ? 'bg-[#160F1E] border-[#342444]' : 'bg-white border-[#E6DFEC]'
        }`}
      >
        {(
          [
            { id: 'overview', label: 'Overview' },
            { id: 'cases', label: `My Cases (${overviewUsers.length})` },
            { id: 'case_details', label: 'Case Details' },
            { id: 'support_plans', label: 'Support Plans' },
            { id: 'messages', label: 'Messages' },
            { id: 'schedule_reports', label: 'Schedule & Reports' },
          ] as { id: DashboardSection; label: string }[]
        ).map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => navigateSection(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
              section === tab.id ? 'bg-[#4A154B] text-white' : `${subtleClass} ${mutedClass}`
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Split Workspace: Left Roster Sidebar (Desktop) + Workspace Body */}
      <div className={`flex-1 max-w-[1440px] w-full mx-auto flex flex-col lg:flex-row ${reportModalOpen ? 'print:hidden' : ''}`}>
        {/* Left Sidebar: 264px Roster & Role 01 Navigation */}
        <aside
          className={`hidden lg:flex lg:w-[272px] shrink-0 flex-col border-r p-4 gap-4 ${
            isNight ? 'bg-[#160F1E] border-[#342444]' : 'bg-white border-[#E6DFEC]'
          }`}
        >
          {/* Clinician Summary */}
          <div className={`p-3.5 rounded-xl space-y-1 ${subtleClass}`}>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#059669] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Therapist</span>
            </div>
            <div className="text-sm font-bold truncate">{serverAuthUser?.name}</div>
            <div className={`text-[11px] truncate ${mutedClass}`}>
              @{serverAuthUser?.username} · {serverAuthUser?.district || 'Kerala'}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddPatientModal(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Onboard / Add Patient</span>
          </button>

          {/* Role 01 Active Client Roster */}
          <div className="flex-1 flex flex-col min-h-0 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${mutedClass}`}>
                Role 01 Client Roster ({overviewUsers.length})
              </span>
              <button
                type="button"
                onClick={loadOverviewAndInvites}
                className={`p-1 rounded-lg hover:opacity-80 cursor-pointer ${mutedClass}`}
                title="Refresh signed-up Role 01 users"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingOverview ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="relative">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${mutedClass}`} />
              <input
                type="text"
                value={rosterSearch}
                onChange={e => setRosterSearch(e.target.value)}
                placeholder="Filter by name or district..."
                className={`w-full pl-8 pr-3 py-2 rounded-xl text-xs ${inputClass}`}
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
              {filteredRoster.length === 0 ? (
                <div className={`p-4 rounded-xl text-center text-xs ${subtleClass}`}>
                  <p className={mutedClass}>
                    {overviewUsers.length === 0
                      ? 'No signed-up Role 01 users yet.'
                      : 'No matching users.'}
                  </p>
                </div>
              ) : (
                filteredRoster.map(u => {
                  const selected =
                    u.id === selectedUserId &&
                    (section === 'case_details' ||
                      section === 'support_plans' ||
                      section === 'messages' ||
                      section === 'schedule_reports');
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => openClientCare(u.id, clientSubTab)}
                      className={`w-full text-left p-3 rounded-xl transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#4A154B] text-white'
                          : isNight
                          ? 'hover:bg-[#241830] text-[#F5F0FA]'
                          : 'hover:bg-[#F5F1F9] text-[#1E1426]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold truncate">{u.name}</span>
                        {u.unreviewedLogsCount > 0 && (
                          <span
                            className={`text-[10px] font-bold tabular-nums shrink-0 ${
                              selected ? 'text-[#6EE7B7]' : 'text-[#059669]'
                            }`}
                          >
                            {u.unreviewedLogsCount} new
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-[11px] mt-0.5 truncate tabular-nums ${
                          selected ? 'text-white/80' : mutedClass
                        }`}
                      >
                        @{u.username} · {u.logsCount} logs · {u.goalsCount} goals
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* Workspace Main Content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Concise Therapist Feature Guide Bar */}
          <div className={`${surfaceClass} rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs`}>
            <span className={`font-bold uppercase tracking-wider text-[10px] ${mutedClass}`}>
              Therapist Workspace Guide:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'cases', label: 'Caseload' },
                  { id: 'case_details', label: 'Case Details' },
                  { id: 'support_plans', label: 'Care Plan' },
                  { id: 'messages', label: 'Messages' },
                  { id: 'schedule_reports', label: 'Referrals & Schedule' },
                ] as { id: DashboardSection; label: string }[]
              ).map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateSection(item.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer transition-colors ${
                    section === item.id
                      ? 'bg-[#4A154B] text-white'
                      : `${subtleClass} hover:opacity-90`
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Global Alerts */}
          {error && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-3 ${
                isNight
                  ? 'bg-rose-950/50 border border-rose-800 text-rose-200'
                  : 'bg-rose-50 border border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button type="button" onClick={() => setError(null)} className="font-bold underline cursor-pointer">
                Dismiss
              </button>
            </div>
          )}

          {notice && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center justify-between gap-3 ${
                isNight
                  ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-200'
                  : 'bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46]'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{notice}</span>
              </div>
              <button type="button" onClick={() => setNotice(null)} className="font-bold underline cursor-pointer">
                Dismiss
              </button>
            </div>
          )}

          {/* =========================================================
              SECTION 1: OVERVIEW & ACTIVE CLIENT JOURNEYS
          ========================================================= */}
          {section === 'overview' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    Role 01 Client Journeys Overview
                  </h1>
                  <p className={`text-xs sm:text-sm mt-1 ${mutedClass}`}>
                    Real-time clinical oversight of signed-up Recover &amp; Rebuild users, daily logs, goals, and calendars.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={loadOverviewAndInvites}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${subtleClass}`}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingOverview ? 'animate-spin' : ''}`} />
                    <span>Refresh Data</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddPatientModal(true)}
                    className="px-4 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Patient</span>
                  </button>
                </div>
              </div>

              {/* Pending Incoming Client Connection Requests right on Overview */}
              {incomingConnections.length > 0 && (
                <section className={`${surfaceClass} rounded-2xl p-5 space-y-3`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base font-bold">
                      New Client Support Requests ({incomingConnections.length})
                    </h2>
                    <button
                      type="button"
                      onClick={() => navigateSection('cases')}
                      className="text-xs font-bold text-[#059669] hover:underline cursor-pointer"
                    >
                      Manage Invites &amp; Cases &rarr;
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {incomingConnections.map(conn => (
                      <div key={conn.id} className={`p-4 rounded-xl flex items-center justify-between gap-3 ${subtleClass}`}>
                        <div>
                          <div className="font-bold text-sm">{conn.clientName}</div>
                          <div className={mutedClass}>Requested care connection · {conn.createdAt.split('T')[0]}</div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRespondIncoming(conn.id, 'accept')}
                            className="px-3.5 py-2 rounded-lg bg-[#059669] hover:bg-[#047857] text-white font-bold whitespace-nowrap cursor-pointer"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRespondIncoming(conn.id, 'decline')}
                            className={`px-3 py-2 rounded-lg font-semibold whitespace-nowrap cursor-pointer ${surfaceClass}`}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Clean Single-Row KPI Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  { label: 'Signed-Up Users', value: totals.totalUsers, sub: `${totals.activeJourneys} active journeys` },
                  { label: 'Journal & Voice Logs', value: totals.totalLogs, sub: `${totals.unreviewedLogs} awaiting review` },
                  { label: 'Recovery Goals', value: totals.totalGoals, sub: `${totals.completedGoals} completed` },
                  { label: 'Calendar Events', value: totals.totalEvents, sub: 'Synced Role 01 schedule' },
                  { label: 'Unverified Substances', value: totals.unverifiedSubstances, sub: 'Clarification needed' },
                ].map(kpi => (
                  <div key={kpi.label} className={`${surfaceClass} rounded-2xl p-4 space-y-1`}>
                    <div className={`text-xs font-semibold ${mutedClass}`}>{kpi.label}</div>
                    <div className="text-2xl font-extrabold tabular-nums">{kpi.value}</div>
                    <div className={`text-xs tabular-nums ${mutedClass}`}>{kpi.sub}</div>
                  </div>
                ))}
              </div>

              {/* Caseload Clarity Board Bar */}
              <div className={`${surfaceClass} rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs`}>
                <div className={`p-3 rounded-xl flex items-center justify-between ${subtleClass}`}>
                  <div>
                    <div className={`font-semibold ${mutedClass}`}>Follow-Ups / Missed Items</div>
                    <div className="text-lg font-extrabold tabular-nums mt-0.5">
                      {totals.overdueFollowUpsCount ?? 0}
                    </div>
                  </div>
                  <Clock className="w-5 h-5 text-[#059669]" />
                </div>
                <div className={`p-3 rounded-xl flex items-center justify-between ${subtleClass}`}>
                  <div>
                    <div className={`font-semibold ${mutedClass}`}>Upcoming Plan Reviews (7d)</div>
                    <div className="text-lg font-extrabold tabular-nums mt-0.5">
                      {totals.upcomingReviewsCount ?? 0}
                    </div>
                  </div>
                  <CalendarIcon className="w-5 h-5 text-[#4A154B]" />
                </div>
                <div className={`p-3 rounded-xl flex items-center justify-between ${subtleClass}`}>
                  <div>
                    <div className={`font-semibold ${mutedClass}`}>Youth Safeguarding Caseload</div>
                    <div className="text-lg font-extrabold tabular-nums mt-0.5">
                      {totals.youthClientsCount ?? 0}
                    </div>
                  </div>
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                </div>
              </div>

              {/* Live Clinician Availability & Phone Verification Panel */}
              <section className={`${surfaceClass} rounded-2xl p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs`}>
                <form onSubmit={handleSaveAvailability} className="lg:col-span-7 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm">Live Practice Availability Status</div>
                      <p className={`text-[11px] ${mutedClass}`}>
                        Broadcasts your real-time availability to Recover &amp; Rebuild users in the therapist directory.
                      </p>
                    </div>
                    <div className="inline-flex p-1 rounded-xl gap-1 bg-black/5">
                      {(['available', 'busy', 'offline'] as const).map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setAvailStatus(st)}
                          className={`px-3 py-1 rounded-lg capitalize font-bold cursor-pointer ${
                            availStatus === st
                              ? st === 'available'
                                ? 'bg-[#059669] text-white'
                                : st === 'busy'
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-700 text-white'
                              : mutedClass
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={availHours}
                      onChange={e => setAvailHours(e.target.value)}
                      placeholder="Hours (e.g. Mon-Sat, 9:30 AM - 5:30 PM)"
                      className={`px-3 py-2 rounded-xl ${inputClass}`}
                    />
                    <input
                      type="text"
                      value={nextSlot}
                      onChange={e => setNextSlot(e.target.value)}
                      placeholder="Next open slot (e.g. Tomorrow 11:00 AM)"
                      className={`px-3 py-2 rounded-xl ${inputClass}`}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingAvail}
                    className="px-4 py-2 rounded-xl bg-[#4A154B] hover:bg-[#3A103B] text-white font-bold cursor-pointer disabled:opacity-60"
                  >
                    {savingAvail ? 'Saving Availability...' : 'Update Directory Availability'}
                  </button>
                </form>

                <form onSubmit={handleVerifyPhone} className={`lg:col-span-5 p-4 rounded-xl space-y-2.5 ${subtleClass}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm">Verified Practice Phone</span>
                    {serverAuthUser?.phoneVerified && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#059669]/15 text-[#059669]">
                        Verified
                      </span>
                    )}
                  </div>
                  <input
                    type="tel"
                    value={therPhone}
                    onChange={e => setTherPhone(e.target.value)}
                    placeholder="+91 98470 00000"
                    className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                  />
                  <div className="space-y-1 text-[11px]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmPhoneOwn}
                        onChange={e => setConfirmPhoneOwn(e.target.checked)}
                      />
                      <span>Confirm official clinical ownership of this number</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={whatsappOptIn}
                        onChange={e => setWhatsappOptIn(e.target.checked)}
                      />
                      <span>Allow external WhatsApp click-to-chat for signed-in users</span>
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={verifyingPhone || !therPhone.trim()}
                    className="px-3.5 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold cursor-pointer disabled:opacity-60"
                  >
                    {verifyingPhone ? 'Verifying...' : 'Verify Contact Phone'}
                  </button>
                </form>
              </section>

              {/* Therapist Custom Access Codes & Admin Work Scope */}
              <section className={`${surfaceClass} rounded-2xl p-5 grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs`}>
                <div className="lg:col-span-7 space-y-3">
                  <div>
                    <div className="font-bold text-sm flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-[#059669]" />
                      <span>My Custom Quick-Access Codes</span>
                    </div>
                    <p className={`text-[11px] mt-0.5 ${mutedClass}`}>
                      Standard <strong>iamtherapist</strong> quick access stays active, and you can add, edit, pause, or delete your own private clinic codes below.
                    </p>
                  </div>

                  <form onSubmit={handleCreateAccessCode} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <input
                      type="text"
                      value={newCodeLabel}
                      onChange={e => setNewCodeLabel(e.target.value)}
                      placeholder="Label (e.g. Morning Clinic)"
                      required
                      className={`sm:col-span-5 px-3 py-2 rounded-xl ${inputClass}`}
                    />
                    <input
                      type="text"
                      value={newCodeValue}
                      onChange={e => setNewCodeValue(e.target.value)}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      placeholder="Code (min 4 chars, no spaces)"
                      required
                      className={`sm:col-span-4 px-3 py-2 rounded-xl font-mono ${inputClass}`}
                    />
                    <button
                      type="submit"
                      disabled={savingAccessCode}
                      className="sm:col-span-3 px-3 py-2 rounded-xl bg-[#4A154B] hover:bg-[#3A103B] disabled:opacity-60 text-white font-bold cursor-pointer"
                    >
                      {savingAccessCode ? 'Adding...' : 'Add Code'}
                    </button>
                  </form>

                  {customAccessCodes.length === 0 ? (
                    <div className={`p-3 rounded-xl ${subtleClass} ${mutedClass}`}>
                      No custom codes added yet. Add one above anytime to sign in with your own code.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customAccessCodes.map(c => (
                        <div key={c.id} className={`p-3 rounded-xl ${subtleClass} space-y-2`}>
                          {editingCodeId === c.id ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <input
                                type="text"
                                value={editCodeLabel}
                                onChange={e => setEditCodeLabel(e.target.value)}
                                className={`flex-1 min-w-[120px] px-2.5 py-1.5 rounded-lg ${inputClass}`}
                                placeholder="Label"
                              />
                              <input
                                type="text"
                                value={editCodeValue}
                                onChange={e => setEditCodeValue(e.target.value)}
                                className={`flex-1 min-w-[120px] px-2.5 py-1.5 rounded-lg font-mono ${inputClass}`}
                                placeholder="New code (optional)"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateAccessCode(c.id, {
                                    label: editCodeLabel.trim() || c.label,
                                    ...(editCodeValue.trim() ? { code: editCodeValue.trim().toLowerCase() } : {}),
                                  })
                                }
                                className="px-3 py-1.5 rounded-lg bg-[#059669] text-white font-bold cursor-pointer"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCodeId(null)}
                                className={`px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer ${surfaceClass}`}
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <div className="font-bold">
                                  {c.label}{' '}
                                  <span className="font-mono text-[11px] opacity-80">({c.code})</span>
                                </div>
                                <div className={`text-[11px] ${mutedClass}`}>
                                  {c.active ? 'Active for portal sign-in' : 'Paused'} · Updated{' '}
                                  {new Date(c.updatedAt || c.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateAccessCode(c.id, { active: !c.active })}
                                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${surfaceClass}`}
                                >
                                  {c.active ? 'Pause' : 'Activate'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCodeId(c.id);
                                    setEditCodeLabel(c.label);
                                    setEditCodeValue('');
                                  }}
                                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${surfaceClass}`}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAccessCode(c.id)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 font-bold cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={`lg:col-span-5 p-4 rounded-xl space-y-2.5 ${subtleClass}`}>
                  <div className="font-bold text-sm">Work Scope &amp; Mutual Selection</div>
                  <p className={`text-[11px] leading-relaxed ${mutedClass}`}>
                    Patients and therapists choose each other directly via directory requests or invites — Admin never forces assignments.
                  </p>
                  <div className="space-y-1.5 text-xs pt-1">
                    <div className="flex items-center justify-between">
                      <span className={mutedClass}>Caseload Limit:</span>
                      <span className="font-bold tabular-nums">
                        {workScope?.maxActivePatients ?? 25} active patients
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={mutedClass}>Direct Client Onboarding:</span>
                      <span className="font-bold">
                        {workScope?.allowDirectOnboarding !== false ? 'Allowed' : 'Paused by Admin'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={mutedClass}>Private Clinical Notes:</span>
                      <span className="font-bold">
                        {workScope?.allowClinicalNotes !== false ? 'Enabled' : 'Restricted'}
                      </span>
                    </div>
                    {workScope?.allowedSpecializations?.length ? (
                      <div>
                        <span className={mutedClass}>Approved Focus Areas: </span>
                        <span className="font-semibold">
                          {workScope.allowedSpecializations.join(', ')}
                        </span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>

              {/* Adaptive Therapist Attention Engine Queue */}
              <TherapistAttentionPanel
                items={attentionQueue}
                onSelectClient={uid => openClientCare(uid, 'logs')}
                nightSurface={isNight}
              />

              {/* Structured Real Client Journeys Table or Clean Empty State */}
              <section className={`${surfaceClass} rounded-2xl overflow-hidden`}>
                <div className="p-4 sm:p-5 border-b border-inherit flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-bold">Active Client Journeys (Real Account Data)</h2>
                    <p className={`text-xs ${mutedClass}`}>
                      Select any user to manage their Recover &amp; Rebuild goals, calendar, daily logs, and substance notes.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={userFilter}
                      onChange={e => setUserFilter(e.target.value as 'all' | 'active' | 'needs_review')}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold ${inputClass}`}
                    >
                      <option value="all">All Signed-Up Users ({overviewUsers.length})</option>
                      <option value="active">Active Journeys Only</option>
                      <option value="needs_review">Needs Clinician Review</option>
                    </select>
                  </div>
                </div>

                {overviewUsers.length === 0 ? (
                  <div className="p-10 text-center space-y-3">
                    <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${subtleClass}`}>
                      <Users className="w-6 h-6 text-[#059669]" />
                    </div>
                    <h3 className="text-base font-bold">No Role 01 User Signups Yet</h3>
                    <p className={`text-xs max-w-md mx-auto leading-relaxed ${mutedClass}`}>
                      ClearPath displays only genuine registered users — zero fabricated sample patients. When someone signs up and logs journals, goals, substances, or calendar plans in Recover &amp; Rebuild, their real journey appears here automatically.
                    </p>
                    <div className="pt-2 flex flex-wrap justify-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => setShowAddPatientModal(true)}
                        className="px-4 py-2 rounded-xl bg-[#4A154B] hover:bg-[#3A103B] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4 text-[#6EE7B7]" />
                        <span>Onboard First Patient</span>
                      </button>
                      <button
                        type="button"
                        onClick={loadOverviewAndInvites}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${subtleClass}`}
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Check for New Signups</span>
                      </button>
                    </div>
                  </div>
                ) : filteredRoster.length === 0 ? (
                  <div className="p-8 text-center text-xs">
                    <p className={mutedClass}>No users match your current filter criteria.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className={subtleClass}>
                          <th className="py-3 px-4 font-bold">Client</th>
                          <th className="py-3 px-4 font-bold">Substances</th>
                          <th className="py-3 px-4 font-bold">Journal Logs</th>
                          <th className="py-3 px-4 font-bold">Role 01 Goals</th>
                          <th className="py-3 px-4 font-bold">Calendar</th>
                          <th className="py-3 px-4 font-bold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-inherit">
                        {filteredRoster.map(u => {
                          const goalPct =
                            u.goalsCount > 0
                              ? Math.round((u.completedGoalsCount / u.goalsCount) * 100)
                              : 0;
                          return (
                            <tr
                              key={u.id}
                              className={
                                isNight ? 'hover:bg-[#241830]/60' : 'hover:bg-[#FAF8FC]'
                              }
                            >
                              <td className="py-3.5 px-4">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-bold text-sm">{u.name}</span>
                                  {(u.isYouth || u.ageRange === 'youth' || u.ageRange === '12_17') && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                                      Youth Safeguarding
                                    </span>
                                  )}
                                  {u.carePlanStatus && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#059669]/15 text-[#059669] capitalize">
                                      {u.carePlanStatus.replace(/_/g, ' ')}
                                    </span>
                                  )}
                                </div>
                                <div className={`text-[11px] mt-0.5 ${mutedClass}`}>
                                  @{u.username} · {u.district} · {AGE_LABELS[u.ageRange] || u.ageRange}
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                {u.substancesCount === 0 ? (
                                  <span className={mutedClass}>None recorded</span>
                                ) : (
                                  <div>
                                    <div className="font-semibold truncate max-w-[200px]">
                                      {u.substanceNames[0]}
                                      {u.substancesCount > 1 ? ` +${u.substancesCount - 1}` : ''}
                                    </div>
                                    {u.unverifiedSubstancesCount > 0 && (
                                      <div className="text-[11px] font-bold text-amber-600 mt-0.5 tabular-nums">
                                        {u.unverifiedSubstancesCount} unverified
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="py-3.5 px-4 tabular-nums">
                                <div className="font-bold">{u.logsCount} entries</div>
                                <div className={`text-[11px] mt-0.5 ${mutedClass}`}>
                                  {u.lastLogDate
                                    ? `${u.lastLogDate}${u.latestMood ? ` · ${MOOD_LABELS[u.latestMood] || u.latestMood}` : ''}`
                                    : 'No entries yet'}
                                  {u.unreviewedLogsCount > 0 && (
                                    <span className="text-[#059669] font-bold">
                                      {' '}
                                      · {u.unreviewedLogsCount} unreviewed
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3.5 px-4 tabular-nums">
                                <div className="font-bold">
                                  {u.completedGoalsCount}/{u.goalsCount} done ({goalPct}%)
                                </div>
                                <div className="w-24 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 mt-1.5 overflow-hidden">
                                  <div
                                    className="h-full bg-[#059669]"
                                    style={{ width: `${goalPct}%` }}
                                  />
                                </div>
                              </td>
                              <td className="py-3.5 px-4 tabular-nums">
                                <div className="font-bold">{u.calendarEventsCount} events</div>
                                <div className={`text-[11px] mt-0.5 ${mutedClass}`}>
                                  {u.upcomingEventsCount} upcoming
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openClientCare(u.id, 'logs')}
                                    className="px-3 py-1.5 rounded-lg bg-[#4A154B] hover:bg-[#3A103B] text-white font-bold text-[11px] cursor-pointer"
                                  >
                                    Manage Role 01
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openClientCare(u.id, 'calendar')}
                                    className={`px-2.5 py-1.5 rounded-lg font-semibold text-[11px] cursor-pointer ${subtleClass}`}
                                    title="Open Client Calendar"
                                  >
                                    Calendar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => openPatientReport(u.id)}
                                    className="px-2.5 py-1.5 rounded-lg bg-[#059669]/15 text-[#059669] hover:bg-[#059669]/25 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                                    title="Download or Print Patient Report"
                                  >
                                    <Download className="w-3 h-3" />
                                    <span>Download Report</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* =========================================================
              SECTIONS 3–6: CASE DETAILS / SUPPORT PLANS / MESSAGES / SCHEDULE & REPORTS
          ========================================================= */}
          {(section === 'case_details' ||
            section === 'support_plans' ||
            section === 'messages' ||
            section === 'schedule_reports') && (
            <div className="space-y-5">
              {/* Top Client Selector & Profile Banner */}
              <div className={`${surfaceClass} rounded-2xl p-4 sm:p-5 space-y-4`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="text-xs font-bold uppercase tracking-wider text-[#059669]">
                      {section === 'case_details'
                        ? 'Case Details & Privacy Scope'
                        : section === 'support_plans'
                        ? 'Support Plans & Goals'
                        : section === 'messages'
                        ? 'Two-Way Messages & Requests'
                        : 'Schedule, Referrals & Reports'}
                    </div>
                    {clientBundle ? (
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h1 className="text-xl sm:text-2xl font-bold">{clientBundle.profile.name}</h1>
                        <span className={`text-xs ${mutedClass}`}>
                          @{clientBundle.profile.username} · {clientBundle.profile.district || 'Kerala'} ·{' '}
                          {AGE_LABELS[clientBundle.profile.ageRange || ''] ||
                            clientBundle.profile.ageRange ||
                            'Adult'}
                        </span>
                      </div>
                    ) : (
                      <h1 className="text-xl font-bold">Select a Case to Begin</h1>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {overviewUsers.length > 0 && (
                      <select
                        value={selectedUserId || ''}
                        onChange={e => setSelectedUserId(e.target.value)}
                        aria-label="Switch Role 01 Client"
                        className={`px-3 py-2 rounded-xl text-xs font-semibold ${inputClass}`}
                      >
                        {overviewUsers.map(u => (
                          <option key={u.id} value={u.id}>
                            {u.name} (@{u.username})
                          </option>
                        ))}
                      </select>
                    )}

                    {clientBundle && (
                      <>
                        <button
                          type="button"
                          onClick={() => setReportModalOpen(true)}
                          className="px-3 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Export Summary Report</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProfileUserId(clientBundle.profile.id);
                            setEditProfileName(clientBundle.profile.name);
                            setEditProfileDistrict(clientBundle.profile.district || '');
                            setEditProfileAge(clientBundle.profile.ageRange || 'young_adult');
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${subtleClass}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit Profile</span>
                        </button>
                      </>
                    )}

                    {selectedUserId && (
                      <button
                        type="button"
                        onClick={() => refreshAllForClient(selectedUserId)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${subtleClass}`}
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingClient ? 'animate-spin' : ''}`} />
                        <span>Sync</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Patient Granular Consent & Withheld Categories Banner */}
                {clientBundle && (
                  <div className={`p-3.5 rounded-xl text-xs space-y-1.5 ${subtleClass}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#059669]" />
                        <span>
                          Shared With You:{' '}
                          {clientBundle.activePermissions && clientBundle.activePermissions.length > 0
                            ? `${clientBundle.activePermissions.length}/10 categories authorized`
                            : 'Full connection active'}
                          {clientBundle.permissionGrant?.expiresAt
                            ? ` · Expires ${clientBundle.permissionGrant.expiresAt.split('T')[0]}`
                            : ''}
                        </span>
                      </span>
                      <span className={mutedClass}>Strictly controlled by patient privacy consent</span>
                    </div>
                    {clientBundle.withheldCategories && clientBundle.withheldCategories.length > 0 && (
                      <div className="text-amber-800 dark:text-amber-300 font-medium">
                        Withheld by patient&apos;s privacy settings:{' '}
                        {clientBundle.withheldCategories
                          .map(c => PERMISSION_CATEGORY_META.find(m => m.id === c)?.label || c.replace(/_/g, ' '))
                          .join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {/* Youth / Minor Safeguarding Notice */}
                {clientBundle?.profile.ageRange === 'youth' && (
                  <div
                    className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                      isNight
                        ? 'bg-amber-950/50 border border-amber-700/70 text-amber-200'
                        : 'bg-amber-50 border border-amber-200 text-amber-950'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <div>
                      <div className="font-bold">Youth Safeguarding Protocol (13–17)</div>
                      <p className="mt-0.5 opacity-90">
                        This user is in the Youth age group. Keep family boundaries respectful and use Childline (1098) or Tele-MANAS (14416) if urgent help is ever needed.
                      </p>
                    </div>
                  </div>
                )}

                {/* Sub-Navigation Tabs inside Case Workspace */}
                {clientBundle && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-inherit">
                    {(
                      [
                        {
                          id: 'logs',
                          label: 'Progress Logs & Journals',
                          count: clientBundle.dailyLogs.length,
                          icon: BookOpen,
                        },
                        {
                          id: 'goals',
                          label: 'Goals & Support Plan',
                          count: clientBundle.goals.length,
                          icon: Target,
                        },
                        {
                          id: 'calendar',
                          label: 'Calendar & Schedule',
                          count: clientBundle.calendarEvents.length,
                          icon: CalendarIcon,
                        },
                        {
                          id: 'substances',
                          label: 'Substances & Intake',
                          count: clientBundle.substanceConcerns.length,
                          icon: ClipboardList,
                        },
                        {
                          id: 'clinical_vault',
                          label: 'Clinical Notes, Follow-Ups & AI',
                          count: (clientBundle.clinicalNotes?.length || 0) + (clientBundle.referrals?.length || 0),
                          icon: FileLock2,
                        },
                        {
                          id: 'care_tools',
                          label: 'Assignments & Messages',
                          count: clientBundle.assignments.length + clientBundle.messages.length,
                          icon: MessageSquare,
                        },
                      ] as const
                    ).map(tab => {
                      const Icon = tab.icon;
                      const active = clientSubTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setClientSubTab(tab.id)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors ${
                            active
                              ? 'bg-[#4A154B] text-white'
                              : `${subtleClass} ${mutedClass} hover:opacity-100`
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{tab.label}</span>
                          <span
                            className={`tabular-nums text-[11px] ${
                              active ? 'text-[#6EE7B7]' : 'opacity-70'
                            }`}
                          >
                            {tab.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {!clientBundle ? (
                <div className={`${surfaceClass} rounded-2xl p-10 text-center space-y-3`}>
                  <Stethoscope className="w-8 h-8 text-[#059669] mx-auto" />
                  <h2 className="text-base font-bold">No Client Selected</h2>
                  <p className={`text-xs max-w-md mx-auto ${mutedClass}`}>
                    {overviewUsers.length === 0
                      ? 'No users have signed up yet. Onboard a patient manually or wait for real user signups.'
                      : 'Choose any Role 01 client from the roster or dropdown above.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddPatientModal(true)}
                    className="px-4 py-2 rounded-xl bg-[#059669] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Onboard Patient</span>
                  </button>
                </div>
              ) : (
                <>
                  {/* COMPACT AI RECOMMENDATION BAR (REQUIRES CLINICIAN APPROVAL) */}
                  {aiAssistResult?.compactRecommendationBar ? (
                    <CompactAiRecommendationBarView
                      bar={aiAssistResult.compactRecommendationBar}
                      onDraftPlanProposal={() => {
                        setProposalDraftSeed({
                          title: `Collaborative Adjustment · ${clientBundle.profile.name}`,
                          objectives: aiAssistResult.focusAreas?.slice(0, 3) || [],
                          routines:
                            aiAssistResult.draftActivities?.map(a => a.title) || [],
                          recommendations: [
                            aiAssistResult.compactRecommendationBar!.suggestedActionForClinician,
                          ],
                          rationale: aiAssistResult.compactRecommendationBar!.reasoning,
                        });
                        setClientSubTab('goals');
                      }}
                      onOpenClinicalVault={() => setClientSubTab('clinical_vault')}
                      nightSurface={isNight}
                    />
                  ) : (
                    <div className={`${surfaceClass} rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs`}>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#059669] shrink-0" />
                        <span>
                          <strong>Compact Case Decision Support:</strong> Analyze recent logs, overdue steps, and gaps before planning adjustments.
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={aiAssistBusy}
                        onClick={handleRunAiClinicianAssist}
                        className="px-3.5 py-2 rounded-xl bg-[#4A154B] hover:bg-[#3A103B] disabled:opacity-60 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#6EE7B7]" />
                        <span>{aiAssistBusy ? 'Analyzing Case...' : 'Run Compact Case Assist'}</span>
                      </button>
                    </div>
                  )}

                  {/* SUB-TAB A: PROGRESS LOGS & JOURNAL ENTRIES */}
                  {clientSubTab === 'logs' && (
                    <div className="space-y-4">
                      {clientBundle.measurableIndicators && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                          <div className={`${surfaceClass} rounded-2xl p-3.5 space-y-0.5`}>
                            <div className={mutedClass}>Goal Completion</div>
                            <div className="text-lg font-extrabold tabular-nums text-[#059669]">
                              {clientBundle.measurableIndicators.goalCompletionPct !== null
                                ? `${clientBundle.measurableIndicators.goalCompletionPct}%`
                                : '—'}
                            </div>
                            <div className={`text-[11px] tabular-nums ${mutedClass}`}>
                              {clientBundle.measurableIndicators.completedGoalsCount}/{clientBundle.measurableIndicators.totalGoalsCount} goals
                            </div>
                          </div>
                          <div className={`${surfaceClass} rounded-2xl p-3.5 space-y-0.5`}>
                            <div className={mutedClass}>7-Day Check-In Consistency</div>
                            <div className="text-lg font-extrabold tabular-nums">
                              {clientBundle.measurableIndicators.checkInConsistency7dPct}%
                            </div>
                            <div className={`text-[11px] tabular-nums ${mutedClass}`}>
                              {clientBundle.measurableIndicators.uniqueCheckInDays7d}/7 active days
                            </div>
                          </div>
                          <div className={`${surfaceClass} rounded-2xl p-3.5 space-y-0.5`}>
                            <div className={mutedClass}>Appointment Attendance</div>
                            <div className="text-lg font-extrabold tabular-nums">
                              {clientBundle.measurableIndicators.appointmentAttendancePct !== null
                                ? `${clientBundle.measurableIndicators.appointmentAttendancePct}%`
                                : '—'}
                            </div>
                            <div className={`text-[11px] tabular-nums ${mutedClass}`}>
                              {clientBundle.measurableIndicators.completedAppointmentsCount} done · {clientBundle.measurableIndicators.missedAppointmentsCount} missed
                            </div>
                          </div>
                          <div className={`${surfaceClass} rounded-2xl p-3.5 space-y-0.5`}>
                            <div className={mutedClass}>Positive Mood (7d vs Prior)</div>
                            <div className="text-lg font-extrabold tabular-nums text-[#4A154B]">
                              {clientBundle.measurableIndicators.moodTrendComparison.recent7dPositivePct !== null
                                ? `${clientBundle.measurableIndicators.moodTrendComparison.recent7dPositivePct}%`
                                : '—'}
                            </div>
                            <div className={`text-[11px] tabular-nums ${mutedClass}`}>
                              Prior 7d:{' '}
                              {clientBundle.measurableIndicators.moodTrendComparison.prior7dPositivePct !== null
                                ? `${clientBundle.measurableIndicators.moodTrendComparison.prior7dPositivePct}%`
                                : 'No baseline'}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className={`${surfaceClass} rounded-2xl p-4 space-y-3`}>
                        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                          <div className="relative flex-1">
                            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${mutedClass}`} />
                            <input
                              type="text"
                              value={logSearch}
                              onChange={e => setLogSearch(e.target.value)}
                              placeholder="Search voice journals, notes, triggers, or activities..."
                              className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs ${inputClass}`}
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <select
                              value={logTimeframe}
                              onChange={e =>
                                setLogTimeframe(e.target.value as 'all' | '7d' | '30d' | 'custom')
                              }
                              className={`px-3 py-2 rounded-xl text-xs font-semibold ${inputClass}`}
                            >
                              <option value="all">All Time</option>
                              <option value="7d">Last 7 Days</option>
                              <option value="30d">Last 30 Days</option>
                              <option value="custom">Custom Dates</option>
                            </select>
                            <select
                              value={logFilter}
                              onChange={e =>
                                setLogFilter(
                                  e.target.value as 'all' | 'needs_review' | 'challenged' | 'detailed'
                                )
                              }
                              className={`px-3 py-2 rounded-xl text-xs font-semibold ${inputClass}`}
                            >
                              <option value="all">All Logs ({clientBundle.dailyLogs.length})</option>
                              <option value="needs_review">Needs Clinician Review</option>
                              <option value="challenged">Challenged / Heavy Moods</option>
                              <option value="detailed">Detailed Reflections Only</option>
                            </select>
                          </div>
                        </div>

                        {logTimeframe === 'custom' && (
                          <div className="grid grid-cols-2 gap-2 max-w-sm text-xs">
                            <input
                              type="date"
                              value={logDateFrom}
                              onChange={e => setLogDateFrom(e.target.value)}
                              className={`px-3 py-1.5 rounded-xl ${inputClass}`}
                            />
                            <input
                              type="date"
                              value={logDateTo}
                              onChange={e => setLogDateTo(e.target.value)}
                              className={`px-3 py-1.5 rounded-xl ${inputClass}`}
                            />
                          </div>
                        )}
                      </div>

                      {filteredLogs.length === 0 ? (
                        <div className={`${surfaceClass} rounded-2xl p-10 text-center space-y-2`}>
                          <BookOpen className={`w-7 h-7 mx-auto ${mutedClass}`} />
                          <h3 className="text-sm font-bold">No Progress or Journal Logs Recorded</h3>
                          <p className={`text-xs max-w-md mx-auto ${mutedClass}`}>
                            When {clientBundle.profile.name} records a Daily Log or Voice-to-Journal reflection in Role 01, every entry will appear here for clinician review.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredLogs.map(log => {
                            const draft =
                              logReviewDrafts[log.id] !== undefined
                                ? logReviewDrafts[log.id]
                                : log.clinicianReviewNote || '';
                            const isEditingNote =
                              editingLogReviewId === log.id || !log.clinicianReviewNote;

                            return (
                              <article key={log.id} className={`${surfaceClass} rounded-2xl p-5 space-y-3`}>
                                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                                  <div className="flex flex-wrap items-center gap-2 font-semibold">
                                    <span className="tabular-nums font-bold">{log.date}</span>
                                    <span className={mutedClass}>·</span>
                                    <span className="capitalize">
                                      {log.type === 'detailed' ? 'Detailed Reflection' : 'Quick Check-In'}
                                    </span>
                                    {log.mood && (
                                      <>
                                        <span className={mutedClass}>·</span>
                                        <span className="text-[#059669] font-bold">
                                          Mood: {MOOD_LABELS[log.mood] || log.mood}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <span className={`text-[11px] tabular-nums ${mutedClass}`}>
                                    {new Date(log.timestamp).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>

                                {log.quickNote && (
                                  <p className="text-sm leading-relaxed">{log.quickNote}</p>
                                )}

                                {log.personalReflection && (
                                  <p className={`text-xs italic leading-relaxed ${mutedClass}`}>
                                    &ldquo;{log.personalReflection}&rdquo;
                                  </p>
                                )}

                                {log.detailedQuestions && (
                                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl text-xs ${subtleClass}`}>
                                    {log.detailedQuestions.dayOverview && (
                                      <div>
                                        <div className="font-bold">Day Overview</div>
                                        <p className={mutedClass}>{log.detailedQuestions.dayOverview}</p>
                                      </div>
                                    )}
                                    {log.detailedQuestions.wentWell && (
                                      <div>
                                        <div className="font-bold">What Went Well</div>
                                        <p className={mutedClass}>{log.detailedQuestions.wentWell}</p>
                                      </div>
                                    )}
                                    {log.detailedQuestions.difficulties && (
                                      <div>
                                        <div className="font-bold">Challenges / Triggers</div>
                                        <p className={mutedClass}>{log.detailedQuestions.difficulties}</p>
                                      </div>
                                    )}
                                    {log.detailedQuestions.learned && (
                                      <div>
                                        <div className="font-bold">Key Lesson</div>
                                        <p className={mutedClass}>{log.detailedQuestions.learned}</p>
                                      </div>
                                    )}
                                    {log.detailedQuestions.supportNeeded && (
                                      <div>
                                        <div className="font-bold">Support Requested</div>
                                        <p className={mutedClass}>{log.detailedQuestions.supportNeeded}</p>
                                      </div>
                                    )}
                                    {log.detailedQuestions.tomorrowFocus && (
                                      <div>
                                        <div className="font-bold">Tomorrow&apos;s Focus</div>
                                        <p className={mutedClass}>{log.detailedQuestions.tomorrowFocus}</p>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {(log.completedActivities?.length > 0 || log.tags?.length > 0) && (
                                  <div className={`text-[11px] flex flex-wrap gap-x-3 gap-y-1 ${mutedClass}`}>
                                    {log.completedActivities?.length > 0 && (
                                      <span>Activities: {log.completedActivities.join(' · ')}</span>
                                    )}
                                    {log.tags?.length > 0 && (
                                      <span className="font-mono">
                                        {log.tags.map(t => `#${t}`).join(' ')}
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Clinician Feedback Sync Block */}
                                <div className="pt-3 border-t border-inherit space-y-2">
                                  {log.clinicianReviewNote && !isEditingNote ? (
                                    <div className={`p-3 rounded-xl text-xs flex items-start justify-between gap-3 ${subtleClass}`}>
                                      <div className="space-y-0.5">
                                        <div className="font-bold text-[#059669]">
                                          Clinician Note · {log.reviewedByTherapistName || serverAuthUser?.name}
                                        </div>
                                        <p className="leading-relaxed">{log.clinicianReviewNote}</p>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setLogReviewDrafts(prev => ({
                                            ...prev,
                                            [log.id]: log.clinicianReviewNote || '',
                                          }));
                                          setEditingLogReviewId(log.id);
                                        }}
                                        className={`text-[11px] font-bold underline shrink-0 cursor-pointer ${mutedClass}`}
                                      >
                                        Edit
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col sm:flex-row gap-2">
                                      <input
                                        type="text"
                                        value={draft}
                                        onChange={e =>
                                          setLogReviewDrafts(prev => ({
                                            ...prev,
                                            [log.id]: e.target.value,
                                          }))
                                        }
                                        placeholder="Write encouraging clinician feedback (syncs to user Daily Log)..."
                                        className={`flex-1 px-3 py-2 rounded-xl text-xs ${inputClass}`}
                                      />
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => handleSaveLogReview(log.id)}
                                          className="px-3.5 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold cursor-pointer"
                                        >
                                          Save Note
                                        </button>
                                        {log.clinicianReviewNote && (
                                          <button
                                            type="button"
                                            onClick={() => setEditingLogReviewId(null)}
                                            className={`px-2.5 py-2 rounded-xl text-xs font-semibold cursor-pointer ${subtleClass}`}
                                          >
                                            Cancel
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      )}

                      {/* Weekly Progress Check-Ins if submitted */}
                      {clientBundle.weeklyProgress.length > 0 && (
                        <section className={`${surfaceClass} rounded-2xl p-5 space-y-3`}>
                          <h3 className="text-sm font-bold">Weekly Progress Check-Ins</h3>
                          <div className="space-y-3">
                            {clientBundle.weeklyProgress.map(wp => (
                              <div key={wp.id} className={`p-4 rounded-xl space-y-2 text-xs ${subtleClass}`}>
                                <div className="font-bold tabular-nums">Week of {wp.weekStarting}</div>
                                {wp.whatHelped && (
                                  <p>
                                    <span className="font-semibold">What helped:</span> {wp.whatHelped}
                                  </p>
                                )}
                                {wp.difficulties && (
                                  <p>
                                    <span className="font-semibold">Difficulties:</span> {wp.difficulties}
                                  </p>
                                )}
                                {wp.questionsForTherapist && (
                                  <p>
                                    <span className="font-semibold">Client Question:</span> {wp.questionsForTherapist}
                                  </p>
                                )}
                                {wp.therapistResponse ? (
                                  <div className="text-[#059669] font-semibold">
                                    Your Reply: {wp.therapistResponse}
                                  </div>
                                ) : (
                                  <div className="flex gap-2 pt-1">
                                    <input
                                      type="text"
                                      value={weeklyReplyDrafts[wp.id] || ''}
                                      onChange={e =>
                                        setWeeklyReplyDrafts(prev => ({
                                          ...prev,
                                          [wp.id]: e.target.value,
                                        }))
                                      }
                                      placeholder="Reply to weekly check-in..."
                                      className={`flex-1 px-3 py-1.5 rounded-lg text-xs ${inputClass}`}
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleReplyWeekly(wp.id)}
                                      className="px-3 py-1.5 rounded-lg bg-[#4A154B] text-white font-bold cursor-pointer"
                                    >
                                      Send
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </section>
                      )}

                      {/* Consented AI Recovery Reports (Only visible with weekly_reports / screening consent) */}
                      {clientBundle.recoveryReports && clientBundle.recoveryReports.length > 0 && (
                        <section className={`${surfaceClass} rounded-2xl p-5 space-y-3`}>
                          <h3 className="text-sm font-bold">
                            Consented Client Recovery Reports ({clientBundle.recoveryReports.length})
                          </h3>
                          <p className={`text-[11px] ${mutedClass}`}>
                            Shared per client consent. Self-reported reflection tracking stays clearly marked apart from clinician intake notes.
                          </p>
                          <div className="space-y-3">
                            {clientBundle.recoveryReports.slice(0, 4).map(rep => (
                              <div key={rep.id} className={`p-4 rounded-xl space-y-1.5 text-xs ${subtleClass}`}>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="font-bold uppercase">
                                    {rep.period} · {rep.periodStart} to {rep.periodEnd}
                                  </span>
                                  <span className="text-[11px] font-semibold text-[#059669]">
                                    {rep.careStatusNote}
                                  </span>
                                </div>
                                <p>{rep.summary}</p>
                                <div className={`text-[11px] ${mutedClass}`}>
                                  {rep.routineAndSleepNote}
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                    </div>
                  )}

                  {/* SUB-TAB B: GOALS & SUPPORT PLAN CONTROL */}
                  {clientSubTab === 'goals' && (
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                      {/* Left 7 Cols: Role 01 Goals Full CRUD */}
                      <div className="xl:col-span-7 space-y-4">
                        <div className={`${surfaceClass} rounded-2xl p-5 space-y-4`}>
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <h2 className="text-base font-bold">Role 01 Recovery Goals</h2>
                              <p className={`text-xs ${mutedClass}`}>
                                Create, modify, toggle milestones, or adjust target dates directly for {clientBundle.profile.name}.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowGoalForm(v => !v)}
                              className="px-3.5 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                            >
                              {showGoalForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                              <span>{showGoalForm ? 'Close' : 'New Goal'}</span>
                            </button>
                          </div>

                          {showGoalForm && (
                            <form onSubmit={handleCreateGoal} className={`p-4 rounded-xl space-y-3 text-xs ${subtleClass}`}>
                              <div className="font-bold text-sm">Add Clinician-Guided Goal</div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block font-semibold mb-1">Goal Title *</label>
                                  <input
                                    type="text"
                                    value={goalTitle}
                                    onChange={e => setGoalTitle(e.target.value)}
                                    placeholder="e.g. 20-minute evening walk at 6:30 PM"
                                    required
                                    className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold mb-1">Category</label>
                                  <select
                                    value={goalCategory}
                                    onChange={e => setGoalCategory(e.target.value as GoalCategory)}
                                    className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                                  >
                                    {GOAL_CATEGORY_OPTIONS.map(c => (
                                      <option key={c.id} value={c.id}>
                                        {c.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div>
                                <label className="block font-semibold mb-1">Description / Guidance</label>
                                <textarea
                                  rows={2}
                                  value={goalDesc}
                                  onChange={e => setGoalDesc(e.target.value)}
                                  placeholder="Practical steps and why this goal supports recovery..."
                                  className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                                />
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <label className="block font-semibold mb-1">Frequency</label>
                                  <select
                                    value={goalFrequency}
                                    onChange={e =>
                                      setGoalFrequency(e.target.value as 'daily' | 'weekly' | 'custom')
                                    }
                                    className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                                  >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="custom">Custom</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block font-semibold mb-1">Target Date</label>
                                  <input
                                    type="date"
                                    value={goalTargetDate}
                                    onChange={e => setGoalTargetDate(e.target.value)}
                                    className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block font-semibold mb-1">
                                  Action Milestones (comma or newline separated)
                                </label>
                                <input
                                  type="text"
                                  value={goalMilestonesInput}
                                  onChange={e => setGoalMilestonesInput(e.target.value)}
                                  placeholder="Set shoes by door, 3 evening walks this week"
                                  className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                                />
                              </div>
                              <button
                                type="submit"
                                className="px-4 py-2 rounded-xl bg-[#4A154B] hover:bg-[#3A103B] text-white font-bold cursor-pointer"
                              >
                                Save Goal to Client Profile
                              </button>
                            </form>
                          )}

                          {clientBundle.goals.length === 0 ? (
                            <div className={`p-8 rounded-xl text-center text-xs ${subtleClass}`}>
                              <p className={mutedClass}>
                                No Role 01 goals created yet. Click &ldquo;New Goal&rdquo; to set a structured target together.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {clientBundle.goals.map(goal => {
                                const isEditing = editingGoalId === goal.id;
                                return (
                                  <div key={goal.id} className={`p-4 rounded-xl space-y-3 ${subtleClass}`}>
                                    {isEditing ? (
                                      <div className="space-y-2.5 text-xs">
                                        <input
                                          type="text"
                                          value={editGoalDraft.title}
                                          onChange={e =>
                                            setEditGoalDraft(p => ({ ...p, title: e.target.value }))
                                          }
                                          className={`w-full px-3 py-2 rounded-lg font-bold ${inputClass}`}
                                        />
                                        <textarea
                                          rows={2}
                                          value={editGoalDraft.description}
                                          onChange={e =>
                                            setEditGoalDraft(p => ({ ...p, description: e.target.value }))
                                          }
                                          className={`w-full px-3 py-2 rounded-lg ${inputClass}`}
                                        />
                                          <div className="grid grid-cols-3 gap-2">
                                            <select
                                              value={editGoalDraft.category}
                                              onChange={e =>
                                                setEditGoalDraft(p => ({
                                                  ...p,
                                                  category: e.target.value as GoalCategory,
                                                }))
                                              }
                                              className={`px-2 py-1.5 rounded-lg ${inputClass}`}
                                            >
                                              {GOAL_CATEGORY_OPTIONS.map(c => (
                                                <option key={c.id} value={c.id}>
                                                  {c.label}
                                                </option>
                                              ))}
                                            </select>
                                            <select
                                              value={editGoalDraft.frequency}
                                              onChange={e =>
                                                setEditGoalDraft(p => ({
                                                  ...p,
                                                  frequency: e.target.value as 'daily' | 'weekly' | 'custom',
                                                }))
                                              }
                                              className={`px-2 py-1.5 rounded-lg ${inputClass}`}
                                            >
                                              <option value="daily">Daily</option>
                                              <option value="weekly">Weekly</option>
                                              <option value="custom">Custom</option>
                                            </select>
                                            <input
                                              type="date"
                                              value={editGoalDraft.targetDate}
                                              onChange={e =>
                                                setEditGoalDraft(p => ({ ...p, targetDate: e.target.value }))
                                              }
                                              className={`px-2 py-1.5 rounded-lg ${inputClass}`}
                                            />
                                          </div>
                                          <input
                                            type="text"
                                            value={editGoalDraft.therapistChangeNote}
                                            onChange={e =>
                                              setEditGoalDraft(p => ({
                                                ...p,
                                                therapistChangeNote: e.target.value,
                                              }))
                                            }
                                            placeholder="Optional clinician change note shown to client..."
                                            className={`w-full px-3 py-1.5 rounded-lg ${inputClass}`}
                                          />
                                          <div className="flex gap-2">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                handlePatchGoal(goal.id, editGoalDraft, 'Goal updated.');
                                                setEditingGoalId(null);
                                              }}
                                              className="px-3 py-1.5 rounded-lg bg-[#059669] text-white font-bold cursor-pointer"
                                            >
                                              Save Changes
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setEditingGoalId(null)}
                                              className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${surfaceClass}`}
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="flex items-start justify-between gap-2">
                                            <div>
                                              <div className="flex items-center gap-2">
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handlePatchGoal(
                                                      goal.id,
                                                      { completed: !goal.completed },
                                                      goal.completed ? 'Goal reopened.' : 'Goal marked complete.'
                                                    )
                                                  }
                                                  className={`w-5 h-5 rounded-md flex items-center justify-center border cursor-pointer shrink-0 ${
                                                    goal.completed
                                                      ? 'bg-[#059669] border-[#059669] text-white'
                                                      : 'border-slate-400'
                                                  }`}
                                                  title="Toggle Goal Completion"
                                                >
                                                  {goal.completed && <Check className="w-3.5 h-3.5" />}
                                                </button>
                                                <h3
                                                  className={`text-sm font-bold ${
                                                    goal.completed ? 'line-through opacity-70' : ''
                                                  }`}
                                                >
                                                  {goal.title}
                                                </h3>
                                              </div>
                                              <div className={`text-[11px] mt-1 tabular-nums ${mutedClass}`}>
                                                {goal.category} · {goal.frequency}
                                                {goal.targetDate ? ` · Target ${goal.targetDate}` : ''}
                                                {goal.updatedByRole === 'therapist'
                                                  ? ` · Updated by ${goal.updatedByTherapistName || 'Therapist'}`
                                                  : goal.createdByRole === 'therapist'
                                                  ? ' · Therapist-guided'
                                                  : ''}
                                              </div>
                                              {goal.therapistChangeNote && (
                                                <div className="text-[11px] mt-0.5 text-[#059669] font-semibold">
                                                  Note: {goal.therapistChangeNote}
                                                </div>
                                              )}
                                            </div>

                                            <div className="flex items-center gap-1 shrink-0">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setEditingGoalId(goal.id);
                                                  setEditGoalDraft({
                                                    title: goal.title,
                                                    description: goal.description,
                                                    category: goal.category,
                                                    frequency: goal.frequency,
                                                    targetDate: goal.targetDate || '',
                                                    therapistChangeNote: goal.therapistChangeNote || '',
                                                  });
                                                }}
                                              className={`p-1.5 rounded-lg hover:opacity-80 cursor-pointer ${mutedClass}`}
                                              title="Edit Goal"
                                            >
                                              <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            {confirmDeleteGoalId === goal.id ? (
                                              <button
                                                type="button"
                                                onClick={() => handleDeleteGoal(goal.id)}
                                                className="px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-bold cursor-pointer"
                                              >
                                                Confirm Delete
                                              </button>
                                            ) : (
                                              <button
                                                type="button"
                                                onClick={() => setConfirmDeleteGoalId(goal.id)}
                                                className={`p-1.5 rounded-lg hover:text-rose-600 cursor-pointer ${mutedClass}`}
                                                title="Delete Goal"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            )}
                                          </div>
                                        </div>

                                        {goal.description && (
                                          <p className={`text-xs leading-relaxed ${mutedClass}`}>
                                            {goal.description}
                                          </p>
                                        )}

                                        {/* Milestones */}
                                        {goal.milestones.length > 0 && (
                                          <div className="space-y-1.5 pl-1">
                                            {goal.milestones.map(ms => (
                                              <label
                                                key={ms.id}
                                                className="flex items-center gap-2 text-xs cursor-pointer"
                                              >
                                                <input
                                                  type="checkbox"
                                                  checked={ms.completed}
                                                  onChange={() =>
                                                    handlePatchGoal(goal.id, {
                                                      toggleMilestoneId: ms.id,
                                                    })
                                                  }
                                                />
                                                <span className={ms.completed ? 'line-through opacity-70' : ''}>
                                                  {ms.title}
                                                </span>
                                              </label>
                                            ))}
                                          </div>
                                        )}

                                        {/* Quick Add Milestone + Clinician Progress Note */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                                          <div className="flex gap-1.5">
                                            <input
                                              type="text"
                                              value={milestoneInputs[goal.id] || ''}
                                              onChange={e =>
                                                setMilestoneInputs(p => ({ ...p, [goal.id]: e.target.value }))
                                              }
                                              placeholder="Add milestone step..."
                                              className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs ${inputClass}`}
                                            />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const t = (milestoneInputs[goal.id] || '').trim();
                                                if (!t) return;
                                                setMilestoneInputs(p => ({ ...p, [goal.id]: '' }));
                                                handlePatchGoal(goal.id, { addMilestoneTitle: t });
                                              }}
                                              className={`px-2.5 py-1.5 rounded-lg font-bold cursor-pointer ${surfaceClass}`}
                                            >
                                              + Step
                                            </button>
                                          </div>
                                          <div className="flex gap-1.5">
                                            <input
                                              type="text"
                                              value={goalNoteInputs[goal.id] || ''}
                                              onChange={e =>
                                                setGoalNoteInputs(p => ({ ...p, [goal.id]: e.target.value }))
                                              }
                                              placeholder="Add clinician progress note..."
                                              className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs ${inputClass}`}
                                            />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const n = (goalNoteInputs[goal.id] || '').trim();
                                                if (!n) return;
                                                setGoalNoteInputs(p => ({ ...p, [goal.id]: '' }));
                                                handlePatchGoal(goal.id, { addProgressNote: n }, 'Note added.');
                                              }}
                                              className="px-2.5 py-1.5 rounded-lg bg-[#4A154B] text-white font-bold cursor-pointer"
                                            >
                                              Note
                                            </button>
                                          </div>
                                        </div>

                                        {goal.progressNotes.length > 0 && (
                                          <div className={`text-[11px] space-y-1 pt-1 border-t border-inherit ${mutedClass}`}>
                                            {goal.progressNotes.slice(0, 3).map(pn => (
                                              <div key={pn.id}>
                                                <span className="tabular-nums font-semibold">{pn.date}:</span> {pn.note}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right 5 Cols: Role 01 Support Plan Direct Editor */}
                      <form onSubmit={handleSaveSupportPlan} className={`xl:col-span-5 ${surfaceClass} rounded-2xl p-5 space-y-3.5 text-xs`}>
                        <div>
                          <h2 className="text-base font-bold">Personalized Support Plan</h2>
                          <p className={`text-xs mt-0.5 ${mutedClass}`}>
                            Changes saved here sync directly into {clientBundle.profile.name}&apos;s Role 01 Support Plan.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block font-semibold mb-1">Care Plan Status</label>
                            <select
                              value={planCareStatus}
                              onChange={e =>
                                setPlanCareStatus(
                                  e.target.value as 'active' | 'under_review' | 'paused' | 'completed'
                                )
                              }
                              className={`w-full px-3 py-2 rounded-xl font-semibold ${inputClass}`}
                            >
                              <option value="active">Active</option>
                              <option value="under_review">Under Review</option>
                              <option value="paused">Paused</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                          <div>
                            <label className="block font-semibold mb-1">Responsible Therapist</label>
                            <input
                              type="text"
                              value={planTherapistName}
                              onChange={e => setPlanTherapistName(e.target.value)}
                              placeholder="Treating clinician name"
                              className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Core Objectives (one per line)</label>
                          <textarea
                            rows={2}
                            value={planObjectivesText}
                            onChange={e => setPlanObjectivesText(e.target.value)}
                            placeholder="Keep evening check-in steady after 7 PM&#10;Practice 2-minute grounding daily"
                            className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Support Needs (one per line)</label>
                          <textarea
                            rows={2}
                            value={planSupportNeedsText}
                            onChange={e => setPlanSupportNeedsText(e.target.value)}
                            placeholder="Sleep stabilization&#10;Evening peer trigger support"
                            className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Approaches (comma separated)</label>
                          <input
                            type="text"
                            value={planApproachesText}
                            onChange={e => setPlanApproachesText(e.target.value)}
                            placeholder="Trigger Mapping, Breath Cadence, CBT Check-In"
                            className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Planned Interventions (one per line)</label>
                          <textarea
                            rows={2}
                            value={planInterventionsText}
                            onChange={e => setPlanInterventionsText(e.target.value)}
                            placeholder="Weekly 1:1 CBT session&#10;Urge-surfing card before 6 PM"
                            className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Next Steps (one per line)</label>
                          <textarea
                            rows={2}
                            value={planNextStepsText}
                            onChange={e => setPlanNextStepsText(e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Clinician Guidance Summary</label>
                          <textarea
                            rows={2}
                            value={planGuidanceText}
                            onChange={e => setPlanGuidanceText(e.target.value)}
                            placeholder="Supportive session takeaways and gentle weekly focus..."
                            className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                          />
                        </div>

                        <div>
                          <label className="block font-semibold mb-1">Progress Observations</label>
                          <textarea
                            rows={2}
                            value={planProgressObsText}
                            onChange={e => setPlanProgressObsText(e.target.value)}
                            placeholder="Clinician summary of progress and pacing observations..."
                            className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block font-semibold mb-1">Next Review Date</label>
                            <input
                              type="date"
                              value={planReviewDate}
                              onChange={e => setPlanReviewDate(e.target.value)}
                              className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                            />
                          </div>
                          <div>
                            <label className="block font-semibold mb-1">Next Follow-Up Date</label>
                            <input
                              type="date"
                              value={planNextFollowUpDate}
                              onChange={e => setPlanNextFollowUpDate(e.target.value)}
                              className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={savingPlan}
                          className="w-full py-2.5 rounded-xl bg-[#4A154B] hover:bg-[#3A103B] text-white font-bold cursor-pointer disabled:opacity-60"
                        >
                          {savingPlan ? 'Saving Plan...' : 'Save Support Plan Changes'}
                        </button>

                        {/* Care Plan Revision History */}
                        <div className="pt-2 border-t border-inherit">
                          <button
                            type="button"
                            onClick={() => setShowPlanRevisions(v => !v)}
                            className={`w-full flex items-center justify-between text-left font-bold py-1 cursor-pointer ${mutedClass}`}
                          >
                            <span className="inline-flex items-center gap-1.5">
                              <History className="w-3.5 h-3.5 text-[#059669]" />
                              <span>
                                Plan Revision History ({clientBundle.carePlanRevisions?.length || 0})
                              </span>
                            </span>
                            <span>{showPlanRevisions ? 'Hide' : 'Show'}</span>
                          </button>
                          {showPlanRevisions && (
                            <div className="mt-2 space-y-2 max-h-56 overflow-y-auto">
                              {!clientBundle.carePlanRevisions || clientBundle.carePlanRevisions.length === 0 ? (
                                <p className={mutedClass}>
                                  Previous support plan versions will appear here whenever updates are saved.
                                </p>
                              ) : (
                                clientBundle.carePlanRevisions.map(rev => (
                                  <div key={rev.id} className={`p-3 rounded-xl space-y-1 ${subtleClass}`}>
                                    <div className="font-bold tabular-nums">
                                      v{rev.version} · Saved {new Date(rev.createdAt).toLocaleString()} · {rev.changedByName}
                                    </div>
                                    <div className={mutedClass}>
                                      Objectives: {rev.snapshot.objectives.join(' ; ') || 'None'}
                                    </div>
                                    {rev.snapshot.professionalGuidance && (
                                      <div className={mutedClass}>
                                        Guidance: {rev.snapshot.professionalGuidance}
                                      </div>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </form>

                      <div className="xl:col-span-12">
                        <CarePlanProposalPanel
                          mode="therapist"
                          serverAuthToken={serverAuthToken}
                          proposals={clientBundle.carePlanProposals || []}
                          clientId={clientBundle.profile.id}
                          clientName={clientBundle.profile.name}
                          draftSeed={proposalDraftSeed}
                          onUpdated={() => refreshAllForClient(clientBundle.profile.id)}
                          nightSurface={isNight}
                        />
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB C: CLIENT CALENDAR & SCHEDULE CONTROL */}
                  {clientSubTab === 'calendar' && (
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                      {/* Left 7 Cols: Interactive Monthly Calendar Grid */}
                      <section className={`xl:col-span-7 ${surfaceClass} rounded-2xl p-5 space-y-4`}>
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <h2 className="text-base font-bold">
                              {MONTH_NAMES[calMonth]} {calYear}
                            </h2>
                            <p className={`text-xs ${mutedClass}`}>
                              Inspect or schedule events directly onto {clientBundle.profile.name}&apos;s Role 01 calendar.
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (calMonth === 0) {
                                  setCalMonth(11);
                                  setCalYear(y => y - 1);
                                } else {
                                  setCalMonth(m => m - 1);
                                }
                              }}
                              className={`p-2 rounded-lg cursor-pointer ${subtleClass}`}
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const now = new Date();
                                setCalYear(now.getFullYear());
                                setCalMonth(now.getMonth());
                                setSelectedCalDate(todayISO);
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${subtleClass}`}
                            >
                              Today
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (calMonth === 11) {
                                  setCalMonth(0);
                                  setCalYear(y => y + 1);
                                } else {
                                  setCalMonth(m => m + 1);
                                }
                              }}
                              className={`p-2 rounded-lg cursor-pointer ${subtleClass}`}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold">
                          {WEEKDAYS_MON.map(d => (
                            <div key={d} className={`py-1 ${mutedClass}`}>
                              {d}
                            </div>
                          ))}
                          {calendarCells.map((cell, idx) => {
                            if (!cell.iso) {
                              return <div key={`blank-${idx}`} className="h-16 sm:h-20" />;
                            }
                            const evts = eventsByDate[cell.iso] || [];
                            const isSelected = cell.iso === selectedCalDate;
                            const isToday = cell.iso === todayISO;
                            return (
                              <button
                                key={cell.iso}
                                type="button"
                                onClick={() => setSelectedCalDate(cell.iso!)}
                                className={`h-16 sm:h-20 p-1.5 rounded-xl border text-left flex flex-col justify-between transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#4A154B] border-[#4A154B] text-white'
                                    : isToday
                                    ? 'border-[#059669] bg-[#059669]/10'
                                    : isNight
                                    ? 'border-[#342444] hover:bg-[#241830]'
                                    : 'border-[#E6DFEC] hover:bg-[#F5F1F9]'
                                }`}
                              >
                                <span className="text-xs font-bold tabular-nums">{cell.day}</span>
                                {evts.length > 0 && (
                                  <div className="space-y-0.5 overflow-hidden">
                                    <div
                                      className={`text-[10px] font-bold truncate ${
                                        isSelected ? 'text-[#6EE7B7]' : 'text-[#059669]'
                                      }`}
                                    >
                                      {evts[0].title}
                                    </div>
                                    {evts.length > 1 && (
                                      <div
                                        className={`text-[9px] tabular-nums ${
                                          isSelected ? 'text-white/80' : mutedClass
                                        }`}
                                      >
                                        +{evts.length - 1} more
                                      </div>
                                    )}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </section>

                      {/* Right 5 Cols: Day Agenda + Add/Edit Event */}
                      <div className="xl:col-span-5 space-y-4">
                        <form onSubmit={handleAddCalendarEvent} className={`${surfaceClass} rounded-2xl p-5 space-y-3 text-xs`}>
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold">
                              Schedule for <span className="tabular-nums text-[#059669]">{selectedCalDate}</span>
                            </h3>
                            <Clock className={`w-4 h-4 ${mutedClass}`} />
                          </div>

                          <div>
                            <label className="block font-semibold mb-1">Event / Session Title *</label>
                            <input
                              type="text"
                              value={newEvtTitle}
                              onChange={e => setNewEvtTitle(e.target.value)}
                              placeholder="e.g. Evening check-in or Therapy Follow-up"
                              required
                              className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className="block font-semibold mb-1">Time</label>
                              <input
                                type="time"
                                value={newEvtTime}
                                onChange={e => setNewEvtTime(e.target.value)}
                                className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                              />
                            </div>
                            <div>
                              <label className="block font-semibold mb-1">Category</label>
                              <select
                                value={newEvtCategory}
                                onChange={e => setNewEvtCategory(e.target.value as EventCategory)}
                                className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                              >
                                {EVENT_CATEGORY_OPTIONS.map(opt => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block font-semibold mb-1">Guidance Notes (optional)</label>
                            <input
                              type="text"
                              value={newEvtNotes}
                              onChange={e => setNewEvtNotes(e.target.value)}
                              placeholder="Preparation topic or gentle reminder..."
                              className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold cursor-pointer inline-flex items-center justify-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add to Client Calendar</span>
                          </button>
                        </form>

                        <section className={`${surfaceClass} rounded-2xl p-5 space-y-3`}>
                          <h3 className="text-sm font-bold tabular-nums">
                            Events on {selectedCalDate} ({selectedDayEvents.length})
                          </h3>
                          {selectedDayEvents.length === 0 ? (
                            <p className={`text-xs ${mutedClass}`}>
                              No events scheduled for this date yet.
                            </p>
                          ) : (
                            <div className="space-y-2.5">
                              {selectedDayEvents.map(evt => (
                                <div key={evt.id} className={`p-3.5 rounded-xl space-y-2 text-xs ${subtleClass}`}>
                                  {editingEventId === evt.id ? (
                                      <div className="space-y-2">
                                        <input
                                          type="text"
                                          value={editEventDraft.title}
                                          onChange={e =>
                                            setEditEventDraft(p => ({ ...p, title: e.target.value }))
                                          }
                                          className={`w-full px-2.5 py-1.5 rounded-lg font-bold ${inputClass}`}
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                          <input
                                            type="date"
                                            value={editEventDraft.date}
                                            onChange={e =>
                                              setEditEventDraft(p => ({ ...p, date: e.target.value }))
                                            }
                                            className={`px-2.5 py-1.5 rounded-lg ${inputClass}`}
                                          />
                                          <input
                                            type="time"
                                            value={editEventDraft.startTime}
                                            onChange={e =>
                                              setEditEventDraft(p => ({ ...p, startTime: e.target.value }))
                                            }
                                            className={`px-2.5 py-1.5 rounded-lg ${inputClass}`}
                                          />
                                        </div>
                                        <input
                                          type="text"
                                          value={editEventDraft.therapistChangeNote}
                                          onChange={e =>
                                            setEditEventDraft(p => ({
                                              ...p,
                                              therapistChangeNote: e.target.value,
                                            }))
                                          }
                                          placeholder="Optional clinician change note..."
                                          className={`w-full px-2.5 py-1.5 rounded-lg ${inputClass}`}
                                        />
                                        <div className="flex gap-2">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handlePatchCalendarEvent(evt.id, editEventDraft, 'Event updated.')
                                            }
                                            className="px-3 py-1 rounded-lg bg-[#059669] text-white font-bold cursor-pointer"
                                          >
                                            Save
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditingEventId(null)}
                                            className={`px-3 py-1 rounded-lg font-semibold cursor-pointer ${surfaceClass}`}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-start gap-2.5 min-w-0">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handlePatchCalendarEvent(evt.id, {
                                                completed: !evt.completed,
                                              })
                                            }
                                            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer ${
                                              evt.completed
                                                ? 'bg-[#059669] border-[#059669] text-white'
                                                : 'border-slate-400'
                                            }`}
                                          >
                                            {evt.completed && <Check className="w-3 h-3" />}
                                          </button>
                                          <div className="min-w-0">
                                            <div
                                              className={`font-bold ${
                                                evt.completed ? 'line-through opacity-65' : ''
                                              }`}
                                            >
                                              {evt.title}
                                            </div>
                                            <div className={`text-[11px] tabular-nums mt-0.5 ${mutedClass}`}>
                                              {evt.startTime || 'All day'} · {evt.category.replace(/_/g, ' ')}
                                              {evt.updatedByRole === 'therapist'
                                                ? ` · Updated by ${evt.updatedByTherapistName || 'Therapist'}`
                                                : evt.createdByRole === 'therapist'
                                                ? ' · Clinician scheduled'
                                                : ''}
                                            </div>
                                            {evt.therapistChangeNote && (
                                              <p className="text-[11px] text-[#059669] font-semibold mt-0.5">
                                                Note: {evt.therapistChangeNote}
                                              </p>
                                            )}
                                            {evt.notes && <p className={`mt-1 ${mutedClass}`}>{evt.notes}</p>}
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setEditingEventId(evt.id);
                                              setEditEventDraft({
                                                title: evt.title,
                                                date: evt.date,
                                                startTime: evt.startTime || '',
                                                category: evt.category,
                                                notes: evt.notes || '',
                                                therapistChangeNote: evt.therapistChangeNote || '',
                                              });
                                            }}
                                            className={`p-1 rounded-lg cursor-pointer ${mutedClass}`}
                                            title="Edit / Reschedule"
                                          >
                                            <Pencil className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeleteCalendarEvent(evt.id)}
                                            className={`p-1 rounded-lg hover:text-rose-600 cursor-pointer ${mutedClass}`}
                                            title="Remove Event"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </section>

                          {/* Clinical Appointments & Non-Judgmental Missed-Session Follow-Up */}
                          <section className={`${surfaceClass} rounded-2xl p-5 space-y-3 text-xs`}>
                            <div>
                              <h3 className="text-sm font-bold flex items-center justify-between">
                                <span>Clinical Appointments &amp; Follow-Ups ({clientBundle.appointmentNotes.length})</span>
                              </h3>
                              <p className={`text-[11px] mt-0.5 ${mutedClass}`}>
                                Missed sessions indicate a supportive follow-up need — never relapse or failure.
                              </p>
                            </div>

                            <form onSubmit={handleCreateAppointment} className={`p-3.5 rounded-xl space-y-2 ${subtleClass}`}>
                              <div className="font-bold">Schedule Clinical Session for {selectedCalDate}</div>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="time"
                                  value={apptTime}
                                  onChange={e => setApptTime(e.target.value)}
                                  className={`px-2.5 py-1.5 rounded-lg ${inputClass}`}
                                />
                                <input
                                  type="date"
                                  value={apptFollowUpDate}
                                  onChange={e => setApptFollowUpDate(e.target.value)}
                                  title="Optional follow-up reminder date"
                                  className={`px-2.5 py-1.5 rounded-lg ${inputClass}`}
                                />
                              </div>
                              <input
                                type="text"
                                value={apptNoteText}
                                onChange={e => setApptNoteText(e.target.value)}
                                placeholder="Session focus / preparation agenda..."
                                required
                                className={`w-full px-2.5 py-1.5 rounded-lg ${inputClass}`}
                              />
                              <input
                                type="text"
                                value={apptNextSteps}
                                onChange={e => setApptNextSteps(e.target.value)}
                                placeholder="Agreed next steps (optional)..."
                                className={`w-full px-2.5 py-1.5 rounded-lg ${inputClass}`}
                              />
                              <button
                                type="submit"
                                disabled={savingAppt}
                                className="w-full py-2 rounded-xl bg-[#4A154B] hover:bg-[#3A103B] text-white font-bold cursor-pointer"
                              >
                                {savingAppt ? 'Scheduling...' : 'Schedule Clinical Appointment'}
                              </button>
                            </form>

                            {clientBundle.appointmentNotes.length > 0 && (
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {clientBundle.appointmentNotes.map(appt => (
                                  <div key={appt.id} className={`p-3 rounded-xl space-y-2 ${subtleClass}`}>
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-bold tabular-nums">
                                        {appt.appointmentDate}{appt.appointmentTime ? ` · ${appt.appointmentTime}` : ''}
                                      </span>
                                      <select
                                        value={appt.status || 'upcoming'}
                                        onChange={e =>
                                          handleUpdateAppointment(
                                            appt.id,
                                            {
                                              status: e.target.value as
                                                | 'upcoming'
                                                | 'completed'
                                                | 'rescheduled'
                                                | 'missed',
                                            },
                                            `Appointment marked ${e.target.value}.`
                                          )
                                        }
                                        className={`px-2 py-1 rounded-lg text-[11px] font-bold ${inputClass}`}
                                      >
                                        <option value="upcoming">Upcoming</option>
                                        <option value="completed">Completed</option>
                                        <option value="rescheduled">Rescheduled</option>
                                        <option value="missed">Missed (Follow-Up Needed)</option>
                                      </select>
                                    </div>
                                    <p>{appt.noteText}</p>
                                    {appt.followUpOutcome && (
                                      <p className="text-[11px] text-[#059669] font-semibold">
                                        Follow-Up Outcome: {appt.followUpOutcome}
                                      </p>
                                    )}
                                    <div className="flex gap-1.5">
                                      <input
                                        type="text"
                                        value={
                                          apptOutcomeDrafts[appt.id] !== undefined
                                            ? apptOutcomeDrafts[appt.id]
                                            : appt.followUpOutcome || ''
                                        }
                                        onChange={e =>
                                          setApptOutcomeDrafts(p => ({ ...p, [appt.id]: e.target.value }))
                                        }
                                        placeholder="Record follow-up outcome or reschedule note..."
                                        className={`flex-1 px-2.5 py-1 rounded-lg text-[11px] ${inputClass}`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateAppointment(
                                            appt.id,
                                            { followUpOutcome: apptOutcomeDrafts[appt.id] ?? appt.followUpOutcome ?? '' },
                                            'Follow-up outcome saved.'
                                          )
                                        }
                                        className="px-2.5 py-1 rounded-lg bg-[#059669] text-white text-[11px] font-bold cursor-pointer"
                                      >
                                        Save
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </section>
                        </div>
                    </div>
                  )}

                  {/* SUB-TAB D: SUBSTANCES & EARLY ASSESSMENTS */}
                  {clientSubTab === 'substances' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      <section className={`lg:col-span-7 ${surfaceClass} rounded-2xl p-5 space-y-4`}>
                        <div>
                          <h2 className="text-base font-bold">
                            Identified Substances &amp; Recovery Context
                          </h2>
                          <p className={`text-xs mt-0.5 ${mutedClass}`}>
                            Review catalogue selections and clarify custom entries added in Role 01.
                          </p>
                        </div>

                        {clientBundle.substanceConcerns.length === 0 ? (
                          <div className={`p-6 rounded-xl text-xs text-center ${subtleClass}`}>
                            <p className={mutedClass}>No substances recorded for this user yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {clientBundle.substanceConcerns.map(sub => (
                              <div key={sub.id} className={`p-4 rounded-xl space-y-2.5 text-xs ${subtleClass}`}>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="font-bold text-sm">{sub.name}</div>
                                  <span
                                    className={`font-bold uppercase text-[10px] ${
                                      sub.verificationStatus === 'unverified'
                                        ? 'text-amber-600'
                                        : 'text-[#059669]'
                                    }`}
                                  >
                                    {sub.verificationStatus.replace(/_/g, ' ')}
                                  </span>
                                </div>

                                {sub.customExplanation && (
                                  <p className={mutedClass}>{sub.customExplanation}</p>
                                )}

                                {sub.clinicianReviewNote && (
                                  <div className="text-[#059669] font-semibold">
                                    Clarification: {sub.clinicianReviewNote}
                                  </div>
                                )}

                                <div className="flex gap-2 pt-1">
                                  <input
                                    type="text"
                                    value={substanceReviewDrafts[sub.id] || ''}
                                    onChange={e =>
                                      setSubstanceReviewDrafts(p => ({ ...p, [sub.id]: e.target.value }))
                                    }
                                    placeholder="Add clinical clarification / verification note..."
                                    className={`flex-1 px-3 py-1.5 rounded-lg text-xs ${inputClass}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleClarifySubstance(sub.id)}
                                    className="px-3 py-1.5 rounded-lg bg-[#4A154B] text-white font-bold cursor-pointer shrink-0"
                                  >
                                    Verify Note
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>

                      <div className="lg:col-span-5 space-y-4">
                        <form onSubmit={handleAddSubstanceForClient} className={`${surfaceClass} rounded-2xl p-5 space-y-3 text-xs`}>
                          <h3 className="text-sm font-bold">Add Substance Context</h3>
                          <input
                            type="text"
                            value={newSubName}
                            onChange={e => setNewSubName(e.target.value)}
                            placeholder="Substance or habit name"
                            required
                            className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                          />
                          <input
                            type="text"
                            value={newSubNote}
                            onChange={e => setNewSubNote(e.target.value)}
                            placeholder="Clinician note (optional)"
                            className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                          />
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={newSubIsMed}
                              onChange={e => setNewSubIsMed(e.target.checked)}
                            />
                            <span>Prescription medication / taper monitoring</span>
                          </label>
                          <button
                            type="submit"
                            className="w-full py-2 rounded-xl bg-[#059669] text-white font-bold cursor-pointer"
                          >
                            Add Substance Entry
                          </button>
                        </form>

                        {clientBundle.earlyAssessments.length > 0 && (
                          <section className={`${surfaceClass} rounded-2xl p-5 space-y-2.5 text-xs`}>
                            <h3 className="text-sm font-bold">Early Support Navigator History</h3>
                            {clientBundle.earlyAssessments.map(ea => (
                              <div key={ea.id} className={`p-3 rounded-xl space-y-1 ${subtleClass}`}>
                                <div className="font-bold tabular-nums">
                                  {ea.date} · {ea.mode === 'deep' ? 'Deep Assessment' : 'Quick Check'}
                                </div>
                                <div>{ea.recommendedPathway}</div>
                              </div>
                            ))}
                          </section>
                        )}
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB E2: CONFIDENTIAL CLINICAL VAULT, FOLLOW-UPS, REFERRALS & AI CLINICIAN ASSIST */}
                  {clientSubTab === 'clinical_vault' && (
                    <div className="space-y-6">
                      {/* AI Clinician Case Synthesis */}
                      <section className={`${surfaceClass} rounded-2xl p-5 space-y-3 text-xs`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <h2 className="text-base font-bold flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-[#059669]" />
                              <span>AI Clinician Case Synthesis &amp; Session Prep</span>
                            </h2>
                            <p className={`text-xs mt-0.5 ${mutedClass}`}>
                              Summarizes logged Role 01 activity, mood shifts, and open follow-ups to help prepare your next session. Never replaces clinical judgment or issues diagnoses.
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={aiAssistBusy}
                            onClick={handleRunAiClinicianAssist}
                            className="px-4 py-2 rounded-xl bg-[#4A154B] hover:bg-[#3A103B] disabled:opacity-60 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#6EE7B7]" />
                            <span>{aiAssistBusy ? 'Synthesizing...' : 'Generate Case Prep'}</span>
                          </button>
                        </div>

                        {aiAssistResult && (
                          <div className={`p-4 rounded-xl space-y-3 ${subtleClass}`}>
                            {(aiAssistResult.synthesisSummary || aiAssistResult.progressSummary) && (
                              <p className="text-xs leading-relaxed font-medium">
                                {aiAssistResult.synthesisSummary || aiAssistResult.progressSummary}
                              </p>
                            )}
                            {aiAssistResult.moodAndWellbeingTrend && (
                              <p className={`text-xs ${mutedClass}`}>
                                {aiAssistResult.moodAndWellbeingTrend}
                              </p>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {aiAssistResult.focusAreas && aiAssistResult.focusAreas.length > 0 && (
                                <div>
                                  <div className="font-bold text-[#059669] mb-1">Key Patterns / Focus</div>
                                  <ul className="list-disc pl-4 space-y-1">
                                    {aiAssistResult.focusAreas.map((item, idx) => (
                                      <li key={idx}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {(aiAssistResult.sessionAgendaPrompts || aiAssistResult.appointmentPrepQuestions) && (
                                <div>
                                  <div className="font-bold text-[#4A154B] mb-1">Session Discussion Prompts</div>
                                  <ul className="list-disc pl-4 space-y-1">
                                    {(aiAssistResult.sessionAgendaPrompts || aiAssistResult.appointmentPrepQuestions || []).map((item, idx) => (
                                      <li key={idx}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {aiAssistResult.cautionsAndSafeguards && aiAssistResult.cautionsAndSafeguards.length > 0 && (
                                <div>
                                  <div className="font-bold text-amber-700 mb-1">Cautions &amp; Safeguards</div>
                                  <ul className="list-disc pl-4 space-y-1">
                                    {aiAssistResult.cautionsAndSafeguards.map((item, idx) => (
                                      <li key={idx}>{item}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                            {aiAssistResult.draftActivities && aiAssistResult.draftActivities.length > 0 && (
                              <div className="pt-2 border-t border-inherit space-y-1.5">
                                <div className="font-bold text-[#059669]">
                                  Draft Activity Suggestions (Clinician Review Required — Never Auto-Applied)
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {aiAssistResult.draftActivities.map((act, idx) => (
                                    <div key={idx} className={`${surfaceClass} rounded-lg p-2.5 space-y-0.5`}>
                                      <div className="font-bold">{act.title}</div>
                                      <div className={mutedClass}>{act.purpose}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {(aiAssistResult.clinicalBoundaryDisclaimer || aiAssistResult.nonDiagnosticReminder) && (
                              <div className={`text-[11px] pt-2 border-t border-inherit ${mutedClass}`}>
                                {aiAssistResult.clinicalBoundaryDisclaimer || aiAssistResult.nonDiagnosticReminder}
                              </div>
                            )}
                          </div>
                        )}
                      </section>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Left 7 Cols: Confidential Clinician Notes Vault */}
                        <section className={`lg:col-span-7 ${surfaceClass} rounded-2xl p-5 space-y-4 text-xs`}>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 font-bold text-sm">
                                <FileLock2 className="w-4 h-4 text-[#4A154B]" />
                                <span>Confidential Clinician Notes Vault (Strictly Private)</span>
                              </div>
                              <span className="px-2 py-0.5 rounded-md bg-[#059669]/15 text-[#059669] text-[10px] font-bold">
                                AES-256-GCM Encrypted at Rest
                              </span>
                            </div>
                            <p className={mutedClass}>
                              Sealed to you as treating clinician. Never displayed to the client, family supporters, community builders, or platform admins.
                            </p>
                          </div>

                          <form onSubmit={handleCreateClinicalNote} className={`p-4 rounded-xl space-y-2.5 ${subtleClass}`}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              <select
                                value={noteType}
                                onChange={e => setNoteType(e.target.value as ClinicalNoteTypeClient)}
                                className={`px-3 py-2 rounded-xl font-semibold ${inputClass}`}
                              >
                                {CLINICAL_NOTE_TYPE_OPTIONS.map(opt => (
                                  <option key={opt.id} value={opt.id}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              <input
                                type="date"
                                value={noteFollowUpDate}
                                onChange={e => setNoteFollowUpDate(e.target.value)}
                                className={`px-3 py-2 rounded-xl ${inputClass}`}
                                title="Optional follow-up date"
                              />
                            </div>
                            <input
                              type="text"
                              value={noteTitle}
                              onChange={e => setNoteTitle(e.target.value)}
                              placeholder="Confidential note headline..."
                              required
                              className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                            />
                            <textarea
                              rows={3}
                              value={noteContent}
                              onChange={e => setNoteContent(e.target.value)}
                              placeholder="Structured clinical formulation, risk notes, or session rationale..."
                              required
                              className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                            />
                            <button
                              type="submit"
                              disabled={savingClinicalNote}
                              className="px-4 py-2 rounded-xl bg-[#4A154B] hover:bg-[#3A103B] text-white font-bold cursor-pointer"
                            >
                              {savingClinicalNote ? 'Sealing...' : 'Save Confidential Note'}
                            </button>
                          </form>

                          {!clientBundle.clinicalNotes || clientBundle.clinicalNotes.length === 0 ? (
                            <p className={mutedClass}>No confidential clinical notes saved for this client yet.</p>
                          ) : (
                            <div className="space-y-2.5">
                              {clientBundle.clinicalNotes.map(note => {
                                const isEditingNote = editingClinicalNoteId === note.id;
                                return (
                                  <div key={note.id} className={`p-3.5 rounded-xl space-y-2 ${subtleClass}`}>
                                    {isEditingNote ? (
                                      <form onSubmit={e => handleUpdateClinicalNote(e, note.id)} className="space-y-2">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                          <select
                                            value={editClinicalNoteDraft.noteType}
                                            onChange={e =>
                                              setEditClinicalNoteDraft(p => ({
                                                ...p,
                                                noteType: e.target.value as ClinicalNoteTypeClient,
                                              }))
                                            }
                                            className={`px-2.5 py-1.5 rounded-lg font-semibold ${inputClass}`}
                                          >
                                            {CLINICAL_NOTE_TYPE_OPTIONS.map(opt => (
                                              <option key={opt.id} value={opt.id}>
                                                {opt.label}
                                              </option>
                                            ))}
                                          </select>
                                          <input
                                            type="date"
                                            value={editClinicalNoteDraft.followUpDate}
                                            onChange={e =>
                                              setEditClinicalNoteDraft(p => ({
                                                ...p,
                                                followUpDate: e.target.value,
                                              }))
                                            }
                                            className={`px-2.5 py-1.5 rounded-lg ${inputClass}`}
                                          />
                                        </div>
                                        <input
                                          type="text"
                                          value={editClinicalNoteDraft.title}
                                          onChange={e =>
                                            setEditClinicalNoteDraft(p => ({ ...p, title: e.target.value }))
                                          }
                                          required
                                          className={`w-full px-2.5 py-1.5 rounded-lg font-bold ${inputClass}`}
                                        />
                                        <textarea
                                          rows={3}
                                          value={editClinicalNoteDraft.content}
                                          onChange={e =>
                                            setEditClinicalNoteDraft(p => ({ ...p, content: e.target.value }))
                                          }
                                          required
                                          className={`w-full px-2.5 py-1.5 rounded-lg ${inputClass}`}
                                        />
                                        <div className="flex gap-2">
                                          <button
                                            type="submit"
                                            disabled={savingEditClinicalNote}
                                            className="px-3 py-1.5 rounded-lg bg-[#059669] text-white font-bold cursor-pointer"
                                          >
                                            {savingEditClinicalNote ? 'Saving...' : 'Update Encrypted Note'}
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditingClinicalNoteId(null)}
                                            className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${surfaceClass}`}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </form>
                                    ) : (
                                      <>
                                        <div className="flex items-start justify-between gap-2">
                                          <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                              <span className="text-[10px] font-bold uppercase text-[#059669]">
                                                {note.noteType.replace(/_/g, ' ')}
                                              </span>
                                              {note.followUpDate && (
                                                <span className="text-[10px] font-semibold tabular-nums text-[#4A154B]">
                                                  Follow-Up: {note.followUpDate}
                                                </span>
                                              )}
                                            </div>
                                            <h3 className="font-bold text-sm">{note.title}</h3>
                                          </div>
                                          <div className="flex items-center gap-1 shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingClinicalNoteId(note.id);
                                                setEditClinicalNoteDraft({
                                                  noteType: note.noteType,
                                                  title: note.title,
                                                  content: note.content,
                                                  followUpDate: note.followUpDate || '',
                                                });
                                              }}
                                              className={`p-1 hover:opacity-80 cursor-pointer ${mutedClass}`}
                                              title="Edit clinical note"
                                            >
                                              <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteClinicalNote(note.id)}
                                              className={`p-1 hover:text-rose-600 cursor-pointer ${mutedClass}`}
                                              title="Delete clinical note"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </div>
                                        <p className="leading-relaxed whitespace-pre-wrap">{note.content}</p>
                                        <div className={`text-[11px] tabular-nums ${mutedClass}`}>
                                          {new Date(note.updatedAt).toLocaleString()} · {note.modifiedByName || note.therapistName}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </section>

                        {/* Right 5 Cols: Missed Activity Follow-Up & Referrals / Escalation */}
                        <div className="lg:col-span-5 space-y-4">
                          <section className={`${surfaceClass} rounded-2xl p-5 space-y-3 text-xs`}>
                            <h3 className="text-sm font-bold flex items-center gap-2">
                              <Clock className="w-4 h-4 text-[#059669]" />
                              <span>Non-Judgmental Engagement &amp; Follow-Up Tracker</span>
                            </h3>
                            <div className="grid grid-cols-2 gap-2 tabular-nums">
                              <div className={`p-3 rounded-xl ${subtleClass}`}>
                                <div className={mutedClass}>Missed / Past Events</div>
                                <div className="text-lg font-extrabold">
                                  {clientBundle.followUpSummary?.missedOrOverdueEvents.length || 0}
                                </div>
                              </div>
                              <div className={`p-3 rounded-xl ${subtleClass}`}>
                                <div className={mutedClass}>Missed Appointments</div>
                                <div className="text-lg font-extrabold">
                                  {clientBundle.followUpSummary?.missedAppointments?.length || 0}
                                </div>
                              </div>
                              <div className={`p-3 rounded-xl ${subtleClass}`}>
                                <div className={mutedClass}>Overdue Goals</div>
                                <div className="text-lg font-extrabold">
                                  {clientBundle.followUpSummary?.overdueGoals.length || 0}
                                </div>
                              </div>
                              <div className={`p-3 rounded-xl ${subtleClass}`}>
                                <div className={mutedClass}>Difficult Mood Days</div>
                                <div className="text-lg font-extrabold">
                                  {Array.isArray(clientBundle.followUpSummary?.recentDifficultDays)
                                    ? clientBundle.followUpSummary.recentDifficultDays.length
                                    : clientBundle.followUpSummary?.recentDifficultDays || 0}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setClientSubTab('calendar')}
                              className="w-full py-2 rounded-xl bg-[#059669]/15 text-[#059669] hover:bg-[#059669]/25 font-bold cursor-pointer"
                            >
                              Schedule Gentle Check-In on Calendar
                            </button>
                          </section>

                          <section className={`${surfaceClass} rounded-2xl p-5 space-y-3 text-xs`}>
                            <div>
                              <h3 className="text-sm font-bold flex items-center gap-2">
                                <PhoneForwarded className="w-4 h-4 text-[#4A154B]" />
                                <span>Referrals &amp; Urgent Escalation</span>
                              </h3>
                              <p className={`text-[11px] mt-0.5 ${mutedClass}`}>
                                Kerala Vimukthi Helpline 14405 · Tele-MANAS 14416 · Emergency 112
                              </p>
                            </div>
                            <form onSubmit={handleCreateReferral} className="space-y-2.5">
                              {directoryServices.length > 0 && (
                                <select
                                  value=""
                                  onChange={e => {
                                    if (e.target.value) setRefTarget(e.target.value);
                                  }}
                                  className={`w-full px-3 py-2 rounded-xl text-xs font-semibold ${inputClass}`}
                                  aria-label="Pick from verified Kerala 5-category directory"
                                >
                                  <option value="">Quick-Pick Verified Kerala Clinic / Service / Programme...</option>
                                  {directoryServices.map(item => (
                                    <option key={item.id} value={`${item.name} (${item.district})`}>
                                      [{item.category.replace(/_/g, ' ')}] {item.name} — {item.district}
                                    </option>
                                  ))}
                                </select>
                              )}
                              <input
                                type="text"
                                value={refTarget}
                                onChange={e => setRefTarget(e.target.value)}
                                placeholder="Receiving hospital, rehab centre, or community programme..."
                                required
                                className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <select
                                  value={refCategory}
                                  onChange={e => setRefCategory(e.target.value as ReferralCategoryClient)}
                                  className={`px-3 py-2 rounded-xl ${inputClass}`}
                                >
                                  {REFERRAL_CATEGORY_OPTIONS.map(opt => (
                                    <option key={opt.id} value={opt.id}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  value={refUrgency}
                                  onChange={e =>
                                    setRefUrgency(
                                      e.target.value as 'routine' | 'priority' | 'urgent_escalation'
                                    )
                                  }
                                  className={`px-3 py-2 rounded-xl ${inputClass}`}
                                >
                                  <option value="routine">Routine Referral</option>
                                  <option value="priority">Priority Support</option>
                                  <option value="urgent_escalation">Urgent Escalation</option>
                                </select>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="date"
                                  value={refDate}
                                  onChange={e => setRefDate(e.target.value)}
                                  title="Referral date"
                                  className={`px-3 py-2 rounded-xl ${inputClass}`}
                                />
                                <input
                                  type="text"
                                  value={refFollowUp}
                                  onChange={e => setRefFollowUp(e.target.value)}
                                  placeholder="Follow-up note (optional)"
                                  className={`px-3 py-2 rounded-xl ${inputClass}`}
                                />
                              </div>
                              <textarea
                                rows={2}
                                value={refReason}
                                onChange={e => setRefReason(e.target.value)}
                                placeholder="Clinical reason or escalation action taken..."
                                required
                                className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                              />
                              <button
                                type="submit"
                                disabled={savingReferral}
                                className="w-full py-2 rounded-xl bg-[#4A154B] text-white font-bold cursor-pointer"
                              >
                                {savingReferral ? 'Saving...' : 'Record Referral'}
                              </button>
                            </form>

                            {clientBundle.referrals && clientBundle.referrals.length > 0 && (
                              <div className="space-y-2.5 pt-2 border-t border-inherit">
                                {clientBundle.referrals.map(ref => (
                                  <div key={ref.id} className={`p-3 rounded-xl space-y-2 ${subtleClass}`}>
                                    <div className="flex items-center justify-between gap-2">
                                      <div>
                                        <div className="font-bold">{ref.serviceName}</div>
                                        <div className={`text-[10px] tabular-nums ${mutedClass}`}>
                                          {(ref.referralCategory || 'de_addiction').replace(/_/g, ' ')} ·{' '}
                                          {ref.referralDate || ref.createdAt.slice(0, 10)} ·{' '}
                                          {ref.urgency.replace(/_/g, ' ')}
                                        </div>
                                      </div>
                                      <select
                                        value={ref.status}
                                        onChange={e =>
                                          handleUpdateReferral(ref.id, {
                                            status: e.target.value as
                                              | 'recommended'
                                              | 'scheduled'
                                              | 'completed'
                                              | 'declined',
                                          })
                                        }
                                        className={`px-2 py-1 rounded-lg text-[11px] font-bold ${inputClass}`}
                                      >
                                        <option value="recommended">Recommended</option>
                                        <option value="scheduled">Scheduled</option>
                                        <option value="completed">Completed</option>
                                        <option value="declined">Declined</option>
                                      </select>
                                    </div>
                                    <p className={mutedClass}>{ref.reason}</p>
                                    <div className="flex gap-1.5">
                                      <input
                                        type="text"
                                        value={
                                          refFollowUpNotesDrafts[ref.id] !== undefined
                                            ? refFollowUpNotesDrafts[ref.id]
                                            : ref.followUpNotes || ''
                                        }
                                        onChange={e =>
                                          setRefFollowUpNotesDrafts(p => ({ ...p, [ref.id]: e.target.value }))
                                        }
                                        placeholder="Referral follow-up notes..."
                                        className={`flex-1 px-2.5 py-1 rounded-lg text-[11px] ${inputClass}`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleUpdateReferral(ref.id, {
                                            followUpNotes:
                                              refFollowUpNotesDrafts[ref.id] ?? ref.followUpNotes ?? '',
                                          })
                                        }
                                        className="px-2.5 py-1 rounded-lg bg-[#059669] text-white text-[11px] font-bold cursor-pointer"
                                      >
                                        Save
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </section>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB E: ASSIGNMENTS, REPORTS & MESSAGES */}
                  {clientSubTab === 'care_tools' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      <section className={`lg:col-span-6 ${surfaceClass} rounded-2xl p-5 space-y-4 text-xs`}>
                        <h2 className="text-base font-bold">CBT &amp; Weekly Support Assignments</h2>
                        {!clientBundle.connection ? (
                          <div className={`p-4 rounded-xl space-y-2 ${subtleClass}`}>
                            <p className={mutedClass}>
                              Formal CBT assignments and secure messaging activate once this client connects via an Invitation Code (or if you onboarded them directly).
                            </p>
                          </div>
                        ) : (
                          <form onSubmit={handleCreateAssignment} className="space-y-2.5">
                            <div className="grid grid-cols-2 gap-2">
                              <select
                                value={assignType}
                                onChange={e =>
                                  setAssignType(e.target.value as 'cbt_exercise' | 'goal' | 'weekly_plan')
                                }
                                className={`px-3 py-2 rounded-xl ${inputClass}`}
                              >
                                <option value="cbt_exercise">CBT Exercise</option>
                                <option value="weekly_plan">Weekly Routine Plan</option>
                                <option value="goal">Structured Goal</option>
                              </select>
                              <input
                                type="date"
                                value={assignDueDate}
                                onChange={e => setAssignDueDate(e.target.value)}
                                className={`px-3 py-2 rounded-xl ${inputClass}`}
                              />
                            </div>
                            <input
                              type="text"
                              value={assignTitle}
                              onChange={e => setAssignTitle(e.target.value)}
                              placeholder="Activity title..."
                              required
                              className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                            />
                            <textarea
                              rows={2}
                              value={assignInstructions}
                              onChange={e => setAssignInstructions(e.target.value)}
                              placeholder="Step-by-step instructions for the client..."
                              required
                              className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                            />
                            <button
                              type="submit"
                              className="px-4 py-2 rounded-xl bg-[#4A154B] text-white font-bold cursor-pointer"
                            >
                              Assign to Client
                            </button>
                          </form>
                        )}

                        {clientBundle.assignments.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-inherit">
                            {clientBundle.assignments.map(a => (
                              <div key={a.id} className={`p-3 rounded-xl space-y-1 ${subtleClass}`}>
                                <div className="flex items-center justify-between font-bold">
                                  <span>{a.title}</span>
                                  <span className="text-[11px] uppercase text-[#059669]">
                                    {a.status.replace(/_/g, ' ')}
                                  </span>
                                </div>
                                <p className={mutedClass}>{a.instructions}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </section>

                      <section className={`lg:col-span-6 ${surfaceClass} rounded-2xl p-5 space-y-4 text-xs`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h2 className="text-base font-bold">Two-Way Messages &amp; Info Requests</h2>
                          <span className="text-xs font-semibold text-[#059669]">Live WebSocket Sync</span>
                        </div>
                        {clientBundle.connection ? (
                          <>
                            <div className="max-h-72 overflow-y-auto space-y-2.5">
                              {clientBundle.messages.length === 0 ? (
                                <p className={mutedClass}>No messages exchanged yet.</p>
                              ) : (
                                clientBundle.messages.map(m => (
                                  <div
                                    key={m.id}
                                    className={`p-3.5 rounded-xl text-sm ${
                                      m.senderRole === 'therapist'
                                        ? 'bg-[#4A154B] text-white ml-6'
                                        : `${subtleClass} mr-6`
                                    }`}
                                  >
                                    <div className="text-xs font-bold opacity-85 flex items-center justify-between gap-2">
                                      <span>
                                        {m.senderName} · {new Date(m.createdAt).toLocaleDateString()}
                                        {m.messageType === 'info_request' ? ' · Update Request' : ''}
                                      </span>
                                      {m.readAt && <span className="text-[11px] opacity-80">Read</span>}
                                    </div>
                                    <p className="mt-1 leading-relaxed">{m.text}</p>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Request Additional Info / Updated Shared Category */}
                            <div className={`p-3 rounded-xl flex flex-wrap items-center gap-2 ${subtleClass}`}>
                              <select
                                value={requestInfoCat}
                                onChange={e => setRequestInfoCat(e.target.value as PermissionCategory)}
                                className={`flex-1 min-w-[160px] px-3 py-2 rounded-xl text-xs font-semibold ${inputClass}`}
                                aria-label="Select category to request from patient"
                              >
                                {PERMISSION_CATEGORY_META.map(cat => (
                                  <option key={cat.id} value={cat.id}>
                                    Ask update on: {cat.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                disabled={requestingInfo}
                                onClick={handleRequestClientInfo}
                                className="px-3.5 py-2 rounded-xl bg-[#4A154B] hover:bg-[#3A103B] text-white text-xs font-bold whitespace-nowrap cursor-pointer disabled:opacity-60"
                              >
                                {requestingInfo ? 'Sending...' : 'Request Info / Report'}
                              </button>
                            </div>

                            <form onSubmit={handleSendMessage} className="flex gap-2">
                              <input
                                type="text"
                                value={msgText}
                                onChange={e => setMsgText(e.target.value)}
                                placeholder="Write a supportive message..."
                                className={`flex-1 px-3.5 py-2.5 rounded-xl text-sm ${inputClass}`}
                              />
                              <button
                                type="submit"
                                className="px-4 py-2.5 rounded-xl bg-[#059669] text-white font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Send</span>
                              </button>
                            </form>
                          </>
                        ) : (
                          <div className={`p-4 rounded-xl ${subtleClass}`}>
                            <p className={mutedClass}>
                              Send an invite from My Cases to start real-time messaging.
                            </p>
                          </div>
                        )}
                      </section>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* =========================================================
              SECTION 2: MY CASES (ACCEPTED CONNECTIONS + INVITE CODES)
          ========================================================= */}
          {section === 'cases' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold">My Cases &amp; Connection Invites</h1>
                  <p className={`text-sm mt-1 ${mutedClass}`}>
                    Review your active cases, accept incoming support requests, or create a 14-day connection code.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddPatientModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer self-start"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Onboard / Add Patient</span>
                </button>
              </div>

              <div className={`${surfaceClass} rounded-2xl p-4 flex items-center gap-3`}>
                <Search className={`w-4 h-4 ${mutedClass}`} />
                <input
                  type="text"
                  value={rosterSearch}
                  onChange={e => setRosterSearch(e.target.value)}
                  placeholder="Search registered users by name, username, district, or substance..."
                  className={`flex-1 px-3 py-2 rounded-xl text-xs ${inputClass}`}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredRoster.length === 0 ? (
                  <div className={`${surfaceClass} md:col-span-2 rounded-2xl p-10 text-center text-xs`}>
                    <p className={mutedClass}>No registered Role 01 users found.</p>
                  </div>
                ) : (
                  filteredRoster.map(u => (
                    <div key={u.id} className={`${surfaceClass} rounded-2xl p-5 space-y-3 text-xs`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-base font-bold">{u.name}</div>
                          <div className={mutedClass}>
                            @{u.username} · {u.district} · {AGE_LABELS[u.ageRange] || u.ageRange}
                          </div>
                        </div>
                        <span className="font-bold text-[#059669]">
                          {u.isConnected ? 'Connected' : 'Signed-Up Role 01'}
                        </span>
                      </div>

                      <div className={`grid grid-cols-3 gap-2 p-3 rounded-xl tabular-nums ${subtleClass}`}>
                        <div>
                          <div className={mutedClass}>Logs</div>
                          <div className="font-bold">{u.logsCount}</div>
                        </div>
                        <div>
                          <div className={mutedClass}>Goals</div>
                          <div className="font-bold">
                            {u.completedGoalsCount}/{u.goalsCount}
                          </div>
                        </div>
                        <div>
                          <div className={mutedClass}>Calendar</div>
                          <div className="font-bold">{u.calendarEventsCount}</div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => openClientCare(u.id, 'logs')}
                          className="px-3.5 py-2 rounded-xl bg-[#4A154B] text-white font-bold cursor-pointer"
                        >
                          Open Role 01 Care
                        </button>
                        <button
                          type="button"
                          onClick={() => openPatientReport(u.id)}
                          className="px-3 py-2 rounded-xl bg-[#059669]/15 text-[#059669] hover:bg-[#059669]/25 font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download Report</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProfileUserId(u.id);
                            setEditProfileName(u.name);
                            setEditProfileDistrict(u.district === 'Not specified' ? '' : u.district);
                            setEditProfileAge(
                              u.ageRange === 'Not specified' ? 'young_adult' : u.ageRange
                            );
                          }}
                          className={`px-3 py-2 rounded-xl font-semibold inline-flex items-center gap-1 cursor-pointer ${subtleClass}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Edit Details</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-2">
              <form onSubmit={handleCreateInvite} className={`lg:col-span-6 ${surfaceClass} rounded-2xl p-6 space-y-4 text-xs`}>
                <div>
                  <h2 className="text-base font-bold">Generate Confidential Client Invite Code</h2>
                  <p className={`text-xs mt-0.5 ${mutedClass}`}>
                    Create a 14-day code for a client to link their personal account with explicit permission boundaries.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Client Handle, Email, or Phone *</label>
                  <input
                    type="text"
                    value={inviteContact}
                    onChange={e => setInviteContact(e.target.value)}
                    placeholder="e.g. client_username or name@example.org"
                    required
                    className={`w-full px-3 py-2.5 rounded-xl ${inputClass}`}
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Purpose Summary</label>
                  <input
                    type="text"
                    value={invitePurpose}
                    onChange={e => setInvitePurpose(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl ${inputClass}`}
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="font-semibold">Requested Permissions</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PERMISSION_CATEGORY_META.map(meta => (
                      <label key={meta.id} className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={invitePerms.includes(meta.id)}
                          onChange={() =>
                            setInvitePerms(prev =>
                              prev.includes(meta.id) ? prev.filter(c => c !== meta.id) : [...prev, meta.id]
                            )
                          }
                        />
                        <span>{meta.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#4A154B] hover:bg-[#3A103B] text-white font-bold cursor-pointer"
                >
                  Create Time-Limited Invite Code
                </button>
              </form>

              <div className="lg:col-span-6 space-y-4">
                {incomingConnections.length > 0 && (
                  <section className={`${surfaceClass} rounded-2xl p-5 space-y-3 text-xs`}>
                    <h3 className="text-sm font-bold">Incoming Client Connection Requests</h3>
                    {incomingConnections.map(conn => (
                      <div key={conn.id} className={`p-3.5 rounded-xl flex items-center justify-between gap-2 ${subtleClass}`}>
                        <div>
                          <div className="font-bold">{conn.clientName}</div>
                          <div className={mutedClass}>Requested {conn.createdAt.split('T')[0]}</div>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRespondIncoming(conn.id, 'accept')}
                            className="px-3 py-1.5 rounded-lg bg-[#059669] text-white font-bold cursor-pointer"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRespondIncoming(conn.id, 'decline')}
                            className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${surfaceClass}`}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </section>
                )}

                <section className={`${surfaceClass} rounded-2xl p-5 space-y-3 text-xs`}>
                  <h3 className="text-sm font-bold">Sent Invitations ({invitations.length})</h3>
                  {invitations.length === 0 ? (
                    <p className={mutedClass}>No active invitations generated yet.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {invitations.map(inv => (
                        <div key={inv.id} className={`p-3.5 rounded-xl flex items-center justify-between gap-2 ${subtleClass}`}>
                          <div className="min-w-0">
                            <div className="font-bold font-mono tabular-nums">{inv.code}</div>
                            <div className={`truncate ${mutedClass}`}>
                              {inv.recipientContact} · {inv.status}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              await copyPhoneToClipboard(inv.code);
                              setCopiedCode(inv.id);
                              setTimeout(() => setCopiedCode(null), 1500);
                            }}
                            className={`px-3 py-1.5 rounded-lg font-semibold inline-flex items-center gap-1 cursor-pointer ${surfaceClass}`}
                          >
                            {copiedCode === inv.id ? <Check className="w-3.5 h-3.5 text-[#059669]" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedCode === inv.id ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal: Onboard / Add Patient */}
      {showAddPatientModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddPatient}
            className={`${surfaceClass} rounded-2xl max-w-md w-full p-6 space-y-4 text-xs relative`}
          >
            <button
              type="button"
              onClick={() => setShowAddPatientModal(false)}
              className={`absolute top-4 right-4 p-1.5 rounded-lg cursor-pointer ${mutedClass}`}
            >
              <X className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-lg font-bold">Onboard / Add Patient</h2>
              <p className={`mt-0.5 ${mutedClass}`}>
                Create a client profile with initial Role 01 goal and clinical context.
              </p>
            </div>
            <div>
              <label className="block font-semibold mb-1">Full Name *</label>
              <input
                type="text"
                value={addName}
                onChange={e => setAddName(e.target.value)}
                placeholder="Client Name"
                required
                className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">District</label>
                <input
                  type="text"
                  value={addDistrict}
                  onChange={e => setAddDistrict(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Age Group</label>
                <select
                  value={addAgeRange}
                  onChange={e => setAddAgeRange(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
                >
                  <option value="youth">13–17 (Youth)</option>
                  <option value="young_adult">18–25 (Young Adult)</option>
                  <option value="adult">26–54 (Adult)</option>
                  <option value="senior">55+ (Senior)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block font-semibold mb-1">Primary Substance / Concern</label>
              <input
                type="text"
                value={addConcern}
                onChange={e => setAddConcern(e.target.value)}
                placeholder="Optional substance or habit focus"
                className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Initial Support Plan Goal</label>
              <input
                type="text"
                value={addGoal}
                onChange={e => setAddGoal(e.target.value)}
                placeholder="Optional opening Role 01 goal"
                className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Intake Note</label>
              <input
                type="text"
                value={addNote}
                onChange={e => setAddNote(e.target.value)}
                placeholder="Initial clinical note"
                className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
              />
            </div>
            <button
              type="submit"
              disabled={addingPatient}
              className="w-full py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold cursor-pointer disabled:opacity-60"
            >
              {addingPatient ? 'Onboarding...' : 'Create Client Profile'}
            </button>
          </form>
        </div>
      )}

      {/* Modal: Edit Client Profile */}
      {editingProfileUserId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveUserProfile}
            className={`${surfaceClass} rounded-2xl max-w-sm w-full p-6 space-y-4 text-xs relative`}
          >
            <button
              type="button"
              onClick={() => setEditingProfileUserId(null)}
              className={`absolute top-4 right-4 p-1.5 rounded-lg cursor-pointer ${mutedClass}`}
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-base font-bold">Edit Client Profile</h2>
            <div>
              <label className="block font-semibold mb-1">Name *</label>
              <input
                type="text"
                value={editProfileName}
                onChange={e => setEditProfileName(e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">District</label>
              <input
                type="text"
                value={editProfileDistrict}
                onChange={e => setEditProfileDistrict(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Age Group</label>
              <select
                value={editProfileAge}
                onChange={e => setEditProfileAge(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl ${inputClass}`}
              >
                <option value="youth">13–17 (Youth)</option>
                <option value="young_adult">18–25 (Young Adult)</option>
                <option value="adult">26–54 (Adult)</option>
                <option value="senior">55+ (Senior)</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#4A154B] text-white font-bold cursor-pointer"
            >
              Save Profile Updates
            </button>
          </form>
        </div>
      )}

      {/* Modal: Printable & Downloadable Patient Progress Report */}
      {reportModalOpen && clientBundle && compiledPatientReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:static print:bg-white print:p-0">
          <div className={`${surfaceClass} rounded-2xl max-w-3xl w-full p-5 sm:p-7 space-y-5 text-xs shadow-2xl max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:text-slate-900 print:bg-white`}>
            {/* Controls (hidden during print) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-inherit print:hidden">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#059669]" />
                  <span>Client Clinical Progress Report</span>
                </h2>
                <p className={mutedClass}>
                  Select timeframe and output format for {clientBundle.profile.name}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className={`px-3 py-2 rounded-xl font-bold inline-flex items-center gap-1.5 cursor-pointer ${subtleClass}`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPatientPdf}
                  className="px-3.5 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReportModalOpen(false)}
                  className={`p-2 rounded-xl cursor-pointer ${subtleClass}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Time Frame & Section Selector (hidden during print) */}
            <div className={`p-4 rounded-xl space-y-3 print:hidden ${subtleClass}`}>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold mr-1">Time Frame:</span>
                {(
                  [
                    { id: 'session', label: 'Current Session (Today)' },
                    { id: '7d', label: 'Last 7 Days' },
                    { id: '30d', label: 'Last 30 Days' },
                    { id: 'all', label: 'All Recorded Data' },
                    { id: 'custom', label: 'Custom Range' },
                  ] as const
                ).map(tf => (
                  <button
                    key={tf.id}
                    type="button"
                    onClick={() => setReportTimeframe(tf.id)}
                    className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                      reportTimeframe === tf.id
                        ? 'bg-[#4A154B] text-white'
                        : `${surfaceClass} ${mutedClass}`
                    }`}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              {reportTimeframe === 'custom' && (
                <div className="grid grid-cols-2 gap-2 max-w-sm">
                  <input
                    type="date"
                    value={reportFrom}
                    onChange={e => setReportFrom(e.target.value)}
                    className={`px-2.5 py-1.5 rounded-lg ${inputClass}`}
                  />
                  <input
                    type="date"
                    value={reportTo}
                    onChange={e => setReportTo(e.target.value)}
                    className={`px-2.5 py-1.5 rounded-lg ${inputClass}`}
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-1">
                {(
                  [
                    { key: 'objectiveMetrics', label: 'Objective Activities & Goals' },
                    { key: 'dailyLogs', label: 'Subjective Journal Entries' },
                    { key: 'supportPlan', label: 'Support Plan Summary' },
                    { key: 'clinicianGuidance', label: 'Clinician Review Notes' },
                  ] as const
                ).map(sec => (
                  <label key={sec.key} className="inline-flex items-center gap-1.5 cursor-pointer font-semibold">
                    <input
                      type="checkbox"
                      checked={reportSections[sec.key]}
                      onChange={() =>
                        setReportSections(prev => ({ ...prev, [sec.key]: !prev[sec.key] }))
                      }
                    />
                    <span>{sec.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Printable Preview Document */}
            <div className="space-y-4 border border-inherit rounded-xl p-5 bg-white text-slate-900">
              <div className="border-b border-slate-200 pb-3 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#4A154B]">
                  ClearPath AI · Clinical Continuity Report
                </div>
                <h3 className="text-xl font-extrabold">{clientBundle.profile.name}</h3>
                <div className="text-[11px] text-slate-600 tabular-nums">
                  @{clientBundle.profile.username} · {clientBundle.profile.district || 'Kerala'} ·{' '}
                  {AGE_LABELS[clientBundle.profile.ageRange || ''] || 'Adult'} · Period:{' '}
                  {compiledPatientReport.fromDate} to {compiledPatientReport.toDate}
                </div>
                <div className="text-[11px] text-slate-500">
                  Prepared by {serverAuthUser?.name} on {compiledPatientReport.generatedAt}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-950">
                <strong>Clinical Scope Notice:</strong> Structured continuity summary separating objective platform records, client self-reports, and clinician observations. It does not guarantee cure, diagnose medical conditions, or predict relapse.
              </div>

              {reportSections.objectiveMetrics && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#059669]">
                    1. Objective Activities &amp; Goal Progress
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 tabular-nums">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-500">Goals Completed</div>
                      <div className="font-extrabold text-sm">
                        {compiledPatientReport.completedGoals}/{compiledPatientReport.goals.length}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-500">7d Check-In Rate</div>
                      <div className="font-extrabold text-sm">
                        {compiledPatientReport.measurableIndicators?.checkInConsistency7dPct ?? 0}%
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-500">Appointment Attendance</div>
                      <div className="font-extrabold text-sm">
                        {compiledPatientReport.measurableIndicators?.appointmentAttendancePct !== null &&
                        compiledPatientReport.measurableIndicators?.appointmentAttendancePct !== undefined
                          ? `${compiledPatientReport.measurableIndicators.appointmentAttendancePct}%`
                          : 'N/A'}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                      <div className="text-[10px] text-slate-500">Journal Logs</div>
                      <div className="font-extrabold text-sm">{compiledPatientReport.logs.length}</div>
                    </div>
                  </div>
                  {compiledPatientReport.measurableIndicators && (
                    <div className="text-[11px] text-slate-600">
                      Mood Stability Comparison: Last 7 days{' '}
                      <strong>
                        {compiledPatientReport.measurableIndicators.moodTrendComparison.recent7dPositivePct !== null
                          ? `${compiledPatientReport.measurableIndicators.moodTrendComparison.recent7dPositivePct}% positive`
                          : 'No logs'}
                      </strong>{' '}
                      vs Prior 7 days{' '}
                      <strong>
                        {compiledPatientReport.measurableIndicators.moodTrendComparison.prior7dPositivePct !== null
                          ? `${compiledPatientReport.measurableIndicators.moodTrendComparison.prior7dPositivePct}% positive`
                          : 'No baseline'}
                      </strong>
                    </div>
                  )}
                  {compiledPatientReport.goals.map(g => (
                    <div key={g.id} className="text-xs text-slate-700">
                      • <strong>{g.title}</strong> ({g.completed ? 'Completed' : 'In Progress'} ·{' '}
                      {g.milestones.filter(m => m.completed).length}/{g.milestones.length} milestones)
                    </div>
                  ))}
                </div>
              )}

              {reportSections.dailyLogs && (
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#4A154B]">
                    2. Subjective Self-Reports &amp; Journal Entries ({compiledPatientReport.logs.length})
                  </h4>
                  {compiledPatientReport.logs.length === 0 ? (
                    <p className="text-slate-500">No entries recorded inside the selected window.</p>
                  ) : (
                    compiledPatientReport.logs.map(log => (
                      <div key={log.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                        <div className="font-bold tabular-nums">
                          {log.date} · {log.type === 'detailed' ? 'Detailed Reflection' : 'Quick Check-In'} · Mood:{' '}
                          {MOOD_LABELS[log.mood || ''] || log.mood || 'Unspecified'}
                        </div>
                        {log.quickNote && <p className="text-slate-800">{log.quickNote}</p>}
                        {log.personalReflection && (
                          <p className="italic text-slate-600">&ldquo;{log.personalReflection}&rdquo;</p>
                        )}
                        {log.detailedQuestions?.difficulties && (
                          <p className="text-slate-700">
                            <strong>Challenges:</strong> {log.detailedQuestions.difficulties}
                          </p>
                        )}
                        {reportSections.clinicianGuidance && log.clinicianReviewNote && (
                          <p className="text-[#059669] font-semibold">
                            Clinician Observation: {log.clinicianReviewNote}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {reportSections.supportPlan && compiledPatientReport.supportPlan && (
                <div className="space-y-1.5">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#4A154B]">
                    3. Personalized Support Plan &amp; Care Coordination
                  </h4>
                  <p className="text-slate-600 text-[11px] tabular-nums">
                    Status: {(compiledPatientReport.supportPlan.carePlanStatus || 'active').replace(/_/g, ' ')} · Review:{' '}
                    {compiledPatientReport.supportPlan.reviewDate || 'Flexible'} · Clinician:{' '}
                    {compiledPatientReport.supportPlan.responsibleTherapistName || serverAuthUser?.name}
                  </p>
                  <p className="text-slate-700">
                    <strong>Objectives:</strong>{' '}
                    {compiledPatientReport.supportPlan.objectives.join(' ; ') || 'None set'}
                  </p>
                  <p className="text-slate-700">
                    <strong>Approaches:</strong>{' '}
                    {compiledPatientReport.supportPlan.approaches.join(', ') || 'None set'}
                  </p>
                  {compiledPatientReport.supportPlan.interventions &&
                    compiledPatientReport.supportPlan.interventions.length > 0 && (
                      <p className="text-slate-700">
                        <strong>Interventions:</strong>{' '}
                        {compiledPatientReport.supportPlan.interventions.join(' ; ')}
                      </p>
                    )}
                  {reportSections.clinicianGuidance &&
                    compiledPatientReport.supportPlan.professionalGuidance && (
                      <p className="text-[#059669] font-semibold">
                        <strong>Clinician Guidance:</strong>{' '}
                        {compiledPatientReport.supportPlan.professionalGuidance}
                      </p>
                    )}
                  {compiledPatientReport.referrals.length > 0 && (
                    <p className="text-slate-700">
                      <strong>Referrals:</strong>{' '}
                      {compiledPatientReport.referrals.map(r => `${r.serviceName} (${r.status})`).join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
