import React from 'react';
import { LayoutDashboard, Compass, Calendar, BookOpen, Target, Gamepad2, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const BottomNav: React.FC<Props> = ({ currentTab, onSelectTab }) => {
  const { t } = useApp();

  const tabs = [
    { id: 'dashboard', labelKey: 'navDashboard', icon: LayoutDashboard },
    { id: 'journey', labelKey: 'navJourney', icon: Compass },
    { id: 'calendar', labelKey: 'navCalendar', icon: Calendar },
    { id: 'dailylog', labelKey: 'navDailyLog', icon: BookOpen },
    { id: 'rebuild', labelKey: 'navRebuild', icon: Target },
    { id: 'games', labelKey: 'navGames', icon: Gamepad2 },
    { id: 'settings', labelKey: 'navSettings', icon: Settings },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1 safe-bottom shadow-lg shadow-slate-900/5">
      <div className="grid grid-cols-7 items-center max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center min-h-[50px] py-1 transition-colors rounded-xl ${
                isActive ? 'text-emerald-800 font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px] text-emerald-800' : 'stroke-[1.75px]'}`} />
              <span className="text-[10px] tracking-tight mt-1 truncate max-w-[48px]">
                {t(tab.labelKey)}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
