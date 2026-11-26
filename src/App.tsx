import React, { useState, useEffect, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ClearPathHome } from './components/ClearPathHome';
import { RoleSwitcherModal } from './components/RoleSwitcherModal';
import { UserRole } from './types';

// Role 01: Personal Journey Components & Views
import { PersonalOnboardingModal } from './components/PersonalOnboardingModal';
import { TopHeader } from './components/TopHeader';
import { DashboardView } from './views/DashboardView';
import { JourneyView } from './views/JourneyView';
import { CalendarView } from './views/CalendarView';
import { DailyLogView } from './views/DailyLogView';
import { ProgressView } from './views/ProgressView';
import { RebuildView } from './views/RebuildView';
import { CognitiveGamesView } from './views/CognitiveGamesView';
import { GuidedToolsView } from './views/GuidedToolsView';
import { SupportDirectoryView } from './views/SupportDirectoryView';
import { ClearPathGuideView } from './views/ClearPathGuideView';
import { SettingsView } from './views/SettingsView';
import { EarlySupportNavigatorView } from './views/EarlySupportNavigatorView';
import { ClearPathEcosystemView } from './views/ClearPathEcosystemView';
import { GetMyReportView } from './views/GetMyReportView';
import { OpportunitiesView } from './views/OpportunitiesView';
import { ProfessionalSupportView } from './views/ProfessionalSupportView';
import { TherapistDashboardView } from './views/TherapistDashboardView';
import { AdminVerificationView } from './views/AdminVerificationView';
import { MissionView } from './views/MissionView';
import { AuthModal } from './components/AuthModal';

// Role 02: Supporter Experience Components & Views
import { SupporterOnboardingModal } from './components/SupporterOnboardingModal';
import { SupporterTopHeader } from './components/SupporterTopHeader';
import { SupporterDashboardView } from './views/supporter/SupporterDashboardView';
import { SupporterUnderstandView } from './views/supporter/SupporterUnderstandView';
import { SupporterTalkConnectView } from './views/supporter/SupporterTalkConnectView';
import { SupporterPlanView } from './views/supporter/SupporterPlanView';
import { SupporterCalendarView } from './views/supporter/SupporterCalendarView';
import { SupporterReflectionsView } from './views/supporter/SupporterReflectionsView';
import { SupporterProgressView } from './views/supporter/SupporterProgressView';
import { SupporterWellbeingView } from './views/supporter/SupporterWellbeingView';
import { SupporterGuideView } from './views/supporter/SupporterGuideView';

// Role 03: Learner Experience Components & Views
import { LearnerTopHeader } from './components/LearnerTopHeader';
import { LearnerOnboardingModal } from './components/LearnerOnboardingModal';
import { LearnerDashboardView } from './views/learner/LearnerDashboardView';
import { LearnerPathwaysView } from './views/learner/LearnerPathwaysView';
import { LearnerLibraryView } from './views/learner/LearnerLibraryView';
import { LearnerInteractiveView } from './views/learner/LearnerInteractiveView';
import { LearnerCalendarView } from './views/learner/LearnerCalendarView';
import { LearnerJournalView } from './views/learner/LearnerJournalView';
import { LearnerAnalyticsView } from './views/learner/LearnerAnalyticsView';
import { LearnerGuideView } from './views/learner/LearnerGuideView';
import { LearnerSupportView } from './views/learner/LearnerSupportView';
import { LearnerPlannerView } from './views/learner/LearnerPlannerView';
import { LearnerCertificateView } from './views/learner/LearnerCertificateView';

// Role 04: Community Builder Workspace
import { CommunityBuilderWorkspace } from './views/community/CommunityBuilderWorkspace';
import { AdaptiveRolePlaceholderView } from './views/AdaptiveRolePlaceholderView';
import { ClearPathAiChat } from './components/ClearPathAiChat';

function ClearPathMain() {
  const {
    currentRole,
    setRole,
    portalMode,
    setPortalMode,
    vaultScope,
    personalOnboarding,
    savePersonalOnboarding,
    supporterOnboarding,
    learnerOnboarding,
    gmpQuotaExceeded,
    registerRoleTabNavigator,
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const pendingTabRef = useRef<string | null>(null);
  const [isRoleSwitcherOpen, setIsRoleSwitcherOpen] = useState(false);
  const [portalAuthMode, setPortalAuthMode] = useState<'therapist' | 'admin' | null>(null);
  const [showPersonalOnboarding, setShowPersonalOnboarding] = useState(false);
  const [showSupporterOnboarding, setShowSupporterOnboarding] = useState(false);
  const [showLearnerOnboarding, setShowLearnerOnboarding] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1') {
      setRole('personal');
      savePersonalOnboarding({
        primaryNeed: 'Building a steady daily routine and clear mind.',
        assistanceTypes: ['Understanding and information.', 'Building a daily routine.'],
        language: 'en',
        storagePreference: 'private',
        supportPreferences: {
          reminders: true,
          trustedSupporter: false,
          professionalFinder: true,
        },
        completed: true,
      });
      setShowPersonalOnboarding(false);
    }
  }, [setRole, savePersonalOnboarding]);

  useEffect(() => {
    if (currentRole === 'personal' && !personalOnboarding?.completed) {
      setShowPersonalOnboarding(true);
    } else {
      setShowPersonalOnboarding(false);
    }
  }, [currentRole, personalOnboarding]);

  useEffect(() => {
    if (currentRole === 'supporter' && !supporterOnboarding?.completed) {
      setShowSupporterOnboarding(true);
    } else {
      setShowSupporterOnboarding(false);
    }
  }, [currentRole, supporterOnboarding]);

  useEffect(() => {
    if (currentRole === 'learner' && !learnerOnboarding?.completed) {
      setShowLearnerOnboarding(true);
    } else {
      setShowLearnerOnboarding(false);
    }
  }, [currentRole, learnerOnboarding]);

  useEffect(() => {
    if (pendingTabRef.current) {
      setActiveTab(pendingTabRef.current);
      pendingTabRef.current = null;
    } else {
      setActiveTab('dashboard');
    }
  }, [currentRole, vaultScope]);

  const handleNavigateRoleTab = (role: UserRole, tab = 'dashboard') => {
    if (role === currentRole) {
      setActiveTab(tab);
      return;
    }
    pendingTabRef.current = tab;
    setRole(role);
  };

  useEffect(() => {
    registerRoleTabNavigator(handleNavigateRoleTab);
  });

  const QuotaBanner = gmpQuotaExceeded ? (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
      <span>
        Unable to load interactive map right now. Please check your network or API quota.{' '}
        <a
          href="https://developers.google.com/maps/documentation/javascript/error-messages?utm_campaign=gmp_mcp_codeassist_v1_aistudio#over-quota-map-error"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold text-amber-950 hover:text-amber-800"
        >
          View error documentation
        </a>
        .
      </span>
    </div>
  ) : null;

  // 0. Dedicated Authenticated Therapist or Admin Portal
  if (portalMode === 'therapist') {
    return (
      <>
        {QuotaBanner}
        <TherapistDashboardView />
      </>
    );
  }

  if (portalMode === 'admin') {
    return (
      <>
        {QuotaBanner}
        <AdminVerificationView />
      </>
    );
  }

  if (portalMode === 'mission') {
    return (
      <>
        {QuotaBanner}
        <MissionView
          onBack={() => setPortalMode('none')}
          onOpenRole={(role, tab) => {
            setPortalMode('none');
            handleNavigateRoleTab(role, tab || 'dashboard');
          }}
        />
      </>
    );
  }

  // 1. ClearPath AI Home
  if (!currentRole) {
    return (
      <>
        {QuotaBanner}
        <ClearPathHome onNavigateRoleTab={handleNavigateRoleTab} />
        <ClearPathAiChat variant="drawer" role="home" />
      </>
    );
  }

  // 2. ROLE 02: SUPPORTER FULL WORKSPACE
  if (currentRole === 'supporter') {
    return (
      <div className="min-h-screen bg-[#FFFBF5] text-slate-900 flex flex-col justify-between selection:bg-orange-100 selection:text-orange-950">
        {QuotaBanner}
        <SupporterTopHeader
          currentTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
        />

        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto w-full pb-24 md:pb-12">
          <div key={`${vaultScope}-supporter-${activeTab}`} className="animate-tab-fade">
            {activeTab === 'dashboard' && (
              <SupporterDashboardView
                onSelectTab={setActiveTab}
                onOpenQuickReflection={() => setActiveTab('reflections')}
              />
            )}
            {activeTab === 'understand' && <SupporterUnderstandView onSelectTab={setActiveTab} />}
            {activeTab === 'talk' && <SupporterTalkConnectView />}
            {activeTab === 'plan' && <SupporterPlanView onSelectTab={setActiveTab} />}
            {activeTab === 'calendar' && <SupporterCalendarView />}
            {(activeTab === 'reflections' || activeTab === 'journal') && <SupporterReflectionsView />}
            {activeTab === 'progress' && <SupporterProgressView />}
            {activeTab === 'wellbeing' && <SupporterWellbeingView />}
            {(activeTab === 'support' || activeTab === 'match') && <SupportDirectoryView />}
            {activeTab === 'guide' && <SupporterGuideView />}
            {activeTab === 'settings' && (
              <SettingsView onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)} />
            )}
          </div>
        </main>

        <RoleSwitcherModal
          isOpen={isRoleSwitcherOpen}
          onClose={() => setIsRoleSwitcherOpen(false)}
          onOpenPortalAuth={mode => setPortalAuthMode(mode)}
        />

        {showSupporterOnboarding && (
          <SupporterOnboardingModal onComplete={() => setShowSupporterOnboarding(false)} />
        )}
        <AuthModal
          isOpen={portalAuthMode !== null}
          defaultMode={portalAuthMode || 'therapist'}
          onClose={() => setPortalAuthMode(null)}
        />
        <ClearPathAiChat variant="drawer" role="supporter" />
      </div>
    );
  }

  // 3. ROLE 03: LEARNER FULL WORKSPACE
  if (currentRole === 'learner') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between selection:bg-sky-100 selection:text-blue-950">
        {QuotaBanner}
        <LearnerTopHeader
          currentTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
        />

        <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto w-full pb-24 md:pb-12">
          <div key={`${vaultScope}-learner-${activeTab}`} className="animate-tab-fade">
            {activeTab === 'dashboard' && <LearnerDashboardView onSelectTab={setActiveTab} />}
            {activeTab === 'pathways' && <LearnerPathwaysView />}
            {activeTab === 'research' && <LearnerPathwaysView initialTab="substance_lab" />}
            {activeTab === 'planner' && <LearnerPlannerView />}
            {activeTab === 'certificate' && <LearnerCertificateView />}
            {activeTab === 'library' && <LearnerLibraryView />}
            {activeTab === 'interactive' && (
              <LearnerInteractiveView onSelectTab={setActiveTab} />
            )}
            {activeTab === 'missions' && (
              <ClearPathEcosystemView onSelectTab={setActiveTab} />
            )}
            {activeTab === 'calendar' && <LearnerCalendarView />}
            {activeTab === 'journal' && <LearnerJournalView />}
            {activeTab === 'analytics' && <LearnerAnalyticsView />}
            {activeTab === 'guide' && <LearnerGuideView />}
            {activeTab === 'support' && <LearnerSupportView />}
            {activeTab === 'settings' && (
              <SettingsView onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)} />
            )}
          </div>
        </main>

        <RoleSwitcherModal
          isOpen={isRoleSwitcherOpen}
          onClose={() => setIsRoleSwitcherOpen(false)}
          onOpenPortalAuth={mode => setPortalAuthMode(mode)}
        />

        {showLearnerOnboarding && (
          <LearnerOnboardingModal onComplete={() => setShowLearnerOnboarding(false)} />
        )}
        <AuthModal
          isOpen={portalAuthMode !== null}
          defaultMode={portalAuthMode || 'therapist'}
          onClose={() => setPortalAuthMode(null)}
        />
        <ClearPathAiChat variant="drawer" role="learner" />
      </div>
    );
  }

  // 4. ROLE 04: COMMUNITY BUILDER FULL WORKSPACE
  if (currentRole === 'community') {
    return (
      <>
        {QuotaBanner}
        <CommunityBuilderWorkspace
          key={`${vaultScope}-community`}
          initialTab={activeTab}
          onTabChange={setActiveTab}
          onOpenPortalAuth={mode => setPortalAuthMode(mode)}
        />
        <AuthModal
          isOpen={portalAuthMode !== null}
          defaultMode={portalAuthMode || 'therapist'}
          onClose={() => setPortalAuthMode(null)}
        />
        <ClearPathAiChat variant="drawer" role="community" />
      </>
    );
  }

  // Fallback
  if (currentRole !== 'personal') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between">
        {QuotaBanner}
        <TopHeader
          currentTab="dashboard"
          onSelectTab={() => {}}
          onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-8">
          <AdaptiveRolePlaceholderView
            role={currentRole}
            onSwitchToPersonal={() => setRole('personal')}
            onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
          />
        </main>
        <RoleSwitcherModal
          isOpen={isRoleSwitcherOpen}
          onClose={() => setIsRoleSwitcherOpen(false)}
        />
      </div>
    );
  }

  // 5. ROLE 01: PERSONAL JOURNEY FULL WORKSPACE (DEEP INDIGO + WARM SUNRISE AMBER)
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between selection:bg-indigo-100 selection:text-indigo-950">
      {QuotaBanner}
      <TopHeader
        currentTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)}
      />

      <main className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-7xl mx-auto w-full pb-24 md:pb-12">
        <div key={`${vaultScope}-personal-${activeTab}`} className="animate-tab-fade">
          {activeTab === 'dashboard' && (
            <DashboardView
              onSelectTab={setActiveTab}
              onOpenQuickLog={() => setActiveTab('dailylog')}
              onEditOnboarding={() => setShowPersonalOnboarding(true)}
            />
          )}
          {activeTab === 'journey' && <JourneyView onSelectTab={setActiveTab} />}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'dailylog' && <DailyLogView />}
          {activeTab === 'progress' && <ProgressView />}
          {activeTab === 'opportunities' && <OpportunitiesView />}
          {activeTab === 'rebuild' && <RebuildView />}
          {activeTab === 'games' && <CognitiveGamesView />}
          {activeTab === 'tools' && <GuidedToolsView />}
          {activeTab === 'navigator' && <EarlySupportNavigatorView onSelectTab={setActiveTab} />}
          {activeTab === 'report' && <GetMyReportView />}
          {activeTab === 'professional' && <ProfessionalSupportView onSelectTab={setActiveTab} />}
          {activeTab === 'ecosystem' && <ClearPathEcosystemView onSelectTab={setActiveTab} />}
          {activeTab === 'support' && <SupportDirectoryView />}
          {activeTab === 'guide' && <ClearPathGuideView />}
          {activeTab === 'settings' && (
            <SettingsView onOpenRoleSwitcher={() => setIsRoleSwitcherOpen(true)} />
          )}
        </div>
      </main>

      <RoleSwitcherModal
        isOpen={isRoleSwitcherOpen}
        onClose={() => setIsRoleSwitcherOpen(false)}
        onOpenPortalAuth={mode => setPortalAuthMode(mode)}
      />

      {showPersonalOnboarding && (
        <PersonalOnboardingModal
          allowClose={Boolean(personalOnboarding?.completed)}
          onComplete={() => setShowPersonalOnboarding(false)}
        />
      )}
      <AuthModal
        isOpen={portalAuthMode !== null}
        defaultMode={portalAuthMode || 'therapist'}
        onClose={() => setPortalAuthMode(null)}
      />
      <ClearPathAiChat variant="drawer" role="personal" />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ClearPathMain />
    </AppProvider>
  );
}
