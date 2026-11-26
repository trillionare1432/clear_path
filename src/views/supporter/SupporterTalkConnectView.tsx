import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  Sparkles,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Loader2,
  Send,
  PhoneCall,
  Pill,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react';
import { CONVERSATION_GUIDES, CONVERSATION_PRACTICE_SCENARIOS } from '../../constants/initialData';
import { RedHelpDot } from '../../components/RedHelpDot';
import { SubstanceIdentificationPanel } from '../../components/SubstanceIdentificationPanel';
import { SubstanceConcernRecord } from '../../types';
import { SCOPED_STORAGE_KEYS, readScopedJson, writeScopedJson } from '../../utils/vaultStorage';

interface AiCoachResult {
  openingLine: string;
  avoidSaying: string;
  nextAction: string;
  source?: string;
}

export const SupporterTalkConnectView: React.FC = () => {
  const {
    vaultScope,
    sharedSupporterItems,
    savedConversationPlans,
    saveConversationPlan,
    deleteConversationPlan,
    language,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'coach' | 'planner' | 'practice' | 'saved'>('coach');
  const [showSubstanceClarifier, setShowSubstanceClarifier] = useState(false);
  const [supporterConcerns, setSupporterConcerns] = useState<SubstanceConcernRecord[]>(() =>
    readScopedJson<SubstanceConcernRecord[]>(vaultScope, SCOPED_STORAGE_KEYS.SUPPORTER_SUBSTANCE_CONTEXT, [])
  );

  useEffect(() => {
    setSupporterConcerns(
      readScopedJson<SubstanceConcernRecord[]>(vaultScope, SCOPED_STORAGE_KEYS.SUPPORTER_SUBSTANCE_CONTEXT, [])
    );
  }, [vaultScope]);

  const handleUpsertSupporterConcern = (rec: SubstanceConcernRecord) => {
    setSupporterConcerns(prev => {
      const idx = prev.findIndex(p => p.id === rec.id);
      const next = idx >= 0 ? prev.map(p => (p.id === rec.id ? rec : p)) : [rec, ...prev];
      writeScopedJson(vaultScope, SCOPED_STORAGE_KEYS.SUPPORTER_SUBSTANCE_CONTEXT, next);
      return next;
    });
  };

  const handleRemoveSupporterConcern = (id: string) => {
    setSupporterConcerns(prev => {
      const next = prev.filter(p => p.id !== id);
      writeScopedJson(vaultScope, SCOPED_STORAGE_KEYS.SUPPORTER_SUBSTANCE_CONTEXT, next);
      return next;
    });
  };

  // AI Coach state
  const [relationship, setRelationship] = useState('Parent / Guardian');
  const [situationInput, setSituationInput] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachResult, setCoachResult] = useState<AiCoachResult | null>(null);
  const [coachSavedNotice, setCoachSavedNotice] = useState(false);

  // Planner State
  const [selectedGuideId, setSelectedGuideId] = useState<string>(CONVERSATION_GUIDES[0]?.id || 'guide-express-concern');
  const [customNotes, setCustomNotes] = useState('');
  const [planSavedNotice, setPlanSavedNotice] = useState(false);

  // Practice State
  const [activeScenarioIdx, setActiveScenarioIdx] = useState<number>(0);
  const [selectedResponseIdx, setSelectedResponseIdx] = useState<number | null>(null);

  const activeGuide = CONVERSATION_GUIDES.find(g => g.id === selectedGuideId) || CONVERSATION_GUIDES[0];
  const activeScenario = CONVERSATION_PRACTICE_SCENARIOS[activeScenarioIdx] || CONVERSATION_PRACTICE_SCENARIOS[0];

  const handleAskCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!situationInput.trim()) return;
    setCoachLoading(true);
    try {
      const res = await fetch('/api/ai/supporter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relationship,
          situation: situationInput.trim(),
          language,
        }),
      });
      const data: AiCoachResult = await res.json();
      setCoachResult(data);
    } finally {
      setCoachLoading(false);
    }
  };

  const handleSaveCoachScript = () => {
    if (!coachResult) return;
    saveConversationPlan({
      title: `AI Coach: ${relationship}`,
      situation: situationInput.trim() || 'Custom Supporter Situation',
      chosenOpeningLine: coachResult.openingLine,
      plannedQuestions: [coachResult.nextAction],
      notes: `Avoid: ${coachResult.avoidSaying}`,
    });
    setCoachSavedNotice(true);
    setTimeout(() => setCoachSavedNotice(false), 3000);
  };

  const handleSavePlan = () => {
    if (!activeGuide) return;
    saveConversationPlan({
      title: activeGuide.situation,
      situation: activeGuide.situation,
      chosenOpeningLine: activeGuide.openingLine,
      plannedQuestions: activeGuide.questions,
      notes: customNotes.trim() || undefined,
    });
    setCustomNotes('');
    setPlanSavedNotice(true);
    setTimeout(() => setPlanSavedNotice(false), 3000);
  };

  const handleNextScenario = () => {
    setSelectedResponseIdx(null);
    setActiveScenarioIdx(prev => (prev < CONVERSATION_PRACTICE_SCENARIOS.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">
            <MessageSquare className="w-4 h-4 text-amber-600" />
            <span>Constructive Communication</span>
            <RedHelpDot role="supporter" tabKey="talk" compact />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Talk Coach &amp; Conversation Prep
          </h1>
          <p className="editorial-subtitle text-slate-600 mt-1.5 max-w-2xl">
            Gemini AI compassionate phrasing coach, practical frameworks, and simulated practice so talks invite honesty instead of defensiveness.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start sm:self-auto">
          {[
            { id: 'coach', label: 'AI Talk Coach' },
            { id: 'planner', label: 'Frameworks' },
            { id: 'practice', label: 'Roleplay Simulator' },
            { id: 'saved', label: `Saved (${savedConversationPlans.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'coach' | 'planner' | 'practice' | 'saved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-white text-indigo-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 0: AI COMPASSIONATE COMMUNICATION COACH */}
      {activeTab === 'coach' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#9A3412] text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                Compassionate Communication Coach (Gemini AI)
              </h2>
              <p className="prose-readable-sm text-slate-600 mt-0.5">
                Describe the moment safely—no real names needed—and receive a non-shaming opening line and boundary tip.
              </p>
            </div>
          </div>

          <form onSubmit={handleAskCoach} className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['Parent / Guardian', 'Close Friend', 'Partner / Spouse', 'Teacher / Mentor'].map(rel => (
                <button
                  key={rel}
                  type="button"
                  onClick={() => setRelationship(rel)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    relationship === rel
                      ? 'bg-[#9A3412] text-white border-indigo-950'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {rel}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={situationInput}
              onChange={e => setSituationInput(e.target.value)}
              placeholder="e.g. They have been locking their room after late nights and get angry whenever anyone brings up college or sleep..."
              className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {[
                  'Refuses to admit anything is wrong',
                  'Worried about exam stress & hidden substance use',
                  'Asking gently about visiting a doctor',
                ].map(sample => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => setSituationInput(sample)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-[11px] font-medium text-slate-700 cursor-pointer"
                  >
                    {sample}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={coachLoading || !situationInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer"
              >
                {coachLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{coachLoading ? 'Preparing Script...' : 'Coach Me Now'}</span>
              </button>
            </div>
          </form>

          {coachResult && (
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                  Suggested Opening Line
                </span>
                <p className="text-sm sm:text-base font-bold text-slate-900 italic">
                  {coachResult.openingLine}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-900">
                    Avoid Saying Right Now
                  </span>
                  <p className="prose-readable text-rose-950">{coachResult.avoidSaying}</p>
                </div>
                <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-200 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
                    Calm Next Step
                  </span>
                  <p className="prose-readable text-indigo-950">{coachResult.nextAction}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {coachSavedNotice ? (
                  <span className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Saved to your private conversation plans
                  </span>
                ) : (
                  <span />
                )}
                <button
                  onClick={handleSaveCoachScript}
                  className="px-4 py-2 rounded-xl bg-[#9A3412] hover:bg-indigo-900 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save Script to My Plans</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: CONVERSATION PLANNER */}
      {activeTab === 'planner' && (
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Step 1: Select Your Family Situation ({CONVERSATION_GUIDES.length} Guides)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {CONVERSATION_GUIDES.map(guide => (
                <button
                  key={guide.id}
                  type="button"
                  onClick={() => setSelectedGuideId(guide.id)}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    selectedGuideId === guide.id
                      ? 'bg-white border-indigo-800 shadow-xs ring-2 ring-indigo-500/20'
                      : 'bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900 line-clamp-1">{guide.situation}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{guide.purpose}</div>
                </button>
              ))}
            </div>
          </div>

          {activeGuide && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                <div>
                  <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-100 uppercase tracking-wider">
                    Guided Framework
                  </span>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1.5">{activeGuide.situation}</h2>
                  <p className="prose-readable-sm text-slate-600 mt-1">{activeGuide.purpose}</p>
                </div>

                <button
                  onClick={handleSavePlan}
                  className="px-4 py-2 bg-[#9A3412] hover:bg-indigo-900 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 self-start sm:self-auto transition-colors cursor-pointer"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save to My Plans</span>
                </button>
              </div>

              {planSavedNotice && (
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-semibold text-indigo-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-700" />
                  <span>Conversation plan saved to your private workspace.</span>
                </div>
              )}

              <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2.5">
                <div className="flex items-center gap-2 editorial-kicker text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>Tested Opening Line</span>
                </div>
                <p className="prose-readable font-semibold text-slate-900 italic">
                  {activeGuide.openingLine}
                </p>
                <p className="prose-readable-sm text-amber-950 pt-0.5">
                  Deliver this in a neutral, unhurried moment.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="editorial-kicker text-slate-700">
                  Respectful Questions to Keep Dialogue Open
                </h3>
                {activeGuide.questions.map((q, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-start gap-3 prose-readable-sm text-slate-800">
                    <span className="font-bold text-amber-800 mt-0.5">Q{i + 1}:</span>
                    <span className="font-medium">{q}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                  <div className="editorial-kicker text-indigo-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-indigo-700" />
                    <span>Helpful Approaches</span>
                  </div>
                  <ul className="space-y-2.5">
                    {activeGuide.approaches.map((app, i) => (
                      <li key={i} className="prose-readable-sm text-slate-800 flex items-start gap-2.5">
                        <span className="text-indigo-700 font-bold">✓</span>
                        <span>{app}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-3">
                  <div className="editorial-kicker text-rose-900 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-700" />
                    <span>Things to Avoid</span>
                  </div>
                  <ul className="space-y-2.5">
                    {activeGuide.thingsToAvoid.map((avoid, i) => (
                      <li key={i} className="prose-readable-sm text-slate-800 flex items-start gap-2.5">
                        <span className="text-rose-600 font-bold">✕</span>
                        <span>{avoid}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Personal Preparation Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={customNotes}
                  onChange={e => setCustomNotes(e.target.value)}
                  placeholder="Write down a calm reminder before starting this conversation..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-700"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRACTICE SIMULATOR */}
      {activeTab === 'practice' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-100 uppercase tracking-wider">
                Scenario {activeScenarioIdx + 1} of {CONVERSATION_PRACTICE_SCENARIOS.length}
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">{activeScenario.title}</h2>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
            <span className="editorial-kicker text-amber-900">
              Situation
            </span>
            <p className="prose-readable font-semibold text-slate-900 italic">
              &ldquo;{activeScenario.context}&rdquo;
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="editorial-kicker text-slate-600">
              How would you respond?
            </h3>
            {activeScenario.options.map((opt, i) => {
              const isSelected = selectedResponseIdx === i;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedResponseIdx(i)}
                  className={`w-full p-4 rounded-2xl border text-left prose-readable-sm font-medium transition-all cursor-pointer ${
                    isSelected
                      ? opt.isConstructive
                        ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20 text-indigo-950 font-bold'
                        : 'bg-rose-50 border-rose-500 ring-2 ring-rose-400/20 text-rose-950 font-bold'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  &ldquo;{opt.text}&rdquo;
                </button>
              );
            })}
          </div>

          {selectedResponseIdx !== null && (
            <div
              className={`p-6 rounded-2xl border space-y-3 ${
                activeScenario.options[selectedResponseIdx].isConstructive
                  ? 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                {activeScenario.options[selectedResponseIdx].isConstructive ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-indigo-700" />
                    <span>Constructive Communication Response</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-700" />
                    <span>Notice the Emotional Impact</span>
                  </>
                )}
              </div>
              <p className="prose-readable">
                {activeScenario.options[selectedResponseIdx].feedback}
              </p>
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleNextScenario}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Next Scenario &rarr;
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SAVED CONVERSATION PLANS */}
      {activeTab === 'saved' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Saved Conversation Plans</h2>
              <p className="text-xs text-slate-500">Your tailored scripts stored in private browser storage</p>
            </div>
            <button
              onClick={() => setActiveTab('coach')}
              className="text-xs font-bold text-indigo-800 hover:text-indigo-950 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Use AI Coach</span>
            </button>
          </div>

          {savedConversationPlans.length > 0 ? (
            <div className="space-y-4">
              {savedConversationPlans.map(plan => (
                <div key={plan.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                        {plan.situation}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 mt-0.5">{plan.title}</h3>
                    </div>
                    <button
                      onClick={() => deleteConversationPlan(plan.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Delete plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-slate-200/80 prose-readable-sm italic text-slate-800">
                    &ldquo;{plan.chosenOpeningLine}&rdquo;
                  </div>
                  {plan.notes && (
                    <div className="prose-readable-sm text-slate-600">
                      <strong className="text-slate-800">Notes:</strong> {plan.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Bookmark className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-500 mb-3">No saved conversation plans yet.</p>
              <button
                onClick={() => setActiveTab('coach')}
                className="px-4 py-2 bg-[#9A3412] hover:bg-indigo-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Try AI Talk Coach
              </button>
            </div>
          )}
        </div>
      )}

      {/* Shared From Personal Journey (Consent-Scoped Bridge) */}
      {sharedSupporterItems.length > 0 && (
        <section className="bg-amber-50/60 border border-amber-200 rounded-3xl p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-950">
            <ShieldCheck className="w-4 h-4 text-amber-700" />
            <span>Items Explicitly Shared With You ({sharedSupporterItems.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {sharedSupporterItems.map(item => (
              <div key={item.id} className="p-3 rounded-2xl bg-white border border-amber-200 text-xs space-y-1">
                <div className="font-bold text-slate-900">{item.title}</div>
                <div className="text-slate-600">{item.detail}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Role 02 Isolated Substance / Medicine Context Clarifier */}
      <section className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <button
          type="button"
          onClick={() => setShowSubstanceClarifier(v => !v)}
          className="w-full px-6 py-4 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
              <Pill className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-slate-900">
                Clarify Substance or Medicine Concern (Private Supporter Notes)
                {supporterConcerns.length > 0 && (
                  <span className="ml-2 text-xs font-bold text-amber-800">
                    · {supporterConcerns.length} saved
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 truncate">
                Optional clinical catalogue lookup stored strictly in your Supporter workspace—never modifies anyone else&apos;s records.
              </p>
            </div>
          </div>
          {showSubstanceClarifier ? (
            <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
          )}
        </button>
        {showSubstanceClarifier && (
          <div className="p-6 pt-2 border-t border-slate-100">
            <SubstanceIdentificationPanel
              concerns={supporterConcerns}
              onUpsertConcern={handleUpsertSupporterConcern}
              onRemoveConcern={handleRemoveSupporterConcern}
              compactHeader
              supporterContext
            />
          </div>
        )}
      </section>

      {/* Safety & Clinical Escalation Boundary */}
      <section className="p-5 rounded-3xl bg-rose-50/70 border border-rose-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-rose-900">
            <AlertCircle className="w-4 h-4 text-rose-700" />
            <span>When Conversation Guides Are Not Enough (Safety Boundary)</span>
          </div>
          <p className="text-xs text-rose-950 leading-relaxed">
            Do not attempt serious talks during severe intoxication, acute withdrawal symptoms (tremors, confusion, seizures), medical emergency, self-harm risk, or household danger. Call trained support or emergency services immediately.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href="tel:14405"
            className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-extrabold inline-flex items-center gap-1.5 tabular-nums"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Vimukthi 14405</span>
          </a>
          <a
            href="tel:112"
            className="px-4 py-2 rounded-xl bg-white border border-rose-300 text-rose-900 hover:bg-rose-100 text-xs font-extrabold inline-flex items-center gap-1.5 tabular-nums"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Emergency 112</span>
          </a>
        </div>
      </section>
    </div>
  );
};
