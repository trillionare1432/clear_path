import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  MessageSquare,
  Plus,
  Star,
  ShieldCheck,
  TrendingUp,
  BarChart2,
  Trash2,
  Users,
  Calendar,
  X,
} from 'lucide-react';
import { CommunityFeedbackEntry } from '../../types';
import { summarizeCommunityNeeds } from '../../utils/logic';

export const CommunityFeedbackView: React.FC = () => {
  const {
    communityFeedback,
    addCommunityFeedback,
    deleteCommunityFeedback,
    communityProgrammes,
    language,
  } = useApp();

  const [showModal, setShowModal] = useState(false);

  // Form State
  const [topic, setTopic] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [participantGroup, setParticipantGroup] = useState('High School Students');
  const [usefulnessRating, setUsefulnessRating] = useState(5);
  const [clarityRating, setClarityRating] = useState(5);
  const [concernsInput, setConcernsInput] = useState('');
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([
    'Exam and academic distress',
  ]);
  const [suggestions, setSuggestions] = useState('');

  const summary = summarizeCommunityNeeds(communityFeedback);

  const predefinedConcerns = [
    'Synthetic pills & vapes near transport stands',
    'Parent-teen communication gap & stigma',
    'Exam and academic distress',
    'Peer pressure in tuition / coaching centres',
    'Lack of safe recreational / athletic spaces',
    'Fear of punitive school expulsion if speaking up',
  ];

  const togglePredefinedConcern = (c: string) => {
    if (selectedConcerns.includes(c)) {
      setSelectedConcerns(selectedConcerns.filter(item => item !== c));
    } else {
      setSelectedConcerns([...selectedConcerns, c]);
    }
  };

  const handleAddCustomConcern = () => {
    if (concernsInput.trim() && !selectedConcerns.includes(concernsInput.trim())) {
      setSelectedConcerns([...selectedConcerns, concernsInput.trim()]);
      setConcernsInput('');
    }
  };

  const handleSaveFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    addCommunityFeedback({
      topic,
      programmeId: programmeId || undefined,
      date: new Date().toISOString().split('T')[0],
      participantGroup,
      usefulnessRating: Number(usefulnessRating) || 5,
      clarityRating: Number(clarityRating) || 5,
      keyConcernsExpressed: selectedConcerns,
      unmetNeedsSuggestions: suggestions,
      anonymous: true,
    });

    setShowModal(false);
    setTopic('');
    setSuggestions('');
    setSelectedConcerns(['Exam and academic distress']);
  };

  const maxConcernCount = Math.max(1, ...summary.topConcerns.map(c => c.count));

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 uppercase tracking-wider mb-1">
            <MessageSquare className="w-4 h-4" />
            <span>{language === 'ml' ? 'കമ്മ്യൂണിറ്റി ഫീഡ്‌ബാക്ക്' : 'Community Voices'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {language === 'ml' ? 'ആവശ്യങ്ങളും ഫീഡ്‌ബാക്കും' : 'Community Needs & Anonymous Feedback'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {language === 'ml'
              ? 'വിദ്യാർത്ഥികളിൽ നിന്നും രക്ഷിതാക്കളിൽ നിന്നും വ്യക്തിവിവരങ്ങളില്ലാതെ ശേഖരിച്ച പ്രതികരണങ്ങൾ വിശകലനം ചെയ്യുക.'
              : 'Anonymous feedback collation from workshops and surveys to guide future prevention priorities without personal profiling.'}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-teal-800 hover:bg-teal-900 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ml' ? 'ഫീഡ്‌ബാക്ക് രേഖപ്പെടുത്തുക' : 'Log Feedback Survey'}</span>
        </button>
      </div>

      {/* Analytics Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Responses Collected
          </span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2 font-mono">
            {summary.totalResponses}
          </div>
          <span className="text-[11px] text-teal-800 font-medium">
            Anonymous survey slips & debriefs
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Average Session Usefulness
          </span>
          <div className="text-3xl font-extrabold text-slate-900 mt-2 font-mono flex items-center gap-2">
            <span>{summary.averageRating > 0 ? `${summary.averageRating} / 5` : 'N/A'}</span>
            {summary.averageRating > 0 && <Star className="w-5 h-5 text-amber-400 fill-amber-400" />}
          </div>
          <span className="text-[11px] text-slate-500">Participant clarity & relevance</span>
        </div>

        {/* Ethical Safeguard Notice */}
        <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/60 flex items-start gap-3 text-xs text-teal-950">
          <ShieldCheck className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">Non-Profiling Safeguard:</strong>
            ClearPath AI collects feedback strictly at an aggregate community level. No individual risk scores, drug questionnaires, or personal confessions are ever logged.
          </div>
        </div>
      </div>

      {/* Aggregated Top Concerns Chart */}
      {summary.topConcerns.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Top Expressed Community Concerns & Barriers
              </h2>
              <p className="text-xs text-slate-500">
                Frequency of themes identified across school and parent sessions
              </p>
            </div>
            <BarChart2 className="w-5 h-5 text-teal-700" />
          </div>

          <div className="space-y-3 pt-2">
            {summary.topConcerns.map((item, idx) => {
              const pct = Math.round((item.count / maxConcernCount) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.topic}</span>
                    <span className="font-mono text-teal-800 font-bold">
                      {item.count} mention{item.count === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-teal-700 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Feedback Entries List */}
      {communityFeedback.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900">
            Recorded Survey Batches & Feedback Logs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {communityFeedback.map(fb => (
              <div
                key={fb.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{fb.topic}</h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{fb.participantGroup}</span>
                        <span>• {fb.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg text-xs font-mono font-bold text-amber-800">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{fb.usefulnessRating}/5</span>
                    </div>
                  </div>

                  {/* Concerns */}
                  {fb.keyConcernsExpressed && fb.keyConcernsExpressed.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Expressed Challenges:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {fb.keyConcernsExpressed.map((c, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggestions */}
                  {fb.unmetNeedsSuggestions && (
                    <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <strong className="text-slate-800 block text-[11px] mb-0.5">
                        Suggestions & Unmet Needs:
                      </strong>
                      {fb.unmetNeedsSuggestions}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1 text-teal-800 font-medium">
                    <ShieldCheck className="w-3 h-3 text-teal-600" />
                    Anonymous Log
                  </span>
                  <button
                    onClick={() => deleteCommunityFeedback(fb.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                    title="Delete Entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200">
          <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No community feedback recorded yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Log summary findings from anonymous classroom exit tickets, PTA discussions, or teacher debriefs to pinpoint local prevention priorities.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record First Feedback</span>
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                Log Anonymous Community Feedback
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFeedback} className="space-y-4 pt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Session / Workshop Topic *
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  placeholder="e.g. Higher Secondary Campus Awareness Day"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Participant Group
                  </label>
                  <select
                    value={participantGroup}
                    onChange={e => setParticipantGroup(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700 bg-white"
                  >
                    <option value="High School Students">High School Students</option>
                    <option value="College Students">College Students</option>
                    <option value="Teachers & Faculty">Teachers & Faculty</option>
                    <option value="Parents & Guardians">Parents & Guardians</option>
                    <option value="Youth Club Members">Youth Club Members</option>
                    <option value="Community Residents">Community Residents</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Related Programme
                  </label>
                  <select
                    value={programmeId}
                    onChange={e => setProgrammeId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700 bg-white"
                  >
                    <option value="">General Community Feedback</option>
                    {communityProgrammes.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ratings */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Usefulness (1-5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={usefulnessRating}
                    onChange={e => setUsefulnessRating(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700 font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Clarity (1-5)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={clarityRating}
                    onChange={e => setClarityRating(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700 font-mono bg-white"
                  />
                </div>
              </div>

              {/* Themes selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Identified Community Concerns:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {predefinedConcerns.map(c => {
                    const isSelected = selectedConcerns.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => togglePredefinedConcern(c)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                          isSelected
                            ? 'bg-teal-800 text-white border-teal-800'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Participant Suggestions & Needs
                </label>
                <textarea
                  rows={2}
                  value={suggestions}
                  onChange={e => setSuggestions(e.target.value)}
                  placeholder="e.g. Requested confidential guidance hours after school; parents requested flyers in Malayalam."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-800 hover:bg-teal-900 text-white shadow-xs transition-colors"
                >
                  Save Feedback Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
