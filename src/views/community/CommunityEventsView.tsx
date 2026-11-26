import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Filter,
  FileText,
  Layers,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { CommunityEvent } from '../../types';
import { filterCommunityEvents } from '../../utils/logic';

interface CommunityEventsViewProps {
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
}

export const CommunityEventsView: React.FC<CommunityEventsViewProps> = ({
  isCreateOpen = false,
  onCloseCreate,
}) => {
  const {
    communityEvents,
    communityProgrammes,
    addCommunityEvent,
    updateCommunityEvent,
    deleteCommunityEvent,
    communityOrg,
    language,
  } = useApp();

  const [filterDate, setFilterDate] = useState('');
  const [programmeFilter, setProgrammeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [showModal, setShowModal] = useState(isCreateOpen);
  const [selectedEvent, setSelectedEvent] = useState<CommunityEvent | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [category, setCategory] = useState('Classroom Workshop');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:30');
  const [venue, setVenue] = useState(communityOrg?.name || '');
  const [description, setDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('High school students');
  const [expectedAttendance, setExpectedAttendance] = useState(50);
  const [actualAttendance, setActualAttendance] = useState(0);
  const [status, setStatus] = useState<CommunityEvent['status']>('scheduled');
  const [materialsNeeded, setMaterialsNeeded] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');

  const filtered = filterCommunityEvents(
    communityEvents,
    filterDate || undefined,
    programmeFilter,
    statusFilter
  );

  const openNewModal = () => {
    setSelectedEvent(null);
    setTitle('');
    setProgrammeId(communityProgrammes[0]?.id || 'independent');
    setCategory('Classroom Workshop');
    setDate(new Date().toISOString().split('T')[0]);
    setStartTime('10:00');
    setEndTime('11:30');
    setVenue(communityOrg?.name || 'School Hall');
    setDescription('');
    setTargetAudience('Students');
    setExpectedAttendance(60);
    setActualAttendance(0);
    setStatus('scheduled');
    setMaterialsNeeded('Projector, handouts, feedback slips');
    setCompletionNotes('');
    setShowModal(true);
  };

  const openEditModal = (ev: CommunityEvent) => {
    setSelectedEvent(ev);
    setTitle(ev.title);
    setProgrammeId(ev.programmeId);
    setCategory(ev.category);
    setDate(ev.date);
    setStartTime(ev.startTime);
    setEndTime(ev.endTime);
    setVenue(ev.venue);
    setDescription(ev.description);
    setTargetAudience(ev.targetAudience);
    setExpectedAttendance(ev.expectedAttendance);
    setActualAttendance(ev.actualAttendance);
    setStatus(ev.status);
    setMaterialsNeeded(ev.materialsNeeded || '');
    setCompletionNotes(ev.completionNotes || '');
    setShowModal(true);
  };

  const closeFormModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
    if (onCloseCreate) onCloseCreate();
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (selectedEvent) {
      updateCommunityEvent(selectedEvent.id, {
        title,
        programmeId: programmeId || 'independent',
        category,
        date,
        startTime,
        endTime,
        venue,
        description,
        targetAudience,
        expectedAttendance: Number(expectedAttendance) || 0,
        actualAttendance: Number(actualAttendance) || 0,
        status,
        materialsNeeded,
        completionNotes,
      });
    } else {
      addCommunityEvent({
        title,
        programmeId: programmeId || 'independent',
        category,
        date,
        startTime,
        endTime,
        venue,
        coordinatorId: 'lead',
        description,
        targetAudience,
        expectedAttendance: Number(expectedAttendance) || 0,
        status,
        materialsNeeded,
        completionNotes,
      });
    }

    closeFormModal();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>{language === 'ml' ? 'പ്രവർത്തന കലണ്ടർ' : 'Event Operations'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {language === 'ml' ? 'പ്രവർത്തനങ്ങളും മീറ്റിംഗുകളും' : 'Activities & Event Calendar'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {language === 'ml'
              ? 'ക്ലാസ്സ് വർക്ക്‌ഷോപ്പുകൾ, അധ്യാപക പരിശീലനങ്ങൾ, അവബോധ സെഷനുകൾ എന്നിവ ഷെഡ്യൂൾ ചെയ്യുകയും ഹാജർ രേഖപ്പെടുത്തുകയും ചെയ്യുക.'
              : 'Schedule, coordinate, and log attendance for classroom modules, teacher orientations, and parent circles.'}
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-teal-800 hover:bg-teal-900 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ml' ? 'പരിപാടി ഷെഡ്യൂൾ ചെയ്യുക' : 'Schedule Activity'}</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
          <Filter className="w-3.5 h-3.5 text-teal-700" />
          <span>Filters:</span>
        </div>

        {/* Date Filter */}
        <input
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-teal-700"
        />
        {filterDate && (
          <button
            onClick={() => setFilterDate('')}
            className="text-[11px] text-teal-800 font-semibold hover:underline"
          >
            Clear Date
          </button>
        )}

        {/* Programme Filter */}
        <select
          value={programmeFilter}
          onChange={e => setProgrammeFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-teal-700"
        >
          <option value="all">All Programmes</option>
          {communityProgrammes.map(p => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-teal-700"
        >
          <option value="all">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <span className="text-xs text-slate-400 font-mono ml-auto">
          {filtered.length} {filtered.length === 1 ? 'event' : 'events'}
        </span>
      </div>

      {/* Events List */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map(ev => {
            const parentProg = communityProgrammes.find(p => p.id === ev.programmeId);
            return (
              <div
                key={ev.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{ev.title}</span>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                      {ev.category}
                    </span>
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        ev.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ev.status === 'cancelled'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ev.status}
                    </span>
                  </div>

                  {parentProg && (
                    <div className="text-[11px] text-teal-800 font-medium flex items-center gap-1">
                      <Layers className="w-3 h-3 text-teal-600" />
                      <span>Part of: {parentProg.title}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium pt-1">
                    <span className="flex items-center gap-1 font-mono text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-teal-700" />
                      {ev.date}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {ev.startTime} - {ev.endTime}
                    </span>
                    <span className="flex items-center gap-1 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {ev.venue}
                    </span>
                    <span className="flex items-center gap-1 text-slate-700">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {ev.targetAudience}
                    </span>
                  </div>

                  {ev.completionNotes && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2">
                      <strong className="text-slate-800 block text-[11px] mb-0.5">Session Debrief:</strong>
                      {ev.completionNotes}
                    </div>
                  )}
                </div>

                {/* Right: Attendance Record & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0">
                  <div className="text-right">
                    <div className="text-xs font-semibold text-slate-500">Attendance</div>
                    <div className="text-base font-bold text-slate-900 font-mono">
                      {ev.actualAttendance > 0 ? (
                        <span className="text-emerald-700">{ev.actualAttendance} verified</span>
                      ) : (
                        <span className="text-slate-400">~{ev.expectedAttendance} exp</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(ev)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                      title="Edit Event or Log Attendance"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCommunityEvent(ev.id)}
                      className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Delete Event"
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
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">
            {language === 'ml' ? 'പരിപാടികളൊന്നും കണ്ടെത്തിയില്ല' : 'No activities found'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            {language === 'ml'
              ? 'നിങ്ങളുടെ ആദ്യത്തെ സ്കൂൾ വർക്ക്‌ഷോപ്പ്, പിയർ മീറ്റിംഗ് അല്ലെങ്കിൽ അധ്യാപക സെഷൻ ഷെഡ്യൂൾ ചെയ്യുക.'
              : 'Add an event to coordinate materials, track participant attendance, and record practical debrief notes.'}
          </p>
          <button
            onClick={openNewModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ml' ? 'പരിപാടി ഷെഡ്യൂൾ ചെയ്യുക' : 'Schedule Event'}</span>
          </button>
        </div>
      )}

      {/* Modal: Create or Edit Event */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedEvent ? 'Update Activity & Attendance' : 'Schedule Community Activity'}
                  </h2>
                </div>
              </div>
              <button
                onClick={closeFormModal}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4 pt-3">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Activity Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Grade 10 Refusal Assertiveness Workshop"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                />
              </div>

              {/* Connected Programme & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Connected Programme
                  </label>
                  <select
                    value={programmeId}
                    onChange={e => setProgrammeId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700 bg-white"
                  >
                    <option value="independent">Independent Event</option>
                    {communityProgrammes.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700 bg-white"
                  >
                    <option value="Classroom Workshop">Classroom Workshop</option>
                    <option value="Teacher Training">Teacher Training</option>
                    <option value="Parent Circle">Parent Dialogue Circle</option>
                    <option value="Peer Ambassador Camp">Peer Ambassador Camp</option>
                    <option value="Campus Exhibition">Campus Awareness Exhibition</option>
                    <option value="Community Meeting">Community / Residential Meeting</option>
                  </select>
                </div>
              </div>

              {/* Date, Time & Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                  />
                </div>
              </div>

              {/* Venue & Target Audience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Venue / Location *
                  </label>
                  <input
                    type="text"
                    required
                    value={venue}
                    onChange={e => setVenue(e.target.value)}
                    placeholder="e.g. School Seminar Hall, Room 204"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={e => setTargetAudience(e.target.value)}
                    placeholder="e.g. Grade 10 students"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                  />
                </div>
              </div>

              {/* Attendance Tracking: Expected vs Actual */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-teal-50/50 border border-teal-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Expected Attendance
                  </label>
                  <input
                    type="number"
                    value={expectedAttendance}
                    onChange={e => setExpectedAttendance(Number(e.target.value))}
                    className="w-full px-3.5 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700 font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Actual Attendance
                  </label>
                  <input
                    type="number"
                    value={actualAttendance}
                    onChange={e => setActualAttendance(Number(e.target.value))}
                    placeholder="Record after session"
                    className="w-full px-3.5 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700 font-mono bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700 bg-white"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Materials Needed & Completion Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Materials & Resources Needed
                </label>
                <input
                  type="text"
                  value={materialsNeeded}
                  onChange={e => setMaterialsNeeded(e.target.value)}
                  placeholder="e.g. Projector, print refusal guides, anonymous survey slips"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Session Completion Notes / Feedback
                </label>
                <textarea
                  rows={2}
                  value={completionNotes}
                  onChange={e => setCompletionNotes(e.target.value)}
                  placeholder="e.g. Students engaged well with the myth-busting cards. 3 students requested follow-up counsellor meetings."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                />
              </div>

              {/* Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeFormModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-800 hover:bg-teal-900 text-white shadow-xs transition-colors"
                >
                  {selectedEvent ? 'Save Changes' : 'Schedule Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
