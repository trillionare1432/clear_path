import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  Check,
  Plus,
  Clock,
  ArrowRight,
  CheckCircle2,
  Circle,
  CalendarPlus,
} from 'lucide-react';

interface DashboardTaskCalendarWidgetProps {
  role: 'personal' | 'supporter' | 'learner';
  onOpenCalendar: () => void;
}

export const DashboardTaskCalendarWidget: React.FC<DashboardTaskCalendarWidgetProps> = ({
  role,
  onOpenCalendar,
}) => {
  const {
    language,
    // Personal
    goals,
    toggleMilestone,
    calendarEvents,
    addCalendarEvent,
    toggleCalendarEvent,
    // Supporter
    supportPlans,
    toggleSupportPlanTask,
    supporterEvents,
    addSupporterCalendarEvent,
    toggleSupporterCalendarEvent,
    // Learner
    learnerCustomPlan,
    togglePlanDayCompleted,
    learnerEvents,
    addLearnerEvent,
    toggleLearnerEvent,
  } = useApp();

  const todayISO = new Date().toISOString().split('T')[0];

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(todayISO);
  const [time, setTime] = useState('09:00');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const accentClasses =
    role === 'personal'
      ? {
          iconBg: 'bg-indigo-50 text-indigo-800',
          btn: 'bg-indigo-950 hover:bg-indigo-900 text-white',
          chip: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-indigo-200',
          checkDone: 'bg-indigo-900 text-amber-300 border-indigo-900',
          heading: 'text-indigo-950',
        }
      : role === 'supporter'
      ? {
          iconBg: 'bg-orange-50 text-orange-800',
          btn: 'bg-[#9A3412] hover:bg-[#7C2D12] text-white',
          chip: 'bg-orange-50 hover:bg-orange-100 text-orange-950 border-orange-200',
          checkDone: 'bg-[#9A3412] text-amber-300 border-[#9A3412]',
          heading: 'text-slate-900',
        }
      : {
          iconBg: 'bg-sky-50 text-blue-800',
          btn: 'bg-blue-900 hover:bg-blue-950 text-white',
          chip: 'bg-sky-50 hover:bg-sky-100 text-blue-950 border-blue-200',
          checkDone: 'bg-blue-900 text-white border-blue-900',
          heading: 'text-slate-900',
        };

  const quickPresets =
    role === 'personal'
      ? [
          { label: '+ Walk / Routine', title: 'Morning Walk & Grounding', time: '07:30' },
          { label: '+ Clinic Check-in', title: 'Doctor / Clinic Check-In', time: '10:30' },
          { label: '+ Follow-up', title: 'Evening Calm Follow-Up', time: '18:30' },
        ]
      : role === 'supporter'
      ? [
          { label: '+ Calm Talk', title: 'Quiet Tea & Open Check-In', time: '17:00' },
          { label: '+ Clinic Accompany', title: 'Clinic Visit Support', time: '10:00' },
          { label: '+ Personal Rest', title: 'Protected Supporter Rest Hour', time: '20:00' },
        ]
      : [
          { label: '+ 15m Study', title: '15-Minute Science Lesson', time: '16:30' },
          { label: '+ Refusal Drill', title: 'Peer Pressure Practice', time: '18:00' },
          { label: '+ Day Review', title: 'Quick Concept Recap', time: '20:30' },
        ];

  const saveQuickEvent = (evtTitle: string, evtDate: string, evtTime: string) => {
    const cleanTitle = evtTitle.trim();
    if (!cleanTitle) return;

    if (role === 'personal') {
      addCalendarEvent({
        title: cleanTitle,
        date: evtDate,
        startTime: evtTime,
        category: cleanTitle.toLowerCase().includes('clinic') || cleanTitle.toLowerCase().includes('doctor')
          ? 'appointment'
          : 'healthy_activity',
        reminder: true,
        completed: false,
      });
    } else if (role === 'supporter') {
      addSupporterCalendarEvent({
        title: cleanTitle,
        date: evtDate,
        startTime: evtTime,
        category: cleanTitle.toLowerCase().includes('clinic')
          ? 'appointment'
          : cleanTitle.toLowerCase().includes('rest')
          ? 'wellbeing'
          : 'planned_conversation',
        reminder: true,
        completed: false,
      });
    } else {
      addLearnerEvent({
        title: cleanTitle,
        date: evtDate,
        startTime: evtTime,
        durationMinutes: 15,
        completed: false,
      });
    }

    setTitle('');
    setShowQuickAdd(false);
    setSavedNotice(`Saved "${cleanTitle}" to Calendar`);
    setTimeout(() => setSavedNotice(null), 2600);
  };

  // Build role-scoped inline tasks (goals/plans/calendar items)
  type InlineTaskItem = {
    id: string;
    label: string;
    meta: string;
    completed: boolean;
    onToggle: () => void;
  };

  const inlineTasks: InlineTaskItem[] = [];

  if (role === 'personal') {
    goals.slice(0, 3).forEach(goal => {
      const nextM = goal.milestones.find(m => !m.completed) || goal.milestones[0];
      if (nextM) {
        inlineTasks.push({
          id: `goal-${goal.id}-${nextM.id}`,
          label: nextM.title,
          meta: `Goal · ${goal.title}`,
          completed: nextM.completed,
          onToggle: () => toggleMilestone(goal.id, nextM.id),
        });
      }
    });
    calendarEvents
      .filter(e => e.date >= todayISO)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4)
      .forEach(evt => {
        inlineTasks.push({
          id: `cal-${evt.id}`,
          label: evt.title,
          meta: `${evt.date}${evt.startTime ? ` · ${evt.startTime}` : ''}`,
          completed: evt.completed,
          onToggle: () => toggleCalendarEvent(evt.id),
        });
      });
  } else if (role === 'supporter') {
    supportPlans.slice(0, 3).forEach(plan => {
      const nextT = plan.tasks.find(t => !t.completed) || plan.tasks[0];
      if (nextT) {
        inlineTasks.push({
          id: `sp-${plan.id}-${nextT.id}`,
          label: nextT.title,
          meta: `Plan · ${plan.title}`,
          completed: nextT.completed,
          onToggle: () => toggleSupportPlanTask(plan.id, nextT.id),
        });
      }
    });
    supporterEvents
      .filter(e => e.date >= todayISO)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4)
      .forEach(evt => {
        inlineTasks.push({
          id: `scal-${evt.id}`,
          label: evt.title,
          meta: `${evt.date}${evt.startTime ? ` · ${evt.startTime}` : ''}`,
          completed: evt.completed,
          onToggle: () => toggleSupporterCalendarEvent(evt.id),
        });
      });
  } else {
    if (learnerCustomPlan) {
      const nextDay =
        learnerCustomPlan.days.find(d => !d.completed) || learnerCustomPlan.days[0];
      if (nextDay) {
        inlineTasks.push({
          id: `lplan-${nextDay.dayNumber}`,
          label: `Day ${nextDay.dayNumber}: ${nextDay.title}`,
          meta: `Custom Plan · ${learnerCustomPlan.dailyMinutes} min`,
          completed: nextDay.completed,
          onToggle: () => togglePlanDayCompleted(nextDay.dayNumber),
        });
      }
    }
    learnerEvents
      .filter(e => e.date >= todayISO)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4)
      .forEach(evt => {
        inlineTasks.push({
          id: `lcal-${evt.id}`,
          label: evt.title,
          meta: `${evt.date}${evt.startTime ? ` · ${evt.startTime}` : ''}`,
          completed: evt.completed,
          onToggle: () => toggleLearnerEvent(evt.id),
        });
      });
  }

  return (
    <section
      aria-label="Dashboard Tasks and Quick Calendar"
      className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${accentClasses.iconBg}`}>
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h2 className={`text-base font-extrabold ${accentClasses.heading}`}>
              {language === 'ml' ? 'ടാസ്ക്കുകളും കലണ്ടർ ആക്സസ്സും' : 'Tasks & Quick Calendar'}
            </h2>
            <p className="text-xs text-slate-500">
              {language === 'ml'
                ? 'ഡാഷ്ബോർഡിൽ നിന്ന് തന്നെ ടാസ്ക്കുകൾ പൂർത്തിയാക്കാം, കലണ്ടറിലേക്ക് സേവ് ചെയ്യാം.'
                : 'Mark tasks done right here, 1-click save to your calendar, or jump to your schedule.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowQuickAdd(prev => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${accentClasses.btn}`}
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>{showQuickAdd ? 'Close Form' : 'Quick Save to Calendar'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenCalendar}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Open Calendar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Saved Feedback Banner */}
      {savedNotice && (
        <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-950 flex items-center gap-2">
          <Check className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* 1-Click Presets + Inline Quick Save Form */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            1-Tap Schedule Today:
          </span>
          {quickPresets.map(preset => (
            <button
              key={preset.label}
              type="button"
              onClick={() => saveQuickEvent(preset.title, todayISO, preset.time)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors cursor-pointer ${accentClasses.chip}`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {showQuickAdd && (
          <form
            onSubmit={e => {
              e.preventDefault();
              saveQuickEvent(title, date, time);
            }}
            className="p-4 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
          >
            <div className="sm:col-span-5">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Task or Appointment Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Doctor follow-up or calm evening walk"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Date</label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Time</label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer ${accentClasses.btn}`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Inline Interactive Checklist (Goals / Plans + Upcoming Calendar Tasks) */}
      {inlineTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {inlineTasks.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={item.onToggle}
              className={`p-3.5 rounded-2xl border text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                item.completed
                  ? 'bg-slate-50 border-slate-200 opacity-80'
                  : 'bg-white border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="min-w-0">
                <div
                  className={`text-xs font-bold truncate ${
                    item.completed ? 'line-through text-slate-500' : 'text-slate-900'
                  }`}
                >
                  {item.label}
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span className="truncate">{item.meta}</span>
                </div>
              </div>

              <span className="shrink-0">
                {item.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 hover:text-indigo-600" />
                )}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>
            No upcoming tasks or calendar events scheduled yet. Use a 1-tap preset above or open your full calendar.
          </span>
          <button
            type="button"
            onClick={() => setShowQuickAdd(true)}
            className="text-xs font-bold text-indigo-800 hover:underline self-start sm:self-auto cursor-pointer"
          >
            + Add first item
          </button>
        </div>
      )}
    </section>
  );
};
