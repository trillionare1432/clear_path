import React, { useState, useMemo, useEffect } from 'react';
import {
  VERIFIED_SUBSTANCES_18_PLUS,
  SubstanceScienceProfile,
} from '../constants/substances18Plus';
import { useApp } from '../context/AppContext';
import {
  SCOPED_STORAGE_KEYS,
  readScopedString,
  writeScopedString,
  removeScopedKey,
} from '../utils/vaultStorage';
import {
  FlaskConical,
  Search,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Brain,
  Activity,
  PhoneCall,
  Loader2,
  Lock,
  CheckCircle2,
  BookOpen,
  MessageCircle,
} from 'lucide-react';

export const SubstanceResearchPanel: React.FC = () => {
  const { language, vaultScope, openAiAssistant } = useApp();

  const [isAdultVerified, setIsAdultVerified] = useState<boolean>(
    () => readScopedString(vaultScope, SCOPED_STORAGE_KEYS.AGE18_VERIFIED) === '1'
  );

  useEffect(() => {
    setIsAdultVerified(
      readScopedString(vaultScope, SCOPED_STORAGE_KEYS.AGE18_VERIFIED) === '1'
    );
    setUnderAgeBlocked(false);
    setBirthYearInput('');
    setAcknowledgeResearch(false);
  }, [vaultScope]);

  const [birthYearInput, setBirthYearInput] = useState('');
  const [acknowledgeResearch, setAcknowledgeResearch] = useState(false);
  const [underAgeBlocked, setUnderAgeBlocked] = useState(false);

  // Search & Explorer state
  const [searchInput, setSearchInput] = useState('');
  const [selectedSubstance, setSelectedSubstance] = useState<SubstanceScienceProfile>(
    VERIFIED_SUBSTANCES_18_PLUS[0]
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiCustomResult, setAiCustomResult] = useState<SubstanceScienceProfile | null>(null);

  const currentYear = new Date().getFullYear();

  const handleVerifyAge = (e: React.FormEvent) => {
    e.preventDefault();
    const yr = Number(birthYearInput.trim());
    if (!yr || yr < 1920 || yr > currentYear) return;
    const age = currentYear - yr;
    if (age < 18) {
      setUnderAgeBlocked(true);
      setIsAdultVerified(false);
      return;
    }
    if (!acknowledgeResearch) return;
    setUnderAgeBlocked(false);
    setIsAdultVerified(true);
    writeScopedString(vaultScope, SCOPED_STORAGE_KEYS.AGE18_VERIFIED, '1');
  };

  const filteredCatalog = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return VERIFIED_SUBSTANCES_18_PLUS;
    return VERIFIED_SUBSTANCES_18_PLUS.filter(
      s =>
        s.name.toLowerCase().includes(q) ||
        s.commonAliases.toLowerCase().includes(q) ||
        s.substanceClass.toLowerCase().includes(q)
    );
  }, [searchInput]);

  const handleLiveAiLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;

    // Check if an exact seeded entry matches first
    const localMatch = VERIFIED_SUBSTANCES_18_PLUS.find(
      s =>
        s.name.toLowerCase() === q.toLowerCase() ||
        s.commonAliases.toLowerCase().includes(q.toLowerCase())
    );
    if (localMatch) {
      setAiCustomResult(null);
      setSelectedSubstance(localMatch);
      return;
    }

    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/substance-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          verifiedAdult: true,
          language,
        }),
      });
      if (!res.ok) throw new Error('Failed to fetch objective research summary');
      const data = await res.json();
      setAiCustomResult({
        id: `custom-${Date.now()}`,
        name: data.name || q,
        commonAliases: 'Custom Pharmacology Query',
        substanceClass: data.substanceClass,
        activeMechanism: data.activeMechanism,
        brainEffects: data.brainEffects,
        shortTermEffects: data.shortTermEffects || [],
        longTermEffects: data.longTermEffects || [],
        overdoseWarningSigns: data.overdoseWarningSigns || [],
        wikipediaUrl:
          data.wikipediaUrl ||
          `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`,
        evidenceSource: data.evidenceSource || 'WHO & NIDA Pharmacology Standards',
      });
    } catch {
      setAiError('Unable to retrieve external science summary right now. Select any verified entry below.');
    } finally {
      setAiLoading(false);
    }
  };

  const activeProfile = aiCustomResult || selectedSubstance;

  if (!isAdultVerified) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-300 flex items-center justify-center shrink-0">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
              18+ Verified Adult Education Gate
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              Objective Substance Pharmacology Lookup
            </h2>
            <p className="prose-readable text-slate-600 mt-2">
              This clinical research module explores neurotransmitter receptor mechanics, toxicology, and overdose warning signs across specific chemical compounds. Access is restricted to learners aged 18 and above.
            </p>
          </div>
        </div>

        {underAgeBlocked ? (
          <div className="p-5 rounded-2xl bg-sky-50 border border-sky-200 space-y-3">
            <div className="flex items-center gap-2 text-blue-950 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-blue-700" />
              <span>Under-18 Protection Active</span>
            </div>
            <p className="prose-readable text-slate-700">
              Detailed drug pharmacology charts are reserved for adult learners (18+). You have full access to all <strong>8 Brain Science Pathways</strong>, Habit-Loop Lab, Flashcards, and Peer-Pressure Simulator.
            </p>
            <button
              type="button"
              onClick={() => {
                setUnderAgeBlocked(false);
                setBirthYearInput('');
              }}
              className="text-xs font-bold text-blue-800 hover:underline cursor-pointer"
            >
              Re-enter birth year
            </button>
          </div>
        ) : (
          <form onSubmit={handleVerifyAge} className="space-y-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Year of Birth (e.g. 2002)
              </label>
              <input
                type="number"
                min={1920}
                max={currentYear}
                value={birthYearInput}
                onChange={e => setBirthYearInput(e.target.value)}
                placeholder="YYYY"
                required
                className="w-full sm:w-56 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 tabular-nums focus:outline-none focus:border-slate-900"
              />
            </div>

            <label className="flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={acknowledgeResearch}
                onChange={e => setAcknowledgeResearch(e.target.checked)}
                required
                className="mt-1 w-4 h-4 rounded border-slate-300 text-slate-900"
              />
              <span>
                I confirm I am 18 years or older and accessing this module strictly for objective health, pharmacology, and prevention education.
              </span>
            </label>

            <button
              type="submit"
              disabled={!birthYearInput || !acknowledgeResearch}
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-bold inline-flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Age &amp; Enter Research Lab</span>
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-tab-fade">
      {/* Search Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-800 mb-1">
              <FlaskConical className="w-4 h-4" />
              <span>18+ Verified Objective Science · {VERIFIED_SUBSTANCES_18_PLUS.length} Core Monographs</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Substance Pharmacology &amp; Brain Effect Explorer
            </h2>
            <p className="editorial-subtitle text-slate-600 mt-1.5 max-w-2xl">
              Objective, zero-stigma clinical breakdowns of how chemical compounds affect human receptors, cognition, and physical health—plus verified Wikipedia references.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              removeScopedKey(vaultScope, SCOPED_STORAGE_KEYS.AGE18_VERIFIED);
              setIsAdultVerified(false);
            }}
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 self-start sm:self-center cursor-pointer"
          >
            Lock 18+ Gate
          </button>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleLiveAiLookup} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Search 16 monographs or type any substance name (e.g. Ketamine, Alcohol, Nicotine, Opioid)..."
              className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-800"
            />
          </div>
          <button
            type="submit"
            disabled={aiLoading || !searchInput.trim()}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 disabled:opacity-50 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
            <span>{aiLoading ? 'Researching...' : 'Lookup Objective Science'}</span>
          </button>
        </form>

        {aiError && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900">
            {aiError}
          </div>
        )}

        {/* Quick Catalog Grid (16 substances) */}
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Verified Monographs ({filteredCatalog.length})
          </span>
          <div className="flex flex-wrap gap-2">
            {filteredCatalog.map(item => {
              const active = !aiCustomResult && selectedSubstance.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setAiCustomResult(null);
                    setSelectedSubstance(item);
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                    active
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Science Monograph Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
              {activeProfile.substanceClass}
            </span>
            <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
              {activeProfile.name}
            </h3>
            {activeProfile.commonAliases && (
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Common references: {activeProfile.commonAliases}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start">
            <button
              type="button"
              onClick={() =>
                openAiAssistant({
                  role: 'learner',
                  contextRef: {
                    area: '18+ Substance Facts',
                    topicTitle: activeProfile.name,
                    snippet: activeProfile.activeMechanism,
                  },
                })
              }
              className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Ask AI About {activeProfile.name}</span>
            </button>
            <a
              href={activeProfile.wikipediaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-900 shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-800" />
              <span>Read on Wikipedia</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
          </div>
        </div>

        {/* Mechanism + Brain Impact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
              <Activity className="w-4 h-4 text-blue-800" />
              <span>Receptor &amp; Pharmacological Mechanism</span>
            </div>
            <p className="prose-readable text-slate-800">{activeProfile.activeMechanism}</p>
          </div>

          <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900">
              <Brain className="w-4 h-4 text-blue-800" />
              <span>What Happens in the Brain</span>
            </div>
            <p className="prose-readable text-slate-800">{activeProfile.brainEffects}</p>
          </div>
        </div>

        {/* Short-Term & Long-Term Effects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Short-Term Physiological &amp; Cognitive Effects
            </h4>
            <ul className="space-y-2.5">
              {activeProfile.shortTermEffects.map((item, idx) => (
                <li key={idx} className="prose-readable-sm text-slate-700 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-1" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
            <h4 className="editorial-kicker text-slate-700">
              Long-Term Mind &amp; Body Risks
            </h4>
            <ul className="space-y-2.5">
              {activeProfile.longTermEffects.map((item, idx) => (
                <li key={idx} className="prose-readable-sm text-slate-700 flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700 shrink-0 mt-2.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Emergency Overdose Warning Signs */}
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" />
              <span>Critical Overdose &amp; Toxicity Warning Signs</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="tel:112"
                className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold inline-flex items-center gap-1"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Emergency 112</span>
              </a>
              <a
                href="tel:14405"
                className="px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-900 text-xs font-bold"
              >
                Vimukthi 14405
              </a>
            </div>
          </div>

          <ul className="space-y-2">
            {activeProfile.overdoseWarningSigns.map((sign, idx) => (
              <li key={idx} className="prose-readable-sm text-rose-950 flex items-start gap-2.5">
                <span className="font-bold">•</span>
                <span>{sign}</span>
              </li>
            ))}
          </ul>

          <p className="text-xs text-slate-600 pt-2 border-t border-rose-200/70">
            <strong>Primary Reference Basis:</strong> {activeProfile.evidenceSource}
          </p>
        </div>
      </div>
    </div>
  );
};
