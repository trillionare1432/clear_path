import React from 'react';
import { Compass, GraduationCap, Sparkles, Calendar, PenTool, HelpCircle } from 'lucide-react';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const LearnerBottomNav: React.FC<Props> = ({ currentTab, onSelectTab }) => {
  const ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: Compass },
    { id: 'pathways', label: 'Pathways', icon: GraduationCap },
    { id: 'interactive', label: 'Practice', icon: Sparkles },
    { id: 'calendar', label: 'Plan', icon: Calendar },
    { id: 'journal', label: 'Journal', icon: PenTool },
    { id: 'support', label: 'Support', icon: HelpCircle },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-indigo-100 px-2 py-1.5 shadow-lg">
      <div className="grid grid-cols-6 gap-1 max-w-md mx-auto">
        {ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'text-indigo-700 bg-indigo-50/80 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-indigo-600 scale-110' : 'text-slate-400'}`} />
              <span className="truncate w-full text-center">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
