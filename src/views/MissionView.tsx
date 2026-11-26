import React from 'react';
import { UserRole } from '../types';
import { ClearPathLogo } from '../components/ClearPathLogo';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Compass,
  GraduationCap,
  HeartHandshake,
  Lock,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';

interface MissionViewProps {
  onBack: () => void;
  onOpenRole: (role: UserRole, tab?: string) => void;
}

export const MissionView: React.FC<MissionViewProps> = ({ onBack, onOpenRole }) => {
  return (
    <div className="min-h-screen bg-[#FAF9F6] text-slate-900 flex flex-col justify-between selection:bg-indigo-100 selection:text-indigo-950">
      {/* Sticky 3-Zone Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <ClearPathLogo size="md" subtitle="Architecture & Mission" />
          </div>

          <nav aria-label="Mission sections" className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#mission-vision" className="hover:text-indigo-950 transition-colors">
              Vision
            </a>
            <a href="#mission-challenges" className="hover:text-indigo-950 transition-colors">
              Challenge Areas
            </a>
            <a href="#mission-roles" className="hover:text-indigo-950 transition-colors">
              Role Collaboration
            </a>
            <a href="#mission-innovations" className="hover:text-indigo-950 transition-colors">
              Core Innovations
            </a>
          </nav>

          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-300" />
            <span>Back to Home</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-10 sm:py-14 space-y-16">
        {/* 1. VISION STATEMENT */}
        <section id="mission-vision" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-5">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-800">
              ClearPath AI · Public Health &amp; Recovery Architecture
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-indigo-950 tracking-tight leading-[1.08] text-balance">
              Replacing shame and silence with structured, privacy-safe pathways to recovery and prevention.
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              ClearPath AI bridges individual recovery, calmer family support, practical neuroscience education, and accountable community prevention across Kerala and India—while enforcing strict boundaries so private journals and confidential clinician notes are never exposed to educators or communities.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => onOpenRole('personal', 'dashboard')}
                className="px-5 py-3 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-extrabold inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Open Recover &amp; Rebuild</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </button>
              <button
                type="button"
                onClick={() => onOpenRole('community', 'intelligence')}
                className="px-5 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Explore Community Intelligence</span>
              </button>
            </div>
          </div>

          <aside className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-teal-800">
              <ShieldCheck className="w-4 h-4" />
              <span>Non-Negotiable Safeguards</span>
            </div>
            <ul className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <li className="pb-2.5 border-b border-slate-100">
                <strong className="text-slate-900 block">Zero Role 01 Leakage</strong>
                Personal logs, substance disclosures, and clinical notes never appear inside public or Role 04 dashboards.
              </li>
              <li className="pb-2.5 border-b border-slate-100">
                <strong className="text-slate-900 block">k-Anonymity (k &ge; 5)</strong>
                Community participation and pre/post trends below 5 participants are suppressed server-side.
              </li>
              <li>
                <strong className="text-slate-900 block">Human-in-the-Loop Decisions</strong>
                AI assistants synthesize notes and flag blind spots; clinicians and users always approve plan changes.
              </li>
            </ul>
          </aside>
        </section>

        {/* 2. FOUR CHALLENGE AREAS */}
        <section id="mission-challenges" className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-indigo-950">
              Four Structural Challenges Addressed
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Real-world prevention fails when individuals, families, students, and civic organizers operate in disconnected silos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              {
                numeral: '01',
                title: 'Fragmented Continuity Between Sessions',
                body: 'People seeking recovery often face long gaps between clinic visits with zero calm daily structure, voice reflection tools, or collaborative plan updates.',
              },
              {
                numeral: '02',
                title: 'Stigma & Coercive Family Conflicts',
                body: 'Parents and supporters want to help immediately, yet fear-based confrontation drives secrecy instead of voluntary treatment readiness.',
              },
              {
                numeral: '03',
                title: 'Myth-Heavy Youth Messaging',
                body: 'Scare tactics fail adolescents and young adults. Clear neurobiology modules and refusal-skill simulations build genuine resilience without stigma.',
              },
              {
                numeral: '04',
                title: 'Unmeasured One-Off Campus Drives',
                body: 'Community campaigns frequently report headcounts instead of pre/post knowledge clarity, barrier discovery, or k-anonymous district coverage.',
              },
            ].map(item => (
              <div
                key={item.numeral}
                className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2"
              >
                <div className="text-xs font-mono tabular-nums font-bold text-amber-700">
                  Challenge {item.numeral}
                </div>
                <h3 className="text-base font-extrabold text-slate-900">{item.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. HOW ALL ROLES COLLABORATE SAFELY */}
        <section id="mission-roles" className="space-y-6">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-indigo-950">
              How the Four Public Workspaces &amp; Restricted Clinical Portal Collaborate
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Each role stays purpose-built and consent-gated—sharing only explicitly authorized signals across boundaries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-[#1E1B4B] text-white rounded-2xl p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <Compass className="w-5 h-5 text-amber-400" />
                <span className="text-[11px] font-mono font-bold text-amber-300">Role 01</span>
              </div>
              <h3 className="text-base font-extrabold">Recover &amp; Rebuild</h3>
              <p className="text-xs text-indigo-100/85 leading-relaxed">
                Voice-to-Journal check-ins, substance identification, CBT brain resets, 10-category therapist consent controls, and 2-way Care Plan Proposals.
              </p>
              <button
                type="button"
                onClick={() => onOpenRole('personal', 'dashboard')}
                className="text-xs font-bold text-amber-300 hover:underline inline-flex items-center gap-1 pt-1 cursor-pointer"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-[#FFFBF5] border border-orange-200 rounded-2xl p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <HeartHandshake className="w-5 h-5 text-[#9A3412]" />
                <span className="text-[11px] font-mono font-bold text-[#9A3412]">Role 02</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Supporter Space</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                De-escalation conversation guides, boundary planners, shared non-sensitive appointment milestones, and verified Kerala treatment directory access.
              </p>
              <button
                type="button"
                onClick={() => onOpenRole('supporter', 'dashboard')}
                className="text-xs font-bold text-[#9A3412] hover:underline inline-flex items-center gap-1 pt-1 cursor-pointer"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white border border-sky-200 rounded-2xl p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <GraduationCap className="w-5 h-5 text-blue-800" />
                <span className="text-[11px] font-mono font-bold text-blue-800">Role 03</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Learner &amp; Youth Lab</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Interactive addiction neuroscience modules, peer-pressure refusal simulations, substance evidence lab, and verifiable completion certificates.
              </p>
              <button
                type="button"
                onClick={() => onOpenRole('learner', 'dashboard')}
                className="text-xs font-bold text-blue-800 hover:underline inline-flex items-center gap-1 pt-1 cursor-pointer"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white border border-teal-200 rounded-2xl p-5 space-y-2.5">
              <div className="flex items-center justify-between">
                <Building2 className="w-5 h-5 text-teal-800" />
                <span className="text-[11px] font-mono font-bold text-teal-800">Role 04</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Community Builder</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                District gap intelligence (k &ge; 5), 10-point AI Strategy Lab critique, 12-field verified programmes, and anonymous pre/post evaluations.
              </p>
              <button
                type="button"
                onClick={() => onOpenRole('community', 'intelligence')}
                className="text-xs font-bold text-teal-800 hover:underline inline-flex items-center gap-1 pt-1 cursor-pointer"
              >
                <span>Enter Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="md:col-span-2 bg-[#4A154B] text-white rounded-2xl p-5 flex flex-col justify-between space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                    <Stethoscope className="w-4 h-4" />
                    <span>Restricted Clinical Portal</span>
                  </div>
                  <Lock className="w-4 h-4 text-emerald-300" />
                </div>
                <h3 className="text-base font-extrabold">Therapist Oversight &amp; Care Coordination</h3>
                <p className="text-xs text-purple-100/85 leading-relaxed">
                  Admin-verified or quick-code-authenticated clinicians view strictly authorized Role 01 client data, respond to daily logs, seal AES-256-GCM confidential vault notes, rank caseload urgency via the Attention Engine, and propose 2-way Care Plans.
                </p>
              </div>
              <div className="text-[11px] text-emerald-200 font-semibold">
                Every clinical mutation &amp; view is recorded in the Verification Admin audit trail.
              </div>
            </div>
          </div>
        </section>

        {/* 4. THREE CORE INNOVATIONS + CUSTOM ARCHITECTURAL WORKFLOW SVGS */}
        <section id="mission-innovations" className="space-y-8">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-indigo-950">
              Three Core Innovations Powering ClearPath AI
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Built as deterministic, inspectable workflows combining real-time SSE sync, privacy math, and clinician accountability.
            </p>
          </div>

          {/* Innovation 1 */}
          <article className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5 space-y-2.5">
              <div className="text-xs font-mono font-bold text-teal-800 uppercase tracking-wider">
                Innovation 01
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Community Intelligence &amp; Intervention Engine
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Unifies state/district epidemiological references with live verified programmes while suppressing any cohort smaller than 5 participants (k &ge; 5 k-anonymity). Past pre/post outcomes feed directly into the 10-point AI Strategy Lab so new drives avoid repeated blind spots.
              </p>
            </div>
            <div className="lg:col-span-7 bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <svg
                viewBox="0 0 640 165"
                className="w-full h-auto"
                role="img"
                aria-label="Workflow diagram: Epidemiological data and k>=5 anonymized feedback flow into Strategy Lab, 12-field verified programmes, and Pre/Post Evaluation loops"
              >
                <defs>
                  <marker id="arrowTeal" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 z" fill="#0F766E" />
                  </marker>
                </defs>
                {/* Node 1 */}
                <rect x="10" y="34" width="136" height="72" rx="12" fill="#FFFFFF" stroke="#0F766E" strokeWidth="1.5" />
                <text x="78" y="61" textAnchor="middle" fontSize="11" fontWeight="800" fill="#0F172A">District Signals</text>
                <text x="78" y="79" textAnchor="middle" fontSize="9.5" fill="#475569">k &ge; 5 Suppression</text>
                <text x="78" y="94" textAnchor="middle" fontSize="9" fill="#0F766E">Zero Role 01 PII</text>

                <line x1="146" y1="70" x2="174" y2="70" stroke="#0F766E" strokeWidth="1.8" markerEnd="url(#arrowTeal)" />

                {/* Node 2 */}
                <rect x="176" y="34" width="136" height="72" rx="12" fill="#F0FDFA" stroke="#0F766E" strokeWidth="1.5" />
                <text x="244" y="61" textAnchor="middle" fontSize="11" fontWeight="800" fill="#0F172A">10-Pt Strategy Lab</text>
                <text x="244" y="79" textAnchor="middle" fontSize="9.5" fill="#475569">Critiques Weakness</text>
                <text x="244" y="94" textAnchor="middle" fontSize="9" fill="#0F766E">+ Past Outcomes</text>

                <line x1="312" y1="70" x2="340" y2="70" stroke="#0F766E" strokeWidth="1.8" markerEnd="url(#arrowTeal)" />

                {/* Node 3 */}
                <rect x="342" y="34" width="136" height="72" rx="12" fill="#FFFFFF" stroke="#0F766E" strokeWidth="1.5" />
                <text x="410" y="61" textAnchor="middle" fontSize="11" fontWeight="800" fill="#0F172A">12-Field Programme</text>
                <text x="410" y="79" textAnchor="middle" fontSize="9.5" fill="#475569">Admin Verified</text>
                <text x="410" y="94" textAnchor="middle" fontSize="9" fill="#0F766E">Live SSE Registry</text>

                <line x1="478" y1="70" x2="506" y2="70" stroke="#0F766E" strokeWidth="1.8" markerEnd="url(#arrowTeal)" />

                {/* Node 4 */}
                <rect x="508" y="34" width="122" height="72" rx="12" fill="#134E4A" />
                <text x="569" y="61" textAnchor="middle" fontSize="11" fontWeight="800" fill="#FFFFFF">Pre/Post Eval</text>
                <text x="569" y="79" textAnchor="middle" fontSize="9.5" fill="#CCFBF1">Clarity &amp; Barriers</text>
                <text x="569" y="94" textAnchor="middle" fontSize="9" fill="#99F6E4">Feeds Strategy</text>

                {/* Feedback loop */}
                <path
                  d="M 569 106 L 569 140 L 244 140 L 244 109"
                  fill="none"
                  stroke="#0F766E"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  markerEnd="url(#arrowTeal)"
                />
                <text x="406" y="133" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#0F766E">
                  Empirical Learning Loop
                </text>
              </svg>
            </div>
          </article>

          {/* Innovation 2 */}
          <article className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5 space-y-2.5">
              <div className="text-xs font-mono font-bold text-[#4A154B] uppercase tracking-wider">
                Innovation 02
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Adaptive Therapist Attention Engine
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Continuously scores authorized caseload signals—unread client messages, heavy-mood check-ins, overdue calendar steps, and due reviews—into an explainable priority queue. A compact AI recommendation bar flags changes and gaps while requiring human clinician approval before any action.
              </p>
            </div>
            <div className="lg:col-span-7 bg-[#FAF8FC] border border-[#E6DFEC] rounded-2xl p-4">
              <svg
                viewBox="0 0 640 155"
                className="w-full h-auto"
                role="img"
                aria-label="Workflow diagram: Live Role 01 signals feed explainable server ranking, compact AI recommendation bar, and clinician-approved action"
              >
                <defs>
                  <marker id="arrowPlum" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 z" fill="#4A154B" />
                  </marker>
                </defs>
                <rect x="10" y="38" width="140" height="78" rx="12" fill="#FFFFFF" stroke="#4A154B" strokeWidth="1.5" />
                <text x="80" y="64" textAnchor="middle" fontSize="11" fontWeight="800" fill="#1E1426">Role 01 Signals</text>
                <text x="80" y="82" textAnchor="middle" fontSize="9.5" fill="#475569">Moods, Missed Steps</text>
                <text x="80" y="98" textAnchor="middle" fontSize="9" fill="#4A154B">Messages &amp; Reports</text>

                <line x1="150" y1="77" x2="176" y2="77" stroke="#4A154B" strokeWidth="1.8" markerEnd="url(#arrowPlum)" />

                <rect x="178" y="38" width="144" height="78" rx="12" fill="#FFFFFF" stroke="#4A154B" strokeWidth="1.5" />
                <text x="250" y="64" textAnchor="middle" fontSize="11" fontWeight="800" fill="#1E1426">Attention Ranking</text>
                <text x="250" y="82" textAnchor="middle" fontSize="9.5" fill="#B45309">Urgent / Follow-Up Due</text>
                <text x="250" y="98" textAnchor="middle" fontSize="9" fill="#059669">Explicit Reasons Shown</text>

                <line x1="322" y1="77" x2="348" y2="77" stroke="#4A154B" strokeWidth="1.8" markerEnd="url(#arrowPlum)" />

                <rect x="350" y="38" width="140" height="78" rx="12" fill="#F3E8FF" stroke="#4A154B" strokeWidth="1.5" />
                <text x="420" y="64" textAnchor="middle" fontSize="11" fontWeight="800" fill="#4A154B">Compact AI Bar</text>
                <text x="420" y="82" textAnchor="middle" fontSize="9.5" fill="#475569">Detects Changes/Gaps</text>
                <text x="420" y="98" textAnchor="middle" fontSize="9" fill="#4A154B">Never Auto-Applies</text>

                <line x1="490" y1="77" x2="516" y2="77" stroke="#4A154B" strokeWidth="1.8" markerEnd="url(#arrowPlum)" />

                <rect x="518" y="38" width="112" height="78" rx="12" fill="#4A154B" />
                <text x="574" y="66" textAnchor="middle" fontSize="11" fontWeight="800" fill="#FFFFFF">Clinician Gate</text>
                <text x="574" y="84" textAnchor="middle" fontSize="9.5" fill="#6EE7B7">Approves Action</text>
                <text x="574" y="100" textAnchor="middle" fontSize="9" fill="#E9D5FF">Audit Logged</text>
              </svg>
            </div>
          </article>

          {/* Innovation 3 */}
          <article className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5 space-y-2.5">
              <div className="text-xs font-mono font-bold text-indigo-800 uppercase tracking-wider">
                Innovation 03
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Structured Recovery Coordination Protocol
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Replaces passive one-way clinical notes with versioned 2-way Care Plan Proposals. Clinicians propose objectives, calm routines, and next follow-ups; clients review, leave feedback, or agree in real time—automatically syncing agreed plans into Role 01 Rebuild &amp; Revision History.
              </p>
            </div>
            <div className="lg:col-span-7 bg-indigo-50/50 border border-indigo-200 rounded-2xl p-4">
              <svg
                viewBox="0 0 640 155"
                className="w-full h-auto"
                role="img"
                aria-label="Workflow diagram: Clinician proposes versioned plan vN, client reviews or declines with feedback, and agreement activates the Role 01 Support Plan with revision history"
              >
                <defs>
                  <marker id="arrowIndigo" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <path d="M0,0 L8,4 L0,8 z" fill="#1E1B4B" />
                  </marker>
                </defs>
                <rect x="10" y="34" width="140" height="78" rx="12" fill="#FFFFFF" stroke="#1E1B4B" strokeWidth="1.5" />
                <text x="80" y="60" textAnchor="middle" fontSize="11" fontWeight="800" fill="#1E1B4B">Proposal vN</text>
                <text x="80" y="78" textAnchor="middle" fontSize="9.5" fill="#475569">Objectives + Routines</text>
                <text x="80" y="94" textAnchor="middle" fontSize="9" fill="#059669">Status: Proposed</text>

                <line x1="150" y1="73" x2="176" y2="73" stroke="#1E1B4B" strokeWidth="1.8" markerEnd="url(#arrowIndigo)" />

                <rect x="178" y="34" width="144" height="78" rx="12" fill="#FFFBEB" stroke="#D97706" strokeWidth="1.5" />
                <text x="250" y="60" textAnchor="middle" fontSize="11" fontWeight="800" fill="#1E1B4B">Client Review (SSE)</text>
                <text x="250" y="78" textAnchor="middle" fontSize="9.5" fill="#475569">Acknowledge / Feedback</text>
                <text x="250" y="94" textAnchor="middle" fontSize="9" fill="#B45309">Or Request Revision</text>

                <line x1="322" y1="73" x2="348" y2="73" stroke="#1E1B4B" strokeWidth="1.8" markerEnd="url(#arrowIndigo)" />

                <rect x="350" y="34" width="136" height="78" rx="12" fill="#ECFDF5" stroke="#059669" strokeWidth="1.5" />
                <text x="418" y="60" textAnchor="middle" fontSize="11" fontWeight="800" fill="#065F46">Mutual Agreement</text>
                <text x="418" y="78" textAnchor="middle" fontSize="9.5" fill="#047857">Status: Agreed/Active</text>
                <text x="418" y="94" textAnchor="middle" fontSize="9" fill="#065F46">Synced to Therapist</text>

                <line x1="486" y1="73" x2="512" y2="73" stroke="#1E1B4B" strokeWidth="1.8" markerEnd="url(#arrowIndigo)" />

                <rect x="514" y="34" width="116" height="78" rx="12" fill="#1E1B4B" />
                <text x="572" y="60" textAnchor="middle" fontSize="11" fontWeight="800" fill="#FFFFFF">Active Plan</text>
                <text x="572" y="78" textAnchor="middle" fontSize="9.5" fill="#FDE68A">Role 01 Rebuild</text>
                <text x="572" y="94" textAnchor="middle" fontSize="9" fill="#C7D2FE">+ Revision Ledger</text>
              </svg>
            </div>
          </article>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 sm:px-8 py-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <span>ClearPath AI · Built for privacy-respecting prevention &amp; recovery continuity</span>
          <button
            type="button"
            onClick={onBack}
            className="font-bold text-indigo-950 hover:underline cursor-pointer"
          >
            Return to ClearPath Home
          </button>
        </div>
      </footer>
    </div>
  );
};
