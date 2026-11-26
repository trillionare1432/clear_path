import React from 'react';
import { useApp } from '../context/AppContext';
import { Layers, Calendar, CheckSquare, BarChart3, BookOpen } from 'lucide-react';
import { CommunityActiveTab } from './CommunityTopHeader';

interface CommunityBottomNavProps {
  activeTab: CommunityActiveTab;
  setActiveTab: (tab: CommunityActiveTab) => void;
}

export const CommunityBottomNav: React.FC<CommunityBottomNavProps> = ({
  activeTab,
  setActiveTab,
}) => {
  const { language } = useApp();

  const items: { id: CommunityActiveTab; label: string; labelMl: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Overview', labelMl: 'അവലോകനം', icon: Layers },
    { id: 'programmes', label: 'Programs', labelMl: 'പദ്ധതികൾ', icon: Layers },
    { id: 'events', label: 'Calendar', labelMl: 'കലണ്ടർ', icon: Calendar },
    { id: 'team_tasks', label: 'Tasks', labelMl: 'ചുമതലകൾ', icon: CheckSquare },
    { id: 'resources', label: 'Resources', labelMl: 'വിഭവങ്ങൾ', icon: BookOpen },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around">
        {items.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-2 rounded-xl transition-colors ${
                isActive ? 'text-teal-800' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              <span className="text-[10px] font-semibold mt-0.5">
                {language === 'ml' ? item.labelMl : item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
