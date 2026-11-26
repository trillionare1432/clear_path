import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Server } from 'node:http';
import { createClearPathApiRouter } from './apiRoutes.ts';
import { resetDbCacheForTests } from './store.ts';

let server: Server;
let baseUrl = '';
let tempDir = '';
let dbFilePath = '';

async function api(
  urlPath: string,
  options: { method?: string; token?: string; body?: unknown } = {}
): Promise<{ status: number; data: Record<string, any> }> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }
  const res = await fetch(`${baseUrl}${urlPath}`, {
    method: options.method || 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  const data = (await res.json()) as Record<string, any>;
  return { status: res.status, data };
}

before(async () => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clearpath-api-test-'));
  dbFilePath = path.join(tempDir, 'test-db.json');
  process.env.CLEARPATH_DB_PATH = dbFilePath;
  resetDbCacheForTests();

  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.use('/api', createClearPathApiRouter(() => null));

  await new Promise<void>(resolve => {
    server = app.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}/api`;
      }
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>(resolve => {
    server.close(() => resolve());
  });
  delete process.env.CLEARPATH_DB_PATH;
  resetDbCacheForTests();
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // ignore cleanup failure
  }
});

test('End-to-end RBAC, verification, consent-gated sharing, community discovery, and non-diagnostic AI flows', async () => {
  // 1. Register Client user, Therapist A, and Therapist B (Admin self-registration blocked)
  const adminSelfReg = await api('/auth/register', {
    method: 'POST',
    body: { username: 'badadmin', name: 'Bad Admin', password: 'password123', role: 'admin' },
  });
  assert.equal(adminSelfReg.status, 403);

  const clientReg = await api('/auth/register', {
    method: 'POST',
    body: {
      username: 'client_asha',
      name: 'Asha Menon',
      password: 'Password123!',
      role: 'user',
      ageRange: 'young_adult',
    },
  });
  assert.equal(clientReg.status, 201);
  const clientToken = clientReg.data.token as string;
  assert.ok(clientToken);

  const therAReg = await api('/auth/register', {
    method: 'POST',
    body: {
      username: 'dr_kiran',
      name: 'Dr. Kiran Nair',
      password: 'Password123!',
      role: 'therapist',
      licenseNumber: 'KL-PSY-4021',
      specialization: 'Addiction Recovery & CBT',
      district: 'Ernakulam',
    },
  });
  assert.equal(therAReg.status, 201);
  assert.equal(therAReg.data.user.verificationStatus, 'submitted');
  const therAToken = therAReg.data.token as string;
  const therAId = therAReg.data.user.id as string;

  const therBReg = await api('/auth/register', {
    method: 'POST',
    body: {
      username: 'dr_unauth',
      name: 'Dr. Unauthorized',
      password: 'Password123!',
      role: 'therapist',
      licenseNumber: 'KL-PSY-9999',
      specialization: 'General',
      district: 'Thrissur',
    },
  });
  assert.equal(therBReg.status, 201);
  const therBToken = therBReg.data.token as string;
  const therBId = therBReg.data.user.id as string;

  // 2. Unapproved therapist cannot access therapist directory listings or therapist dashboard/clients (403)
  const dirBefore = await api('/therapists/directory');
  assert.equal(dirBefore.status, 200);
  assert.equal(dirBefore.data.therapists.length, 0);

  const unverifiedDashboard = await api('/care/workspace', { token: therAToken });
  assert.equal(unverifiedDashboard.status, 403);

  const unverifiedShared = await api('/reports/shared', { token: therAToken });
  assert.equal(unverifiedShared.status, 403);

  // 3. Seeded Admin approves Therapist A and Therapist B
  const adminLogin = await api('/auth/login', {
    method: 'POST',
    body: { username: 'admin', password: 'ClearPathAdmin!2026' },
  });
  assert.equal(adminLogin.status, 200);
  const adminToken = adminLogin.data.token as string;

  const approveA = await api(`/admin/therapists/${therAId}/decision`, {
    method: 'POST',
    token: adminToken,
    body: { decision: 'approved' },
  });
  assert.equal(approveA.status, 200);
  assert.equal(approveA.data.therapist.verificationStatus, 'approved');

  const approveB = await api(`/admin/therapists/${therBId}/decision`, {
    method: 'POST',
    token: adminToken,
    body: { decision: 'approved' },
  });
  assert.equal(approveB.status, 200);

  const dirAfter = await api('/therapists/directory');
  assert.equal(dirAfter.data.therapists.length, 2);

  // Approved Therapist A can now open workspace (200)
  const verifiedDashboard = await api('/care/workspace', { token: therAToken });
  assert.equal(verifiedDashboard.status, 200);

  // 4. Client invites Therapist A; Therapist A accepts; Client shares a selective report
  const inviteRes = await api('/therapist/invite', {
    method: 'POST',
    token: clientToken,
    body: { therapistId: therAId, consentGranted: true },
  });
  assert.equal(inviteRes.status, 201);
  const connectionId = inviteRes.data.connection.id as string;

  const acceptRes = await api(`/therapist/connections/${connectionId}/respond`, {
    method: 'POST',
    token: therAToken,
    body: { action: 'accept' },
  });
  assert.equal(acceptRes.status, 200);
  assert.equal(acceptRes.data.connection.status, 'accepted');

  const shareRes = await api('/reports/share', {
    method: 'POST',
    token: clientToken,
    body: {
      therapistId: therAId,
      consentConfirmed: true,
      title: 'Initial Therapy Support Summary',
      sectionsIncluded: ['goals', 'mood_summary'],
      payload: {
        goals: ['Sleep before 11 PM'],
        moodSummary: '[Not included]',
      },
    },
  });
  assert.equal(shareRes.status, 201);
  const reportId = shareRes.data.report.id as string;

  // Therapist A views shared report -> viewedAt stamped
  const viewRes = await api(`/reports/${reportId}`, { token: therAToken });
  assert.equal(viewRes.status, 200);
  assert.ok(viewRes.data.report.viewedAt);
  assert.equal(viewRes.data.report.status, 'viewed');

  // Unauthorized Therapist B cannot view Client's report (403)
  const unauthReportAttempt = await api(`/reports/${reportId}`, { token: therBToken });
  assert.equal(unauthReportAttempt.status, 403);

  // 5. Therapist A assigns CBT activity; Client sees it & submits weekly progress
  const assignRes = await api('/care/assignments', {
    method: 'POST',
    token: therAToken,
    body: {
      clientId: clientReg.data.user.id,
      type: 'cbt_exercise',
      title: 'Evening Trigger Mapping',
      instructions: 'Log two evening triggers calmly without self-judgment.',
    },
  });
  assert.equal(assignRes.status, 201);

  const clientWorkspace = await api('/care/workspace', { token: clientToken });
  assert.equal(clientWorkspace.status, 200);
  assert.equal(clientWorkspace.data.assignments.length, 1);
  assert.equal(clientWorkspace.data.assignments[0].title, 'Evening Trigger Mapping');

  const wpRes = await api('/care/weekly-progress', {
    method: 'POST',
    token: clientToken,
    body: {
      therapistId: therAId,
      weekStarting: '2026-11-16',
      completedActivities: ['Evening Trigger Mapping'],
      whatHelped: 'Taking a 10-minute walk after dinner',
      questionsForTherapist: 'How to handle Friday social invitations?',
    },
  });
  assert.equal(wpRes.status, 201);

  // 6. Client revokes shared report -> Therapist A immediately loses access (403)
  const revokeRes = await api(`/reports/${reportId}/revoke`, {
    method: 'POST',
    token: clientToken,
  });
  assert.equal(revokeRes.status, 200);
  assert.equal(revokeRes.data.report.status, 'revoked');

  const postRevokeView = await api(`/reports/${reportId}`, { token: therAToken });
  assert.equal(postRevokeView.status, 403);

  // Audit logs record viewed + revoked + unauthorized attempts
  const clientLogs = await api('/audit/logs', { token: clientToken });
  assert.equal(clientLogs.status, 200);
  assert.ok(clientLogs.data.logs.length >= 2);

  // 7. Community organization registration & pending vs verified public discovery
  const orgRes = await api('/community/orgs/register', {
    method: 'POST',
    token: clientToken,
    body: {
      name: 'Kochi Youth Resilience Network',
      category: 'educational_institution',
      professionalRole: 'Coordinator',
      district: 'Ernakulam',
      contactEmail: 'coord@kyrn.example.org',
    },
  });
  assert.equal(orgRes.status, 201);
  const orgId = orgRes.data.org.id as string;
  assert.equal(orgRes.data.org.verificationStatus, 'pending');

  const progCreateRes = await api('/community/programmes', {
    method: 'POST',
    token: clientToken,
    body: {
      title: 'Campus Refusal Skills Workshop',
      district: 'Ernakulam',
      description: 'Evidence-based peer refusal skills training for college first-years.',
      type: 'school_awareness',
      targetAudience: 'College Students',
      format: 'in_person',
      capacity: 40,
    },
  });
  assert.equal(progCreateRes.status, 201);
  const progId = progCreateRes.data.programme.id as string;
  assert.equal(progCreateRes.data.programme.verificationStatus, 'pending');

  // Unauthenticated public listing hides pending programme; seat registration returns 403 before verification
  const publicListBefore = await api('/community/programmes');
  assert.equal(publicListBefore.data.programmes.length, 0);

  const regBeforeApprove = await api(`/community/programmes/${progId}/register`, {
    method: 'POST',
    token: clientToken,
  });
  assert.equal(regBeforeApprove.status, 403);

  // Admin approves organization -> programme automatically transitions to verified & appears publicly
  const approveOrg = await api(`/admin/orgs/${orgId}/decision`, {
    method: 'POST',
    token: adminToken,
    body: { decision: 'approved' },
  });
  assert.equal(approveOrg.status, 200);
  assert.equal(approveOrg.data.org.verificationStatus, 'approved');

  const publicListAfter = await api('/community/programmes?district=Ernakulam&availableOnly=true');
  assert.equal(publicListAfter.status, 200);
  assert.equal(publicListAfter.data.programmes.length, 1);
  assert.equal(publicListAfter.data.programmes[0].verificationStatus, 'verified');

  const regAfterApprove = await api(`/community/programmes/${progId}/register`, {
    method: 'POST',
    token: clientToken,
  });
  assert.equal(regAfterApprove.status, 200);
  assert.equal(regAfterApprove.data.registeredCount, 1);

  // 8. Pre/Post evaluations & server analytics reflect aggregated counts + ethical notice
  const preEval = await api('/community/evaluations', {
    method: 'POST',
    body: {
      programmeId: progId,
      district: 'Ernakulam',
      phase: 'pre',
      score: 2,
      maxScore: 5,
      accessibilityBarrier: 'Needs Malayalam handouts',
    },
  });
  assert.equal(preEval.status, 201);

  const postEval = await api('/community/evaluations', {
    method: 'POST',
    body: {
      programmeId: progId,
      district: 'Ernakulam',
      phase: 'post',
      score: 4,
      maxScore: 5,
    },
  });
  assert.equal(postEval.status, 201);

  const analyticsRes = await api('/community/analytics');
  assert.equal(analyticsRes.status, 200);
  assert.equal(analyticsRes.data.verifiedServiceData.verifiedOrgsCount, 1);
  assert.equal(analyticsRes.data.verifiedServiceData.verifiedProgrammesCount, 1);
  assert.equal(analyticsRes.data.anonymousEvaluations.preAvgScorePct, 40);
  assert.equal(analyticsRes.data.anonymousEvaluations.postAvgScorePct, 80);

  // 9. Non-diagnostic safeguarded AI fallback routes work without API key
  const summarizeRes = await api('/ai/summarize-context', {
    method: 'POST',
    body: { text: 'Struggling with late-night exam anxiety and irregular sleep.', language: 'en' },
  });
  assert.equal(summarizeRes.status, 200);
  assert.ok(Array.isArray(summarizeRes.data.summaryBullets) && summarizeRes.data.summaryBullets.length > 0);
  assert.match(summarizeRes.data.nonDiagnosticNotice, /NOT a medical diagnosis/i);

  const motivationRes = await api('/ai/motivation', {
    method: 'POST',
    body: { step: 'values', userMessage: 'I want steady focus for my semester exams.', language: 'en' },
  });
  assert.equal(motivationRes.status, 200);
  assert.ok(typeof motivationRes.data.reflection === 'string');
  assert.match(motivationRes.data.educationalDisclaimer, /not professional/i);

  const draftRes = await api('/ai/report-draft', {
    method: 'POST',
    body: {
      includedSections: ['goals'],
      provided: { goals: ['Consistent sleep'] },
    },
  });
  assert.equal(draftRes.status, 200);
  assert.match(draftRes.data.missingNotice, /zero AI fabrication/i);
});

test('6-state therapist verification, 50-entry substances, Workflow A invites, granular permissions, versioned reports, community isolation & verified services', async () => {
  const adminLogin = await api('/auth/login', {
    method: 'POST',
    body: { username: 'admin', password: 'ClearPathAdmin!2026' },
  });
  const adminToken = adminLogin.data.token as string;

  // Psychiatrist missing license number rejected (400)
  const psychMissingLic = await api('/auth/register', {
    method: 'POST',
    body: {
      username: 'dr_nolic',
      name: 'Dr. No License',
      password: 'Password123!',
      role: 'therapist',
      professionalCategory: 'psychiatrist',
      specialization: 'Addiction Psychiatry',
    },
  });
  assert.equal(psychMissingLic.status, 400);

  // Draft registration -> registration_incomplete
  const draftTher = await api('/auth/register', {
    method: 'POST',
    body: {
      username: 'dr_draft',
      name: 'Dr. Meera Das',
      password: 'Password123!',
      role: 'therapist',
      professionalCategory: 'psychiatrist',
      saveDraft: true,
    },
  });
  assert.equal(draftTher.status, 201);
  assert.equal(draftTher.data.user.verificationStatus, 'registration_incomplete');
  const drToken = draftTher.data.token as string;
  const drId = draftTher.data.user.id as string;

  // Complete credentials via PATCH -> transitions to pending_verification
  const patchProf = await api('/auth/therapist-profile', {
    method: 'PATCH',
    token: drToken,
    body: {
      licenseNumber: 'NMC-KL-7788',
      specialization: 'Dual Diagnosis & Recovery Care',
      qualifications: 'MD Psychiatry',
      supportingDocRef: 'CERT-REF-2026',
    },
  });
  assert.equal(patchProf.status, 200);
  assert.equal(patchProf.data.user.verificationStatus, 'pending_verification');

  // Admin rejects with note, then therapist resubmits, then suspended, then approved
  const rejectRes = await api(`/admin/therapists/${drId}/decision`, {
    method: 'POST',
    token: adminToken,
    body: { decision: 'rejected', verificationNote: 'Please verify license expiry' },
  });
  assert.equal(rejectRes.status, 200);
  assert.equal(rejectRes.data.therapist.verificationStatus, 'rejected');
  assert.equal(rejectRes.data.therapist.verificationNote, 'Please verify license expiry');

  const resubmit = await api('/auth/therapist-profile', {
    method: 'PATCH',
    token: drToken,
    body: { licenseNumber: 'NMC-KL-7788-2026' },
  });
  assert.equal(resubmit.data.user.verificationStatus, 'pending_verification');

  const suspendRes = await api(`/admin/therapists/${drId}/decision`, {
    method: 'POST',
    token: adminToken,
    body: { decision: 'suspended', verificationNote: 'Routine audit hold' },
  });
  assert.equal(suspendRes.data.therapist.verificationStatus, 'suspended');
  const blockedWhenSuspended = await api('/care/workspace', { token: drToken });
  assert.equal(blockedWhenSuspended.status, 403);

  const approveDr = await api(`/admin/therapists/${drId}/decision`, {
    method: 'POST',
    token: adminToken,
    body: { decision: 'approved', verificationNote: 'Credentials verified' },
  });
  assert.equal(approveDr.data.therapist.verificationStatus, 'approved');

  // 50-entry substance catalogue & synonym matcher
  const catRes = await api('/substances/catalogue');
  assert.equal(catRes.status, 200);
  assert.equal(catRes.data.entries.length, 50);

  const matchKnown = await api('/substances/match', {
    method: 'POST',
    body: { description: 'Tramadol painkiller tablets' },
  });
  assert.equal(matchKnown.status, 200);
  assert.ok(matchKnown.data.matchedEntry);

  const matchUnknown = await api('/substances/match', {
    method: 'POST',
    body: { description: 'zqx-mystery-herbal-packet-99' },
  });
  assert.equal(matchUnknown.status, 200);
  assert.equal(matchUnknown.data.confidence, 'none');

  // Register client user & log substance concern + intake + support plan
  const userReg = await api('/auth/register', {
    method: 'POST',
    body: {
      username: 'rahul_care',
      name: 'Rahul Varma',
      email: 'rahul@example.org',
      password: 'Password123!',
      role: 'user',
    },
  });
  assert.equal(userReg.status, 201);
  const uToken = userReg.data.token as string;
  const uId = userReg.data.user.id as string;

  const saveConcern = await api('/substances/concerns', {
    method: 'POST',
    token: uToken,
    body: {
      catalogueId: 'custom',
      name: 'Unidentified local sachet',
      isCustom: true,
      customOriginalText: 'Unidentified local sachet',
      verificationStatus: 'unverified',
      isMedication: false,
    },
  });
  assert.equal(saveConcern.status, 201);
  const concernId = saveConcern.data.concerns[0].id as string;

  const intakeSave = await api('/intake', {
    method: 'PUT',
    token: uToken,
    body: {
      primaryGoals: ['Stabilize evening routine'],
      multipleSubstances: false,
      circumstances: { supportSystem: 'family' },
      selectedPaths: ['guided_cbt', 'professional_finder'],
    },
  });
  assert.equal(intakeSave.status, 200);

  const planSave = await api('/support-plan', {
    method: 'PUT',
    token: uToken,
    body: {
      selectedPaths: ['guided_cbt'],
      objectives: ['Track evening triggers for 7 days'],
      approaches: ['CBT reflection worksheet'],
      reviewDate: '2026-12-01',
    },
  });
  assert.equal(planSave.status, 200);

  // Workflow A: Therapist invites client (zero user enumeration)
  const inviteUnknown = await api('/therapist/invite-client', {
    method: 'POST',
    token: drToken,
    body: { recipientContact: 'nonexistent@example.com', purpose: 'Test cancel' },
  });
  assert.equal(inviteUnknown.status, 201);
  assert.equal(inviteUnknown.data.invitation.recipientUserId, undefined);
  assert.equal(inviteUnknown.data.invitation.recipientName, undefined);

  const cancelInv = await api(`/invitations/${inviteUnknown.data.invitation.id}/cancel`, {
    method: 'POST',
    token: drToken,
  });
  assert.equal(cancelInv.status, 200);
  assert.equal(cancelInv.data.invitation.status, 'cancelled');

  const inviteRahul = await api('/therapist/invite-client', {
    method: 'POST',
    token: drToken,
    body: {
      recipientContact: 'rahul@example.org',
      purpose: 'Weekly therapeutic continuity',
      requestedPermissions: ['background', 'substances', 'goals', 'assignments', 'appointments'],
    },
  });
  assert.equal(inviteRahul.status, 201);
  const code = inviteRahul.data.invitation.code as string;

  const redeem = await api('/invitations/redeem', {
    method: 'POST',
    token: uToken,
    body: { code },
  });
  assert.equal(redeem.status, 200);

  // Rahul initially grants ONLY background + assignments (withholding substances & goals)
  const acceptInvite = await api(`/invitations/${redeem.data.invitation.id}/respond`, {
    method: 'POST',
    token: uToken,
    body: {
      action: 'accept',
      grantedCategories: ['background', 'assignments'],
    },
  });
  assert.equal(acceptInvite.status, 200);
  assert.equal(acceptInvite.data.connection.status, 'accepted');

  // Verify substances & supportPlans are withheld while ungranted
  const drWsRestricted = await api('/care/workspace', { token: drToken });
  assert.equal(drWsRestricted.status, 200);
  assert.equal(drWsRestricted.data.substanceConcerns.length, 0);
  assert.equal(drWsRestricted.data.supportPlans.length, 0);

  const deniedReview = await api(`/substances/concerns/${concernId}/clinician-review`, {
    method: 'PATCH',
    token: drToken,
    body: { clinicianReviewNote: 'Cannot view yet' },
  });
  assert.equal(deniedReview.status, 403);

  // Rahul expands permissions to include substances, goals, appointments, attachments
  const expandPerms = await api('/permissions', {
    method: 'POST',
    token: uToken,
    body: {
      therapistId: drId,
      categories: ['background', 'substances', 'goals', 'assignments', 'appointments', 'attachments'],
      accessMode: 'continuing',
      purpose: 'Clinical session review',
      downloadDisclaimerAcknowledged: true,
    },
  });
  assert.equal(expandPerms.status, 201);
  const grantId = expandPerms.data.grant.id as string;

  const drWsExpanded = await api('/care/workspace', { token: drToken });
  assert.equal(drWsExpanded.data.substanceConcerns.length, 1);
  assert.equal(drWsExpanded.data.supportPlans.length, 1);

  const allowedReview = await api(`/substances/concerns/${concernId}/clinician-review`, {
    method: 'PATCH',
    token: drToken,
    body: { clinicianReviewNote: 'Clarified in consultation; non-substance herbal supplement.' },
  });
  assert.equal(allowedReview.status, 200);
  assert.equal(allowedReview.data.concern.verificationStatus, 'clinician_reviewed');

  // Versioned report sharing + sourceManifest
  const rep1 = await api('/reports/share', {
    method: 'POST',
    token: uToken,
    body: {
      therapistId: drId,
      consentConfirmed: true,
      title: 'Care Prep Summary',
      sectionsIncluded: ['substances', 'support_plan'],
      sourceManifest: {
        substances: { source: 'user', recordedAt: new Date().toISOString() },
        support_plan: { source: 'user', recordedAt: new Date().toISOString() },
      },
      payload: { substances: [allowedReview.data.concern], support_plan: planSave.data.plan },
    },
  });
  assert.equal(rep1.status, 201);
  assert.equal(rep1.data.report.version, 1);

  const rep2 = await api('/reports/share', {
    method: 'POST',
    token: uToken,
    body: {
      therapistId: drId,
      consentConfirmed: true,
      title: 'Care Prep Summary Update',
      sectionsIncluded: ['substances'],
      sourceManifest: {
        substances: { source: 'clinician', recordedAt: new Date().toISOString() },
      },
      payload: { substances: [allowedReview.data.concern] },
    },
  });
  assert.equal(rep2.status, 201);
  assert.equal(rep2.data.report.version, 2);

  // Assignment 'not_completed' status + structured appointment prep
  const assignCreate = await api('/care/assignments', {
    method: 'POST',
    token: drToken,
    body: {
      clientId: uId,
      type: 'weekly_plan',
      title: 'Sleep Wind-down Checklist',
      purpose: 'Protect evening routine before 11 PM',
      instructions: 'Dim screens 30 mins prior',
      reviewDate: '2026-11-30',
    },
  });
  assert.equal(assignCreate.status, 201);
  const assignUpdate = await api(`/care/assignments/${assignCreate.data.assignment.id}`, {
    method: 'PATCH',
    token: uToken,
    body: { status: 'not_completed', clientReflection: 'Had exam prep late nights' },
  });
  assert.equal(assignUpdate.data.assignment.status, 'not_completed');

  const apptPrep = await api('/care/appointments/prep', {
    method: 'POST',
    token: uToken,
    body: {
      therapistId: drId,
      appointmentDate: '2026-11-28',
      appointmentTime: '10:30',
      topicsToDiscuss: ['Sleep rhythm', 'Exam stress'],
      clientQuestions: ['How to reset after late study nights?'],
      noteText: 'Pre-session agenda',
    },
  });
  assert.equal(apptPrep.status, 201);
  const apptClose = await api(`/care/appointments/${apptPrep.data.note.id}`, {
    method: 'PATCH',
    token: drToken,
    body: { status: 'completed', agreedNextSteps: 'Follow 2-day wind-down step' },
  });
  assert.equal(apptClose.data.note.status, 'completed');
  assert.equal(apptClose.data.note.agreedNextSteps, 'Follow 2-day wind-down step');

  // Revoke granular permission immediately
  const revokePerm = await api(`/permissions/${grantId}/revoke`, {
    method: 'POST',
    token: uToken,
  });
  assert.equal(revokePerm.status, 200);
  assert.equal(revokePerm.data.grant.status, 'revoked');

  // Community account isolation (403 on personal care & report endpoints)
  const commReg = await api('/auth/register', {
    method: 'POST',
    body: { username: 'comm_ngo', name: 'Kerala NGO Coordinator', password: 'Password123!', role: 'community' },
  });
  assert.equal(commReg.status, 201);
  const commToken = commReg.data.token as string;
  assert.equal((await api('/care/workspace', { token: commToken })).status, 403);
  assert.equal((await api('/reports/mine', { token: commToken })).status, 403);

  // Verified Kerala/India Support Services public GET & Admin CRUD
  const svcList = await api('/services/verified');
  assert.equal(svcList.status, 200);
  assert.ok(svcList.data.services.length >= 3);

  const svcAdd = await api('/admin/services', {
    method: 'POST',
    token: adminToken,
    body: {
      organization: 'Kottayam District De-Addiction Cell',
      verifiedContact: '0481-2560000',
      serviceType: 'treatment_centre',
      location: 'Kottayam Medical College Campus',
      district: 'Kottayam',
      hours: 'Mon-Sat 9 AM - 4 PM',
    },
  });
  assert.equal(svcAdd.status, 201);
  const svcPatch = await api(`/admin/services/${svcAdd.data.service.id}`, {
    method: 'PATCH',
    token: adminToken,
    body: { verificationStatus: 'verified', hours: 'Mon-Sat 8:30 AM - 4:30 PM' },
  });
  assert.equal(svcPatch.status, 200);
  assert.equal(svcPatch.data.service.hours, 'Mon-Sat 8:30 AM - 4:30 PM');
});

test('ClearPath API: Therapist 3-Factor Authority Login, Starter Roster & Patient Management CRUD', async () => {
  // Missing short authorityCode must fail cleanly with helpful 400
  const badAuth = await api('/auth/therapist-access', {
    method: 'POST',
    body: { username: 'dr_vikram', password: 'Password123!', authorityCode: '12' },
  });
  assert.equal(badAuth.status, 400);

  // Valid 3-factor login provisions approved therapist + seeds 2 starter connected clients
  const authRes = await api('/auth/therapist-access', {
    method: 'POST',
    body: {
      username: 'dr_vikram',
      name: 'Dr. Vikram Menon',
      password: 'Password123!',
      authorityCode: 'CLEARPATH-MD',
    },
  });
  assert.equal(authRes.status, 200);
  assert.equal(authRes.data.user.role, 'therapist');
  assert.equal(authRes.data.user.verificationStatus, 'approved');
  const thToken = authRes.data.token as string;

  const ws1 = await api('/care/workspace', { token: thToken });
  assert.equal(ws1.status, 200);
  assert.ok(ws1.data.connections.length >= 2);

  // Add a new patient directly from Therapist Dashboard
  const addCli = await api('/therapist/clients', {
    method: 'POST',
    token: thToken,
    body: {
      name: 'Rahul Varma',
      district: 'Kozhikode',
      ageRange: 'young_adult',
      primaryConcern: 'Herbal relaxation sachet',
      initialGoal: 'Track evening triggers for 7 days',
      initialNote: 'Baseline intake scheduled',
    },
  });
  assert.equal(addCli.status, 201);
  const newClientId = addCli.data.client.id as string;

  // Update the patient's profile, objectives, and substance list
  const editCli = await api(`/therapist/clients/${newClientId}`, {
    method: 'PATCH',
    token: thToken,
    body: {
      district: 'Malappuram',
      objectives: ['Keep evening check-in steady', 'Complete 2 breath resets'],
      addSubstanceName: 'Nicotine vape pod',
    },
  });
  assert.equal(editCli.status, 200);
  assert.equal(editCli.data.client.district, 'Malappuram');

  // Re-login with same credentials returns the same therapist and preserves managed client edits
  const relogin = await api('/auth/therapist-access', {
    method: 'POST',
    body: {
      username: 'dr_vikram',
      password: 'Password123!',
      authorityCode: 'CLEARPATH-MD',
    },
  });
  assert.equal(relogin.status, 200);
  const ws2 = await api('/care/workspace', { token: relogin.data.token });
  assert.equal(ws2.status, 200);
  assert.equal(ws2.data.clientProfiles[newClientId].district, 'Malappuram');
});

test('Restricted Therapist quick-code unlock ("iamtherapist"), real Role 01 user sync, and full Goal/Calendar/Journal control', async () => {
  // 1. Register new therapist in submitted/pending state
  const therReg = await api('/auth/register', {
    method: 'POST',
    body: {
      username: 'dr_sreelakshmi',
      name: 'Dr. Sreelakshmi Rao',
      password: 'Password123!',
      role: 'therapist',
      licenseNumber: 'KL-CLIN-8821',
      specialization: 'Recovery & Behavioural Care',
      district: 'Kochi',
    },
  });
  assert.equal(therReg.status, 201);
  assert.equal(therReg.data.user.verificationStatus, 'submitted');
  const therToken = therReg.data.token as string;

  // Unapproved therapist cannot access Role 01 overview
  const blockedOverview = await api('/therapist/role1/overview', { token: therToken });
  assert.equal(blockedOverview.status, 403);

  // 2. Wrong case / whitespace / wrong verification codes must be rejected with 403
  assert.equal(
    (await api('/auth/therapist-unlock', { method: 'POST', token: therToken, body: { code: 'IAMTHERAPIST' } })).status,
    403
  );
  assert.equal(
    (await api('/auth/therapist-unlock', { method: 'POST', token: therToken, body: { code: 'iamtherapist ' } })).status,
    403
  );
  assert.equal(
    (await api('/auth/therapist-unlock', { method: 'POST', token: therToken, body: { code: 'wrong' } })).status,
    403
  );

  // 3. Exact lowercase 'iamtherapist' unlocks immediately without seeding fake clients
  const unlockOk = await api('/auth/therapist-unlock', {
    method: 'POST',
    token: therToken,
    body: { code: 'iamtherapist' },
  });
  assert.equal(unlockOk.status, 200);
  assert.equal(unlockOk.data.user.verificationStatus, 'approved');

  const overviewBefore = await api('/therapist/role1/overview', { token: therToken });
  assert.equal(overviewBefore.status, 200);
  // None of Dr. Vikram's starter sample clients (Arjun/Meera) leak to Dr. Sreelakshmi
  assert.equal(
    overviewBefore.data.users.some((u: any) => String(u.id).startsWith('cli_arjun_')),
    false
  );

  // 4. Register a real Role 01 user & push real daily log, goal, and calendar event
  const r1Reg = await api('/auth/register', {
    method: 'POST',
    body: {
      username: 'manu_role1',
      name: 'Manu Thomas',
      password: 'Password123!',
      role: 'user',
      ageRange: 'young_adult',
    },
  });
  assert.equal(r1Reg.status, 201);
  const r1Token = r1Reg.data.token as string;
  const r1Id = r1Reg.data.user.id as string;
  const therId = unlockOk.data.user.id as string;

  const pushState = await api('/role1/state', {
    method: 'PUT',
    token: r1Token,
    body: {
      dailyLogs: [
        {
          id: 'log_manu_1',
          date: '2026-11-22',
          timestamp: '2026-11-22T18:30:00.000Z',
          type: 'quick',
          mood: 'challenged',
          quickNote: 'Voice reflection: Felt stressed after college but went for a calm walk.',
          completedActivities: ['Evening Walk'],
          tags: ['voice'],
        },
      ],
      goals: [
        {
          id: 'goal_manu_1',
          title: 'Daily 7 PM Walk',
          description: 'Walk 20 minutes to steady evening mood',
          category: 'physical',
          frequency: 'daily',
          milestones: [{ id: 'ms_1', title: 'Complete 3 evenings', completed: false }],
          progressNotes: [],
          completed: false,
          createdAt: '2026-11-22T10:00:00.000Z',
        },
      ],
      calendarEvents: [
        {
          id: 'evt_manu_1',
          title: 'Evening Walk Check-In',
          date: '2026-11-23',
          startTime: '19:00',
          category: 'healthy_activity',
          reminder: true,
          completed: false,
        },
      ],
    },
  });
  assert.equal(pushState.status, 200);

  // Strict RBAC check: Before client-therapist assignment exists, therapist gets 403
  const unassignedDetail = await api(`/therapist/role1/users/${r1Id}`, { token: therToken });
  assert.equal(unassignedDetail.status, 403);

  // Platform Admin unlocks via quick code 'I am admin' and assigns Manu to Dr. Sreelakshmi
  const adminQuick = await api('/auth/admin-access', {
    method: 'POST',
    body: { code: 'I am admin' },
  });
  assert.equal(adminQuick.status, 200);
  assert.equal(adminQuick.data.user.role, 'admin');
  const adminToken = adminQuick.data.token as string;

  // Mutual Selection Policy: Admin CANNOT force-assign a therapist to a patient (strictly 403)
  const assignRes = await api('/admin/therapist-assignments', {
    method: 'POST',
    token: adminToken,
    body: { clientId: r1Id, therapistId: therId },
  });
  assert.equal(assignRes.status, 403);
  assert.equal(assignRes.data.mutualSelectionPolicy, true);

  // Patient and therapist choose each other mutually via invite + accept
  const manuInvite = await api('/therapist/invite', {
    method: 'POST',
    token: r1Token,
    body: { therapistId: therId, consentGranted: true },
  });
  assert.equal(manuInvite.status, 201);
  const manuConnId = manuInvite.data.connection.id as string;
  const therAcceptManu = await api(`/therapist/connections/${manuConnId}/respond`, {
    method: 'POST',
    token: therToken,
    body: { action: 'accept' },
  });
  assert.equal(therAcceptManu.status, 200);

  // 5. Assigned Therapist inspects Manu's real Role 01 data, reviews journal, adds goal, calendar, clinical note & referral
  const detail = await api(`/therapist/role1/users/${r1Id}`, { token: therToken });
  assert.equal(detail.status, 200);
  assert.equal(detail.data.dailyLogs.length, 1);
  assert.equal(detail.data.goals.length, 1);
  assert.equal(detail.data.calendarEvents.length, 1);

  const reviewLog = await api(`/therapist/role1/users/${r1Id}/logs/log_manu_1/review`, {
    method: 'PATCH',
    token: therToken,
    body: { clinicianReviewNote: 'Great job choosing a walk during a high-stress moment.' },
  });
  assert.equal(reviewLog.status, 200);
  assert.equal(
    reviewLog.data.log.clinicianReviewNote,
    'Great job choosing a walk during a high-stress moment.'
  );

  const addGoal = await api(`/therapist/role1/users/${r1Id}/goals`, {
    method: 'POST',
    token: therToken,
    body: {
      title: 'Sleep Wind-Down by 10:30 PM',
      description: 'Dim screens 30 mins before sleep',
      category: 'routine',
      frequency: 'daily',
      milestones: ['Phone on charger outside bed'],
    },
  });
  assert.equal(addGoal.status, 201);

  const addEvt = await api(`/therapist/role1/users/${r1Id}/calendar`, {
    method: 'POST',
    token: therToken,
    body: {
      title: 'Clinical Recovery Review',
      date: '2026-11-25',
      startTime: '11:00',
      category: 'appointment',
      notes: 'Review sleep rhythm and evening walks',
    },
  });
  assert.equal(addEvt.status, 201);

  // Confidential clinical note vault (strictly isolated from Role 01 & Admin)
  const addCNote = await api(`/therapist/role1/users/${r1Id}/clinical-notes`, {
    method: 'POST',
    token: therToken,
    body: {
      noteType: 'session',
      title: 'Private Clinical Formulation',
      content: 'SECRET_CLINICAL_TEXT_DO_NOT_LEAK',
    },
  });
  assert.equal(addCNote.status, 201);

  // Role 01 user must be blocked from clinician vault
  const clientBlockedNote = await api(`/therapist/role1/users/${r1Id}/clinical-notes`, {
    token: r1Token,
  });
  assert.equal(clientBlockedNote.status, 403);

  // Referral & AI clinician assist
  const addRef = await api(`/therapist/role1/users/${r1Id}/referrals`, {
    method: 'POST',
    token: therToken,
    body: {
      urgency: 'priority',
      serviceName: 'Ernakulam General Hospital Vimukthi Unit',
      reason: 'Structured outpatient counselling support',
    },
  });
  assert.equal(addRef.status, 201);

  const aiAssist = await api('/ai/therapist-assist', {
    method: 'POST',
    token: therToken,
    body: { userId: r1Id },
  });
  assert.equal(aiAssist.status, 200);
  assert.ok(typeof aiAssist.data.progressSummary === 'string');

  // Remembered therapist password sign-in WITHOUT re-entering iamtherapist
  const rememberedLogin = await api('/auth/login', {
    method: 'POST',
    body: { username: 'dr_sreelakshmi', password: 'Password123!' },
  });
  assert.equal(rememberedLogin.status, 200);
  assert.equal(rememberedLogin.data.user.verificationStatus, 'approved');

  // 6. Client Role 01 state reflects therapist review note, new goal, and scheduled calendar event — zero clinical note leak
  const r1Pull = await api('/role1/state', { token: r1Token });
  assert.equal(r1Pull.status, 200);
  assert.equal(r1Pull.data.goals.length, 2);
  assert.equal(r1Pull.data.calendarEvents.length, 2);
  assert.equal(
    r1Pull.data.dailyLogs[0].clinicianReviewNote,
    'Great job choosing a walk during a high-stress moment.'
  );
  assert.equal((r1Pull.data as any).clinicalNotes, undefined);

  // 7. Admin audit log records therapist login & section modified without leaking confidential clinical note prose
  const auditRes = await api('/audit/logs', { token: adminToken });
  assert.equal(auditRes.status, 200);
  const serializedLogs = JSON.stringify(auditRes.data.logs);
  assert.equal(serializedLogs.includes('SECRET_CLINICAL_TEXT_DO_NOT_LEAK'), false);
  assert.ok(
    auditRes.data.logs.some(
      (l: any) => l.actorUsername === 'dr_sreelakshmi' && l.section === 'Confidential Clinical Notes'
    )
  );
  assert.ok(
    auditRes.data.logs.some(
      (l: any) => l.actorUsername === 'dr_sreelakshmi' && l.action === 'THERAPIST_LOGIN'
    )
  );
});

test('Role 04 Community Intelligence, Strategy Ideas Workspace, and AI Critical Strategy Assistant', async () => {
  const intel = await api('/community/intelligence');
  assert.equal(intel.status, 200);
  assert.equal(intel.data.keralaDistricts.length, 14);
  assert.ok(intel.data.metrics.length >= 10);
  assert.equal(intel.data.evaluationCriteria.length, 9);

  // Create, list, update, delete strategy idea
  const created = await api('/community/ideas', {
    method: 'POST',
    body: {
      title: 'College Hostel Evening Sports Circle',
      focusArea: 'College & Hostel Wellness',
      targetPopulation: 'First-year college students',
      district: 'Ernakulam',
      summary: 'Replace evening isolation with mentored sports and clear 14405 referral slips.',
      criteriaScores: { problem_relevance: 5, evidence_base: 4 },
      findings: ['Senior peer mentors increase first-year turnout'],
    },
  });
  assert.equal(created.status, 201);
  const ideaId = created.data.idea.id as string;

  const list = await api('/community/ideas');
  assert.equal(list.status, 200);
  assert.ok(list.data.ideas.some((i: any) => i.id === ideaId));

  // Run AI Critical Strategy Assistant in brainstorm_analysis and programme_review modes
  const aiBrainstorm = await api('/ai/community-strategy', {
    method: 'POST',
    body: {
      mode: 'brainstorm_analysis',
      title: 'College Hostel Evening Sports Circle',
      targetPopulation: 'First-year college students',
      district: 'Ernakulam',
      summary: 'Replace evening isolation with mentored sports and clear 14405 referral slips.',
    },
  });
  assert.equal(aiBrainstorm.status, 200);
  assert.ok(typeof aiBrainstorm.data.criticalChallenge === 'string');
  assert.ok(typeof aiBrainstorm.data.tenPointAnalysis?.ethicalAndSafeguarding === 'string');

  const aiProgReview = await api('/ai/community-strategy', {
    method: 'POST',
    body: {
      mode: 'programme_review',
      title: 'Hostel Wellness Drive',
      district: 'Ernakulam',
      programmeDraft: { title: 'Hostel Wellness Drive' },
    },
  });
  assert.equal(aiProgReview.status, 200);
  assert.ok(Array.isArray(aiProgReview.data.programmeReviewFeedback?.missingInformation));

  const patchIdea = await api(`/community/ideas/${ideaId}`, {
    method: 'PATCH',
    body: { aiAnalysis: aiBrainstorm.data },
  });
  assert.equal(patchIdea.status, 200);

  const delIdea = await api(`/community/ideas/${ideaId}`, { method: 'DELETE' });
  assert.equal(delIdea.status, 200);
});

test('Passwordless 2-field Sign-In (Name + Quick Access Code) for Therapist and Admin', async () => {
  // Therapist login with strictly Name + Quick Access Code ('iamtherapist'), no password
  const thLogin = await api('/auth/therapist-access', {
    method: 'POST',
    body: {
      name: 'Dr. Kavya Nair',
      username: 'Dr. Kavya Nair',
      authorityCode: 'iamtherapist',
      seedSamplePatients: false,
    },
  });
  assert.equal(thLogin.status, 200);
  assert.equal(thLogin.data.user.role, 'therapist');
  assert.equal(thLogin.data.user.verificationStatus, 'approved');
  assert.equal(thLogin.data.user.name, 'Dr. Kavya Nair');

  // Returning therapist login with strictly Name + Quick Access Code ('iamtherapist'), no password
  const thRelogin = await api('/auth/therapist-access', {
    method: 'POST',
    body: {
      name: 'Dr. Kavya Nair',
      authorityCode: 'iamtherapist',
      seedSamplePatients: false,
    },
  });
  assert.equal(thRelogin.status, 200);
  assert.equal(thRelogin.data.user.id, thLogin.data.user.id);

  // Admin login with strictly Name + Quick Access Code ('I am admin'), no password
  const adminLogin = await api('/auth/admin-access', {
    method: 'POST',
    body: {
      name: 'Creator Admin',
      code: 'I am admin',
    },
  });
  assert.equal(adminLogin.status, 200);
  assert.equal(adminLogin.data.user.role, 'admin');
  assert.equal(adminLogin.data.user.name, 'Creator Admin');
});

test('Therapist Restricted Access: AES-256-GCM Clinical Vault, Role 01 Sync Attribution, Follow-Up Indicators, Appointments, Referrals & Erasure', async () => {
  // 1. Authenticate approved therapist + admin + Role 01 client
  const thLogin = await api('/auth/therapist-access', {
    method: 'POST',
    body: {
      name: 'Dr. Meera Menon',
      username: 'dr_meera',
      authorityCode: 'iamtherapist',
      seedSamplePatients: false,
    },
  });
  assert.equal(thLogin.status, 200);
  const therToken = thLogin.data.token as string;
  const therId = thLogin.data.user.id as string;

  const adminRes = await api('/auth/admin-access', {
    method: 'POST',
    body: { name: 'Creator Admin', code: 'I am admin' },
  });
  assert.equal(adminRes.status, 200);
  const adminToken = adminRes.data.token as string;

  // 2. Onboard a Role 01 youth patient directly via therapist with initialGoal -> creates synced Role1GoalRecord & SupportPlan
  const onboardRes = await api('/therapist/clients', {
    method: 'POST',
    token: therToken,
    body: {
      name: 'Aarav Youth',
      district: 'Thrissur',
      ageRange: 'youth',
      primaryConcern: 'Nicotine vaping',
      initialGoal: 'Delay evening craving by 15 minutes',
      initialNote: 'Youth safeguarding consent documented',
    },
  });
  assert.equal(onboardRes.status, 201);
  const clientId = onboardRes.data.client.id as string;

  const detailInit = await api(`/therapist/role1/users/${clientId}`, { token: therToken });
  assert.equal(detailInit.status, 200);
  assert.equal(detailInit.data.goals.length, 1);
  assert.equal(detailInit.data.goals[0].title, 'Delay evening craving by 15 minutes');
  assert.equal(detailInit.data.goals[0].updatedByRole, 'therapist');

  // 3. Overview Clarity Board metrics reflect youth safeguarding count
  const overviewRes = await api('/therapist/role1/overview', { token: therToken });
  assert.equal(overviewRes.status, 200);
  assert.ok(overviewRes.data.totals.youthClientsCount >= 1);

  // 4. Patch goal & calendar with therapistChangeNote and verify Role 01 PUT preserves attribution
  const goalId = detailInit.data.goals[0].id as string;
  const patchedGoal = await api(`/therapist/role1/users/${clientId}/goals/${goalId}`, {
    method: 'PATCH',
    token: therToken,
    body: {
      title: 'Delay evening craving by 20 minutes',
      therapistChangeNote: 'Adjusted pacing for exam week',
    },
  });
  assert.equal(patchedGoal.status, 200);
  assert.equal(patchedGoal.data.goal.updatedByRole, 'therapist');
  assert.equal(patchedGoal.data.goal.updatedByTherapistName, 'Dr. Meera Menon');
  assert.equal(patchedGoal.data.goal.therapistChangeNote, 'Adjusted pacing for exam week');

  const addedEvt = await api(`/therapist/role1/users/${clientId}/calendar`, {
    method: 'POST',
    token: therToken,
    body: {
      title: 'Past Check-In Event',
      date: '2026-10-01',
      category: 'appointment',
    },
  });
  assert.equal(addedEvt.status, 201);
  const evtId = addedEvt.data.event.id as string;

  const patchedEvt = await api(`/therapist/role1/users/${clientId}/calendar/${evtId}`, {
    method: 'PATCH',
    token: therToken,
    body: {
      therapistChangeNote: 'Follow-up check-in',
    },
  });
  assert.equal(patchedEvt.status, 200);
  assert.equal(patchedEvt.data.event.updatedByRole, 'therapist');

  // Client logs in and pushes PUT /role1/state; therapist attribution fields must NOT be stripped
  const clientUserRes = await api('/auth/register', {
    method: 'POST',
    body: {
      name: 'Riya Role1',
      username: 'riya_role1',
      password: 'Password123!',
      role: 'user',
      district: 'Kollam',
      ageRange: 'adult',
    },
  });
  assert.equal(clientUserRes.status, 201);
  const riyaToken = clientUserRes.data.token as string;
  const riyaId = clientUserRes.data.user.id as string;

  const riyaInvite = await api('/therapist/invite', {
    method: 'POST',
    token: riyaToken,
    body: { therapistId: therId, consentGranted: true },
  });
  assert.equal(riyaInvite.status, 201);
  const riyaAccept = await api(`/therapist/connections/${riyaInvite.data.connection.id}/respond`, {
    method: 'POST',
    token: therToken,
    body: { action: 'accept' },
  });
  assert.equal(riyaAccept.status, 200);

  const therAddGoalRiya = await api(`/therapist/role1/users/${riyaId}/goals`, {
    method: 'POST',
    token: therToken,
    body: {
      title: 'Morning Walk',
      description: '15 min brisk walk',
      category: 'physical',
      frequency: 'daily',
    },
  });
  assert.equal(therAddGoalRiya.status, 201);
  const riyaGoal = therAddGoalRiya.data.goal;

  const pushState = await api('/role1/state', {
    method: 'PUT',
    token: riyaToken,
    body: {
      goals: [{ ...riyaGoal, updatedByRole: undefined, updatedByTherapistName: undefined }],
      dailyLogs: [
        {
          id: 'log_riya_1',
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString(),
          type: 'quick',
          mood: 'steady',
          quickNote: 'Felt calm after walking',
          completedActivities: [],
          tags: [],
        },
      ],
    },
  });
  assert.equal(pushState.status, 200);
  const pullState = await api('/role1/state', { token: riyaToken });
  assert.equal(pullState.data.goals[0].updatedByRole, 'therapist');
  assert.equal(pullState.data.goals[0].updatedByTherapistName, 'Dr. Meera Menon');

  // 5. AES-256-GCM encryption at rest for clinical notes + PATCH edit + Admin/Client access denied
  const secretBody = 'HIGHLY_CONFIDENTIAL_THERAPIST_FORMULATION_9918';
  const createCNote = await api(`/therapist/role1/users/${riyaId}/clinical-notes`, {
    method: 'POST',
    token: therToken,
    body: {
      noteType: 'safeguarding',
      title: 'Private Risk Assessment',
      content: secretBody,
      followUpDate: '2026-12-01',
    },
  });
  assert.equal(createCNote.status, 201);
  assert.equal(createCNote.data.note.content, secretBody);
  const cNoteId = createCNote.data.note.id as string;

  // Verify raw db.json on disk stores enc:v1: ciphertext and NEVER plaintext
  const rawDbText = fs.readFileSync(dbFilePath, 'utf-8');
  assert.equal(rawDbText.includes(secretBody), false);
  assert.equal(rawDbText.includes('enc:v1:'), true);

  // PATCH clinical note updates ciphertext and stamps modifiedByName & followUpDate
  const updatedSecret = 'UPDATED_ENCRYPTED_FORMULATION_2026';
  const patchCNote = await api(`/therapist/role1/users/${riyaId}/clinical-notes/${cNoteId}`, {
    method: 'PATCH',
    token: therToken,
    body: {
      content: updatedSecret,
      followUpDate: '2026-12-10',
    },
  });
  assert.equal(patchCNote.status, 200);
  assert.equal(patchCNote.data.note.content, updatedSecret);
  assert.equal(patchCNote.data.note.modifiedByName, 'Dr. Meera Menon');
  assert.equal(patchCNote.data.note.followUpDate, '2026-12-10');

  const rawDbAfterPatch = fs.readFileSync(dbFilePath, 'utf-8');
  assert.equal(rawDbAfterPatch.includes(updatedSecret), false);

  // Admin & Client must be blocked from GET /clinical-notes
  const adminBlocked = await api(`/therapist/role1/users/${riyaId}/clinical-notes`, {
    token: adminToken,
  });
  assert.equal(adminBlocked.status, 403);
  const clientBlocked = await api(`/therapist/role1/users/${riyaId}/clinical-notes`, {
    token: riyaToken,
  });
  assert.equal(clientBlocked.status, 403);

  // 6. Appointment scheduling + missed status + followUpOutcome + Referral category/status
  const createAppt = await api('/care/notes', {
    method: 'POST',
    token: therToken,
    body: {
      clientId: riyaId,
      appointmentDate: '2026-11-28',
      appointmentTime: '11:30',
      noteText: 'Weekly CBT check-in',
      agreedNextSteps: 'Continue sleep log',
    },
  });
  assert.equal(createAppt.status, 201);
  const apptId = createAppt.data.note.id as string;

  const patchAppt = await api(`/care/appointments/${apptId}`, {
    method: 'PATCH',
    token: therToken,
    body: {
      status: 'missed',
      followUpOutcome: 'Sent warm check-in message; rescheduled for Tuesday',
    },
  });
  assert.equal(patchAppt.status, 200);
  assert.equal(patchAppt.data.note.status, 'missed');
  assert.equal(
    patchAppt.data.note.followUpOutcome,
    'Sent warm check-in message; rescheduled for Tuesday'
  );

  const createRef = await api(`/therapist/role1/users/${riyaId}/referrals`, {
    method: 'POST',
    token: therToken,
    body: {
      serviceName: 'Kollam District Vimukthi Centre',
      referralCategory: 'de_addiction',
      referralDate: '2026-11-22',
      urgency: 'priority',
      reason: 'Structured outpatient group support',
    },
  });
  assert.equal(createRef.status, 201);
  assert.equal(createRef.data.referral.referralCategory, 'de_addiction');

  // 7. Full user bundle includes followUpSummary + measurableIndicators & AI therapist-assist accepts clientId
  const riyaBundle = await api(`/therapist/role1/users/${riyaId}`, { token: therToken });
  assert.equal(riyaBundle.status, 200);
  assert.ok(riyaBundle.data.measurableIndicators);
  assert.equal(riyaBundle.data.measurableIndicators.missedAppointmentsCount, 1);
  assert.ok(Array.isArray(riyaBundle.data.followUpSummary.missedAppointments));

  const aiWithClientId = await api('/ai/therapist-assist', {
    method: 'POST',
    token: therToken,
    body: { clientId: riyaId },
  });
  assert.equal(aiWithClientId.status, 200);
  assert.ok(Array.isArray(aiWithClientId.data.draftActivities));
  assert.ok(typeof aiWithClientId.data.clinicalBoundaryDisclaimer === 'string');

  // 8. Self-service Role 01 account & personal data erasure
  const eraseRes = await api('/auth/my-account', {
    method: 'DELETE',
    token: riyaToken,
  });
  assert.equal(eraseRes.status, 200);
  const afterEraseOverview = await api('/therapist/role1/overview', { token: therToken });
  assert.equal(
    afterEraseOverview.data.users.some((u: any) => u.id === riyaId),
    false
  );
});

test('Real-time SSE stream, Therapist availability & phone privacy, Attention Engine, Care Plan Proposals & Community k>=5 k-anonymity', async () => {
  // Login Admin via quick access code
  const adminQuick = await api('/auth/admin-access', {
    method: 'POST',
    body: { name: 'Platform Creator', code: 'I am admin' },
  });
  assert.equal(adminQuick.status, 200);
  const adminToken = adminQuick.data.token as string;

  // Create Therapist with iamtherapist quick code -> auto-approved
  const therLogin = await api('/auth/therapist-access', {
    method: 'POST',
    body: {
      name: 'Dr. Kavya Pillai',
      code: 'iamtherapist',
      seedSamplePatients: false,
    },
  });
  assert.equal(therLogin.status, 200);
  const therToken = therLogin.data.token as string;
  const therId = therLogin.data.user.id as string;

  // 1. Unauthenticated SSE must return 401
  const unauthSse = await fetch(`${baseUrl}/realtime/stream`);
  assert.equal(unauthSse.status, 401);

  // 2. Authenticated SSE connects & receives real live events on therapist availability update
  const abortCtrl = new AbortController();
  const sseRes = await fetch(`${baseUrl}/realtime/stream?token=${encodeURIComponent(therToken)}`, {
    signal: abortCtrl.signal,
  });
  assert.equal(sseRes.status, 200);
  assert.ok(sseRes.headers.get('content-type')?.includes('text/event-stream'));

  const reader = sseRes.body!.getReader();
  const decoder = new TextDecoder();
  let sseBuffer = '';

  const readUntilMatch = async (needle: string, timeoutMs = 3000): Promise<string> => {
    const start = Date.now();
    while (!sseBuffer.includes(needle)) {
      if (Date.now() - start > timeoutMs) {
        throw new Error(`Timed out waiting for SSE chunk containing "${needle}". Buffer: ${sseBuffer}`);
      }
      const { value, done } = await reader.read();
      if (done) break;
      sseBuffer += decoder.decode(value, { stream: true });
    }
    return sseBuffer;
  };

  await readUntilMatch('event: connected');

  // Verify phone (validates confirmation + digit count) & update availability
  const phoneFail = await api('/therapists/verify-phone', {
    method: 'POST',
    token: therToken,
    body: { contactPhone: '+91 98470 12345', confirmOwnership: false },
  });
  assert.equal(phoneFail.status, 400);

  const phoneOk = await api('/therapists/verify-phone', {
    method: 'POST',
    token: therToken,
    body: { contactPhone: '+91 98470 12345', confirmOwnership: true, whatsappOptIn: true },
  });
  assert.equal(phoneOk.status, 200);
  assert.equal(phoneOk.data.user.phoneVerified, true);

  const availUpdate = await api('/therapists/availability', {
    method: 'PATCH',
    token: therToken,
    body: {
      availabilityStatus: 'busy',
      availabilityHours: 'Mon-Sat 10 AM - 6 PM',
      nextAvailableSlot: 'Tomorrow 11:00 AM',
    },
  });
  assert.equal(availUpdate.status, 200);
  assert.equal(availUpdate.data.user.availabilityStatus, 'busy');

  const liveStreamText = await readUntilMatch('event: availability:updated');
  assert.ok(liveStreamText.includes(therId));

  abortCtrl.abort();
  try {
    await reader.cancel();
  } catch {
    // ignore abort cancel
  }

  // Register two clients for directory + attention engine + proposals
  const urgentClientReg = await api('/auth/register', {
    method: 'POST',
    body: {
      username: 'urgent_client_1',
      name: 'Nikhil Thomas',
      password: 'Password123!',
      role: 'user',
      ageRange: 'young_adult',
    },
  });
  assert.equal(urgentClientReg.status, 201);
  const urgentToken = urgentClientReg.data.token as string;
  const urgentId = urgentClientReg.data.user.id as string;

  const steadyClientReg = await api('/auth/register', {
    method: 'POST',
    body: {
      username: 'steady_client_1',
      name: 'Sneha George',
      password: 'Password123!',
      role: 'user',
      ageRange: 'adult',
    },
  });
  assert.equal(steadyClientReg.status, 201);
  const steadyToken = steadyClientReg.data.token as string;
  const steadyId = steadyClientReg.data.user.id as string;

  // 3. Directory totals & phone gating (unauth hides phone/whatsappDigits; auth sees them)
  const publicDir = await api('/therapists/directory');
  assert.equal(publicDir.status, 200);
  assert.ok(publicDir.data.totals.totalRegistered >= 1);
  assert.ok(publicDir.data.totals.approvedCount >= 1);
  assert.ok(publicDir.data.totals.busyCount >= 1);
  const publicEntry = publicDir.data.therapists.find((t: any) => t.id === therId);
  assert.ok(publicEntry);
  assert.equal(publicEntry.phoneVerified, true);
  assert.equal(publicEntry.whatsappReady, true);
  assert.equal(publicEntry.contactPhone, undefined);
  assert.equal(publicEntry.whatsappDigits, undefined);

  const authedDir = await api('/therapists/directory', { token: urgentToken });
  assert.equal(authedDir.status, 200);
  const authedEntry = authedDir.data.therapists.find((t: any) => t.id === therId);
  assert.equal(authedEntry.contactPhone, '+91 98470 12345');
  assert.equal(authedEntry.whatsappDigits, '919847012345');

  // Connect both clients via consent-gated connections
  const reqUrgentConn = await api('/therapist/invite', {
    method: 'POST',
    token: urgentToken,
    body: { therapistId: therId, consentGranted: true },
  });
  assert.equal(reqUrgentConn.status, 201);
  const urgentConnId = reqUrgentConn.data.connection.id as string;
  await api(`/therapist/connections/${urgentConnId}/respond`, {
    method: 'POST',
    token: therToken,
    body: { action: 'accept' },
  });

  const reqSteadyConn = await api('/therapist/invite', {
    method: 'POST',
    token: steadyToken,
    body: { therapistId: therId, consentGranted: true },
  });
  assert.equal(reqSteadyConn.status, 201);
  const steadyConnId = reqSteadyConn.data.connection.id as string;
  await api(`/therapist/connections/${steadyConnId}/respond`, {
    method: 'POST',
    token: therToken,
    body: { action: 'accept' },
  });

  // Populate urgent client signals: 2 heavy mood logs + unread message + missed appointment
  const todayIso = new Date().toISOString().split('T')[0];
  await api('/role1/state', {
    method: 'PUT',
    token: urgentToken,
    body: {
      dailyLogs: [
        { id: 'u-log-1', date: todayIso, type: 'quick', mood: 'heavy', quickNote: 'High evening cravings' },
        { id: 'u-log-2', date: todayIso, type: 'quick', mood: 'challenged', quickNote: 'Restless sleep' },
      ],
    },
  });
  await api('/care/messages', {
    method: 'POST',
    token: urgentToken,
    body: { connectionId: urgentConnId, text: 'Could we adjust our check-in time?' },
  });
  const urgentAppt = await api('/care/notes', {
    method: 'POST',
    token: therToken,
    body: { clientId: urgentId, appointmentDate: '2026-11-20', noteText: 'Check-in' },
  });
  await api(`/care/appointments/${urgentAppt.data.note.id}`, {
    method: 'PATCH',
    token: therToken,
    body: { status: 'missed' },
  });

  // Steady client keeps an active support plan & steady log
  await api('/support-plan', {
    method: 'PUT',
    token: steadyToken,
    body: {
      objectives: ['Keep morning walk routine'],
      interventions: ['10-min morning check-in'],
      nextSteps: ['Weekly reflection'],
    },
  });
  await api('/role1/state', {
    method: 'PUT',
    token: steadyToken,
    body: {
      goals: [{ id: 'st-g1', title: 'Morning walk', category: 'wellness', completed: true }],
      dailyLogs: [{ id: 'st-l1', date: todayIso, type: 'quick', mood: 'steady', quickNote: 'Good energy' }],
    },
  });

  // 4. Attention Engine & Compact AI Recommendation Bar
  const queueRes = await api('/therapist/attention-queue', { token: therToken });
  assert.equal(queueRes.status, 200);
  const queue = queueRes.data.attentionQueue as any[];
  assert.ok(queue.length >= 2);
  const urgentRank = queue.findIndex(q => q.userId === urgentId);
  const steadyRank = queue.findIndex(q => q.userId === steadyId);
  assert.ok(urgentRank !== -1 && steadyRank !== -1 && urgentRank < steadyRank);
  assert.equal(queue[urgentRank].priorityLevel, 'urgent');
  assert.ok(queue[urgentRank].reasons.some((r: string) => r.includes('unread client message')));

  const aiAssistRes = await api('/ai/therapist-assist', {
    method: 'POST',
    token: therToken,
    body: { clientId: urgentId },
  });
  assert.equal(aiAssistRes.status, 200);
  assert.equal(aiAssistRes.data.compactRecommendationBar.requiresHumanApproval, true);
  assert.ok(Array.isArray(aiAssistRes.data.compactRecommendationBar.detectedChanges));

  // 5. Structured Recovery Coordination Protocol (2-Way Care Plan Proposals)
  const propCreate = await api(`/therapist/role1/users/${urgentId}/plan-proposals`, {
    method: 'POST',
    token: therToken,
    body: {
      title: 'Evening Craving Reset v1',
      objectives: ['Build a calm 7 PM transition habit'],
      routines: ['5-min box breathing at 7:00 PM'],
      recommendations: ['Keep hydration bottle beside study desk'],
      rationale: 'Responds to heavy evening check-in notes',
      reviewDate: '2026-12-01',
    },
  });
  assert.equal(propCreate.status, 201);
  const proposalId = propCreate.data.proposal.id as string;
  assert.equal(propCreate.data.proposal.status, 'proposed');

  const userProposalsRes = await api('/care/plan-proposals', { token: urgentToken });
  assert.equal(userProposalsRes.status, 200);
  assert.ok(userProposalsRes.data.proposals.some((p: any) => p.id === proposalId));

  const agreeRes = await api(`/care/plan-proposals/${proposalId}/respond`, {
    method: 'PATCH',
    token: urgentToken,
    body: { status: 'agreed', userFeedback: '7 PM breathing works well for me' },
  });
  assert.equal(agreeRes.status, 200);
  assert.equal(agreeRes.data.proposal.status, 'agreed');

  const syncedPlanRes = await api('/support-plan', { token: urgentToken });
  assert.equal(syncedPlanRes.status, 200);
  assert.ok(syncedPlanRes.data.plan.objectives.includes('Build a calm 7 PM transition habit'));
  assert.ok(syncedPlanRes.data.plan.interventions.includes('5-min box breathing at 7:00 PM'));
  const therBundleRes = await api(`/therapist/role1/users/${urgentId}`, { token: therToken });
  assert.equal(therBundleRes.status, 200);
  assert.ok(
    Array.isArray(therBundleRes.data.carePlanRevisions) &&
      therBundleRes.data.carePlanRevisions.some((r: any) => String(r.summary).includes('Evening Craving Reset v1'))
  );

  // 6. Community k >= 5 K-Anonymity Suppression & Threshold Release
  const orgRes = await api('/community/programmes', {
    method: 'POST',
    token: adminToken,
    body: {
      orgName: 'Wayanad Youth Wellness Forum',
      title: 'Campus Stress & Peer Prevention Workshop',
      district: 'Wayanad',
      description: 'Peer literacy circle for college students',
      capacity: 50,
    },
  });
  assert.equal(orgRes.status, 201);
  const progId = orgRes.data.programme.id as string;
  const orgId = orgRes.data.org.id as string;

  await api(`/admin/orgs/${orgId}/decision`, {
    method: 'POST',
    token: adminToken,
    body: { decision: 'approved' },
  });

  // Register 2 (< 5) participants & submit 3 (< 5) anonymous evaluations -> MUST be suppressed
  await api(`/community/programmes/${progId}/register`, { method: 'POST', token: urgentToken });
  await api(`/community/programmes/${progId}/register`, { method: 'POST', token: steadyToken });

  for (let i = 0; i < 3; i++) {
    await api('/community/evaluations', {
      method: 'POST',
      body: {
        programmeId: progId,
        district: 'Wayanad',
        phase: i === 0 ? 'pre' : 'post',
        score: i === 0 ? 2 : 4,
        maxScore: 5,
        accessibilityBarrier: 'UniqueBarrierTopic_Wayanad',
      },
    });
  }

  const suppressedIntel = await api('/community/intelligence');
  assert.equal(suppressedIntel.status, 200);
  const suppressedTrends = suppressedIntel.data.aggregatedCommunityTrends;
  assert.equal(suppressedTrends.kAnonymityMinCohort, 5);
  assert.equal(suppressedTrends.safeBarriers?.UniqueBarrierTopic_Wayanad, undefined);
  assert.ok(suppressedTrends.suppressedBarrierTopicsCount >= 1);
  const wayanadSuppressed = suppressedTrends.participationByDistrict.find((d: any) => d.district === 'Wayanad');
  assert.equal(wayanadSuppressed.suppressedForPrivacy, true);
  assert.equal(wayanadSuppressed.totalRegistrations, null);
  const progSuppressed = suppressedTrends.programmeOutcomes.find((p: any) => p.programmeId === progId);
  assert.equal(progSuppressed.registrationsSuppressed, true);
  assert.equal(progSuppressed.registeredCount, null);
  assert.equal(progSuppressed.outcomesSuppressed, true);
  assert.equal(progSuppressed.evaluationsCount, null);

  // Add 3 more participants (total 5) & 2 more evaluations (total 5) -> MUST unmask real aggregates
  for (let i = 1; i <= 3; i++) {
    const extraUser = await api('/auth/register', {
      method: 'POST',
      body: {
        username: `wayanad_youth_${i}`,
        name: `Wayanad Youth ${i}`,
        password: 'Password123!',
        role: 'user',
      },
    });
    assert.equal(extraUser.status, 201);
    const regProg = await api(`/community/programmes/${progId}/register`, {
      method: 'POST',
      token: extraUser.data.token,
    });
    assert.equal(regProg.status, 200);
  }
  for (let i = 0; i < 2; i++) {
    await api('/community/evaluations', {
      method: 'POST',
      body: {
        programmeId: progId,
        district: 'Wayanad',
        phase: 'post',
        score: 5,
        maxScore: 5,
        accessibilityBarrier: 'UniqueBarrierTopic_Wayanad',
      },
    });
  }

  const unmaskedIntel = await api('/community/intelligence');
  assert.equal(unmaskedIntel.status, 200);
  const unmaskedTrends = unmaskedIntel.data.aggregatedCommunityTrends;
  assert.equal(unmaskedTrends.evaluationsSuppressed, false);
  assert.ok(unmaskedTrends.totalEvaluationsCount >= 5);
  assert.equal(unmaskedTrends.safeBarriers.UniqueBarrierTopic_Wayanad, 5);
  assert.ok(typeof unmaskedTrends.preAvgScorePct === 'number');
  assert.ok(typeof unmaskedTrends.postAvgScorePct === 'number');
  const wayanadUnmasked = unmaskedTrends.participationByDistrict.find((d: any) => d.district === 'Wayanad');
  assert.equal(wayanadUnmasked.suppressedForPrivacy, false);
  assert.equal(wayanadUnmasked.totalRegistrations, 5);
  const progUnmasked = unmaskedTrends.programmeOutcomes.find((p: any) => p.programmeId === progId);
  assert.equal(progUnmasked.registrationsSuppressed, false);
  assert.equal(progUnmasked.registeredCount, 5);
  assert.equal(progUnmasked.outcomesSuppressed, false);
  assert.equal(progUnmasked.evaluationsCount, 5);
  assert.equal(progUnmasked.preAvgPct, 40);
  assert.equal(progUnmasked.postAvgPct, 90);

  // Strategy Lab must surface pastOutcomesApplied grounded in aggregatedCommunityTrends
  const strategyRes = await api('/ai/community-strategy', {
    method: 'POST',
    body: {
      title: 'Wayanad Peer Evening Circle',
      summary: 'Weekly peer facilitation circles in college hostels to build protective social routines.',
      district: 'Wayanad',
      targetPopulation: 'College Hostel Students',
    },
  });
  assert.equal(strategyRes.status, 200);
  assert.ok(typeof strategyRes.data.pastOutcomesApplied === 'string' && strategyRes.data.pastOutcomesApplied.length > 0);
});

test('Upgraded Contracts: Granular Therapist View Permissions, Admin Privacy Metadata, Community Quick Entry, Unified Directory & Info Requests', async () => {
  // 1. Register user, approved therapist, and admin
  const userReg = await api('/auth/register', {
    method: 'POST',
    body: {
      username: 'ananya_granular',
      name: 'Ananya Menon',
      password: 'Password123!',
      role: 'user',
    },
  });
  assert.equal(userReg.status, 201);
  const uToken = userReg.data.token as string;
  const uId = userReg.data.user.id as string;

  const thAuth = await api('/auth/therapist-access', {
    method: 'POST',
    body: {
      name: 'Dr. Arun George',
      username: 'dr_arun_george',
      authorityCode: 'iamtherapist',
      seedSamplePatients: false,
    },
  });
  assert.equal(thAuth.status, 200);
  const drToken = thAuth.data.token as string;
  const drId = thAuth.data.user.id as string;

  const adminAuth = await api('/auth/admin-access', {
    method: 'POST',
    body: { name: 'Creator Admin', code: 'I am admin' },
  });
  assert.equal(adminAuth.status, 200);
  const adminToken = adminAuth.data.token as string;

  // Connect user <-> therapist via direct request & acceptance
  const reqConn = await api('/therapist/invite', {
    method: 'POST',
    token: uToken,
    body: {
      therapistId: drId,
      consentGranted: true,
      purpose: 'Weekly planning & goal review',
      requestedPermissions: ['goals'],
    },
  });
  assert.equal(reqConn.status, 201);

  const acceptConn = await api(`/therapist/connections/${reqConn.data.connection.id}/respond`, {
    method: 'POST',
    token: drToken,
    body: { action: 'accept' },
  });
  assert.equal(acceptConn.status, 200);

  // Push personal logs, goals, and calendar items
  await api('/role1/state', {
    method: 'PUT',
    token: uToken,
    body: {
      dailyLogs: [
        {
          id: 'log_ananya_1',
          date: '2026-11-23',
          timestamp: '2026-11-23T09:00:00.000Z',
          type: 'quick',
          mood: 'steady',
          quickNote: 'PRIVATE_LOG_MUST_STAY_WITHHELD',
          completedActivities: [],
          tags: [],
        },
      ],
      goals: [
        {
          id: 'goal_ananya_1',
          title: 'Morning Walk Goal',
          description: 'Walk 15 mins daily',
          category: 'physical',
          frequency: 'daily',
          milestones: [],
          progressNotes: [],
          completed: false,
          createdAt: '2026-11-23T09:00:00.000Z',
        },
      ],
      calendarEvents: [
        {
          id: 'evt_ananya_1',
          title: 'Private Study Block',
          date: '2026-11-24',
          category: 'routine',
          reminder: false,
          completed: false,
        },
      ],
    },
  });

  // Grant ONLY 'goals'
  const grantRes = await api('/permissions', {
    method: 'POST',
    token: uToken,
    body: {
      therapistId: drId,
      categories: ['goals'],
      accessMode: 'continuing',
      purpose: 'Review goals only',
    },
  });
  assert.equal(grantRes.status, 201);

  // Therapist view enforces granular consent: goals visible, logs & calendar withheld
  const filteredDetail = await api(`/therapist/role1/users/${uId}`, { token: drToken });
  assert.equal(filteredDetail.status, 200);
  assert.equal(filteredDetail.data.goals.length, 1);
  assert.equal(filteredDetail.data.dailyLogs.length, 0);
  assert.equal(filteredDetail.data.calendarEvents.length, 0);
  assert.ok(filteredDetail.data.withheldCategories.includes('cbt_reflections'));
  assert.ok(filteredDetail.data.withheldCategories.includes('appointments'));

  // Therapist sends a structured info_request chat message
  const infoReqMsg = await api('/care/messages', {
    method: 'POST',
    token: drToken,
    body: {
      connectionId: reqConn.data.connection.id,
      text: 'Please consider sharing your weekly substance overview when comfortable.',
      messageType: 'info_request',
      requestedCategories: ['substances', 'weekly_reports'],
    },
  });
  assert.equal(infoReqMsg.status, 201);
  assert.equal(infoReqMsg.data.message.messageType, 'info_request');
  assert.deepEqual(infoReqMsg.data.message.requestedCategories, ['substances', 'weekly_reports']);

  // Therapist confidential note & client report share
  await api(`/therapist/role1/users/${uId}/clinical-notes`, {
    method: 'POST',
    token: drToken,
    body: {
      noteType: 'session',
      title: 'Session Check',
      content: 'CLINICAL_NOTE_SECRET_XYZ',
    },
  });

  await api('/reports/share', {
    method: 'POST',
    token: uToken,
    body: {
      therapistId: drId,
      consentConfirmed: true,
      title: 'Goals Summary',
      sectionsIncluded: ['goals'],
      payload: { goals: ['Morning Walk Goal'] },
    },
  });

  // Admin pending metadata exposes consent & delivery metadata WITHOUT clinical note / chat bodies
  const adminPending = await api('/admin/pending', { token: adminToken });
  assert.equal(adminPending.status, 200);
  assert.ok(Array.isArray(adminPending.data.permissionGrants));
  assert.ok(Array.isArray(adminPending.data.reportsSummary));
  const serializedAdmin = JSON.stringify(adminPending.data);
  assert.equal(serializedAdmin.includes('CLINICAL_NOTE_SECRET_XYZ'), false);
  assert.equal(serializedAdmin.includes('PRIVATE_LOG_MUST_STAY_WITHHELD'), false);

  // 2. Community Builder Quick Entry ('programme', 'outcome_evaluation', 'local_need')
  const qeProg = await api('/community/quick-entry', {
    method: 'POST',
    body: {
      entryType: 'programme',
      district: 'Thrissur',
      title: 'Thrissur Evening Football Youth Hub',
      description: 'Safe evening football and mentorship for college students.',
      publishDirectly: true,
    },
  });
  assert.equal(qeProg.status, 201);

  const qeNeed = await api('/community/quick-entry', {
    method: 'POST',
    body: {
      entryType: 'local_need',
      district: 'Thrissur',
      category: 'sports_space',
      observation: 'Hostel students asked for floodlit evening sports courts.',
    },
  });
  assert.equal(qeNeed.status, 201);

  const intelCheck = await api('/community/intelligence');
  assert.equal(intelCheck.status, 200);
  assert.ok(
    intelCheck.data.localNeedsSummary.some((n: any) =>
      n.observation.includes('floodlit evening sports courts')
    )
  );

  // 3. Unified 5-Category Directory
  const unifiedDir = await api('/directory/unified');
  assert.equal(unifiedDir.status, 200);
  assert.ok(Array.isArray(unifiedDir.data.items));
  assert.ok(unifiedDir.data.categoryCounts.rehabilitation >= 1);
  assert.ok(unifiedDir.data.categoryCounts.hospital_emergency >= 1);
  assert.ok(unifiedDir.data.categoryCounts.qualified_professional >= 1);
  assert.ok(unifiedDir.data.categoryCounts.community_programme >= 1);
  assert.ok(unifiedDir.data.categoryCounts.education_skills >= 1);
});

test('Shared brief personalized AI chat (/ai/chat) supports validation, context, history, crisis safety & Malayalam', async () => {
  // 1. Empty message rejected
  const emptyRes = await api('/ai/chat', {
    method: 'POST',
    body: { message: '   ', role: 'personal' },
  });
  assert.equal(emptyRes.status, 400);

  // 2. Personalized brief response with reading context & multi-turn history
  const chatRes = await api('/ai/chat', {
    method: 'POST',
    body: {
      message: 'Why do cravings hit harder at night?',
      role: 'learner',
      language: 'en',
      history: [
        { role: 'user', text: 'I am reading about dopamine.' },
        { role: 'assistant', text: 'Ask me anytime you want a plain example.' },
      ],
      pageContext: {
        area: 'Knowledge Filter',
        topicTitle: 'Dopamine Balance',
        snippet: 'Natural baseline takes a few weeks to recover.',
      },
      personalization: {
        name: 'Arjun',
        topGoal: 'Sleep before 11 PM',
        mood: 'restless',
      },
    },
  });
  assert.equal(chatRes.status, 200);
  assert.equal(chatRes.data.needsEmergencyHelp, false);
  assert.ok(chatRes.data.reply.includes('Arjun'));
  assert.ok(chatRes.data.reply.includes('Dopamine Balance'));
  assert.ok(chatRes.data.reply.includes('Sleep before 11 PM'));
  assert.ok(Array.isArray(chatRes.data.followUpSuggestions));
  assert.ok(chatRes.data.followUpSuggestions.length >= 1);
  assert.ok(chatRes.data.suggestedAction && typeof chatRes.data.suggestedAction.tab === 'string');

  // 3. Emergency crisis detection triggers immediate 112 / 14405 help
  const crisisRes = await api('/ai/chat', {
    method: 'POST',
    body: {
      message: 'My friend took an overdose and is not breathing properly',
      role: 'supporter',
      language: 'en',
      personalization: { name: 'Meera' },
    },
  });
  assert.equal(crisisRes.status, 200);
  assert.equal(crisisRes.data.needsEmergencyHelp, true);
  assert.ok(crisisRes.data.reply.includes('112'));
  assert.ok(crisisRes.data.reply.includes('14405'));

  // 4. Malayalam response personalization
  const mlRes = await api('/ai/chat', {
    method: 'POST',
    body: {
      message: 'എനിക്ക് സമ്മർദ്ദം കുറയ്ക്കാൻ സഹായിക്കാമോ?',
      role: 'personal',
      language: 'ml',
      personalization: { name: 'Anu', topGoal: 'Morning Walk' },
    },
  });
  assert.equal(mlRes.status, 200);
  assert.ok(mlRes.data.reply.includes('Anu'));
  assert.equal(mlRes.data.needsEmergencyHelp, false);
});

test('Therapist custom access codes, Admin app controls, Therapist work scope & AI dashboard paragraph analysis', async () => {
  // 1. Admin & Therapist sign in
  const adminRes = await api('/auth/admin-access', {
    method: 'POST',
    body: { name: 'Governance Lead', code: 'I am admin' },
  });
  assert.equal(adminRes.status, 200);
  const adminToken = adminRes.data.token as string;

  const therRes = await api('/auth/therapist-access', {
    method: 'POST',
    body: { name: 'Dr. Vivek Nair', code: 'iamtherapist', seedSamplePatients: false },
  });
  assert.equal(therRes.status, 200);
  const therToken = therRes.data.token as string;
  const therId = therRes.data.user.id as string;

  // 2. Therapist creates, updates, uses for quick sign-in, and deletes a custom access code
  const addCode = await api('/therapists/access-codes', {
    method: 'POST',
    token: therToken,
    body: { label: 'Evening Clinic', code: 'kerala_clinic_01' },
  });
  assert.equal(addCode.status, 201);
  assert.equal(addCode.data.accessCodes.length, 1);
  const codeId = addCode.data.accessCodes[0].id as string;
  assert.equal(addCode.data.accessCodes[0].label, 'Evening Clinic');

  // Sign in using newly created custom access code
  const customSignin = await api('/auth/therapist-access', {
    method: 'POST',
    body: { name: 'Dr. Vivek Nair', code: 'kerala_clinic_01', seedSamplePatients: false },
  });
  assert.equal(customSignin.status, 200);
  assert.equal(customSignin.data.user.id, therId);

  // Edit & pause/reactivate code
  const patchCode = await api(`/therapists/access-codes/${codeId}`, {
    method: 'PATCH',
    token: therToken,
    body: { label: 'Morning Shift', active: false },
  });
  assert.equal(patchCode.status, 200);
  assert.equal(patchCode.data.accessCodes[0].label, 'Morning Shift');
  assert.equal(patchCode.data.accessCodes[0].active, false);

  // Delete code
  const delCode = await api(`/therapists/access-codes/${codeId}`, {
    method: 'DELETE',
    token: therToken,
  });
  assert.equal(delCode.status, 200);
  assert.equal(delCode.data.accessCodes.length, 0);

  // 3. Admin App Controls & Therapist Work Scope
  const patchControls = await api('/admin/app-controls', {
    method: 'PATCH',
    token: adminToken,
    body: {
      enableAiBriefMode: true,
      platformNotice: '24/7 Vimukthi Helpline 14405 active across Kerala.',
    },
  });
  assert.equal(patchControls.status, 200);
  assert.equal(
    patchControls.data.controls.platformNotice,
    '24/7 Vimukthi Helpline 14405 active across Kerala.'
  );

  const patchScope = await api(`/admin/therapists/${therId}/scope`, {
    method: 'PATCH',
    token: adminToken,
    body: {
      maxActivePatients: 15,
      allowedSpecializations: ['Youth Counseling', 'CBT'],
      allowDirectOnboarding: true,
      allowClinicalNotes: true,
    },
  });
  assert.equal(patchScope.status, 200);
  assert.equal(patchScope.data.workScope.maxActivePatients, 15);

  const auditRes = await api('/audit/logs', { token: adminToken });
  assert.equal(auditRes.status, 200);
  assert.ok(auditRes.data.logs.some((l: any) => l.action === 'ADMIN_UPDATED_APP_CONTROLS'));
  assert.ok(auditRes.data.logs.some((l: any) => l.action === 'ADMIN_UPDATED_THERAPIST_SCOPE'));

  // 4. Long-paragraph dashboard AI analysis endpoint
  const analyzeRes = await api('/ai/dashboard-analyze', {
    method: 'POST',
    body: {
      role: 'personal',
      language: 'en',
      userName: 'Arjun',
      summaryStats: '4/7 days logged · 2 active goals',
      recentItems: ['2026-11-24 mood: steady', 'Goal: Evening walk'],
      paragraphNote:
        'This week felt much calmer after exams finished, though late evenings around 9 PM still bring restless thoughts when everyone else goes to sleep. Walking for fifteen minutes with music helped a lot.',
    },
  });
  assert.equal(analyzeRes.status, 200);
  assert.ok(typeof analyzeRes.data.summary === 'string' && analyzeRes.data.summary.length > 10);
  assert.ok(Array.isArray(analyzeRes.data.strengths) && analyzeRes.data.strengths.length >= 1);
  assert.ok(Array.isArray(analyzeRes.data.focusNext) && analyzeRes.data.focusNext.length >= 1);
  assert.ok(typeof analyzeRes.data.suggestedTab === 'string');
});

test('Role 01 Upgrade API: extended state, AI weekly/monthly reports, multi-sector opportunities, passport isolation & therapist consent', async () => {
  const userReg = await api('/auth/register', {
    method: 'POST',
    body: {
      username: 'ananya_rebuild',
      name: 'Ananya Krishnan',
      password: 'Password123!',
      role: 'user',
      ageRange: 'young_adult',
    },
  });
  assert.equal(userReg.status, 201);
  const uToken = userReg.data.token as string;
  const uId = userReg.data.user.id as string;

  // 1. Save extended Role 01 state (dailyLogs vitals, 4-state calendar, opportunity profile & non-clinical passport)
  const putRes = await api('/role1/state', {
    method: 'PUT',
    token: uToken,
    body: {
      personalOnboarding: {
        primaryNeed: 'I am rebuilding my life after treatment.',
        assistanceTypes: ['Verified Kerala skills'],
        language: 'en',
        storagePreference: 'private',
        supportPreferences: { reminders: true, trustedSupporter: false, professionalFinder: true },
        journeyStage: 'rebuilding_life',
        clinicalTreatmentStatus: 'completed_formal_care',
        recoveryStartDate: '2026-11-01',
        completed: true,
      },
      dailyLogs: [
        {
          id: 'log_r1_ext',
          date: new Date().toISOString().split('T')[0],
          timestamp: new Date().toISOString(),
          type: 'quick',
          mood: 'steady',
          quickNote: 'Slept well and reviewed ASAP course options.',
          completedActivities: ['Morning walk'],
          tags: ['routine'],
          cravingFrequency: 1,
          cravingIntensity: 2,
          sleepHours: 7.5,
          routineSteady: true,
        },
      ],
      calendarEvents: [
        {
          id: 'evt_r1_partial',
          title: 'Afternoon Study Block',
          date: new Date().toISOString().split('T')[0],
          category: 'learning',
          reminder: true,
          completed: false,
          completionState: 'partial',
        },
      ],
      opportunityProfile: {
        educationLevel: '+2 / Higher Secondary',
        currentSkills: ['Typing', 'MS Excel'],
        preferredSectors: ['tech_digital', 'entrepreneurship'],
        district: 'Thrissur',
        workPreference: 'training_first',
        careerObjective: 'Complete certified digital office course',
        updatedAt: new Date().toISOString(),
      },
      recoveryPassport: {
        headline: 'Certified Digital Trainee',
        publicBio: 'Punctual and organized.',
        sectionConsent: {
          acquiredSkills: true,
          completedTraining: true,
          qualifications: true,
          achievements: true,
          workExperience: true,
          personalGoals: true,
          certifications: true,
        },
        items: [
          {
            id: 'rp_1',
            section: 'acquiredSkills',
            title: 'Spreadsheet Reporting',
            shareWithProviders: true,
          },
          {
            id: 'rp_secret',
            section: 'achievements',
            title: 'Zero craving weeks',
            shareWithProviders: true,
          },
        ],
        updatedAt: new Date().toISOString(),
      },
    },
  });
  assert.equal(putRes.status, 200);

  const getState = await api('/role1/state', { token: uToken });
  assert.equal(getState.status, 200);
  assert.equal(getState.data.dailyLogs[0].sleepHours, 7.5);
  assert.equal(getState.data.calendarEvents[0].completionState, 'partial');
  assert.equal(getState.data.opportunityProfile.district, 'Thrissur');

  // 2. Generate weekly AI Recovery Report (non-diagnostic + persisted for user)
  const reportRes = await api('/ai/recovery-report', {
    method: 'POST',
    token: uToken,
    body: {
      period: 'weekly',
      language: 'en',
      logs: getState.data.dailyLogs,
      goals: [],
      careStatus: 'completed_formal_care',
    },
  });
  assert.equal(reportRes.status, 200);
  assert.equal(reportRes.data.period, 'weekly');
  assert.ok(typeof reportRes.data.summary === 'string' && reportRes.data.summary.length > 10);

  const listReports = await api('/personal/reports', { token: uToken });
  assert.equal(listReports.status, 200);
  assert.equal(listReports.data.reports.length, 1);

  // 3. Verified Opportunity Catalog & Passport Share Preview
  const oppCatalog = await api('/opportunities/catalog?sector=tech_digital');
  assert.equal(oppCatalog.status, 200);
  assert.ok(oppCatalog.data.items.length >= 2);
  assert.ok(oppCatalog.data.items.every((i: any) => i.sourceUrl.startsWith('https://')));

  const passportPreview = await api('/personal/passport/share-preview', {
    method: 'POST',
    body: { passport: getState.data.recoveryPassport },
  });
  assert.equal(passportPreview.status, 200);
  assert.equal(passportPreview.data.totalSharedItems, 1);
  assert.equal(passportPreview.data.sections.achievements.length, 0);

  // 4. Therapist Consent & Clinical Isolation Check
  const therRes = await api('/auth/therapist-access', {
    method: 'POST',
    body: { name: 'Dr. Meenakshi Iyer', code: 'iamtherapist', seedSamplePatients: false },
  });
  assert.equal(therRes.status, 200);
  const tToken = therRes.data.token as string;
  const tId = therRes.data.user.id as string;

  const inv = await api('/therapist/invite', {
    method: 'POST',
    token: uToken,
    body: { therapistId: tId, consentGranted: true },
  });
  assert.equal(inv.status, 201);
  await api(`/therapist/connections/${inv.data.connection.id}/respond`, {
    method: 'POST',
    token: tToken,
    body: { action: 'accept' },
  });

  // Restrict granular permissions to ONLY goals -> recoveryReports must be withheld; passport never leaks
  const narrowGrant = await api('/permissions', {
    method: 'POST',
    token: uToken,
    body: {
      therapistId: tId,
      categories: ['goals'],
      accessMode: 'continuing',
      purpose: 'Goal tracking only',
      downloadDisclaimerAcknowledged: true,
    },
  });
  assert.equal(narrowGrant.status, 201);
  const noReportBundle = await api(`/therapist/role1/users/${uId}`, { token: tToken });
  assert.equal(noReportBundle.status, 200);
  assert.equal(noReportBundle.data.recoveryReports.length, 0);
  assert.equal('recoveryPassport' in noReportBundle.data, false);
  assert.equal('opportunityProfile' in noReportBundle.data, false);

  // After granting weekly_reports, consented recoveryReports appear cleanly
  const reportGrant = await api('/permissions', {
    method: 'POST',
    token: uToken,
    body: {
      therapistId: tId,
      categories: ['goals', 'weekly_reports'],
      accessMode: 'continuing',
      purpose: 'Weekly reflection review',
      downloadDisclaimerAcknowledged: true,
    },
  });
  assert.equal(reportGrant.status, 201);
  const grantedBundle = await api(`/therapist/role1/users/${uId}`, { token: tToken });
  assert.equal(grantedBundle.status, 200);
  assert.equal(grantedBundle.data.recoveryReports.length, 1);
  assert.equal('recoveryPassport' in grantedBundle.data, false);
});




