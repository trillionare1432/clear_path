import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  OpportunityApplication,
  OpportunityProfile,
  PersonalDevTrackProgress,
  RecoveryPassport,
  RecoveryReportRecord,
  SavedOpportunityRecord,
} from '../src/types/index.ts';

export type AccountRole = 'user' | 'therapist' | 'admin' | 'community';

export type VerificationStatus =
  | 'registration_incomplete'
  | 'submitted'
  | 'pending_verification'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'pending';

export type ProfessionalCategory =
  | 'psychiatrist'
  | 'clinical_psychologist'
  | 'medical_practitioner'
  | 'psychiatric_social_worker'
  | 'qualified_counsellor'
  | 'other';

export type PermissionCategory =
  | 'background'
  | 'substances'
  | 'screening_results'
  | 'screening_responses'
  | 'goals'
  | 'weekly_reports'
  | 'cbt_reflections'
  | 'assignments'
  | 'appointments'
  | 'attachments';

export type TherapistAvailabilityStatus = 'available' | 'busy' | 'offline';

export interface TherapistAccessCode {
  id: string;
  code: string;
  label: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TherapistWorkScope {
  allowedSpecializations: string[];
  maxActivePatients: number;
  allowDirectOnboarding: boolean;
  allowClinicalNotes: boolean;
  adminScopeNote?: string;
  updatedAt?: string;
}

export interface AppControlsConfig {
  allowNewSignups: boolean;
  allowTherapistDirectDiscovery: boolean;
  allowTherapistCustomCodes: boolean;
  enableAiBriefMode: boolean;
  requireOrgVerification: boolean;
  platformNotice: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface ServerUser {
  id: string;
  username: string;
  name: string;
  email?: string;
  contactPhone?: string;
  phoneVerified?: boolean;
  phoneVerifiedAt?: string;
  availabilityStatus?: TherapistAvailabilityStatus;
  availabilityHours?: string;
  nextAvailableSlot?: string;
  whatsappOptIn?: boolean;
  passwordHash: string;
  role: AccountRole;
  verificationStatus: VerificationStatus;
  ageRange?: string;
  professionalCategory?: ProfessionalCategory;
  qualifications?: string;
  licenseNumber?: string;
  institution?: string;
  areaOfPractice?: string;
  specialization?: string;
  district?: string;
  supportingDocRef?: string;
  verificationNote?: string;
  bio?: string;
  customAccessCodes?: TherapistAccessCode[];
  workScope?: TherapistWorkScope;
  createdAt: string;
  updatedAt?: string;
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface TherapistConnection {
  id: string;
  clientId: string;
  clientName: string;
  therapistId: string;
  therapistName: string;
  status: 'pending' | 'accepted' | 'revoked' | 'declined' | 'expired';
  initiatedBy?: 'user' | 'therapist';
  consentGrantedAt: string;
  revokedAt?: string;
  createdAt: string;
}

export interface TherapistInvitation {
  id: string;
  code: string;
  direction: 'therapist_to_client' | 'client_to_therapist';
  senderId: string;
  senderName: string;
  senderRole: 'therapist' | 'user';
  recipientContact: string;
  recipientUserId?: string;
  recipientName?: string;
  purpose: string;
  requestedPermissions: PermissionCategory[];
  expiresAt: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired';
  createdAt: string;
  respondedAt?: string;
}

export interface PermissionGrant {
  id: string;
  connectionId: string;
  clientId: string;
  clientName: string;
  therapistId: string;
  therapistName: string;
  categories: PermissionCategory[];
  accessMode: 'one_time' | 'continuing';
  purpose: string;
  allowWeeklyUpdates: boolean;
  allowSelectedActivities: boolean;
  allowBidirectionalFeedback: boolean;
  authorizedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  status: 'active' | 'revoked' | 'expired';
}

export interface PermissionHistoryRecord {
  id: string;
  grantId: string;
  clientId: string;
  clientName: string;
  therapistId: string;
  therapistName: string;
  categories: PermissionCategory[];
  purpose: string;
  authorizedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  action: 'granted' | 'updated' | 'revoked' | 'expired';
  downloadDisclaimerAcknowledged: boolean;
}

export interface SubstanceConcernServerRecord {
  id: string;
  userId: string;
  catalogueId: string | 'custom';
  catalogueNumber?: number;
  name: string;
  parentCategory?: string;
  isExpandedEntry?: boolean;
  isCustom: boolean;
  customOriginalText?: string;
  customExplanation?: string;
  matchedCatalogueId?: string;
  matchedName?: string;
  matchConfidence?: 'high' | 'possible' | 'none';
  userConfirmedMatch?: boolean;
  verificationStatus: 'catalogue' | 'matched_confirmed' | 'unverified' | 'clinician_reviewed';
  clinicianReviewNote?: string;
  reviewedByTherapistName?: string;
  reviewedAt?: string;
  isMedication: boolean;
  prescriptionDetails?: {
    prescribedByProfessional: 'yes' | 'no' | 'not_sure' | 'prefer_not_to_answer';
    concernNature:
      | 'as_prescribed'
      | 'differently_from_directions'
      | 'unwanted_effect'
      | 'not_sure'
      | 'prefer_not_to_answer';
    discussingWithClinician: 'yes' | 'no' | 'not_sure' | 'prefer_not_to_answer';
  };
  concernContext?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntakeSessionServerRecord {
  id: string;
  userId: string;
  primaryGoals: string[];
  multipleSubstances: boolean;
  circumstances: Record<string, unknown>;
  emergencyTriggered: boolean;
  selectedPaths: string[];
  updatedAt: string;
}

export interface SupportPlanServerRecord {
  id: string;
  userId: string;
  selectedPaths: string[];
  pathwayReasons: { pathId: string; label: string; whyShown: string }[];
  objectives: string[];
  approaches: string[];
  supportNeeds?: string[];
  interventions?: string[];
  educationalActivities: {
    id: string;
    title: string;
    source: 'self_guided' | 'clinician_assigned';
    status: 'active' | 'paused' | 'completed' | 'discontinued';
  }[];
  professionalGuidance?: string;
  progressObservations?: string;
  responsibleTherapistName?: string;
  carePlanStatus?: 'active' | 'under_review' | 'paused' | 'completed';
  nextFollowUpDate?: string;
  userDefinedActivities: string[];
  supporterInvolvement?: string;
  nextSteps: string[];
  reviewDate: string;
  updatedAt: string;
}

export interface SharedReportRecord {
  id: string;
  version: number;
  clientId: string;
  clientName: string;
  therapistId: string;
  therapistName: string;
  title: string;
  dateRange: { from?: string; to?: string };
  sectionsIncluded: string[];
  sourceManifest?: Record<string, { source: string; recordedAt: string }>;
  payload: Record<string, unknown>;
  deliveredAt: string;
  viewedAt?: string;
  revokedAt?: string;
  status: 'delivered' | 'viewed' | 'revoked';
}

export interface TherapistAssignment {
  id: string;
  clientId: string;
  therapistId: string;
  therapistName: string;
  type: 'cbt_exercise' | 'goal' | 'weekly_plan';
  title: string;
  purpose?: string;
  instructions: string;
  startDate: string;
  dueDate?: string;
  reviewDate?: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'not_completed' | 'reviewed';
  clientReflection?: string;
  therapistFeedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyProgressSubmission {
  id: string;
  clientId: string;
  clientName: string;
  therapistId?: string;
  weekStarting: string;
  completedActivities: string[];
  goalsWorkedOn: string[];
  difficulties: string;
  whatHelped: string;
  discussionTopics: string;
  questionsForTherapist: string;
  optionalReflection?: string;
  therapistResponse?: string;
  respondedAt?: string;
  createdAt: string;
}

export interface AppointmentNoteRecord {
  id: string;
  clientId: string;
  therapistId: string;
  therapistName: string;
  appointmentDate: string;
  appointmentTime?: string;
  topicsToDiscuss?: string[];
  clientQuestions?: string[];
  previousFollowUp?: string;
  agreedNextSteps?: string;
  noteText: string;
  followUpReminderDate?: string;
  followUpOutcome?: string;
  requestReportUpdate?: boolean;
  status?: 'upcoming' | 'completed' | 'rescheduled' | 'missed';
  createdAt: string;
  updatedAt?: string;
}

export interface SecureMessageRecord {
  id: string;
  connectionId: string;
  clientId: string;
  therapistId: string;
  senderId: string;
  senderRole: AccountRole;
  senderName: string;
  text: string;
  messageType?: 'standard' | 'info_request';
  requestedCategories?: PermissionCategory[];
  readAt?: string;
  createdAt: string;
}

export interface VerifiedServiceRecord {
  id: string;
  organization: string;
  verifiedContact: string;
  serviceType:
    | 'emergency'
    | 'state_helpline'
    | 'national_helpline'
    | 'mental_health'
    | 'treatment_centre'
    | 'rehabilitation'
    | 'education_skills';
  purposeSummary: string;
  location: string;
  district?: string;
  coordinates?: { lat: number; lng: number };
  hours: string;
  officialSourceUrl: string;
  lastVerified: string;
  verificationStatus: 'verified' | 'pending_review' | 'outdated' | 'needs_reverification' | 'archived';
}

export interface LocalNeedObservationRecord {
  id: string;
  district: string;
  category: string;
  observation: string;
  createdAt: string;
}

export interface ServerCommunityOrg {
  id: string;
  ownerUserId: string;
  name: string;
  category: 'healthcare' | 'programme_organizer' | 'educational_institution' | 'community_org';
  professionalRole: string;
  district: string;
  contactEmail?: string;
  contactPhone?: string;
  verificationDocRef?: string;
  intendedUse: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
}

export interface ServerProgramme {
  id: string;
  orgId: string;
  orgName: string;
  orgCategory: string;
  district: string;
  title: string;
  type: string;
  description: string;
  objective: string;
  targetAudience: string;
  format: 'in_person' | 'online' | 'hybrid';
  location: string;
  date: string;
  time: string;
  eligibility: string;
  contactInfo: string;
  capacity: number;
  registeredUserIds: string[];
  verificationStatus: 'verified' | 'pending';
  createdAt: string;
}

export interface ServerEvaluation {
  id: string;
  programmeId: string;
  district: string;
  phase: 'pre' | 'post';
  score: number;
  maxScore: number;
  accessibilityBarrier?: string;
  feedbackNote?: string;
  topic?: string;
  submittedAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorRole: string;
  actorUsername?: string;
  actorName?: string;
  section?: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: string;
  timestamp: string;
}

export type ClinicalNoteType =
  | 'session'
  | 'follow_up'
  | 'observation'
  | 'assessment'
  | 'care_plan_discussion'
  | 'referral'
  | 'safeguarding';

export interface TherapistClinicalNote {
  id: string;
  clientId: string;
  therapistId: string;
  therapistName: string;
  modifiedByName?: string;
  noteType: ClinicalNoteType;
  title: string;
  content: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CarePlanRevisionRecord {
  id: string;
  userId: string;
  version: number;
  changedById: string;
  changedByName: string;
  changedByRole: 'therapist' | 'user';
  summary: string;
  snapshot: SupportPlanServerRecord;
  createdAt: string;
}

export type CarePlanProposalStatus =
  | 'proposed'
  | 'user_reviewed'
  | 'acknowledged'
  | 'agreed'
  | 'active'
  | 'declined';

export interface CarePlanProposalRecord {
  id: string;
  userId: string;
  therapistId: string;
  therapistName: string;
  version: number;
  title: string;
  objectives: string[];
  routines: string[];
  recommendations: string[];
  nextFollowUpDate?: string;
  reviewDate?: string;
  rationale?: string;
  status: CarePlanProposalStatus;
  userFeedback?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReferralCategory =
  | 'mental_health'
  | 'de_addiction'
  | 'medical'
  | 'rehab'
  | 'family_support'
  | 'emergency';

export interface TherapistReferralRecord {
  id: string;
  clientId: string;
  therapistId: string;
  therapistName: string;
  urgency: 'routine' | 'priority' | 'urgent_escalation';
  referralCategory?: ReferralCategory;
  referralDate?: string;
  serviceName: string;
  reason: string;
  status: 'recommended' | 'scheduled' | 'completed' | 'declined';
  followUpNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityIdeaRecord {
  id: string;
  userId?: string;
  title: string;
  focusArea: string;
  targetPopulation: string;
  district: string;
  summary: string;
  criteriaScores: Record<string, number>;
  findings: string[];
  aiAnalysis?: Record<string, unknown>;
  convertedProgrammeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Role1DailyLogRecord {
  id: string;
  userId: string;
  date: string;
  timestamp: string;
  type: 'quick' | 'detailed';
  mood?: string;
  quickNote?: string;
  completedActivities: string[];
  personalReflection?: string;
  detailedQuestions?: {
    dayOverview?: string;
    wentWell?: string;
    difficulties?: string;
    learned?: string;
    supportNeeded?: string;
    tomorrowFocus?: string;
  };
  tags: string[];
  cravingFrequency?: number;
  cravingIntensity?: number;
  sleepHours?: number;
  routineSteady?: boolean;
  isDraft?: boolean;
  clinicianReviewNote?: string;
  reviewedByTherapistName?: string;
  reviewedAt?: string;
  updatedAt?: string;
}

export interface Role1GoalRecord {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  targetDate?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  milestones: { id: string; title: string; completed: boolean }[];
  progressNotes: { id: string; date: string; note: string }[];
  completed: boolean;
  createdAt: string;
  createdByRole?: 'user' | 'therapist';
  updatedByRole?: 'user' | 'therapist';
  updatedByTherapistName?: string;
  therapistChangeNote?: string;
  updatedAt?: string;
}

export interface Role1CalendarEventRecord {
  id: string;
  userId: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  category: string;
  notes?: string;
  reminder: boolean;
  completed: boolean;
  completionState?: 'completed' | 'partial' | 'skipped' | 'planned';
  createdByRole?: 'user' | 'therapist';
  updatedByRole?: 'user' | 'therapist';
  updatedByTherapistName?: string;
  therapistChangeNote?: string;
  updatedAt?: string;
}

export interface Role1AssessmentRecord {
  id: string;
  userId: string;
  date: string;
  mode: 'quick' | 'deep';
  supportArea: string;
  focusAreas: string[];
  recommendedPathway: string;
  notes?: string;
}

export interface ClearPathDatabase {
  users: ServerUser[];
  sessions: SessionRecord[];
  connections: TherapistConnection[];
  invitations: TherapistInvitation[];
  permissionGrants: PermissionGrant[];
  permissionHistory: PermissionHistoryRecord[];
  substanceConcerns: SubstanceConcernServerRecord[];
  intakeSessions: IntakeSessionServerRecord[];
  supportPlans: SupportPlanServerRecord[];
  carePlanRevisions: CarePlanRevisionRecord[];
  carePlanProposals: CarePlanProposalRecord[];
  reports: SharedReportRecord[];
  assignments: TherapistAssignment[];
  weeklyProgress: WeeklyProgressSubmission[];
  appointmentNotes: AppointmentNoteRecord[];
  clinicalNotes: TherapistClinicalNote[];
  therapistReferrals: TherapistReferralRecord[];
  messages: SecureMessageRecord[];
  role1DailyLogs: Role1DailyLogRecord[];
  role1Goals: Role1GoalRecord[];
  role1CalendarEvents: Role1CalendarEventRecord[];
  role1Assessments: Role1AssessmentRecord[];
  personalProfiles: Array<{ userId: string; onboarding: Record<string, unknown>; updatedAt: string }>;
  recoveryReports: Array<RecoveryReportRecord & { userId: string }>;
  opportunityProfiles: Array<OpportunityProfile & { userId: string }>;
  savedOpportunities: Array<SavedOpportunityRecord & { userId: string }>;
  opportunityApplications: Array<OpportunityApplication & { userId: string }>;
  recoveryPassports: Array<RecoveryPassport & { userId: string }>;
  personalDevProgress: Array<PersonalDevTrackProgress & { userId: string }>;
  verifiedServices: VerifiedServiceRecord[];
  communityOrgs: ServerCommunityOrg[];
  programmes: ServerProgramme[];
  evaluations: ServerEvaluation[];
  communityIdeas: CommunityIdeaRecord[];
  localNeeds: LocalNeedObservationRecord[];
  auditLogs: AuditLogEntry[];
  appControls: AppControlsConfig;
}

export function buildDefaultWorkScope(): TherapistWorkScope {
  return {
    allowedSpecializations: [
      'Addiction Recovery',
      'Youth & Family Counselling',
      'CBT & Relapse Prevention',
    ],
    maxActivePatients: 40,
    allowDirectOnboarding: true,
    allowClinicalNotes: true,
    adminScopeNote: '',
  };
}

export function buildDefaultAppControls(): AppControlsConfig {
  return {
    allowNewSignups: true,
    allowTherapistDirectDiscovery: true,
    allowTherapistCustomCodes: true,
    enableAiBriefMode: true,
    requireOrgVerification: true,
    platformNotice: '',
    updatedAt: new Date().toISOString(),
  };
}

export const ALL_PERMISSION_CATEGORIES: PermissionCategory[] = [
  'background',
  'substances',
  'screening_results',
  'screening_responses',
  'goals',
  'weekly_reports',
  'cbt_reflections',
  'assignments',
  'appointments',
  'attachments',
];

function buildSeedVerifiedServices(): VerifiedServiceRecord[] {
  return [
    {
      id: 'svc-112-india',
      organization: 'ERSS — Emergency Response Support System (India)',
      verifiedContact: '112',
      serviceType: 'emergency',
      purposeSummary: 'Immediate medical, police, breathing, overdose, seizure, or acute life-safety emergencies.',
      location: 'All India & Kerala (District Control Rooms)',
      district: 'All Districts',
      hours: '24/7 Emergency Response',
      officialSourceUrl: 'https://112.gov.in/',
      lastVerified: '2026-11-01',
      verificationStatus: 'verified',
    },
    {
      id: 'svc-14405-vimukthi',
      organization: 'Kerala Vimukthi Mission (Mayangilla Keralam) Helpline',
      verifiedContact: '14405',
      serviceType: 'state_helpline',
      purposeSummary: 'Kerala Excise & Health confidential addiction counselling, family triage, and district treatment referrals.',
      location: 'Kerala State (14 Districts Vimukthi De-Addiction Network)',
      district: 'All Districts',
      hours: '24/7 Confidential Helpline',
      officialSourceUrl: 'https://keralaexcise.gov.in/vimukthi/',
      lastVerified: '2026-11-01',
      verificationStatus: 'verified',
    },
    {
      id: 'svc-14446-national',
      organization: 'National Toll-Free De-Addiction Helpline (MoSJE, Govt. of India)',
      verifiedContact: '14446',
      serviceType: 'national_helpline',
      purposeSummary: 'Primary nationwide addiction support counselling and referral to accredited IRCAs and clinics.',
      location: 'All India',
      district: 'National',
      hours: '24/7 Toll-Free',
      officialSourceUrl: 'https://socialjustice.gov.in/',
      lastVerified: '2026-11-01',
      verificationStatus: 'verified',
    },
    {
      id: 'svc-14416-telemanas',
      organization: 'Tele-MANAS National Mental Health Programme',
      verifiedContact: '14416',
      serviceType: 'mental_health',
      purposeSummary: 'Free 24/7 tele-mental health counselling with trained psychologists and psychiatrist escalation.',
      location: 'Kerala & All India',
      district: 'All Districts',
      hours: '24/7 Tele-Mental Health',
      officialSourceUrl: 'https://telemanas.mohfw.gov.in/',
      lastVerified: '2026-11-01',
      verificationStatus: 'verified',
    },
    {
      id: 'svc-1056-disha',
      organization: 'DISHA Kerala Health Helpline',
      verifiedContact: '1056',
      serviceType: 'mental_health',
      purposeSummary: 'Kerala Health Department 24/7 tele-health, crisis counselling, and medical referral guidance.',
      location: 'Kerala State',
      district: 'All Districts',
      hours: '24/7 State Health Support',
      officialSourceUrl: 'https://dhs.kerala.gov.in/',
      lastVerified: '2026-11-01',
      verificationStatus: 'verified',
    },
    {
      id: 'svc-nimhans-vimukthi-tvm',
      organization: 'Vimukthi De-Addiction Centre — Govt. Medical College, Thiruvananthapuram',
      verifiedContact: '14405 / 0471-2528300',
      serviceType: 'treatment_centre',
      purposeSummary: 'Clinical outpatient assessment, medically supervised care, and family counselling.',
      location: 'Medical College Campus, Thiruvananthapuram',
      district: 'Thiruvananthapuram',
      hours: 'Mon–Sat OPD Hours · 24/7 Emergency Casualty',
      officialSourceUrl: 'https://keralaexcise.gov.in/vimukthi/',
      lastVerified: '2026-11-01',
      verificationStatus: 'verified',
    },
    {
      id: 'svc-vimukthi-ekm',
      organization: 'Vimukthi Counselling & De-Addiction Unit — Ernakulam General Hospital',
      verifiedContact: '14405 / 0484-2360002',
      serviceType: 'treatment_centre',
      purposeSummary: 'District outpatient de-addiction consultation, therapy coordination, and follow-up.',
      location: 'General Hospital Campus, Ernakulam',
      district: 'Ernakulam',
      hours: 'Mon–Sat 9:00 AM – 2:00 PM',
      officialSourceUrl: 'https://keralaexcise.gov.in/vimukthi/',
      lastVerified: '2026-11-01',
      verificationStatus: 'verified',
    },
    {
      id: 'svc-vimukthi-kozhikode',
      organization: 'IMHANS & Vimukthi Clinical Addiction Unit — Kozhikode',
      verifiedContact: '14405 / 0495-2359352',
      serviceType: 'treatment_centre',
      purposeSummary: 'Specialized psychiatric, psychological, and youth-friendly substance support.',
      location: 'Government Medical College Campus, Kozhikode',
      district: 'Kozhikode',
      hours: 'Mon–Sat 9:00 AM – 4:00 PM',
      officialSourceUrl: 'https://imhans.ac.in/',
      lastVerified: '2026-11-01',
      verificationStatus: 'verified',
    },
  ];
}

export function hashPassword(password: string, existingSalt?: string): string {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, originalHex] = storedHash.split(':');
  if (!salt || !originalHex) return false;
  const derivedHex = crypto.scryptSync(password, salt, 64).toString('hex');
  const a = Buffer.from(originalHex, 'hex');
  const b = Buffer.from(derivedHex, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
}

export function getDbPath(): string {
  if (process.env.CLEARPATH_DB_PATH) {
    return path.resolve(process.env.CLEARPATH_DB_PATH);
  }
  return path.resolve(process.cwd(), '.clearpath_data', 'db.json');
}

const CLINICAL_ENC_PREFIX = 'enc:v1:';
let cachedRuntimeKeyHex: string | null = null;

function getClinicalAesKey(): Buffer {
  const envSecret = process.env.CLEARPATH_CLINICAL_KEY?.trim();
  if (envSecret) {
    return crypto.createHash('sha256').update(envSecret).digest();
  }
  const dbDir = path.dirname(getDbPath());
  const keyFile = path.join(dbDir, '.clinical.key');
  try {
    if (fs.existsSync(keyFile)) {
      const hex = fs.readFileSync(keyFile, 'utf-8').trim();
      if (/^[a-f0-9]{64}$/i.test(hex)) {
        return Buffer.from(hex, 'hex');
      }
    }
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const generatedHex = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(keyFile, generatedHex, { encoding: 'utf-8', mode: 0o600 });
    return Buffer.from(generatedHex, 'hex');
  } catch {
    if (!cachedRuntimeKeyHex) {
      cachedRuntimeKeyHex = crypto.randomBytes(32).toString('hex');
    }
    return Buffer.from(cachedRuntimeKeyHex, 'hex');
  }
}

export function encryptClinicalText(plaintext: string): string {
  if (!plaintext) return plaintext;
  if (plaintext.startsWith(CLINICAL_ENC_PREFIX)) return plaintext;
  const key = getClinicalAesKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${CLINICAL_ENC_PREFIX}${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptClinicalText(stored: string): string {
  if (!stored || !stored.startsWith(CLINICAL_ENC_PREFIX)) {
    return stored;
  }
  try {
    const parts = stored.slice(CLINICAL_ENC_PREFIX.length).split(':');
    if (parts.length !== 3) return stored;
    const [ivB64, tagB64, dataB64] = parts;
    const key = getClinicalAesKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch {
    return '[Encrypted clinical note — key unavailable]';
  }
}

function buildInitialDatabase(): ClearPathDatabase {
  const adminUsername = (process.env.CLEARPATH_ADMIN_USER || 'admin').trim().toLowerCase();
  const adminPassword = process.env.CLEARPATH_ADMIN_PASS || 'ClearPathAdmin!2026';

  return {
    users: [
      {
        id: 'admin-platform-1',
        username: adminUsername,
        name: 'ClearPath Platform Administrator',
        email: 'admin@clearpath.local',
        passwordHash: hashPassword(adminPassword),
        role: 'admin',
        verificationStatus: 'approved',
        district: 'Thiruvananthapuram',
        createdAt: new Date().toISOString(),
      },
    ],
    sessions: [],
    connections: [],
    invitations: [],
    permissionGrants: [],
    permissionHistory: [],
    substanceConcerns: [],
    intakeSessions: [],
    supportPlans: [],
    carePlanRevisions: [],
    carePlanProposals: [],
    reports: [],
    assignments: [],
    weeklyProgress: [],
    appointmentNotes: [],
    clinicalNotes: [],
    therapistReferrals: [],
    messages: [],
    role1DailyLogs: [],
    role1Goals: [],
    role1CalendarEvents: [],
    role1Assessments: [],
    personalProfiles: [],
    recoveryReports: [],
    opportunityProfiles: [],
    savedOpportunities: [],
    opportunityApplications: [],
    recoveryPassports: [],
    personalDevProgress: [],
    verifiedServices: buildSeedVerifiedServices(),
    communityOrgs: [],
    programmes: [],
    evaluations: [],
    communityIdeas: [],
    localNeeds: [],
    auditLogs: [],
    appControls: buildDefaultAppControls(),
  };
}

let cachedDb: ClearPathDatabase | null = null;
let cachedDbPath: string | null = null;

export function loadDb(): ClearPathDatabase {
  const targetPath = getDbPath();
  if (cachedDb && cachedDbPath === targetPath) {
    return cachedDb;
  }

  try {
    if (fs.existsSync(targetPath)) {
      const raw = fs.readFileSync(targetPath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<ClearPathDatabase>;
      const base = buildInitialDatabase();
      cachedDb = {
        users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : base.users,
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        connections: Array.isArray(parsed.connections) ? parsed.connections : [],
        invitations: Array.isArray(parsed.invitations) ? parsed.invitations : [],
        permissionGrants: Array.isArray(parsed.permissionGrants) ? parsed.permissionGrants : [],
        permissionHistory: Array.isArray(parsed.permissionHistory) ? parsed.permissionHistory : [],
        substanceConcerns: Array.isArray(parsed.substanceConcerns) ? parsed.substanceConcerns : [],
        intakeSessions: Array.isArray(parsed.intakeSessions) ? parsed.intakeSessions : [],
        supportPlans: Array.isArray(parsed.supportPlans) ? parsed.supportPlans : [],
        carePlanRevisions: Array.isArray(parsed.carePlanRevisions) ? parsed.carePlanRevisions : [],
        carePlanProposals: Array.isArray(parsed.carePlanProposals) ? parsed.carePlanProposals : [],
        reports: Array.isArray(parsed.reports) ? parsed.reports : [],
        assignments: Array.isArray(parsed.assignments) ? parsed.assignments : [],
        weeklyProgress: Array.isArray(parsed.weeklyProgress) ? parsed.weeklyProgress : [],
        appointmentNotes: Array.isArray(parsed.appointmentNotes) ? parsed.appointmentNotes : [],
        clinicalNotes: Array.isArray(parsed.clinicalNotes) ? parsed.clinicalNotes : [],
        therapistReferrals: Array.isArray(parsed.therapistReferrals) ? parsed.therapistReferrals : [],
        messages: Array.isArray(parsed.messages) ? parsed.messages : [],
        role1DailyLogs: Array.isArray(parsed.role1DailyLogs) ? parsed.role1DailyLogs : [],
        role1Goals: Array.isArray(parsed.role1Goals) ? parsed.role1Goals : [],
        role1CalendarEvents: Array.isArray(parsed.role1CalendarEvents) ? parsed.role1CalendarEvents : [],
        role1Assessments: Array.isArray(parsed.role1Assessments) ? parsed.role1Assessments : [],
        personalProfiles: Array.isArray(parsed.personalProfiles) ? parsed.personalProfiles : [],
        recoveryReports: Array.isArray(parsed.recoveryReports) ? parsed.recoveryReports : [],
        opportunityProfiles: Array.isArray(parsed.opportunityProfiles) ? parsed.opportunityProfiles : [],
        savedOpportunities: Array.isArray(parsed.savedOpportunities) ? parsed.savedOpportunities : [],
        opportunityApplications: Array.isArray(parsed.opportunityApplications) ? parsed.opportunityApplications : [],
        recoveryPassports: Array.isArray(parsed.recoveryPassports) ? parsed.recoveryPassports : [],
        personalDevProgress: Array.isArray(parsed.personalDevProgress) ? parsed.personalDevProgress : [],
        verifiedServices:
          Array.isArray(parsed.verifiedServices) && parsed.verifiedServices.length > 0
            ? parsed.verifiedServices
            : base.verifiedServices,
        communityOrgs: Array.isArray(parsed.communityOrgs) ? parsed.communityOrgs : [],
        programmes: Array.isArray(parsed.programmes) ? parsed.programmes : [],
        evaluations: Array.isArray(parsed.evaluations) ? parsed.evaluations : [],
        communityIdeas: Array.isArray(parsed.communityIdeas) ? parsed.communityIdeas : [],
        localNeeds: Array.isArray(parsed.localNeeds) ? parsed.localNeeds : [],
        auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
        appControls: parsed.appControls
          ? { ...buildDefaultAppControls(), ...parsed.appControls }
          : buildDefaultAppControls(),
      };
      if (!cachedDb.users.some(u => u.role === 'admin')) {
        cachedDb.users.unshift(base.users[0]);
      }
      cachedDbPath = targetPath;
      return cachedDb;
    }
  } catch (err) {
    console.warn('Reinitializing ClearPath persistent store:', err);
  }

  cachedDb = buildInitialDatabase();
  cachedDbPath = targetPath;
  saveDb(cachedDb);
  return cachedDb;
}

export function saveDb(db: ClearPathDatabase): void {
  const targetPath = getDbPath();
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpPath = `${targetPath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tmpPath, targetPath);
  cachedDb = db;
  cachedDbPath = targetPath;
}

export function resetDbCacheForTests(): void {
  cachedDb = null;
  cachedDbPath = null;
}

export function sanitizePublicUser(user: ServerUser) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    contactPhone: user.contactPhone,
    phoneVerified: Boolean(user.phoneVerified),
    phoneVerifiedAt: user.phoneVerifiedAt,
    availabilityStatus: user.availabilityStatus || 'available',
    availabilityHours: user.availabilityHours,
    nextAvailableSlot: user.nextAvailableSlot,
    whatsappOptIn: Boolean(user.whatsappOptIn),
    role: user.role,
    verificationStatus: user.verificationStatus,
    ageRange: user.ageRange,
    professionalCategory: user.professionalCategory,
    qualifications: user.qualifications,
    licenseNumber: user.licenseNumber,
    institution: user.institution,
    areaOfPractice: user.areaOfPractice,
    specialization: user.specialization,
    district: user.district,
    supportingDocRef: user.supportingDocRef,
    verificationNote: user.verificationNote,
    bio: user.bio,
    workScope: user.role === 'therapist' ? (user.workScope || buildDefaultWorkScope()) : undefined,
    customAccessCodesCount:
      user.role === 'therapist'
        ? (user.customAccessCodes || []).filter(c => c.active).length
        : undefined,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function appendAuditLog(
  db: ClearPathDatabase,
  entry: Omit<AuditLogEntry, 'id' | 'timestamp'>
): AuditLogEntry {
  const log: AuditLogEntry = {
    ...entry,
    id: makeId('audit'),
    timestamp: new Date().toISOString(),
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 500) {
    db.auditLogs = db.auditLogs.slice(0, 500);
  }
  return log;
}

export function isAuthorizedTherapistForClient(
  db: ClearPathDatabase,
  therapistId: string,
  clientId: string
): boolean {
  const therapist = db.users.find(u => u.id === therapistId && u.role === 'therapist');
  if (!therapist || therapist.verificationStatus !== 'approved') return false;
  return db.connections.some(
    c => c.therapistId === therapistId && c.clientId === clientId && c.status === 'accepted'
  );
}

export function getActivePermissionGrantForClient(
  db: ClearPathDatabase,
  therapistId: string,
  clientId: string
): PermissionGrant | null {
  if (!isAuthorizedTherapistForClient(db, therapistId, clientId)) return null;
  const nowMs = Date.now();
  const grant = db.permissionGrants.find(
    g =>
      g.therapistId === therapistId &&
      g.clientId === clientId &&
      g.status === 'active' &&
      (!g.expiresAt || new Date(g.expiresAt).getTime() > nowMs)
  );
  if (grant) return grant;

  // Check if any expired grant needs marking
  db.permissionGrants.forEach(g => {
    if (g.status === 'active' && g.expiresAt && new Date(g.expiresAt).getTime() <= nowMs) {
      g.status = 'expired';
    }
  });
  return null;
}

export function hasClientPermissionCategory(
  db: ClearPathDatabase,
  therapistId: string,
  clientId: string,
  category: PermissionCategory
): boolean {
  const grant = getActivePermissionGrantForClient(db, therapistId, clientId);
  if (!grant) {
    // Backward-compatible default ONLY if no explicit grant object was ever configured for an older accepted connection;
    // once any grant history exists for that connection, enforce strictly.
    const conn = db.connections.find(
      c => c.therapistId === therapistId && c.clientId === clientId && c.status === 'accepted'
    );
    if (!conn) return false;
    const anyGrantEver = db.permissionGrants.some(
      g => g.therapistId === therapistId && g.clientId === clientId
    );
    if (!anyGrantEver) return true;
    return false;
  }
  return grant.categories.includes(category);
}
