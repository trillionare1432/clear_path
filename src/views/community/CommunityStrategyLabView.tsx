import React, { useState, useEffect, useCallback } from 'react';
import {
  Brain,
  Plus,
  Trash2,
  ArrowRight,
  GitCompare,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Save,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { KERALA_DISTRICTS } from '../../constants/communityData';
import {
  PREVENTION_EVALUATION_CRITERIA,
} from '../../constants/communityIntelligenceData';
import { CommunityIdeaClient, CommunityProgramme } from '../../types';

export interface CommunityProgrammeDraft {
  linkedIdeaId?: string;
  title: string;
  category: CommunityProgramme['category'];
  objective: string;
  targetAudience: string;
  district: string;
  settings: string;
  partners: string;
  strategies: string;
  safeguards: string;
  indicators: string;
  evaluationPlan: string;
  timeline: string;
  requiredResources: string;
  potentialRisks: string;
  expectedOutcomes: string;
}

interface TenPointAnalysis {
  problemDefinition: string;
  targetPopulation: string;
  evidenceAlignment: string;
  mechanismOfChange: string;
  expectedOutcomesVsSpeculation: string;
  resourceRequirements: string;
  limitationsAndFailureRisks: string;
  ethicalAndSafeguarding: string;
  measurableIndicators: string;
  evaluationPlan: string;
}

interface StrategyAiResponse {
  criticalChallenge: string;
  tenPointAnalysis: TenPointAnalysis;
  pastOutcomesApplied?: string | null;
  source?: string;
}

interface CommunityStrategyLabViewProps {
  preselectedDistrict?: string | null;
  preselectedHint?: string | null;
  onClearPreselect?: () => void;
  onConvertToProgramme: (draft: CommunityProgrammeDraft) => void;
}

const DEFAULT_CRITERIA_SCORES: Record<string, number> = PREVENTION_EVALUATION_CRITERIA.reduce(
  (acc, c) => ({ ...acc, [c.id]: 3 }),
  {}
);

const LOCAL_STORAGE_IDEAS_KEY = 'clearpath_community_strategy_ideas_v1';

const TEN_POINT_LABELS: Array<{ key: keyof TenPointAnalysis; label: string }> = [
  { key: 'problemDefinition', label: '01. Problem Definition' },
  { key: 'targetPopulation', label: '02. Target Population Specificity' },
  { key: 'evidenceAlignment', label: '03. Scientific Evidence Alignment' },
  { key: 'mechanismOfChange', label: '04. Mechanism of Change' },
  { key: 'expectedOutcomesVsSpeculation', label: '05. Observable Outcomes vs. Speculation' },
  { key: 'resourceRequirements', label: '06. Resource Requirements' },
  { key: 'limitationsAndFailureRisks', label: '07. Limitations & Failure Risks' },
  { key: 'ethicalAndSafeguarding', label: '08. Ethical & Safeguarding Controls' },
  { key: 'measurableIndicators', label: '09. Measurable Indicators' },
  { key: 'evaluationPlan', label: '10. Structured Evaluation Plan' },
];

export const CommunityStrategyLabView: React.FC<CommunityStrategyLabViewProps> = ({
  preselectedDistrict,
  preselectedHint,
  onClearPreselect,
  onConvertToProgramme,
}) => {
  const { serverAuthToken, communityOrg } = useApp();

  const [ideas, setIdeas] = useState<CommunityIdeaClient[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  // Editor State
  const [title, setTitle] = useState('');
  const [focusArea, setFocusArea] = useState('School & Youth Prevention');
  const [targetPopulation, setTargetPopulation] = useState('Plus-One / Plus-Two Students (Ages 16–18)');
  const [district, setDistrict] = useState(preselectedDistrict || communityOrg?.district || 'Ernakulam');
  const [summary, setSummary] = useState(preselectedHint || '');
  const [criteriaScores, setCriteriaScores] = useState<Record<string, number>>(DEFAULT_CRITERIA_SCORES);
  const [findings, setFindings] = useState<string[]>([]);
  const [newFinding, setNewFinding] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<StrategyAiResponse | null>(null);

  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadLocalIdeas = (): CommunityIdeaClient[] => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_IDEAS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const persistLocalIdeas = (next: CommunityIdeaClient[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_IDEAS_KEY, JSON.stringify(next));
    } catch {
      // ignore quota error
    }
  };

  const fetchIdeas = useCallback(async () => {
    const localList = loadLocalIdeas();
    try {
      const res = await fetch('/api/community/ideas', {
        headers: serverAuthToken ? { Authorization: `Bearer ${serverAuthToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const serverList: CommunityIdeaClient[] = Array.isArray(data.ideas) ? data.ideas : [];
        const merged = [
          ...serverList,
          ...localList.filter(l => !serverList.some(s => s.id === l.id)),
        ];
        setIdeas(merged);
        return;
      }
    } catch {
      // fallback to local
    }
    setIdeas(localList);
  }, [serverAuthToken]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  useEffect(() => {
    if (preselectedDistrict) {
      setSelectedIdeaId(null);
      setDistrict(preselectedDistrict);
      if (preselectedHint) setSummary(preselectedHint);
      onClearPreselect?.();
    }
  }, [preselectedDistrict, preselectedHint, onClearPreselect]);

  const populateEditor = (idea: CommunityIdeaClient) => {
    setSelectedIdeaId(idea.id);
    setTitle(idea.title);
    setFocusArea(idea.focusArea);
    setTargetPopulation(idea.targetPopulation);
    setDistrict(idea.district);
    setSummary(idea.summary);
    setCriteriaScores({ ...DEFAULT_CRITERIA_SCORES, ...(idea.criteriaScores || {}) });
    setFindings(idea.findings || []);
    if (idea.aiAnalysis && (idea.aiAnalysis as { tenPointAnalysis?: TenPointAnalysis }).tenPointAnalysis) {
      setAiAnalysis(idea.aiAnalysis as unknown as StrategyAiResponse);
    } else {
      setAiAnalysis(null);
    }
    setStatusMsg(null);
    setErrorMsg(null);
  };

  const resetEditor = () => {
    setSelectedIdeaId(null);
    setTitle('');
    setFocusArea('School & Youth Prevention');
    setTargetPopulation('Plus-One / Plus-Two Students (Ages 16–18)');
    setDistrict(communityOrg?.district || 'Ernakulam');
    setSummary('');
    setCriteriaScores(DEFAULT_CRITERIA_SCORES);
    setFindings([]);
    setNewFinding('');
    setAiAnalysis(null);
    setStatusMsg(null);
    setErrorMsg(null);
  };

  const handleAddFinding = () => {
    const trimmed = newFinding.trim();
    if (!trimmed) return;
    setFindings(prev => [...prev, trimmed]);
    setNewFinding('');
  };

  const handleSaveIdea = async (e?: React.FormEvent, overrideAnalysis?: StrategyAiResponse | null) => {
    if (e) e.preventDefault();
    if (!title.trim() || !summary.trim()) {
      setErrorMsg('Please provide both an idea title and context summary before saving.');
      return null;
    }
    setSaving(true);
    setErrorMsg(null);
    setStatusMsg(null);

    const analysisToSave = overrideAnalysis !== undefined ? overrideAnalysis : aiAnalysis;
    const payload = {
      title: title.trim(),
      focusArea,
      targetPopulation: targetPopulation.trim(),
      district,
      summary: summary.trim(),
      criteriaScores,
      findings,
      aiAnalysis: analysisToSave || undefined,
    };

    try {
      if (selectedIdeaId && !selectedIdeaId.startsWith('local-idea-')) {
        const res = await fetch(`/api/community/ideas/${selectedIdeaId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(serverAuthToken ? { Authorization: `Bearer ${serverAuthToken}` } : {}),
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          const saved: CommunityIdeaClient = data.idea;
          setIdeas(prev => prev.map(i => (i.id === saved.id ? saved : i)));
          setStatusMsg('Idea updated in Strategy Lab.');
          return saved;
        }
      } else if (!selectedIdeaId) {
        const res = await fetch('/api/community/ideas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(serverAuthToken ? { Authorization: `Bearer ${serverAuthToken}` } : {}),
          },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          const saved: CommunityIdeaClient = data.idea;
          setIdeas(prev => [saved, ...prev]);
          setSelectedIdeaId(saved.id);
          setStatusMsg('Idea saved to Strategy Lab.');
          return saved;
        }
      }
    } catch {
      // fall through to local save
    } finally {
      setSaving(false);
    }

    // Local fallback persistence
    const now = new Date().toISOString();
    const localSaved: CommunityIdeaClient = {
      id: selectedIdeaId || `local-idea-${Date.now()}`,
      title: payload.title,
      focusArea: payload.focusArea,
      targetPopulation: payload.targetPopulation,
      district: payload.district,
      summary: payload.summary,
      criteriaScores: payload.criteriaScores,
      findings: payload.findings,
      aiAnalysis: analysisToSave ? (analysisToSave as unknown as Record<string, unknown>) : undefined,
      createdAt: now,
      updatedAt: now,
    };
    const nextLocal = selectedIdeaId
      ? ideas.map(i => (i.id === selectedIdeaId ? localSaved : i))
      : [localSaved, ...ideas];
    setIdeas(nextLocal);
    persistLocalIdeas(nextLocal.filter(i => i.id.startsWith('local-idea-')));
    setSelectedIdeaId(localSaved.id);
    setStatusMsg('Idea saved locally in browser workspace.');
    return localSaved;
  };

  const handleRunAiCritique = async () => {
    if (!summary.trim()) {
      setErrorMsg('Describe your prevention idea context first so the Strategy Assistant can challenge assumptions.');
      return;
    }
    setAnalyzing(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/ai/community-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'brainstorm_analysis',
          title: title.trim() || 'Community Prevention Concept',
          summary: `${summary.trim()}${findings.length > 0 ? `\nObserved Findings:\n- ${findings.join('\n- ')}` : ''}`,
          targetPopulation,
          district,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Could not evaluate strategy right now.');
      }
      const data: StrategyAiResponse = await res.json();
      setAiAnalysis(data);
      if (title.trim()) {
        await handleSaveIdea(undefined, data);
      }
      setStatusMsg('10-point critical strategy evaluation ready.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to run critical strategy check.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDeleteIdea = async (id: string) => {
    try {
      if (!id.startsWith('local-idea-')) {
        await fetch(`/api/community/ideas/${id}`, {
          method: 'DELETE',
          headers: serverAuthToken ? { Authorization: `Bearer ${serverAuthToken}` } : {},
        });
      }
    } catch {
      // ignore
    }
    const next = ideas.filter(i => i.id !== id);
    setIdeas(next);
    persistLocalIdeas(next.filter(i => i.id.startsWith('local-idea-')));
    setCompareIds(prev => prev.filter(cid => cid !== id));
    if (selectedIdeaId === id) resetEditor();
  };

  const handleConvertCurrentToProgramme = () => {
    const analysis = aiAnalysis?.tenPointAnalysis;
    const categoryMap: Record<string, CommunityProgramme['category']> = {
      'School & Youth Prevention': 'school_awareness',
      'College & Hostel Wellness': 'youth_engagement',
      'Family & Parent Circles': 'family_awareness',
      'Workplace & Rural Outreach': 'community_education',
      'Helpline & Referral Bridge': 'recovery_support',
    };

    onConvertToProgramme({
      linkedIdeaId: selectedIdeaId || undefined,
      title: title.trim() || `${district} Structured Prevention Initiative`,
      category: categoryMap[focusArea] || 'school_awareness',
      objective: analysis?.problemDefinition || summary.trim(),
      targetAudience: analysis?.targetPopulation || targetPopulation.trim(),
      district,
      settings: focusArea,
      partners: 'School/College Nodal Officers, District Vimukthi Mission (14405), PHC / Tele-MANAS (14416)',
      strategies: analysis?.mechanismOfChange || analysis?.evidenceAlignment || summary.trim(),
      safeguards:
        analysis?.ethicalAndSafeguarding ||
        'Voluntary participation, zero shaming or labelling, confidential referral to 14405 / 14416 / 1056.',
      indicators:
        analysis?.measurableIndicators ||
        'Pre/post knowledge clarity shift, helpline awareness recall, and qualitative barrier notes.',
      evaluationPlan:
        analysis?.evaluationPlan ||
        'Anonymous 5-item baseline check before Session 1, immediate post-session check, and 30-day review.',
      timeline: '4-week structured rollout with pre/post review',
      requiredResources:
        analysis?.resourceRequirements ||
        'Trained facilitator, bilingual visual cards, confidential helpline slips (14405 / 14416).',
      potentialRisks:
        analysis?.limitationsAndFailureRisks ||
        'Guard against curiosity rebound, exam-week scheduling conflicts, and involuntary participation.',
      expectedOutcomes:
        analysis?.expectedOutcomesVsSpeculation ||
        'Measurable improvement in refusal confidence and accurate helpline recall.',
    });
  };

  const totalRubricScore = PREVENTION_EVALUATION_CRITERIA.reduce(
    (sum, c) => sum + (Number(criteriaScores[c.id]) || 0),
    0
  );
  const maxRubricScore = PREVENTION_EVALUATION_CRITERIA.reduce((sum, c) => sum + c.maxScore, 0);

  const toggleCompare = (id: string) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const comparedIdeas = ideas.filter(i => compareIds.includes(i.id));

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-800 uppercase tracking-wider">
            <Brain className="w-4 h-4" />
            <span>Community Brainstorming &amp; Critical Strategy Lab</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-balance">
            Test Prevention Concepts Before Launching Field Drives
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Document observations, score concepts across 9 prevention-design criteria, run a critical 10-point AI challenge, compare ideas side-by-side, and convert strong concepts directly into a 12-field programme.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {compareIds.length >= 2 && (
            <button
              type="button"
              onClick={() => setShowCompare(!showCompare)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-teal-700 bg-teal-50 text-teal-950 text-xs font-bold cursor-pointer whitespace-nowrap"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>{showCompare ? 'Hide Comparison' : `Compare (${compareIds.length})`}</span>
            </button>
          )}
          <button
            type="button"
            onClick={resetEditor}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-900 hover:bg-teal-950 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Concept</span>
          </button>
        </div>
      </header>

      {/* Side-by-Side Comparison Matrix */}
      {showCompare && comparedIdeas.length >= 2 && (
        <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-extrabold text-slate-900">
              Side-by-Side Concept Comparison
            </h2>
            <button
              type="button"
              onClick={() => setShowCompare(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Criterion / Attribute</th>
                  {comparedIdeas.map(ci => (
                    <th key={ci.id} className="px-4 py-3 text-slate-900">
                      {ci.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600">District &amp; Focus</td>
                  {comparedIdeas.map(ci => (
                    <td key={ci.id} className="px-4 py-3 text-slate-800">
                      {ci.district} · {ci.focusArea}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600">Target Group</td>
                  {comparedIdeas.map(ci => (
                    <td key={ci.id} className="px-4 py-3 text-slate-800">
                      {ci.targetPopulation}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600">9-Criteria Self-Rating</td>
                  {comparedIdeas.map(ci => {
                    const tot = PREVENTION_EVALUATION_CRITERIA.reduce(
                      (s, c) => s + (Number(ci.criteriaScores?.[c.id]) || 0),
                      0
                    );
                    return (
                      <td key={ci.id} className="px-4 py-3 font-mono tabular-nums font-bold text-teal-900">
                        {tot} / {maxRubricScore}
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600">Field Findings</td>
                  {comparedIdeas.map(ci => (
                    <td key={ci.id} className="px-4 py-3 text-slate-700">
                      {ci.findings?.length || 0} recorded observations
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-slate-600">AI Challenge Note</td>
                  {comparedIdeas.map(ci => {
                    const aiObj = ci.aiAnalysis as { criticalChallenge?: string } | undefined;
                    return (
                      <td key={ci.id} className="px-4 py-3 text-slate-700 leading-relaxed">
                        {aiObj?.criticalChallenge || 'Not evaluated yet'}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Main Split Grid: Left Saved Concepts | Right Workspace & AI Critique */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 4 Cols: Saved Concepts */}
        <aside className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h2 className="text-sm font-extrabold text-slate-900">
                Saved Strategy Ideas ({ideas.length})
              </h2>
              <span className="text-[11px] text-slate-500">Select up to 3 to compare</span>
            </div>

            {ideas.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">
                No strategy concepts saved yet. Draft an idea on the right to evaluate its feasibility, safeguards, and indicators.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                {ideas.map(idea => {
                  const isSelected = idea.id === selectedIdeaId;
                  const isCompared = compareIds.includes(idea.id);
                  const scoreSum = PREVENTION_EVALUATION_CRITERIA.reduce(
                    (s, c) => s + (Number(idea.criteriaScores?.[c.id]) || 0),
                    0
                  );
                  return (
                    <div
                      key={idea.id}
                      className={`p-3.5 rounded-2xl border transition-colors space-y-2 ${
                        isSelected
                          ? 'bg-teal-50/70 border-teal-700'
                          : 'bg-slate-50/70 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => populateEditor(idea)}
                          className="text-left flex-1 min-w-0 cursor-pointer"
                        >
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {idea.title}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                            {idea.district} · <span className="font-mono tabular-nums">{scoreSum}/{maxRubricScore}</span>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteIdea(idea.id)}
                          title="Delete concept"
                          className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                        <label className="inline-flex items-center gap-1.5 text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isCompared}
                            onChange={() => toggleCompare(idea.id)}
                            className="rounded border-slate-300 text-teal-800"
                          />
                          <span>Compare</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => populateEditor(idea)}
                          className="font-semibold text-teal-800 hover:underline cursor-pointer"
                        >
                          Open &amp; Critique
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Right 8 Cols: Idea Workspace + 9-Criteria Scoring + AI Critical Assistant */}
        <div className="lg:col-span-8 space-y-6">
          <form
            onSubmit={e => handleSaveIdea(e)}
            className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-slate-900">
                {selectedIdeaId ? 'Refine Strategy Concept' : 'Draft New Prevention Concept'}
              </h2>
              <div className="text-xs font-mono tabular-nums text-teal-900 font-bold">
                Self-Review Rubric: {totalRubricScore} / {maxRubricScore}
              </div>
            </div>

            {(errorMsg || statusMsg) && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  errorMsg
                    ? 'bg-rose-50 border border-rose-200 text-rose-900'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                }`}
              >
                {errorMsg ? (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span>{errorMsg || statusMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Concept Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. First-Year Hostel Evening Sports & Peer Mentor Bridge"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Focus Setting
                </label>
                <select
                  value={focusArea}
                  onChange={e => setFocusArea(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-teal-700"
                >
                  <option value="School & Youth Prevention">School &amp; Youth Prevention</option>
                  <option value="College & Hostel Wellness">College &amp; Hostel Wellness</option>
                  <option value="Family & Parent Circles">Family &amp; Parent Circles</option>
                  <option value="Workplace & Rural Outreach">Workplace &amp; Rural Outreach</option>
                  <option value="Helpline & Referral Bridge">Helpline &amp; Referral Bridge</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Specific Target Group
                </label>
                <input
                  type="text"
                  value={targetPopulation}
                  onChange={e => setTargetPopulation(e.target.value)}
                  placeholder="e.g. First-year polytechnic hostel students (18–20)"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  District
                </label>
                <select
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-teal-700"
                >
                  {KERALA_DISTRICTS.map(d => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Problem Context &amp; Proposed Intervention *
              </label>
              <textarea
                rows={3}
                required
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="Describe the concrete problem you noticed, why standard lectures fall short, and how this idea works in practice..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
              />
            </div>

            {/* Field Observations / Findings */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Local Observations &amp; Stakeholder Findings
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newFinding}
                  onChange={e => setNewFinding(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFinding();
                    }
                  }}
                  placeholder="e.g. Parents hesitated to ask about 14405 fearing police reporting..."
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                />
                <button
                  type="button"
                  onClick={handleAddFinding}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer shrink-0"
                >
                  Add Finding
                </button>
              </div>
              {findings.length > 0 && (
                <ul className="space-y-1.5 pt-1">
                  {findings.map((f, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700"
                    >
                      <span>{f}</span>
                      <button
                        type="button"
                        onClick={() => setFindings(prev => prev.filter((_, i) => i !== idx))}
                        className="text-slate-400 hover:text-rose-600 cursor-pointer shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 9-Criteria Feasibility & Safeguard Self-Check */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900">
                    9-Criteria Prevention Feasibility &amp; Ethics Check
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Self-assessment checklist (1 = weak/missing, 5 = clearly built in). Guides design quality; not an efficacy proof.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PREVENTION_EVALUATION_CRITERIA.map(c => {
                  const val = criteriaScores[c.id] || 3;
                  return (
                    <div key={c.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-slate-900">{c.label}</span>
                        <span className="font-mono tabular-nums font-bold text-teal-900">
                          {val}/{c.maxScore}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-snug">{c.question}</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(num => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setCriteriaScores(prev => ({ ...prev, [c.id]: num }))}
                            className={`flex-1 py-1 rounded-lg text-[11px] font-mono font-bold cursor-pointer transition-colors ${
                              val === num
                                ? 'bg-teal-900 text-white'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Concept'}</span>
              </button>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleRunAiCritique}
                  disabled={analyzing}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-bold cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{analyzing ? 'Critiquing Strategy...' : 'Run 10-Point AI Critical Check'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleConvertCurrentToProgramme}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold cursor-pointer"
                >
                  <span>Convert to 12-Field Programme</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>

          {/* AI 10-Point Critical Output */}
          {aiAnalysis && (
            <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">
                    Critical Strategy Evaluation (10-Point Design Check)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Challenges weak assumptions and separates observable indicators from long-term speculation.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleConvertCurrentToProgramme}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-900 hover:bg-teal-950 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                >
                  <span>Use This Analysis in Programme Builder</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {aiAnalysis.pastOutcomesApplied && (
                <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-950 space-y-1">
                  <div className="font-bold">Informed by Real Past Field Outcomes (k &ge; 5)</div>
                  <p className="leading-relaxed">{aiAnalysis.pastOutcomesApplied}</p>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
                <div className="font-bold">Primary Critical Challenge</div>
                <p className="leading-relaxed">{aiAnalysis.criticalChallenge}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {TEN_POINT_LABELS.map(item => (
                  <div key={item.key} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <div className="font-bold text-slate-900">{item.label}</div>
                    <p className="text-slate-700 leading-relaxed">
                      {aiAnalysis.tenPointAnalysis?.[item.key] || 'Not specified'}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
