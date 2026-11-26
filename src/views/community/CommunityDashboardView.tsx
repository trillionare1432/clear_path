import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Layers,
  Calendar,
  CheckSquare,
  Users,
  Plus,
  MapPin,
  Clock,
  PhoneCall,
  Copy,
  Check,
  Sparkles,
  MessageCircle,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { calculateCommunityImpactMetrics } from '../../utils/logic';
import { CommunityActiveTab } from '../../components/CommunityTopHeader';
import { ROLE_THEME_META } from '../../constants/featureCatalog';
import { copyPhoneToClipboard } from '../../utils/clipboard';
import { KERALA_DISTRICTS } from '../../constants/communityData';
import { AiDashboardInsightsCard } from '../../components/AiDashboardInsightsCard';
import { UserReportExportModal } from '../../components/UserReportExportModal';
import communityImpactImg from '../../assets/images/community_youth_action_1795674640560.jpg';

interface CommunityDashboardViewProps {
  onNavigateTab?: (tab: CommunityActiveTab) => void;
  onOpenCreateProgramme: () => void;
  onOpenCreateEvent: () => void;
  onOpenCreateTask: () => void;
}

export const CommunityDashboardView: React.FC<CommunityDashboardViewProps> = ({
  onNavigateTab,
  onOpenCreateProgramme,
  onOpenCreateEvent,
  onOpenCreateTask,
}) => {
  const {
    communityOrg,
    communityProgrammes,
    communityEvents,
    communityTasks,
    communityFeedback,
    language,
    serverAuthToken,
    personalizationProfile,
    openAiAssistant,
  } = useApp();

  const theme = ROLE_THEME_META.community;
  const [copied14405, setCopied14405] = useState(false);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showQuickEntry, setShowQuickEntry] = useState(false);
  const [showAiStrategy, setShowAiStrategy] = useState(false);

  // Quick real-data entry state (Programme, Outcome, or Local Need)
  const [quickType, setQuickType] = useState<'programme' | 'outcome_evaluation' | 'local_need'>('programme');
  const [quickDistrict, setQuickDistrict] = useState(communityOrg?.district || 'Ernakulam');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickSummary, setQuickSummary] = useState('');
  const [quickPhase, setQuickPhase] = useState<'pre' | 'post'>('post');
  const [quickScore, setQuickScore] = useState(4);
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickMessage, setQuickMessage] = useState<string | null>(null);
  const [quickError, setQuickError] = useState<string | null>(null);

  const handleQuickEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setQuickSaving(true);
    setQuickMessage(null);
    setQuickError(null);
    try {
      const payload: Record<string, unknown> = {
        entryType: quickType,
        district: quickDistrict,
      };
      if (quickType === 'programme') {
        payload.title = quickTitle.trim();
        payload.description = quickSummary.trim();
        payload.publishDirectly = true;
      } else if (quickType === 'outcome_evaluation') {
        payload.phase = quickPhase;
        payload.score = quickScore;
        payload.maxScore = 5;
        payload.topic = quickTitle.trim() || 'Community Session';
        payload.feedbackNote = quickSummary.trim() || undefined;
      } else {
        payload.category = quickTitle.trim() || 'awareness_gap';
        payload.observation = quickSummary.trim();
      }

      const res = await fetch('/api/community/quick-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(serverAuthToken ? { Authorization: `Bearer ${serverAuthToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setQuickError(data.error || 'Could not save entry. Please check the fields.');
        return;
      }
      setQuickTitle('');
      setQuickSummary('');
      setQuickMessage(
        quickType === 'programme'
          ? 'Saved! Your new community programme is live in Intelligence & Maps.'
          : quickType === 'outcome_evaluation'
          ? 'Saved! Anonymous workshop score added to Community Analytics.'
          : 'Saved! Local need observation added to Kerala District Insights.'
      );
    } catch {
      setQuickError('Could not connect right now. Please try again.');
    } finally {
      setQuickSaving(false);
    }
  };

  const metrics = calculateCommunityImpactMetrics(
    communityProgrammes,
    communityEvents,
    communityTasks,
    communityFeedback
  );

  const nextEvent = communityEvents
    .filter(e => e.status === 'scheduled')
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const pendingTasks = communityTasks.filter(t => t.status !== 'completed');

  const handleCopy14405 = async () => {
    const ok = await copyPhoneToClipboard('14405');
    if (ok) {
      setCopied14405(true);
      setTimeout(() => setCopied14405(false), 1800);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Minimalist Hero: Single Critical Role Action + Male-Led Community Prevention Leadership Image */}
      <section className={`relative bg-gradient-to-br ${theme.heroGradient} rounded-3xl p-6 sm:p-8 text-white shadow-md overflow-hidden`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-4 flex-1 min-w-0">
            <div className="space-y-2 max-w-xl">
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
                <span>{language === 'ml' ? 'റോൾ 04 · കമ്മ്യൂണിറ്റി ബിൽഡർ' : 'Role 04 · Community Builder'}</span>
                {communityOrg?.district && (
                  <span className="inline-flex items-center gap-1 text-teal-100 font-medium normal-case">
                    <MapPin className="w-3.5 h-3.5 text-amber-300" />
                    {communityOrg.district}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight text-balance">
                {communityOrg?.name ||
                  (language === 'ml'
                    ? 'കമ്മ്യൂണിറ്റി പ്രതിരോധ പദ്ധതികൾ'
                    : 'Lead local prevention in your neighbourhood')}
              </h1>

              <p className="text-sm text-teal-100/95 leading-relaxed">
                {language === 'ml'
                  ? 'കേരളത്തിലെ വിവരങ്ങൾ പരിശോധിച്ച് ലളിതമായ ബോധവൽക്കരണ പരിപാടികൾ ആസൂത്രണം ചെയ്യുക.'
                  : 'See what your district needs, generate clear programme ideas with AI, and record real workshops in minutes.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onOpenCreateProgramme}
                className={`inline-flex items-center gap-2 px-5 py-3 text-xs font-extrabold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 whitespace-nowrap ${theme.primaryButton}`}
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'ml' ? 'പുതിയ പദ്ധതി' : 'New Prevention Drive'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPdfModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-3 text-xs font-bold rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
              >
                <FileText className="w-4 h-4 text-amber-300" />
                <span>{language === 'ml' ? 'PDF റിപ്പോർട്ട്' : 'Community PDF'}</span>
              </button>
            </div>
          </div>

          {!heroImgFailed && (
            <div className="w-full lg:w-[320px] xl:w-[360px] shrink-0">
              <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden border border-white/15 bg-teal-950/60 shadow-lg">
                <img
                  src={communityImpactImg}
                  alt="Community prevention coordinator leading educators, youth, and public-health volunteers across Kerala district outreach"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Picked For Your District Personalization Strip */}
      <section className="bg-white border border-teal-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-teal-800">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              Picked for {communityOrg?.district || personalizationProfile.district || 'your district'}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-900 leading-snug">
            {language === 'ml'
              ? personalizationProfile.tailoredTipMl || personalizationProfile.tailoredTip
              : personalizationProfile.tailoredTip}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() =>
              openAiAssistant({
                role: 'community',
                contextRef: {
                  area: 'Community Builder',
                  topicTitle: `${communityOrg?.district || 'Kerala'} Prevention Ideas`,
                  snippet: personalizationProfile.tailoredTip,
                },
              })
            }
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-teal-900 hover:bg-teal-950 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Ask AI Ideas</span>
          </button>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('intelligence')}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-950 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Check Local Gaps</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </section>

      {/* Clean 3-Stat Glance Row */}
      <section className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-slate-500">Active Drives</div>
            <div className="text-xl sm:text-2xl font-extrabold text-teal-950 font-mono-tabular mt-0.5">
              {metrics.activeProgrammes}
            </div>
          </div>
          <Layers className="w-5 h-5 text-teal-700 shrink-0" />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-slate-500">People Reached</div>
            <div className="text-xl sm:text-2xl font-extrabold text-teal-950 font-mono-tabular mt-0.5">
              {metrics.totalActualAttendance}
            </div>
          </div>
          <Users className="w-5 h-5 text-amber-600 shrink-0" />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-2">
          <div>
            <div className="text-xs font-semibold text-slate-500">Tasks Done</div>
            <div className="text-xl sm:text-2xl font-extrabold text-teal-950 font-mono-tabular mt-0.5">
              {metrics.taskCompletionRatePct}%
            </div>
          </div>
          <CheckSquare className="w-5 h-5 text-teal-700 shrink-0" />
        </div>
      </section>

      {/* Focused 2-Card Centerpiece */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Card 1: Next Scheduled Session */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Next Session</h2>
              <p className="text-sm text-slate-500">Upcoming campus or neighbourhood workshop</p>
            </div>
          </div>

          {nextEvent ? (
            <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200/70 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900">{nextEvent.title}</h3>
                <span className="text-xs font-bold text-teal-900 bg-white px-2.5 py-0.5 rounded-lg border border-teal-200 font-mono-tabular">
                  ~{nextEvent.expectedAttendance} people
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 font-mono-tabular">
                  <Calendar className="w-3.5 h-3.5 text-teal-700" />
                  {nextEvent.date}
                </span>
                {nextEvent.startTime && (
                  <span className="inline-flex items-center gap-1 font-mono-tabular">
                    <Clock className="w-3.5 h-3.5 text-teal-700" />
                    {nextEvent.startTime}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 truncate max-w-[200px]">
                  <MapPin className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                  {nextEvent.venue}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-sm text-slate-500">
              No session scheduled yet. Add your first campus workshop or community briefing.
            </div>
          )}

          <button
            type="button"
            onClick={onOpenCreateEvent}
            className="w-full py-2.5 bg-teal-900 hover:bg-teal-950 text-white rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Schedule Session</span>
          </button>
        </div>

        {/* Card 2: Pending Volunteer Step & Official Helpline */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900">Team Priority</h2>
                  <p className="text-sm text-slate-500">
                    {pendingTasks.length} pending {pendingTasks.length === 1 ? 'task' : 'tasks'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenCreateTask}
                className="text-xs font-bold text-teal-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {pendingTasks.length > 0 ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-900 truncate">{pendingTasks[0].title}</div>
                  <div className="text-xs text-slate-500 font-mono-tabular mt-0.5">
                    Due {pendingTasks[0].dueDate}
                  </div>
                </div>
                <span className="text-xs uppercase font-bold px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 shrink-0">
                  {pendingTasks[0].priority}
                </span>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No pending volunteer tasks right now.</p>
            )}
          </div>

          <div className="p-4 rounded-2xl bg-teal-950 text-white flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Kerala Referral Desk
              </div>
              <div className="text-sm text-teal-100 mt-0.5">Vimukthi 14405 · DISHA 1056</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleCopy14405}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                title="Copy 14405"
              >
                {copied14405 ? <Check className="w-4 h-4 text-amber-300" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href="tel:14405"
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-teal-950 text-xs font-extrabold inline-flex items-center gap-1.5 tabular-nums whitespace-nowrap"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>14405</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Progressive Disclosure Controls for Quick Data Entry & AI Strategy */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setShowQuickEntry(v => !v)}
          className={`px-4 py-2.5 rounded-2xl border text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-colors ${
            showQuickEntry
              ? 'bg-teal-900 text-white border-teal-900'
              : 'bg-white text-teal-950 border-teal-200 hover:bg-teal-50/60'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{showQuickEntry ? 'Hide Quick Data Entry' : '+ Quick Add Community Data'}</span>
        </button>

        <button
          type="button"
          onClick={() => setShowAiStrategy(v => !v)}
          className={`px-4 py-2.5 rounded-2xl border text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-colors ${
            showAiStrategy
              ? 'bg-teal-900 text-white border-teal-900'
              : 'bg-white text-teal-950 border-teal-200 hover:bg-teal-50/60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{showAiStrategy ? 'Hide AI Strategy Helper' : 'AI Strategy Helper'}</span>
        </button>
      </div>

      {/* Simple 1-Step Real Data Entry for Programmes, Evaluations & Local Needs */}
      {showQuickEntry && (
      <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Quick Add Real Community Data
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Easily add a new prevention drive, workshop score, or local gap observation. Updates Kerala insights right away.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'programme', label: 'New Programme' },
                { id: 'outcome_evaluation', label: 'Workshop Score' },
                { id: 'local_need', label: 'Local Need' },
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setQuickType(tab.id);
                  setQuickMessage(null);
                  setQuickError(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap cursor-pointer ${
                  quickType === tab.id
                    ? 'bg-teal-900 text-white border-teal-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-teal-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleQuickEntrySubmit} className="space-y-3 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">District</label>
              <select
                value={quickDistrict}
                onChange={e => setQuickDistrict(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
              >
                {KERALA_DISTRICTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {quickType === 'outcome_evaluation' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Check Type</label>
                  <select
                    value={quickPhase}
                    onChange={e => setQuickPhase(e.target.value as 'pre' | 'post')}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm"
                  >
                    <option value="pre">Before Session (Pre)</option>
                    <option value="post">After Session (Post)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Average Clarity Score (1–5)</label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={quickScore}
                    onChange={e => setQuickScore(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm font-mono"
                  />
                </div>
              </>
            ) : (
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {quickType === 'programme' ? 'Programme Title *' : 'Gap Type (e.g. evening_youth_space)'}
                </label>
                <input
                  type="text"
                  required={quickType === 'programme'}
                  value={quickTitle}
                  onChange={e => setQuickTitle(e.target.value)}
                  placeholder={
                    quickType === 'programme'
                      ? 'e.g. Evening Badminton & Peer Talk Club'
                      : 'e.g. Lack of evening sports space or Malayalam guides'
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {quickType === 'programme'
                ? 'Short Summary *'
                : quickType === 'outcome_evaluation'
                ? 'What did participants find helpful or hard? (Optional)'
                : 'What need did you notice in this area? *'}
            </label>
            <textarea
              rows={4}
              maxLength={3000}
              required={quickType !== 'outcome_evaluation'}
              value={quickSummary}
              onChange={e => setQuickSummary(e.target.value)}
              placeholder={
                quickType === 'programme'
                  ? 'Describe in full detail who this drive is for, timings, venue, and partner clubs...'
                  : quickType === 'outcome_evaluation'
                  ? 'Write a full summary of what students or participants said worked well and what felt hard...'
                  : 'Write freely about local gaps, timings, sports needs, or Malayalam materials requested...'
              }
              className="w-full px-3.5 py-3 rounded-xl border border-slate-200 text-sm leading-relaxed"
            />
          </div>

          {quickError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-900">
              {quickError}
            </div>
          )}
          {quickMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex flex-wrap items-center justify-between gap-2">
              <span>{quickMessage}</span>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab(quickType === 'outcome_evaluation' ? 'analytics' : 'intelligence')}
                  className="underline font-bold cursor-pointer"
                >
                  View Updated Insights
                </button>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={quickSaving}
              className="px-5 py-2.5 rounded-xl bg-teal-900 hover:bg-teal-950 disabled:opacity-60 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
            >
              {quickSaving ? 'Saving...' : 'Save Real Data'}
            </button>
          </div>
        </form>
      </section>
      )}

      {/* AI Analysis & District Strategy Note Helper */}
      {showAiStrategy && (
        <AiDashboardInsightsCard
          role="community"
          statsSummary={`${metrics.activeProgrammes} active drives · ${metrics.totalActualAttendance} reached · ${metrics.taskCompletionRatePct}% tasks done`}
          recentHighlights={[
            `District focus: ${communityOrg?.district || quickDistrict}`,
            ...communityProgrammes.slice(0, 3).map(p => `Drive: ${p.title}`),
          ]}
          onNavigateTab={tab => {
            if (onNavigateTab) onNavigateTab(tab as CommunityActiveTab);
          }}
        />
      )}

      <UserReportExportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        role="community"
      />
    </div>
  );
};
