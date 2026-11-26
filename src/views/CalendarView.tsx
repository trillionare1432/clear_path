import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CalendarEvent, EventCategory } from '../types';
import {
  Calendar as CalendarIcon,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  Bell,
  Stethoscope,
} from 'lucide-react';
import { filterCalendarEvents } from '../utils/logic';

import { copyPhoneToClipboard } from '../utils/clipboard';

export const CalendarView: React.FC = () => {
  const {
    calendarEvents,
    clientAppointments,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    toggleCalendarEvent,
  } = useApp();

  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [copiedAgenda, setCopiedAgenda] = useState(false);

  // Month navigation state
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());

  // Modal State for Add / Edit Event
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(selectedDate);
  const [formStartTime, setFormStartTime] = useState('09:00');
  const [formEndTime, setFormEndTime] = useState('10:00');
  const [formCategory, setFormCategory] = useState<EventCategory>('healthy_activity');
  const [formCompletionState, setFormCompletionState] =
    useState<NonNullable<CalendarEvent['completionState']>>('planned');
  const [formNotes, setFormNotes] = useState('');
  const [formReminder, setFormReminder] = useState(true);

  const categories: { key: EventCategory; label: string; color: string; dot: string }[] = [
    { key: 'appointment', label: 'Professional Appointment', color: 'bg-rose-50 text-rose-800 border-rose-200', dot: 'bg-rose-500' },
    { key: 'personal_goal', label: 'Personal Goal', color: 'bg-indigo-50 text-indigo-800 border-indigo-200', dot: 'bg-indigo-500' },
    { key: 'healthy_activity', label: 'Healthy Routine', color: 'bg-teal-50 text-teal-800 border-teal-200', dot: 'bg-teal-500' },
    { key: 'learning', label: 'Learning & Skills', color: 'bg-sky-50 text-sky-800 border-sky-200', dot: 'bg-sky-500' },
    { key: 'supporter_meeting', label: 'Family / Supporter', color: 'bg-amber-50 text-amber-800 border-amber-200', dot: 'bg-amber-500' },
    { key: 'reflection', label: 'Personal Reflection', color: 'bg-indigo-50 text-indigo-800 border-indigo-200', dot: 'bg-indigo-500' },
    { key: 'other', label: 'Other', color: 'bg-slate-50 text-slate-800 border-slate-200', dot: 'bg-slate-500' },
  ];

  // Helper for generating calendar month days
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const openAddModal = (dateStr?: string) => {
    setEditingEventId(null);
    setFormTitle('');
    setFormDate(dateStr || selectedDate);
    setFormStartTime('09:00');
    setFormEndTime('10:00');
    setFormCategory('healthy_activity');
    setFormCompletionState('planned');
    setFormNotes('');
    setFormReminder(true);
    setIsModalOpen(true);
  };

  const openEditModal = (event: CalendarEvent) => {
    setEditingEventId(event.id);
    setFormTitle(event.title);
    setFormDate(event.date);
    setFormStartTime(event.startTime || '09:00');
    setFormEndTime(event.endTime || '10:00');
    setFormCategory(event.category);
    setFormCompletionState(event.completionState || (event.completed ? 'completed' : 'planned'));
    setFormNotes(event.notes || '');
    setFormReminder(event.reminder);
    setIsModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingEventId) {
      updateCalendarEvent(editingEventId, {
        title: formTitle,
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        category: formCategory,
        completionState: formCompletionState,
        completed: formCompletionState === 'completed',
        notes: formNotes,
        reminder: formReminder,
      });
    } else {
      addCalendarEvent({
        title: formTitle,
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        category: formCategory,
        completionState: formCompletionState,
        notes: formNotes,
        reminder: formReminder,
        completed: formCompletionState === 'completed',
      });
    }

    setIsModalOpen(false);
  };

  // Filtered events
  const baseFilteredEvents = filterCalendarEvents(
    calendarEvents,
    viewMode === 'agenda' ? selectedDate : undefined,
    categoryFilter
  );
  const filteredEvents = baseFilteredEvents.filter(evt => {
    if (statusFilter === 'upcoming') return !evt.completed;
    if (statusFilter === 'completed') return evt.completed;
    return true;
  });

  const handleQuickPreset = (presetTitle: string, category: EventCategory, time: string) => {
    addCalendarEvent({
      title: presetTitle,
      date: selectedDate,
      startTime: time,
      category,
      reminder: true,
      completed: false,
    });
  };

  const handleCopyAgenda = async () => {
    if (filteredEvents.length === 0) return;
    const summary = filteredEvents
      .map(e => `- [${e.completed ? 'Done' : 'Open'}] ${e.date} ${e.startTime || ''} ${e.title}`)
      .join('\n');
    const ok = await copyPhoneToClipboard(summary);
    if (ok) {
      setCopiedAgenda(true);
      setTimeout(() => setCopiedAgenda(false), 1800);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-800 uppercase tracking-wider mb-1">
            <CalendarIcon className="w-4 h-4" />
            <span>Schedule & Routine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Personal Calendar</h1>
          <p className="text-sm text-slate-600 mt-1">
            Schedule appointments, daily walks, reflections, and support sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Month View
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'agenda' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day Agenda
            </button>
          </div>

          <button
            onClick={() => openAddModal()}
            className="px-4 py-2 bg-indigo-800 hover:bg-indigo-900 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" /> Filter:
        </span>
        <button
          onClick={() => setCategoryFilter('all')}
          className={`min-h-[40px] px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            categoryFilter === 'all'
              ? 'bg-slate-900 text-white font-semibold'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All Categories
        </button>
        {categories.map(c => (
          <button
            key={c.key}
            onClick={() => setCategoryFilter(c.key)}
            className={`min-h-[40px] px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              categoryFilter === c.key
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${c.dot}`} />
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Status Filter + 1-Tap Quick Save Presets */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
            Status:
          </span>
          {(['all', 'upcoming', 'completed'] as const).map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-colors ${
                statusFilter === st
                  ? 'bg-indigo-950 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleQuickPreset('Daily Grounding Walk', 'healthy_activity', '07:30')}
            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 text-xs font-bold cursor-pointer"
          >
            + Routine Block
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('Clinic / Counselor Visit', 'appointment', '10:30')}
            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 text-xs font-bold cursor-pointer"
          >
            + Clinic Visit
          </button>
          <button
            type="button"
            onClick={handleCopyAgenda}
            disabled={filteredEvents.length === 0}
            className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            {copiedAgenda ? 'Schedule Copied' : 'Copy Agenda'}
          </button>
        </div>
      </div>

      {/* View Mode: Month */}
      {viewMode === 'month' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">
              {currentMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentMonthDate(new Date())}
                className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md"
              >
                Today
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-400 mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Blank leading slots */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[85px] bg-slate-50/40 rounded-xl" />
            ))}

            {/* Month Days */}
            {Array.from({ length: totalDaysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayEvents = calendarEvents.filter(e => e.date === dateStr);
              const isSelected = selectedDate === dateStr;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[85px] p-2 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-xs'
                      : isToday
                      ? 'border-slate-300 bg-slate-50/70 font-semibold'
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-indigo-800 text-white font-bold' : 'text-slate-700'
                      }`}
                    >
                      {dayNum}
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        openAddModal(dateStr);
                      }}
                      className="opacity-0 hover:opacity-100 text-slate-400 hover:text-indigo-700 text-xs"
                      title="Add event on this date"
                    >
                      +
                    </button>
                  </div>

                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map(evt => {
                      const state = evt.completionState || (evt.completed ? 'completed' : 'planned');
                      return (
                        <div
                          key={evt.id}
                          className={`text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${
                            state === 'skipped'
                              ? 'bg-slate-200 text-slate-600 line-through'
                              : state === 'partial'
                              ? 'bg-amber-100 text-amber-900'
                              : evt.category === 'appointment'
                              ? 'bg-rose-100 text-rose-800'
                              : evt.category === 'healthy_activity'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-sky-100 text-sky-800'
                          } ${state === 'completed' ? 'opacity-70 line-through' : ''}`}
                        >
                          {evt.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-slate-500 pl-1">
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Day Agenda & Events List */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Agenda for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
            <p className="text-xs text-slate-500">Manage tasks and appointments for this date</p>
          </div>
          <button
            onClick={() => openAddModal(selectedDate)}
            className="px-3.5 py-1.5 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 rounded-xl text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Event for this day</span>
          </button>
        </div>

        {clientAppointments.filter(a => viewMode === 'agenda' || a.appointmentDate === selectedDate).length > 0 && (
          <div className="mb-4 space-y-2">
            {clientAppointments
              .filter(a => viewMode === 'agenda' || a.appointmentDate === selectedDate)
              .map(appt => (
                <div
                  key={appt.id}
                  className="p-3.5 rounded-2xl bg-emerald-50/75 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <Stethoscope className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-emerald-950">
                        Clinician Appointment · {appt.therapistName}
                      </div>
                      <div className="text-slate-700 mt-0.5">{appt.noteText}</div>
                      {appt.agreedNextSteps && (
                        <div className="text-[11px] text-emerald-900 font-medium mt-0.5">
                          Next steps: {appt.agreedNextSteps}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0 tabular-nums">
                    <div className="font-bold text-slate-900">
                      {appt.appointmentDate}{appt.appointmentTime ? ` · ${appt.appointmentTime}` : ''}
                    </div>
                    <div className="text-[10px] font-bold uppercase text-emerald-800">
                      {(appt.status || 'upcoming').replace(/_/g, ' ')}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {filteredEvents.length > 0 ? (
          <div className="space-y-3">
            {filteredEvents.map(evt => {
              const catConfig = categories.find(c => c.key === evt.category) || categories[categories.length - 1];
              return (
                <div
                  key={evt.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    evt.completed ? 'bg-slate-50/60 border-slate-200 opacity-75' : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <button
                      onClick={() => toggleCalendarEvent(evt.id)}
                      className="mt-0.5 text-slate-400 hover:text-indigo-700 transition-colors"
                      title={evt.completed ? 'Mark incomplete' : 'Mark completed'}
                    >
                      {evt.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-indigo-700" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400" />
                      )}
                    </button>

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${catConfig.color}`}
                        >
                          {catConfig.label}
                        </span>
                        {evt.reminder && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-0.5" title="Reminder configured">
                            <Bell className="w-3 h-3 text-slate-400" /> Remind
                          </span>
                        )}
                      </div>
                      <h4
                        className={`text-sm font-bold text-slate-900 mt-1 ${
                          evt.completed ? 'line-through text-slate-500' : ''
                        }`}
                      >
                        {evt.title}
                      </h4>
                      {(evt.updatedByRole === 'therapist' || evt.createdByRole === 'therapist') && (
                        <div className="text-[11px] font-semibold text-emerald-800 mt-0.5">
                          {evt.updatedByRole === 'therapist'
                            ? `Updated by Therapist${evt.updatedByTherapistName ? ` (${evt.updatedByTherapistName})` : ''}`
                            : 'Scheduled by Clinician · Therapist-Guided Session'}
                          {evt.therapistChangeNote ? ` — ${evt.therapistChangeNote}` : ''}
                        </div>
                      )}
                      {evt.notes && <p className="text-xs text-slate-500 mt-0.5">{evt.notes}</p>}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <select
                      aria-label={`Completion status for ${evt.title}`}
                      value={evt.completionState || (evt.completed ? 'completed' : 'planned')}
                      onChange={e =>
                        updateCalendarEvent(evt.id, {
                          completionState: e.target.value as NonNullable<CalendarEvent['completionState']>,
                        })
                      }
                      className={`px-2 py-1 rounded-lg border text-[11px] font-bold cursor-pointer ${
                        (evt.completionState || (evt.completed ? 'completed' : 'planned')) === 'completed'
                          ? 'bg-teal-50 border-teal-200 text-teal-900'
                          : (evt.completionState || 'planned') === 'partial'
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : (evt.completionState || 'planned') === 'skipped'
                          ? 'bg-slate-100 border-slate-300 text-slate-700'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <option value="planned">Planned</option>
                      <option value="completed">Completed</option>
                      <option value="partial">Partial</option>
                      <option value="skipped">Skipped</option>
                    </select>
                    {evt.startTime && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {evt.startTime} {evt.endTime ? `- ${evt.endTime}` : ''}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(evt)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCalendarEvent(evt.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Delete event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            No events found for this filter or date. Click "Add Event" above to create one.
          </div>
        )}
      </div>

      {/* Event Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEvent}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4"
          >
            <h3 className="text-lg font-bold text-slate-900">
              {editingEventId ? 'Edit Event' : 'Schedule New Event'}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Title *</label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="e.g., Morning Walk, Dr. Check-in, CBT Session"
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value as EventCategory)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {categories.map(c => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={formStartTime}
                  onChange={e => setFormStartTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={formEndTime}
                  onChange={e => setFormEndTime(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Completion State</label>
              <select
                value={formCompletionState}
                onChange={e =>
                  setFormCompletionState(e.target.value as NonNullable<CalendarEvent['completionState']>)
                }
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="planned">Planned (Upcoming)</option>
                <option value="completed">Completed</option>
                <option value="partial">Partial (Did part of it)</option>
                <option value="skipped">Skipped (Explicitly skipped)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
              <textarea
                rows={2}
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                placeholder="Bring notebook, check question checklist..."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={formReminder}
                onChange={e => setFormReminder(e.target.checked)}
                className="w-4 h-4 text-indigo-700 rounded focus:ring-indigo-500"
              />
              <span>Enable browser/device reminder notification</span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-800 hover:bg-indigo-900 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Save Event
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
