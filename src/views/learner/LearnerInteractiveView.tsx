import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LEARNER_SCENARIOS, LEARNER_MYTHS_FACTS } from '../../constants/learnerData';
import { RedHelpDot } from '../../components/RedHelpDot';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  RotateCcw,
  BookOpen,
  ShieldCheck,
  Loader2,
  Target,
  ArrowRight,
} from 'lucide-react';

interface LearnerInteractiveViewProps {
  onSelectTab?: (tab: string) => void;
}

interface AiLearnAnalysis {
  consequenceExplanation: string;
  actionChallenge: string;
}

export const LearnerInteractiveView: React.FC<LearnerInteractiveViewProps> = ({ onSelectTab }) => {
  const { savedScenarioAttempts, saveScenarioAttempt, language } = useApp();

  const [activeTab, setActiveTab] = useState<'scenarios' | 'myths' | 'refusal'>('scenarios');

  // Scenario state
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(LEARNER_SCENARIOS[0].id);
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState<number | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AiLearnAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const activeScenario = LEARNER_SCENARIOS.find(s => s.id === selectedScenarioId) || LEARNER_SCENARIOS[0];

  const [revealedMyths, setRevealedMyths] = useState<Record<string, boolean>>({});
  const toggleRevealMyth = (id: string) => {
    setRevealedMyths(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const [refusalDilemma, setRefusalDilemma] = useState<'vape' | 'drink' | 'pill' | 'late_party'>('vape');

  const REFUSAL_SCRIPTS = {
    vape: {
      delay: '"Not right now, I have to finish this lab submission before 5 PM."',
      deflect: '"Nah, my throat has been scratchy all week. Did you hear if the math quiz is rescheduled?"',
      decide: '"No thanks, I don\'t vape. I\'m running track trials this Saturday and need my lungs clean."',
      depart: '"I\'m going to walk over to the canteen for a cold juice. Catch you in class."',
    },
    drink: {
      delay: '"Let me grab something to eat first, my stomach is completely empty."',
      deflect: '"I\'m sticking with ginger soda tonight. Cheers though!"',
      decide: '"I don\'t drink. I promised my family I\'d drive early morning."',
      depart: '"I need to step outside for some fresh air and take a call. See you inside."',
    },
    pill: {
      delay: '"I want to check what ingredients are inside first before taking anything."',
      deflect: '"No thanks, stimulants make my heart race. I\'ll stick to water and coffee."',
      decide: '"I never take unprescribed pills. Too risky for heart and focus."',
      depart: '"I\'m taking a 20-minute power nap instead. Works much better for memory."',
    },
    late_party: {
      delay: '"Give me 10 minutes to wrap up here, then I have to plan my ride."',
      deflect: '"Looks fun, but hostel gate locks soon so I can\'t risk it!"',
      decide: '"Heading home now—I need proper sleep before tomorrow morning."',
      depart: '"My ride is waiting outside right now. Goodnight everyone!"',
    },
  };

  const handleMakeChoice = async (idx: number) => {
    setSelectedChoiceIdx(idx);
    setAiAnalysis(null);
    saveScenarioAttempt(activeScenario.id, idx);

    setAiLoading(true);
    try {
      const chosenOpt = activeScenario.options[idx];
      const res = await fetch('/api/ai/learn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: activeScenario.category,
          scenario: activeScenario.title,
          choice: chosenOpt.text,
          language,
        }),
      });
      if (res.ok) {
        const data: AiLearnAnalysis = await res.json();
        setAiAnalysis(data);
      }
    } catch {
      // Fall back smoothly to curated rationale already shown on card
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-md">
              Prevention Decision Simulator
            </span>
            <RedHelpDot role="learner" tabKey="interactive" compact />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Decision Scenarios &amp; Skill Practice
          </h1>
          <p className="editorial-subtitle text-slate-600 mt-1.5 max-w-2xl">
            Rehearse real peer-pressure dilemmas, inspect AI consequence breakdowns, debunk myths, and master 4D refusal phrasing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('scenarios')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'scenarios'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Scenarios ({LEARNER_SCENARIOS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('myths')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'myths'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Myth vs Fact ({LEARNER_MYTHS_FACTS.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('refusal')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'refusal'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>4D Refusal Builder</span>
          </button>
        </div>
      </div>

      {/* TAB 1: DECISION SIMULATOR */}
      {activeTab === 'scenarios' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {LEARNER_SCENARIOS.map(s => {
              const isSelected = s.id === activeScenario.id;
              const isAttempted = !!savedScenarioAttempts[s.id];

              return (
                <button
                  key={s.id}
                  onClick={() => {
                    setSelectedScenarioId(s.id);
                    setSelectedChoiceIdx(null);
                    setAiAnalysis(null);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-700 ring-2 ring-indigo-600/20'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-slate-400 uppercase text-[10px]">
                      {s.category.replace('_', ' ')}
                    </span>
                    {isAttempted && (
                      <span className="text-[10px] font-bold text-indigo-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Practiced
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{s.title}</h3>
                </button>
              );
            })}
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded">
                Interactive Branch
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">{activeScenario.title}</h2>
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <p className="prose-readable font-medium text-slate-800">{activeScenario.situation}</p>
                <p className="prose-readable-sm text-slate-600 italic">{activeScenario.context}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="editorial-kicker text-slate-500">
                Choose how you respond:
              </h3>
              {activeScenario.options.map((opt, idx) => {
                const isSelected = selectedChoiceIdx === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleMakeChoice(idx)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                      isSelected
                        ? opt.isConstructive
                          ? 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20 text-indigo-950 font-bold'
                          : 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/20 text-rose-950 font-bold'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0 mt-0.5">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="prose-readable-sm">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {selectedChoiceIdx !== null && (
              <div className="space-y-5 pt-4 border-t border-slate-100">
                <div
                  className={`p-6 rounded-2xl border space-y-3.5 ${
                    activeScenario.options[selectedChoiceIdx].isConstructive
                      ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950'
                      : 'bg-rose-50/80 border-rose-200 text-rose-950'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide">
                    {activeScenario.options[selectedChoiceIdx].isConstructive ? (
                      <CheckCircle2 className="w-4 h-4 text-indigo-700" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    )}
                    <span>
                      {activeScenario.options[selectedChoiceIdx].isConstructive
                        ? 'Safe & Assertive Outcome'
                        : 'Risky or Escalating Outcome'}
                    </span>
                  </div>
                  <p className="prose-readable font-medium">
                    {activeScenario.options[selectedChoiceIdx].outcome}
                  </p>
                  <p className="prose-readable-sm pt-3 border-t border-slate-200/60">
                    <strong>Neurobiology / Social Impact:</strong>{' '}
                    {activeScenario.options[selectedChoiceIdx].scientificReasoning}
                  </p>
                  <div className="p-4 rounded-xl bg-white/80 border border-slate-200/70 prose-readable-sm flex items-start gap-2.5">
                    <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-1" />
                    <span>{activeScenario.options[selectedChoiceIdx].followUpTip}</span>
                  </div>
                </div>

                {/* Live Gemini AI Consequence Explainer */}
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 text-white space-y-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      ClearPath AI Consequence Explainer
                    </span>
                    {aiLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />}
                  </div>
                  {aiLoading ? (
                    <p className="prose-readable-sm text-slate-300">Analyzing cognitive &amp; social impact...</p>
                  ) : aiAnalysis ? (
                    <div className="space-y-2">
                      <p className="prose-readable text-slate-100">{aiAnalysis.consequenceExplanation}</p>
                      <p className="prose-readable-sm text-amber-300 font-semibold">
                        Action Challenge: {aiAnalysis.actionChallenge}
                      </p>
                    </div>
                  ) : (
                    <p className="prose-readable-sm text-slate-300">Select any choice above to inspect deeper science reasoning.</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedChoiceIdx(null);
                      setAiAnalysis(null);
                    }}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Try Another Path</span>
                  </button>

                  {onSelectTab && (
                    <button
                      onClick={() => onSelectTab('missions')}
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>Turn into ClearPath Mission</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MYTH VS FACT */}
      {activeTab === 'myths' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LEARNER_MYTHS_FACTS.map(mf => {
            const isRevealed = !!revealedMyths[mf.id];
            return (
              <div
                key={mf.id}
                onClick={() => toggleRevealMyth(mf.id)}
                className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isRevealed
                    ? mf.isFact
                      ? 'bg-indigo-50/70 border-indigo-300'
                      : 'bg-rose-50/70 border-rose-300'
                    : 'bg-white border-slate-200 hover:border-indigo-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {mf.category}
                    </span>
                    {isRevealed ? (
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          mf.isFact ? 'bg-indigo-100 text-indigo-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {mf.verdict}
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md">
                        Tap to Fact Check
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2.5 leading-snug">&ldquo;{mf.claim}&rdquo;</h3>
                  {isRevealed && (
                    <div className="space-y-2.5 pt-3 border-t border-slate-200/60">
                      <p className="prose-readable-sm text-slate-700">{mf.detailedExplanation}</p>
                      <div className="text-xs text-slate-500 italic">Source: {mf.evidenceSource}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: 4D REFUSAL BUILDER */}
      {activeTab === 'refusal' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded">
              Refusal Framework
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              The 4D Assertive Communication Toolkit
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'vape', label: 'Vape / E-Cig' },
              { id: 'drink', label: 'Alcohol Pressure' },
              { id: 'pill', label: 'Unlabeled Pills' },
              { id: 'late_party', label: 'Unsafe Event' },
            ].map(d => (
              <button
                key={d.id}
                onClick={() => setRefusalDilemma(d.id as 'vape' | 'drink' | 'pill' | 'late_party')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  refusalDilemma === d.id
                    ? 'bg-blue-900 text-white border-indigo-950'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { step: '1. DELAY', hint: 'Buys thinking time', line: REFUSAL_SCRIPTS[refusalDilemma].delay },
              { step: '2. DEFLECT', hint: 'Pivots conversation', line: REFUSAL_SCRIPTS[refusalDilemma].deflect },
              { step: '3. DECIDE', hint: 'Firm personal rule', line: REFUSAL_SCRIPTS[refusalDilemma].decide },
              { step: '4. DEPART', hint: 'Smooth physical exit', line: REFUSAL_SCRIPTS[refusalDilemma].depart },
            ].map(item => (
              <div key={item.step} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-indigo-800">{item.step}</span>
                  <span className="text-slate-500 font-normal">{item.hint}</span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-slate-200 prose-readable-sm font-semibold text-slate-800 italic">
                  {item.line}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
