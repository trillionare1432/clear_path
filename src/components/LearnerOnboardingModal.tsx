import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LearnerKnowledgeLevel, LearnerFormatPreference, Language } from '../types';
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Brain,
  ShieldCheck,
  Users,
  HeartHandshake,
  BookOpen,
} from 'lucide-react';

interface Props {
  onComplete: () => void;
}

export const LearnerOnboardingModal: React.FC<Props> = ({ onComplete }) => {
  const { saveLearnerOnboarding, language, setLanguage } = useApp();

  const [step, setStep] = useState(1);

  // Form state
  const [primaryInterest, setPrimaryInterest] = useState<string>('The Brain and Dopamine Circuitry');
  const [knowledgeLevel, setKnowledgeLevel] = useState<LearnerKnowledgeLevel>('beginner');
  const [formatPreference, setFormatPreference] = useState<LearnerFormatPreference>('mixed');
  const [preferredLang, setPreferredLang] = useState<Language>(language);
  const [objectives, setObjectives] = useState<string[]>([
    'Understand the science of dependence',
    'Learn how to resist peer pressure',
  ]);
  const [weeklyTarget, setWeeklyTarget] = useState<number>(3);

  const TOTAL_STEPS = 5;

  const INTEREST_OPTIONS = [
    {
      id: 'brain',
      label: 'The Brain and Dopamine Circuitry',
      desc: 'How neurotransmitters, habit formation, and tolerance work physiologically.',
      icon: Brain,
    },
    {
      id: 'peer',
      label: 'Peer Pressure & Real-World Decisions',
      desc: 'Tactics for standing your ground in high-pressure social situations.',
      icon: Users,
    },
    {
      id: 'prevention',
      label: 'Stress Management & Coping Skills',
      desc: 'Healthy non-chemical responses to exam panic, boredom, and burnout.',
      icon: ShieldCheck,
    },
    {
      id: 'helping',
      label: 'Helping a Struggling Friend',
      desc: 'Recognizing distress in peers and connecting them to safe professional resources.',
      icon: HeartHandshake,
    },
    {
      id: 'basics',
      label: 'General Science & Fact-Checking',
      desc: 'Debunking myths about vaping, cannabis, alcohol, and synthetic substances.',
      icon: BookOpen,
    },
  ];

  const KNOWLEDGE_OPTIONS: { id: LearnerKnowledgeLevel; label: string; desc: string }[] = [
    { id: 'beginner', label: 'Beginner', desc: 'Starting fresh. I want simple, clear, scientific fundamentals.' },
    { id: 'familiar', label: 'Familiar', desc: 'I understand some concepts, but want deeper neurobiological and behavioral insights.' },
    { id: 'advanced', label: 'Advanced', desc: 'Looking for clinical mechanisms, counseling techniques, and evidence-based studies.' },
  ];

  const FORMAT_OPTIONS: { id: LearnerFormatPreference; label: string; desc: string }[] = [
    { id: 'short_lessons', label: 'Bite-Sized Reads', desc: '3-to-5 minute structured lessons with key takeaways.' },
    { id: 'interactive_activities', label: 'Interactive Scenarios & Quizzes', desc: 'Decision dilemmas, immediate feedback, and knowledge tests.' },
    { id: 'mixed', label: 'Balanced Mix', desc: 'A combination of concise theory, real-world practice, and self-checks.' },
  ];

  const OBJECTIVE_OPTIONS = [
    'Understand the science of dependence',
    'Learn how to resist peer pressure',
    'Master anxiety management before exams',
    'Learn how to talk to a struggling friend',
    'Know legal rights & Kerala de-addiction options',
    'Build daily dopamine-healthy routines',
  ];

  const toggleObjective = (item: string) => {
    if (objectives.includes(item)) {
      setObjectives(objectives.filter(o => o !== item));
    } else {
      setObjectives([...objectives, item]);
    }
  };

  const handleFinish = () => {
    saveLearnerOnboarding({
      primaryInterest,
      knowledgeLevel,
      formatPreference,
      language: preferredLang,
      learningObjectives: objectives,
      weeklyTargetLessons: weeklyTarget,
      completed: true,
    });
    setLanguage(preferredLang);
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-indigo-100 max-h-[92vh] overflow-y-auto space-y-6">
        {/* Header Progress */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-xs">
              {step}/{TOTAL_STEPS}
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                Learner Onboarding
              </span>
              <span className="text-xs text-slate-500">Personalizing your learning path</span>
            </div>
          </div>
          <button
            onClick={handleFinish}
            className="text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer"
          >
            Skip for now
          </button>
        </div>

        {/* STEP 1: Main Interest */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                What is your main learning interest?
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Choose the primary topic you want to understand right now. You can explore all pathways anytime.
              </p>
            </div>

            <div className="space-y-2.5 pt-1">
              {INTEREST_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isSelected = primaryInterest === opt.label;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPrimaryInterest(opt.label)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">{opt.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Current Knowledge Level */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                How familiar are you with this topic?
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                This helps us calibrate explanations and practical scenario complexity.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {KNOWLEDGE_OPTIONS.map(opt => {
                const isSelected = knowledgeLevel === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setKnowledgeLevel(opt.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-900">{opt.label}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-700" />}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Preferred Format */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                How do you prefer to learn?
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                We'll prioritize content formats matching your study style.
              </p>
            </div>

            <div className="space-y-3 pt-1">
              {FORMAT_OPTIONS.map(opt => {
                const isSelected = formatPreference === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormatPreference(opt.id)}
                    className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-600 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-slate-900">{opt.label}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-700" />}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: Objectives & Language */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                What are your key learning goals?
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Select any goals you'd like to achieve through this workspace.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {OBJECTIVE_OPTIONS.map(obj => {
                const isSelected = objectives.includes(obj);
                return (
                  <button
                    key={obj}
                    type="button"
                    onClick={() => toggleObjective(obj)}
                    className={`p-3 rounded-xl border text-xs text-left transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold'
                        : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{obj}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-700 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Preferred Interface Language:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPreferredLang('en')}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    preferredLang === 'en'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setPreferredLang('ml')}
                  className={`py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    preferredLang === 'ml'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  മലയാളം (Malayalam)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Weekly Learning Target */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Set a gentle weekly target
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Consistent bite-sized learning anchors genuine understanding without stress.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { target: 2, label: '2 Lessons / wk', time: '~10 mins total' },
                { target: 3, label: '3 Lessons / wk', time: '~15 mins total' },
                { target: 5, label: '5 Lessons / wk', time: '~25 mins total' },
              ].map(item => {
                const isSelected = weeklyTarget === item.target;
                return (
                  <button
                    key={item.target}
                    type="button"
                    onClick={() => setWeeklyTarget(item.target)}
                    className={`p-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      isSelected
                        ? 'bg-indigo-50/90 border-indigo-600 ring-2 ring-indigo-500/20 text-indigo-950 font-bold'
                        : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-sm font-bold">{item.label}</span>
                    <span className="text-[11px] text-slate-500">{item.time}</span>
                  </button>
                );
              })}
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 leading-relaxed mt-4">
              <strong>100% Private:</strong> Your learning progress, quiz attempts, and reflections remain completely confidential and stored only on your local browser.
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-6 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enter Learner Space</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
