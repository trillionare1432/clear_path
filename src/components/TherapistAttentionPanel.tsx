import React, { useState } from 'react';
import { CompactAiRecommendationBar, TherapistAttentionItem } from '../types';
import {
  AlertTriangle,
  ArrowRight,
  Clock,
  Eye,
  FileLock2,
  Sparkles,
  Target,
} from 'lucide-react';

interface TherapistAttentionPanelProps {
  items: TherapistAttentionItem[];
  onSelectClient: (userId: string) => void;
  nightSurface?: boolean;
}

const PRIORITY_META: Record<
  TherapistAttentionItem['priorityLevel'],
  { label: string; lightClass: string; darkClass: string }
> = {
  urgent: {
    label: 'Urgent',
    lightClass: 'bg-rose-100 text-rose-900',
    darkClass: 'bg-rose-950 text-rose-200 border border-rose-800',
  },
  follow_up_due: {
    label: 'Follow-Up Due',
    lightClass: 'bg-amber-100 text-amber-950',
    darkClass: 'bg-amber-950 text-amber-200 border border-amber-800',
  },
  needs_review: {
    label: 'Needs Review',
    lightClass: 'bg-purple-100 text-[#4A154B]',
    darkClass: 'bg-[#342444] text-purple-200',
  },
  routine: {
    label: 'Routine',
    lightClass: 'bg-emerald-100 text-emerald-900',
    darkClass: 'bg-emerald-950 text-emerald-200 border border-emerald-800',
  },
};

export const TherapistAttentionPanel: React.FC<TherapistAttentionPanelProps> = ({
  items,
  onSelectClient,
  nightSurface = false,
}) => {
  const [filterPriority, setFilterPriority] = useState<'all' | TherapistAttentionItem['priorityLevel']>('all');

  const surfaceClass = nightSurface
    ? 'bg-[#1D1528] border border-[#342444] text-[#F5F0FA]'
    : 'bg-white border border-[#E6DFEC] text-[#1E1426]';
  const subtleClass = nightSurface
    ? 'bg-[#261B35] border border-[#3B2A50]'
    : 'bg-[#FAF8FC] border border-[#E6DFEC]';
  const mutedClass = nightSurface ? 'text-[#C4B5D6]' : 'text-[#5E4B6E]';

  const visibleItems = items.filter(
    i => filterPriority === 'all' || i.priorityLevel === filterPriority
  );

  const urgentCount = items.filter(i => i.priorityLevel === 'urgent').length;
  const followUpCount = items.filter(i => i.priorityLevel === 'follow_up_due').length;

  return (
    <section className={`${surfaceClass} rounded-2xl p-5 space-y-4 text-sm`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-inherit">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#059669]">
            <AlertTriangle className="w-4 h-4" />
            <span>Clinician Attention Queue</span>
          </div>
          <h2 className="text-lg font-bold mt-0.5">
            Priority Follow-Up &amp; Review List ({items.length})
          </h2>
          <p className={`text-sm mt-1 ${mutedClass}`}>
            Ordered by unread messages, recent difficult check-ins, overdue plans, and unreviewed logs so nothing urgent gets missed.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: `All (${items.length})` },
              { id: 'urgent', label: `Urgent (${urgentCount})` },
              { id: 'follow_up_due', label: `Follow-Up (${followUpCount})` },
              { id: 'needs_review', label: 'Needs Review' },
              { id: 'routine', label: 'Routine' },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterPriority(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold tabular-nums whitespace-nowrap cursor-pointer ${
                filterPriority === tab.id
                  ? 'bg-[#4A154B] text-white'
                  : `${subtleClass} ${mutedClass}`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {visibleItems.length === 0 ? (
        <p className={mutedClass}>
          {items.length === 0
            ? 'No active Role 01 clients in caseload yet.'
            : 'No clients match this priority filter.'}
        </p>
      ) : (
        <div className="space-y-3">
          {visibleItems.slice(0, 8).map(item => {
            const meta = PRIORITY_META[item.priorityLevel];
            return (
              <div
                key={item.userId}
                className={`p-4 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${subtleClass}`}
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-extrabold uppercase px-2.5 py-0.5 rounded-md ${
                        nightSurface ? meta.darkClass : meta.lightClass
                      }`}
                    >
                      {meta.label}
                    </span>
                    <span className="font-bold text-base">{item.name}</span>
                    <span className={`tabular-nums text-xs ${mutedClass}`}>
                      @{item.username} · {item.district} · Priority {item.attentionScore}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-medium">
                    {item.reasons.map((r, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                        <span>{r}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className={`text-xs tabular-nums flex items-center gap-2 ${mutedClass}`}>
                    <span>{item.unreadMessagesCount} unread</span>
                    <span>·</span>
                    <span>{item.unreviewedLogsCount} logs</span>
                    <span>·</span>
                    <span>{item.overdueFollowUpsCount} due</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectClient(item.userId)}
                    className="px-4 py-2 rounded-xl bg-[#4A154B] hover:bg-[#3A103B] text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <span>Open Case</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

interface CompactAiRecommendationBarViewProps {
  bar: CompactAiRecommendationBar;
  onDraftPlanProposal: () => void;
  onOpenClinicalVault: () => void;
  nightSurface?: boolean;
}

export const CompactAiRecommendationBarView: React.FC<CompactAiRecommendationBarViewProps> = ({
  bar,
  onDraftPlanProposal,
  onOpenClinicalVault,
  nightSurface = false,
}) => {
  const surfaceClass = nightSurface
    ? 'bg-[#261B35] border border-[#3B2A50] text-[#F5F0FA]'
    : 'bg-[#F5F1F9] border border-[#DFD5EB] text-[#1E1426]';
  const mutedClass = nightSurface ? 'text-[#C4B5D6]' : 'text-[#5E4B6E]';

  return (
    <section className={`${surfaceClass} rounded-2xl p-4 sm:p-5 space-y-3 text-sm`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#059669]">
            <Sparkles className="w-4 h-4" />
            <span>Suggested Next Steps · Requires Your Clinical Review</span>
          </div>
          <div className="text-base font-bold">{bar.headline}</div>
          <p className={`text-sm ${mutedClass}`}>{bar.reasoning}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onDraftPlanProposal}
            className="px-4 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Target className="w-3.5 h-3.5" />
            <span>Draft Support Plan</span>
          </button>
          <button
            type="button"
            onClick={onOpenClinicalVault}
            className="px-3.5 py-2 rounded-xl bg-[#4A154B] hover:bg-[#3A103B] text-white text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <FileLock2 className="w-3.5 h-3.5" />
            <span>Private Notes Vault</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-inherit text-xs">
        <div className="space-y-1">
          <div className="font-bold flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-[#4A154B]" />
            <span>Recent Changes</span>
          </div>
          {bar.detectedChanges.length === 0 ? (
            <div className={mutedClass}>None flagged</div>
          ) : (
            <ul className={`list-disc pl-4 space-y-0.5 ${mutedClass}`}>
              {bar.detectedChanges.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-1">
          <div className="font-bold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Follow-Ups &amp; Missing Info</span>
          </div>
          <ul className={`list-disc pl-4 space-y-0.5 ${mutedClass}`}>
            {bar.overdueFollowUps.slice(0, 2).map((item, idx) => (
              <li key={`od-${idx}`}>{item}</li>
            ))}
            {bar.missingInfo.slice(0, 2).map((item, idx) => (
              <li key={`mi-${idx}`}>{item}</li>
            ))}
            {bar.overdueFollowUps.length === 0 && bar.missingInfo.length === 0 && (
              <li>All shared records up to date</li>
            )}
          </ul>
        </div>

        <div className="space-y-1">
          <div className="font-bold">Recommended Action</div>
          <p className={mutedClass}>{bar.suggestedActionForClinician}</p>
          {bar.possibleConcern && (
            <p className="text-amber-700 font-semibold">{bar.possibleConcern}</p>
          )}
        </div>
      </div>
    </section>
  );
};
