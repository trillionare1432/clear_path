import React, { useEffect, useState } from 'react';
import { CarePlanProposalClient, CarePlanProposalStatus } from '../types';
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  MessageSquare,
  Send,
  XCircle,
} from 'lucide-react';

interface DraftSeed {
  title?: string;
  objectives?: string[];
  routines?: string[];
  recommendations?: string[];
  rationale?: string;
}

interface CarePlanProposalPanelProps {
  mode: 'user' | 'therapist';
  serverAuthToken: string | null;
  proposals: CarePlanProposalClient[];
  clientId?: string;
  clientName?: string;
  draftSeed?: DraftSeed | null;
  onUpdated: () => void;
  nightSurface?: boolean;
}

const STATUS_LABELS: Record<CarePlanProposalStatus, string> = {
  proposed: 'Proposed by Clinician',
  user_reviewed: 'Reviewed by You',
  acknowledged: 'Acknowledged',
  agreed: 'Agreed & Synced',
  active: 'Active Care Plan',
  declined: 'Revision Requested / Declined',
};

export const CarePlanProposalPanel: React.FC<CarePlanProposalPanelProps> = ({
  mode,
  serverAuthToken,
  proposals,
  clientId,
  clientName,
  draftSeed,
  onUpdated,
  nightSurface = false,
}) => {
  // Therapist Composer state
  const [title, setTitle] = useState('Collaborative Routine & Recovery Adjustment');
  const [objectivesText, setObjectivesText] = useState('');
  const [routinesText, setRoutinesText] = useState('');
  const [recommendationsText, setRecommendationsText] = useState('');
  const [rationale, setRationale] = useState('');
  const [reviewDate, setReviewDate] = useState(
    () => new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Client response state
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!draftSeed) return;
    if (draftSeed.title) setTitle(draftSeed.title);
    if (draftSeed.objectives?.length) setObjectivesText(draftSeed.objectives.join('\n'));
    if (draftSeed.routines?.length) setRoutinesText(draftSeed.routines.join('\n'));
    if (draftSeed.recommendations?.length) {
      setRecommendationsText(draftSeed.recommendations.join('\n'));
    }
    if (draftSeed.rationale) setRationale(draftSeed.rationale);
  }, [draftSeed]);

  const cardSurface = nightSurface
    ? 'bg-[#1D1528] border border-[#342444] text-[#F5F0FA]'
    : 'bg-white border border-slate-200 text-slate-900';
  const subtleSurface = nightSurface
    ? 'bg-[#261B35] border border-[#3B2A50]'
    : 'bg-slate-50 border border-slate-200/80';
  const inputSurface = nightSurface
    ? 'bg-[#160F1E] border border-[#3B2A50] text-[#F5F0FA] placeholder:text-slate-400'
    : 'bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400';
  const mutedText = nightSurface ? 'text-[#C4B5D6]' : 'text-slate-600';

  const handleProposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverAuthToken || !clientId) return;
    const objectives = objectivesText.split('\n').map(s => s.trim()).filter(Boolean);
    const routines = routinesText.split('\n').map(s => s.trim()).filter(Boolean);
    const recommendations = recommendationsText.split('\n').map(s => s.trim()).filter(Boolean);

    if (objectives.length === 0 && routines.length === 0 && recommendations.length === 0) {
      setErrorMsg('Enter at least one objective, calm routine, or clinician recommendation.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/therapist/role1/users/${clientId}/plan-proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify({
          title: title.trim() || 'Collaborative Routine & Care Update',
          objectives,
          routines,
          recommendations,
          rationale: rationale.trim() || undefined,
          reviewDate: reviewDate || undefined,
          nextFollowUpDate: nextFollowUpDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not send care plan proposal.');
        return;
      }
      setStatusMsg(`Proposal v${data.proposal?.version || ''} sent to ${clientName || 'client'} for 2-way review.`);
      setObjectivesText('');
      setRoutinesText('');
      setRecommendationsText('');
      setRationale('');
      onUpdated();
    } catch {
      setErrorMsg('Network error sending care plan proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespondProposal = async (
    proposalId: string,
    status: 'user_reviewed' | 'acknowledged' | 'agreed' | 'declined'
  ) => {
    if (!serverAuthToken) return;
    setRespondingId(proposalId);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/care/plan-proposals/${proposalId}/respond`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverAuthToken}`,
        },
        body: JSON.stringify({
          status,
          userFeedback: (feedbackDrafts[proposalId] || '').trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not update proposal status.');
        return;
      }
      setStatusMsg(
        status === 'agreed'
          ? 'Care plan agreed and activated inside your Support Plan.'
          : status === 'declined'
          ? 'Feedback sent to your clinician for revision.'
          : 'Proposal response recorded.'
      );
      onUpdated();
    } catch {
      setErrorMsg('Network error saving your response.');
    } finally {
      setRespondingId(null);
    }
  };

  if (mode === 'user' && proposals.length === 0) {
    return null;
  }

  return (
    <section className={`${cardSurface} rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs text-xs`}>
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-inherit">
        <div>
          <div
            className={`text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${
              mode === 'therapist' ? 'text-[#059669]' : 'text-indigo-800'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Structured Recovery Coordination Protocol</span>
          </div>
          <h2 className="text-base font-extrabold mt-0.5">
            {mode === 'therapist'
              ? `2-Way Care Plan Proposals for ${clientName || 'Client'}`
              : `Clinician Care Plan Proposals (${proposals.length})`}
          </h2>
          <p className={`text-[11px] mt-0.5 ${mutedText}`}>
            {mode === 'therapist'
              ? 'Propose versioned objectives and calm routines. Client agreement automatically syncs into their active Support Plan and Revision Ledger.'
              : 'Review updates suggested by your verified clinician. Agree to activate them in your plan, acknowledge, or request a gentler pace.'}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
          {errorMsg}
        </div>
      )}
      {statusMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-semibold">
          {statusMsg}
        </div>
      )}

      {mode === 'therapist' && (
        <form onSubmit={handleProposeSubmit} className={`p-4 rounded-2xl space-y-3 ${subtleSurface}`}>
          <div className="font-bold text-sm">Propose Versioned Care Plan Adjustment</div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-3">
              <label className="block font-semibold mb-1">Proposal Headline</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                className={`w-full px-3 py-2 rounded-xl ${inputSurface}`}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Proposed Objectives (1/line)</label>
              <textarea
                rows={3}
                value={objectivesText}
                onChange={e => setObjectivesText(e.target.value)}
                placeholder="Keep evening routine steady after 7 PM"
                className={`w-full px-3 py-2 rounded-xl ${inputSurface}`}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Calm Routines (1/line)</label>
              <textarea
                rows={3}
                value={routinesText}
                onChange={e => setRoutinesText(e.target.value)}
                placeholder="20-min outdoor walk at 6:15 PM"
                className={`w-full px-3 py-2 rounded-xl ${inputSurface}`}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Recommendations (1/line)</label>
              <textarea
                rows={3}
                value={recommendationsText}
                onChange={e => setRecommendationsText(e.target.value)}
                placeholder="Use Breath Cadence before evening urge hour"
                className={`w-full px-3 py-2 rounded-xl ${inputSurface}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-1">
              <label className="block font-semibold mb-1">Review Date</label>
              <input
                type="date"
                value={reviewDate}
                onChange={e => setReviewDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl ${inputSurface}`}
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block font-semibold mb-1">Next Follow-Up Date</label>
              <input
                type="date"
                value={nextFollowUpDate}
                onChange={e => setNextFollowUpDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl ${inputSurface}`}
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block font-semibold mb-1">Clinical Rationale</label>
              <input
                type="text"
                value={rationale}
                onChange={e => setRationale(e.target.value)}
                placeholder="Why this step fits right now"
                className={`w-full px-3 py-2 rounded-xl ${inputSurface}`}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !serverAuthToken || !clientId}
            className="px-4 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] disabled:opacity-60 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? 'Sending Proposal...' : 'Send Plan Proposal for Client Review'}</span>
          </button>
        </form>
      )}

      {/* Versioned Proposal Feed */}
      <div className="space-y-3">
        {proposals.length === 0 ? (
          <p className={mutedText}>No versioned plan proposals created yet for this client.</p>
        ) : (
          proposals.map(p => {
            const isResolved = p.status === 'agreed' || p.status === 'active';
            const isDeclined = p.status === 'declined';
            return (
              <article key={p.id} className={`p-4 rounded-2xl space-y-2.5 ${subtleSurface}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="font-extrabold text-sm">
                      v{p.version} · {p.title}
                    </div>
                    <div className={`text-[11px] tabular-nums ${mutedText}`}>
                      Proposed by {p.therapistName} · {new Date(p.createdAt).toLocaleDateString()}
                      {p.reviewDate ? ` · Review ${p.reviewDate}` : ''}
                      {p.nextFollowUpDate ? ` · Follow-up ${p.nextFollowUpDate}` : ''}
                    </div>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                      isResolved
                        ? 'bg-emerald-100 text-emerald-900'
                        : isDeclined
                        ? 'bg-rose-100 text-rose-900'
                        : 'bg-amber-100 text-amber-950'
                    }`}
                  >
                    {STATUS_LABELS[p.status] || p.status}
                  </span>
                </div>

                {p.rationale && (
                  <p className={`italic ${mutedText}`}>Rationale: {p.rationale}</p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                  {p.objectives.length > 0 && (
                    <div className={`${cardSurface} rounded-xl p-3 space-y-1`}>
                      <div className="font-bold">Objectives</div>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {p.objectives.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {p.routines.length > 0 && (
                    <div className={`${cardSurface} rounded-xl p-3 space-y-1`}>
                      <div className="font-bold">Calm Routines</div>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {p.routines.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {p.recommendations.length > 0 && (
                    <div className={`${cardSurface} rounded-xl p-3 space-y-1`}>
                      <div className="font-bold">Clinician Notes</div>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {p.recommendations.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {p.userFeedback && (
                  <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 text-indigo-700" />
                    <span>
                      <strong>Client Response:</strong> {p.userFeedback}
                    </span>
                  </div>
                )}

                {mode === 'user' && !isResolved && (
                  <div className="pt-2 border-t border-slate-200/70 space-y-2">
                    <input
                      type="text"
                      value={feedbackDrafts[p.id] ?? ''}
                      onChange={e =>
                        setFeedbackDrafts(prev => ({ ...prev, [p.id]: e.target.value }))
                      }
                      placeholder="Optional note or preferred adjustment for your therapist..."
                      className={`w-full px-3 py-2 rounded-xl ${inputSurface}`}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        disabled={respondingId === p.id}
                        onClick={() => handleRespondProposal(p.id, 'agreed')}
                        className="px-3.5 py-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 disabled:opacity-60 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                        <span>Agree &amp; Activate in My Plan</span>
                      </button>
                      {p.status === 'proposed' && (
                        <button
                          type="button"
                          disabled={respondingId === p.id}
                          onClick={() => handleRespondProposal(p.id, 'user_reviewed')}
                          className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Mark Reviewed</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={respondingId === p.id}
                        onClick={() => handleRespondProposal(p.id, 'acknowledged')}
                        className="px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-800 font-semibold cursor-pointer"
                      >
                        Acknowledge
                      </button>
                      <button
                        type="button"
                        disabled={respondingId === p.id}
                        onClick={() => handleRespondProposal(p.id, 'declined')}
                        className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Request Change / Decline</span>
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
};
