import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { RedHelpDot } from '../components/RedHelpDot';
import {
  ShieldCheck,
  CheckCircle2,
  Circle,
  Lock,
  ArrowRight,
  Compass,
  Award,
  Layers,
  Sparkles,
  CalendarClock,
  Lightbulb,
} from 'lucide-react';

interface Props {
  onSelectTab?: (tab: string) => void;
}

export const ClearPathEcosystemView: React.FC<Props> = ({ onSelectTab }) => {
  const {
    language,
    dailyLogs,
    completedLessonIds,
    quizAttempts,
    communityProgrammes,
    communityEvents,
    exchangeItems,
    missions,
    toggleMissionStep,
    timelineEvents,
    consentPrefs,
    updateConsentPrefs,
    learnerCertificate,
  } = useApp();

  const [scopeFilter, setScopeFilter] = useState<'all' | 'challenge' | 'knowledge' | 'school' | 'community'>('all');

  const loopSteps = [
    { label: 'LEARN', labelMl: 'പഠിക്കുക', desc: 'Prevention neuroscience & refusal skills' },
    { label: 'UNDERSTAND', labelMl: 'മനസ്സിലാക്കുക', desc: 'Stigma-free early recognition' },
    { label: 'ACT', labelMl: 'പ്രവർത്തിക്കുക', desc: 'Quests & campus awareness drives' },
    { label: 'SUPPORT', labelMl: 'സഹായിക്കുക', desc: 'Warm family listening & referrals' },
    { label: 'RECOVER', labelMl: 'വീണ്ടെടുക്കുക', desc: 'Daily rhythm, games & privacy vault' },
    { label: 'EMPOWER', labelMl: 'ശക്തിപ്പെടുത്തുക', desc: 'Rebuild goals & purpose' },
    { label: 'PREVENT', labelMl: 'പ്രതിരോധിക്കുക', desc: 'Aggregated gap feedback loop' },
  ];

  const totalCheckIns = dailyLogs.length;
  const totalLessons = completedLessonIds.length;
  const totalProgrammes = communityProgrammes.length;
  const totalEvents = communityEvents.length;

  const participatingDistricts = useMemo(() => {
    const set = new Set<string>();
    communityProgrammes.forEach(p => {
      if (p.district) set.add(p.district);
    });
    exchangeItems.forEach(item => {
      if (item.district) set.add(item.district);
    });
    return set.size;
  }, [communityProgrammes, exchangeItems]);

  const filteredMissions = useMemo(() => {
    if (scopeFilter === 'all') return missions;
    return missions.filter(m => m.scope === scopeFilter);
  }, [missions, scopeFilter]);

  const totalCompletedQuestSteps = missions.reduce((sum, m) => sum + m.completedStepIndices.length, 0);
  const totalQuestSteps = missions.reduce((sum, m) => sum + m.steps.length, 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4 text-amber-600" />
            <span>Personal Action Quests &amp; Live Impact Wall · Privacy Isolated</span>
          </div>
          <h1 className="text-2xl font-extrabold text-indigo-950">
            {language === 'ml'
              ? 'ആക്ഷൻ ക്വസ്റ്റുകൾ, നേട്ടങ്ങളുടെ നാൾവഴി & പ്രിവൻഷൻ ലൂപ്പ്'
              : 'Action Quests, Achievement Timeline & Impact Wall'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            {language === 'ml'
              ? 'സ്വകാര്യ വിവരങ്ങൾ ഒരിടത്തും പങ്കുവെയ്ക്കാതെ ചെറിയ നല്ല ദിനചര്യകൾ പൂർത്തിയാക്കുകയും ശാസ്ത്രീയ ഉൾക്കാഴ്ചകൾ നേടുകയും ചെയ്യാം.'
              : 'Build consistent daily focus at your own pace with zero public rankings, unlockable neuroscience insights, and verified collective impact.'}
          </p>
        </div>
        <RedHelpDot role="personal" tabKey="ecosystem" compact />
      </div>

      {/* INNOVATION 3: PERSONAL ACTION QUESTS + UNLOCKABLE INSIGHTS + ACHIEVEMENT TIMELINE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 cols: Personal Action Quests */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-600" />
                <h2 className="text-base font-extrabold text-indigo-950">
                  Personal Action Quests
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Check off small real-world steps to unlock hidden science briefs. No streak penalties.
              </p>
            </div>
            <span className="text-xs font-mono-tabular font-bold text-indigo-900 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-200 self-start">
              {totalCompletedQuestSteps} / {totalQuestSteps} steps done
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {([
              { id: 'all', label: 'All Quests' },
              { id: 'challenge', label: 'Daily Reset' },
              { id: 'knowledge', label: 'Refusal Skill' },
              { id: 'school', label: 'School / Campus' },
              { id: 'community', label: 'Supporter Ally' },
            ] as const).map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setScopeFilter(cat.id)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer ${
                  scopeFilter === cat.id
                    ? 'bg-indigo-950 text-white border-indigo-950'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredMissions.map(mission => {
              const completedCount = mission.completedStepIndices.length;
              const isCompleted = completedCount === mission.steps.length && mission.steps.length > 0;
              return (
                <div
                  key={mission.id}
                  className={`p-4 rounded-2xl border space-y-2.5 transition-all ${
                    isCompleted
                      ? 'bg-indigo-50/70 border-indigo-300'
                      : 'bg-slate-50/70 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs sm:text-sm font-extrabold text-indigo-950">
                      {language === 'ml' ? mission.titleMl : mission.title}
                    </h3>
                    <span className="text-[11px] font-mono-tabular font-bold text-amber-700">
                      {completedCount}/{mission.steps.length}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {mission.steps.map((step, sIdx) => {
                      const done = mission.completedStepIndices.includes(sIdx);
                      return (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => toggleMissionStep(mission.id, sIdx)}
                          className="w-full text-left flex items-center gap-2 text-xs text-slate-700 hover:text-indigo-950 cursor-pointer py-0.5"
                        >
                          {done ? (
                            <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                          <span className={done ? 'line-through text-slate-400' : ''}>{step}</span>
                        </button>
                      );
                    })}
                  </div>

                  {isCompleted && mission.unlockedInsight && (
                    <div className="p-3 rounded-xl bg-white border border-indigo-200 text-xs flex items-start gap-2 text-indigo-950">
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-800">Unlocked Brain Brief: </span>
                        <span>
                          {language === 'ml' && mission.unlockedInsightMl
                            ? mission.unlockedInsightMl
                            : mission.unlockedInsight}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 cols: Chronological Real Achievement Timeline */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-indigo-800" />
              <h2 className="text-base font-extrabold text-indigo-950">Achievement Timeline</h2>
            </div>
            {onSelectTab && (
              <button
                type="button"
                onClick={() => onSelectTab('navigator')}
                className="text-xs font-bold text-indigo-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <span>Deep-Dive Check</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <p className="text-xs text-slate-500">
            Every genuine milestone you earn across assessments, quests, check-ins, and drives appears chronologically here.
          </p>

          {timelineEvents.length > 0 ? (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {timelineEvents.map(evt => (
                <div
                  key={evt.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {evt.category}
                    </span>
                    <span className="text-[10px] font-mono-tabular text-slate-400">
                      {new Date(evt.date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">{evt.title}</div>
                  {evt.detail && <div className="text-[11px] text-slate-600">{evt.detail}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-2">
              <Sparkles className="w-6 h-6 text-amber-500 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">No milestones logged yet</p>
              <p className="text-[11px] text-slate-500">
                Complete any Action Quest step on the left, run a Deep-Dive Check, or log a daily check-in to record your first real milestone.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* INNOVATION 2: LIVE IMPACT WALL (STRICTLY VERIFIED REAL LOCAL DATA — ZERO FAKE STATS) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Live Impact Wall (Strictly Verified Real Records)
            </h2>
            <p className="text-xs text-slate-500">
              Counts reflect genuine actions stored in this browser workspace. Personal recovery notes are strictly isolated from community views.
            </p>
          </div>
          {learnerCertificate && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-900">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Verified Learner Certificate Active</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-semibold text-slate-500">Private Check-ins</div>
            <div className="text-2xl font-extrabold text-indigo-950 font-mono-tabular mt-1">
              {totalCheckIns}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Vault encrypted</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-semibold text-slate-500">Learning &amp; Quizzes</div>
            <div className="text-2xl font-extrabold text-indigo-950 font-mono-tabular mt-1">
              {totalLessons + quizAttempts.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Modules + quizzes</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-semibold text-slate-500">Campaigns &amp; Events</div>
            <div className="text-2xl font-extrabold text-indigo-950 font-mono-tabular mt-1">
              {totalProgrammes + totalEvents}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Community drives</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-semibold text-slate-500">Shared Templates</div>
            <div className="text-2xl font-extrabold text-indigo-950 font-mono-tabular mt-1">
              {exchangeItems.length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Innovation Exchange</div>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="text-xs font-semibold text-slate-500">Active Districts</div>
            <div className="text-2xl font-extrabold text-indigo-950 font-mono-tabular mt-1">
              {participatingDistricts}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Kerala coverage</div>
          </div>
        </div>
      </div>

      {/* ClearPath Prevention Loop Diagram */}
      <div className="bg-indigo-950 text-white rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold tracking-tight text-amber-300">
            The 7-Stage ClearPath Prevention Loop
          </h2>
          <span className="text-[11px] text-indigo-200 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Zero Personal Identity Exposure</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {loopSteps.map((st, idx) => (
            <div
              key={st.label}
              className="bg-indigo-900/60 border border-indigo-800 rounded-xl p-3 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-mono-tabular text-amber-400 font-bold">
                  0{idx + 1}
                </span>
                <div className="text-xs font-extrabold mt-0.5">
                  {language === 'ml' ? st.labelMl : st.label}
                </div>
              </div>
              <p className="text-[11px] text-indigo-200 mt-1.5 leading-snug">{st.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Consent & Privacy Controls */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-800" />
          <h2 className="text-base font-extrabold text-slate-900">
            Consent &amp; Anti-Overconnection Controls
          </h2>
        </div>
        <p className="text-xs text-slate-600">
          Control strictly what touches your workspace. Even when enabled, personal recovery notes never cross role boundaries.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {[
            {
              key: 'receiveCrossRoleAnnouncements' as const,
              title: 'Helpful Platform Alerts',
              desc: 'Show real notifications inside your bell bar.',
            },
            {
              key: 'allowOptionalActionBridges' as const,
              title: 'Optional Action Bridges',
              desc: 'Show suggested quests without joining external groups.',
            },
            {
              key: 'shareAnonymizedLearningGaps' as const,
              title: 'Anonymous Topic Clarity',
              desc: 'Contributes topic scores only (Off by default).',
            },
          ].map(item => (
            <label
              key={item.key}
              className="flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:border-indigo-300 transition-colors"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">{item.title}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
              </div>
              <input
                type="checkbox"
                checked={consentPrefs[item.key]}
                onChange={e => updateConsentPrefs({ [item.key]: e.target.checked })}
                className="mt-0.5 w-4 h-4 accent-indigo-900 rounded cursor-pointer"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
