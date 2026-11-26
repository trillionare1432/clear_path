import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Award,
  ShieldCheck,
  Printer,
  CheckCircle2,
  Sparkles,
  Lock,
  Calendar,
  BookOpen,
  Gamepad2,
  ClipboardCheck,
  AlertCircle,
} from 'lucide-react';

interface KnowledgeQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const FINAL_KNOWLEDGE_QUESTIONS: KnowledgeQuestion[] = [
  {
    id: 'q1',
    question: 'About how long does a sudden craving peak before it starts fading if you do not give in?',
    options: [
      'It stays at full strength for 4–6 hours',
      'Around 10 to 15 minutes like a passing wave',
      'Exactly 3 seconds',
    ],
    correctIndex: 1,
    explanation: 'Urges peak briefly (10–15 minutes) and drop naturally when you ride them out.',
  },
  {
    id: 'q2',
    question: 'Why does tolerance build up when someone repeats a substance?',
    options: [
      'The brain dials down dopamine receptors to protect itself from overload',
      'The stomach stops digesting food properly',
      'Sleep increases dopamine receptors overnight',
    ],
    correctIndex: 0,
    explanation: 'Tolerance happens when dopamine receptors pull back, making normal joy feel flatter.',
  },
  {
    id: 'q3',
    question: 'What works best when saying no to peer pressure without starting a fight?',
    options: [
      'A long lecture about health risks',
      'A short, calm line plus shifting to another plan ("Not for me—let’s get food")',
      'Making up a complicated lie every time',
    ],
    correctIndex: 1,
    explanation: 'Short, calm refusal with a friendly redirect stops awkwardness in seconds.',
  },
  {
    id: 'q4',
    question: 'What is the smartest response when you notice a friend struggling with substances?',
    options: [
      'Call them out loudly in front of classmates to shock them',
      'Listen calmly in private without judging and share confidential help options',
      'Promise total secrecy even if their life is in danger',
    ],
    correctIndex: 1,
    explanation: 'Stigma pushes people into hiding; calm private listening helps them accept real support.',
  },
  {
    id: 'q5',
    question: 'What does Kerala Vimukthi Helpline 14405 offer?',
    options: [
      'Paid private luxury rehab ads only',
      'Free, confidential 24/7 support and connection to verified Kerala hospital clinics',
      'Police reporting for anyone who asks a question',
    ],
    correctIndex: 1,
    explanation: 'Vimukthi 14405 is free, 24/7, and confidential health support across all 14 districts.',
  },
];

export const LearnerCertificateView: React.FC = () => {
  const {
    learnerCertificate,
    issueLearnerCertificate,
    userProfile,
    completedLessonIds,
    savedScenarioAttempts,
    learnerStudyDates,
    saveQuizAttempt,
    recordLearnerStudyDay,
    t,
  } = useApp();

  const [recipientName, setRecipientName] = useState(userProfile?.name || '');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examScore, setExamScore] = useState<number>(0);

  // Strict multi-day + multi-step competency gates
  const requiredDays = 3;
  const requiredLessons = 4;
  const requiredScenarios = 2;
  const requiredPassScore = 4; // out of 5 (80%)

  const hasEnoughDays = learnerStudyDates.length >= requiredDays;
  const hasEnoughLessons = completedLessonIds.length >= requiredLessons;
  const scenariosCount = Object.keys(savedScenarioAttempts).length;
  const hasEnoughScenarios = scenariosCount >= requiredScenarios;
  const hasPassedFinalExam = examSubmitted && examScore >= requiredPassScore;

  const allRequirementsMet =
    hasEnoughDays && hasEnoughLessons && hasEnoughScenarios && hasPassedFinalExam;

  const handleGradeExam = (e: React.FormEvent) => {
    e.preventDefault();
    let correct = 0;
    FINAL_KNOWLEDGE_QUESTIONS.forEach(q => {
      if (answers[q.id] === q.correctIndex) {
        correct += 1;
      }
    });
    setExamScore(correct);
    setExamSubmitted(true);
    recordLearnerStudyDay();
    saveQuizAttempt({
      lessonId: 'final-competency-check',
      score: correct,
      totalQuestions: FINAL_KNOWLEDGE_QUESTIONS.length,
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allRequirementsMet) return;
    if (recipientName.trim()) {
      issueLearnerCertificate(recipientName.trim());
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Earned Credential</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {t('certificateTitle')}
          </h1>
          <p className="editorial-subtitle text-slate-600 mt-1.5">
            Your certificate unlocks only after real multi-day practice and passing the basic knowledge check.
          </p>
        </div>

        {learnerCertificate && (
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors shrink-0 print:hidden cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>{t('printCertificate')}</span>
          </button>
        )}
      </div>

      {/* Certificate Display if Issued */}
      {learnerCertificate ? (
        <div className="bg-white border-8 border-double border-slate-300 p-8 sm:p-12 rounded-3xl shadow-lg relative print:border-4 print:shadow-none print:m-0 text-center">
          <div className="absolute top-6 left-6 flex items-center gap-2 text-xs font-bold text-slate-400">
            <span>CLEARPATH AI</span>
            <span>·</span>
            <span>TEAM PHOENIX</span>
          </div>

          <div className="max-w-2xl mx-auto space-y-6 pt-6">
            <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-blue-200 text-blue-900 flex items-center justify-center mx-auto shadow-xs">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                Verified Certificate of Completion
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
                Prevention Science, Brain Habits &amp; Early Support
              </h2>
            </div>

            <div className="py-2">
              <span className="text-xs text-slate-500 block mb-1">This certifies that</span>
              <span className="text-2xl sm:text-3xl font-serif font-bold text-blue-950 underline decoration-blue-300 underline-offset-8">
                {learnerCertificate.recipientName}
              </span>
            </div>

            <p className="prose-readable text-slate-600 max-w-lg mx-auto">
              studied across multiple days, practiced peer-pressure decision drills, and passed the
              ClearPath AI fundamentals check covering dopamine balance, craving waves, and stigma-free help.
            </p>

            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-left">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Issued On
                </span>
                <span className="text-xs font-semibold text-slate-800">
                  {learnerCertificate.completedDate}
                </span>
                <span className="text-[10px] font-mono text-slate-400 block mt-1">
                  ID: {learnerCertificate.verificationCode}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                  Verified By
                </span>
                <span className="text-xs font-bold text-slate-900 block font-serif">
                  ClearPath AI · Team Phoenix
                </span>
                <span className="text-[10px] text-blue-700 font-semibold inline-flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Multi-Day Exam Verified</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Step-by-Step Progress Checklist */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                4 Steps Required to Earn Your Certificate
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Real understanding builds over days, not minutes. Finish each step below to unlock certificate generation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  hasEnoughDays ? 'bg-sky-50/70 border-blue-300' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {hasEnoughDays ? (
                  <CheckCircle2 className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                ) : (
                  <Calendar className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    1. Study Across {requiredDays} Separate Days ({Math.min(requiredDays, learnerStudyDates.length)}/{requiredDays})
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Logged automatically whenever you complete a lesson, flashcard session, or drill on a new calendar day.
                  </p>
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  hasEnoughLessons ? 'bg-sky-50/70 border-blue-300' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {hasEnoughLessons ? (
                  <CheckCircle2 className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                ) : (
                  <BookOpen className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    2. Complete {requiredLessons} Core Lessons ({Math.min(requiredLessons, completedLessonIds.length)}/{requiredLessons})
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Open Guided Lessons inside Learning Methods and finish at least 4 modules.
                  </p>
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  hasEnoughScenarios ? 'bg-sky-50/70 border-blue-300' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {hasEnoughScenarios ? (
                  <CheckCircle2 className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                ) : (
                  <Gamepad2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    3. Practice {requiredScenarios} Peer-Pressure Drills ({Math.min(requiredScenarios, scenariosCount)}/{requiredScenarios})
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Test real choices in the Decision Simulator tab.
                  </p>
                </div>
              </div>

              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  hasPassedFinalExam ? 'bg-sky-50/70 border-blue-300' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {hasPassedFinalExam ? (
                  <CheckCircle2 className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                ) : (
                  <ClipboardCheck className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    4. Pass the 5-Question Check ({examSubmitted ? `${examScore}/5` : '4/5 required'})
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Proves you understand cravings, brain balance, refusal skills, and 14405 help.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Built-in 5-Question Final Basic Knowledge Check */}
          <form
            onSubmit={handleGradeExam}
            className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Final Basic Knowledge Check (5 Questions)
                </h2>
                <p className="text-xs text-slate-500">
                  Score at least 4 out of 5 to verify your core understanding.
                </p>
              </div>
              {examSubmitted && (
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-bold ${
                    hasPassedFinalExam
                      ? 'bg-sky-50 text-blue-800 border border-blue-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  Score: {examScore} / 5 {hasPassedFinalExam ? '· Passed' : '· Try Again'}
                </span>
              )}
            </div>

            <div className="space-y-5">
              {FINAL_KNOWLEDGE_QUESTIONS.map((q, qIdx) => {
                const selected = answers[q.id];
                const isCorrect = selected === q.correctIndex;

                return (
                  <div key={q.id} className="space-y-3">
                    <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {qIdx + 1}. {q.question}
                    </p>
                    <div className="space-y-2.5">
                      {q.options.map((opt, optIdx) => (
                        <label
                          key={optIdx}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border prose-readable-sm cursor-pointer transition-colors ${
                            selected === optIdx
                              ? 'bg-sky-50 border-blue-500 text-blue-950 font-semibold'
                              : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:border-blue-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            checked={selected === optIdx}
                            onChange={() => {
                              setAnswers(prev => ({ ...prev, [q.id]: optIdx }));
                              setExamSubmitted(false);
                            }}
                            className="mt-1 accent-blue-800"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                    {examSubmitted && (
                      <p
                        className={`prose-readable-sm font-medium px-4 py-2.5 rounded-xl ${
                          isCorrect ? 'bg-sky-50 text-blue-900' : 'bg-amber-50 text-amber-900'
                        }`}
                      >
                        {isCorrect ? 'Correct: ' : 'Note: '}
                        {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={Object.keys(answers).length < FINAL_KNOWLEDGE_QUESTIONS.length}
              className="px-5 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 disabled:opacity-45 text-white text-xs font-bold cursor-pointer"
            >
              Submit Knowledge Check
            </button>
          </form>

          {/* Certificate Claim Box (Gated by all 4 requirements) */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  allRequirementsMet ? 'bg-sky-50 text-blue-800' : 'bg-slate-100 text-slate-400'
                }`}
              >
                {allRequirementsMet ? <Award className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {allRequirementsMet
                    ? 'You unlocked your ClearPath AI Certificate!'
                    : 'Complete all 4 steps above to unlock'}
                </h3>
                <p className="text-xs text-slate-600">
                  {allRequirementsMet
                    ? 'Enter your full name exactly as you want it printed.'
                    : 'Once your 3 study days, 4 lessons, 2 drills, and 4/5 final check are done, this form unlocks.'}
                </p>
              </div>
            </div>

            {!allRequirementsMet ? (
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  Still needed:{' '}
                  {[
                    !hasEnoughDays && `${requiredDays - learnerStudyDates.length} more study day(s)`,
                    !hasEnoughLessons && `${requiredLessons - completedLessonIds.length} more lesson(s)`,
                    !hasEnoughScenarios && `${requiredScenarios - scenariosCount} more peer drill(s)`,
                    !hasPassedFinalExam && 'pass the 5-question check (4/5)',
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              </div>
            ) : (
              <form onSubmit={handleIssue} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name for Certificate *
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Claim Official ClearPath AI Certificate</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
