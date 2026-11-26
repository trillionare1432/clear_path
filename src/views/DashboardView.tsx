import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ROLE_THEME_META } from '../constants/featureCatalog';
import { copyPhoneToClipboard } from '../utils/clipboard';
import { calculateActivityConsistency } from '../utils/logic';
import { DashboardTaskCalendarWidget } from '../components/DashboardTaskCalendarWidget';
import { SubstanceIdentificationPanel } from '../components/SubstanceIdentificationPanel';
import { AiDashboardInsightsCard } from '../components/AiDashboardInsightsCard';
import { UserReportExportModal } from '../components/UserReportExportModal';
import { CARE_RELAY_STATUS_META } from '../utils/careRelay';
import personalStepImg from '../assets/images/personal_recovery_journey_1794930647188.jpg';
import {
  Sparkles,
  Check,
  Gamepad2,
  PhoneCall,
  Target,
  ArrowRight,
  Loader2,
  Flame,
  Copy,
  NotebookPen,
  CheckCircle2,
  Smile,
  Sun,
  Wind,
  BatteryLow,
  CloudRain,
  FileText,
  Stethoscope,
  Pill,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  MessageCircle,
} from 'lucide-react';
import { MoodType, TriggerJournalEntry } from '../types';

interface Props {
  onSelectTab: (tab: string) => void;
  onOpenQuickLog?: () => void;
  onEditOnboarding?: () => void;
}

export const DashboardView: React.FC<Props> = ({ onSelectTab, onEditOnboarding }) => {
  const {
    language,
    userProfile,
    personalOnboarding,
    dailyLogs,
    addDailyLog,
    addTriggerEntry,
    habitChallenges,
    toggleHabitChallengeDay,
    goals,
    gameStats,
    careRelays,
    clientAssignments,
    clientAppointments,
    carePlanProposals,
    substanceConcerns,
    upsertSubstanceConcern,
    removeSubstanceConcern,
    personalizationProfile,
    openAiAssistant,
  } = useApp();

  const theme = ROLE_THEME_META.personal;
  const todayISO = new Date().toISOString().split('T')[0];

  const [selectedMood, setSelectedMood] = useState<MoodType>('steady');
  const [quickNote, setQuickNote] = useState('');
  const [triggerCat, setTriggerCat] = useState<'none' | TriggerJournalEntry['triggerCategory']>('none');
  const [aiReflectLoading, setAiReflectLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<{ reflection: string; microStep: string } | null>(null);
  const [checkInSavedBanner, setCheckInSavedBanner] = useState(false);
  const [copied14405, setCopied14405] = useState(false);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [showSubstanceFinder, setShowSubstanceFinder] = useState(false);
  const [showExtraHomeCards, setShowExtraHomeCards] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);

  const activeGoals = goals.filter(g => !g.completed);
  const last7Days = calculateActivityConsistency(dailyLogs, 7);
  const activeDaysCount = last7Days.filter(d => d.hasLog).length;
  const totalGamesPlayed = Object.values(gameStats).reduce((acc, s) => acc + s.sessionsPlayed, 0);

  const moods: { id: MoodType; label: string; labelMl: string; icon: React.ElementType }[] = [
    { id: 'steady', label: 'Steady', labelMl: 'ശാന്തം', icon: Smile },
    { id: 'hopeful', label: 'Hopeful', labelMl: 'പ്രതീക്ഷ', icon: Sun },
    { id: 'restless', label: 'Restless', labelMl: 'അസ്വസ്ഥം', icon: Wind },
    { id: 'tired', label: 'Tired', labelMl: 'ക്ഷീണിതം', icon: BatteryLow },
    { id: 'heavy', label: 'Heavy', labelMl: 'ഭാരം', icon: CloudRain },
  ];

  const handleCopy14405 = async () => {
    const ok = await copyPhoneToClipboard('14405');
    if (ok) {
      setCopied14405(true);
      setTimeout(() => setCopied14405(false), 2000);
    }
  };

  const handleSaveAndAnalyze = async (withAi: boolean) => {
    addDailyLog({
      date: todayISO,
      type: 'quick',
      mood: selectedMood,
      quickNote: quickNote.trim() || undefined,
      completedActivities: [],
      tags: triggerCat !== 'none' ? [triggerCat] : [],
    });

    if (triggerCat !== 'none') {
      addTriggerEntry({
        date: todayISO,
        triggerCategory: triggerCat,
        intensity: selectedMood === 'heavy' || selectedMood === 'restless' ? 4 : 2,
        situation: quickNote.trim() || `${triggerCat} spike noted during check-in`,
        copingMove: 'Logged in ClearPath Dashboard',
      });
    }

    setCheckInSavedBanner(true);
    setTimeout(() => setCheckInSavedBanner(false), 3000);

    if (withAi) {
      setAiReflectLoading(true);
      try {
        const res = await fetch('/api/ai/reflect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'checkin',
            mood: selectedMood,
            note: quickNote.trim(),
            triggerCategory: triggerCat === 'none' ? '' : triggerCat,
            language,
          }),
        });
        const data = await res.json();
        setAiInsight({ reflection: data.reflection, microStep: data.microStep });
      } catch {
        setAiInsight({
          reflection: 'Checking in calmly reinforces steady focus over impulsive urges.',
          microStep: 'Take 5 slow breaths or open a 2-minute reset in the Features hub.',
        });
      } finally {
        setAiReflectLoading(false);
      }
    }

    setQuickNote('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Minimalist Hero: Role Clarity + Single Critical CTA + Custom Role 01 Illustration */}
      <section className={`relative rounded-3xl bg-gradient-to-br ${theme.heroGradient} text-white p-6 sm:p-8 shadow-md overflow-hidden`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-4 flex-1 min-w-0">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
                <span>{language === 'ml' ? 'റോൾ 01 · വ്യക്തിഗത ഇടം' : 'Role 01 · Recover & Rebuild'}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {userProfile
                  ? language === 'ml'
                    ? `സ്വാഗതം, ${userProfile.name}`
                    : `Steady step today, ${userProfile.name}.`
                  : language === 'ml'
                  ? 'ഇന്ന് ഒരു ചെറിയ ചുവട്.'
                  : 'One steady step today.'}
              </h1>

              <p className="text-xs sm:text-sm text-indigo-100/85 leading-relaxed">
                {language === 'ml'
                  ? 'സ്വകാര്യമായ ദൈനംദിന ചെക്ക്-ഇൻ, ശീലങ്ങൾ, വ്യക്തിഗത എഐ പരിശോധന.'
                  : 'Private check-in, daily habits, and personalized support — extra tools stay neat in Features.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onSelectTab('navigator')}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer ${theme.primaryButton}`}
              >
                <Sparkles className="w-4 h-4" />
                <span>{language === 'ml' ? 'സാഹചര്യം മനസ്സിലാക്കുക' : 'Understand My Situation'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onSelectTab('report')}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-amber-300" />
                <span>Full Report Builder</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPdfModal(true)}
                className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-emerald-300" />
                <span>{language === 'ml' ? 'PDF റിപ്പോർട്ട്' : 'Quick PDF'}</span>
              </button>

              <div className="inline-flex items-center rounded-xl overflow-hidden border border-rose-400/30">
                <a
                  href="tel:14405"
                  className="px-3 py-3 bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors tabular-nums"
                  title="Call Kerala Vimukthi Helpline 14405"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>14405</span>
                </a>
                <button
                  type="button"
                  onClick={handleCopy14405}
                  title="Copy 14405"
                  className="px-2.5 py-3 bg-rose-800/90 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                >
                  {copied14405 ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {!heroImgFailed && (
            <div className="w-full lg:w-[310px] xl:w-[350px] shrink-0">
              <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden border border-white/15 bg-indigo-950/60 shadow-lg">
                <img
                  src={personalStepImg}
                  alt="Young man ascending warm oak steps toward a sunrise care lighthouse while a choppy craving wave calms into a golden sine wave beside milestone and shield modules"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Picked For You Right Now Personalization Card */}
      <section className="bg-white border border-indigo-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-indigo-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              {personalizationProfile.name
                ? language === 'ml'
                  ? `${personalizationProfile.name}-നായി തിരഞ്ഞെടുത്തത്`
                  : `Picked for ${personalizationProfile.name} right now`
                : language === 'ml'
                ? 'നിങ്ങൾക്കായി ഇന്ന് തിരഞ്ഞെടുത്തത്'
                : 'Picked for you right now'}
            </span>
            {personalizationProfile.preferredRhythm && (
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-900 font-semibold normal-case">
                {personalizationProfile.preferredRhythm}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-slate-900 leading-snug">
            {language === 'ml'
              ? personalizationProfile.tailoredTipMl || personalizationProfile.tailoredTip
              : personalizationProfile.tailoredTip}
          </p>
          {personalizationProfile.topGoal && (
            <p className="text-xs text-slate-600">
              Current focus goal: <strong className="text-slate-800">{personalizationProfile.topGoal}</strong>
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              openAiAssistant({
                role: 'personal',
                contextRef: {
                  area: 'Personal Home',
                  topicTitle: personalizationProfile.topGoal || 'Today Next Step',
                  snippet: personalizationProfile.tailoredTip,
                },
              })
            }
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5 text-amber-300" />
            <span>Ask AI</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab(personalizationProfile.nextActionTab || 'tools')}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-950 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
          >
            <span>{personalizationProfile.nextActionLabel || 'Open Next Step'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Personalized Life Pathway Summary Card */}
      {personalOnboarding?.personalizedPathway && (
        <section className="bg-white border border-indigo-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-[11px] font-bold text-indigo-900">
                {personalOnboarding.personalizedPathway.careStatusLabel}
              </span>
              <span className="text-xs font-bold text-slate-800">Personalized Life Pathway</span>
            </div>
            {onEditOnboarding && (
              <button
                type="button"
                onClick={onEditOnboarding}
                className="text-xs font-bold text-indigo-700 hover:underline cursor-pointer"
              >
                Update Situation &amp; Pathway
              </button>
            )}
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {personalOnboarding.personalizedPathway.firstGentleStep}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {personalOnboarding.personalizedPathway.focusAreas.slice(0, 3).map(area => (
              <span
                key={area}
                className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700"
              >
                {area}
              </span>
            ))}
            <button
              type="button"
              onClick={() => onSelectTab('opportunities')}
              className="ml-auto px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-indigo-950 text-xs font-extrabold cursor-pointer"
            >
              Opportunities &amp; Passport &rarr;
            </button>
          </div>
        </section>
      )}

      {/* Therapist Care Plan Proposal Pending Review Banner */}
      {carePlanProposals.filter(p => p.status === 'proposed' || p.status === 'user_reviewed').length > 0 && (
        <section className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-indigo-950">
            <Stethoscope className="w-4 h-4 text-indigo-800 shrink-0" />
            <span>
              <strong>
                {carePlanProposals.filter(p => p.status === 'proposed' || p.status === 'user_reviewed').length} Clinician Care Plan Proposal
              </strong>{' '}
              is ready for your review and mutual agreement in Rebuild My Life.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('rebuild')}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-950 text-white text-xs font-bold cursor-pointer"
          >
            Review Plan Proposal
          </button>
        </section>
      )}

      {/* Therapist Assigned Continuity Banner */}
      {clientAssignments.filter(a => a.status !== 'completed' && a.status !== 'reviewed').length > 0 && (
        <section className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-amber-950">
            <Stethoscope className="w-4 h-4 text-amber-800 shrink-0" />
            <span>
              <strong>
                {clientAssignments.filter(a => a.status !== 'completed' && a.status !== 'reviewed').length} Therapist-Assigned Activity
              </strong>{' '}
              from your clinician is ready in My Support Pathways.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('tools')}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-950 text-white text-xs font-bold cursor-pointer"
          >
            Open Assigned Activities
          </button>
        </section>
      )}

      {/* Synced Clinician Appointments & Follow-Up Schedule */}
      {clientAppointments.length > 0 && (
        <section className="bg-emerald-50/75 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-950">
              <Stethoscope className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Synced Clinical Appointments ({clientAppointments.length})</span>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('calendar')}
              className="px-3 py-1 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-[11px] font-bold cursor-pointer"
            >
              View Calendar
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {clientAppointments.slice(0, 4).map(appt => (
              <div key={appt.id} className="bg-white border border-emerald-200 rounded-xl p-3 text-xs space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-900 tabular-nums">
                    {appt.appointmentDate}{appt.appointmentTime ? ` · ${appt.appointmentTime}` : ''}
                  </span>
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900">
                    {(appt.status || 'upcoming').replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-emerald-900">
                  With {appt.therapistName}
                </div>
                <p className="text-slate-600">{appt.noteText}</p>
                {appt.agreedNextSteps && (
                  <p className="text-[11px] text-indigo-900 font-medium">
                    Next step: {appt.agreedNextSteps}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Clean 3-Stat Glance Row */}
      <section className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-slate-500">
              {language === 'ml' ? '7-ദിന തുടർച്ച' : '7-Day Continuity'}
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-indigo-950 font-mono-tabular mt-0.5">
              {activeDaysCount} / 7
            </div>
          </div>
          <Flame className={`w-5 h-5 shrink-0 ${activeDaysCount > 0 ? 'text-amber-500' : 'text-slate-300'}`} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-slate-500">
              {language === 'ml' ? 'മസ്തിഷ്ക പരിശീലനം' : 'Brain Resets'}
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-indigo-950 font-mono-tabular mt-0.5">
              {totalGamesPlayed}
            </div>
          </div>
          <Gamepad2 className="w-5 h-5 shrink-0 text-amber-600" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-slate-500">
              {language === 'ml' ? 'സജീവ ലക്ഷ്യങ്ങൾ' : 'Active Goals'}
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-indigo-950 font-mono-tabular mt-0.5">
              {activeGoals.length}
            </div>
          </div>
          <Target className="w-5 h-5 shrink-0 text-indigo-700" />
        </div>
      </section>

      {/* Role 01 · Substance / Drug Search & Custom Unlisted Entry */}
      <section className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-900 flex items-center justify-center shrink-0">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-indigo-950">
                {language === 'ml'
                  ? 'ലഹരി / മരുന്ന് തിരയലും പുതുതായി ചേർക്കലും'
                  : 'Substances, Drugs & Medications I Want to Address'}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                {language === 'ml'
                  ? '50-ലധികം ലഹരികളിൽ നിന്ന് തിരഞ്ഞെടുക്കാം, അല്ലെങ്കിൽ പട്ടികയിലില്ലാത്തത് നേരിട്ട് ചേർക്കാം.'
                  : 'Search & select from 50 substances/medicines or add any unlisted new substance in 1 tap. Stored privately per account.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowSubstanceFinder(v => !v)}
              className="px-4 py-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-amber-300" />
              <span>{showSubstanceFinder ? 'Hide Drug Finder' : 'Search 50+ Drugs or Add Custom'}</span>
              {showSubstanceFinder ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('navigator')}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold cursor-pointer"
            >
              Full 4-Stage Navigator &rarr;
            </button>
          </div>
        </div>

        {substanceConcerns.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {substanceConcerns.map(c => (
              <span
                key={c.id}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                  c.verificationStatus === 'unverified'
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-950'
                }`}
              >
                <span>{c.name}</span>
                {c.verificationStatus === 'unverified' && (
                  <span className="text-[10px] font-semibold opacity-80">(Custom)</span>
                )}
                <button
                  type="button"
                  onClick={() => removeSubstanceConcern(c.id)}
                  className="p-0.5 rounded hover:bg-black/10 cursor-pointer"
                  aria-label={`Remove ${c.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            No specific substances selected yet. Click <strong>Search 50+ Drugs or Add Custom</strong> to select what you are dealing with or enter a new unlisted one.
          </div>
        )}

        {showSubstanceFinder && (
          <div className="pt-3 border-t border-slate-100 animate-in fade-in duration-150">
            <SubstanceIdentificationPanel
              compactHeader
              concerns={substanceConcerns}
              onUpsertConcern={upsertSubstanceConcern}
              onRemoveConcern={removeSubstanceConcern}
            />
          </div>
        )}
      </section>

      {/* Focused 2-Card Centerpiece (No Duplicate Sidebars or Link Grids) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Primary Role Action: Quick Mood & Trigger Check-In */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-900 flex items-center justify-center shrink-0">
              <NotebookPen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-indigo-950">
                {language === 'ml' ? 'ഇന്നത്തെ ചെക്ക്-ഇൻ' : 'Today’s Check-In'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'ml' ? 'സ്വകാര്യമായി സൂക്ഷിക്കുന്നു.' : 'Private to your browser. Tap mood and save calmly.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {moods.map(m => {
              const IconComp = m.icon;
              const selected = selectedMood === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMood(m.id)}
                  className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    selected
                      ? 'bg-indigo-950 border-indigo-950 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                  }`}
                >
                  <IconComp className={`w-4 h-4 ${selected ? 'text-amber-300' : 'text-indigo-700'}`} />
                  <span className="text-[11px] font-bold truncate max-w-full">
                    {language === 'ml' ? m.labelMl : m.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {(['none', 'stress', 'social', 'boredom', 'environment', 'sleep_deficit'] as const).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setTriggerCat(cat)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold capitalize border cursor-pointer transition-colors ${
                  triggerCat === cat
                    ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat === 'none' ? 'No trigger' : cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          <textarea
            rows={4}
            maxLength={3000}
            value={quickNote}
            onChange={e => setQuickNote(e.target.value)}
            placeholder={
              language === 'ml'
                ? 'ഇന്നത്തെ അവസ്ഥയെക്കുറിച്ച് ഒരു വരിയോ ഒരു വലിയ പാരഗ്രാഫോ ഇവിടെ സ്വകാര്യമായി എഴുതാം...'
                : 'Write a short note or a whole paragraph about today—whatever helps get it off your mind...'
            }
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-sm text-slate-900 placeholder:text-slate-400 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />

          <div className="flex flex-wrap items-center justify-between gap-2.5">
            {checkInSavedBanner ? (
              <span className="text-xs font-bold text-indigo-800 inline-flex items-center gap-1">
                <Check className="w-4 h-4 text-amber-600" />
                <span>{language === 'ml' ? 'സ്വകാര്യമായി സൂക്ഷിച്ചു' : 'Saved locally'}</span>
              </span>
            ) : (
              <span className="text-[11px] text-slate-400">Encrypted locally</span>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => handleSaveAndAnalyze(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold cursor-pointer"
              >
                {language === 'ml' ? 'സേവ്' : 'Save'}
              </button>
              <button
                type="button"
                disabled={aiReflectLoading}
                onClick={() => handleSaveAndAnalyze(true)}
                className="px-4 py-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {aiReflectLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span>{language === 'ml' ? 'എഐ നിർദ്ദേശം' : 'Save & AI Insight'}</span>
              </button>
            </div>
          </div>

          {aiInsight && (
            <div className="p-4 rounded-xl bg-indigo-50/80 border border-indigo-200 space-y-1.5 animate-in fade-in duration-150">
              <div className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
                ClearPath AI
              </div>
              <p className="text-xs sm:text-sm text-indigo-950 font-medium leading-relaxed">
                {aiInsight.reflection}
              </p>
              <p className="text-xs text-amber-900 font-semibold pt-1">
                Next step: {aiInsight.microStep}
              </p>
            </div>
          )}
        </div>

        {/* Today's Habit Checklist */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-3.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-indigo-950">
                {language === 'ml' ? 'ഇന്നത്തെ നല്ല ശീലങ്ങൾ' : 'Today’s Healthy Habits'}
              </h2>
              <p className="text-sm text-slate-500">Tap any item to mark it done today</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {habitChallenges.map(ch => {
              const doneToday = ch.completedDates.includes(todayISO);
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => toggleHabitChallengeDay(ch.id, todayISO)}
                  className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    doneToday
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-950'
                      : 'bg-slate-50/70 border-slate-200 text-slate-800 hover:border-indigo-200'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-bold truncate">
                      {language === 'ml' ? ch.titleMl : ch.title}
                    </div>
                    <div className="text-xs text-slate-500 font-mono-tabular">
                      {ch.completedDates.length}/{ch.targetDays} days
                    </div>
                  </div>
                  <span
                    className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                      doneToday
                        ? 'bg-indigo-900 text-amber-400'
                        : 'bg-white border border-slate-300 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Collapsible Secondary Cards: AI Paragraph Insights & Task Calendar */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setShowExtraHomeCards(v => !v)}
          className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
        >
          <span>{showExtraHomeCards ? 'Hide Weekly AI Analysis & Tasks' : 'Show Weekly AI Analysis & Tasks'}</span>
          {showExtraHomeCards ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showExtraHomeCards && (
          <div className="space-y-6">
            <AiDashboardInsightsCard
              role="personal"
              statsSummary={`${activeDaysCount}/7 days logged · ${activeGoals.length} active goals · ${substanceConcerns.length} focus items`}
              recentHighlights={[
                ...dailyLogs.slice(0, 3).map(l => `${l.date} mood: ${l.mood}${l.quickNote ? ` (${l.quickNote.slice(0, 80)})` : ''}`),
                ...activeGoals.slice(0, 2).map(g => `Goal: ${g.title}`),
              ]}
              onNavigateTab={onSelectTab}
            />

            <DashboardTaskCalendarWidget
              role="personal"
              onOpenCalendar={() => onSelectTab('calendar')}
            />
          </div>
        )}
      </div>

      {/* Active Care Relay Handoff Strip */}
      {careRelays.filter(r => !r.revokedAt && r.status !== 'closed').length > 0 && (
        <section className="bg-white rounded-3xl border border-indigo-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-800">
              Active Centre Support Request
            </div>
            {careRelays
              .filter(r => !r.revokedAt && r.status !== 'closed')
              .slice(0, 1)
              .map(relay => (
                <div key={relay.id} className="text-sm text-slate-700">
                  <strong className="text-indigo-950">{relay.centerName}</strong> ·{' '}
                  <span className="font-semibold text-amber-800">
                    {CARE_RELAY_STATUS_META[relay.status].label}
                  </span>
                </div>
              ))}
          </div>
          <button
            type="button"
            onClick={() => onSelectTab('support')}
            className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-950 text-xs font-bold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
          >
            <span>View in Care Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      )}

      <UserReportExportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        role="personal"
      />
    </div>
  );
};
