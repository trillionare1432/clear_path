import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ROLE_THEME_META } from '../constants/featureCatalog';
import { UserRole } from '../types';
import { Sparkles, Send, ArrowRight, Loader2, MessageCircle } from 'lucide-react';

interface CompanionAction {
  label: string;
  role: string;
  tab: string;
}

interface CompanionPayload {
  greeting: string;
  dailyInsight: string;
  missionSuggestion: string;
  reply: string;
  contextualActions: CompanionAction[];
  source?: string;
}

interface Props {
  role: UserRole;
  onSelectTab: (tab: string) => void;
}

export const PersonalIntelligenceCompanion: React.FC<Props> = ({ role, onSelectTab }) => {
  const {
    language,
    setRole,
    dailyLogs,
    gameStats,
    completedLessonIds,
    quizAttempts,
    supportPlans,
    supporterReflections,
    communityProgrammes,
    communityEvents,
    personalizationProfile,
    openAiAssistant,
  } = useApp();

  const theme = ROLE_THEME_META[role];
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CompanionPayload | null>(null);

  const contextSummary = {
    checkIns: dailyLogs.length,
    gamesPlayed: Object.values(gameStats).reduce((s, g) => s + g.sessionsPlayed, 0),
    lessonsDone: completedLessonIds.length,
    quizzesCount: quizAttempts.length,
    plansCount: supportPlans.length,
    reflectionsCount: supporterReflections.length,
    programmesCount: communityProgrammes.length,
    eventsCount: communityEvents.length,
  };

  const fetchCompanion = async (userQ?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          question: userQ ?? question,
          language,
          contextSummary,
          personalization: {
            name: personalizationProfile.name,
            topGoal: personalizationProfile.topGoal,
            mood: personalizationProfile.recentMood,
            preferredRhythm: personalizationProfile.preferredRhythm,
          },
        }),
      });
      if (res.ok) {
        const json: CompanionPayload = await res.json();
        setData(json);
      }
    } catch {
      // Quietly handle transient network fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanion('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, language]);

  const handleActionClick = (act: CompanionAction) => {
    if (act.role !== role && (act.role === 'personal' || act.role === 'supporter' || act.role === 'learner' || act.role === 'community')) {
      setRole(act.role);
    }
    onSelectTab(act.tab);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${theme.softBg} ${theme.accentText}`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className={`text-xs font-extrabold uppercase tracking-wider ${theme.accentText}`}>
              ClearPath AI Guide
            </div>
            <h3 className="text-base font-extrabold text-slate-900">
              {data?.greeting || (language === 'ml' ? 'വ്യക്തിഗത എഐ സഹായി' : 'Your Helpful Next Step')}
            </h3>
          </div>
        </div>
        <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Based on your notes</span>
      </div>

      {data && (
        <div className="space-y-3 text-sm">
          <p className="text-slate-700 leading-relaxed font-medium">{data.dailyInsight}</p>
          <div className={`p-3.5 rounded-xl border text-slate-900 leading-relaxed ${theme.softBg} ${theme.softBorder}`}>
            <span className="font-bold">{language === 'ml' ? 'ഇന്നത്തെ നിർദ്ദേശം: ' : 'Next Easy Step: '}</span>
            <span>{data.missionSuggestion}</span>
          </div>
          {data.reply && question.trim() === '' && (
            <p className="text-sm text-slate-600 leading-relaxed">{data.reply}</p>
          )}
        </div>
      )}

      {/* Ask Companion Input */}
      <form
        onSubmit={e => {
          e.preventDefault();
          if (!question.trim()) return;
          fetchCompanion(question.trim());
        }}
        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
      >
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder={
            language === 'ml'
              ? 'എഐ സഹായിയോട് എന്ത് വേണമെങ്കിലും ചോദിക്കാം...'
              : 'Ask any question in your own words...'
          }
          className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-base sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className={`min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer whitespace-nowrap shrink-0 ${theme.secondaryButton}`}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span>{language === 'ml' ? 'ചോദിക്കുക' : 'Ask Guide'}</span>
        </button>
      </form>

      {data?.reply && question.trim() !== '' && !loading && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed">
          {data.reply}
        </div>
      )}

      {/* Contextual Deep Links + Full AI Chat Drawer */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
        <div className="flex flex-wrap items-center gap-2">
          {data?.contextualActions &&
            data.contextualActions.map((act, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleActionClick(act)}
                className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm font-bold text-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>{act.label}</span>
                <ArrowRight className={`w-3.5 h-3.5 ${theme.accentText}`} />
              </button>
            ))}
        </div>
        <button
          type="button"
          onClick={() =>
            openAiAssistant({
              role,
              initialQuestion: question.trim() || undefined,
              contextRef: {
                area: 'Personal Guide',
                topicTitle: personalizationProfile.topGoal || 'Daily Next Step',
              },
            })
          }
          className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>{language === 'ml' ? 'പൂർണ്ണ AI ചാറ്റും ചരിത്രവും' : 'Full AI Chat & History'}</span>
        </button>
      </div>
    </div>
  );
};
