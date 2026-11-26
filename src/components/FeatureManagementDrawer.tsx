import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types';
import {
  X,
  Search,
  LayoutDashboard,
  Calendar,
  BookOpen,
  Target,
  Gamepad2,
  HeartHandshake,
  Bot,
  MapPin,
  Settings,
  Shield,
  Award,
  Sparkles,
  Users2,
  HelpCircle,
  FileText,
  Compass,
  ArrowRight,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenRoleSwitcher: () => void;
}

interface FeatureItem {
  id: string;
  tabKey: string;
  titleEn: string;
  titleMl: string;
  descEn: string;
  descMl: string;
  icon: any;
  category: 'core' | 'habits' | 'clinical' | 'intelligence';
  badge?: string;
  roleScope: UserRole[];
}

export const FeatureManagementDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  currentRole,
  currentTab,
  onSelectTab,
  onOpenRoleSwitcher,
}) => {
  const { language, t } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const ALL_FEATURES: FeatureItem[] = [
    // Core Workspaces
    {
      id: 'dashboard',
      tabKey: 'dashboard',
      titleEn: 'Personal Dashboard',
      titleMl: 'പ്രധാന ഡാഷ്‌ബോർഡ്',
      descEn: 'Clean overview with minimal distraction and immediate actions.',
      descMl: 'പ്രധാന വിവരങ്ങളും പ്രവർത്തനങ്ങളും ഒറ്റനോട്ടത്തിൽ കാണാം.',
      icon: LayoutDashboard,
      category: 'core',
      roleScope: ['personal', 'supporter', 'learner', 'community'],
    },
    {
      id: 'journey',
      tabKey: 'journey',
      titleEn: 'Recovery Journey & Stages',
      titleMl: 'വീണ്ടെടുക്കൽ യാത്രാ ഘട്ടങ്ങൾ',
      descEn: 'Track transition through stabilization, routines, and autonomy.',
      descMl: 'ഘട്ടം ഘട്ടമായുള്ള വീണ്ടെടുക്കൽ നാഴികക്കല്ലുകൾ.',
      icon: Compass,
      category: 'core',
      roleScope: ['personal'],
    },
    {
      id: 'dailylog',
      tabKey: 'dailylog',
      titleEn: 'Daily Check-in & Reflections',
      titleMl: 'ദിവസക്കുറിപ്പും മാനസികാവസ്ഥയും',
      descEn: 'Encrypted private check-in for mood, cravings, and proud moments.',
      descMl: 'സ്വകാര്യമായി ദിവസക്കുറിപ്പുകൾ രേഖപ്പെടുത്തുക.',
      icon: BookOpen,
      category: 'core',
      roleScope: ['personal'],
    },
    {
      id: 'calendar',
      tabKey: 'calendar',
      titleEn: 'Routines & Habit Calendar',
      titleMl: 'ദിനചര്യകളും കലണ്ടറും',
      descEn: 'Organize sleep, nutrition, therapy, and healthy dopamine habits.',
      descMl: 'ചിട്ടയായ ദിനചര്യകളും നല്ല ശീലങ്ങളും ക്രമീകരിക്കുക.',
      icon: Calendar,
      category: 'habits',
      roleScope: ['personal', 'supporter', 'learner'],
    },
    {
      id: 'rebuild',
      tabKey: 'rebuild',
      titleEn: 'Life Rebuilding & Milestones',
      titleMl: 'പുനർനിർമ്മാണ ലക്ഷ്യങ്ങൾ',
      descEn: 'Career, education, relationships, and healthy purpose goals.',
      descMl: 'ഭാവി സ്വപ്നങ്ങളും പുതിയ ജീവിത ലക്ഷ്യങ്ങളും.',
      icon: Target,
      category: 'habits',
      roleScope: ['personal'],
    },
    {
      id: 'games',
      tabKey: 'games',
      titleEn: 'Cognitive Recovery Lab',
      titleMl: 'കോഗ്നിറ്റീവ് ഗെയിംസ്',
      descEn: 'Clinically grounded Go/No-Go and Stroop neuro-cognitive retraining.',
      descMl: 'തലച്ചോറിന്റെ നിയന്ത്രണ ശേഷി കൂട്ടുന്ന ഗെയിമുകൾ.',
      icon: Gamepad2,
      category: 'habits',
      roleScope: ['personal'],
    },
    {
      id: 'tools',
      tabKey: 'tools',
      titleEn: 'Guided Urge & Coping Tools',
      titleMl: 'സഹായ ഉപകരണങ്ങൾ',
      descEn: 'Urge-surfing, 4-7-8 breathing reset, and somatic regulation.',
      descMl: 'മാനസിക സമ്മർദ്ദം കുറയ്ക്കാനുള്ള തൽക്ഷണ വ്യായാമങ്ങൾ.',
      icon: Sparkles,
      category: 'habits',
      roleScope: ['personal'],
    },
    {
      id: 'support',
      tabKey: 'support',
      titleEn: 'Google Maps Support Locator',
      titleMl: 'ചികിത്സാ കേന്ദ്രങ്ങളും മാപ്പും',
      descEn: 'Verified Kerala Government De-Addiction Centers & Vimukthi 14405.',
      descMl: 'സർക്കാർ അംഗീകൃത കേന്ദ്രങ്ങളും ഹെൽപ്പ്‌ലൈനുകളും ഗൂഗിൾ മാപ്പിൽ.',
      icon: MapPin,
      category: 'clinical',
      badge: 'Google Maps',
      roleScope: ['personal', 'supporter', 'learner', 'community'],
    },
    {
      id: 'guide',
      tabKey: 'guide',
      titleEn: 'Clear Path AI Assistant',
      titleMl: 'ക്ലിയർ പാത്ത് എഐ ഗൈഡ്',
      descEn: 'Safe, clinical guidance on recovery science and symptom management.',
      descMl: 'സംശയങ്ങൾക്ക് ഉത്തരം നൽകുന്ന സ്മാർട്ട് സഹായി.',
      icon: Bot,
      category: 'intelligence',
      roleScope: ['personal', 'supporter', 'learner', 'community'],
    },
    {
      id: 'certificate',
      tabKey: 'certificate',
      titleEn: 'Clear Path AI Certificate',
      titleMl: 'പൂർത്തീകരണ സർട്ടിഫിക്കറ്റ്',
      descEn: 'Earn official completion verification signed by Team Phoenix.',
      descMl: 'പഠനം പൂർത്തിയാക്കി ഔദ്യോഗിക സർട്ടിഫിക്കറ്റ് നേടുക.',
      icon: Award,
      category: 'intelligence',
      badge: 'Official Verification',
      roleScope: ['learner'],
    },
    {
      id: 'planner',
      tabKey: 'planner',
      titleEn: 'Flexible Learning Planner',
      titleMl: 'പഠന പ്ലാനർ',
      descEn: 'Custom 7-day or 14-day schedule tailored to your interests.',
      descMl: 'നിങ്ങളുടെ താൽപ്പര്യത്തിനനുസരിച്ചുള്ള പഠന പ്ലാൻ.',
      icon: FileText,
      category: 'intelligence',
      roleScope: ['learner'],
    },
  ];

  // Filter by active role
  const roleFeatures = ALL_FEATURES.filter(f => f.roleScope.includes(currentRole));

  // Filter by search
  const filteredFeatures = roleFeatures.filter(f => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.titleEn.toLowerCase().includes(q) ||
      f.titleMl.toLowerCase().includes(q) ||
      f.descEn.toLowerCase().includes(q) ||
      f.descMl.toLowerCase().includes(q)
    );
  });

  const categories = [
    { key: 'core', labelEn: 'Core Actions', labelMl: 'പ്രധാന പ്രവർത്തനങ്ങൾ' },
    { key: 'habits', labelEn: 'Habits & Cognitive Lab', labelMl: 'ശീലങ്ങളും കോഗ്നിറ്റീവ് ലാബും' },
    { key: 'clinical', labelEn: 'Medical & Google Maps', labelMl: 'ചികിത്സയും ഗൂഗിൾ മാപ്പും' },
    { key: 'intelligence', labelEn: 'AI Guidance & Certificates', labelMl: 'എഐ ഗൈഡും സർട്ടിഫിക്കറ്റും' },
  ];

  const handleSelect = (tabKey: string) => {
    onSelectTab(tabKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-250">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-[#FBFBFA]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold shadow-xs">
              ☰
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {t('featureHub')}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'ml' ? 'എല്ലാ സൗകര്യങ്ങളും ഇവിടെ കണ്ടെത്താം' : 'All tools, views & verified actions'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-5 pt-4 pb-2 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={language === 'ml' ? 'ഫീച്ചറുകൾ തിരയുക...' : 'Search tools, maps, journals...'}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Categorized Features List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {categories.map(cat => {
            const items = filteredFeatures.filter(f => f.category === cat.key);
            if (items.length === 0) return null;

            return (
              <div key={cat.key} className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {language === 'ml' ? cat.labelMl : cat.labelEn}
                </span>

                <div className="space-y-1.5">
                  {items.map(item => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.tabKey;

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item.tabKey)}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                          isActive
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-xs'
                            : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 text-slate-800'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            isActive
                              ? 'bg-emerald-700 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {language === 'ml' ? item.titleMl : item.titleEn}
                            </span>
                            {item.badge && (
                              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded shrink-0">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {language === 'ml' ? item.descMl : item.descEn}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredFeatures.length === 0 && (
            <div className="text-center py-8 text-slate-400 text-xs">
              {language === 'ml' ? 'ഫീച്ചറുകളൊന്നും കണ്ടെത്തിയില്ല.' : 'No features found matching your search.'}
            </div>
          )}
        </div>

        {/* Drawer Footer with Role Switcher & Emergency */}
        <div className="p-4 border-t border-slate-200 bg-[#FBFBFA] space-y-2">
          <button
            onClick={() => {
              onClose();
              onOpenRoleSwitcher();
            }}
            className="w-full py-2.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users2 className="w-4 h-4 text-emerald-700" />
              <span>{t('changeRole')}</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <a
            href="tel:14405"
            className="w-full py-2 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <span>Kerala 24/7 Helpline: 14405</span>
          </a>
        </div>
      </div>
    </div>
  );
};
