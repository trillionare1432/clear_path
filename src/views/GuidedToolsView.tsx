import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { GUIDED_TOOLS } from '../constants/initialData';
import {
  GuidedTool,
  MotivationSessionState,
  TherapistAssignmentRecord,
} from '../types';
import {
  SCOPED_STORAGE_KEYS,
  readScopedJson,
  writeScopedJson,
} from '../utils/vaultStorage';
import {
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  MessageCircleHeart,
  BookOpen,
  HeartHandshake,
  Users,
  Stethoscope,
  AlertTriangle,
  PauseCircle,
  PlayCircle,
  Flag,
  PhoneCall,
  Plus,
  Loader2,
  ShieldCheck,
  MessageCircle,
} from 'lucide-react';

type PathwaySection =
  | 'cbt'
  | 'motivation'
  | 'coping'
  | 'family'
  | 'peer'
  | 'medical';

const MI_STAGES = [
  {
    key: 'values',
    title: 'What Matters Most to You',
    prompt: 'When you look beyond pressure or rules, what personal values, relationships, or hopes feel most important to protect?',
  },
  {
    key: 'reasons',
    title: 'Your Own Reasons',
    prompt: 'If you ever think about making even a tiny shift, what are your own personal reasons (not anyone else’s)?',
  },
  {
    key: 'ambivalence',
    title: 'Exploring Mixed Feelings',
    prompt: 'What part of your current habit still feels comforting or hard to let go of—and what part feels exhausting?',
  },
  {
    key: 'strengths',
    title: 'Strengths You Already Have',
    prompt: 'Think of a tough period you handled before. What personal quality or support helped you through it?',
  },
  {
    key: 'barriers',
    title: 'Practical Barriers',
    prompt: 'What gets in the way most often (stress, sleep, environment, or feeling unsure where to start)?',
  },
  {
    key: 'next_step',
    title: 'A Self-Chosen Small Step',
    prompt: 'What feels like one realistic, pressure-free step you choose for the next 48 hours (even just talking or resting)?',
  },
];

const COPING_CATEGORIES = [
  {
    title: 'Managing Difficult Emotions',
    supports: 'Supports riding out anger, shame, or sadness without acting impulsively.',
    guide: 'Name the emotion neutrally (“this is heavy sadness, not a command”), drop shoulders, and wait 10 minutes before making any decision.',
  },
  {
    title: 'Stress Management',
    supports: 'Supports lowering physical tension during exam, family, or work overload.',
    guide: 'Pair a 5-minute brisk walk or cold face splash with writing down just the top 1 task for today instead of 10.',
  },
  {
    title: 'Healthy Communication',
    supports: 'Supports stating boundaries calmly using “I feel / I need” statements.',
    guide: 'Rehearse one short sentence: “I need a quiet hour tonight to reset; let’s talk tomorrow at 5 PM.”',
  },
  {
    title: 'Problem-Solving',
    supports: 'Supports breaking a tangled stressor into one manageable next move.',
    guide: 'List the exact problem in one sentence, write 2 realistic options, pick the safest one, and test it for 24 hours.',
  },
  {
    title: 'Managing Difficult Social Situations',
    supports: 'Supports leaving risky gatherings early or declining without awkward debates.',
    guide: 'Keep a pre-written exit excuse ready (“need to get home for an early morning check-in”) and arrange your own ride.',
  },
  {
    title: 'Relaxation & Grounding Exercises',
    supports: 'Supports steadying heart rate and racing thoughts during acute restlessness.',
    guide: 'Inhale 4 seconds, exhale 6 seconds for 6 cycles; name 3 objects you see and 2 sounds you hear. Note: grounding supports calm—it does not replace clinical care.',
  },
  {
    title: 'Building Supportive Routines',
    supports: 'Supports predictable sleep, meals, and evening wind-down anchors.',
    guide: 'Protect a fixed wake time and screen-off window so dopamine and energy regulate naturally.',
  },
  {
    title: 'Seeking Help Early',
    supports: 'Supports connecting with trustworthy adults, counselors, or 14405 before a crisis builds.',
    guide: 'Save Kerala Vimukthi (14405) or DISHA (1056) in your phone or book an intake via Care Map.',
  },
];

export const GuidedToolsView: React.FC = () => {
  const {
    vaultScope,
    language,
    toolCompletions,
    saveToolCompletion,
    clientAssignments,
    refreshClientAssignments,
    serverAuthToken,
    shareItemWithSupporter,
    openAiAssistant,
  } = useApp();

  const [section, setSection] = useState<PathwaySection>('cbt');
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  // Per-tool share with therapist report toggle
  const [toolShareFlags, setToolShareFlags] = useState<Record<string, boolean>>(() =>
    readScopedJson<Record<string, boolean>>(vaultScope, SCOPED_STORAGE_KEYS.TOOL_SHARE_FLAGS, {})
  );

  // Therapist assignment feedback & status editing
  const [assignmentReflections, setAssignmentReflections] = useState<Record<string, string>>({});
  const [assignmentSavingId, setAssignmentSavingId] = useState<string | null>(null);

  // Explore My Motivation (MI) session
  const [miSession, setMiSession] = useState<MotivationSessionState>(() =>
    readScopedJson<MotivationSessionState>(vaultScope, SCOPED_STORAGE_KEYS.MOTIVATION_SESSION, {
      id: 'mi-default',
      currentStepIndex: 0,
      paused: false,
      updatedAt: new Date().toISOString(),
      entries: {},
    })
  );
  const [miDraftInput, setMiDraftInput] = useState('');
  const [miLoading, setMiLoading] = useState(false);

  // Moderated peer programmes + report modal
  const [verifiedPeerProgrammes, setVerifiedPeerProgrammes] = useState<
    { id: string; title: string; orgName: string; district: string; date: string; description: string }[]
  >([]);
  const [abuseReportOpen, setAbuseReportOpen] = useState(false);
  const [abuseReportNote, setAbuseReportNote] = useState('');
  const [abuseSubmitted, setAbuseSubmitted] = useState(false);

  // Medical Care Prep Questions
  const [clinicianNotes, setClinicianNotes] = useState<string[]>(() =>
    readScopedJson<string[]>(vaultScope, SCOPED_STORAGE_KEYS.CLINICAL_CARE_NOTES, [])
  );
  const [newClinicianNote, setNewClinicianNote] = useState('');
  const [sharedFamilyNotice, setSharedFamilyNotice] = useState(false);

  useEffect(() => {
    refreshClientAssignments();
    fetch('/api/community/programmes')
      .then(r => (r.ok ? r.json() : { programmes: [] }))
      .then(d => setVerifiedPeerProgrammes(d.programmes || []))
      .catch(() => {});
  }, [refreshClientAssignments]);

  const selectedTool: GuidedTool | undefined = GUIDED_TOOLS.find(t => t.id === selectedToolId);

  const toggleShareToolFlag = (toolId: string) => {
    const next = { ...toolShareFlags, [toolId]: !(toolShareFlags[toolId] ?? true) };
    setToolShareFlags(next);
    writeScopedJson(vaultScope, SCOPED_STORAGE_KEYS.TOOL_SHARE_FLAGS, next);
  };

  const handleStartTool = (tool: GuidedTool) => {
    setSelectedToolId(tool.id);
    setCurrentStepIndex(0);
    setResponses(toolCompletions[tool.id]?.responses || {});
    setIsCompleted(!!toolCompletions[tool.id]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextStep = () => {
    if (!selectedTool) return;
    if (currentStepIndex + 1 < selectedTool.steps.length) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      saveToolCompletion(selectedTool.id, responses);
      setIsCompleted(true);
    }
  };

  const handleUpdateAssignmentStatus = async (
    assignment: TherapistAssignmentRecord,
    status: 'in_progress' | 'completed'
  ) => {
    if (!serverAuthToken) return;
    setAssignmentSavingId(assignment.id);
    try {
      await fetch(`/api/care/assignments/${assignment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify({
          status,
          clientReflection: assignmentReflections[assignment.id] ?? assignment.clientReflection ?? '',
        }),
      });
      await refreshClientAssignments();
    } finally {
      setAssignmentSavingId(null);
    }
  };

  const handleSubmitMiStep = async (e: React.FormEvent) => {
    e.preventDefault();
    const stage = MI_STAGES[miSession.currentStepIndex] || MI_STAGES[0];
    if (!miDraftInput.trim()) return;
    setMiLoading(true);
    try {
      const res = await fetch('/api/ai/motivation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: stage.key,
          userMessage: miDraftInput.trim(),
          language,
        }),
      });
      const data = await res.json();
      const updated: MotivationSessionState = {
        ...miSession,
        paused: false,
        updatedAt: new Date().toISOString(),
        entries: {
          ...miSession.entries,
          [stage.key]: {
            userText: miDraftInput.trim(),
            aiReflection: `${data.reflection} ${data.nextQuestion}`,
          },
        },
      };
      setMiSession(updated);
      writeScopedJson(vaultScope, SCOPED_STORAGE_KEYS.MOTIVATION_SESSION, updated);
      setMiDraftInput('');
    } finally {
      setMiLoading(false);
    }
  };

  const handlePauseOrStepMi = (nextIdx: number, paused: boolean) => {
    const updated: MotivationSessionState = {
      ...miSession,
      currentStepIndex: Math.max(0, Math.min(MI_STAGES.length - 1, nextIdx)),
      paused,
      updatedAt: new Date().toISOString(),
    };
    setMiSession(updated);
    writeScopedJson(vaultScope, SCOPED_STORAGE_KEYS.MOTIVATION_SESSION, updated);
  };

  const handleAddClinicianNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClinicianNote.trim()) return;
    const next = [...clinicianNotes, newClinicianNote.trim()];
    setClinicianNotes(next);
    writeScopedJson(vaultScope, SCOPED_STORAGE_KEYS.CLINICAL_CARE_NOTES, next);
    setNewClinicianNote('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-800 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>User-Controlled Intervention Centre</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">My Support Pathways</h1>
          <p className="editorial-subtitle text-slate-600 mt-1.5 max-w-2xl">
            Choose only the approaches that fit your pace—CBT-inspired self-reflection, Explore My Motivation, coping skills, family support, peer groups, or medical visit prep.
          </p>
        </div>

        {selectedToolId && (
          <button
            type="button"
            onClick={() => setSelectedToolId(null)}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3.5 py-2 bg-white border border-slate-200 rounded-xl cursor-pointer self-start"
          >
            &larr; Back to All Tools
          </button>
        )}
      </div>

      {/* Therapist-Assigned Activities Banner */}
      {clientAssignments.length > 0 && (
        <section className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-amber-800" />
              <span>Assigned by Therapist ({clientAssignments.length})</span>
            </h2>
            <span className="text-[11px] font-bold text-amber-900">Continuity Between Appointments</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {clientAssignments.map(a => (
              <div key={a.id} className="bg-white rounded-2xl border border-amber-200 p-4 space-y-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-indigo-950">{a.title}</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-900 font-bold capitalize">
                    {a.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">{a.instructions}</p>
                <div className="text-[11px] text-slate-500">
                  Assigned by {a.therapistName} · Start: {a.startDate}
                  {a.dueDate ? ` · Due: ${a.dueDate}` : ''}
                </div>
                {a.therapistFeedback && (
                  <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950">
                    <strong>Therapist Feedback:</strong> {a.therapistFeedback}
                  </div>
                )}
                <textarea
                  rows={2}
                  value={assignmentReflections[a.id] ?? a.clientReflection ?? ''}
                  onChange={e =>
                    setAssignmentReflections(prev => ({ ...prev, [a.id]: e.target.value }))
                  }
                  placeholder="Optional reflection for your therapist..."
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={assignmentSavingId === a.id}
                    onClick={() => handleUpdateAssignmentStatus(a, 'in_progress')}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 font-bold cursor-pointer"
                  >
                    Mark In Progress
                  </button>
                  <button
                    type="button"
                    disabled={assignmentSavingId === a.id}
                    onClick={() => handleUpdateAssignmentStatus(a, 'completed')}
                    className="px-3 py-1.5 rounded-xl bg-indigo-950 text-white font-bold cursor-pointer"
                  >
                    Mark Completed
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pathway Module Navigation */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'cbt' as const, label: 'CBT-Inspired Exercises (8)', icon: Sparkles },
          { id: 'motivation' as const, label: 'Explore My Motivation (MI)', icon: MessageCircleHeart },
          { id: 'coping' as const, label: 'Coping Skills Library', icon: BookOpen },
          { id: 'family' as const, label: 'Family & Relationships', icon: HeartHandshake },
          { id: 'peer' as const, label: 'Peer & Community', icon: Users },
          { id: 'medical' as const, label: 'Medical Care Prep', icon: Stethoscope },
        ].map(tab => {
          const Icon = tab.icon;
          const active = section === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSection(tab.id);
                setSelectedToolId(null);
              }}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                active
                  ? 'bg-indigo-950 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-amber-300' : 'text-indigo-700'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: 8 CBT-INSPIRED EDUCATIONAL EXERCISES */}
      {section === 'cbt' && (
        <>
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-950">
            <strong>Educational Notice:</strong> These 8 CBT-inspired worksheets help organize thoughts and coping plans. They are structured self-reflection exercises—not clinical psychotherapy.
          </div>

          {selectedTool ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs max-w-3xl mx-auto space-y-6 animate-tab-fade">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">
                    {selectedTool.category} · {selectedTool.durationMinutes} mins
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                    {selectedTool.title}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openAiAssistant({
                        role: 'personal',
                        contextRef: {
                          area: 'Calm & Coping Tools',
                          topicTitle: selectedTool.title,
                          snippet: selectedTool.steps[currentStepIndex]?.prompt || selectedTool.scientificBasis,
                        },
                      })
                    }
                    className="min-h-[36px] px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-950 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Need a quick step? Ask AI</span>
                  </button>
                  <span className="text-xs text-slate-600 font-mono-tabular font-bold bg-slate-100 px-3 py-1 rounded-lg">
                    Step {currentStepIndex + 1} of {selectedTool.steps.length}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {selectedTool.steps.map((st, idx) => {
                  const active = !isCompleted && idx === currentStepIndex;
                  const filled = Boolean(responses[idx]?.trim());
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setIsCompleted(false);
                        setCurrentStepIndex(idx);
                      }}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                        active
                          ? 'bg-indigo-950 border-indigo-950 text-white'
                          : filled
                          ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0 ${
                          active
                            ? 'bg-amber-400 text-indigo-950'
                            : filled
                            ? 'bg-indigo-700 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {filled && !active ? '✓' : idx + 1}
                      </span>
                      <span className="text-xs font-bold line-clamp-1">{st.title}</span>
                    </button>
                  );
                })}
              </div>

              <div className="prose-readable-sm text-slate-600 italic bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                Objective &amp; Basis: {selectedTool.scientificBasis}
              </div>

              {!isCompleted ? (
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <h3 className="text-lg font-extrabold text-slate-900">
                      {selectedTool.steps[currentStepIndex].title}
                    </h3>
                    <p className="prose-readable text-slate-700">
                      {selectedTool.steps[currentStepIndex].prompt}
                    </p>
                  </div>

                  {selectedTool.steps[currentStepIndex].type === 'text' && (
                    <textarea
                      rows={4}
                      value={responses[currentStepIndex] || ''}
                      onChange={e =>
                        setResponses({ ...responses, [currentStepIndex]: e.target.value })
                      }
                      placeholder="Write your honest response here (optional)..."
                      className="w-full p-3.5 rounded-2xl border border-slate-200 prose-readable-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  )}

                  {selectedTool.steps[currentStepIndex].type === 'choice' && (
                    <div className="space-y-2.5">
                      {selectedTool.steps[currentStepIndex].options?.map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setResponses({ ...responses, [currentStepIndex]: opt })
                          }
                          className={`w-full p-3.5 rounded-xl text-left prose-readable-sm font-medium border transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                            responses[currentStepIndex] === opt
                              ? 'border-indigo-700 bg-indigo-50 text-indigo-950 font-semibold'
                              : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          <span>{opt}</span>
                          {responses[currentStepIndex] === opt && (
                            <CheckCircle2 className="w-4 h-4 text-indigo-700 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    {currentStepIndex > 0 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentStepIndex(i => i - 1)}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Previous Step</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-5 py-2.5 bg-indigo-800 hover:bg-indigo-900 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>
                        {currentStepIndex + 1 === selectedTool.steps.length
                          ? 'Save My Answers'
                          : 'Next Step'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-indigo-700 shrink-0 mt-0.5" />
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Saved Privately on This Device</h3>
                        <p className="prose-readable-sm text-slate-600 mt-0.5">
                          Control whether this completed exercise may be included in &ldquo;Get My Report&rdquo;.
                        </p>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-xs font-bold text-indigo-950 bg-white px-3 py-2 rounded-xl border border-indigo-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={toolShareFlags[selectedTool.id] ?? true}
                        onChange={() => toggleShareToolFlag(selectedTool.id)}
                      />
                      <span>Allow in Therapist Report</span>
                    </label>
                  </div>

                  <div className="space-y-3">
                    {selectedTool.steps.map((st, idx) => (
                      <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                        <div className="text-xs font-bold text-indigo-900">
                          Step {idx + 1} · {st.title}
                        </div>
                        <p className="prose-readable-sm text-slate-800">
                          {responses[idx]?.trim() ? responses[idx] : '(Skipped for now)'}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStepIndex(0);
                        setIsCompleted(false);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                    >
                      Edit Answers
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedToolId(null)}
                      className="px-4 py-2 bg-indigo-800 text-white rounded-xl text-xs font-semibold hover:bg-indigo-900 cursor-pointer"
                    >
                      Back to All Tools
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GUIDED_TOOLS.map(tool => {
                const savedEntry = toolCompletions[tool.id];
                const isDone = !!savedEntry;
                return (
                  <div
                    key={tool.id}
                    className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between hover:border-indigo-300 transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800">
                          {tool.category} · {tool.durationMinutes} min
                        </span>
                        {isDone && (
                          <span className="text-[10px] font-semibold text-indigo-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Saved {savedEntry.completedAt.slice(0, 10)}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1.5">{tool.title}</h3>
                      <p className="prose-readable-sm text-slate-600 mb-4">{tool.subtitle}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">{tool.steps.length} clear steps</span>
                      <button
                        type="button"
                        onClick={() => handleStartTool(tool)}
                        className="px-3.5 py-1.5 bg-indigo-50 text-indigo-900 hover:bg-indigo-100 font-semibold rounded-xl text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>{isDone ? 'View History / Edit' : 'Start'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* SECTION 2: EXPLORE MY MOTIVATION (MI-INSPIRED CONVERSATION) */}
      {section === 'motivation' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
                Motivational Interviewing-Inspired Self-Reflection
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">Explore My Motivation</h2>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                This is a pressure-free reflection guide—not professional motivational interviewing therapy. You decide what to share, and you can pause or exit anytime.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  handlePauseOrStepMi(miSession.currentStepIndex, !miSession.paused)
                }
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                {miSession.paused ? (
                  <>
                    <PlayCircle className="w-4 h-4 text-indigo-700" />
                    <span>Resume Reflection</span>
                  </>
                ) : (
                  <>
                    <PauseCircle className="w-4 h-4 text-amber-700" />
                    <span>Pause &amp; Save</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSection('cbt')}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 cursor-pointer"
              >
                Exit Anytime
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {MI_STAGES.map((st, idx) => {
              const active = idx === miSession.currentStepIndex;
              const answered = Boolean(miSession.entries[st.key]?.userText);
              return (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => handlePauseOrStepMi(idx, false)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                    active
                      ? 'bg-indigo-950 text-white border-indigo-950'
                      : answered
                      ? 'bg-indigo-50 text-indigo-900 border-indigo-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {idx + 1}. {st.title}
                </button>
              );
            })}
          </div>

          {miSession.paused ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
              <p className="text-sm font-bold text-slate-900">Reflection Paused &amp; Saved Privately</p>
              <p className="text-xs text-slate-600">
                Take as much time as you need. Resume whenever it feels helpful.
              </p>
              <button
                type="button"
                onClick={() => handlePauseOrStepMi(miSession.currentStepIndex, false)}
                className="px-4 py-2 rounded-xl bg-indigo-950 text-white text-xs font-bold cursor-pointer"
              >
                Resume Stage {miSession.currentStepIndex + 1}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {(() => {
                const st = MI_STAGES[miSession.currentStepIndex] || MI_STAGES[0];
                const saved = miSession.entries[st.key];
                return (
                  <>
                    <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-1.5">
                      <div className="text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                        Stage {miSession.currentStepIndex + 1} · {st.title}
                      </div>
                      <p className="prose-readable text-slate-900">{st.prompt}</p>
                    </div>

                    {saved && (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                        <div>
                          <strong className="text-slate-900">What you shared:</strong>{' '}
                          <span className="text-slate-700">{saved.userText}</span>
                        </div>
                        {saved.aiReflection && (
                          <div className="p-3 rounded-xl bg-white border border-indigo-100 text-indigo-950 leading-relaxed">
                            <strong>Reflective Summary:</strong> {saved.aiReflection}
                          </div>
                        )}
                      </div>
                    )}

                    <form onSubmit={handleSubmitMiStep} className="space-y-3">
                      <textarea
                        rows={3}
                        value={miDraftInput}
                        onChange={e => setMiDraftInput(e.target.value)}
                        placeholder="Share only what you feel comfortable sharing—zero pressure, zero judgment..."
                        className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-xs sm:text-sm"
                      />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="submit"
                          disabled={miLoading || !miDraftInput.trim()}
                          className="px-5 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          {miLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                          <span>Reflect &amp; Save Privately</span>
                        </button>

                        {miSession.currentStepIndex + 1 < MI_STAGES.length && (
                          <button
                            type="button"
                            onClick={() =>
                              handlePauseOrStepMi(miSession.currentStepIndex + 1, false)
                            }
                            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Next Reflection Topic</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </form>
                  </>
                );
              })()}
            </div>
          )}
        </section>
      )}

      {/* SECTION 3: COPING SKILLS LIBRARY */}
      {section === 'coping' && (
        <section className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
            <strong>Realistic Scope Notice:</strong> Breathing, relaxation, and stress skills support everyday emotional regulation—they do not cure or treat substance dependence alone. Pair them with professional support whenever needed.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {COPING_CATEGORIES.map(cat => (
              <div key={cat.title} className="bg-white rounded-3xl border border-slate-200 p-5 space-y-2">
                <h3 className="text-base font-extrabold text-indigo-950">{cat.title}</h3>
                <p className="text-xs font-semibold text-amber-800">{cat.supports}</p>
                <p className="prose-readable-sm text-slate-700">{cat.guide}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 4: FAMILY & RELATIONSHIP SUPPORT */}
      {section === 'family' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900">Family &amp; Relationship Support</h2>
            <p className="text-xs text-slate-600">
              Practical ideas for healthy boundaries, rebuilding trust gradually, and optional consented sharing with a trusted supporter.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
            <span>
              <strong>Safety First:</strong> Never confront someone who is intoxicated, angry, or unsafe. Prioritize physical safety and call 112 or Vimukthi 14405 when needed.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="font-extrabold text-slate-900">Setting Calm Boundaries</div>
              <p className="text-slate-700 leading-relaxed">
                Clear agreements (“I would love to talk for 15 minutes at 6 PM about our week—not about past mistakes”) protect respect on both sides.
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="font-extrabold text-slate-900">Optional Supporter Share (Non-Sensitive Only)</div>
              <p className="text-slate-700 leading-relaxed">
                Choose to share a positive routine focus with Role 02 Supporter Mode—screening answers and personal diary notes always stay strictly hidden.
              </p>
              <button
                type="button"
                onClick={() => {
                  shareItemWithSupporter({
                    id: 'share-family-checkin-focus',
                    kind: 'support_request',
                    title: 'Open for a calm weekly family walk or check-in',
                    detail: 'Shared voluntarily from My Support Pathways. Private clinical & diary logs remain hidden.',
                    consentGranted: true,
                  });
                  setSharedFamilyNotice(true);
                }}
                className="mt-2 px-3 py-1.5 rounded-xl bg-indigo-950 text-white font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                <span>{sharedFamilyNotice ? 'Shared Non-Sensitive Check-In!' : 'Share Calm Check-In Request'}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* SECTION 5: MODERATED PEER & COMMUNITY SUPPORT */}
      {section === 'peer' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Verified Peer &amp; Community Support</h2>
              <p className="text-xs text-slate-600">
                Public moderated listings only—no unmoderated open chatrooms and zero public exposure of personal logs.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setAbuseSubmitted(false);
                setAbuseReportOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Report Concern / Unsafe Content</span>
            </button>
          </div>

          {verifiedPeerProgrammes.length === 0 ? (
            <p className="text-xs text-slate-500 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              Verified community groups and prevention programmes appear here once approved by platform administrators.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verifiedPeerProgrammes.map(p => (
                <div key={p.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-teal-800">{p.district}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                      Verified Session
                    </span>
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">{p.title}</div>
                  <div className="text-slate-600">{p.orgName} · {p.date}</div>
                  <p className="text-slate-700 leading-relaxed">{p.description}</p>
                </div>
              ))}
            </div>
          )}

          {abuseReportOpen && (
            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2 text-xs">
              {abuseSubmitted ? (
                <div className="font-bold text-rose-950">
                  Safety report logged. Thank you for helping keep ClearPath support listings safe and moderated.
                </div>
              ) : (
                <>
                  <div className="font-bold text-rose-950">Report Misleading Advice, Substance Promotion, or Safety Risk</div>
                  <textarea
                    rows={2}
                    value={abuseReportNote}
                    onChange={e => setAbuseReportNote(e.target.value)}
                    placeholder="Describe the listing or safety concern..."
                    className="w-full p-2.5 rounded-xl border border-rose-200 bg-white"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAbuseSubmitted(true);
                        setAbuseReportNote('');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-700 text-white font-bold cursor-pointer"
                    >
                      Submit Safety Report
                    </button>
                    <button
                      type="button"
                      onClick={() => setAbuseReportOpen(false)}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      )}

      {/* SECTION 6: MEDICAL TREATMENT & PROFESSIONAL CARE */}
      {section === 'medical' && (
        <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-5">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900">Medical Treatment &amp; Appointment Preparation</h2>
            <p className="text-xs text-slate-600">
              Self-help tools complement medical care—they never replace physicians, psychiatrists, or clinical de-addiction programmes.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-2">
            <div className="font-extrabold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
              <span>Important Withdrawal &amp; Medical Safety Warning</span>
            </div>
            <p className="leading-relaxed">
              ClearPath AI never prescribes medications, dosages, or detox schedules. <strong>Never stop alcohol or certain heavy dependencies abruptly without medical supervision</strong>—withdrawal can sometimes be medically dangerous. If you experience severe shaking, confusion, chest pain, or fever, seek urgent medical care or call <strong>112</strong> / <strong>14405</strong> immediately.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <a
                href="tel:14405"
                className="px-3 py-1.5 rounded-lg bg-rose-700 text-white font-bold inline-flex items-center gap-1"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call Vimukthi 14405</span>
              </a>
              <a
                href="tel:1056"
                className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-900 font-bold"
              >
                DISHA 1056
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900">
              Clinician Questions &amp; Care Instructions Log (Included optionally in Get My Report)
            </h3>
            <form onSubmit={handleAddClinicianNote} className="flex gap-2">
              <input
                type="text"
                value={newClinicianNote}
                onChange={e => setNewClinicianNote(e.target.value)}
                placeholder="e.g., Ask doctor about safe sleep recovery options or counseling hours..."
                className="flex-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-950 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Note</span>
              </button>
            </form>
            {clinicianNotes.length > 0 && (
              <ul className="space-y-1.5">
                {clinicianNotes.map((n, i) => (
                  <li key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800">
                    {n}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
