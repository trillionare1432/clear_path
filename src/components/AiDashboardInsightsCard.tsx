import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Loader2,
  ArrowRight,
  MessageCircle,
  CheckCircle2,
  Lightbulb,
} from 'lucide-react';

interface AiDashboardInsightsCardProps {
  role: 'personal' | 'supporter' | 'learner' | 'community';
  statsSummary: string;
  recentHighlights: string[];
  onNavigateTab: (tab: string) => void;
  promptTitle?: string;
  placeholder?: string;
}

interface DashboardAiResult {
  summary: string;
  strengths: string[];
  focusNext: string[];
  suggestedTab: string;
  suggestedLabel: string;
  source?: string;
}

const ACCENT_BY_ROLE: Record<
  AiDashboardInsightsCardProps['role'],
  { border: string; badge: string; btn: string; light: string }
> = {
  personal: {
    border: 'border-indigo-200',
    badge: 'text-indigo-800 bg-indigo-50 border-indigo-200',
    btn: 'bg-indigo-950 hover:bg-indigo-900 text-white',
    light: 'bg-indigo-50/70 border-indigo-200 text-indigo-950',
  },
  supporter: {
    border: 'border-orange-200',
    badge: 'text-orange-900 bg-orange-50 border-orange-200',
    btn: 'bg-[#9A3412] hover:bg-[#7C2D12] text-white',
    light: 'bg-orange-50/70 border-orange-200 text-orange-950',
  },
  learner: {
    border: 'border-blue-200',
    badge: 'text-blue-900 bg-sky-50 border-blue-200',
    btn: 'bg-blue-900 hover:bg-blue-950 text-white',
    light: 'bg-sky-50/70 border-blue-200 text-blue-950',
  },
  community: {
    border: 'border-teal-200',
    badge: 'text-teal-900 bg-teal-50 border-teal-200',
    btn: 'bg-teal-900 hover:bg-teal-950 text-white',
    light: 'bg-teal-50/70 border-teal-200 text-teal-950',
  },
};

export const AiDashboardInsightsCard: React.FC<AiDashboardInsightsCardProps> = ({
  role,
  statsSummary,
  recentHighlights,
  onNavigateTab,
  promptTitle,
  placeholder,
}) => {
  const { language, userProfile, personalizationProfile, openAiAssistant } = useApp();
  const [paragraphNote, setParagraphNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DashboardAiResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const accent = ACCENT_BY_ROLE[role];
  const displayName = userProfile?.name || personalizationProfile.name || '';

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/ai/dashboard-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          language,
          userName: displayName,
          summaryStats: statsSummary,
          recentItems: recentHighlights,
          paragraphNote: paragraphNote.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not analyze right now.');
        return;
      }
      setResult(data);
    } catch {
      setErrorMsg(
        language === 'ml'
          ? 'ഇപ്പോൾ AI-യുമായി ബന്ധപ്പെടാൻ കഴിഞ്ഞില്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക.'
          : 'Could not reach ClearPath AI right now. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`bg-white border ${accent.border} rounded-3xl p-5 sm:p-6 shadow-xs space-y-4`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${accent.badge}`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
              {promptTitle ||
                (language === 'ml'
                  ? 'AI വിശകലനവും അടുത്ത ചുവടും'
                  : 'ClearPath AI Analysis & Next Step')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {language === 'ml'
                ? 'നിങ്ങളുടെ വിവരങ്ങളും നീണ്ട കുറിപ്പും പരിശോധിച്ച് ലളിതമായ നിർദ്ദേശം നൽകുന്നു.'
                : 'Reads your real progress below plus any long paragraph you write, then suggests clear next steps.'}
            </p>
          </div>
        </div>
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 self-start sm:self-center">
          {language === 'ml' ? 'സ്വകാര്യം & ലളിതം' : 'Private & Brief'}
        </span>
      </div>

      <form onSubmit={handleAnalyze} className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {language === 'ml'
              ? 'എന്ത് സംഭവിക്കുന്നു? (ഒരു പാരഗ്രാഫോ ചോദ്യമോ എഴുതാം)'
              : 'Write what is on your mind (a line or a full paragraph):'}
          </label>
          <textarea
            rows={4}
            maxLength={3000}
            value={paragraphNote}
            onChange={e => setParagraphNote(e.target.value)}
            placeholder={
              placeholder ||
              (language === 'ml'
                ? 'ഉദാഹരണം: ഈ ആഴ്ച വൈകുന്നേരങ്ങളിൽ എനിക്ക് കൂടുതൽ സമ്മർദ്ദം തോന്നി, ഉറക്കം കുറവാണ്. എനിക്ക് എങ്ങനെ ശാന്തമാകാം...'
                : 'Example: Write freely in full sentences about your week, a tough conversation, a study topic that felt confusing, or what your local group needs...')
            }
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
            <span>{statsSummary}</span>
            <span className="font-mono-tabular">{paragraphNote.length}/3000</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={() =>
              openAiAssistant({
                role,
                initialQuestion: paragraphNote.trim() || undefined,
                contextRef: {
                  area: `${role} dashboard`,
                  topicTitle: 'My Dashboard Progress',
                  snippet: statsSummary,
                },
              })
            }
            className="min-h-[44px] px-4 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{language === 'ml' ? 'AI ചാറ്റിൽ തുടരുക' : 'Open Full AI Chat'}</span>
          </button>

          <button
            type="submit"
            disabled={loading}
            className={`min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-60 ${accent.btn}`}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>
              {loading
                ? language === 'ml'
                  ? 'പരിശോധിക്കുന്നു...'
                  : 'Analyzing...'
                : language === 'ml'
                ? 'എന്റെ വിവരങ്ങൾ AI കൊണ്ട് പരിശോധിക്കുക'
                : 'Analyze My Data & Note with AI'}
            </span>
          </button>
        </div>
      </form>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-900">
          {errorMsg}
        </div>
      )}

      {result && (
        <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${accent.light}`}>
          <div className="space-y-1.5">
            <div className="text-[11px] font-extrabold uppercase tracking-wider opacity-75">
              {language === 'ml' ? 'ലളിതമായ AI സംഗ്രഹം' : 'What Stands Out'}
            </div>
            <p className="text-sm font-semibold leading-relaxed">{result.summary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{language === 'ml' ? 'നല്ല കാര്യങ്ങൾ' : 'What Is Going Well'}</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed list-disc pl-4">
                {result.strengths.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-800">
                <Lightbulb className="w-4 h-4 shrink-0" />
                <span>{language === 'ml' ? 'ഇനി ചെയ്യാവുന്ന കാര്യങ്ങൾ' : 'Simple Next Ideas'}</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed list-disc pl-4">
                {result.focusNext.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <span className="text-[11px] font-medium opacity-75">
              {language === 'ml'
                ? 'നിങ്ങളുടെ ഡാറ്റ അടിസ്ഥാനമാക്കി തയ്യാറാക്കിയത്'
                : 'Based on your real saved progress — you stay in control.'}
            </span>
            {result.suggestedTab && (
              <button
                type="button"
                onClick={() => onNavigateTab(result.suggestedTab)}
                className={`min-h-[40px] px-4 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer ${accent.btn}`}
              >
                <span>{result.suggestedLabel || 'Go to Suggested Tool'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
