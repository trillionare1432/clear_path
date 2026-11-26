import {
  CommunityEvent,
  CommunityFeedbackEntry,
  CommunityProgramme,
  SupportCenter,
} from '../types';

export type CareRelayStatus =
  | 'not_requested'
  | 'request_initiated'
  | 'awaiting_provider_response'
  | 'provider_contacted'
  | 'appointment_confirmed'
  | 'follow_up_requested'
  | 'closed';

export type SupportNeedFocus =
  | 'all'
  | 'urgent_helpline'
  | 'medical_detox'
  | 'counselling'
  | 'family_guidance'
  | 'rehab_aftercare';

export interface CareRelayStatusHistoryEntry {
  status: CareRelayStatus;
  timestamp: string;
  note?: string;
}

export interface CareRelayRecord {
  id: string;
  centerId: string;
  centerName: string;
  centerPhone: string;
  district: string;
  supportNeed: SupportNeedFocus;
  status: CareRelayStatus;
  consentGranted: boolean;
  consentNote: string;
  sharedSummaryText: string;
  preferredLanguage: 'en' | 'ml';
  preferredCallbackWindow?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  createdAt: string;
  updatedAt: string;
  revokedAt?: string;
  statusHistory: CareRelayStatusHistoryEntry[];
}

export type SharedItemKind =
  | 'goal_milestone'
  | 'upcoming_appointment'
  | 'support_request';

export interface SharedSupporterItem {
  id: string;
  kind: SharedItemKind;
  title: string;
  detail: string;
  targetDate?: string;
  consentGranted: boolean;
  createdAt: string;
  revokedAt?: string;
}

export interface ServiceFilterCriteria {
  district?: string;
  category?: string;
  supportNeed?: SupportNeedFocus;
  language?: 'all' | 'en' | 'ml';
  costFilter?: 'all' | 'free_govt';
  savedOnly?: boolean;
  query?: string;
}

export const CARE_RELAY_STATUS_META: Record<
  CareRelayStatus,
  { label: string; stageTag: string; description: string; isCompletedStage: boolean }
> = {
  not_requested: {
    label: 'Information Viewed',
    stageTag: 'Viewed',
    description: 'You reviewed clinic eligibility and contact information.',
    isCompletedStage: false,
  },
  request_initiated: {
    label: 'Request Initiated (Call Sheet Ready)',
    stageTag: 'Initiated',
    description:
      'Minimal consent summary prepared locally. Because live hospital booking APIs are not connected, contact the verified phone number to complete handoff.',
    isCompletedStage: false,
  },
  awaiting_provider_response: {
    label: 'Awaiting Provider Response',
    stageTag: 'Pending Reply',
    description: 'You left a message or inquiry and are waiting for a staff callback.',
    isCompletedStage: false,
  },
  provider_contacted: {
    label: 'Contact Established',
    stageTag: 'Contacted',
    description: 'Direct phone or in-person contact was made with the support centre.',
    isCompletedStage: true,
  },
  appointment_confirmed: {
    label: 'Appointment Confirmed',
    stageTag: 'Confirmed',
    description: 'Consultation date/time confirmed with the clinic. Save to your Calendar.',
    isCompletedStage: true,
  },
  follow_up_requested: {
    label: 'Follow-Up Scheduled',
    stageTag: 'Follow-up',
    description: 'Ongoing support or follow-up check-in arranged.',
    isCompletedStage: true,
  },
  closed: {
    label: 'Closed / Completed',
    stageTag: 'Closed',
    description: 'Handoff or referral episode concluded or withdrawn.',
    isCompletedStage: true,
  },
};

const NEED_KEYWORDS: Record<Exclude<SupportNeedFocus, 'all'>, string[]> = {
  urgent_helpline: ['24/7', 'crisis', 'helpline', 'triage', 'emergency', '14405'],
  medical_detox: ['detox', 'inpatient', 'psychiatric', 'medical', 'withdrawal', 'stabilization'],
  counselling: ['cbt', 'counsel', 'therapy', 'psychotherapy', 'psychology'],
  family_guidance: ['family', 'intervention', 'guidance', 'aftercare'],
  rehab_aftercare: ['reintegration', 'rehabilitation', 'aftercare', 'follow-up', 'continuity'],
};

/**
 * Pure filtering function for Kerala support services across district, need, cost, language, and query.
 */
export function filterSupportServices(
  centers: SupportCenter[],
  criteria: ServiceFilterCriteria
): SupportCenter[] {
  const q = (criteria.query || '').trim().toLowerCase();

  return centers.filter(center => {
    if (criteria.district && criteria.district !== 'All Districts' && center.district !== criteria.district) {
      return false;
    }

    if (criteria.category && criteria.category !== 'all' && center.category !== criteria.category) {
      return false;
    }

    if (criteria.costFilter === 'free_govt' && !center.isGovt) {
      return false;
    }

    if (criteria.savedOnly && !center.isSaved) {
      return false;
    }

    if (criteria.language && criteria.language !== 'all') {
      const langs = (center.languagesSupported || ['Malayalam', 'English']).map(l => l.toLowerCase());
      const needle = criteria.language === 'ml' ? 'malayalam' : 'english';
      if (!langs.some(l => l.includes(needle))) {
        return false;
      }
    }

    if (criteria.supportNeed && criteria.supportNeed !== 'all') {
      const keywords = NEED_KEYWORDS[criteria.supportNeed];
      const searchable = `${center.name} ${center.category} ${center.services.join(' ')} ${center.openingHours}`.toLowerCase();
      if (!keywords.some(kw => searchable.includes(kw))) {
        return false;
      }
    }

    if (q) {
      const searchable = `${center.name} ${center.district} ${center.address} ${center.phone} ${center.services.join(' ')} ${center.eligibility || ''}`.toLowerCase();
      if (!searchable.includes(q)) {
        return false;
      }
    }

    return true;
  });
}

export interface BuildReferralInput {
  centerName: string;
  district: string;
  supportNeed: SupportNeedFocus;
  preferredLanguage: 'en' | 'ml';
  preferredCallbackWindow?: string;
  consentGranted: boolean;
  includeDistrictInSummary?: boolean;
}

const NEED_HUMAN_LABEL: Record<SupportNeedFocus, string> = {
  all: 'General Recovery & Guidance Consultation',
  urgent_helpline: 'Confidential Triage / Helpline Consultation',
  medical_detox: 'Medical Assessment & Detox Support',
  counselling: 'Individual Counseling & Behavioral Support',
  family_guidance: 'Family Orientation & Support Guidance',
  rehab_aftercare: 'Follow-up & Continuing Care Support',
};

/**
 * Generates a strictly minimal, non-clinical consent-scoped referral summary.
 * Never embeds private journals, mood logs, or medical diagnoses.
 */
export function buildReferralHandoffSummary(input: BuildReferralInput): {
  allowed: boolean;
  summaryText: string;
  consentNote: string;
} {
  if (!input.consentGranted) {
    return {
      allowed: false,
      summaryText: '',
      consentNote: 'Explicit user consent is required before generating a handoff summary.',
    };
  }

  const parts: string[] = [
    `Support Request Type: ${NEED_HUMAN_LABEL[input.supportNeed] || NEED_HUMAN_LABEL.all}`,
    `Target Facility: ${input.centerName}`,
  ];

  if (input.includeDistrictInSummary !== false && input.district) {
    parts.push(`District Preference: ${input.district}`);
  }

  parts.push(`Preferred Language: ${input.preferredLanguage === 'ml' ? 'Malayalam / English' : 'English'}`);

  if (input.preferredCallbackWindow && input.preferredCallbackWindow.trim()) {
    parts.push(`Preferred Time Window: ${input.preferredCallbackWindow.trim()}`);
  }

  parts.push(
    'Privacy Scope: Voluntary contact inquiry only. Personal journals, trigger logs, and self-assessments remain strictly excluded.'
  );

  return {
    allowed: true,
    summaryText: parts.join('\n'),
    consentNote: 'Minimum necessary summary approved by user. Revocable anytime.',
  };
}

/**
 * Validates honest status transitions in Care Relay.
 */
export function canTransitionCareRelay(
  current: CareRelayStatus,
  next: CareRelayStatus
): boolean {
  if (current === next) return true;
  if (current === 'closed' && next !== 'request_initiated') return false;
  if (next === 'not_requested') return false;
  return true;
}

/**
 * Sanitizes an item before sharing with Role 02 Supporter Mode.
 * Enforces explicit consent and guarantees zero private log fields leak.
 */
export function sanitizeSharedSupporterItem(input: {
  id: string;
  kind: SharedItemKind;
  title: string;
  detail: string;
  targetDate?: string;
  consentGranted: boolean;
  createdAt: string;
}): SharedSupporterItem | null {
  if (!input.consentGranted) return null;
  const cleanTitle = input.title.trim().slice(0, 120);
  const cleanDetail = input.detail.trim().slice(0, 260);
  if (!cleanTitle) return null;

  return {
    id: input.id,
    kind: input.kind,
    title: cleanTitle,
    detail: cleanDetail,
    targetDate: input.targetDate || undefined,
    consentGranted: true,
    createdAt: input.createdAt,
  };
}

export function getActiveSharedSupporterItems(
  items: SharedSupporterItem[]
): SharedSupporterItem[] {
  return items.filter(item => item.consentGranted && !item.revokedAt);
}

/**
 * Separates community operational activity from follow-up / feedback outcomes
 * using strictly anonymised counts (never individual personal logs).
 */
export interface ActivityVsOutcomesSummary {
  activities: {
    programmesPublished: number;
    programmesDraftOrPending: number;
    eventsHeld: number;
    participantRegistrations: number;
    verifiedAttendanceTotal: number;
  };
  outcomes: {
    feedbackSubmissions: number;
    averageUsefulnessRating: number;
    averageClarityRating: number;
    careRelaysInitiated: number;
    careRelaysContactOrConfirmed: number;
    uncoveredDistrictCount: number;
  };
}

export function calculateActivityVsOutcomes(
  programmes: CommunityProgramme[],
  events: CommunityEvent[],
  feedback: CommunityFeedbackEntry[],
  careRelays: CareRelayRecord[],
  allDistricts: string[]
): ActivityVsOutcomesSummary {
  const programmesPublished = programmes.filter(
    p => !p.moderationStatus || p.moderationStatus === 'approved_published'
  ).length;
  const programmesDraftOrPending = programmes.length - programmesPublished;

  const participantRegistrations = programmes.reduce(
    (sum, p) => sum + (p.registeredCount || 0),
    0
  );
  const eventsHeld = events.filter(e => e.status === 'completed').length;
  const verifiedAttendanceTotal = events.reduce((sum, e) => sum + (e.actualAttendance || 0), 0);

  const feedbackCount = feedback.length;
  const avgUseful =
    feedbackCount > 0
      ? Number(
          (
            feedback.reduce((sum, f) => sum + f.usefulnessRating, 0) / feedbackCount
          ).toFixed(1)
        )
      : 0;
  const avgClarity =
    feedbackCount > 0
      ? Number(
          (feedback.reduce((sum, f) => sum + f.clarityRating, 0) / feedbackCount).toFixed(
            1
          )
        )
      : 0;

  const activeDistricts = new Set(programmes.map(p => p.district));
  const uncoveredDistrictCount = allDistricts.filter(
    d => d !== 'All Districts' && !activeDistricts.has(d)
  ).length;

  const careRelaysInitiated = careRelays.filter(r => !r.revokedAt).length;
  const careRelaysContactOrConfirmed = careRelays.filter(
    r =>
      !r.revokedAt &&
      (r.status === 'provider_contacted' ||
        r.status === 'appointment_confirmed' ||
        r.status === 'follow_up_requested' ||
        r.status === 'closed')
  ).length;

  return {
    activities: {
      programmesPublished,
      programmesDraftOrPending,
      eventsHeld,
      participantRegistrations,
      verifiedAttendanceTotal,
    },
    outcomes: {
      feedbackSubmissions: feedbackCount,
      averageUsefulnessRating: avgUseful,
      averageClarityRating: avgClarity,
      careRelaysInitiated,
      careRelaysContactOrConfirmed,
      uncoveredDistrictCount,
    },
  };
}
