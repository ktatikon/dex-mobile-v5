
import React, { useState } from 'react';
import { Token } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import TokenIcon from './TokenIcon';
import TokenListItem from './TokenListItem';

interface TokenSelectorProps {
  tokens: Token[];
  selectedToken: Token | null;
  onSelectToken: (token: Token) => void;
  label?: string;
}

const TokenSelector: React.FC<TokenSelectorProps> = ({
  tokens,
  selectedToken,
  onSelectToken,
  label
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  
  // Filter tokens based on search
  const filteredTokens = tokens.filter(token => 
    token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleSelectToken = (token: Token) => {
    onSelectToken(token);
    setOpen(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 transition-colors rounded-lg p-2 border border-gray-700">
          {selectedToken ? (
            <>
              <TokenIcon token={selectedToken} size="sm" />
              <span className="font-medium">{selectedToken.symbol}</span>
            </>
          ) : (
            <span className="text-gray-400">Select a token</span>
          )}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="ml-1"
          >
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md text-white bg-dex-dark border-gray-700">
        <DialogHeader>
          <DialogTitle>{label || 'Select a token'}</DialogTitle>
        </DialogHeader>
        
        <div className="mt-4 mb-4">
          <Input 
            placeholder="Search name or paste address" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-gray-800 border-gray-700"
          />
        </div>
        
        <div className="max-h-80 overflow-y-auto">
          {filteredTokens.map(token => (
            <TokenListItem 
              key={token.id} 
              token={token} 
              showBalance={true}
              onSelect={() => handleSelectToken(token)}
            />
          ))}
          
          {filteredTokens.length === 0 && (
            <div className="text-center py-4 text-gray-400">
              No tokens found
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TokenSelector;
