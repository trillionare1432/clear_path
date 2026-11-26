import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  LEARNING_CATEGORIES_PART6,
  LEARNER_PATHWAYS,
  LEARNER_LESSONS,
} from '../../constants/learnerData';
import { Lesson } from '../../types';
import { LessonReaderWorkspace } from '../../components/LessonReaderWorkspace';
import { SubstanceResearchPanel } from '../../components/SubstanceResearchPanel';
import {
  BookOpen,
  Brain,
  Activity,
  ShieldCheck,
  Users,
  HeartHandshake,
  Sparkles,
  LifeBuoy,
  Clock,
  CheckCircle2,
  Bookmark,
  ArrowRight,
  ArrowLeft,
  RotateCw,
  Shuffle,
  Sliders,
  Lightbulb,
  Waves,
  Scale,
  Repeat,
  FlaskConical,
  Search,
  MessageCircle,
} from 'lucide-react';

export type LearningMethodTab =
  | 'guided_lessons'
  | 'habit_lab'
  | 'flashcards'
  | 'solution_mechanics'
  | 'substance_lab';

interface LearningStage {
  stageNumber: number;
  title: string;
  subtitle: string;
  pathwayIds: string[];
}

const LEARNING_STAGES: LearningStage[] = [
  {
    stageNumber: 1,
    title: 'Stage 1 · How Substances Affect Brain & Body',
    subtitle: 'Clear, zero-fear science on how habits form and why cravings happen.',
    pathwayIds: ['path-basics', 'path-brain', 'path-consequences'],
  },
  {
    stageNumber: 2,
    title: 'Stage 2 · Stay Strong Under Pressure & Stress',
    subtitle: 'Practical ways to calm stress, handle exams, and say "No" smoothly.',
    pathwayIds: ['path-prevention', 'path-peer-pressure', 'path-emotional'],
  },
  {
    stageNumber: 3,
    title: 'Stage 3 · Healing & Helping Friends Safely',
    subtitle: 'How the brain recovers week by week and how to support someone who is struggling.',
    pathwayIds: ['path-recovery', 'path-helping'],
  },
];

const PLAIN_PATHWAY_SUMMARIES: Record<string, string> = {
  'path-basics': 'How alcohol, nicotine & drugs change body chemistry—and why dependence is medical, not weakness.',
  'path-brain': 'Why dopamine loops hijack focus, and how young brains naturally bounce back.',
  'path-consequences': 'Honest effects on sleep, memory, studies, and health with zero scare tactics.',
  'path-prevention': 'Spot early triggers (tired, stressed, lonely) and steady yourself fast.',
  'path-peer-pressure': 'Calm 5-second ways to turn down friends without drama or awkwardness.',
  'path-emotional': 'Handle anxiety, exam stress, and low days without quick-fix crutches.',
  'path-recovery': 'How the brain heals week by week and what real support looks like.',
  'path-helping': 'Notice when a friend is struggling, listen calmly, and share 14405 safely.',
};

const HABIT_LOOP_SCENARIOS = [
  {
    id: 'exam_stress',
    label: 'Late-Night Exam Stress',
    cue: 'Tired at 11 PM with unfinished notes and rising panic.',
    craving: 'Brain wants an instant hit of relief or focus boost.',
    oldRoutine: 'Reaching for stimulants, nicotine, or binge scrolling till 3 AM.',
    oldOutcome: 'Short spike followed by next-day fog, worse memory, and heavier anxiety.',
    healthySwaps: [
      {
        move: '25-min timer + 5-min cold water & stretch break',
        reward: 'Steady calm, finished work, and deep sleep before midnight.',
      },
      {
        move: 'Write top 2 exam topics on paper and close the rest',
        reward: 'Instant relief from overwhelm without chemical crash.',
      },
    ],
  },
  {
    id: 'peer_hangout',
    label: 'Pressure at a Hangout',
    cue: 'Friends pass something around and joke, "Just try once."',
    craving: 'You want to belong and avoid looking awkward.',
    oldRoutine: 'Saying yes just to blend in, even when uncomfortable.',
    oldOutcome: 'Regret afterwards and harder peer pressure next weekend.',
    healthySwaps: [
      {
        move: '4D Move: "Not for me today—let’s grab food instead."',
        reward: 'You stay confident, keep the friendship calm, and protect tomorrow.',
      },
      {
        move: 'Hold a cold drink and change the topic naturally',
        reward: 'People move on in 10 seconds with zero drama.',
      },
    ],
  },
  {
    id: 'evening_boredom',
    label: 'Lonely or Bored Evening',
    cue: 'Quiet room after college or work with nothing planned.',
    craving: 'Brain seeks fast excitement to escape flat feelings.',
    oldRoutine: 'Looking for quick highs or numbing habits alone.',
    oldOutcome: 'Natural baseline joy drops even lower the next day.',
    healthySwaps: [
      {
        move: '15-min fast walk outside + call one trusted friend',
        reward: 'Natural endorphins lift mood without any rebound crash.',
      },
      {
        move: 'Pick a hands-on hobby (music, sport, cooking)',
        reward: 'Real skill progress builds lasting dopamine.',
      },
    ],
  },
];

const SCIENCE_FLASHCARDS = [
  {
    id: 'fc-1',
    topic: 'Brain Mechanics',
    front: 'How long does an intense urge peak before naturally dropping?',
    back: 'Usually 10 to 15 minutes. If you do not act on it—and ride it out with breathing or movement—the wave rises and passes on its own.',
  },
  {
    id: 'fc-2',
    topic: 'Dopamine Balance',
    front: 'Why do normal things feel boring after repeated substance use?',
    back: 'The brain reduces dopamine receptors to protect itself from overload (tolerance). Rest and drug-free weeks let those receptors grow back.',
  },
  {
    id: 'fc-3',
    topic: 'Refusal Skill',
    front: 'What is the easiest low-drama way to say no to friends?',
    back: 'Keep it short and steady: "Not my thing, let’s grab tea." You never owe anyone a long speech or excuse.',
  },
  {
    id: 'fc-4',
    topic: 'CBT Decision Tool',
    front: 'What does a 2×2 Decision Balance check ask before a choice?',
    back: 'What do I gain right now vs. what does it cost me tomorrow morning—and what do I gain by skipping it?',
  },
  {
    id: 'fc-5',
    topic: 'Kerala Support',
    front: 'What happens if you call Kerala Vimukthi 14405?',
    back: 'A trained counselor answers 24/7 for free in English or Malayalam. Your name and details stay private.',
  },
  {
    id: 'fc-6',
    topic: 'Habit Law',
    front: 'Can you erase a habit cue completely, or should you swap the routine?',
    back: 'Keeping the same cue (stress at 6 PM) and swapping the routine (walk or cold water instead of using) rewires the brain far faster.',
  },
];

const PROVEN_SOLUTION_MECHANICS = [
  {
    title: 'Urge Surfing (15-Minute Wave Rule)',
    origin: 'Mindfulness-Based Relapse Prevention (MBRP)',
    icon: Waves,
    plainSummary:
      'Instead of fighting a craving head-on, watch it like an ocean wave: notice where it sits in your body, breathe slowly for 90 seconds, and let it peak and fall.',
    tryAction: 'Pair with Cognitive Lab → Urge Wave Rider',
  },
  {
    title: '2×2 Cost-Benefit Decision Balance',
    origin: 'SMART Recovery & CBT',
    icon: Scale,
    plainSummary:
      'Cravings only show the next 5 minutes. Writing down "Pros/Cons of Using" vs. "Pros/Cons of Skipping" wakes up your logical front brain immediately.',
    tryAction: 'Use before tough weekend plans',
  },
  {
    title: 'Stimulus Control (Change Your Space)',
    origin: 'Behavioral Habit Design',
    icon: Sliders,
    plainSummary:
      'Willpower gets tired by evening. Removing triggers from your room, muting risky group chats, and planning 6 PM sports cuts cravings before they start.',
    tryAction: 'Set an evening activity in Study Planner',
  },
  {
    title: 'Habit Stacking & Micro-Rewards',
    origin: 'Contingency Reinforcement',
    icon: Repeat,
    plainSummary:
      'Link a small healthy action to something you already do daily—like 5 minutes of sunlight after waking up—and track it to rebuild natural motivation.',
    tryAction: 'Track daily consistency on your Dashboard',
  },
];

export const LearnerPathwaysView: React.FC<{ initialTab?: LearningMethodTab }> = ({
  initialTab = 'guided_lessons',
}) => {
  const { completedLessonIds, bookmarkedLessonIds, toggleBookmarkLesson, recordLearnerStudyDay, openAiAssistant } = useApp();

  const [methodTab, setMethodTab] = useState<LearningMethodTab>(initialTab);
  useEffect(() => {
    setMethodTab(initialTab);
  }, [initialTab]);

  const [activeReadingLesson, setActiveReadingLesson] = useState<Lesson | null>(null);
  const [curriculumSearch, setCurriculumSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAllCategories, setShowAllCategories] = useState(false);

  const filteredCurriculumLessons = useMemo(() => {
    const q = curriculumSearch.trim().toLowerCase();
    return LEARNER_LESSONS.filter(l => {
      if (selectedCategory !== 'all' && l.learningCategory !== selectedCategory) return false;
      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        l.summary.toLowerCase().includes(q) ||
        (l.learningCategory || '').toLowerCase().includes(q) ||
        (l.sourceOrganization || '').toLowerCase().includes(q)
      );
    });
  }, [curriculumSearch, selectedCategory]);

  // Habit Loop Lab state
  const [selectedLoopIdx, setSelectedLoopIdx] = useState(0);
  const [selectedSwapIdx, setSelectedSwapIdx] = useState(0);

  // Flashcards state
  const [cards, setCards] = useState(SCIENCE_FLASHCARDS);
  const [cardIdx, setCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [masteredIds, setMasteredIds] = useState<string[]>([]);

  // Decision Balance quick mini-tool state
  const [balanceChoice, setBalanceChoice] = useState<'use' | 'skip'>('skip');

  const nextRecommendedLesson =
    LEARNER_LESSONS.find(l => !completedLessonIds.includes(l.id)) || LEARNER_LESSONS[0];
  const progressPct = Math.round((completedLessonIds.length / LEARNER_LESSONS.length) * 100);

  const currentLoop = HABIT_LOOP_SCENARIOS[selectedLoopIdx];
  const currentSwap = currentLoop.healthySwaps[selectedSwapIdx] || currentLoop.healthySwaps[0];
  const currentCard = cards[cardIdx];

  const handleToggleMastered = () => {
    recordLearnerStudyDay();
    setMasteredIds(prev =>
      prev.includes(currentCard.id)
        ? prev.filter(id => id !== currentCard.id)
        : [...prev, currentCard.id]
    );
  };

  const handleShuffleCards = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCardIdx(0);
    setIsFlipped(false);
  };

  const getPathwayIcon = (iconName: string) => {
    switch (iconName) {
      case 'Brain':
        return Brain;
      case 'Activity':
        return Activity;
      case 'ShieldCheck':
        return ShieldCheck;
      case 'Users':
        return Users;
      case 'HeartHandshake':
        return HeartHandshake;
      case 'Sparkles':
        return Sparkles;
      case 'LifeBuoy':
        return LifeBuoy;
      default:
        return BookOpen;
    }
  };

  // Dedicated Focused Inline Lesson Reader when any short lesson is open
  if (activeReadingLesson) {
    return (
      <LessonReaderWorkspace
        lesson={activeReadingLesson}
        lessonList={LEARNER_LESSONS}
        backLabel="Back to All 8 Topics"
        onSelectLesson={setActiveReadingLesson}
        onBack={() => setActiveReadingLesson(null)}
      />
    );
  }

  // Dedicated 18+ Substance Explorer focus when launched directly
  if (methodTab === 'substance_lab') {
    return (
      <div className="max-w-6xl mx-auto space-y-5 pb-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setMethodTab('guided_lessons')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Short Lessons &amp; Practice</span>
          </button>
        </div>
        <SubstanceResearchPanel />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-sky-50 border border-blue-200 px-2.5 py-1 rounded-md">
            Learner Studio
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
            Learn Clearly, Step by Step
          </h1>
          <p className="editorial-subtitle text-slate-600 mt-1.5 max-w-2xl">
            Read short 5-minute topics, practice swapping daily habits, or test yourself with quick flashcards.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setMethodTab('substance_lab')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-blue-300 text-xs font-bold text-slate-700 cursor-pointer self-start sm:self-auto"
        >
          <FlaskConical className="w-3.5 h-3.5 text-blue-700" />
          <span>18+ Substance Lookup</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* 4 Clear Learning Modes (Plain English, Easy to Tell Apart) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            id: 'guided_lessons' as LearningMethodTab,
            title: '1. Short Lessons (8 Topics)',
            sub: `${completedLessonIds.length} of ${LEARNER_LESSONS.length} lessons read`,
            icon: BookOpen,
          },
          {
            id: 'habit_lab' as LearningMethodTab,
            title: '2. Swap a Habit',
            sub: 'Practice calm moves for stress urges',
            icon: Sliders,
          },
          {
            id: 'flashcards' as LearningMethodTab,
            title: '3. Quick Flashcards',
            sub: `${masteredIds.length} of ${cards.length} remembered`,
            icon: RotateCw,
          },
          {
            id: 'solution_mechanics' as LearningMethodTab,
            title: '4. Coping Playbook',
            sub: '15-min wave & decision checks',
            icon: Lightbulb,
          },
        ].map(tab => {
          const Icon = tab.icon;
          const active = methodTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMethodTab(tab.id)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
                active
                  ? 'bg-blue-900 border-blue-900 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-800 hover:border-blue-300'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  active ? 'bg-white/15 text-sky-200' : 'bg-sky-50 text-blue-800'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-extrabold truncate">{tab.title}</div>
                <div className={`text-xs truncate mt-0.5 ${active ? 'text-sky-200' : 'text-slate-500'}`}>
                  {tab.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* MODE 1: CLEAR 3-STAGE MAP OF ALL 8 TOPICS & 16 SHORT LESSONS */}
      {methodTab === 'guided_lessons' && (
        <div className="space-y-8 animate-tab-fade">
          {/* Quick Start / Continue Banner */}
          <div className="bg-sky-50/80 border border-blue-200 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-blue-900">
                <span>
                  {completedLessonIds.length === 0 ? 'Recommended First Lesson' : 'Continue Where You Left Off'}
                </span>
                <span className="font-mono-tabular text-blue-700">· {progressPct}% Complete</span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                {nextRecommendedLesson.title}
              </h2>
              <p className="prose-readable-sm text-slate-600 max-w-2xl">
                {nextRecommendedLesson.summary}
              </p>
              <div className="w-full max-w-md h-2 bg-white rounded-full overflow-hidden border border-blue-100 mt-2">
                <div
                  className="h-full bg-blue-700 rounded-full transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveReadingLesson(nextRecommendedLesson)}
              className="px-5 py-3 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-extrabold inline-flex items-center gap-2 shadow-xs transition-colors cursor-pointer shrink-0 self-start md:self-center"
            >
              <BookOpen className="w-4 h-4" />
              <span>
                {completedLessonIds.length === 0 ? 'Start First Lesson' : 'Continue Reading'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Searchable 12-Category Knowledge Explorer (Wrapping Filter Buttons, Zero Sliders) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900">
                  Topic Filter · 12 Learning Areas
                </span>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Pick any topic below to filter articles, or ask AI whenever something feels confusing.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 min-w-0">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={curriculumSearch}
                    onChange={e => setCurriculumSearch(e.target.value)}
                    placeholder="Search lessons, dopamine, NDPS..."
                    className="min-h-[44px] pl-9 pr-3 py-2 text-base sm:text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 w-full sm:w-64"
                  />
                </div>
                <button
                  type="button"
                  onClick={() =>
                    openAiAssistant({
                      role: 'learner',
                      contextRef: {
                        area: 'Knowledge Filter',
                        topicTitle:
                          selectedCategory !== 'all'
                            ? selectedCategory
                            : curriculumSearch.trim() || 'Prevention & Brain Science',
                        snippet: 'User is browsing learning topics and wants a simple explanation.',
                      },
                    })
                  }
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Confused while reading? Ask AI</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-blue-900 border-blue-900 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-blue-300'
                }`}
              >
                All Topics ({LEARNER_LESSONS.length})
              </button>
              {(showAllCategories
                ? LEARNING_CATEGORIES_PART6
                : LEARNING_CATEGORIES_PART6.slice(0, 5)
              ).map((cat, idx) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(active ? 'all' : cat)}
                    className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      active
                        ? 'bg-blue-900 border-blue-900 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                    }`}
                  >
                    {idx + 1}. {cat}
                  </button>
                );
              })}
              {LEARNING_CATEGORIES_PART6.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllCategories(prev => !prev)}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-200 bg-sky-50 text-blue-900 hover:bg-sky-100 cursor-pointer"
                >
                  {showAllCategories
                    ? 'Show fewer'
                    : `+ ${LEARNING_CATEGORIES_PART6.length - 5} more topics`}
                </button>
              )}
            </div>

            {(curriculumSearch.trim() !== '' || selectedCategory !== 'all') && (
              <div className="pt-3 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    {filteredCurriculumLessons.length} matching scientific {filteredCurriculumLessons.length === 1 ? 'article' : 'articles'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCurriculumSearch('');
                      setSelectedCategory('all');
                    }}
                    className="font-bold text-blue-800 hover:underline cursor-pointer"
                  >
                    Reset filter
                  </button>
                </div>

                {filteredCurriculumLessons.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredCurriculumLessons.map(lesson => {
                      const isDone = completedLessonIds.includes(lesson.id);
                      return (
                        <button
                          key={lesson.id}
                          type="button"
                          onClick={() => setActiveReadingLesson(lesson)}
                          className="p-4 rounded-2xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-blue-300 text-left flex items-start justify-between gap-3 transition-colors cursor-pointer"
                        >
                          <div className="space-y-1 min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block truncate">
                              {lesson.learningCategory || 'Prevention Science'}
                            </span>
                            <div className="text-sm font-extrabold text-slate-900 leading-snug">
                              {lesson.title}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              {lesson.sourceOrganization || 'WHO / UNODC'} · {lesson.readTimeMinutes} min {isDone ? '· Completed' : ''}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-blue-800 shrink-0 mt-1" />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-2">
                    No articles match that term yet. Try clearing the filter or exploring the 18+ Substance Lookup.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 3 Clear Stages — No Cryptic Truncated Boxes */}
          <div className="space-y-8">
            {LEARNING_STAGES.map(stage => {
              const stagePathways = LEARNER_PATHWAYS.filter(p => stage.pathwayIds.includes(p.id));
              return (
                <section key={stage.stageNumber} className="space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                      {stage.title}
                    </h2>
                    <p className="prose-readable-sm text-slate-600 mt-0.5">{stage.subtitle}</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {stagePathways.map(pathway => {
                      const Icon = getPathwayIcon(pathway.iconName);
                      const pLessons = LEARNER_LESSONS.filter(l => l.pathwayId === pathway.id);
                      const doneCount = pLessons.filter(l => completedLessonIds.includes(l.id)).length;
                      const allDone = pLessons.length > 0 && doneCount === pLessons.length;

                      return (
                        <div
                          key={pathway.id}
                          className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between gap-5"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-xl ${pathway.accentBg} ${pathway.colorClass} flex items-center justify-center shrink-0`}
                                >
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div>
                                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                                    Topic 0{pathway.number}
                                  </span>
                                  <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                                    {pathway.title}
                                  </h3>
                                </div>
                              </div>

                              <span
                                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0 ${
                                  allDone
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {doneCount}/{pLessons.length} done
                              </span>
                            </div>

                            <p className="prose-readable-sm text-slate-600">
                              {PLAIN_PATHWAY_SUMMARIES[pathway.id] || pathway.description}
                            </p>
                          </div>

                          {/* Direct Clickable Short Lessons inside this Topic */}
                          <div className="space-y-2.5 pt-3 border-t border-slate-100">
                            {pLessons.map((lesson, idx) => {
                              const isDone = completedLessonIds.includes(lesson.id);
                              const isMarked = bookmarkedLessonIds.includes(lesson.id);
                              return (
                                <div
                                  key={lesson.id}
                                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-blue-300 hover:bg-sky-50/40 transition-all flex items-center justify-between gap-3"
                                >
                                  <button
                                    type="button"
                                    onClick={() => setActiveReadingLesson(lesson)}
                                    className="flex items-start gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
                                  >
                                    <span
                                      className={`w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center shrink-0 mt-0.5 ${
                                        isDone
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-blue-100 text-blue-900'
                                      }`}
                                    >
                                      {isDone ? '✓' : idx + 1}
                                    </span>
                                    <div className="min-w-0">
                                      <div className="text-xs font-bold text-slate-900 leading-snug">
                                        {lesson.title}
                                      </div>
                                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                                        <Clock className="w-3 h-3" />
                                        <span>{lesson.readTimeMinutes} min</span>
                                        {isDone && <span className="text-emerald-700 font-semibold">· Completed</span>}
                                      </div>
                                    </div>
                                  </button>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => toggleBookmarkLesson(lesson.id)}
                                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                        isMarked
                                          ? 'text-amber-600 bg-amber-50'
                                          : 'text-slate-300 hover:text-slate-600'
                                      }`}
                                      title={isMarked ? 'Saved' : 'Save for later'}
                                    >
                                      <Bookmark className="w-3.5 h-3.5 fill-current" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setActiveReadingLesson(lesson)}
                                      className="px-2.5 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <span>{isDone ? 'Read Again' : 'Read'}</span>
                                      <ArrowRight className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {/* MODE 2: VISUAL HABIT-LOOP REWIRING LAB */}
      {methodTab === 'habit_lab' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-tab-fade">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Interactive Habit-Loop Rewiring Lab
              </h2>
              <p className="prose-readable-sm text-slate-600 mt-1">
                Pick a real-life moment below. Notice the urge, then swap the middle routine to change how your brain feels next.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {HABIT_LOOP_SCENARIOS.map((sc, idx) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    setSelectedLoopIdx(idx);
                    setSelectedSwapIdx(0);
                    recordLearnerStudyDay();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                    selectedLoopIdx === idx
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {sc.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="editorial-kicker text-slate-500">Step 1 · Cue (Trigger)</span>
              <p className="prose-readable-sm font-semibold text-slate-900">{currentLoop.cue}</p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <span className="editorial-kicker text-amber-800">Step 2 · Craving Signal</span>
              <p className="prose-readable-sm font-semibold text-amber-950">{currentLoop.craving}</p>
            </div>

            <div className="p-5 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2">
              <span className="editorial-kicker text-rose-700">Old Impulsive Move</span>
              <p className="prose-readable-sm text-slate-700">{currentLoop.oldRoutine}</p>
              <p className="text-xs font-semibold text-rose-800 pt-1 leading-relaxed">
                Result: {currentLoop.oldOutcome}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-sky-50 border-2 border-blue-600 space-y-2">
              <span className="editorial-kicker text-blue-800">Rewired Healthy Move</span>
              <p className="prose-readable-sm font-bold text-slate-900">{currentSwap.move}</p>
              <p className="text-xs font-semibold text-blue-900 pt-1 leading-relaxed">
                Reward: {currentSwap.reward}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Try a different healthy swap:</span>
              {currentLoop.healthySwaps.map((_sw, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedSwapIdx(idx);
                    recordLearnerStudyDay();
                  }}
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                    selectedSwapIdx === idx
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                  }`}
                >
                  Swap Option {idx + 1}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                openAiAssistant({
                  role: 'learner',
                  contextRef: {
                    area: 'Habit-Loop Practice',
                    topicTitle: currentLoop.label,
                    snippet: `Cue: ${currentLoop.cue} Swap: ${currentSwap.move}`,
                  },
                })
              }
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-blue-200 text-xs font-bold text-blue-900 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Ask AI about this habit</span>
            </button>
          </div>
        </div>
      )}

      {/* MODE 3: ACTIVE-RECALL FLASHCARDS */}
      {methodTab === 'flashcards' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5 animate-tab-fade">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Active-Recall Science Flashcards
              </h2>
              <p className="prose-readable-sm text-slate-600">
                Tap the card to test what you remember before reading the answer.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-blue-900 bg-sky-50 border border-blue-200 px-3 py-1.5 rounded-xl font-mono-tabular">
                Card {cardIdx + 1} / {cards.length}
              </span>
              <button
                type="button"
                onClick={handleShuffleCards}
                className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Shuffle</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  openAiAssistant({
                    role: 'learner',
                    contextRef: {
                      area: 'Flashcard Helper',
                      topicTitle: currentCard.topic,
                      snippet: `${currentCard.front} — ${currentCard.back}`,
                    },
                  })
                }
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Ask AI</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFlipped(!isFlipped)}
            className={`w-full min-h-[210px] p-8 rounded-3xl border-2 text-center flex flex-col items-center justify-center gap-3 transition-all cursor-pointer ${
              isFlipped
                ? 'bg-blue-950 border-blue-950 text-white'
                : 'bg-sky-50/70 border-blue-200 hover:border-blue-400 text-slate-900'
            }`}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-md ${
                isFlipped ? 'bg-white/15 text-sky-200' : 'bg-white text-blue-800 border border-blue-200'
              }`}
            >
              {isFlipped ? 'Answer · Science Fact' : `Question · ${currentCard.topic}`}
            </span>
            <p className="text-lg sm:text-xl font-bold max-w-2xl leading-relaxed">
              {isFlipped ? currentCard.back : currentCard.front}
            </p>
            <span className={`text-xs ${isFlipped ? 'text-sky-200' : 'text-slate-500'}`}>
              Tap anywhere on card to flip
            </span>
          </button>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setCardIdx((cardIdx - 1 + cards.length) % cards.length);
                  setIsFlipped(false);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => {
                  setCardIdx((cardIdx + 1) % cards.length);
                  setIsFlipped(false);
                }}
                className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold cursor-pointer"
              >
                Next Card
              </button>
            </div>

            <button
              type="button"
              onClick={handleToggleMastered}
              className={`px-4 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                masteredIds.includes(currentCard.id)
                  ? 'bg-blue-50 border-blue-500 text-blue-900'
                  : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {masteredIds.includes(currentCard.id) ? 'Marked Remembered' : 'Mark Remembered'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* MODE 4: PROVEN SOLUTION MECHANICS (CBT, SMART, URGE SURFING) */}
      {methodTab === 'solution_mechanics' && (
        <div className="space-y-5 animate-tab-fade">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROVEN_SOLUTION_MECHANICS.map(item => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-3.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50 text-blue-800 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-blue-800 bg-sky-50 border border-blue-100 px-2.5 py-1 rounded-lg">
                      {item.origin}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900">{item.title}</h3>
                  <p className="prose-readable text-slate-600">{item.plainSummary}</p>
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-bold text-blue-800">
                      How to use it: <span className="font-semibold text-slate-700">{item.tryAction}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        openAiAssistant({
                          role: 'learner',
                          contextRef: {
                            area: 'Coping Playbook',
                            topicTitle: item.title,
                            snippet: item.plainSummary,
                          },
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-blue-200 text-xs font-bold text-blue-900 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Ask AI how to try</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-sky-50/70 border border-blue-200 rounded-3xl p-6 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-blue-950">
                  Try SMART Decision Balance (20-Second Reality Check)
                </h3>
                <p className="prose-readable-sm text-slate-600 mt-0.5">
                  Compare what happens tonight vs. tomorrow morning before deciding.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBalanceChoice('use')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                    balanceChoice === 'use'
                      ? 'bg-rose-700 text-white border-rose-700'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  If I give in now
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBalanceChoice('skip');
                    recordLearnerStudyDay();
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                    balanceChoice === 'skip'
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  If I wait 15 mins &amp; skip
                </button>
              </div>
            </div>

            {balanceChoice === 'use' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-1.5">
                  <strong className="text-sm text-slate-900 block">Next 15 Minutes</strong>
                  <p className="prose-readable-sm text-slate-600">
                    Brief distraction or fitting in for a moment.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-1.5">
                  <strong className="text-sm text-rose-900 block">Tomorrow Morning Cost</strong>
                  <p className="prose-readable-sm text-rose-900">
                    Poor sleep, harder next craving, guilt, and lower energy.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-1.5">
                  <strong className="text-sm text-slate-900 block">Next 15 Minutes</strong>
                  <p className="prose-readable-sm text-slate-600">
                    Mild discomfort while the craving wave peaks and fades.
                  </p>
                </div>
                <div className="p-5 rounded-2xl bg-sky-100/70 border border-blue-300 space-y-1.5">
                  <strong className="text-sm text-blue-950 block">Tomorrow Morning Reward</strong>
                  <p className="prose-readable-sm text-blue-950">
                    Clear head, stronger self-respect, and easier control next time.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
