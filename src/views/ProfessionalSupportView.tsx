import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { PERMISSION_CATEGORY_META } from '../constants/substanceCatalogue';
import {
  AppointmentNoteClient,
  PermissionCategory,
  PermissionGrantRecord,
  PermissionHistoryEntry,
  SecureMessageClient,
  TherapistAssignmentRecord,
  TherapistDirectoryEntry,
  TherapistDirectoryTotals,
  TherapistInvitationRecord,
  WeeklyProgressSubmissionClient,
} from '../types';
import { CarePlanProposalPanel } from '../components/CarePlanProposalPanel';
import {
  ShieldCheck,
  UserCheck,
  Search,
  CheckCircle2,
  XCircle,
  Lock,
  KeyRound,
  AlertTriangle,
  Eye,
  Calendar,
  ClipboardCheck,
  MessageSquare,
  Send,
  RefreshCw,
  History,
  FileText,
  Radio,
  Check,
} from 'lucide-react';

interface Props {
  onSelectTab: (tab: string) => void;
}

export const ProfessionalSupportView: React.FC<Props> = ({ onSelectTab }) => {
  const {
    serverAuthToken,
    serverAuthUser,
    refreshClientAssignments,
    carePlanProposals,
    realtimeTick,
    realtimeStatus,
  } = useApp();

  const [therapists, setTherapists] = useState<TherapistDirectoryEntry[]>([]);
  const [directoryTotals, setDirectoryTotals] = useState<TherapistDirectoryTotals | null>(null);
  const [whatsappConsentMap, setWhatsappConsentMap] = useState<Record<string, boolean>>({});
  const [openWhatsappId, setOpenWhatsappId] = useState<string | null>(null);
  const [searchTherapist, setSearchTherapist] = useState('');
  const [invitations, setInvitations] = useState<TherapistInvitationRecord[]>([]);
  const [grants, setGrants] = useState<PermissionGrantRecord[]>([]);
  const [permHistory, setPermHistory] = useState<PermissionHistoryEntry[]>([]);
  const [assignments, setAssignments] = useState<TherapistAssignmentRecord[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgressSubmissionClient[]>([]);
  const [appointments, setAppointments] = useState<AppointmentNoteClient[]>([]);
  const [messages, setMessages] = useState<SecureMessageClient[]>([]);
  const [connections, setConnections] = useState<any[]>([]);

  const [activeSubTab, setActiveSubTab] = useState<'permissions' | 'invitations' | 'assignments' | 'appointments' | 'messages'>('permissions');
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redeem Invite Code
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [redeemCategories, setRedeemCategories] = useState<PermissionCategory[]>([
    'background',
    'screening_results',
    'weekly_reports',
    'appointments',
    'assignments',
  ]);

  // Request Verified Therapist (Workflow B)
  const [selectedTherapistId, setSelectedTherapistId] = useState('');
  const [requestPurpose, setRequestPurpose] = useState('Structured therapy support & weekly review');
  const [requestCategories, setRequestCategories] = useState<PermissionCategory[]>([
    'background',
    'screening_results',
    'substances',
    'goals',
    'weekly_reports',
  ]);

  // Granular Permission Editor for connected therapist
  const [permTherapistId, setPermTherapistId] = useState('');
  const [permCategories, setPermCategories] = useState<PermissionCategory[]>([
    'background',
    'screening_results',
    'substances',
    'goals',
    'weekly_reports',
    'appointments',
    'assignments',
  ]);
  const [accessType, setAccessType] = useState<'one_time' | 'continuing'>('continuing');
  const [expiresAt, setExpiresAt] = useState('');
  const [allowWeeklyUpdates, setAllowWeeklyUpdates] = useState(true);
  const [allowSelectedActivities, setAllowSelectedActivities] = useState(true);
  const [allowBidirectionalFeedback, setAllowBidirectionalFeedback] = useState(true);

  // Weekly update / Assignment / Appt Prep / Message forms
  const [reflectionDrafts, setReflectionDrafts] = useState<Record<string, string>>({});
  const [wpActivities, setWpActivities] = useState('');
  const [wpWhatHelped, setWpWhatHelped] = useState('');
  const [wpDifficulties, setWpDifficulties] = useState('');
  const [wpQuestions, setWpQuestions] = useState('');

  const [apptPrepDate, setApptPrepDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [apptPrepTime, setApptPrepTime] = useState('10:30');
  const [apptPrepTopics, setApptPrepTopics] = useState('');
  const [apptPrepQuestions, setApptPrepQuestions] = useState('');

  const [msgText, setMsgText] = useState('');
  const [chatConnectionId, setChatConnectionId] = useState('');
  const [connectingChatTherapistId, setConnectingChatTherapistId] = useState<string | null>(null);
  const [sendingMsg, setSendingMsg] = useState(false);
  const [chatConsentChecked, setChatConsentChecked] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dirRes = await fetch('/api/therapists/directory', {
        headers: serverAuthToken ? { Authorization: `Bearer ${serverAuthToken}` } : {},
      });
      if (dirRes.ok) {
        const dData = await dirRes.json();
        const list: TherapistDirectoryEntry[] = dData.therapists || [];
        setTherapists(list);
        if (dData.totals) setDirectoryTotals(dData.totals);
        if (list.length > 0 && !selectedTherapistId) {
          setSelectedTherapistId(list[0].id);
        }
      }

      if (serverAuthToken && serverAuthUser?.role === 'user') {
        const [invRes, permRes, wsRes] = await Promise.all([
          fetch('/api/invitations/mine', { headers: { Authorization: `Bearer ${serverAuthToken}` } }),
          fetch('/api/permissions', { headers: { Authorization: `Bearer ${serverAuthToken}` } }),
          fetch('/api/care/workspace', { headers: { Authorization: `Bearer ${serverAuthToken}` } }),
        ]);

        if (invRes.ok) {
          const iData = await invRes.json();
          setInvitations(iData.invitations || []);
        }
        if (permRes.ok) {
          const pData = await permRes.json();
          setGrants(pData.grants || []);
          setPermHistory(pData.history || []);
        }
        if (wsRes.ok) {
          const wData = await wsRes.json();
          const conns = wData.connections || [];
          setConnections(conns);
          setAssignments(wData.assignments || []);
          setWeeklyProgress(wData.weeklyProgress || []);
          setAppointments(wData.appointmentNotes || []);
          setMessages(wData.messages || []);
          const accepted = conns.find((c: any) => c.status === 'accepted');
          if (accepted && !permTherapistId) {
            setPermTherapistId(accepted.therapistId);
          }
        }
      }
    } catch {
      setError('Could not load professional support state.');
    } finally {
      setLoading(false);
    }
  }, [serverAuthToken, serverAuthUser, selectedTherapistId, permTherapistId]);

  useEffect(() => {
    loadData();
  }, [loadData, realtimeTick]);

  const toggleCategoryInList = (
    cat: PermissionCategory,
    list: PermissionCategory[],
    setter: (next: PermissionCategory[]) => void
  ) => {
    setter(list.includes(cat) ? list.filter(x => x !== cat) : [...list, cat]);
  };

  const handleRedeemInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverAuthToken || !inviteCodeInput.trim()) return;
    setError(null);
    const redeemRes = await fetch('/api/invitations/redeem', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({
        code: inviteCodeInput.trim().toUpperCase(),
      }),
    });
    const redeemData = await redeemRes.json();
    if (!redeemRes.ok) {
      setError(redeemData.error || 'Could not redeem invite code.');
      return;
    }
    const invId = redeemData.invitation?.id;
    if (invId) {
      const respRes = await fetch(`/api/invitations/${invId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify({
          action: 'accept',
          grantedCategories: redeemCategories,
        }),
      });
      if (!respRes.ok) {
        const respErr = await respRes.json();
        setError(respErr.error || 'Invitation redeemed, but approval failed.');
        return;
      }
    }
    setInviteCodeInput('');
    setNotice('Invitation accepted with your chosen permissions!');
    loadData();
  };

  const handleRespondInvitation = async (invId: string, action: 'accept' | 'reject') => {
    if (!serverAuthToken) return;
    setError(null);
    const res = await fetch(`/api/invitations/${invId}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({
        action,
        grantedCategories: action === 'accept' ? redeemCategories : undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Unable to respond to invitation.');
      return;
    }
    setNotice(action === 'accept' ? 'Therapist connection authorized.' : 'Invitation declined.');
    loadData();
  };

  const handleSendTherapistRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverAuthToken || !selectedTherapistId) return;
    setError(null);
    const res = await fetch('/api/therapist/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({
        therapistId: selectedTherapistId,
        consentGranted: true,
        purpose: requestPurpose.trim(),
        requestedPermissions: requestCategories,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Could not send request.');
      return;
    }
    setNotice('Therapist connection request sent. You remain in control of what categories you approve.');
    loadData();
  };

  const handleCancelInvitation = async (invId: string) => {
    if (!serverAuthToken) return;
    const res = await fetch(`/api/invitations/${invId}/cancel`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${serverAuthToken}` },
    });
    if (res.ok) {
      setNotice('Pending invitation cancelled.');
      loadData();
    }
  };

  const handleSavePermissions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverAuthToken || !permTherapistId) return;
    setError(null);
    const res = await fetch('/api/permissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({
        therapistId: permTherapistId,
        categories: permCategories,
        accessMode: accessType,
        expiresAt: expiresAt || undefined,
        allowWeeklyUpdates,
        allowSelectedActivities,
        allowBidirectionalFeedback,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Unable to save permission settings.');
      return;
    }
    setNotice('Granular sharing permissions saved. Therapist only sees your enabled categories.');
    loadData();
  };

  const handleRevokeGrant = async (grantId: string) => {
    if (!serverAuthToken) return;
    const res = await fetch(`/api/permissions/${grantId}/revoke`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${serverAuthToken}` },
    });
    if (res.ok) {
      const data = await res.json();
      setNotice(data.notice || 'Access revoked immediately.');
      loadData();
    }
  };

  const handleClientUpdateAssignment = async (
    assignmentId: string,
    status: 'completed' | 'not_completed'
  ) => {
    if (!serverAuthToken) return;
    const res = await fetch(`/api/care/assignments/${assignmentId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({
        status,
        clientReflection: (reflectionDrafts[assignmentId] || '').trim() || undefined,
      }),
    });
    if (res.ok) {
      setNotice('Activity status shared respectfully.');
      await refreshClientAssignments();
      loadData();
    }
  };

  const handleSubmitWeeklyProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetTherapist = permTherapistId || connections.find(c => c.status === 'accepted')?.therapistId;
    if (!serverAuthToken || !targetTherapist) return;
    const res = await fetch('/api/care/weekly-progress', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({
        therapistId: targetTherapist,
        weekStarting: new Date().toISOString().split('T')[0],
        completedActivities: wpActivities
          .split(',')
          .map(s => s.trim())
          .filter(Boolean),
        whatHelped: wpWhatHelped.trim(),
        difficulties: wpDifficulties.trim(),
        questionsForTherapist: wpQuestions.trim(),
      }),
    });
    if (res.ok) {
      setWpActivities('');
      setWpWhatHelped('');
      setWpDifficulties('');
      setWpQuestions('');
      setNotice('Weekly update submitted.');
      loadData();
    }
  };

  const handleSaveAppointmentPrep = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetTherapist = permTherapistId || connections.find(c => c.status === 'accepted')?.therapistId;
    if (!serverAuthToken || !targetTherapist) return;
    const res = await fetch('/api/care/appointments/prep', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverAuthToken}`,
      },
      body: JSON.stringify({
        therapistId: targetTherapist,
        appointmentDate: apptPrepDate,
        appointmentTime: apptPrepTime,
        topicsToDiscuss: apptPrepTopics.split(',').map(s => s.trim()).filter(Boolean),
        clientQuestions: apptPrepQuestions.split('\n').map(s => s.trim()).filter(Boolean),
      }),
    });
    if (res.ok) {
      setApptPrepTopics('');
      setApptPrepQuestions('');
      setNotice('Appointment agenda & questions saved.');
      loadData();
    }
  };

  const handleConnectLiveChat = async (therapistId: string) => {
    if (!serverAuthToken || !therapistId) return;
    setConnectingChatTherapistId(therapistId);
    setError(null);
    try {
      const res = await fetch('/api/therapist/chat/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify({
          therapistId,
          consentGranted: true,
          purpose: 'Direct real-time patient & clinician care chat',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not start live clinician chat.');
        return;
      }
      if (data.connection?.id) {
        setChatConnectionId(data.connection.id);
      }
      if (data.connection?.therapistId) {
        setPermTherapistId(data.connection.therapistId);
      }
      setActiveSubTab('messages');
      setNotice(`Connected with ${data.therapist?.name || 'therapist'} for live Clinician Chat.`);
      await loadData();
    } catch {
      setError('Network error while connecting to clinician chat.');
    } finally {
      setConnectingChatTherapistId(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetConn =
      acceptedConns.find((c: any) => c.id === chatConnectionId) || acceptedConns[0];
    if (!serverAuthToken || !targetConn || !msgText.trim()) return;
    setSendingMsg(true);
    setError(null);
    try {
      const res = await fetch('/api/care/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify({ connectionId: targetConn.id, text: msgText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not send message.');
        return;
      }
      setMsgText('');
      if (data.message) {
        setMessages(prev =>
          prev.some(m => m.id === data.message.id) ? prev : [...prev, data.message]
        );
      }
      await loadData();
    } finally {
      setSendingMsg(false);
    }
  };

  const filteredTherapists = therapists.filter(t => {
    const q = searchTherapist.trim().toLowerCase();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      (t.specialization || '').toLowerCase().includes(q) ||
      (t.district || '').toLowerCase().includes(q)
    );
  });

  const isSignedUser = Boolean(serverAuthToken && serverAuthUser?.role === 'user');
  const acceptedConns = connections.filter((c: any) => c.status === 'accepted');
  const activeGrant = grants.find(g => g.therapistId === permTherapistId && !g.revokedAt);
  const activeChatConn =
    acceptedConns.find((c: any) => c.id === chatConnectionId) || acceptedConns[0] || null;
  const activeChatMessages = activeChatConn
    ? messages.filter(m => m.connectionId === activeChatConn.id || m.therapistId === activeChatConn.therapistId)
    : [];
  const unreadTherapistMsgs = messages.filter(m => m.senderRole === 'therapist' && !m.readAt);

  useEffect(() => {
    if (activeSubTab !== 'messages' || !serverAuthToken || unreadTherapistMsgs.length === 0) return;
    unreadTherapistMsgs.forEach(m => {
      fetch(`/api/care/messages/${m.id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${serverAuthToken}` },
      }).catch(() => {});
    });
  }, [activeSubTab, serverAuthToken, unreadTherapistMsgs]);

  useEffect(() => {
    if (activeSubTab === 'messages') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSubTab, activeChatMessages.length]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-indigo-950 text-white rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
            <ShieldCheck className="w-4 h-4" />
            <span>Therapist Support · Simple &amp; Private</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Connect with a Therapist — On Your Terms
          </h1>
          <p className="text-sm text-indigo-100/90 max-w-2xl leading-relaxed">
            Pick a therapist or enter an invite code, flip switches for only what you want to share, and chat safely. Turn sharing off anytime in 1 tap.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold inline-flex items-center gap-1.5 self-start whitespace-nowrap cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {!isSignedUser && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
          <div className="font-extrabold flex items-center gap-1.5">
            <Lock className="w-4 h-4" />
            <span>Sign In Required for Live Therapist Collaboration</span>
          </div>
          <p>
            Guest mode keeps all records strictly on your device. You can browse administrator-verified therapists below or prepare a PDF in <strong>Get My Report</strong> without signing in. Sign in with an account to redeem invite codes or grant live permissions.
          </p>
          <button
            type="button"
            onClick={() => onSelectTab('report')}
            className="px-3.5 py-2 rounded-xl bg-indigo-950 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Open Get My Report (PDF Ready Offline)</span>
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
          {error}
        </div>
      )}
      {notice && (
        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 flex items-center justify-between gap-2">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="font-bold underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Simple 3-Step Guide */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
        <button
          type="button"
          onClick={() => setActiveSubTab('invitations')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 text-left cursor-pointer transition-colors"
        >
          <div className="font-extrabold text-indigo-900">Step 1 · Pick Therapist or Code</div>
          <div className="text-slate-600 mt-0.5">Choose someone you trust or type your clinic invite code.</div>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('permissions')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 text-left cursor-pointer transition-colors"
        >
          <div className="font-extrabold text-indigo-900">Step 2 · Privacy Switches</div>
          <div className="text-slate-600 mt-0.5">Tick only the boxes you want your therapist to view.</div>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('messages')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-300 text-left cursor-pointer transition-colors"
        >
          <div className="font-extrabold text-indigo-900">Step 3 · Chat &amp; Check-Ins</div>
          <div className="text-slate-600 mt-0.5">Send messages, prep visit questions, and view tasks.</div>
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold">
        {(
          [
            { id: 'permissions', label: 'Privacy Switches' },
            { id: 'invitations', label: `Pick Therapist or Code (${therapists.length})` },
            { id: 'assignments', label: `Tasks & Check-In (${assignments.length})` },
            { id: 'appointments', label: `Visit Prep (${appointments.length})` },
            {
              id: 'messages',
              label: `Therapist Chat (${messages.length}${unreadTherapistMsgs.length > 0 ? ` · ${unreadTherapistMsgs.length} new` : ''})`,
            },
          ] as const
        ).map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id)}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeSubTab === tab.id ? 'bg-indigo-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: MANAGE MY DATA SHARING */}
      {activeSubTab === 'permissions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={handleSavePermissions} className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 space-y-5">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Choose What Your Therapist Can See
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Unchecked sections stay private on your device. Your therapist will only see the sections you tick below.
              </p>
            </div>

            {acceptedConns.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                No active therapist connection yet. Open the <strong>Invitations &amp; Directory</strong> tab to redeem an invite code or request a verified therapist.
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Connected Therapist</label>
                <select
                  value={permTherapistId}
                  onChange={e => setPermTherapistId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                >
                  {acceptedConns.map((c: any) => (
                    <option key={c.id} value={c.therapistId}>
                      {c.therapistName} (Authorized {new Date(c.consentGrantedAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PERMISSION_CATEGORY_META.map(cat => {
                const checked = permCategories.includes(cat.id);
                return (
                  <label
                    key={cat.id}
                    className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition-all text-xs ${
                      checked ? 'bg-indigo-50/70 border-indigo-300' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategoryInList(cat.id, permCategories, setPermCategories)}
                      className="mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-slate-900">{cat.label}</div>
                      <div className="text-[11px] text-slate-500">{cat.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Access Duration</label>
                <select
                  value={accessType}
                  onChange={e => setAccessType(e.target.value as 'one_time' | 'continuing')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="continuing">Continuing until revoked or expired</option>
                  <option value="one_time">One-time / Single-visit access</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Optional Expiry Date</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowWeeklyUpdates}
                  onChange={e => setAllowWeeklyUpdates(e.target.checked)}
                />
                <span>Allow sharing structured weekly updates</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowSelectedActivities}
                  onChange={e => setAllowSelectedActivities(e.target.checked)}
                />
                <span>Allow receiving assigned self-support activities</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowBidirectionalFeedback}
                  onChange={e => setAllowBidirectionalFeedback(e.target.checked)}
                />
                <span>Allow bidirectional clinician response &amp; notes</span>
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="submit"
                disabled={!isSignedUser || !permTherapistId}
                className="px-5 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 disabled:opacity-50 text-white text-xs font-extrabold cursor-pointer"
              >
                Save Permissions
              </button>

              {activeGrant && (
                <button
                  type="button"
                  onClick={() => handleRevokeGrant(activeGrant.id)}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Revoke Future Access Now</span>
                </button>
              )}
            </div>
          </form>

          {/* Right: Live Preview + Permission Ledger */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-indigo-800" />
                <span>Live Preview: What Your Therapist Sees</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Enabled categories ({permCategories.length}/10):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {permCategories.map(c => (
                  <span
                    key={c}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-950 border border-indigo-200"
                  >
                    {PERMISSION_CATEGORY_META.find(m => m.id === c)?.label || c}
                  </span>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-950">
                <strong>Important Revocation Notice:</strong> Revoking stops all future therapist viewing immediately. Previously exported/printed PDF copies held offline by a clinician cannot be remotely deleted.
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-700" />
                <span>Recent Privacy Changes</span>
              </h3>
              {permHistory.length === 0 ? (
                <p className="text-xs text-slate-500">No privacy changes yet.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto text-xs">
                  {permHistory.map(h => (
                    <div key={h.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="font-bold text-slate-900 uppercase text-[10px]">
                        {h.action.replace(/_/g, ' ')}
                      </div>
                      <div className="text-slate-600">
                        Categories: {h.categories.join(', ') || 'None'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(h.revokedAt || h.authorizedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TWO-WAY INVITATIONS & DIRECTORY */}
      {activeSubTab === 'invitations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          {/* Redeem Workflow A Therapist Invite */}
          <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-600" />
              <span>Have a Therapist Code? Enter It Here</span>
            </h2>
            <p className="text-xs text-slate-600">
              If a therapist gave you an invite code, paste it below. You still pick exactly what they can see.
            </p>
            <form onSubmit={handleRedeemInvite} className="flex gap-2">
              <input
                type="text"
                value={inviteCodeInput}
                onChange={e => setInviteCodeInput(e.target.value)}
                placeholder="e.g., CP-9F3A-2B1C"
                required
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs uppercase font-mono-tabular"
              />
              <button
                type="submit"
                disabled={!isSignedUser}
                className="px-4 py-2 rounded-xl bg-indigo-950 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
              >
                Redeem &amp; Connect
              </button>
            </form>

            {/* Incoming/Outgoing Invitations List */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                Your Invitations ({invitations.length})
              </h3>
              {invitations.length === 0 ? (
                <p className="text-xs text-slate-500">No invitations yet.</p>
              ) : (
                invitations.map(inv => (
                  <div key={inv.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {inv.direction === 'therapist_to_client'
                          ? `${inv.senderName} (${inv.code})`
                          : `Request to ${inv.recipientName || inv.recipientContact}`}
                      </span>
                      <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-white border border-slate-200">
                        {inv.status}
                      </span>
                    </div>
                    <div className="text-slate-600">Purpose: {inv.purpose}</div>
                    {inv.status === 'pending' && inv.direction === 'therapist_to_client' && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleRespondInvitation(inv.id, 'accept')}
                          className="px-3 py-1.5 rounded-xl bg-indigo-950 text-white font-bold cursor-pointer"
                        >
                          Approve &amp; Connect
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespondInvitation(inv.id, 'reject')}
                          className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-800 font-bold cursor-pointer"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                    {inv.status === 'pending' && inv.direction === 'client_to_therapist' && (
                      <button
                        type="button"
                        onClick={() => handleCancelInvitation(inv.id)}
                        className="text-rose-700 font-bold underline cursor-pointer"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Search & Request Verified Therapist (Workflow B) */}
          <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-800" />
              <span>Choose an Approved Therapist</span>
            </h2>

            {directoryTotals && (
              <div className="grid grid-cols-3 gap-2.5 text-xs tabular-nums">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500">Registered Therapists</div>
                  <div className="text-base font-extrabold text-slate-900">{directoryTotals.totalRegistered}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500">Verified &amp; Approved</div>
                  <div className="text-base font-extrabold text-indigo-950">{directoryTotals.approvedCount}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-[10px] font-semibold text-emerald-800">Available Now</div>
                  <div className="text-base font-extrabold text-emerald-900">{directoryTotals.availableNowCount}</div>
                </div>
              </div>
            )}

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTherapist}
                onChange={e => setSearchTherapist(e.target.value)}
                placeholder="Search by name, district, or specialization..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
              />
            </div>

            <form onSubmit={handleSendTherapistRequest} className="space-y-3 text-xs">
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {filteredTherapists.length === 0 ? (
                  <p className="text-slate-500 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    No approved therapists found matching search.
                  </p>
                ) : (
                  filteredTherapists.map(t => {
                    const availStatus = t.availabilityStatus || 'offline';
                    const availLabel =
                      availStatus === 'available'
                        ? 'Available'
                        : availStatus === 'busy'
                        ? 'Busy / In Session'
                        : 'Offline';
                    const availStyle =
                      availStatus === 'available'
                        ? 'bg-emerald-100 text-emerald-900'
                        : availStatus === 'busy'
                        ? 'bg-amber-100 text-amber-950'
                        : 'bg-slate-200 text-slate-700';
                    const canWhatsapp = Boolean(
                      isSignedUser && t.phoneVerified && t.whatsappDigits && t.whatsappOptIn
                    );
                    const isConsentOpen = openWhatsappId === t.id;
                    const hasConsented = Boolean(whatsappConsentMap[t.id]);
                    const waUrl = t.whatsappDigits
                      ? `https://wa.me/${t.whatsappDigits}?text=${encodeURIComponent(
                          `Hello ${t.name}, I found your verified ClearPath AI clinician profile and would like to coordinate a non-urgent recovery check-in.`
                        )}`
                      : null;

                    return (
                      <div
                        key={t.id}
                        className={`p-3 rounded-2xl border transition-all space-y-2 ${
                          selectedTherapistId === t.id
                            ? 'bg-indigo-50 border-indigo-400'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <label className="flex items-start gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="therapistDirSelect"
                            checked={selectedTherapistId === t.id}
                            onChange={() => setSelectedTherapistId(t.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-bold text-slate-900">{t.name}</span>
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${availStyle}`}>
                                  {availLabel}
                                </span>
                                {t.phoneVerified && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-950">
                                    Phone Verified
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-[11px] text-slate-600">
                              {t.specialization} · {t.district || 'Kerala'} · Lic: {t.licenseNumber}
                            </div>
                            {(t.availabilityHours || t.nextAvailableSlot) && (
                              <div className="text-[11px] text-slate-500">
                                {t.availabilityHours ? `Hours: ${t.availabilityHours}` : ''}
                                {t.availabilityHours && t.nextAvailableSlot ? ' · ' : ''}
                                {t.nextAvailableSlot ? `Next slot: ${t.nextAvailableSlot}` : ''}
                              </div>
                            )}
                          </div>
                        </label>

                        {isSignedUser && (
                          <div className="pl-5 flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              disabled={connectingChatTherapistId === t.id}
                              onClick={() => handleConnectLiveChat(t.id)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 disabled:opacity-60 text-white text-[11px] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <MessageSquare className="w-3 h-3 text-amber-300" />
                              <span>
                                {connectingChatTherapistId === t.id
                                  ? 'Connecting...'
                                  : acceptedConns.some((c: any) => c.therapistId === t.id)
                                  ? 'Open Clinician Chat'
                                  : 'Connect & Start Chat'}
                              </span>
                            </button>
                          </div>
                        )}

                        {canWhatsapp && waUrl && (
                          <div className="pt-1.5 border-t border-slate-200/80 pl-5 space-y-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenWhatsappId(prev => (prev === t.id ? null : t.id))
                              }
                              className="text-[11px] font-bold text-emerald-800 hover:underline cursor-pointer"
                            >
                              {isConsentOpen
                                ? 'Hide WhatsApp Click-to-Chat'
                                : 'Optional: Open WhatsApp Click-to-Chat'}
                            </button>

                            {isConsentOpen && (
                              <div className="p-2.5 rounded-xl bg-white border border-emerald-200 space-y-2 text-[11px]">
                                <p className="text-slate-700 leading-relaxed">
                                  <strong>External App Notice:</strong> Opening WhatsApp launches an external messaging app. Chats sent in WhatsApp do <strong>not</strong> sync back to ClearPath AI. Never use WhatsApp for crisis emergencies (call 112 / 14405).
                                </p>
                                <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={hasConsented}
                                    onChange={e =>
                                      setWhatsappConsentMap(prev => ({
                                        ...prev,
                                        [t.id]: e.target.checked,
                                      }))
                                    }
                                  />
                                  <span>I understand and consent to opening WhatsApp externally</span>
                                </label>
                                {hasConsented && (
                                  <a
                                    href={waUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                                  >
                                    <span>Launch WhatsApp ({t.contactPhone})</span>
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <input
                type="text"
                value={requestPurpose}
                onChange={e => setRequestPurpose(e.target.value)}
                placeholder="Reason or goal for connecting..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
              />
              <button
                type="submit"
                disabled={!isSignedUser || !selectedTherapistId}
                className="w-full py-2.5 rounded-xl bg-indigo-950 disabled:opacity-50 text-white font-extrabold cursor-pointer"
              >
                Send Connection Request
              </button>
            </form>
          </section>
        </div>
      )}

      {/* TAB 3: ASSIGNMENTS & WEEKLY UPDATES */}
      {activeSubTab === 'assignments' && (
        <div className="space-y-6">
          <CarePlanProposalPanel
            mode="user"
            serverAuthToken={serverAuthToken}
            proposals={carePlanProposals}
            onUpdated={async () => {
              await refreshClientAssignments();
              await loadData();
            }}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-indigo-800" />
              <span>Clinician-Assigned Activities</span>
            </h2>
            {assignments.length === 0 ? (
              <p className="text-xs text-slate-500">No clinician assignments yet.</p>
            ) : (
              assignments.map(a => (
                <div key={a.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">{a.title}</span>
                    <span className="capitalize px-2 py-0.5 rounded bg-white border border-slate-200 font-bold">
                      {a.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {a.purpose && <div className="text-indigo-900 font-semibold">Purpose: {a.purpose}</div>}
                  <p className="text-slate-700">{a.instructions}</p>
                  {a.therapistFeedback && (
                    <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950">
                      <strong>Therapist Feedback:</strong> {a.therapistFeedback}
                    </div>
                  )}
                  <input
                    type="text"
                    value={reflectionDrafts[a.id] ?? a.clientReflection ?? ''}
                    onChange={e => setReflectionDrafts(p => ({ ...p, [a.id]: e.target.value }))}
                    placeholder="Optional reflection for your clinician..."
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleClientUpdateAssignment(a.id, 'completed')}
                      className="px-3 py-1.5 rounded-xl bg-indigo-950 text-white font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Completed</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClientUpdateAssignment(a.id, 'not_completed')}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold cursor-pointer"
                    >
                      Not Completed (Share Why)
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-extrabold text-slate-900">
              Send a Short Weekly Check-In
            </h2>
            <form onSubmit={handleSubmitWeeklyProgress} className="space-y-3 text-xs">
              <input
                type="text"
                value={wpActivities}
                onChange={e => setWpActivities(e.target.value)}
                placeholder="Things you tried this week (e.g. evening walk, sleep routine)..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
              />
              <textarea
                rows={4}
                value={wpWhatHelped}
                onChange={e => setWpWhatHelped(e.target.value)}
                placeholder="Write a few sentences or a paragraph about what helped most this week..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 leading-relaxed"
              />
              <textarea
                rows={4}
                value={wpDifficulties}
                onChange={e => setWpDifficulties(e.target.value)}
                placeholder="Any tough moments or stress you want to talk through..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 leading-relaxed"
              />
              <input
                type="text"
                value={wpQuestions}
                onChange={e => setWpQuestions(e.target.value)}
                placeholder="Questions to discuss at your next visit..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
              />
              <button
                type="submit"
                disabled={!isSignedUser || acceptedConns.length === 0}
                className="px-4 py-2.5 rounded-xl bg-indigo-950 disabled:opacity-50 text-white font-bold cursor-pointer"
              >
                Send Weekly Update
              </button>
            </form>

            {weeklyProgress.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                {weeklyProgress.slice(0, 3).map(wp => (
                  <div key={wp.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="font-bold">Week of {wp.weekStarting}</div>
                    {wp.therapistResponse && (
                      <div className="mt-1 text-indigo-900 font-semibold">
                        Therapist Note: {wp.therapistResponse}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
          </div>
        </div>
      )}

      {/* TAB 4: STRUCTURED APPOINTMENT PREP */}
      {activeSubTab === 'appointments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <form onSubmit={handleSaveAppointmentPrep} className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 text-xs">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-800" />
              <span>Prepare Topics &amp; Questions for Upcoming Session</span>
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={apptPrepDate}
                onChange={e => setApptPrepDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
              />
              <input
                type="time"
                value={apptPrepTime}
                onChange={e => setApptPrepTime(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>
            <input
              type="text"
              value={apptPrepTopics}
              onChange={e => setApptPrepTopics(e.target.value)}
              placeholder="Topics to discuss (comma-separated, e.g., Sleep schedule, Evening urges)"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
            />
            <textarea
              rows={3}
              value={apptPrepQuestions}
              onChange={e => setApptPrepQuestions(e.target.value)}
              placeholder="Questions for your therapist (one per line)..."
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
            />
            <button
              type="submit"
              disabled={!isSignedUser || acceptedConns.length === 0}
              className="px-4 py-2.5 rounded-xl bg-indigo-950 disabled:opacity-50 text-white font-bold cursor-pointer"
            >
              Save Appointment Agenda
            </button>
          </form>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 text-xs">
            <h2 className="text-base font-extrabold text-slate-900">Appointment History &amp; Agreed Next Steps</h2>
            {appointments.length === 0 ? (
              <p className="text-slate-500">No shared session agendas or clinician follow-up notes yet.</p>
            ) : (
              appointments.map(a => (
                <div key={a.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-900">
                    {a.appointmentDate} {a.appointmentTime || ''} · {a.therapistName}
                  </div>
                  {a.topicsToDiscuss?.length ? (
                    <div><strong>Topics:</strong> {a.topicsToDiscuss.join(', ')}</div>
                  ) : null}
                  {a.clientQuestions?.length ? (
                    <div><strong>Your Questions:</strong> {a.clientQuestions.join(' | ')}</div>
                  ) : null}
                  {a.noteText && <div><strong>Clinician Note:</strong> {a.noteText}</div>}
                  {a.agreedNextSteps && (
                    <div className="text-indigo-900 font-semibold">
                      <strong>Agreed Next Steps:</strong> {a.agreedNextSteps}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: REAL-TIME CONVERSATIONAL CLINICIAN CHAT */}
      {activeSubTab === 'messages' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-800" />
                  <span>Direct Clinician Conversation Chat</span>
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold ${
                    realtimeStatus === 'connected'
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  <Radio className="w-3 h-3" />
                  <span>{realtimeStatus === 'connected' ? 'Live Chat Ready' : 'Connecting...'}</span>
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">
                Messages arrive right away between your account and your connected therapist.
              </p>
            </div>

            {acceptedConns.length > 0 && (
              <select
                value={activeChatConn?.id || ''}
                onChange={e => setChatConnectionId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
              >
                {acceptedConns.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.therapistName}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-950 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Clinical Safety Notice:</strong> Use this chat for recovery check-ins, plan feedback, and non-urgent clinician support. For urgent crisis emergencies, call <strong>112</strong> or Kerala Vimukthi <strong>14405</strong> right away.
            </span>
          </div>

          {!isSignedUser ? (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              Sign in with your ClearPath account to connect with a verified therapist and exchange live messages.
            </div>
          ) : acceptedConns.length === 0 ? (
            <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3 text-xs">
              <div className="font-extrabold text-indigo-950">
                Start Conversational Chat with a Verified Therapist
              </div>
              {therapists.length === 0 ? (
                <p className="text-slate-600">
                  No verified therapists are approved in the directory yet. Once a clinician signs in with their verification credentials, they will appear here automatically in real time.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {therapists.map(t => (
                      <div
                        key={t.id}
                        className={`p-3 rounded-xl border bg-white flex flex-col justify-between gap-2 ${
                          selectedTherapistId === t.id ? 'border-indigo-500 ring-1 ring-indigo-300' : 'border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-900">{t.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {t.specialization} · {t.district || 'Kerala'}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={!chatConsentChecked || connectingChatTherapistId === t.id}
                          onClick={() => handleConnectLiveChat(t.id)}
                          className="px-3 py-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 disabled:opacity-50 text-white font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-amber-300" />
                          <span>
                            {connectingChatTherapistId === t.id ? 'Connecting...' : 'Connect & Start Chat'}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                  <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={chatConsentChecked}
                      onChange={e => setChatConsentChecked(e.target.checked)}
                    />
                    <span>I consent to sharing selected support data &amp; live chat with my chosen therapist (revocable anytime)</span>
                  </label>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="h-80 overflow-y-auto space-y-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                {activeChatMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 text-center">
                    Say hello to {activeChatConn?.therapistName} to start your live care conversation.
                  </div>
                ) : (
                  activeChatMessages.map(m => {
                    const isSelf = m.senderRole === 'user';
                    const isInfoRequest = m.messageType === 'info_request';
                    return (
                      <div
                        key={m.id}
                        className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] p-3.5 rounded-2xl space-y-2 text-sm ${
                            isSelf
                              ? 'bg-indigo-950 text-white rounded-br-sm'
                              : isInfoRequest
                              ? 'bg-amber-50 border-2 border-amber-300 text-slate-900 rounded-bl-sm'
                              : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm'
                          }`}
                        >
                          <div className={`text-xs font-bold flex items-center justify-between gap-3 ${isSelf ? 'text-indigo-200' : 'text-slate-600'}`}>
                            <span>
                              {m.senderName}
                              {isInfoRequest ? ' · Requested Info or Report Update' : ''}
                            </span>
                            <span className="tabular-nums">
                              {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
                          {isInfoRequest && !isSelf && (
                            <div className="pt-2 border-t border-amber-200 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (Array.isArray(m.requestedCategories) && m.requestedCategories.length > 0) {
                                    setPermCategories(prev =>
                                      Array.from(new Set([...prev, ...m.requestedCategories!]))
                                    );
                                  }
                                  setActiveSubTab('permissions');
                                }}
                                className="px-3 py-1.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
                              >
                                Update My Sharing Permissions
                              </button>
                              <button
                                type="button"
                                onClick={() => onSelectTab('report')}
                                className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-950 text-xs font-bold whitespace-nowrap cursor-pointer"
                              >
                                Send Updated Report
                              </button>
                            </div>
                          )}
                          {isSelf && m.readAt && (
                            <div className="text-xs text-emerald-300 flex items-center justify-end gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Seen</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={msgText}
                  onChange={e => setMsgText(e.target.value)}
                  placeholder={`Message ${activeChatConn?.therapistName || 'your therapist'}...`}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <button
                  type="submit"
                  disabled={sendingMsg || !msgText.trim()}
                  className="px-4 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingMsg ? 'Sending...' : 'Send'}</span>
                </button>
              </form>
            </>
          )}
        </section>
      )}
    </div>
  );
};
