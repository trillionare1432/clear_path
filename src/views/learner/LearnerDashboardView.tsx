import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LEARNER_LESSONS, LEARNER_SCENARIOS } from '../../constants/learnerData';
import { Lesson } from '../../types';
import { LessonReaderWorkspace } from '../../components/LessonReaderWorkspace';
import { ROLE_THEME_META } from '../../constants/featureCatalog';
import { DashboardTaskCalendarWidget } from '../../components/DashboardTaskCalendarWidget';
import { AiDashboardInsightsCard } from '../../components/AiDashboardInsightsCard';
import { UserReportExportModal } from '../../components/UserReportExportModal';
import learnerUnderstandImg from '../../assets/images/learner_brain_science_1794930649360.jpg';
import {
  Sparkles,
  BookOpen,
  ArrowRight,
  Clock,
  Award,
  Check,
  Flame,
  ShieldCheck,
  MessageCircle,
  FileText,
} from 'lucide-react';

interface Props {
  onSelectTab: (tab: string) => void;
}

export const LearnerDashboardView: React.FC<Props> = ({ onSelectTab }) => {
  const {
    completedLessonIds,
    savedScenarioAttempts,
    learnerStudyDates,
    learnerCertificate,
    language,
    personalizationProfile,
    openAiAssistant,
  } = useApp();

  const theme = ROLE_THEME_META.learner;
  const [activeReadingLesson, setActiveReadingLesson] = useState<Lesson | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showStudyTools, setShowStudyTools] = useState(false);

  const nextLesson = LEARNER_LESSONS.find(l => !completedLessonIds.includes(l.id)) || LEARNER_LESSONS[0];
  const completedCount = completedLessonIds.length;
  const totalLessons = LEARNER_LESSONS.length;
  const scenariosSolved = Object.keys(savedScenarioAttempts).length;
  const daysDone = Math.min(3, learnerStudyDates.length);

  // Open short lesson directly inside the full distraction-free Inline Reader
  if (activeReadingLesson) {
    return (
      <LessonReaderWorkspace
        lesson={activeReadingLesson}
        lessonList={LEARNER_LESSONS}
        backLabel="Back to Learner Hub"
        onSelectLesson={setActiveReadingLesson}
        onBack={() => setActiveReadingLesson(null)}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Minimalist Hero: Clear Next Action + Custom Role 03 Illustration */}
      <section className={`relative bg-gradient-to-br ${theme.heroGradient} text-white rounded-3xl p-6 sm:p-8 shadow-md overflow-hidden`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-4 flex-1 min-w-0">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2.5 text-xs font-bold text-sky-300 uppercase tracking-wider">
                <span>{language === 'ml' ? 'റോൾ 03 · ലേണർ ലാബ്' : 'Role 03 · Learner Lab'}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {personalizationProfile.name
                  ? language === 'ml'
                    ? `${personalizationProfile.name}, ലളിതമായി പഠിക്കാം.`
                    : `Welcome back, ${personalizationProfile.name}.`
                  : language === 'ml'
                  ? 'ലളിതമായി പഠിക്കാം.'
                  : 'Short Science. Real Confidence.'}
              </h1>

              <p className="text-sm text-sky-100/95 leading-relaxed">
                {language === 'ml'
                  ? 'ലഹരി ശാസ്ത്രവും സമ്മർദ്ദങ്ങളെ നേരിടാനുള്ള വഴികളും 5 മിനിറ്റ് പാഠങ്ങളിലൂടെയും പരിശീലനത്തിലൂടെയും പഠിക്കാം.'
                  : 'Read 8 simple 5-minute topics, practice saying "No" to friends without awkwardness, and find local sports, skills & youth clubs.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => onSelectTab('pathways')}
                className={`px-5 py-3 rounded-xl text-xs font-extrabold shadow-xs inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer ${theme.primaryButton}`}
              >
                <BookOpen className="w-4 h-4" />
                <span>{language === 'ml' ? '8 പഠന വിഷയങ്ങൾ കാണുക' : 'Open 8 Simple Topics'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setShowPdfModal(true)}
                className="px-4 py-3 rounded-xl text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/20 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
              >
                <FileText className="w-4 h-4 text-sky-300" />
                <span>{language === 'ml' ? 'പഠന PDF' : 'Learning PDF'}</span>
              </button>
            </div>
          </div>

          {!heroImgFailed && (
            <div className="w-full lg:w-[310px] xl:w-[350px] shrink-0">
              <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden border border-white/15 bg-blue-950/60 shadow-lg">
                <img
                  src={learnerUnderstandImg}
                  alt="Curious university student examining brain science and healthy habit pathways"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Picked For You Learning Strip */}
      <section className="bg-white border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-blue-800">
            <Sparkles className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span>
              {personalizationProfile.name
                ? `Picked for ${personalizationProfile.name}`
                : 'Picked for your learning pace'}
            </span>
          </div>
          <p className="text-sm font-semibold text-slate-900 leading-snug">
            Up next: <span className="text-blue-900">{nextLesson.title}</span> ({nextLesson.readTimeMinutes} min)
          </p>
          <p className="text-xs text-slate-600">
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
                role: 'learner',
                contextRef: {
                  area: 'Learner Home',
                  topicTitle: nextLesson.title,
                  snippet: nextLesson.summary,
                },
              })
            }
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Ask AI</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveReadingLesson(nextLesson)}
            className="min-h-[40px] px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-blue-200 text-blue-950 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Read Next Lesson</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* Clean 3-Stat Glance Row */}
      <section className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-slate-500">Study Days</div>
            <div className="text-xl sm:text-2xl font-extrabold text-blue-950 font-mono-tabular mt-0.5">
              {daysDone} / 3
            </div>
          </div>
          <Flame className={`w-5 h-5 shrink-0 ${daysDone > 0 ? 'text-amber-500' : 'text-slate-300'}`} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-slate-500">Short Lessons</div>
            <div className="text-xl sm:text-2xl font-extrabold text-blue-950 font-mono-tabular mt-0.5">
              {completedCount} / {totalLessons}
            </div>
          </div>
          <BookOpen className="w-5 h-5 shrink-0 text-blue-700" />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] sm:text-xs font-semibold text-slate-500">Peer Drills</div>
            <div className="text-xl sm:text-2xl font-extrabold text-blue-950 font-mono-tabular mt-0.5">
              {scenariosSolved} / {LEARNER_SCENARIOS.length}
            </div>
          </div>
          <ShieldCheck className="w-5 h-5 shrink-0 text-sky-600" />
        </div>
      </section>

      {/* Focused 2-Card Centerpiece */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Card 1: Up Next Lesson */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-50 text-blue-800 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
                  Up Next Short Lesson
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-mono-tabular text-slate-500">
                <Clock className="w-3.5 h-3.5" />
                {nextLesson.readTimeMinutes} min
              </span>
            </div>

            <h2 className="text-lg font-extrabold text-slate-900">{nextLesson.title}</h2>
            <p className="prose-readable-sm text-slate-600">{nextLesson.summary}</p>
          </div>

          <button
            type="button"
            onClick={() => setActiveReadingLesson(nextLesson)}
            className="w-full py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Start Reading Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: Multi-Day Certificate Readiness */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  {learnerCertificate ? 'Certificate Ready' : 'Certificate Milestones'}
                </h2>
                <p className="text-xs text-slate-500">
                  {learnerCertificate
                    ? `Issued to ${learnerCertificate.recipientName}`
                    : 'Complete steady steps across days to unlock the final test'}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              {[
                { label: 'Study across 3 separate days', done: learnerStudyDates.length >= 3, val: `${daysDone}/3` },
                { label: 'Finish 4 core science lessons', done: completedCount >= 4, val: `${Math.min(4, completedCount)}/4` },
                { label: 'Complete 2 refusal drills', done: scenariosSolved >= 2, val: `${Math.min(2, scenariosSolved)}/2` },
              ].map(req => (
                <div
                  key={req.label}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs"
                >
                  <span className="flex items-center gap-2 font-medium text-slate-800">
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        req.done ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </span>
                    {req.label}
                  </span>
                  <span className="font-mono-tabular font-bold text-blue-900">{req.val}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('certificate')}
            className="w-full py-2.5 bg-sky-50 hover:bg-sky-100 text-blue-950 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Award className="w-3.5 h-3.5 text-blue-700" />
            <span>{learnerCertificate ? 'View Certificate' : 'Open Exam & Certificate'}</span>
          </button>
        </div>
      </div>

      {/* Progressive Disclosure for AI Study Summary & Tasks */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setShowStudyTools(v => !v)}
          className="w-full py-3 px-4 rounded-2xl bg-white border border-blue-200 hover:bg-sky-50/50 text-xs font-bold text-blue-950 flex items-center justify-between cursor-pointer"
        >
          <span>
            {showStudyTools
              ? language === 'ml'
                ? 'AI പഠന സഹായിയും ടാസ്ക്കുകളും മറയ്ക്കുക'
                : 'Hide AI Study Summary & Tasks'
              : language === 'ml'
                ? 'AI പഠന സഹായിയും ടാസ്ക്കുകളും കാണുക'
                : 'Show AI Study Summary & Tasks'}
          </span>
          <Sparkles className="w-4 h-4 text-blue-700" />
        </button>

        {showStudyTools && (
          <div className="space-y-6">
            <AiDashboardInsightsCard
              role="learner"
              statsSummary={`${completedCount}/${totalLessons} lessons · ${scenariosSolved}/${LEARNER_SCENARIOS.length} drills · ${daysDone}/3 study days`}
              recentHighlights={[
                `Next topic: ${nextLesson.title}`,
                ...completedLessonIds.slice(0, 3).map(id => `Completed: ${LEARNER_LESSONS.find(l => l.id === id)?.title || id}`),
              ]}
              onNavigateTab={onSelectTab}
            />

            <DashboardTaskCalendarWidget
              role="learner"
              onOpenCalendar={() => onSelectTab('calendar')}
            />
          </div>
        )}
      </div>

      <UserReportExportModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        role="learner"
      />
    </div>
  );
};
