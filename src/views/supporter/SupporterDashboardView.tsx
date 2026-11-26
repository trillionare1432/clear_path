import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  ClipboardList,
  Calendar,
  Heart,
  PhoneCall,
  Sparkles,
  Copy,
  Check,
  Sprout,
  Anchor,
  Cloud,
  BatteryWarning,
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  FileText,
} from 'lucide-react';
import { calculateSupportPlanProgress } from '../../utils/logic';
import { SupporterMood } from '../../types';
import { ROLE_THEME_META } from '../../constants/featureCatalog';
import { copyPhoneToClipboard } from '../../utils/clipboard';
import { DashboardTaskCalendarWidget } from '../../components/DashboardTaskCalendarWidget';
import { AiDashboardInsightsCard } from '../../components/AiDashboardInsightsCard';
import { UserReportExportModal } from '../../components/UserReportExportModal';
import { getActiveSharedSupporterItems } from '../../utils/careRelay';
import supporterListeningImg from '../../assets/images/supporter_care_pathway_1794930648353.jpg';

interface Props {
  onSelectTab: (tab: string) => void;
  onOpenQuickReflection?: () => void;
}

export const SupporterDashboardView: React.FC<Props> = ({ onSelectTab }) => {
  const {
    supportPlans,
    supporterEvents,
    supporterReflections,
    addSupporterReflection,
    sharedSupporterItems,
    language,
    personalizationProfile,
    openAiAssistant,
  } = useApp();
  const activeSharedItems = getActiveSharedSupporterItems(sharedSupporterItems);

  const theme = ROLE_THEME_META.supporter;

  const [selectedMood, setSelectedMood] = useState<SupporterMood>('steady');
  const [quickNote, setQuickNote] = useState('');
  const [justCheckedIn, setJustCheckedIn] = useState(false);
  const [copied14405, setCopied14405] = useState(false);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);

  const planProgress = calculateSupportPlanProgress(supportPlans);
  const todayStr = new Date().toISOString().split('T')[0];
  const activePlan = supportPlans.find(p => !p.completed) || supportPlans[0];
  const nextTask = activePlan?.tasks.find(t => !t.completed) || activePlan?.tasks[0];

  const handleCopy14405 = async () => {
    const ok = await copyPhoneToClipboard('14405');
    if (ok) {
      setCopied14405(true);
      setTimeout(() => setCopied14405(false), 1800);
    }
  };

  const handleQuickCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    addSupporterReflection({
      date: todayStr,
      type: 'quick',
      mood: selectedMood,
      quickNote: quickNote.trim() || undefined,
      tags: ['daily_checkin'],
    });
    setQuickNote('');
    setJustCheckedIn(true);
    setTimeout(() => setJustCheckedIn(false), 3000);
  };

  const moods: { id: SupporterMood; label: string; icon: React.ElementType }[] = [
    { id: 'encouraged', label: 'Upbeat', icon: Sprout },
    { id: 'steady', label: 'Steady', icon: Anchor },
    { id: 'concerned', label: 'Worried', icon: Cloud },
    { id: 'drained', label: 'Drained', icon: BatteryWarning },
    { id: 'hopeful', label: 'Hopeful', icon: Sparkles },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Minimalist Hero: Clear Role Clarity + Single Critical CTA + Custom Role 02 Illustration */}
      <section className={`relative bg-gradient-to-br ${theme.heroGradient} text-white rounded-3xl p-6 sm:p-8 shadow-md overflow-hidden`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-4 flex-1 min-w-0">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
                <span>{language === 'ml' ? 'റോൾ 02 · സപ്പോർട്ടർ മോഡ്' : 'Role 02 · Supporter Mode'}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {personalizationProfile.name
                  ? language === 'ml'
                    ? `${personalizationProfile.name}, നിങ്ങളുടെ കരുതൽ പ്രധാനമാണ്.`
                    : `Calm support matters, ${personalizationProfile.name}.`
                  : language === 'ml'
                  ? 'നിങ്ങളുടെ കരുതൽ പ്രധാനമാണ്.'
                  : 'Calm support changes everything.'}
              </h1>

              <p className="text-xs sm:text-sm text-orange-100/90 leading-relaxed">
                {language === 'ml'
                  ? 'ഭയപ്പെടുത്തലില്ലാതെ പ്രിയപ്പെട്ടവരോട് സംസാരിക്കാൻ തയ്യാറെടുക്കുക.'
                  : 'Rehearse non-judgmental talks, match Kerala hospitals, and save supporter notes & appointments.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => onSelectTab('talk')}
                className={`px-5 py-3 rounded-xl text-xs font-extrabold shadow-xs inline-flex items-center gap-2 transition-colors cursor-pointer shrink-0 ${theme.primaryButton}`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>{language === 'ml' ? 'എഐ ടോക്ക് കോച്ച് തുറക്കുക' : 'Open AI Talk Coach'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowPdfModal(true)}
                className="px-4 py-3 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-amber-300" />
                <span>{language === 'ml' ? 'PDF റിപ്പോർട്ട്' : 'My PDF Report'}</span>
              </button>
            </div>
          </div>

          {!heroImgFailed && (
            <div className="w-full lg:w-[310px] xl:w-[350px] shrink-0">
              <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden border border-white/15 bg-orange-950/50 shadow-lg">
                <img
                  src={supporterListeningImg}
                  alt="Attentive family supporter listening warmly to a young adult across a luminous dialogue ribbon beside protective boundary, planning stones, and care compass symbols"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Picked For You Personalization Card */}
      <section className="bg-white border border-orange-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-orange-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              {personalizationProfile.name
                ? `Picked for ${personalizationProfile.name}`
                : 'Picked for you today'}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-900 leading-snug">
            {nextTask
              ? `Next gentle focus: ${nextTask.title}`
              : language === 'ml'
              ? personalizationProfile.tailoredTipMl || personalizationProfile.tailoredTip
              : personalizationProfile.tailoredTip}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              openAiAssistant({
                role: 'supporter',
                contextRef: {
                  area: 'Supporter Home',
                  topicTitle: activePlan?.title || 'Next Supportive Step',
                  snippet: nextTask?.title || personalizationProfile.tailoredTip,
                },
              })
            }
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#9A3412] hover:bg-[#7C2D12] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Ask AI</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('understand')}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-950 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Open Quick Guides</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Clean 3-Stat Glance Row */}
      <section className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-orange-200/80 p-4 flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-slate-500">Plan Progress</div>
            <div className="text-xl sm:text-2xl font-extrabold text-orange-950 font-mono-tabular mt-0.5">
              {planProgress.percentageCompleted}%
            </div>
          </div>
          <ClipboardList className="w-5 h-5 text-orange-700 shrink-0" />
        </div>

        <div className="bg-white rounded-2xl border border-orange-200/80 p-4 flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-slate-500">Reflections</div>
            <div className="text-xl sm:text-2xl font-extrabold text-orange-950 font-mono-tabular mt-0.5">
              {supporterReflections.length}
            </div>
          </div>
          <Heart className="w-5 h-5 text-orange-700 shrink-0" />
        </div>

        <div className="bg-white rounded-2xl border border-orange-200/80 p-4 flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-slate-500">Planned Talks</div>
            <div className="text-xl sm:text-2xl font-extrabold text-orange-950 font-mono-tabular mt-0.5">
              {supporterEvents.length}
            </div>
          </div>
          <Calendar className="w-5 h-5 text-amber-600 shrink-0" />
        </div>
      </section>

      {/* Focused 2-Card Centerpiece */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Card 1: Supporter Wellbeing Check-In */}
        <div className="bg-white border border-orange-200/80 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-800 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Supporter Check-In</h2>
                <p className="text-xs text-slate-500">How are you holding up emotionally today?</p>
              </div>
            </div>
            <span className="text-[11px] font-mono-tabular text-slate-400">{todayStr}</span>
          </div>

          <form onSubmit={handleQuickCheckIn} className="space-y-3.5">
            <div className="grid grid-cols-5 gap-1.5">
              {moods.map(m => {
                const IconComp = m.icon;
                const active = selectedMood === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMood(m.id)}
                    className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      active
                        ? 'border-[#9A3412] bg-[#9A3412] text-white font-bold shadow-xs'
                        : 'border-slate-200 hover:border-orange-300 text-slate-700 bg-white'
                    }`}
                  >
                    <IconComp className={`w-4 h-4 ${active ? 'text-amber-300' : 'text-orange-700'}`} />
                    <span className="text-[10px] truncate max-w-full">{m.label}</span>
                  </button>
                );
              })}
            </div>

            <textarea
              rows={4}
              maxLength={3000}
              value={quickNote}
              onChange={e => setQuickNote(e.target.value)}
              placeholder="Write freely about how you are holding up today—a short thought or a whole paragraph..."
              className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-sm text-slate-900 leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-600/20"
            />

            <button
              type="submit"
              className="w-full py-2.5 bg-[#9A3412] hover:bg-[#7C2D12] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              {justCheckedIn ? 'Saved to Private Vault' : 'Save Wellbeing Check-In'}
            </button>
          </form>
        </div>

        {/* Card 2: Next Care Step & Direct Kerala Helpline */}
        <div className="bg-white border border-orange-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Current Focus</h2>
                <p className="text-xs text-slate-500">One gentle step at a time</p>
              </div>
            </div>

            {activePlan && nextTask ? (
              <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200/70 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-900">
                  {activePlan.title}
                </span>
                <p className="text-sm font-bold text-slate-900">{nextTask.title}</p>
                <p className="text-xs text-slate-600">{activePlan.objective}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-3">
                All planned tasks complete. Protect calm rest time for yourself today.
              </p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                Kerala Vimukthi 24/7
              </div>
              <div className="text-xs text-slate-200 mt-0.5">Confidential guidance for families</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopy14405}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="Copy 14405"
              >
                {copied14405 ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <a
                href="tel:14405"
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold inline-flex items-center gap-1.5 tabular-nums"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>14405</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Progressive Disclosure for AI Helper & Scheduled Talks */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setShowMoreTools(v => !v)}
          className="w-full py-3 px-4 rounded-2xl bg-white border border-orange-200/80 hover:bg-orange-50/40 text-xs font-bold text-orange-950 flex items-center justify-between cursor-pointer"
        >
          <span>
            {showMoreTools
              ? language === 'ml'
                ? 'AI സഹായിയും ടാസ്ക്കുകളും മറയ്ക്കുക'
                : 'Hide AI Helper & Scheduled Talks'
              : language === 'ml'
                ? 'AI സഹായിയും ടാസ്ക്കുകളും കാണുക'
                : 'Show AI Helper & Scheduled Talks'}
          </span>
          <Sparkles className="w-4 h-4 text-orange-700" />
        </button>

        {showMoreTools && (
          <div className="space-y-6">
            <AiDashboardInsightsCard
              role="supporter"
              statsSummary={`${planProgress.percentageCompleted}% plan progress · ${supporterReflections.length} reflections · ${supporterEvents.length} scheduled talks`}
              recentHighlights={[
                ...(activePlan ? [`Active plan: ${activePlan.title}`] : []),
                ...supporterReflections.slice(0, 3).map(r => `${r.date} (${r.mood}): ${r.quickNote || 'Check-in saved'}`),
              ]}
              onNavigateTab={onSelectTab}
            />

            <DashboardTaskCalendarWidget
              role="supporter"
              onOpenCalendar={() => onSelectTab('calendar')}
            />
          </div>
        )}
      </div>

      {/* Consent-Scoped Shared Updates from Role 01 */}
      <section className="bg-white border border-orange-200/80 rounded-3xl p-6 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Updates Shared With You
            </h2>
            <p className="text-sm text-slate-600">
              Only goals or clinic dates that the person chooses to share appear here. Private journals stay private.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-lg bg-orange-50 text-orange-900 border border-orange-200 self-start">
            {activeSharedItems.length} Shared
          </span>
        </div>

        {activeSharedItems.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeSharedItems.map(item => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-orange-50/50 border border-orange-200/80 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#9A3412]">
                    {item.kind.replace(/_/g, ' ')}
                  </span>
                  {item.targetDate && (
                    <span className="text-xs font-mono-tabular text-slate-500">
                      {item.targetDate}
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold text-slate-900">{item.title}</div>
                <p className="text-sm text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-sm text-slate-600">
            Nothing has been shared from Personal Mode yet. Personal check-ins stay private unless a goal or visit date is shared.
          </div>
        )}
      </section>

      <UserReportExportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        role="supporter"
      />
    </div>
  );
};
