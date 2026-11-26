import React, { useMemo, useState } from 'react';
import {
  SUBSTANCE_CATALOGUE_ITEMS,
  SUBSTANCE_GROUPS,
  SubstanceCatalogueItem,
} from '../constants/substanceCatalogue';
import { SubstanceConcernRecord } from '../types';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Pill,
  HelpCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

interface Props {
  concerns: SubstanceConcernRecord[];
  onUpsertConcern: (concern: SubstanceConcernRecord) => void;
  onRemoveConcern: (id: string) => void;
  compactHeader?: boolean;
  supporterContext?: boolean;
}

export const SubstanceIdentificationPanel: React.FC<Props> = ({
  concerns,
  onUpsertConcern,
  onRemoveConcern,
  compactHeader = false,
  supporterContext = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    alcohol_nicotine_cannabis: true,
    opioids: false,
    stimulants: false,
    sedatives_sleep: false,
    inhalants_hallucinogens_dissociatives: false,
    synthetic_medicines_other: false,
  });
  const [showExpandedCatalogue, setShowExpandedCatalogue] = useState(false);
  const [multipleConcernMode, setMultipleConcernMode] = useState<'unsure' | 'single' | 'multiple'>(
    concerns.length > 1 ? 'multiple' : concerns.length === 1 ? 'single' : 'unsure'
  );

  // Custom "Unlisted / New Substance" flow
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customText, setCustomText] = useState('');
  const [customExplanation, setCustomExplanation] = useState('');
  const [matchingCustom, setMatchingCustom] = useState(false);
  const [proposedMatch, setProposedMatch] = useState<{
    rawText: string;
    explanationText: string;
    matchedEntry: { id: string; number: number; name: string; isMedication: boolean; parentName?: string } | null;
    confidence: 'high' | 'possible' | 'none';
    explanation: string;
    catalogueVersion: string;
  } | null>(null);

  // Prescription editing modal/inline state
  const [editingRxId, setEditingRxId] = useState<string | null>(null);

  const selectedCatalogueIds = useMemo(
    () => new Set(concerns.map(c => c.catalogueId)),
    [concerns]
  );

  const q = searchQuery.trim().toLowerCase();

  const primaryItems = useMemo(
    () => SUBSTANCE_CATALOGUE_ITEMS.filter(item => item.tier === 'primary'),
    []
  );
  const expandedItems = useMemo(
    () => SUBSTANCE_CATALOGUE_ITEMS.filter(item => item.tier === 'expanded'),
    []
  );

  const searchResults = useMemo(() => {
    if (!q) return [];
    return SUBSTANCE_CATALOGUE_ITEMS.filter(
      it =>
        it.name.toLowerCase().includes(q) ||
        it.keywords.some(k => k.toLowerCase().includes(q)) ||
        (it.parentName && it.parentName.toLowerCase().includes(q))
    );
  }, [q]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const allGroupsExpanded = SUBSTANCE_GROUPS.every(g => Boolean(expandedGroups[g.id]));
  const toggleAllGroups = () => {
    const nextVal = !allGroupsExpanded;
    const nextState: Record<string, boolean> = {};
    SUBSTANCE_GROUPS.forEach(g => {
      nextState[g.id] = nextVal;
    });
    setExpandedGroups(nextState);
    if (nextVal) setShowExpandedCatalogue(true);
  };

  const handleToggleCatalogueItem = (item: SubstanceCatalogueItem) => {
    const existing = concerns.find(c => c.catalogueId === item.id);
    if (existing) {
      onRemoveConcern(existing.id);
      if (editingRxId === existing.id) setEditingRxId(null);
      return;
    }
    const now = new Date().toISOString();
    const rec: SubstanceConcernRecord = {
      id: `subc-${item.id}-${Date.now().toString(36)}`,
      catalogueId: item.id,
      catalogueNumber: item.number,
      name: item.name,
      parentCategory: item.parentName,
      isExpandedEntry: item.tier === 'expanded',
      isCustom: false,
      verificationStatus: 'catalogue',
      isMedication: item.isMedication,
      createdAt: now,
      updatedAt: now,
    };
    onUpsertConcern(rec);
    if (item.isMedication) {
      setEditingRxId(rec.id);
    }
  };

  const handleDirectCustomAdd = (nameText: string, explanationText?: string) => {
    const cleanName = nameText.trim();
    if (!cleanName) return;
    const now = new Date().toISOString();
    const record: SubstanceConcernRecord = {
      id: `subc-unverified-${Date.now().toString(36)}`,
      catalogueId: 'custom',
      name: cleanName,
      isCustom: true,
      customOriginalText: cleanName,
      customExplanation: explanationText?.trim() || undefined,
      userConfirmedMatch: false,
      verificationStatus: 'unverified',
      isMedication: false,
      createdAt: now,
      updatedAt: now,
    };
    onUpsertConcern(record);
    setCustomText('');
    setCustomExplanation('');
    setProposedMatch(null);
    setShowCustomForm(false);
    setSearchQuery('');
  };

  const handleCheckCustomSubstance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    setMatchingCustom(true);
    try {
      const res = await fetch('/api/substances/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: customText.trim() }),
      });
      const data = await res.json();
      setProposedMatch({
        rawText: customText.trim(),
        explanationText: customExplanation.trim(),
        matchedEntry: data.matchedEntry || null,
        confidence: data.confidence || 'none',
        explanation: data.explanation || 'Saved verbatim as Unverified.',
        catalogueVersion: data.catalogueVersion || 'ClearPath-Ref-2026.1',
      });
    } catch {
      setProposedMatch({
        rawText: customText.trim(),
        explanationText: customExplanation.trim(),
        matchedEntry: null,
        confidence: 'none',
        explanation: 'Could not reach reference catalogue; preserved verbatim as Unverified.',
        catalogueVersion: 'ClearPath-Ref-2026.1',
      });
    } finally {
      setMatchingCustom(false);
    }
  };

  const finalizeCustomEntry = (confirmSuggestedMatch: boolean) => {
    if (!proposedMatch) return;
    const now = new Date().toISOString();
    const matched = proposedMatch.matchedEntry;
    const record: SubstanceConcernRecord =
      confirmSuggestedMatch && matched
        ? {
            id: `subc-custom-${Date.now().toString(36)}`,
            catalogueId: matched.id,
            catalogueNumber: matched.number,
            name: matched.name,
            parentCategory: matched.parentName,
            isCustom: true,
            customOriginalText: proposedMatch.rawText,
            customExplanation: proposedMatch.explanationText || undefined,
            matchedCatalogueId: matched.id,
            matchedName: matched.name,
            matchConfidence: proposedMatch.confidence,
            userConfirmedMatch: true,
            verificationStatus: 'matched_confirmed',
            isMedication: matched.isMedication,
            createdAt: now,
            updatedAt: now,
          }
        : {
            id: `subc-unverified-${Date.now().toString(36)}`,
            catalogueId: 'custom',
            name: proposedMatch.rawText,
            isCustom: true,
            customOriginalText: proposedMatch.rawText,
            customExplanation: proposedMatch.explanationText || undefined,
            matchedCatalogueId: matched?.id,
            matchedName: matched?.name,
            matchConfidence: proposedMatch.confidence,
            userConfirmedMatch: false,
            verificationStatus: 'unverified',
            isMedication: false,
            createdAt: now,
            updatedAt: now,
          };

    onUpsertConcern(record);
    setCustomText('');
    setCustomExplanation('');
    setProposedMatch(null);
    setShowCustomForm(false);
    if (record.isMedication) setEditingRxId(record.id);
  };

  const updatePrescriptionField = (
    concern: SubstanceConcernRecord,
    field: 'prescribedByProfessional' | 'concernNature' | 'discussingWithClinician',
    value: string
  ) => {
    const existingRx = concern.prescriptionDetails || {
      prescribedByProfessional: 'not_sure',
      concernNature: 'not_sure',
      discussingWithClinician: 'not_sure',
    };
    onUpsertConcern({
      ...concern,
      prescriptionDetails: {
        ...existingRx,
        [field]: value,
      } as SubstanceConcernRecord['prescriptionDetails'],
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4">
      {!compactHeader && (
        <div className="space-y-1">
          <h3 className="text-base font-extrabold text-slate-900">
            {supporterContext
              ? 'Which substance or medicine are you concerned about?'
              : 'Substance Identification & Prescription Context'}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Search and select any substance or medicine below, select multiple if needed, or add an unlisted / unfamiliar substance in one tap. Selecting a medicine never implies misuse.
          </p>
        </div>
      )}

      {/* Single vs Multiple vs Unsure selector */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-200">
        <span className="text-[11px] font-bold text-slate-700 mr-1">
          Concern covers:
        </span>
        {(
          [
            { id: 'single', label: 'One substance / medicine' },
            { id: 'multiple', label: 'Multiple concerns' },
            { id: 'unsure', label: 'I am unsure / not identified yet' },
          ] as const
        ).map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setMultipleConcernMode(opt.id)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
              multipleConcernMode === opt.id
                ? 'bg-indigo-950 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Selected Structured Records */}
      {concerns.length > 0 && (
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-indigo-950">
              Selected Concern Records ({concerns.length})
            </span>
            <span className="text-[11px] text-indigo-800 font-semibold">
              Stored separately for accurate reports
            </span>
          </div>
          <div className="space-y-2.5">
            {concerns.map(c => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl bg-white border border-indigo-200/80 space-y-2.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900">
                        {c.catalogueNumber ? `#${c.catalogueNumber} · ` : ''}
                        {c.name}
                      </span>
                      {c.parentCategory && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          Category: {c.parentCategory}
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          c.verificationStatus === 'unverified'
                            ? 'bg-amber-100 text-amber-900'
                            : c.verificationStatus === 'clinician_reviewed'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-indigo-100 text-indigo-900'
                        }`}
                      >
                        {c.verificationStatus === 'unverified'
                          ? 'Unverified (Custom description preserved)'
                          : c.verificationStatus === 'matched_confirmed'
                          ? 'Confirmed match from custom entry'
                          : c.verificationStatus === 'clinician_reviewed'
                          ? 'Clinician Reviewed'
                          : 'Verified Catalogue Entry'}
                      </span>
                    </div>
                    {c.customOriginalText && (
                      <p className="text-[11px] text-slate-600">
                        Original description: &ldquo;{c.customOriginalText}&rdquo;
                        {c.customExplanation ? ` — ${c.customExplanation}` : ''}
                      </p>
                    )}
                    {c.clinicianReviewNote && (
                      <p className="text-[11px] text-emerald-800 font-medium">
                        Clinician note ({c.reviewedByTherapistName}): {c.clinicianReviewNote}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {c.isMedication && (
                      <button
                        type="button"
                        onClick={() => setEditingRxId(editingRxId === c.id ? null : c.id)}
                        className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Pill className="w-3 h-3" />
                        <span>{editingRxId === c.id ? 'Hide Rx Context' : 'Prescription Context'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onRemoveConcern(c.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Remove entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Prescription Distinction Section (Medication entries) */}
                {c.isMedication && (editingRxId === c.id || !c.prescriptionDetails) && (
                  <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3 text-xs">
                    <div className="flex items-center gap-1.5 font-extrabold text-amber-950">
                      <Pill className="w-3.5 h-3.5 text-amber-700" />
                      <span>Prescription Context (Optional — helps distinguish prescribed treatment)</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-800">
                        1. Was this prescribed by a healthcare professional?
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            { id: 'yes', label: 'Yes' },
                            { id: 'no', label: 'No' },
                            { id: 'not_sure', label: 'Not sure' },
                            { id: 'prefer_not_to_answer', label: 'Prefer not to answer' },
                          ] as const
                        ).map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => updatePrescriptionField(c, 'prescribedByProfessional', opt.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                              c.prescriptionDetails?.prescribedByProfessional === opt.id
                                ? 'bg-indigo-950 text-white'
                                : 'bg-white border border-slate-200 text-slate-700'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-800">
                        2. Are you concerned about taking it as prescribed, taking it differently from directions, or an unwanted effect?
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            { id: 'as_prescribed', label: 'Taking as prescribed' },
                            { id: 'differently_from_directions', label: 'Differently from directions' },
                            { id: 'unwanted_effect', label: 'Unwanted effect / side effect' },
                            { id: 'not_sure', label: 'Not sure' },
                            { id: 'prefer_not_to_answer', label: 'Prefer not to answer' },
                          ] as const
                        ).map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => updatePrescriptionField(c, 'concernNature', opt.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                              c.prescriptionDetails?.concernNature === opt.id
                                ? 'bg-indigo-950 text-white'
                                : 'bg-white border border-slate-200 text-slate-700'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-slate-800">
                        3. Are you currently discussing this medication with a healthcare professional?
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {(
                          [
                            { id: 'yes', label: 'Yes' },
                            { id: 'no', label: 'No' },
                            { id: 'not_sure', label: 'Not sure' },
                            { id: 'prefer_not_to_answer', label: 'Prefer not to answer' },
                          ] as const
                        ).map(opt => (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => updatePrescriptionField(c, 'discussingWithClinician', opt.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                              c.prescriptionDetails?.discussingWithClinician === opt.id
                                ? 'bg-indigo-950 text-white'
                                : 'bg-white border border-slate-200 text-slate-700'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Custom Trigger */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search 50 drugs & medicines (e.g., Alcohol, Tramadol, Alprazolam, Cannabis)..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            if (!showCustomForm && searchQuery.trim() && !customText.trim()) {
              setCustomText(searchQuery.trim());
            }
            setShowCustomForm(v => !v);
          }}
          className="px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 text-xs font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-700" />
          <span>Add Unlisted / Custom Drug</span>
        </button>
      </div>

      {/* Custom Substance Input Form */}
      {showCustomForm && (
        <form
          onSubmit={handleCheckCustomSubstance}
          className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-700" />
              <span>Add Unlisted / New Substance Description</span>
            </div>
            <button
              type="button"
              onClick={() => setShowCustomForm(false)}
              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Close
            </button>
          </div>
          <p className="text-[11px] text-amber-900">
            Not in the 50-item list? Type the name, street/local term, or packet description below and add it directly in 1 click—or compare with the reference catalogue first.
          </p>
          <input
            type="text"
            value={customText}
            onChange={e => {
              setCustomText(e.target.value);
              if (proposedMatch) setProposedMatch(null);
            }}
            placeholder="Type substance name, local name, tablet imprint, or description..."
            required
            className="w-full px-3 py-2.5 rounded-xl border border-amber-300 bg-white text-xs text-slate-900"
          />
          <textarea
            rows={2}
            value={customExplanation}
            onChange={e => setCustomExplanation(e.target.value)}
            placeholder="Optional notes (form, colour, packaging, or how it feels — never judged)..."
            className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs text-slate-900"
          />

          {!proposedMatch ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCustomForm(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={matchingCustom || !customText.trim()}
                className="px-3.5 py-2 rounded-xl bg-white border border-indigo-300 hover:bg-indigo-50 text-indigo-950 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {matchingCustom ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-indigo-700" />}
                <span>Check 50-Drug Reference Catalogue First</span>
              </button>
              <button
                type="button"
                disabled={!customText.trim()}
                onClick={() => handleDirectCustomAdd(customText, customExplanation)}
                className="px-4 py-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 disabled:opacity-50 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-300" />
                <span>Add Directly to My List</span>
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-white border border-amber-300 space-y-2.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-indigo-700" />
                <span>Reference Catalogue Comparison ({proposedMatch.catalogueVersion})</span>
              </div>
              <p className="text-slate-700">{proposedMatch.explanation}</p>
              {proposedMatch.matchedEntry ? (
                <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="font-bold text-indigo-950">
                      Proposed Category: #{proposedMatch.matchedEntry.number} {proposedMatch.matchedEntry.name}
                    </div>
                    <div className="text-[11px] text-indigo-800">
                      Is this what you meant?
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => finalizeCustomEntry(true)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-950 text-white text-[11px] font-bold cursor-pointer"
                    >
                      Yes, Confirm Match
                    </button>
                    <button
                      type="button"
                      onClick={() => finalizeCustomEntry(false)}
                      className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-950 text-[11px] font-bold cursor-pointer"
                    >
                      No, Keep as Unverified
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setProposedMatch(null)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 cursor-pointer"
                  >
                    Edit Text
                  </button>
                  <button
                    type="button"
                    onClick={() => finalizeCustomEntry(false)}
                    className="px-4 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold cursor-pointer"
                  >
                    Save as &ldquo;Unverified&rdquo; Description
                  </button>
                </div>
              )}
            </div>
          )}
        </form>
      )}

      {/* Search Results OR Grouped 25 Primary + Expandable 25 Expanded */}
      {q ? (
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] font-bold text-slate-500">
              Search matches ({searchResults.length})
            </div>
            <button
              type="button"
              onClick={() => handleDirectCustomAdd(searchQuery)}
              className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add &ldquo;{searchQuery.trim()}&rdquo; directly as new custom substance</span>
            </button>
          </div>
          {searchResults.length === 0 ? (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <span>No exact name found in the 50-item catalogue for &ldquo;{searchQuery.trim()}&rdquo;.</span>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleDirectCustomAdd(searchQuery)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-950 text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-300" />
                  <span>Add &ldquo;{searchQuery.trim()}&rdquo; Now</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomText(searchQuery.trim());
                    setProposedMatch(null);
                    setShowCustomForm(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-amber-100 text-amber-950 font-bold text-[11px] cursor-pointer"
                >
                  Open with notes / Compare catalogue
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {searchResults.map(it => {
                const active = selectedCatalogueIds.has(it.id);
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => handleToggleCatalogueItem(it)}
                    className={`p-2.5 rounded-xl border text-left text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      active
                        ? 'bg-indigo-950 border-indigo-950 text-white font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div>
                        #{it.number}. {it.name}
                      </div>
                      {it.parentName && (
                        <div className={`text-[10px] ${active ? 'text-amber-300' : 'text-slate-500'}`}>
                          Under: {it.parentName}
                        </div>
                      )}
                    </div>
                    {active && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Browse 50 Substances &amp; Medications by Category
            </span>
            <button
              type="button"
              onClick={toggleAllGroups}
              className="text-[11px] font-bold text-indigo-800 hover:underline cursor-pointer"
            >
              {allGroupsExpanded ? 'Collapse All Categories' : 'Expand All 6 Categories'}
            </button>
          </div>
          {/* Primary 25 grouped cleanly into 6 expandable categories */}
          <div className="space-y-2">
            {SUBSTANCE_GROUPS.map(grp => {
              const items = primaryItems.filter(it => it.group === grp.id);
              const isOpen = Boolean(expandedGroups[grp.id]);
              const selectedCount = items.filter(it => selectedCatalogueIds.has(it.id)).length;

              return (
                <div key={grp.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleGroup(grp.id)}
                    className="w-full px-4 py-3 flex items-center justify-between gap-2 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-extrabold text-slate-900">
                        {grp.label}
                        {selectedCount > 0 && (
                          <span className="ml-2 text-[11px] text-indigo-700 font-bold">
                            · {selectedCount} selected
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{grp.description}</div>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="p-3 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50/40">
                      {items.map(item => {
                        const active = selectedCatalogueIds.has(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleToggleCatalogueItem(item)}
                            className={`mt-2 p-2.5 rounded-xl border text-left text-xs flex items-center justify-between gap-2 cursor-pointer transition-all ${
                              active
                                ? 'bg-indigo-950 border-indigo-950 text-white font-bold shadow-xs'
                                : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300'
                            }`}
                          >
                            <div className="min-w-0">
                              <span className="font-mono text-[10px] opacity-70 mr-1">
                                {item.number}.
                              </span>
                              <span>{item.name}</span>
                              {item.isMedication && (
                                <span
                                  className={`ml-1.5 text-[10px] ${
                                    active ? 'text-amber-300' : 'text-amber-700'
                                  }`}
                                >
                                  (Medicine)
                                </span>
                              )}
                            </div>
                            {active && <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Expandable "More substances and medicines" (26-50) */}
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/30 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowExpandedCatalogue(v => !v)}
              className="w-full px-4 py-3 flex items-center justify-between gap-2 text-left hover:bg-indigo-50/60 transition-colors cursor-pointer"
            >
              <div>
                <div className="text-xs font-extrabold text-indigo-950">
                  More substances and medicines (Specific generic medicines &amp; 25 expanded entries)
                </div>
                <div className="text-[11px] text-slate-600">
                  Includes specific pain, sedative, sleeping, ADHD, or novel substances linked to their parent category.
                </div>
              </div>
              {showExpandedCatalogue ? (
                <ChevronUp className="w-4 h-4 text-indigo-700 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-indigo-700 shrink-0" />
              )}
            </button>
            {showExpandedCatalogue && (
              <div className="p-3 pt-2 border-t border-indigo-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {expandedItems.map(item => {
                  const active = selectedCatalogueIds.has(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleToggleCatalogueItem(item)}
                      className={`p-2.5 rounded-xl border text-left text-xs flex items-center justify-between gap-2 cursor-pointer transition-all ${
                        active
                          ? 'bg-indigo-950 border-indigo-950 text-white font-bold'
                          : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div>
                          <span className="font-mono text-[10px] opacity-70 mr-1">
                            {item.number}.
                          </span>
                          {item.name}
                        </div>
                        {item.parentName && (
                          <div
                            className={`text-[10px] truncate ${
                              active ? 'text-amber-300' : 'text-slate-500'
                            }`}
                          >
                            Parent: {item.parentName}
                          </div>
                        )}
                      </div>
                      {active && <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
        <AlertCircle className="w-3.5 h-3.5 text-indigo-700 shrink-0 mt-0.5" />
        <span>
          Clinical identification options only. Prescribed medicines may serve essential medical care — listing a medicine here never generates an automatic assumption of misuse.
        </span>
      </div>
    </div>
  );
};
