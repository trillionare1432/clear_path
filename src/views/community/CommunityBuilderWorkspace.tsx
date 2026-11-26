import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CommunityTopHeader, CommunityActiveTab } from '../../components/CommunityTopHeader';
import { CommunityOnboardingModal } from '../../components/CommunityOnboardingModal';
import { CommunityDashboardView } from './CommunityDashboardView';
import { CommunityProgrammesView } from './CommunityProgrammesView';
import { CommunityEventsView } from './CommunityEventsView';
import { CommunityTeamTasksView } from './CommunityTeamTasksView';
import { CommunityResourcesView } from './CommunityResourcesView';
import { CommunityCampaignsView } from './CommunityCampaignsView';
import { CommunityFeedbackView } from './CommunityFeedbackView';
import { CommunityAnalyticsView } from './CommunityAnalyticsView';
import { CommunityPartnersView } from './CommunityPartnersView';
import { CommunityGuideView } from './CommunityGuideView';
import { CommunityReportsView } from './CommunityReportsView';
import { CommunityIntelligenceView } from './CommunityIntelligenceView';
import { CommunityStrategyLabView, CommunityProgrammeDraft } from './CommunityStrategyLabView';
import {
  CommunityActionGeneratorPanel,
  PreventionIntelligenceMapPanel,
  PreventionGapDetectorPanel,
  CommunityInnovationExchangePanel,
} from './CommunityInnovationViews';
import {
  Layers,
  Calendar,
  CheckSquare,
  X,
  Building2,
  Trash2,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';

interface CommunityBuilderWorkspaceProps {
  initialTab?: string;
  onTabChange?: (tab: string) => void;
  onOpenPortalAuth?: (mode: 'therapist' | 'admin') => void;
}

export const CommunityBuilderWorkspace: React.FC<CommunityBuilderWorkspaceProps> = ({
  initialTab = 'dashboard',
  onTabChange,
  onOpenPortalAuth,
}) => {
  const {
    communityOnboarding,
    setRole,
    language,
    setLanguage,
    clearAllLocalData,
    communityOrg,
    serverAuthToken,
  } = useApp();

  const [serverOrgs, setServerOrgs] = useState<
    Array<{ id: string; name: string; district: string; verificationStatus: string }>
  >([]);

  useEffect(() => {
    if (!serverAuthToken) {
      setServerOrgs([]);
      return;
    }
    fetch('/api/community/orgs/mine', {
      headers: { Authorization: `Bearer ${serverAuthToken}` },
    })
      .then(r => (r.ok ? r.json() : { orgs: [] }))
      .then(d => setServerOrgs(d.orgs || []))
      .catch(() => {});
  }, [serverAuthToken, communityOnboarding?.completed]);

  const [activeTab, setActiveTab] = useState<CommunityActiveTab>(
    (initialTab as CommunityActiveTab) || 'dashboard'
  );
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const [openCreateProgrammeModal, setOpenCreateProgrammeModal] = useState(false);
  const [openCreateEventModal, setOpenCreateEventModal] = useState(false);
  const [openCreateTaskModal, setOpenCreateTaskModal] = useState(false);
  const [programmeDraftFromIdea, setProgrammeDraftFromIdea] = useState<CommunityProgrammeDraft | null>(null);
  const [preselectedDistrict, setPreselectedDistrict] = useState<string | null>(null);
  const [preselectedHint, setPreselectedHint] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab as CommunityActiveTab);
    }
  }, [initialTab]);

  const handleSelectTab = (next: CommunityActiveTab) => {
    setActiveTab(next);
    onTabChange?.(next);
  };

  const needsOnboarding = !communityOnboarding || !communityOnboarding.completed;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-900">
      {needsOnboarding && (
        <CommunityOnboardingModal isOpen={true} onClose={() => {}} />
      )}

      {/* Minimal Top Command Bar (Single Features Hub Popover, Zero Edge Clutter) */}
      <CommunityTopHeader
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        onOpenQuickAdd={() => setShowQuickAddModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 md:pb-12">
        <div key={`community-${activeTab}`} className="animate-tab-fade">
          {activeTab === 'dashboard' && (
            <CommunityDashboardView
              onNavigateTab={handleSelectTab}
              onOpenCreateProgramme={() => {
                handleSelectTab('programmes');
                setOpenCreateProgrammeModal(true);
              }}
              onOpenCreateEvent={() => {
                handleSelectTab('events');
                setOpenCreateEventModal(true);
              }}
              onOpenCreateTask={() => {
                setActiveTab('team_tasks');
                setOpenCreateTaskModal(true);
              }}
            />
          )}

          {activeTab === 'intelligence' && (
            <CommunityIntelligenceView
              onNavigateTab={setActiveTab}
              onStartIdeaForDistrict={(dist, hint) => {
                setPreselectedDistrict(dist);
                setPreselectedHint(hint);
                setActiveTab('strategy_lab');
              }}
            />
          )}

          {activeTab === 'strategy_lab' && (
            <CommunityStrategyLabView
              preselectedDistrict={preselectedDistrict}
              preselectedHint={preselectedHint}
              onClearPreselect={() => {
                setPreselectedDistrict(null);
                setPreselectedHint(null);
              }}
              onConvertToProgramme={draft => {
                setProgrammeDraftFromIdea(draft);
                setActiveTab('programmes');
                setOpenCreateProgrammeModal(true);
              }}
            />
          )}

          {activeTab === 'generator' && (
            <CommunityActionGeneratorPanel onNavigateTab={setActiveTab} />
          )}
          {activeTab === 'map' && <PreventionIntelligenceMapPanel />}
          {activeTab === 'gaps' && <PreventionGapDetectorPanel onNavigateTab={setActiveTab} />}
          {activeTab === 'exchange' && (
            <CommunityInnovationExchangePanel onNavigateTab={setActiveTab} />
          )}

          {activeTab === 'programmes' && (
            <CommunityProgrammesView
              isCreateOpen={openCreateProgrammeModal}
              onCloseCreate={() => setOpenCreateProgrammeModal(false)}
              initialDraft={programmeDraftFromIdea}
              onClearDraft={() => setProgrammeDraftFromIdea(null)}
            />
          )}

          {activeTab === 'events' && (
            <CommunityEventsView
              isCreateOpen={openCreateEventModal}
              onCloseCreate={() => setOpenCreateEventModal(false)}
            />
          )}

          {activeTab === 'team_tasks' && (
            <CommunityTeamTasksView
              isCreateTaskOpen={openCreateTaskModal}
              onCloseCreateTask={() => setOpenCreateTaskModal(false)}
            />
          )}

          {activeTab === 'resources' && <CommunityResourcesView />}
          {activeTab === 'campaigns' && <CommunityCampaignsView />}
          {activeTab === 'feedback' && <CommunityFeedbackView />}
          {(activeTab === 'analytics' || activeTab === ('impact' as CommunityActiveTab)) && (
            <CommunityAnalyticsView />
          )}
          {activeTab === 'partners' && <CommunityPartnersView />}
          {activeTab === 'ai_guide' && <CommunityGuideView />}
          {activeTab === 'reports' && <CommunityReportsView />}
        </div>
      </main>

      {/* Quick Add Modal */}
      {showQuickAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Quick Operations Add</h2>
              <button
                onClick={() => setShowQuickAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  setShowQuickAddModal(false);
                  setActiveTab('programmes');
                  setOpenCreateProgrammeModal(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:border-indigo-700 hover:bg-indigo-50/50 text-left transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Prevention Programme</h3>
                  <p className="text-[11px] text-slate-500">Structured initiative or drive</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowQuickAddModal(false);
                  setActiveTab('events');
                  setOpenCreateEventModal(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:border-indigo-700 hover:bg-indigo-50/50 text-left transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Schedule Activity / Meeting</h3>
                  <p className="text-[11px] text-slate-500">Workshop, assembly, or session</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowQuickAddModal(false);
                  setActiveTab('team_tasks');
                  setOpenCreateTaskModal(true);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-2xl border border-slate-200 hover:border-indigo-700 hover:bg-indigo-50/50 text-left transition-all cursor-pointer"
              >
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Action Item / Task</h3>
                  <p className="text-[11px] text-slate-500">Assign logistical task with deadline</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workspace Settings & Role Switcher Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-800" />
                <h2 className="text-base font-bold text-slate-900">Workspace &amp; Role Settings</h2>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900">
                  {communityOrg?.name || 'Community Workspace'}
                </span>
                {serverOrgs[0] && (
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                      serverOrgs[0].verificationStatus === 'approved'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {serverOrgs[0].verificationStatus === 'approved'
                      ? 'Verified Org'
                      : 'Pending Admin Approval'}
                  </span>
                )}
              </div>
              <p className="text-slate-500">
                {communityOrg?.type?.replace('_', ' ').toUpperCase()} • District: {communityOrg?.district}
              </p>
              <p className="text-slate-500">
                Coordinator: {communityOrg?.coordinatorName} ({communityOrg?.coordinatorDesignation})
              </p>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Language Preference
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLanguage('en')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer ${
                    language === 'en'
                      ? 'bg-indigo-50 border-indigo-700 text-indigo-950'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('ml')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer ${
                    language === 'ml'
                      ? 'bg-indigo-50 border-indigo-700 text-indigo-950'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  മലയാളം (Malayalam)
                </button>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Switch Focused Workspace
              </span>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setRole('personal');
                    setShowSettingsModal(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-indigo-700 hover:bg-indigo-50/50 text-xs text-left cursor-pointer"
                >
                  <span className="font-semibold text-slate-800">Role 01: Recover &amp; Rebuild</span>
                  <span className="text-[10px] text-indigo-800 font-bold uppercase">Switch</span>
                </button>

                <button
                  onClick={() => {
                    setRole('supporter');
                    setShowSettingsModal(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-amber-700 hover:bg-amber-50/50 text-xs text-left cursor-pointer"
                >
                  <span className="font-semibold text-slate-800">Role 02: Supporter Mode</span>
                  <span className="text-[10px] text-amber-800 font-bold uppercase">Switch</span>
                </button>

                <button
                  onClick={() => {
                    setRole('learner');
                    setShowSettingsModal(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:border-indigo-700 hover:bg-indigo-50/50 text-xs text-left cursor-pointer"
                >
                  <span className="font-semibold text-slate-800">Role 03: Learner Lab</span>
                  <span className="text-[10px] text-indigo-800 font-bold uppercase">Switch</span>
                </button>
              </div>
            </div>

            {onOpenPortalAuth && (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                  Authenticated Clinical &amp; Admin Portals
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsModal(false);
                      onOpenPortalAuth('therapist');
                    }}
                    className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-bold text-indigo-950 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Therapist Portal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsModal(false);
                      onOpenPortalAuth('admin');
                    }}
                    className="p-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-950 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Admin Portal</span>
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  clearAllLocalData();
                  setShowSettingsModal(false);
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Local Vault Data</span>
              </button>

              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
