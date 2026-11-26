import React from 'react';
import { MinimalTopCommandBar } from './MinimalTopCommandBar';

interface Props {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenRoleSwitcher: () => void;
}

export const TopHeader: React.FC<Props> = ({ currentTab, onSelectTab, onOpenRoleSwitcher }) => {
  return (
    <MinimalTopCommandBar
      role="personal"
      currentTab={currentTab}
      onSelectTab={onSelectTab}
      onOpenRoleSwitcher={onOpenRoleSwitcher}
    />
  );
};
