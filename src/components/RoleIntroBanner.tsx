import React from 'react';
import { useApp } from '../context/AppContext';
import { ROLE_THEME_META } from '../constants/featureCatalog';
import { UserRole } from '../types';
import { X, Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  role: UserRole;
  onQuickStart?: () => void;
  quickStartLabel?: string;
}

export const RoleIntroBanner: React.FC<Props> = ({ role, onQuickStart, quickStartLabel }) => {
  const { language, dismissedIntroRoles, dismissRoleIntro } = useApp();

  if (dismissedIntroRoles.includes(role)) {
    return null;
  }

  const theme = ROLE_THEME_META[role];

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-150 ${theme.softBg} ${theme.softBorder}`}
    >
      <div className="space-y-1 max-w-3xl">
        <div className={`flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider ${theme.accentText}`}>
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>{language === 'ml' ? theme.builtForMl : theme.builtFor}</span>
        </div>
        <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
          {language === 'ml' ? theme.introSummaryMl : theme.introSummary}
        </p>
        <p className="text-[11px] font-semibold text-slate-600">
          {language === 'ml' ? theme.encouragementMl : theme.encouragement}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onQuickStart && (
          <button
            type="button"
            onClick={() => {
              dismissRoleIntro(role);
              onQuickStart();
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${theme.secondaryButton}`}
          >
            <span>{quickStartLabel || (language === 'ml' ? 'തുടങ്ങുക' : 'Start Here')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => dismissRoleIntro(role)}
          className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 inline-flex items-center gap-1 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>{language === 'ml' ? 'മറയ്ക്കുക' : 'Dismiss'}</span>
        </button>
      </div>
    </div>
  );
};
