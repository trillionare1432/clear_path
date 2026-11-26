import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  AppControlsConfigClient,
  AuditLogClient,
  ServerAuthUser,
  TherapistConnectionRecord,
  TherapistWorkScopeClient,
  UserRole,
  VerificationStatus,
  VerifiedSupportServiceRecord,
} from '../types';
import {
  Shield,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  LogOut,
  RefreshCw,
  Building2,
  Stethoscope,
  ScrollText,
  PhoneCall,
  Plus,
  Ban,
  KeyRound,
  Lock,
  Users,
  Trash2,
  Compass,
  Search,
  Sliders,
} from 'lucide-react';
import { ClearPathLogo } from '../components/ClearPathLogo';

interface AdminOrgRecord {
  id: string;
  name: string;
  category: string;
  professionalRole: string;
  district: string;
  contactEmail?: string;
  contactPhone?: string;
  verificationDocRef?: string;
  intendedUse: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const VERIFICATION_STATUS_STYLE: Record<VerificationStatus, string> = {
  registration_incomplete: 'bg-slate-100 text-slate-700 border border-slate-300',
  submitted: 'bg-sky-50 text-sky-800 border border-sky-200',
  pending_verification: 'bg-amber-50 text-amber-800 border border-amber-200',
  approved: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
  rejected: 'bg-rose-50 text-rose-800 border border-rose-200',
  suspended: 'bg-rose-100 text-rose-950 border border-rose-300',
  pending: 'bg-amber-50 text-amber-800 border border-amber-200',
};

export const AdminVerificationView: React.FC = () => {
  const {
    serverAuthToken,
    serverAuthUser,
    setServerSession,
    clearServerSession,
    setPortalMode,
    setRole,
    themeMode,
    toggleThemeMode,
  } = useApp();

  // Inline Admin login / quick access state when not signed in as admin
  const [adminQuickCode, setAdminQuickCode] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [authBusy, setAuthBusy] = useState(false);

  const [therapists, setTherapists] = useState<ServerAuthUser[]>([]);
  const [connections, setConnections] = useState<TherapistConnectionRecord[]>([]);
  const [orgs, setOrgs] = useState<AdminOrgRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogClient[]>([]);
  const [services, setServices] = useState<VerifiedSupportServiceRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // App Controls & Therapist Work Scope state
  const [appControls, setAppControls] = useState<AppControlsConfigClient | null>(null);
  const [savingControls, setSavingControls] = useState(false);
  const [scopeDrafts, setScopeDrafts] = useState<Record<string, TherapistWorkScopeClient>>({});
  const [savingScopeId, setSavingScopeId] = useState<string | null>(null);

  // Audit filter & search state
  const [auditFilter, setAuditFilter] = useState<'all' | 'all_signins' | 'therapist_edits' | 'admin_consent'>('all');
  const [auditSearch, setAuditSearch] = useState('');

  const [permissionGrantsMeta, setPermissionGrantsMeta] = useState<
    Array<{
      id: string;
      clientName: string;
      therapistName: string;
      categories: string[];
      accessMode: string;
      status: string;
      authorizedAt: string;
      expiresAt?: string;
    }>
  >([]);
  const [reportsSummaryMeta, setReportsSummaryMeta] = useState<
    Array<{
      id: string;
      title: string;
      clientName: string;
      therapistName: string;
      status: string;
      deliveredAt: string;
      viewedAt?: string;
      sectionsIncluded: string[];
    }>
  >([]);

  // Add new verified service state
  const [showAddService, setShowAddService] = useState(false);
  const [svcOrg, setSvcOrg] = useState('');
  const [svcContact, setSvcContact] = useState('');
  const [svcType, setSvcType] = useState<VerifiedSupportServiceRecord['serviceType']>('rehabilitation');
  const [svcLocation, setSvcLocation] = useState('Ernakulam, Kerala');
  const [svcHours, setSvcHours] = useState('Mon-Sat 9:00 AM - 2:00 PM');
  const [svcUrl, setSvcUrl] = useState('');

  const loadAdminData = useCallback(async () => {
    if (!serverAuthToken || serverAuthUser?.role !== 'admin') return;
    setLoading(true);
    setError(null);
    try {
      const [pendingRes, logsRes, svcRes, ctrlRes] = await Promise.all([
        fetch('/api/admin/pending', { headers: { Authorization: `Bearer ${serverAuthToken}` } }),
        fetch('/api/audit/logs', { headers: { Authorization: `Bearer ${serverAuthToken}` } }),
        fetch('/api/services/verified?includeUnverified=true'),
        fetch('/api/admin/app-controls', { headers: { Authorization: `Bearer ${serverAuthToken}` } }),
      ]);
      const pendingData = await pendingRes.json();
      const logsData = await logsRes.json();
      const svcData = await svcRes.json();
      if (!pendingRes.ok) {
        setError(pendingData.error || 'Failed to load pending verification queue.');
      } else {
        const tList: ServerAuthUser[] = pendingData.therapists || [];
        setTherapists(tList);
        const nextScopes: Record<string, TherapistWorkScopeClient> = {};
        tList.forEach(t => {
          nextScopes[t.id] = t.workScope || {
            maxActivePatients: 25,
            allowedSpecializations: [t.specialization || 'Recovery Support'],
            allowDirectOnboarding: true,
            allowClinicalNotes: true,
            adminScopeNote: '',
          };
        });
        setScopeDrafts(nextScopes);
        setConnections(pendingData.connections || []);
        setOrgs(pendingData.orgs || []);
        setPermissionGrantsMeta(pendingData.permissionGrants || []);
        setReportsSummaryMeta(pendingData.reportsSummary || []);
      }
      if (logsRes.ok) {
        setAuditLogs(logsData.logs || []);
      }
      if (svcRes.ok) {
        setServices(svcData.services || []);
      }
      if (ctrlRes.ok) {
        const ctrlData = await ctrlRes.json();
        if (ctrlData.controls) setAppControls(ctrlData.controls);
      }
    } catch {
      setError('Network error while contacting Admin API.');
    } finally {
      setLoading(false);
    }
  }, [serverAuthToken, serverAuthUser]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleInlineAdminLogin = async (payload: { code: string; name?: string }) => {
    setError(null);
    setAuthBusy(true);
    try {
      const res = await fetch('/api/auth/admin-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid administrator access.');
        return;
      }
      setServerSession(data.token, data.user);
      setAdminQuickCode('');
    } catch {
      setError('Network error while signing into Admin Console.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSaveAppControls = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverAuthToken || !appControls) return;
    setSavingControls(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/app-controls', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify(appControls),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to save app controls.');
        return;
      }
      if (data.controls) setAppControls(data.controls);
      setNotice('Platform App Controls updated.');
      loadAdminData();
    } finally {
      setSavingControls(false);
    }
  };

  const handleSaveTherapistScope = async (therapistId: string) => {
    if (!serverAuthToken) return;
    const draft = scopeDrafts[therapistId];
    if (!draft) return;
    setSavingScopeId(therapistId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/therapists/${therapistId}/scope`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not update therapist work scope.');
        return;
      }
      setNotice('Therapist work scope & limits updated.');
      await loadAdminData();
    } finally {
      setSavingScopeId(null);
    }
  };

  const handleRevokeAssignment = async (connId: string) => {
    if (!serverAuthToken) return;
    const res = await fetch(`/api/admin/therapist-assignments/${connId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${serverAuthToken}` },
    });
    if (res.ok) {
      setNotice('Connection terminated by governance safety action.');
      await loadAdminData();
    }
  };

  const exploreRoleAsAdmin = (targetRole: UserRole) => {
    setPortalMode('none');
    setRole(targetRole);
  };

  const handleTherapistDecision = async (id: string, decision: VerificationStatus) => {
    if (!serverAuthToken) return;
    const verificationNote = (decisionNotes[id] || '').trim() || undefined;
    const res = await fetch(`/api/admin/therapists/${id}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({ decision, verificationNote }),
    });
    if (res.ok) {
      setNotice(`Therapist status updated to ${decision.replace(/_/g, ' ')}.`);
      loadAdminData();
    } else {
      const data = await res.json();
      setError(data.error || 'Unable to update status.');
    }
  };

  const handleOrgDecision = async (id: string, decision: 'approved' | 'rejected') => {
    if (!serverAuthToken) return;
    const res = await fetch(`/api/admin/orgs/${id}/decision`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({ decision }),
    });
    if (res.ok) {
      setNotice(`Organization verification updated to ${decision}.`);
      loadAdminData();
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverAuthToken || !svcOrg.trim() || !svcContact.trim()) return;
    const res = await fetch('/api/admin/services', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({
        organization: svcOrg.trim(),
        verifiedContact: svcContact.trim(),
        serviceType: svcType.trim(),
        location: svcLocation.trim(),
        hours: svcHours.trim(),
        officialSourceUrl: svcUrl.trim() || 'https://kerala.gov.in',
        verificationStatus: 'verified',
      }),
    });
    if (res.ok) {
      setSvcOrg('');
      setSvcContact('');
      setSvcUrl('');
      setShowAddService(false);
      setNotice('Verified support service saved.');
      loadAdminData();
    }
  };

  const handleToggleServiceStatus = async (
    svc: VerifiedSupportServiceRecord,
    nextStatus: 'verified' | 'needs_reverification' | 'archived'
  ) => {
    if (!serverAuthToken) return;
    const res = await fetch(`/api/admin/services/${svc.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({
        verificationStatus: nextStatus,
        lastVerified: new Date().toISOString().split('T')[0],
      }),
    });
    if (res.ok) {
      setNotice(`Service "${svc.organization}" updated to ${nextStatus}.`);
      loadAdminData();
    }
  };

  const filteredTherapists = therapists.filter(
    t => statusFilter === 'all' || t.verificationStatus === statusFilter
  );

  const filteredAuditLogs = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    return auditLogs.filter(log => {
      if (auditFilter === 'all_signins') {
        if (
          ![
            'USER_SIGNED_IN',
            'USER_REGISTERED',
            'USER_LOGIN',
            'THERAPIST_LOGIN',
            'THERAPIST_ACCESS_UNLOCKED',
            'THERAPIST_QUICK_CODE_UNLOCK',
            'THERAPIST_QUICK_CODE_SIGNIN',
            'THERAPIST_AUTHORITY_ACCESS',
            'THERAPIST_REGISTERED',
            'ADMIN_ACCESS_SIGNIN',
            'ADMIN_LOGIN',
          ].includes(log.action)
        ) {
          return false;
        }
      } else if (auditFilter === 'therapist_edits') {
        if (
          log.actorRole !== 'therapist' ||
          [
            'THERAPIST_LOGIN',
            'THERAPIST_ACCESS_UNLOCKED',
            'THERAPIST_QUICK_CODE_UNLOCK',
            'THERAPIST_QUICK_CODE_SIGNIN',
            'THERAPIST_AUTHORITY_ACCESS',
            'THERAPIST_REGISTERED',
          ].includes(log.action)
        ) {
          return false;
        }
      } else if (auditFilter === 'admin_consent') {
        if (log.actorRole !== 'admin' && !log.action.includes('CONSENT') && !log.action.includes('CONNECTION')) {
          return false;
        }
      }
      if (!q) return true;
      return (
        log.action.toLowerCase().includes(q) ||
        log.detail.toLowerCase().includes(q) ||
        (log.actorUsername || '').toLowerCase().includes(q) ||
        (log.actorName || '').toLowerCase().includes(q) ||
        (log.section || '').toLowerCase().includes(q)
      );
    });
  }, [auditLogs, auditFilter, auditSearch]);

  const activeAssignments = connections.filter(c => c.status === 'accepted');

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 h-16 flex items-center justify-between gap-3">
        <ClearPathLogo size="sm" subtitle="Platform Verification & Audit Console" />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleThemeMode}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
          >
            {themeMode === 'night' ? 'Day' : 'Night'}
          </button>
          <button
            type="button"
            onClick={() => setPortalMode('none')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 inline-flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
          {serverAuthUser?.role === 'admin' && (
            <button
              type="button"
              onClick={() => {
                clearServerSession();
                setPortalMode('none');
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        {serverAuthUser?.role !== 'admin' ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 max-w-md mx-auto space-y-5 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-teal-900 text-amber-300 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                  Restricted Creator &amp; Admin Governance
                </div>
                <h1 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  Administrator Access Required
                </h1>
                <p className="text-xs text-slate-600 mt-1">
                  Enter your Admin Name and Quick Access Code to view sign-in logs, approve therapists, set work scopes, and manage app controls.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                {error}
              </div>
            )}

            <form
              onSubmit={e => {
                e.preventDefault();
                handleInlineAdminLogin({
                  name: adminUsername.trim(),
                  code: adminQuickCode,
                });
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Admin Name *</label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={e => setAdminUsername(e.target.value)}
                  placeholder="e.g. Creator Admin"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-teal-700" />
                  <span>Quick Access Code *</span>
                </label>
                <input
                  type="text"
                  value={adminQuickCode}
                  onChange={e => setAdminQuickCode(e.target.value)}
                  placeholder="Enter admin quick access code..."
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-teal-200 bg-teal-50/50 text-xs text-slate-900 font-semibold"
                />
              </div>

              <button
                type="submit"
                disabled={authBusy || !adminUsername.trim() || !adminQuickCode.trim()}
                className="w-full py-2.5 rounded-xl bg-teal-900 hover:bg-teal-950 disabled:opacity-50 text-white font-bold cursor-pointer"
              >
                {authBusy ? 'Entering...' : 'Enter Admin Console'}
              </button>
            </form>
          </div>
        ) : (
          <>
            <section className="bg-teal-950 text-white rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                  <Shield className="w-4 h-4" />
                  <span>ClearPath Creator Governance · Signed in as {serverAuthUser.name}</span>
                </div>
                <h1 className="text-2xl font-extrabold">
                  Sign-In Audit, Therapist Approvals &amp; App Controls
                </h1>
                <p className="text-xs text-teal-100/85">
                  See who signed in and when, approve therapists &amp; set work scopes, adjust app controls, and explore any role. Patients and therapists always choose each other mutually.
                </p>
              </div>
              <button
                type="button"
                onClick={loadAdminData}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer self-start"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </section>

            {/* Direct Role Explorer Bar (Admin can access any role freely without separate sign-ups) */}
            <section className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-teal-800" />
                    <span>Direct Role Access (No Separate Sign-Up Needed)</span>
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Open any workspace role directly as Admin and return here anytime via the top header button. Confidential therapist clinical notes remain strictly sealed to treating clinicians.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                {(
                  [
                    { id: 'personal', label: '01 · Recover & Rebuild', sub: 'Daily logs, CBT, goals' },
                    { id: 'supporter', label: '02 · Support & Understand', sub: 'Family & peer guidance' },
                    { id: 'learner', label: '03 · Learn & Prevent', sub: 'Science & modules' },
                    { id: 'community', label: '04 · Community Builder', sub: 'Intelligence & programmes' },
                  ] as const
                ).map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => exploreRoleAsAdmin(item.id)}
                    className="p-3 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 text-left transition-colors cursor-pointer"
                  >
                    <div className="font-extrabold text-slate-900">{item.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.sub}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* Platform App Controls */}
            {appControls && (
              <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-teal-800" />
                      <span>App Governance Controls</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Turn platform capabilities on or off globally and post an optional safety banner notice.
                    </p>
                  </div>
                </div>
                <form onSubmit={handleSaveAppControls} className="space-y-3 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {[
                      { key: 'allowNewSignups', label: 'Allow New Account Sign-Ups' },
                      { key: 'allowTherapistDirectDiscovery', label: 'Show Therapists in Public Directory' },
                      { key: 'allowTherapistCustomCodes', label: 'Allow Therapist Custom Quick Codes' },
                      { key: 'enableAiBriefMode', label: 'Keep AI Responses Brief & Simple' },
                      { key: 'requireOrgVerification', label: 'Verify Organizations Before Listing' },
                    ].map(item => (
                      <label
                        key={item.key}
                        className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer font-semibold text-slate-800"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(appControls[item.key as keyof AppControlsConfigClient])}
                          onChange={e =>
                            setAppControls(prev =>
                              prev ? { ...prev, [item.key]: e.target.checked } : prev
                            )
                          }
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                    <input
                      type="text"
                      value={appControls.platformNotice || ''}
                      onChange={e =>
                        setAppControls(prev =>
                          prev ? { ...prev, platformNotice: e.target.value } : prev
                        )
                      }
                      placeholder="Optional platform notice shown to signed-in members..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                    />
                    <button
                      type="submit"
                      disabled={savingControls}
                      className="px-4 py-2 rounded-xl bg-teal-900 hover:bg-teal-950 disabled:opacity-60 text-white font-bold cursor-pointer whitespace-nowrap"
                    >
                      {savingControls ? 'Saving...' : 'Save App Controls'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                {error}
              </div>
            )}
            {notice && (
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-950 flex items-center justify-between">
                <span>{notice}</span>
                <button type="button" onClick={() => setNotice(null)} className="font-bold underline cursor-pointer">
                  Dismiss
                </button>
              </div>
            )}

            {/* Therapists 6-State Queue */}
            <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-indigo-800" />
                  <span>Clinician Accounts ({filteredTherapists.length}/{therapists.length})</span>
                </h2>
                <div className="flex flex-wrap gap-1.5 text-[11px] font-bold">
                  {(
                    [
                      'all',
                      'pending_verification',
                      'submitted',
                      'registration_incomplete',
                      'approved',
                      'rejected',
                      'suspended',
                    ] as const
                  ).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg capitalize cursor-pointer ${
                        statusFilter === st
                          ? 'bg-teal-950 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {st.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {filteredTherapists.length === 0 ? (
                <p className="text-xs text-slate-500">No clinician accounts matching filter.</p>
              ) : (
                <div className="space-y-3">
                  {filteredTherapists.map(t => (
                    <div
                      key={t.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-slate-900">
                            {t.name} <span className="text-slate-500 font-normal">(@{t.username})</span>
                          </div>
                          <div className="text-xs text-slate-600">
                            Category: <strong>{(t.professionalCategory || 'other').replace(/_/g, ' ')}</strong> · License:{' '}
                            <strong>{t.licenseNumber || 'Not yet provided'}</strong> ·{' '}
                            {t.qualifications || 'No qualifications listed'}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Institution: {t.institution || 'Independent'} · Practice: {t.areaOfPractice || t.specialization || 'General'} · District: {t.district || 'Kerala'}
                            {t.supportingDocRef ? ` · Doc Ref: ${t.supportingDocRef}` : ''}
                          </div>
                          {t.verificationNote && (
                            <div className="text-[11px] text-amber-900 font-medium">
                              Admin Note: {t.verificationNote}
                            </div>
                          )}
                        </div>
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg capitalize ${
                            VERIFICATION_STATUS_STYLE[t.verificationStatus] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {t.verificationStatus.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <input
                          type="text"
                          value={decisionNotes[t.id] ?? ''}
                          onChange={e => setDecisionNotes(p => ({ ...p, [t.id]: e.target.value }))}
                          placeholder="Optional verification / audit reason note..."
                          className="flex-1 min-w-[200px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleTherapistDecision(t.id, 'approved')}
                          className="px-3 py-1.5 rounded-xl bg-teal-900 hover:bg-teal-950 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTherapistDecision(t.id, 'pending_verification')}
                          className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-950 text-xs font-bold cursor-pointer"
                        >
                          Mark In Review
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTherapistDecision(t.id, 'rejected')}
                          className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-800 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTherapistDecision(t.id, 'suspended')}
                          className="px-3 py-1.5 rounded-xl bg-rose-700 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" />
                          <span>Suspend</span>
                        </button>
                      </div>

                      {/* Admin Work Scope Settings for This Therapist */}
                      {scopeDrafts[t.id] && (
                        <div className="pt-3 border-t border-slate-200 space-y-2.5 text-xs">
                          <div className="font-bold text-slate-800">Work Scope &amp; Caseload Limits</div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Max Active Patients
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={200}
                                value={scopeDrafts[t.id].maxActivePatients}
                                onChange={e =>
                                  setScopeDrafts(prev => ({
                                    ...prev,
                                    [t.id]: {
                                      ...prev[t.id],
                                      maxActivePatients: Math.max(1, Number(e.target.value) || 1),
                                    },
                                  }))
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono-tabular"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                Allowed Focus Areas (comma-separated)
                              </label>
                              <input
                                type="text"
                                value={scopeDrafts[t.id].allowedSpecializations.join(', ')}
                                onChange={e =>
                                  setScopeDrafts(prev => ({
                                    ...prev,
                                    [t.id]: {
                                      ...prev[t.id],
                                      allowedSpecializations: e.target.value
                                        .split(',')
                                        .map(s => s.trim())
                                        .filter(Boolean),
                                    },
                                  }))
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                              />
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-3">
                              <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={scopeDrafts[t.id].allowDirectOnboarding}
                                  onChange={e =>
                                    setScopeDrafts(prev => ({
                                      ...prev,
                                      [t.id]: {
                                        ...prev[t.id],
                                        allowDirectOnboarding: e.target.checked,
                                      },
                                    }))
                                  }
                                />
                                <span>Allow Direct Client Onboarding</span>
                              </label>
                              <label className="inline-flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                                <input
                                  type="checkbox"
                                  checked={scopeDrafts[t.id].allowClinicalNotes}
                                  onChange={e =>
                                    setScopeDrafts(prev => ({
                                      ...prev,
                                      [t.id]: {
                                        ...prev[t.id],
                                        allowClinicalNotes: e.target.checked,
                                      },
                                    }))
                                  }
                                />
                                <span>Allow Private Clinical Notes</span>
                              </label>
                            </div>
                            <button
                              type="button"
                              disabled={savingScopeId === t.id}
                              onClick={() => handleSaveTherapistScope(t.id)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 disabled:opacity-60 text-white font-bold cursor-pointer"
                            >
                              {savingScopeId === t.id ? 'Saving...' : 'Save Work Scope'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Verified Support Services & Helplines Manager */}
            <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-teal-800" />
                    <span>Verified Helplines &amp; Support Services Directory ({services.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Maintain verified national/Kerala contacts, operating hours, official source URLs, and verification dates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddService(v => !v)}
                  className="px-3.5 py-2 rounded-xl bg-teal-900 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddService ? 'Close Form' : 'Add Verified Service'}</span>
                </button>
              </div>

              {showAddService && (
                <form onSubmit={handleCreateService} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <input
                    type="text"
                    value={svcOrg}
                    onChange={e => setSvcOrg(e.target.value)}
                    placeholder="Organization / Service Name *"
                    required
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                  <input
                    type="text"
                    value={svcContact}
                    onChange={e => setSvcContact(e.target.value)}
                    placeholder="Verified Phone / Helpline *"
                    required
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                  <select
                    value={svcType}
                    onChange={e =>
                      setSvcType(e.target.value as VerifiedSupportServiceRecord['serviceType'])
                    }
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold"
                    aria-label="Service Category"
                  >
                    <option value="rehabilitation">Rehabilitation Centre</option>
                    <option value="treatment_centre">Hospital / De-Addiction Unit</option>
                    <option value="emergency">24/7 Emergency Service</option>
                    <option value="state_helpline">Kerala State Helpline</option>
                    <option value="national_helpline">National Helpline</option>
                    <option value="mental_health">Mental Health Care</option>
                    <option value="education_skills">Education, Sports &amp; Skills</option>
                  </select>
                  <input
                    type="text"
                    value={svcLocation}
                    onChange={e => setSvcLocation(e.target.value)}
                    placeholder="District / Location in Kerala"
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                  <input
                    type="text"
                    value={svcHours}
                    onChange={e => setSvcHours(e.target.value)}
                    placeholder="Operating Hours"
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                  <input
                    type="url"
                    value={svcUrl}
                    onChange={e => setSvcUrl(e.target.value)}
                    placeholder="Official Source URL (https://...)"
                    className="px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  />
                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-teal-950 text-white font-bold cursor-pointer whitespace-nowrap"
                    >
                      Save Verified Entry
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {services.map(svc => (
                  <div
                    key={svc.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between gap-2 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-slate-900">{svc.organization}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                            svc.verificationStatus === 'verified'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : svc.verificationStatus === 'archived'
                              ? 'bg-slate-200 text-slate-700 border border-slate-300'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {svc.verificationStatus.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-slate-700">
                        Contact: <strong className="font-mono-tabular">{svc.verifiedContact}</strong> ·{' '}
                        {svc.serviceType.replace(/_/g, ' ')}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {svc.location} · {svc.hours} · Last Verified: {svc.lastVerified}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleToggleServiceStatus(svc, 'verified')}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-emerald-800 cursor-pointer whitespace-nowrap"
                      >
                        Re-Verify Today
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleServiceStatus(svc, 'needs_reverification')}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-amber-800 cursor-pointer whitespace-nowrap"
                      >
                        Flag Review
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleServiceStatus(svc, 'archived')}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer whitespace-nowrap"
                      >
                        Archive
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Community Organizations Queue */}
            <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-teal-800" />
                <span>Community &amp; Institutional Organizations ({orgs.length})</span>
              </h2>
              {orgs.length === 0 ? (
                <p className="text-xs text-slate-500">No organization verification requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {orgs.map(org => (
                    <div
                      key={org.id}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-slate-900">{org.name}</div>
                        <div className="text-xs text-slate-600">
                          {org.category.replace('_', ' ')} · Role: {org.professionalRole} · District: {org.district}
                          {org.verificationDocRef ? ` · Doc Ref: ${org.verificationDocRef}` : ''}
                        </div>
                        <div className="text-[11px] text-slate-500">{org.intendedUse}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg capitalize ${
                            org.verificationStatus === 'approved'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : org.verificationStatus === 'rejected'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {org.verificationStatus}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOrgDecision(org.id, 'approved')}
                          className="px-3 py-1.5 rounded-xl bg-teal-900 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOrgDecision(org.id, 'rejected')}
                          className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-800 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Mutual Patient–Therapist Selection Policy (No Admin Pairing) */}
            <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-teal-800" />
                    <span>Mutual Patient–Therapist Connections ({activeAssignments.length})</span>
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    By policy, <strong>Admins never assign or decide which therapist sees which patient</strong>. Patients and approved therapists choose each other mutually via the verified directory or invite codes. Admins may only revoke unsafe links if necessary.
                  </p>
                </div>
              </div>

              {activeAssignments.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No active mutual patient–therapist connections yet.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                  {activeAssignments.map(conn => (
                    <div key={conn.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">
                          <Users className="w-3.5 h-3.5 inline mr-1 text-teal-700" />
                          {conn.clientName} &harr; {conn.therapistName}
                        </div>
                        <div className="text-[11px] text-slate-500 tabular-nums">
                          Connected {conn.consentGrantedAt ? conn.consentGrantedAt.split('T')[0] : conn.createdAt.split('T')[0]} · Initiated by {conn.initiatedBy}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRevokeAssignment(conn.id)}
                        className="px-2.5 py-1 rounded-lg border border-rose-200 bg-white text-rose-700 font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
                        title="Governance Safety Revoke"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Revoke</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Patient–Therapist Consent & Shared Report Metadata Oversight (Strictly Zero Private Prose/Clinical Notes) */}
            <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-teal-800" />
                  <span>
                    Consent Permissions &amp; Report Delivery Metadata ({permissionGrantsMeta.length} grants ·{' '}
                    {reportsSummaryMeta.length} reports)
                  </span>
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Governance check only: shows which data categories users shared, expiry dates, and report delivery status. Confidential clinical notes and private chat messages are never visible to Admins.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2.5">
                  <div className="font-bold text-slate-800">Active &amp; Recent Sharing Grants</div>
                  {permissionGrantsMeta.length === 0 ? (
                    <p className="text-slate-500">No consent grants recorded yet.</p>
                  ) : (
                    permissionGrantsMeta.slice(0, 8).map(g => (
                      <div key={g.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900">
                            {g.clientName} &rarr; {g.therapistName}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-bold capitalize ${
                              g.status === 'active'
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {g.status} ({g.accessMode.replace('_', ' ')})
                          </span>
                        </div>
                        <div className="text-slate-600">
                          Categories ({g.categories.length}): {g.categories.map(c => c.replace(/_/g, ' ')).join(', ')}
                        </div>
                        <div className="text-slate-500 tabular-nums">
                          Granted: {g.authorizedAt.split('T')[0]}
                          {g.expiresAt ? ` · Expires: ${g.expiresAt.split('T')[0]}` : ''}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2.5">
                  <div className="font-bold text-slate-800">Shared Report Delivery Audit (Metadata Only)</div>
                  {reportsSummaryMeta.length === 0 ? (
                    <p className="text-slate-500">No shared user reports recorded yet.</p>
                  ) : (
                    reportsSummaryMeta.slice(0, 8).map(rep => (
                      <div key={rep.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-slate-900">{rep.title}</span>
                          <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-900 font-bold capitalize">
                            {rep.status}
                          </span>
                        </div>
                        <div className="text-slate-600">
                          {rep.clientName} &rarr; {rep.therapistName} · {rep.sectionsIncluded.length} sections shared
                        </div>
                        <div className="text-slate-500 tabular-nums">
                          Delivered: {new Date(rep.deliveredAt).toLocaleDateString()}
                          {rep.viewedAt ? ` · Viewed: ${new Date(rep.viewedAt).toLocaleDateString()}` : ''}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>

            {/* Filterable Therapist Login & Change Activity Audit Trail */}
            <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <ScrollText className="w-4 h-4 text-slate-700" />
                    <span>Sign-In &amp; Activity Audit Trail ({filteredAuditLogs.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Tracks who signed in and when across users &amp; therapists, plus exact clinician data changes — without exposing private clinical prose.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                  {(
                    [
                      { id: 'all', label: 'All Events' },
                      { id: 'all_signins', label: 'All Sign-Ins (Users & Therapists)' },
                      { id: 'therapist_edits', label: 'Therapist Data Edits' },
                      { id: 'admin_consent', label: 'Admin & Consent' },
                    ] as const
                  ).map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setAuditFilter(tab.id)}
                      className={`px-2.5 py-1.5 rounded-lg cursor-pointer ${
                        auditFilter === tab.id
                          ? 'bg-teal-950 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={auditSearch}
                  onChange={e => setAuditSearch(e.target.value)}
                  placeholder="Search by clinician username/name, modified section (Goals, Calendar, Daily Log, Plan), or action..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
              </div>

              <div className="overflow-x-auto max-h-96 overflow-y-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 font-bold text-slate-700">Timestamp</th>
                      <th className="py-2.5 px-3 font-bold text-slate-700">Actor</th>
                      <th className="py-2.5 px-3 font-bold text-slate-700">Section Modified</th>
                      <th className="py-2.5 px-3 font-bold text-slate-700">Action</th>
                      <th className="py-2.5 px-3 font-bold text-slate-700">Change Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAuditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500">
                          No matching audit entries recorded.
                        </td>
                      </tr>
                    ) : (
                      filteredAuditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-slate-50/70">
                          <td className="py-2.5 px-3 text-[11px] text-slate-500 whitespace-nowrap tabular-nums">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <div className="font-bold text-slate-900">
                              {log.actorName || log.actorRole}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {log.actorUsername ? `@${log.actorUsername} · ` : ''}
                              {log.actorRole}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-teal-900 whitespace-nowrap">
                            {log.section || log.targetType}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-indigo-900 whitespace-nowrap">
                            {log.action}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 max-w-md">{log.detail}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};
