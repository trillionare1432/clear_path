import React from 'react';
import { MinimalTopCommandBar } from './MinimalTopCommandBar';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenRoleSwitcher: () => void;
}

export const LearnerTopHeader: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  onOpenRoleSwitcher,
}) => {
  return (
    <MinimalTopCommandBar
      role="learner"
      currentTab={currentTab}
      onSelectTab={onSelectTab}
      onOpenRoleSwitcher={onOpenRoleSwitcher}
    />
  );
};
