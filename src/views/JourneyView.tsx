import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Compass, Edit3, CheckCircle2, Shield, Heart, Stethoscope, Clock, Plus, Target } from 'lucide-react';

interface Props {
  onSelectTab: (tab: string) => void;
}

export const JourneyView: React.FC<Props> = ({ onSelectTab }) => {
  const { personalOnboarding, savePersonalOnboarding, goals, dailyLogs, calendarEvents } = useApp();
  const [isEditingFocus, setIsEditingFocus] = useState(false);
  const [focusText, setFocusText] = useState(
    personalOnboarding?.primaryNeed || 'Building a steady, healthy daily routine and clear mind.'
  );

  const handleSaveFocus = () => {
    if (personalOnboarding) {
      savePersonalOnboarding({
        ...personalOnboarding,
        primaryNeed: focusText,
      });
    }
    setIsEditingFocus(false);
  };

  // Compile timeline from completed milestones and daily logs
  const timelineItems: {
    id: string;
    date: string;
    title: string;
    type: 'milestone' | 'log' | 'event';
    desc?: string;
  }[] = [];

  // Add completed goal milestones
  goals.forEach(goal => {
    goal.milestones
      .filter(m => m.completed)
      .forEach(m => {
        timelineItems.push({
          id: m.id,
          date: 'Recorded Milestone',
          title: `${goal.title}: ${m.title}`,
          type: 'milestone',
          desc: `Category: ${goal.category}`,
        });
      });
  });

  // Add daily logs
  dailyLogs
    .filter(l => !l.isDraft)
    .slice(0, 5)
    .forEach(l => {
      timelineItems.push({
        id: l.id,
        date: l.date,
        title: l.mood ? `Daily Check-in · Mood: ${l.mood}` : 'Daily Log Check-in',
        type: 'log',
        desc: l.quickNote || l.personalReflection,
      });
    });

  // Add completed events
  calendarEvents
    .filter(e => e.completed)
    .slice(0, 4)
    .forEach(e => {
      timelineItems.push({
        id: e.id,
        date: e.date,
        title: `Completed Activity: ${e.title}`,
        type: 'event',
        desc: e.notes,
      });
    });

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Title & Introduction */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-800 uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            <span>Workspace</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">My Journey</h1>
          <p className="editorial-subtitle text-slate-600 mt-1.5 max-w-2xl">
            Your self-directed recovery roadmap. Define your focus, review achievements, and adapt anytime.
          </p>
        </div>
      </div>

      {/* 1. My Current Focus Card (Editable) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Current Personal Focus
          </span>
          {!isEditingFocus ? (
            <button
              onClick={() => setIsEditingFocus(true)}
              className="text-xs font-semibold text-indigo-800 hover:text-indigo-900 flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Focus</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditingFocus(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFocus}
                className="text-xs font-bold text-indigo-800 hover:text-indigo-900"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {isEditingFocus ? (
          <div className="space-y-3">
            <textarea
              value={focusText}
              onChange={e => setFocusText(e.target.value)}
              rows={3}
              className="w-full p-3 rounded-xl border border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-slate-800"
              placeholder="What is your central priority right now?"
            />
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                &ldquo;{focusText}&rdquo;
              </p>
              <p className="prose-readable-sm text-slate-600 mt-2.5">
                You can change this focus whenever your circumstances evolve. No clinical diagnostic labels are assigned.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 2. My Support Plan Overview */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <h2 className="text-lg font-extrabold text-slate-900">My Support Plan &amp; Allies</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs font-bold text-indigo-800 uppercase tracking-wide">
              <Shield className="w-4 h-4 text-indigo-700" />
              <span>Emergency Route</span>
            </div>
            <p className="prose-readable-sm text-slate-600">
              Official Kerala Vimukthi 24/7 Helpline available toll-free.
            </p>
            <a
              href="tel:14405"
              className="text-xs font-bold text-indigo-800 hover:underline flex items-center gap-1 pt-1"
            >
              Call 14405 &rarr;
            </a>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-700 uppercase tracking-wide">
              <Heart className="w-4 h-4 text-amber-700" />
              <span>Supporter Circle</span>
            </div>
            <p className="prose-readable-sm text-slate-600">
              Personal journey remains 100% private. Share updates only when you choose.
            </p>
            <span className="text-xs font-semibold text-slate-500 block pt-1">Self-Directed Access</span>
          </div>

          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center gap-2.5 text-xs font-bold text-sky-800 uppercase tracking-wide">
              <Stethoscope className="w-4 h-4 text-sky-700" />
              <span>Professional Care</span>
            </div>
            <p className="prose-readable-sm text-slate-600">
              Direct access to verified district de-addiction and general hospitals.
            </p>
            <button
              onClick={() => onSelectTab('support')}
              className="text-xs font-bold text-sky-800 hover:underline flex items-center gap-1 pt-1"
            >
              Browse Directory &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* 3. Visual Journey Timeline */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Milestone & Activity Timeline</h2>
            <p className="text-xs text-slate-500">A personal record of completed goals and daily logs</p>
          </div>
          <button
            onClick={() => onSelectTab('rebuild')}
            className="text-xs font-semibold text-indigo-800 hover:text-indigo-900 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add New Goal</span>
          </button>
        </div>

        {timelineItems.length > 0 ? (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {timelineItems.map((item, idx) => (
              <div key={item.id + '_' + idx} className="relative">
                {/* Dot */}
                <div
                  className={`absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                    item.type === 'milestone'
                      ? 'bg-indigo-700 ring-2 ring-indigo-100'
                      : item.type === 'log'
                      ? 'bg-sky-600 ring-2 ring-sky-100'
                      : 'bg-amber-600 ring-2 ring-amber-100'
                  }`}
                />
                <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="text-sm font-bold text-slate-800">{item.title}</span>
                    <span className="font-mono-tabular text-[11px]">{item.date}</span>
                  </div>
                  {item.desc && <p className="prose-readable-sm text-slate-600">{item.desc}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-xs text-slate-500 mb-3">No milestones recorded yet.</p>
            <button
              onClick={() => onSelectTab('rebuild')}
              className="px-4 py-2 bg-indigo-800 text-white rounded-xl text-xs font-semibold hover:bg-indigo-900 transition-colors"
            >
              Create Your First Goal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
