import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Search,
  MapPin,
  RefreshCw,
  AlertTriangle,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  Layers,
} from 'lucide-react';
import {
  EVIDENCE_CATEGORY_META,
  SUBSTANCE_INTELLIGENCE_METRICS,
  COMMUNITY_RISK_PROTECTIVE_FACTORS,
  KERALA_DISTRICT_INTELLIGENCE_PROFILES,
  EvidenceIndicatorCategory,
  SubstanceIntelligenceMetric,
  CommunityRiskProtectiveDimension,
  KeralaDistrictReferenceProfile,
} from '../../constants/communityIntelligenceData';
import { AggregatedCommunityTrends } from '../../types';
import { useApp } from '../../context/AppContext';
import { CommunityActiveTab } from '../../components/CommunityTopHeader';

interface KeralaDistrictWithLive extends KeralaDistrictReferenceProfile {
  liveVerifiedProgrammesCount?: number;
}

interface CommunityIntelligenceViewProps {
  onNavigateTab?: (tab: CommunityActiveTab) => void;
  onStartIdeaForDistrict?: (district: string, focusHint: string) => void;
}

export const CommunityIntelligenceView: React.FC<CommunityIntelligenceViewProps> = ({
  onNavigateTab,
  onStartIdeaForDistrict,
}) => {
  const { realtimeTick } = useApp();
  const [metrics, setMetrics] = useState<SubstanceIntelligenceMetric[]>(SUBSTANCE_INTELLIGENCE_METRICS);
  const [factors, setFactors] = useState<CommunityRiskProtectiveDimension[]>(COMMUNITY_RISK_PROTECTIVE_FACTORS);
  const [districts, setDistricts] = useState<KeralaDistrictWithLive[]>(
    KERALA_DISTRICT_INTELLIGENCE_PROFILES.map(d => ({ ...d, liveVerifiedProgrammesCount: 0 }))
  );
  const [aggregatedTrends, setAggregatedTrends] = useState<AggregatedCommunityTrends | null>(null);
  const [localNeeds, setLocalNeeds] = useState<
    Array<{ id: string; district: string; category: string; observation: string; createdAt: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [boundaryNotice, setBoundaryNotice] = useState<string>(
    'All trends and service gaps are combined anonymously. Personal recovery records never appear here, and groups smaller than 5 are hidden for privacy.'
  );

  // Explorer filters
  const [selectedCategory, setSelectedCategory] = useState<'all' | EvidenceIndicatorCategory>('all');
  const [selectedScope, setSelectedScope] = useState<'all' | 'Kerala' | 'India' | 'Sub-Population' | 'Global Comparison'>('all');
  const [selectedSubstance, setSelectedSubstance] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('Ernakulam');
  const [factorFilter, setFactorFilter] = useState<'all' | 'protective' | 'vulnerability_association'>('all');
  const [expandedMetricId, setExpandedMetricId] = useState<string | null>(null);

  const loadIntelligence = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/community/intelligence');
      if (!res.ok) throw new Error('Unable to sync live district directory');
      const data = await res.json();
      if (Array.isArray(data.metrics) && data.metrics.length > 0) setMetrics(data.metrics);
      if (Array.isArray(data.riskProtectiveFactors) && data.riskProtectiveFactors.length > 0) {
        setFactors(data.riskProtectiveFactors);
      }
      if (Array.isArray(data.keralaDistricts) && data.keralaDistricts.length > 0) {
        setDistricts(data.keralaDistricts);
      }
      if (typeof data.dataBoundaryNotice === 'string') {
        setBoundaryNotice(data.dataBoundaryNotice);
      }
      if (data.aggregatedCommunityTrends) {
        setAggregatedTrends(data.aggregatedCommunityTrends);
      }
      if (Array.isArray(data.localNeedsSummary)) {
        setLocalNeeds(data.localNeedsSummary);
      }
    } catch {
      setFetchError('Showing verified offline Kerala/India intelligence reference dataset (server sync unavailable).');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIntelligence();
  }, [loadIntelligence, realtimeTick]);

  const substanceOptions = Array.from(new Set(metrics.map(m => m.substanceCategory)));

  const filteredMetrics = metrics.filter(m => {
    if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
    if (selectedScope !== 'all' && m.scope !== selectedScope) return false;
    if (selectedSubstance !== 'all' && m.substanceCategory !== selectedSubstance) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const hay = `${m.indicator} ${m.geography} ${m.populationOrAgeGroup} ${m.urbanRuralNote} ${m.source} ${m.substanceCategory}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const filteredFactors = factors.filter(f => {
    if (factorFilter !== 'all' && f.factorType !== factorFilter) return false;
    return true;
  });

  const activeDistrict =
    districts.find(d => d.district === selectedDistrictName) || districts[0];

  const activeCategoryMeta =
    selectedCategory !== 'all' ? EVIDENCE_CATEGORY_META[selectedCategory] : null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Page Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-5 border-b border-slate-200">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-teal-800 uppercase tracking-wider">
            <Database className="w-4 h-4" />
            <span>Community Intelligence &amp; Kerala/India Research</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-balance">
            Substance-Use Evidence, Service Capacity &amp; Data Gaps
          </h1>
          <p className="text-sm text-slate-600 max-w-3xl">
            Investigate verified Indian and Kerala epidemiology, treatment demand, urban-rural differences, and district service nodes without equating policing detections with community addiction prevalence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={loadIntelligence}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Live Counts</span>
          </button>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('strategy_lab')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-900 hover:bg-teal-950 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
            >
              <span>Open Strategy &amp; AI Lab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Boundary & Integrity Notice */}
      <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 flex items-start gap-3 text-xs text-amber-950">
        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">Methodological Boundary &amp; Evidence Integrity</div>
          <p className="leading-relaxed">
            {boundaryNotice} Use prevalence ≠ dependence disorder ≠ clinic admissions ≠ NDPS arrests/seizures. Where reliable district prevalence surveys do not exist in public sources, ClearPath AI states the gap rather than fabricating estimates.
          </p>
          {fetchError && <p className="text-amber-900 font-semibold">{fetchError}</p>}
        </div>
      </div>

      {/* Live Server K-Anonymized (k >= 5) Aggregated Community Trends */}
      {aggregatedTrends && (
        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Aggregated Community Trends · k-Anonymity (k &ge; {aggregatedTrends.kAnonymityMinCohort})</span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-0.5">
                Verified Field Outcomes &amp; District Coverage Gaps
              </h2>
            </div>
            <span className="text-[11px] text-slate-500">
              Subgroups below {aggregatedTrends.kAnonymityMinCohort} are suppressed server-side
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs tabular-nums">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500 font-semibold">Verified Programmes</div>
              <div className="text-2xl font-extrabold text-teal-950 mt-1">
                {aggregatedTrends.verifiedProgrammesCount}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500 font-semibold">Anonymous Evaluations</div>
              <div className="text-xl font-extrabold text-slate-900 mt-1">
                {aggregatedTrends.evaluationsSuppressed
                  ? 'Suppressed (< 5)'
                  : aggregatedTrends.totalEvaluationsCount ?? 0}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500 font-semibold">Pre vs. Post Clarity Avg</div>
              <div className="text-xl font-extrabold text-teal-900 mt-1">
                {aggregatedTrends.evaluationsSuppressed
                  ? 'Masked (< 5)'
                  : aggregatedTrends.preAvgScorePct !== null && aggregatedTrends.postAvgScorePct !== null
                  ? `${aggregatedTrends.preAvgScorePct}% -> ${aggregatedTrends.postAvgScorePct}%`
                  : 'No evaluations yet'}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-slate-500 font-semibold">Uncovered Districts</div>
              <div className="text-2xl font-extrabold text-amber-800 mt-1">
                {aggregatedTrends.uncoveredDistricts.length}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900">District Participation Snapshot</div>
              <div className="max-h-44 overflow-y-auto divide-y divide-slate-200/70">
                {aggregatedTrends.participationByDistrict
                  .filter(d => d.verifiedProgrammesCount > 0 || d.suppressedForPrivacy)
                  .map(d => (
                    <div key={d.district} className="py-2 flex items-center justify-between gap-2 tabular-nums">
                      <span className="font-semibold text-slate-800">
                        {d.district} ({d.verifiedProgrammesCount} verified)
                      </span>
                      <span className={d.suppressedForPrivacy ? 'text-amber-800 font-bold' : 'text-teal-900 font-bold'}>
                        {d.suppressedForPrivacy
                          ? 'Suppressed (cohort < 5)'
                          : `${d.totalRegistrations ?? 0} registered`}
                      </span>
                    </div>
                  ))}
                {aggregatedTrends.participationByDistrict.every(
                  d => d.verifiedProgrammesCount === 0 && !d.suppressedForPrivacy
                ) && (
                  <p className="text-slate-500 py-2">
                    No live verified district registrations recorded yet.
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900">Outcome Context &amp; Priority Uncovered Districts</div>
              <p className="text-sm text-slate-700 leading-relaxed">{aggregatedTrends.pastOutcomesSummary}</p>
              {aggregatedTrends.uncoveredDistricts.length > 0 && (
                <div className="pt-1 text-xs text-slate-600">
                  <strong>Districts needing drives:</strong>{' '}
                  {aggregatedTrends.uncoveredDistricts
                    .slice(0, 6)
                    .map(u => u.district)
                    .join(', ')}
                </div>
              )}
            </div>
          </div>

          {localNeeds.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="text-sm font-bold text-slate-900">
                Recent Local Community Needs Observed ({localNeeds.length})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {localNeeds.slice(0, 6).map(item => (
                  <div key={item.id} className="p-3.5 rounded-xl bg-teal-50/50 border border-teal-200/80 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-xs font-bold text-teal-900">
                      <span>{item.district}</span>
                      <span className="text-slate-500 capitalize">{item.category.replace(/_/g, ' ')}</span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{item.observation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Section 1: Interactive Kerala 14-District Service & Survey-Gap Map */}
      <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-800" />
              <span>Kerala 14-District Resource &amp; Evidence-Gap Explorer</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Select any district node to inspect Vimukthi de-addiction units, clinical hubs, demand vs. enforcement context, and explicit survey limitations.
            </p>
          </div>
          <div className="text-xs text-slate-500 tabular-nums">
            14 Districts · Live Directory Sync · Zero Fabricated District %
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive SVG Map + Accessible District Selector */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 flex flex-col items-center">
              <svg
                viewBox="0 0 320 480"
                className="w-full max-w-[290px] h-auto select-none"
                role="img"
                aria-label="Interactive Kerala 14-district resource and evidence-gap map"
              >
                {/* Stylized Kerala Coastal & Western Ghats Silhouette */}
                <path
                  d="M 85 18 L 128 24 L 158 58 L 210 96 L 208 138 L 185 170 L 245 196 L 235 232 L 195 256 L 262 292 L 252 342 L 232 372 L 210 412 L 228 455 L 192 465 L 165 418 L 148 360 L 145 305 L 138 240 L 128 175 L 105 110 L 72 48 Z"
                  fill="#F0FDFA"
                  stroke="#0F766E"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
                {/* Subtle Latitude Guides */}
                <line x1="60" y1="150" x2="260" y2="150" stroke="#CCFBF1" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="60" y1="310" x2="260" y2="310" stroke="#CCFBF1" strokeWidth="1" strokeDasharray="4 4" />
                <text x="64" y="144" fontSize="9" fill="#64748B">North Kerala</text>
                <text x="64" y="304" fontSize="9" fill="#64748B">Central Kerala</text>
                <text x="64" y="454" fontSize="9" fill="#64748B">South Kerala</text>

                {districts.map(d => {
                  const isSelected = d.district === activeDistrict.district;
                  const liveCount = d.liveVerifiedProgrammesCount || 0;
                  return (
                    <g
                      key={d.district}
                      transform={`translate(${d.svgCoords.x}, ${d.svgCoords.y})`}
                      onClick={() => setSelectedDistrictName(d.district)}
                      className="cursor-pointer"
                    >
                      {isSelected && (
                        <circle r="14" fill="#0D9488" fillOpacity="0.18" stroke="#0F766E" strokeWidth="1.5" />
                      )}
                      <circle
                        r={isSelected ? 7.5 : liveCount > 0 ? 6 : 5}
                        fill={isSelected ? '#B45309' : liveCount > 0 ? '#0F766E' : '#475569'}
                        stroke="#FFFFFF"
                        strokeWidth="1.75"
                      />
                      <text
                        x={d.svgCoords.x > 195 ? -10 : 10}
                        y="3"
                        textAnchor={d.svgCoords.x > 195 ? 'end' : 'start'}
                        fontSize={isSelected ? '10.5' : '9'}
                        fontWeight={isSelected ? '700' : '500'}
                        fill={isSelected ? '#0F172A' : '#334155'}
                      >
                        {d.district}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="w-full pt-3 mt-2 border-t border-slate-200 flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-700 inline-block" />
                  Selected District
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-700 inline-block" />
                  Live Verified Drives
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block" />
                  Reference Profile
                </span>
              </div>
            </div>

            {/* Accessible Keyboard District Switcher */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {districts.map(d => {
                const active = d.district === activeDistrict.district;
                return (
                  <button
                    key={d.district}
                    type="button"
                    onClick={() => setSelectedDistrictName(d.district)}
                    className={`px-2.5 py-2 rounded-xl text-left text-xs font-medium transition-colors cursor-pointer truncate border ${
                      active
                        ? 'bg-teal-900 text-white border-teal-900 font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {d.district}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected District Deep Profile */}
          <div className="lg:col-span-7 space-y-5">
            <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div>
                  <div className="text-xs text-slate-500">
                    District Intelligence Profile · Kerala
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">
                    {activeDistrict.district}
                  </h3>
                </div>
                <div className="text-xs text-slate-700 font-mono tabular-nums">
                  Verified Directory Drives: <strong>{activeDistrict.liveVerifiedProgrammesCount ?? 0}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">Primary Vimukthi Hub</div>
                  <p className="text-slate-700 leading-relaxed">{activeDistrict.vimukthiHubUnit}</p>
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-slate-900">Public Clinical &amp; Referral Units</div>
                  <ul className="space-y-0.5 text-slate-700 list-disc list-inside">
                    {activeDistrict.publicClinicalUnits.map(unit => (
                      <li key={unit}>{unit}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-3 text-xs">
                <div>
                  <div className="font-bold text-slate-900 mb-0.5">
                    Service Demand &amp; Enforcement Context
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {activeDistrict.reportedEnforcementOrDemandContext}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
                  <div className="font-bold mb-0.5">Population Survey Gap Notice</div>
                  <p className="leading-relaxed">{activeDistrict.populationSurveyGapNotice}</p>
                </div>

                <div>
                  <div className="font-bold text-teal-900 mb-0.5">
                    Evidence-Aligned Prevention Focus
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {activeDistrict.recommendedPreventionFocus}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                <span className="text-[11px] text-slate-500">
                  Helplines: Vimukthi 14405 · Tele-MANAS 14416 · DISHA 1056
                </span>
                {onStartIdeaForDistrict ? (
                  <button
                    type="button"
                    onClick={() =>
                      onStartIdeaForDistrict(
                        activeDistrict.district,
                        activeDistrict.recommendedPreventionFocus
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-900 hover:bg-teal-950 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                  >
                    <span>Draft Strategy Idea for {activeDistrict.district}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : onNavigateTab ? (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('strategy_lab')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-900 hover:bg-teal-950 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                  >
                    <span>Open Strategy Lab</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Epidemiological, Treatment & Enforcement Evidence Explorer */}
      <section className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-800" />
              <span>National &amp; State Substance-Use Indicators</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Filter by indicator type, geography, urban-rural context, and substance class. Click Methodology on any card for full survey limitations.
            </p>
          </div>
          <div className="text-xs text-slate-500 tabular-nums">
            Showing {filteredMetrics.length} of {metrics.length} indicators
          </div>
        </div>

        {/* Interactive Category Segmented Filter */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Categories
          </button>
          {(Object.keys(EVIDENCE_CATEGORY_META) as EvidenceIndicatorCategory[]).map(catKey => (
            <button
              key={catKey}
              type="button"
              onClick={() => setSelectedCategory(catKey)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === catKey
                  ? 'bg-teal-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {EVIDENCE_CATEGORY_META[catKey].label}
            </button>
          ))}
        </div>

        {/* Category Definition & Interpretation Warning Banner when Category Selected */}
        {activeCategoryMeta && (
          <div className="p-4 rounded-2xl bg-white border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="font-bold text-slate-900 mb-0.5">What This Indicator Measures</div>
              <p className="text-slate-600 leading-relaxed">{activeCategoryMeta.definition}</p>
            </div>
            <div>
              <div className="font-bold text-amber-900 mb-0.5">Critical Interpretation Warning</div>
              <p className="text-slate-700 leading-relaxed">{activeCategoryMeta.interpretationWarning}</p>
            </div>
          </div>
        )}

        {/* Secondary Search & Scope Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search alcohol, inhalants, rural, youth, NMHS..."
              className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-teal-700"
            />
          </div>

          <select
            value={selectedScope}
            onChange={e =>
              setSelectedScope(
                e.target.value as 'all' | 'Kerala' | 'India' | 'Sub-Population' | 'Global Comparison'
              )
            }
            aria-label="Filter by geographic scope"
            className="px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-teal-700"
          >
            <option value="all">All Geographies (Kerala, India, Global)</option>
            <option value="Kerala">Kerala State Focus</option>
            <option value="India">India National Surveys</option>
            <option value="Sub-Population">Adolescent / Sub-Populations</option>
            <option value="Global Comparison">Global Reference (UNODC / WHO)</option>
          </select>

          <select
            value={selectedSubstance}
            onChange={e => setSelectedSubstance(e.target.value)}
            aria-label="Filter by substance category"
            className="px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:border-teal-700"
          >
            <option value="all">All Substance Categories</option>
            {substanceOptions.map(sub => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        {/* Indicator Cards Grid */}
        {filteredMetrics.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredMetrics.map(item => {
              const catMeta = EVIDENCE_CATEGORY_META[item.category];
              const isExpanded = expandedMetricId === item.id;
              return (
                <article
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Unboxed clean metadata row */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-teal-800">{catMeta.label}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.geography}</span>
                      <span aria-hidden="true">·</span>
                      <span>{item.substanceCategory}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {item.indicator}
                    </h3>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="text-[11px] font-semibold text-slate-500">Reported Finding</div>
                      <div className="text-lg font-extrabold text-slate-900 font-mono tabular-nums mt-0.5">
                        {item.value}
                      </div>
                    </div>

                    <div className="text-xs text-slate-700 space-y-1.5 leading-relaxed">
                      <div>
                        <strong className="text-slate-900">Population / Age Group: </strong>
                        <span>{item.populationOrAgeGroup}</span>
                      </div>
                      <div>
                        <strong className="text-slate-900">Urban vs. Rural &amp; Context: </strong>
                        <span>{item.urbanRuralNote}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                      <span className="truncate">
                        Data: {item.collectionYear} · Published: {item.publicationYear}
                      </span>
                      <button
                        type="button"
                        onClick={() => setExpandedMetricId(isExpanded ? null : item.id)}
                        className="font-bold text-teal-800 hover:underline shrink-0 cursor-pointer"
                      >
                        {isExpanded ? 'Hide Source & Limitations' : 'Source & Limitations'}
                      </button>
                    </div>

                    {isExpanded && (
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-700">
                        <div>
                          <strong className="text-slate-900">Source: </strong>
                          <span>{item.source}</span>
                        </div>
                        <div>
                          <strong className="text-slate-900">Methodology: </strong>
                          <span>{item.methodology}</span>
                        </div>
                        <div className="text-amber-950">
                          <strong>Known Limitations: </strong>
                          <span>{item.limitations}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2">
            <p className="text-sm font-bold text-slate-800">No intelligence indicators match these filters</p>
            <p className="text-xs text-slate-500">Reset the search text or select All Categories to view the complete dataset.</p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedScope('all');
                setSelectedSubstance('all');
                setSearchQuery('');
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* Section 3: Community Risk & Protective Factors Needs Matrix */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-teal-800" />
              <span>Protective Environments &amp; Structural Vulnerability Factors</span>
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Guides where communities should invest support systems—never used to profile or label individual young people.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start">
            {(
              [
                { id: 'all', label: 'All Factors' },
                { id: 'protective', label: 'Protective' },
                { id: 'vulnerability_association', label: 'Structural Gaps' },
              ] as const
            ).map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFactorFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                  factorFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredFactors.map(factor => (
            <div
              key={factor.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                <span
                  className={`font-bold ${
                    factor.factorType === 'protective' ? 'text-emerald-800' : 'text-amber-800'
                  }`}
                >
                  {factor.factorType === 'protective' ? 'Protective Factor' : 'Vulnerability Association'}
                </span>
                <span className="truncate">{factor.sourceRef}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{factor.dimension}</h3>
              <p className="text-slate-700 leading-relaxed">{factor.summary}</p>
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div>
                  <strong className="text-slate-900">Mechanism: </strong>
                  <span className="text-slate-600">{factor.populationLevelMechanism}</span>
                </div>
                <div>
                  <strong className="text-teal-900">Actionable Prevention Target: </strong>
                  <span className="text-slate-800">{factor.preventionTarget}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Ethical Guardrail: {factor.ethicalNote}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer Ethics Note */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
        <ShieldCheck className="w-5 h-5 text-teal-800 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900">Zero Role 01 Leakage Guarantee: </strong>
          All research metrics come strictly from national/state public-health publications and verified facility registries. Private individual recovery journals and clinical vault records never cross into Role 04.
        </div>
      </div>
    </div>
  );
};
