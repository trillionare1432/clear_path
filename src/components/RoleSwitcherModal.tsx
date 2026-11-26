import React from 'react';
import { useApp } from '../context/AppContext';
import { ROLE_THEME_META } from '../constants/featureCatalog';
import { UserRole } from '../types';
import { Compass, HeartHandshake, GraduationCap, Building2, Shield, X, Stethoscope } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenPortalAuth?: (mode: 'therapist' | 'admin') => void;
}

export const RoleSwitcherModal: React.FC<Props> = ({ isOpen, onClose, onOpenPortalAuth }) => {
  const { currentRole, setRole, setPortalMode, serverAuthUser, language, t } = useApp();

  if (!isOpen) return null;

  const roles: {
    role: UserRole;
    titleKey: string;
    icon: React.ReactNode;
    iconBg: string;
    desc: string;
  }[] = [
    {
      role: 'personal',
      titleKey: 'role1Title',
      icon: <Compass className="w-5 h-5 text-indigo-800" />,
      iconBg: 'bg-indigo-50 border-indigo-200',
      desc: 'Understand My Situation, Get My Report, 8 CBT/MI pathways, brain games & local care.',
    },
    {
      role: 'supporter',
      titleKey: 'role2Title',
      icon: <HeartHandshake className="w-5 h-5 text-orange-800" />,
      iconBg: 'bg-orange-50 border-orange-200',
      desc: 'How Can I Help? talk coach, support action planner, boundaries & Kerala care match.',
    },
    {
      role: 'learner',
      titleKey: 'role3Title',
      icon: <GraduationCap className="w-5 h-5 text-blue-800" />,
      iconBg: 'bg-sky-50 border-blue-200',
      desc: '12-topic curriculum, Kerala Knowledge Centre, decision simulator & quizzes.',
    },
    {
      role: 'community',
      titleKey: 'role4Title',
      icon: <Building2 className="w-5 h-5 text-teal-800" />,
      iconBg: 'bg-teal-50 border-teal-200',
      desc: 'Verified programme directory, district gap intelligence & pre/post evaluation.',
    },
  ];

  const handleSelectRole = (newRole: UserRole) => {
    setPortalMode('none');
    setRole(newRole);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-extrabold text-indigo-950">{t('changeRole')}</h3>
            <p className="text-xs text-slate-500">
              Switch between ClearPath AI&apos;s four distinct workspaces
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 my-5">
          {roles.map(item => {
            const isCurrent = currentRole === item.role;
            const meta = ROLE_THEME_META[item.role];
            return (
              <button
                key={item.role}
                onClick={() => handleSelectRole(item.role)}
                className={`w-full p-4 rounded-2xl text-left border transition-all flex items-start gap-3.5 cursor-pointer ${
                  isCurrent
                    ? `${meta.softBg} ${meta.softBorder} shadow-xs`
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                }`}
              >
                <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${item.iconBg}`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-[11px] font-bold uppercase tracking-wide ${meta.accentText}`}>
                      {meta.numeral} {language === 'ml' ? meta.titleMl : meta.title}
                    </span>
                    {isCurrent && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${meta.softBg} ${meta.softBorder} ${meta.accentText}`}>
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    {language === 'ml' ? meta.builtForMl : meta.builtFor}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-indigo-50/60 rounded-xl border border-indigo-200/80 mb-4 text-xs">
          <span className="font-semibold text-indigo-950">Professional Clinical Workspace</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (serverAuthUser?.role === 'therapist') {
                  setPortalMode('therapist');
                  onClose();
                } else if (onOpenPortalAuth) {
                  onClose();
                  onOpenPortalAuth('therapist');
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-[#4A154B] hover:bg-[#3A103B] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
            >
              <Stethoscope className="w-3.5 h-3.5 text-[#6EE7B7]" />
              <span>Therapist Portal</span>
            </button>
            {serverAuthUser?.role === 'admin' && (
              <button
                type="button"
                onClick={() => {
                  setPortalMode('admin');
                  onClose();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-indigo-200 text-indigo-950 text-[11px] font-bold cursor-pointer"
              >
                Admin
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-200/70 mb-4">
          <Shield className="w-4 h-4 text-indigo-800 shrink-0" />
          <span>
            Your private Personal Journey records stay strictly isolated in your browser vault. Switching roles never exposes private logs.
          </span>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
