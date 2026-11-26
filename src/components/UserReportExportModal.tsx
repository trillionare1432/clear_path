import React, { useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { LEARNER_LESSONS } from '../constants/learnerData';
import {
  FileText,
  Download,
  Printer,
  X,
  PhoneCall,
  ShieldCheck,
} from 'lucide-react';

interface UserReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
}

interface ReportSectionBlock {
  heading: string;
  lines: string[];
}

export const UserReportExportModal: React.FC<UserReportExportModalProps> = ({
  isOpen,
  onClose,
  role,
}) => {
  const {
    userProfile,
    serverAuthUser,
    personalizationProfile,
    dailyLogs,
    goals,
    substanceConcerns,
    triggerEntries,
    earlyAssessments,
    supportPlans,
    supporterReflections,
    savedConversationPlans,
    supporterEvents,
    completedLessonIds,
    quizAttempts,
    learnerJournalEntries,
    learnerCustomPlan,
    learnerCertificate,
    communityOrg,
    communityProgrammes,
    communityEvents,
    communityTasks,
    communityFeedback,
  } = useApp();

  const reportData = useMemo(() => {
    const userName =
      userProfile?.name || serverAuthUser?.name || personalizationProfile.name || 'ClearPath User';
    const generatedAt = new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    if (role === 'personal') {
      const doneGoals = goals.filter(g => g.completed).length;
      return {
        title: 'ClearPath Personal Recovery & Wellbeing Summary',
        roleLabel: 'Role 01 · Personal Mode',
        userName,
        generatedAt,
        kpis: [
          { label: 'Check-Ins Logged', value: String(dailyLogs.length) },
          { label: 'Active Goals', value: String(goals.length - doneGoals) },
          { label: 'Sub-Concerns Noted', value: String(substanceConcerns.length) },
          { label: 'Self-Checks', value: String(earlyAssessments.length) },
        ],
        sections: [
          {
            heading: 'Focus Substances & Medications',
            lines:
              substanceConcerns.length > 0
                ? substanceConcerns.map(
                    c =>
                      `- ${c.name}${c.parentCategory ? ` (${c.parentCategory})` : ''} — ${c.verificationStatus.replace(/_/g, ' ')}`
                  )
                : ['No specific substances listed yet.'],
          },
          {
            heading: 'Recent Daily Check-Ins & Long Reflections',
            lines:
              dailyLogs.length > 0
                ? dailyLogs.slice(0, 6).map(
                    l =>
                      `- ${l.date} [${l.mood || 'steady'}]: ${l.quickNote || l.personalReflection || 'Quick mood check-in saved'}`
                  )
                : ['No daily check-ins saved yet.'],
          },
          {
            heading: 'Personal Goals & Triggers Tracked',
            lines: [
              ...(goals.length > 0
                ? goals.slice(0, 6).map(g => `- Goal (${g.completed ? 'Completed' : 'In Progress'}): ${g.title}`)
                : ['No personal goals created yet.']),
              ...(triggerEntries.length > 0
                ? [`- Triggers logged: ${triggerEntries.length} recent entries recorded privately.`]
                : []),
            ],
          },
        ] as ReportSectionBlock[],
      };
    }

    if (role === 'supporter') {
      return {
        title: 'ClearPath Family & Supporter Progress Report',
        roleLabel: 'Role 02 · Supporter Mode',
        userName,
        generatedAt,
        kpis: [
          { label: 'Support Plans', value: String(supportPlans.length) },
          { label: 'Reflections Saved', value: String(supporterReflections.length) },
          { label: 'Talk Plans', value: String(savedConversationPlans.length) },
          { label: 'Scheduled Dates', value: String(supporterEvents.length) },
        ],
        sections: [
          {
            heading: 'Active Support Plans',
            lines:
              supportPlans.length > 0
                ? supportPlans.slice(0, 5).map(p => {
                    const done = p.tasks.filter(t => t.completed).length;
                    return `- ${p.title} (${done}/${p.tasks.length} steps done) — ${p.objective}`;
                  })
                : ['No support plans saved yet.'],
          },
          {
            heading: 'Recent Supporter Wellbeing Reflections',
            lines:
              supporterReflections.length > 0
                ? supporterReflections.slice(0, 6).map(
                    r => `- ${r.date} [${r.mood}]: ${r.quickNote || 'Saved calm check-in'}`
                  )
                : ['No supporter reflections saved yet.'],
          },
          {
            heading: 'Saved Conversation Preparations',
            lines:
              savedConversationPlans.length > 0
                ? savedConversationPlans.slice(0, 4).map(
                    c =>
                      `- ${c.title || c.situation}: "${c.chosenOpeningLine || c.openingLine || 'Prepared talk points'}"`
                  )
                : ['No rehearsed talk plans saved yet.'],
          },
        ] as ReportSectionBlock[],
      };
    }

    if (role === 'learner') {
      const avgScore =
        quizAttempts.length > 0
          ? Math.round(
              quizAttempts.reduce(
                (sum, q) => sum + (q.score / Math.max(1, q.totalQuestions)) * 100,
                0
              ) / quizAttempts.length
            )
          : 0;
      return {
        title: 'ClearPath Youth Learning & Prevention Report',
        roleLabel: 'Role 03 · Learner Mode',
        userName,
        generatedAt,
        kpis: [
          { label: 'Lessons Finished', value: `${completedLessonIds.length}/${LEARNER_LESSONS.length}` },
          { label: 'Quizzes Taken', value: String(quizAttempts.length) },
          { label: 'Average Score', value: `${avgScore}%` },
          { label: 'Certificate', value: learnerCertificate ? 'Issued' : 'In Progress' },
        ],
        sections: [
          {
            heading: 'Completed Short Topics',
            lines:
              completedLessonIds.length > 0
                ? completedLessonIds.map(id => {
                    const found = LEARNER_LESSONS.find(l => l.id === id);
                    return `- ${found ? found.title : id}`;
                  })
                : ['No lessons completed yet.'],
          },
          {
            heading: 'Learner Reflections & Notes',
            lines:
              learnerJournalEntries.length > 0
                ? learnerJournalEntries.slice(0, 5).map(
                    j => `- ${j.title || 'Note'}: ${j.keyTakeaway}`
                  )
                : ['No learner notes saved yet.'],
          },
          {
            heading: 'Study Plan & Certificate Status',
            lines: [
              learnerCustomPlan
                ? `- Custom plan: ${learnerCustomPlan.goalTitle} (${learnerCustomPlan.days.filter(d => d.completed).length}/${learnerCustomPlan.durationDays} days done)`
                : '- No custom multi-day study plan saved yet.',
              learnerCertificate
                ? `- Certificate issued to ${learnerCertificate.recipientName} on ${learnerCertificate.completedDate}`
                : '- Complete 3 study days, 4 lessons, and 2 refusal drills to unlock your certificate.',
            ],
          },
        ] as ReportSectionBlock[],
      };
    }

    // community
    const totalReached = communityEvents.reduce(
      (sum, ev) => sum + (ev.actualAttendance || ev.expectedAttendance || 0),
      0
    );
    const doneTasks = communityTasks.filter(t => t.status === 'completed').length;
    return {
      title: 'ClearPath Kerala Community Prevention Report',
      roleLabel: 'Role 04 · Community Builder',
      userName: communityOrg?.name ? `${userName} (${communityOrg.name})` : userName,
      generatedAt,
      kpis: [
        { label: 'Programmes', value: String(communityProgrammes.length) },
        { label: 'Sessions Held', value: String(communityEvents.length) },
        { label: 'People Reached', value: String(totalReached) },
        { label: 'Tasks Done', value: `${doneTasks}/${communityTasks.length}` },
      ],
      sections: [
        {
          heading: 'Community Programmes & Campaigns',
          lines:
            communityProgrammes.length > 0
              ? communityProgrammes.slice(0, 6).map(
                  p => `- ${p.title} (${p.status}) — District: ${p.district || communityOrg?.district || 'Kerala'}`
                )
              : ['No programmes logged yet.'],
        },
        {
          heading: 'Workshops & Neighbourhood Sessions',
          lines:
            communityEvents.length > 0
              ? communityEvents.slice(0, 6).map(
                  e => `- ${e.date}: ${e.title} at ${e.venue} (~${e.actualAttendance || e.expectedAttendance} participants)`
                )
              : ['No community events scheduled yet.'],
        },
        {
          heading: 'Feedback & District Observations',
          lines:
            communityFeedback.length > 0
              ? communityFeedback.slice(0, 5).map(
                  f => `- ${f.topic || 'Session'}: ${f.usefulnessRating}/5 — ${f.unmetNeedsSuggestions || 'Anonymous participant check'}`
                )
              : ['No workshop feedback entries recorded yet.'],
        },
      ] as ReportSectionBlock[],
    };
  }, [
    role,
    userProfile,
    serverAuthUser,
    personalizationProfile,
    dailyLogs,
    goals,
    substanceConcerns,
    triggerEntries,
    earlyAssessments,
    supportPlans,
    supporterReflections,
    savedConversationPlans,
    supporterEvents,
    completedLessonIds,
    quizAttempts,
    learnerJournalEntries,
    learnerCustomPlan,
    learnerCertificate,
    communityOrg,
    communityProgrammes,
    communityEvents,
    communityTasks,
    communityFeedback,
  ]);

  if (!isOpen) return null;

  const handleDownloadPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 44;
    const maxWidth = pageWidth - margin * 2;
    let y = 52;

    const ensureSpace = (needed = 24) => {
      if (y + needed > doc.internal.pageSize.getHeight() - 56) {
        doc.addPage();
        y = 50;
      }
    };

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 27, 75);
    doc.text(reportData.title, margin, y);
    y += 20;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`${reportData.roleLabel}  |  Prepared for: ${reportData.userName}  |  Date: ${reportData.generatedAt}`, margin, y);
    y += 18;

    doc.setDrawColor(203, 213, 225);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;

    // KPI summary row
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    const kpiLine = reportData.kpis.map(k => `${k.label}: ${k.value}`).join('    ·    ');
    const wrappedKpi = doc.splitTextToSize(kpiLine, maxWidth);
    doc.text(wrappedKpi, margin, y);
    y += wrappedKpi.length * 14 + 12;

    for (const sec of reportData.sections) {
      ensureSpace(44);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 27, 75);
      doc.text(sec.heading, margin, y);
      y += 16;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      for (const line of sec.lines) {
        const wrapped = doc.splitTextToSize(line, maxWidth);
        ensureSpace(wrapped.length * 14 + 6);
        doc.text(wrapped, margin, y);
        y += wrapped.length * 14 + 4;
      }
      y += 10;
    }

    ensureSpace(48);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(153, 27, 27);
    doc.text(
      'Emergency & Kerala Helplines: 112 (Emergency) · 14405 (Vimukthi 24/7) · 1056 (DISHA) · 14416 (Tele-MANAS)',
      margin,
      y
    );

    const safeFileName = `clearpath-${role}-report-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(safeFileName);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="User Progress PDF Report"
    >
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-900 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold text-slate-900 truncate">{reportData.title}</h2>
              <p className="text-xs text-slate-600">
                {reportData.roleLabel} · {reportData.userName} · {reportData.generatedAt}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer"
            aria-label="Close report preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {reportData.kpis.map(k => (
              <div key={k.label} className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-500">{k.label}</div>
                <div className="text-lg font-extrabold text-slate-900 font-mono-tabular mt-0.5">
                  {k.value}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {reportData.sections.map(sec => (
              <div key={sec.heading} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
                <h3 className="text-sm font-extrabold text-indigo-950">{sec.heading}</h3>
                <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {sec.lines.map((line, i) => (
                    <li key={i}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex flex-wrap items-center justify-between gap-2 text-xs text-rose-950">
            <span className="font-bold inline-flex items-center gap-1.5">
              <PhoneCall className="w-4 h-4 text-rose-700" />
              24/7 Support: 112 (Emergency) · 14405 (Vimukthi) · 1056 (DISHA)
            </span>
            <span className="inline-flex items-center gap-1 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Generated privately on your device
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-extrabold inline-flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-300" />
            <span>Download PDF Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
