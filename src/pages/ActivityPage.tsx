
import React, { useState } from 'react';
import { mockTransactions } from '@/services/mockData';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TransactionItem from '@/components/TransactionItem';
import { Transaction, TransactionType } from '@/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

const ActivityPage: React.FC = () => {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const handleViewDetails = (tx: Transaction) => {
    setSelectedTx(tx);
    setIsDetailsOpen(true);
  };
  
  const handleOpenExplorer = () => {
    // In a real app, this would open the block explorer with the transaction hash
    window.open(`https://etherscan.io/tx/${selectedTx?.hash}`, '_blank');
  };
  
  // Get transaction type counts
  const swapCount = mockTransactions.filter(tx => tx.type === TransactionType.SWAP).length;
  const sendReceiveCount = mockTransactions.filter(tx => 
    tx.type === TransactionType.SEND || tx.type === TransactionType.RECEIVE
  ).length;
  
  return (
    <div className="pb-20">
      <h1 className="text-2xl font-bold mb-4">Activity</h1>
      
      <Tabs defaultValue="all" className="w-full mb-4">
        <TabsList className="grid grid-cols-3 mb-4 bg-gray-800">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="swaps">Swaps ({swapCount})</TabsTrigger>
          <TabsTrigger value="transfers">Transfers ({sendReceiveCount})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <Card className="p-0 bg-dex-dark text-white border-gray-700 overflow-hidden">
            {mockTransactions.map(tx => (
              <TransactionItem 
                key={tx.id}
                transaction={tx}
                onViewDetails={handleViewDetails}
              />
            ))}
          </Card>
        </TabsContent>
        
        <TabsContent value="swaps">
          <Card className="p-0 bg-dex-dark text-white border-gray-700 overflow-hidden">
            {mockTransactions
              .filter(tx => tx.type === TransactionType.SWAP)
              .map(tx => (
                <TransactionItem 
                  key={tx.id}
                  transaction={tx}
                  onViewDetails={handleViewDetails}
                />
              ))
            }
          </Card>
        </TabsContent>
        
        <TabsContent value="transfers">
          <Card className="p-0 bg-dex-dark text-white border-gray-700 overflow-hidden">
            {mockTransactions
              .filter(tx => tx.type === TransactionType.SEND || tx.type === TransactionType.RECEIVE)
              .map(tx => (
                <TransactionItem 
                  key={tx.id}
                  transaction={tx}
                  onViewDetails={handleViewDetails}
                />
              ))
            }
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Transaction Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-md text-white bg-dex-dark border-gray-700">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>
          
          {selectedTx && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Type</span>
                  <span className="font-medium">
                    {selectedTx.type.charAt(0).toUpperCase() + selectedTx.type.slice(1)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className="font-medium">
                    {selectedTx.status.charAt(0).toUpperCase() + selectedTx.status.slice(1)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Date</span>
                  <span className="font-medium">
                    {new Date(selectedTx.timestamp).toLocaleString()}
                  </span>
                </div>
                
                {selectedTx.fromToken && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">From</span>
                    <span className="font-medium">
                      {selectedTx.fromAmount} {selectedTx.fromToken.symbol}
                    </span>
                  </div>
                )}
                
                {selectedTx.toToken && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">To</span>
                    <span className="font-medium">
                      {selectedTx.toAmount} {selectedTx.toToken.symbol}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Hash</span>
                  <span className="font-medium text-dex-primary">
                    {selectedTx.hash}
                  </span>
                </div>
              </div>
              
              <Button 
                className="w-full bg-dex-primary/10 text-dex-primary hover:bg-dex-primary/20"
                onClick={handleOpenExplorer}
              >
                View on Explorer
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ActivityPage;
