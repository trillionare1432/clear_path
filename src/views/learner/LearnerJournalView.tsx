import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LEARNER_PATHWAYS } from '../../constants/learnerData';
import { LearnerJournalEntry } from '../../types';
import {
  PenTool,
  Plus,
  Trash2,
  Lock,
  Search,
  Sparkles,
  HelpCircle,
  X,
  Eye,
  Calendar,
} from 'lucide-react';

export const LearnerJournalView: React.FC = () => {
  const { learnerJournalEntries, addLearnerJournalEntry, deleteLearnerJournalEntry } = useApp();

  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSamplePreview, setShowSamplePreview] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [pathwayId, setPathwayId] = useState(LEARNER_PATHWAYS[0].id);
  const [keyTakeaway, setKeyTakeaway] = useState('');
  const [openQuestions, setOpenQuestions] = useState('');
  const [personalApplication, setPersonalApplication] = useState('');
  const [tagInput, setTagInput] = useState('science, self_care');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !keyTakeaway.trim()) return;

    const tags = tagInput
      .split(',')
      .map(t => t.trim().toLowerCase())
      .filter(t => t.length > 0);

    addLearnerJournalEntry({
      date: new Date().toISOString().split('T')[0],
      title: title.trim(),
      pathwayId,
      keyTakeaway: keyTakeaway.trim(),
      openQuestions: openQuestions.trim() || undefined,
      personalApplication: personalApplication.trim() || undefined,
      tags,
    });

    setTitle('');
    setKeyTakeaway('');
    setOpenQuestions('');
    setPersonalApplication('');
    setIsAdding(false);
  };

  const filteredEntries = learnerJournalEntries.filter(entry => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const inTitle = entry.title.toLowerCase().includes(q);
    const inTakeaway = entry.keyTakeaway.toLowerCase().includes(q);
    const inTags = entry.tags.some(t => t.includes(q));
    const inQuestions = entry.openQuestions?.toLowerCase().includes(q);
    return inTitle || inTakeaway || inTags || inQuestions;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
              Private Workspace
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-400" />
              100% Local & Confidential
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-2">
            Learning Journal & Notes
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl">
            A private place to record your observations, personal insights, and questions you want to ask a school counselor or doctor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSamplePreview(true)}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Sample Format</span>
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Journal Note</span>
          </button>
        </div>
      </div>

      {/* New Note Form */}
      {isAdding && (
        <form onSubmit={handleSave} className="bg-white border border-indigo-200 rounded-3xl p-6 shadow-sm space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <PenTool className="w-4 h-4 text-indigo-600" />
              <span>Record a Learning Reflection</span>
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
              <label className="block text-xs font-bold text-slate-700 mb-1">Note Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Dopamine Rebound after Late Night Studying"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Topic / Pathway</label>
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
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Key Scientific Takeaway or Insight *
            </label>
            <textarea
              required
              rows={3}
              value={keyTakeaway}
              onChange={e => setKeyTakeaway(e.target.value)}
              placeholder="What did you learn today that changed how you view this topic?"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Questions for a Counselor or Mentor (Optional)
              </label>
              <textarea
                rows={2}
                value={openQuestions}
                onChange={e => setOpenQuestions(e.target.value)}
                placeholder="Questions you'd like to ask a counselor or educator..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                How will you apply this in real life? (Optional)
              </label>
              <textarea
                rows={2}
                value={personalApplication}
                onChange={e => setPersonalApplication(e.target.value)}
                placeholder="e.g. Taking a 10 min walk before opening social media..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tags (Comma-separated)</label>
            <input
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              placeholder="e.g. neurobiology, exams, refusal, friends"
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
              Save Private Note
            </button>
          </div>
        </form>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search journal notes or tags..."
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-indigo-600"
        />
      </div>

      {/* Entries List */}
      {filteredEntries.length > 0 ? (
        <div className="space-y-4">
          {filteredEntries.map(entry => {
            const pathway = LEARNER_PATHWAYS.find(p => p.id === entry.pathwayId);

            return (
              <div
                key={entry.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {entry.date}
                      </span>
                      {pathway && (
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                          Pathway 0{pathway.number}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{entry.title}</h3>
                  </div>

                  <button
                    onClick={() => deleteLearnerJournalEntry(entry.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed space-y-1.5">
                  <div className="font-bold text-slate-900 text-[11px] uppercase tracking-wide">
                    Key Takeaway:
                  </div>
                  <p>{entry.keyTakeaway}</p>
                </div>

                {entry.personalApplication && (
                  <div className="text-xs text-slate-600">
                    <strong className="text-slate-800">Life Application:</strong> {entry.personalApplication}
                  </div>
                )}

                {entry.openQuestions && (
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block text-amber-900 mb-0.5">Question to ask mentor/counselor:</strong>
                      <span>{entry.openQuestions}</span>
                    </div>
                  </div>
                )}

                {entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {entry.tags.map((tag, tIdx) => (
                      <span
                        key={tIdx}
                        className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center space-y-3">
          <PenTool className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No journal notes yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Writing down what you learn clarifies your thinking and provides concrete questions to bring up with a trusted teacher or counselor.
          </p>
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create First Note</span>
          </button>
        </div>
      )}

      {/* Illustrative Sample Modal */}
      {showSamplePreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-indigo-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                  Read-Only Example
                </span>
                <span className="text-xs text-slate-400">Illustrative Journal Note</span>
              </div>
              <button
                onClick={() => setShowSamplePreview(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This is how your notes look when you record reflections after lessons:
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-900">
                Reflection: Why Willpower Alone Fails When Exhausted
              </div>
              <p className="text-slate-700">
                "Learned that prefrontal glucose drops during exam all-nighters. Craving isn't a personality flaw, it's metabolic fatigue."
              </p>
              <div className="text-amber-800 font-medium">
                Question to counselor: How can I structure evening study hours so I don't feel overwhelming brain fog?
              </div>
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
