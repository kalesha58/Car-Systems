import React from 'react';

import { SegmentedTabs } from '@components/common/SegmentedTabs';

const TABS = [
  { label: 'Products', key: 'products' },
  { label: 'Vehicles', key: 'vehicles' },
  { label: 'Services', key: 'services' },
  { label: 'Drive', key: 'drive' },
] as const;

export interface MarketplaceTabCounts {
  products: number;
  vehicles: number;
  services: number;
  drive: number;
}

interface MarketplaceTabsProps {
  activeTab: number;
  onTabChange: (index: number) => void;
  counts: MarketplaceTabCounts;
}

export function MarketplaceTabs({ activeTab, onTabChange, counts }: MarketplaceTabsProps) {
  return (
    <SegmentedTabs
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={onTabChange}
      counts={{ ...counts }}
    />
  );
}
