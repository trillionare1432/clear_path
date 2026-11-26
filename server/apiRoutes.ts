import crypto from 'crypto';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type {
  AccountRole,
  CarePlanProposalRecord,
  CarePlanProposalStatus,
  CarePlanRevisionRecord,
  ClearPathDatabase,
  ClinicalNoteType,
  CommunityIdeaRecord,
  PermissionCategory,
  ProfessionalCategory,
  ReferralCategory,
  Role1AssessmentRecord,
  Role1CalendarEventRecord,
  Role1DailyLogRecord,
  Role1GoalRecord,
  ServerUser,
  TherapistAccessCode,
  TherapistAvailabilityStatus,
  TherapistClinicalNote,
  TherapistReferralRecord,
  TherapistWorkScope,
  VerificationStatus,
} from './store.ts';
import {
  ALL_PERMISSION_CATEGORIES,
  appendAuditLog,
  buildDefaultAppControls,
  buildDefaultWorkScope,
  decryptClinicalText,
  encryptClinicalText,
  getActivePermissionGrantForClient,
  hashPassword,
  verifyPassword,
  generateToken,
  hasClientPermissionCategory,
  isAuthorizedTherapistForClient,
  loadDb,
  makeId,
  sanitizePublicUser,
  saveDb,
} from './store.ts';
import {
  CLINICAL_SUBSTANCE_CATALOGUE_VERSION,
  CLINICAL_SUBSTANCE_ENTRIES,
  matchCustomSubstanceDescription,
} from './substanceRef.ts';
import {
  COMMUNITY_RISK_PROTECTIVE_FACTORS,
  EVIDENCE_CATEGORY_META,
  KERALA_DISTRICT_INTELLIGENCE_PROFILES,
  PREVENTION_EVALUATION_CRITERIA,
  SUBSTANCE_INTELLIGENCE_METRICS,
} from '../src/constants/communityIntelligenceData.ts';
import { VERIFIED_OPPORTUNITY_CATALOG } from '../src/constants/opportunityCatalog.ts';
import {
  buildConsentedPassportExport,
  matchOpportunitiesAndSkillGaps,
} from '../src/utils/recoveryIntelligence.ts';
import type {
  OpportunityApplication,
  OpportunityProfile,
  PersonalDevTrackProgress,
  RecoveryPassport,
  RecoveryReportRecord,
  SavedOpportunityRecord,
} from '../src/types/index.ts';

const RESTRICTED_THERAPIST_UNLOCK_CODE = 'iamtherapist';
const ADMIN_QUICK_ACCESS_CODES = ['i am admin', 'iamadmin'];

function timingSafeEqualStrings(aRaw: string, bRaw: string): boolean {
  const a = Buffer.from(aRaw, 'utf8');
  const b = Buffer.from(bRaw, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function isExactRestrictedTherapistCode(raw: unknown): boolean {
  if (typeof raw !== 'string') return false;
  return timingSafeEqualStrings(raw, RESTRICTED_THERAPIST_UNLOCK_CODE);
}

function findActiveCustomCodeForTherapist(
  therapist: ServerUser,
  rawCode: unknown
): TherapistAccessCode | null {
  if (typeof rawCode !== 'string') return null;
  const trimmed = rawCode.trim();
  if (trimmed.length < 4) return null;
  return (
    (therapist.customAccessCodes || []).find(
      c => c.active && timingSafeEqualStrings(c.code.trim(), trimmed)
    ) || null
  );
}

function countActivePatientsForTherapist(db: ClearPathDatabase, therapistId: string): number {
  const uniqueClients = new Set(
    db.connections
      .filter(c => c.therapistId === therapistId && c.status === 'accepted')
      .map(c => c.clientId)
  );
  return uniqueClients.size;
}

function isAdminQuickAccessCode(raw: unknown): boolean {
  if (typeof raw !== 'string') return false;
  const normalized = raw.trim().replace(/\s+/g, ' ').toLowerCase();
  return ADMIN_QUICK_ACCESS_CODES.includes(normalized);
}

function recordActorAudit(
  db: ReturnType<typeof loadDb>,
  actor: Pick<ServerUser, 'id' | 'role' | 'username' | 'name'>,
  action: string,
  targetType: string,
  targetId: string,
  section: string,
  detail: string
) {
  return appendAuditLog(db, {
    actorId: actor.id,
    actorRole: actor.role,
    actorUsername: actor.username,
    actorName: actor.name,
    section,
    action,
    targetType,
    targetId,
    detail,
  });
}

function isStarterSampleClientId(userId: string): boolean {
  return userId.startsWith('cli_arjun_') || userId.startsWith('cli_meera_');
}

interface AuthedRequest extends Request {
  authUser?: ServerUser;
  authToken?: string;
}

const VALID_PROFESSIONAL_CATEGORIES: ProfessionalCategory[] = [
  'psychiatrist',
  'clinical_psychologist',
  'medical_practitioner',
  'psychiatric_social_worker',
  'qualified_counsellor',
  'other',
];

const VALID_VERIFICATION_STATUSES: VerificationStatus[] = [
  'registration_incomplete',
  'submitted',
  'pending_verification',
  'approved',
  'rejected',
  'suspended',
];

function sanitizePermissionCategories(raw: unknown): PermissionCategory[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set<string>(ALL_PERMISSION_CATEGORIES);
  return Array.from(new Set(raw.map(String).filter(c => allowed.has(c)))) as PermissionCategory[];
}

function expirePendingInvitations(db: ReturnType<typeof loadDb>) {
  const now = Date.now();
  db.invitations.forEach(inv => {
    if (inv.status === 'pending' && new Date(inv.expiresAt).getTime() <= now) {
      inv.status = 'expired';
    }
  });
}

async function withGeminiTimeout<T>(promise: Promise<T>, ms = 6000): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Gemini request timed out after ${ms}ms`)), ms)
    ),
  ]);
}

function seedTherapistStarterClientsIfEmpty(
  db: ReturnType<typeof loadDb>,
  therapist: ServerUser
) {
  const existingAccepted = db.connections.filter(
    c => c.therapistId === therapist.id && c.status === 'accepted'
  );
  if (existingAccepted.length > 0) return;

  const now = new Date().toISOString();
  const todayISO = now.split('T')[0];
  const suffix = therapist.id.replace(/[^a-zA-Z0-9]/g, '').slice(-6);

  const client1Id = `cli_arjun_${suffix}`;
  const client2Id = `cli_meera_${suffix}`;

  if (!db.users.some(u => u.id === client1Id)) {
    db.users.push({
      id: client1Id,
      username: `arjun_care_${suffix.toLowerCase()}`,
      name: 'Arjun Nair',
      email: 'arjun.nair@example.org',
      passwordHash: hashPassword('SampleClient!2026'),
      role: 'user',
      verificationStatus: 'approved',
      ageRange: 'young_adult',
      district: 'Ernakulam',
      createdAt: now,
    });
  }

  if (!db.users.some(u => u.id === client2Id)) {
    db.users.push({
      id: client2Id,
      username: `meera_care_${suffix.toLowerCase()}`,
      name: 'Meera Krishnan',
      email: 'meera.k@example.org',
      passwordHash: hashPassword('SampleClient!2026'),
      role: 'user',
      verificationStatus: 'approved',
      ageRange: 'adult',
      district: 'Thrissur',
      createdAt: now,
    });
  }

  const conn1Id = makeId('conn');
  const conn2Id = makeId('conn');

  db.connections.push(
    {
      id: conn1Id,
      clientId: client1Id,
      clientName: 'Arjun Nair',
      therapistId: therapist.id,
      therapistName: therapist.name,
      status: 'accepted',
      initiatedBy: 'user',
      consentGrantedAt: now,
      createdAt: now,
    },
    {
      id: conn2Id,
      clientId: client2Id,
      clientName: 'Meera Krishnan',
      therapistId: therapist.id,
      therapistName: therapist.name,
      status: 'accepted',
      initiatedBy: 'therapist',
      consentGrantedAt: now,
      createdAt: now,
    }
  );

  db.permissionGrants.unshift(
    {
      id: makeId('perm'),
      connectionId: conn1Id,
      clientId: client1Id,
      clientName: 'Arjun Nair',
      therapistId: therapist.id,
      therapistName: therapist.name,
      categories: ALL_PERMISSION_CATEGORIES,
      accessMode: 'continuing',
      purpose: 'Collaborative CBT & evening trigger stabilization',
      allowWeeklyUpdates: true,
      allowSelectedActivities: true,
      allowBidirectionalFeedback: true,
      authorizedAt: now,
      status: 'active',
    },
    {
      id: makeId('perm'),
      connectionId: conn2Id,
      clientId: client2Id,
      clientName: 'Meera Krishnan',
      therapistId: therapist.id,
      therapistName: therapist.name,
      categories: ['background', 'substances', 'goals', 'assignments', 'weekly_reports', 'appointments'],
      accessMode: 'continuing',
      purpose: 'Sleep medication taper monitoring & routine rebuilding',
      allowWeeklyUpdates: true,
      allowSelectedActivities: true,
      allowBidirectionalFeedback: true,
      authorizedAt: now,
      status: 'active',
    }
  );

  db.substanceConcerns.unshift(
    {
      id: makeId('subc'),
      userId: client1Id,
      catalogueId: 'sub_1',
      catalogueNumber: 1,
      name: 'Alcohol (Beer, Wine, Spirits, Toddy / Local Liquor)',
      parentCategory: 'Alcohol, Nicotine & Cannabis',
      isCustom: false,
      verificationStatus: 'catalogue',
      isMedication: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: makeId('subc'),
      userId: client1Id,
      catalogueId: 'custom',
      name: 'Evening calm herbal mix packet',
      isCustom: true,
      customOriginalText: 'Evening calm herbal mix packet',
      customExplanation: 'Bought from local shop; unsure of exact ingredients and wants to verify in session.',
      verificationStatus: 'unverified',
      isMedication: false,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: makeId('subc'),
      userId: client2Id,
      catalogueId: 'sub_17',
      catalogueNumber: 17,
      name: 'Benzodiazepines / Anti-Anxiety Tablets (e.g., Alprazolam, Diazepam)',
      parentCategory: 'Sedatives & Sleep Medications',
      isCustom: false,
      verificationStatus: 'catalogue',
      isMedication: true,
      prescriptionDetails: {
        prescribedByProfessional: 'yes',
        concernNature: 'as_prescribed',
        discussingWithClinician: 'yes',
      },
      createdAt: now,
      updatedAt: now,
    }
  );

  db.supportPlans.unshift(
    {
      id: makeId('splan'),
      userId: client1Id,
      selectedPaths: ['guided_cbt', 'cognitive_reset', 'weekly_review'],
      pathwayReasons: [],
      objectives: ['Keep evening phone check-in steady after 7 PM', 'Practice 2-minute Urge Wave Rider before dinner'],
      approaches: ['Trigger Mapping', 'Breath Cadence Reset'],
      educationalActivities: [],
      userDefinedActivities: [],
      nextSteps: ['Complete daily log voice or text check-in for 5 evenings'],
      reviewDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      updatedAt: now,
    },
    {
      id: makeId('splan'),
      userId: client2Id,
      selectedPaths: ['sleep_hygiene', 'prescription_tracking'],
      pathwayReasons: [],
      objectives: ['Consistent 10:30 PM wind-down schedule', 'Track morning energy clarity'],
      approaches: ['Sleep Routine Anchor', 'Weekly Check-In'],
      educationalActivities: [],
      userDefinedActivities: [],
      nextSteps: ['Dim screens 30 mins before sleep'],
      reviewDate: new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0],
      updatedAt: now,
    }
  );

  db.assignments.unshift(
    {
      id: makeId('assign'),
      clientId: client1Id,
      therapistId: therapist.id,
      therapistName: therapist.name,
      type: 'cbt_exercise',
      title: 'Evening Trigger Mapping (5-Min Log)',
      purpose: 'Notice what happens right before 7 PM stress spikes without self-judgment.',
      instructions: 'Record 1 evening cue in Daily Log (voice or text) and pick one 2-minute Cognitive Lab reset.',
      startDate: todayISO,
      dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
      status: 'completed',
      clientReflection: 'Taking an evening walk after college really lowered the craving wave.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: makeId('assign'),
      clientId: client2Id,
      therapistId: therapist.id,
      therapistName: therapist.name,
      type: 'weekly_plan',
      title: 'Screen-Free Sleep Wind-Down',
      purpose: 'Protect restorative sleep rhythm alongside prescribed care.',
      instructions: 'Dim bright phone screens 30 minutes before bedtime on 4 nights this week.',
      startDate: todayISO,
      status: 'in_progress',
      createdAt: now,
      updatedAt: now,
    }
  );

  db.weeklyProgress.unshift({
    id: makeId('wp'),
    clientId: client1Id,
    clientName: 'Arjun Nair',
    therapistId: therapist.id,
    weekStarting: todayISO,
    completedActivities: ['Morning walk', 'Mindful breathing', 'Evening Trigger Mapping'],
    goalsWorkedOn: ['Steady evening routine'],
    difficulties: 'Social pressure around weekend hangout spots felt challenging on Friday.',
    whatHelped: 'Using the pre-planned 5-second exit line and calling a friend.',
    discussionTopics: 'Weekend social triggers & herbal calm packet verification',
    questionsForTherapist: 'Can we review the herbal calm packet ingredients in our next session?',
    createdAt: now,
  });

  db.reports.unshift({
    id: makeId('rep'),
    version: 1,
    clientId: client1Id,
    clientName: 'Arjun Nair',
    therapistId: therapist.id,
    therapistName: therapist.name,
    title: 'Initial Therapy Support Summary',
    dateRange: { from: todayISO, to: todayISO },
    sectionsIncluded: ['substances', 'goals', 'support_plan'],
    sourceManifest: {
      substances: { source: 'user', recordedAt: now },
      support_plan: { source: 'user', recordedAt: now },
    },
    payload: {
      goals: ['Steady 7 PM routine', 'Open discussion on evening herbal sachet'],
      substances: ['Alcohol (Catalogue #1)', 'Evening calm herbal mix packet (Unverified — awaiting review)'],
    },
    deliveredAt: now,
    status: 'delivered',
  });

  db.appointmentNotes.unshift({
    id: makeId('appt'),
    clientId: client1Id,
    therapistId: therapist.id,
    therapistName: therapist.name,
    appointmentDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    appointmentTime: '11:00',
    topicsToDiscuss: ['Weekend social pressure coping', 'Review herbal sachet note'],
    clientQuestions: ['Best calm response when peers offer drinks?'],
    noteText: 'Pre-session clinical preparation check-in scheduled.',
    followUpReminderDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    status: 'upcoming',
    createdAt: now,
    updatedAt: now,
  });

  db.messages.push({
    id: makeId('msg'),
    connectionId: conn2Id,
    clientId: client2Id,
    therapistId: therapist.id,
    senderId: client2Id,
    senderRole: 'user',
    senderName: 'Meera Krishnan',
    text: 'Hello Doctor, sleep was much steadier on Tuesday and Wednesday this week. Looking forward to Thursday check-in.',
    createdAt: now,
  });
}

export interface RealtimeEmitOptions {
  event: string;
  payload?: Record<string, unknown>;
  targetUserIds?: string[];
  broadcastAll?: boolean;
}

export function createClearPathApiRouter(
  getGeminiClient: () => GoogleGenAI | null,
  onRealtimeEmit?: (options: RealtimeEmitOptions) => void
) {
  const router = express.Router();

  interface SseSubscriber {
    id: string;
    userId: string;
    role: AccountRole;
    res: Response;
  }
  const sseSubscribers = new Set<SseSubscriber>();

  const emitRealtimeEvent = (options: RealtimeEmitOptions) => {
    const serialized = JSON.stringify({
      event: options.event,
      timestamp: new Date().toISOString(),
      ...(options.payload || {}),
    });
    const targetSet = options.targetUserIds ? new Set(options.targetUserIds.filter(Boolean)) : null;
    for (const sub of sseSubscribers) {
      if (options.broadcastAll || (targetSet && targetSet.has(sub.userId))) {
        try {
          sub.res.write(`event: ${options.event}\ndata: ${serialized}\n\n`);
        } catch {
          sseSubscribers.delete(sub);
        }
      }
    }
    try {
      onRealtimeEmit?.(options);
    } catch {
      // Never break API request on WS fanout failure
    }
  };

  const emitClientChangeToCareTeam = (
    db: ClearPathDatabase,
    clientId: string,
    event: string,
    payload: Record<string, unknown> = {}
  ) => {
    const connectedTherapists = db.connections
      .filter(c => c.clientId === clientId && c.status === 'accepted')
      .map(c => c.therapistId);
    emitRealtimeEvent({
      event,
      payload: { clientId, ...payload },
      targetUserIds: [clientId, ...connectedTherapists],
    });
  };

  const extractToken = (req: Request): string | null => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7).trim();
    }
    const headerToken = req.headers['x-clearpath-token'];
    if (typeof headerToken === 'string' && headerToken.trim()) {
      return headerToken.trim();
    }
    if (typeof req.query?.token === 'string' && req.query.token.trim()) {
      return req.query.token.trim();
    }
    return null;
  };

  const optionalAuth = (req: AuthedRequest, _res: Response, next: NextFunction) => {
    const token = extractToken(req);
    if (!token) return next();
    const db = loadDb();
    const session = db.sessions.find(s => s.token === token);
    if (session && new Date(session.expiresAt).getTime() > Date.now()) {
      const user = db.users.find(u => u.id === session.userId);
      if (user) {
        req.authUser = user;
        req.authToken = token;
      }
    }
    next();
  };

  const requireAuth = (req: AuthedRequest, res: Response, next: NextFunction) => {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }
    const db = loadDb();
    const session = db.sessions.find(s => s.token === token);
    if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
      return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
    }
    const user = db.users.find(u => u.id === session.userId);
    if (!user) {
      return res.status(401).json({ error: 'User account no longer exists.' });
    }
    req.authUser = user;
    req.authToken = token;
    next();
  };

  const requireRole = (roles: AccountRole[]) => (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.authUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (!roles.includes(req.authUser.role)) {
      const db = loadDb();
      appendAuditLog(db, {
        actorId: req.authUser.id,
        actorRole: req.authUser.role,
        action: 'UNAUTHORIZED_ROLE_ACCESS',
        targetType: 'route',
        targetId: req.originalUrl,
        detail: `Denied role ${req.authUser.role} access to ${req.originalUrl}`,
      });
      saveDb(db);
      return res.status(403).json({ error: 'Forbidden: insufficient role permissions.' });
    }
    next();
  };

  const requireApprovedTherapist = (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.authUser) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    if (req.authUser.role !== 'therapist' || req.authUser.verificationStatus !== 'approved') {
      const db = loadDb();
      appendAuditLog(db, {
        actorId: req.authUser.id,
        actorRole: req.authUser.role,
        action: 'UNVERIFIED_THERAPIST_ACCESS_BLOCKED',
        targetType: 'therapist_portal',
        targetId: req.originalUrl,
        detail: `Blocked unverified or non-therapist access (${req.authUser.verificationStatus})`,
      });
      saveDb(db);
      return res.status(403).json({
        error: 'Therapist verification and administrative approval are required before accessing client records.',
        verificationStatus: req.authUser.verificationStatus,
      });
    }
    next();
  };

  // =========================================================
  // 1. AUTHENTICATION & PROFESSIONAL DIRECTORY
  // =========================================================
  router.post('/auth/register', (req: Request, res: Response) => {
    const username = String(req.body?.username || '').trim().toLowerCase();
    const name = String(req.body?.name || '').trim();
    const password = String(req.body?.password || '');
    const email = req.body?.email ? String(req.body.email).trim() : undefined;
    const requestedRole = String(req.body?.role || 'user').trim();

    if (!username || username.length < 3 || !name || password.length < 6) {
      return res.status(400).json({
        error: 'Username (min 3 chars), full name, and password (min 6 chars) are required.',
      });
    }

    // Security guarantee: nobody can self-register as Platform Admin
    if (requestedRole === 'admin') {
      return res.status(403).json({ error: 'Administrator accounts cannot be self-registered.' });
    }
    const role: AccountRole =
      requestedRole === 'therapist'
        ? 'therapist'
        : requestedRole === 'community'
        ? 'community'
        : 'user';

    let verificationStatus: VerificationStatus = 'approved';
    let professionalCategory: ProfessionalCategory | undefined;
    const qualifications = req.body?.qualifications ? String(req.body.qualifications).trim() : undefined;
    const licenseNumber = req.body?.licenseNumber ? String(req.body.licenseNumber).trim() : undefined;
    const institution = req.body?.institution ? String(req.body.institution).trim() : undefined;
    const areaOfPractice = req.body?.areaOfPractice ? String(req.body.areaOfPractice).trim() : undefined;
    const specialization = req.body?.specialization ? String(req.body.specialization).trim() : undefined;
    const district = req.body?.district ? String(req.body.district).trim() : undefined;
    const contactPhone = req.body?.contactPhone ? String(req.body.contactPhone).trim() : undefined;
    const supportingDocRef = req.body?.supportingDocRef ? String(req.body.supportingDocRef).trim() : undefined;

    if (role === 'therapist') {
      const rawCat = String(req.body?.professionalCategory || 'qualified_counsellor').trim() as ProfessionalCategory;
      professionalCategory = VALID_PROFESSIONAL_CATEGORIES.includes(rawCat) ? rawCat : 'other';

      // Category-specific licensing vs registration completeness check
      const requiresRegNumber =
        professionalCategory === 'psychiatrist' ||
        professionalCategory === 'clinical_psychologist' ||
        professionalCategory === 'medical_practitioner';

      if (Boolean(req.body?.saveDraft)) {
        verificationStatus = 'registration_incomplete';
      } else {
        if (!specialization && !areaOfPractice) {
          return res.status(400).json({
            error: 'Therapist accounts require an area of practice or specialization.',
          });
        }
        if (requiresRegNumber && !licenseNumber) {
          return res.status(400).json({
            error: 'Medical & clinical psychology practitioners must provide their council registration / license number (NMC / RCI / State Council).',
          });
        }
        if (!licenseNumber && !qualifications) {
          return res.status(400).json({
            error: 'Please provide qualifications and registration/license credentials.',
          });
        }
        verificationStatus =
          supportingDocRef && licenseNumber && qualifications
            ? 'pending_verification'
            : licenseNumber || specialization
            ? 'submitted'
            : 'registration_incomplete';
      }

      if (typeof req.body?.quickCode === 'string' && req.body.quickCode.length > 0) {
        if (!isExactRestrictedTherapistCode(req.body.quickCode)) {
          return res.status(403).json({
            error: 'Invalid restricted therapist verification code. Enter the exact lowercase code without any spaces.',
          });
        }
        verificationStatus = 'approved';
      }
    }

    const db = loadDb();
    if (db.appControls && db.appControls.allowNewSignups === false) {
      return res.status(403).json({
        error: 'New sign-ups are currently paused by the Platform Administrator.',
      });
    }
    if (db.users.some(u => u.username === username)) {
      return res.status(409).json({ error: 'An account with this username already exists.' });
    }

    const user: ServerUser = {
      id: makeId(role === 'therapist' ? 'ther' : role === 'community' ? 'comm' : 'usr'),
      username,
      name,
      email,
      contactPhone,
      passwordHash: hashPassword(password),
      role,
      verificationStatus,
      ageRange: req.body?.ageRange ? String(req.body.ageRange) : undefined,
      professionalCategory,
      qualifications,
      licenseNumber,
      institution,
      areaOfPractice: areaOfPractice || specialization,
      specialization: specialization || areaOfPractice,
      district,
      supportingDocRef,
      bio: req.body?.bio ? String(req.body.bio).trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    const token = generateToken();
    db.users.push(user);
    db.sessions.push({
      token,
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    recordActorAudit(
      db,
      user,
      role === 'therapist' ? 'THERAPIST_REGISTERED' : 'USER_REGISTERED',
      'user',
      user.id,
      'Authentication & Registration',
      `Account @${user.username} (${role}) created with status ${user.verificationStatus}`
    );
    saveDb(db);
    emitRealtimeEvent({
      event: 'user:registered',
      payload: { userId: user.id, name: user.name, username: user.username, role: user.role },
      broadcastAll: true,
    });
    if (role === 'therapist' && verificationStatus === 'approved') {
      emitRealtimeEvent({
        event: 'availability:updated',
        payload: { therapistId: user.id, availabilityStatus: user.availabilityStatus || 'available' },
        broadcastAll: true,
      });
    }

    return res.status(201).json({
      token,
      user: sanitizePublicUser(user),
    });
  });

  // Transparently synchronize a locally signed-in Role 1 user profile with the server database (strictly role: 'user')
  router.post('/auth/sync-local-profile', (req: Request, res: Response) => {
    const rawUsername = String(req.body?.username || '').trim().toLowerCase();
    const cleanName = String(req.body?.name || '').trim();
    const profileId = String(req.body?.profileId || '').trim();
    const ageRange = req.body?.ageRange ? String(req.body.ageRange).trim() : undefined;
    const district = req.body?.district ? String(req.body.district).trim() : undefined;

    if (!rawUsername || rawUsername.length < 3 || !cleanName) {
      return res.status(400).json({ error: 'Valid username and display name are required to sync profile.' });
    }

    const db = loadDb();
    const existing = db.users.find(u => u.username.toLowerCase() === rawUsername);
    if (existing) {
      if (existing.role !== 'user') {
        return res.status(403).json({ error: 'Protected accounts must authenticate through dedicated portal.' });
      }
      if (profileId && existing.id !== profileId) {
        return res.status(409).json({ error: 'Account exists on server; sign in with your password to connect this browser.' });
      }
      if (cleanName && existing.name !== cleanName) existing.name = cleanName;
      if (ageRange && !existing.ageRange) existing.ageRange = ageRange;
      if (district && !existing.district) existing.district = district;
      existing.updatedAt = new Date().toISOString();

      const token = generateToken();
      db.sessions.push({
        token,
        userId: existing.id,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      });
      recordActorAudit(
        db,
        existing,
        'USER_SIGNED_IN',
        'session',
        existing.id,
        'Authentication',
        `Signed in as ${existing.name} (@${existing.username}, ${existing.role})`
      );
      saveDb(db);
      return res.json({ token, user: sanitizePublicUser(existing) });
    }

    const now = new Date().toISOString();
    const user: ServerUser = {
      id: profileId && profileId.startsWith('user-') ? profileId : makeId('usr'),
      username: rawUsername,
      name: cleanName,
      passwordHash: hashPassword(makeId('local')),
      role: 'user',
      verificationStatus: 'approved',
      ageRange: ageRange || 'young_adult',
      district: district || undefined,
      createdAt: now,
    };
    const token = generateToken();
    db.users.push(user);
    db.sessions.push({
      token,
      userId: user.id,
      createdAt: now,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    recordActorAudit(
      db,
      user,
      'USER_REGISTERED',
      'user',
      user.id,
      'Authentication & Sync',
      `Synced local profile @${user.username} (${user.name}) into live backend`
    );
    saveDb(db);
    emitRealtimeEvent({
      event: 'user:registered',
      payload: { userId: user.id, name: user.name, username: user.username, role: 'user' },
      broadcastAll: true,
    });
    return res.status(201).json({ token, user: sanitizePublicUser(user) });
  });

  router.post('/auth/login', (req: Request, res: Response) => {
    const username = String(req.body?.username || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const quickCode = typeof req.body?.authorityCode === 'string'
      ? req.body.authorityCode
      : typeof req.body?.quickCode === 'string'
      ? req.body.quickCode
      : '';

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const db = loadDb();
    const user = db.users.find(
      u =>
        u.username.toLowerCase() === username ||
        (u.email && u.email.toLowerCase() === username)
    );
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const matchedCustomCode =
      user.role === 'therapist' && db.appControls?.allowTherapistCustomCodes !== false
        ? findActiveCustomCodeForTherapist(user, quickCode)
        : null;
    if (
      user.role === 'therapist' &&
      (isExactRestrictedTherapistCode(quickCode) || Boolean(matchedCustomCode)) &&
      user.verificationStatus !== 'suspended'
    ) {
      user.verificationStatus = 'approved';
      if (!user.supportingDocRef) user.supportingDocRef = 'RESTRICTED-CODE-VERIFIED';
      user.updatedAt = new Date().toISOString();
    }

    const token = generateToken();
    db.sessions.push({
      token,
      userId: user.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    recordActorAudit(
      db,
      user,
      user.role === 'therapist' ? 'THERAPIST_LOGIN' : 'USER_LOGIN',
      'session',
      user.id,
      'Authentication',
      `Signed in as ${user.name} (@${user.username}, ${user.role})`
    );
    saveDb(db);

    return res.json({
      token,
      user: sanitizePublicUser(user),
    });
  });

  // Streamlined Therapist Sign-In & Authority Access (2-field Name + Quick Access Code, with optional password backwards compatibility)
  router.post('/auth/therapist-access', (req: Request, res: Response) => {
    const rawIdentifier = String(req.body?.username || req.body?.name || '').trim();
    const displayNameInput = String(req.body?.name || '').trim();
    const password = String(req.body?.password || '');
    const rawAuthority =
      typeof req.body?.authorityCode === 'string'
        ? req.body.authorityCode
        : typeof req.body?.quickCode === 'string'
        ? req.body.quickCode
        : typeof req.body?.code === 'string'
        ? req.body.code
        : '';
    const authorityCode = rawAuthority.trim();
    const licenseNumber = req.body?.licenseNumber ? String(req.body.licenseNumber).trim() : undefined;
    const specialization = req.body?.specialization ? String(req.body.specialization).trim() : undefined;
    const district = req.body?.district ? String(req.body.district).trim() : undefined;
    const isQuickUnlockCode = isExactRestrictedTherapistCode(rawAuthority);
    const seedSamplePatients = isQuickUnlockCode
      ? req.body?.seedSamplePatients === true
      : req.body?.seedSamplePatients !== false;

    const cleanUsername = rawIdentifier
      .toLowerCase()
      .replace(/^dr\.?\s*/i, 'dr_')
      .replace(/[^a-z0-9_.-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    if (!rawIdentifier || rawIdentifier.length < 2) {
      return res.status(400).json({ error: 'Please enter your clinician name or username.' });
    }

    const db = loadDb();
    const allowCustomCodes = db.appControls?.allowTherapistCustomCodes !== false;
    const lookupLower = rawIdentifier.toLowerCase();
    let therapist = db.users.find(
      u =>
        u.role === 'therapist' &&
        (u.username.toLowerCase() === cleanUsername ||
          u.username.toLowerCase() === lookupLower ||
          u.name.toLowerCase() === lookupLower ||
          (u.email && u.email.toLowerCase() === lookupLower) ||
          (authorityCode && u.licenseNumber && u.licenseNumber.toLowerCase() === authorityCode.toLowerCase()) ||
          (allowCustomCodes && Boolean(findActiveCustomCodeForTherapist(u, rawAuthority))))
    );

    if (!therapist) {
      // Check if non-therapist user holds that exact username
      const existingNonTherapist = db.users.find(
        u => u.username.toLowerCase() === cleanUsername || u.username.toLowerCase() === lookupLower
      );
      if (existingNonTherapist) {
        return res.status(409).json({
          error: 'This username is registered as a standard user account. Please choose a clinician username.',
        });
      }
      if (!authorityCode || authorityCode.length < 4) {
        return res.status(400).json({
          error: 'New therapist sign-in requires the restricted code (iamtherapist) or clinic quick access code.',
        });
      }
      const formattedName =
        displayNameInput ||
        (rawIdentifier.toLowerCase().startsWith('dr')
          ? rawIdentifier
          : `Dr. ${rawIdentifier.replace(/[_.-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`);
      therapist = {
        id: makeId('ther'),
        username: cleanUsername || lookupLower.replace(/\s+/g, '_'),
        name: formattedName,
        passwordHash: hashPassword(password || makeId('therpwd')),
        role: 'therapist',
        verificationStatus: 'approved',
        professionalCategory: 'clinical_psychologist',
        qualifications: 'M.Phil Clinical Psychology / Certified De-Addiction Specialist',
        licenseNumber: licenseNumber || (isQuickUnlockCode ? 'RESTRICTED-CODE-VERIFIED' : authorityCode.toUpperCase()),
        institution: 'ClearPath Clinical Partner',
        areaOfPractice: specialization || 'Addiction Recovery & Clinical Care',
        specialization: specialization || 'Addiction Recovery & Clinical Care',
        district: district || 'Ernakulam',
        supportingDocRef: isQuickUnlockCode ? 'RESTRICTED-CODE-VERIFIED' : `AUTH-KEY-${authorityCode.toUpperCase()}`,
        bio: 'Authorized ClearPath Clinical Practitioner',
        workScope: buildDefaultWorkScope(),
        createdAt: new Date().toISOString(),
      };
      db.users.push(therapist);
    } else {
      if (therapist.verificationStatus === 'suspended') {
        return res.status(403).json({ error: 'This clinician account has been suspended by an administrator.' });
      }
      const matchedCustomCode = allowCustomCodes
        ? findActiveCustomCodeForTherapist(therapist, rawAuthority)
        : null;
      if (password.length > 0) {
        if (!verifyPassword(password, therapist.passwordHash)) {
          return res.status(401).json({ error: 'Incorrect password for this clinician profile.' });
        }
      } else {
        const matchesExistingAuthority =
          Boolean(matchedCustomCode) ||
          (Boolean(authorityCode) &&
            ((therapist.licenseNumber && therapist.licenseNumber.toLowerCase() === authorityCode.toLowerCase()) ||
              (therapist.supportingDocRef &&
                therapist.supportingDocRef.toLowerCase() === `auth-key-${authorityCode.toLowerCase()}`)));
        if (!isQuickUnlockCode && !matchesExistingAuthority) {
          return res.status(400).json({
            error: 'Please enter your Quick Access Code (e.g. iamtherapist or your custom therapist code) to sign in.',
          });
        }
      }
      // If returning therapist already approved OR provided iamtherapist/valid custom/authority code, keep/grant approval
      if (therapist.verificationStatus !== 'approved') {
        if (!isQuickUnlockCode && !matchedCustomCode && authorityCode.length < 4) {
          return res.status(403).json({
            error: 'Account pending verification. Enter restricted code iamtherapist to unlock immediately.',
          });
        }
        therapist.verificationStatus = 'approved';
        therapist.supportingDocRef = isQuickUnlockCode
          ? 'RESTRICTED-CODE-VERIFIED'
          : matchedCustomCode
          ? `CUSTOM-CODE-${matchedCustomCode.label.slice(0, 20).toUpperCase()}`
          : `AUTH-KEY-${authorityCode.toUpperCase()}`;
      }
      if (!therapist.workScope) {
        therapist.workScope = buildDefaultWorkScope();
      }
      if (displayNameInput) therapist.name = displayNameInput;
      if (licenseNumber) therapist.licenseNumber = licenseNumber;
      if (specialization) {
        therapist.specialization = specialization;
        therapist.areaOfPractice = specialization;
      }
      if (district) therapist.district = district;
      therapist.updatedAt = new Date().toISOString();
    }

    if (seedSamplePatients) {
      seedTherapistStarterClientsIfEmpty(db, therapist);
    }

    const token = generateToken();
    db.sessions.push({
      token,
      userId: therapist.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    recordActorAudit(
      db,
      therapist,
      isQuickUnlockCode ? 'THERAPIST_QUICK_CODE_SIGNIN' : 'THERAPIST_AUTHORITY_ACCESS',
      'session',
      therapist.id,
      'Authentication',
      `Clinician ${therapist.name} (@${therapist.username}) signed into Therapist Dashboard`
    );
    saveDb(db);
    emitRealtimeEvent({
      event: 'availability:updated',
      payload: {
        therapistId: therapist.id,
        availabilityStatus: therapist.availabilityStatus || 'available',
      },
      broadcastAll: true,
    });

    return res.json({
      token,
      user: sanitizePublicUser(therapist),
    });
  });

  // Creator / Platform Admin Quick Access ('I am admin') with optional Admin Name (no password required)
  router.post('/auth/admin-access', (req: Request, res: Response) => {
    const code = req.body?.code ?? req.body?.quickCode ?? '';
    const adminNameInput = String(req.body?.name || '').trim();
    const username = String(req.body?.username || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const db = loadDb();
    let adminUser = db.users.find(u => u.role === 'admin');
    if (!adminUser) {
      return res.status(404).json({ error: 'Platform administrator account is not initialized.' });
    }

    const usedQuickCode = isAdminQuickAccessCode(code);
    const usedCredentials =
      Boolean(username && password) &&
      adminUser.username.toLowerCase() === username &&
      verifyPassword(password, adminUser.passwordHash);

    if (!usedQuickCode && !usedCredentials) {
      return res.status(403).json({
        error: 'Invalid Admin quick access code.',
      });
    }

    if (usedQuickCode && adminNameInput.length >= 2) {
      adminUser.name = adminNameInput;
      adminUser.updatedAt = new Date().toISOString();
    }

    const token = generateToken();
    db.sessions.push({
      token,
      userId: adminUser.id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    recordActorAudit(
      db,
      adminUser,
      usedQuickCode ? 'ADMIN_QUICK_ACCESS' : 'ADMIN_LOGIN',
      'session',
      adminUser.id,
      'Authentication',
      `Platform Admin ${adminUser.name} (@${adminUser.username}) authenticated (${usedQuickCode ? 'quick code' : 'credentials'})`
    );
    saveDb(db);

    return res.json({
      token,
      user: sanitizePublicUser(adminUser),
    });
  });

  // Instant Restricted Therapist Verification Code unlock ('iamtherapist', exact lowercase, zero spaces)
  router.post(
    '/auth/therapist-unlock',
    requireAuth,
    requireRole(['therapist']),
    (req: AuthedRequest, res: Response) => {
      const db = loadDb();
      const user = db.users.find(u => u.id === req.authUser!.id);
      if (!user) {
        return res.status(404).json({ error: 'Therapist account not found.' });
      }
      if (user.verificationStatus === 'suspended') {
        return res.status(403).json({
          error: 'Suspended accounts cannot self-unlock and must be reviewed by an administrator.',
        });
      }

      const rawCode = req.body?.code;
      const allowCustomCodes = db.appControls?.allowTherapistCustomCodes !== false;
      const matchedCustom = allowCustomCodes ? findActiveCustomCodeForTherapist(user, rawCode) : null;
      if (!isExactRestrictedTherapistCode(rawCode) && !matchedCustom) {
        appendAuditLog(db, {
          actorId: user.id,
          actorRole: 'therapist',
          action: 'THERAPIST_QUICK_CODE_FAILED',
          targetType: 'user',
          targetId: user.id,
          detail: `Invalid quick verification code attempt for @${user.username}`,
        });
        saveDb(db);
        return res.status(403).json({
          error: 'Invalid verification code. Enter iamtherapist or one of your active custom codes.',
        });
      }

      user.verificationStatus = 'approved';
      if (!user.supportingDocRef) {
        user.supportingDocRef = 'RESTRICTED-CODE-VERIFIED';
      }
      user.updatedAt = new Date().toISOString();
      appendAuditLog(db, {
        actorId: user.id,
        actorRole: 'therapist',
        action: 'THERAPIST_QUICK_CODE_UNLOCKED',
        targetType: 'user',
        targetId: user.id,
        detail: `Clinician @${user.username} verified immediately via restricted therapist code`,
      });
      saveDb(db);

      return res.json({ user: sanitizePublicUser(user) });
    }
  );

  router.post('/auth/logout', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    db.sessions = db.sessions.filter(s => s.token !== req.authToken);
    if (req.authUser) {
      appendAuditLog(db, {
        actorId: req.authUser.id,
        actorRole: req.authUser.role,
        action: 'USER_LOGOUT',
        targetType: 'session',
        targetId: req.authUser.id,
        detail: `Signed out @${req.authUser.username}`,
      });
    }
    saveDb(db);
    res.json({ ok: true });
  });

  router.get('/auth/me', requireAuth, (req: AuthedRequest, res: Response) => {
    res.json({ user: sanitizePublicUser(req.authUser!) });
  });

  // Self-service Role 01 privacy & retention deletion: allows a recovery user to erase their account and personal data
  router.delete('/auth/my-account', requireAuth, requireRole(['user']), (req: AuthedRequest, res: Response) => {
    const userId = req.authUser!.id;
    const db = loadDb();
    db.sessions = db.sessions.filter(s => s.userId !== userId);
    db.connections = db.connections.filter(c => c.clientId !== userId);
    db.invitations = db.invitations.filter(i => i.senderId !== userId && i.recipientUserId !== userId);
    db.permissionGrants = db.permissionGrants.filter(g => g.clientId !== userId);
    db.substanceConcerns = db.substanceConcerns.filter(s => s.userId !== userId);
    db.intakeSessions = db.intakeSessions.filter(s => s.userId !== userId);
    db.supportPlans = db.supportPlans.filter(p => p.userId !== userId);
    db.carePlanRevisions = db.carePlanRevisions.filter(r => r.userId !== userId);
    db.reports = db.reports.filter(r => r.clientId !== userId);
    db.assignments = db.assignments.filter(a => a.clientId !== userId);
    db.weeklyProgress = db.weeklyProgress.filter(w => w.clientId !== userId);
    db.appointmentNotes = db.appointmentNotes.filter(n => n.clientId !== userId);
    db.clinicalNotes = db.clinicalNotes.filter(n => n.clientId !== userId);
    db.therapistReferrals = db.therapistReferrals.filter(r => r.clientId !== userId);
    db.messages = db.messages.filter(m => m.clientId !== userId);
    db.role1DailyLogs = db.role1DailyLogs.filter(l => l.userId !== userId);
    db.role1Goals = db.role1Goals.filter(g => g.userId !== userId);
    db.role1CalendarEvents = db.role1CalendarEvents.filter(e => e.userId !== userId);
    db.role1Assessments = db.role1Assessments.filter(a => a.userId !== userId);
    db.users = db.users.filter(u => u.id !== userId);
    appendAuditLog(db, {
      actorId: userId,
      actorRole: 'user',
      action: 'USER_ERASED_PERSONAL_DATA',
      targetType: 'user',
      targetId: userId,
      detail: 'Role 01 user permanently erased their account and personal recovery records',
    });
    saveDb(db);
    res.json({ ok: true });
  });

  router.patch('/auth/therapist-profile', requireAuth, requireRole(['therapist']), (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const user = db.users.find(u => u.id === req.authUser!.id);
    if (!user) return res.status(404).json({ error: 'Therapist account not found.' });

    if (req.body?.professionalCategory && VALID_PROFESSIONAL_CATEGORIES.includes(req.body.professionalCategory)) {
      user.professionalCategory = req.body.professionalCategory;
    }
    if (typeof req.body?.email === 'string') user.email = req.body.email.trim();
    if (typeof req.body?.contactPhone === 'string') {
      const nextPhone = req.body.contactPhone.trim();
      if (nextPhone !== (user.contactPhone || '')) {
        user.phoneVerified = false;
        user.phoneVerifiedAt = undefined;
      }
      user.contactPhone = nextPhone;
    }
    if (req.body?.verifyPhone === true && user.contactPhone) {
      const digits = user.contactPhone.replace(/\D/g, '');
      if (digits.length < 7) {
        return res.status(400).json({ error: 'Please enter a valid contact phone number (at least 7 digits).' });
      }
      user.phoneVerified = true;
      user.phoneVerifiedAt = new Date().toISOString();
    }
    if (
      req.body?.availabilityStatus === 'available' ||
      req.body?.availabilityStatus === 'busy' ||
      req.body?.availabilityStatus === 'offline'
    ) {
      user.availabilityStatus = req.body.availabilityStatus;
    }
    if (typeof req.body?.availabilityHours === 'string') {
      user.availabilityHours = req.body.availabilityHours.trim();
    }
    if (typeof req.body?.nextAvailableSlot === 'string') {
      user.nextAvailableSlot = req.body.nextAvailableSlot.trim();
    }
    if (typeof req.body?.whatsappOptIn === 'boolean') {
      user.whatsappOptIn = req.body.whatsappOptIn;
    }
    if (typeof req.body?.qualifications === 'string') user.qualifications = req.body.qualifications.trim();
    if (typeof req.body?.licenseNumber === 'string') user.licenseNumber = req.body.licenseNumber.trim();
    if (typeof req.body?.institution === 'string') user.institution = req.body.institution.trim();
    if (typeof req.body?.areaOfPractice === 'string') user.areaOfPractice = req.body.areaOfPractice.trim();
    if (typeof req.body?.specialization === 'string') user.specialization = req.body.specialization.trim();
    if (typeof req.body?.district === 'string') user.district = req.body.district.trim();
    if (typeof req.body?.supportingDocRef === 'string') user.supportingDocRef = req.body.supportingDocRef.trim();
    if (typeof req.body?.bio === 'string') user.bio = req.body.bio.trim();

    if (user.verificationStatus === 'registration_incomplete' || user.verificationStatus === 'rejected') {
      if (user.licenseNumber && (user.specialization || user.areaOfPractice)) {
        user.verificationStatus = user.supportingDocRef ? 'pending_verification' : 'submitted';
      }
    }
    user.updatedAt = new Date().toISOString();
    appendAuditLog(db, {
      actorId: user.id,
      actorRole: 'therapist',
      actorUsername: user.username,
      actorName: user.name,
      section: 'Therapist Profile & Availability',
      action: 'THERAPIST_PROFILE_UPDATED',
      targetType: 'user',
      targetId: user.id,
      detail: `Updated credential profile (${user.verificationStatus}, availability: ${user.availabilityStatus || 'available'})`,
    });
    saveDb(db);
    emitRealtimeEvent({
      event: 'availability:updated',
      payload: {
        therapistId: user.id,
        availabilityStatus: user.availabilityStatus || 'available',
        phoneVerified: Boolean(user.phoneVerified),
      },
      broadcastAll: true,
    });
    return res.json({ user: sanitizePublicUser(user) });
  });

  router.patch('/therapists/availability', requireAuth, requireRole(['therapist']), (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const user = db.users.find(u => u.id === req.authUser!.id);
    if (!user) return res.status(404).json({ error: 'Therapist account not found.' });

    const nextStatus = req.body?.availabilityStatus;
    if (!['available', 'busy', 'offline'].includes(String(nextStatus))) {
      return res.status(400).json({ error: 'availabilityStatus must be available, busy, or offline.' });
    }
    user.availabilityStatus = nextStatus as TherapistAvailabilityStatus;
    if (typeof req.body?.availabilityHours === 'string') {
      user.availabilityHours = req.body.availabilityHours.trim();
    }
    if (typeof req.body?.nextAvailableSlot === 'string') {
      user.nextAvailableSlot = req.body.nextAvailableSlot.trim();
    }
    user.updatedAt = new Date().toISOString();
    recordActorAudit(
      db,
      user,
      'THERAPIST_AVAILABILITY_UPDATED',
      'therapist_availability',
      user.id,
      'Therapist Availability',
      `Set availability status to ${user.availabilityStatus}`
    );
    saveDb(db);
    emitRealtimeEvent({
      event: 'availability:updated',
      payload: {
        therapistId: user.id,
        availabilityStatus: user.availabilityStatus,
        availabilityHours: user.availabilityHours,
        nextAvailableSlot: user.nextAvailableSlot,
      },
      broadcastAll: true,
    });
    return res.json({ user: sanitizePublicUser(user) });
  });

  router.post('/therapists/verify-phone', requireAuth, requireRole(['therapist']), (req: AuthedRequest, res: Response) => {
    const rawPhone = String(req.body?.contactPhone || '').trim();
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) {
      return res.status(400).json({ error: 'Enter a valid phone number with country code (7 to 15 digits).' });
    }
    if (!req.body?.confirmOwnership) {
      return res.status(400).json({ error: 'Confirm clinical ownership of this phone number before verifying.' });
    }
    const db = loadDb();
    const user = db.users.find(u => u.id === req.authUser!.id);
    if (!user) return res.status(404).json({ error: 'Therapist account not found.' });

    user.contactPhone = rawPhone;
    user.phoneVerified = true;
    user.phoneVerifiedAt = new Date().toISOString();
    user.whatsappOptIn = req.body?.whatsappOptIn !== false;
    user.updatedAt = user.phoneVerifiedAt;
    recordActorAudit(
      db,
      user,
      'THERAPIST_PHONE_VERIFIED',
      'user',
      user.id,
      'Therapist Contact Verification',
      `Verified therapist clinical phone (${user.whatsappOptIn ? 'WhatsApp enabled' : 'Call only'})`
    );
    saveDb(db);
    emitRealtimeEvent({
      event: 'availability:updated',
      payload: { therapistId: user.id, phoneVerified: true },
      broadcastAll: true,
    });
    return res.json({ user: sanitizePublicUser(user) });
  });

  // Public directory of ONLY Admin-approved therapists (zero unverified, rejected, or suspended clinicians listed)
  // Returns real server counts and protects therapist raw phone numbers unless verified & requested by an authenticated session.
  router.get('/therapists/directory', optionalAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    if (db.appControls?.allowTherapistDirectDiscovery === false) {
      return res.json({
        therapists: [],
        discoveryPaused: true,
        totals: {
          totalRegistered: db.users.filter(u => u.role === 'therapist').length,
          approvedCount: 0,
          availableNowCount: 0,
          busyCount: 0,
          offlineCount: 0,
          pendingVerificationCount: 0,
        },
      });
    }
    const allTherapists = db.users.filter(u => u.role === 'therapist');
    const approvedUsers = allTherapists.filter(u => u.verificationStatus === 'approved');
    const availableNowCount = approvedUsers.filter(
      u => (u.availabilityStatus || 'available') === 'available'
    ).length;
    const busyCount = approvedUsers.filter(u => u.availabilityStatus === 'busy').length;
    const offlineCount = approvedUsers.filter(u => u.availabilityStatus === 'offline').length;
    const pendingVerificationCount = allTherapists.filter(
      u =>
        u.verificationStatus === 'submitted' ||
        u.verificationStatus === 'pending_verification' ||
        u.verificationStatus === 'pending'
    ).length;

    const requesterId = req.authUser?.id || null;
    const isAuthedUser = Boolean(req.authUser);

    const approved = approvedUsers.map(u => {
      const verifiedPhone = Boolean(u.phoneVerified && u.contactPhone);
      const hasAcceptedConnection = requesterId
        ? db.connections.some(
            c => c.therapistId === u.id && c.clientId === requesterId && c.status === 'accepted'
          )
        : false;
      const canSeePhone = verifiedPhone && (isAuthedUser || hasAcceptedConnection);
      const whatsappReady = verifiedPhone && u.whatsappOptIn !== false;
      const sanitizedDigits = verifiedPhone && u.contactPhone ? u.contactPhone.replace(/\D/g, '') : '';

      return {
        id: u.id,
        name: u.name,
        username: u.username,
        professionalCategory: u.professionalCategory,
        qualifications: u.qualifications,
        institution: u.institution,
        areaOfPractice: u.areaOfPractice || u.specialization || 'Addiction & Behavioural Health',
        specialization: u.specialization || u.areaOfPractice || 'Addiction & Behavioural Health',
        district: u.district || 'Kerala',
        licenseNumber: u.licenseNumber || 'Verified on file',
        bio: u.bio || 'Verified ClearPath partner clinician',
        availabilityStatus: (u.availabilityStatus || 'available') as TherapistAvailabilityStatus,
        availabilityHours: u.availabilityHours || 'Mon–Sat · 9:30 AM – 5:30 PM',
        nextAvailableSlot: u.nextAvailableSlot,
        phoneVerified: verifiedPhone,
        whatsappReady,
        contactPhone: canSeePhone ? u.contactPhone : undefined,
        whatsappDigits: canSeePhone && whatsappReady ? sanitizedDigits : undefined,
      };
    });

    res.json({
      therapists: approved,
      totals: {
        totalRegistered: allTherapists.length,
        approvedCount: approvedUsers.length,
        availableNowCount,
        busyCount,
        offlineCount,
        pendingVerificationCount,
      },
    });
  });

  // =========================================================
  // 1B. THERAPIST CUSTOM ACCESS CODES & PRACTICE AUTONOMY
  // =========================================================
  router.get(
    '/therapists/access-codes',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const db = loadDb();
      const user = db.users.find(u => u.id === req.authUser!.id);
      if (!user) return res.status(404).json({ error: 'Therapist account not found.' });
      res.json({
        accessCodes: user.customAccessCodes || [],
        workScope: user.workScope || buildDefaultWorkScope(),
        allowCustomCodes: db.appControls?.allowTherapistCustomCodes !== false,
      });
    }
  );

  router.post(
    '/therapists/access-codes',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const db = loadDb();
      if (db.appControls?.allowTherapistCustomCodes === false) {
        return res.status(403).json({
          error: 'Custom therapist access codes are currently disabled by Administrator App Controls.',
        });
      }
      const user = db.users.find(u => u.id === req.authUser!.id);
      if (!user) return res.status(404).json({ error: 'Therapist account not found.' });

      const rawCode = String(req.body?.code || '').trim();
      const label = String(req.body?.label || 'Clinic Quick Access').trim().slice(0, 60);
      if (rawCode.length < 4 || rawCode.length > 48 || /\s/.test(rawCode)) {
        return res.status(400).json({
          error: 'Access code must be 4–48 characters with no spaces.',
        });
      }
      if (rawCode.toLowerCase() === RESTRICTED_THERAPIST_UNLOCK_CODE) {
        return res.status(400).json({
          error: 'Please choose a custom code distinct from the built-in quick code.',
        });
      }
      const existing = user.customAccessCodes || [];
      if (existing.some(c => c.code.toLowerCase() === rawCode.toLowerCase())) {
        return res.status(409).json({ error: 'You already added this access code.' });
      }

      const now = new Date().toISOString();
      const created: TherapistAccessCode = {
        id: makeId('tcode'),
        code: rawCode,
        label: label || 'Clinic Quick Access',
        active: true,
        createdAt: now,
        updatedAt: now,
      };
      user.customAccessCodes = [created, ...existing].slice(0, 20);
      user.updatedAt = now;
      const suffix = rawCode.slice(-2);
      recordActorAudit(
        db,
        user,
        'THERAPIST_ADDED_ACCESS_CODE',
        'therapist_code',
        created.id,
        'Therapist Access Codes',
        `Clinician ${user.name} added custom access code "${created.label}" (**${suffix})`
      );
      saveDb(db);
      res.status(201).json({
        accessCode: created,
        accessCodes: user.customAccessCodes,
      });
    }
  );

  router.patch(
    '/therapists/access-codes/:id',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const db = loadDb();
      const user = db.users.find(u => u.id === req.authUser!.id);
      if (!user) return res.status(404).json({ error: 'Therapist account not found.' });

      const item = (user.customAccessCodes || []).find(c => c.id === req.params.id);
      if (!item) return res.status(404).json({ error: 'Custom access code not found.' });

      if (typeof req.body?.label === 'string' && req.body.label.trim()) {
        item.label = req.body.label.trim().slice(0, 60);
      }
      if (typeof req.body?.code === 'string' && req.body.code.trim()) {
        const nextCode = req.body.code.trim();
        if (nextCode.length < 4 || nextCode.length > 48 || /\s/.test(nextCode)) {
          return res.status(400).json({ error: 'Access code must be 4–48 characters with no spaces.' });
        }
        if (nextCode.toLowerCase() === RESTRICTED_THERAPIST_UNLOCK_CODE) {
          return res.status(400).json({ error: 'Choose a custom code distinct from the built-in quick code.' });
        }
        item.code = nextCode;
      }
      if (typeof req.body?.active === 'boolean') {
        item.active = req.body.active;
      }
      item.updatedAt = new Date().toISOString();
      user.updatedAt = item.updatedAt;
      recordActorAudit(
        db,
        user,
        'THERAPIST_UPDATED_ACCESS_CODE',
        'therapist_code',
        item.id,
        'Therapist Access Codes',
        `Clinician ${user.name} updated access code "${item.label}" (${item.active ? 'active' : 'paused'})`
      );
      saveDb(db);
      res.json({ accessCode: item, accessCodes: user.customAccessCodes || [] });
    }
  );

  router.delete(
    '/therapists/access-codes/:id',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const db = loadDb();
      const user = db.users.find(u => u.id === req.authUser!.id);
      if (!user) return res.status(404).json({ error: 'Therapist account not found.' });

      const existing = user.customAccessCodes || [];
      const target = existing.find(c => c.id === req.params.id);
      if (!target) return res.status(404).json({ error: 'Custom access code not found.' });

      user.customAccessCodes = existing.filter(c => c.id !== req.params.id);
      user.updatedAt = new Date().toISOString();
      recordActorAudit(
        db,
        user,
        'THERAPIST_DELETED_ACCESS_CODE',
        'therapist_code',
        req.params.id,
        'Therapist Access Codes',
        `Clinician ${user.name} removed access code "${target.label}"`
      );
      saveDb(db);
      res.json({ ok: true, accessCodes: user.customAccessCodes });
    }
  );

  // Authenticated Server-Sent Events (SSE) real-time synchronization stream
  router.get('/realtime/stream', (req: Request, res: Response) => {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication token required for real-time stream.' });
    }
    const db = loadDb();
    const session = db.sessions.find(s => s.token === token);
    if (!session || new Date(session.expiresAt).getTime() <= Date.now()) {
      return res.status(401).json({ error: 'Invalid or expired session token.' });
    }
    const user = db.users.find(u => u.id === session.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }

    const subscriber: SseSubscriber = {
      id: makeId('sse'),
      userId: user.id,
      role: user.role,
      res,
    };
    sseSubscribers.add(subscriber);

    res.write(
      `event: connected\ndata: ${JSON.stringify({
        event: 'connected',
        userId: user.id,
        role: user.role,
        timestamp: new Date().toISOString(),
      })}\n\n`
    );

    const heartbeat = setInterval(() => {
      try {
        res.write(`: ping\n\n`);
      } catch {
        clearInterval(heartbeat);
        sseSubscribers.delete(subscriber);
      }
    }, 25000);
    if (typeof heartbeat.unref === 'function') {
      heartbeat.unref();
    }

    req.on('close', () => {
      clearInterval(heartbeat);
      sseSubscribers.delete(subscriber);
    });
  });

  // =========================================================
  // 2. ADMIN VERIFICATION WORKFLOW, ASSIGNMENTS & AUDIT LOGS
  // =========================================================
  router.get('/admin/pending', requireAuth, requireRole(['admin']), (_req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const therapists = db.users
      .filter(u => u.role === 'therapist')
      .map(sanitizePublicUser);
    const users = db.users
      .filter(u => u.role === 'user')
      .map(u => ({
        id: u.id,
        username: u.username,
        name: u.name,
        district: u.district || 'Not specified',
        ageRange: u.ageRange || 'Not specified',
        createdAt: u.createdAt,
      }));
    const connections = db.connections;
    const orgs = db.communityOrgs;
    const services = db.verifiedServices;
    const permissionGrants = db.permissionGrants.map(g => ({
      id: g.id,
      connectionId: g.connectionId,
      clientId: g.clientId,
      clientName: g.clientName,
      therapistId: g.therapistId,
      therapistName: g.therapistName,
      categories: g.categories,
      accessMode: g.accessMode,
      purpose: g.purpose,
      authorizedAt: g.authorizedAt,
      expiresAt: g.expiresAt,
      revokedAt: g.revokedAt,
      status: g.status,
    }));
    const reportsSummary = db.reports.map(r => ({
      id: r.id,
      version: r.version,
      clientId: r.clientId,
      clientName: r.clientName,
      therapistId: r.therapistId,
      therapistName: r.therapistName,
      title: r.title,
      sectionsIncluded: r.sectionsIncluded,
      deliveredAt: r.deliveredAt,
      viewedAt: r.viewedAt,
      revokedAt: r.revokedAt,
      status: r.status,
    }));
    const appControls = db.appControls || buildDefaultAppControls();
    res.json({ therapists, users, connections, orgs, services, permissionGrants, reportsSummary, appControls });
  });

  // Safe non-sensitive platform governance settings readable by client UI
  router.get('/app-controls', (_req: Request, res: Response) => {
    const db = loadDb();
    res.json({ controls: db.appControls || buildDefaultAppControls() });
  });

  router.get('/admin/app-controls', requireAuth, requireRole(['admin']), (_req: AuthedRequest, res: Response) => {
    const db = loadDb();
    res.json({ controls: db.appControls || buildDefaultAppControls() });
  });

  router.patch('/admin/app-controls', requireAuth, requireRole(['admin']), (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const current = db.appControls || buildDefaultAppControls();
    const next = {
      allowNewSignups:
        typeof req.body?.allowNewSignups === 'boolean' ? req.body.allowNewSignups : current.allowNewSignups,
      allowTherapistDirectDiscovery:
        typeof req.body?.allowTherapistDirectDiscovery === 'boolean'
          ? req.body.allowTherapistDirectDiscovery
          : current.allowTherapistDirectDiscovery,
      allowTherapistCustomCodes:
        typeof req.body?.allowTherapistCustomCodes === 'boolean'
          ? req.body.allowTherapistCustomCodes
          : current.allowTherapistCustomCodes,
      enableAiBriefMode:
        typeof req.body?.enableAiBriefMode === 'boolean' ? req.body.enableAiBriefMode : current.enableAiBriefMode,
      requireOrgVerification:
        typeof req.body?.requireOrgVerification === 'boolean'
          ? req.body.requireOrgVerification
          : current.requireOrgVerification,
      platformNotice:
        typeof req.body?.platformNotice === 'string'
          ? req.body.platformNotice.trim().slice(0, 280)
          : current.platformNotice,
      updatedAt: new Date().toISOString(),
      updatedBy: req.authUser!.name,
    };
    db.appControls = next;
    recordActorAudit(
      db,
      req.authUser!,
      'ADMIN_UPDATED_APP_CONTROLS',
      'app_controls',
      'platform',
      'App Controls',
      `Updated platform controls (signups=${next.allowNewSignups}, discovery=${next.allowTherapistDirectDiscovery}, customCodes=${next.allowTherapistCustomCodes})`
    );
    saveDb(db);
    emitRealtimeEvent({ event: 'app:controls_updated', payload: next, broadcastAll: true });
    res.json({ controls: next });
  });

  router.patch(
    '/admin/therapists/:id/scope',
    requireAuth,
    requireRole(['admin']),
    (req: AuthedRequest, res: Response) => {
      const db = loadDb();
      const target = db.users.find(u => u.id === req.params.id && u.role === 'therapist');
      if (!target) {
        return res.status(404).json({ error: 'Therapist account not found.' });
      }
      const prevScope = target.workScope || buildDefaultWorkScope();
      const allowedSpecializations = Array.isArray(req.body?.allowedSpecializations)
        ? req.body.allowedSpecializations.map((s: unknown) => String(s).trim()).filter(Boolean).slice(0, 10)
        : typeof req.body?.allowedSpecializations === 'string'
        ? req.body.allowedSpecializations
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
            .slice(0, 10)
        : prevScope.allowedSpecializations;
      const maxActivePatients =
        typeof req.body?.maxActivePatients === 'number' && Number.isFinite(req.body.maxActivePatients)
          ? Math.min(500, Math.max(1, Math.round(req.body.maxActivePatients)))
          : prevScope.maxActivePatients;

      const updatedScope: TherapistWorkScope = {
        allowedSpecializations:
          allowedSpecializations.length > 0 ? allowedSpecializations : prevScope.allowedSpecializations,
        maxActivePatients,
        allowDirectOnboarding:
          typeof req.body?.allowDirectOnboarding === 'boolean'
            ? req.body.allowDirectOnboarding
            : prevScope.allowDirectOnboarding,
        allowClinicalNotes:
          typeof req.body?.allowClinicalNotes === 'boolean'
            ? req.body.allowClinicalNotes
            : prevScope.allowClinicalNotes,
        adminScopeNote:
          typeof req.body?.adminScopeNote === 'string'
            ? req.body.adminScopeNote.trim().slice(0, 240)
            : prevScope.adminScopeNote || '',
        updatedAt: new Date().toISOString(),
      };
      target.workScope = updatedScope;
      target.updatedAt = updatedScope.updatedAt;
      recordActorAudit(
        db,
        req.authUser!,
        'ADMIN_UPDATED_THERAPIST_SCOPE',
        'therapist',
        target.id,
        'Clinician Work Scope',
        `Admin updated work scope for @${target.username} (maxPatients=${updatedScope.maxActivePatients}, directOnboard=${updatedScope.allowDirectOnboarding})`
      );
      saveDb(db);
      res.json({ therapist: sanitizePublicUser(target), workScope: updatedScope });
    }
  );

  router.get('/admin/therapist-assignments', requireAuth, requireRole(['admin']), (_req: AuthedRequest, res: Response) => {
    const db = loadDb();
    res.json({ connections: db.connections, mutualSelectionPolicy: true });
  });

  // Governance policy: Admins NEVER assign patients to therapists. Patients and therapists select each other mutually.
  router.post('/admin/therapist-assignments', requireAuth, requireRole(['admin']), (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    recordActorAudit(
      db,
      req.authUser!,
      'ADMIN_FORCED_ASSIGNMENT_BLOCKED',
      'connection',
      'policy',
      'Mutual Consent Governance',
      `Blocked admin assignment attempt by @${req.authUser!.username}; patient–therapist selection is strictly mutual`
    );
    saveDb(db);
    return res.status(403).json({
      error: 'Admins cannot assign therapists to patients. Patients and therapists choose each other mutually.',
      mutualSelectionPolicy: true,
    });
  });

  router.delete('/admin/therapist-assignments/:connectionId', requireAuth, requireRole(['admin']), (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const conn = db.connections.find(c => c.id === req.params.connectionId);
    if (!conn) {
      return res.status(404).json({ error: 'Assignment connection not found.' });
    }
    conn.status = 'revoked';
    conn.revokedAt = new Date().toISOString();
    db.permissionGrants.forEach(g => {
      if (g.connectionId === conn.id && g.status === 'active') {
        g.status = 'revoked';
        g.revokedAt = conn.revokedAt;
      }
    });
    recordActorAudit(
      db,
      req.authUser!,
      'ADMIN_REVOKED_THERAPIST_ASSIGNMENT',
      'connection',
      conn.id,
      'Mutual Consent Governance',
      `Revoked care connection between ${conn.clientName} and ${conn.therapistName}`
    );
    saveDb(db);
    emitRealtimeEvent({
      event: 'connection:updated',
      payload: { connectionId: conn.id, clientId: conn.clientId, therapistId: conn.therapistId, status: conn.status },
      targetUserIds: [conn.clientId, conn.therapistId],
    });
    res.json({ connection: conn });
  });

  router.post(
    '/admin/therapists/:id/decision',
    requireAuth,
    requireRole(['admin']),
    (req: AuthedRequest, res: Response) => {
      const requestedStatus = String(req.body?.decision || '').trim() as VerificationStatus;
      if (!VALID_VERIFICATION_STATUSES.includes(requestedStatus)) {
        return res.status(400).json({
          error: `Decision must be one of: ${VALID_VERIFICATION_STATUSES.join(', ')}.`,
        });
      }
      const db = loadDb();
      const target = db.users.find(u => u.id === req.params.id && u.role === 'therapist');
      if (!target) {
        return res.status(404).json({ error: 'Therapist account not found.' });
      }
      target.verificationStatus = requestedStatus;
      if (typeof req.body?.verificationNote === 'string') {
        target.verificationNote = req.body.verificationNote.trim();
      }
      target.updatedAt = new Date().toISOString();
      recordActorAudit(
        db,
        req.authUser!,
        `THERAPIST_STATUS_${requestedStatus.toUpperCase()}`,
        'therapist',
        target.id,
        'Admin Verification',
        `Admin set therapist @${target.username} status to ${requestedStatus}`
      );
      saveDb(db);
      emitRealtimeEvent({
        event: 'availability:updated',
        payload: { therapistId: target.id, verificationStatus: target.verificationStatus },
        broadcastAll: true,
      });
      res.json({ therapist: sanitizePublicUser(target) });
    }
  );

  router.post(
    '/admin/orgs/:id/decision',
    requireAuth,
    requireRole(['admin']),
    (req: AuthedRequest, res: Response) => {
      const decision = req.body?.decision === 'approved' ? 'approved' : req.body?.decision === 'rejected' ? 'rejected' : null;
      if (!decision) {
        return res.status(400).json({ error: 'Decision must be "approved" or "rejected".' });
      }
      const db = loadDb();
      const org = db.communityOrgs.find(o => o.id === req.params.id);
      if (!org) {
        return res.status(404).json({ error: 'Organization not found.' });
      }
      org.verificationStatus = decision;
      db.programmes.forEach(p => {
        if (p.orgId === org.id) {
          p.verificationStatus = decision === 'approved' ? 'verified' : 'pending';
        }
      });
      recordActorAudit(
        db,
        req.authUser!,
        decision === 'approved' ? 'ORG_APPROVED' : 'ORG_REJECTED',
        'organization',
        org.id,
        'Admin Verification',
        `Admin set organization "${org.name}" verification to ${decision}`
      );
      saveDb(db);
      emitRealtimeEvent({
        event: 'programme:updated',
        payload: { orgId: org.id, verificationStatus: decision },
        broadcastAll: true,
      });
      res.json({ org });
    }
  );

  router.get('/audit/logs', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const user = req.authUser!;
    const logs =
      user.role === 'admin'
        ? db.auditLogs
        : db.auditLogs.filter(l => l.actorId === user.id || l.targetId === user.id);
    res.json({ logs: logs.slice(0, 200) });
  });

  // =========================================================
  // 3. TWO-WAY INVITATIONS, CONNECTIONS, GRANULAR PERMISSIONS & REPORTS
  // =========================================================
  router.get('/invitations/mine', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    expirePendingInvitations(db);
    const user = req.authUser!;
    if (user.role === 'therapist' && user.verificationStatus !== 'approved') {
      return res.status(403).json({ error: 'Therapist account awaiting verification approval.' });
    }
    const contactIdentifiers = new Set(
      [user.username?.toLowerCase(), user.email?.toLowerCase()].filter(Boolean) as string[]
    );
    const list = db.invitations.filter(
      inv =>
        inv.senderId === user.id ||
        inv.recipientUserId === user.id ||
        contactIdentifiers.has(inv.recipientContact.toLowerCase())
    );
    saveDb(db);
    res.json({ invitations: list });
  });

  // Workflow A: Verified Therapist invites a client without exposing account existence
  router.post(
    '/therapist/invite-client',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const recipientContact = String(req.body?.recipientContact || '').trim().toLowerCase();
      const purpose = String(req.body?.purpose || 'Continuity of care and shared review').trim();
      const requestedPermissions = sanitizePermissionCategories(req.body?.requestedPermissions);
      const expiresDays = Math.min(30, Math.max(1, Number(req.body?.expiresDays || 14)));

      if (!recipientContact) {
        return res.status(400).json({ error: 'Recipient username or email contact is required.' });
      }

      const db = loadDb();
      const matchedClient = db.users.find(
        u =>
          u.role === 'user' &&
          (u.username.toLowerCase() === recipientContact ||
            (u.email && u.email.toLowerCase() === recipientContact))
      );

      const invitation = {
        id: makeId('inv'),
        code: `CP-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        direction: 'therapist_to_client' as const,
        senderId: req.authUser!.id,
        senderName: req.authUser!.name,
        senderRole: 'therapist' as const,
        recipientContact,
        recipientUserId: matchedClient?.id,
        recipientName: matchedClient?.name,
        purpose,
        requestedPermissions:
          requestedPermissions.length > 0
            ? requestedPermissions
            : (['background', 'substances', 'goals', 'weekly_reports', 'assignments', 'appointments'] as PermissionCategory[]),
        expiresAt: new Date(Date.now() + expiresDays * 86400000).toISOString(),
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      };
      db.invitations.unshift(invitation);
      appendAuditLog(db, {
        actorId: req.authUser!.id,
        actorRole: 'therapist',
        action: 'THERAPIST_INVITED_CLIENT',
        targetType: 'invitation',
        targetId: invitation.id,
        detail: `Therapist created time-limited client invitation (${invitation.code})`,
      });
      saveDb(db);

      // Privacy safeguard: do NOT reveal matchedClient existence in public response
      return res.status(201).json({
        invitation: {
          ...invitation,
          recipientUserId: undefined,
          recipientName: undefined,
        },
        message: 'Secure time-limited invitation created. Client can review and accept in My Professional Support.',
      });
    }
  );

  // Redeem invitation by secure invite code (useful when contact wasn't known beforehand)
  router.post('/invitations/redeem', requireAuth, (req: AuthedRequest, res: Response) => {
    const code = String(req.body?.code || '').trim().toUpperCase();
    if (!code) return res.status(400).json({ error: 'Invitation code is required.' });
    const db = loadDb();
    expirePendingInvitations(db);
    const inv = db.invitations.find(i => i.code.toUpperCase() === code);
    if (!inv) return res.status(404).json({ error: 'Invitation code not found.' });
    if (inv.status !== 'pending') {
      return res.status(400).json({ error: `Invitation is already ${inv.status}.` });
    }
    inv.recipientUserId = req.authUser!.id;
    inv.recipientName = req.authUser!.name;
    saveDb(db);
    res.json({ invitation: inv });
  });

  router.post('/invitations/:id/respond', requireAuth, (req: AuthedRequest, res: Response) => {
    const action = req.body?.action === 'accept' ? 'accepted' : req.body?.action === 'reject' ? 'rejected' : null;
    if (!action) {
      return res.status(400).json({ error: 'Action must be "accept" or "reject".' });
    }
    const db = loadDb();
    expirePendingInvitations(db);
    const inv = db.invitations.find(i => i.id === req.params.id);
    if (!inv) return res.status(404).json({ error: 'Invitation not found.' });
    if (inv.status !== 'pending') {
      return res.status(400).json({ error: `Cannot respond to an invitation that is ${inv.status}.` });
    }

    const user = req.authUser!;
    const matchesRecipient =
      inv.recipientUserId === user.id ||
      inv.recipientContact.toLowerCase() === user.username.toLowerCase() ||
      (user.email && inv.recipientContact.toLowerCase() === user.email.toLowerCase());

    if (!matchesRecipient) {
      return res.status(403).json({ error: 'Forbidden: invitation is addressed to another recipient.' });
    }
    if (user.role === 'therapist' && user.verificationStatus !== 'approved') {
      return res.status(403).json({ error: 'Only admin-approved therapists can accept client invitations.' });
    }

    inv.status = action;
    inv.recipientUserId = user.id;
    inv.recipientName = user.name;
    inv.respondedAt = new Date().toISOString();

    let connection = null;
    let grant = null;

    if (action === 'accepted') {
      const therapistId = inv.senderRole === 'therapist' ? inv.senderId : user.id;
      const clientId = inv.senderRole === 'user' ? inv.senderId : user.id;
      const therapistUser = db.users.find(u => u.id === therapistId && u.role === 'therapist');
      const clientUser = db.users.find(u => u.id === clientId && u.role === 'user');
      if (!therapistUser || therapistUser.verificationStatus !== 'approved' || !clientUser) {
        return res.status(400).json({ error: 'Both approved therapist and client accounts are required.' });
      }

      const existingConn = db.connections.find(
        c => c.clientId === clientUser.id && c.therapistId === therapistUser.id
      );
      if (existingConn) {
        existingConn.status = 'accepted';
        existingConn.revokedAt = undefined;
        existingConn.consentGrantedAt = new Date().toISOString();
        connection = existingConn;
      } else {
        connection = {
          id: makeId('conn'),
          clientId: clientUser.id,
          clientName: clientUser.name,
          therapistId: therapistUser.id,
          therapistName: therapistUser.name,
          status: 'accepted' as const,
          initiatedBy: inv.senderRole,
          consentGrantedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        db.connections.push(connection);
      }

      // If client is accepting Therapist -> Client invite, initialize client's chosen permissions
      const grantedCategories =
        user.id === clientUser.id && Array.isArray(req.body?.grantedCategories)
          ? sanitizePermissionCategories(req.body.grantedCategories)
          : inv.requestedPermissions;

      grant = {
        id: makeId('perm'),
        connectionId: connection.id,
        clientId: clientUser.id,
        clientName: clientUser.name,
        therapistId: therapistUser.id,
        therapistName: therapistUser.name,
        categories: grantedCategories.length > 0 ? grantedCategories : inv.requestedPermissions,
        accessMode: (req.body?.accessMode === 'one_time' ? 'one_time' : 'continuing') as 'one_time' | 'continuing',
        purpose: inv.purpose,
        allowWeeklyUpdates: grantedCategories.includes('weekly_reports'),
        allowSelectedActivities: grantedCategories.includes('cbt_reflections') || grantedCategories.includes('assignments'),
        allowBidirectionalFeedback: true,
        authorizedAt: new Date().toISOString(),
        expiresAt: req.body?.expiresAt ? String(req.body.expiresAt) : undefined,
        status: 'active' as const,
      };
      db.permissionGrants.unshift(grant);
      db.permissionHistory.unshift({
        id: makeId('ph'),
        grantId: grant.id,
        clientId: grant.clientId,
        clientName: grant.clientName,
        therapistId: grant.therapistId,
        therapistName: grant.therapistName,
        categories: grant.categories,
        purpose: grant.purpose,
        authorizedAt: grant.authorizedAt,
        expiresAt: grant.expiresAt,
        action: 'granted',
        downloadDisclaimerAcknowledged: true,
      });
    }

    appendAuditLog(db, {
      actorId: user.id,
      actorRole: user.role,
      action: `INVITATION_${action.toUpperCase()}`,
      targetType: 'invitation',
      targetId: inv.id,
      detail: `${user.name} ${action} invitation ${inv.code}`,
    });
    saveDb(db);
    emitRealtimeEvent({
      event: 'connection:updated',
      payload: { invitationId: inv.id, connectionId: connection?.id, status: action },
      targetUserIds: [inv.senderId, user.id, connection?.clientId || '', connection?.therapistId || ''],
    });
    return res.json({ invitation: inv, connection, grant });
  });

  router.post('/invitations/:id/cancel', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const inv = db.invitations.find(i => i.id === req.params.id && i.senderId === req.authUser!.id);
    if (!inv) return res.status(404).json({ error: 'Invitation not found.' });
    if (inv.status !== 'pending') {
      return res.status(400).json({ error: `Cannot cancel invitation in status "${inv.status}".` });
    }
    inv.status = 'cancelled';
    inv.respondedAt = new Date().toISOString();
    appendAuditLog(db, {
      actorId: req.authUser!.id,
      actorRole: req.authUser!.role,
      action: 'INVITATION_CANCELLED',
      targetType: 'invitation',
      targetId: inv.id,
      detail: `Sender cancelled invitation ${inv.code}`,
    });
    saveDb(db);
    res.json({ invitation: inv });
  });

  // Granular User-Controlled Permissions ("Manage My Data Sharing")
  router.get('/permissions', requireAuth, requireRole(['user']), (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const grants = db.permissionGrants.filter(g => g.clientId === req.authUser!.id);
    const history = db.permissionHistory.filter(h => h.clientId === req.authUser!.id);
    res.json({ grants, history });
  });

  router.post('/permissions', requireAuth, requireRole(['user']), (req: AuthedRequest, res: Response) => {
    const therapistId = String(req.body?.therapistId || '').trim();
    const categories = sanitizePermissionCategories(req.body?.categories);
    const accessMode: 'one_time' | 'continuing' =
      req.body?.accessMode === 'one_time' ? 'one_time' : 'continuing';
    const purpose = String(req.body?.purpose || 'Ongoing clinical support').trim();
    const allowWeeklyUpdates = Boolean(req.body?.allowWeeklyUpdates ?? categories.includes('weekly_reports'));
    const allowSelectedActivities = Boolean(req.body?.allowSelectedActivities ?? categories.includes('cbt_reflections'));
    const allowBidirectionalFeedback = Boolean(req.body?.allowBidirectionalFeedback ?? true);
    const expiresAt = req.body?.expiresAt ? String(req.body.expiresAt) : undefined;
    const downloadDisclaimerAcknowledged = Boolean(req.body?.downloadDisclaimerAcknowledged ?? true);

    if (!therapistId || categories.length === 0) {
      return res.status(400).json({ error: 'Therapist and at least one permission category are required.' });
    }

    const db = loadDb();
    const conn = db.connections.find(
      c => c.clientId === req.authUser!.id && c.therapistId === therapistId && c.status !== 'revoked'
    );
    if (!conn) {
      return res.status(404).json({ error: 'Active or pending connection with this therapist not found.' });
    }

    const now = new Date().toISOString();
    // Mark prior active grants for this therapist superseded
    let updatedExisting = false;
    db.permissionGrants.forEach(g => {
      if (g.clientId === req.authUser!.id && g.therapistId === therapistId && g.status === 'active') {
        g.status = 'revoked';
        g.revokedAt = now;
        updatedExisting = true;
      }
    });

    const grant = {
      id: makeId('perm'),
      connectionId: conn.id,
      clientId: req.authUser!.id,
      clientName: req.authUser!.name,
      therapistId: conn.therapistId,
      therapistName: conn.therapistName,
      categories,
      accessMode,
      purpose,
      allowWeeklyUpdates,
      allowSelectedActivities,
      allowBidirectionalFeedback,
      authorizedAt: now,
      expiresAt,
      status: 'active' as const,
    };
    db.permissionGrants.unshift(grant);
    db.permissionHistory.unshift({
      id: makeId('ph'),
      grantId: grant.id,
      clientId: grant.clientId,
      clientName: grant.clientName,
      therapistId: grant.therapistId,
      therapistName: grant.therapistName,
      categories,
      purpose,
      authorizedAt: now,
      expiresAt,
      action: updatedExisting ? 'updated' : 'granted',
      downloadDisclaimerAcknowledged,
    });
    appendAuditLog(db, {
      actorId: req.authUser!.id,
      actorRole: 'user',
      action: 'PERMISSIONS_CONFIGURED',
      targetType: 'permission_grant',
      targetId: grant.id,
      detail: `Configured ${categories.length} shared categories for ${conn.therapistName}`,
    });
    saveDb(db);
    res.status(201).json({ grant });
  });

  router.post(
    '/permissions/:grantId/revoke',
    requireAuth,
    requireRole(['user']),
    (req: AuthedRequest, res: Response) => {
      const db = loadDb();
      const grant = db.permissionGrants.find(
        g => g.id === req.params.grantId && g.clientId === req.authUser!.id
      );
      if (!grant) return res.status(404).json({ error: 'Permission grant not found.' });
      const now = new Date().toISOString();
      grant.status = 'revoked';
      grant.revokedAt = now;
      db.permissionHistory.unshift({
        id: makeId('ph'),
        grantId: grant.id,
        clientId: grant.clientId,
        clientName: grant.clientName,
        therapistId: grant.therapistId,
        therapistName: grant.therapistName,
        categories: grant.categories,
        purpose: grant.purpose,
        authorizedAt: grant.authorizedAt,
        expiresAt: grant.expiresAt,
        revokedAt: now,
        action: 'revoked',
        downloadDisclaimerAcknowledged: true,
      });
      appendAuditLog(db, {
        actorId: req.authUser!.id,
        actorRole: 'user',
        action: 'PERMISSION_GRANT_REVOKED',
        targetType: 'permission_grant',
        targetId: grant.id,
        detail: `Immediately revoked granular permission grant for ${grant.therapistName}`,
      });
      saveDb(db);
      res.json({
        grant,
        notice:
          'Future access through ClearPath has been revoked immediately. Please note that revocation cannot delete offline copies previously downloaded.',
      });
    }
  );

  router.get('/therapist/connections', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const user = req.authUser!;
    if (user.role === 'therapist') {
      if (user.verificationStatus !== 'approved') {
        return res.status(403).json({ error: 'Therapist account awaiting verification approval.' });
      }
      const list = db.connections.filter(c => c.therapistId === user.id && c.status !== 'revoked');
      return res.json({ connections: list });
    }
    if (user.role === 'community') {
      return res.status(403).json({ error: 'Community organization accounts cannot access personal care connections.' });
    }
    const list = db.connections.filter(c => c.clientId === user.id);
    return res.json({ connections: list });
  });

  // Workflow B: User invites an approved therapist (also records invitation & optional permission categories)
  router.post('/therapist/invite', requireAuth, requireRole(['user']), (req: AuthedRequest, res: Response) => {
    const therapistId = String(req.body?.therapistId || '').trim();
    const consentGranted = Boolean(req.body?.consentGranted);
    const requestedPermissions = sanitizePermissionCategories(req.body?.requestedPermissions);
    const purpose = String(req.body?.purpose || 'Professional support and shared recovery review').trim();
    if (!therapistId || !consentGranted) {
      return res.status(400).json({ error: 'Therapist selection and explicit consent confirmation are required.' });
    }

    const db = loadDb();
    const therapist = db.users.find(
      u => u.id === therapistId && u.role === 'therapist' && u.verificationStatus === 'approved'
    );
    if (!therapist) {
      return res.status(404).json({ error: 'Approved therapist not found.' });
    }

    // Create a matching Workflow B invitation record
    const invitation = {
      id: makeId('inv'),
      code: `USR-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      direction: 'client_to_therapist' as const,
      senderId: req.authUser!.id,
      senderName: req.authUser!.name,
      senderRole: 'user' as const,
      recipientContact: therapist.username,
      recipientUserId: therapist.id,
      recipientName: therapist.name,
      purpose,
      requestedPermissions:
        requestedPermissions.length > 0 ? requestedPermissions : ALL_PERMISSION_CATEGORIES,
      expiresAt: new Date(Date.now() + 14 * 86400000).toISOString(),
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };
    db.invitations.unshift(invitation);

    const existing = db.connections.find(
      c => c.clientId === req.authUser!.id && c.therapistId === therapist.id
    );
    let conn = existing;
    if (existing) {
      existing.status = 'pending';
      existing.revokedAt = undefined;
      existing.initiatedBy = 'user';
      existing.consentGrantedAt = new Date().toISOString();
    } else {
      conn = {
        id: makeId('conn'),
        clientId: req.authUser!.id,
        clientName: req.authUser!.name,
        therapistId: therapist.id,
        therapistName: therapist.name,
        status: 'pending' as const,
        initiatedBy: 'user' as const,
        consentGrantedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      db.connections.push(conn);
    }

    // Create initial user-controlled PermissionGrant if custom categories were passed
    if (requestedPermissions.length > 0 && conn) {
      const now = new Date().toISOString();
      db.permissionGrants.forEach(g => {
        if (g.clientId === req.authUser!.id && g.therapistId === therapist.id && g.status === 'active') {
          g.status = 'revoked';
          g.revokedAt = now;
        }
      });
      const grant = {
        id: makeId('perm'),
        connectionId: conn.id,
        clientId: req.authUser!.id,
        clientName: req.authUser!.name,
        therapistId: therapist.id,
        therapistName: therapist.name,
        categories: requestedPermissions,
        accessMode: 'continuing' as const,
        purpose,
        allowWeeklyUpdates: requestedPermissions.includes('weekly_reports'),
        allowSelectedActivities: requestedPermissions.includes('cbt_reflections'),
        allowBidirectionalFeedback: true,
        authorizedAt: now,
        status: 'active' as const,
      };
      db.permissionGrants.unshift(grant);
      db.permissionHistory.unshift({
        id: makeId('ph'),
        grantId: grant.id,
        clientId: grant.clientId,
        clientName: grant.clientName,
        therapistId: grant.therapistId,
        therapistName: grant.therapistName,
        categories: grant.categories,
        purpose,
        authorizedAt: now,
        action: 'granted',
        downloadDisclaimerAcknowledged: true,
      });
    }

    appendAuditLog(db, {
      actorId: req.authUser!.id,
      actorRole: 'user',
      action: 'THERAPIST_INVITATION_SENT',
      targetType: 'connection',
      targetId: conn!.id,
      detail: `Client invited therapist @${therapist.username}`,
    });
    saveDb(db);
    emitRealtimeEvent({
      event: 'connection:updated',
      payload: { connectionId: conn!.id, clientId: req.authUser!.id, therapistId: therapist.id, status: 'pending' },
      targetUserIds: [req.authUser!.id, therapist.id],
    });
    return res.status(existing ? 200 : 201).json({ connection: conn, invitation });
  });

  // 1-Click Consent Connection for Real-Time Conversational Patient <-> Therapist Chat
  router.post('/therapist/chat/connect', requireAuth, requireRole(['user']), (req: AuthedRequest, res: Response) => {
    const therapistId = String(req.body?.therapistId || '').trim();
    const consentGranted = Boolean(req.body?.consentGranted);
    const purpose = String(req.body?.purpose || 'Direct clinician chat & continuous care').trim();
    if (!therapistId || !consentGranted) {
      return res.status(400).json({ error: 'Approved therapist selection and consent confirmation are required.' });
    }

    const db = loadDb();
    const therapist = db.users.find(
      u => u.id === therapistId && u.role === 'therapist' && u.verificationStatus === 'approved'
    );
    if (!therapist) {
      return res.status(404).json({ error: 'Approved therapist not found.' });
    }

    const now = new Date().toISOString();
    let conn = db.connections.find(
      c => c.clientId === req.authUser!.id && c.therapistId === therapist.id
    );
    if (conn) {
      conn.status = 'accepted';
      conn.revokedAt = undefined;
      conn.initiatedBy = 'user';
      conn.consentGrantedAt = conn.consentGrantedAt || now;
    } else {
      conn = {
        id: makeId('conn'),
        clientId: req.authUser!.id,
        clientName: req.authUser!.name,
        therapistId: therapist.id,
        therapistName: therapist.name,
        status: 'accepted',
        initiatedBy: 'user',
        consentGrantedAt: now,
        createdAt: now,
      };
      db.connections.unshift(conn);
    }

    const existingGrant = getActivePermissionGrantForClient(db, therapist.id, req.authUser!.id);
    if (!existingGrant) {
      const defaultCategories: PermissionCategory[] = [
        'background',
        'substances',
        'goals',
        'weekly_reports',
        'appointments',
        'assignments',
      ];
      const grant = {
        id: makeId('perm'),
        connectionId: conn.id,
        clientId: req.authUser!.id,
        clientName: req.authUser!.name,
        therapistId: therapist.id,
        therapistName: therapist.name,
        categories: defaultCategories,
        accessMode: 'continuing' as const,
        purpose,
        allowWeeklyUpdates: true,
        allowSelectedActivities: true,
        allowBidirectionalFeedback: true,
        authorizedAt: now,
        status: 'active' as const,
      };
      db.permissionGrants.unshift(grant);
      db.permissionHistory.unshift({
        id: makeId('ph'),
        grantId: grant.id,
        clientId: grant.clientId,
        clientName: grant.clientName,
        therapistId: grant.therapistId,
        therapistName: grant.therapistName,
        categories: grant.categories,
        purpose,
        authorizedAt: now,
        action: 'granted',
        downloadDisclaimerAcknowledged: true,
      });
    }

    recordActorAudit(
      db,
      req.authUser!,
      'CLIENT_CONNECTED_FOR_CARE_CHAT',
      'connection',
      conn.id,
      'Patient Chat & Consent',
      `${req.authUser!.name} activated live clinical chat with ${therapist.name}`
    );
    saveDb(db);
    emitRealtimeEvent({
      event: 'connection:updated',
      payload: { connectionId: conn.id, clientId: req.authUser!.id, therapistId: therapist.id, status: 'accepted' },
      targetUserIds: [req.authUser!.id, therapist.id],
    });
    emitRealtimeEvent({
      event: 'notification:new',
      payload: {
        type: 'patient_connected',
        title: `${req.authUser!.name} started Patient Chat`,
        clientId: req.authUser!.id,
      },
      targetUserIds: [therapist.id],
    });
    return res.status(201).json({ connection: conn, therapist: sanitizePublicUser(therapist) });
  });

  // Verified Therapist assigns/adds an existing signed-up platform user into Patient Care
  router.post(
    '/therapist/patients/assign',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const clientId = String(req.body?.clientId || '').trim();
      if (!clientId) {
        return res.status(400).json({ error: 'Signed-up clientId is required.' });
      }
      const db = loadDb();
      const clientUser = db.users.find(u => u.id === clientId && u.role === 'user');
      if (!clientUser) {
        return res.status(404).json({ error: 'Signed-up Role 1 client not found.' });
      }

      const scope = req.authUser!.workScope || buildDefaultWorkScope();
      const now = new Date().toISOString();
      let conn = db.connections.find(
        c => c.clientId === clientUser.id && c.therapistId === req.authUser!.id
      );
      if ((!conn || conn.status !== 'accepted') && countActivePatientsForTherapist(db, req.authUser!.id) >= scope.maxActivePatients) {
        return res.status(403).json({
          error: `Your current work scope allows up to ${scope.maxActivePatients} active patients. Ask Admin to expand your patient limit if needed.`,
        });
      }
      if (conn) {
        conn.status = 'accepted';
        conn.revokedAt = undefined;
        conn.consentGrantedAt = conn.consentGrantedAt || now;
      } else {
        conn = {
          id: makeId('conn'),
          clientId: clientUser.id,
          clientName: clientUser.name,
          therapistId: req.authUser!.id,
          therapistName: req.authUser!.name,
          status: 'accepted',
          initiatedBy: 'therapist',
          consentGrantedAt: now,
          createdAt: now,
        };
        db.connections.unshift(conn);
      }

      if (!getActivePermissionGrantForClient(db, req.authUser!.id, clientUser.id)) {
        const grant = {
          id: makeId('perm'),
          connectionId: conn.id,
          clientId: clientUser.id,
          clientName: clientUser.name,
          therapistId: req.authUser!.id,
          therapistName: req.authUser!.name,
          categories: ALL_PERMISSION_CATEGORIES,
          accessMode: 'continuing' as const,
          purpose: 'Patient care coordination',
          allowWeeklyUpdates: true,
          allowSelectedActivities: true,
          allowBidirectionalFeedback: true,
          authorizedAt: now,
          status: 'active' as const,
        };
        db.permissionGrants.unshift(grant);
      }

      recordActorAudit(
        db,
        req.authUser!,
        'THERAPIST_ASSIGNED_PATIENT',
        'connection',
        conn.id,
        'Patient Care Roster',
        `Clinician ${req.authUser!.name} added signed-up user ${clientUser.name} to Patient Care`
      );
      saveDb(db);
      emitRealtimeEvent({
        event: 'connection:updated',
        payload: { connectionId: conn.id, clientId: clientUser.id, therapistId: req.authUser!.id, status: 'accepted' },
        targetUserIds: [clientUser.id, req.authUser!.id],
      });
      emitRealtimeEvent({
        event: 'patient:assigned',
        payload: { clientId: clientUser.id, therapistId: req.authUser!.id },
        targetUserIds: [clientUser.id, req.authUser!.id],
      });
      return res.status(201).json({ connection: conn, client: sanitizePublicUser(clientUser) });
    }
  );

  router.post(
    '/therapist/connections/:id/respond',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const action = req.body?.action === 'accept' ? 'accepted' : req.body?.action === 'decline' ? 'revoked' : null;
      if (!action) {
        return res.status(400).json({ error: 'Action must be "accept" or "decline".' });
      }
      const db = loadDb();
      const conn = db.connections.find(c => c.id === req.params.id && c.therapistId === req.authUser!.id);
      if (!conn) {
        return res.status(404).json({ error: 'Connection request not found.' });
      }
      if (action === 'accepted' && conn.status !== 'accepted') {
        const scope = req.authUser!.workScope || buildDefaultWorkScope();
        if (countActivePatientsForTherapist(db, req.authUser!.id) >= scope.maxActivePatients) {
          return res.status(403).json({
            error: `Your current work scope allows up to ${scope.maxActivePatients} active patients.`,
          });
        }
      }
      conn.status = action;
      if (action === 'revoked') {
        conn.revokedAt = new Date().toISOString();
      }
      // Sync matching pending invitation if present
      db.invitations.forEach(inv => {
        if (
          inv.status === 'pending' &&
          inv.senderId === conn.clientId &&
          inv.recipientUserId === req.authUser!.id
        ) {
          inv.status = action === 'accepted' ? 'accepted' : 'rejected';
          inv.respondedAt = new Date().toISOString();
        }
      });
      appendAuditLog(db, {
        actorId: req.authUser!.id,
        actorRole: 'therapist',
        action: action === 'accepted' ? 'THERAPIST_ACCEPTED_CLIENT' : 'THERAPIST_DECLINED_CLIENT',
        targetType: 'connection',
        targetId: conn.id,
        detail: `Therapist ${action} invitation from ${conn.clientName}`,
      });
      saveDb(db);
      emitRealtimeEvent({
        event: 'connection:updated',
        payload: { connectionId: conn.id, clientId: conn.clientId, therapistId: conn.therapistId, status: action },
        targetUserIds: [conn.clientId, conn.therapistId],
      });
      res.json({ connection: conn });
    }
  );

  // Direct clinician patient management: add/onboard a new client into clinician's active roster
  router.post(
    '/therapist/clients',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const name = String(req.body?.name || '').trim();
      const district = String(req.body?.district || 'Ernakulam').trim();
      const ageRange = String(req.body?.ageRange || 'young_adult').trim();
      const primaryConcern = req.body?.primaryConcern ? String(req.body.primaryConcern).trim() : '';
      const initialGoal = req.body?.initialGoal ? String(req.body.initialGoal).trim() : '';
      const initialNote = req.body?.initialNote ? String(req.body.initialNote).trim() : '';

      if (!name) {
        return res.status(400).json({ error: 'Patient / client full name is required.' });
      }

      const db = loadDb();
      const scope = req.authUser!.workScope || buildDefaultWorkScope();
      if (scope.allowDirectOnboarding === false) {
        return res.status(403).json({
          error: 'Direct patient onboarding is disabled in your current Therapist Work Scope.',
        });
      }
      if (countActivePatientsForTherapist(db, req.authUser!.id) >= scope.maxActivePatients) {
        return res.status(403).json({
          error: `Your current work scope allows up to ${scope.maxActivePatients} active patients.`,
        });
      }
      const now = new Date().toISOString();
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .slice(0, 16);
      const clientUser: ServerUser = {
        id: makeId('cli'),
        username: `${slug || 'client'}_${Math.random().toString(36).slice(2, 6)}`,
        name,
        passwordHash: hashPassword('ClearPathClient!2026'),
        role: 'user',
        verificationStatus: 'approved',
        ageRange,
        district,
        createdAt: now,
      };
      db.users.push(clientUser);

      const connId = makeId('conn');
      const connection = {
        id: connId,
        clientId: clientUser.id,
        clientName: clientUser.name,
        therapistId: req.authUser!.id,
        therapistName: req.authUser!.name,
        status: 'accepted' as const,
        initiatedBy: 'therapist' as const,
        consentGrantedAt: now,
        createdAt: now,
      };
      db.connections.unshift(connection);

      db.permissionGrants.unshift({
        id: makeId('perm'),
        connectionId: connId,
        clientId: clientUser.id,
        clientName: clientUser.name,
        therapistId: req.authUser!.id,
        therapistName: req.authUser!.name,
        categories: ALL_PERMISSION_CATEGORIES,
        accessMode: 'continuing',
        purpose: 'Clinical intake & ongoing care coordination',
        allowWeeklyUpdates: true,
        allowSelectedActivities: true,
        allowBidirectionalFeedback: true,
        authorizedAt: now,
        status: 'active',
      });

      if (primaryConcern) {
        db.substanceConcerns.unshift({
          id: makeId('subc'),
          userId: clientUser.id,
          catalogueId: 'custom',
          name: primaryConcern,
          isCustom: true,
          customOriginalText: primaryConcern,
          verificationStatus: 'clinician_reviewed',
          clinicianReviewNote: 'Recorded during clinician intake onboarding.',
          reviewedByTherapistName: req.authUser!.name,
          reviewedAt: now,
          isMedication: false,
          createdAt: now,
          updatedAt: now,
        });
      }

      if (initialGoal) {
        db.role1Goals.unshift({
          id: makeId('goal'),
          userId: clientUser.id,
          title: initialGoal,
          description: 'Initial clinician-guided recovery goal created during client onboarding.',
          category: 'routine',
          frequency: 'daily',
          milestones: [
            { id: makeId('ms'), title: 'First steady check-in step completed', completed: false },
          ],
          progressNotes: [],
          completed: false,
          createdAt: now,
          createdByRole: 'therapist',
          updatedByRole: 'therapist',
          updatedByTherapistName: req.authUser!.name,
          therapistChangeNote: 'Initial onboarding goal',
          updatedAt: now,
        });
        db.supportPlans.unshift({
          id: makeId('splan'),
          userId: clientUser.id,
          selectedPaths: ['guided_cbt', 'weekly_review'],
          pathwayReasons: [],
          objectives: [initialGoal],
          approaches: ['Supportive Check-In'],
          supportNeeds: primaryConcern ? [primaryConcern] : [],
          interventions: ['Weekly Progress Review'],
          educationalActivities: [],
          responsibleTherapistName: req.authUser!.name,
          carePlanStatus: 'active',
          userDefinedActivities: [],
          nextSteps: [],
          reviewDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          updatedAt: now,
        });
      }

      if (initialNote) {
        db.appointmentNotes.unshift({
          id: makeId('note'),
          clientId: clientUser.id,
          therapistId: req.authUser!.id,
          therapistName: req.authUser!.name,
          appointmentDate: now.split('T')[0],
          appointmentTime: '10:00',
          noteText: initialNote,
          status: 'upcoming',
          createdAt: now,
          updatedAt: now,
        });
      }

      recordActorAudit(
        db,
        req.authUser!,
        'THERAPIST_ADDED_CLIENT',
        'connection',
        connId,
        'Client Onboarding',
        `Clinician ${req.authUser!.name} onboarded & connected client ${clientUser.name}`
      );
      saveDb(db);
      emitRealtimeEvent({
        event: 'user:registered',
        payload: { userId: clientUser.id, name: clientUser.name, username: clientUser.username, role: 'user' },
        broadcastAll: true,
      });
      emitRealtimeEvent({
        event: 'connection:updated',
        payload: { connectionId: connId, clientId: clientUser.id, therapistId: req.authUser!.id, status: 'accepted' },
        targetUserIds: [req.authUser!.id, clientUser.id],
      });

      res.status(201).json({
        client: sanitizePublicUser(clientUser),
        connection,
      });
    }
  );

  // Update connected client profile details, support objectives, or substance concern entry cleanly
  router.patch(
    '/therapist/clients/:clientId',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const clientId = String(req.params.clientId || '').trim();
      const db = loadDb();
      if (!isAuthorizedTherapistForClient(db, req.authUser!.id, clientId)) {
        return res.status(403).json({ error: 'Forbidden: client is not actively connected to your practice.' });
      }
      const clientUser = db.users.find(u => u.id === clientId && u.role === 'user');
      if (!clientUser) {
        return res.status(404).json({ error: 'Client record not found.' });
      }

      const now = new Date().toISOString();
      if (typeof req.body?.name === 'string' && req.body.name.trim()) {
        clientUser.name = req.body.name.trim();
        db.connections.forEach(c => {
          if (c.clientId === clientId) c.clientName = clientUser.name;
        });
        db.permissionGrants.forEach(g => {
          if (g.clientId === clientId) g.clientName = clientUser.name;
        });
        db.reports.forEach(r => {
          if (r.clientId === clientId) r.clientName = clientUser.name;
        });
      }
      if (typeof req.body?.district === 'string') {
        clientUser.district = req.body.district.trim();
      }
      if (typeof req.body?.ageRange === 'string' && req.body.ageRange.trim()) {
        clientUser.ageRange = req.body.ageRange.trim();
      }
      clientUser.updatedAt = now;

      if (Array.isArray(req.body?.objectives) || typeof req.body?.reviewDate === 'string') {
        const existingPlan = db.supportPlans.find(p => p.userId === clientId);
        const objectives = Array.isArray(req.body?.objectives)
          ? req.body.objectives.map(String).filter(Boolean)
          : existingPlan?.objectives || [];
        const reviewDate =
          typeof req.body?.reviewDate === 'string' && req.body.reviewDate.trim()
            ? req.body.reviewDate.trim()
            : existingPlan?.reviewDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        if (existingPlan) {
          existingPlan.objectives = objectives;
          existingPlan.reviewDate = reviewDate;
          existingPlan.updatedAt = now;
        } else {
          db.supportPlans.unshift({
            id: makeId('splan'),
            userId: clientId,
            selectedPaths: ['guided_cbt', 'weekly_review'],
            pathwayReasons: [],
            objectives,
            approaches: ['Clinician Guided'],
            educationalActivities: [],
            userDefinedActivities: [],
            nextSteps: [],
            reviewDate,
            updatedAt: now,
          });
        }
      }

      if (typeof req.body?.addSubstanceName === 'string' && req.body.addSubstanceName.trim()) {
        const subName = req.body.addSubstanceName.trim();
        db.substanceConcerns.unshift({
          id: makeId('subc'),
          userId: clientId,
          catalogueId: req.body?.addSubstanceCatalogueId ? String(req.body.addSubstanceCatalogueId) : 'custom',
          name: subName,
          isCustom: !req.body?.addSubstanceCatalogueId,
          customOriginalText: subName,
          verificationStatus: 'clinician_reviewed',
          clinicianReviewNote: req.body?.addSubstanceNote
            ? String(req.body.addSubstanceNote).trim()
            : 'Added by clinician during consultation.',
          reviewedByTherapistName: req.authUser!.name,
          reviewedAt: now,
          isMedication: Boolean(req.body?.addSubstanceIsMedication),
          createdAt: now,
          updatedAt: now,
        });
      }

      recordActorAudit(
        db,
        req.authUser!,
        'THERAPIST_UPDATED_CLIENT_PROFILE',
        'user',
        clientId,
        'Patient Profile',
        `Updated care details for client ${clientUser.name}`
      );
      saveDb(db);

      res.json({
        client: sanitizePublicUser(clientUser),
        supportPlan: db.supportPlans.find(p => p.userId === clientId) || null,
      });
    }
  );

  // =========================================================
  // 4B. ROLE 01 USER CLOUD SYNC & THERAPIST ROLE 01 COMMAND CENTER
  // =========================================================
  router.get(
    '/role1/state',
    requireAuth,
    requireRole(['user']),
    (req: AuthedRequest, res: Response) => {
      const db = loadDb();
      const userId = req.authUser!.id;
      const dailyLogs = db.role1DailyLogs
        .filter(l => l.userId === userId)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      const goals = db.role1Goals
        .filter(g => g.userId === userId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const calendarEvents = db.role1CalendarEvents
        .filter(e => e.userId === userId)
        .sort((a, b) => a.date.localeCompare(b.date));
      const earlyAssessments = db.role1Assessments.filter(a => a.userId === userId);
      const supportPlan = db.supportPlans.find(p => p.userId === userId) || null;
      const substanceConcerns = db.substanceConcerns.filter(s => s.userId === userId);
      const personalProfileRecord = db.personalProfiles.find(p => p.userId === userId) || null;
      const recoveryReports = db.recoveryReports
        .filter(r => r.userId === userId)
        .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
      const opportunityProfile = db.opportunityProfiles.find(o => o.userId === userId) || null;
      const savedOpportunities = db.savedOpportunities.filter(o => o.userId === userId);
      const opportunityApplications = db.opportunityApplications
        .filter(a => a.userId === userId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      const recoveryPassport = db.recoveryPassports.find(p => p.userId === userId) || null;
      const personalDevProgress = db.personalDevProgress.filter(d => d.userId === userId);

      res.json({
        dailyLogs,
        goals,
        calendarEvents,
        earlyAssessments,
        supportPlan,
        substanceConcerns,
        personalOnboarding: personalProfileRecord ? personalProfileRecord.onboarding : null,
        recoveryReports,
        opportunityProfile,
        savedOpportunities,
        opportunityApplications,
        recoveryPassport,
        personalDevProgress,
      });
    }
  );

  router.put(
    '/role1/state',
    requireAuth,
    requireRole(['user']),
    (req: AuthedRequest, res: Response) => {
      const db = loadDb();
      const userId = req.authUser!.id;
      const now = new Date().toISOString();

      if (Array.isArray(req.body?.dailyLogs)) {
        const existingMap = new Map(
          db.role1DailyLogs.filter(l => l.userId === userId).map(l => [l.id, l])
        );
        const nextForUser: Role1DailyLogRecord[] = req.body.dailyLogs
          .filter((l: unknown): l is Record<string, unknown> => Boolean(l && typeof l === 'object'))
          .slice(0, 300)
          .map((raw: Record<string, unknown>) => {
            const id = String(raw.id || makeId('log'));
            const prev = existingMap.get(id);
            const cravingFrequency =
              typeof raw.cravingFrequency === 'number' && !Number.isNaN(raw.cravingFrequency)
                ? Math.max(0, Math.min(5, Math.round(raw.cravingFrequency)))
                : undefined;
            const cravingIntensity =
              typeof raw.cravingIntensity === 'number' && !Number.isNaN(raw.cravingIntensity)
                ? Math.max(0, Math.min(10, Math.round(raw.cravingIntensity)))
                : undefined;
            const sleepHours =
              typeof raw.sleepHours === 'number' && !Number.isNaN(raw.sleepHours)
                ? Math.max(0, Math.min(24, Number(raw.sleepHours.toFixed(1))))
                : undefined;
            const routineSteady =
              typeof raw.routineSteady === 'boolean' ? raw.routineSteady : undefined;
            return {
              id,
              userId,
              date: String(raw.date || now.split('T')[0]),
              timestamp: String(raw.timestamp || now),
              type: raw.type === 'detailed' ? 'detailed' : 'quick',
              mood: typeof raw.mood === 'string' ? raw.mood : undefined,
              quickNote: typeof raw.quickNote === 'string' ? raw.quickNote : undefined,
              completedActivities: Array.isArray(raw.completedActivities)
                ? raw.completedActivities.map(String)
                : [],
              personalReflection:
                typeof raw.personalReflection === 'string' ? raw.personalReflection : undefined,
              detailedQuestions:
                raw.detailedQuestions && typeof raw.detailedQuestions === 'object'
                  ? (raw.detailedQuestions as Role1DailyLogRecord['detailedQuestions'])
                  : undefined,
              tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
              cravingFrequency,
              cravingIntensity,
              sleepHours,
              routineSteady,
              isDraft: Boolean(raw.isDraft),
              clinicianReviewNote: prev?.clinicianReviewNote || (typeof raw.clinicianReviewNote === 'string' ? raw.clinicianReviewNote : undefined),
              reviewedByTherapistName: prev?.reviewedByTherapistName || (typeof raw.reviewedByTherapistName === 'string' ? raw.reviewedByTherapistName : undefined),
              reviewedAt: prev?.reviewedAt || (typeof raw.reviewedAt === 'string' ? raw.reviewedAt : undefined),
              updatedAt: now,
            };
          });
        db.role1DailyLogs = [
          ...nextForUser,
          ...db.role1DailyLogs.filter(l => l.userId !== userId),
        ];
      }

      if (Array.isArray(req.body?.goals)) {
        const existingGoalMap = new Map(
          db.role1Goals.filter(g => g.userId === userId).map(g => [g.id, g])
        );
        const nextGoals: Role1GoalRecord[] = req.body.goals
          .filter((g: unknown): g is Record<string, unknown> => Boolean(g && typeof g === 'object'))
          .slice(0, 200)
          .map((raw: Record<string, unknown>) => {
            const id = String(raw.id || makeId('goal'));
            const prev = existingGoalMap.get(id);
            return {
              id,
              userId,
              title: String(raw.title || 'Recovery Goal').trim(),
              description: String(raw.description || '').trim(),
              category: String(raw.category || 'personal'),
              targetDate: typeof raw.targetDate === 'string' ? raw.targetDate : undefined,
              frequency:
                raw.frequency === 'daily' || raw.frequency === 'weekly' ? raw.frequency : 'custom',
              milestones: Array.isArray(raw.milestones)
                ? raw.milestones.map((m: unknown) => {
                    const obj = (m && typeof m === 'object' ? m : {}) as Record<string, unknown>;
                    return {
                      id: String(obj.id || makeId('ms')),
                      title: String(obj.title || '').trim(),
                      completed: Boolean(obj.completed),
                    };
                  })
                : [],
              progressNotes: Array.isArray(raw.progressNotes)
                ? raw.progressNotes.map((n: unknown) => {
                    const obj = (n && typeof n === 'object' ? n : {}) as Record<string, unknown>;
                    return {
                      id: String(obj.id || makeId('note')),
                      date: String(obj.date || now.split('T')[0]),
                      note: String(obj.note || ''),
                    };
                  })
                : [],
              completed: Boolean(raw.completed),
              createdAt: String(raw.createdAt || now),
              createdByRole:
                prev?.createdByRole === 'therapist' || raw.createdByRole === 'therapist'
                  ? 'therapist'
                  : 'user',
              updatedByRole:
                prev?.updatedByRole === 'therapist' || raw.updatedByRole === 'therapist'
                  ? 'therapist'
                  : undefined,
              updatedByTherapistName:
                prev?.updatedByTherapistName ||
                (typeof raw.updatedByTherapistName === 'string' ? raw.updatedByTherapistName : undefined),
              therapistChangeNote:
                prev?.therapistChangeNote ||
                (typeof raw.therapistChangeNote === 'string' ? raw.therapistChangeNote : undefined),
              updatedAt: now,
            };
          });
        db.role1Goals = [...nextGoals, ...db.role1Goals.filter(g => g.userId !== userId)];
      }

      if (Array.isArray(req.body?.calendarEvents)) {
        const existingEvtMap = new Map(
          db.role1CalendarEvents.filter(e => e.userId === userId).map(e => [e.id, e])
        );
        const nextEvents: Role1CalendarEventRecord[] = req.body.calendarEvents
          .filter((e: unknown): e is Record<string, unknown> => Boolean(e && typeof e === 'object'))
          .slice(0, 400)
          .map((raw: Record<string, unknown>) => {
            const id = String(raw.id || makeId('evt'));
            const prev = existingEvtMap.get(id);
            const rawState = raw.completionState;
            const completionState =
              rawState === 'completed' || rawState === 'partial' || rawState === 'skipped' || rawState === 'planned'
                ? rawState
                : Boolean(raw.completed)
                ? 'completed'
                : 'planned';
            return {
              id,
              userId,
              title: String(raw.title || 'Scheduled Activity').trim(),
              date: String(raw.date || now.split('T')[0]),
              startTime: typeof raw.startTime === 'string' ? raw.startTime : undefined,
              endTime: typeof raw.endTime === 'string' ? raw.endTime : undefined,
              category: String(raw.category || 'healthy_activity'),
              notes: typeof raw.notes === 'string' ? raw.notes : undefined,
              reminder: Boolean(raw.reminder),
              completed: completionState === 'completed' || Boolean(raw.completed),
              completionState,
              createdByRole:
                prev?.createdByRole === 'therapist' || raw.createdByRole === 'therapist'
                  ? 'therapist'
                  : 'user',
              updatedByRole:
                prev?.updatedByRole === 'therapist' || raw.updatedByRole === 'therapist'
                  ? 'therapist'
                  : undefined,
              updatedByTherapistName:
                prev?.updatedByTherapistName ||
                (typeof raw.updatedByTherapistName === 'string' ? raw.updatedByTherapistName : undefined),
              therapistChangeNote:
                prev?.therapistChangeNote ||
                (typeof raw.therapistChangeNote === 'string' ? raw.therapistChangeNote : undefined),
              updatedAt: now,
            };
          });
        db.role1CalendarEvents = [
          ...nextEvents,
          ...db.role1CalendarEvents.filter(e => e.userId !== userId),
        ];
      }

      if (Array.isArray(req.body?.earlyAssessments)) {
        const nextAssessments: Role1AssessmentRecord[] = req.body.earlyAssessments
          .filter((a: unknown): a is Record<string, unknown> => Boolean(a && typeof a === 'object'))
          .slice(0, 50)
          .map((raw: Record<string, unknown>) => ({
            id: String(raw.id || makeId('ea')),
            userId,
            date: String(raw.date || now.split('T')[0]),
            mode: raw.mode === 'deep' ? 'deep' : 'quick',
            supportArea: String(raw.supportArea || ''),
            focusAreas: Array.isArray(raw.focusAreas) ? raw.focusAreas.map(String) : [],
            recommendedPathway: String(raw.recommendedPathway || ''),
            notes: typeof raw.notes === 'string' ? raw.notes : undefined,
          }));
        db.role1Assessments = [
          ...nextAssessments,
          ...db.role1Assessments.filter(a => a.userId !== userId),
        ];
      }

      if (req.body?.personalOnboarding && typeof req.body.personalOnboarding === 'object') {
        const cleanOnboarding = req.body.personalOnboarding as Record<string, unknown>;
        db.personalProfiles = [
          { userId, onboarding: cleanOnboarding, updatedAt: now },
          ...db.personalProfiles.filter(p => p.userId !== userId),
        ];
      }

      if (Array.isArray(req.body?.recoveryReports)) {
        const nextReports = req.body.recoveryReports
          .filter((r: unknown): r is RecoveryReportRecord => Boolean(r && typeof r === 'object'))
          .slice(0, 60)
          .map((r: RecoveryReportRecord) => ({ ...r, userId }));
        db.recoveryReports = [
          ...nextReports,
          ...db.recoveryReports.filter(r => r.userId !== userId),
        ];
      }

      if (req.body?.opportunityProfile && typeof req.body.opportunityProfile === 'object') {
        const oppProfile = req.body.opportunityProfile as OpportunityProfile;
        db.opportunityProfiles = [
          { ...oppProfile, userId, updatedAt: now },
          ...db.opportunityProfiles.filter(o => o.userId !== userId),
        ];
      }

      if (Array.isArray(req.body?.savedOpportunities)) {
        const nextSaved = req.body.savedOpportunities
          .filter((s: unknown): s is SavedOpportunityRecord => Boolean(s && typeof s === 'object'))
          .slice(0, 100)
          .map((s: SavedOpportunityRecord) => ({ ...s, userId }));
        db.savedOpportunities = [
          ...nextSaved,
          ...db.savedOpportunities.filter(s => s.userId !== userId),
        ];
      }

      if (Array.isArray(req.body?.opportunityApplications)) {
        const nextApps = req.body.opportunityApplications
          .filter((a: unknown): a is OpportunityApplication => Boolean(a && typeof a === 'object'))
          .slice(0, 100)
          .map((a: OpportunityApplication) => ({ ...a, userId }));
        db.opportunityApplications = [
          ...nextApps,
          ...db.opportunityApplications.filter(a => a.userId !== userId),
        ];
      }

      if (req.body?.recoveryPassport && typeof req.body.recoveryPassport === 'object') {
        const pass = req.body.recoveryPassport as RecoveryPassport;
        db.recoveryPassports = [
          { ...pass, userId, updatedAt: now },
          ...db.recoveryPassports.filter(p => p.userId !== userId),
        ];
      }

      if (Array.isArray(req.body?.personalDevProgress)) {
        const nextDev = req.body.personalDevProgress
          .filter((d: unknown): d is PersonalDevTrackProgress => Boolean(d && typeof d === 'object'))
          .slice(0, 20)
          .map((d: PersonalDevTrackProgress) => ({ ...d, userId }));
        db.personalDevProgress = [
          ...nextDev,
          ...db.personalDevProgress.filter(d => d.userId !== userId),
        ];
      }

      saveDb(db);
      emitClientChangeToCareTeam(db, userId, 'role1_state:updated', { source: 'user' });
      return res.json({ ok: true });
    }
  );

  // Strict assignment-scoped caseload helper: therapists ONLY see Role 01 clients explicitly assigned/connected to them
  const getVisibleRole1UsersForTherapist = (
    db: ReturnType<typeof loadDb>,
    therapistId: string
  ) => {
    const connectedIds = new Set(
      db.connections
        .filter(c => c.therapistId === therapistId && c.status === 'accepted')
        .map(c => c.clientId)
    );
    return db.users.filter(u => u.role === 'user' && connectedIds.has(u.id));
  };

  // Adaptive Therapist Attention Engine (Innovation B):
  // Continuously computes prioritized attention items with explicit human-readable reasons.
  const computeAttentionQueueForTherapist = (
    db: ClearPathDatabase,
    therapistId: string
  ) => {
    const visibleUsers = getVisibleRole1UsersForTherapist(db, therapistId);
    const todayIso = new Date().toISOString().split('T')[0];

    return visibleUsers
      .map(u => {
        const logs = db.role1DailyLogs
          .filter(l => l.userId === u.id)
          .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        const goals = db.role1Goals.filter(g => g.userId === u.id);
        const events = db.role1CalendarEvents.filter(e => e.userId === u.id);
        const substances = db.substanceConcerns.filter(s => s.userId === u.id);
        const plan = db.supportPlans.find(p => p.userId === u.id) || null;
        const appts = db.appointmentNotes.filter(
          n => n.clientId === u.id && n.therapistId === therapistId
        );
        const msgsFromClientUnread = db.messages.filter(
          m => m.therapistId === therapistId && m.clientId === u.id && m.senderRole === 'user' && !m.readAt
        );
        const unreviewedReports = db.reports.filter(
          r => r.therapistId === therapistId && r.clientId === u.id && r.status === 'delivered'
        );
        const clinicalNotes = db.clinicalNotes.filter(
          n => n.clientId === u.id && n.therapistId === therapistId
        );
        const pendingProposals = db.carePlanProposals.filter(
          p =>
            p.userId === u.id &&
            p.therapistId === therapistId &&
            (p.status === 'proposed' || p.status === 'user_reviewed' || p.status === 'declined')
        );

        const unreviewedLogsCount = logs.filter(l => !l.clinicianReviewNote).length;
        const difficultRecentLogs = logs
          .slice(0, 5)
          .filter(l => ['heavy', 'challenged', 'difficult', 'restless'].includes(l.mood || '')).length;
        const missedEventsCount = events.filter(e => !e.completed && e.date < todayIso).length;
        const missedAppointmentsCount = appts.filter(
          n => n.status === 'missed' || (n.status !== 'completed' && n.appointmentDate < todayIso)
        ).length;
        const overdueFollowUpNotesCount = clinicalNotes.filter(
          n => Boolean(n.followUpDate && n.followUpDate <= todayIso)
        ).length;
        const overduePlanReview = Boolean(plan?.reviewDate && plan.reviewDate <= todayIso);
        const unverifiedSubstancesCount = substances.filter(
          s => s.verificationStatus === 'unverified'
        ).length;

        const missingInfoFlags: string[] = [];
        if (!plan) missingInfoFlags.push('No written support plan saved');
        if (goals.length === 0) missingInfoFlags.push('No Role 01 recovery goals added');
        if (!u.district || u.district === 'Not specified') missingInfoFlags.push('District not set');

        const reasons: string[] = [];
        let score = 0;

        if (msgsFromClientUnread.length > 0) {
          reasons.push(`${msgsFromClientUnread.length} unread client message(s)`);
          score += 40;
        }
        if (difficultRecentLogs > 0) {
          reasons.push(`${difficultRecentLogs} recent heavy/challenged mood check-in(s)`);
          score += difficultRecentLogs >= 2 ? 45 : 30;
        }
        if (missedAppointmentsCount > 0) {
          reasons.push(`${missedAppointmentsCount} missed or overdue clinical appointment(s)`);
          score += 35;
        }
        if (unreviewedReports.length > 0) {
          reasons.push(`${unreviewedReports.length} newly shared client report(s) awaiting review`);
          score += 25;
        }
        if (overduePlanReview && plan?.reviewDate) {
          reasons.push(`Support plan review date (${plan.reviewDate}) is due`);
          score += 22;
        }
        if (overdueFollowUpNotesCount > 0) {
          reasons.push(`${overdueFollowUpNotesCount} clinician follow-up reminder(s) due`);
          score += 20;
        }
        if (unreviewedLogsCount > 0) {
          reasons.push(`${unreviewedLogsCount} daily journal/voice log(s) awaiting clinician note`);
          score += Math.min(35, unreviewedLogsCount * 12);
        }
        if (missedEventsCount > 0) {
          reasons.push(`${missedEventsCount} scheduled calendar step(s) incomplete past due date`);
          score += Math.min(30, missedEventsCount * 10);
        }
        if (unverifiedSubstancesCount > 0) {
          reasons.push(`${unverifiedSubstancesCount} custom substance entry awaiting clinician clarification`);
          score += 15;
        }
        if (pendingProposals.some(p => p.status === 'declined')) {
          reasons.push('Client declined or requested revision on a Care Plan Proposal');
          score += 25;
        }
        if (missingInfoFlags.length > 0) {
          reasons.push(`Missing setup: ${missingInfoFlags[0]}`);
          score += 8;
        }

        const priorityLevel: 'urgent' | 'follow_up_due' | 'needs_review' | 'routine' =
          difficultRecentLogs >= 2 || missedAppointmentsCount > 0 || score >= 70
            ? 'urgent'
            : overduePlanReview ||
              overdueFollowUpNotesCount > 0 ||
              missedEventsCount > 0 ||
              msgsFromClientUnread.length > 0 ||
              unreviewedReports.length > 0 ||
              score >= 35
            ? 'follow_up_due'
            : unreviewedLogsCount > 0 ||
              unverifiedSubstancesCount > 0 ||
              missingInfoFlags.length > 0 ||
              score >= 15
            ? 'needs_review'
            : 'routine';

        if (reasons.length === 0) {
          reasons.push('On track — no overdue items or unread alerts');
        }

        return {
          userId: u.id,
          name: u.name,
          username: u.username,
          district: u.district || 'Kerala',
          priorityLevel,
          attentionScore: score,
          reasons,
          unreadMessagesCount: msgsFromClientUnread.length,
          unreviewedReportsCount: unreviewedReports.length,
          unreviewedLogsCount,
          overdueFollowUpsCount: missedEventsCount + missedAppointmentsCount + overdueFollowUpNotesCount,
          missingInfoFlags,
          lastActivityDate: logs[0]?.date || u.updatedAt || u.createdAt,
        };
      })
      .sort((a, b) => b.attentionScore - a.attentionScore);
  };

  router.get(
    '/therapist/attention-queue',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const db = loadDb();
      const attentionQueue = computeAttentionQueueForTherapist(db, req.authUser!.id);
      res.json({ attentionQueue });
    }
  );

  // Privacy-safe helper: lists all real signed-up Role 1 users without leaking private clinical notes/journals
  const buildSignedUpUsersSummary = (db: ClearPathDatabase, therapistId: string) => {
    const connMap = new Map(
      db.connections
        .filter(c => c.therapistId === therapistId)
        .map(c => [c.clientId, c])
    );
    return db.users
      .filter(u => u.role === 'user')
      .map(u => {
        const conn = connMap.get(u.id);
        return {
          id: u.id,
          username: u.username,
          name: u.name,
          district: u.district || 'Not specified',
          ageRange: u.ageRange || 'young_adult',
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          isConnected: conn?.status === 'accepted',
          connectionStatus: conn?.status || 'unconnected',
          connectionId: conn?.id || null,
        };
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  };

  router.get(
    '/therapist/signed-up-users',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const db = loadDb();
      const signedUpUsers = buildSignedUpUsersSummary(db, req.authUser!.id);
      res.json({ users: signedUpUsers });
    }
  );

  router.get(
    '/therapist/role1/overview',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const db = loadDb();
      const therapistId = req.authUser!.id;
      const visibleUsers = getVisibleRole1UsersForTherapist(db, therapistId);
      const signedUpUsers = buildSignedUpUsersSummary(db, therapistId);
      const todayIso = new Date().toISOString().split('T')[0];
      const next7Iso = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
      const attentionQueue = computeAttentionQueueForTherapist(db, therapistId);
      const attentionMap = new Map(attentionQueue.map(a => [a.userId, a]));

      const users = visibleUsers
        .map(u => {
          const logs = db.role1DailyLogs
            .filter(l => l.userId === u.id)
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
          const goals = db.role1Goals.filter(g => g.userId === u.id);
          const events = db.role1CalendarEvents.filter(e => e.userId === u.id);
          const substances = db.substanceConcerns.filter(s => s.userId === u.id);
          const plan = db.supportPlans.find(p => p.userId === u.id) || null;
          const appts = db.appointmentNotes.filter(
            n => n.clientId === u.id && n.therapistId === therapistId
          );
          const conn = db.connections.find(
            c => c.therapistId === therapistId && c.clientId === u.id && c.status === 'accepted'
          );
          const unreviewedLogsCount = logs.filter(l => !l.clinicianReviewNote).length;
          const completedGoalsCount = goals.filter(g => g.completed).length;
          const missedEventsCount = events.filter(e => !e.completed && e.date < todayIso).length;
          const missedAppointmentsCount = appts.filter(
            n => n.status === 'missed' || (n.status !== 'completed' && n.appointmentDate < todayIso)
          ).length;
          const isYouth = u.ageRange === 'youth' || u.ageRange === '12_17';
          const hasUpcomingReview = Boolean(
            plan?.reviewDate && plan.reviewDate >= todayIso && plan.reviewDate <= next7Iso
          );
          const attn = attentionMap.get(u.id);

          return {
            id: u.id,
            username: u.username,
            name: u.name,
            email: u.email,
            district: u.district || 'Not specified',
            ageRange: u.ageRange || 'Not specified',
            isYouth,
            verificationStatus: u.verificationStatus,
            createdAt: u.createdAt,
            updatedAt: u.updatedAt,
            isConnected: Boolean(conn),
            connectionId: conn?.id || null,
            logsCount: logs.length,
            unreviewedLogsCount,
            lastLogDate: logs[0]?.date || null,
            latestMood: logs[0]?.mood || null,
            goalsCount: goals.length,
            activeGoalsCount: goals.length - completedGoalsCount,
            completedGoalsCount,
            calendarEventsCount: events.length,
            upcomingEventsCount: events.filter(e => !e.completed && e.date >= todayIso).length,
            missedEventsCount,
            missedAppointmentsCount,
            substancesCount: substances.length,
            unverifiedSubstancesCount: substances.filter(s => s.verificationStatus === 'unverified').length,
            substanceNames: substances.map(s => s.name),
            hasSupportPlan: Boolean(plan),
            carePlanStatus: plan?.carePlanStatus || (plan ? 'active' : null),
            reviewDate: plan?.reviewDate || null,
            hasUpcomingReview,
            attentionPriority: attn?.priorityLevel || 'routine',
            attentionScore: attn?.attentionScore || 0,
            attentionReasons: attn?.reasons || [],
            unreadMessagesCount: attn?.unreadMessagesCount || 0,
            unreviewedReportsCount: attn?.unreviewedReportsCount || 0,
          };
        })
        .sort((a, b) => (b.attentionScore - a.attentionScore) || (b.lastLogDate || b.createdAt).localeCompare(a.lastLogDate || a.createdAt));

      // Real computed therapist notifications for Notification Bar & Drawer
      const notifications: Array<{
        id: string;
        type: 'unread_message' | 'new_signup' | 'pending_request' | 'urgent_attention' | 'proposal_update';
        title: string;
        detail: string;
        timestamp: string;
        clientId?: string;
        actionTab?: 'chat' | 'patient_care' | 'users' | 'invitations' | 'innovations';
      }> = [];

      const activeClientIds = new Set(users.map(u => u.id));
      db.messages
        .filter(
          m =>
            m.therapistId === therapistId &&
            activeClientIds.has(m.clientId) &&
            m.senderRole === 'user' &&
            !m.readAt
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 10)
        .forEach(m => {
          notifications.push({
            id: `msg-${m.id}`,
            type: 'unread_message',
            title: `New message from ${m.senderName}`,
            detail: m.text.slice(0, 90),
            timestamp: m.createdAt,
            clientId: m.clientId,
            actionTab: 'chat',
          });
        });

      db.connections
        .filter(c => c.therapistId === therapistId && c.status === 'pending')
        .forEach(c => {
          notifications.push({
            id: `conn-${c.id}`,
            type: 'pending_request',
            title: `Connection request from ${c.clientName}`,
            detail: 'Review and accept into Patient Care',
            timestamp: c.createdAt,
            clientId: c.clientId,
            actionTab: 'invitations',
          });
        });

      signedUpUsers
        .filter(su => !su.isConnected)
        .slice(0, 8)
        .forEach(su => {
          notifications.push({
            id: `su-${su.id}`,
            type: 'new_signup',
            title: `Signed-up user: ${su.name} (@${su.username})`,
            detail: `${su.district} · Ready to add to Patient Care`,
            timestamp: su.createdAt,
            clientId: su.id,
            actionTab: 'users',
          });
        });

      attentionQueue
        .filter(a => a.priorityLevel === 'urgent' || a.priorityLevel === 'follow_up_due')
        .slice(0, 6)
        .forEach(a => {
          notifications.push({
            id: `attn-${a.userId}`,
            type: 'urgent_attention',
            title: `${a.priorityLevel === 'urgent' ? 'Urgent attention' : 'Follow-up due'}: ${a.name}`,
            detail: a.reasons.slice(0, 2).join(' · '),
            timestamp: new Date().toISOString(),
            clientId: a.userId,
            actionTab: 'patient_care',
          });
        });

      db.carePlanProposals
        .filter(
          p =>
            p.therapistId === therapistId &&
            activeClientIds.has(p.userId) &&
            (p.status === 'agreed' || p.status === 'declined' || p.status === 'user_reviewed')
        )
        .slice(0, 5)
        .forEach(p => {
          notifications.push({
            id: `prop-${p.id}`,
            type: 'proposal_update',
            title: `Care Plan v${p.version} (${p.status.replace(/_/g, ' ')})`,
            detail: p.userFeedback || p.title,
            timestamp: p.respondedAt || p.createdAt,
            clientId: p.userId,
            actionTab: 'innovations',
          });
        });

      notifications.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

      const totals = {
        totalUsers: users.length,
        platformSignedUpCount: signedUpUsers.length,
        unassignedSignedUpCount: signedUpUsers.filter(u => !u.isConnected).length,
        activeJourneys: users.filter(
          u => u.logsCount > 0 || u.goalsCount > 0 || u.substancesCount > 0 || u.calendarEventsCount > 0
        ).length,
        totalLogs: users.reduce((acc, u) => acc + u.logsCount, 0),
        unreviewedLogs: users.reduce((acc, u) => acc + u.unreviewedLogsCount, 0),
        totalGoals: users.reduce((acc, u) => acc + u.goalsCount, 0),
        completedGoals: users.reduce((acc, u) => acc + u.completedGoalsCount, 0),
        totalEvents: users.reduce((acc, u) => acc + u.calendarEventsCount, 0),
        unverifiedSubstances: users.reduce((acc, u) => acc + u.unverifiedSubstancesCount, 0),
        youthClientsCount: users.filter(u => u.isYouth).length,
        overdueFollowUpsCount: users.reduce(
          (acc, u) => acc + u.missedEventsCount + u.missedAppointmentsCount,
          0
        ),
        upcomingReviewsCount: users.filter(u => u.hasUpcomingReview).length,
        urgentCount: attentionQueue.filter(a => a.priorityLevel === 'urgent').length,
        unreadMessagesTotal: attentionQueue.reduce((acc, a) => acc + a.unreadMessagesCount, 0),
      };

      const currentTherapist = db.users.find(u => u.id === therapistId);
      res.json({
        users,
        signedUpUsers,
        totals,
        attentionQueue,
        notifications,
        workScope: currentTherapist?.workScope || buildDefaultWorkScope(),
        appControls: db.appControls || buildDefaultAppControls(),
      });
    }
  );

  router.get(
    '/therapist/role1/users/:userId',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const userId = String(req.params.userId || '').trim();
      const db = loadDb();
      const therapistId = req.authUser!.id;
      if (!isAuthorizedTherapistForClient(db, therapistId, userId)) {
        return res.status(403).json({
          error: 'Forbidden: client is not assigned to your caseload or sharing consent was revoked.',
        });
      }
      const clientUser = db.users.find(u => u.id === userId && u.role === 'user');
      if (!clientUser) {
        return res.status(404).json({ error: 'Role 01 user record not found.' });
      }

      const todayIso = new Date().toISOString().split('T')[0];
      const connection =
        db.connections.find(
          c => c.therapistId === therapistId && c.clientId === userId && c.status === 'accepted'
        ) || null;
      const permissionGrant = getActivePermissionGrantForClient(db, therapistId, userId);
      const hasPerm = (category: PermissionCategory) =>
        hasClientPermissionCategory(db, therapistId, userId, category);
      const activePermissions = ALL_PERMISSION_CATEGORIES.filter(cat => hasPerm(cat));
      const withheldCategories = ALL_PERMISSION_CATEGORIES.filter(cat => !hasPerm(cat));

      const dailyLogs = hasPerm('cbt_reflections')
        ? db.role1DailyLogs
            .filter(l => l.userId === userId)
            .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        : [];
      const goals = hasPerm('goals')
        ? db.role1Goals
            .filter(g => g.userId === userId)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        : [];
      const calendarEvents = hasPerm('appointments')
        ? db.role1CalendarEvents
            .filter(e => e.userId === userId)
            .sort((a, b) => a.date.localeCompare(b.date))
        : [];
      const earlyAssessments = hasPerm('screening_results')
        ? db.role1Assessments.filter(a => a.userId === userId)
        : [];
      const substanceConcerns = hasPerm('substances')
        ? db.substanceConcerns.filter(s => s.userId === userId)
        : [];
      const supportPlan = hasPerm('goals')
        ? db.supportPlans.find(p => p.userId === userId) || null
        : null;
      const carePlanRevisions = hasPerm('goals')
        ? db.carePlanRevisions
            .filter(r => r.userId === userId)
            .sort((a, b) => b.version - a.version)
        : [];
      const assignments = hasPerm('assignments')
        ? db.assignments.filter(a => a.clientId === userId && a.therapistId === therapistId)
        : [];
      const weeklyProgress = hasPerm('weekly_reports')
        ? db.weeklyProgress.filter(w => w.clientId === userId)
        : [];
      const appointmentNotes = hasPerm('appointments')
        ? db.appointmentNotes.filter(n => n.clientId === userId && n.therapistId === therapistId)
        : [];
      // Strictly confidential notes scoped ONLY to this clinician, decrypted exclusively on authorized fetch
      const clinicalNotes = db.clinicalNotes
        .filter(n => n.clientId === userId && n.therapistId === therapistId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(n => ({ ...n, content: decryptClinicalText(n.content) }));
      const referrals = db.therapistReferrals
        .filter(r => r.clientId === userId && r.therapistId === therapistId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const messages = db.messages.filter(
        m => m.clientId === userId && m.therapistId === therapistId
      );
      const reports =
        hasPerm('attachments') || hasPerm('screening_results')
          ? db.reports.filter(
              r => r.clientId === userId && r.therapistId === therapistId && r.status !== 'revoked'
            )
          : [];
      const recoveryReports =
        hasPerm('weekly_reports') || hasPerm('screening_results')
          ? db.recoveryReports
              .filter(r => r.userId === userId)
              .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))
          : [];
      const carePlanProposals = hasPerm('goals')
        ? db.carePlanProposals
            .filter(p => p.userId === userId && p.therapistId === therapistId)
            .sort((a, b) => b.version - a.version)
        : [];

      const missedOrOverdueEvents = calendarEvents.filter(e => !e.completed && e.date < todayIso);
      const overdueGoals = goals.filter(g => !g.completed && g.targetDate && g.targetDate < todayIso);
      const pendingAssignments = assignments.filter(
        a => a.status !== 'completed' && a.status !== 'reviewed'
      );
      const missedAssignments = assignments.filter(
        a => a.status === 'not_completed' || (a.dueDate && a.dueDate < todayIso && a.status !== 'completed' && a.status !== 'reviewed')
      );
      const missedAppointments = appointmentNotes.filter(
        n => n.status === 'missed' || (n.status !== 'completed' && n.appointmentDate < todayIso)
      );
      const upcomingAppointments = appointmentNotes.filter(
        n => n.status !== 'completed' && n.status !== 'missed' && (n.appointmentDate >= todayIso || n.followUpReminderDate)
      );
      const recentDifficultDays = dailyLogs.filter(
        l =>
          l.mood === 'heavy' ||
          l.mood === 'challenged' ||
          l.mood === 'difficult' ||
          l.mood === 'restless' ||
          Boolean(l.detailedQuestions?.difficulties && l.detailedQuestions.difficulties.trim())
      ).slice(0, 8);

      const followUpSummary = {
        missedCalendarActivities: missedOrOverdueEvents,
        missedOrOverdueEvents,
        overdueGoals,
        missedAssignments,
        pendingAssignments,
        upcomingAppointments,
        missedAppointments,
        recentDifficultDays,
      };

      const sevenDaysAgoIso = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
      const fourteenDaysAgoIso = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
      const recent7Logs = dailyLogs.filter(l => l.date >= sevenDaysAgoIso);
      const prior7Logs = dailyLogs.filter(l => l.date >= fourteenDaysAgoIso && l.date < sevenDaysAgoIso);
      const unique7dDates = new Set(recent7Logs.map(l => l.date)).size;
      const positiveMoodSet = new Set(['steady', 'hopeful', 'peaceful']);
      const calcPositivePct = (subset: typeof dailyLogs) => {
        const tagged = subset.filter(l => Boolean(l.mood));
        if (tagged.length === 0) return null;
        return Math.round((tagged.filter(l => positiveMoodSet.has(l.mood || '')).length / tagged.length) * 100);
      };
      const completedApptCount = appointmentNotes.filter(a => a.status === 'completed').length;
      const concludedApptCount =
        completedApptCount + appointmentNotes.filter(a => a.status === 'missed').length;
      const completedGoalsCount = goals.filter(g => g.completed).length;
      const completedEventsCount = calendarEvents.filter(e => e.completed).length;

      const measurableIndicators = {
        goalCompletionPct:
          goals.length > 0 ? Math.round((completedGoalsCount / goals.length) * 100) : null,
        completedGoalsCount,
        totalGoalsCount: goals.length,
        checkInConsistency7dPct: hasPerm('cbt_reflections')
          ? Math.min(100, Math.round((unique7dDates / 7) * 100))
          : null,
        uniqueCheckInDays7d: hasPerm('cbt_reflections') ? unique7dDates : 0,
        appointmentAttendancePct:
          concludedApptCount > 0 ? Math.round((completedApptCount / concludedApptCount) * 100) : null,
        completedAppointmentsCount: completedApptCount,
        missedAppointmentsCount: appointmentNotes.filter(a => a.status === 'missed').length,
        calendarCompletionPct:
          calendarEvents.length > 0
            ? Math.round((completedEventsCount / calendarEvents.length) * 100)
            : null,
        moodTrendComparison: {
          recent7dPositivePct: calcPositivePct(recent7Logs),
          prior7dPositivePct: calcPositivePct(prior7Logs),
          recent7dCount: recent7Logs.length,
          prior7dCount: prior7Logs.length,
        },
      };

      const sanitizedProfile = sanitizePublicUser(clientUser);
      if (!hasPerm('background')) {
        sanitizedProfile.ageRange = undefined;
        sanitizedProfile.district = 'Withheld by patient';
        sanitizedProfile.email = undefined;
      }

      res.json({
        profile: sanitizedProfile,
        connection,
        activePermissions,
        withheldCategories,
        permissionGrant: permissionGrant
          ? {
              id: permissionGrant.id,
              accessMode: permissionGrant.accessMode,
              purpose: permissionGrant.purpose,
              authorizedAt: permissionGrant.authorizedAt,
              expiresAt: permissionGrant.expiresAt,
              status: permissionGrant.status,
            }
          : null,
        dailyLogs,
        goals,
        calendarEvents,
        earlyAssessments,
        substanceConcerns,
        supportPlan,
        carePlanRevisions,
        carePlanProposals,
        assignments,
        weeklyProgress,
        appointmentNotes,
        clinicalNotes,
        referrals,
        followUpSummary,
        measurableIndicators,
        messages,
        reports,
        recoveryReports,
      });
    }
  );

  router.patch(
    '/therapist/role1/users/:userId/profile',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const userId = String(req.params.userId || '').trim();
      const db = loadDb();
      if (!isAuthorizedTherapistForClient(db, req.authUser!.id, userId)) {
        return res.status(403).json({ error: 'Forbidden: client is not assigned to your caseload.' });
      }
      const clientUser = db.users.find(u => u.id === userId && u.role === 'user');
      if (!clientUser) {
        return res.status(404).json({ error: 'User not found.' });
      }
      if (typeof req.body?.name === 'string' && req.body.name.trim()) {
        clientUser.name = req.body.name.trim();
        db.connections.forEach(c => {
          if (c.clientId === userId) c.clientName = clientUser.name;
        });
      }
      if (typeof req.body?.district === 'string') {
        clientUser.district = req.body.district.trim();
      }
      if (typeof req.body?.ageRange === 'string' && req.body.ageRange.trim()) {
        clientUser.ageRange = req.body.ageRange.trim();
      }
      clientUser.updatedAt = new Date().toISOString();
      recordActorAudit(
        db,
        req.authUser!,
        'THERAPIST_UPDATED_ROLE1_USER_PROFILE',
        'user',
        userId,
        'Patient Profile',
        `Updated profile details for ${clientUser.name} (@${clientUser.username})`
      );
      saveDb(db);
      res.json({ profile: sanitizePublicUser(clientUser) });
    }
  );

  router.patch(
    '/therapist/role1/users/:userId/logs/:logId/review',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const userId = String(req.params.userId || '').trim();
      const logId = String(req.params.logId || '').trim();
      const note = String(req.body?.clinicianReviewNote || '').trim();
      if (!note) {
        return res.status(400).json({ error: 'Clinician review note cannot be empty.' });
      }
      const db = loadDb();
      if (!isAuthorizedTherapistForClient(db, req.authUser!.id, userId)) {
        return res.status(403).json({ error: 'Forbidden: client is not assigned to your caseload.' });
      }
      const log = db.role1DailyLogs.find(l => l.id === logId && l.userId === userId);
      if (!log) {
        return res.status(404).json({ error: 'Journal log entry not found.' });
      }
      const now = new Date().toISOString();
      log.clinicianReviewNote = note;
      log.reviewedByTherapistName = req.authUser!.name;
      log.reviewedAt = now;
      log.updatedAt = now;
      recordActorAudit(
        db,
        req.authUser!,
        'THERAPIST_REVIEWED_DAILY_LOG',
        'role1_log',
        log.id,
        'Role 01 Daily Log Review',
        `Added clinician guidance on daily log (${log.date}) for client ${userId}`
      );
      saveDb(db);
      emitClientChangeToCareTeam(db, userId, 'role1_state:updated', { source: 'therapist', logId: log.id });
      res.json({ log });
    }
  );

  router.post(
    '/therapist/role1/users/:userId/goals',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const userId = String(req.params.userId || '').trim();
      const title = String(req.body?.title || '').trim();
      if (!title) {
        return res.status(400).json({ error: 'Goal title is required.' });
      }
      const db = loadDb();
      if (!isAuthorizedTherapistForClient(db, req.authUser!.id, userId)) {
        return res.status(403).json({ error: 'Forbidden: client is not assigned to your caseload.' });
      }
      const now = new Date().toISOString();
      const milestoneTitles: string[] = Array.isArray(req.body?.milestones)
        ? req.body.milestones.map(String).map((s: string) => s.trim()).filter(Boolean)
        : [];
      const goal: Role1GoalRecord = {
        id: makeId('goal'),
        userId,
        title,
        description: String(req.body?.description || '').trim(),
        category: String(req.body?.category || 'routine'),
        targetDate: typeof req.body?.targetDate === 'string' && req.body.targetDate ? req.body.targetDate : undefined,
        frequency:
          req.body?.frequency === 'daily' || req.body?.frequency === 'weekly'
            ? req.body.frequency
            : 'custom',
        milestones: milestoneTitles.map(m => ({
          id: makeId('ms'),
          title: m,
          completed: false,
        })),
        progressNotes: [],
        completed: false,
        createdAt: now,
        createdByRole: 'therapist',
        updatedByRole: 'therapist',
        updatedByTherapistName: req.authUser!.name,
        therapistChangeNote: typeof req.body?.therapistChangeNote === 'string' ? req.body.therapistChangeNote.trim() : undefined,
        updatedAt: now,
      };
      db.role1Goals.unshift(goal);
      recordActorAudit(
        db,
        req.authUser!,
        'THERAPIST_CREATED_ROLE1_GOAL',
        'role1_goal',
        goal.id,
        'Role 01 Goals',
        `Created Role 01 goal "${title}" for client ${userId}`
      );
      saveDb(db);
      emitClientChangeToCareTeam(db, userId, 'goal:updated', { goalId: goal.id, action: 'created' });
      res.status(201).json({ goal });
    }
  );

  router.patch(
    '/therapist/role1/users/:userId/goals/:goalId',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const userId = String(req.params.userId || '').trim();
      const goalId = String(req.params.goalId || '').trim();
      const db = loadDb();
      if (!isAuthorizedTherapistForClient(db, req.authUser!.id, userId)) {
        return res.status(403).json({ error: 'Forbidden: client is not assigned to your caseload.' });
      }
      const goal = db.role1Goals.find(g => g.id === goalId && g.userId === userId);
      if (!goal) {
        return res.status(404).json({ error: 'Goal not found.' });
      }
      const now = new Date().toISOString();
      if (typeof req.body?.title === 'string' && req.body.title.trim()) {
        goal.title = req.body.title.trim();
      }
      if (typeof req.body?.description === 'string') {
        goal.description = req.body.description.trim();
      }
      if (typeof req.body?.category === 'string' && req.body.category.trim()) {
        goal.category = req.body.category.trim();
      }
      if (typeof req.body?.targetDate === 'string') {
        goal.targetDate = req.body.targetDate.trim() || undefined;
      }
      if (
        req.body?.frequency === 'daily' ||
        req.body?.frequency === 'weekly' ||
        req.body?.frequency === 'custom'
      ) {
        goal.frequency = req.body.frequency;
      }
      if (typeof req.body?.completed === 'boolean') {
        goal.completed = req.body.completed;
      }
      if (typeof req.body?.toggleMilestoneId === 'string') {
        goal.milestones = goal.milestones.map(m =>
          m.id === req.body.toggleMilestoneId ? { ...m, completed: !m.completed } : m
        );
        if (goal.milestones.length > 0 && goal.milestones.every(m => m.completed)) {
          goal.completed = true;
        }
      }
      if (typeof req.body?.addMilestoneTitle === 'string' && req.body.addMilestoneTitle.trim()) {
        goal.milestones.push({
          id: makeId('ms'),
          title: req.body.addMilestoneTitle.trim(),
          completed: false,
        });
      }
      if (typeof req.body?.addProgressNote === 'string' && req.body.addProgressNote.trim()) {
        goal.progressNotes.unshift({
          id: makeId('gnote'),
          date: now.split('T')[0],
          note: `${req.authUser!.name}: ${req.body.addProgressNote.trim()}`,
        });
      }
      goal.updatedByRole = 'therapist';
      goal.updatedByTherapistName = req.authUser!.name;
      if (typeof req.body?.therapistChangeNote === 'string' && req.body.therapistChangeNote.trim()) {
        goal.therapistChangeNote = req.body.therapistChangeNote.trim();
      }
      goal.updatedAt = now;
      recordActorAudit(
        db,
        req.authUser!,
        'THERAPIST_UPDATED_ROLE1_GOAL',
        'role1_goal',
        goal.id,
        'Role 01 Goals',
        `Updated goal "${goal.title}" (completed: ${goal.completed}) for client ${userId}`
      );
      saveDb(db);
      emitClientChangeToCareTeam(db, userId, 'goal:updated', { goalId: goal.id, action: 'updated' });
      res.json({ goal });
    }
  );

  router.delete(
    '/therapist/role1/users/:userId/goals/:goalId',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const userId = String(req.params.userId || '').trim();
      const goalId = String(req.params.goalId || '').trim();
      const db = loadDb();
      if (!isAuthorizedTherapistForClient(db, req.authUser!.id, userId)) {
        return res.status(403).json({ error: 'Forbidden: client is not assigned to your caseload.' });
      }
      const existing = db.role1Goals.find(g => g.id === goalId && g.userId === userId);
      if (!existing) {
        return res.status(404).json({ error: 'Goal not found.' });
      }
      db.role1Goals = db.role1Goals.filter(g => !(g.id === goalId && g.userId === userId));
      recordActorAudit(
        db,
        req.authUser!,
        'THERAPIST_DELETED_ROLE1_GOAL',
        'role1_goal',
        goalId,
        'Role 01 Goals',
        `Removed goal "${existing.title}" for client ${userId}`
      );
      saveDb(db);
      res.json({ ok: true });
    }
  );

  router.post(
    '/therapist/role1/users/:userId/calendar',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const userId = String(req.params.userId || '').trim();
      const title = String(req.body?.title || '').trim();
      const date = String(req.body?.date || new Date().toISOString().split('T')[0]).trim();
      if (!title || !date) {
        return res.status(400).json({ error: 'Event title and date are required.' });
      }
      const db = loadDb();
      if (!isAuthorizedTherapistForClient(db, req.authUser!.id, userId)) {
        return res.status(403).json({ error: 'Forbidden: client is not assigned to your caseload.' });
      }
      const now = new Date().toISOString();
      const event: Role1CalendarEventRecord = {
        id: makeId('evt'),
        userId,
        title,
        date,
        startTime: typeof req.body?.startTime === 'string' && req.body.startTime ? req.body.startTime : undefined,
        endTime: typeof req.body?.endTime === 'string' && req.body.endTime ? req.body.endTime : undefined,
        category: String(req.body?.category || 'appointment'),
        notes: typeof req.body?.notes === 'string' ? req.body.notes.trim() : undefined,
        reminder: req.body?.reminder !== false,
        completed: Boolean(req.body?.completed),
        createdByRole: 'therapist',
        updatedByRole: 'therapist',
        updatedByTherapistName: req.authUser!.name,
        therapistChangeNote: typeof req.body?.therapistChangeNote === 'string' ? req.body.therapistChangeNote.trim() : undefined,
        updatedAt: now,
      };
      db.role1CalendarEvents.push(event);
      recordActorAudit(
        db,
        req.authUser!,
        'THERAPIST_ADDED_ROLE1_CALENDAR_EVENT',
        'role1_event',
        event.id,
        'Role 01 Calendar',
        `Scheduled "${title}" on ${date} for client ${userId}`
      );
      saveDb(db);
      emitClientChangeToCareTeam(db, userId, 'role1_state:updated', { eventId: event.id, action: 'created' });
      res.status(201).json({ event });
    }
  );

  router.patch(
    '/therapist/role1/users/:userId/calendar/:eventId',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const userId = String(req.params.userId || '').trim();
      const eventId = String(req.params.eventId || '').trim();
      const db = loadDb();
      if (!isAuthorizedTherapistForClient(db, req.authUser!.id, userId)) {
        return res.status(403).json({ error: 'Forbidden: client is not assigned to your caseload.' });
      }
      const event = db.role1CalendarEvents.find(e => e.id === eventId && e.userId === userId);
      if (!event) {
        return res.status(404).json({ error: 'Calendar event not found.' });
      }
      if (typeof req.body?.title === 'string' && req.body.title.trim()) {
        event.title = req.body.title.trim();
      }
      if (typeof req.body?.date === 'string' && req.body.date.trim()) {
        event.date = req.body.date.trim();
      }
      if (typeof req.body?.startTime === 'string') {
        event.startTime = req.body.startTime.trim() || undefined;
      }
      if (typeof req.body?.endTime === 'string') {
        event.endTime = req.body.endTime.trim() || undefined;
      }
      if (typeof req.body?.category === 'string' && req.body.category.trim()) {
        event.category = req.body.category.trim();
      }
      if (typeof req.body?.notes === 'string') {
        event.notes = req.body.notes.trim();
      }
      if (typeof req.body?.completed === 'boolean') {
        event.completed = req.body.completed;
      }
      event.updatedByRole = 'therapist';
      event.updatedByTherapistName = req.authUser!.name;
      if (typeof req.body?.therapistChangeNote === 'string' && req.body.therapistChangeNote.trim()) {
        event.therapistChangeNote = req.body.therapistChangeNote.trim();
      }
      event.updatedAt = new Date().toISOString();
      recordActorAudit(
        db,
        req.authUser!,
        'THERAPIST_UPDATED_ROLE1_CALENDAR_EVENT',
        'role1_event',
        event.id,
        'Role 01 Calendar',
        `Updated event "${event.title}" (${event.date}, completed: ${event.completed}) for client ${userId}`
      );
      saveDb(db);
      res.json({ event });
    }
  );

  router.delete(
    '/therapist/role1/users/:userId/calendar/:eventId',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const userId = String(req.params.userId || '').trim();
      const eventId = String(req.params.eventId || '').trim();
      const db = loadDb();
      if (!isAuthorizedTherapistForClient(db, req.authUser!.id, userId)) {
        return res.status(403).json({ error: 'Forbidden: client is not assigned to your caseload.' });
      }
      const existing = db.role1CalendarEvents.find(e => e.id === eventId && e.userId === userId);
      if (!existing) {
        return res.status(404).json({ error: 'Calendar event not found.' });
      }
      db.role1CalendarEvents = db.role1CalendarEvents.filter(
        e => !(e.id === eventId && e.userId === userId)
      );
      recordActorAudit(
        db,
        req.authUser!,
        'THERAPIST_DELETED_ROLE1_CALENDAR_EVENT',
        'role1_event',
        eventId,
        'Role 01 Calendar',
        `Deleted event "${existing.title}" for client ${userId}`
      );
      saveDb(db);
      res.json({ ok: true });
    }
  );

  router.put(
    '/therapist/role1/users/:userId/plan',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const userId = String(req.params.userId || '').trim();
      const db = loadDb();
      if (!isAuthorizedTherapistForClient(db, req.authUser!.id, userId)) {
        return res.status(403).json({ error: 'Forbidden: client is not assigned to your caseload.' });
      }
      const now = new Date().toISOString();
      let plan = db.supportPlans.find(p => p.userId === userId);
      const selectedPaths = Array.isArray(req.body?.selectedPaths)
        ? req.body.selectedPaths.map(String)
        : plan?.selectedPaths || ['guided_cbt', 'weekly_review'];
      const objectives = Array.isArray(req.body?.objectives)
        ? req.body.objectives.map(String).map((s: string) => s.trim()).filter(Boolean)
        : plan?.objectives || [];
      const approaches = Array.isArray(req.body?.approaches)
        ? req.body.approaches.map(String).map((s: string) => s.trim()).filter(Boolean)
        : plan?.approaches || [];
      const supportNeeds = Array.isArray(req.body?.supportNeeds)
        ? req.body.supportNeeds.map(String).map((s: string) => s.trim()).filter(Boolean)
        : plan?.supportNeeds || [];
      const interventions = Array.isArray(req.body?.interventions)
        ? req.body.interventions.map(String).map((s: string) => s.trim()).filter(Boolean)
        : plan?.interventions || [];
      const nextSteps = Array.isArray(req.body?.nextSteps)
        ? req.body.nextSteps.map(String).map((s: string) => s.trim()).filter(Boolean)
        : plan?.nextSteps || [];
      const professionalGuidance =
        typeof req.body?.professionalGuidance === 'string'
          ? req.body.professionalGuidance.trim()
          : plan?.professionalGuidance;
      const progressObservations =
        typeof req.body?.progressObservations === 'string'
          ? req.body.progressObservations.trim()
          : plan?.progressObservations;
      const responsibleTherapistName =
        typeof req.body?.responsibleTherapistName === 'string' && req.body.responsibleTherapistName.trim()
          ? req.body.responsibleTherapistName.trim()
          : plan?.responsibleTherapistName || req.authUser!.name;
      const carePlanStatus =
        req.body?.carePlanStatus === 'active' ||
        req.body?.carePlanStatus === 'under_review' ||
        req.body?.carePlanStatus === 'paused' ||
        req.body?.carePlanStatus === 'completed'
          ? req.body.carePlanStatus
          : plan?.carePlanStatus || 'active';
      const nextFollowUpDate =
        typeof req.body?.nextFollowUpDate === 'string'
          ? req.body.nextFollowUpDate.trim() || undefined
          : plan?.nextFollowUpDate;
      const reviewDate =
        typeof req.body?.reviewDate === 'string' && req.body.reviewDate.trim()
          ? req.body.reviewDate.trim()
          : plan?.reviewDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

      // Preserve revision history snapshot cleanly without overwriting prior records
      const prevVersion = db.carePlanRevisions
        .filter(r => r.userId === userId)
        .reduce((max, r) => Math.max(max, r.version), 0);

      if (plan) {
        const snapshotCopy = JSON.parse(JSON.stringify(plan));
        const rev: CarePlanRevisionRecord = {
          id: makeId('cprev'),
          userId,
          version: prevVersion + 1,
          changedById: req.authUser!.id,
          changedByName: req.authUser!.name,
          changedByRole: 'therapist',
          summary: String(req.body?.revisionNote || `Updated care plan (${carePlanStatus}) · objectives (${objectives.length}), interventions (${interventions.length}), review ${reviewDate}`).trim(),
          snapshot: snapshotCopy,
          createdAt: now,
        };
        db.carePlanRevisions.unshift(rev);
        plan.selectedPaths = selectedPaths;
        plan.objectives = objectives;
        plan.approaches = approaches;
        plan.supportNeeds = supportNeeds;
        plan.interventions = interventions;
        plan.nextSteps = nextSteps;
        plan.professionalGuidance = professionalGuidance;
        plan.progressObservations = progressObservations;
        plan.responsibleTherapistName = responsibleTherapistName;
        plan.carePlanStatus = carePlanStatus;
        plan.nextFollowUpDate = nextFollowUpDate;
        plan.reviewDate = reviewDate;
        plan.updatedAt = now;
      } else {
        plan = {
          id: makeId('splan'),
          userId,
          selectedPaths,
          pathwayReasons: [],
          objectives,
          approaches,
          supportNeeds,
          interventions,
          educationalActivities: [],
          userDefinedActivities: [],
          professionalGuidance,
          progressObservations,
          responsibleTherapistName,
          carePlanStatus,
          nextFollowUpDate,
          nextSteps,
          reviewDate,
          updatedAt: now,
        };
        db.supportPlans.unshift(plan);
        db.carePlanRevisions.unshift({
          id: makeId('cprev'),
          userId,
          version: 1,
          changedById: req.authUser!.id,
          changedByName: req.authUser!.name,
          changedByRole: 'therapist',
          summary: 'Initial clinician support plan created',
          snapshot: JSON.parse(JSON.stringify(plan)),
          createdAt: now,
        });
      }

      recordActorAudit(
        db,
        req.authUser!,
        'THERAPIST_UPDATED_SUPPORT_PLAN',
        'support_plan',
        plan.id,
        'Role 01 Support Plan',
        `Saved support plan revision for client ${userId} (status: ${carePlanStatus}, review date: ${reviewDate})`
      );
      saveDb(db);
      emitClientChangeToCareTeam(db, userId, 'support_plan:updated', { planId: plan.id });
      const carePlanRevisions = db.carePlanRevisions
        .filter(r => r.userId === userId)
        .sort((a, b) => b.version - a.version);
      res.json({ supportPlan: plan, carePlanRevisions });
    }
  );

  // Structured Recovery Coordination Protocol (Innovation C): Versioned 2-Way Care Plan Proposals
  const createProposalHandler = (req: AuthedRequest, res: Response) => {
    const userId = String(req.params.userId || req.body?.userId || req.body?.clientId || '').trim();
    const title = String(req.body?.title || 'Collaborative Routine & Care Update').trim();
    const objectives = Array.isArray(req.body?.objectives)
      ? req.body.objectives.map(String).map((s: string) => s.trim()).filter(Boolean)
      : [];
    const routines = Array.isArray(req.body?.routines)
      ? req.body.routines.map(String).map((s: string) => s.trim()).filter(Boolean)
      : [];
    const recommendations = Array.isArray(req.body?.recommendations)
      ? req.body.recommendations.map(String).map((s: string) => s.trim()).filter(Boolean)
      : [];
    const rationale = typeof req.body?.rationale === 'string' ? req.body.rationale.trim() : undefined;
    const nextFollowUpDate =
      typeof req.body?.nextFollowUpDate === 'string' && req.body.nextFollowUpDate.trim()
        ? req.body.nextFollowUpDate.trim()
        : undefined;
    const reviewDate =
      typeof req.body?.reviewDate === 'string' && req.body.reviewDate.trim()
        ? req.body.reviewDate.trim()
        : new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    if (!userId || (objectives.length === 0 && routines.length === 0 && recommendations.length === 0)) {
      return res.status(400).json({
        error: 'Client ID and at least one proposed objective, routine, or clinician recommendation are required.',
      });
    }
    const db = loadDb();
    if (!isAuthorizedTherapistForClient(db, req.authUser!.id, userId)) {
      return res.status(403).json({ error: 'Forbidden: client is not assigned to your caseload.' });
    }
    const now = new Date().toISOString();
    const prevVersion = db.carePlanProposals
      .filter(p => p.userId === userId)
      .reduce((max, p) => Math.max(max, p.version), 0);

    const proposal: CarePlanProposalRecord = {
      id: makeId('cprop'),
      userId,
      therapistId: req.authUser!.id,
      therapistName: req.authUser!.name,
      version: prevVersion + 1,
      title,
      objectives,
      routines,
      recommendations,
      nextFollowUpDate,
      reviewDate,
      rationale,
      status: 'proposed',
      createdAt: now,
      updatedAt: now,
    };
    db.carePlanProposals.unshift(proposal);
    recordActorAudit(
      db,
      req.authUser!,
      'THERAPIST_PROPOSED_CARE_PLAN',
      'care_plan_proposal',
      proposal.id,
      'Structured Recovery Coordination Protocol',
      `Proposed v${proposal.version} care plan "${title}" for client ${userId}`
    );
    saveDb(db);
    emitRealtimeEvent({
      event: 'plan_proposal:updated',
      payload: { proposalId: proposal.id, clientId: userId, therapistId: req.authUser!.id, status: proposal.status },
      targetUserIds: [userId, req.authUser!.id],
    });
    return res.status(201).json({ proposal });
  };

  router.post(
    '/therapist/role1/users/:userId/plan-proposals',
    requireAuth,
    requireApprovedTherapist,
    createProposalHandler
  );

  router.post(
    '/care/plan-proposals',
    requireAuth,
    requireApprovedTherapist,
    createProposalHandler
  );

  router.get('/care/plan-proposals', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const user = req.authUser!;
    if (user.role === 'user') {
      const proposals = db.carePlanProposals
        .filter(p => p.userId === user.id)
        .sort((a, b) => b.version - a.version);
      return res.json({ proposals });
    }
    if (user.role === 'therapist' && user.verificationStatus === 'approved') {
      const filterClientId = req.query.userId ? String(req.query.userId).trim() : null;
      const proposals = db.carePlanProposals
        .filter(
          p =>
            p.therapistId === user.id &&
            isAuthorizedTherapistForClient(db, user.id, p.userId) &&
            (!filterClientId || p.userId === filterClientId)
        )
        .sort((a, b) => b.version - a.version);
      return res.json({ proposals });
    }
    return res.status(403).json({ error: 'Forbidden.' });
  });

  router.patch(
    '/care/plan-proposals/:id/respond',
    requireAuth,
    requireRole(['user']),
    (req: AuthedRequest, res: Response) => {
      const nextStatus = String(req.body?.status || '').trim() as CarePlanProposalStatus;
      const allowedStatuses: CarePlanProposalStatus[] = [
        'user_reviewed',
        'acknowledged',
        'agreed',
        'active',
        'declined',
      ];
      if (!allowedStatuses.includes(nextStatus)) {
        return res.status(400).json({
          error: 'Status must be user_reviewed, acknowledged, agreed, active, or declined.',
        });
      }

      const db = loadDb();
      const proposal = db.carePlanProposals.find(
        p => p.id === req.params.id && p.userId === req.authUser!.id
      );
      if (!proposal) {
        return res.status(404).json({ error: 'Care plan proposal not found.' });
      }

      const now = new Date().toISOString();
      proposal.status = nextStatus;
      if (typeof req.body?.userFeedback === 'string') {
        proposal.userFeedback = req.body.userFeedback.trim();
      }
      proposal.respondedAt = now;
      proposal.updatedAt = now;

      let updatedPlan = db.supportPlans.find(p => p.userId === proposal.userId) || null;
      if (nextStatus === 'agreed' || nextStatus === 'active') {
        const mergedObjectives = Array.from(
          new Set([...(updatedPlan?.objectives || []), ...proposal.objectives])
        );
        const mergedInterventions = Array.from(
          new Set([...(updatedPlan?.interventions || []), ...proposal.routines])
        );
        const mergedNextSteps = Array.from(
          new Set([...(updatedPlan?.nextSteps || []), ...proposal.recommendations])
        );
        const guidanceSummary =
          proposal.recommendations.length > 0
            ? proposal.recommendations.join(' · ')
            : updatedPlan?.professionalGuidance;

        if (updatedPlan) {
          const prevVersion = db.carePlanRevisions
            .filter(r => r.userId === proposal.userId)
            .reduce((max, r) => Math.max(max, r.version), 0);
          db.carePlanRevisions.unshift({
            id: makeId('cprev'),
            userId: proposal.userId,
            version: prevVersion + 1,
            changedById: req.authUser!.id,
            changedByName: req.authUser!.name,
            changedByRole: 'user',
            summary: `User ${nextStatus} collaborative plan v${proposal.version}: ${proposal.title}`,
            snapshot: JSON.parse(JSON.stringify(updatedPlan)),
            createdAt: now,
          });
          updatedPlan.objectives = mergedObjectives;
          updatedPlan.interventions = mergedInterventions;
          updatedPlan.nextSteps = mergedNextSteps;
          updatedPlan.professionalGuidance = guidanceSummary;
          updatedPlan.responsibleTherapistName = proposal.therapistName;
          updatedPlan.nextFollowUpDate = proposal.nextFollowUpDate || updatedPlan.nextFollowUpDate;
          updatedPlan.reviewDate = proposal.reviewDate || updatedPlan.reviewDate;
          updatedPlan.carePlanStatus = 'active';
          updatedPlan.updatedAt = now;
        } else {
          updatedPlan = {
            id: makeId('splan'),
            userId: proposal.userId,
            selectedPaths: ['guided_cbt', 'weekly_review'],
            pathwayReasons: [],
            objectives: mergedObjectives,
            approaches: ['Collaborative Routine Plan'],
            supportNeeds: [],
            interventions: mergedInterventions,
            educationalActivities: [],
            professionalGuidance: guidanceSummary,
            responsibleTherapistName: proposal.therapistName,
            carePlanStatus: 'active',
            nextFollowUpDate: proposal.nextFollowUpDate,
            userDefinedActivities: proposal.routines,
            nextSteps: mergedNextSteps,
            reviewDate: proposal.reviewDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
            updatedAt: now,
          };
          db.supportPlans.unshift(updatedPlan);
          db.carePlanRevisions.unshift({
            id: makeId('cprev'),
            userId: proposal.userId,
            version: 1,
            changedById: req.authUser!.id,
            changedByName: req.authUser!.name,
            changedByRole: 'user',
            summary: `Activated collaborative plan v${proposal.version}: ${proposal.title}`,
            snapshot: JSON.parse(JSON.stringify(updatedPlan)),
            createdAt: now,
          });
        }
      }

      recordActorAudit(
        db,
        req.authUser!,
        'USER_RESPONDED_CARE_PLAN_PROPOSAL',
        'care_plan_proposal',
        proposal.id,
        'Structured Recovery Coordination Protocol',
        `Client marked proposal v${proposal.version} as ${nextStatus}`
      );
      saveDb(db);
      emitRealtimeEvent({
        event: 'plan_proposal:updated',
        payload: {
          proposalId: proposal.id,
          clientId: proposal.userId,
          therapistId: proposal.therapistId,
          status: proposal.status,
        },
        targetUserIds: [proposal.userId, proposal.therapistId],
      });
      if (updatedPlan) {
        emitClientChangeToCareTeam(db, proposal.userId, 'support_plan:updated', { planId: updatedPlan.id });
      }
      return res.json({ proposal, supportPlan: updatedPlan });
    }
  );

  router.post(
    '/therapist/role1/users/:userId/substances',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const userId = String(req.params.userId || '').trim();
      const name = String(req.body?.name || '').trim();
      if (!name) {
        return res.status(400).json({ error: 'Substance or habit name is required.' });
      }
      const db = loadDb();
      if (!isAuthorizedTherapistForClient(db, req.authUser!.id, userId)) {
        return res.status(403).json({ error: 'Forbidden: client is not assigned to your caseload.' });
      }
      if (!hasClientPermissionCategory(db, req.authUser!.id, userId, 'substances')) {
        return res.status(403).json({ error: 'Withheld by patient privacy settings: substance category is not shared.' });
      }
      const now = new Date().toISOString();
      const concern = {
        id: makeId('subc'),
        userId,
        catalogueId: req.body?.catalogueId ? String(req.body.catalogueId) : 'custom',
        name,
        isCustom: !req.body?.catalogueId || req.body.catalogueId === 'custom',
        customOriginalText: name,
        verificationStatus: 'clinician_reviewed' as const,
        clinicianReviewNote: String(req.body?.clinicianReviewNote || 'Recorded by clinician.').trim(),
        reviewedByTherapistName: req.authUser!.name,
        reviewedAt: now,
        isMedication: Boolean(req.body?.isMedication),
        createdAt: now,
        updatedAt: now,
      };
      db.substanceConcerns.unshift(concern);
      recordActorAudit(
        db,
        req.authUser!,
        'THERAPIST_ADDED_SUBSTANCE_CONCERN',
        'substance_concern',
        concern.id,
        'Substance Clarification',
        `Recorded substance entry "${name}" for client ${userId}`
      );
      saveDb(db);
      res.status(201).json({ concern });
    }
  );

  router.patch(
    '/therapist/role1/users/:userId/substances/:concernId',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const userId = String(req.params.userId || '').trim();
      const concernId = String(req.params.concernId || '').trim();
      const note = String(req.body?.clinicianReviewNote || '').trim();
      if (!note) {
        return res.status(400).json({ error: 'Clinician clarification note is required.' });
      }
      const db = loadDb();
      if (!isAuthorizedTherapistForClient(db, req.authUser!.id, userId)) {
        return res.status(403).json({ error: 'Forbidden: client is not assigned to your caseload.' });
      }
      if (!hasClientPermissionCategory(db, req.authUser!.id, userId, 'substances')) {
        return res.status(403).json({ error: 'Forbidden: client withheld substance section sharing.' });
      }
      const concern = db.substanceConcerns.find(s => s.id === concernId && s.userId === userId);
      if (!concern) {
        return res.status(404).json({ error: 'Substance concern entry not found.' });
      }
      const now = new Date().toISOString();
      concern.verificationStatus = 'clinician_reviewed';
      concern.clinicianReviewNote = note;
      concern.reviewedByTherapistName = req.authUser!.name;
      concern.reviewedAt = now;
      concern.updatedAt = now;
      recordActorAudit(
        db,
        req.authUser!,
        'THERAPIST_REVIEWED_SUBSTANCE_ENTRY',
        'substance_concern',
        concern.id,
        'Substance Clarification',
        `Clarified substance entry "${concern.name}" for client ${userId}`
      );
      saveDb(db);
      res.json({ concern });
    }
  );

  // Confidential Therapist-Only Clinical Notes Vault (NEVER exposed to Role 01 users, Admins, or Community Builders)
  const VALID_CLINICAL_NOTE_TYPES: ClinicalNoteType[] = [
    'session',
    'follow_up',
    'observation',
    'assessment',
    'care_plan_discussion',
    'referral',
    'safeguarding',
  ];

  router.get(
    '/therapist/role1/users/:userId/clinical-notes',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const userId = String(req.params.userId || '').trim();
      const db = loadDb();
      if (!isAuthorizedTherapistForClient(db, req.authUser!.id, userId)) {
        return res.status(403).json({ error: 'Forbidden: client is not assigned to your caseload.' });
      }
      const notes = db.clinicalNotes
        .filter(n => n.clientId === userId && n.therapistId === req.authUser!.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map(n => ({ ...n, content: decryptClinicalText(n.content) }));
      res.json({ notes });
    }
  );

  router.post(
    '/therapist/role1/users/:userId/clinical-notes',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const userId = String(req.params.userId || '').trim();
      const rawType = String(req.body?.noteType || 'session').trim() as ClinicalNoteType;
      const noteType = VALID_CLINICAL_NOTE_TYPES.includes(rawType) ? rawType : 'session';
      const title = String(req.body?.title || '').trim() || `${noteType.replace(/_/g, ' ')} note`;
      const content = String(req.body?.content || '').trim();
      const followUpDate = typeof req.body?.followUpDate === 'string' && req.body.followUpDate.trim()
        ? req.body.followUpDate.trim()
        : undefined;
      if (!content) {
        return res.status(400).json({ error: 'Clinical note content is required.' });
      }
      const db = loadDb();
      if (!isAuthorizedTherapistForClient(db, req.authUser!.id, userId)) {
        return res.status(403).json({ error: 'Forbidden: client is not assigned to your caseload.' });
      }
      const now = new Date().toISOString();
      const storedNote: TherapistClinicalNote = {
        id: makeId('cnote'),
        clientId: userId,
        therapistId: req.authUser!.id,
        therapistName: req.authUser!.name,
        modifiedByName: req.authUser!.name,
        noteType,
        title,
        content: encryptClinicalText(content),
        followUpDate,
        createdAt: now,
        updatedAt: now,
      };
      db.clinicalNotes.unshift(storedNote);
      // Metadata-only audit log: NEVER record private note prose in audit trail
      recordActorAudit(
        db,
        req.authUser!,
        'THERAPIST_CREATED_CONFIDENTIAL_NOTE',
        'clinical_note',
        storedNote.id,
        'Confidential Clinical Notes',
        `Saved encrypted confidential ${noteType} note for client ${userId} (content private)`
      );
      saveDb(db);
      res.status(201).json({ note: { ...storedNote, content } });
    }
  );

  router.patch(
    '/therapist/role1/users/:userId/clinical-notes/:noteId',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const userId = String(req.params.userId || '').trim();
      const noteId = String(req.params.noteId || '').trim();
      const db = loadDb();
      if (!isAuthorizedTherapistForClient(db, req.authUser!.id, userId)) {
        return res.status(403).json({ error: 'Forbidden.' });
      }
      const note = db.clinicalNotes.find(
        n => n.id === noteId && n.clientId === userId && n.therapistId === req.authUser!.id
      );
      if (!note) {
        return res.status(404).json({ error: 'Confidential note not found.' });
      }
      if (typeof req.body?.title === 'string' && req.body.title.trim()) {
        note.title = req.body.title.trim();
      }
      if (typeof req.body?.content === 'string' && req.body.content.trim()) {
        note.content = encryptClinicalText(req.body.content.trim());
      }
      if (req.body?.noteType && VALID_CLINICAL_NOTE_TYPES.includes(req.body.noteType)) {
        note.noteType = req.body.noteType;
      }
      if (typeof req.body?.followUpDate === 'string') {
        note.followUpDate = req.body.followUpDate.trim() || undefined;
      }
      note.modifiedByName = req.authUser!.name;
      note.updatedAt = new Date().toISOString();
      recordActorAudit(
        db,
        req.authUser!,
        'THERAPIST_UPDATED_CONFIDENTIAL_NOTE',
        'clinical_note',
        note.id,
        'Confidential Clinical Notes',
        `Updated encrypted confidential ${note.noteType} note for client ${userId} (content private)`
      );
      saveDb(db);
      res.json({ note: { ...note, content: decryptClinicalText(note.content) } });
    }
  );

  router.delete(
    '/therapist/role1/users/:userId/clinical-notes/:noteId',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const userId = String(req.params.userId || '').trim();
      const noteId = String(req.params.noteId || '').trim();
      const db = loadDb();
      if (!isAuthorizedTherapistForClient(db, req.authUser!.id, userId)) {
        return res.status(403).json({ error: 'Forbidden.' });
      }
      const before = db.clinicalNotes.length;
      db.clinicalNotes = db.clinicalNotes.filter(
        n => !(n.id === noteId && n.clientId === userId && n.therapistId === req.authUser!.id)
      );
      if (db.clinicalNotes.length === before) {
        return res.status(404).json({ error: 'Confidential note not found.' });
      }
      recordActorAudit(
        db,
        req.authUser!,
        'THERAPIST_DELETED_CONFIDENTIAL_NOTE',
        'clinical_note',
        noteId,
        'Confidential Clinical Notes',
        `Removed confidential note for client ${userId}`
      );
      saveDb(db);
      res.json({ ok: true });
    }
  );

  // Referrals & Urgent Escalation Tracking
  const VALID_REFERRAL_CATEGORIES: ReferralCategory[] = [
    'mental_health',
    'de_addiction',
    'medical',
    'rehab',
    'family_support',
    'emergency',
  ];

  router.post(
    '/therapist/role1/users/:userId/referrals',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const userId = String(req.params.userId || '').trim();
      const serviceName = String(req.body?.serviceName || '').trim();
      const reason = String(req.body?.reason || '').trim();
      const urgency =
        req.body?.urgency === 'urgent_escalation' || req.body?.urgency === 'priority'
          ? req.body.urgency
          : 'routine';
      const rawCat = String(req.body?.referralCategory || 'de_addiction') as ReferralCategory;
      const referralCategory = VALID_REFERRAL_CATEGORIES.includes(rawCat) ? rawCat : 'de_addiction';
      if (!serviceName || !reason) {
        return res.status(400).json({ error: 'Service name and clinical reason are required.' });
      }
      const db = loadDb();
      if (!isAuthorizedTherapistForClient(db, req.authUser!.id, userId)) {
        return res.status(403).json({ error: 'Forbidden: client is not assigned to your caseload.' });
      }
      const now = new Date().toISOString();
      const referral: TherapistReferralRecord = {
        id: makeId('ref'),
        clientId: userId,
        therapistId: req.authUser!.id,
        therapistName: req.authUser!.name,
        urgency,
        referralCategory,
        referralDate:
          typeof req.body?.referralDate === 'string' && req.body.referralDate.trim()
            ? req.body.referralDate.trim()
            : now.split('T')[0],
        serviceName,
        reason,
        status: 'recommended',
        followUpNotes: typeof req.body?.followUpNotes === 'string' ? req.body.followUpNotes.trim() : undefined,
        createdAt: now,
        updatedAt: now,
      };
      db.therapistReferrals.unshift(referral);
      recordActorAudit(
        db,
        req.authUser!,
        'THERAPIST_CREATED_REFERRAL',
        'referral',
        referral.id,
        'Referrals & Escalation',
        `Created ${urgency} (${referralCategory}) referral to "${serviceName}" for client ${userId}`
      );
      saveDb(db);
      res.status(201).json({ referral });
    }
  );

  router.patch(
    '/therapist/role1/users/:userId/referrals/:referralId',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const userId = String(req.params.userId || '').trim();
      const referralId = String(req.params.referralId || '').trim();
      const db = loadDb();
      if (!isAuthorizedTherapistForClient(db, req.authUser!.id, userId)) {
        return res.status(403).json({ error: 'Forbidden.' });
      }
      const referral = db.therapistReferrals.find(
        r => r.id === referralId && r.clientId === userId && r.therapistId === req.authUser!.id
      );
      if (!referral) {
        return res.status(404).json({ error: 'Referral record not found.' });
      }
      if (
        req.body?.status === 'recommended' ||
        req.body?.status === 'scheduled' ||
        req.body?.status === 'completed' ||
        req.body?.status === 'declined'
      ) {
        referral.status = req.body.status;
      }
      if (req.body?.referralCategory && VALID_REFERRAL_CATEGORIES.includes(req.body.referralCategory)) {
        referral.referralCategory = req.body.referralCategory;
      }
      if (typeof req.body?.followUpNotes === 'string') {
        referral.followUpNotes = req.body.followUpNotes.trim();
      }
      referral.updatedAt = new Date().toISOString();
      recordActorAudit(
        db,
        req.authUser!,
        'THERAPIST_UPDATED_REFERRAL',
        'referral',
        referral.id,
        'Referrals & Escalation',
        `Updated referral "${referral.serviceName}" status to ${referral.status} for client ${userId}`
      );
      saveDb(db);
      res.json({ referral });
    }
  );

  router.post(
    '/therapist/connections/:id/revoke',
    requireAuth,
    requireRole(['user']),
    (req: AuthedRequest, res: Response) => {
      const db = loadDb();
      const conn = db.connections.find(c => c.id === req.params.id && c.clientId === req.authUser!.id);
      if (!conn) {
        return res.status(404).json({ error: 'Therapist connection not found.' });
      }
      const now = new Date().toISOString();
      conn.status = 'revoked';
      conn.revokedAt = now;
      db.reports.forEach(r => {
        if (r.clientId === req.authUser!.id && r.therapistId === conn.therapistId && r.status !== 'revoked') {
          r.status = 'revoked';
          r.revokedAt = now;
        }
      });
      db.permissionGrants.forEach(g => {
        if (g.clientId === req.authUser!.id && g.therapistId === conn.therapistId && g.status === 'active') {
          g.status = 'revoked';
          g.revokedAt = now;
          db.permissionHistory.unshift({
            id: makeId('ph'),
            grantId: g.id,
            clientId: g.clientId,
            clientName: g.clientName,
            therapistId: g.therapistId,
            therapistName: g.therapistName,
            categories: g.categories,
            purpose: g.purpose,
            authorizedAt: g.authorizedAt,
            expiresAt: g.expiresAt,
            revokedAt: now,
            action: 'revoked',
            downloadDisclaimerAcknowledged: true,
          });
        }
      });
      appendAuditLog(db, {
        actorId: req.authUser!.id,
        actorRole: 'user',
        action: 'CLIENT_REVOKED_THERAPIST_ACCESS',
        targetType: 'connection',
        targetId: conn.id,
        detail: `Client revoked sharing & connection access for therapist ${conn.therapistName}`,
      });
      saveDb(db);
      res.json({ connection: conn });
    }
  );

  router.post('/reports/share', requireAuth, requireRole(['user']), (req: AuthedRequest, res: Response) => {
    const therapistId = String(req.body?.therapistId || '').trim();
    const consentConfirmed = Boolean(req.body?.consentConfirmed);
    const title = String(req.body?.title || 'ClearPath Support Summary Report').trim();
    const dateRange = req.body?.dateRange || {};
    const sectionsIncluded = Array.isArray(req.body?.sectionsIncluded) ? req.body.sectionsIncluded : [];
    const sourceManifest =
      req.body?.sourceManifest && typeof req.body.sourceManifest === 'object'
        ? req.body.sourceManifest
        : undefined;
    const payload = req.body?.payload;

    if (!therapistId || !consentConfirmed || !payload || typeof payload !== 'object') {
      return res.status(400).json({
        error: 'Authorized therapist, explicit consent checkbox, and valid report payload are required.',
      });
    }

    const db = loadDb();
    const therapist = db.users.find(
      u => u.id === therapistId && u.role === 'therapist' && u.verificationStatus === 'approved'
    );
    if (!therapist) {
      return res.status(404).json({ error: 'Approved therapist not found.' });
    }

    const conn = db.connections.find(
      c => c.clientId === req.authUser!.id && c.therapistId === therapist.id
    );
    if (!conn || conn.status !== 'accepted') {
      return res.status(403).json({
        error: 'Therapist must accept your connection invitation before receiving confidential reports.',
      });
    }

    const prevVersions = db.reports.filter(
      r => r.clientId === req.authUser!.id && r.therapistId === therapist.id
    );
    const version = prevVersions.length + 1;

    const report = {
      id: makeId('rep'),
      version,
      clientId: req.authUser!.id,
      clientName: req.authUser!.name,
      therapistId: therapist.id,
      therapistName: therapist.name,
      title,
      dateRange,
      sectionsIncluded,
      sourceManifest,
      payload,
      deliveredAt: new Date().toISOString(),
      status: 'delivered' as const,
    };
    db.reports.unshift(report);
    appendAuditLog(db, {
      actorId: req.authUser!.id,
      actorRole: 'user',
      action: 'REPORT_SHARED_WITH_THERAPIST',
      targetType: 'report',
      targetId: report.id,
      detail: `Shared v${version} report "${title}" (${sectionsIncluded.join(', ')}) with ${therapist.name}`,
    });
    saveDb(db);
    emitRealtimeEvent({
      event: 'report:shared',
      payload: { reportId: report.id, clientId: req.authUser!.id, therapistId: therapist.id },
      targetUserIds: [req.authUser!.id, therapist.id],
    });
    res.status(201).json({ report });
  });

  router.get('/reports/mine', requireAuth, requireRole(['user']), (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const reports = db.reports.filter(r => r.clientId === req.authUser!.id);
    res.json({ reports });
  });

  router.get(
    '/reports/shared',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const db = loadDb();
      const reports = db.reports.filter(
        r =>
          r.therapistId === req.authUser!.id &&
          r.status !== 'revoked' &&
          isAuthorizedTherapistForClient(db, req.authUser!.id, r.clientId) &&
          (hasClientPermissionCategory(db, req.authUser!.id, r.clientId, 'attachments') ||
            hasClientPermissionCategory(db, req.authUser!.id, r.clientId, 'screening_results'))
      );
      res.json({ reports });
    }
  );

  router.get('/reports/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const report = db.reports.find(r => r.id === req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const user = req.authUser!;
    if (user.id === report.clientId) {
      return res.json({ report });
    }

    if (
      user.role === 'therapist' &&
      user.verificationStatus === 'approved' &&
      report.therapistId === user.id &&
      report.status !== 'revoked' &&
      isAuthorizedTherapistForClient(db, user.id, report.clientId) &&
      (hasClientPermissionCategory(db, user.id, report.clientId, 'attachments') ||
        hasClientPermissionCategory(db, user.id, report.clientId, 'screening_results'))
    ) {
      if (!report.viewedAt) {
        report.viewedAt = new Date().toISOString();
        report.status = 'viewed';
      }
      appendAuditLog(db, {
        actorId: user.id,
        actorRole: 'therapist',
        action: 'REPORT_VIEWED_BY_THERAPIST',
        targetType: 'report',
        targetId: report.id,
        detail: `Therapist ${user.name} accessed v${report.version || 1} report "${report.title}"`,
      });
      saveDb(db);
      return res.json({ report });
    }

    appendAuditLog(db, {
      actorId: user.id,
      actorRole: user.role,
      action: 'UNAUTHORIZED_REPORT_ACCESS_ATTEMPT',
      targetType: 'report',
      targetId: report.id,
      detail: `Blocked unauthorized access to report ${report.id}`,
    });
    saveDb(db);
    return res.status(403).json({ error: 'Forbidden: access denied or sharing consent was revoked.' });
  });

  router.post('/reports/:id/revoke', requireAuth, requireRole(['user']), (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const report = db.reports.find(r => r.id === req.params.id && r.clientId === req.authUser!.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found.' });
    }
    report.status = 'revoked';
    report.revokedAt = new Date().toISOString();
    appendAuditLog(db, {
      actorId: req.authUser!.id,
      actorRole: 'user',
      action: 'REPORT_SHARING_REVOKED',
      targetType: 'report',
      targetId: report.id,
      detail: `Client revoked therapist access for report "${report.title}"`,
    });
    saveDb(db);
    emitRealtimeEvent({
      event: 'report:revoked',
      payload: { reportId: report.id, clientId: req.authUser!.id, therapistId: report.therapistId },
      targetUserIds: [req.authUser!.id, report.therapistId],
    });
    res.json({ report });
  });

  // =========================================================
  // 3B. SUBSTANCE IDENTIFICATION, INTAKE & PERSONAL SUPPORT PLAN
  // =========================================================
  router.get('/substances/catalogue', (_req: Request, res: Response) => {
    res.json({
      version: CLINICAL_SUBSTANCE_CATALOGUE_VERSION,
      entries: CLINICAL_SUBSTANCE_ENTRIES,
    });
  });

  router.post('/substances/match', (req: Request, res: Response) => {
    const rawText = String(req.body?.description || '');
    const result = matchCustomSubstanceDescription(rawText);
    res.json(result);
  });

  router.get('/substances/concerns', requireAuth, requireRole(['user']), (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const concerns = db.substanceConcerns.filter(s => s.userId === req.authUser!.id);
    res.json({ concerns });
  });

  router.post('/substances/concerns', requireAuth, requireRole(['user']), (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const items = Array.isArray(req.body?.concerns) ? req.body.concerns : [req.body];
    const now = new Date().toISOString();
    const saved = items
      .filter((it: any) => it && typeof it.name === 'string' && it.name.trim())
      .map((it: any) => {
        const record = {
          id: String(it.id || makeId('subc')),
          userId: req.authUser!.id,
          catalogueId: String(it.catalogueId || 'custom'),
          catalogueNumber: typeof it.catalogueNumber === 'number' ? it.catalogueNumber : undefined,
          name: String(it.name).trim(),
          parentCategory: it.parentCategory ? String(it.parentCategory) : undefined,
          isExpandedEntry: Boolean(it.isExpandedEntry),
          isCustom: Boolean(it.isCustom),
          customOriginalText: it.customOriginalText ? String(it.customOriginalText) : undefined,
          customExplanation: it.customExplanation ? String(it.customExplanation) : undefined,
          matchedCatalogueId: it.matchedCatalogueId ? String(it.matchedCatalogueId) : undefined,
          matchedName: it.matchedName ? String(it.matchedName) : undefined,
          matchConfidence: it.matchConfidence,
          userConfirmedMatch: Boolean(it.userConfirmedMatch),
          verificationStatus:
            it.verificationStatus === 'matched_confirmed' ||
            it.verificationStatus === 'catalogue' ||
            it.verificationStatus === 'clinician_reviewed'
              ? it.verificationStatus
              : ('unverified' as const),
          isMedication: Boolean(it.isMedication),
          prescriptionDetails: it.prescriptionDetails,
          concernContext: it.concernContext ? String(it.concernContext) : undefined,
          createdAt: String(it.createdAt || now),
          updatedAt: now,
        };
        const existingIdx = db.substanceConcerns.findIndex(
          s => s.id === record.id && s.userId === req.authUser!.id
        );
        if (existingIdx >= 0) {
          db.substanceConcerns[existingIdx] = record;
        } else {
          db.substanceConcerns.unshift(record);
        }
        return record;
      });
    saveDb(db);
    res.status(201).json({ concerns: saved });
  });

  router.delete(
    '/substances/concerns/:id',
    requireAuth,
    requireRole(['user']),
    (req: AuthedRequest, res: Response) => {
      const db = loadDb();
      const before = db.substanceConcerns.length;
      db.substanceConcerns = db.substanceConcerns.filter(
        s => !(s.id === req.params.id && s.userId === req.authUser!.id)
      );
      if (db.substanceConcerns.length === before) {
        return res.status(404).json({ error: 'Substance concern entry not found.' });
      }
      saveDb(db);
      res.json({ ok: true });
    }
  );

  router.patch(
    '/substances/concerns/:id/clinician-review',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const note = String(req.body?.clinicianReviewNote || '').trim();
      if (!note) return res.status(400).json({ error: 'Clinician review note is required.' });
      const db = loadDb();
      const concern = db.substanceConcerns.find(s => s.id === req.params.id);
      if (!concern) return res.status(404).json({ error: 'Substance concern entry not found.' });
      if (
        !isAuthorizedTherapistForClient(db, req.authUser!.id, concern.userId) ||
        !hasClientPermissionCategory(db, req.authUser!.id, concern.userId, 'substances')
      ) {
        return res.status(403).json({ error: 'Forbidden: client has not shared substance records.' });
      }
      concern.clinicianReviewNote = note;
      concern.reviewedByTherapistName = req.authUser!.name;
      concern.reviewedAt = new Date().toISOString();
      concern.verificationStatus = 'clinician_reviewed';
      concern.updatedAt = concern.reviewedAt;
      appendAuditLog(db, {
        actorId: req.authUser!.id,
        actorRole: 'therapist',
        action: 'THERAPIST_REVIEWED_SUBSTANCE_ENTRY',
        targetType: 'substance_concern',
        targetId: concern.id,
        detail: `Clinician reviewed substance entry "${concern.name}" for client ${concern.userId}`,
      });
      saveDb(db);
      res.json({ concern });
    }
  );

  router.get('/intake', requireAuth, requireRole(['user']), (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const intake = db.intakeSessions.find(i => i.userId === req.authUser!.id) || null;
    res.json({ intake });
  });

  router.put('/intake', requireAuth, requireRole(['user']), (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const now = new Date().toISOString();
    const existing = db.intakeSessions.find(i => i.userId === req.authUser!.id);
    const updated = {
      id: existing?.id || makeId('intake'),
      userId: req.authUser!.id,
      primaryGoals: Array.isArray(req.body?.primaryGoals) ? req.body.primaryGoals.map(String) : [],
      multipleSubstances: Boolean(req.body?.multipleSubstances),
      circumstances:
        req.body?.circumstances && typeof req.body.circumstances === 'object'
          ? req.body.circumstances
          : {},
      emergencyTriggered: Boolean(req.body?.emergencyTriggered),
      selectedPaths: Array.isArray(req.body?.selectedPaths) ? req.body.selectedPaths.map(String) : [],
      updatedAt: now,
    };
    if (existing) {
      Object.assign(existing, updated);
    } else {
      db.intakeSessions.unshift(updated);
    }
    saveDb(db);
    res.json({ intake: updated });
  });

  router.get('/support-plan', requireAuth, requireRole(['user']), (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const plan = db.supportPlans.find(p => p.userId === req.authUser!.id) || null;
    res.json({ plan });
  });

  router.put('/support-plan', requireAuth, requireRole(['user']), (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const now = new Date().toISOString();
    const existing = db.supportPlans.find(p => p.userId === req.authUser!.id);
    const plan = {
      id: existing?.id || makeId('splan'),
      userId: req.authUser!.id,
      selectedPaths: Array.isArray(req.body?.selectedPaths) ? req.body.selectedPaths.map(String) : [],
      pathwayReasons: Array.isArray(req.body?.pathwayReasons) ? req.body.pathwayReasons : [],
      objectives: Array.isArray(req.body?.objectives) ? req.body.objectives.map(String) : [],
      approaches: Array.isArray(req.body?.approaches) ? req.body.approaches.map(String) : [],
      educationalActivities: Array.isArray(req.body?.educationalActivities) ? req.body.educationalActivities : [],
      professionalGuidance: req.body?.professionalGuidance ? String(req.body.professionalGuidance) : undefined,
      userDefinedActivities: Array.isArray(req.body?.userDefinedActivities)
        ? req.body.userDefinedActivities.map(String)
        : [],
      supporterInvolvement: req.body?.supporterInvolvement ? String(req.body.supporterInvolvement) : undefined,
      nextSteps: Array.isArray(req.body?.nextSteps) ? req.body.nextSteps.map(String) : [],
      reviewDate: String(req.body?.reviewDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]),
      updatedAt: now,
    };
    if (existing) {
      Object.assign(existing, plan);
    } else {
      db.supportPlans.unshift(plan);
    }
    saveDb(db);
    res.json({ plan });
  });

  // =========================================================
  // 4. CONTINUOUS CARE: PERMISSION-ENFORCED WORKSPACE, ASSIGNMENTS, APPOINTMENTS
  // =========================================================
  router.get('/care/workspace', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const user = req.authUser!;

    // Security safeguard: community organization members NEVER access personal care workspaces
    if (user.role === 'community') {
      appendAuditLog(db, {
        actorId: user.id,
        actorRole: user.role,
        action: 'ORG_MEMBER_CARE_ACCESS_BLOCKED',
        targetType: 'care_workspace',
        targetId: user.id,
        detail: 'Blocked organization account from accessing personal health records',
      });
      saveDb(db);
      return res.status(403).json({
        error: 'Forbidden: organization accounts cannot view private individual recovery or clinical data.',
      });
    }

    if (user.role === 'therapist') {
      if (user.verificationStatus !== 'approved') {
        return res.status(403).json({ error: 'Therapist account awaiting verification approval.' });
      }
      const requestedClientId = req.query.clientId ? String(req.query.clientId) : null;
      if (requestedClientId && !isAuthorizedTherapistForClient(db, user.id, requestedClientId)) {
        return res.status(403).json({ error: 'Forbidden: client has not authorized access or consent was revoked.' });
      }

      const activeConnections = db.connections.filter(
        c => c.therapistId === user.id && c.status === 'accepted'
      );
      const authorizedIds = new Set(activeConnections.map(c => c.clientId));

      const clientPermissions: Record<string, PermissionCategory[]> = {};
      const clientProfiles: Record<string, { id: string; name: string; ageRange?: string; district?: string }> = {};
      activeConnections.forEach(c => {
        const grant = getActivePermissionGrantForClient(db, user.id, c.clientId);
        clientPermissions[c.clientId] = grant ? grant.categories : ALL_PERMISSION_CATEGORIES;
        const clientUser = db.users.find(u => u.id === c.clientId);
        if (clientUser && hasClientPermissionCategory(db, user.id, c.clientId, 'background')) {
          clientProfiles[c.clientId] = {
            id: clientUser.id,
            name: clientUser.name,
            ageRange: clientUser.ageRange,
            district: clientUser.district,
          };
        } else if (clientUser) {
          clientProfiles[c.clientId] = {
            id: clientUser.id,
            name: clientUser.name,
          };
        }
      });

      return res.json({
        connections: db.connections.filter(c => c.therapistId === user.id && c.status !== 'revoked'),
        invitations: db.invitations.filter(
          inv =>
            inv.senderId === user.id ||
            inv.recipientUserId === user.id ||
            inv.recipientContact.toLowerCase() === user.username.toLowerCase()
        ),
        clientPermissions,
        clientProfiles,
        substanceConcerns: db.substanceConcerns.filter(
          s =>
            authorizedIds.has(s.userId) &&
            hasClientPermissionCategory(db, user.id, s.userId, 'substances')
        ),
        supportPlans: db.supportPlans.filter(
          p =>
            authorizedIds.has(p.userId) &&
            hasClientPermissionCategory(db, user.id, p.userId, 'goals')
        ),
        assignments: db.assignments.filter(
          a =>
            a.therapistId === user.id &&
            authorizedIds.has(a.clientId) &&
            hasClientPermissionCategory(db, user.id, a.clientId, 'assignments')
        ),
        weeklyProgress: db.weeklyProgress.filter(
          w =>
            authorizedIds.has(w.clientId) &&
            (!w.therapistId || w.therapistId === user.id) &&
            hasClientPermissionCategory(db, user.id, w.clientId, 'weekly_reports')
        ),
        appointmentNotes: db.appointmentNotes.filter(
          n =>
            n.therapistId === user.id &&
            authorizedIds.has(n.clientId) &&
            hasClientPermissionCategory(db, user.id, n.clientId, 'appointments')
        ),
        messages: db.messages.filter(m => m.therapistId === user.id && authorizedIds.has(m.clientId)),
        reports: db.reports.filter(
          r =>
            r.therapistId === user.id &&
            r.status !== 'revoked' &&
            authorizedIds.has(r.clientId) &&
            (hasClientPermissionCategory(db, user.id, r.clientId, 'attachments') ||
              hasClientPermissionCategory(db, user.id, r.clientId, 'screening_results'))
        ),
      });
    }

    // Client user workspace
    return res.json({
      connections: db.connections.filter(c => c.clientId === user.id),
      invitations: db.invitations.filter(
        inv =>
          inv.senderId === user.id ||
          inv.recipientUserId === user.id ||
          inv.recipientContact.toLowerCase() === user.username.toLowerCase() ||
          (user.email && inv.recipientContact.toLowerCase() === user.email.toLowerCase())
      ),
      permissionGrants: db.permissionGrants.filter(g => g.clientId === user.id),
      permissionHistory: db.permissionHistory.filter(h => h.clientId === user.id),
      substanceConcerns: db.substanceConcerns.filter(s => s.userId === user.id),
      assignments: db.assignments.filter(a => a.clientId === user.id),
      weeklyProgress: db.weeklyProgress.filter(w => w.clientId === user.id),
      appointmentNotes: db.appointmentNotes.filter(n => n.clientId === user.id),
      carePlanProposals: db.carePlanProposals
        .filter(p => p.userId === user.id)
        .sort((a, b) => b.version - a.version),
      messages: db.messages.filter(m => m.clientId === user.id),
      reports: db.reports.filter(r => r.clientId === user.id),
    });
  });

  router.post(
    '/care/assignments',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const clientId = String(req.body?.clientId || '').trim();
      const title = String(req.body?.title || '').trim();
      const purpose = req.body?.purpose ? String(req.body.purpose).trim() : undefined;
      const instructions = String(req.body?.instructions || '').trim();
      const type =
        req.body?.type === 'goal' || req.body?.type === 'weekly_plan' ? req.body.type : 'cbt_exercise';
      const startDate = String(req.body?.startDate || new Date().toISOString().split('T')[0]);
      const dueDate = req.body?.dueDate ? String(req.body.dueDate) : undefined;
      const reviewDate = req.body?.reviewDate ? String(req.body.reviewDate) : undefined;

      if (!clientId || !title || !instructions) {
        return res.status(400).json({ error: 'Client, title, and instructions are required.' });
      }
      const db = loadDb();
      if (!isAuthorizedTherapistForClient(db, req.authUser!.id, clientId)) {
        return res.status(403).json({ error: 'Forbidden: not authorized for this client.' });
      }

      const now = new Date().toISOString();
      const assignment = {
        id: makeId('assign'),
        clientId,
        therapistId: req.authUser!.id,
        therapistName: req.authUser!.name,
        type,
        title,
        purpose,
        instructions,
        startDate,
        dueDate,
        reviewDate,
        status: 'assigned' as const,
        createdAt: now,
        updatedAt: now,
      };
      db.assignments.unshift(assignment);
      appendAuditLog(db, {
        actorId: req.authUser!.id,
        actorRole: 'therapist',
        action: 'THERAPIST_CREATED_ASSIGNMENT',
        targetType: 'assignment',
        targetId: assignment.id,
        detail: `Assigned "${title}" (${type}) to client ${clientId}`,
      });
      saveDb(db);
      emitRealtimeEvent({
        event: 'assignment:updated',
        payload: { assignmentId: assignment.id, clientId, therapistId: req.authUser!.id },
        targetUserIds: [clientId, req.authUser!.id],
      });
      res.status(201).json({ assignment });
    }
  );

  router.patch('/care/assignments/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const assignment = db.assignments.find(a => a.id === req.params.id);
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found.' });
    }

    const user = req.authUser!;
    if (user.id === assignment.clientId) {
      if (
        req.body?.status &&
        ['assigned', 'in_progress', 'completed', 'not_completed'].includes(req.body.status)
      ) {
        assignment.status = req.body.status;
      }
      if (typeof req.body?.clientReflection === 'string') {
        assignment.clientReflection = req.body.clientReflection;
      }
      assignment.updatedAt = new Date().toISOString();
      saveDb(db);
      return res.json({ assignment });
    }

    if (
      user.role === 'therapist' &&
      user.id === assignment.therapistId &&
      isAuthorizedTherapistForClient(db, user.id, assignment.clientId)
    ) {
      if (typeof req.body?.therapistFeedback === 'string') {
        assignment.therapistFeedback = req.body.therapistFeedback;
      }
      if (
        req.body?.status &&
        ['assigned', 'in_progress', 'completed', 'not_completed', 'reviewed'].includes(req.body.status)
      ) {
        assignment.status = req.body.status;
      }
      if (typeof req.body?.instructions === 'string' && req.body.instructions.trim()) {
        assignment.instructions = req.body.instructions.trim();
      }
      if (typeof req.body?.reviewDate === 'string') {
        assignment.reviewDate = req.body.reviewDate;
      }
      assignment.updatedAt = new Date().toISOString();
      saveDb(db);
      emitRealtimeEvent({
        event: 'assignment:updated',
        payload: { assignmentId: assignment.id, clientId: assignment.clientId, therapistId: assignment.therapistId },
        targetUserIds: [assignment.clientId, assignment.therapistId],
      });
      return res.json({ assignment });
    }

    return res.status(403).json({ error: 'Forbidden.' });
  });

  router.post(
    '/care/weekly-progress',
    requireAuth,
    requireRole(['user']),
    (req: AuthedRequest, res: Response) => {
      const weekStarting = String(req.body?.weekStarting || new Date().toISOString().split('T')[0]);
      const completedActivities = Array.isArray(req.body?.completedActivities)
        ? req.body.completedActivities.map(String)
        : [];
      const goalsWorkedOn = Array.isArray(req.body?.goalsWorkedOn)
        ? req.body.goalsWorkedOn.map(String)
        : [];
      const difficulties = String(req.body?.difficulties || '').trim();
      const whatHelped = String(req.body?.whatHelped || '').trim();
      const discussionTopics = String(req.body?.discussionTopics || '').trim();
      const questionsForTherapist = String(req.body?.questionsForTherapist || '').trim();
      const optionalReflection = req.body?.optionalReflection ? String(req.body.optionalReflection).trim() : undefined;
      const requestedTherapistId = req.body?.therapistId ? String(req.body.therapistId) : undefined;

      if (!difficulties && !whatHelped && completedActivities.length === 0 && !questionsForTherapist) {
        return res.status(400).json({ error: 'Please enter at least one progress item or reflection.' });
      }

      const db = loadDb();
      let authorizedTherapistId: string | undefined;
      if (requestedTherapistId) {
        if (!isAuthorizedTherapistForClient(db, requestedTherapistId, req.authUser!.id)) {
          return res.status(403).json({ error: 'Selected therapist is not authorized.' });
        }
        authorizedTherapistId = requestedTherapistId;
      }

      const submission = {
        id: makeId('wp'),
        clientId: req.authUser!.id,
        clientName: req.authUser!.name,
        therapistId: authorizedTherapistId,
        weekStarting,
        completedActivities,
        goalsWorkedOn,
        difficulties,
        whatHelped,
        discussionTopics,
        questionsForTherapist,
        optionalReflection,
        createdAt: new Date().toISOString(),
      };
      db.weeklyProgress.unshift(submission);
      appendAuditLog(db, {
        actorId: req.authUser!.id,
        actorRole: 'user',
        action: 'WEEKLY_PROGRESS_SUBMITTED',
        targetType: 'weekly_progress',
        targetId: submission.id,
        detail: `Submitted weekly progress for week of ${weekStarting}`,
      });
      saveDb(db);
      emitClientChangeToCareTeam(db, req.authUser!.id, 'role1_state:updated', { submissionId: submission.id });
      res.status(201).json({ submission });
    }
  );

  router.patch(
    '/care/weekly-progress/:id/respond',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const responseText = String(req.body?.therapistResponse || '').trim();
      if (!responseText) {
        return res.status(400).json({ error: 'Response text cannot be empty.' });
      }
      const db = loadDb();
      const sub = db.weeklyProgress.find(w => w.id === req.params.id);
      if (!sub || !isAuthorizedTherapistForClient(db, req.authUser!.id, sub.clientId)) {
        return res.status(403).json({ error: 'Forbidden.' });
      }
      sub.therapistResponse = responseText;
      sub.respondedAt = new Date().toISOString();
      saveDb(db);
      emitRealtimeEvent({
        event: 'role1_state:updated',
        payload: { submissionId: sub.id, clientId: sub.clientId },
        targetUserIds: [sub.clientId, req.authUser!.id],
      });
      res.json({ submission: sub });
    }
  );

  router.post(
    '/care/notes',
    requireAuth,
    requireApprovedTherapist,
    (req: AuthedRequest, res: Response) => {
      const clientId = String(req.body?.clientId || '').trim();
      const noteText = String(req.body?.noteText || '').trim();
      const appointmentDate = String(req.body?.appointmentDate || new Date().toISOString().split('T')[0]);
      const appointmentTime = req.body?.appointmentTime ? String(req.body.appointmentTime) : undefined;
      const topicsToDiscuss = Array.isArray(req.body?.topicsToDiscuss)
        ? req.body.topicsToDiscuss.map(String)
        : undefined;
      const clientQuestions = Array.isArray(req.body?.clientQuestions)
        ? req.body.clientQuestions.map(String)
        : undefined;
      const previousFollowUp = req.body?.previousFollowUp ? String(req.body.previousFollowUp) : undefined;
      const agreedNextSteps = req.body?.agreedNextSteps ? String(req.body.agreedNextSteps) : undefined;
      const followUpReminderDate = req.body?.followUpReminderDate
        ? String(req.body.followUpReminderDate)
        : undefined;
      const requestReportUpdate = Boolean(req.body?.requestReportUpdate);

      if (!clientId || !noteText) {
        return res.status(400).json({ error: 'Client ID and note text are required.' });
      }
      const db = loadDb();
      if (!isAuthorizedTherapistForClient(db, req.authUser!.id, clientId)) {
        return res.status(403).json({ error: 'Forbidden: client has not authorized access.' });
      }

      const noteStatus =
        req.body?.status && ['upcoming', 'completed', 'rescheduled', 'missed'].includes(req.body.status)
          ? (req.body.status as 'upcoming' | 'completed' | 'rescheduled' | 'missed')
          : ('upcoming' as const);
      const note = {
        id: makeId('note'),
        clientId,
        therapistId: req.authUser!.id,
        therapistName: req.authUser!.name,
        appointmentDate,
        appointmentTime,
        topicsToDiscuss,
        clientQuestions,
        previousFollowUp,
        agreedNextSteps,
        noteText,
        followUpReminderDate,
        followUpOutcome: req.body?.followUpOutcome ? String(req.body.followUpOutcome).trim() : undefined,
        requestReportUpdate,
        status: noteStatus,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.appointmentNotes.unshift(note);
      appendAuditLog(db, {
        actorId: req.authUser!.id,
        actorRole: 'therapist',
        action: requestReportUpdate ? 'THERAPIST_REQUESTED_REPORT_UPDATE' : 'THERAPIST_SAVED_NOTE',
        targetType: 'appointment_note',
        targetId: note.id,
        detail: `Added clinical session / appointment prep note (${appointmentDate}) for client ${clientId}`,
      });
      saveDb(db);
      emitRealtimeEvent({
        event: 'appointment:updated',
        payload: { noteId: note.id, clientId, therapistId: req.authUser!.id },
        targetUserIds: [clientId, req.authUser!.id],
      });
      res.status(201).json({ note });
    }
  );

  // Client or authorized therapist adds or updates appointment preparation questions & topics
  router.post('/care/appointments/prep', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const user = req.authUser!;
    const therapistId =
      user.role === 'therapist' ? user.id : String(req.body?.therapistId || '').trim();
    const clientId =
      user.role === 'user' ? user.id : String(req.body?.clientId || '').trim();
    if (!therapistId || !clientId) {
      return res.status(400).json({ error: 'Therapist and client IDs are required.' });
    }
    if (!isAuthorizedTherapistForClient(db, therapistId, clientId)) {
      return res.status(403).json({ error: 'Forbidden: authorized connection required.' });
    }
    if (user.id !== clientId && user.id !== therapistId) {
      return res.status(403).json({ error: 'Forbidden.' });
    }
    const therapistUser = db.users.find(u => u.id === therapistId);
    const note = {
      id: makeId('appt'),
      clientId,
      therapistId,
      therapistName: therapistUser?.name || 'Clinician',
      appointmentDate: String(req.body?.appointmentDate || new Date().toISOString().split('T')[0]),
      appointmentTime: req.body?.appointmentTime ? String(req.body.appointmentTime) : undefined,
      topicsToDiscuss: Array.isArray(req.body?.topicsToDiscuss)
        ? req.body.topicsToDiscuss.map(String)
        : [],
      clientQuestions: Array.isArray(req.body?.clientQuestions)
        ? req.body.clientQuestions.map(String)
        : [],
      previousFollowUp: req.body?.previousFollowUp ? String(req.body.previousFollowUp) : undefined,
      agreedNextSteps: req.body?.agreedNextSteps ? String(req.body.agreedNextSteps) : undefined,
      noteText: String(req.body?.noteText || 'Appointment preparation record').trim(),
      followUpReminderDate: req.body?.followUpReminderDate
        ? String(req.body.followUpReminderDate)
        : undefined,
      followUpOutcome: req.body?.followUpOutcome ? String(req.body.followUpOutcome).trim() : undefined,
      requestReportUpdate: Boolean(req.body?.requestReportUpdate),
      status: 'upcoming' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.appointmentNotes.unshift(note);
    saveDb(db);
    emitRealtimeEvent({
      event: 'appointment:updated',
      payload: { noteId: note.id, clientId, therapistId },
      targetUserIds: [clientId, therapistId],
    });
    res.status(201).json({ note });
  });

  router.patch('/care/appointments/:id', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const note = db.appointmentNotes.find(n => n.id === req.params.id);
    if (!note) return res.status(404).json({ error: 'Appointment record not found.' });
    const user = req.authUser!;
    if (user.id !== note.clientId && user.id !== note.therapistId) {
      return res.status(403).json({ error: 'Forbidden.' });
    }
    if (typeof req.body?.appointmentDate === 'string' && req.body.appointmentDate.trim()) {
      note.appointmentDate = req.body.appointmentDate.trim();
    }
    if (typeof req.body?.appointmentTime === 'string') {
      note.appointmentTime = req.body.appointmentTime.trim() || undefined;
    }
    if (typeof req.body?.followUpReminderDate === 'string') {
      note.followUpReminderDate = req.body.followUpReminderDate.trim() || undefined;
    }
    if (typeof req.body?.followUpOutcome === 'string') {
      note.followUpOutcome = req.body.followUpOutcome.trim() || undefined;
    }
    if (Array.isArray(req.body?.topicsToDiscuss)) {
      note.topicsToDiscuss = req.body.topicsToDiscuss.map(String);
    }
    if (Array.isArray(req.body?.clientQuestions)) {
      note.clientQuestions = req.body.clientQuestions.map(String);
    }
    if (typeof req.body?.previousFollowUp === 'string') note.previousFollowUp = req.body.previousFollowUp;
    if (typeof req.body?.agreedNextSteps === 'string') note.agreedNextSteps = req.body.agreedNextSteps;
    if (typeof req.body?.noteText === 'string' && req.body.noteText.trim()) {
      note.noteText = req.body.noteText.trim();
    }
    if (
      req.body?.status &&
      ['upcoming', 'completed', 'rescheduled', 'missed'].includes(req.body.status)
    ) {
      note.status = req.body.status;
    }
    note.updatedAt = new Date().toISOString();
    appendAuditLog(db, {
      actorId: user.id,
      actorRole: user.role,
      action: 'APPOINTMENT_UPDATED',
      targetType: 'appointment_note',
      targetId: note.id,
      detail: `Updated appointment (${note.appointmentDate}) status to ${note.status || 'upcoming'}`,
    });
    saveDb(db);
    emitRealtimeEvent({
      event: 'appointment:updated',
      payload: { noteId: note.id, clientId: note.clientId, therapistId: note.therapistId },
      targetUserIds: [note.clientId, note.therapistId],
    });
    res.json({ note });
  });

  router.post('/care/messages', requireAuth, (req: AuthedRequest, res: Response) => {
    const connectionId = String(req.body?.connectionId || '').trim();
    const text = String(req.body?.text || '').trim();
    if (!connectionId || !text) {
      return res.status(400).json({ error: 'Connection and message text are required.' });
    }

    const db = loadDb();
    const conn = db.connections.find(c => c.id === connectionId);
    if (!conn || conn.status !== 'accepted') {
      return res.status(403).json({ error: 'Active authorized connection required to send messages.' });
    }

    const user = req.authUser!;
    const isClient = user.id === conn.clientId;
    const isApprovedTher =
      user.role === 'therapist' && user.verificationStatus === 'approved' && user.id === conn.therapistId;

    if (!isClient && !isApprovedTher) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const messageType: 'standard' | 'info_request' =
      req.body?.messageType === 'info_request' ? 'info_request' : 'standard';
    const rawRequestedCats = Array.isArray(req.body?.requestedCategories)
      ? req.body.requestedCategories
          .map(String)
          .filter((c: string): c is PermissionCategory => ALL_PERMISSION_CATEGORIES.includes(c as PermissionCategory))
      : undefined;

    const msg = {
      id: makeId('msg'),
      connectionId: conn.id,
      clientId: conn.clientId,
      therapistId: conn.therapistId,
      senderId: user.id,
      senderRole: user.role,
      senderName: user.name,
      text,
      ...(messageType === 'info_request' ? { messageType } : {}),
      ...(rawRequestedCats && rawRequestedCats.length > 0 ? { requestedCategories: rawRequestedCats } : {}),
      createdAt: new Date().toISOString(),
    };
    db.messages.push(msg);
    appendAuditLog(db, {
      actorId: user.id,
      actorRole: user.role,
      action: messageType === 'info_request' ? 'THERAPIST_REQUESTED_CLIENT_INFO' : 'SECURE_MESSAGE_SENT',
      targetType: 'connection',
      targetId: conn.id,
      detail: `${messageType === 'info_request' ? 'Structured information request' : 'Message'} sent on connection ${conn.id}`,
    });
    saveDb(db);
    emitRealtimeEvent({
      event: 'message:created',
      payload: {
        messageId: msg.id,
        connectionId: conn.id,
        clientId: conn.clientId,
        therapistId: conn.therapistId,
        messageType,
      },
      targetUserIds: [conn.clientId, conn.therapistId],
    });
    res.status(201).json({ message: msg });
  });

  router.patch('/care/messages/:id/read', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const msg = db.messages.find(m => m.id === req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found.' });
    const user = req.authUser!;
    if (user.id !== msg.clientId && user.id !== msg.therapistId) {
      return res.status(403).json({ error: 'Forbidden.' });
    }
    if (msg.senderId !== user.id && !msg.readAt) {
      msg.readAt = new Date().toISOString();
      saveDb(db);
      emitRealtimeEvent({
        event: 'message:read',
        payload: { messageId: msg.id, clientId: msg.clientId, therapistId: msg.therapistId },
        targetUserIds: [msg.clientId, msg.therapistId],
      });
    }
    res.json({ message: msg });
  });

  // =========================================================
  // 5. COMMUNITY ORGS, PUBLIC DISCOVERY & ANONYMOUS ANALYTICS
  // =========================================================
  router.get('/community/orgs/mine', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const orgs = db.communityOrgs.filter(o => o.ownerUserId === req.authUser!.id);
    res.json({ orgs });
  });

  router.post('/community/orgs/register', requireAuth, (req: AuthedRequest, res: Response) => {
    const name = String(req.body?.name || '').trim();
    const district = String(req.body?.district || '').trim();
    const category = ['healthcare', 'programme_organizer', 'educational_institution', 'community_org'].includes(
      String(req.body?.category)
    )
      ? (String(req.body.category) as 'healthcare' | 'programme_organizer' | 'educational_institution' | 'community_org')
      : 'community_org';
    const professionalRole = String(req.body?.professionalRole || 'Coordinator').trim();
    const intendedUse = String(req.body?.intendedUse || '').trim();

    if (!name || !district) {
      return res.status(400).json({ error: 'Organization name and district are required.' });
    }

    const db = loadDb();
    const org = {
      id: makeId('org'),
      ownerUserId: req.authUser!.id,
      name,
      category,
      professionalRole,
      district,
      contactEmail: req.body?.contactEmail ? String(req.body.contactEmail).trim() : undefined,
      contactPhone: req.body?.contactPhone ? String(req.body.contactPhone).trim() : undefined,
      verificationDocRef: req.body?.verificationDocRef ? String(req.body.verificationDocRef).trim() : undefined,
      intendedUse: intendedUse || 'Prevention & awareness programme coordination',
      verificationStatus: 'pending' as const,
      createdAt: new Date().toISOString(),
    };
    db.communityOrgs.unshift(org);
    appendAuditLog(db, {
      actorId: req.authUser!.id,
      actorRole: req.authUser!.role,
      action: 'ORG_REGISTERED_PENDING',
      targetType: 'organization',
      targetId: org.id,
      detail: `Organization "${name}" submitted for admin verification`,
    });
    saveDb(db);
    res.status(201).json({ org });
  });

  router.get('/community/programmes', optionalAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const includePending = req.query.includePending === 'true';
    const district = req.query.district ? String(req.query.district) : '';
    const type = req.query.type ? String(req.query.type) : '';
    const targetGroup = req.query.targetGroup ? String(req.query.targetGroup).toLowerCase() : '';
    const orgQuery = req.query.org ? String(req.query.org).toLowerCase() : '';
    const dateQuery = req.query.date ? String(req.query.date) : '';
    const availableOnly = req.query.availableOnly === 'true';

    const userOrgIds = new Set(
      req.authUser ? db.communityOrgs.filter(o => o.ownerUserId === req.authUser!.id).map(o => o.id) : []
    );

    const list = db.programmes.filter(p => {
      const canSeePending =
        req.authUser?.role === 'admin' || (includePending && userOrgIds.has(p.orgId));
      if (p.verificationStatus !== 'verified' && !canSeePending) return false;
      if (district && district !== 'All Districts' && p.district !== district) return false;
      if (type && type !== 'all' && p.type !== type) return false;
      if (targetGroup && !p.targetAudience.toLowerCase().includes(targetGroup)) return false;
      if (orgQuery && !p.orgName.toLowerCase().includes(orgQuery)) return false;
      if (dateQuery && p.date !== dateQuery) return false;
      if (availableOnly && p.registeredUserIds.length >= p.capacity) return false;
      return true;
    });

    res.json({
      programmes: list.map(p => ({
        ...p,
        registeredCount: p.registeredUserIds.length,
        isRegisteredByCurrentUser: req.authUser ? p.registeredUserIds.includes(req.authUser.id) : false,
        registeredUserIds: undefined, // Never leak participant user IDs!
      })),
    });
  });

  router.post('/community/programmes', requireAuth, (req: AuthedRequest, res: Response) => {
    const title = String(req.body?.title || '').trim();
    const district = String(req.body?.district || '').trim();
    const description = String(req.body?.description || '').trim();
    if (!title || !district || !description) {
      return res.status(400).json({ error: 'Title, district, and description are required.' });
    }

    const db = loadDb();
    let org = req.body?.orgId
      ? db.communityOrgs.find(o => o.id === String(req.body.orgId) && o.ownerUserId === req.authUser!.id)
      : db.communityOrgs.find(o => o.ownerUserId === req.authUser!.id);

    if (!org) {
      // Auto-register a pending organization if inline org name supplied
      const orgName = String(req.body?.orgName || req.authUser!.name).trim();
      org = {
        id: makeId('org'),
        ownerUserId: req.authUser!.id,
        name: orgName,
        category: 'community_org',
        professionalRole: 'Programme Organizer',
        district,
        intendedUse: 'Community prevention programmes',
        verificationStatus: 'pending',
        createdAt: new Date().toISOString(),
      };
      db.communityOrgs.unshift(org);
    }

    const programme = {
      id: makeId('prog'),
      orgId: org.id,
      orgName: org.name,
      orgCategory: org.category,
      district,
      title,
      type: String(req.body?.type || 'community_education'),
      description,
      objective: String(req.body?.objective || 'Preventive awareness and resource literacy'),
      targetAudience: String(req.body?.targetAudience || 'Students, Youth & Families'),
      format:
        req.body?.format === 'online' || req.body?.format === 'hybrid'
          ? (req.body.format as 'online' | 'hybrid')
          : ('in_person' as const),
      location: String(req.body?.location || district),
      date: String(req.body?.date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]),
      time: String(req.body?.time || '10:30 AM'),
      eligibility: String(req.body?.eligibility || 'Open registration'),
      contactInfo: String(req.body?.contactInfo || org.contactEmail || org.contactPhone || 'Contact organizer'),
      capacity: Math.max(5, Number(req.body?.capacity || 60)),
      registeredUserIds: [],
      verificationStatus: org.verificationStatus === 'approved' ? ('verified' as const) : ('pending' as const),
      createdAt: new Date().toISOString(),
    };
    db.programmes.unshift(programme);
    appendAuditLog(db, {
      actorId: req.authUser!.id,
      actorRole: req.authUser!.role,
      action: 'COMMUNITY_PROGRAMME_PUBLISHED',
      targetType: 'programme',
      targetId: programme.id,
      detail: `Created programme "${title}" (${programme.verificationStatus})`,
    });
    saveDb(db);
    emitRealtimeEvent({
      event: 'programme:updated',
      payload: { programmeId: programme.id, district: programme.district },
      broadcastAll: true,
    });
    res.status(201).json({
      programme: {
        ...programme,
        registeredCount: 0,
        registeredUserIds: undefined,
      },
      org,
    });
  });

  router.post('/community/programmes/:id/register', requireAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const prog = db.programmes.find(p => p.id === req.params.id);
    if (!prog) return res.status(404).json({ error: 'Programme not found.' });
    if (prog.verificationStatus !== 'verified') {
      return res.status(403).json({ error: 'Only verified programmes are open for public registration.' });
    }
    if (!prog.registeredUserIds.includes(req.authUser!.id)) {
      if (prog.registeredUserIds.length >= prog.capacity) {
        return res.status(400).json({ error: 'This programme has reached capacity.' });
      }
      prog.registeredUserIds.push(req.authUser!.id);
      saveDb(db);
      emitRealtimeEvent({
        event: 'programme:updated',
        payload: { programmeId: prog.id, registeredCount: prog.registeredUserIds.length },
        broadcastAll: true,
      });
    }
    res.json({
      registeredCount: prog.registeredUserIds.length,
      isRegisteredByCurrentUser: true,
    });
  });

  router.post('/community/evaluations', (req: Request, res: Response) => {
    const programmeId = String(req.body?.programmeId || 'general').trim();
    const district = String(req.body?.district || 'Unspecified').trim();
    const phase: 'pre' | 'post' = req.body?.phase === 'post' ? 'post' : 'pre';
    const score = Number(req.body?.score ?? 0);
    const maxScore = Math.max(1, Number(req.body?.maxScore ?? 5));

    const db = loadDb();
    const evaluation = {
      id: makeId('eval'),
      programmeId,
      district,
      phase,
      score: Math.max(0, Math.min(maxScore, score)),
      maxScore,
      accessibilityBarrier: req.body?.accessibilityBarrier ? String(req.body.accessibilityBarrier).trim() : undefined,
      feedbackNote: req.body?.feedbackNote ? String(req.body.feedbackNote).trim() : undefined,
      topic: req.body?.topic ? String(req.body.topic).trim() : undefined,
      submittedAt: new Date().toISOString(),
    };
    db.evaluations.unshift(evaluation);
    saveDb(db);
    emitRealtimeEvent({
      event: 'programme:updated',
      payload: { evaluationId: evaluation.id, district: evaluation.district },
      broadcastAll: true,
    });
    res.status(201).json({ evaluation });
  });

  router.get('/community/analytics', (_req: Request, res: Response) => {
    const db = loadDb();
    const verifiedProgrammes = db.programmes.filter(p => p.verificationStatus === 'verified');
    const pendingProgrammesCount = db.programmes.filter(p => p.verificationStatus !== 'verified').length;

    const byDistrict: Record<string, { verifiedProgrammes: number; totalRegistrations: number }> = {};
    verifiedProgrammes.forEach(p => {
      if (!byDistrict[p.district]) {
        byDistrict[p.district] = { verifiedProgrammes: 0, totalRegistrations: 0 };
      }
      byDistrict[p.district].verifiedProgrammes += 1;
      byDistrict[p.district].totalRegistrations += p.registeredUserIds.length;
    });

    const preEvals = db.evaluations.filter(e => e.phase === 'pre');
    const postEvals = db.evaluations.filter(e => e.phase === 'post');
    const avgPct = (list: typeof preEvals) =>
      list.length === 0
        ? null
        : Math.round((list.reduce((acc, e) => acc + e.score / e.maxScore, 0) / list.length) * 100);

    const barriers = db.evaluations
      .filter(e => e.accessibilityBarrier)
      .reduce<Record<string, number>>((acc, e) => {
        const key = e.accessibilityBarrier!;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

    res.json({
      dataSourcesNotice:
        'Aggregated & anonymized counts only. Higher help-seeking requests indicate awareness/service engagement and MUST NOT be interpreted as higher underlying addiction prevalence.',
      verifiedServiceData: {
        verifiedOrgsCount: db.communityOrgs.filter(o => o.verificationStatus === 'approved').length,
        verifiedProgrammesCount: verifiedProgrammes.length,
        pendingVerificationCount: pendingProgrammesCount,
        byDistrict,
      },
      anonymousEvaluations: {
        preCount: preEvals.length,
        postCount: postEvals.length,
        preAvgScorePct: avgPct(preEvals),
        postAvgScorePct: avgPct(postEvals),
        reportedBarriers: barriers,
      },
    });
  });

  // Community Builder Quick Data Entry (1-step programme / evaluation / local need)
  router.post('/community/quick-entry', optionalAuth, (req: AuthedRequest, res: Response) => {
    const entryType = String(req.body?.entryType || 'programme').trim();
    const district = String(req.body?.district || 'Ernakulam').trim();
    const db = loadDb();
    const now = new Date().toISOString();

    if (entryType === 'outcome_evaluation') {
      const programmeId = String(req.body?.programmeId || 'general').trim();
      const phase: 'pre' | 'post' = req.body?.phase === 'post' ? 'post' : 'pre';
      const maxScore = Math.max(1, Number(req.body?.maxScore ?? 5));
      const score = Math.max(0, Math.min(maxScore, Number(req.body?.score ?? 4)));
      const evaluation = {
        id: makeId('eval'),
        programmeId,
        district,
        phase,
        score,
        maxScore,
        accessibilityBarrier: req.body?.accessibilityBarrier
          ? String(req.body.accessibilityBarrier).trim()
          : undefined,
        feedbackNote: req.body?.feedbackNote ? String(req.body.feedbackNote).trim() : undefined,
        topic: req.body?.topic ? String(req.body.topic).trim() : 'Community Workshop Check',
        submittedAt: now,
      };
      db.evaluations.unshift(evaluation);
      saveDb(db);
      emitRealtimeEvent({
        event: 'programme:updated',
        payload: { evaluationId: evaluation.id, district },
        broadcastAll: true,
      });
      return res.status(201).json({ entryType, evaluation });
    }

    if (entryType === 'local_need') {
      const category = String(req.body?.category || 'awareness_gap').trim();
      const observation = String(req.body?.observation || req.body?.description || '').trim();
      if (!observation) {
        return res.status(400).json({ error: 'Please describe the local need or barrier observed.' });
      }
      const needRecord = {
        id: makeId('need'),
        district,
        category,
        observation,
        createdAt: now,
      };
      db.localNeeds.unshift(needRecord);
      saveDb(db);
      emitRealtimeEvent({
        event: 'programme:updated',
        payload: { needId: needRecord.id, district },
        broadcastAll: true,
      });
      return res.status(201).json({ entryType, localNeed: needRecord });
    }

    // Default: 'programme' quick entry
    const title = String(req.body?.title || '').trim();
    const description = String(req.body?.description || req.body?.objective || '').trim();
    if (!title || !description) {
      return res.status(400).json({ error: 'Programme title and short summary are required.' });
    }

    const ownerId = req.authUser?.id || 'community_coordinator_public';
    let org = db.communityOrgs.find(o => o.ownerUserId === ownerId);
    if (!org) {
      org = {
        id: makeId('org'),
        ownerUserId: ownerId,
        name: String(req.body?.orgName || req.authUser?.name || `${district} Prevention Partner`).trim(),
        category: 'community_org',
        professionalRole: 'Community Builder',
        district,
        intendedUse: 'Kerala prevention & community wellness sessions',
        verificationStatus: req.body?.verifiedPartner === true ? 'approved' : 'pending',
        createdAt: now,
      };
      db.communityOrgs.unshift(org);
    }

    const programme = {
      id: makeId('prog'),
      orgId: org.id,
      orgName: org.name,
      orgCategory: org.category,
      district,
      title,
      type: String(req.body?.type || 'community_education'),
      description,
      objective: String(req.body?.objective || description),
      targetAudience: String(req.body?.targetAudience || 'Students, Youth & Families'),
      format:
        req.body?.format === 'online' || req.body?.format === 'hybrid'
          ? (req.body.format as 'online' | 'hybrid')
          : ('in_person' as const),
      location: String(req.body?.location || district),
      date: String(req.body?.date || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]),
      time: String(req.body?.time || '10:30 AM'),
      eligibility: 'Open & Voluntary',
      contactInfo: String(req.body?.contactInfo || org.contactEmail || 'Vimukthi 14405'),
      capacity: Math.max(5, Number(req.body?.capacity || 60)),
      registeredUserIds: [],
      verificationStatus:
        org.verificationStatus === 'approved' || req.body?.publishDirectly === true
          ? ('verified' as const)
          : ('pending' as const),
      createdAt: now,
    };
    db.programmes.unshift(programme);
    saveDb(db);
    emitRealtimeEvent({
      event: 'programme:updated',
      payload: { programmeId: programme.id, district },
      broadcastAll: true,
    });
    return res.status(201).json({
      entryType: 'programme',
      programme: {
        ...programme,
        registeredCount: 0,
        registeredUserIds: undefined,
      },
    });
  });

  // =========================================================
  // 5B. MAINTAINABLE VERIFIED KERALA & INDIA SUPPORT SERVICES
  //     + UNIFIED 5-CATEGORY DIRECTORY (ZERO PERSONAL DATA)
  // =========================================================
  const KERALA_DISTRICT_CENTROID: Record<string, { lat: number; lng: number }> = {
    Thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
    Kollam: { lat: 8.8932, lng: 76.6141 },
    Pathanamthitta: { lat: 9.2648, lng: 76.787 },
    Alappuzha: { lat: 9.4981, lng: 76.3388 },
    Kottayam: { lat: 9.5916, lng: 76.5222 },
    Idukki: { lat: 9.8495, lng: 76.9809 },
    Ernakulam: { lat: 9.9816, lng: 76.2999 },
    Thrissur: { lat: 10.5276, lng: 76.2144 },
    Palakkad: { lat: 10.7867, lng: 76.6548 },
    Malappuram: { lat: 11.051, lng: 76.0711 },
    Kozhikode: { lat: 11.2588, lng: 75.7804 },
    Wayanad: { lat: 11.6854, lng: 76.132 },
    Kannur: { lat: 11.8745, lng: 75.3704 },
    Kasaragod: { lat: 12.4996, lng: 74.9869 },
  };

  router.get('/directory/unified', (req: Request, res: Response) => {
    const db = loadDb();
    const districtFilter = req.query.district ? String(req.query.district).toLowerCase() : '';
    const categoryFilter = req.query.category ? String(req.query.category) : 'all';

    const coordForDistrict = (district?: string, idx = 0) => {
      const key =
        Object.keys(KERALA_DISTRICT_CENTROID).find(k =>
          (district || '').toLowerCase().includes(k.toLowerCase())
        ) || 'Ernakulam';
      const base = KERALA_DISTRICT_CENTROID[key];
      // Slight deterministic offset so overlapping district pins remain clickable cleanly
      const offset = ((idx % 5) - 2) * 0.012;
      return { lat: Number((base.lat + offset).toFixed(4)), lng: Number((base.lng - offset).toFixed(4)) };
    };

    type UnifiedItem = {
      id: string;
      category:
        | 'rehabilitation'
        | 'hospital_emergency'
        | 'qualified_professional'
        | 'community_programme'
        | 'education_skills';
      categoryLabel: string;
      name: string;
      district: string;
      address: string;
      phone: string;
      hours: string;
      description: string;
      services: string[];
      isGovt: boolean;
      coordinates: { lat: number; lng: number };
      verifiedStatus: string;
      sourceLabel?: string;
      officialUrl?: string;
      officialSourceUrl?: string;
    };

    const items: UnifiedItem[] = [];

    // 1 & 2. Rehabilitation Centres + Hospitals & Emergency Services from Verified Services
    db.verifiedServices
      .filter(svc => svc.verificationStatus !== 'archived')
      .forEach((svc, idx) => {
        const isEmergencyOrHospital =
          svc.serviceType === 'emergency' ||
          svc.serviceType === 'state_helpline' ||
          svc.serviceType === 'national_helpline' ||
          svc.serviceType === 'mental_health';
        const isEduSkills = svc.serviceType === 'education_skills';
        const cat: UnifiedItem['category'] = isEduSkills
          ? 'education_skills'
          : isEmergencyOrHospital
          ? 'hospital_emergency'
          : 'rehabilitation';

        items.push({
          id: svc.id,
          category: cat,
          categoryLabel:
            cat === 'education_skills'
              ? 'Education, Sports & Skills'
              : cat === 'hospital_emergency'
              ? 'Hospital & 24/7 Emergency'
              : 'Rehabilitation & De-Addiction',
          name: svc.organization,
          district: svc.district || 'All Districts',
          address: svc.location,
          phone: svc.verifiedContact,
          hours: svc.hours,
          description: svc.purposeSummary,
          services: [svc.purposeSummary],
          isGovt: true,
          coordinates: svc.coordinates || coordForDistrict(svc.district, idx),
          verifiedStatus: svc.verificationStatus,
          sourceLabel: 'Govt. / Verified Directory',
          officialUrl: svc.officialSourceUrl,
          officialSourceUrl: svc.officialSourceUrl,
        });
      });

    // 3. Qualified Approved Professionals (Strictly clinic/district centroid ONLY — zero patient locations)
    db.users
      .filter(u => u.role === 'therapist' && u.verificationStatus === 'approved')
      .forEach((ther, idx) => {
        const dist = ther.district || 'Ernakulam';
        const desc = `${ther.specialization || 'Counselling & Recovery Support'} (License: ${
          ther.licenseNumber || 'Verified'
        })`;
        items.push({
          id: `prof-${ther.id}`,
          category: 'qualified_professional',
          categoryLabel: 'Qualified Approved Professional',
          name: ther.name,
          district: dist,
          address: `${ther.institution || 'Verified Clinic'} · ${dist}, Kerala`,
          phone: ther.contactPhone || 'Connect privately in ClearPath Care',
          hours: ther.availabilityHours || 'By appointment',
          description: desc,
          services: [ther.specialization || 'Counselling & Recovery Support'],
          isGovt: false,
          coordinates: coordForDistrict(dist, idx + 1),
          verifiedStatus: 'approved',
          sourceLabel: 'Admin Verified Clinician',
        });
      });

    // 4. Verified Community Programmes
    db.programmes
      .filter(p => p.verificationStatus === 'verified')
      .forEach((prog, idx) => {
        items.push({
          id: `prog-dir-${prog.id}`,
          category: 'community_programme',
          categoryLabel: 'Verified Community Programme',
          name: prog.title,
          district: prog.district,
          address: `${prog.orgName} · ${prog.location}`,
          phone: prog.contactInfo,
          hours: `${prog.date} · ${prog.time}`,
          description: prog.description,
          services: [prog.type, prog.targetAudience].filter(Boolean),
          isGovt: false,
          coordinates: coordForDistrict(prog.district, idx + 2),
          verifiedStatus: 'verified',
          sourceLabel: 'Verified Community Initiative',
        });
      });

    // 5. Verified Kerala Education, Sports & Skill-Development Opportunities
    const staticEduSkills: UnifiedItem[] = [
      {
        id: 'edu-asap-kochi',
        category: 'education_skills',
        categoryLabel: 'Education, Sports & Skills',
        name: 'ASAP Kerala Community Skill Park — Kalamassery',
        district: 'Ernakulam',
        address: 'HMT Junction, Kalamassery, Ernakulam',
        phone: '0484-2540009',
        hours: 'Mon–Sat 9:00 AM – 5:00 PM',
        description: 'Job-ready IT, robotics, health-tech & vocational training for youth and young adults.',
        services: ['Vocational Skills', 'IT & Robotics', 'Career Training'],
        isGovt: true,
        coordinates: { lat: 10.0563, lng: 76.3228 },
        verifiedStatus: 'verified',
        sourceLabel: 'ASAP Kerala (Govt.)',
        officialUrl: 'https://asapkerala.gov.in/',
        officialSourceUrl: 'https://asapkerala.gov.in/',
      },
      {
        id: 'edu-sports-tvm',
        category: 'education_skills',
        categoryLabel: 'Education, Sports & Skills',
        name: 'Kerala State Sports Council — Central Stadium & Youth Athletics Hub',
        district: 'Thiruvananthapuram',
        address: 'Statue, Palayam, Thiruvananthapuram',
        phone: '0471-2330167',
        hours: 'Daily 6:00 AM – 7:30 PM',
        description: 'Free & subsidized athletics, football, badminton & evening team sports coaching.',
        services: ['Athletics', 'Football & Badminton', 'Youth Coaching'],
        isGovt: true,
        coordinates: { lat: 8.5042, lng: 76.9502 },
        verifiedStatus: 'verified',
        sourceLabel: 'Kerala State Sports Council',
        officialUrl: 'https://sportscouncil.kerala.gov.in/',
        officialSourceUrl: 'https://sportscouncil.kerala.gov.in/',
      },
      {
        id: 'edu-sports-kozhikode',
        category: 'education_skills',
        categoryLabel: 'Education, Sports & Skills',
        name: 'Kozhikode District Sports & Youth Skill Cell (NSS / Nehru Yuva Kendra)',
        district: 'Kozhikode',
        address: 'EMS Corporation Stadium Complex, Kozhikode',
        phone: '0495-2722550',
        hours: 'Mon–Sat 8:00 AM – 6:00 PM',
        description: 'Evening football, volunteering groups, music & digital literacy workshops for students.',
        services: ['Evening Sports', 'NSS Volunteering', 'Digital Skills'],
        isGovt: true,
        coordinates: { lat: 11.2591, lng: 75.7838 },
        verifiedStatus: 'verified',
        sourceLabel: 'District Sports & Youth Cell',
      },
      {
        id: 'edu-asap-thrissur',
        category: 'education_skills',
        categoryLabel: 'Education, Sports & Skills',
        name: 'ASAP Skill Park & Kudumbashree Youth Learning Centre — Thrissur',
        district: 'Thrissur',
        address: 'Kunnamkulam / Thrissur Collectorate Road, Thrissur',
        phone: '0487-2361001',
        hours: 'Mon–Sat 9:30 AM – 5:00 PM',
        description: 'Hands-on media, coding, hospitality & entrepreneurship pathways for healthy routines.',
        services: ['Coding & Media', 'Hospitality', 'Youth Entrepreneurship'],
        isGovt: true,
        coordinates: { lat: 10.5205, lng: 76.2121 },
        verifiedStatus: 'verified',
        sourceLabel: 'ASAP & Kudumbashree',
        officialUrl: 'https://asapkerala.gov.in/',
        officialSourceUrl: 'https://asapkerala.gov.in/',
      },
    ];
    items.push(...staticEduSkills);

    const filtered = items.filter(item => {
      if (categoryFilter && categoryFilter !== 'all' && item.category !== categoryFilter) {
        return false;
      }
      if (districtFilter && districtFilter !== 'all' && districtFilter !== 'all districts') {
        const d = item.district.toLowerCase();
        return d.includes(districtFilter) || d === 'all districts' || d === 'national';
      }
      return true;
    });

    res.json({
      items: filtered,
      categoryCounts: {
        rehabilitation: items.filter(i => i.category === 'rehabilitation').length,
        hospital_emergency: items.filter(i => i.category === 'hospital_emergency').length,
        qualified_professional: items.filter(i => i.category === 'qualified_professional').length,
        community_programme: items.filter(i => i.category === 'community_programme').length,
        education_skills: items.filter(i => i.category === 'education_skills').length,
      },
    });
  });

  router.get('/services/verified', (req: Request, res: Response) => {
    const db = loadDb();
    const district = req.query.district ? String(req.query.district).toLowerCase() : '';
    const serviceType = req.query.serviceType ? String(req.query.serviceType) : '';
    const services = db.verifiedServices.filter(svc => {
      if (district && district !== 'all' && svc.district && !svc.district.toLowerCase().includes(district)) {
        return svc.district === 'All Districts' || svc.district === 'National';
      }
      if (serviceType && serviceType !== 'all' && svc.serviceType !== serviceType) return false;
      return true;
    });
    res.json({ services });
  });

  router.post('/admin/services', requireAuth, requireRole(['admin']), (req: AuthedRequest, res: Response) => {
    const organization = String(req.body?.organization || '').trim();
    const verifiedContact = String(req.body?.verifiedContact || '').trim();
    const location = String(req.body?.location || '').trim();
    if (!organization || !verifiedContact || !location) {
      return res.status(400).json({ error: 'Organization, contact, and location are required.' });
    }
    const db = loadDb();
    const validTypes = [
      'emergency',
      'state_helpline',
      'national_helpline',
      'mental_health',
      'treatment_centre',
      'rehabilitation',
      'education_skills',
    ];
    const validStatuses = ['verified', 'pending_review', 'outdated', 'needs_reverification', 'archived'];
    const svc = {
      id: makeId('svc'),
      organization,
      verifiedContact,
      serviceType: (validTypes.includes(String(req.body?.serviceType))
        ? String(req.body.serviceType)
        : 'treatment_centre') as
        | 'emergency'
        | 'state_helpline'
        | 'national_helpline'
        | 'mental_health'
        | 'treatment_centre'
        | 'rehabilitation'
        | 'education_skills',
      purposeSummary: String(req.body?.purposeSummary || 'Verified support & de-addiction resource').trim(),
      location,
      district: req.body?.district ? String(req.body.district).trim() : undefined,
      hours: String(req.body?.hours || 'Call to confirm hours').trim(),
      officialSourceUrl: String(req.body?.officialSourceUrl || 'https://keralaexcise.gov.in/vimukthi/').trim(),
      lastVerified: String(req.body?.lastVerified || new Date().toISOString().split('T')[0]),
      verificationStatus: (validStatuses.includes(String(req.body?.verificationStatus))
        ? String(req.body.verificationStatus)
        : 'verified') as 'verified' | 'pending_review' | 'outdated' | 'needs_reverification' | 'archived',
    };
    db.verifiedServices.unshift(svc);
    appendAuditLog(db, {
      actorId: req.authUser!.id,
      actorRole: 'admin',
      action: 'ADMIN_ADDED_VERIFIED_SERVICE',
      targetType: 'service',
      targetId: svc.id,
      detail: `Added support directory entry "${organization}" (${verifiedContact})`,
    });
    saveDb(db);
    emitRealtimeEvent({ event: 'directory:updated', broadcastAll: true });
    res.status(201).json({ service: svc });
  });

  router.patch('/admin/services/:id', requireAuth, requireRole(['admin']), (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const svc = db.verifiedServices.find(s => s.id === req.params.id);
    if (!svc) return res.status(404).json({ error: 'Verified service entry not found.' });
    if (typeof req.body?.organization === 'string') svc.organization = req.body.organization.trim();
    if (typeof req.body?.verifiedContact === 'string') svc.verifiedContact = req.body.verifiedContact.trim();
    if (typeof req.body?.purposeSummary === 'string') svc.purposeSummary = req.body.purposeSummary.trim();
    if (typeof req.body?.location === 'string') svc.location = req.body.location.trim();
    if (typeof req.body?.district === 'string') svc.district = req.body.district.trim();
    if (typeof req.body?.hours === 'string') svc.hours = req.body.hours.trim();
    if (typeof req.body?.officialSourceUrl === 'string') svc.officialSourceUrl = req.body.officialSourceUrl.trim();
    if (typeof req.body?.lastVerified === 'string') svc.lastVerified = req.body.lastVerified.trim();
    if (
      ['verified', 'pending_review', 'outdated', 'needs_reverification', 'archived'].includes(
        String(req.body?.verificationStatus)
      )
    ) {
      svc.verificationStatus = req.body.verificationStatus;
    }
    appendAuditLog(db, {
      actorId: req.authUser!.id,
      actorRole: 'admin',
      action: 'ADMIN_UPDATED_VERIFIED_SERVICE',
      targetType: 'service',
      targetId: svc.id,
      detail: `Updated support directory entry "${svc.organization}" (${svc.verificationStatus})`,
    });
    saveDb(db);
    emitRealtimeEvent({ event: 'directory:updated', broadcastAll: true });
    res.json({ service: svc });
  });

  // =========================================================
  // 6. SAFEGUARDED NON-DIAGNOSTIC AI HELPERS (PART 8)
  // =========================================================
  router.post('/ai/summarize-context', async (req: Request, res: Response) => {
    const texts: string[] = Array.isArray(req.body?.texts)
      ? req.body.texts.map(String).filter(Boolean)
      : req.body?.text
      ? [String(req.body.text)]
      : [];
    const language = req.body?.language === 'ml' ? 'ml' : 'en';

    if (texts.length === 0) {
      return res.json({
        summaryBullets: [],
        clinicianTopics: [],
        nonDiagnosticNotice:
          'User-stated context summary only — does not establish a medical diagnosis.',
        source: 'fallback',
      });
    }

    const fallback = {
      summaryBullets: texts.slice(0, 4).map(t => `You noted in your own words: "${t.slice(0, 140)}"`),
      clinicianTopics: [
        'Share these personal observations openly with a qualified counselor or Vimukthi physician',
        'Ask about practical options tailored to your daily routine and comfort',
      ],
      nonDiagnosticNotice:
        language === 'ml'
          ? 'ഇത് നിങ്ങൾ സ്വന്തം വാക്കുകളിൽ രേഖപ്പെടുത്തിയ വിവരങ്ങളുടെ സംഗ്രഹം മാത്രമാണ് — രോഗനിർണ്ണയമല്ല.'
          : 'Summary of your own words for personal review — this is NOT a medical diagnosis or risk verdict.',
      source: 'fallback',
    };

    const ai = getGeminiClient();
    if (!ai) return res.json(fallback);

    try {
      const response = await withGeminiTimeout(ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Summarize these user-written context notes clearly in ${language === 'ml' ? 'Malayalam' : 'English'} for their personal review or optional sharing with a counselor:
${texts.map((t, i) => `${i + 1}. "${t}"`).join('\n')}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'Summarize strictly what the user wrote in calm, neutral, respectful words. NEVER invent symptoms, NEVER diagnose substance use disorder, NEVER recommend medications, and NEVER compute unverified risk scores.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summaryBullets: { type: Type.ARRAY, items: { type: Type.STRING } },
              clinicianTopics: { type: Type.ARRAY, items: { type: Type.STRING } },
              nonDiagnosticNotice: { type: Type.STRING },
            },
            required: ['summaryBullets', 'clinicianTopics', 'nonDiagnosticNotice'],
          },
        },
      }));
      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json({ ...fallback, ...parsed, source: 'gemini' });
    } catch {
      return res.json(fallback);
    }
  });

  router.post('/ai/motivation', async (req: Request, res: Response) => {
    const step = String(req.body?.step || 'values').trim();
    const userMessage = String(req.body?.userMessage || '').trim();
    const language = req.body?.language === 'ml' ? 'ml' : 'en';

    const stepFallbacks: Record<string, { reflection: string; nextQuestion: string }> = {
      values: {
        reflection:
          'Taking a moment to notice what matters most to you—on your own terms—is meaningful without any rush.',
        nextQuestion:
          'When you picture a calmer week ahead, what one personal value or relationship matters most to protect?',
      },
      reasons: {
        reflection:
          'Your own reasons for considering change carry far more lasting strength than anyone else’s rules.',
        nextQuestion:
          'Even if part of you feels unsure, what are 1 or 2 gentle reasons a shift might feel worth exploring?',
      },
      ambivalence: {
        reflection:
          'Feeling two ways at once is completely normal. Change rarely starts with 100% certainty.',
        nextQuestion:
          'On one hand, what makes staying the same feel familiar right now—and on the other hand, what feels tiring about it?',
      },
      strengths: {
        reflection:
          'You have navigated difficult days before using abilities you already possess.',
        nextQuestion:
          'What is one personal strength, friend, or everyday habit that has helped you steady yourself in the past?',
      },
      barriers: {
        reflection:
          'Naming what actually gets in the way helps keep any next step realistic instead of overwhelming.',
        nextQuestion:
          'What feels like the single biggest practical barrier right now—stress, sleep, environment, or unsure where to start?',
      },
      next_step: {
        reflection:
          'Keeping the next step small, chosen by you, and pauseable anytime builds genuine confidence.',
        nextQuestion:
          'What is one small, pressure-free step you choose for the next 48 hours (including simply resting or talking with someone you trust)?',
      },
    };

    const base = stepFallbacks[step] || stepFallbacks.values;
    const fallback = {
      reflection: userMessage
        ? `Reflective summary of what you shared: "${userMessage.slice(0, 160)}". ${base.reflection}`
        : base.reflection,
      nextQuestion: base.nextQuestion,
      educationalDisclaimer:
        language === 'ml'
          ? 'ഇത് സ്വയം-ചിന്തയ്ക്കുള്ള ഒരു എഐ ഗൈഡാണ്, പ്രൊഫഷണൽ തെറാപ്പിയല്ല.'
          : 'This is a self-guided educational reflection tool, not professional motivational interviewing therapy.',
      source: 'fallback',
    };

    const ai = getGeminiClient();
    if (!ai || !userMessage) return res.json(fallback);

    try {
      const response = await withGeminiTimeout(ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `MI-inspired reflective check-in stage: "${step}".
User wrote: "${userMessage}"
Language: ${language === 'ml' ? 'Malayalam' : 'English'}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'Offer a warm, brief, non-judgmental reflective summary of the user’s words and one gentle open-ended follow-up question. Never lecture, pressure, prescribe a goal, or claim to be a clinical therapist.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reflection: { type: Type.STRING },
              nextQuestion: { type: Type.STRING },
              educationalDisclaimer: { type: Type.STRING },
            },
            required: ['reflection', 'nextQuestion', 'educationalDisclaimer'],
          },
        },
      }));
      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json({ ...fallback, ...parsed, source: 'gemini' });
    } catch {
      return res.json(fallback);
    }
  });

  router.post('/ai/report-draft', async (req: Request, res: Response) => {
    const provided = req.body?.provided || {};
    const includedSections: string[] = Array.isArray(req.body?.includedSections)
      ? req.body.includedSections.map(String)
      : [];

    const fallback = {
      executiveSummary:
        includedSections.length > 0
          ? `Prepared user-selected support summary covering ${includedSections.join(', ')}. All omitted sections remain marked [Not included].`
          : 'No report sections were selected.',
      missingNotice: 'Any blank or unselected fields are explicitly preserved as [Not answered / Not included] with zero AI fabrication.',
      source: 'fallback',
    };

    const ai = getGeminiClient();
    if (!ai || includedSections.length === 0) return res.json(fallback);

    try {
      const response = await withGeminiTimeout(ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Draft a brief 2-sentence introductory note summarizing ONLY the explicitly provided report data below so the client does not have to repeat themselves in therapy. Never invent missing information.
Included sections: ${includedSections.join(', ')}
Data: ${JSON.stringify(provided).slice(0, 3000)}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'Write a concise, objective, strictly non-diagnostic 2-sentence summary note for a user-generated therapy prep report. Never diagnose or invent facts not present in Data.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveSummary: { type: Type.STRING },
              missingNotice: { type: Type.STRING },
            },
            required: ['executiveSummary', 'missingNotice'],
          },
        },
      }));
      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json({ ...fallback, ...parsed, source: 'gemini' });
    } catch {
      return res.json(fallback);
    }
  });

  // =========================================================
  // 8. SUPERVISED AI THERAPIST CLINICIAN SUPPORT
  // =========================================================
  router.post(
    '/ai/therapist-assist',
    requireAuth,
    requireApprovedTherapist,
    async (req: AuthedRequest, res: Response) => {
      const userId = String(req.body?.userId || req.body?.clientId || '').trim();
      if (!userId) {
        return res.status(400).json({ error: 'userId or clientId is required.' });
      }
      const db = loadDb();
      if (!isAuthorizedTherapistForClient(db, req.authUser!.id, userId)) {
        return res.status(403).json({ error: 'Forbidden: client is not assigned to your caseload.' });
      }
      const client = db.users.find(u => u.id === userId && u.role === 'user');
      if (!client) {
        return res.status(404).json({ error: 'Client record not found.' });
      }

      const todayIso = new Date().toISOString().split('T')[0];
      const logs = db.role1DailyLogs.filter(l => l.userId === userId).slice(0, 14);
      const goals = db.role1Goals.filter(g => g.userId === userId);
      const events = db.role1CalendarEvents.filter(e => e.userId === userId);
      const plan = db.supportPlans.find(p => p.userId === userId);
      const appts = db.appointmentNotes.filter(
        a => a.clientId === userId && a.therapistId === req.authUser!.id
      );
      const missedEvents = events.filter(e => !e.completed && e.date < todayIso);
      const missedAppts = appts.filter(
        a => a.status === 'missed' || (a.status !== 'completed' && a.appointmentDate < todayIso)
      );
      const completedGoals = goals.filter(g => g.completed).length;

      const moodCounts = logs.reduce<Record<string, number>>((acc, l) => {
        if (l.mood) acc[l.mood] = (acc[l.mood] || 0) + 1;
        return acc;
      }, {});

      const progressSummary =
        logs.length > 0
          ? `${client.name} logged ${logs.length} recent daily reflection(s) and completed ${completedGoals}/${goals.length} goals.`
          : `${client.name} has ${goals.length} active/planned goal(s) and ${logs.length} recent check-in logs recorded so far.`;
      const moodTrendText =
        Object.keys(moodCounts).length > 0
          ? `Recorded self-reported moods across recent entries: ${Object.entries(moodCounts)
              .map(([m, c]) => `${m} (${c})`)
              .join(', ')}.`
          : 'No mood tags recorded yet in recent check-ins.';
      const missedActivityFollowUps =
        missedEvents.length > 0 || missedAppts.length > 0
          ? [
              ...missedEvents
                .slice(0, 3)
                .map(
                  e =>
                    `"${e.title}" scheduled for ${e.date} remains open — explore practical barriers gently without judgment.`
                ),
              ...missedAppts
                .slice(0, 2)
                .map(
                  a =>
                    `Check-in appointment (${a.appointmentDate}) was not completed — reschedule warmly without treating missed dates as failure.`
                ),
            ]
          : ['No overdue uncompleted calendar items or missed check-ins recorded right now.'];

      const carePlanGaps = [
        !plan ? 'No structured written support plan saved yet — agree on 1–2 gentle objectives.' : null,
        goals.length === 0 ? 'No Role 01 recovery goals added yet.' : null,
        plan?.reviewDate && plan.reviewDate <= todayIso
          ? `Care plan review date (${plan.reviewDate}) is due — review objectives and next steps.`
          : null,
        client.ageRange === 'youth' || client.ageRange === '12_17'
          ? 'Minor safeguarding check: confirm age-appropriate family/guardian involvement boundaries.'
          : null,
      ].filter(Boolean) as string[];

      const appointmentPrepQuestions = [
        'Which part of your week felt most manageable, and what drained your energy?',
        missedEvents.length > 0
          ? `What got in the way of "${missedEvents[0].title}"—timing, fatigue, or stress?`
          : 'Would you like to adjust any routine times before next week?',
        'Is there anything you want documented differently in your support plan?',
      ];

      const draftActivities = [
        {
          title: '5-Minute Evening Craving Pause & Trigger Map',
          purpose: 'Clinician-review draft: build non-judgmental awareness around difficult evening hours.',
        },
        {
          title: 'Low-Barrier Routine Reset (10-Min Morning Anchor)',
          purpose: 'Clinician-review draft: pair one existing habit with hydration or brief outdoor walk.',
        },
      ];

      const boundaryDisclaimer =
        'Non-diagnostic AI clinician brief generated strictly from authorized records. AI suggestions require human clinician review and NEVER auto-modify care plans or substitute for clinical judgment.';

      const unreadMsgsCount = db.messages.filter(
        m => m.therapistId === req.authUser!.id && m.clientId === userId && m.senderRole === 'user' && !m.readAt
      ).length;
      const unreviewedLogsCount = logs.filter(l => !l.clinicianReviewNote).length;
      const unverifiedSubsCount = db.substanceConcerns.filter(
        s => s.userId === userId && s.verificationStatus === 'unverified'
      ).length;
      const detectedChanges = [
        logs[0] ? `Latest check-in (${logs[0].date}): mood "${logs[0].mood || 'unspecified'}"` : 'No recent check-in logs recorded',
        `${completedGoals}/${goals.length} goals marked complete`,
        unreadMsgsCount > 0 ? `${unreadMsgsCount} unread message(s) from client` : null,
      ].filter(Boolean) as string[];
      const missingInfoList = [
        !plan ? 'Written support plan not yet established' : null,
        goals.length === 0 ? 'No active Role 01 goals saved' : null,
        unverifiedSubsCount > 0 ? `${unverifiedSubsCount} custom substance entry pending clarification` : null,
      ].filter(Boolean) as string[];
      const overdueFollowUpsList = [
        ...missedEvents.slice(0, 3).map(e => `Open past event: "${e.title}" (${e.date})`),
        ...missedAppts.slice(0, 2).map(a => `Missed/open appointment (${a.appointmentDate})`),
        plan?.reviewDate && plan.reviewDate <= todayIso ? `Plan review due (${plan.reviewDate})` : null,
      ].filter(Boolean) as string[];

      const buildCompactRecommendationBar = (summaryLine: string) => ({
        headline: summaryLine,
        detectedChanges,
        missingInfo: missingInfoList,
        overdueFollowUps: overdueFollowUpsList,
        possibleConcern:
          missedAppts.length > 0 || logs.slice(0, 3).some(l => l.mood === 'heavy' || l.mood === 'challenged')
            ? 'Recent heavy/challenged mood tags or missed session detected — prioritize supportive check-in.'
            : unreviewedLogsCount > 0
            ? `${unreviewedLogsCount} log entry(s) awaiting clinician response.`
            : 'No acute disengagement indicators in recent entries.',
        suggestedActionForClinician:
          overdueFollowUpsList.length > 0
            ? 'Review overdue items and propose a gentle routine/plan adjustment for client agreement.'
            : !plan
            ? 'Draft an initial collaborative Care Plan Proposal for client review.'
            : 'Review recent reflections and reinforce steady coping habits.',
        reasoning: `Based strictly on ${logs.length} logged check-in(s), ${goals.length} goal(s), ${missedEvents.length} open past event(s), and ${unreadMsgsCount} unread message(s).`,
        requiresHumanApproval: true,
      });

      const fallback = {
        progressSummary,
        synthesisSummary: `${progressSummary} ${moodTrendText}`,
        moodAndWellbeingTrend: moodTrendText,
        focusAreas: [
          ...carePlanGaps,
          ...missedActivityFollowUps.slice(0, 2),
        ],
        missedActivityFollowUps,
        carePlanGaps,
        appointmentPrepQuestions,
        sessionAgendaPrompts: appointmentPrepQuestions,
        draftActivities,
        compactRecommendationBar: buildCompactRecommendationBar(progressSummary),
        cautionsAndSafeguards: [
          client.ageRange === 'youth' || client.ageRange === '12_17'
            ? 'Youth safeguarding protocol active — review guardian communication consent and confidential boundaries.'
            : 'Maintain non-judgmental framing: missed logs or appointments are not relapse or failure.',
          'Review any unverified substance descriptions or heavy-mood logs directly with the client before adjusting interventions.',
        ],
        clinicalBoundaryDisclaimer: boundaryDisclaimer,
        nonDiagnosticReminder: boundaryDisclaimer,
        source: 'fallback',
      };

      const ai = getGeminiClient();
      if (!ai) return res.json(fallback);

      try {
        const promptData = {
          clientName: client.name,
          ageRange: client.ageRange,
          recentMoods: moodCounts,
          recentNotes: logs.slice(0, 6).map(l => ({
            date: l.date,
            mood: l.mood,
            note: (l.quickNote || l.personalReflection || '').slice(0, 180),
          })),
          goalsCompleted: `${completedGoals}/${goals.length}`,
          missedEventsCount: missedEvents.length,
          missedEventTitles: missedEvents.slice(0, 5).map(e => `${e.title} (${e.date})`),
          missedAppointmentsCount: missedAppts.length,
          hasSupportPlan: Boolean(plan),
          planReviewDate: plan?.reviewDate,
        };

        const response = await withGeminiTimeout(
          ai.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: `Prepare a concise, strictly non-diagnostic therapist session-prep summary for the authorized client data below. Never diagnose, never prescribe medication, never auto-alter care plans, never label missed activities as relapse or failure, and never invent facts outside JSON.
Data: ${JSON.stringify(promptData)}`,
            config: {
              thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
              systemInstruction:
                'You assist a licensed clinician preparing for an authorized client check-in. Be factual, supportive, trauma-informed, and strictly non-diagnostic.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  progressSummary: { type: Type.STRING },
                  moodAndWellbeingTrend: { type: Type.STRING },
                  missedActivityFollowUps: { type: Type.ARRAY, items: { type: Type.STRING } },
                  carePlanGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
                  appointmentPrepQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  draftActivities: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        purpose: { type: Type.STRING },
                      },
                      required: ['title', 'purpose'],
                    },
                  },
                  cautionsAndSafeguards: { type: Type.ARRAY, items: { type: Type.STRING } },
                  clinicalBoundaryDisclaimer: { type: Type.STRING },
                },
                required: [
                  'progressSummary',
                  'moodAndWellbeingTrend',
                  'missedActivityFollowUps',
                  'carePlanGaps',
                  'appointmentPrepQuestions',
                  'clinicalBoundaryDisclaimer',
                ],
              },
            },
          })
        );
        const parsed = JSON.parse((response.text ?? '{}').trim());
        const mergedSummary = parsed.progressSummary || fallback.progressSummary;
        const mergedTrend = parsed.moodAndWellbeingTrend || fallback.moodAndWellbeingTrend;
        const mergedQuestions =
          Array.isArray(parsed.appointmentPrepQuestions) && parsed.appointmentPrepQuestions.length > 0
            ? parsed.appointmentPrepQuestions
            : fallback.appointmentPrepQuestions;
        const mergedGaps = Array.isArray(parsed.carePlanGaps) ? parsed.carePlanGaps : fallback.carePlanGaps;
        const mergedFollowUps = Array.isArray(parsed.missedActivityFollowUps)
          ? parsed.missedActivityFollowUps
          : fallback.missedActivityFollowUps;
        const mergedDisclaimer = parsed.clinicalBoundaryDisclaimer || boundaryDisclaimer;

        return res.json({
          ...fallback,
          ...parsed,
          synthesisSummary: `${mergedSummary} ${mergedTrend}`,
          compactRecommendationBar: buildCompactRecommendationBar(mergedSummary),
          focusAreas: [...mergedGaps, ...mergedFollowUps.slice(0, 2)],
          sessionAgendaPrompts: mergedQuestions,
          draftActivities:
            Array.isArray(parsed.draftActivities) && parsed.draftActivities.length > 0
              ? parsed.draftActivities
              : fallback.draftActivities,
          cautionsAndSafeguards:
            Array.isArray(parsed.cautionsAndSafeguards) && parsed.cautionsAndSafeguards.length > 0
              ? parsed.cautionsAndSafeguards
              : fallback.cautionsAndSafeguards,
          nonDiagnosticReminder: mergedDisclaimer,
          source: 'gemini',
        });
      } catch {
        return res.json(fallback);
      }
    }
  );

  // =========================================================
  // 9. ROLE 04 COMMUNITY INTELLIGENCE, IDEA WORKSPACE & AI STRATEGY LAB
  // =========================================================
  const buildKAnonymizedCommunityAggregation = (db: ClearPathDatabase) => {
    const MIN_COHORT_SIZE = 5;
    const verifiedProgrammes = db.programmes.filter(p => p.verificationStatus === 'verified');
    const districtActivityCounts = verifiedProgrammes.reduce<Record<string, number>>((acc, p) => {
      acc[p.district] = (acc[p.district] || 0) + 1;
      return acc;
    }, {});

    const participationByDistrict = KERALA_DISTRICT_INTELLIGENCE_PROFILES.map(d => {
      const progsInDist = verifiedProgrammes.filter(p => p.district === d.district);
      const rawRegs = progsInDist.reduce((sum, p) => sum + p.registeredUserIds.length, 0);
      const suppressedForPrivacy = rawRegs > 0 && rawRegs < MIN_COHORT_SIZE;
      return {
        district: d.district,
        verifiedProgrammesCount: progsInDist.length,
        totalRegistrations: suppressedForPrivacy ? null : rawRegs,
        suppressedForPrivacy,
        suppressionNote: suppressedForPrivacy
          ? `Cohort suppressed (<${MIN_COHORT_SIZE} participants) to preserve k-anonymity`
          : null,
      };
    });

    const totalEvals = db.evaluations.length;
    const evalsSuppressed = totalEvals > 0 && totalEvals < MIN_COHORT_SIZE;
    const preEvals = db.evaluations.filter(e => e.phase === 'pre');
    const postEvals = db.evaluations.filter(e => e.phase === 'post');
    const avgPct = (list: typeof preEvals) =>
      list.length === 0
        ? null
        : Math.round((list.reduce((acc, e) => acc + e.score / e.maxScore, 0) / list.length) * 100);

    const programmeOutcomes = verifiedProgrammes.map(p => {
      const progEvals = db.evaluations.filter(e => e.programmeId === p.id);
      const pre = progEvals.filter(e => e.phase === 'pre');
      const post = progEvals.filter(e => e.phase === 'post');
      const progSuppressed = progEvals.length > 0 && progEvals.length < MIN_COHORT_SIZE;
      const regsSuppressed = p.registeredUserIds.length > 0 && p.registeredUserIds.length < MIN_COHORT_SIZE;
      return {
        programmeId: p.id,
        title: p.title,
        district: p.district,
        type: p.type,
        registeredCount: regsSuppressed ? null : p.registeredUserIds.length,
        registrationsSuppressed: regsSuppressed,
        evaluationsCount: progSuppressed ? null : progEvals.length,
        outcomesSuppressed: progSuppressed,
        preAvgPct: progSuppressed ? null : avgPct(pre),
        postAvgPct: progSuppressed ? null : avgPct(post),
        privacyNotice:
          progSuppressed || regsSuppressed
            ? `Small subgroup (<${MIN_COHORT_SIZE}) masked via k-anonymity`
            : null,
      };
    });

    const barrierCounts = evalsSuppressed
      ? {}
      : db.evaluations
          .filter(e => e.accessibilityBarrier)
          .reduce<Record<string, number>>((acc, e) => {
            const key = e.accessibilityBarrier!;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {});
    // Suppress individual barriers whose count is between 1 and MIN_COHORT_SIZE - 1
    const safeBarriers: Record<string, number> = {};
    const suppressedBarrierTopicsCount = Object.entries(barrierCounts).filter(([key, cnt]) => {
      if (cnt >= MIN_COHORT_SIZE) {
        safeBarriers[key] = cnt;
        return false;
      }
      return true;
    }).length;

    const servicesByDistrict = db.verifiedServices.reduce<Record<string, number>>((acc, s) => {
      const dist = s.district || 'Kerala';
      acc[dist] = (acc[dist] || 0) + 1;
      return acc;
    }, {});

    const uncoveredDistricts = KERALA_DISTRICT_INTELLIGENCE_PROFILES.filter(
      d => (districtActivityCounts[d.district] || 0) === 0
    ).map(d => ({
      district: d.district,
      verifiedServicesCount: servicesByDistrict[d.district] || 0,
      recommendedFocus: d.recommendedPreventionFocus,
    }));

    const outcomePrePct = evalsSuppressed ? null : avgPct(preEvals);
    const outcomePostPct = evalsSuppressed ? null : avgPct(postEvals);
    const pastOutcomesSummary =
      totalEvals === 0
        ? 'No completed programme pre/post evaluations recorded yet.'
        : evalsSuppressed
        ? `${totalEvals} evaluations recorded so far (detailed outcome breakdown withheld until k >= ${MIN_COHORT_SIZE} threshold is met).`
        : `${totalEvals} anonymous evaluations across ${verifiedProgrammes.length} verified programmes: Pre-session avg ${outcomePrePct ?? 'N/A'}% -> Post-session avg ${outcomePostPct ?? 'N/A'}%. Common recurring barriers (${Object.keys(safeBarriers).join(', ') || 'none meeting threshold'}).`;

    return {
      kAnonymityMinCohort: MIN_COHORT_SIZE,
      verifiedProgrammesCount: verifiedProgrammes.length,
      totalEvaluationsCount: evalsSuppressed ? null : totalEvals,
      evaluationsSuppressed: evalsSuppressed,
      preAvgScorePct: outcomePrePct,
      postAvgScorePct: outcomePostPct,
      participationByDistrict,
      programmeOutcomes,
      safeBarriers,
      suppressedBarrierTopicsCount,
      uncoveredDistricts,
      pastOutcomesSummary,
    };
  };

  router.get('/community/intelligence', (_req: Request, res: Response) => {
    const db = loadDb();
    const verifiedProgrammes = db.programmes.filter(p => p.verificationStatus === 'verified');
    const districtActivityCounts = verifiedProgrammes.reduce<Record<string, number>>((acc, p) => {
      acc[p.district] = (acc[p.district] || 0) + 1;
      return acc;
    }, {});
    const aggregatedCommunityTrends = buildKAnonymizedCommunityAggregation(db);
    const localNeedsSummary = db.localNeeds.slice(0, 12).map(n => ({
      id: n.id,
      district: n.district,
      category: n.category,
      observation: n.observation,
      createdAt: n.createdAt,
    }));

    res.json({
      categories: EVIDENCE_CATEGORY_META,
      metrics: SUBSTANCE_INTELLIGENCE_METRICS,
      riskProtectiveFactors: COMMUNITY_RISK_PROTECTIVE_FACTORS,
      keralaDistricts: KERALA_DISTRICT_INTELLIGENCE_PROFILES.map(d => ({
        ...d,
        liveVerifiedProgrammesCount: districtActivityCounts[d.district] || 0,
      })),
      evaluationCriteria: PREVENTION_EVALUATION_CRITERIA,
      aggregatedCommunityTrends,
      localNeedsSummary,
      dataBoundaryNotice:
        'All trends and service gaps are combined anonymously. Personal recovery records never appear here, and groups smaller than 5 are hidden for privacy.',
    });
  });

  router.get('/community/ideas', optionalAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const userId = req.authUser?.id;
    const ideas = userId
      ? db.communityIdeas.filter(i => !i.userId || i.userId === userId)
      : db.communityIdeas.filter(i => !i.userId);
    res.json({ ideas });
  });

  router.post('/community/ideas', optionalAuth, (req: AuthedRequest, res: Response) => {
    const title = String(req.body?.title || '').trim();
    const summary = String(req.body?.summary || '').trim();
    if (!title || !summary) {
      return res.status(400).json({ error: 'Idea title and summary are required.' });
    }
    const db = loadDb();
    const now = new Date().toISOString();
    const idea: CommunityIdeaRecord = {
      id: makeId('idea'),
      userId: req.authUser?.id,
      title,
      focusArea: String(req.body?.focusArea || 'School & Youth Prevention').trim(),
      targetPopulation: String(req.body?.targetPopulation || 'Students Ages 14–18').trim(),
      district: String(req.body?.district || 'Ernakulam').trim(),
      summary,
      criteriaScores:
        req.body?.criteriaScores && typeof req.body.criteriaScores === 'object'
          ? req.body.criteriaScores
          : {},
      findings: Array.isArray(req.body?.findings) ? req.body.findings.map(String) : [],
      aiAnalysis:
        req.body?.aiAnalysis && typeof req.body.aiAnalysis === 'object'
          ? req.body.aiAnalysis
          : undefined,
      convertedProgrammeId: req.body?.convertedProgrammeId ? String(req.body.convertedProgrammeId) : undefined,
      createdAt: now,
      updatedAt: now,
    };
    db.communityIdeas.unshift(idea);
    saveDb(db);
    res.status(201).json({ idea });
  });

  router.patch('/community/ideas/:id', optionalAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const idea = db.communityIdeas.find(i => i.id === req.params.id);
    if (!idea) {
      return res.status(404).json({ error: 'Community idea not found.' });
    }
    if (idea.userId && req.authUser?.id !== idea.userId) {
      return res.status(403).json({ error: 'Forbidden.' });
    }
    if (typeof req.body?.title === 'string' && req.body.title.trim()) idea.title = req.body.title.trim();
    if (typeof req.body?.focusArea === 'string') idea.focusArea = req.body.focusArea.trim();
    if (typeof req.body?.targetPopulation === 'string') idea.targetPopulation = req.body.targetPopulation.trim();
    if (typeof req.body?.district === 'string') idea.district = req.body.district.trim();
    if (typeof req.body?.summary === 'string' && req.body.summary.trim()) idea.summary = req.body.summary.trim();
    if (req.body?.criteriaScores && typeof req.body.criteriaScores === 'object') {
      idea.criteriaScores = req.body.criteriaScores;
    }
    if (Array.isArray(req.body?.findings)) {
      idea.findings = req.body.findings.map(String);
    }
    if (req.body?.aiAnalysis && typeof req.body.aiAnalysis === 'object') {
      idea.aiAnalysis = req.body.aiAnalysis;
    }
    if (typeof req.body?.convertedProgrammeId === 'string') {
      idea.convertedProgrammeId = req.body.convertedProgrammeId;
    }
    idea.updatedAt = new Date().toISOString();
    saveDb(db);
    res.json({ idea });
  });

  router.delete('/community/ideas/:id', optionalAuth, (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const existing = db.communityIdeas.find(i => i.id === req.params.id);
    if (!existing) return res.status(404).json({ error: 'Idea not found.' });
    if (existing.userId && req.authUser?.id !== existing.userId) {
      return res.status(403).json({ error: 'Forbidden.' });
    }
    db.communityIdeas = db.communityIdeas.filter(i => i.id !== req.params.id);
    saveDb(db);
    res.json({ ok: true });
  });

  router.post('/ai/community-strategy', async (req: Request, res: Response) => {
    const mode = req.body?.mode === 'programme_review' ? 'programme_review' : 'brainstorm_analysis';
    const title = String(req.body?.title || 'Community Prevention Initiative').trim();
    const summary = String(req.body?.summary || req.body?.objective || '').trim();
    const targetPopulation = String(req.body?.targetPopulation || req.body?.targetAudience || 'Youth & Families').trim();
    const district = String(req.body?.district || 'Kerala').trim();
    const programmeDraft = req.body?.programmeDraft || {};
    const db = loadDb();
    const aggTrends = buildKAnonymizedCommunityAggregation(db);
    const pastOutcomesContext =
      typeof req.body?.pastOutcomesContext === 'string' && req.body.pastOutcomesContext.trim()
        ? req.body.pastOutcomesContext.trim()
        : aggTrends.pastOutcomesSummary;

    if (!summary && mode === 'brainstorm_analysis') {
      return res.status(400).json({ error: 'Please describe your community idea or context first.' });
    }

    const fallbackBrainstorm = {
      criticalChallenge:
        'Challenge check: A one-off speech or fear-based poster rarely sustains behavioural protection. Ensure active peer skills, adult mentorship, and confidential 14405/14416 help paths are paired together.',
      pastOutcomesApplied: pastOutcomesContext,
      tenPointAnalysis: {
        problemDefinition: `Clarify the specific local issue in ${district} affecting ${targetPopulation} without assuming all youth face the same driver.`,
        targetPopulation: `${targetPopulation} (segment clearly by age/setting so content stays developmentally matched).`,
        evidenceAlignment:
          'Evidence favours interactive life-skills, refusal rehearsal, and protective school/family connectedness over scare-tactic lectures (UNODC Standards; MoSJE 2019).',
        mechanismOfChange:
          'Builds peer refusal confidence, normalizes seeking confidential support early, and equips teachers/parents with non-shaming response scripts.',
        expectedOutcomesVsSpeculation:
          'Observable outcomes: post-session knowledge gain, help-seeking confidence, and helpline recall. Speculative: long-term citywide incidence reduction without multi-year follow-up.',
        resourceRequirements:
          'Trained facilitator, bilingual visual cards, anonymous Q&A box, teacher focal point, and verified Vimukthi 14405 / Tele-MANAS 14416 referral slips.',
        limitationsAndFailureRisks:
          'Curiosity rebound if graphic drug details are shown; dropout if sessions conflict with exam schedules; stigma if attendance is punitive.',
        ethicalAndSafeguarding:
          'Strictly voluntary disclosure, zero public shaming or surveillance lists, and mandatory adult referral protocol when acute distress surfaces.',
        measurableIndicators:
          'Pre/post anonymous clarity score (+% shift), completed peer roleplays, referral card uptake, and barrier check.',
        evaluationPlan:
          'Collect baseline anonymous 5-item pre-check before Session 1, immediate post-check, and 30-day facilitator review.',
      },
      programmeReviewFeedback: null as null | Record<string, unknown>,
      source: 'fallback',
    };

    const fallbackReview = {
      criticalChallenge:
        'Programme completeness check completed against 12 prevention design standards.',
      pastOutcomesApplied: pastOutcomesContext,
      tenPointAnalysis: fallbackBrainstorm.tenPointAnalysis,
      programmeReviewFeedback: {
        missingInformation: [
          !programmeDraft.safeguards ? 'Specify minor & crisis referral safeguards (14405 / 14416 / 112).' : null,
          !programmeDraft.evaluationPlan ? 'Define pre/post comparison tool or 30-day follow-up check.' : null,
          !programmeDraft.potentialRisks ? 'Document potential unintended risks (stigma, curiosity rebound, coercion).' : null,
        ].filter(Boolean),
        contradictionsOrWeakLinks:
          'Ensure measurable indicators track participant understanding/skills rather than counting headcount alone.',
        recommendedImprovements: [
          'Replace passive lectures with small-group scenario practice.',
          'Include a non-stigmatizing parent/teacher briefing alongside student sessions.',
        ],
      },
      source: 'fallback',
    };

    const ai = getGeminiClient();
    if (!ai) {
      return res.json(mode === 'programme_review' ? fallbackReview : fallbackBrainstorm);
    }

    try {
      const response = await withGeminiTimeout(
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents:
            mode === 'programme_review'
              ? `Critically review this 12-field Community Prevention Programme draft in Kerala/India. Identify weak assumptions, missing safeguards, contradictions, and concrete upgrades without inventing fake statistics or % prevented claims.\nPast Programme Outcomes Context: ${pastOutcomesContext}\nDraft: ${JSON.stringify(programmeDraft).slice(0, 3500)}`
              : `Critically evaluate and structure this community substance-prevention idea in ${district}, Kerala/India.\nTitle: ${title}\nTarget: ${targetPopulation}\nIdea: ${summary}\nPast Programme Outcomes Context: ${pastOutcomesContext}\nChallenge weak assumptions (e.g. fear lectures, vague target groups, or unmeasurable claims) and output a rigorous 10-point prevention analysis.`,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction:
              'You are a rigorous public-health & community-prevention strategy advisor. Never fabricate percentages prevented, never brand districts as dangerous, always separate outcomes from speculation, and keep safeguarding central.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                criticalChallenge: { type: Type.STRING },
                tenPointAnalysis: {
                  type: Type.OBJECT,
                  properties: {
                    problemDefinition: { type: Type.STRING },
                    targetPopulation: { type: Type.STRING },
                    evidenceAlignment: { type: Type.STRING },
                    mechanismOfChange: { type: Type.STRING },
                    expectedOutcomesVsSpeculation: { type: Type.STRING },
                    resourceRequirements: { type: Type.STRING },
                    limitationsAndFailureRisks: { type: Type.STRING },
                    ethicalAndSafeguarding: { type: Type.STRING },
                    measurableIndicators: { type: Type.STRING },
                    evaluationPlan: { type: Type.STRING },
                  },
                  required: [
                    'problemDefinition',
                    'targetPopulation',
                    'evidenceAlignment',
                    'mechanismOfChange',
                    'expectedOutcomesVsSpeculation',
                    'resourceRequirements',
                    'limitationsAndFailureRisks',
                    'ethicalAndSafeguarding',
                    'measurableIndicators',
                    'evaluationPlan',
                  ],
                },
                missingInformation: { type: Type.ARRAY, items: { type: Type.STRING } },
                contradictionsOrWeakLinks: { type: Type.STRING },
                recommendedImprovements: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['criticalChallenge', 'tenPointAnalysis'],
            },
          },
        })
      );
      const parsed = JSON.parse((response.text ?? '{}').trim());
      if (mode === 'programme_review') {
        return res.json({
          criticalChallenge: parsed.criticalChallenge || fallbackReview.criticalChallenge,
          tenPointAnalysis: parsed.tenPointAnalysis || fallbackReview.tenPointAnalysis,
          programmeReviewFeedback: {
            missingInformation: parsed.missingInformation || [],
            contradictionsOrWeakLinks: parsed.contradictionsOrWeakLinks || '',
            recommendedImprovements: parsed.recommendedImprovements || [],
          },
          source: 'gemini',
        });
      }
      return res.json({
        criticalChallenge: parsed.criticalChallenge || fallbackBrainstorm.criticalChallenge,
        tenPointAnalysis: parsed.tenPointAnalysis || fallbackBrainstorm.tenPointAnalysis,
        programmeReviewFeedback: null,
        source: 'gemini',
      });
    } catch {
      return res.json(mode === 'programme_review' ? fallbackReview : fallbackBrainstorm);
    }
  });

  // ==========================================
  // UNIFIED BRIEF PERSONALIZED AI CHAT (WITH HISTORY & READING CONTEXT)
  // ==========================================
  router.post('/ai/chat', async (req: Request, res: Response) => {
    const rawMessage = String(req.body?.message || '').trim();
    if (!rawMessage) {
      return res.status(400).json({ error: 'Please enter a message.' });
    }

    const message = rawMessage.slice(0, 1200);
    const allowedRoles = new Set(['home', 'personal', 'supporter', 'learner', 'community']);
    const role = allowedRoles.has(String(req.body?.role || ''))
      ? (String(req.body.role) as 'home' | 'personal' | 'supporter' | 'learner' | 'community')
      : 'home';
    const language = req.body?.language === 'ml' ? 'ml' : 'en';

    const rawHistory = Array.isArray(req.body?.history) ? req.body.history : [];
    const history = rawHistory
      .slice(-10)
      .map((item: any) => ({
        role: item?.role === 'assistant' ? 'assistant' : 'user',
        text: String(item?.text || '').trim().slice(0, 400),
      }))
      .filter((item: { role: string; text: string }) => item.text.length > 0);

    const rawPageCtx = req.body?.pageContext && typeof req.body.pageContext === 'object' ? req.body.pageContext : {};
    const pageContext = {
      area: String(rawPageCtx.area || '').trim().slice(0, 80),
      topicTitle: String(rawPageCtx.topicTitle || '').trim().slice(0, 160),
      snippet: String(rawPageCtx.snippet || '').trim().slice(0, 450),
    };

    const rawPerson =
      req.body?.personalization && typeof req.body.personalization === 'object' ? req.body.personalization : {};
    const personalization = {
      name: String(rawPerson.name || '').trim().slice(0, 60),
      ageRange: String(rawPerson.ageRange || '').trim().slice(0, 40),
      primaryReason: String(rawPerson.primaryReason || '').trim().slice(0, 80),
      preferredRhythm: String(rawPerson.preferredRhythm || '').trim().slice(0, 40),
      district: String(rawPerson.district || '').trim().slice(0, 60),
      mood: String(rawPerson.mood || '').trim().slice(0, 40),
      topGoal: String(rawPerson.topGoal || '').trim().slice(0, 100),
      nextLessonTitle: String(rawPerson.nextLessonTitle || '').trim().slice(0, 100),
      statsSummary: String(rawPerson.statsSummary || '').trim().slice(0, 180),
    };

    const lower = message.toLowerCase();
    const crisisPattern =
      /(overdose|unconscious|not breathing|stopped breathing|seizure|suicide|kill myself|end my life|self[- ]?harm|bleeding|chest pain|poison|collapsed|ബോധമില്ല|ആത്മഹത്യ)/i;
    const needsEmergencyHelp = crisisPattern.test(lower);

    const validActionMap: Record<string, { label: string; role: string; tab: string }> = {
      navigator: { label: 'Open Care Finder', role: 'personal', tab: 'navigator' },
      games: { label: 'Open Focus Games', role: 'personal', tab: 'games' },
      tools: { label: 'Open Calm Tools', role: 'personal', tab: 'tools' },
      dailylog: { label: 'Log How You Feel', role: 'personal', tab: 'dailylog' },
      therapist: { label: 'Find a Verified Therapist', role: 'personal', tab: 'therapist' },
      talk: { label: 'Open Talk Builder', role: 'supporter', tab: 'talk' },
      plan: { label: 'Open Care Plan', role: 'supporter', tab: 'plan' },
      support: { label: 'Find Local Support', role: 'supporter', tab: 'support' },
      understand: { label: 'Read Short Guides', role: 'supporter', tab: 'understand' },
      pathways: { label: 'Browse Topics', role: 'learner', tab: 'pathways' },
      interactive: { label: 'Open Lessons & Quizzes', role: 'learner', tab: 'interactive' },
      library: { label: 'Open Drug Facts', role: 'learner', tab: 'library' },
      generator: { label: 'Plan a Programme', role: 'community', tab: 'generator' },
      gaps: { label: 'See District Needs', role: 'community', tab: 'gaps' },
      exchange: { label: 'Browse Ideas', role: 'community', tab: 'exchange' },
    };

    const buildBriefTitle = () => {
      if (pageContext.topicTitle) return pageContext.topicTitle.slice(0, 44);
      const cleaned = message.replace(/\s+/g, ' ').trim();
      return cleaned.length > 40 ? `${cleaned.slice(0, 38)}...` : cleaned;
    };

    const pickSuggestedAction = () => {
      if (needsEmergencyHelp) {
        return {
          label: language === 'ml' ? 'സഹായ കേന്ദ്രങ്ങൾ കാണുക' : 'Open Emergency & Care Finder',
          role: role === 'supporter' ? 'supporter' : 'personal',
          tab: role === 'supporter' ? 'support' : 'navigator',
        };
      }
      if (/crav|urge|breath|calm|anxious|stress|sleep/.test(lower)) return validActionMap.tools;
      if (/game|focus|distract|bored/.test(lower)) return validActionMap.games;
      if (/therapist|doctor|counsel|clinic|hospital|vimukthi/.test(lower)) {
        return role === 'supporter' ? validActionMap.support : validActionMap.therapist;
      }
      if (/son|daughter|friend|student|family|talk|confront|parent/.test(lower)) return validActionMap.talk;
      if (/alcohol|cannabis|nicotine|mdma|vape|opioid|brain|dopamine|quiz|lesson|habit|sport/.test(lower)) {
        return validActionMap.pathways;
      }
      if (/school|college|event|campaign|district|community|programme/.test(lower)) return validActionMap.generator;
      if (role === 'supporter') return validActionMap.understand;
      if (role === 'learner') return validActionMap.pathways;
      if (role === 'community') return validActionMap.gaps;
      return validActionMap.navigator;
    };

    const buildFallbackChat = () => {
      const greetingName = personalization.name ? `${personalization.name}, ` : '';
      const mlName = personalization.name ? `${personalization.name}, ` : '';

      if (needsEmergencyHelp) {
        return {
          titleSuggestion: language === 'ml' ? 'അടിയന്തര സഹായം' : 'Immediate Safety Help',
          reply:
            language === 'ml'
              ? `${mlName}ദയവായി ഇപ്പോൾ തന്നെ 112 (എമർജൻസി) അല്ലെങ്കിൽ 14405 (വിമുക്തി) നമ്പറിൽ വിളിക്കുക. നിങ്ങൾ തനിച്ചല്ല, ഉടൻ പ്രൊഫഷണൽ സഹായം ലഭിക്കും.`
              : `${greetingName}please call 112 (Emergency) or 14405 (Vimukthi 24x7 Helpline) right away. Stay with someone safe if you can while help connects.`,
          followUpSuggestions:
            language === 'ml'
              ? ['അടുത്തുള്ള സഹായ കേന്ദ്രം കാണിക്കുക', 'ഒരാളെ എങ്ങനെ ശാന്തമായി സഹായിക്കാം?']
              : ['Show nearby emergency centers', 'What should I do while waiting for help?'],
          suggestedAction: pickSuggestedAction(),
          needsEmergencyHelp: true,
          source: 'fallback',
        };
      }

      const topicLead = pageContext.topicTitle
        ? language === 'ml'
          ? `"${pageContext.topicTitle}" എന്നതിനെക്കുറിച്ച് ലളിതമായി: `
          : `In plain words about "${pageContext.topicTitle}": `
        : '';

      const goalHint = personalization.topGoal
        ? language === 'ml'
          ? ` നിങ്ങളുടെ ലക്ഷ്യമായ "${personalization.topGoal}" മനസ്സിൽ വെച്ച് ചെറിയ ഒരു ചുവട് മതി.`
          : ` Keeping your goal ("${personalization.topGoal}") in mind, start with one small step today.`
        : '';

      let coreReply = '';
      let followUps: string[] = [];

      if (language === 'ml') {
        if (/crav|urge|stress|anxious|തലവേദന|ആഗ്രഹം/.test(lower)) {
          coreReply = `${mlName}${topicLead}ശക്തമായ തോന്നലുകൾ സാധാരണയായി 15 മിനിറ്റിനുള്ളിൽ കുറയും. ഇപ്പോൾ തണുത്ത വെള്ളം കുടിക്കുകയോ 2 മിനിറ്റ് ശ്വാസവ്യായാമം ചെയ്യുകയോ ചെയ്യുക.${goalHint}`;
          followUps = ['2 മിനിറ്റ് ശ്വാസവ്യായാമം കാണിക്കുക', 'ഇതിനെക്കുറിച്ച് ലളിതമായി വിശദീകരിക്കൂ'];
        } else if (role === 'supporter' || /family|friend|son|daughter|parent|talk/.test(lower)) {
          coreReply = `${mlName}${topicLead}കുറ്റപ്പെടുത്തുന്നതിന് പകരം കരുതലോടെ കേൾക്കുന്നതാണ് നല്ല തുടക്കം. ശാന്തമായ സമയത്ത് ചെറിയ ചോദ്യങ്ങൾ ചോദിച്ച് കൂടെയുണ്ടെന്ന് അറിയിക്കുക.${goalHint}`;
          followUps = ['എങ്ങനെ സംസാരിച്ചു തുടങ്ങാം?', 'വിമുക്തി കൗൺസിലിംഗ് എവിടെ കിട്ടും?'];
        } else if (role === 'learner' || /dopamine|brain|lesson|quiz|sport|habit/.test(lower) || pageContext.topicTitle) {
          coreReply = `${mlName}${topicLead}തലച്ചോറിലെ ശീലങ്ങൾ പതുക്കെ മാറ്റിയെടുക്കാവുന്നതാണ്. തെറ്റായ വിവരങ്ങൾക്ക് പകരം ശാസ്ത്രീയമായ അറിവും സ്പോർട്സ് പോലുള്ള നല്ല ശീലങ്ങളുമാണ് പ്രധാനം.${goalHint}`;
          followUps = ['ഒരു ചെറിയ ഉദാഹരണം തരാമോ?', 'അടുത്ത ലളിതമായ പാഠം ഏതാണ്?'];
        } else if (role === 'community' || /community|school|district|programme/.test(lower)) {
          coreReply = `${mlName}${topicLead}ഭയപ്പെടുത്തുന്ന പ്രസംഗങ്ങൾക്ക് പകരം വിദ്യാർത്ഥികളുമായി നേരിട്ട് സംവദിക്കുന്ന ചെറിയ പരിപാടികളാണ് കൂടുതൽ ഫലപ്രദം.${goalHint}`;
          followUps = ['ചെറിയൊരു സ്കൂൾ പ്ലാൻ നിർദ്ദേശിക്കാമോ?', 'ഏത് ജില്ലകളിലാണ് കൂടുതൽ ശ്രദ്ധ വേണ്ടത്?'];
        } else {
          coreReply = `${mlName}${topicLead}നിങ്ങളുടെ വിവരങ്ങൾ സ്വകാര്യമായി തന്നെ സുരക്ഷിതമാണ്. ഇപ്പോൾ ചെയ്യാവുന്ന ചെറിയൊരു അടുത്ത ചുവട് തിരഞ്ഞെടുക്കാം.${goalHint}`;
          followUps = ['ഇന്ന് ഞാൻ എന്താണ് ആദ്യം ചെയ്യേണ്ടത്?', 'ഈ ആപ്പ് എങ്ങനെ പ്രവർത്തിക്കുന്നു?'];
        }
      } else {
        if (/crav|urge|stress|anxious|withdraw/.test(lower)) {
          coreReply = `${greetingName}${topicLead}strong urges usually rise and fade within 15 to 20 minutes. Drink a glass of cold water or try a 2-minute Calm Tool right now instead of fighting it alone.${goalHint}`;
          followUps = ['Give me a 60-second calm step', 'Why do evening urges feel stronger?'];
        } else if (role === 'supporter' || /family|friend|son|daughter|parent|talk|child|student/.test(lower)) {
          coreReply = `${greetingName}${topicLead}calm care works much better than lectures or blame. Pick a quiet moment, share one honest worry, and let them know you want to help.${goalHint}`;
          followUps = ['Write 2 gentle opening lines for me', 'How do I book free Vimukthi support?'];
        } else if (role === 'learner' || /dopamine|brain|lesson|quiz|sport|habit|alcohol|cannabis|nicotine/.test(lower) || pageContext.topicTitle) {
          coreReply = `${greetingName}${topicLead}your brain builds stronger pathways from whatever you repeat daily. Real sports, sleep, and honest facts protect focus better than fear ever could.${goalHint}`;
          followUps = ['Give me one everyday example', 'What should I try next?'];
        } else if (role === 'community' || /community|school|district|programme|campaign/.test(lower)) {
          coreReply = `${greetingName}${topicLead}short, hands-on group sessions build real refusal skills much better than scary speeches. Start small with anonymous feedback so people feel safe asking questions.${goalHint}`;
          followUps = ['Draft a 2-step campus session', 'Which districts have care gaps?'];
        } else {
          coreReply = `${greetingName}${topicLead}everything you write here stays private to you until you choose to share it. Tell me what is on your mind in a few words and we will pick one simple next step.${goalHint}`;
          followUps = ['What simple step fits my day?', 'Help me understand a tool here'];
        }
      }

      return {
        titleSuggestion: buildBriefTitle(),
        reply: coreReply.trim(),
        followUpSuggestions: followUps,
        suggestedAction: pickSuggestedAction(),
        needsEmergencyHelp: false,
        source: 'fallback',
      };
    };

    const ai = getGeminiClient();
    if (!ai) {
      return res.json(buildFallbackChat());
    }

    try {
      const historyLines = history
        .map((h: { role: string; text: string }) => `${h.role === 'assistant' ? 'AI' : 'User'}: ${h.text}`)
        .join('\n');

      const prompt = `User Space: ${role}
Reply Language: ${language === 'ml' ? 'Malayalam (simple everyday Malayalam)' : 'English (simple everyday words)'}
Personalization Details: ${JSON.stringify(personalization)}
${pageContext.topicTitle ? `Currently Reading Topic: "${pageContext.topicTitle}" (${pageContext.area || role})\nExcerpt: "${pageContext.snippet}"` : ''}
Recent Chat History:
${historyLines || '(New conversation)'}
Latest User Message: "${message}"`;

      const response = await withGeminiTimeout(
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction:
              'You are ClearPath AI, ONE shared friendly guide for Drug-Free Kerala across all roles. RULES: (1) ALWAYS keep answers VERY BRIEF — strictly 2 to 3 short, simple everyday sentences (under 55 words total). Zero heavy medical jargon. (2) ALWAYS personalize using the user name, goal, mood, active space, and reading topic when present. (3) Never diagnose addiction or invent fake stats. (4) If self-harm/overdose/emergency appears, set needsEmergencyHelp=true and urge calling 112 or 14405 first. (5) Valid suggestedAction role/tab pairs: personal+navigator, personal+games, personal+tools, personal+dailylog, personal+therapist, supporter+talk, supporter+plan, supporter+support, supporter+understand, learner+pathways, learner+interactive, learner+library, community+generator, community+gaps, community+exchange (or null).',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                titleSuggestion: { type: Type.STRING },
                reply: { type: Type.STRING },
                followUpSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                suggestedAction: {
                  type: Type.OBJECT,
                  nullable: true,
                  properties: {
                    label: { type: Type.STRING },
                    role: { type: Type.STRING },
                    tab: { type: Type.STRING },
                  },
                  required: ['label', 'role', 'tab'],
                },
                needsEmergencyHelp: { type: Type.BOOLEAN },
              },
              required: ['titleSuggestion', 'reply', 'followUpSuggestions', 'needsEmergencyHelp'],
            },
          },
        }),
        7000
      );

      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json({
        titleSuggestion: String(parsed.titleSuggestion || buildBriefTitle()).slice(0, 60),
        reply: String(parsed.reply || buildFallbackChat().reply),
        followUpSuggestions: Array.isArray(parsed.followUpSuggestions)
          ? parsed.followUpSuggestions.slice(0, 3).map(String)
          : buildFallbackChat().followUpSuggestions,
        suggestedAction:
          parsed.suggestedAction && parsed.suggestedAction.label && parsed.suggestedAction.role && parsed.suggestedAction.tab
            ? parsed.suggestedAction
            : pickSuggestedAction(),
        needsEmergencyHelp: Boolean(parsed.needsEmergencyHelp || needsEmergencyHelp),
        source: 'gemini',
      });
    } catch {
      return res.json(buildFallbackChat());
    }
  });

  // ==========================================
  // DASHBOARD AI DATA + PARAGRAPH ANALYSIS (ALL ROLES)
  // ==========================================
  router.post('/ai/dashboard-analyze', async (req: Request, res: Response) => {
    const allowedRoles = new Set(['personal', 'supporter', 'learner', 'community']);
    const role = allowedRoles.has(String(req.body?.role || ''))
      ? (String(req.body.role) as 'personal' | 'supporter' | 'learner' | 'community')
      : 'personal';
    const language = req.body?.language === 'ml' ? 'ml' : 'en';
    const userName = String(req.body?.userName || '').trim().slice(0, 60);
    const summaryStats = String(req.body?.summaryStats || '').trim().slice(0, 500);
    const recentItems = Array.isArray(req.body?.recentItems)
      ? req.body.recentItems.map((item: unknown) => String(item || '').trim().slice(0, 180)).filter(Boolean).slice(0, 8)
      : [];
    const paragraphNote = String(req.body?.paragraphNote || '').trim().slice(0, 3000);

    const roleDefaultTab: Record<string, { tab: string; labelEn: string; labelMl: string }> = {
      personal: { tab: 'tools', labelEn: 'Open 2-Min Calm Tools', labelMl: '2 മിനിറ്റ് ശാന്തത ടൂളുകൾ തുറക്കുക' },
      supporter: { tab: 'talk', labelEn: 'Open Talk Builder', labelMl: 'സംസാര സഹായി തുറക്കുക' },
      learner: { tab: 'interactive', labelEn: 'Continue Short Lessons', labelMl: 'പാഠങ്ങൾ തുടരുക' },
      community: { tab: 'gaps', labelEn: 'Review District Needs', labelMl: 'ജില്ലാ ആവശ്യങ്ങൾ കാണുക' },
    };

    const pickSuggestedFromParagraph = () => {
      const low = paragraphNote.toLowerCase();
      if (role === 'personal') {
        if (/crav|urge|stress|panic|sleep|night|heavy|anxious/.test(low)) {
          return { tab: 'tools', label: language === 'ml' ? '2 മിനിറ്റ് ശാന്തത ടൂളുകൾ തുറക്കുക' : 'Open Calm Tools' };
        }
        if (/therap|doctor|counsel|clinic|help/.test(low)) {
          return { tab: 'therapist', label: language === 'ml' ? 'തെറാപ്പിസ്റ്റ് പിന്തുണ കാണുക' : 'Open Therapist Support' };
        }
        if (/goal|habit|routine/.test(low)) {
          return { tab: 'progress', label: language === 'ml' ? 'ലക്ഷ്യങ്ങൾ കാണുക' : 'Review Daily Goals' };
        }
      } else if (role === 'supporter') {
        if (/talk|speak|argue|listen|son|daughter|friend/.test(low)) {
          return { tab: 'talk', label: language === 'ml' ? 'സംസാര സഹായി തുറക്കുക' : 'Open Talk Lines' };
        }
        if (/vimukthi|hospital|center|helpline/.test(low)) {
          return { tab: 'support', label: language === 'ml' ? 'സഹായ കേന്ദ്രങ്ങൾ കാണുക' : 'Find Nearby Centers' };
        }
      } else if (role === 'learner') {
        if (/quiz|question|brain|dopamine|drug/.test(low)) {
          return { tab: 'pathways', label: language === 'ml' ? 'വിഷയങ്ങൾ വായിക്കുക' : 'Open Topic Guides' };
        }
      } else if (role === 'community') {
        if (/school|college|workshop|camp|plan/.test(low)) {
          return { tab: 'generator', label: language === 'ml' ? 'പ്രോഗ്രാം പ്ലാൻ ഉണ്ടാക്കുക' : 'Create Programme Plan' };
        }
      }
      const def = roleDefaultTab[role] || roleDefaultTab.personal;
      return { tab: def.tab, label: language === 'ml' ? def.labelMl : def.labelEn };
    };

    const suggested = pickSuggestedFromParagraph();
    const hasLongNote = paragraphNote.length > 0;
    const greeting = userName ? `${userName}, ` : '';

    const buildFallbackAnalysis = () => {
      if (language === 'ml') {
        return {
          summary: hasLongNote
            ? `${greeting}നിങ്ങൾ പങ്കുവെച്ച വിശദമായ കുറിപ്പും നിലവിലെ ഡാറ്റയും പരിശോധിച്ചു. വലിയ സമ്മർദ്ദമില്ലാതെ ഇന്ന് ചെയ്യാവുന്ന ചെറിയ ചുവടുകളിൽ ശ്രദ്ധിക്കാം.`
            : `${greeting}നിങ്ങളുടെ നിലവിലെ പ്രവർത്തനങ്ങൾ പരിശോധിച്ചു. ഒരു സമയം ചെറിയൊരു ചുവട് മാത്രം മുന്നോട്ട് വെക്കുന്നത് തുടരാം.`,
          strengths: [
            summaryStats ? `രേഖപ്പെടുത്തിയ വിവരങ്ങൾ: ${summaryStats}` : 'നിങ്ങളുടെ പുരോഗതി സ്ഥിരമായി രേഖപ്പെടുത്തുന്നുണ്ട്.',
            hasLongNote
              ? 'വിശദമായി കാര്യങ്ങൾ തുറന്നെഴുതിയത് വ്യക്തത ലഭിക്കാൻ വലിയ സഹായമാണ്.'
              : 'വിവരങ്ങൾ സ്വകാര്യമായും സുരക്ഷിതമായും സൂക്ഷിച്ചിട്ടുണ്ട്.',
          ],
          focusNext: [
            hasLongNote
              ? 'നിങ്ങൾ എഴുതിയ കുറിപ്പിലെ പ്രധാന കാര്യത്തിന് അനുസരിച്ച് താഴെയുള്ള ടൂൾ 2 മിനിറ്റ് ഉപയോഗിക്കാം.'
              : 'ഇന്ന് ചെറിയൊരു ലക്ഷ്യം മാത്രം തിരഞ്ഞെടുത്ത് പൂർത്തിയാക്കാം.',
            'സംശയമോ ആശങ്കയോ ഉണ്ടെങ്കിൽ എപ്പോൾ വേണമെങ്കിലും AI ചാറ്റിലോ 14405 ഹെൽപ്പ്‌ലൈനിലോ സഹായം തേടാം.',
          ],
          suggestedTab: suggested.tab,
          suggestedLabel: suggested.label,
          source: 'fallback',
        };
      }

      return {
        summary: hasLongNote
          ? `${greeting}I read your full note alongside your recent activity. You are naming what matters clearly—focus on one small, realistic move next instead of fixing everything at once.`
          : `${greeting}based on your recent dashboard activity, steady small habits are helping you stay grounded. Pick one practical step below for today.`,
        strengths: [
          summaryStats ? `Your current progress snapshot: ${summaryStats}` : 'You are keeping clear track of your steps.',
          hasLongNote
            ? 'Writing out a full paragraph helps spot patterns and triggers before they build up.'
            : 'Everything in your space stays private until you choose to share it.',
        ],
        focusNext: [
          hasLongNote
            ? `Start with ${suggested.label} for 2 minutes to act directly on what you wrote.`
            : `Try ${suggested.label} today as a quick, low-pressure win.`,
          'Generate your PDF summary anytime from your dashboard if you want a clean personal record or sharing copy.',
        ],
        suggestedTab: suggested.tab,
        suggestedLabel: suggested.label,
        source: 'fallback',
      };
    };

    const ai = getGeminiClient();
    if (!ai) {
      return res.json(buildFallbackAnalysis());
    }

    try {
      const prompt = `Role Workspace: ${role}
Language: ${language === 'ml' ? 'Malayalam (simple everyday words)' : 'English (simple everyday words)'}
User Name: ${userName || 'User'}
Dashboard Summary Stats: ${summaryStats || 'No stats recorded yet'}
Recent Items: ${recentItems.join(' | ') || 'None yet'}
User Paragraph Reflection:
"""
${paragraphNote || '(No paragraph note provided — analyze stats and suggest a gentle next step)'}
"""`;

      const response = await withGeminiTimeout(
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction:
              'You are ClearPath AI analyzing a user dashboard snapshot and optional long paragraph reflection. Use warm, plain everyday language a teenager can immediately understand (zero intimidating medical jargon). Never diagnose or invent numbers. Return JSON with: summary (2 brief sentences), strengths (2 short bullet strings), focusNext (2 concrete low-stress action strings), suggestedTab (one valid tab id for the role), suggestedLabel (short button label).',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                focusNext: { type: Type.ARRAY, items: { type: Type.STRING } },
                suggestedTab: { type: Type.STRING },
                suggestedLabel: { type: Type.STRING },
              },
              required: ['summary', 'strengths', 'focusNext', 'suggestedTab', 'suggestedLabel'],
            },
          },
        }),
        7000
      );

      const parsed = JSON.parse((response.text ?? '{}').trim());
      return res.json({
        summary: String(parsed.summary || buildFallbackAnalysis().summary),
        strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0
          ? parsed.strengths.slice(0, 3).map(String)
          : buildFallbackAnalysis().strengths,
        focusNext: Array.isArray(parsed.focusNext) && parsed.focusNext.length > 0
          ? parsed.focusNext.slice(0, 3).map(String)
          : buildFallbackAnalysis().focusNext,
        suggestedTab: String(parsed.suggestedTab || suggested.tab),
        suggestedLabel: String(parsed.suggestedLabel || suggested.label),
        source: 'gemini',
      });
    } catch {
      return res.json(buildFallbackAnalysis());
    }
  });

  // ==========================================
  // AI RECOVERY REPORT (WEEKLY / MONTHLY), OPPORTUNITIES & PASSPORT
  // ==========================================
  router.post('/ai/recovery-report', optionalAuth, async (req: AuthedRequest, res: Response) => {
    const period = req.body?.period === 'monthly' ? 'monthly' : 'weekly';
    const language = req.body?.language === 'ml' ? 'ml' : 'en';
    const logs = Array.isArray(req.body?.logs) ? req.body.logs : [];
    const goals = Array.isArray(req.body?.goals) ? req.body.goals : [];
    const careStatus = String(req.body?.careStatus || 'self_reported_only');
    const now = new Date();
    const daysSpan = period === 'monthly' ? 30 : 7;
    const periodEnd = now.toISOString().split('T')[0];
    const periodStart = new Date(now.getTime() - (daysSpan - 1) * 86400000).toISOString().split('T')[0];

    const windowLogs = logs.filter(
      (l: Record<string, unknown>) =>
        l && typeof l.date === 'string' && !l.isDraft && l.date >= periodStart && l.date <= periodEnd
    );

    const intensityNums = windowLogs
      .map((l: Record<string, unknown>) => l.cravingIntensity)
      .filter((v: unknown): v is number => typeof v === 'number' && !Number.isNaN(v));
    const sleepNums = windowLogs
      .map((l: Record<string, unknown>) => l.sleepHours)
      .filter((v: unknown): v is number => typeof v === 'number' && !Number.isNaN(v) && v > 0);
    const steadyRoutineDays = windowLogs.filter((l: Record<string, unknown>) => l.routineSteady === true).length;
    const completedActivitiesCount = windowLogs.reduce(
      (acc: number, l: Record<string, unknown>) =>
        acc + (Array.isArray(l.completedActivities) ? l.completedActivities.length : 0),
      0
    );

    const avgCravingIntensity =
      intensityNums.length > 0
        ? Math.round((intensityNums.reduce((a: number, b: number) => a + b, 0) / intensityNums.length) * 10) / 10
        : null;
    const avgSleepHours =
      sleepNums.length > 0
        ? Math.round((sleepNums.reduce((a: number, b: number) => a + b, 0) / sleepNums.length) * 10) / 10
        : null;

    const triggerCounts: Record<string, number> = {};
    windowLogs.forEach((l: Record<string, unknown>) => {
      if (Array.isArray(l.tags)) {
        l.tags.forEach((t: unknown) => {
          const clean = String(t || '').trim();
          if (clean) triggerCounts[clean] = (triggerCounts[clean] || 0) + 1;
        });
      }
    });
    const topTriggers = Object.entries(triggerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([tag, count]) => `${tag} (${count}x)`);

    const careStatusNote =
      careStatus === 'clinician_confirmed_treatment'
        ? 'Self-reported enrollment in formal clinical care (supplemental daily tracking only).'
        : 'Self-reported personal recovery reflection only (non-diagnostic; not a clinical diagnosis).';

    const buildFallbackReport = (source: 'fallback' | 'gemini' = 'fallback'): RecoveryReportRecord => {
      if (language === 'ml') {
        return {
          id: makeId('recrep'),
          period,
          periodStart,
          periodEnd,
          generatedAt: now.toISOString(),
          source,
          summary: `${period === 'monthly' ? 'കഴിഞ്ഞ 30 ദിവസങ്ങളിൽ' : 'കഴിഞ്ഞ 7 ദിവസങ്ങളിൽ'} നിങ്ങൾ ${windowLogs.length} ചെക്ക്-ഇന്നുകൾ രേഖപ്പെടുത്തി. ചെറിയ ചുവടുകൾ പോലും മനസ്സിന് സ്ഥിരത നൽകുന്നു.`,
          strengths: [
            `രേഖപ്പെടുത്തിയ ചെക്ക്-ഇന്നുകൾ: ${windowLogs.length} · പൂർത്തിയാക്കിയ പ്രവർത്തനങ്ങൾ: ${completedActivitiesCount}`,
            `സജീവ ലക്ഷ്യങ്ങൾ: ${goals.filter((g: Record<string, unknown>) => g.completed).length}/${goals.length} പൂർത്തിയായി.`,
          ],
          triggerPatterns:
            topTriggers.length > 0
              ? topTriggers.map((t) => `പ്രധാന പ്രലോഭന ഘടകം: ${t}`)
              : ['പ്രത്യേക ട്രിഗറുകളൊന്നും ഇതുവരെ രേഖപ്പെടുത്തിയിട്ടില്ല.'],
          routineAndSleepNote:
            avgSleepHours !== null
              ? `ശരാശരി ഉറക്കം: ${avgSleepHours} മണിക്കൂർ · സ്ഥിരമായ ദിനചര്യ: ${steadyRoutineDays} ദിവസം.`
              : `സ്ഥിരമായ ദിനചര്യ രേഖപ്പെടുത്തിയത്: ${steadyRoutineDays} ദിവസം.`,
          gentleNextSteps: [
            'വൈകുന്നേരങ്ങളിൽ മനസ്സ് അസ്വസ്ഥമാകുമ്പോൾ 2 മിനിറ്റ് Cognitive Lab ഉപയോഗിക്കുക.',
            'വിദ്യാഭ്യാസം അല്ലെങ്കിൽ നൈപുണ്യ പരിശീലനത്തിന് Opportunities വിഭാഗത്തിൽ ഒരു ചെറിയ ഘട്ടം തിരഞ്ഞെടുക്കുക.',
          ],
          careStatusNote,
          metricsSnapshot: {
            logsCount: windowLogs.length,
            completedActivitiesCount,
            avgCravingIntensity,
            avgSleepHours,
            steadyRoutineDays,
          },
        };
      }

      return {
        id: makeId('recrep'),
        period,
        periodStart,
        periodEnd,
        generatedAt: now.toISOString(),
        source,
        summary: `Across this ${period} window (${periodStart} to ${periodEnd}), you logged ${windowLogs.length} reflection(s) and completed ${completedActivitiesCount} supportive activities without judgment.`,
        strengths: [
          `Showed up for ${windowLogs.length} private check-in(s) and ${steadyRoutineDays} steady routine day(s).`,
          `Progressed on ${goals.filter((g: Record<string, unknown>) => g.completed).length} of ${goals.length} personal goals.`,
        ],
        triggerPatterns:
          topTriggers.length > 0
            ? topTriggers.map((t) => `Noticed trigger pattern: ${t}`)
            : ['No repeated trigger tags logged in this window yet.'],
        routineAndSleepNote:
          avgSleepHours !== null
            ? `Average logged sleep: ${avgSleepHours} hrs/night · Craving intensity average: ${avgCravingIntensity !== null ? `${avgCravingIntensity}/10` : 'not logged'}.`
            : `Steady routine days: ${steadyRoutineDays} · Optional craving intensity average: ${avgCravingIntensity !== null ? `${avgCravingIntensity}/10` : 'not logged'}.`,
        gentleNextSteps: [
          'Keep your next week light: focus on one evening wind-down anchor and optional sleep logging.',
          'Explore one verified Kerala skill or education step in the Opportunities tab when ready.',
        ],
        careStatusNote,
        metricsSnapshot: {
          logsCount: windowLogs.length,
          completedActivitiesCount,
          avgCravingIntensity,
          avgSleepHours,
          steadyRoutineDays,
        },
      };
    };

    const persistIfAuthed = (report: RecoveryReportRecord) => {
      if (req.authUser && req.authUser.role === 'user') {
        const db = loadDb();
        db.recoveryReports.unshift({ ...report, userId: req.authUser.id });
        db.recoveryReports = db.recoveryReports.slice(0, 300);
        saveDb(db);
      }
      return report;
    };

    const ai = getGeminiClient();
    if (!ai) {
      return res.json(persistIfAuthed(buildFallbackReport('fallback')));
    }

    try {
      const prompt = `Period: ${period} (${periodStart} to ${periodEnd})
Language: ${language === 'ml' ? 'Malayalam (simple everyday words)' : 'English (simple everyday words)'}
Care Context: ${careStatusNote}
Metrics: logs=${windowLogs.length}, activities=${completedActivitiesCount}, steadyDays=${steadyRoutineDays}, avgSleep=${avgSleepHours ?? 'N/A'}, avgCravingIntensity=${avgCravingIntensity ?? 'N/A'}, topTriggers=${topTriggers.join(', ') || 'none'}, goalsCompleted=${goals.filter((g: Record<string, unknown>) => g.completed).length}/${goals.length}`;

      const response = await withGeminiTimeout(
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            systemInstruction:
              'You are ClearPath AI generating a warm, non-diagnostic recovery reflection report. STRICT RULES: (1) NEVER invent arbitrary percentage recovery scores, clinical diagnoses, or risk ratings. (2) NEVER shame setbacks. (3) Keep sentences short, plain, and encouraging.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                triggerPatterns: { type: Type.ARRAY, items: { type: Type.STRING } },
                routineAndSleepNote: { type: Type.STRING },
                gentleNextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: ['summary', 'strengths', 'triggerPatterns', 'routineAndSleepNote', 'gentleNextSteps'],
            },
          },
        }),
        7000
      );

      const parsed = JSON.parse((response.text ?? '{}').trim());
      const base = buildFallbackReport('gemini');
      const finalReport: RecoveryReportRecord = {
        ...base,
        summary: String(parsed.summary || base.summary),
        strengths:
          Array.isArray(parsed.strengths) && parsed.strengths.length > 0
            ? parsed.strengths.slice(0, 3).map(String)
            : base.strengths,
        triggerPatterns:
          Array.isArray(parsed.triggerPatterns) && parsed.triggerPatterns.length > 0
            ? parsed.triggerPatterns.slice(0, 3).map(String)
            : base.triggerPatterns,
        routineAndSleepNote: String(parsed.routineAndSleepNote || base.routineAndSleepNote),
        gentleNextSteps:
          Array.isArray(parsed.gentleNextSteps) && parsed.gentleNextSteps.length > 0
            ? parsed.gentleNextSteps.slice(0, 3).map(String)
            : base.gentleNextSteps,
      };
      return res.json(persistIfAuthed(finalReport));
    } catch {
      return res.json(persistIfAuthed(buildFallbackReport('fallback')));
    }
  });

  router.get('/personal/reports', requireAuth, requireRole(['user']), (req: AuthedRequest, res: Response) => {
    const db = loadDb();
    const reports = db.recoveryReports
      .filter(r => r.userId === req.authUser!.id)
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
    res.json({ reports });
  });

  router.get('/opportunities/catalog', (req: Request, res: Response) => {
    const sector = String(req.query?.sector || 'all').trim();
    const query = String(req.query?.q || '').trim();
    const results = matchOpportunitiesAndSkillGaps(null, VERIFIED_OPPORTUNITY_CATALOG, sector, query);
    res.json({
      items: results.map(r => r.item),
      matches: results,
      sourceDisclaimer:
        'Verified official Kerala and Government of India skill, apprenticeship, employment, and micro-enterprise portals only.',
    });
  });

  router.post('/opportunities/match', (req: Request, res: Response) => {
    const profile =
      req.body?.profile && typeof req.body.profile === 'object'
        ? (req.body.profile as OpportunityProfile)
        : null;
    const sector = String(req.body?.sector || 'all').trim();
    const query = String(req.body?.query || '').trim();
    const matches = matchOpportunitiesAndSkillGaps(profile, VERIFIED_OPPORTUNITY_CATALOG, sector, query);
    res.json({ matches });
  });

  router.post('/personal/passport/share-preview', (req: Request, res: Response) => {
    const rawPassport = req.body?.passport;
    if (!rawPassport || typeof rawPassport !== 'object') {
      return res.status(400).json({ error: 'Recovery Passport payload is required.' });
    }
    const sanitized = buildConsentedPassportExport(rawPassport as RecoveryPassport);
    res.json(sanitized);
  });

  return router;
}
