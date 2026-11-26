import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  ShieldAlert,
  PhoneCall,
  BookOpen,
  Clock,
  Compass,
  HeartHandshake,
  MessageCircle,
} from 'lucide-react';
import { SUPPORTER_EDUCATION_MODULES } from '../../constants/initialData';

type UnderstandTab = 'signs' | 'craft_myths' | 'guides' | 'how_to_help';

interface HelpScenarioChoice {
  label: string;
  constructive: boolean;
  feedback: string;
}

interface HelpScenarioTopic {
  id: string;
  title: string;
  situation: string;
  guidance: string;
  choices: HelpScenarioChoice[];
}

const HOW_CAN_I_HELP_SCENARIOS: HelpScenarioTopic[] = [
  {
    id: 'start_talk',
    title: '1. Starting a supportive conversation',
    situation: 'You notice your family member coming home withdrawn for three weeks and missing sleep. Both of you are calmly having evening tea.',
    guidance: 'Choose a sober, private 10-minute window free of rushing or distractions. Lead with care, not accusations.',
    choices: [
      { label: '"I have noticed you look exhausted lately and I care about you. Can we talk for 10 minutes?"', constructive: true, feedback: 'Constructive: Gentle observation plus care invites conversation without triggering immediate shame or defense.' },
      { label: '"Tell me right now what you have been taking—everyone can see something is wrong."', constructive: false, feedback: 'Often backfires: Confrontational interrogation typically pushes the person into denial or avoiding future talks.' },
    ],
  },
  {
    id: 'listen_no_judgment',
    title: '2. Listening without immediate judgment',
    situation: 'They admit they tried pills to cope with intense college or job stress and panic attacks.',
    guidance: 'Pause before fixing or lecturing. Reflecting what you heard shows emotional safety.',
    choices: [
      { label: '"It sounds like you have been carrying heavy stress alone. Thank you for telling me—what has been hardest?"', constructive: true, feedback: 'Constructive: Validates the underlying pain while keeping space open to explore safer solutions.' },
      { label: '"Why would you throw away your future like that? You just need discipline."', constructive: false, feedback: 'Often backfires: Stigma and moral blame deepen secrecy and make professional help feel unsafe.' },
    ],
  },
  {
    id: 'express_concern',
    title: '3. Expressing concern constructively',
    situation: 'You want to bring up missed family responsibilities and late nights without sounding controlling.',
    guidance: 'Use concrete "I notice / I worry" statements instead of broad labels.',
    choices: [
      { label: '"I got worried when you missed two shifts this week because I want you to feel steady and safe."', constructive: true, feedback: 'Constructive: Keeps focus on observable events and shared wellbeing rather than character attacks.' },
      { label: '"You are becoming completely unreliable and ruining our peace."', constructive: false, feedback: 'Often backfires: Global character labels overwhelm the listener and escalate conflict.' },
    ],
  },
  {
    id: 'what_person_wants',
    title: '4. Understanding what the person wants',
    situation: 'They say they want their energy and sleep back, even though they feel hesitant about stopping completely.',
    guidance: 'Supportive change starts from their own priorities—better sleep, health, focus, or relationships.',
    choices: [
      { label: '"What is the one thing you most want better right now—sleep, energy, or stress relief?"', constructive: true, feedback: 'Constructive: Motivational listening identifies internal goals that healthcare professionals can build on.' },
      { label: '"It doesn\'t matter what you want, you have to follow my rules starting tonight."', constructive: false, feedback: 'Often backfires: Forced ultimatums without partnership increase resistance or covert behaviour.' },
    ],
  },
  {
    id: 'encourage_help',
    title: '5. Encouraging professional help',
    situation: 'They worry a doctor will report them or lock them up if they visit a de-addiction clinic.',
    guidance: 'Explain voluntary confidentiality, Section 64A medical immunity under NDPS for voluntary treatment, and free OPD options.',
    choices: [
      { label: '"We can call Vimukthi 14405 confidentially first just to ask questions—I can sit beside you or step out if you prefer."', constructive: true, feedback: 'Constructive: Low-pressure, voluntary next step that preserves agency while connecting to qualified clinicians.' },
      { label: '"If you don\'t go to an inpatient center tomorrow, I will tell your employer/college."', constructive: false, feedback: 'Often backfires: Threats of exposure create distrust and do not replace clinical readiness (unless immediate safety crisis requires emergency 112).' },
    ],
  },
  {
    id: 'respect_boundaries',
    title: '6. Respecting boundaries & avoiding surveillance',
    situation: 'You feel tempted to secretly install tracking apps or search their personal phone while they shower.',
    guidance: 'Avoid covert surveillance or unauthorized monitoring unless someone faces immediate physical danger.',
    choices: [
      { label: 'Protect clear household boundaries (no unmonitored cash/keys) while respecting privacy and talking openly.', constructive: true, feedback: 'Constructive: Clear financial/safety boundaries protect everyone without destroying baseline dignity and trust.' },
      { label: 'Install covert spyware on their phone and secretly confront their contacts.', constructive: false, feedback: 'Unhelpful & risky: Covert surveillance breaks trust, harms safeguarding ethics, and drives risky hiding behaviour.' },
    ],
  },
  {
    id: 'handle_disagreements',
    title: '7. Handling disagreements calmly',
    situation: 'A calm check-in suddenly turns loud and defensive, with voices rising on both sides.',
    guidance: 'When voices rise or someone is intoxicated, pausing protects both of you.',
    choices: [
      { label: '"I care about talking this through when we are both calmer. Let\'s pause now and revisit tomorrow morning."', constructive: true, feedback: 'Constructive: De-escalates conflict safely and shows steady emotional boundaries.' },
      { label: 'Keep arguing louder until they admit every detail before dinner.', constructive: false, feedback: 'Often backfires: Escalated arguments while upset or intoxicated almost never produce lasting insight.' },
    ],
  },
  {
    id: 'supporter_self',
    title: '8. Seeking support for oneself',
    situation: 'You notice your own sleep dropping and feel constantly anxious trying to fix everything alone.',
    guidance: 'Supporters cannot manage severe substance-use difficulty solo. Seek counselling or family support groups too.',
    choices: [
      { label: 'Call 14405 / Tele-MANAS 14416 for family guidance, keep my own sleep routine, and share tasks with another trusted adult.', constructive: true, feedback: 'Constructive: Modeling calm self-care makes your household steadier and avoids caregiver burnout.' },
      { label: 'Cancel all your own friendships and sleep schedules until they completely recover.', constructive: false, feedback: 'Often backfires: Supporter exhaustion weakens judgment and increases conflict at home.' },
    ],
  },
];

export const SupporterUnderstandView: React.FC<{ onSelectTab: (tab: string) => void }> = ({
  onSelectTab,
}) => {
  const { completedEducationModuleIds, toggleCompletedEducationModule, openAiAssistant } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<UnderstandTab>('signs');
  const [activeHelpScenarioId, setActiveHelpScenarioId] = useState<string>(HOW_CAN_I_HELP_SCENARIOS[0].id);
  const [selectedHelpChoiceIdx, setSelectedHelpChoiceIdx] = useState<Record<string, number>>({});
  const [activeModuleId, setActiveModuleId] = useState<string>(
    SUPPORTER_EDUCATION_MODULES[0]?.id || 'edu-dependency-science'
  );

  // Decision Guide State ("What Should I Do Next?")
  const [decisionStep, setDecisionStep] = useState<number>(0);
  const [decisionAnswers, setDecisionAnswers] = useState<Record<number, string>>({});

  const DECISION_QUESTIONS = [
    {
      question:
        'Is the person currently in immediate medical danger, overdose risk, or threatening severe harm?',
      options: [
        { label: 'Yes, acute medical crisis', action: 'emergency' },
        { label: 'No, but behaviour has significantly changed', action: 'next' },
        { label: 'Not sure, I am worried about subtle signs', action: 'next' },
      ],
    },
    {
      question: 'Have you had an open, calm conversation with them about your concern yet?',
      options: [
        { label: 'No, I have not spoken with them yet', action: 'prepare_talk' },
        { label: 'Yes, but they denied or got defensive', action: 'handle_resistance' },
        { label: 'Yes, and they acknowledged needing help', action: 'access_treatment' },
      ],
    },
  ];

  const WARNING_SIGN_CATEGORIES = [
    {
      title: 'Physical & Sleep Changes',
      items: [
        'Unusual changes in sleep cycles (staying up for multiple days or sleeping excessively)',
        'Unexplained weight loss, lethargy, or sudden appetite loss',
        'Bloodshot eyes, tremors, or frequent headaches and nausea',
        'Neglect of personal grooming or physical wellbeing',
      ],
    },
    {
      title: 'Emotional & Mood Shifts',
      items: [
        'Sudden, unexplained mood swings from intense irritability to quiet withdrawal',
        'Unusual defensiveness or anger when asked simple questions about their day',
        'Loss of enthusiasm for hobbies, family gatherings, or passions they once loved',
        'Appearing anxious, restless, or emotionally detached',
      ],
    },
    {
      title: 'Social & Routine Disruptions',
      items: [
        'Drifting away from longstanding friends toward a new, secretive social circle',
        'Repeatedly missing classes, exams, shifts, or family commitments',
        'Borrowing money frequently with vague or changing explanations',
        'Guarded phone usage, locked rooms, or evasive answers about their whereabouts',
      ],
    },
  ];

  const MYTHS_REALITIES = [
    {
      myth: 'If I bring up substance use, it will push them away or make them use more.',
      reality:
        'Research shows that compassionate, non-judgmental inquiry communicates safety and reduces isolation. Silence is often perceived as tacit approval or abandonment.',
    },
    {
      myth: 'Someone must hit "rock bottom" before they can be helped.',
      reality:
        'Early supportive intervention has vastly higher recovery success rates. You do not need to wait for a crisis to offer a safe listening ear or explore Kerala healthcare options.',
    },
    {
      myth: 'Relapse or setbacks mean treatment or support failed.',
      reality:
        'Substance dependence affects neurological reward circuits. Recovery is a non-linear process of skill-building; setbacks provide valuable data on triggers, not proof of failure.',
    },
  ];

  const activeModuleIndex = SUPPORTER_EDUCATION_MODULES.findIndex(m => m.id === activeModuleId);
  const safeIndex = activeModuleIndex >= 0 ? activeModuleIndex : 0;
  const activeModule = SUPPORTER_EDUCATION_MODULES[safeIndex];
  const prevModule = safeIndex > 0 ? SUPPORTER_EDUCATION_MODULES[safeIndex - 1] : null;
  const nextModule =
    safeIndex + 1 < SUPPORTER_EDUCATION_MODULES.length
      ? SUPPORTER_EDUCATION_MODULES[safeIndex + 1]
      : null;

  const isModuleRead = activeModule ? completedEducationModuleIds.includes(activeModule.id) : false;

  const handleMarkAndNext = () => {
    if (activeModule && !isModuleRead) {
      toggleCompletedEducationModule(activeModule.id);
    }
    if (nextModule) {
      setActiveModuleId(nextModule.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-200/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">
            <HelpCircle className="w-4 h-4 text-amber-700" />
            <span>Foundational Guidance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Understand What Is Happening
          </h1>
          <p className="editorial-subtitle text-slate-600 mt-1.5 max-w-2xl">
            Step-by-step help for families and friends: spot signs early, learn calm communication, and read short practical guides.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSelectTab('talk')}
          className="px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 self-start sm:self-auto transition-colors cursor-pointer"
        >
          <span>Conversation Planner &rarr;</span>
        </button>
      </div>

      {/* Clear 4-Part Supporter Structure Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            id: 'signs' as UnderstandTab,
            title: '1. Spot Signs & Next Step',
            sub: 'Quick check + warning patterns',
            icon: Compass,
          },
          {
            id: 'how_to_help' as UnderstandTab,
            title: '2. How Can I Help?',
            sub: '8 interactive scenarios',
            icon: HeartHandshake,
          },
          {
            id: 'craft_myths' as UnderstandTab,
            title: '3. Help Calmly (CRAFT)',
            sub: 'What helps vs. backfires',
            icon: ShieldAlert,
          },
          {
            id: 'guides' as UnderstandTab,
            title: `4. Short Guides (${SUPPORTER_EDUCATION_MODULES.length})`,
            sub: `${completedEducationModuleIds.length} of ${SUPPORTER_EDUCATION_MODULES.length} read`,
            icon: BookOpen,
          },
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3.5 ${
                active
                  ? 'bg-[#9A3412] border-[#9A3412] text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-800 hover:border-orange-300'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  active ? 'bg-white/15 text-amber-200' : 'bg-orange-50 text-orange-800'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-extrabold truncate">{tab.title}</div>
                <div className={`text-xs truncate mt-0.5 ${active ? 'text-amber-100' : 'text-slate-500'}`}>
                  {tab.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Anti-Surveillance & Non-Diagnostic Principle Banner */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="prose-readable-sm text-amber-950">
          <strong>Ethical Supporter Principle:</strong> This section does not diagnose anyone and must never be used for covert surveillance, unauthorized tracking, or forced disclosure. Only qualified clinicians evaluate medical severity. Confidential support: Kerala Vimukthi <strong>14405</strong>.
        </div>
      </div>

      {/* PART 1: SIGNS & NEXT STEP TRIAGE */}
      {activeSubTab === 'signs' && (
        <div className="space-y-6 animate-tab-fade">

          {/* Interactive Decision Guide */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Lightbulb className="w-5 h-5 text-amber-700" />
              <h2 className="text-base font-bold text-slate-900">
                Quick Check: What Should I Do Next?
              </h2>
            </div>

            {decisionStep === 0 && (
              <div className="space-y-4">
                <p className="prose-readable font-semibold text-slate-800">
                  {DECISION_QUESTIONS[0].question}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {DECISION_QUESTIONS[0].options.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setDecisionAnswers({ ...decisionAnswers, 0: opt.label });
                        if (opt.action === 'emergency') {
                          setDecisionStep(99);
                        } else {
                          setDecisionStep(1);
                        }
                      }}
                      className="p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-left text-xs font-semibold text-slate-700 transition-all cursor-pointer"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {decisionStep === 1 && (
              <div className="space-y-4">
                <p className="prose-readable font-semibold text-slate-800">
                  {DECISION_QUESTIONS[1].question}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {DECISION_QUESTIONS[1].options.map((opt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setDecisionAnswers({ ...decisionAnswers, 1: opt.label });
                        if (opt.action === 'prepare_talk') setDecisionStep(10);
                        else if (opt.action === 'handle_resistance') setDecisionStep(11);
                        else setDecisionStep(12);
                      }}
                      className="p-4 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 text-left text-xs font-semibold text-slate-700 transition-all cursor-pointer"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setDecisionStep(0)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  &larr; Back to previous question
                </button>
              </div>
            )}

            {decisionStep === 99 && (
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <span>Immediate Emergency Safety Step</span>
                </div>
                <p className="prose-readable-sm text-rose-950">
                  If there is an acute overdose, unconsciousness, or severe distress, do not delay for conversation planning. Contact emergency healthcare immediately.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href="tel:112"
                    className="px-4 py-2 bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Call Emergency 112
                  </a>
                  <a
                    href="tel:14405"
                    className="px-4 py-2 bg-white text-rose-800 border border-rose-300 rounded-xl text-xs font-bold"
                  >
                    Vimukthi 14405
                  </a>
                  <button
                    type="button"
                    onClick={() => setDecisionStep(0)}
                    className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            )}

            {decisionStep === 10 && (
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-amber-700" />
                  <span>Recommended Next Step: Plan a Calm Conversation</span>
                </div>
                <p className="prose-readable-sm text-amber-950">
                  Start with an empathetic check-in when both of you are calm and sober. Use &ldquo;I notice&rdquo; and &ldquo;I care&rdquo; language rather than accusations.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onSelectTab('talk')}
                    className="px-4 py-2 bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Open Conversation Planner &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionStep(0)}
                    className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            )}

            {decisionStep === 11 && (
              <div className="p-5 rounded-2xl bg-teal-50 border border-teal-200 space-y-3">
                <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
                  <Lightbulb className="w-5 h-5 text-teal-700" />
                  <span>Recommended Next Step: Pause, Step Back, Maintain Presence</span>
                </div>
                <p className="prose-readable-sm text-teal-950">
                  Defensiveness is a natural reaction to fear and shame. Do not debate or demand immediate admissions. Step back, reiterate your care, and keep the door open for later.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onSelectTab('talk')}
                    className="px-4 py-2 bg-teal-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Practice Responding to Resistance &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionStep(0)}
                    className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            )}

            {decisionStep === 12 && (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  <span>Recommended Next Step: Explore Confidential Kerala Healthcare</span>
                </div>
                <p className="prose-readable-sm text-emerald-950">
                  When someone is open to help, offer concrete, low-pressure options. Offer to call Vimukthi (14405) together or visit a nearby district hospital clinic.
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onSelectTab('support')}
                    className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Browse Verified Support Directory &rarr;
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecisionStep(0)}
                    className="px-3 py-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Observable Warning Signs */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Observable Behavioural Patterns
              </h2>
              <p className="prose-readable-sm text-slate-600 mt-1">
                Notice patterns lasting weeks rather than single stressful days.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {WARNING_SIGN_CATEGORIES.map((cat, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3.5"
                >
                  <h3 className="editorial-kicker text-amber-900">{cat.title}</h3>
                  <ul className="space-y-3">
                    {cat.items.map((item, idx) => (
                      <li key={idx} className="prose-readable-sm text-slate-700 flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-2.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PART 2: INTERACTIVE "HOW CAN I HELP?" SCENARIO MODULE */}
      {activeSubTab === 'how_to_help' && (() => {
        const activeScenario =
          HOW_CAN_I_HELP_SCENARIOS.find(s => s.id === activeHelpScenarioId) || HOW_CAN_I_HELP_SCENARIOS[0];
        const chosenIdx = selectedHelpChoiceIdx[activeScenario.id];
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-tab-fade">
            <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-2.5 lg:sticky lg:top-20">
              <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                <span className="editorial-kicker text-amber-900">How Can I Help? (8 Topics)</span>
                <span className="text-[11px] font-mono-tabular text-slate-500">
                  {Object.keys(selectedHelpChoiceIdx).length}/8 practiced
                </span>
              </div>
              {HOW_CAN_I_HELP_SCENARIOS.map(sc => {
                const isSelected = sc.id === activeScenario.id;
                const practiced = selectedHelpChoiceIdx[sc.id] !== undefined;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => setActiveHelpScenarioId(sc.id)}
                    className={`w-full p-3 rounded-2xl border text-left text-xs font-bold transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#9A3412] border-[#9A3412] text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-orange-300'
                    }`}
                  >
                    <span className="truncate">{sc.title}</span>
                    {practiced && !isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </aside>

            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
              <div>
                <span className="editorial-kicker text-amber-800">Non-Graphic Scenario Practice</span>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">{activeScenario.title}</h2>
                <p className="prose-readable text-slate-700 mt-2">{activeScenario.situation}</p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950">
                <strong>Guidance Principle:</strong> {activeScenario.guidance}
              </div>

              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Choose a response to see the likely impact:
                </div>
                {activeScenario.choices.map((ch, idx) => {
                  const isPicked = chosenIdx === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setSelectedHelpChoiceIdx(prev => ({ ...prev, [activeScenario.id]: idx }))
                      }
                      className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-2 ${
                        isPicked
                          ? ch.constructive
                            ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950'
                            : 'bg-rose-50/80 border-rose-300 text-rose-950'
                          : 'bg-slate-50 border-slate-200 hover:border-amber-400 text-slate-800'
                      }`}
                    >
                      <div className="text-xs sm:text-sm font-semibold">{ch.label}</div>
                      {isPicked && (
                        <div className="text-xs pt-2 border-t border-black/10 font-medium">
                          {ch.feedback}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      openAiAssistant({
                        role: 'supporter',
                        contextRef: {
                          area: 'Supporter Scenarios',
                          topicTitle: activeScenario.title,
                          snippet: activeScenario.situation,
                        },
                      })
                    }
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#9A3412] hover:bg-[#7C2D12] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Confused? Ask AI About This</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectTab('talk')}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold cursor-pointer"
                  >
                    Open Conversation Planner
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectTab('plan')}
                  className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Go to Support Action Planner
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* PART 2: CRAFT & MYTHS VS REALITIES */}
      {activeSubTab === 'craft_myths' && (
        <div className="space-y-6 animate-tab-fade">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <div>
              <span className="editorial-kicker text-amber-800">
                Clinical Family Protocol (CRAFT)
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                Practical Support Without Enabling or Exhaustion
              </h2>
              <p className="prose-readable-sm prose-measure text-slate-600 mt-1.5">
                Community Reinforcement &amp; Family Training (CRAFT) shows families how to encourage treatment calmly while protecting household stability.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <h3 className="editorial-kicker text-emerald-900">Do: Reinforce Sober Moments</h3>
                <ul className="space-y-3 prose-readable-sm text-slate-800">
                  <li>• Share normal meals, walks, or hobbies when they are sober and calm.</li>
                  <li>• Use &ldquo;I care + specific observation&rdquo; phrasing rather than interrogating.</li>
                  <li>• Keep one low-pressure helpline plan ready when they express tired frustration.</li>
                </ul>
              </div>
              <div className="p-6 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-3">
                <h3 className="editorial-kicker text-rose-900">
                  Avoid: Rescuing From Natural Consequences
                </h3>
                <ul className="space-y-3 prose-readable-sm text-slate-800">
                  <li>• Don&apos;t lecture or argue while the person is intoxicated—wait for a sober morning.</li>
                  <li>• Don&apos;t hand over unmonitored cash or make repeated excuses to employers/teachers.</li>
                  <li>• Never absorb verbal abuse; step into another room calmly and pause the talk.</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Myths vs. Evidence-Based Realities
              </h2>
              <p className="prose-readable-sm text-slate-600 mt-1">
                Common misconceptions that prevent families and friends from offering safe support.
              </p>
            </div>

            <div className="space-y-4">
              {MYTHS_REALITIES.map((mr, i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5"
                >
                  <div className="flex items-start gap-3">
                    <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-1.5" />
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
                        Myth
                      </span>
                      <p className="prose-readable font-semibold text-slate-900 mt-0.5">{mr.myth}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-3 border-t border-slate-200/60">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1.5" />
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                        Reality
                      </span>
                      <p className="prose-readable text-slate-700 mt-0.5">{mr.reality}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PART 3: DEDICATED MASTER-DETAIL GUIDE READER (EASY TO OPEN, READ & SWITCH) */}
      {activeSubTab === 'guides' && activeModule && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-tab-fade">
          {/* Left Guide Index */}
          <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-3 lg:sticky lg:top-20">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="editorial-kicker text-amber-900">All 5 Short Guides</span>
              <span className="text-xs font-mono-tabular font-bold text-slate-500">
                {completedEducationModuleIds.length}/{SUPPORTER_EDUCATION_MODULES.length} read
              </span>
            </div>

            <div className="space-y-2">
              {SUPPORTER_EDUCATION_MODULES.map((m, idx) => {
                const isSelected = m.id === activeModule.id;
                const done = completedEducationModuleIds.includes(m.id);
                const mins = m.readTimeMinutes ?? m.readingTimeMinutes ?? 5;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setActiveModuleId(m.id)}
                    className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#9A3412] border-[#9A3412] text-white shadow-xs'
                        : 'bg-slate-50/70 border-slate-200 text-slate-800 hover:border-orange-300 hover:bg-white'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full text-[11px] font-extrabold flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : done
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-orange-100 text-orange-900'
                      }`}
                    >
                      {done && !isSelected ? '✓' : idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold leading-snug">{m.title}</div>
                      <div
                        className={`text-[11px] mt-1 flex items-center gap-1.5 ${
                          isSelected ? 'text-amber-100' : 'text-slate-500'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{mins} min read</span>
                        {done && <span>· Read</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Right Spacious Guide Reader */}
          <article className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 sm:p-9 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-5 border-b border-slate-100 gap-4">
              <div>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 inline-block">
                  {activeModule.category} · {activeModule.readTimeMinutes ?? activeModule.readingTimeMinutes ?? 5} min read
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-3 leading-snug">
                  {activeModule.title}
                </h2>
                <p className="prose-readable text-slate-600 mt-2">{activeModule.summary}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    openAiAssistant({
                      role: 'supporter',
                      contextRef: {
                        area: 'Supporter Guide',
                        topicTitle: activeModule.title,
                        snippet: activeModule.summary,
                      },
                    })
                  }
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#9A3412] hover:bg-[#7C2D12] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Ask AI About This</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleCompletedEducationModule(activeModule.id)}
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isModuleRead
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {isModuleRead ? '✓ Completed' : 'Mark as Read'}
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {activeModule.keyTakeaways && activeModule.keyTakeaways.length > 0 && (
                <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-3">
                  <h3 className="editorial-kicker text-amber-900">Key Takeaways</h3>
                  <ul className="space-y-3">
                    {activeModule.keyTakeaways.map((item, idx) => (
                      <li key={idx} className="prose-readable text-slate-800 flex items-start gap-2.5">
                        <span className="text-amber-700 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeModule.practicalTips && activeModule.practicalTips.length > 0 && (
                <div className="p-6 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-3">
                  <h3 className="editorial-kicker text-emerald-900">Practical Action Tips</h3>
                  <ul className="space-y-3">
                    {activeModule.practicalTips.map((tip, idx) => (
                      <li key={idx} className="prose-readable text-slate-800 flex items-start gap-2.5">
                        <span className="text-emerald-700 font-bold">✓</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Bottom Previous / Next Guide Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                disabled={!prevModule}
                onClick={() => {
                  if (prevModule) {
                    setActiveModuleId(prevModule.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 text-xs font-bold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Guide</span>
              </button>

              {nextModule ? (
                <button
                  type="button"
                  onClick={handleMarkAndNext}
                  className="px-5 py-2.5 rounded-xl bg-[#9A3412] hover:bg-[#7C2D12] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>{isModuleRead ? 'Next Guide' : 'Mark Read & Next Guide'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!isModuleRead) toggleCompletedEducationModule(activeModule.id);
                    onSelectTab('talk');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#9A3412] hover:bg-[#7C2D12] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Finish &amp; Plan a Talk</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </article>
        </div>
      )}
    </div>
  );
};
