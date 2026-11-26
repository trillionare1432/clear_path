import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterSupportServices,
  buildReferralHandoffSummary,
  canTransitionCareRelay,
  sanitizeSharedSupporterItem,
  getActiveSharedSupporterItems,
  calculateActivityVsOutcomes,
  CareRelayRecord,
  SharedSupporterItem,
} from './careRelay';
import { VERIFIED_SUPPORT_CENTERS, KERALA_DISTRICTS } from '../constants/initialData';
import { CommunityEvent, CommunityFeedbackEntry, CommunityProgramme } from '../types';

test('filterSupportServices filters by district, govt cost, need, and search query', () => {
  const byDistrict = filterSupportServices(VERIFIED_SUPPORT_CENTERS, {
    district: 'Ernakulam',
  });
  assert.equal(byDistrict.length, 1);
  assert.equal(byDistrict[0].id, 'gh-ernakulam');

  const detoxMatches = filterSupportServices(VERIFIED_SUPPORT_CENTERS, {
    supportNeed: 'medical_detox',
    costFilter: 'free_govt',
  });
  assert.ok(detoxMatches.length >= 4);
  assert.ok(detoxMatches.every(c => c.isGovt));

  const helplineMatches = filterSupportServices(VERIFIED_SUPPORT_CENTERS, {
    query: '14405',
  });
  assert.equal(helplineMatches.length, 1);
  assert.equal(helplineMatches[0].id, 'vimukthi-central');
});

test('buildReferralHandoffSummary requires explicit consent and never includes private logs', () => {
  const denied = buildReferralHandoffSummary({
    centerName: 'General Hospital De-Addiction Centre',
    district: 'Ernakulam',
    supportNeed: 'counselling',
    preferredLanguage: 'en',
    consentGranted: false,
  });
  assert.equal(denied.allowed, false);
  assert.equal(denied.summaryText, '');

  const approved = buildReferralHandoffSummary({
    centerName: 'General Hospital De-Addiction Centre',
    district: 'Ernakulam',
    supportNeed: 'counselling',
    preferredLanguage: 'ml',
    preferredCallbackWindow: 'Weekdays 10 AM - 1 PM',
    consentGranted: true,
    includeDistrictInSummary: true,
  });
  assert.equal(approved.allowed, true);
  assert.match(approved.summaryText, /Individual Counseling & Behavioral Support/);
  assert.match(approved.summaryText, /Ernakulam/);
  assert.match(approved.summaryText, /Weekdays 10 AM - 1 PM/);
  assert.match(approved.summaryText, /Personal journals, trigger logs, and self-assessments remain strictly excluded/);
});

test('canTransitionCareRelay enforces honest transition flow', () => {
  assert.equal(canTransitionCareRelay('request_initiated', 'provider_contacted'), true);
  assert.equal(canTransitionCareRelay('provider_contacted', 'appointment_confirmed'), true);
  assert.equal(canTransitionCareRelay('appointment_confirmed', 'not_requested'), false);
  assert.equal(canTransitionCareRelay('closed', 'appointment_confirmed'), false);
  assert.equal(canTransitionCareRelay('closed', 'request_initiated'), true);
});

test('sanitizeSharedSupporterItem and getActiveSharedSupporterItems enforce consent and instant revocation', () => {
  const blocked = sanitizeSharedSupporterItem({
    id: 'share-1',
    kind: 'goal_milestone',
    title: 'Morning routine consistency',
    detail: 'Walking 25 mins daily',
    consentGranted: false,
    createdAt: '2026-11-14T10:00:00.000Z',
  });
  assert.equal(blocked, null);

  const allowed = sanitizeSharedSupporterItem({
    id: 'share-2',
    kind: 'upcoming_appointment',
    title: 'Clinic Check-in',
    detail: 'Ernakulam OPD visit',
    targetDate: '2026-11-20',
    consentGranted: true,
    createdAt: '2026-11-14T10:00:00.000Z',
  });
  assert.ok(allowed);
  assert.equal(allowed.title, 'Clinic Check-in');

  const items: SharedSupporterItem[] = [
    allowed,
    {
      ...allowed,
      id: 'share-3',
      revokedAt: '2026-11-14T12:00:00.000Z',
    },
  ];
  const active = getActiveSharedSupporterItems(items);
  assert.equal(active.length, 1);
  assert.equal(active[0].id, 'share-2');
});

test('calculateActivityVsOutcomes cleanly separates activities from follow-up outcomes and geographic gaps', () => {
  const programmes: CommunityProgramme[] = [
    {
      id: 'p1',
      title: 'College Peer Resilience Drive',
      category: 'youth_engagement',
      objective: 'Build campus peer allies',
      targetAudience: 'College Youth',
      location: 'Kochi',
      district: 'Ernakulam',
      startDate: '2026-11-01',
      endDate: '2026-12-01',
      coordinatorId: 'c1',
      teamMemberIds: [],
      requiredResources: 'Slides',
      budget: 5000,
      spent: 1000,
      status: 'active',
      expectedOutcomes: 'Stronger peer support',
      createdAt: '2026-11-01',
      moderationStatus: 'approved_published',
      registeredCount: 42,
    },
    {
      id: 'p2',
      title: 'Draft Parent Evening',
      category: 'family_awareness',
      objective: 'Parent literacy',
      targetAudience: 'Parents',
      location: 'Aluva',
      district: 'Ernakulam',
      startDate: '2026-11-15',
      endDate: '2026-11-20',
      coordinatorId: 'c1',
      teamMemberIds: [],
      requiredResources: 'Hall',
      budget: 2000,
      spent: 0,
      status: 'planning',
      expectedOutcomes: 'Parent clarity',
      createdAt: '2026-11-02',
      moderationStatus: 'pending_review',
      registeredCount: 10,
    },
  ];

  const events: CommunityEvent[] = [
    {
      id: 'e1',
      programmeId: 'p1',
      title: 'Campus Session 1',
      category: 'workshop',
      date: '2026-11-05',
      startTime: '10:00',
      endTime: '11:30',
      venue: 'Main Auditorium',
      coordinatorId: 'c1',
      description: 'Session',
      targetAudience: 'Students',
      expectedAttendance: 60,
      actualAttendance: 54,
      status: 'completed',
    },
  ];

  const feedback: CommunityFeedbackEntry[] = [
    {
      id: 'f1',
      programmeId: 'p1',
      date: '2026-11-05',
      topic: 'Neuroscience Myths',
      participantGroup: 'Students',
      usefulnessRating: 5,
      clarityRating: 4,
      keyConcernsExpressed: ['Exam stress'],
      unmetNeedsSuggestions: 'More Q&A',
      anonymous: true,
    },
  ];

  const relays: CareRelayRecord[] = [
    {
      id: 'r1',
      centerId: 'gh-ernakulam',
      centerName: 'General Hospital',
      centerPhone: '+91 484 236 0052',
      district: 'Ernakulam',
      supportNeed: 'counselling',
      status: 'appointment_confirmed',
      consentGranted: true,
      consentNote: 'Approved',
      sharedSummaryText: 'Inquiry',
      preferredLanguage: 'en',
      createdAt: '2026-11-10',
      updatedAt: '2026-11-11',
      statusHistory: [],
    },
    {
      id: 'r2',
      centerId: 'vimukthi-central',
      centerName: 'Vimukthi',
      centerPhone: '14405',
      district: 'Thiruvananthapuram',
      supportNeed: 'urgent_helpline',
      status: 'request_initiated',
      consentGranted: true,
      consentNote: 'Approved',
      sharedSummaryText: 'Inquiry',
      preferredLanguage: 'ml',
      createdAt: '2026-11-12',
      updatedAt: '2026-11-12',
      statusHistory: [],
    },
  ];

  const result = calculateActivityVsOutcomes(programmes, events, feedback, relays, KERALA_DISTRICTS);
  assert.equal(result.activities.programmesPublished, 1);
  assert.equal(result.activities.programmesDraftOrPending, 1);
  assert.equal(result.activities.eventsHeld, 1);
  assert.equal(result.activities.participantRegistrations, 52);
  assert.equal(result.activities.verifiedAttendanceTotal, 54);

  assert.equal(result.outcomes.feedbackSubmissions, 1);
  assert.equal(result.outcomes.averageUsefulnessRating, 5);
  assert.equal(result.outcomes.averageClarityRating, 4);
  assert.equal(result.outcomes.careRelaysInitiated, 2);
  assert.equal(result.outcomes.careRelaysContactOrConfirmed, 1);
  assert.equal(result.outcomes.uncoveredDistrictCount, 13);
});
