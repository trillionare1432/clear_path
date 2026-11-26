import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Megaphone,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Trash2,
  Edit2,
  DollarSign,
  Layers,
  Sparkles,
  X,
} from 'lucide-react';
import { CommunityCampaign } from '../../types';
import { KERALA_DISTRICTS } from '../../constants/communityData';

export const CommunityCampaignsView: React.FC = () => {
  const {
    communityCampaigns,
    addCommunityCampaign,
    updateCommunityCampaign,
    deleteCommunityCampaign,
    communityOrg,
    language,
  } = useApp();

  const [showModal, setShowModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CommunityCampaign | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [theme, setTheme] = useState('');
  const [objective, setObjective] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [district, setDistrict] = useState(communityOrg?.district || 'Ernakulam');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState(15000);
  const [status, setStatus] = useState<CommunityCampaign['status']>('active');

  const defaultMilestones = [
    { id: 'm1', title: 'PTA & Faculty Initial Alignment Briefing', targetDate: '', completed: false },
    { id: 'm2', title: 'Student Refusal Assertiveness Classroom Sessions', targetDate: '', completed: false },
    { id: 'm3', title: 'Parent Dialogue Evening Circle & Helplines Distribution', targetDate: '', completed: false },
    { id: 'm4', title: 'Feedback Collation & Student Support Desk Handover', targetDate: '', completed: false },
  ];

  const [milestones, setMilestones] = useState(defaultMilestones);

  const openNewModal = () => {
    setSelectedCampaign(null);
    setTitle('');
    setTheme('Healthy Choices, Safe Communities');
    setObjective('');
    setTargetAudience('Campus Students & Parents');
    setDistrict(communityOrg?.district || 'Ernakulam');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setBudget(15000);
    setStatus('active');
    setMilestones(defaultMilestones);
    setShowModal(true);
  };

  const openEditModal = (camp: CommunityCampaign) => {
    setSelectedCampaign(camp);
    setTitle(camp.title);
    setTheme(camp.theme);
    setObjective(camp.objective);
    setTargetAudience(camp.targetAudience);
    setDistrict(camp.district);
    setStartDate(camp.startDate);
    setEndDate(camp.endDate);
    setBudget(camp.budget);
    setStatus(camp.status);
    setMilestones(camp.milestones || defaultMilestones);
    setShowModal(true);
  };

  const handleSaveCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (selectedCampaign) {
      updateCommunityCampaign(selectedCampaign.id, {
        title,
        theme,
        objective,
        targetAudience,
        district,
        startDate,
        endDate: endDate || startDate,
        budget: Number(budget) || 0,
        status,
        milestones,
      });
    } else {
      addCommunityCampaign({
        title,
        theme,
        objective,
        targetAudience,
        district,
        startDate,
        endDate: endDate || startDate,
        status,
        budget: Number(budget) || 0,
        milestones,
      });
    }

    setShowModal(false);
  };

  const toggleMilestone = (campaignId: string, milestoneId: string) => {
    const target = communityCampaigns.find(c => c.id === campaignId);
    if (!target) return;

    const updated = target.milestones.map(m =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );

    updateCommunityCampaign(campaignId, { milestones: updated });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 uppercase tracking-wider mb-1">
            <Megaphone className="w-4 h-4" />
            <span>{language === 'ml' ? 'ക്യാമ്പയിൻ പ്ലാനിംഗ്' : 'Campaign Architecture'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {language === 'ml' ? 'ക്യാമ്പയിനുകളും അവബോധ ഡ്രൈവുകളും' : 'Campaigns & Awareness Drives'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {language === 'ml'
              ? 'ഘട്ടം ഘട്ടമായുള്ള ബോധവൽക്കരണ ഡ്രൈവുകൾ ആസൂത്രണം ചെയ്യുകയും നാഴികക്കല്ലുകൾ പിന്തുടരുകയും ചെയ്യുക.'
              : 'Multi-week prevention campaigns with milestone timelines, resource allocation, and outcome reviews.'}
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-teal-800 hover:bg-teal-900 text-white shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ml' ? 'പുതിയ ക്യാമ്പയിൻ' : 'Create Campaign'}</span>
        </button>
      </div>

      {/* Campaigns List */}
      {communityCampaigns.length > 0 ? (
        <div className="space-y-6">
          {communityCampaigns.map(camp => {
            const totalMs = camp.milestones.length;
            const completedMs = camp.milestones.filter(m => m.completed).length;
            const pct = totalMs > 0 ? Math.round((completedMs / totalMs) * 100) : 0;

            return (
              <div
                key={camp.id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg font-bold text-slate-900">
                        {camp.title}
                      </span>
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          camp.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : camp.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {camp.status}
                      </span>
                    </div>
                    {camp.theme && (
                      <p className="text-xs text-teal-800 font-medium mt-0.5">
                        Theme: {camp.theme}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <button
                      onClick={() => openEditModal(camp)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Campaign"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCommunityCampaign(camp.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600">{camp.objective}</p>

                {/* Metadata Row */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {camp.startDate} {camp.endDate ? `to ${camp.endDate}` : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {camp.district}
                  </span>
                  <span className="flex items-center gap-1">
                    Audience: <strong className="text-slate-700">{camp.targetAudience}</strong>
                  </span>
                  {camp.budget > 0 && (
                    <span className="flex items-center gap-1 font-mono">
                      <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                      Budget: ₹{camp.budget.toLocaleString()}
                    </span>
                  )}
                </div>

                {/* Milestones Progress Bar & Checklist */}
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-slate-700">Campaign Stages & Milestones:</span>
                    <span className="font-mono text-teal-800 font-bold">
                      {completedMs} of {totalMs} Stages ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-3">
                    <div
                      className="bg-teal-700 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {camp.milestones.map(ms => (
                      <button
                        key={ms.id}
                        onClick={() => toggleMilestone(camp.id, ms.id)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                          ms.completed
                            ? 'bg-teal-50/50 border-teal-200 text-teal-950 font-medium'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center shrink-0 border ${
                            ms.completed
                              ? 'bg-teal-700 border-teal-700 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {ms.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-xs">{ms.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800">No campaigns launched yet</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Design a structured 4-week school or community prevention campaign with clearly tracked milestones and budget allocations.
          </p>
          <button
            onClick={openNewModal}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Launch Campaign</span>
          </button>
        </div>
      )}

      {/* Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {selectedCampaign ? 'Edit Campaign' : 'Create Awareness Campaign'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCampaign} className="space-y-4 pt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Vimukthi Campus Drug-Free Month 2026"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Theme / Slogan
                  </label>
                  <input
                    type="text"
                    value={theme}
                    onChange={e => setTheme(e.target.value)}
                    placeholder="e.g. Choose Life, Refuse Pressure"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    District
                  </label>
                  <select
                    value={district}
                    onChange={e => setDistrict(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700 bg-white"
                  >
                    {KERALA_DISTRICTS.map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Campaign Objectives
                </label>
                <textarea
                  rows={2}
                  value={objective}
                  onChange={e => setObjective(e.target.value)}
                  placeholder="e.g. Reach all 11th and 12th standard students with myth-busting sessions and establish parent helplines."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Budget (₹)
                  </label>
                  <input
                    type="number"
                    value={budget}
                    onChange={e => setBudget(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700 font-mono"
                  />
                </div>
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
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
