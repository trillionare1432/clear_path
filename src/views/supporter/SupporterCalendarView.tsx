import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
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
  Heart,
  MessageSquare,
  Stethoscope,
  Smile,
  X,
} from 'lucide-react';
import { SupporterCalendarEvent, SupporterEventCategory } from '../../types';

export const SupporterCalendarView: React.FC = () => {
  const {
    supporterEvents,
    addSupporterCalendarEvent,
    updateSupporterCalendarEvent,
    deleteSupporterCalendarEvent,
    toggleSupporterCalendarEvent,
  } = useApp();

  const [viewMode, setViewMode] = useState<'month' | 'agenda'>('month');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState(selectedDate);
  const [formStartTime, setFormStartTime] = useState('16:00');
  const [formEndTime, setFormEndTime] = useState('17:00');
  const [formCategory, setFormCategory] = useState<SupporterEventCategory>('planned_conversation');
  const [formNotes, setFormNotes] = useState('');

  const CATEGORIES: { key: SupporterEventCategory; label: string; dot: string; color: string }[] = [
    { key: 'planned_conversation', label: 'Planned Conversation', dot: 'bg-amber-600', color: 'bg-amber-50 text-amber-900 border-amber-200' },
    { key: 'appointment_accompaniment', label: 'Doctor / Clinic Visit', dot: 'bg-rose-600', color: 'bg-rose-50 text-rose-900 border-rose-200' },
    { key: 'support_followup', label: 'Support Follow-up', dot: 'bg-emerald-600', color: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
    { key: 'wellbeing', label: 'Personal Decompression', dot: 'bg-teal-600', color: 'bg-teal-50 text-teal-900 border-teal-200' },
    { key: 'education', label: 'Supporter Learning', dot: 'bg-sky-600', color: 'bg-sky-50 text-sky-900 border-sky-200' },
  ];

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => setCurrentMonthDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentMonthDate(new Date(year, month + 1, 1));

  const openAddModal = (dateStr?: string) => {
    setEditingEventId(null);
    setFormTitle('');
    setFormDate(dateStr || selectedDate);
    setFormStartTime('16:00');
    setFormEndTime('17:00');
    setFormCategory('planned_conversation');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (editingEventId) {
      updateSupporterCalendarEvent(editingEventId, {
        title: formTitle,
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        category: formCategory,
        notes: formNotes,
      });
    } else {
      addSupporterCalendarEvent({
        title: formTitle,
        date: formDate,
        startTime: formStartTime,
        endTime: formEndTime,
        category: formCategory,
        notes: formNotes,
        reminder: true,
        completed: false,
      });
    }

    setIsModalOpen(false);
  };

  const filteredEvents = supporterEvents
    .filter(e => categoryFilter === 'all' || e.category === categoryFilter)
    .filter(e => (viewMode === 'agenda' ? true : e.date === selectedDate))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-200/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">
            <CalendarIcon className="w-4 h-4 text-amber-700" />
            <span>Schedule & Balance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Supporter Calendar</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Schedule conversations, medical accompaniment, and your own essential self-care sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === 'month' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === 'agenda' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Agenda
            </button>
          </div>

          <button
            onClick={() => openAddModal(selectedDate)}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Event</span>
          </button>
        </div>
      </div>

      {/* Month Grid View */}
      {viewMode === 'month' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
          {/* Month Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">
              {currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Names */}
          <div className="grid grid-cols-7 text-center text-[11px] font-bold text-slate-400 uppercase py-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Month Days */}
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[80px] bg-slate-50/40 rounded-xl" />
            ))}

            {Array.from({ length: totalDaysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayEvents = supporterEvents.filter(e => e.date === dateStr);
              const isSelected = selectedDate === dateStr;
              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[80px] p-2 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-amber-600 bg-amber-50/40 shadow-xs'
                      : isToday
                      ? 'border-slate-300 bg-slate-50 font-semibold'
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs w-5 h-5 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-amber-700 text-white font-bold' : 'text-slate-700'
                      }`}
                    >
                      {dayNum}
                    </span>
                  </div>

                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map(evt => (
                      <div
                        key={evt.id}
                        className={`text-[10px] px-1 py-0.5 rounded truncate font-medium bg-amber-100 text-amber-900 ${
                          evt.completed ? 'line-through opacity-60' : ''
                        }`}
                      >
                        {evt.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Day Agenda */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Agenda for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h3>
            <p className="text-xs text-slate-500">Planned supporter actions and personal restorative routines</p>
          </div>
          <button
            onClick={() => openAddModal(selectedDate)}
            className="px-3 py-1.5 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded-xl text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Event</span>
          </button>
        </div>

        {filteredEvents.length > 0 ? (
          <div className="space-y-2.5">
            {filteredEvents.map(evt => (
              <div
                key={evt.id}
                className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                  evt.completed ? 'bg-slate-50/60 border-slate-200 opacity-75' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleSupporterCalendarEvent(evt.id)}
                    className="text-slate-400 hover:text-amber-700 transition-colors"
                  >
                    {evt.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-amber-700" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  <div>
                    <div className={`text-sm font-semibold text-slate-900 ${evt.completed ? 'line-through' : ''}`}>
                      {evt.title}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      {evt.startTime && <span>{evt.startTime}</span>}
                      {evt.notes && <span>· {evt.notes}</span>}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deleteSupporterCalendarEvent(evt.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            No events scheduled for this day. Click "+ Add Event" above to plan a conversation, appointment, or rest period.
          </div>
        )}
      </div>

      {/* Event Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Schedule Supporter Event</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Title</label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                placeholder="e.g. Quiet afternoon tea with brother"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={e => setFormDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={e => setFormCategory(e.target.value as SupporterEventCategory)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600"
                >
                  {CATEGORIES.map(c => (
                    <option key={c.key} value={c.key}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={formStartTime}
                  onChange={e => setFormStartTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={formEndTime}
                  onChange={e => setFormEndTime(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Notes</label>
              <textarea
                rows={2}
                value={formNotes}
                onChange={e => setFormNotes(e.target.value)}
                placeholder="Remind myself: listen without giving unsolicited advice..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold"
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
