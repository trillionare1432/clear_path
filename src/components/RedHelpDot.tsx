import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ROLE_FEATURE_CATALOG, ROLE_THEME_META } from '../constants/featureCatalog';
import { UserRole } from '../types';
import { X, ArrowRight, ShieldCheck, Compass, Users } from 'lucide-react';

interface RedHelpDotProps {
  role?: UserRole | 'home';
  tabKey?: string;
  customTitle?: string;
  customTitleMl?: string;
  customSummary?: string;
  customSummaryMl?: string;
  customStep?: string;
  customStepMl?: string;
  onAction?: () => void;
  actionLabel?: string;
  actionLabelMl?: string;
  compact?: boolean;
  iconOnlyMobile?: boolean;
}

const TAB_ALIASES: Record<string, string> = {
  reflections: 'journal',
  match: 'support',
  impact: 'analytics',
  ai_guide: 'dashboard',
};

export const RedHelpDot: React.FC<RedHelpDotProps> = ({
  role = 'home',
  tabKey = 'dashboard',
  customTitle,
  customTitleMl,
  customSummary,
  customSummaryMl,
  customStep,
  customStepMl,
  onAction,
  actionLabel,
  actionLabelMl,
  compact = false,
  iconOnlyMobile = false,
}) => {
  const { language } = useApp();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const normalizedTab = TAB_ALIASES[tabKey] || tabKey;

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const featureMeta =
    role !== 'home'
      ? ROLE_FEATURE_CATALOG.find(f => f.role === role && f.tabKey === normalizedTab) ||
        ROLE_FEATURE_CATALOG.find(f => f.role === role && f.tabKey === 'dashboard')
      : undefined;

  const roleMeta = role !== 'home' ? ROLE_THEME_META[role] : undefined;

  const title =
    language === 'ml'
      ? customTitleMl || featureMeta?.titleMl || roleMeta?.titleMl || 'ക്ലിയർപാത്ത് എഐ — ലളിത വഴികാട്ടി'
      : customTitle || featureMeta?.title || roleMeta?.title || 'ClearPath AI Guide';

  const builtFor =
    roleMeta
      ? language === 'ml'
        ? roleMeta.builtForMl
        : roleMeta.builtFor
      : language === 'ml'
      ? 'വ്യക്തികൾക്കും കുടുംബങ്ങൾക്കും വിദ്യാർത്ഥികൾക്കും സംഘടനകൾക്കും'
      : 'For individuals, supporters, students, and community organizers';

  const summary =
    language === 'ml'
      ? customSummaryMl ||
        featureMeta?.explanationMl ||
        roleMeta?.introSummaryMl ||
        'നിങ്ങൾക്ക് അനുയോജ്യമായ ഒരു പാത മാത്രം തിരഞ്ഞെടുക്കുക. എല്ലാ വിവരങ്ങളും സ്വകാര്യമായി സൂക്ഷിക്കുന്നു.'
      : customSummary ||
        featureMeta?.explanation ||
        roleMeta?.introSummary ||
        'Choose only the workspace matching your goal today. Roles stay separate and your personal records stay strictly inside your browser vault.';

  const step =
    language === 'ml'
      ? customStepMl ||
        featureMeta?.recommendedActionMl ||
        roleMeta?.encouragementMl ||
        'വലതുവശത്തെ മെനു ഐക്കണിൽ ക്ലിക്ക് ചെയ്യുകയോ പ്രധാന ബട്ടൺ അമർത്തുകയോ ചെയ്യുക.'
      : customStep ||
        featureMeta?.recommendedAction ||
        roleMeta?.encouragement ||
        'Use the top-right Features menu to switch cleanly between tools in this workspace.';

  const privacy =
    language === 'ml'
      ? featureMeta?.privacyNoteMl || 'പൂർണ്ണ സ്വകാര്യതാ സുരക്ഷ'
      : featureMeta?.privacyNote || 'Strict browser-vault privacy enabled.';

  return (
    <div className="relative inline-block" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className={`inline-flex items-center justify-center gap-1.5 rounded-xl transition-all focus-visible:outline-2 focus-visible:outline-rose-600 cursor-pointer ${
          compact
            ? 'p-1.5 hover:bg-rose-50 border border-rose-200/80 bg-white'
            : iconOnlyMobile
            ? 'w-8 h-8 sm:w-auto sm:h-auto sm:px-2.5 sm:py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 shadow-2xs'
            : 'px-2.5 py-1.5 bg-white hover:bg-rose-50 border border-rose-200 text-rose-700 shadow-2xs'
        }`}
        aria-label={language === 'ml' ? 'വ്യക്തതയ്ക്കായി ക്ലിക്ക് ചെയ്യുക' : 'Open Clarity Guide for this page'}
        title={language === 'ml' ? 'സംശയനിവാരണം' : 'Clarity: Who this is for & how it works'}
      >
        <span className="w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-rose-100 shrink-0" />
        {!compact && (
          <span
            className={`text-[11px] font-bold text-rose-800 whitespace-nowrap ${
              iconOnlyMobile ? 'hidden sm:inline' : 'inline'
            }`}
          >
            {language === 'ml' ? 'വഴികാട്ടി' : 'Clarity'}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Mobile dimmed backdrop for effortless Android dismissal */}
          <div
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-[1px] z-40 sm:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div
            role="dialog"
            aria-modal="false"
            aria-label={title}
            className="fixed inset-x-3 top-18 sm:left-auto sm:right-6 sm:top-20 sm:w-[375px] max-h-[78dvh] overflow-y-auto bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 p-4 sm:p-5 text-left animate-in fade-in duration-150"
          >
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-3 h-3 rounded-full bg-rose-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                    {language === 'ml' ? 'തൽക്ഷണ വ്യക്തത' : 'Instant Clarity'}
                  </p>
                  <h4 className="text-sm font-extrabold text-slate-900 leading-tight truncate">
                    {title}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl cursor-pointer shrink-0"
                aria-label="Close Clarity guide"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3.5 space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <Users className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {language === 'ml' ? 'ആർക്കുവേണ്ടി' : 'Built For'}
                  </span>
                  <p className="text-xs font-semibold text-slate-900 mt-0.5">{builtFor}</p>
                </div>
              </div>

              <p className="prose-readable-sm text-slate-800 font-medium">{summary}</p>

              <div
                className={`rounded-xl p-3 flex items-start gap-2.5 border ${
                  roleMeta ? `${roleMeta.softBg} ${roleMeta.softBorder}` : 'bg-indigo-50/70 border-indigo-100'
                }`}
              >
                <Compass
                  className={`w-4 h-4 shrink-0 mt-0.5 ${
                    roleMeta ? roleMeta.accentText : 'text-indigo-700'
                  }`}
                />
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-700">
                    {language === 'ml' ? 'അടുത്ത ഘട്ടം' : 'Best Next Step'}
                  </span>
                  <p className="text-xs text-slate-900 font-medium mt-0.5">{step}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span>{privacy}</span>
              </div>
            </div>

            {onAction ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onAction();
                }}
                className={`w-full min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  roleMeta ? roleMeta.secondaryButton : 'bg-indigo-950 hover:bg-indigo-900 text-white'
                }`}
              >
                <span>{language === 'ml' ? actionLabelMl || 'തുടങ്ങുക' : actionLabel || 'Take Action Now'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-full min-h-[44px] py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold sm:hidden cursor-pointer"
              >
                {language === 'ml' ? 'ശരി, അടയ്ക്കുക' : 'Got It'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

