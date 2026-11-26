import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { ClearPathLogo } from './ClearPathLogo';
import { RedHelpDot } from './RedHelpDot';
import { AuthModal } from './AuthModal';
import { UnderstandAppBox } from './UnderstandAppBox';
import { ROLE_THEME_META } from '../constants/featureCatalog';
import { copyPhoneToClipboard, VERIFIED_HELPLINES } from '../utils/clipboard';
import heroRenewalImg from '../assets/images/home_hero_ecosystem_1794930645644.jpg';
import {
  ArrowRight,
  Compass,
  HeartHandshake,
  GraduationCap,
  Building2,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Send,
  User,
  LogOut,
  Loader2,
  AlertTriangle,
  Copy,
  Check,
  Gamepad2,
  CheckCircle2,
  Lightbulb,
  Share2,
  X,
  Sun,
  Moon,
  Stethoscope,
} from 'lucide-react';

interface ClearPathHomeProps {
  onNavigateRoleTab?: (role: UserRole, tab: string) => void;
}

interface AiNavResult {
  reply: string;
  suggestedRole: UserRole;
  suggestedTab: string;
  suggestedActionLabel: string;
  secondaryTip: string;
  needsEmergencyHelp?: boolean;
  source?: string;
}

type FooterTopicId =
  | 'about'
  | 'mission'
  | 'support'
  | 'partner'
  | 'contact'
  | 'privacy'
  | 'government';

export const ClearPathHome: React.FC<ClearPathHomeProps> = ({ onNavigateRoleTab }) => {
  const {
    language,
    setLanguage,
    themeMode,
    setThemeMode,
    setRole,
    setPortalMode,
    serverAuthUser,
    userProfile,
    logoutUser,
    communityProgrammes,
    communityEvents,
    exchangeItems,
    missions,
    timelineEvents,
    openAiAssistant,
    personalizationProfile,
  } = useApp();

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authDefaultMode, setAuthDefaultMode] = useState<'signin' | 'signup' | 'therapist' | 'admin'>('signup');
  const [intendedAuthRole, setIntendedAuthRole] = useState<UserRole | null>(null);

  // Interactive Hero AI Navigator state
  const [aiQuery, setAiQuery] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiNavResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Homepage Interactive Myth Flip teaser state
  const [mythRevealed, setMythRevealed] = useState(false);

  // Android Helpline copy state
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Hero visual fallback toggle
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  // Interactive Footer Detail state
  const [activeFooterTopic, setActiveFooterTopic] = useState<FooterTopicId | null>(null);

  // Small button opens "Understand This App" modal without overwhelming home page
  const [showUnderstandModal, setShowUnderstandModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const runAiNavigator = async (customQuery?: string) => {
    const queryToSend = (customQuery ?? aiQuery).trim();
    if (!queryToSend) return;
    if (customQuery) setAiQuery(customQuery);
    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch('/api/ai/navigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryToSend, language }),
      });
      if (!res.ok) throw new Error('Unable to reach ClearPath AI Navigator');
      const data: AiNavResult = await res.json();
      setAiResult(data);
    } catch {
      setAiError(
        language === 'ml'
          ? 'നിർദ്ദേശം തയ്യാറാക്കാൻ കഴിഞ്ഞില്ല. താഴെയുള്ള വഴികളിൽ ഒന്ന് നേരിട്ട് തിരഞ്ഞെടുക്കാം.'
          : 'Could not reach assistant right now. Select a role card below to proceed immediately.'
      );
    } finally {
      setAiLoading(false);
    }
  };

  const enterRoleAndTab = (role: UserRole, tab = 'dashboard') => {
    if (onNavigateRoleTab) {
      onNavigateRoleTab(role, tab);
    } else {
      setRole(role);
    }
  };

  const openAuthForRole = (
    role: UserRole | null,
    mode: 'signin' | 'signup' | 'therapist' | 'admin' = 'signup'
  ) => {
    setIntendedAuthRole(role);
    setAuthDefaultMode(mode);
    setIsAuthOpen(true);
  };

  const handleCopyNumber = async (num: string) => {
    const ok = await copyPhoneToClipboard(num);
    if (ok) {
      setCopiedPhone(num);
      setTimeout(() => setCopiedPhone(null), 1800);
    }
  };

  // Real collective metrics (zero fabricated counts, zero personal recovery exposure)
  const impactStats = useMemo(() => {
    const districtSet = new Set<string>();
    communityProgrammes.forEach(p => {
      if (p.district) districtSet.add(p.district);
    });
    exchangeItems.forEach(item => {
      if (item.district) districtSet.add(item.district);
    });
    const completedQuestSteps = missions.reduce((sum, m) => sum + m.completedStepIndices.length, 0);

    return {
      programmes: communityProgrammes.length,
      events: communityEvents.length,
      blueprints: exchangeItems.length,
      districts: districtSet.size,
      questSteps: completedQuestSteps,
    };
  }, [communityProgrammes, communityEvents, exchangeItems, missions]);

  const starterPrompts =
    language === 'ml'
      ? [
          'എന്റെ ശീലങ്ങൾ ശാന്തമായി പരിശോധിക്കണം',
          'ഒരു സുഹൃത്തിനെയോ മകനെയോ എങ്ങനെ സഹായിക്കാം?',
          'ശരിയായ വിവരങ്ങൾ പഠിച്ച് സർട്ടിഫിക്കറ്റ് നേടണം',
          'സ്കൂളിലോ കോളേജിലോ ബോധവൽക്കരണ പരിപാടി നടത്തണം',
        ]
      : [
          'Check my habits & build steady daily routines',
          'How do I support a friend or family member?',
          'Learn true facts & discover sports or skill groups',
          'Plan an awareness event for our school or college',
        ];

  const roleCards: {
    id: UserRole;
    icon: React.ElementType;
    cardStyle: string;
    iconBoxStyle: string;
    ctaTextStyle: string;
  }[] = [
    {
      id: 'personal',
      icon: Compass,
      cardStyle: 'bg-[#1E1B4B] text-white border-indigo-900 hover:bg-[#272361] shadow-md',
      iconBoxStyle: 'bg-amber-500/20 text-amber-300 border border-amber-400/30',
      ctaTextStyle: 'border-indigo-800 text-amber-300',
    },
    {
      id: 'supporter',
      icon: HeartHandshake,
      cardStyle: 'bg-[#FFFBF5] text-slate-900 border-orange-200 hover:border-orange-500 hover:shadow-md',
      iconBoxStyle: 'bg-orange-100 text-orange-800 border border-orange-200',
      ctaTextStyle: 'border-orange-100 text-[#9A3412]',
    },
    {
      id: 'learner',
      icon: GraduationCap,
      cardStyle: 'bg-white text-slate-900 border-blue-200 hover:border-blue-600 hover:shadow-md',
      iconBoxStyle: 'bg-sky-50 text-blue-800 border border-blue-200',
      ctaTextStyle: 'border-slate-100 text-blue-800',
    },
    {
      id: 'community',
      icon: Building2,
      cardStyle: 'bg-white text-slate-900 border-teal-200 hover:border-teal-700 hover:shadow-md',
      iconBoxStyle: 'bg-teal-50 text-teal-800 border border-teal-200',
      ctaTextStyle: 'border-slate-100 text-teal-800',
    },
  ];

  const footerTopics: Record<FooterTopicId, { title: string; body: string }> = {
    about: {
      title: 'About ClearPath AI',
      body: 'ClearPath AI (Powered by Team Phoenix) is a privacy-isolated, solution-oriented platform uniting personal habit rebuilding, supporter coaching, youth neuroscience education, and organized school/NGO community prevention across Kerala.',
    },
    mission: {
      title: 'Our Mission',
      body: 'To replace stigma and fragmented awareness leaflets with organized, science-backed daily tools, non-judgmental family communication, and verified local clinical access.',
    },
    support: {
      title: 'Get Confidential 24/7 Support',
      body: 'Personal logs never leave your local browser. If you or someone close needs urgent clinical counseling or guidance, reach Kerala Vimukthi (14405), DISHA (1056), Childline (1098), or Emergency (112) via one-tap dial or copy above.',
    },
    partner: {
      title: 'Partner With Us (Schools, Colleges & NGOs)',
      body: 'Teachers, NSS units, anti-drug clubs, and civic groups can enter Role 04 (Community Builder) immediately to generate institutional action kits, map uncovered districts, and exchange proven blueprints.',
    },
    contact: {
      title: 'Contact Team Phoenix',
      body: 'ClearPath AI is maintained by Team Phoenix for public education and preventive wellness. For local care referrals, always contact verified Kerala Excise Vimukthi centres (14405).',
    },
    privacy: {
      title: 'Privacy & Safety Guarantee',
      body: 'Zero third-party tracking, zero advertising pixels, and strict cross-role separation. Personal Journey check-ins, Deep-Dive Assessments, and trigger notes remain encrypted inside your browser vault and are never exposed to Supporter or Community modes.',
    },
    government: {
      title: 'Government & Kerala Vimukthi Collaboration',
      body: 'ClearPath AI integrates official Kerala Excise Vimukthi Mission (14405), Health Department DISHA (1056), and government medical college de-addiction ward locations directly inside Support Directory & Google Maps.',
    },
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between">
      {/* Minimal Accessible Top Navigation — Clean & Non-Overlapping */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-8 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ClearPathLogo
            size="md"
            subtitle={language === 'ml' ? 'ടീം ഫീനിക്സ് സമർപ്പിക്കുന്നത്' : 'Powered by Team Phoenix'}
            hideSubtitleMobile
          />
        </div>

        <nav className="flex items-center gap-1.5 sm:gap-2 shrink-0" aria-label="Home navigation">
          {/* Day Mode / Night (Dark) Mode Switcher */}
          <div
            className="inline-flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl border border-slate-200/70"
            role="group"
            aria-label={language === 'ml' ? 'ഡേ / നൈറ്റ് മോഡ്' : 'Day and Night Mode'}
          >
            <button
              type="button"
              onClick={() => setThemeMode('day')}
              aria-pressed={themeMode === 'day'}
              title={language === 'ml' ? 'ഡേ മോഡ് (ലൈറ്റ്)' : 'Day Mode (Light)'}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                themeMode === 'day'
                  ? 'bg-white text-amber-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'ml' ? 'പകൽ' : 'Day'}</span>
            </button>
            <button
              type="button"
              onClick={() => setThemeMode('night')}
              aria-pressed={themeMode === 'night'}
              title={language === 'ml' ? 'നൈറ്റ് മോഡ് (ഡാർക്ക്)' : 'Night Mode (Dark)'}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer ${
                themeMode === 'night'
                  ? 'bg-indigo-950 text-amber-300 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'ml' ? 'രാത്രി' : 'Night'}</span>
            </button>
          </div>

          <div className="inline-flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl border border-slate-200/70">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                language === 'en' ? 'bg-white text-indigo-950 shadow-2xs' : 'text-slate-600'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('ml')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                language === 'ml' ? 'bg-white text-indigo-950 shadow-2xs' : 'text-slate-600'
              }`}
            >
              മല
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowEmergencyModal(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold whitespace-nowrap cursor-pointer"
            title="24/7 Emergency & Vimukthi Helplines (112 / 14405)"
            aria-label="Open 112 and 14405 Emergency Helplines"
          >
            <PhoneCall className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="tabular-nums">14405</span>
          </button>

          {userProfile ? (
            <div className="inline-flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => enterRoleAndTab(userProfile.lastSelectedRole || 'personal', 'dashboard')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-950 text-xs font-bold border border-indigo-200 hover:bg-indigo-100 cursor-pointer"
                title="Resume last workspace"
              >
                <User className="w-3.5 h-3.5 text-indigo-700" />
                <span>{userProfile.name}</span>
              </button>
              <button
                type="button"
                onClick={logoutUser}
                className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openAuthForRole(null, 'signup')}
              className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
            >
              {language === 'ml' ? 'ലോഗിൻ' : 'Sign In'}
            </button>
          )}
        </nav>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-14">
        {/* 1. HERO SECTION WITH CUSTOM VECTOR ILLUSTRATION & INTERACTIVE AI NAVIGATOR */}
        <section aria-labelledby="hero-heading" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-5 text-left">
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-800 flex items-center gap-2">
                  <span>ClearPath AI</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="text-amber-700">
                    {language === 'ml' ? 'ടീം ഫീനിക്സ്' : 'Powered by Team Phoenix'}
                  </span>
                </p>
                <RedHelpDot
                  role="home"
                  onAction={() => {
                    const el = document.getElementById('hero-ai-input');
                    el?.focus();
                  }}
                  actionLabel="Ask ClearPath AI Guide"
                  actionLabelMl="എഐ വഴികാട്ടിയോട് ചോദിക്കുക"
                />
              </div>

              <h1
                id="hero-heading"
                className="text-3xl sm:text-5xl font-extrabold text-indigo-950 tracking-tight leading-[1.08]"
              >
                {userProfile?.name
                  ? language === 'ml'
                    ? `സ്വാഗതം, ${userProfile.name}.`
                    : `Welcome back, ${userProfile.name}.`
                  : language === 'ml'
                    ? 'വ്യക്തമായ പാത. കരുത്തുറ്റ ഭാവി.'
                    : 'A Clearer Path. A Stronger Future.'}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                {userProfile
                  ? language === 'ml'
                    ? personalizationProfile.tailoredTipMl
                    : personalizationProfile.tailoredTip
                  : language === 'ml'
                    ? 'ലളിതമായ ദിനചര്യകൾ, കുടുംബ പിന്തുണ, ശരിയായ അറിവുകൾ, സാമൂഹിക പ്രവർത്തനങ്ങൾ എന്നിവയെല്ലാം ഒരൊറ്റ സുരക്ഷിത ഇടത്തിൽ.'
                    : 'Simple daily recovery tools, calm family support, easy-to-read youth guides, and local community programmes in one safe, private place.'}
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => openAiAssistant({ role: 'home' })}
                  className="min-h-[44px] px-5 py-3 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white text-sm font-extrabold inline-flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{language === 'ml' ? 'AI ചാറ്റ് & ചരിത്രം' : 'Open AI Chat'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowUnderstandModal(true)}
                  className="min-h-[44px] px-4 py-3 rounded-xl bg-white hover:bg-indigo-50 text-indigo-950 border border-indigo-200 text-sm font-bold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>{language === 'ml' ? 'ഈ ആപ്പ് അറിയാം' : 'Understand App'}</span>
                </button>
                {userProfile && (
                  <button
                    type="button"
                    onClick={() =>
                      enterRoleAndTab(personalizationProfile.nextActionRole, personalizationProfile.nextActionTab)
                    }
                    className="min-h-[44px] px-4 py-3 rounded-xl bg-white hover:bg-slate-50 text-indigo-950 border border-slate-300 text-sm font-bold inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <span>{personalizationProfile.nextActionLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Bespoke ClearPath AI Hero Visual (Clean Editorial Image + Safe Fallback) */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl bg-gradient-to-br from-[#1E1B4B] via-[#312E81] to-[#0F172A] shadow-lg border border-indigo-900/60 overflow-hidden">
                {!heroImgFailed ? (
                  <div className="aspect-[4/3] w-full bg-[#1E1B4B] overflow-hidden">
                    <img
                      src={heroRenewalImg}
                      alt="Young man stepping onto a central luminous compass hub connecting four privacy-isolated sanctuary pavilions for personal recovery, family support, neuroscience learning, and community outreach"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={() => setHeroImgFailed(true)}
                    />
                  </div>
                ) : (
                  <div className="p-6 sm:p-7">
                    <svg
                      viewBox="0 0 360 220"
                      className="w-full h-44 sm:h-48"
                      role="img"
                      aria-label="ClearPath AI four-role interconnected prevention architecture"
                    >
                      <defs>
                        <linearGradient id="cpPathGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#F59E0B" />
                          <stop offset="100%" stopColor="#38BDF8" />
                        </linearGradient>
                      </defs>
                      <line x1="30" y1="110" x2="330" y2="110" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                      <line x1="180" y1="20" x2="180" y2="200" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                      <path
                        d="M 48 168 C 110 168, 125 65, 180 65 C 235 65, 250 140, 312 60"
                        fill="none"
                        stroke="url(#cpPathGrad)"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                      <circle cx="48" cy="168" r="14" fill="#F59E0B" />
                      <text x="48" y="172" textAnchor="middle" fontSize="10" fontWeight="800" fill="#1E1B4B">01</text>
                      <circle cx="130" cy="96" r="13" fill="#EA580C" />
                      <text x="130" y="100" textAnchor="middle" fontSize="10" fontWeight="800" fill="#FFFFFF">02</text>
                      <circle cx="228" cy="96" r="13" fill="#38BDF8" />
                      <text x="228" y="100" textAnchor="middle" fontSize="10" fontWeight="800" fill="#0F172A">03</text>
                      <circle cx="312" cy="60" r="14" fill="#14B8A6" />
                      <text x="312" y="64" textAnchor="middle" fontSize="10" fontWeight="800" fill="#042F2E">04</text>
                    </svg>
                  </div>
                )}

                <div className="px-5 py-3.5 border-t border-white/15 bg-[#1E1B4B] flex items-center justify-between text-xs">
                  <span className="font-semibold text-amber-300">4 Privacy-Isolated Workspaces</span>
                  <span className="text-indigo-200 font-mono-tabular">Zero Tracking</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Hero AI Navigator Bar */}
          <div className="max-w-4xl mx-auto text-left">
            <form
              onSubmit={e => {
                e.preventDefault();
                runAiNavigator();
              }}
              className="bg-white rounded-2xl border-2 border-indigo-900/15 shadow-lg shadow-indigo-950/5 p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 focus-within:border-indigo-700 transition-colors"
            >
              <div className="flex items-center gap-2.5 flex-1 px-2.5">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                <label htmlFor="hero-ai-input" className="sr-only">
                  Ask ClearPath AI Guide
                </label>
                <input
                  id="hero-ai-input"
                  type="text"
                  value={aiQuery}
                  onChange={e => setAiQuery(e.target.value)}
                  placeholder={
                    language === 'ml'
                      ? 'ഉദാ: "സ്ട്രെസ്സ് കുറയ്ക്കാൻ സഹായിക്കൂ" അല്ലെങ്കിൽ "കോളേജിൽ പരിപാടി തുടങ്ങണം"'
                      : 'Tell ClearPath AI what you need: e.g. "Assess my habit pattern" or "Plan a college campaign"'
                  }
                  className="w-full py-2.5 text-sm text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={aiLoading || !aiQuery.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-950 hover:bg-indigo-900 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {aiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    <span>{language === 'ml' ? 'കണ്ടെത്തുന്നു...' : 'Guiding...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-amber-400" />
                    <span>{language === 'ml' ? 'വഴി തേടുക' : 'Route Me'}</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Starter Intent Chips */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {starterPrompts.map(prompt => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => runAiNavigator(prompt)}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-xs font-medium text-slate-700 hover:text-indigo-950 transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {aiError && (
              <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
                {aiError}
              </div>
            )}

            {aiResult && (
              <div className="mt-5 bg-white rounded-2xl border border-indigo-200 shadow-md p-5 space-y-4 text-left animate-in fade-in duration-150">
                {aiResult.needsEmergencyHelp && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>Immediate 24/7 confidential clinical help available</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href="tel:14405"
                        className="px-3 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-bold tabular-nums"
                      >
                        Call 14405
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopyNumber('14405')}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-900 text-xs font-bold cursor-pointer"
                      >
                        {copiedPhone === '14405' ? 'Copied!' : 'Copy 14405'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-indigo-800">
                    <span>ClearPath AI Recommendation</span>
                    <span className="text-slate-400">Targeted single-role route</span>
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed font-medium">
                    {aiResult.reply}
                  </p>
                  <p className="text-xs text-slate-500">{aiResult.secondaryTip}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Best space:{' '}
                    <strong className="text-indigo-950 capitalize">{aiResult.suggestedRole}</strong>
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openAiAssistant({
                          role: aiResult.suggestedRole,
                          initialQuestion: aiQuery,
                        })
                      }
                      className="min-h-[40px] px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold whitespace-nowrap cursor-pointer"
                    >
                      {language === 'ml' ? 'തുടർന്ന് സംസാരിക്കാം' : 'Continue in Full AI Chat'}
                    </button>
                    <button
                      type="button"
                      onClick={() => enterRoleAndTab(aiResult.suggestedRole, aiResult.suggestedTab)}
                      className="min-h-[40px] px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold inline-flex items-center gap-2 shadow-xs transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <span>{aiResult.suggestedActionLabel}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 2. FOUR DISTINCT COLORED WORKSPACE PORTALS */}
        <section aria-labelledby="roles-heading" className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h2 id="roles-heading" className="text-xl sm:text-2xl font-extrabold text-indigo-950">
                {language === 'ml' ? 'നിങ്ങളുടെ ഇടം തിരഞ്ഞെടുക്കുക' : 'Choose Your Space'}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {language === 'ml'
                  ? 'നാല് വ്യത്യസ്തവും സുരക്ഷിതവുമായ ഇടങ്ങൾ — നിങ്ങൾക്ക് ആവശ്യമുള്ളത് തിരഞ്ഞെടുക്കാം.'
                  : 'Four clear, private spaces for every situation. Pick what helps you right now.'}
              </p>
            </div>
            <span className="text-xs sm:text-sm font-semibold text-slate-600">
              {userProfile ? `Signed in as ${userProfile.name}` : 'Start right away · No sign-in required to explore'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {roleCards.map(card => {
              const Icon = card.icon;
              const meta = ROLE_THEME_META[card.id];
              const isPrimary = card.id === 'personal';

              return (
                <div
                  key={card.id}
                  className={`group rounded-2xl p-6 transition-all flex flex-col justify-between border ${card.cardStyle}`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBoxStyle}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-xs font-mono-tabular font-bold ${
                          isPrimary ? 'text-amber-300' : meta.accentText
                        }`}
                      >
                        {isPrimary
                          ? language === 'ml'
                            ? `${meta.numeral} പ്രധാന ഇടം`
                            : `${meta.numeral} Personal Care`
                          : meta.numeral}
                      </span>
                    </div>

                    <h3 className={`text-xl font-extrabold tracking-tight ${isPrimary ? 'text-white' : 'text-slate-900'}`}>
                      {language === 'ml' ? meta.titleMl : meta.title}
                    </h3>
                    <div
                      className={`text-xs font-bold uppercase tracking-wider mt-1.5 ${
                        isPrimary ? 'text-amber-300' : meta.accentText
                      }`}
                    >
                      {language === 'ml' ? meta.builtForMl : meta.builtFor}
                    </div>
                    <p
                      className={`text-sm mt-2.5 leading-relaxed ${
                        isPrimary ? 'text-indigo-100/90' : 'text-slate-600'
                      }`}
                    >
                      {language === 'ml' ? meta.introSummaryMl : meta.introSummary}
                    </p>
                  </div>

                  <div className={`mt-6 pt-4 border-t flex items-center justify-between gap-2 text-xs font-bold ${card.ctaTextStyle}`}>
                    <button
                      type="button"
                      onClick={() => enterRoleAndTab(card.id, 'dashboard')}
                      className="inline-flex items-center gap-1.5 hover:underline cursor-pointer"
                    >
                      <span>{language === 'ml' ? 'തുറക്കുക' : 'Enter Workspace'}</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>

                    {!userProfile && (
                      <button
                        type="button"
                        onClick={() => openAuthForRole(card.id)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border cursor-pointer ${
                          isPrimary
                            ? 'border-white/20 text-indigo-100 hover:bg-white/10'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Save &amp; Sign In
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. TRUST & ANDROID ONE-TAP CALL + COPY HELPLINE BAR */}
        <section
          aria-label="Privacy and verified helplines"
          className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-800 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {language === 'ml'
                    ? 'പൂർണ്ണ സ്വകാര്യതയും 24/7 ഹെൽപ്പ്‌ലൈനുകളും'
                    : 'Zero Tracking · Encrypted Browser Vault · Verified 24/7 Helplines'}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Personal entries never leave this browser. On Android, tap Call to dial directly or Copy to paste into your phone dialer.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {VERIFIED_HELPLINES.map(line => (
              <div
                key={line.number}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
              >
                <div>
                  <div className="text-xs font-extrabold text-slate-900">{line.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono-tabular font-bold">
                    {line.number}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={`tel:${line.number}`}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-[11px] font-bold inline-flex items-center gap-1"
                  >
                    <PhoneCall className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopyNumber(line.number)}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedPhone === line.number ? (
                      <>
                        <Check className="w-3 h-3 text-indigo-700" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Subtle Mission Deep-Dive Entry */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-slate-50 border border-slate-200 px-6 py-4">
          <div className="space-y-0.5">
            <div className="text-xs font-extrabold text-indigo-950">
              How ClearPath AI Protects Privacy Across All Roles
            </div>
            <p className="text-xs text-slate-600">
              Explore our system architecture, k-anonymity safeguards, and 3 clinical &amp; community innovations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPortalMode('mission')}
            className="px-4 py-2 rounded-xl bg-white hover:bg-indigo-50 border border-slate-300 text-indigo-950 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <span>Discover Our Mission</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>
      </main>

      {/* STRUCTURED 7-LINK INTERACTIVE FOOTER */}
      <footer className="border-t border-slate-200 bg-white px-4 sm:px-8 py-6">
        <div className="max-w-6xl mx-auto space-y-4">
          {activeFooterTopic && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex items-start justify-between gap-4 animate-in fade-in duration-150">
              <div className="space-y-1">
                <h4 className="text-xs sm:text-sm font-extrabold text-indigo-950">
                  {footerTopics[activeFooterTopic].title}
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {footerTopics[activeFooterTopic].body}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveFooterTopic(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white cursor-pointer"
                aria-label="Close footer details"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <span>ClearPath AI</span>
              <span aria-hidden="true">·</span>
              <span className="text-indigo-800">Powered by Team Phoenix</span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {[
                { id: 'about' as FooterTopicId, label: 'About' },
                { id: 'mission' as FooterTopicId, label: 'Mission' },
                { id: 'support' as FooterTopicId, label: 'Get Support' },
                { id: 'partner' as FooterTopicId, label: 'Partner With Us' },
                { id: 'contact' as FooterTopicId, label: 'Contact' },
                { id: 'privacy' as FooterTopicId, label: 'Privacy & Safety' },
                { id: 'government' as FooterTopicId, label: 'Govt. (Vimukthi) Collaboration' },
              ].map(link => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() =>
                    setActiveFooterTopic(prev => (prev === link.id ? null : link.id))
                  }
                  className={`font-semibold transition-colors cursor-pointer ${
                    activeFooterTopic === link.id
                      ? 'text-indigo-950 underline'
                      : 'text-slate-600 hover:text-indigo-900'
                  }`}
                >
                  {link.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  serverAuthUser?.role === 'therapist'
                    ? setPortalMode('therapist')
                    : openAuthForRole(null, 'therapist')
                }
                className="font-semibold text-indigo-800 hover:underline cursor-pointer"
              >
                Therapist Portal
              </button>
            </div>
          </div>
        </div>
      </footer>

      <AuthModal
        isOpen={isAuthOpen}
        defaultMode={authDefaultMode}
        intendedRole={intendedAuthRole}
        onClose={() => {
          setIsAuthOpen(false);
          setIntendedAuthRole(null);
        }}
      />

      {/* Modal: Understand This App Mechanism (Opened on click of small button) */}
      {showUnderstandModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
          onClick={e => {
            if (e.target === e.currentTarget) setShowUnderstandModal(false);
          }}
        >
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="text-sm font-extrabold text-indigo-950">
                {language === 'ml' ? 'ക്ലിയർപാത്ത് എങ്ങനെ പ്രവർത്തിക്കുന്നു?' : 'Understand How ClearPath Works'}
              </div>
              <button
                type="button"
                onClick={() => setShowUnderstandModal(false)}
                aria-label="Close Understand App guide"
                className="min-h-[40px] min-w-[40px] rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <UnderstandAppBox
              onOpenRole={role => {
                setShowUnderstandModal(false);
                enterRoleAndTab(role, 'dashboard');
              }}
              onOpenRoleTab={(role, tab) => {
                setShowUnderstandModal(false);
                enterRoleAndTab(role, tab);
              }}
              onOpenTherapistPortal={() => {
                setShowUnderstandModal(false);
                if (serverAuthUser?.role === 'therapist') {
                  setPortalMode('therapist');
                } else {
                  openAuthForRole(null, 'therapist');
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Modal: 24/7 Emergency & Vimukthi Helplines */}
      {showEmergencyModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={e => {
            if (e.target === e.currentTarget) setShowEmergencyModal(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <PhoneCall className="w-5 h-5" />
                <span>{language === 'ml' ? '24/7 സൗജന്യ അടിയന്തര സഹായം' : '24/7 Confidential Helplines'}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowEmergencyModal(false)}
                className="min-h-[36px] px-3 rounded-lg bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer"
              >
                {language === 'ml' ? 'അടയ്ക്കുക' : 'Close'}
              </button>
            </div>
            <div className="space-y-2.5 text-sm">
              {VERIFIED_HELPLINES.map(line => (
                <div
                  key={line.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-slate-900">{language === 'ml' ? line.nameMl : line.name}</div>
                    <div className="text-xs text-slate-600">{language === 'ml' ? line.descMl : line.desc}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyNumber(line.number)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-semibold cursor-pointer"
                    >
                      {copiedPhone === line.number ? 'Copied' : 'Copy'}
                    </button>
                    <a
                      href={`tel:${line.number}`}
                      className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold tabular-nums inline-flex items-center gap-1"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{line.number}</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
