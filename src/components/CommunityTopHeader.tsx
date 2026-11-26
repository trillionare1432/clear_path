import React from 'react';
import { MinimalTopCommandBar } from './MinimalTopCommandBar';

export type CommunityActiveTab =
  | 'dashboard'
  | 'intelligence'
  | 'strategy_lab'
  | 'generator'
  | 'map'
  | 'gaps'
  | 'exchange'
  | 'programmes'
  | 'events'
  | 'team_tasks'
  | 'resources'
  | 'campaigns'
  | 'feedback'
  | 'analytics'
  | 'partners'
  | 'ai_guide'
  | 'reports';

interface CommunityTopHeaderProps {
  activeTab: CommunityActiveTab;
  setActiveTab: (tab: CommunityActiveTab) => void;
  onOpenQuickAdd: () => void;
  onOpenSettings: () => void;
}

export const CommunityTopHeader: React.FC<CommunityTopHeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
}) => {
  return (
    <MinimalTopCommandBar
      role="community"
      currentTab={activeTab}
      onSelectTab={tab => setActiveTab(tab as CommunityActiveTab)}
      onOpenRoleSwitcher={onOpenSettings}
    />
  );
};
