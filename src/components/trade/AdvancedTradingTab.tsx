/**
 * ADVANCED TRADING TAB COMPONENT
 * 
 * Wrapper component for AdvancedTradingPanel to be used in the unified trading tabs
 */

import React, { memo } from 'react';
import { Token } from '@/types';
import AdvancedTradingPanel from '@/components/phase4/AdvancedTradingPanel';

interface AdvancedTradingTabProps {
  tokens: Token[];
  selectedFromToken?: Token | null;
  selectedToToken?: Token | null;
  onTokenSelect?: (fromToken: Token, toToken: Token) => void;
}

export const AdvancedTradingTab: React.FC<AdvancedTradingTabProps> = memo(({
  tokens,
  selectedFromToken,
  selectedToToken,
  onTokenSelect
}) => {
  return (
    <div className="space-y-6">
      <AdvancedTradingPanel
        tokens={tokens}
        selectedFromToken={selectedFromToken || undefined}
        selectedToToken={selectedToToken || undefined}
        onTokenSelect={onTokenSelect}
      />
    </div>
  );
});

AdvancedTradingTab.displayName = 'AdvancedTradingTab';

export default AdvancedTradingTab;
