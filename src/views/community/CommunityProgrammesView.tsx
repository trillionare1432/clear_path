import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Layers,
  Plus,
  Filter,
  Calendar,
  MapPin,
  Users,
  Edit2,
  Trash2,
  Copy,
  Archive,
  CheckCircle2,
  Clock,
  DollarSign,
  X,
  ShieldCheck,
  Search,
  RefreshCw,
  Globe,
  Phone,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { CommunityProgramme } from '../../types';
import type { CommunityProgrammeDraft } from './CommunityStrategyLabView';
import {
  PROGRAMME_CATEGORY_OPTIONS,
  KERALA_DISTRICTS,
  SAMPLE_PROGRAMME_TEMPLATES,
} from '../../constants/communityData';
import { filterCommunityProgrammes } from '../../utils/logic';

interface CommunityProgrammesViewProps {
  isCreateOpen?: boolean;
  onCloseCreate?: () => void;
  initialDraft?: CommunityProgrammeDraft | null;
  onClearDraft?: () => void;
}

interface ServerProgrammeItem {
  id: string;
  orgId: string;
  orgName: string;
  orgCategory: string;
  district: string;
  title: string;
  type: string;
  description: string;
  objective: string;
  targetAudience: string;
  format: 'in_person' | 'online' | 'hybrid';
  location: string;
  date: string;
  time: string;
  eligibility: string;
  contactInfo: string;
  capacity: number;
  registeredCount: number;
  isRegisteredByCurrentUser: boolean;
  verificationStatus: 'verified' | 'pending';
}

export const CommunityProgrammesView: React.FC<CommunityProgrammesViewProps> = ({
  isCreateOpen = false,
  onCloseCreate,
  initialDraft = null,
  onClearDraft,
}) => {
  const {
    communityProgrammes,
    addCommunityProgramme,
    updateCommunityProgramme,
    deleteCommunityProgramme,
    communityOrg,
    serverAuthToken,
    language,
    realtimeTick,
  } = useApp();

  // 6 Part-7C Discovery Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [targetGroupQuery, setTargetGroupQuery] = useState('');
  const [orgQuery, setOrgQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  // Server Discovery State
  const [serverProgrammes, setServerProgrammes] = useState<ServerProgrammeItem[]>([]);
  const [loadingServer, setLoadingServer] = useState(false);
  const [serverActionMsg, setServerActionMsg] = useState<string | null>(null);
  const [serverErrorMsg, setServerErrorMsg] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(isCreateOpen);
  const [selectedProgramme, setSelectedProgramme] = useState<CommunityProgramme | null>(null);

  // 12-Field Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CommunityProgramme['category']>('school_awareness');
  const [objective, setObjective] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [location, setLocation] = useState('');
  const [district, setDistrict] = useState(communityOrg?.district || 'Ernakulam');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [programmeTime, setProgrammeTime] = useState('10:30 AM');
  const [programmeFormat, setProgrammeFormat] = useState<'in_person' | 'online' | 'hybrid'>('in_person');
  const [contactInfo, setContactInfo] = useState(communityOrg?.coordinatorEmail || communityOrg?.coordinatorPhone || '');
  const [capacity, setCapacity] = useState(60);
  const [budget, setBudget] = useState(10000);
  const [requiredResources, setRequiredResources] = useState('');
  const [expectedOutcomes, setExpectedOutcomes] = useState('');
  const [eligibility, setEligibility] = useState('');
  const [settings, setSettings] = useState('');
  const [partners, setPartners] = useState('');
  const [strategies, setStrategies] = useState('');
  const [safeguards, setSafeguards] = useState('');
  const [indicators, setIndicators] = useState('');
  const [evaluationPlan, setEvaluationPlan] = useState('');
  const [timeline, setTimeline] = useState('');
  const [potentialRisks, setPotentialRisks] = useState('');
  const [linkedIdeaId, setLinkedIdeaId] = useState<string | undefined>(undefined);
  const [moderationStatus, setModerationStatus] = useState<'draft' | 'pending_review' | 'approved_published'>('approved_published');
  const [status, setStatus] = useState<CommunityProgramme['status']>('planning');

  // AI Critical Programme Review State
  const [reviewingProgramme, setReviewingProgramme] = useState(false);
  const [programmeAiReview, setProgrammeAiReview] = useState<{
    criticalChallenge: string;
    programmeReviewFeedback?: {
      missingInformation?: string[];
      contradictionsOrWeakLinks?: string;
      recommendedImprovements?: string[];
    } | null;
  } | null>(null);

  useEffect(() => {
    if (isCreateOpen) {
      setShowModal(true);
    }
  }, [isCreateOpen]);

  useEffect(() => {
    if (!initialDraft) return;
    setSelectedProgramme(null);
    setTitle(initialDraft.title || '');
    setCategory(initialDraft.category || 'school_awareness');
    setObjective(initialDraft.objective || '');
    setTargetAudience(initialDraft.targetAudience || '');
    setDistrict(initialDraft.district || communityOrg?.district || 'Ernakulam');
    setSettings(initialDraft.settings || '');
    setPartners(initialDraft.partners || '');
    setStrategies(initialDraft.strategies || '');
    setSafeguards(initialDraft.safeguards || '');
    setIndicators(initialDraft.indicators || '');
    setEvaluationPlan(initialDraft.evaluationPlan || '');
    setTimeline(initialDraft.timeline || '');
    setRequiredResources(initialDraft.requiredResources || '');
    setPotentialRisks(initialDraft.potentialRisks || '');
    setExpectedOutcomes(initialDraft.expectedOutcomes || '');
    setLinkedIdeaId(initialDraft.linkedIdeaId);
    setProgrammeAiReview(null);
    setShowModal(true);
  }, [initialDraft, communityOrg?.district]);

  const fetchServerProgrammes = useCallback(async () => {
    setLoadingServer(true);
    setServerErrorMsg(null);
    try {
      const params = new URLSearchParams();
      params.set('includePending', 'true');
      if (districtFilter !== 'all') params.set('district', districtFilter);
      if (categoryFilter !== 'all') params.set('type', categoryFilter);
      if (targetGroupQuery.trim()) params.set('targetGroup', targetGroupQuery.trim());
      if (orgQuery.trim()) params.set('org', orgQuery.trim());
      if (dateFilter) params.set('date', dateFilter);
      if (availableOnly) params.set('availableOnly', 'true');

      const res = await fetch(`/api/community/programmes?${params.toString()}`, {
        headers: serverAuthToken ? { Authorization: `Bearer ${serverAuthToken}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setServerProgrammes(Array.isArray(data.programmes) ? data.programmes : []);
      }
    } catch {
      setServerErrorMsg('Unable to reach public programme directory right now.');
    } finally {
      setLoadingServer(false);
    }
  }, [serverAuthToken, districtFilter, categoryFilter, targetGroupQuery, orgQuery, dateFilter, availableOnly]);

  useEffect(() => {
    fetchServerProgrammes();
  }, [fetchServerProgrammes, realtimeTick]);

  const baseFilteredLocal = filterCommunityProgrammes(
    communityProgrammes,
    categoryFilter,
    statusFilter,
    districtFilter
  );

  const filtered = baseFilteredLocal.filter(prog => {
    if (targetGroupQuery.trim() && !prog.targetAudience.toLowerCase().includes(targetGroupQuery.trim().toLowerCase())) {
      return false;
    }
    if (orgQuery.trim()) {
      const orgName = (communityOrg?.name || '').toLowerCase();
      if (!orgName.includes(orgQuery.trim().toLowerCase()) && !prog.location.toLowerCase().includes(orgQuery.trim().toLowerCase())) {
        return false;
      }
    }
    if (dateFilter && prog.startDate !== dateFilter) {
      return false;
    }
    return true;
  });

  const handleApplyTemplate = (tmpl: (typeof SAMPLE_PROGRAMME_TEMPLATES)[0]) => {
    setTitle(tmpl.title);
    setCategory(tmpl.category);
    setObjective(tmpl.objective);
    setTargetAudience(tmpl.targetAudience);
    setBudget(tmpl.budget);
    setExpectedOutcomes(tmpl.expectedOutcomes);
    setRequiredResources(tmpl.requiredResources);
  };

  const handleSaveProgramme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setServerErrorMsg(null);
    setServerActionMsg(null);

    if (selectedProgramme) {
      updateCommunityProgramme(selectedProgramme.id, {
        title,
        category,
        objective,
        targetAudience,
        location,
        district,
        startDate,
        endDate,
        budget: Number(budget) || 0,
        requiredResources,
        expectedOutcomes,
        eligibility: eligibility.trim() || undefined,
        settings: settings.trim() || undefined,
        partners: partners.trim() || undefined,
        strategies: strategies.trim() || undefined,
        safeguards: safeguards.trim() || undefined,
        indicators: indicators.trim() || undefined,
        evaluationPlan: evaluationPlan.trim() || undefined,
        timeline: timeline.trim() || undefined,
        potentialRisks: potentialRisks.trim() || undefined,
        linkedIdeaId,
        moderationStatus,
        status,
      });
    } else {
      addCommunityProgramme({
        title,
        category,
        objective,
        targetAudience,
        location: location || communityOrg?.name || 'Local Venue',
        district,
        startDate,
        endDate: endDate || startDate,
        coordinatorId: 'lead',
        teamMemberIds: [],
        requiredResources,
        budget: Number(budget) || 0,
        status,
        expectedOutcomes,
        eligibility: eligibility.trim() || undefined,
        settings: settings.trim() || undefined,
        partners: partners.trim() || undefined,
        strategies: strategies.trim() || undefined,
        safeguards: safeguards.trim() || undefined,
        indicators: indicators.trim() || undefined,
        evaluationPlan: evaluationPlan.trim() || undefined,
        timeline: timeline.trim() || undefined,
        potentialRisks: potentialRisks.trim() || undefined,
        linkedIdeaId,
        moderationStatus,
        registeredCount: 0,
        isRegisteredByUser: false,
      });

      if (serverAuthToken) {
        try {
          const res = await fetch('/api/community/programmes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${serverAuthToken}`,
            },
            body: JSON.stringify({
              title: title.trim(),
              district,
              description: objective.trim() || expectedOutcomes.trim() || title.trim(),
              type: category,
              objective: objective.trim(),
              targetAudience: targetAudience.trim() || 'Students, Youth & Families',
              format: programmeFormat,
              location: location || communityOrg?.name || district,
              date: startDate,
              time: programmeTime || '10:30 AM',
              eligibility: eligibility.trim() || 'Open registration',
              contactInfo: contactInfo.trim() || communityOrg?.coordinatorEmail || 'Contact organizer',
              capacity: Math.max(5, Number(capacity) || 60),
              orgName: communityOrg?.name,
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            setServerErrorMsg(data.error || 'Could not publish programme to shared directory.');
          } else {
            const st = data.programme?.verificationStatus === 'verified' ? 'Verified & Live in Public Directory' : 'Submitted (Pending Admin Organization Approval)';
            setServerActionMsg(`Programme "${title.trim()}" synced: ${st}.`);
            fetchServerProgrammes();
          }
        } catch {
          setServerErrorMsg('Saved locally, but server sync failed.');
        }
      }
    }

    closeFormModal();
  };

  const handleServerRegister = async (progId: string) => {
    setServerErrorMsg(null);
    setServerActionMsg(null);
    if (!serverAuthToken) {
      setServerErrorMsg('Please sign in via Account / Portals to register a seat in a verified public programme.');
      return;
    }
    try {
      const res = await fetch(`/api/community/programmes/${progId}/register`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serverAuthToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        setServerErrorMsg(data.error || 'Registration could not be completed.');
        return;
      }
      setServerActionMsg('Your anonymous seat registration is confirmed.');
      fetchServerProgrammes();
    } catch {
      setServerErrorMsg('Network error while registering.');
    }
  };

  const openNewModal = () => {
    setSelectedProgramme(null);
    setTitle('');
    setCategory('school_awareness');
    setObjective('');
    setTargetAudience('');
    setLocation(communityOrg?.name || '');
    setDistrict(communityOrg?.district || 'Ernakulam');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setProgrammeTime('10:30 AM');
    setProgrammeFormat('in_person');
    setContactInfo(communityOrg?.coordinatorEmail || communityOrg?.coordinatorPhone || '');
    setCapacity(60);
    setBudget(10000);
    setRequiredResources('');
    setExpectedOutcomes('');
    setEligibility('');
    setSettings('');
    setPartners('');
    setStrategies('');
    setSafeguards('');
    setIndicators('');
    setEvaluationPlan('');
    setTimeline('');
    setPotentialRisks('');
    setLinkedIdeaId(undefined);
    setProgrammeAiReview(null);
    setModerationStatus('approved_published');
    setStatus('planning');
    setShowModal(true);
  };

  const openEditModal = (prog: CommunityProgramme) => {
    setSelectedProgramme(prog);
    setTitle(prog.title);
    setCategory(prog.category);
    setObjective(prog.objective);
    setTargetAudience(prog.targetAudience);
    setLocation(prog.location);
    setDistrict(prog.district);
    setStartDate(prog.startDate);
    setEndDate(prog.endDate);
    setBudget(prog.budget);
    setRequiredResources(prog.requiredResources);
    setExpectedOutcomes(prog.expectedOutcomes);
    setEligibility(prog.eligibility || '');
    setSettings(prog.settings || '');
    setPartners(prog.partners || '');
    setStrategies(prog.strategies || '');
    setSafeguards(prog.safeguards || '');
    setIndicators(prog.indicators || '');
    setEvaluationPlan(prog.evaluationPlan || '');
    setTimeline(prog.timeline || '');
    setPotentialRisks(prog.potentialRisks || '');
    setLinkedIdeaId(prog.linkedIdeaId);
    setProgrammeAiReview(null);
    setModerationStatus(prog.moderationStatus || 'approved_published');
    setStatus(prog.status);
    setShowModal(true);
  };

  const closeFormModal = () => {
    setShowModal(false);
    setSelectedProgramme(null);
    setProgrammeAiReview(null);
    if (onClearDraft) onClearDraft();
    if (onCloseCreate) onCloseCreate();
  };

  const handleRunProgrammeAiReview = async () => {
    setReviewingProgramme(true);
    setServerErrorMsg(null);
    try {
      const res = await fetch('/api/ai/community-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'programme_review',
          title: title.trim() || 'Draft Community Prevention Programme',
          objective: objective.trim(),
          targetAudience: targetAudience.trim(),
          district,
          programmeDraft: {
            title,
            category,
            objective,
            targetAudience,
            settings,
            partners,
            strategies,
            safeguards,
            indicators,
            evaluationPlan,
            timeline,
            requiredResources,
            potentialRisks,
            expectedOutcomes,
          },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProgrammeAiReview({
          criticalChallenge: data.criticalChallenge,
          programmeReviewFeedback: data.programmeReviewFeedback,
        });
      }
    } catch {
      setServerErrorMsg('Could not run AI programme review right now.');
    } finally {
      setReviewingProgramme(false);
    }
  };

  const handleDuplicate = (prog: CommunityProgramme) => {
    addCommunityProgramme({
      title: `${prog.title} (Copy)`,
      category: prog.category,
      objective: prog.objective,
      targetAudience: prog.targetAudience,
      location: prog.location,
      district: prog.district,
      startDate: new Date().toISOString().split('T')[0],
      endDate: prog.endDate,
      coordinatorId: prog.coordinatorId,
      teamMemberIds: prog.teamMemberIds,
      requiredResources: prog.requiredResources,
      budget: prog.budget,
      status: 'planning',
      expectedOutcomes: prog.expectedOutcomes,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>{language === 'ml' ? 'പദ്ധതി നിർമ്മാണവും ഡിസ്കവറിയും' : 'Prevention Architecture & Public Discovery'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {language === 'ml' ? 'പ്രതിരോധ പദ്ധതികൾ' : 'Programmes & Interventions'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {language === 'ml'
              ? 'സ്കൂളുകളിലും സമൂഹത്തിലും സുസ്ഥിരമായ ലഹരിവിരുദ്ധ പ്രവർത്തനങ്ങൾ പ്ലാൻ ചെയ്യുകയും ഏകോപിപ്പിക്കുകയും ചെയ്യുക.'
              : 'Discover verified public prevention drives across Kerala or design structured institutional programmes.'}
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-teal-800 hover:bg-teal-900 text-white shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ml' ? 'പുതിയ പദ്ധതി ആരംഭിക്കുക' : 'Build New Programme'}</span>
        </button>
      </div>

      {/* Part 7C 6-Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
            <Filter className="w-3.5 h-3.5 text-teal-700" />
            <span>Discovery &amp; Planning Filters (6 criteria)</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {serverProgrammes.length} public · {filtered.length} workspace
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
          {/* 1. Location / District */}
          <select
            aria-label="Filter by district"
            value={districtFilter}
            onChange={e => setDistrictFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700"
          >
            <option value="all">1. All Districts</option>
            {KERALA_DISTRICTS.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* 2. Programme Type */}
          <select
            aria-label="Filter by programme type"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700"
          >
            <option value="all">2. All Programme Types</option>
            {PROGRAMME_CATEGORY_OPTIONS.map(c => (
              <option key={c.id} value={c.id}>
                {language === 'ml' ? c.labelMl : c.label}
              </option>
            ))}
          </select>

          {/* 3. Target Group Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              aria-label="Filter by target group"
              value={targetGroupQuery}
              onChange={e => setTargetGroupQuery(e.target.value)}
              placeholder="3. Target group (e.g. youth)"
              className="w-full pl-8 pr-2.5 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700"
            />
          </div>

          {/* 4. Date */}
          <input
            type="date"
            aria-label="Filter by programme date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700"
          />

          {/* 5. Organization Search */}
          <input
            type="text"
            aria-label="Filter by organization"
            value={orgQuery}
            onChange={e => setOrgQuery(e.target.value)}
            placeholder="5. Organization / Campus"
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700"
          />

          {/* 6. Seat Availability Toggle + Status */}
          <div className="flex items-center gap-2">
            <label className="flex-1 flex items-center gap-2 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={e => setAvailableOnly(e.target.checked)}
                className="accent-teal-800"
              />
              <span className="truncate">6. Open Seats</span>
            </label>
            <select
              aria-label="Workspace programme status"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2 py-2 text-xs rounded-xl border border-slate-200 bg-white text-slate-700"
            >
              <option value="all">All</option>
              <option value="planning">Plan</option>
              <option value="active">Active</option>
              <option value="completed">Done</option>
            </select>
          </div>
        </div>
      </div>

      {serverActionMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{serverActionMsg}</span>
        </div>
      )}

      {serverErrorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
          <span>{serverErrorMsg}</span>
        </div>
      )}

      {/* Part 7C: Public Verified & Submitted Programmes Directory (Server-backed) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-800" />
            <h2 className="text-base font-extrabold text-slate-900">
              Verified &amp; Community Public Directory
            </h2>
          </div>
          <button
            type="button"
            onClick={fetchServerProgrammes}
            disabled={loadingServer}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingServer ? 'animate-spin' : ''}`} />
            <span>Refresh Directory</span>
          </button>
        </div>

        {serverProgrammes.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {serverProgrammes.map(sp => {
              const seatsLeft = Math.max(0, sp.capacity - sp.registeredCount);
              return (
                <div
                  key={sp.id}
                  className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800">
                        {sp.orgName} · {sp.district}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${
                          sp.verificationStatus === 'verified'
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : 'bg-amber-50 text-amber-900 border-amber-200'
                        }`}
                      >
                        {sp.verificationStatus === 'verified' ? 'Verified Org' : 'Pending Admin Approval'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{sp.title}</h3>
                      <p className="text-xs text-slate-600 mt-1">{sp.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="capitalize">{sp.format.replace('_', '-')} · {sp.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono">{sp.date} · {sp.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{sp.targetAudience}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{sp.contactInfo}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700">
                      <strong>Eligibility:</strong> {sp.eligibility} · <strong>Seats:</strong> {sp.registeredCount}/{sp.capacity} ({seatsLeft} open)
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">
                      {sp.type.replace('_', ' ')}
                    </span>
                    <button
                      type="button"
                      disabled={sp.verificationStatus !== 'verified' || sp.isRegisteredByCurrentUser || seatsLeft <= 0}
                      onClick={() => handleServerRegister(sp.id)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-55 ${
                        sp.isRegisteredByCurrentUser
                          ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                          : 'bg-teal-900 hover:bg-indigo-900 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {sp.isRegisteredByCurrentUser
                          ? 'Registered'
                          : sp.verificationStatus !== 'verified'
                          ? 'Awaiting Verification'
                          : seatsLeft <= 0
                          ? 'Full'
                          : 'Register Seat'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between gap-3">
            <span>
              No server-published programmes match the current 6-criteria filters yet. When your organization builds a programme while signed in, it appears here for verification &amp; discovery.
            </span>
          </div>
        )}
      </div>

      {/* Local Workspace Programmes */}
      <div className="space-y-4">
        <h2 className="text-base font-extrabold text-slate-900">
          Your Organization Workspace Programmes
        </h2>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filtered.map(prog => {
              const catOption = PROGRAMME_CATEGORY_OPTIONS.find(c => c.id === prog.category);
              return (
                <div
                  key={prog.id}
                  className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-900 border border-teal-200">
                        {language === 'ml' ? catOption?.labelMl : catOption?.label || prog.category}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg ${
                            prog.moderationStatus === 'pending_review'
                              ? 'bg-indigo-100 text-indigo-800'
                              : prog.moderationStatus === 'draft'
                              ? 'bg-slate-100 text-slate-600'
                              : 'bg-teal-50 text-teal-800 border border-teal-200'
                          }`}
                        >
                          {prog.moderationStatus === 'pending_review'
                            ? 'In Review'
                            : prog.moderationStatus === 'draft'
                            ? 'Draft'
                            : 'Published'}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-lg ${
                            prog.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : prog.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : prog.status === 'planning'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {prog.status}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{prog.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{prog.objective}</p>
                    </div>

                    {/* Metadata Row */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{prog.targetAudience}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{prog.district}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-mono">{prog.startDate}</span>
                      </div>
                      {prog.budget > 0 && (
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono">Budget: ₹{prog.budget.toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {(prog.expectedOutcomes || prog.eligibility || prog.safeguards || prog.partners) && (
                      <div className="p-3 rounded-xl bg-slate-50 text-[11px] text-slate-700 space-y-1">
                        {prog.partners && (
                          <div>
                            <strong className="font-semibold text-slate-900">Partners: </strong>
                            <span>{prog.partners}</span>
                          </div>
                        )}
                        {prog.safeguards && (
                          <div>
                            <strong className="font-semibold text-slate-900">Safeguards: </strong>
                            <span className="line-clamp-1">{prog.safeguards}</span>
                          </div>
                        )}
                        {prog.eligibility && (
                          <div>
                            <strong className="font-semibold text-slate-900">Eligibility: </strong>
                            <span>{prog.eligibility}</span>
                          </div>
                        )}
                        {prog.expectedOutcomes && (
                          <div>
                            <strong className="font-semibold text-slate-900 block mb-0.5">
                              Expected Outcomes:
                            </strong>
                            <span className="line-clamp-2">{prog.expectedOutcomes}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(prog)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="Edit Programme"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(prog)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="Duplicate as Template"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          updateCommunityProgramme(prog.id, {
                            status: prog.status === 'archived' ? 'active' : 'archived',
                          })
                        }
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                        title="Toggle Archive"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteCommunityProgramme(prog.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:text-rose-800 hover:bg-rose-50 transition-colors"
                        title="Delete Programme"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const currentlyRegistered = Boolean(prog.isRegisteredByUser);
                          const baseCount = prog.registeredCount || 0;
                          updateCommunityProgramme(prog.id, {
                            isRegisteredByUser: !currentlyRegistered,
                            registeredCount: currentlyRegistered ? Math.max(0, baseCount - 1) : baseCount + 1,
                          });
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg border cursor-pointer transition-colors ${
                          prog.isRegisteredByUser
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-teal-50'
                        }`}
                      >
                        <Users className="w-3 h-3" />
                        <span>
                          {prog.isRegisteredByUser ? 'Registered' : 'Register'} ({prog.registeredCount || 0})
                        </span>
                      </button>

                      {prog.moderationStatus === 'draft' && (
                        <button
                          type="button"
                          onClick={() => updateCommunityProgramme(prog.id, { moderationStatus: 'pending_review' })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-200 cursor-pointer"
                        >
                          <Clock className="w-3 h-3" />
                          <span>Submit Review</span>
                        </button>
                      )}

                      {prog.moderationStatus === 'pending_review' && (
                        <button
                          type="button"
                          onClick={() => updateCommunityProgramme(prog.id, { moderationStatus: 'approved_published' })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-teal-700 text-white cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Approve &amp; Publish</span>
                        </button>
                      )}

                      {prog.status !== 'completed' && (
                        <button
                          type="button"
                          onClick={() => updateCommunityProgramme(prog.id, { status: 'completed' })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-teal-50 text-teal-800 hover:bg-teal-100 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Mark Done</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 px-4 bg-white rounded-3xl border border-dashed border-slate-200">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">
              {language === 'ml' ? 'പദ്ധതികളൊന്നും കണ്ടെത്തിയില്ല' : 'No workspace programmes match these filters'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              {language === 'ml'
                ? 'നിങ്ങൾ തിരഞ്ഞെടുത്ത ഫിൽട്ടറുകളിൽ പദ്ധതികൾ ലഭ്യമല്ല അല്ലെങ്കിൽ ഇതുവരെ തയ്യാറാക്കിയിട്ടില്ല.'
                : 'Design your first structured prevention programme or load a verified template.'}
            </p>
            <button
              onClick={openNewModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'ml' ? 'പദ്ധതി ആരംഭിക്കുക' : 'Create First Programme'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Modal: Create or Edit Programme */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedProgramme
                      ? language === 'ml'
                        ? 'പദ്ധതി എഡിറ്റ് ചെയ്യുക'
                        : 'Edit Programme'
                      : language === 'ml'
                      ? 'പുതിയ പ്രതിരോധ പദ്ധതി'
                      : 'Design Prevention Programme'}
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

            {!selectedProgramme && (
              <div className="pt-4 pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                  Pre-fill from verified template:
                </span>
                <div className="flex flex-wrap gap-2">
                  {SAMPLE_PROGRAMME_TEMPLATES.map(tmpl => (
                    <button
                      key={tmpl.title}
                      type="button"
                      onClick={() => handleApplyTemplate(tmpl)}
                      className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-semibold border border-teal-200 transition-colors cursor-pointer"
                    >
                      {tmpl.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSaveProgramme} className="space-y-4 pt-3">
              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Programme Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Higher Secondary Alcohol & Synthetic Awareness Drive"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as CommunityProgramme['category'])}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700 bg-white"
                  >
                    {PROGRAMME_CATEGORY_OPTIONS.map(c => (
                      <option key={c.id} value={c.id}>
                        {language === 'ml' ? c.labelMl : c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Objective */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Primary Objective / Description *
                </label>
                <textarea
                  required
                  rows={2}
                  value={objective}
                  onChange={e => setObjective(e.target.value)}
                  placeholder="e.g. Deliver neurobiology education, empower youth with refusal skills, and provide confidential teacher check-ins."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                />
              </div>

              {/* Target Audience & District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Audience *
                  </label>
                  <input
                    type="text"
                    required
                    value={targetAudience}
                    onChange={e => setTargetAudience(e.target.value)}
                    placeholder="e.g. Grades 9-12 students (Ages 14-18)"
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
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Format, Time & Capacity (For Public Discovery) */}
              {!selectedProgramme && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Format
                    </label>
                    <select
                      value={programmeFormat}
                      onChange={e => setProgrammeFormat(e.target.value as 'in_person' | 'online' | 'hybrid')}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="in_person">In-Person</option>
                      <option value="online">Online</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Session Time
                    </label>
                    <input
                      type="text"
                      value={programmeTime}
                      onChange={e => setProgrammeTime(e.target.value)}
                      placeholder="10:30 AM"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Seat Capacity
                    </label>
                    <input
                      type="number"
                      min={5}
                      value={capacity}
                      onChange={e => setCapacity(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Public Contact
                    </label>
                    <input
                      type="text"
                      value={contactInfo}
                      onChange={e => setContactInfo(e.target.value)}
                      placeholder="Phone or email"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
              )}

              {/* Location & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Venue / Campus
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Main Auditorium"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                  />
                </div>

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
              </div>

              {/* Budget & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Budget (INR ₹)
                  </label>
                  <input
                    type="number"
                    value={budget}
                    onChange={e => setBudget(Number(e.target.value))}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as CommunityProgramme['status'])}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700 bg-white"
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Moderation Stage & Eligibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Eligibility Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={eligibility}
                    onChange={e => setEligibility(e.target.value)}
                    placeholder="e.g. Open to NSS students & faculty"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Moderation / Publish Stage
                  </label>
                  <select
                    value={moderationStatus}
                    onChange={e =>
                      setModerationStatus(e.target.value as 'draft' | 'pending_review' | 'approved_published')
                    }
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700 bg-white"
                  >
                    <option value="draft">Draft (Internal Only)</option>
                    <option value="pending_review">Pending Coordinator Review</option>
                    <option value="approved_published">Approved &amp; Published</option>
                  </select>
                </div>
              </div>

              {/* Expected Outcomes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Expected Measurable Outcomes
                </label>
                <input
                  type="text"
                  value={expectedOutcomes}
                  onChange={e => setExpectedOutcomes(e.target.value)}
                  placeholder="e.g. Reach 500 students, train 30 peer leaders, establish school referral desk"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-700"
                />
              </div>

              {/* Structured 12-Field Prevention Architecture */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="text-xs font-extrabold text-teal-900">
                  12-Field Prevention Architecture &amp; Safeguarding
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Setting &amp; Rollout Context
                    </label>
                    <input
                      type="text"
                      value={settings}
                      onChange={e => setSettings(e.target.value)}
                      placeholder="e.g. Higher secondary classrooms + PTA evening"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Partners &amp; Stakeholders
                    </label>
                    <input
                      type="text"
                      value={partners}
                      onChange={e => setPartners(e.target.value)}
                      placeholder="e.g. Vimukthi Club, PHC, District Hospital"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Evidence-Based Strategies
                    </label>
                    <textarea
                      rows={2}
                      value={strategies}
                      onChange={e => setStrategies(e.target.value)}
                      placeholder="Interactive refusal practice, peer mentors, non-scare skills"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Ethical &amp; Minor Safeguards
                    </label>
                    <textarea
                      rows={2}
                      value={safeguards}
                      onChange={e => setSafeguards(e.target.value)}
                      placeholder="Zero shaming, confidential 14405 / 14416 escalation path"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Measurable Indicators
                    </label>
                    <input
                      type="text"
                      value={indicators}
                      onChange={e => setIndicators(e.target.value)}
                      placeholder="Pre/post clarity score, helpline recall rate"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Evaluation &amp; Follow-Up Plan
                    </label>
                    <input
                      type="text"
                      value={evaluationPlan}
                      onChange={e => setEvaluationPlan(e.target.value)}
                      placeholder="Anonymous baseline + immediate post + 30-day check"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Timeline Cadence
                    </label>
                    <input
                      type="text"
                      value={timeline}
                      onChange={e => setTimeline(e.target.value)}
                      placeholder="e.g. 4 weekly 45-min interactive modules"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Potential Risks &amp; Mitigation
                    </label>
                    <input
                      type="text"
                      value={potentialRisks}
                      onChange={e => setPotentialRisks(e.target.value)}
                      placeholder="Avoid graphic drug details; guard against exam clashes"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* AI Programme Completeness & Critique Output */}
              {programmeAiReview && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
                  <div className="font-bold">AI Critical Programme Review</div>
                  <p>{programmeAiReview.criticalChallenge}</p>
                  {programmeAiReview.programmeReviewFeedback?.missingInformation &&
                    programmeAiReview.programmeReviewFeedback.missingInformation.length > 0 && (
                      <div>
                        <strong className="block">Missing Information:</strong>
                        <ul className="list-disc list-inside space-y-0.5">
                          {programmeAiReview.programmeReviewFeedback.missingInformation.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  {programmeAiReview.programmeReviewFeedback?.contradictionsOrWeakLinks && (
                    <div>
                      <strong>Alignment Check: </strong>
                      <span>{programmeAiReview.programmeReviewFeedback.contradictionsOrWeakLinks}</span>
                    </div>
                  )}
                  {programmeAiReview.programmeReviewFeedback?.recommendedImprovements &&
                    programmeAiReview.programmeReviewFeedback.recommendedImprovements.length > 0 && (
                      <div>
                        <strong className="block">Recommended Upgrades:</strong>
                        <ul className="list-disc list-inside space-y-0.5">
                          {programmeAiReview.programmeReviewFeedback.recommendedImprovements.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              )}

              {/* Buttons */}
              <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleRunProgrammeAiReview}
                  disabled={reviewingProgramme}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white cursor-pointer disabled:opacity-60"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>{reviewingProgramme ? 'Reviewing Draft...' : 'AI Critical Programme Review'}</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={closeFormModal}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold rounded-xl bg-teal-800 hover:bg-teal-900 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    {selectedProgramme ? 'Save Changes' : 'Create Programme'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
