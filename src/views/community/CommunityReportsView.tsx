import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Printer,
  Edit2,
  Save,
  MapPin,
} from 'lucide-react';
import { calculateCommunityImpactMetrics, summarizeCommunityNeeds } from '../../utils/logic';
import { KERALA_DISTRICTS } from '../../constants/communityData';

export const CommunityReportsView: React.FC = () => {
  const {
    communityOrg,
    communityProgrammes,
    communityEvents,
    communityTasks,
    communityFeedback,
    language,
  } = useApp();

  const metrics = calculateCommunityImpactMetrics(
    communityProgrammes,
    communityEvents,
    communityTasks,
    communityFeedback
  );

  const needsSummary = summarizeCommunityNeeds(communityFeedback);

  const today = new Date().toISOString().split('T')[0];

  const [reportTitle, setReportTitle] = useState(
    `${communityOrg?.name || 'Community'} Substance Prevention Progress & Impact Report`
  );
  const [reportingPeriod, setReportingPeriod] = useState('Current Academic Quarter / Cycle');
  const [executiveSummary, setExecutiveSummary] = useState(
    `This report summarizes prevention talks, awareness sessions, and student support drives run with ClearPath AI. All sessions prioritize student safety, zero shaming, and direct links to Kerala Vimukthi Mission (14405).`
  );
  const [keyAchievements, setKeyAchievements] = useState([
    `Reached ${metrics.totalActualAttendance} verified community participants across ${metrics.completedEvents} completed sessions.`,
    `Maintained a ${metrics.taskCompletionRatePct}% logistical task resolution rate across team coordinators.`,
    `Established anonymous feedback collection identifying top challenges without personal profiling.`,
  ]);
  const [recommendations, setRecommendations] = useState(
    `1. Expand teacher early identification orientations prior to semester exam periods.\n2. Deepen student peer ambassador training for high school youth.\n3. Maintain ongoing coordination with district medical college de-addiction wards and Vimukthi 14405.`
  );

  const [isEditing, setIsEditing] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-800 uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4" />
            <span>{language === 'ml' ? 'ഡോക്യുമെന്റേഷൻ & റിപ്പോർട്ടുകൾ' : 'Operational Documentation'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {language === 'ml' ? 'ഇംപാക്റ്റ് റിപ്പോർട്ട് ജനറേറ്റർ' : 'Comprehensive Prevention Report'}
          </h1>
          <p className="editorial-subtitle text-slate-600 mt-1.5 max-w-2xl">
            {language === 'ml'
              ? 'സ്കൂൾ മാനേജ്‌മെന്റിനോ ഡിപ്പാർട്ട്‌മെന്റുകൾക്കോ എൻ.ജി.ഒ ബോർഡുകൾക്കോ സമർപ്പിക്കുന്നതിനായുള്ള റിപ്പോർട്ട്.'
              : 'Audit-ready operational summaries synthesized from real calendar events, attendance data, and feedback.'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {isEditing ? <Save className="w-3.5 h-3.5 text-teal-700" /> : <Edit2 className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'Done Editing' : 'Customize Narrative'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-teal-800 hover:bg-teal-900 text-white shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Formal Printable Document Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500">
            <span>CLEARPATH AI · COMMUNITY PREVENTION SUITE</span>
            <span>DATE: {today}</span>
          </div>

          <div>
            {isEditing ? (
              <input
                type="text"
                value={reportTitle}
                onChange={e => setReportTitle(e.target.value)}
                className="w-full text-2xl font-black text-slate-900 border-b border-teal-600 focus:outline-hidden py-1"
              />
            ) : (
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {reportTitle}
              </h2>
            )}
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2">
              <span className="font-semibold text-teal-800">
                {communityOrg?.name || 'Community Workspace'}
              </span>
              <span>•</span>
              <span>District: {communityOrg?.district || 'Statewide'}</span>
              <span>•</span>
              <span>Period: {reportingPeriod}</span>
            </div>
          </div>
        </div>

        {/* 1. Executive Summary */}
        <div className="space-y-3">
          <h3 className="editorial-kicker text-slate-900 border-b border-slate-200 pb-1.5">
            1. Executive Overview
          </h3>
          {isEditing ? (
            <textarea
              rows={3}
              value={executiveSummary}
              onChange={e => setExecutiveSummary(e.target.value)}
              className="w-full prose-readable-sm text-slate-700 p-3.5 rounded-xl border border-slate-200 focus:outline-hidden"
            />
          ) : (
            <p className="prose-readable prose-measure text-slate-700">{executiveSummary}</p>
          )}
        </div>

        {/* 2. Key Operational Metrics Table */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            2. Empirical Impact & Reach Metrics
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Total Attendance
              </span>
              <span className="text-xl font-bold font-mono text-slate-900">
                {metrics.totalActualAttendance}
              </span>
              <span className="text-[10px] text-slate-500 block">Direct participants</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Events Executed
              </span>
              <span className="text-xl font-bold font-mono text-slate-900">
                {metrics.completedEvents} / {metrics.totalEvents}
              </span>
              <span className="text-[10px] text-slate-500 block">Sessions held</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Active Programmes
              </span>
              <span className="text-xl font-bold font-mono text-slate-900">
                {metrics.activeProgrammes}
              </span>
              <span className="text-[10px] text-slate-500 block">{metrics.totalProgrammes} total</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Task Execution
              </span>
              <span className="text-xl font-bold font-mono text-slate-900">
                {metrics.taskCompletionRatePct}%
              </span>
              <span className="text-[10px] text-slate-500 block">Follow-through rate</span>
            </div>
          </div>
        </div>

        {/* 3. Detailed Programmes List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-1">
            3. Initiatives & Programmes Conducted
          </h3>
          {communityProgrammes.length > 0 ? (
            <div className="space-y-2.5">
              {communityProgrammes.map(prog => (
                <div key={prog.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-1.5">
                  <div className="flex items-center justify-between text-sm font-bold text-slate-900">
                    <span>{prog.title}</span>
                    <span className="capitalize font-mono-tabular text-teal-800 text-xs">{prog.status}</span>
                  </div>
                  <p className="prose-readable-sm text-slate-600">{prog.objective}</p>
                  <div className="text-xs text-slate-500 flex flex-wrap gap-4 pt-1">
                    <span>Target: {prog.targetAudience}</span>
                    <span>District: {prog.district}</span>
                    {prog.budget > 0 && <span>Budget: ₹{prog.budget.toLocaleString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No programmes registered during this period.</p>
          )}
        </div>

        {/* 4. Live District Coverage Report */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-teal-700" />
              <span>4. Live District Coverage Summary</span>
            </h3>
            <span className="text-[10px] font-semibold text-slate-500">
              Live data from your workspace programmes &amp; sessions
            </span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">District</th>
                  <th className="px-4 py-2.5">Programmes</th>
                  <th className="px-4 py-2.5">Events</th>
                  <th className="px-4 py-2.5">Verified Reach</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {KERALA_DISTRICTS.filter(d => d !== 'Statewide').map(district => {
                  const progs = communityProgrammes.filter(p => p.district === district);
                  const evts = communityEvents.filter(e =>
                    progs.some(p => p.id === e.programmeId) ||
                    (communityOrg?.district === district && !e.programmeId)
                  );
                  const reach = evts.reduce((acc, e) => acc + (e.actualAttendance || e.expectedAttendance || 0), 0);
                  const isActive = progs.length > 0 || evts.length > 0;
                  if (!isActive && district !== communityOrg?.district) return null;

                  return (
                    <tr key={district} className="bg-white">
                      <td className="px-4 py-2.5 font-bold text-slate-900">{district}</td>
                      <td className="px-4 py-2.5 font-mono-tabular">{progs.length}</td>
                      <td className="px-4 py-2.5 font-mono-tabular">{evts.length}</td>
                      <td className="px-4 py-2.5 font-mono-tabular">{reach} people</td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800">
                          {isActive ? 'Active' : 'Ready to Start'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {communityProgrammes.length === 0 && !communityOrg?.district && (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-slate-500">
                      Add your first programme or event to see live district-by-district numbers here.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Anonymous Community Feedback Insights */}
        <div className="space-y-3">
          <h3 className="editorial-kicker text-slate-900 border-b border-slate-200 pb-1.5">
            5. Anonymous Needs Assessment &amp; Participant Feedback
          </h3>
          <div className="space-y-3 prose-readable-sm text-slate-700">
            <p>
              Across {communityFeedback.length} anonymous feedback entries, participants rated overall session clarity at{' '}
              <strong>{metrics.averageUsefulnessRating > 0 ? `${metrics.averageUsefulnessRating}/5` : 'N/A'}</strong>.
            </p>
            {needsSummary.topConcerns.length > 0 && (
              <div>
                <span className="font-bold text-slate-900 block mb-1.5">Top Expressed Concerns:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  {needsSummary.topConcerns.map((c, i) => (
                    <li key={i}>
                      {c.topic} ({c.count} mentions)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 6. Strategic Recommendations & Sign-Off */}
        <div className="space-y-3">
          <h3 className="editorial-kicker text-slate-900 border-b border-slate-200 pb-1.5">
            6. Strategic Recommendations for Next Quarter
          </h3>
          {isEditing ? (
            <textarea
              rows={3}
              value={recommendations}
              onChange={e => setRecommendations(e.target.value)}
              className="w-full prose-readable-sm text-slate-700 p-3.5 rounded-xl border border-slate-200 focus:outline-hidden"
            />
          ) : (
            <div className="prose-readable prose-measure text-slate-700 whitespace-pre-line">
              {recommendations}
            </div>
          )}
        </div>

        {/* 7. Evidence Context, Citations & Limitations */}
        <div className="space-y-2.5">
          <h3 className="editorial-kicker text-slate-900 border-b border-slate-200 pb-1.5">
            7. Evidence References, Measurement Boundaries &amp; Privacy Assurance
          </h3>
          <div className="text-xs text-slate-600 space-y-1.5 leading-relaxed">
            <p>
              <strong>Distinction of Metrics:</strong> Operational activity counts (workshops held, seats registered) are reported separately from participant learning &amp; attitude indicators (anonymous session clarity ratings and helpline awareness). Attendance reach does not prove long-term prevention efficacy without structured longitudinal follow-up.
            </p>
            <p>
              <strong>Reference Sources:</strong> Ministry of Social Justice &amp; Empowerment (MoSJE) &amp; NDDTC AIIMS National Survey (2019); NFHS-5 Kerala &amp; India Fact Sheets (2019–2021); NIMHANS National Mental Health Survey (NMHS); NCRB Crime in India (interpreted strictly as enforcement filings, not prevalence); Kerala Vimukthi Mission (14405) &amp; Tele-MANAS (14416). Where district household prevalence surveys are unavailable, no district estimates are fabricated.
            </p>
            <p>
              <strong>Confidentiality Boundary:</strong> Zero personal Role 01 recovery logs, screenings, or clinician vault records are accessed or included in this community report.
            </p>
          </div>
        </div>

        {/* Signatures Footer */}
        <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-600">
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400">Prepared By:</span>
            <span className="font-semibold text-slate-900 block mt-1">
              {communityOrg?.coordinatorName || 'Lead Coordinator'}
            </span>
            <span className="text-[11px] text-slate-500">
              {communityOrg?.coordinatorDesignation || 'Program Lead'}
            </span>
          </div>

          <div className="text-right">
            <span className="block text-[10px] uppercase font-bold text-slate-400">Institutional Review:</span>
            <span className="font-semibold text-slate-900 block mt-1">
              {communityOrg?.name || 'Organisation / Institution'}
            </span>
            <span className="text-[11px] text-slate-500">ClearPath AI Support Network</span>
          </div>
        </div>
      </div>
    </div>
  );
};
