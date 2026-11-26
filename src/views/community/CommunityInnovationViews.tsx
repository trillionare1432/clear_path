import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { KERALA_DISTRICTS } from '../../constants/initialData';
import { CommunityOrgType, SupportCenter } from '../../types';
import { GoogleMapsSupportLocator } from '../../components/GoogleMapsSupportLocator';
import { RedHelpDot } from '../../components/RedHelpDot';
import {
  Sparkles,
  MapPin,
  AlertTriangle,
  Share2,
  Plus,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Users,
  ShieldCheck,
  Building2,
  Clock,
  Mic,
  Copy,
  Check,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { CommunityActiveTab } from '../../components/CommunityTopHeader';

interface SpeechSection {
  sectionTitle: string;
  timeMarker: string;
  talkingPoints: string;
  scriptExcerpt: string;
}

interface GeneratedToolkit {
  title: string;
  objective: string;
  speechOutline?: SpeechSection[];
  steps: string[];
  volunteerRoles: string[];
  source?: string;
}

/* ================================================================
   1. AI COMMUNITY ACTION & SPEECH GENERATOR
================================================================ */
export const CommunityActionGeneratorPanel: React.FC<{
  onNavigateTab: (tab: CommunityActiveTab) => void;
}> = ({ onNavigateTab }) => {
  const {
    communityOrg,
    communityMembers,
    addCommunityProgramme,
    publishToExchange,
    language,
  } = useApp();

  // Essential balanced inputs
  const [topic, setTopic] = useState('Youth Brain Science & Peer Pressure Refusal');
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [focusArea, setFocusArea] = useState<string>('brain_science');

  // Optional refinements (collapsible so UI never feels like a long quiz)
  const [showOptional, setShowOptional] = useState(false);
  const [tone, setTone] = useState<'inspiring' | 'calm' | 'practical'>('inspiring');
  const [institutionType, setInstitutionType] = useState<CommunityOrgType>(
    communityOrg?.type || 'school'
  );
  const [district, setDistrict] = useState<string>(communityOrg?.district || 'Ernakulam');
  const [audience, setAudience] = useState('Students & Young Adults');
  const [resources, setResources] = useState('Hall / Classroom, Volunteer team');

  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<GeneratedToolkit | null>(null);
  const [savedFlag, setSavedFlag] = useState(false);
  const [sharedFlag, setSharedFlag] = useState(false);
  const [copiedSpeech, setCopiedSpeech] = useState(false);

  const runGenerate = async (seedOverride?: number) => {
    if (!topic.trim()) return;
    setLoading(true);
    setSavedFlag(false);
    setSharedFlag(false);
    setCopiedSpeech(false);
    try {
      const res = await fetch('/api/ai/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim(),
          durationMinutes,
          focusArea,
          tone,
          institutionType,
          district,
          audience,
          resources,
          variationSeed: seedOverride ?? Date.now(),
          language,
        }),
      });
      const data: GeneratedToolkit = await res.json();
      setGenerated(data);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    await runGenerate();
  };

  const handleCopySpeech = async () => {
    if (!generated?.speechOutline?.length) return;
    const text = [
      generated.title,
      '',
      ...generated.speechOutline.map(
        sec => `[${sec.timeMarker}] ${sec.sectionTitle}\n${sec.scriptExcerpt}`
      ),
    ].join('\n\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSpeech(true);
      window.setTimeout(() => setCopiedSpeech(false), 2000);
    } catch {
      // ignore clipboard error in restricted context
    }
  };

  const handleSaveAsProgramme = () => {
    if (!generated) return;
    addCommunityProgramme({
      title: generated.title,
      category: institutionType === 'school' ? 'school_awareness' : 'youth_engagement',
      objective: generated.objective,
      targetAudience: audience,
      location: `${district} Campus / Hall`,
      district,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
      coordinatorId: communityMembers[0]?.id || 'lead',
      teamMemberIds: communityMembers.slice(0, 2).map(m => m.id),
      requiredResources: generated.volunteerRoles.join(', '),
      budget: 0,
      status: 'active',
      expectedOutcomes: generated.steps.join(' | '),
      notes: `Generated via ClearPath AI (${durationMinutes} min speech + plan)`,
    });
    setSavedFlag(true);
  };

  const handlePublishTemplate = () => {
    if (!generated) return;
    publishToExchange({
      title: generated.title,
      authorOrg: communityOrg?.name || `${district} Prevention Coordinator`,
      orgType: institutionType,
      district,
      templateSummary: generated.objective,
      targetAudience: audience,
      steps: generated.steps,
    });
    setSharedFlag(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-800 mb-1">
            <Mic className="w-4 h-4 text-amber-600" />
            <span>AI Speech &amp; Community Action Engine</span>
            <RedHelpDot role="community" tabKey="generator" compact />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Speech, Workshop &amp; Campaign Generator
          </h1>
          <p className="editorial-subtitle text-slate-600 mt-1.5 max-w-2xl">
            Enter any topic and pick your speaking time. Generate fresh, deliver-ready speeches and practical session checklists every time.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleGenerate}
        className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5"
      >
        {/* 1. Core Topic */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            1. What Topic Will You Speak About?
          </label>
          <input
            type="text"
            value={topic}
            onChange={e => setTopic(e.target.value)}
            placeholder="e.g. Exam Stress Without Vapes, Saying No to Peer Pressure, Youth Brain Health..."
            className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:border-teal-800"
            required
          />
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              'Saying No Without Losing Friends',
              'Vapes & Adolescent Dopamine',
              'Exam Stress & Healthy Coping',
              'Parent–Youth Trust & Listening',
            ].map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => setTopic(preset)}
                className={`px-2.5 py-1 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  topic === preset
                    ? 'bg-teal-900 text-white border-teal-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Speaking Duration / Timing */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            2. Speech / Session Timing
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { mins: 5, label: '5 min', sub: 'Morning assembly' },
              { mins: 15, label: '15 min', sub: 'Classroom talk' },
              { mins: 30, label: '30 min', sub: 'Interactive session' },
              { mins: 45, label: '45 min', sub: 'Full workshop' },
            ].map(slot => (
              <button
                key={slot.mins}
                type="button"
                onClick={() => setDurationMinutes(slot.mins)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  durationMinutes === slot.mins
                    ? 'bg-teal-900 text-white border-teal-900 shadow-xs'
                    : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-teal-400'
                }`}
              >
                <div className="flex items-center gap-1.5 text-sm font-extrabold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{slot.label}</span>
                </div>
                <div className={`text-xs mt-0.5 ${durationMinutes === slot.mins ? 'text-teal-100' : 'text-slate-500'}`}>
                  {slot.sub}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 3. Primary Focus */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            3. Key Angle to Focus On
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'brain_science', label: 'Brain & Dopamine Science' },
              { id: 'peer_refusal', label: 'Peer-Pressure Exit Moves' },
              { id: 'stress_coping', label: 'Stress & Healthy Outlets' },
              { id: 'family_listening', label: 'Family & Helpline 14405' },
              { id: 'custom', label: 'Keep Strictly to My Topic' },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFocusArea(f.id)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                  focusArea === f.id
                    ? 'bg-amber-100 text-amber-950 border-amber-400'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Collapsible Optional Customizations */}
        <div className="pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowOptional(v => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{showOptional ? 'Hide optional audience & tone settings' : 'Optional settings (tone, district, audience)'}</span>
          </button>

          {showOptional && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Delivery Tone
                </label>
                <select
                  value={tone}
                  onChange={e => setTone(e.target.value as 'inspiring' | 'calm' | 'practical')}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  <option value="inspiring">Warm &amp; Inspiring</option>
                  <option value="calm">Calm &amp; Reflective</option>
                  <option value="practical">Direct &amp; Action-Focused</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Institution
                </label>
                <select
                  value={institutionType}
                  onChange={e => setInstitutionType(e.target.value as CommunityOrgType)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  <option value="school">School / Plus-Two</option>
                  <option value="institution">College / University</option>
                  <option value="ngo">NGO / Youth Club</option>
                  <option value="community_group">Civic / Panchayat Group</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  District
                </label>
                <select
                  value={district}
                  onChange={e => setDistrict(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white"
                >
                  {KERALA_DISTRICTS.filter(d => d !== 'All Districts').map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Audience
                </label>
                <input
                  type="text"
                  value={audience}
                  onChange={e => setAudience(e.target.value)}
                  className="w-full p-2 rounded-xl border border-slate-200 text-xs bg-white"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="px-6 py-3 rounded-xl bg-teal-900 hover:bg-indigo-900 disabled:opacity-60 text-white text-xs sm:text-sm font-extrabold inline-flex items-center gap-2 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <Sparkles className="w-4 h-4 text-amber-400" />}
            <span>{loading ? 'Writing Timed Speech & Plan...' : `Generate ${durationMinutes}-Min Speech & Action Kit`}</span>
          </button>

          {generated && (
            <button
              type="button"
              disabled={loading}
              onClick={() => runGenerate(Date.now() + Math.floor(Math.random() * 10000))}
              className="px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 inline-flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Generate Fresh Version</span>
            </button>
          )}
        </div>
      </form>

      {generated && (
        <div className="bg-white border border-indigo-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 animate-tab-fade">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded">
                Deliver-Ready Speech &amp; Execution Kit
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-teal-950 mt-2">{generated.title}</h2>
              <p className="prose-readable text-slate-700 mt-1">{generated.objective}</p>
            </div>

            {generated.speechOutline && generated.speechOutline.length > 0 && (
              <button
                type="button"
                onClick={handleCopySpeech}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-900 inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copiedSpeech ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSpeech ? 'Copied Full Speech' : 'Copy Full Speech'}</span>
              </button>
            )}
          </div>

          {/* Timed Speech Script Beats */}
          {generated.speechOutline && generated.speechOutline.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Timed Speech Script ({durationMinutes} Minutes Total)
              </h3>
              <div className="space-y-3">
                {generated.speechOutline.map((beat, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-extrabold text-slate-900">
                        {idx + 1}. {beat.sectionTitle}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-teal-900 text-amber-300 text-xs font-bold font-mono-tabular">
                        {beat.timeMarker}
                      </span>
                    </div>
                    <p className="prose-readable-sm font-medium text-slate-600">
                      Key note: {beat.talkingPoints}
                    </p>
                    <div className="p-5 rounded-xl bg-white border border-slate-200 prose-readable text-slate-900">
                      {beat.scriptExcerpt}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Execution Steps & Volunteer Roles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 space-y-2.5">
              <h3 className="editorial-kicker text-slate-500">
                Session Execution Steps
              </h3>
              {generated.steps.map((step, i) => (
                <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 prose-readable-sm text-slate-800 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-teal-900 text-amber-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-1">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Volunteer Roles
              </h3>
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2.5">
                {generated.volunteerRoles.map((role, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm font-semibold text-teal-950">
                    <Users className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <button
              onClick={handleSaveAsProgramme}
              disabled={savedFlag}
              className="px-4 py-2.5 rounded-xl bg-teal-900 hover:bg-indigo-900 disabled:bg-indigo-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{savedFlag ? 'Saved to Programmes!' : 'Activate as Programme'}</span>
            </button>
            {savedFlag && (
              <button
                onClick={() => onNavigateTab('programmes')}
                className="text-xs font-bold text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
              >
                View Programmes <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handlePublishTemplate}
              disabled={sharedFlag}
              className="px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{sharedFlag ? 'Shared to Innovation Exchange' : 'Share to Innovation Exchange'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ================================================================
   2. PREVENTION INTELLIGENCE MAP (ANONYMISED DISTRICT COVERAGE)
================================================================ */
export const PreventionIntelligenceMapPanel: React.FC = () => {
  const { supportCenters, communityProgrammes, communityEvents } = useApp();
  const [selectedDistrict, setSelectedDistrict] = useState<string>('All Districts');
  const [selectedCenter, setSelectedCenter] = useState<SupportCenter | null>(null);

  const filteredCenters = useMemo(() => {
    if (selectedDistrict === 'All Districts') return supportCenters;
    return supportCenters.filter(c => c.district === selectedDistrict);
  }, [supportCenters, selectedDistrict]);

  const districtStats = useMemo(() => {
    const districts = KERALA_DISTRICTS.filter(d => d !== 'All Districts');
    return districts.map(d => ({
      district: d,
      centers: supportCenters.filter(c => c.district === d).length,
      programmes: communityProgrammes.filter(p => p.district === d).length,
      events: communityEvents.filter(e => e.venue.toLowerCase().includes(d.toLowerCase())).length,
    }));
  }, [supportCenters, communityProgrammes, communityEvents]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-800 mb-1">
            <MapPin className="w-4 h-4 text-amber-600" />
            <span>Anonymised Spatial Coverage</span>
            <RedHelpDot role="community" tabKey="map" compact />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Prevention Intelligence Map
          </h1>
          <p className="editorial-subtitle text-slate-600 mt-1.5 max-w-2xl">
            Explore verified Kerala treatment wards and anonymized campus campaign activity by district. Individual personal logs are never mapped.
          </p>
        </div>

        <select
          value={selectedDistrict}
          onChange={e => setSelectedDistrict(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
        >
          {KERALA_DISTRICTS.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <GoogleMapsSupportLocator
        centers={filteredCenters}
        selectedCenter={selectedCenter}
        onSelectCenter={setSelectedCenter}
        heightClassName="h-[430px]"
      />

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900">District Coverage Breakdown</h2>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />
            Zero Personal Tracking
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {districtStats.map(stat => (
            <button
              key={stat.district}
              onClick={() => setSelectedDistrict(stat.district)}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedDistrict === stat.district
                  ? 'bg-teal-900 text-white border-teal-900'
                  : 'bg-slate-50 border-slate-200/80 hover:border-indigo-300 text-slate-900'
              }`}
            >
              <div className="text-xs font-bold truncate">{stat.district}</div>
              <div className={`text-[11px] mt-1 font-mono-tabular ${selectedDistrict === stat.district ? 'text-amber-300' : 'text-slate-600'}`}>
                {stat.centers} clinic{stat.centers !== 1 ? 's' : ''}
              </div>
              <div className={`text-[10px] font-mono-tabular ${selectedDistrict === stat.district ? 'text-indigo-200' : 'text-slate-400'}`}>
                {stat.programmes} active prog.
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ================================================================
   3. PREVENTION GAP DETECTOR
================================================================ */
export const PreventionGapDetectorPanel: React.FC<{
  onNavigateTab: (tab: CommunityActiveTab) => void;
}> = ({ onNavigateTab }) => {
  const { communityProgrammes, communityFeedback, quizAttempts, supportCenters } = useApp();

  const underservedDistricts = useMemo(() => {
    const activeSet = new Set(communityProgrammes.map(p => p.district));
    return KERALA_DISTRICTS.filter(d => d !== 'All Districts' && !activeSet.has(d));
  }, [communityProgrammes]);

  const coveredDistrictCount = useMemo(() => {
    const activeSet = new Set(communityProgrammes.map(p => p.district));
    return KERALA_DISTRICTS.filter(d => d !== 'All Districts' && activeSet.has(d)).length;
  }, [communityProgrammes]);

  const lowQuizTopics = useMemo(() => {
    return quizAttempts.filter(q => q.totalQuestions > 0 && q.score / q.totalQuestions < 0.7);
  }, [quizAttempts]);

  const unmetRequests = useMemo(() => {
    return communityFeedback.filter(f => f.unmetNeedsSuggestions.trim().length > 0);
  }, [communityFeedback]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-700 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>Actionable Intelligence</span>
            <RedHelpDot role="community" tabKey="gaps" compact />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Prevention Gap Detector
          </h1>
          <p className="editorial-subtitle text-slate-600 mt-1.5 max-w-2xl">
            Surfaces districts without active institutional programmes and unresolved participant questions based only on real workspace records.
          </p>
        </div>
      </div>

      {/* Part 7D Prevalence vs Awareness Clarification Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-950">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-extrabold">Interpreting Community Demand &amp; Gap Data Accurately</div>
          <p className="leading-relaxed text-amber-900">
            Higher support requests or programme density reflect community awareness and reporting — NOT higher underlying substance addiction prevalence. Never use local activity counts as epidemiological prevalence rankings.
          </p>
        </div>
      </div>

      {/* Part 7D Data Provenance Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
            1. Verified Service Data
          </div>
          <div className="text-2xl font-extrabold text-teal-900 font-mono-tabular">
            {coveredDistrictCount}/14 districts · {supportCenters.length} centers
          </div>
          <p className="text-xs text-slate-500">
            Recorded verified treatment centers &amp; districts with logged prevention drives.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">
            2. Anonymous User-Reported Info
          </div>
          <div className="text-2xl font-extrabold text-indigo-900 font-mono-tabular">
            {lowQuizTopics.length + unmetRequests.length} items
          </div>
          <p className="text-xs text-slate-500">
            {lowQuizTopics.length} quiz clarity gaps (&lt;70%) &amp; {unmetRequests.length} feedback requests.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
          <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
            3. Missing / Uncovered Data
          </div>
          <div className="text-2xl font-extrabold text-rose-900 font-mono-tabular">
            {underservedDistricts.length} districts
          </div>
          <p className="text-xs text-slate-500">
            Districts with zero active workspace prevention drives recorded so far.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-[11px] font-bold text-indigo-900">
              <Sparkles className="w-3 h-3 text-indigo-700" />
              <span>AI Suggestion — Requires Human Coordinator Verification</span>
            </div>
            <h2 className="text-base font-extrabold text-slate-900">Uncovered Kerala Districts</h2>
            <p className="text-xs text-slate-500">Launch a targeted school or community drive in any uncovered district after coordinator review</p>
          </div>
          <button
            onClick={() => onNavigateTab('generator')}
            className="px-4 py-2 rounded-xl bg-teal-900 hover:bg-indigo-900 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Generate Toolkit for Gap</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {underservedDistricts.length > 0 ? (
            underservedDistricts.map(d => (
              <span key={d} className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-950">
                {d}
              </span>
            ))
          ) : (
            <span className="text-xs font-semibold text-indigo-800">
              All 14 Kerala districts currently have active prevention drives!
            </span>
          )}
        </div>

        {unmetRequests.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Top Participant Unmet Needs
            </h3>
            {unmetRequests.slice(0, 4).map(req => (
              <div key={req.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 prose-readable-sm text-slate-700">
                <strong>{req.topic}:</strong> {req.unmetNeedsSuggestions}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ================================================================
   4. COMMUNITY INNOVATION EXCHANGE
================================================================ */
export const CommunityInnovationExchangePanel: React.FC<{
  onNavigateTab: (tab: CommunityActiveTab) => void;
}> = ({ onNavigateTab }) => {
  const { exchangeItems, adaptExchangeTemplate, publishToExchange, communityOrg } = useApp();

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [audience, setAudience] = useState('Youth & College First-Years');
  const [stepsText, setStepsText] = useState('');
  const [adaptedId, setAdaptedId] = useState<string | null>(null);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;
    publishToExchange({
      title: title.trim(),
      authorOrg: communityOrg?.name || 'ClearPath Institutional Coordinator',
      orgType: communityOrg?.type || 'school',
      district: communityOrg?.district || 'Ernakulam',
      templateSummary: summary.trim(),
      targetAudience: audience,
      steps: stepsText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
    });
    setTitle('');
    setSummary('');
    setStepsText('');
  };

  const handleAdapt = (id: string) => {
    adaptExchangeTemplate(id);
    setAdaptedId(id);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-800 mb-1">
            <Share2 className="w-4 h-4 text-amber-600" />
            <span>Peer Institutional Network</span>
            <RedHelpDot role="community" tabKey="exchange" compact />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Community Innovation Exchange
          </h1>
          <p className="editorial-subtitle text-slate-600 mt-1.5 max-w-2xl">
            Share practical campus prevention designs and clone proven peer blueprints straight into your active programmes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Publish new blueprint */}
        <form
          onSubmit={handlePublish}
          className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4 h-fit"
        >
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <Plus className="w-4 h-4 text-amber-600" />
            <span>Publish Successful Blueprint</span>
          </div>

          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Workshop / Campaign Title"
            required
            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
          />
          <input
            type="text"
            value={audience}
            onChange={e => setAudience(e.target.value)}
            placeholder="Target Audience"
            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
          />
          <textarea
            rows={2}
            value={summary}
            onChange={e => setSummary(e.target.value)}
            placeholder="Why did this work well with students/community?"
            required
            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
          />
          <textarea
            rows={3}
            value={stepsText}
            onChange={e => setStepsText(e.target.value)}
            placeholder="Execution steps (one per line)"
            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-teal-900 hover:bg-indigo-900 text-white text-xs font-bold cursor-pointer"
          >
            Publish to Exchange
          </button>
        </form>

        {/* Peer Blueprints List */}
        <div className="lg:col-span-2 space-y-4">
          {exchangeItems.map(item => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-900 text-[11px] font-bold">
                    <Building2 className="w-3 h-3" />
                    {item.orgType.toUpperCase()}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {item.district} · {item.authorOrg}
                  </span>
                </div>
                <span className="text-xs font-mono-tabular font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md">
                  Adapted {item.adaptedCount}x
                </span>
              </div>

              <h3 className="text-lg font-extrabold text-slate-900">{item.title}</h3>
              <p className="prose-readable-sm prose-measure text-slate-600">{item.templateSummary}</p>

              {item.steps.length > 0 && (
                <ul className="space-y-1.5 pt-1">
                  {item.steps.map((s, i) => (
                    <li key={i} className="prose-readable-sm text-slate-700 flex items-start gap-2.5">
                      <span className="font-bold text-indigo-700">{i + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500">Audience: {item.targetAudience}</span>
                <div className="flex items-center gap-2">
                  {adaptedId === item.id && (
                    <button
                      onClick={() => onNavigateTab('programmes')}
                      className="text-xs font-bold text-indigo-800 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Open in Programmes <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleAdapt(item.id)}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold cursor-pointer"
                  >
                    {adaptedId === item.id ? 'Cloned to Draft!' : 'Adapt into My Programme'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
