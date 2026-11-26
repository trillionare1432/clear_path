import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { useApp } from '../context/AppContext';
import { GUIDED_TOOLS } from '../constants/initialData';
import {
  SCOPED_STORAGE_KEYS,
  readScopedJson,
  writeScopedJson,
} from '../utils/vaultStorage';
import {
  SharedReportRecordClient,
  TherapistConnectionRecord,
  TherapistDirectoryEntry,
} from '../types';
import {
  FileText,
  Download,
  Printer,
  Share2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Plus,
  Trash2,
  XCircle,
  Eye,
  Lock,
  RefreshCw,
} from 'lucide-react';

type SourceAttribution = 'user' | 'validated_screening' | 'clinician' | 'ai_draft';

type ReportSectionId =
  | 'onboarding'
  | 'substances'
  | 'screening'
  | 'pathways'
  | 'support_plan'
  | 'cbt'
  | 'goals'
  | 'reflections'
  | 'calendar'
  | 'assignments'
  | 'appointments'
  | 'questions';

const SOURCE_LABELS: Record<SourceAttribution, { label: string; style: string }> = {
  user: { label: 'User-Entered', style: 'bg-slate-200 text-slate-800' },
  validated_screening: { label: 'Validated Screening (CRAFFT 2.1)', style: 'bg-indigo-100 text-indigo-900' },
  clinician: { label: 'Clinician-Entered', style: 'bg-emerald-100 text-emerald-900' },
  ai_draft: { label: 'AI Draft Summary', style: 'bg-amber-100 text-amber-900' },
};

const SECTION_LABELS: { id: ReportSectionId; label: string; desc: string; source: SourceAttribution }[] = [
  { id: 'onboarding', label: 'Personal Context & Reason for Support', desc: 'Stated goals, age bracket, care status', source: 'user' },
  { id: 'substances', label: 'Substance & Medication Context', desc: 'Selected substances, prescription status & clinician review notes', source: 'user' },
  { id: 'screening', label: 'Screening & Self-Check Summary', desc: 'Understand My Situation responses & domain notice', source: 'validated_screening' },
  { id: 'pathways', label: 'Selected Support Pathways', desc: 'Your chosen coping & intervention preferences', source: 'user' },
  { id: 'support_plan', label: 'Personalized Support Plan', desc: 'Structured objectives, approaches & next review date', source: 'user' },
  { id: 'cbt', label: 'Saved CBT-Inspired Reflections', desc: 'Structured worksheet answers (explicitly opted-in only)', source: 'user' },
  { id: 'goals', label: 'Personal Goals & Milestones', desc: 'Rebuild My Life goals and active steps', source: 'user' },
  { id: 'reflections', label: 'Weekly Reflections & Check-ins', desc: 'Selected progress summaries (never auto-includes raw daily diary)', source: 'user' },
  { id: 'calendar', label: 'Recovery-Support Calendar', desc: 'Scheduled supportive activities & appointments', source: 'user' },
  { id: 'assignments', label: 'Therapist-Assigned Activities', desc: 'Completion status of clinician assignments', source: 'clinician' },
  { id: 'appointments', label: 'Appointment History & Care Notes', desc: 'Recorded appointments & clinician notes', source: 'clinician' },
  { id: 'questions', label: 'Questions to Discuss with Clinician', desc: 'Your prepared appointment discussion list', source: 'user' },
];

export const GetMyReportView: React.FC = () => {
  const {
    vaultScope,
    userProfile,
    personalOnboarding,
    substanceConcerns,
    personalizedSupportPlan,
    earlyAssessments,
    toolCompletions,
    goals,
    calendarEvents,
    dailyLogs,
    clientAssignments,
    refreshClientAssignments,
    serverAuthToken,
    serverAuthUser,
  } = useApp();

  const savedSettings = readScopedJson<{
    selectedSections?: ReportSectionId[];
    dateFrom?: string;
    dateTo?: string;
    identityMode?: 'name' | 'anonymous';
    clinicianQuestions?: string[];
  }>(vaultScope, SCOPED_STORAGE_KEYS.REPORT_SETTINGS, {});

  const [selectedSections, setSelectedSections] = useState<ReportSectionId[]>(
    savedSettings.selectedSections || [
      'onboarding',
      'substances',
      'screening',
      'pathways',
      'support_plan',
      'cbt',
      'goals',
      'questions',
    ]
  );
  const [dateFrom, setDateFrom] = useState(
    savedSettings.dateFrom || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  );
  const [dateTo, setDateTo] = useState(
    savedSettings.dateTo || new Date().toISOString().split('T')[0]
  );
  const [identityMode, setIdentityMode] = useState<'name' | 'anonymous'>(
    savedSettings.identityMode || 'name'
  );
  const [clinicianQuestions, setClinicianQuestions] = useState<string[]>(
    savedSettings.clinicianQuestions || []
  );
  const [newQuestion, setNewQuestion] = useState('');

  // Optional AI Intro Note
  const [aiDraftSummary, setAiDraftSummary] = useState<string | null>(null);
  const [aiDraftLoading, setAiDraftLoading] = useState(false);

  // Therapist sharing workflow
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [therapists, setTherapists] = useState<TherapistDirectoryEntry[]>([]);
  const [selectedTherapistId, setSelectedTherapistId] = useState('');
  const [connections, setConnections] = useState<TherapistConnectionRecord[]>([]);
  const [sharedReports, setSharedReports] = useState<SharedReportRecordClient[]>([]);
  const [shareConsentChecked, setShareConsentChecked] = useState(false);
  const [shareStatusMsg, setShareStatusMsg] = useState<string | null>(null);
  const [shareErrorMsg, setShareErrorMsg] = useState<string | null>(null);
  const [sharingBusy, setSharingBusy] = useState(false);

  // Persist user's report customization choices
  useEffect(() => {
    writeScopedJson(vaultScope, SCOPED_STORAGE_KEYS.REPORT_SETTINGS, {
      selectedSections,
      dateFrom,
      dateTo,
      identityMode,
      clinicianQuestions,
    });
  }, [vaultScope, selectedSections, dateFrom, dateTo, identityMode, clinicianQuestions]);

  const loadSharingState = useCallback(async () => {
    try {
      const dirRes = await fetch('/api/therapists/directory');
      if (dirRes.ok) {
        const dirData = await dirRes.json();
        setTherapists(dirData.therapists || []);
        if (dirData.therapists?.length > 0 && !selectedTherapistId) {
          setSelectedTherapistId(dirData.therapists[0].id);
        }
      }
      if (serverAuthToken && serverAuthUser?.role === 'user') {
        const [connRes, repRes] = await Promise.all([
          fetch('/api/therapist/connections', { headers: { Authorization: `Bearer ${serverAuthToken}` } }),
          fetch('/api/reports/mine', { headers: { Authorization: `Bearer ${serverAuthToken}` } }),
        ]);
        if (connRes.ok) {
          const cData = await connRes.json();
          setConnections(cData.connections || []);
        }
        if (repRes.ok) {
          const rData = await repRes.json();
          setSharedReports(rData.reports || []);
        }
      }
    } catch {
      // ignore offline
    }
  }, [serverAuthToken, serverAuthUser, selectedTherapistId]);

  useEffect(() => {
    loadSharingState();
    refreshClientAssignments();
  }, [loadSharingState, refreshClientAssignments]);

  const toggleSection = (id: ReportSectionId) => {
    setSelectedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const inRange = useCallback(
    (dateStr?: string) => {
      if (!dateStr) return true;
      const d = dateStr.slice(0, 10);
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
      return true;
    },
    [dateFrom, dateTo]
  );

  // Compile strictly factual, non-fabricated report object
  const compiledReport = useMemo(() => {
    const generatedAt = new Date().toISOString();
    const ident =
      identityMode === 'anonymous'
        ? 'Anonymous Self-Advocate (Identifiable details withheld)'
        : userProfile
        ? `${userProfile.name} (@${userProfile.username})`
        : 'Guest ClearPath User';

    const latestAssessment = earlyAssessments.find(a => inRange(a.date)) || earlyAssessments[0] || null;

    const clinicalCareNotes = readScopedJson<string[]>(
      vaultScope,
      SCOPED_STORAGE_KEYS.CLINICAL_CARE_NOTES,
      []
    );

    const shareFlags = readScopedJson<Record<string, boolean>>(
      vaultScope,
      SCOPED_STORAGE_KEYS.TOOL_SHARE_FLAGS,
      {}
    );

    const cbtItems = Object.entries(toolCompletions)
      .filter(([toolId, entry]) => inRange(entry.completedAt) && (shareFlags[toolId] ?? true))
      .map(([toolId, entry]) => {
        const meta = GUIDED_TOOLS.find(g => g.id === toolId);
        return {
          title: meta?.title || toolId,
          completedAt: entry.completedAt.slice(0, 10),
          notesCount: Object.values(entry.responses || {}).filter(Boolean).length,
          summary: Object.values(entry.responses || {})
            .filter(Boolean)
            .slice(0, 3)
            .join(' | '),
        };
      });

    const filteredGoals = goals.filter(g => inRange(g.createdAt));
    const filteredEvents = calendarEvents.filter(ev => inRange(ev.date));
    const filteredLogs = dailyLogs.filter(l => inRange(l.date));
    const appointments = filteredEvents.filter(ev => ev.category === 'appointment');

    return {
      title: 'ClearPath AI — Personal Support & Care Preparation Report',
      generatedAt,
      dateRange: { from: dateFrom, to: dateTo },
      identification: ident,
      nonDiagnosticStatement:
        'IMPORTANT: This is a user-generated support summary intended to help organize background information for a qualified clinician. It is NOT a medical diagnosis, risk score, or prescription.',
      sections: {
        substances: selectedSections.includes('substances')
          ? substanceConcerns.length > 0
            ? substanceConcerns.map(c => ({
                name: c.name,
                category: c.parentCategory || 'General',
                verificationStatus: c.verificationStatus,
                customOriginalText: c.customOriginalText || undefined,
                isMedication: c.isMedication,
                prescriptionContext: c.isMedication
                  ? c.prescriptionDetails || { note: 'Prescription context not answered yet' }
                  : undefined,
                clinicianReviewNote: c.clinicianReviewNote
                  ? `${c.clinicianReviewNote} (${c.reviewedByTherapistName || 'Clinician'})`
                  : undefined,
              }))
            : '[No substance or medication concerns recorded]'
          : '[Not included by user]',
        onboarding: selectedSections.includes('onboarding')
          ? {
              reasonForSeekingSupport:
                personalOnboarding?.primaryNeed || '[Not answered]',
              ownWordsContext:
                personalOnboarding?.otherReasonText || '[Not provided]',
              ageRange: personalOnboarding?.ageRange || '[Not answered]',
              currentlyInProfessionalCare:
                personalOnboarding?.currentlyInProfessionalCare || '[Not answered]',
              hasTherapistAccess:
                personalOnboarding?.hasTherapistAccess || '[Not answered]',
            }
          : '[Not included by user]',
        screening: selectedSections.includes('screening')
          ? latestAssessment
            ? {
                instrumentNotice:
                  latestAssessment.instrumentNotice ||
                  'ClearPath Supplementary Situation Context & Screening Guide',
                date: latestAssessment.date,
                mode: latestAssessment.mode || 'quick',
                statedFocusAreas:
                  latestAssessment.focusAreas.length > 0
                    ? latestAssessment.focusAreas
                    : ['[Not answered]'],
                responses:
                  latestAssessment.flexibleResponses?.map(r => ({
                    question: r.questionText,
                    kind: r.questionKind,
                    answer:
                      r.responseMode === 'other'
                        ? `Other: ${r.otherText || '[Blank]'}`
                        : r.responseMode === 'unsure'
                        ? "I'm not sure"
                        : r.responseMode === 'prefer_not_to_answer'
                        ? 'I prefer not to answer'
                        : r.optionLabel || '[Not answered]',
                  })) || [],
                aiReviewNotes: latestAssessment.aiContextSummary?.summaryBullets || [],
              }
            : '[No completed screening in selected period]'
          : '[Not included by user]',
        pathways: selectedSections.includes('pathways')
          ? {
              preferredMethods:
                personalOnboarding?.preferredSupportMethods?.length
                  ? personalOnboarding.preferredSupportMethods
                  : personalOnboarding?.assistanceTypes?.length
                  ? personalOnboarding.assistanceTypes
                  : ['[Not answered]'],
            }
          : '[Not included by user]',
        support_plan: selectedSections.includes('support_plan')
          ? personalizedSupportPlan
            ? {
                selectedPaths: personalizedSupportPlan.selectedPaths,
                objectives: personalizedSupportPlan.objectives,
                approaches: personalizedSupportPlan.approaches,
                professionalGuidance: personalizedSupportPlan.professionalGuidance || '[Not set]',
                supporterInvolvement: personalizedSupportPlan.supporterInvolvement || '[Not set]',
                nextSteps: personalizedSupportPlan.nextSteps,
                reviewDate: personalizedSupportPlan.reviewDate,
              }
            : '[No personalized support plan saved yet]'
          : '[Not included by user]',
        cbt: selectedSections.includes('cbt')
          ? cbtItems.length > 0
            ? cbtItems
            : '[No saved CBT reflections marked for report]'
          : '[Not included by user]',
        goals: selectedSections.includes('goals')
          ? filteredGoals.length > 0
            ? filteredGoals.map(g => ({
                title: g.title,
                category: g.category,
                completed: g.completed,
                milestonesDone: `${g.milestones.filter(m => m.completed).length}/${g.milestones.length}`,
              }))
            : '[No personal goals recorded in range]'
          : '[Not included by user]',
        reflections: selectedSections.includes('reflections')
          ? {
              checkInsCount: filteredLogs.length,
              summaryNote:
                filteredLogs.length > 0
                  ? `${filteredLogs.length} structured check-ins recorded between ${dateFrom} and ${dateTo} (private free-text diary omitted by default).`
                  : '[No check-ins recorded in selected range]',
            }
          : '[Not included by user]',
        calendar: selectedSections.includes('calendar')
          ? filteredEvents.length > 0
            ? filteredEvents.map(ev => `${ev.date}: ${ev.title} (${ev.completed ? 'Done' : 'Planned'})`)
            : '[No calendar events in range]'
          : '[Not included by user]',
        assignments: selectedSections.includes('assignments')
          ? clientAssignments.length > 0
            ? clientAssignments.map(a => ({
                title: a.title,
                type: a.type,
                status: a.status,
                dueDate: a.dueDate || '[No due date]',
              }))
            : '[No therapist-assigned activities]'
          : '[Not included by user]',
        appointments: selectedSections.includes('appointments')
          ? {
              scheduledAppointments:
                appointments.length > 0
                  ? appointments.map(a => `${a.date} ${a.startTime || ''}: ${a.title}`)
                  : ['[None recorded]'],
              clinicianNotes:
                clinicalCareNotes.length > 0 ? clinicalCareNotes : ['[None recorded]'],
            }
          : '[Not included by user]',
        questions: selectedSections.includes('questions')
          ? clinicianQuestions.length > 0
            ? clinicianQuestions
            : ['[No clinician questions added yet]']
          : '[Not included by user]',
      },
    };
  }, [
    identityMode,
    userProfile,
    substanceConcerns,
    personalizedSupportPlan,
    earlyAssessments,
    inRange,
    vaultScope,
    toolCompletions,
    goals,
    calendarEvents,
    dailyLogs,
    dateFrom,
    dateTo,
    selectedSections,
    personalOnboarding,
    clientAssignments,
    clinicianQuestions,
  ]);

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;
    setClinicianQuestions(prev => [...prev, newQuestion.trim()]);
    setNewQuestion('');
  };

  const handleGenerateAiSummary = async () => {
    setAiDraftLoading(true);
    try {
      const res = await fetch('/api/ai/report-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          includedSections: selectedSections,
          provided: compiledReport.sections,
        }),
      });
      const data = await res.json();
      setAiDraftSummary(data.executiveSummary || null);
    } catch {
      setAiDraftSummary('Could not reach AI draft helper; all selected report sections remain accurate below.');
    } finally {
      setAiDraftLoading(false);
    }
  };

  // Real binary PDF download via jspdf
  const handleDownloadPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 44;
    const maxWidth = pageWidth - margin * 2;
    let y = 52;

    const ensureSpace = (needed = 24) => {
      if (y + needed > doc.internal.pageSize.getHeight() - 48) {
        doc.addPage();
        y = 48;
      }
    };

    const writeWrapped = (text: string, fontSize = 10, bold = false, color: [number, number, number] = [30, 41, 59]) => {
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

    writeWrapped(compiledReport.title, 15, true, [30, 27, 75]);
    writeWrapped(
      `Generated: ${new Date(compiledReport.generatedAt).toLocaleString()}   |   Period: ${dateFrom} to ${dateTo}`,
      9,
      false,
      [71, 85, 105]
    );
    writeWrapped(`Identification: ${compiledReport.identification}`, 10, true, [15, 23, 42]);
    y += 6;
    writeWrapped(compiledReport.nonDiagnosticStatement, 9, true, [180, 83, 9]);
    y += 10;

    if (aiDraftSummary) {
      writeWrapped('Optional Introduction Note (User-Reviewed):', 11, true, [30, 27, 75]);
      writeWrapped(aiDraftSummary, 10);
      y += 8;
    }

    SECTION_LABELS.forEach(({ id, label, source }) => {
      if (!selectedSections.includes(id)) return;
      ensureSpace(40);
      writeWrapped(`${label.toUpperCase()}  [${SOURCE_LABELS[source].label}]`, 11, true, [30, 27, 75]);
      const data = compiledReport.sections[id];
      const text =
        typeof data === 'string'
          ? data
          : JSON.stringify(data, null, 2)
              .replace(/[{}\[\]"]/g, '')
              .replace(/,\n/g, '\n')
              .trim();
      writeWrapped(text || '[Not answered]', 9.5);
      y += 8;
    });

    const filename = `clearpath_support_report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  const selectedConnection = connections.find(c => c.therapistId === selectedTherapistId);

  const handleSendInvitation = async () => {
    if (!serverAuthToken || !selectedTherapistId) return;
    setShareErrorMsg(null);
    setShareStatusMsg(null);
    setSharingBusy(true);
    try {
      const res = await fetch('/api/therapist/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify({
          therapistId: selectedTherapistId,
          consentGranted: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setShareErrorMsg(data.error || 'Could not send invitation.');
      } else {
        setShareStatusMsg('Connection invitation sent. Once the therapist accepts, you can share your selected report.');
        loadSharingState();
      }
    } finally {
      setSharingBusy(false);
    }
  };

  const handleShareReport = async () => {
    if (!serverAuthToken || !selectedTherapistId || !shareConsentChecked) return;
    setShareErrorMsg(null);
    setShareStatusMsg(null);
    setSharingBusy(true);
    try {
      const includedPayload: Record<string, unknown> = {};
      const sourceManifest: Record<string, { source: SourceAttribution; recordedAt: string }> = {};
      const recordedAt = new Date().toISOString();
      selectedSections.forEach(s => {
        includedPayload[s] = compiledReport.sections[s];
        const meta = SECTION_LABELS.find(lbl => lbl.id === s);
        sourceManifest[s] = {
          source: meta?.source || 'user',
          recordedAt,
        };
      });
      if (aiDraftSummary) {
        includedPayload.aiDraftSummary = aiDraftSummary;
        sourceManifest.aiDraftSummary = { source: 'ai_draft', recordedAt };
      }

      const res = await fetch('/api/reports/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify({
          therapistId: selectedTherapistId,
          consentConfirmed: true,
          title: `Support Summary (${dateFrom} to ${dateTo})`,
          dateRange: { from: dateFrom, to: dateTo },
          sectionsIncluded: selectedSections,
          sourceManifest,
          payload: includedPayload,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setShareErrorMsg(data.error || 'Unable to share report.');
      } else {
        setShareStatusMsg(`Report v${data.report?.version || 1} securely delivered to your authorized therapist.`);
        setShareConsentChecked(false);
        loadSharingState();
      }
    } finally {
      setSharingBusy(false);
    }
  };

  const handleRevokeReport = async (reportId: string) => {
    if (!serverAuthToken) return;
    const res = await fetch(`/api/reports/${reportId}/revoke`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${serverAuthToken}` },
    });
    if (res.ok) {
      setShareStatusMsg('Report access revoked immediately.');
      loadSharingState();
    }
  };

  const handleRevokeConnection = async (connId: string) => {
    if (!serverAuthToken) return;
    const res = await fetch(`/api/therapist/connections/${connId}/revoke`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${serverAuthToken}` },
    });
    if (res.ok) {
      setShareStatusMsg('Therapist connection and all associated shared reports revoked.');
      loadSharingState();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-indigo-950 text-white rounded-3xl p-6 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
            <FileText className="w-4 h-4" />
            <span>GET MY REPORT · Care Preparation Summary</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Prepare &amp; Control Your Support Report
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100/85 max-w-2xl">
            Stop repeating your story from scratch. Choose exact sections, download a clean PDF, or share with an administrator-verified therapist only after explicit approval.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button
            type="button"
            onClick={() => {
              loadSharingState();
              setIsShareModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-white text-indigo-950 hover:bg-indigo-50 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Share with My Therapist</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Controls */}
        <aside className="lg:col-span-5 space-y-5 print:hidden">
          <section className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900">1. Date Range &amp; Identification</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Identification Header
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIdentityMode('name')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer ${
                    identityMode === 'name'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-950'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Use My Name
                </button>
                <button
                  type="button"
                  onClick={() => setIdentityMode('anonymous')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border cursor-pointer ${
                    identityMode === 'anonymous'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-950'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  Anonymous Label
                </button>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900">2. Select Report Sections</h2>
              <span className="text-[11px] font-bold text-indigo-800">
                {selectedSections.length}/{SECTION_LABELS.length} selected
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Private AI conversations are never included automatically. Unchecked sections remain excluded.
            </p>
            <div className="space-y-2">
              {SECTION_LABELS.map(sec => {
                const checked = selectedSections.includes(sec.id);
                return (
                  <label
                    key={sec.id}
                    className={`flex items-start gap-2.5 p-3 rounded-2xl border cursor-pointer transition-colors ${
                      checked
                        ? 'bg-indigo-50/70 border-indigo-200'
                        : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSection(sec.id)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900">{sec.label}</div>
                      <div className="text-[11px] text-slate-500">{sec.desc}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>

          {/* Questions for Therapist Editor */}
          <section className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3">
            <h2 className="text-sm font-extrabold text-slate-900">3. Questions for Your Clinician</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={newQuestion}
                onChange={e => setNewQuestion(e.target.value)}
                placeholder="e.g., What options suit evening anxiety?"
                className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
              />
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-3 py-2 rounded-xl bg-indigo-950 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
            {clinicianQuestions.length > 0 && (
              <ul className="space-y-1.5">
                {clinicianQuestions.map((q, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2"
                  >
                    <span>{q}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setClinicianQuestions(prev => prev.filter((_, i) => i !== idx))
                      }
                      className="text-rose-700 hover:text-rose-900 cursor-pointer"
                      aria-label="Remove question"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>

        {/* Right Column: Live Accurate Report Preview */}
        <section className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-xs report-print-surface">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
                Live Report Preview
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                {compiledReport.title}
              </h2>
              <div className="text-xs text-slate-500 mt-1">
                Generated {new Date(compiledReport.generatedAt).toLocaleString()} · Range: {dateFrom} to {dateTo}
              </div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">
                Prepared for: {compiledReport.identification}
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerateAiSummary}
              disabled={aiDraftLoading}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-950 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer print:hidden"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{aiDraftLoading ? 'Organizing...' : 'Generate Draft Intro'}</span>
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 font-semibold flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>{compiledReport.nonDiagnosticStatement}</span>
          </div>

          {aiDraftSummary && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950 space-y-1">
              <div className="font-bold uppercase tracking-wider text-[10px] text-indigo-800">
                Optional AI-Organized Overview (Review Before Sharing)
              </div>
              <p className="leading-relaxed">{aiDraftSummary}</p>
            </div>
          )}

          <div className="space-y-4">
            {SECTION_LABELS.filter(sec => selectedSections.includes(sec.id)).map(sec => {
              const sectionData = compiledReport.sections[sec.id];
              const badge = SOURCE_LABELS[sec.source];

              const formatKeyLabel = (k: string) =>
                k
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/_/g, ' ')
                  .replace(/^\w/, ch => ch.toUpperCase())
                  .trim();

              const renderReadableValue = (val: unknown, depth = 0): React.ReactNode => {
                if (val === null || val === undefined || val === '') {
                  return <span className="text-slate-500">None recorded</span>;
                }
                if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
                  return <span className="text-slate-800">{String(val)}</span>;
                }
                if (Array.isArray(val)) {
                  if (val.length === 0) {
                    return <span className="text-slate-500">None included for this date range.</span>;
                  }
                  return (
                    <ul className="space-y-2 mt-1">
                      {val.map((item, idx) => (
                        <li
                          key={idx}
                          className="p-3 rounded-xl bg-white border border-slate-200/80 text-sm text-slate-800 leading-relaxed"
                        >
                          {typeof item === 'object' && item !== null ? (
                            renderReadableValue(item, depth + 1)
                          ) : (
                            <span>• {String(item)}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  );
                }
                if (typeof val === 'object') {
                  const entries = Object.entries(val as Record<string, unknown>);
                  if (entries.length === 0) {
                    return <span className="text-slate-500">No entries recorded.</span>;
                  }
                  return (
                    <div className={`grid grid-cols-1 ${depth === 0 ? 'sm:grid-cols-2' : ''} gap-2.5 mt-1`}>
                      {entries.map(([k, v]) => (
                        <div key={k} className="text-sm leading-relaxed">
                          <span className="font-bold text-slate-700">{formatKeyLabel(k)}: </span>
                          {typeof v === 'object' && v !== null ? (
                            <div className="mt-1 pl-2 border-l-2 border-indigo-200">
                              {renderReadableValue(v, depth + 1)}
                            </div>
                          ) : (
                            <span className="text-slate-800">{String(v ?? '—')}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                }
                return <span>{String(val)}</span>;
              };

              return (
                <div key={sec.id} className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-indigo-950">
                      {sec.label}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${badge.style}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className="text-sm text-slate-700 leading-relaxed">
                    {renderReadableValue(sectionData)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Consent-Gated Therapist Sharing Status & Modal */}
      {sharedReports.length > 0 && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 print:hidden">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-800" />
            <span>Therapist Sharing Audit &amp; Revocation</span>
          </h2>
          {shareStatusMsg && !isShareModalOpen && (
            <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{shareStatusMsg}</span>
            </div>
          )}
          <div className="space-y-2.5">
            {sharedReports.map(rep => (
              <div
                key={rep.id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 font-bold text-slate-900">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-950 text-[10px] font-extrabold">
                      v{rep.version || 1}
                    </span>
                    <span>{rep.title} → {rep.therapistName}</span>
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    Delivered {new Date(rep.deliveredAt).toLocaleString()} ·{' '}
                    {rep.status === 'revoked'
                      ? `Revoked ${rep.revokedAt ? new Date(rep.revokedAt).toLocaleString() : ''}`
                      : rep.viewedAt
                      ? `Viewed by therapist at ${new Date(rep.viewedAt).toLocaleString()}`
                      : 'Delivered (not yet opened by therapist)'}
                  </div>
                </div>
                {rep.status !== 'revoked' ? (
                  <button
                    type="button"
                    onClick={() => handleRevokeReport(rep.id)}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Revoke Access</span>
                  </button>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-bold">
                    Revoked
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Share with My Therapist Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-extrabold text-indigo-950">
                  Share Support Report with Approved Therapist
                </h3>
                <p className="text-xs text-slate-500">
                  Consent-gated encrypted transfer — no public URLs, instant revocation anytime.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Close
              </button>
            </div>

            {!serverAuthToken || serverAuthUser?.role !== 'user' ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span>Signed-In Account Required for Therapist Sharing</span>
                </div>
                <p>
                  Guest mode stores your records exclusively inside this browser. You can still download the PDF or print it right now, or sign in via the top menu to connect securely with an approved clinician.
                </p>
              </div>
            ) : (
              <>
                {shareErrorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                    {shareErrorMsg}
                  </div>
                )}
                {shareStatusMsg && (
                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{shareStatusMsg}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      1. Select Administrator-Approved Therapist
                    </label>
                    <button
                      type="button"
                      onClick={loadSharingState}
                      className="text-[11px] font-bold text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {therapists.length === 0 ? (
                    <p className="text-xs text-slate-500 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      No approved therapists are listed yet. Registered clinicians must first be approved by a Platform Administrator.
                    </p>
                  ) : (
                    <select
                      value={selectedTherapistId}
                      onChange={e => setSelectedTherapistId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900"
                    >
                      {therapists.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} — {t.specialization} ({t.district}, Lic: {t.licenseNumber})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {selectedTherapistId && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Connection Status:</span>
                      <span className="font-bold capitalize text-indigo-900">
                        {selectedConnection?.status || 'Not connected'}
                      </span>
                    </div>

                    {(!selectedConnection || selectedConnection.status === 'revoked') && (
                      <button
                        type="button"
                        onClick={handleSendInvitation}
                        disabled={sharingBusy}
                        className="px-4 py-2 rounded-xl bg-indigo-950 text-white font-bold cursor-pointer"
                      >
                        Send Connection Invitation
                      </button>
                    )}

                    {selectedConnection?.status === 'pending' && (
                      <p className="text-amber-800">
                        Invitation sent. Waiting for therapist acceptance in the Therapist Portal before confidential reports can be transferred.
                      </p>
                    )}

                    {selectedConnection?.status === 'accepted' && (
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-emerald-800 font-semibold">
                          Authorized connection active.
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRevokeConnection(selectedConnection.id)}
                          className="text-rose-700 font-bold underline cursor-pointer"
                        >
                          Revoke Connection
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {selectedConnection?.status === 'accepted' && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1.5 text-xs">
                      <div className="font-bold text-indigo-950 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Exact Sections Being Transferred ({selectedSections.length})</span>
                      </div>
                      <div className="text-indigo-900">
                        {SECTION_LABELS.filter(s => selectedSections.includes(s.id))
                          .map(s => s.label)
                          .join(' · ')}
                      </div>
                    </div>

                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shareConsentChecked}
                        onChange={e => setShareConsentChecked(e.target.checked)}
                        className="mt-0.5"
                      />
                      <span>
                        I have reviewed the exact sections above and explicitly authorize ClearPath AI to deliver this non-diagnostic support summary to my selected therapist. I understand I can revoke future access at any time.
                      </span>
                    </label>

                    <button
                      type="button"
                      disabled={!shareConsentChecked || sharingBusy}
                      onClick={handleShareReport}
                      className="w-full py-3 rounded-xl bg-indigo-950 hover:bg-indigo-900 disabled:opacity-50 text-white text-xs font-extrabold cursor-pointer"
                    >
                      {sharingBusy ? 'Delivering...' : 'Confirm & Share Report Securely'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
