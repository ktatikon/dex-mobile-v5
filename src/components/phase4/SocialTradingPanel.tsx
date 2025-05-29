/**
 * Phase 4.5 Social Trading Panel
 * Main interface for social trading features including copy trading, signals, and community
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Users,
  MessageSquare,
  Trophy,
  Copy,
  Signal,
  Heart,
  Share2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import {
  safeSocialTradingService,
  type TraderProfile,
  type LeaderboardEntry,
  type SocialSignal
} from '@/services/phase4/socialTradingService';
import { phase4ConfigManager } from '@/services/phase4/phase4ConfigService';

interface SocialTradingPanelProps {
  userId: string;
  onError?: (error: string) => void;
}

const SocialTradingPanel: React.FC<SocialTradingPanelProps> = ({
  userId,
  onError
}) => {
  // State management
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [loading, setLoading] = useState(false);
  const [traderProfile, setTraderProfile] = useState<TraderProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [socialSignals, setSocialSignals] = useState<SocialSignal[]>([]);
  const [phase45Enabled, setPhase45Enabled] = useState(false);

  // Check Phase 4.5 availability
  useEffect(() => {
    const config = phase4ConfigManager.getConfig();
    const enabled = config.enableCopyTrading ||
                   config.enableSocialSignals ||
                   config.enableCommunityFeatures ||
                   config.enableTraderLeaderboards;
    setPhase45Enabled(enabled);
  }, []);

  // Load trader profile
  const loadTraderProfile = useCallback(async () => {
    try {
      setLoading(true);
      const profile = await safeSocialTradingService.getTraderProfile(userId);
      setTraderProfile(profile);
    } catch (error) {
      console.error('Error loading trader profile:', error);
      onError?.('Failed to load trader profile');
    } finally {
      setLoading(false);
    }
  }, [userId, onError]);

  // Load leaderboard data
  const loadLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const data = await safeSocialTradingService.getTraderLeaderboard('overall', 20);
      setLeaderboard(data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      onError?.('Failed to load trader leaderboard');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Load social signals
  const loadSocialSignals = useCallback(async () => {
    try {
      setLoading(true);
      const signals = await safeSocialTradingService.getSocialSignals({}, 20);
      setSocialSignals(signals);
    } catch (error) {
      console.error('Error loading social signals:', error);
      onError?.('Failed to load social signals');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Initialize data
  useEffect(() => {
    if (phase45Enabled) {
      loadTraderProfile();
      loadLeaderboard();
      loadSocialSignals();
    }
  }, [phase45Enabled, loadTraderProfile, loadLeaderboard, loadSocialSignals]);

  // Render trader leaderboard
  const renderLeaderboard = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Top Traders</h3>
        <Button variant="outline" size="sm" onClick={loadLeaderboard}>
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {leaderboard.map((entry, index) => (
          <Card key={entry.traderId} className="bg-[#1C1C1E] border-[#2C2C2E]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Badge variant={index < 3 ? "default" : "secondary"} className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index < 3 ? <Trophy className="w-4 h-4" /> : entry.rank}
                    </Badge>
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={entry.traderProfile.avatar} />
                      <AvatarFallback>{entry.traderProfile.displayName.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-white">{entry.traderProfile.displayName}</span>
                      {entry.traderProfile.verificationLevel !== 'unverified' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-[#8E8E93]">
                      <span>{entry.traderProfile.totalFollowers} followers</span>
                      <span>{entry.traderProfile.totalCopiers} copiers</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-lg font-bold ${entry.performance.totalReturn >= 0 ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>
                    {entry.performance.totalReturn >= 0 ? '+' : ''}{entry.performance.totalReturn.toFixed(2)}%
                  </div>
                  <div className="text-sm text-[#8E8E93]">
                    Win Rate: {(entry.performance.winRate * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {entry.traderProfile.riskLevel} risk
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {entry.performance.totalTrades} trades
                  </Badge>
                </div>

                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    <Users className="w-4 h-4 mr-1" />
                    Follow
                  </Button>
                  <Button size="sm" className="bg-[#FF3B30] hover:bg-[#FF3B30]/80">
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Render social signals feed
  const renderSocialSignals = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Trading Signals</h3>
        <Button variant="outline" size="sm" onClick={loadSocialSignals}>
          Refresh
        </Button>
      </div>

      <div className="space-y-3">
        {socialSignals.map((signal) => (
          <Card key={signal.id} className="bg-[#1C1C1E] border-[#2C2C2E]">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge
                      variant={signal.signalType === 'buy' ? 'default' : signal.signalType === 'sell' ? 'destructive' : 'secondary'}
                      className="uppercase"
                    >
                      {signal.signalType}
                    </Badge>
                    <span className="font-bold text-white">{signal.asset}</span>
                    {signal.targetPrice && (
                      <span className="text-[#8E8E93]">@ ${signal.targetPrice}</span>
                    )}
                  </div>

                  <p className="text-sm text-[#8E8E93] mb-3">{signal.reasoning}</p>

                  <div className="flex items-center space-x-4 text-xs text-[#8E8E93]">
                    <span>Confidence: {(signal.confidence * 100).toFixed(0)}%</span>
                    <span>Timeframe: {signal.timeframe}</span>
                    <span>Risk: {signal.riskLevel}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-2">
                  <Progress value={signal.confidence * 100} className="w-16 h-2" />
                  <div className="flex items-center space-x-2 text-xs text-[#8E8E93]">
                    <span className="flex items-center">
                      <Heart className="w-3 h-3 mr-1" />
                      {signal.likes}
                    </span>
                    <span className="flex items-center">
                      <MessageSquare className="w-3 h-3 mr-1" />
                      {signal.comments}
                    </span>
                    <span className="flex items-center">
                      <Share2 className="w-3 h-3 mr-1" />
                      {signal.shares}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // Render copy trading dashboard
  const renderCopyTrading = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Copy Trading</h3>
        <Button className="bg-[#FF3B30] hover:bg-[#FF3B30]/80">
          <Copy className="w-4 h-4 mr-2" />
          Start Copying
        </Button>
      </div>

      <Card className="bg-[#1C1C1E] border-[#2C2C2E]">
        <CardContent className="p-6">
          <div className="text-center">
            <Copy className="w-12 h-12 text-[#8E8E93] mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">Start Copy Trading</h4>
            <p className="text-[#8E8E93] mb-4">
              Automatically copy trades from successful traders. Set your risk limits and let the experts trade for you.
            </p>
            <Button className="bg-[#FF3B30] hover:bg-[#FF3B30]/80">
              Browse Traders
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render community features
  const renderCommunity = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Community</h3>
        <Button variant="outline" size="sm">
          <MessageSquare className="w-4 h-4 mr-2" />
          New Post
        </Button>
      </div>

      <Card className="bg-[#1C1C1E] border-[#2C2C2E]">
        <CardContent className="p-6">
          <div className="text-center">
            <MessageSquare className="w-12 h-12 text-[#8E8E93] mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-white mb-2">Join the Community</h4>
            <p className="text-[#8E8E93] mb-4">
              Connect with other traders, share insights, and learn from the community.
            </p>
            <Button className="bg-[#FF3B30] hover:bg-[#FF3B30]/80">
              Explore Community
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (!phase45Enabled) {
    return (
      <Card className="bg-[#1C1C1E] border-[#2C2C2E]">
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-[#8E8E93] mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Social Trading Unavailable</h3>
            <p className="text-[#8E8E93]">
              Social trading features are currently disabled. Please check your configuration.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Social Trading</h2>
          <p className="text-[#8E8E93]">Connect, learn, and trade with the community</p>
        </div>
        <Badge className="bg-[#FF3B30] text-white">Phase 4.5</Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-[#2C2C2E]">
          <TabsTrigger value="leaderboard" className="data-[state=active]:bg-[#FF3B30]">
            <Trophy className="w-4 h-4 mr-2" />
            Leaderboard
          </TabsTrigger>
          <TabsTrigger value="signals" className="data-[state=active]:bg-[#FF3B30]">
            <Signal className="w-4 h-4 mr-2" />
            Signals
          </TabsTrigger>
          <TabsTrigger value="copy" className="data-[state=active]:bg-[#FF3B30]">
            <Copy className="w-4 h-4 mr-2" />
            Copy Trading
          </TabsTrigger>
          <TabsTrigger value="community" className="data-[state=active]:bg-[#FF3B30]">
            <MessageSquare className="w-4 h-4 mr-2" />
            Community
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="mt-6">
          {renderLeaderboard()}
        </TabsContent>

        <TabsContent value="signals" className="mt-6">
          {renderSocialSignals()}
        </TabsContent>

        <TabsContent value="copy" className="mt-6">
          {renderCopyTrading()}
        </TabsContent>

        <TabsContent value="community" className="mt-6">
          {renderCommunity()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SocialTradingPanel;
