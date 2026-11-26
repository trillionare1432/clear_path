import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LEARNER_PATHWAYS, LEARNER_LESSONS } from '../../constants/learnerData';
import { LearnerCalendarEvent } from '../../types';
import {
  Calendar as CalendarIcon,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  BookOpen,
  Sparkles,
  ArrowRight,
  Eye,
  X,
} from 'lucide-react';

export const LearnerCalendarView: React.FC = () => {
  const {
    learnerEvents,
    addLearnerEvent,
    deleteLearnerEvent,
    toggleLearnerEvent,
  } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [showSamplePreview, setShowSamplePreview] = useState(false);

  // Form State
  const todayStr = new Date().toISOString().split('T')[0];
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState('18:00');
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [pathwayId, setPathwayId] = useState(LEARNER_PATHWAYS[0].id);
  const [lessonId, setLessonId] = useState(LEARNER_LESSONS[0].id);
  const [notes, setNotes] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addLearnerEvent({
      title: title.trim(),
      date,
      startTime,
      durationMinutes,
      pathwayId,
      lessonId,
      notes: notes.trim() || undefined,
      completed: false,
    });

    setTitle('');
    setNotes('');
    setIsAdding(false);
  };

  // Sort events by date ascending
  const sortedEvents = [...learnerEvents].sort((a, b) => a.date.localeCompare(b.date));
  const completedCount = learnerEvents.filter(e => e.completed).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
            Study Planner
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-2">
            Learning Schedule & Goals
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Schedule manageable 10-to-15 minute study slots to build consistent, pressure-free understanding.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSamplePreview(true)}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Sample Schedule</span>
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Plan Study Session</span>
          </button>
        </div>
      </div>

      {/* Add Session Form Drawer */}
      {isAdding && (
        <form onSubmit={handleSave} className="bg-white border border-indigo-200 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-600" />
              <span>Schedule New Learning Session</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Session Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Read Dopamine & Habit Loop"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Target Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Time & Duration</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="time"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600"
                />
                <select
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-indigo-600"
                >
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={25}>25 Minutes (Pomodoro)</option>
                  <option value={40}>40 Minutes</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Associated Pathway</label>
              <select
                value={pathwayId}
                onChange={e => setPathwayId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-indigo-600"
              >
                {LEARNER_PATHWAYS.map(p => (
                  <option key={p.id} value={p.id}>
                    Pathway 0{p.number}: {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Personal Focus Note (Optional)</label>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Study with tea after evening walk, take quick notes"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs"
            >
              Save Session
            </button>
          </div>
        </form>
      )}

      {/* Events List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Your Scheduled Sessions ({learnerEvents.length})</span>
          <span>{completedCount} completed</span>
        </div>

        {sortedEvents.length > 0 ? (
          <div className="space-y-3">
            {sortedEvents.map(evt => {
              const pathway = LEARNER_PATHWAYS.find(p => p.id === evt.pathwayId);

              return (
                <div
                  key={evt.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                    evt.completed
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                      : 'bg-white border-slate-200 text-slate-900 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => toggleLearnerEvent(evt.id)}
                      className={`mt-0.5 p-1 rounded-lg transition-colors cursor-pointer ${
                        evt.completed
                          ? 'text-emerald-700 hover:text-emerald-800'
                          : 'text-slate-300 hover:text-slate-500'
                      }`}
                      title={evt.completed ? 'Mark incomplete' : 'Mark completed'}
                    >
                      <CheckCircle2 className={`w-5 h-5 ${evt.completed ? 'fill-emerald-100 text-emerald-700' : ''}`} />
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${evt.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                          {evt.title}
                        </span>
                        {pathway && (
                          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            P0{pathway.number}
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-1">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3 text-slate-400" />
                          {evt.date}
                        </span>
                        {evt.startTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {evt.startTime} ({evt.durationMinutes}m)
                          </span>
                        )}
                        {evt.notes && <span className="italic">"{evt.notes}"</span>}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteLearnerEvent(evt.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3">
            <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No study sessions scheduled yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Planning just 15 minutes twice a week helps cement understanding of dopamine, peer dynamics, and emotional self-regulation.
            </p>
            <button
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule First Study Session</span>
            </button>
          </div>
        )}
      </div>

      {/* Illustrative Sample Modal */}
      {showSamplePreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-indigo-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                  Read-Only Example
                </span>
                <span className="text-xs text-slate-400">Illustrative Schedule</span>
              </div>
              <button
                onClick={() => setShowSamplePreview(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Here is an example of how an organized weekly study schedule looks when populated with sessions:
            </p>

            <div className="space-y-2.5">
              {[
                { title: 'Read Dopamine & Hijacked Reward', day: 'Tuesday 18:00', duration: '15 mins', path: 'P02' },
                { title: 'Practice 4D Refusal Script Scenarios', day: 'Thursday 19:30', duration: '20 mins', path: 'P05' },
                { title: 'Review Exam Anxiety & Cyclic Sigh', day: 'Saturday 10:00', duration: '15 mins', path: 'P06' },
              ].map((ex, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">{ex.title}</div>
                    <div className="text-slate-500 mt-0.5">{ex.day} · {ex.duration}</div>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    {ex.path}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSamplePreview(false)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
