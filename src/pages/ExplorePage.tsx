
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ExplorePage = () => {
  return (
    <div className="container mx-auto px-4 pt-16 pb-24">
      <h1 className="text-2xl font-bold text-white mb-6">Explore</h1>
      <Card className="bg-dex-dark/80 border-dex-primary/30">
        <CardContent className="p-4">
          <Tabs defaultValue="tokens">
            <TabsList className="grid w-full grid-cols-3 bg-dex-dark/50">
              <TabsTrigger value="tokens">Tokens</TabsTrigger>
              <TabsTrigger value="pools">Pools</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
            </TabsList>
            <TabsContent value="tokens">
              <div className="text-white p-4">Tokens list coming soon</div>
            </TabsContent>
            <TabsContent value="pools">
              <div className="text-white p-4">Pools list coming soon</div>
            </TabsContent>
            <TabsContent value="transactions">
              <div className="text-white p-4">Transaction history coming soon</div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExplorePage;
