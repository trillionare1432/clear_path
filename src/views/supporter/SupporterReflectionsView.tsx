import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BookOpen,
  Plus,
  Trash2,
  Search,
  Smile,
  Meh,
  Frown,
  Sun,
  Heart,
  Eye,
  X,
  Calendar,
  Check,
} from 'lucide-react';
import { SupporterMood } from '../../types';
import { SAMPLE_SUPPORTER_PREVIEW_DATA } from '../../constants/initialData';

export const SupporterReflectionsView: React.FC = () => {
  const {
    supporterReflections,
    addSupporterReflection,
    deleteSupporterReflection,
    supporterEvents,
    addSupporterCalendarEvent,
    toggleSupporterCalendarEvent,
    deleteSupporterCalendarEvent,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'timeline' | 'create'>('timeline');
  const [reflectionType, setReflectionType] = useState<'quick' | 'detailed'>('quick');

  // Form State
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formMood, setFormMood] = useState<SupporterMood>('steady');
  const [formQuickNote, setFormQuickNote] = useState('');
  const [formTag, setFormTag] = useState('');
  const [tagsList, setTagsList] = useState<string[]>([]);

  // Detailed fields
  const [learnedToday, setLearnedToday] = useState('');
  const [wentWell, setWentWell] = useState('');
  const [difficulties, setDifficulties] = useState('');
  const [supportProvided, setSupportProvided] = useState('');
  const [understandBetter, setUnderstandBetter] = useState('');
  const [focusNext, setFocusNext] = useState('');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState<string>('all');
  const [showSampleModal, setShowSampleModal] = useState(false);

  // Supporter Appointment Date Saver
  const [apptTitle, setApptTitle] = useState('');
  const [apptDate, setApptDate] = useState(new Date().toISOString().split('T')[0]);
  const [apptTime, setApptTime] = useState('10:30');
  const [apptNotes, setApptNotes] = useState('');
  const [apptSavedMsg, setApptSavedMsg] = useState(false);

  const handleSaveAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptTitle.trim() || !apptDate) return;
    addSupporterCalendarEvent({
      title: apptTitle.trim(),
      date: apptDate,
      startTime: apptTime || '10:30',
      category: 'appointment',
      notes: apptNotes.trim() || undefined,
      reminder: true,
      completed: false,
    });
    setApptTitle('');
    setApptNotes('');
    setApptSavedMsg(true);
    setTimeout(() => setApptSavedMsg(false), 2400);
  };

  const MOOD_OPTIONS: { key: SupporterMood; label: string; icon: any; color: string }[] = [
    { key: 'steady', label: 'Steady', icon: Sun, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { key: 'encouraged', label: 'Encouraged', icon: Smile, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { key: 'patient', label: 'Patient', icon: Heart, color: 'text-teal-700 bg-teal-50 border-teal-200' },
    { key: 'overwhelmed', label: 'Overwhelmed', icon: Meh, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
    { key: 'concerned', label: 'Heavy / Concerned', icon: Frown, color: 'text-rose-700 bg-rose-50 border-rose-200' },
  ];

  const handleAddTag = () => {
    if (formTag.trim() && !tagsList.includes(formTag.trim().toLowerCase())) {
      setTagsList([...tagsList, formTag.trim().toLowerCase()]);
      setFormTag('');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formQuickNote.trim() && reflectionType === 'quick') return;

    addSupporterReflection({
      date: formDate,
      type: reflectionType,
      mood: formMood,
      quickNote: formQuickNote.trim() || undefined,
      tags: tagsList,
      detailedAnswers:
        reflectionType === 'detailed'
          ? {
              learnedToday: learnedToday.trim() || undefined,
              wentWell: wentWell.trim() || undefined,
              difficulties: difficulties.trim() || undefined,
              supportProvided: supportProvided.trim() || undefined,
              understandBetter: understandBetter.trim() || undefined,
              focusNext: focusNext.trim() || undefined,
            }
          : undefined,
    });

    // Reset
    setFormQuickNote('');
    setLearnedToday('');
    setWentWell('');
    setDifficulties('');
    setSupportProvided('');
    setUnderstandBetter('');
    setFocusNext('');
    setTagsList([]);
    setActiveTab('timeline');
  };

  const filteredReflections = supporterReflections
    .filter(r => (filterMood === 'all' ? true : r.mood === filterMood))
    .filter(r => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.quickNote?.toLowerCase().includes(q) ||
        r.detailedAnswers?.learnedToday?.toLowerCase().includes(q) ||
        r.detailedAnswers?.wentWell?.toLowerCase().includes(q) ||
        r.tags?.some(t => t.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-amber-200/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4 text-amber-700" />
            <span>Private Processing &amp; Appointments</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Supporter Notes &amp; Date Appointments</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Save private observations, questions for counselors, and scheduled clinic or check-in appointment dates safely in one dedicated place.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSampleModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-900 border border-amber-300 bg-amber-50/60 hover:bg-amber-100 flex items-center gap-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Sample Format</span>
          </button>
          <button
            onClick={() => setActiveTab(activeTab === 'timeline' ? 'create' : 'timeline')}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-transform active:scale-95"
          >
            {activeTab === 'timeline' ? (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Write Reflection</span>
              </>
            ) : (
              <span>Back to Journal</span>
            )}
          </button>
        </div>
      </div>

      {/* DEDICATED SUPPORTER APPOINTMENT DATE SAVER */}
      <section className="bg-white border border-amber-200 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Saved Date Appointments</h2>
              <p className="text-xs text-slate-500">
                Save clinic visits, counselor phone calls, and family check-in dates (synced with Supporter Calendar).
              </p>
            </div>
          </div>
          {apptSavedMsg && (
            <span className="text-xs font-bold text-amber-900 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
              Appointment Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveAppointment} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Appointment Title</label>
            <input
              type="text"
              value={apptTitle}
              onChange={e => setApptTitle(e.target.value)}
              placeholder="e.g. Family counseling at General Hospital"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Date</label>
            <input
              type="date"
              value={apptDate}
              onChange={e => setApptDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Time</label>
            <input
              type="time"
              value={apptTime}
              onChange={e => setApptTime(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
            />
          </div>
          <div className="sm:col-span-3 flex gap-2">
            <button
              type="submit"
              disabled={!apptTitle.trim() || !apptDate}
              className="w-full px-4 py-2 bg-[#9A3412] hover:bg-[#7C2D12] disabled:opacity-45 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Save Appointment
            </button>
          </div>
          <div className="sm:col-span-12">
            <input
              type="text"
              value={apptNotes}
              onChange={e => setApptNotes(e.target.value)}
              placeholder="Optional clinic phone, room number, or things to bring..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600"
            />
          </div>
        </form>

        {supporterEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {supporterEvents
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date))
              .map(ev => (
                <div
                  key={ev.id}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                >
                  <button
                    type="button"
                    onClick={() => toggleSupporterCalendarEvent(ev.id)}
                    className="flex items-start gap-2.5 text-left min-w-0 cursor-pointer"
                  >
                    <span
                      className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                        ev.completed
                          ? 'bg-[#9A3412] border-[#9A3412] text-white'
                          : 'bg-white border-slate-300 text-transparent'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                    </span>
                    <div className="min-w-0">
                      <div className={`text-xs font-bold truncate ${ev.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {ev.title}
                      </div>
                      <div className="text-[11px] font-mono-tabular text-slate-500">
                        {ev.date} {ev.startTime ? `· ${ev.startTime}` : ''}
                      </div>
                      {ev.notes && <p className="text-[11px] text-slate-600 mt-0.5 truncate">{ev.notes}</p>}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteSupporterCalendarEvent(ev.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer shrink-0"
                    aria-label="Delete appointment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No appointment dates saved yet. Add a consultation or check-in above.</p>
        )}
      </section>

      {/* CREATE FORM */}
      {activeTab === 'create' && (
        <form
          onSubmit={handleSave}
          className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">New Supporter Entry</h2>
              <p className="text-xs text-slate-500">Record observations and process your feelings</p>
            </div>

            {/* Quick vs Detailed Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setReflectionType('quick')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  reflectionType === 'quick' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Quick Check-in
              </button>
              <button
                type="button"
                onClick={() => setReflectionType('detailed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  reflectionType === 'detailed' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Detailed Reflection
              </button>
            </div>
          </div>

          {/* Date & Mood */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Date</label>
              <input
                type="date"
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600"
              />
            </div>
          </div>

          {/* Mood Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              How did you feel emotionally as a supporter today?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {MOOD_OPTIONS.map(m => {
                const Icon = m.icon;
                const isSelected = formMood === m.key;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setFormMood(m.key)}
                    className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? 'bg-amber-100/70 border-amber-600 ring-2 ring-amber-500/20 text-amber-950 font-bold'
                        : 'bg-slate-50/60 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-700' : 'text-slate-500'}`} />
                    <span className="text-xs">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Note */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Daily Summary Note
            </label>
            <textarea
              rows={3}
              value={formQuickNote}
              onChange={e => setFormQuickNote(e.target.value)}
              placeholder="e.g. Had a calm conversation today. I kept my voice low and resisted giving unsolicited advice..."
              className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600 text-slate-800"
            />
          </div>

          {/* Detailed Prompts if selected */}
          {reflectionType === 'detailed' && (
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  What did I learn about supporting them today?
                </label>
                <textarea
                  rows={2}
                  value={learnedToday}
                  onChange={e => setLearnedToday(e.target.value)}
                  placeholder="e.g. When I rush them, they withdraw. Consistency is more important than urgency..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  What went well?
                </label>
                <textarea
                  rows={2}
                  value={wentWell}
                  onChange={e => setWentWell(e.target.value)}
                  placeholder="e.g. Shared a meal without conflict..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  What was difficult or brought up anxiety?
                </label>
                <textarea
                  rows={2}
                  value={difficulties}
                  onChange={e => setDifficulties(e.target.value)}
                  placeholder="e.g. Felt anxious when they received a phone call from an old acquaintance..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  What boundary did I protect for my own wellbeing?
                </label>
                <textarea
                  rows={2}
                  value={understandBetter}
                  onChange={e => setUnderstandBetter(e.target.value)}
                  placeholder="e.g. Took my 20-minute evening walk and did not stay up worrying..."
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              Save Reflection Entry
            </button>
          </div>
        </form>
      )}

      {/* TIMELINE VIEW */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search your journal entries..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600"
              />
            </div>

            <select
              value={filterMood}
              onChange={e => setFilterMood(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-amber-600 text-slate-700"
            >
              <option value="all">All Moods</option>
              {MOOD_OPTIONS.map(m => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {filteredReflections.length > 0 ? (
            <div className="space-y-4">
              {filteredReflections.map(ref => (
                <div
                  key={ref.id}
                  className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{ref.date}</span>
                      {ref.mood && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-semibold capitalize">
                          {ref.mood}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => deleteSupporterReflection(ref.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {ref.quickNote && (
                    <p className="text-sm text-slate-800 leading-relaxed font-medium">
                      "{ref.quickNote}"
                    </p>
                  )}

                  {ref.detailedAnswers && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs bg-slate-50/70 p-3.5 rounded-2xl border border-slate-100">
                      {ref.detailedAnswers.learnedToday && (
                        <div>
                          <strong className="text-slate-700">Learned: </strong>
                          <span className="text-slate-600">{ref.detailedAnswers.learnedToday}</span>
                        </div>
                      )}
                      {ref.detailedAnswers.wentWell && (
                        <div>
                          <strong className="text-slate-700">Went Well: </strong>
                          <span className="text-slate-600">{ref.detailedAnswers.wentWell}</span>
                        </div>
                      )}
                      {ref.detailedAnswers.difficulties && (
                        <div>
                          <strong className="text-slate-700">Difficulty: </strong>
                          <span className="text-slate-600">{ref.detailedAnswers.difficulties}</span>
                        </div>
                      )}
                      {ref.detailedAnswers.focusNext && (
                        <div>
                          <strong className="text-slate-700">Next Focus: </strong>
                          <span className="text-slate-600">{ref.detailedAnswers.focusNext}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-xs space-y-3">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No reflections logged yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Recording your reflections helps you process complex emotions and track small positive milestones.
              </p>
              <button
                onClick={() => setActiveTab('create')}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold"
              >
                Write Your First Reflection
              </button>
            </div>
          )}
        </div>
      )}

      {/* SAMPLE FORMAT PREVIEW MODAL */}
      {showSampleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900">
                  Read-Only Example
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">Sample Supporter Journal Entry</h3>
              </div>
              <button
                onClick={() => setShowSampleModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span>Yesterday · Mood: Steady</span>
                <span>Category: Listening</span>
              </div>
              <p className="italic">
                "{SAMPLE_SUPPORTER_PREVIEW_DATA.supporterReflections[0].quickNote}"
              </p>
            </div>

            <p className="text-[11px] text-slate-500">
              This sample is for display purposes only. None of it is saved to your private journal.
            </p>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowSampleModal(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
