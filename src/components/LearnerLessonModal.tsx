import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Lesson } from '../types';
import {
  X,
  Bookmark,
  CheckCircle2,
  Clock,
  BookOpen,
  Award,
  Sparkles,
  HelpCircle,
  Lightbulb,
  ExternalLink,
} from 'lucide-react';

interface Props {
  lesson: Lesson;
  onClose: () => void;
}

export const LearnerLessonModal: React.FC<Props> = ({ lesson, onClose }) => {
  const {
    completedLessonIds,
    toggleCompleteLesson,
    bookmarkedLessonIds,
    toggleBookmarkLesson,
    saveQuizAttempt,
  } = useApp();

  const isCompleted = completedLessonIds.includes(lesson.id);
  const isBookmarked = bookmarkedLessonIds.includes(lesson.id);

  // Mini-Quiz interactive state
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);

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

    // Auto mark lesson complete if user passes
    if (!isCompleted) {
      toggleCompleteLesson(lesson.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-9 shadow-2xl border border-indigo-100 max-h-[92vh] overflow-y-auto space-y-7">
        {/* Top Bar with actions */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                Pathway Lesson
              </span>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {lesson.readTimeMinutes} min read
              </span>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md capitalize">
                {lesson.difficulty}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
              {lesson.title}
            </h2>
            <p className="editorial-subtitle text-slate-600 mt-1.5">{lesson.subtitle}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 ml-3">
            <button
              onClick={() => toggleBookmarkLesson(lesson.id)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isBookmarked
                  ? 'bg-amber-50 text-amber-600 border border-amber-200'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark lesson'}
            >
              <Bookmark className="w-4 h-4 fill-current" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Learning Objective Box */}
        <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3.5">
          <BookOpen className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800 block">
              Core Learning Objective
            </span>
            <p className="prose-readable text-indigo-950 mt-1">{lesson.objective}</p>
          </div>
        </div>

        {/* Structured Sections */}
        <div className="space-y-6 text-slate-800">
          {lesson.sections.map((sec, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-slate-50/60 border border-slate-200/70 space-y-3">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">{sec.heading}</h3>
              <p className="prose-readable prose-measure text-slate-700 whitespace-pre-line">
                {sec.content}
              </p>
            </div>
          ))}
        </div>

        {/* Scientific Key Takeaways */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
          <div className="flex items-center gap-2 text-slate-900 editorial-kicker">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Key Scientific Takeaways</span>
          </div>
          <ul className="space-y-2.5">
            {lesson.keyTakeaways.map((point, idx) => (
              <li key={idx} className="prose-readable text-slate-700 flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600 mt-2.5 shrink-0" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Practical Life Application */}
        <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-3.5">
          <Lightbulb className="w-5 h-5 text-emerald-700 shrink-0 mt-1" />
          <div>
            <span className="editorial-kicker text-emerald-900 block">
              Real-World Application
            </span>
            <p className="prose-readable prose-measure text-slate-700 mt-1.5">
              {lesson.practicalApplication}
            </p>
          </div>
        </div>

        {/* Selective Verified Wikipedia Reference Links */}
        {lesson.referenceLinks && lesson.referenceLinks.length > 0 && (
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Verified External Reference Reading
            </div>
            <div className="flex flex-wrap gap-2">
              {lesson.referenceLinks.map((ref, idx) => (
                <a
                  key={idx}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-xs font-bold text-indigo-900 transition-colors"
                >
                  <span>{ref.label}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Knowledge Mini-Quiz */}
        {lesson.quizQuestions.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Concept Check Mini-Quiz ({lesson.quizQuestions.length} Questions)
                </h3>
              </div>
              {submittedQuiz && (
                <span className="text-xs font-bold text-indigo-700 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> Checked
                </span>
              )}
            </div>

            <div className="space-y-4">
              {lesson.quizQuestions.map((q, qIdx) => {
                const userChoice = selectedAnswers[q.id];
                return (
                  <div key={q.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                    <div className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {qIdx + 1}. {q.question}
                    </div>

                    <div className="space-y-2.5">
                      {q.options.map((opt, oIdx) => {
                        const isChosen = userChoice === oIdx;
                        let optionStyle = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100';

                        if (submittedQuiz) {
                          if (oIdx === q.correctIndex) {
                            optionStyle = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold';
                          } else if (isChosen && oIdx !== q.correctIndex) {
                            optionStyle = 'bg-rose-50 border-rose-300 text-rose-900 line-through';
                          }
                        } else if (isChosen) {
                          optionStyle = 'bg-indigo-50 border-indigo-600 ring-2 ring-indigo-500/20 text-indigo-950 font-bold';
                        }

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            disabled={submittedQuiz}
                            onClick={() => handleSelectAnswer(q.id, oIdx)}
                            className={`w-full p-3.5 rounded-xl border prose-readable-sm text-left transition-all flex items-center justify-between ${optionStyle} ${
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
                      <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 prose-readable-sm text-indigo-950 space-y-1">
                        <div className="font-semibold">{q.explanation}</div>
                        {q.scientificReference && (
                          <div className="text-xs text-indigo-700 italic">
                            Source: {q.scientificReference}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!submittedQuiz ? (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleGradeQuiz}
                  disabled={Object.keys(selectedAnswers).length < lesson.quizQuestions.length}
                  className="px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Verify Quiz Answers
                </button>
              </div>
            ) : (
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedQuiz(false);
                    setSelectedAnswers({});
                  }}
                  className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 underline cursor-pointer"
                >
                  Retake Quiz
                </button>
              </div>
            )}
          </div>
        )}

        {/* Modal Bottom Completion Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <button
            onClick={() => toggleCompleteLesson(lesson.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{isCompleted ? 'Marked as Completed' : 'Mark as Complete'}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Finished Reading
          </button>
        </div>
      </div>
    </div>
  );
};
