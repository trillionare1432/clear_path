import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ROLE_FEATURE_CATALOG, ROLE_THEME_META } from '../constants/featureCatalog';
import { UserRole } from '../types';
import { ClearPathLogo } from './ClearPathLogo';
import { RedHelpDot } from './RedHelpDot';
import { NotificationCentreModal } from './NotificationCentreModal';
import { AuthModal } from './AuthModal';
import { copyPhoneToClipboard, VERIFIED_HELPLINES } from '../utils/clipboard';
import {
  Menu,
  Sun,
  Moon,
  Search,
  Bell,
  PhoneCall,
  Globe,
  User,
  UserCheck,
  ShieldAlert,
  Home,
  Radar,
  NotebookPen,
  Gamepad2,
  Wind,
  Target,
  Compass,
  Sparkles,
  BarChart3,
  MapPin,
  Calendar,
  BookOpen,
  SlidersHorizontal,
  MessageSquareHeart,
  Lightbulb,
  ClipboardList,
  Heart,
  GraduationCap,
  Award,
  Building2,
  AlertTriangle,
  Share2,
  Layers,
  Users,
  Megaphone,
  FileBarChart,
  Copy,
  Check,
  X,
  FlaskConical,
  FileText,
  Stethoscope,
  Shield,
  Database,
  Brain,
  Briefcase,
} from 'lucide-react';

interface MinimalTopCommandBarProps {
  role: UserRole;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenRoleSwitcher: () => void;
}

const FEATURE_ICON_MAP: Record<string, React.ElementType> = {
  Home,
  Radar,
  NotebookPen,
  Gamepad2,
  Wind,
  Target,
  Compass,
  Sparkles,
  BarChart3,
  MapPin,
  Calendar,
  BookOpen,
  SlidersHorizontal,
  MessageSquareHeart,
  Lightbulb,
  ClipboardList,
  Heart,
  GraduationCap,
  Award,
  Building2,
  AlertTriangle,
  Share2,
  Layers,
  Users,
  Megaphone,
  PhoneCall,
  FileBarChart,
  FlaskConical,
  FileText,
  UserCheck,
  Database,
  Brain,
};

export const MinimalTopCommandBar: React.FC<MinimalTopCommandBarProps> = ({
  role,
  currentTab,
  onSelectTab,
  onOpenRoleSwitcher,
}) => {
  const {
    language,
    setLanguage,
    themeMode,
    setThemeMode,
    setRole,
    userProfile,
    notifications,
    consentPrefs,
    setPortalMode,
    serverAuthUser,
    openAiAssistant,
    t,
  } = useApp();

  const [hubOpen, setHubOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifOpen, setNotifOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authDefaultMode, setAuthDefaultMode] = useState<'signin' | 'signup' | 'therapist' | 'admin'>('signup');
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const hubRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (hubRef.current && !hubRef.current.contains(e.target as Node)) {
        setHubOpen(false);
      }
    };
    if (hubOpen) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [hubOpen]);

  const roleTheme = ROLE_THEME_META[role];
  const roleFeatures = ROLE_FEATURE_CATALOG.filter(f => f.role === role);
  const activeFeature = roleFeatures.find(f => f.tabKey === currentTab) || roleFeatures[0];

  const unreadCount = notifications.filter(n => {
    if (n.read) return false;
    if (!consentPrefs.receiveCrossRoleAnnouncements && n.targetRole !== role && n.category !== 'system') {
      return false;
    }
    return n.targetRole === role || n.category === 'system';
  }).length;

  const filteredFeatures = roleFeatures.filter(f => {
    const q = searchQuery.toLowerCase();
    if (!q) return true;
    return (
      f.title.toLowerCase().includes(q) ||
      f.titleMl.toLowerCase().includes(q) ||
      f.tagline.toLowerCase().includes(q)
    );
  });

  const handleDeepLink = (targetRole: UserRole, tab: string) => {
    if (targetRole !== role) {
      setRole(targetRole);
    }
    onSelectTab(tab);
  };

  const handleCopyHelpline = async (num: string) => {
    const ok = await copyPhoneToClipboard(num);
    if (ok) {
      setCopiedPhone(num);
      window.setTimeout(() => setCopiedPhone(null), 2000);
    }
  };

  const ActiveIcon = (activeFeature?.iconName && FEATURE_ICON_MAP[activeFeature.iconName]) || Compass;
  const quickDesktopFeatures = roleFeatures.slice(0, 5);
  const mobilePrimaryTab =
    role === 'supporter'
      ? { tab: 'understand', label: language === 'ml' ? 'വഴികാട്ടി' : 'Guides', Icon: BookOpen }
      : role === 'learner'
        ? { tab: 'pathways', label: language === 'ml' ? 'പഠനം' : 'Topics', Icon: GraduationCap }
        : role === 'community'
          ? { tab: 'generator', label: language === 'ml' ? 'പ്ലാനർ' : 'Planner', Icon: Sparkles }
          : { tab: 'dailylog', label: language === 'ml' ? 'ചെക്ക്-ഇൻ' : 'Log', Icon: NotebookPen };
  const mobileSecondaryTab =
    role === 'supporter'
      ? { tab: 'plan', label: language === 'ml' ? 'പ്ലാൻ' : 'Plan', Icon: ClipboardList }
      : role === 'learner'
        ? { tab: 'interactive', label: language === 'ml' ? 'സിമുലേറ്റർ' : 'Practice', Icon: Brain }
        : role === 'community'
          ? { tab: 'gaps', label: language === 'ml' ? 'വിടവുകൾ' : 'Gaps', Icon: AlertTriangle }
          : { tab: 'opportunities', label: language === 'ml' ? 'അവസരങ്ങൾ' : 'Opps', Icon: Briefcase };
  const MobilePrimaryIcon = mobilePrimaryTab.Icon;
  const MobileSecondaryIcon = mobileSecondaryTab.Icon;

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-2.5 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Zone 1: Protected Brand Identity + Home Button (Never hidden or squished) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
          <button
            type="button"
            onClick={() => setRole(null)}
            className="inline-flex items-center justify-center gap-1.5 min-w-[40px] min-h-[40px] sm:w-auto sm:h-auto sm:px-2.5 sm:py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 hover:text-slate-950 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            title={language === 'ml' ? 'ഹോം പേജ്' : 'ClearPath AI Home'}
            aria-label={language === 'ml' ? 'ഹോം പേജ്' : 'ClearPath AI Home'}
          >
            <Home className="w-4 h-4 shrink-0" />
            <span className="hidden md:inline">{language === 'ml' ? 'ഹോം' : 'Home'}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('dashboard')}
            className="text-left focus-visible:outline-2 focus-visible:outline-indigo-700 rounded-xl cursor-pointer shrink-0"
            title={language === 'ml' ? 'പ്രധാന ഡാഷ്‌ബോർഡ്' : 'Workspace Overview'}
          >
            <ClearPathLogo
              size="sm"
              subtitle={language === 'ml' ? roleTheme.titleMl : roleTheme.title}
              hideSubtitleMobile
            />
          </button>
        </div>

        {/* Zone 2: Global Clarity + Ask AI + Compact Utility Controls + Feature Hub */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Active tab indicator badge only on xl desktop */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs font-semibold text-slate-700 whitespace-nowrap">
            <ActiveIcon className={`w-3.5 h-3.5 ${roleTheme.accentText}`} />
            <span className="truncate max-w-[140px]">
              {language === 'ml' ? activeFeature?.titleMl : activeFeature?.title}
            </span>
          </div>

          {/* Direct Shared Ask AI Drawer Button */}
          <button
            type="button"
            onClick={() => openAiAssistant({ role })}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors whitespace-nowrap cursor-pointer shrink-0"
            title={language === 'ml' ? 'AI-യോട് ചോദിക്കൂ' : 'Ask ClearPath AI'}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{language === 'ml' ? 'AI സഹായി' : 'Ask AI'}</span>
          </button>

          {/* Fixed Global Clarity Button across ALL Roles & ALL Features */}
          <RedHelpDot role={role} tabKey={currentTab} iconOnlyMobile />

          {/* 24/7 Helpline (Always visible on mobile & desktop) */}
          <button
            type="button"
            onClick={() => setEmergencyOpen(true)}
            className="inline-flex items-center justify-center gap-1 min-h-[36px] sm:min-h-0 px-2 sm:px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer shrink-0"
            title="24/7 Emergency & Vimukthi Helplines (112 / 14405)"
            aria-label="Open Emergency Helplines 112 and 14405"
          >
            <PhoneCall className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="tabular-nums">14405</span>
          </button>

          {/* Real Notification Bell */}
          <button
            type="button"
            onClick={() => setNotifOpen(true)}
            className="relative w-8 h-8 sm:w-auto sm:h-auto sm:p-2 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer"
            title={language === 'ml' ? 'അറിയിപ്പുകൾ' : 'Activity Notifications'}
            aria-label="Open Activity Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Compact 1-tap Day/Night Toggle on <sm Android screens */}
          <button
            type="button"
            onClick={() => setThemeMode(themeMode === 'day' ? 'night' : 'day')}
            className="sm:hidden w-8 h-8 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer"
            title={themeMode === 'day' ? 'Switch to Night Mode' : 'Switch to Day Mode'}
            aria-label="Toggle Day and Night Mode"
          >
            {themeMode === 'day' ? (
              <Sun className="w-4 h-4 text-amber-600" />
            ) : (
              <Moon className="w-4 h-4 text-amber-300" />
            )}
          </button>

          {/* Day Mode / Night (Dark) Mode Switcher (sm+) */}
          <div
            className="hidden sm:inline-flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80"
            role="group"
            aria-label={language === 'ml' ? 'ഡേ / നൈറ്റ് മോഡ്' : 'Day and Night Mode'}
          >
            <button
              type="button"
              onClick={() => setThemeMode('day')}
              className={`px-2 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                themeMode === 'day'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={language === 'ml' ? 'ഡേ മോഡ് (ലൈറ്റ്)' : 'Day Mode (Light)'}
              aria-label="Day Mode"
              aria-pressed={themeMode === 'day'}
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{language === 'ml' ? 'പകൽ' : 'Day'}</span>
            </button>
            <button
              type="button"
              onClick={() => setThemeMode('night')}
              className={`px-2 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                themeMode === 'night'
                  ? 'bg-indigo-950 text-amber-300 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={language === 'ml' ? 'നൈറ്റ് മോഡ് (ഡാർക്ക്)' : 'Night Mode (Dark)'}
              aria-label="Night / Dark Mode"
              aria-pressed={themeMode === 'night'}
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{language === 'ml' ? 'രാത്രി' : 'Night'}</span>
            </button>
          </div>

          {/* Language Toggle */}
          <button
            type="button"
            onClick={() => setLanguage(language === 'en' ? 'ml' : 'en')}
            className="w-8 h-8 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[11px] sm:text-xs font-bold sm:font-semibold text-slate-700 inline-flex items-center justify-center gap-1 transition-colors whitespace-nowrap cursor-pointer"
            title="Switch Language (English / മലയാളം)"
          >
            <Globe className={`hidden sm:inline w-3.5 h-3.5 ${roleTheme.accentText}`} />
            <span className="inline">{language === 'en' ? 'മല' : 'EN'}</span>
          </button>

          {/* Account */}
          <button
            type="button"
            onClick={() => {
              setAuthDefaultMode('signup');
              setAuthOpen(true);
            }}
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors whitespace-nowrap cursor-pointer"
          >
            <User className={`w-3.5 h-3.5 ${roleTheme.accentText}`} />
            <span className="max-w-[90px] truncate">{userProfile ? userProfile.name : t('myAccount')}</span>
          </button>

          {/* Admin Console Direct Return when Admin is exploring roles */}
          {serverAuthUser?.role === 'admin' && (
            <button
              type="button"
              onClick={() => setPortalMode('admin')}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-900 hover:bg-teal-950 text-white text-xs font-bold whitespace-nowrap cursor-pointer"
              title="Return to Admin Console"
            >
              <Shield className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">Admin Console</span>
            </button>
          )}

          {/* Switch Role (visible sm+, and inside Hub footer on mobile) */}
          <button
            type="button"
            onClick={onOpenRoleSwitcher}
            className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 whitespace-nowrap cursor-pointer"
            title={t('changeRole')}
          >
            <UserCheck className={`w-3.5 h-3.5 ${roleTheme.accentText}`} />
            <span className="hidden xl:inline">{t('changeRole')}</span>
          </button>

          {/* FAR-RIGHT THREE-LINE MENU FEATURE HUB TRIGGER */}
          <div className="relative" ref={hubRef}>
            <button
              type="button"
              onClick={() => setHubOpen(v => !v)}
              className={`inline-flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:p-2.5 rounded-xl shadow-xs transition-all cursor-pointer shrink-0 ${roleTheme.hubTrigger}`}
              aria-expanded={hubOpen}
              aria-label={language === 'ml' ? 'എല്ലാ ഫീച്ചറുകളും തുറക്കുക' : 'Open Features Menu'}
              title={language === 'ml' ? 'ഫീച്ചർ മെനു' : 'Features Menu'}
            >
              <Menu className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            </button>

            {/* Right-Anchored Visual Icon Hub Popover (Bounded cleanly on Android) */}
            {hubOpen && (
              <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-16 sm:top-full sm:mt-2.5 sm:w-[440px] max-h-[78vh] bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/80 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className={`text-xs font-extrabold uppercase tracking-wider ${roleTheme.accentText}`}>
                        {language === 'ml' ? roleTheme.titleMl : roleTheme.title}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 leading-snug">
                        {language === 'ml' ? roleTheme.builtForMl : roleTheme.builtFor}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHubOpen(false)}
                      className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-500 hover:text-slate-800 rounded-lg cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder={t('searchFeatures')}
                      className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Expressive 3-Column Visual Icon Launcher Grid */}
                <div className="flex-1 overflow-y-auto p-3.5 grid grid-cols-3 gap-2.5">
                  {filteredFeatures.map(item => {
                    const active = item.tabKey === currentTab;
                    const IconComp = (item.iconName && FEATURE_ICON_MAP[item.iconName]) || Compass;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectTab(item.tabKey);
                          setHubOpen(false);
                          setSearchQuery('');
                        }}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer group ${
                          active
                            ? roleTheme.activeChip
                            : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                        }`}
                        title={language === 'ml' ? item.taglineMl : item.tagline}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                            active
                              ? 'bg-white/15 text-white'
                              : `${roleTheme.softBg} ${roleTheme.accentText}`
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold leading-snug line-clamp-2">
                          {language === 'ml' ? item.titleMl : item.title}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                  <span>{roleFeatures.length} tools</span>
                  <button
                    type="button"
                    onClick={() => {
                      setHubOpen(false);
                      onOpenRoleSwitcher();
                    }}
                    className={`font-bold whitespace-nowrap cursor-pointer ${roleTheme.accentText}`}
                  >
                    {language === 'ml' ? 'റോൾ മാറ്റുക' : 'Switch Space'} &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Visible Desktop Workspace Quick-Tab Strip (No Hidden Features!) */}
      <nav
        aria-label={language === 'ml' ? 'പ്രധാന ടൂളുകൾ' : 'Workspace shortcuts'}
        className="hidden md:block bg-white border-b border-slate-200/80 px-6 py-2"
      >
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {quickDesktopFeatures.map(item => {
              const active = item.tabKey === currentTab;
              const IconComp = (item.iconName && FEATURE_ICON_MAP[item.iconName]) || Compass;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.tabKey)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? roleTheme.activeChip
                      : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5 shrink-0" />
                  <span>{language === 'ml' ? item.titleMl : item.title}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setHubOpen(v => !v)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 whitespace-nowrap cursor-pointer"
            >
              {language === 'ml' ? `എല്ലാ ടൂളുകളും (${roleFeatures.length})` : `All Tools (${roleFeatures.length})`}
            </button>
            <button
              type="button"
              onClick={() => openAiAssistant({ role })}
              className="px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-xs font-semibold text-indigo-900 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>{language === 'ml' ? 'AI ചാറ്റ് & ചരിത്രം' : 'AI Chat & History'}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Compact Mobile Thumb-Zone Quick Bar (5 clean slots, >= 44px touch targets) */}
      <nav
        aria-label={language === 'ml' ? 'മൊബൈൽ ക്വിക്ക് നാവിഗേഷൻ' : 'Mobile quick navigation'}
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-14 bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-5 items-center px-1"
      >
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold cursor-pointer ${
            currentTab === 'dashboard' ? roleTheme.accentText : 'text-slate-600'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="truncate">{language === 'ml' ? 'ഹബ്' : 'Hub'}</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab(mobilePrimaryTab.tab)}
          className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold cursor-pointer ${
            currentTab === mobilePrimaryTab.tab ? roleTheme.accentText : 'text-slate-600'
          }`}
        >
          <MobilePrimaryIcon className="w-4 h-4" />
          <span className="truncate">{mobilePrimaryTab.label}</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab(mobileSecondaryTab.tab)}
          className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold cursor-pointer ${
            currentTab === mobileSecondaryTab.tab ? roleTheme.accentText : 'text-slate-600'
          }`}
        >
          <MobileSecondaryIcon className="w-4 h-4" />
          <span className="truncate">{mobileSecondaryTab.label}</span>
        </button>

        <button
          type="button"
          onClick={() => openAiAssistant({ role })}
          className="min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold text-indigo-700 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span className="truncate">{language === 'ml' ? 'AI' : 'Ask AI'}</span>
        </button>

        <button
          type="button"
          onClick={() => setHubOpen(v => !v)}
          className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold cursor-pointer ${
            hubOpen ? roleTheme.accentText : 'text-slate-600'
          }`}
        >
          <Menu className="w-4 h-4" />
          <span className="truncate">{language === 'ml' ? 'എല്ലാം' : 'Tools'}</span>
        </button>
      </nav>

      {/* Real Activity Notifications Modal */}
      <NotificationCentreModal
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        onNavigateDeepLink={handleDeepLink}
      />

      {/* Profile / Account Auth Modal */}
      <AuthModal isOpen={authOpen} defaultMode={authDefaultMode} onClose={() => setAuthOpen(false)} />

      {/* 24/7 Confidential Helpline Modal with Android Call + Copy */}
      {emergencyOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <ShieldAlert className="w-5 h-5" />
                <span>{language === 'ml' ? '24/7 സൗജന്യ അടിയന്തര സഹായം' : '24/7 Confidential Helplines'}</span>
              </div>
              <button
                type="button"
                onClick={() => setEmergencyOpen(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                {language === 'ml' ? 'അടയ്ക്കുക' : 'Close'}
              </button>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {language === 'ml'
                ? 'മൊബൈൽ ഫോണുകളിൽ നേരിട്ട് വിളിക്കാനോ നമ്പർ കോപ്പി ചെയ്യാനോ സാധിക്കും.'
                : 'Tap Call to dial directly, or Copy Number to paste into your phone.'}
            </p>

            <div className="space-y-3 text-sm">
              {VERIFIED_HELPLINES.map(line => {
                const copied = copiedPhone === line.number;
                return (
                  <div
                    key={line.id}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900">
                        {language === 'ml' ? line.nameMl : line.name}
                      </div>
                      <div className="text-xs text-slate-600 mt-0.5">
                        {language === 'ml' ? line.descMl : line.desc}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyHelpline(line.number)}
                        className="px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                        title={`Copy ${line.number}`}
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                      <a
                        href={`tel:${line.number}`}
                        className="px-3.5 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold tabular-nums inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>{line.number}</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
