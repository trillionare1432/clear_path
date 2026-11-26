import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  OPPORTUNITY_SECTOR_LABELS,
  PERSONAL_DEV_TRACKS,
  VERIFIED_OPPORTUNITY_CATALOG,
} from '../constants/opportunityCatalog';
import { matchOpportunitiesAndSkillGaps } from '../utils/recoveryIntelligence';
import {
  OpportunityApplication,
  OpportunityProfile,
  OpportunitySector,
  RecoveryPassportItem,
  RecoveryPassportSectionKey,
} from '../types';
import {
  Briefcase,
  Search,
  Bookmark,
  ExternalLink,
  CheckCircle2,
  Shield,
  CalendarPlus,
  Plus,
  Trash2,
  Compass,
  Award,
  FileCheck2,
  Sparkles,
} from 'lucide-react';

type OpportunitiesSubTab = 'opportunities' | 'pathways' | 'applications' | 'passport';

const PASSPORT_SECTIONS: Array<{ key: RecoveryPassportSectionKey; label: string }> = [
  { key: 'acquiredSkills', label: 'Acquired Skills' },
  { key: 'completedTraining', label: 'Completed Training & Courses' },
  { key: 'qualifications', label: 'Educational Qualifications' },
  { key: 'achievements', label: 'Achievements & Milestones' },
  { key: 'workExperience', label: 'Work & Volunteering Experience' },
  { key: 'personalGoals', label: 'Career & Life Goals' },
  { key: 'certifications', label: 'Certifications' },
];

export const OpportunitiesView: React.FC = () => {
  const {
    personalOnboarding,
    opportunityProfile,
    saveOpportunityProfile,
    savedOpportunities,
    toggleOpportunitySave,
    opportunityApplications,
    addOpportunityApplication,
    updateOpportunityApplication,
    deleteOpportunityApplication,
    syncInterviewToCalendar,
    recoveryPassport,
    saveRecoveryPassport,
    personalDevProgress,
    togglePersonalDevStep,
  } = useApp();

  const [subTab, setSubTab] = useState<OpportunitiesSubTab>('opportunities');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Opportunity Profile / Resume Editor state
  const [eduInput, setEduInput] = useState(
    opportunityProfile?.educationLevel || personalOnboarding?.educationLevel || '+2 / Higher Secondary'
  );
  const [districtInput, setDistrictInput] = useState(opportunityProfile?.district || 'Ernakulam');
  const [workPrefInput, setWorkPrefInput] = useState<OpportunityProfile['workPreference']>(
    opportunityProfile?.workPreference || 'training_first'
  );
  const [skillsInput, setSkillsInput] = useState(
    (opportunityProfile?.currentSkills || personalOnboarding?.existingSkills || []).join(', ')
  );
  const [prefSectors, setPrefSectors] = useState<OpportunitySector[]>(
    opportunityProfile?.preferredSectors || ['tech_digital', 'skilled_trades']
  );
  const [resumeHeadline, setResumeHeadline] = useState(
    opportunityProfile?.resumeHeadline || 'Motivated Learner & Practical Contributor'
  );
  const [careerObjective, setCareerObjective] = useState(
    opportunityProfile?.careerObjective ||
      'Seeking certified skill training, apprenticeship, or steady entry-level growth in Kerala.'
  );
  const [resumeSummary, setResumeSummary] = useState(opportunityProfile?.resumeSummary || '');
  const [resumeExpText, setResumeExpText] = useState(
    (opportunityProfile?.resumeExperience || []).join('\n')
  );
  const [profileSavedToast, setProfileSavedToast] = useState(false);

  // Application Tracker form
  const [appTitle, setAppTitle] = useState('');
  const [appOrg, setAppOrg] = useState('');
  const [appSector, setAppSector] = useState<OpportunitySector>('tech_digital');
  const [appDeadline, setAppDeadline] = useState('');
  const [appInterviewDate, setAppInterviewDate] = useState('');
  const [appInterviewTime, setAppInterviewTime] = useState('10:30');
  const [calendarSyncToast, setCalendarSyncToast] = useState<string | null>(null);

  // Passport Add Item & Export Preview
  const [passportSection, setPassportSection] = useState<RecoveryPassportSectionKey>('acquiredSkills');
  const [passportTitle, setPassportTitle] = useState('');
  const [passportSubtitle, setPassportSubtitle] = useState('');
  const [passportDate, setPassportDate] = useState('');
  const [passportExportPreview, setPassportExportPreview] = useState<{
    headline: string;
    publicBio: string;
    clinicalIsolationNotice: string;
    totalSharedItems: number;
    sections: Record<RecoveryPassportSectionKey, Array<{ title: string; subtitle?: string; dateLabel?: string }>>;
  } | null>(null);

  const handleSaveProfile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveOpportunityProfile({
      educationLevel: eduInput.trim(),
      district: districtInput.trim(),
      workPreference: workPrefInput,
      currentSkills: skillsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      preferredSectors: prefSectors,
      careerObjective: careerObjective.trim(),
      resumeHeadline: resumeHeadline.trim(),
      resumeSummary: resumeSummary.trim(),
      resumeExperience: resumeExpText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
      updatedAt: new Date().toISOString(),
    });
    setProfileSavedToast(true);
    setTimeout(() => setProfileSavedToast(false), 2000);
  };

  const toggleSectorPref = (sec: OpportunitySector) => {
    setPrefSectors(prev => (prev.includes(sec) ? prev.filter(s => s !== sec) : [...prev, sec]));
  };

  const matchedOpportunities = useMemo(
    () => matchOpportunitiesAndSkillGaps(opportunityProfile, VERIFIED_OPPORTUNITY_CATALOG, sectorFilter, searchQuery),
    [opportunityProfile, sectorFilter, searchQuery]
  );

  const recommendedTracks = new Set(personalOnboarding?.personalizedPathway?.recommendedDevTrackIds || []);

  const handleAddApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appTitle.trim()) return;
    const created = addOpportunityApplication({
      title: appTitle.trim(),
      organization: appOrg.trim() || 'Kerala / Govt Portal',
      sector: appSector,
      status: appInterviewDate ? 'interview_scheduled' : 'applied',
      appliedDate: new Date().toISOString().split('T')[0],
      deadlineDate: appDeadline || undefined,
      interviewDate: appInterviewDate || undefined,
      interviewTime: appInterviewTime || undefined,
    });
    if (appInterviewDate) {
      syncInterviewToCalendar(created.id, appInterviewDate, appInterviewTime, `Interview: ${created.title}`);
      setCalendarSyncToast(`Synced interview for "${created.title}" to your Calendar.`);
      setTimeout(() => setCalendarSyncToast(null), 2500);
    }
    setAppTitle('');
    setAppOrg('');
    setAppDeadline('');
    setAppInterviewDate('');
  };

  const handleSyncDeadlineOrInterview = (app: OpportunityApplication) => {
    const targetDate = app.interviewDate || app.deadlineDate || new Date().toISOString().split('T')[0];
    syncInterviewToCalendar(
      app.id,
      targetDate,
      app.interviewTime || '10:00',
      `${app.interviewDate ? 'Interview' : 'Deadline'}: ${app.title}`
    );
    setCalendarSyncToast(`Added "${app.title}" (${targetDate}) to your Personal Calendar.`);
    setTimeout(() => setCalendarSyncToast(null), 2500);
  };

  const handleAddPassportItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passportTitle.trim()) return;
    const nextItem: RecoveryPassportItem = {
      id: `rp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      section: passportSection,
      title: passportTitle.trim(),
      subtitle: passportSubtitle.trim() || undefined,
      dateLabel: passportDate.trim() || undefined,
      shareWithProviders: true,
    };
    saveRecoveryPassport({
      ...recoveryPassport,
      items: [nextItem, ...recoveryPassport.items],
      updatedAt: new Date().toISOString(),
    });
    setPassportTitle('');
    setPassportSubtitle('');
    setPassportDate('');
  };

  const handlePreviewPassportShare = async () => {
    try {
      const res = await fetch('/api/personal/passport/share-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passport: recoveryPassport }),
      });
      if (res.ok) {
        const data = await res.json();
        setPassportExportPreview(data);
      }
    } catch {
      // ignore offline
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-800 uppercase tracking-wider mb-1">
            <Briefcase className="w-4 h-4" />
            <span>Opportunities, Skills &amp; Non-Clinical Portfolio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Opportunities &amp; Skills</h1>
          <p className="text-sm text-slate-600 mt-1">
            Explore verified Kerala &amp; India skill portals, 8 life-rebuilding tracks, resume applications, and your private Recovery Passport.
          </p>
        </div>

        <div className="flex flex-wrap p-1 bg-slate-100 rounded-xl gap-1">
          {(
            [
              { id: 'opportunities', label: 'Verified Portals' },
              { id: 'pathways', label: '8 Dev Pathways' },
              { id: 'applications', label: 'Resume & Tracker' },
              { id: 'passport', label: 'Recovery Passport' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                subTab === tab.id ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================
          SUB-TAB 1: MULTI-SECTOR VERIFIED OPPORTUNITIES & SKILL GAPS
      ======================================================== */}
      {subTab === 'opportunities' && (
        <div className="space-y-6">
          {/* Opportunity Profile Quick Match Card */}
          <form
            onSubmit={handleSaveProfile}
            className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900">Your Skill &amp; Sector Profile</h2>
                <p className="text-xs text-slate-500">
                  Matches verified pathways and highlights concrete next skills without exposing health history.
                </p>
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-bold cursor-pointer"
              >
                {profileSavedToast ? 'Profile Saved' : 'Update Match Profile'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Education</label>
                <input
                  type="text"
                  value={eduInput}
                  onChange={e => setEduInput(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">District</label>
                <input
                  type="text"
                  value={districtInput}
                  onChange={e => setDistrictInput(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Pathway Style</label>
                <select
                  value={workPrefInput}
                  onChange={e => setWorkPrefInput(e.target.value as OpportunityProfile['workPreference'])}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="training_first">Skill Training First</option>
                  <option value="apprenticeship">Paid Apprenticeship (NAPS)</option>
                  <option value="full_time">Full-Time Work</option>
                  <option value="part_time">Part-Time / Flexible</option>
                  <option value="self_employed">Micro-Enterprise / Self-Employed</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Current Skills (comma-separated)</label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={e => setSkillsInput(e.target.value)}
                  placeholder="e.g., Excel, Driving, English"
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Preferred Sectors (Select across all 10 domains)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(OPPORTUNITY_SECTOR_LABELS) as OpportunitySector[]).map(sec => {
                  const selected = prefSectors.includes(sec);
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => toggleSectorPref(sec)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                        selected
                          ? 'bg-indigo-950 border-indigo-950 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {OPPORTUNITY_SECTOR_LABELS[sec].label}
                    </button>
                  );
                })}
              </div>
            </div>
          </form>

          {/* Search & 10-Sector Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search portals, courses, apprenticeships, or trades (ASAP, NAPS, Kudumbashree, SWAYAM)..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm"
                />
              </div>
              <select
                value={sectorFilter}
                onChange={e => setSectorFilter(e.target.value)}
                aria-label="Filter opportunities by sector"
                className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800"
              >
                <option value="all">All 10 Sectors ({VERIFIED_OPPORTUNITY_CATALOG.length})</option>
                {(Object.keys(OPPORTUNITY_SECTOR_LABELS) as OpportunitySector[]).map(sec => (
                  <option key={sec} value={sec}>
                    {OPPORTUNITY_SECTOR_LABELS[sec].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Verified Catalog Matches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matchedOpportunities.map(({ item, reasons, skillGaps, stepPathway }) => {
              const isSaved = savedOpportunities.some(s => s.opportunityId === item.id);
              return (
                <article
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-[10px] font-bold uppercase text-indigo-900 mb-1">
                          {item.type.replace('_', ' ')} · Verified {item.lastVerified}
                        </span>
                        <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                        <p className="text-xs font-medium text-slate-500">{item.provider}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleOpportunitySave(item.id)}
                        className={`p-2 rounded-xl border cursor-pointer shrink-0 ${
                          isSaved
                            ? 'bg-amber-50 border-amber-300 text-amber-800'
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-900'
                        }`}
                        title={isSaved ? 'Saved' : 'Save opportunity'}
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">{item.keralaSupportNote}</p>

                    <div className="text-[11px] text-slate-600 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <strong>Match note:</strong> {reasons.join(' · ')}
                      </div>
                      {skillGaps.length > 0 && (
                        <div>
                          <strong>Skills to build:</strong> {skillGaps.join(', ')}
                        </div>
                      )}
                      <div>
                        <strong>First step:</strong> {stepPathway[0]}
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 italic">{item.disclaimer}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <span>Official Portal</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        addOpportunityApplication({
                          opportunityId: item.id,
                          title: item.title,
                          organization: item.provider,
                          sector: item.sectors[0] || 'tech_digital',
                          status: 'saved',
                        });
                        setSubTab('applications');
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold cursor-pointer"
                    >
                      + Track in Applications
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 2: 8 PERSONAL DEVELOPMENT ENGINE TRACKS
      ======================================================== */}
      {subTab === 'pathways' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PERSONAL_DEV_TRACKS.map(track => {
            const doneIds = personalDevProgress[track.id]?.completedStepIds || [];
            const isRecommended = recommendedTracks.has(track.id);
            return (
              <section
                key={track.id}
                className={`bg-white border rounded-3xl p-5 shadow-xs space-y-3 ${
                  isRecommended ? 'border-indigo-300' : 'border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {isRecommended && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-900 mb-1">
                        <Sparkles className="w-3 h-3" />
                        Suggested by your onboarding
                      </span>
                    )}
                    <h3 className="text-base font-bold text-slate-900">{track.title}</h3>
                    <p className="text-xs text-slate-600 mt-0.5">{track.summary}</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-indigo-800 shrink-0">
                    {doneIds.length}/{track.steps.length}
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  {track.steps.map(step => {
                    const checked = doneIds.includes(step.id);
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => togglePersonalDevStep(track.id, step.id)}
                        className={`w-full p-3 rounded-xl border text-left flex items-start gap-2.5 text-xs transition-colors cursor-pointer ${
                          checked
                            ? 'bg-teal-50 border-teal-200 text-teal-950'
                            : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-indigo-200'
                        }`}
                      >
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${checked ? 'text-teal-700' : 'text-slate-300'}`}
                        />
                        <div>
                          <div className={`font-semibold ${checked ? 'line-through opacity-80' : ''}`}>
                            {step.label}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{step.actionHint}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* ========================================================
          SUB-TAB 3: RESUME BUILDER & APPLICATION TRACKER + CALENDAR SYNC
      ======================================================== */}
      {subTab === 'applications' && (
        <div className="space-y-6">
          {calendarSyncToast && (
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs font-bold text-teal-950">
              {calendarSyncToast}
            </div>
          )}

          {/* Non-Clinical Resume Builder */}
          <form
            onSubmit={handleSaveProfile}
            className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-indigo-700" />
                  <span>Non-Clinical Resume &amp; Career Summary</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Purely educational, practical, and work-readiness details — clinical records never enter here.
                </p>
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-950 text-white text-xs font-bold cursor-pointer"
              >
                {profileSavedToast ? 'Resume Saved' : 'Save Resume'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Resume Headline</label>
                <input
                  type="text"
                  value={resumeHeadline}
                  onChange={e => setResumeHeadline(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Career Objective</label>
                <input
                  type="text"
                  value={careerObjective}
                  onChange={e => setCareerObjective(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Brief Bio / Strengths</label>
                <textarea
                  rows={3}
                  value={resumeSummary}
                  onChange={e => setResumeSummary(e.target.value)}
                  placeholder="Describe dependable work habits, languages spoken, or team projects..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Experience / Projects (one per line)
                </label>
                <textarea
                  rows={3}
                  value={resumeExpText}
                  onChange={e => setResumeExpText(e.target.value)}
                  placeholder="e.g., Volunteer Event Helper (2025)&#10;Completed Basic Spreadsheet Training"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>
            </div>
          </form>

          {/* Add & Track Applications */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">Application &amp; Interview Tracker</h2>

            <form onSubmit={handleAddApplication} className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
              <input
                type="text"
                required
                value={appTitle}
                onChange={e => setAppTitle(e.target.value)}
                placeholder="Course, apprenticeship, or role..."
                className="sm:col-span-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              />
              <input
                type="text"
                value={appOrg}
                onChange={e => setAppOrg(e.target.value)}
                placeholder="Organization / Portal"
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              />
              <input
                type="date"
                value={appInterviewDate}
                onChange={e => setAppInterviewDate(e.target.value)}
                title="Interview or registration date"
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-indigo-950 text-white font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            {opportunityApplications.length === 0 ? (
              <p className="text-xs text-slate-500">
                No tracked applications yet. Add a portal or interview date above to track and sync with your Calendar.
              </p>
            ) : (
              <div className="space-y-2.5">
                {opportunityApplications.map(app => (
                  <div
                    key={app.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 text-sm">{app.title}</div>
                      <div className="text-slate-500">
                        {app.organization}
                        {app.interviewDate ? ` · Interview: ${app.interviewDate}` : ''}
                        {app.deadlineDate ? ` · Deadline: ${app.deadlineDate}` : ''}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={app.status}
                        onChange={e =>
                          updateOpportunityApplication(app.id, {
                            status: e.target.value as OpportunityApplication['status'],
                          })
                        }
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800"
                      >
                        <option value="saved">Saved</option>
                        <option value="applied">Applied</option>
                        <option value="interview_scheduled">Interview Scheduled</option>
                        <option value="accepted">Accepted / Enrolled</option>
                        <option value="completed">Completed</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => handleSyncDeadlineOrInterview(app)}
                        className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                        <span>Sync to Calendar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteOpportunityApplication(app.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                        aria-label="Delete application"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          SUB-TAB 4: RECOVERY PASSPORT (STRICTLY NON-CLINICAL)
      ======================================================== */}
      {subTab === 'passport' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-start gap-3 text-xs text-indigo-950">
            <Shield className="w-5 h-5 text-indigo-800 shrink-0 mt-0.5" />
            <div>
              <strong>Strict Clinical Isolation:</strong> Your Recovery Passport stores ONLY positive non-clinical skills, qualifications, training, work experience, achievements, and career goals. Substance-use history, cravings, triggers, and therapy notes are never included or exported here.
            </div>
          </div>

          <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                <span>Manage Recovery Passport Portfolio</span>
              </h2>
              <button
                type="button"
                onClick={handlePreviewPassportShare}
                className="px-4 py-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-amber-300" />
                <span>Preview Consented Non-Clinical Export</span>
              </button>
            </div>

            {/* Section Consent Switches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
              {PASSPORT_SECTIONS.map(sec => {
                const enabled = Boolean(recoveryPassport.sectionConsent[sec.key]);
                return (
                  <label
                    key={sec.key}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer ${
                      enabled ? 'bg-teal-50/70 border-teal-200 text-teal-950' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="font-semibold">{sec.label}</span>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={e =>
                        saveRecoveryPassport({
                          ...recoveryPassport,
                          sectionConsent: {
                            ...recoveryPassport.sectionConsent,
                            [sec.key]: e.target.checked,
                          },
                          updatedAt: new Date().toISOString(),
                        })
                      }
                    />
                  </label>
                );
              })}
            </div>

            {/* Add Portfolio Item */}
            <form onSubmit={handleAddPassportItem} className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
              <select
                value={passportSection}
                onChange={e => setPassportSection(e.target.value as RecoveryPassportSectionKey)}
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
              >
                {PASSPORT_SECTIONS.map(sec => (
                  <option key={sec.key} value={sec.key}>
                    {sec.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                value={passportTitle}
                onChange={e => setPassportTitle(e.target.value)}
                placeholder="Skill, certificate, qualification, or achievement..."
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              />
              <input
                type="text"
                value={passportSubtitle}
                onChange={e => setPassportSubtitle(e.target.value)}
                placeholder="Issuer / organization (optional)"
                className="p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-indigo-950 font-extrabold cursor-pointer"
              >
                + Add to Passport
              </button>
            </form>

            {/* Passport Items */}
            {recoveryPassport.items.length === 0 ? (
              <p className="text-xs text-slate-500">
                No portfolio items added yet. Add your acquired skills, completed courses, or goals above.
              </p>
            ) : (
              <div className="space-y-2">
                {recoveryPassport.items.map(item => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-bold uppercase text-indigo-900 mr-2">
                        {PASSPORT_SECTIONS.find(s => s.key === item.section)?.label || item.section}
                      </span>
                      <span className="font-bold text-slate-900">{item.title}</span>
                      {item.subtitle && <span className="text-slate-500"> · {item.subtitle}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.shareWithProviders}
                          onChange={e =>
                            saveRecoveryPassport({
                              ...recoveryPassport,
                              items: recoveryPassport.items.map(it =>
                                it.id === item.id ? { ...it, shareWithProviders: e.target.checked } : it
                              ),
                              updatedAt: new Date().toISOString(),
                            })
                          }
                        />
                        <span>Consented</span>
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          saveRecoveryPassport({
                            ...recoveryPassport,
                            items: recoveryPassport.items.filter(it => it.id !== item.id),
                            updatedAt: new Date().toISOString(),
                          })
                        }
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Consented Non-Clinical Export Preview */}
            {passportExportPreview && (
              <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 space-y-2 text-xs">
                <div className="font-bold text-teal-950">
                  Verified Non-Clinical Share Preview ({passportExportPreview.totalSharedItems} consented items)
                </div>
                <p className="text-[11px] text-teal-900">{passportExportPreview.clinicalIsolationNotice}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {PASSPORT_SECTIONS.map(sec => {
                    const list = passportExportPreview.sections[sec.key] || [];
                    if (list.length === 0) return null;
                    return (
                      <div key={sec.key} className="bg-white rounded-xl border border-teal-100 p-2.5">
                        <div className="font-bold text-slate-800 mb-1">{sec.label}</div>
                        <ul className="list-disc list-inside text-slate-700 space-y-0.5">
                          {list.map((entry, idx) => (
                            <li key={idx}>
                              {entry.title}
                              {entry.subtitle ? ` (${entry.subtitle})` : ''}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};
