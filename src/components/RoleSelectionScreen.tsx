import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import { ShieldCheck, HeartHandshake, BookOpen, Users2, Sparkles, Globe } from 'lucide-react';

interface RoleOption {
  role: UserRole;
  titleKey: string;
  descKey: string;
  themeColor: string;
  borderColor: string;
  badge: string;
  icon: React.ReactNode;
}

export const RoleSelectionScreen: React.FC = () => {
  const { setRole, language, setLanguage, t } = useApp();

  const roleOptions: RoleOption[] = [
    {
      role: 'personal',
      titleKey: 'role1Title',
      descKey: 'role1Desc',
      themeColor: 'bg-emerald-50 text-emerald-800',
      borderColor: 'hover:border-emerald-500 focus:border-emerald-600',
      badge: 'Role 01 · Full Workspace',
      icon: <Sparkles className="w-6 h-6 text-emerald-700" />,
    },
    {
      role: 'supporter',
      titleKey: 'role2Title',
      descKey: 'role2Desc',
      themeColor: 'bg-amber-50 text-amber-800',
      borderColor: 'hover:border-amber-500 focus:border-amber-600',
      badge: 'Role 02 · Family & Allies',
      icon: <HeartHandshake className="w-6 h-6 text-amber-700" />,
    },
    {
      role: 'learner',
      titleKey: 'role3Title',
      descKey: 'role3Desc',
      themeColor: 'bg-indigo-50 text-indigo-800',
      borderColor: 'hover:border-indigo-500 focus:border-indigo-600',
      badge: 'Role 03 · Full Science & Practice Workspace',
      icon: <BookOpen className="w-6 h-6 text-indigo-700" />,
    },
    {
      role: 'community',
      titleKey: 'role4Title',
      descKey: 'role4Desc',
      themeColor: 'bg-teal-50 text-teal-800',
      borderColor: 'hover:border-teal-500 focus:border-teal-600',
      badge: 'Role 04 · Schools & Civic',
      icon: <Users2 className="w-6 h-6 text-teal-700" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFA] flex flex-col justify-between p-4 sm:p-8 md:p-12">
      {/* Top Language Toggle */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between pb-6 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-900 flex items-center justify-center text-amber-300 font-bold text-sm shadow-sm">
            CP
          </div>
          <span className="text-xl font-extrabold tracking-tight text-slate-900">
            ClearPath AI
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-400" />
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              language === 'en'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage('ml')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              language === 'ml'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 bg-slate-100'
            }`}
          >
            മലയാളം
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto w-full my-auto py-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 mb-3">
            {t('welcomeQuestion')}
          </h1>
          <p className="text-base text-slate-600 leading-relaxed">
            {t('tagline')}
          </p>
        </div>

        {/* 4 Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {roleOptions.map(option => (
            <button
              key={option.role}
              onClick={() => setRole(option.role)}
              className={`text-left p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all duration-200 ${option.borderColor} hover:shadow-md hover:-translate-y-0.5 group focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${option.themeColor}`}>
                  {option.icon}
                </div>
                <span className="text-xs font-medium text-slate-500 tracking-wide">
                  {option.badge}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-emerald-900 transition-colors">
                {t(option.titleKey)}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                {t(option.descKey)}
              </p>
              <div className="flex items-center text-xs font-semibold text-emerald-700 pt-2 border-t border-slate-100">
                <span>{t('selectRole')} &rarr;</span>
              </div>
            </button>
          ))}
        </div>
      </main>

      {/* Privacy Guarantee Footer */}
      <footer className="max-w-4xl mx-auto w-full pt-8 border-t border-slate-200/80 text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 max-w-xl mx-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{t('privacyPromise')}</span>
        </div>
      </footer>
    </div>
  );
};
