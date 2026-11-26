import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LEARNER_PATHWAYS, LEARNER_LESSONS } from '../../constants/learnerData';
import { Lesson } from '../../types';
import { LessonReaderWorkspace } from '../../components/LessonReaderWorkspace';
import {
  Search,
  Bookmark,
  CheckCircle2,
  Clock,
  BookOpen,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';

export const LearnerLibraryView: React.FC = () => {
  const { completedLessonIds, bookmarkedLessonIds, toggleBookmarkLesson, openAiAssistant } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPathway, setSelectedPathway] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState<boolean>(false);
  const [activeReadingLesson, setActiveReadingLesson] = useState<Lesson | null>(null);

  const filteredLessons = LEARNER_LESSONS.filter(l => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inTitle = l.title.toLowerCase().includes(q);
      const inSummary = l.summary.toLowerCase().includes(q);
      const inObjective = l.objective.toLowerCase().includes(q);
      const inTakeaways = l.keyTakeaways.some(t => t.toLowerCase().includes(q));
      if (!inTitle && !inSummary && !inObjective && !inTakeaways) return false;
    }

    if (selectedPathway !== 'all' && l.pathwayId !== selectedPathway) {
      return false;
    }

    if (selectedDifficulty !== 'all' && l.difficulty !== selectedDifficulty) {
      return false;
    }

    if (showBookmarkedOnly && !bookmarkedLessonIds.includes(l.id)) {
      return false;
    }

    return true;
  });

  if (activeReadingLesson) {
    return (
      <LessonReaderWorkspace
        lesson={activeReadingLesson}
        lessonList={filteredLessons.length > 0 ? filteredLessons : LEARNER_LESSONS}
        backLabel="Back to Content Library"
        onSelectLesson={setActiveReadingLesson}
        onBack={() => setActiveReadingLesson(null)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-sky-50 border border-blue-200 px-2.5 py-1 rounded-md">
          Knowledge Base
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
          All Short Lessons &amp; Fact Sheets
        </h1>
        <p className="editorial-subtitle text-slate-600 mt-1.5 max-w-2xl">
          Search any topic across brain science, peer pressure, stress coping, and support resources, and read cleanly at your pace.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search topics (e.g. dopamine, peer pressure, sleep, HALT, NDPS Act...)"
              className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-base sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-700"
            />
          </div>
          <button
            type="button"
            onClick={() =>
              openAiAssistant({
                role: 'learner',
                contextRef: {
                  area: 'Topic Filter',
                  topicTitle:
                    searchQuery.trim() ||
                    LEARNER_PATHWAYS.find(p => p.id === selectedPathway)?.title ||
                    'All Topics',
                  snippet: 'Explain this topic in simple, everyday words.',
                },
              })
            }
            className="min-h-[44px] px-4 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Have a question? Ask AI</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <select
            value={selectedPathway}
            onChange={e => setSelectedPathway(e.target.value)}
            className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold focus:outline-none focus:border-blue-700"
          >
            <option value="all">All 8 Topics</option>
            {LEARNER_PATHWAYS.map(p => (
              <option key={p.id} value={p.id}>
                Topic 0{p.number}: {p.title}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={e => setSelectedDifficulty(e.target.value)}
            className="min-h-[44px] px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold focus:outline-none focus:border-blue-700"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          <button
            type="button"
            onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl border font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              showBookmarkedOnly
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5 fill-current text-amber-600" />
            <span>Saved ({bookmarkedLessonIds.length})</span>
          </button>

          {(searchQuery || selectedPathway !== 'all' || selectedDifficulty !== 'all' || showBookmarkedOnly) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedPathway('all');
                setSelectedDifficulty('all');
                setShowBookmarkedOnly(false);
              }}
              className="min-h-[44px] px-2 text-xs text-blue-800 hover:underline font-semibold ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Showing {filteredLessons.length} of {LEARNER_LESSONS.length} short lessons</span>
        <span>{completedLessonIds.length} completed</span>
      </div>

      {/* Lessons Grid */}
      {filteredLessons.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLessons.map(lesson => {
            const isDone = completedLessonIds.includes(lesson.id);
            const isBookmarked = bookmarkedLessonIds.includes(lesson.id);
            const pathway = LEARNER_PATHWAYS.find(p => p.id === lesson.pathwayId);

            return (
              <div
                key={lesson.id}
                className="bg-white border border-slate-200 hover:border-blue-300 rounded-3xl p-5 shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 bg-sky-50 px-2 py-0.5 rounded">
                      Topic 0{pathway?.number}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {lesson.readTimeMinutes} min
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleBookmarkLesson(lesson.id)}
                        className={`p-1 rounded-md transition-colors cursor-pointer ${
                          isBookmarked ? 'text-amber-600' : 'text-slate-300 hover:text-slate-500'
                        }`}
                        title={isBookmarked ? 'Saved' : 'Save lesson'}
                      >
                        <Bookmark className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 mb-1.5">{lesson.title}</h3>
                  <p className="prose-readable-sm text-slate-600 line-clamp-3 mb-5">
                    {lesson.summary}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  {isDone ? (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Done
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 capitalize">{lesson.difficulty}</span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        openAiAssistant({
                          role: 'learner',
                          contextRef: {
                            area: 'Lesson Card',
                            topicTitle: lesson.title,
                            snippet: lesson.summary,
                          },
                        })
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 border border-blue-200 text-blue-900 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      title="Ask AI about this lesson"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Ask AI</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveReadingLesson(lesson)}
                      className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <span>{isDone ? 'Read Again' : 'Read Lesson'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No lessons matched your search</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try searching for terms like "dopamine", "refusal", "brain", or clear your filter selections.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedPathway('all');
              setSelectedDifficulty('all');
              setShowBookmarkedOnly(false);
            }}
            className="px-4 py-2 bg-sky-50 text-blue-900 rounded-xl text-xs font-bold hover:bg-sky-100 transition-colors cursor-pointer"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};
