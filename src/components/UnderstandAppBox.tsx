import React from 'react';
import {
  ArrowRight,
  Lock,
  Sparkles,
  KeyRound,
  ShieldCheck,
  Users,
  HeartHandshake,
  Brain,
  Compass,
  Stethoscope,
  MessageSquare,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';

interface UnderstandAppBoxProps {
  onOpenRole: (role: UserRole) => void;
  onOpenRoleTab: (role: UserRole, tab: string) => void;
  onOpenTherapistPortal?: () => void;
  onOpenAdminPortal?: () => void;
}

export const UnderstandAppBox: React.FC<UnderstandAppBoxProps> = ({
  onOpenRole,
  onOpenRoleTab,
  onOpenTherapistPortal,
  onOpenAdminPortal,
}) => {
  const { language, openAiAssistant } = useApp();
  const isMl = language === 'ml';

  const roleMap: Array<{
    num: string;
    role: UserRole;
    title: string;
    line: string;
    tools: string;
    icon: React.ReactNode;
  }> = [
    {
      num: '01',
      role: 'personal',
      title: isMl ? 'സ്വയം വീണ്ടെടുക്കാം' : 'Rebuild Yourself',
      line: isMl ? 'ദിവസേനയുള്ള ചെക്ക്-ഇൻ, ശാന്തമാക്കൽ, തെറാപ്പിസ്റ്റ് സഹായം.' : 'Daily check-ins, calm tools, and private recovery steps.',
      tools: isMl ? 'ലോഗ് · ഗെയിംസ് · റിപ്പോർട്ട്' : 'Daily Log · Calm Tools · Therapist Key',
      icon: <Compass className="w-4 h-4 text-teal-600" />,
    },
    {
      num: '02',
      role: 'supporter',
      title: isMl ? 'ഒരാളെ സഹായിക്കാം' : 'Help Someone',
      line: isMl ? 'കുടുംബത്തിനും സുഹൃത്തുക്കൾക്കും ശാന്തമായി കൂടെനിൽക്കാൻ.' : 'Gentle talk lines, warning signs, and local free clinics.',
      tools: isMl ? 'ടോക്ക് ബിൽഡർ · കെയർ പ്ലാൻ' : 'Talk Builder · Care Plan · Care Map',
      icon: <HeartHandshake className="w-4 h-4 text-sky-600" />,
    },
    {
      num: '03',
      role: 'learner',
      title: isMl ? 'അറിയാം, മാറാം' : 'Learn & Swap Habits',
      line: isMl ? 'ലളിതമായ ശാസ്ത്രവും കൂട്ടുകാരുടെ സമ്മർദ്ദം നേരിടലും.' : 'Plain brain science, myth-busting, and healthy habits.',
      tools: isMl ? 'പാഠങ്ങൾ · ക്വിസ് · ശീലങ്ങൾ' : 'Short Lessons · Drug Facts · Habit Lab',
      icon: <Brain className="w-4 h-4 text-indigo-600" />,
    },
    {
      num: '04',
      role: 'community',
      title: isMl ? 'കമ്മ്യൂണിറ്റി പ്രവർത്തനം' : 'Community Action',
      line: isMl ? 'സ്കൂളുകളിലും വാർഡുകളിലും സുരക്ഷിതമായ ബോധവൽക്കരണം.' : 'Workshops, local district needs, and group trends.',
      tools: isMl ? 'പ്ലാനർ · ജില്ലാ ആവശ്യങ്ങൾ' : 'Workshop Planner · District Needs',
      icon: <Users className="w-4 h-4 text-amber-600" />,
    },
  ];

  const mechanismSteps = [
    {
      step: '01',
      title: isMl ? 'നിങ്ങളുടെ സ്വകാര്യ വാൾട്ട്' : 'Your Private Vault',
      text: isMl
        ? 'കുറിപ്പുകളും ചെക്ക്-ഇന്നുകളും നിങ്ങളുടെ അക്കൗണ്ടിൽ മാത്രം സുരക്ഷിതമാണ്.'
        : 'Notes, check-ins, and chats stay locked inside your own account.',
      icon: <Lock className="w-4 h-4 text-slate-700" />,
    },
    {
      step: '02',
      title: isMl ? 'വ്യക്തിഗത എഐ സഹായി' : 'Brief Personalized AI',
      text: isMl
        ? 'വായനയ്ക്കിടയിൽ എപ്പോൾ വേണമെങ്കിലും ലളിതമായ ഉത്തരം ലഭിക്കും.'
        : 'Answers in 2-3 simple lines using your goals and what you are reading.',
      icon: <Sparkles className="w-4 h-4 text-indigo-600" />,
    },
    {
      step: '03',
      title: isMl ? 'പങ്കിടാനുള്ള താക്കോൽ' : 'You Hold Every Key',
      text: isMl
        ? 'നിങ്ങൾ ഓൺ ആക്കിയാൽ മാത്രം തെറാപ്പിസ്റ്റിനോ സഹായിക്കോ കാണാം.'
        : 'Therapists or supporters only see items when you flip a share switch.',
      icon: <KeyRound className="w-4 h-4 text-teal-600" />,
    },
    {
      step: '04',
      title: isMl ? 'സുരക്ഷിതമായ പൊതു വിവരങ്ങൾ' : 'Safe Group Totals',
      text: isMl
        ? 'കുറഞ്ഞത് 5 പേരുടെ വിവരങ്ങൾ ചേർത്ത ശേഷമേ ജില്ലാ ട്രെൻഡുകൾ കാണിക്കൂ.'
        : 'Community trends hide small groups (k>=5) so nobody is ever singled out.',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
    },
  ];

  const innovationPillars = [
    {
      title: isMl ? 'ലളിത എഐ + ചരിത്രം' : 'Brief AI With Memory',
      note: isMl ? 'എല്ലാ പേജിലും പഴയ ചാറ്റുകളുമായി എഐ' : 'One shared assistant across every screen',
    },
    {
      title: isMl ? 'തത്സമയ തെറാപ്പിസ്റ്റ് താക്കോൽ' : 'Revocable Care Keys',
      note: isMl ? 'എപ്പോൾ വേണമെങ്കിലും അനുവാദം പിൻവലിക്കാം' : 'Grant or stop therapist access in 1 tap',
    },
    {
      title: isMl ? 'കേരള 5-വിഭാഗം മാപ്പ്' : 'Kerala 5-Category Map',
      note: isMl ? 'സൗജന്യ വിമുക്തി മുതൽ ആശുപത്രികൾ വരെ' : 'Free Vimukthi centers, clinics & helplines',
    },
    {
      title: isMl ? 'സ്വകാര്യതയുള്ള ട്രെൻഡുകൾ' : 'Anonymous Trends (k>=5)',
      note: isMl ? 'വ്യക്തിഗത വിവരങ്ങളില്ലാതെ ജില്ലാ സഹായം' : 'Helps districts act without naming anyone',
    },
  ];

  return (
    <section
      aria-label={isMl ? 'ഈ ആപ്പ് എങ്ങനെ പ്രവർത്തിക്കുന്നു' : 'Understand this app'}
      className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
    >
      {/* Top Bar */}
      <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">
            {isMl ? 'ഈ ആപ്പ് എങ്ങനെ പ്രവർത്തിക്കുന്നു?' : 'Understand This App in 30 Seconds'}
          </h2>
          <p className="text-sm text-slate-600 mt-0.5">
            {isMl
              ? 'നാലു ഭാഗങ്ങളും, അവ തമ്മിൽ ബന്ധപ്പെടുന്ന രീതിയും, നിങ്ങളുടെ സ്വകാര്യതയും.'
              : 'What each space does, how things connect, and what stays completely private.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            openAiAssistant({
              role: 'home',
              contextRef: {
                area: 'Home Overview',
                topicTitle: 'How ClearPath Works',
                snippet: 'Explain what role fits me best and how my privacy keys work in ClearPath.',
              },
            })
          }
          className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>{isMl ? 'സംശയമുണ്ടോ? AI-യോട് ചോദിക്കൂ' : 'Ask AI About This App'}</span>
        </button>
      </div>

      {/* Body Grid */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* 01. Map of Roles */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              {isMl ? '01. നാല് പ്രധാന ഇടങ്ങൾ (Roles)' : '01. Four Connected Spaces (Click Any to Open)'}
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
              {onOpenTherapistPortal && (
                <button
                  type="button"
                  onClick={onOpenTherapistPortal}
                  className="inline-flex items-center gap-1 hover:text-slate-900 underline underline-offset-4 whitespace-nowrap"
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>{isMl ? 'തെറാപ്പിസ്റ്റ് പോർട്ടൽ' : 'Therapist Portal'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {roleMap.map(item => (
              <button
                key={item.role}
                type="button"
                onClick={() => onOpenRole(item.role)}
                className="text-left p-4 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 transition-colors flex flex-col justify-between gap-2 min-h-[112px]"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-500 tabular-nums">{item.num}</span>
                    {item.icon}
                  </div>
                  <p className="text-sm font-bold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.line}</p>
                </div>
                <p className="text-[11px] font-medium text-slate-500 pt-1">{item.tools}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 02. Mechanism Flow */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">
            {isMl ? '02. എല്ലാം തമ്മിൽ ബന്ധപ്പെടുന്ന രീതി' : '02. How Everything Connects'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {mechanismSteps.map(m => (
              <div
                key={m.step}
                className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-500 tabular-nums">Step {m.step}</span>
                  {m.icon}
                </div>
                <p className="text-sm font-bold text-slate-900">{m.title}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{m.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 03. Features & Privacy Secrets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 text-xs sm:text-sm text-slate-600">
          <div>
            <p className="font-bold text-slate-900 mb-1">
              {isMl ? 'സ്വകാര്യതയാണ് ഒന്നാമത്' : 'What Stays Locked'}
            </p>
            <p className="leading-relaxed">
              {isMl
                ? 'നിങ്ങളുടെ ദിവസേനയുള്ള കുറിപ്പുകളും എഐ ചാറ്റുകളും നിങ്ങളുടെ വാൾട്ടിൽ മാത്രം സൂക്ഷിക്കുന്നു.'
                : 'Your daily check-ins, mood logs, and AI chats stay private to your own vault.'}
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-900 mb-1">
              {isMl ? 'അനുവാദം നൽകിയാൽ മാത്രം പങ്കിടൽ' : 'When Things Connect'}
            </p>
            <p className="leading-relaxed">
              {isMl
                ? 'നിങ്ങൾ തിരഞ്ഞെടുക്കുന്നവ മാത്രം ഡോക്ടറുമായോ പ്രിയപ്പെട്ടവരുമായോ പങ്കിടാം.'
                : 'Only items you explicitly choose go into a Care Report or Therapist invitation.'}
            </p>
          </div>
          <div>
            <p className="font-bold text-slate-900 mb-1">
              {isMl ? 'പരസ്യങ്ങളില്ല, കുറ്റപ്പെടുത്തലില്ല' : 'Zero Ads or Risk Labels'}
            </p>
            <p className="leading-relaxed">
              {isMl
                ? 'ഇവിടെ മാർക്കുകളോ കുറ്റപ്പെടുത്തലുകളോ ഇല്ല. വേഗത്തിൽ വായിക്കാവുന്ന ലളിതമായ സഹായം മാത്രം.'
                : 'No tracking ads, no judgmental risk scores, and no complicated words.'}
            </p>
          </div>
        </div>
      </div>

      {/* Merged Innovation Bar */}
      <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
            {innovationPillars.map(item => (
              <div key={item.title} className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-600">{item.note}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onOpenRoleTab('personal', 'ecosystem')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-800 inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
          >
            <span>{isMl ? 'എല്ലാ ടൂളുകളും കാണുക' : 'Explore All Features'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </section>
  );
};
