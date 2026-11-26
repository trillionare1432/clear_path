import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Lesson } from '../types';
import { LEARNER_PATHWAYS, LEARNER_LESSONS } from '../constants/learnerData';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  Sparkles,
  HelpCircle,
  Lightbulb,
  ExternalLink,
  ListChecks,
  ShieldCheck,
  Loader2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';

interface LessonReaderWorkspaceProps {
  lesson: Lesson;
  lessonList?: Lesson[];
  backLabel?: string;
  onSelectLesson: (lesson: Lesson) => void;
  onBack: () => void;
}

export const LessonReaderWorkspace: React.FC<LessonReaderWorkspaceProps> = ({
  lesson,
  lessonList,
  backLabel = 'Back to All Topics',
  onSelectLesson,
  onBack,
}) => {
  const {
    completedLessonIds,
    toggleCompleteLesson,
    bookmarkedLessonIds,
    toggleBookmarkLesson,
    saveQuizAttempt,
    recordLearnerStudyDay,
    openAiAssistant,
    language,
  } = useApp();

  const containerRef = useRef<HTMLDivElement>(null);

  // Use provided ordered list (e.g. filtered library or all 16 curriculum lessons)
  const playlist = lessonList && lessonList.length > 0 ? lessonList : LEARNER_LESSONS;
  const currentIndex = playlist.findIndex(l => l.id === lesson.id);
  const prevLesson = currentIndex > 0 ? playlist[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex + 1 < playlist.length ? playlist[currentIndex + 1] : null;

  const pathway = LEARNER_PATHWAYS.find(p => p.id === lesson.pathwayId);
  const pathwayLessons = LEARNER_LESSONS.filter(l => l.pathwayId === lesson.pathwayId);
  const lessonNumInPathway = pathwayLessons.findIndex(l => l.id === lesson.id) + 1;

  const isCompleted = completedLessonIds.includes(lesson.id);
  const isBookmarked = bookmarkedLessonIds.includes(lesson.id);

  // Reading section navigation & mini-quiz state (reset when switching lessons)
  const [activePart, setActivePart] = useState<'read' | 'takeaways' | 'quiz'>('read');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);
  const [readerTextSize, setReaderTextSize] = useState<'normal' | 'large'>('normal');

  // Educational AI Concept Explainer (Part 6 / Part 8 — strictly non-diagnostic)
  const [aiExplainOpen, setAiExplainOpen] = useState(false);
  const [aiExplainLoading, setAiExplainLoading] = useState(false);
  const [aiExplainText, setAiExplainText] = useState<string | null>(null);

  useEffect(() => {
    setActivePart('read');
    setSelectedAnswers({});
    setSubmittedQuiz(false);
    setAiExplainOpen(false);
    setAiExplainText(null);
    recordLearnerStudyDay();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [lesson.id]);

  const handleRequestAiExplain = async () => {
    setAiExplainOpen(true);
    if (aiExplainText) return;
    setAiExplainLoading(true);
    try {
      const resp = await fetch('/api/ai/summarize-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          text: `Lesson: ${lesson.title} (${lesson.learningCategory || 'Prevention Science'}). ${lesson.summary} Practical tip: ${lesson.practicalApplication}`,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const bullets = Array.isArray(data.summaryBullets) ? data.summaryBullets.filter(Boolean) : [];
        const formatted =
          bullets.length > 0
            ? bullets.join(' ')
            : data.summary || `${lesson.summary} Everyday takeaway: ${lesson.practicalApplication}`;
        setAiExplainText(formatted);
      } else {
        setAiExplainText(`${lesson.summary} Everyday takeaway: ${lesson.practicalApplication}`);
      }
    } catch {
      setAiExplainText(`${lesson.summary} Everyday takeaway: ${lesson.practicalApplication}`);
    } finally {
      setAiExplainLoading(false);
    }
  };

  const handleSelectAnswer = (qId: string, optIdx: number) => {
    if (submittedQuiz) return;
    setSelectedAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const handleGradeQuiz = () => {
    let correctCount = 0;
    lesson.quizQuestions.forEach(q => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });

    saveQuizAttempt({
      lessonId: lesson.id,
      score: correctCount,
      totalQuestions: lesson.quizQuestions.length,
      date: new Date().toISOString().split('T')[0],
    });

    setSubmittedQuiz(true);
    if (!isCompleted) {
      toggleCompleteLesson(lesson.id);
    }
  };

  const handleCompleteAndNext = () => {
    if (!isCompleted) {
      toggleCompleteLesson(lesson.id);
    }
    if (nextLesson) {
      onSelectLesson(nextLesson);
    } else {
      onBack();
    }
  };

  const hasQuiz = lesson.quizQuestions.length > 0;
  const stepItems: { id: 'read' | 'takeaways' | 'quiz'; label: string }[] = [
    { id: 'read', label: `1. Read (${lesson.sections.length} parts)` },
    { id: 'takeaways', label: '2. Key Points & Daily Use' },
    ...(hasQuiz ? [{ id: 'quiz' as const, label: `3. Quick Check (${lesson.quizQuestions.length})` }] : []),
  ];

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-5 pb-14 animate-tab-fade">
      {/* Top Reader Navigation Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:px-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{backLabel}</span>
          </button>

          {pathway && (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 min-w-0 truncate">
              <span className="font-bold text-blue-900 truncate">
                Topic 0{pathway.number}: {pathway.title}
              </span>
              {lessonNumInPathway > 0 && (
                <>
                  <span>·</span>
                  <span className="font-mono-tabular shrink-0">
                    Lesson {lessonNumInPathway} of {pathwayLessons.length}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div
            className="inline-flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200"
            role="group"
            aria-label="Reading text size"
          >
            <button
              type="button"
              onClick={() => setReaderTextSize('normal')}
              className={`min-h-[36px] px-2.5 rounded-lg text-xs font-bold cursor-pointer ${
                readerTextSize === 'normal' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
              }`}
              title="Standard reading size"
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setReaderTextSize('large')}
              className={`min-h-[36px] px-2.5 rounded-lg text-sm font-extrabold cursor-pointer ${
                readerTextSize === 'large' ? 'bg-white text-blue-900 shadow-2xs' : 'text-slate-600'
              }`}
              title="Larger comfortable reading size"
            >
              A+
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              openAiAssistant({
                role: 'learner',
                contextRef: {
                  area: 'Lesson Reader',
                  topicTitle: lesson.title,
                  snippet: lesson.summary,
                },
              })
            }
            className="min-h-[40px] px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{language === 'ml' ? 'AI-യോട് ചോദിക്കൂ' : 'Confused? Ask AI'}</span>
          </button>

          <button
            type="button"
            onClick={() => toggleBookmarkLesson(lesson.id)}
            className={`min-h-[40px] px-3 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              isBookmarked
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
            <span className="hidden sm:inline">{isBookmarked ? 'Saved' : 'Save'}</span>
          </button>

          <button
            type="button"
            onClick={() => toggleCompleteLesson(lesson.id)}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              isCompleted
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-sky-50 text-blue-900 border border-blue-200 hover:bg-sky-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isCompleted ? 'Completed' : 'Mark Done'}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Reading Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Sidebar: Easy Lesson & Topic Manager */}
        <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="editorial-kicker text-blue-900">
                {pathway ? `Topic 0${pathway.number} Lessons` : 'Lesson Guide'}
              </span>
              <span className="text-xs font-mono-tabular font-bold text-slate-500">
                {currentIndex >= 0 ? `${currentIndex + 1} / ${playlist.length}` : ''}
              </span>
            </div>

            {/* Same-Topic Lessons List */}
            <div className="space-y-2">
              {pathwayLessons.map((pl, idx) => {
                const active = pl.id === lesson.id;
                const done = completedLessonIds.includes(pl.id);
                return (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => onSelectLesson(pl)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      active
                        ? 'bg-blue-900 border-blue-900 text-white shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 text-slate-800 hover:border-blue-300 hover:bg-white'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5 ${
                        active
                          ? 'bg-white/20 text-white'
                          : done
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-sky-100 text-blue-900'
                      }`}
                    >
                      {done && !active ? '✓' : idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold leading-snug">{pl.title}</div>
                      <div
                        className={`text-[11px] mt-1 flex items-center gap-1.5 ${
                          active ? 'text-sky-200' : 'text-slate-500'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{pl.readTimeMinutes} min</span>
                        {done && <span>· Done</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Step Jump inside this lesson */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <ListChecks className="w-3.5 h-3.5" />
                <span>Inside This Lesson</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {stepItems.map(st => {
                  const isStepActive = activePart === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        setActivePart(st.id);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer ${
                        isStepActive
                          ? 'bg-sky-50 text-blue-900 border border-blue-200'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Previous / Next Lesson Switcher */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={!prevLesson}
              onClick={() => prevLesson && onSelectLesson(prevLesson)}
              className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-left transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                ← Previous
              </span>
              <span className="text-xs font-bold text-slate-800 line-clamp-1 mt-0.5">
                {prevLesson ? prevLesson.title : 'First lesson'}
              </span>
            </button>

            <button
              type="button"
              disabled={!nextLesson}
              onClick={() => nextLesson && onSelectLesson(nextLesson)}
              className="p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-right transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                Next →
              </span>
              <span className="text-xs font-bold text-slate-800 line-clamp-1 mt-0.5">
                {nextLesson ? nextLesson.title : 'Last lesson'}
              </span>
            </button>
          </div>
        </aside>

        {/* Right Main Column: Distraction-Free Editorial Reader */}
        <article className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 sm:p-9 shadow-xs space-y-7">
          {/* Lesson Title & Plain Summary */}
          <header className="space-y-4 pb-6 border-b border-slate-100">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-sky-50 text-blue-900 border border-blue-200 font-bold">
                {pathway ? pathway.title : 'Short Lesson'}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {lesson.readTimeMinutes} min read
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 font-semibold capitalize">
                {lesson.difficulty}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
              {lesson.title}
            </h1>
            <p className="editorial-subtitle text-slate-600">{lesson.subtitle}</p>

            {/* Plain-English "In Short" Box */}
            <div className="p-5 rounded-2xl bg-sky-50/70 border border-blue-200/80 flex items-start gap-3.5">
              <BookOpen className="w-5 h-5 text-blue-800 shrink-0 mt-0.5" />
              <div>
                <span className="editorial-kicker text-blue-900 block">In Short · What You Will Learn</span>
                <p className="prose-readable text-slate-800 mt-1">{lesson.objective}</p>
              </div>
            </div>

            {/* Part 6C Scientific Knowledge Standards & Provenance */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Evidence Standard
                </span>
                <span
                  className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md font-bold text-[11px] ${
                    lesson.evidenceLevel === 'emerging'
                      ? 'bg-amber-50 text-amber-900 border border-amber-200'
                      : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3" />
                  {lesson.evidenceLevel === 'emerging'
                    ? 'Emerging Research'
                    : 'Established Evidence'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Category
                </span>
                <span className="font-semibold text-slate-800 mt-1 block leading-snug">
                  {lesson.learningCategory || pathway?.title || 'Prevention Science'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Source Organization
                </span>
                <span className="font-semibold text-slate-800 mt-1 block leading-snug">
                  {lesson.sourceOrganization || 'WHO / UNODC / NIMHANS Evidence Review'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Publication &amp; Review
                </span>
                <span className="font-mono-tabular font-semibold text-slate-700 mt-1 block">
                  {lesson.publicationDate || '2024'} · Verified {lesson.lastVerified || '2026-11'}
                </span>
              </div>
            </div>

            {/* Mobile / Inline Step Bar */}
            <div className="flex flex-wrap gap-2 pt-2">
              {stepItems.map(st => {
                const active = activePart === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setActivePart(st.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                      active
                        ? 'bg-blue-900 text-white border-blue-900'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st.label}
                  </button>
                );
              })}
            </div>
          </header>

          {/* PART 1: CLEAN READING SECTIONS */}
          {activePart === 'read' && (
            <div className="space-y-6 animate-tab-fade">
              {lesson.sections.map((sec, idx) => (
                <section
                  key={idx}
                  className="p-6 sm:p-7 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      {sec.heading}
                    </h2>
                    <button
                      type="button"
                      onClick={() =>
                        openAiAssistant({
                          role: 'learner',
                          contextRef: {
                            area: 'Lesson Section',
                            topicTitle: `${lesson.title}: ${sec.heading}`,
                            snippet: sec.content.slice(0, 360),
                          },
                        })
                      }
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-xs font-semibold text-indigo-700 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer shrink-0"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{language === 'ml' ? 'ഇത് എളുപ്പത്തിൽ ചോദിക്കാം' : 'Ask AI about this'}</span>
                    </button>
                  </div>
                  <p className={`${readerTextSize === 'large' ? 'prose-readable-lg' : 'prose-readable'} prose-measure text-slate-700 whitespace-pre-line`}>
                    {sec.content}
                  </p>
                </section>
              ))}

              {/* Educational AI Concept Explainer + Chat Continuity */}
              <div className="p-5 rounded-2xl bg-sky-50/60 border border-blue-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-blue-950">
                    <Sparkles className="w-4 h-4 text-blue-700" />
                    <span>{language === 'ml' ? 'ലളിതമായ വിശദീകരണം വേണോ?' : 'Need a Simple Explanation?'}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openAiAssistant({
                          role: 'learner',
                          contextRef: {
                            area: 'Lesson Reader',
                            topicTitle: lesson.title,
                            snippet: lesson.summary,
                          },
                          initialQuestion: `Explain "${lesson.title}" in very simple everyday words with 1 example.`,
                        })
                      }
                      className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-white border border-blue-200 text-blue-900 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{language === 'ml' ? 'ചാറ്റിൽ ചോദിക്കുക' : 'Ask in AI Chat'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRequestAiExplain}
                      disabled={aiExplainLoading}
                      className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 whitespace-nowrap"
                    >
                      {aiExplainLoading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Explaining...</span>
                        </>
                      ) : (
                        <span>{aiExplainOpen ? 'Explanation Open' : 'Explain Here'}</span>
                      )}
                    </button>
                  </div>
                </div>
                {aiExplainOpen && (
                  <div className="p-4 rounded-xl bg-white border border-blue-100 space-y-2">
                    {aiExplainLoading ? (
                      <p className="text-xs text-slate-500">Preparing a plain-language educational summary...</p>
                    ) : (
                      <>
                        <p className="prose-readable-sm text-slate-800">{aiExplainText}</p>
                        <p className="text-[11px] text-slate-500">
                          Educational explanation grounded in the lesson source above — not medical or diagnostic advice.
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Finished reading the {lesson.sections.length} parts?
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setActivePart('takeaways');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Next: Key Points &amp; Daily Use</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* PART 2: KEY POINTS, PRACTICAL USE & REFERENCES */}
          {activePart === 'takeaways' && (
            <div className="space-y-6 animate-tab-fade">
              <div className="p-6 sm:p-7 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 editorial-kicker">
                  <Sparkles className="w-4 h-4 text-blue-700" />
                  <span>Main Points to Remember</span>
                </div>
                <ul className="space-y-3">
                  {lesson.keyTakeaways.map((point, idx) => (
                    <li
                      key={idx}
                      className={`${readerTextSize === 'large' ? 'prose-readable-lg' : 'prose-readable'} text-slate-800 flex items-start gap-3`}
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-700 mt-2.5 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 sm:p-7 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-3.5">
                <Lightbulb className="w-5 h-5 text-emerald-700 shrink-0 mt-1" />
                <div>
                  <span className="editorial-kicker text-emerald-900 block">
                    How to Use This in Real Life Today
                  </span>
                  <p className={`${readerTextSize === 'large' ? 'prose-readable-lg' : 'prose-readable'} prose-measure text-slate-800 mt-1.5`}>
                    {lesson.practicalApplication}
                  </p>
                </div>
              </div>

              {lesson.referenceLinks && lesson.referenceLinks.length > 0 && (
                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Optional Further Reading (Wikipedia)
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {lesson.referenceLinks.map((ref, idx) => (
                      <a
                        key={idx}
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-blue-300 text-xs font-bold text-blue-900 transition-colors"
                      >
                        <span>{ref.label}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-blue-700" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActivePart('read')}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  &larr; Back to Reading
                </button>

                {hasQuiz ? (
                  <button
                    type="button"
                    onClick={() => {
                      setActivePart('quiz');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next: 2-Question Quick Check</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCompleteAndNext}
                    className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{nextLesson ? 'Complete & Next Lesson' : 'Complete Lesson'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* PART 3: CLEAN INTERACTIVE QUICK CHECK QUIZ */}
          {activePart === 'quiz' && hasQuiz && (
            <div className="space-y-5 animate-tab-fade">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-700" />
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Quick Check ({lesson.quizQuestions.length} Questions)
                  </h2>
                </div>
                {submittedQuiz && (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                    <Award className="w-4 h-4" /> Checked &amp; Recorded
                  </span>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-50 border border-blue-200 text-xs text-blue-950 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Knowledge Check Only:</strong> This quiz tests your grasp of scientific concepts and prevention literacy — it never diagnoses a substance-use or mental health condition.
                </span>
              </div>

              <div className="space-y-4">
                {lesson.quizQuestions.map((q, qIdx) => {
                  const userChoice = selectedAnswers[q.id];
                  return (
                    <div
                      key={q.id}
                      className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5"
                    >
                      <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                        {qIdx + 1}. {q.question}
                      </div>

                      <div className="space-y-2.5">
                        {q.options.map((opt, oIdx) => {
                          const isChosen = userChoice === oIdx;
                          let optionStyle =
                            'bg-white border-slate-200 text-slate-700 hover:bg-slate-100';

                          if (submittedQuiz) {
                            if (oIdx === q.correctIndex) {
                              optionStyle =
                                'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                            } else if (isChosen && oIdx !== q.correctIndex) {
                              optionStyle =
                                'bg-rose-50 border-rose-300 text-rose-900 line-through';
                            }
                          } else if (isChosen) {
                            optionStyle =
                              'bg-sky-50 border-blue-700 ring-2 ring-blue-500/20 text-blue-950 font-bold';
                          }

                          return (
                            <button
                              key={oIdx}
                              type="button"
                              disabled={submittedQuiz}
                              onClick={() => handleSelectAnswer(q.id, oIdx)}
                              className={`w-full p-3.5 rounded-xl border prose-readable-sm text-left transition-all flex items-center justify-between gap-2 ${optionStyle} ${
                                submittedQuiz ? 'cursor-default' : 'cursor-pointer'
                              }`}
                            >
                              <span>{opt}</span>
                              {submittedQuiz && oIdx === q.correctIndex && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {submittedQuiz && (
                        <div className="p-4 rounded-xl bg-sky-50/80 border border-blue-200 prose-readable-sm text-blue-950 space-y-1">
                          <div className="font-semibold">{q.explanation}</div>
                          {q.scientificReference && (
                            <div className="text-xs text-blue-800 italic">
                              Source: {q.scientificReference}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActivePart('takeaways')}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  &larr; Back to Key Points
                </button>

                <div className="flex items-center gap-2.5">
                  {!submittedQuiz ? (
                    <button
                      type="button"
                      onClick={handleGradeQuiz}
                      disabled={Object.keys(selectedAnswers).length < lesson.quizQuestions.length}
                      className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      Check Answers
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setSubmittedQuiz(false);
                          setSelectedAnswers({});
                        }}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Try Again
                      </button>
                      <button
                        type="button"
                        onClick={handleCompleteAndNext}
                        className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>
                          {nextLesson ? 'Go to Next Lesson' : 'Finish & Return'}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
};
