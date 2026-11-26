export type UserRole = 'personal' | 'supporter' | 'learner' | 'community';

export type Language = 'en' | 'ml';

// ==========================================
// ROLE 01: PERSONAL JOURNEY TYPES
// ==========================================
export type RecoveryJourneyStage =
  | 'exploring'
  | 'starting_change'
  | 'active_recovery'
  | 'maintaining'
  | 'rebuilding_life';

export type ClinicalTreatmentStatus =
  | 'self_reported_only'
  | 'clinician_confirmed_treatment'
  | 'completed_formal_care'
  | 'no_formal_treatment'
  | 'prefer_not_to_say';

export interface PersonalizedLifePathway {
  careStatusLabel: string;
  careStatusDetail: string;
  isFormalTreatmentConfirmed: boolean;
  focusAreas: string[];
  firstGentleStep: string;
  weeklyRhythm: string;
  recommendedTabs: Array<{ tabKey: string; label: string; reason: string }>;
  recommendedDevTrackIds: string[];
  generatedAt: string;
}

export interface PersonalOnboarding {
  primaryNeed: string;
  otherReasonText?: string;
  ageRange?: '12_17' | '18_24' | '25_44' | '45_plus' | 'prefer_not_to_say';
  assistanceTypes: string[];
  preferredSupportMethods?: string[];
  currentlyInProfessionalCare?: 'yes' | 'no' | 'prefer_not_to_say';
  hasTherapistAccess?: 'yes' | 'no' | 'looking';
  reminderPreference?: 'gentle_in_app' | 'weekly_only' | 'none';
  minorConfidentialityAck?: boolean;
  language: Language;
  storagePreference: 'private' | 'account';
  supportPreferences: {
    reminders: boolean;
    trustedSupporter: boolean;
    professionalFinder: boolean;
  };
  journeyStage?: RecoveryJourneyStage;
  clinicalTreatmentStatus?: ClinicalTreatmentStatus;
  educationLevel?: string;
  employmentStatus?: string;
  existingSkills?: string[];
  personalGoals?: string[];
  familySocialSupport?: 'strong' | 'some' | 'limited' | 'prefer_not_to_say';
  immediateNeeds?: string[];
  voluntarySubstanceNotes?: string;
  recoveryStartDate?: string;
  personalizedPathway?: PersonalizedLifePathway;
  completed: boolean;
}

export type MoodType =
  | 'peaceful'
  | 'steady'
  | 'challenged'
  | 'heavy'
  | 'hopeful'
  | 'restless'
  | 'tired'
  | 'difficult';

export interface DailyLog {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO
  type: 'quick' | 'detailed';
  mood?: MoodType;
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
  cravingFrequency?: number; // optional 0-5 daily frequency
  cravingIntensity?: number; // optional 0-10 peak intensity
  sleepHours?: number; // optional sleep duration
  routineSteady?: boolean;
  isDraft?: boolean;
  clinicianReviewNote?: string;
  reviewedByTherapistName?: string;
  reviewedAt?: string;
  updatedAt?: string;
}

export type EventCategory =
  | 'appointment'
  | 'personal_goal'
  | 'healthy_activity'
  | 'learning'
  | 'supporter_meeting'
  | 'reflection'
  | 'other';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  category: EventCategory;
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

export type GoalCategory =
  | 'education'
  | 'career'
  | 'physical'
  | 'creative'
  | 'family'
  | 'personal'
  | 'social'
  | 'routine';

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface GoalNote {
  id: string;
  date: string;
  note: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  targetDate?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  milestones: GoalMilestone[];
  progressNotes: GoalNote[];
  completed: boolean;
  createdAt: string;
  createdByRole?: 'user' | 'therapist';
  updatedByRole?: 'user' | 'therapist';
  updatedByTherapistName?: string;
  therapistChangeNote?: string;
  updatedAt?: string;
}

export interface SupportCenter {
  id: string;
  name: string;
  district: string;
  category: 'government_deaddiction' | 'hospital' | 'counselling' | 'rehabilitation' | 'aftercare';
  isGovt: boolean;
  phone: string;
  address: string;
  services: string[];
  openingHours: string;
  lastVerified: string;
  coordinates: { lat: number; lng: number };
  isSaved?: boolean;
  eligibility?: string;
  costInfo?: string;
  languagesSupported?: string[];
  ageSuitability?: string;
  sourceOfVerification?: string;
}

export interface GuidedTool {
  id: string;
  title: string;
  subtitle: string;
  category: 'reflection' | 'coping' | 'decision' | 'communication' | 'routine';
  durationMinutes: number;
  scientificBasis: string;
  steps: {
    title: string;
    prompt: string;
    helpText?: string;
    type: 'text' | 'choice' | 'scale' | 'action';
    options?: string[];
  }[];
}

export interface CognitiveGame {
  id:
    | 'go-no-go'
    | 'dot-probe'
    | 'dual-nback'
    | 'dual-n-back'
    | 'somatic-grounding'
    | 'stroop'
    | 'pattern-recall'
    | 'urge-wave-rider'
    | 'trigger-detective';
  title: string;
  subtitle: string;
  evidenceBadge: string;
  category:
    | 'Inhibition Control'
    | 'Attentional Bias'
    | 'Working Memory'
    | 'Autonomic Pacing'
    | 'Executive Control'
    | 'Urge Surfing'
    | 'Trigger Agility'
    | 'Executive Endurance';
  duration: string;
  description: string;
  scientificRationale: string;
}

// ==========================================
// ROLE 02: SUPPORTER TYPES
// ==========================================
export interface SupporterOnboarding {
  supportingWho: string;
  otherRelationshipText?: string;
  personAwareOfSearch?: 'yes' | 'no' | 'unsure';
  currentlyReceivingHelp?: 'yes' | 'no' | 'unsure';
  mainConcern: string;
  otherConcernText?: string;
  guidanceNeeded: string[];
  language: Language;
  experiencePreference: string;
  completed: boolean;
}

export interface SupportPlanTask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface SupportPlan {
  id: string;
  title: string;
  objective?: string;
  relationshipCategory: string;
  tasks: SupportPlanTask[];
  notes?: string;
  contactIds?: string[];
  followUpDate?: string;
  completed: boolean;
  createdAt: string;
}

export type SupporterEventCategory =
  | 'conversation_prep'
  | 'planned_conversation'
  | 'appointment'
  | 'family_activity'
  | 'support_followup'
  | 'learning'
  | 'wellbeing'
  | 'appointment_accompaniment'
  | 'education'
  | 'other';

export interface SupporterCalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  category: SupporterEventCategory;
  notes?: string;
  reminder: boolean;
  completed: boolean;
}

export type SupporterMood =
  | 'encouraged'
  | 'steady'
  | 'concerned'
  | 'drained'
  | 'hopeful'
  | 'patient'
  | 'overwhelmed';

export interface SupporterReflection {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO
  type: 'quick' | 'detailed';
  mood?: SupporterMood;
  quickNote?: string;
  tags: string[];
  detailedAnswers?: {
    learnedToday?: string;
    wentWell?: string;
    difficulties?: string;
    supportProvided?: string;
    understandBetter?: string;
    focusNext?: string;
  };
  isDraft?: boolean;
}

export interface ConversationPlan {
  id: string;
  situation: string;
  title?: string;
  label?: string;
  chosenOpeningLine?: string;
  plannedQuestions?: string[];
  openingLine?: string;
  questions?: string[];
  approaches?: string[];
  thingsToAvoid?: string[];
  notes?: string;
  personalNotes?: string;
  scheduledDate?: string;
  completed?: boolean;
  createdAt: string;
}

export interface SupporterEducationModule {
  id: string;
  title: string;
  category: string;
  readTimeMinutes?: number;
  readingTimeMinutes?: number;
  summary: string;
  sections?: { heading: string; content: string }[];
  keyTakeaways?: string[];
  practicalTips?: string[];
  scenarioCheck?: {
    scenario: string;
    options: { text: string; feedback: string; isConstructive: boolean }[];
  };
}

// ==========================================
// ROLE 03: LEARNER TYPES
// ==========================================
export type LearnerKnowledgeLevel = 'beginner' | 'familiar' | 'advanced';
export type LearnerFormatPreference = 'short_lessons' | 'interactive_activities' | 'case_studies' | 'mixed';

export interface LearnerOnboarding {
  primaryInterest: string;
  knowledgeLevel: LearnerKnowledgeLevel;
  formatPreference: LearnerFormatPreference;
  language: Language;
  learningObjectives: string[];
  weeklyTargetLessons: number;
  completed: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  scientificReference?: string;
}

export interface LessonSection {
  heading: string;
  content: string;
}

export interface Lesson {
  id: string;
  pathwayId: string;
  title: string;
  subtitle: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  readTimeMinutes: number;
  objective: string;
  summary: string;
  sections: LessonSection[];
  keyTakeaways: string[];
  practicalApplication: string;
  referenceLinks?: { label: string; url: string }[];
  sourceOrganization?: string;
  publicationDate?: string;
  evidenceLevel?: 'established' | 'emerging';
  learningCategory?: string;
  lastVerified?: string;
  quizQuestions: QuizQuestion[];
}

export interface LearningPathway {
  id: string;
  number: number;
  title: string;
  malayalamTitle: string;
  description: string;
  iconName: string;
  colorClass: string;
  accentBg: string;
  borderColor: string;
  lessonIds: string[];
  estimatedMinutes: number;
}

export interface ScenarioOption {
  text: string;
  outcome: string;
  isConstructive: boolean;
  scientificReasoning: string;
  followUpTip: string;
}

export interface LearningScenario {
  id: string;
  pathwayId: string;
  title: string;
  category: 'peer_pressure' | 'stress_coping' | 'digital_social' | 'supporting_friend' | 'academic_pressure';
  situation: string;
  context: string;
  options: ScenarioOption[];
  coreLesson: string;
}

export interface MythFact {
  id: string;
  category: 'neurobiology' | 'social' | 'health' | 'substances' | 'treatment';
  claim: string;
  isFact: boolean;
  verdict: string;
  detailedExplanation: string;
  evidenceSource: string;
}

export interface LearnerCalendarEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime?: string;
  durationMinutes: number;
  pathwayId?: string;
  lessonId?: string;
  notes?: string;
  completed: boolean;
}

export interface LearnerJournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string;
  title: string;
  pathwayId?: string;
  keyTakeaway: string;
  openQuestions?: string;
  personalApplication?: string;
  tags: string[];
}

export interface QuizAttempt {
  id: string;
  lessonId: string;
  score: number;
  totalQuestions: number;
  date: string;
  timestamp: string;
}

export interface AppState {
  currentRole: UserRole | null;
  language: Language;
  personalOnboarding: PersonalOnboarding | null;
  dailyLogs: DailyLog[];
  calendarEvents: CalendarEvent[];
  goals: Goal[];
  savedCenterIds: string[];
  toolCompletions: Record<string, { completedAt: string; responses: Record<number, string> }>;
  gameHighScores: Record<string, { bestScore: number; lastPlayed: string }>;
  offlineDrafts: Record<string, string>;
  hasAccountSync: boolean;

  // Supporter state
  supporterOnboarding: SupporterOnboarding | null;
  supportPlans: SupportPlan[];
  supporterEvents: SupporterCalendarEvent[];
  supporterReflections: SupporterReflection[];
  savedConversationPlans: ConversationPlan[];
  completedEducationModuleIds: string[];

  // Learner state
  learnerOnboarding: LearnerOnboarding | null;
  completedLessonIds: string[];
  bookmarkedLessonIds: string[];
  savedScenarioAttempts: Record<string, { choiceIndex: number; completedAt: string }>;
  learnerEvents: LearnerCalendarEvent[];
  learnerJournalEntries: LearnerJournalEntry[];
  quizAttempts: QuizAttempt[];

  // Community Builder state (Role 04)
  communityOnboarding: CommunityOnboarding | null;
  communityOrg: CommunityOrganisation | null;
  communityMembers: CommunityMember[];
  communityProgrammes: CommunityProgramme[];
  communityEvents: CommunityEvent[];
  communityTasks: CommunityTask[];
  communityCampaigns: CommunityCampaign[];
  communityFeedback: CommunityFeedbackEntry[];
  bookmarkedResourceIds: string[];
}

// ==========================================
// ROLE 04: COMMUNITY BUILDER TYPES
// ==========================================

export type CommunityRole = 'admin' | 'coordinator' | 'member';

export type CommunityOrgType =
  | 'school'
  | 'ngo'
  | 'community_group'
  | 'institution'
  | 'independent_educator';

export interface CommunityOnboarding {
  roleResponsibility: string;
  orgType: CommunityOrgType;
  district: string;
  objectives: string[];
  language: 'en' | 'ml';
  mode: 'create_workspace' | 'join_existing';
  completed: boolean;
}

export interface CommunityOrganisation {
  id: string;
  name: string;
  type: CommunityOrgType;
  district: string;
  address?: string;
  coordinatorName: string;
  coordinatorDesignation: string;
  coordinatorEmail?: string;
  coordinatorPhone?: string;
  verificationDocRef?: string;
  intendedUse?: string;
  verificationStatus?: 'pending' | 'approved' | 'rejected';
  description: string;
  createdAt: string;
}

export interface CommunityMember {
  id: string;
  name: string;
  roleTitle: string;
  contact: string;
  permission: CommunityRole;
  joinedAt: string;
}

export interface CommunityProgramme {
  id: string;
  title: string;
  category:
    | 'school_awareness'
    | 'youth_engagement'
    | 'community_education'
    | 'family_awareness'
    | 'teacher_training'
    | 'peer_education'
    | 'recovery_support'
    | 'community_partnerships';
  objective: string;
  targetAudience: string;
  location: string;
  district: string;
  startDate: string;
  endDate: string;
  coordinatorId: string;
  teamMemberIds: string[];
  requiredResources: string;
  budget: number;
  spent: number;
  status: 'planning' | 'active' | 'completed' | 'archived';
  expectedOutcomes: string;
  actualResults?: string;
  notes?: string;
  createdAt: string;
  moderationStatus?: 'draft' | 'pending_review' | 'approved_published';
  eligibility?: string;
  registeredCount?: number;
  isRegisteredByUser?: boolean;
  settings?: string;
  partners?: string;
  strategies?: string;
  safeguards?: string;
  indicators?: string;
  evaluationPlan?: string;
  timeline?: string;
  potentialRisks?: string;
  linkedIdeaId?: string;
}

export interface CommunityEvent {
  id: string;
  programmeId: string;
  title: string;
  category: string;
  date: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  venue: string;
  coordinatorId: string;
  description: string;
  targetAudience: string;
  expectedAttendance: number;
  actualAttendance: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  materialsNeeded?: string;
  completionNotes?: string;
}

export interface CommunityTask {
  id: string;
  title: string;
  programmeId?: string;
  eventId?: string;
  assignedMemberId: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed';
  description: string;
  completionNotes?: string;
}

export interface CommunityResource {
  id: string;
  title: string;
  titleMl?: string;
  category: string;
  targetAudience: string;
  language: 'en' | 'ml' | 'both';
  format:
    | 'workshop_outline'
    | 'presentation_slides'
    | 'teacher_guide'
    | 'student_activity'
    | 'infographic'
    | 'policy_template';
  summary: string;
  keyPoints: string[];
  suggestedDuration: string;
  downloadOrPrintContent: string;
}

export interface CommunityCampaign {
  id: string;
  title: string;
  theme: string;
  objective: string;
  targetAudience: string;
  district: string;
  startDate: string;
  endDate: string;
  status: 'draft' | 'active' | 'completed';
  budget: number;
  spent: number;
  milestones: { id: string; title: string; targetDate: string; completed: boolean }[];
  reviewNotes?: string;
}

export interface CommunityFeedbackEntry {
  id: string;
  programmeId?: string;
  eventId?: string;
  date: string;
  topic: string;
  participantGroup: string;
  usefulnessRating: number; // 1 to 5
  clarityRating: number; // 1 to 5
  keyConcernsExpressed: string[];
  unmetNeedsSuggestions: string;
  anonymous: boolean;
}

export interface CommunityReport {
  id: string;
  title: string;
  period: string;
  generatedAt: string;
  summary: string;
  keyAchievements: string[];
  challenges: string[];
  recommendations: string[];
}

// ==========================================
// USER AUTHENTICATION & PROFILE
// ==========================================
export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email?: string;
  passwordHash: string; // SHA-256 hex string, never plain text
  ageRange?: 'youth' | 'young_adult' | 'adult' | 'senior';
  language: Language;
  primaryReason: 'recovery' | 'supporter' | 'learner' | 'community' | 'general';
  lastSelectedRole?: UserRole;
  preferredRhythm?: 'morning' | 'evening' | 'flexible';
  securityQuestion: string;
  securityAnswerHash: string;
  createdAt: string;
  lastLoginAt: string;
}

// ==========================================
// MOTIVATION BAR (ROLE 01)
// ==========================================
export interface MotivationAnchor {
  personalWhy: string;
  dailySparkDate?: string;
  favoriteQuotes: string[];
}

// ==========================================
// LEARNER CUSTOM PLAN & CERTIFICATE (ROLE 03)
// ==========================================
export interface LearnerCustomPlan {
  id: string;
  goalTitle: string;
  topicInterests: string[];
  durationDays: number; // e.g. 7, 14
  dailyMinutes: number;
  startDate: string;
  days: {
    dayNumber: number;
    title: string;
    description: string;
    completed: boolean;
    completedAt?: string;
  }[];
}

export interface LearnerCertificate {
  id: string;
  recipientName: string;
  courseTitle: string;
  completedDate: string;
  modulesCompletedCount: number;
  verificationCode: string;
  scorePercentage: number;
}

// ==========================================
// FEATURE MANAGEMENT & RED HELP DOT GUIDE
// ==========================================
export interface FeatureInfo {
  id: string;
  title: string;
  titleMl: string;
  tagline: string;
  taglineMl: string;
  explanation: string;
  explanationMl: string;
  recommendedAction?: string;
  recommendedActionMl?: string;
  privacyNote?: string;
  privacyNoteMl?: string;
  iconName?: string;
  category: 'core' | 'tools' | 'support' | 'intelligence';
  role: UserRole;
  tabKey: string;
}

// ==========================================
// CLEARPATH AI CONNECTED ECOSYSTEM TYPES
// ==========================================
export interface TriggerJournalEntry {
  id: string;
  date: string;
  timestamp: string;
  triggerCategory: 'stress' | 'social' | 'boredom' | 'environment' | 'emotional' | 'sleep_deficit';
  intensity: 1 | 2 | 3 | 4 | 5;
  situation: string;
  copingMove: string;
  aiInsight?: string;
}

export interface HabitChallenge {
  id: string;
  title: string;
  titleMl: string;
  category: 'sleep' | 'hydration' | 'movement' | 'mindfulness' | 'connection';
  targetDays: number;
  completedDates: string[];
  active: boolean;
}

export interface DeepAssessmentResult {
  patternLevel: string;
  relianceScore: number;
  recoveryPossibilityPct: number;
  neurobiologySummary: string;
  timelineEstimate: string;
  inAppSolutions: {
    label: string;
    tabKey: string;
    targetRole: string;
    reason: string;
  }[];
  communityRecommendation: string;
  source?: string;
}

export interface FlexibleQuestionResponse {
  questionId: string;
  questionText: string;
  questionKind: 'validated_domain' | 'supplementary_context';
  responseMode: 'option' | 'other' | 'unsure' | 'prefer_not_to_answer';
  optionLabel?: string;
  numericValue?: number;
  otherText?: string;
}

export interface EarlySupportAssessment {
  id: string;
  date: string;
  mode?: 'quick' | 'deep';
  instrumentNotice?: string;
  focusAreas: string[];
  intensityLevel: 'low' | 'moderate' | 'elevated';
  recommendedPathway: string;
  actionSteps: string[];
  flexibleResponses?: FlexibleQuestionResponse[];
  aiContextSummary?: {
    summaryBullets: string[];
    clinicianTopics: string[];
    nonDiagnosticNotice: string;
  };
  deepResult?: DeepAssessmentResult;
}

export interface AchievementTimelineItem {
  id: string;
  date: string;
  role: UserRole;
  title: string;
  detail: string;
  category: 'checkin' | 'assessment' | 'quest' | 'learning' | 'community';
}

export interface UnifiedNotification {
  id: string;
  title: string;
  titleMl: string;
  message: string;
  messageMl: string;
  category: 'personal' | 'supporter' | 'learner' | 'community' | 'system';
  targetRole: UserRole;
  deepLinkTab: string;
  priority: 'normal' | 'high';
  read: boolean;
  timestamp: string;
}

export interface ConsentPreferences {
  receiveCrossRoleAnnouncements: boolean;
  shareAnonymizedLearningGaps: boolean;
  allowOptionalActionBridges: boolean;
  reportSharingConsentDefault?: boolean;
  therapistUpdatesConsent?: boolean;
}

export interface ClearPathMission {
  id: string;
  title: string;
  titleMl: string;
  scope: 'school' | 'community' | 'knowledge' | 'challenge';
  description: string;
  descriptionMl: string;
  steps: string[];
  completedStepIndices: number[];
  district: string;
  unlockedInsight?: string;
  unlockedInsightMl?: string;
}

export interface InnovationExchangeItem {
  id: string;
  title: string;
  authorOrg: string;
  orgType: CommunityOrgType;
  district: string;
  templateSummary: string;
  targetAudience: string;
  steps: string[];
  adaptedCount: number;
  createdAt: string;
}

// ==========================================
// THERAPIST PORTAL, CLINICAL CARE & REPORTS
// ==========================================
export type PortalMode = 'none' | 'therapist' | 'admin' | 'mission';

export type AccountRole = 'user' | 'therapist' | 'admin' | 'community';

export type TherapistAvailabilityStatus = 'available' | 'busy' | 'offline';

export type VerificationStatus =
  | 'registration_incomplete'
  | 'submitted'
  | 'pending_verification'
  | 'approved'
  | 'rejected'
  | 'suspended'
  | 'pending'; // legacy alias kept for backward compatibility

export type ProfessionalCategory =
  | 'psychiatrist'
  | 'clinical_psychologist'
  | 'medical_practitioner'
  | 'psychiatric_social_worker'
  | 'qualified_counsellor'
  | 'other';

export interface TherapistAccessCodeClient {
  id: string;
  code: string;
  label: string;
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TherapistWorkScopeClient {
  allowedSpecializations: string[];
  maxActivePatients: number;
  allowDirectOnboarding: boolean;
  allowClinicalNotes: boolean;
  adminScopeNote?: string;
  updatedAt?: string;
}

export interface AppControlsConfigClient {
  allowNewSignups: boolean;
  allowTherapistDirectDiscovery: boolean;
  allowTherapistCustomCodes: boolean;
  enableAiBriefMode: boolean;
  requireOrgVerification: boolean;
  platformNotice: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface ServerAuthUser {
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
  workScope?: TherapistWorkScopeClient;
  customAccessCodesCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TherapistDirectoryEntry {
  id: string;
  name: string;
  username: string;
  professionalCategory?: ProfessionalCategory;
  qualifications?: string;
  institution?: string;
  areaOfPractice?: string;
  specialization: string;
  district: string;
  licenseNumber: string;
  bio: string;
  availabilityStatus?: TherapistAvailabilityStatus;
  availabilityHours?: string;
  nextAvailableSlot?: string;
  phoneVerified?: boolean;
  contactPhone?: string | null;
  whatsappDigits?: string | null;
  whatsappOptIn?: boolean;
}

export interface TherapistDirectoryTotals {
  totalRegistered: number;
  approvedCount: number;
  availableNowCount: number;
  busyCount: number;
  offlineCount: number;
  pendingVerificationCount: number;
}

export interface TherapistConnectionRecord {
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

export interface TherapistInvitationRecord {
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

export interface PermissionGrantRecord {
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

export interface PermissionHistoryEntry {
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

export interface SubstanceConcernRecord {
  id: string;
  userId?: string;
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

export interface TherapistAssignmentRecord {
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

export interface SharedReportRecordClient {
  id: string;
  version?: number;
  clientId: string;
  clientName: string;
  therapistId: string;
  therapistName: string;
  title: string;
  dateRange: { from?: string; to?: string };
  sectionsIncluded: string[];
  sourceManifest?: Record<string, { source: 'user' | 'validated_screening' | 'clinician' | 'ai_draft'; recordedAt: string }>;
  payload: Record<string, unknown>;
  deliveredAt: string;
  viewedAt?: string;
  revokedAt?: string;
  status: 'delivered' | 'viewed' | 'revoked';
}

export interface WeeklyProgressSubmissionClient {
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

export interface SecureMessageClient {
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

export interface AppointmentNoteClient {
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

export interface VerifiedSupportServiceRecord {
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

export type UnifiedDirectoryCategory =
  | 'rehabilitation'
  | 'hospital_emergency'
  | 'qualified_professional'
  | 'community_programme'
  | 'education_skills';

export interface UnifiedDirectoryItem {
  id: string;
  category: UnifiedDirectoryCategory;
  categoryLabel?: string;
  name: string;
  district: string;
  address: string;
  phone?: string | null;
  hours: string;
  description?: string;
  services?: string[];
  isGovt?: boolean;
  coordinates: { lat: number; lng: number };
  verifiedStatus?: string;
  sourceLabel?: string;
  officialUrl?: string;
  officialSourceUrl?: string;
  availabilityStatus?: string;
  lastVerified?: string;
}

export interface PersonalizedSupportPlanRecord {
  id: string;
  userId?: string;
  selectedPaths: string[];
  pathwayReasons: { pathId: string; label: string; whyShown: string }[];
  objectives: string[];
  approaches: string[];
  supportNeeds?: string[];
  interventions?: string[];
  educationalActivities: {
    id: string;
    category?: string;
    title: string;
    reason?: string;
    source: 'self_guided' | 'clinician_assigned';
    status: 'active' | 'paused' | 'completed' | 'discontinued';
    notes?: string;
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

export interface AuditLogClient {
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

export type ClinicalNoteTypeClient =
  | 'session'
  | 'follow_up'
  | 'observation'
  | 'assessment'
  | 'care_plan_discussion'
  | 'referral'
  | 'safeguarding';

export interface TherapistClinicalNoteClient {
  id: string;
  clientId: string;
  therapistId: string;
  therapistName: string;
  modifiedByName?: string;
  noteType: ClinicalNoteTypeClient;
  title: string;
  content: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CarePlanRevisionClient {
  id: string;
  userId: string;
  version: number;
  changedById: string;
  changedByName: string;
  changedByRole: 'therapist' | 'user';
  summary: string;
  snapshot: PersonalizedSupportPlanRecord;
  createdAt: string;
}

export type ReferralCategoryClient =
  | 'mental_health'
  | 'de_addiction'
  | 'medical'
  | 'rehab'
  | 'family_support'
  | 'emergency';

export interface TherapistReferralClient {
  id: string;
  clientId: string;
  therapistId: string;
  therapistName: string;
  urgency: 'routine' | 'priority' | 'urgent_escalation';
  referralCategory?: ReferralCategoryClient;
  referralDate?: string;
  serviceName: string;
  reason: string;
  status: 'recommended' | 'scheduled' | 'completed' | 'declined';
  followUpNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityIdeaClient {
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

export interface MotivationSessionState {
  id: string;
  currentStepIndex: number;
  paused: boolean;
  updatedAt: string;
  entries: Record<string, { userText: string; aiReflection?: string }>;
}

export type CarePlanProposalStatus =
  | 'proposed'
  | 'user_reviewed'
  | 'acknowledged'
  | 'agreed'
  | 'active'
  | 'declined';

export interface CarePlanProposalClient {
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

export interface TherapistAttentionItem {
  userId: string;
  name: string;
  username: string;
  district: string;
  priorityLevel: 'urgent' | 'follow_up_due' | 'needs_review' | 'routine';
  attentionScore: number;
  reasons: string[];
  unreadMessagesCount: number;
  unreviewedReportsCount: number;
  unreviewedLogsCount: number;
  overdueFollowUpsCount: number;
  missingInfoFlags: string[];
  lastActivityDate: string | null;
}

export interface CompactAiRecommendationBar {
  headline: string;
  detectedChanges: string[];
  missingInfo: string[];
  overdueFollowUps: string[];
  possibleConcern: string | null;
  suggestedActionForClinician: string;
  reasoning: string;
  requiresHumanApproval: boolean;
}

export interface AggregatedCommunityTrends {
  kAnonymityMinCohort: number;
  verifiedProgrammesCount: number;
  totalEvaluationsCount: number | null;
  evaluationsSuppressed: boolean;
  preAvgScorePct: number | null;
  postAvgScorePct: number | null;
  participationByDistrict: Array<{
    district: string;
    verifiedProgrammesCount: number;
    totalRegistrations: number | null;
    suppressedForPrivacy: boolean;
    suppressionNote: string | null;
  }>;
  programmeOutcomes: Array<{
    programmeId: string;
    title: string;
    district: string;
    type: string;
    registeredCount: number | null;
    registrationsSuppressed: boolean;
    evaluationsCount: number | null;
    outcomesSuppressed: boolean;
    preAvgPct: number | null;
    postAvgPct: number | null;
    privacyNotice: string | null;
  }>;
  safeBarriers: Record<string, number>;
  suppressedBarrierTopicsCount: number;
  uncoveredDistricts: Array<{
    district: string;
    verifiedServicesCount: number;
    recommendedFocus: string;
  }>;
  pastOutcomesSummary: string;
}

export type AiChatRole = UserRole | 'home';

export interface AiChatContextRef {
  area?: string;
  topicTitle?: string;
  snippet?: string;
}

export interface AiChatAction {
  label: string;
  role: UserRole;
  tab: string;
}

export interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  contextRef?: AiChatContextRef;
  followUpSuggestions?: string[];
  suggestedAction?: AiChatAction | null;
  needsEmergencyHelp?: boolean;
  source?: 'gemini' | 'fallback';
}

export interface AiChatSession {
  id: string;
  title: string;
  role: AiChatRole;
  createdAt: string;
  updatedAt: string;
  messages: AiChatMessage[];
}

export interface PersonalizationProfile {
  name: string;
  ageRange?: string;
  primaryReason?: string;
  preferredRhythm?: string;
  district?: string;
  recentMood?: string;
  topGoal?: string;
  nextLessonTitle?: string;
  nextActionLabel: string;
  nextActionRole: UserRole;
  nextActionTab: string;
  tailoredTip: string;
  tailoredTipMl: string;
  statsSummary: string;
}

// ==========================================
// ROLE 01: RECOVERY INTELLIGENCE, OPPORTUNITIES & PASSPORT
// ==========================================
export type RecoveryReportPeriod = 'weekly' | 'monthly';

export interface RecoveryReportRecord {
  id: string;
  period: RecoveryReportPeriod;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  source: 'gemini' | 'fallback';
  summary: string;
  strengths: string[];
  triggerPatterns: string[];
  routineAndSleepNote: string;
  gentleNextSteps: string[];
  careStatusNote: string;
  metricsSnapshot: {
    logsCount: number;
    completedActivitiesCount: number;
    avgCravingIntensity: number | null;
    avgSleepHours: number | null;
    steadyRoutineDays: number;
  };
}

export type OpportunitySector =
  | 'tech_digital'
  | 'manufacturing_ev'
  | 'agriculture_agritech'
  | 'retail_logistics'
  | 'hospitality_tourism'
  | 'allied_health'
  | 'education_training'
  | 'skilled_trades'
  | 'creative_crafts'
  | 'entrepreneurship';

export interface OpportunityProfile {
  educationLevel: string;
  currentSkills: string[];
  preferredSectors: OpportunitySector[];
  district: string;
  workPreference: 'full_time' | 'part_time' | 'apprenticeship' | 'self_employed' | 'training_first';
  careerObjective: string;
  availabilityNote?: string;
  resumeHeadline?: string;
  resumeSummary?: string;
  resumeExperience?: string[];
  updatedAt: string;
}

export interface OpportunityCatalogItem {
  id: string;
  title: string;
  titleMl: string;
  provider: string;
  type: 'training' | 'apprenticeship' | 'employment_portal' | 'micro_enterprise' | 'scholarship_course';
  sectors: OpportunitySector[];
  skillsTargeted: string[];
  eligibility: string;
  durationOrFormat: string;
  keralaSupportNote: string;
  sourceUrl: string;
  lastVerified: string;
  disclaimer: string;
}

export interface SavedOpportunityRecord {
  opportunityId: string;
  savedAt: string;
  personalNote?: string;
}

export interface OpportunityApplication {
  id: string;
  opportunityId?: string;
  title: string;
  organization: string;
  sector: OpportunitySector;
  status: 'saved' | 'applied' | 'interview_scheduled' | 'accepted' | 'completed';
  appliedDate?: string;
  interviewDate?: string;
  interviewTime?: string;
  deadlineDate?: string;
  notes?: string;
  linkedCalendarEventId?: string;
  updatedAt: string;
}

export type RecoveryPassportSectionKey =
  | 'acquiredSkills'
  | 'completedTraining'
  | 'qualifications'
  | 'achievements'
  | 'workExperience'
  | 'personalGoals'
  | 'certifications';

export interface RecoveryPassportItem {
  id: string;
  section: RecoveryPassportSectionKey;
  title: string;
  subtitle?: string;
  dateLabel?: string;
  shareWithProviders: boolean;
}

export interface RecoveryPassport {
  headline: string;
  publicBio: string;
  sectionConsent: Record<RecoveryPassportSectionKey, boolean>;
  items: RecoveryPassportItem[];
  updatedAt: string;
}

export interface PersonalDevTrack {
  id: string;
  title: string;
  titleMl: string;
  summary: string;
  steps: { id: string; label: string; actionHint: string }[];
}

export interface PersonalDevTrackProgress {
  trackId: string;
  completedStepIds: string[];
  personalNote?: string;
  updatedAt: string;
}

