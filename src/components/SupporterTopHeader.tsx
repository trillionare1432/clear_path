import React from 'react';
import { MinimalTopCommandBar } from './MinimalTopCommandBar';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenRoleSwitcher: () => void;
}

export const SupporterTopHeader: React.FC<Props> = ({
  currentTab,
  onSelectTab,
  onOpenRoleSwitcher,
}) => {
  return (
    <MinimalTopCommandBar
      role="supporter"
      currentTab={currentTab}
      onSelectTab={onSelectTab}
      onOpenRoleSwitcher={onOpenRoleSwitcher}
    />
  );
};
