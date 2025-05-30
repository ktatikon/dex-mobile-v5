import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Plot from 'react-plotly.js';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  ExternalLink,
  Github,
  Twitter,
  Linkedin,
  TrendingUp,
  Shield,
  Zap,
  Brain,
  Globe,
  Users,
  BarChart3,
  Wallet,
  ArrowUpDown,
  Lock,
  Cpu,
  Target,
  Sparkles
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const AboutPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data for charts - in production, this would come from APIs
  const [tradingVolumeData, setTradingVolumeData] = useState<any[]>([]);
  const [priceAnalyticsData, setPriceAnalyticsData] = useState<any[]>([]);
  const [networkStatsData, setNetworkStatsData] = useState<any[]>([]);

  useEffect(() => {
    // Generate mock trading volume data
    const volumeData = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      volume: Math.random() * 10000000 + 5000000,
      transactions: Math.floor(Math.random() * 5000) + 1000
    }));
    setTradingVolumeData(volumeData);

    // Generate mock price analytics data
    const priceData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      eth: 2000 + Math.random() * 200 - 100,
      btc: 45000 + Math.random() * 5000 - 2500,
      bnb: 300 + Math.random() * 50 - 25
    }));
    setPriceAnalyticsData(priceData);

    // Generate network stats data
    const networkData = [
      { network: 'Ethereum', volume: 45.2, color: '#627EEA' },
      { network: 'Polygon', volume: 23.8, color: '#8247E5' },
      { network: 'BSC', volume: 15.6, color: '#F3BA2F' },
      { network: 'Arbitrum', volume: 8.9, color: '#28A0F0' },
      { network: 'Optimism', volume: 4.2, color: '#FF0420' },
      { network: 'Avalanche', volume: 2.3, color: '#E84142' }
    ];
    setNetworkStatsData(networkData);
  }, []);

  const openExternalLink = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="container mx-auto px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => navigate('/settings')}
          aria-label="Back to Settings"
        >
          <ArrowLeft className="text-white" size={26} />
        </Button>
        <h1 className="text-2xl font-bold text-white">About V-DEX</h1>
      </div>

      {/* Hero Section */}
      <Card className="bg-gradient-to-br from-dex-primary/20 to-dex-secondary/20 border-dex-primary/30 mb-8 shadow-lg shadow-dex-primary/10">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-xl bg-dex-primary flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">V</span>
            </div>
          </div>
          <CardTitle className="text-white text-3xl mb-2">V-DEX</CardTitle>
          <CardDescription className="text-dex-text-secondary text-lg">
            Next-Generation AI-Enhanced Decentralized Exchange
          </CardDescription>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Badge variant="secondary" className="bg-dex-positive/20 text-dex-positive border-dex-positive/30">
              <Sparkles size={14} className="mr-1" />
              AI-Powered
            </Badge>
            <Badge variant="secondary" className="bg-dex-primary/20 text-dex-primary border-dex-primary/30">
              <Shield size={14} className="mr-1" />
              Enterprise-Grade
            </Badge>
            <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              <Globe size={14} className="mr-1" />
              Multi-Chain
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-dex-text-secondary mb-6 max-w-2xl mx-auto">
            Experience the future of decentralized trading with our advanced platform featuring
            AI-powered analytics, cross-chain capabilities, and enterprise-grade security across
            7 major blockchain networks.
          </p>
          <Button
            variant="outline"
            className="text-white border-dex-primary/50 hover:bg-dex-primary/10"
            onClick={() => openExternalLink('https://preview--echo-digital-swap.lovable.app/trade')}
          >
            <ExternalLink size={18} className="mr-2" />
            Visit V-DEX Platform
          </Button>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-dex-secondary/20 border border-dex-secondary/30">
          <TabsTrigger value="overview" className="data-[state=active]:bg-dex-primary data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="features" className="data-[state=active]:bg-dex-primary data-[state=active]:text-white">
            Features
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-dex-primary data-[state=active]:text-white">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="data-[state=active]:bg-dex-primary data-[state=active]:text-white">
            Roadmap
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Platform Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-dex-secondary/10 border-dex-secondary/30">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-dex-positive mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">$2.4B+</div>
                <div className="text-sm text-dex-text-secondary">Total Volume</div>
              </CardContent>
            </Card>
            <Card className="bg-dex-secondary/10 border-dex-secondary/30">
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">150K+</div>
                <div className="text-sm text-dex-text-secondary">Active Users</div>
              </CardContent>
            </Card>
            <Card className="bg-dex-secondary/10 border-dex-secondary/30">
              <CardContent className="p-4 text-center">
                <Globe className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">7</div>
                <div className="text-sm text-dex-text-secondary">Networks</div>
              </CardContent>
            </Card>
            <Card className="bg-dex-secondary/10 border-dex-secondary/30">
              <CardContent className="p-4 text-center">
                <ArrowUpDown className="h-8 w-8 text-dex-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-white">500K+</div>
                <div className="text-sm text-dex-text-secondary">Transactions</div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Description */}
          <Card className="bg-black border-dex-secondary/30">
            <CardHeader>
              <CardTitle className="text-white text-xl">Enterprise-Grade DEX Platform</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-dex-text-secondary">
              <p>
                V-DEX represents the next evolution in decentralized exchange technology, combining
                cutting-edge AI analytics with enterprise-grade security and multi-chain capabilities.
                Our platform has successfully implemented Phases 1-4.2, delivering comprehensive
                wallet management, advanced trading interfaces, and cross-chain bridge functionality.
              </p>
              <p>
                Built with a focus on user experience and institutional-grade reliability, V-DEX
                supports trading across 7 major blockchain networks with real-time CoinGecko API
                integration, comprehensive KYC/AML verification, and advanced DeFi features including
                staking and yield farming opportunities.
              </p>
              <div className="flex flex-wrap gap-3 pt-4">
                <Button
                  variant="outline"
                  className="text-white border-dex-secondary/30 min-h-[44px]"
                  onClick={() => openExternalLink('https://preview--echo-digital-swap.lovable.app/trade')}
                >
                  <ExternalLink size={18} className="mr-2" />
                  Launch Platform
                </Button>
                <Button
                  variant="outline"
                  className="text-white border-dex-secondary/30 min-h-[44px]"
                  onClick={() => openExternalLink('https://github.com/techvitta')}
                >
                  <Github size={18} className="mr-2" />
                  GitHub
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          {/* Phase 1-4.2 Achievements */}
          <Card className="bg-black border-dex-secondary/30">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <Target className="h-6 w-6 text-dex-positive" />
                Phase 1-4.2 Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Wallet className="h-5 w-5 text-dex-primary" />
                    <span className="text-white font-medium">Wallet Management</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ArrowUpDown className="h-5 w-5 text-blue-400" />
                    <span className="text-white font-medium">Advanced Trading Interfaces</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                    <span className="text-white font-medium">Portfolio Analytics</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-green-400" />
                    <span className="text-white font-medium">Cross-Chain Bridge</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-dex-positive" />
                    <span className="text-white font-medium">KYC/AML Verification</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-yellow-400" />
                    <span className="text-white font-medium">Enterprise Security</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-dex-primary" />
                    <span className="text-white font-medium">DeFi Staking</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-orange-400" />
                    <span className="text-white font-medium">Real-time API Integration</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Multi-Network Support */}
          <Card className="bg-black border-dex-secondary/30">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <Globe className="h-6 w-6 text-blue-400" />
                Multi-Network Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { name: 'Ethereum', color: '#627EEA' },
                  { name: 'Polygon', color: '#8247E5' },
                  { name: 'BSC', color: '#F3BA2F' },
                  { name: 'Arbitrum', color: '#28A0F0' },
                  { name: 'Optimism', color: '#FF0420' },
                  { name: 'Avalanche', color: '#E84142' },
                  { name: 'Fantom', color: '#1969FF' }
                ].map((network) => (
                  <div key={network.name} className="text-center p-3 rounded-lg bg-dex-secondary/10 border border-dex-secondary/30">
                    <div
                      className="w-8 h-8 rounded-full mx-auto mb-2"
                      style={{ backgroundColor: network.color }}
                    />
                    <div className="text-white text-sm font-medium">{network.name}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          {/* Trading Volume Chart */}
          <Card className="bg-black border-dex-secondary/30">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-dex-primary" />
                Trading Volume Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Plot
                  data={[
                    {
                      x: tradingVolumeData.map(d => d.date),
                      y: tradingVolumeData.map(d => d.volume),
                      type: 'scatter',
                      mode: 'lines+markers',
                      name: 'Volume',
                      line: { color: '#FF3B30', width: 3 },
                      marker: { color: '#FF3B30', size: 6 }
                    }
                  ]}
                  layout={{
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    font: { color: '#FFFFFF', family: 'Inter' },
                    xaxis: {
                      gridcolor: '#2C2C2E',
                      title: 'Date'
                    },
                    yaxis: {
                      gridcolor: '#2C2C2E',
                      title: 'Volume (USD)'
                    },
                    margin: { t: 20, r: 20, b: 40, l: 60 }
                  }}
                  config={{ displayModeBar: false }}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Network Distribution Chart */}
          <Card className="bg-black border-dex-secondary/30">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <Globe className="h-6 w-6 text-blue-400" />
                Network Volume Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Plot
                  data={[
                    {
                      values: networkStatsData.map(d => d.volume),
                      labels: networkStatsData.map(d => d.network),
                      type: 'pie',
                      marker: {
                        colors: networkStatsData.map(d => d.color)
                      },
                      textinfo: 'label+percent',
                      textfont: { color: '#FFFFFF', family: 'Inter' }
                    }
                  ]}
                  layout={{
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    font: { color: '#FFFFFF', family: 'Inter' },
                    margin: { t: 20, r: 20, b: 20, l: 20 },
                    showlegend: false
                  }}
                  config={{ displayModeBar: false }}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Price Analytics Chart */}
          <Card className="bg-black border-dex-secondary/30">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-dex-positive" />
                24h Price Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Plot
                  data={[
                    {
                      x: priceAnalyticsData.map(d => d.hour),
                      y: priceAnalyticsData.map(d => d.eth),
                      type: 'scatter',
                      mode: 'lines',
                      name: 'ETH',
                      line: { color: '#627EEA', width: 2 }
                    },
                    {
                      x: priceAnalyticsData.map(d => d.hour),
                      y: priceAnalyticsData.map(d => d.btc),
                      type: 'scatter',
                      mode: 'lines',
                      name: 'BTC',
                      line: { color: '#F7931A', width: 2 },
                      yaxis: 'y2'
                    }
                  ]}
                  layout={{
                    paper_bgcolor: 'transparent',
                    plot_bgcolor: 'transparent',
                    font: { color: '#FFFFFF', family: 'Inter' },
                    xaxis: {
                      gridcolor: '#2C2C2E',
                      title: 'Hour'
                    },
                    yaxis: {
                      gridcolor: '#2C2C2E',
                      title: 'ETH Price (USD)',
                      side: 'left'
                    },
                    yaxis2: {
                      title: 'BTC Price (USD)',
                      side: 'right',
                      overlaying: 'y'
                    },
                    legend: {
                      x: 0,
                      y: 1,
                      bgcolor: 'rgba(0,0,0,0.5)'
                    },
                    margin: { t: 20, r: 60, b: 40, l: 60 }
                  }}
                  config={{ displayModeBar: false }}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roadmap Tab */}
        <TabsContent value="roadmap" className="space-y-6">
          {/* AI Features Coming Soon */}
          <Card className="bg-gradient-to-br from-dex-primary/10 to-purple-500/10 border-dex-primary/30">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <Brain className="h-6 w-6 text-purple-400" />
                AI Features (Coming Soon)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Cpu className="h-5 w-5 text-purple-400" />
                    <span className="text-white font-medium">AI-Powered Trading Analytics</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Target className="h-5 w-5 text-blue-400" />
                    <span className="text-white font-medium">Smart Portfolio Optimization</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-green-400" />
                    <span className="text-white font-medium">Automated Risk Assessment</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-dex-positive" />
                    <span className="text-white font-medium">ML-Based Price Forecasting</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    <span className="text-white font-medium">AI-Driven Arbitrage Detection</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-dex-primary" />
                    <span className="text-white font-medium">Intelligent Market Predictions</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-dex-secondary/20 rounded-lg border border-dex-secondary/30">
                <p className="text-dex-text-secondary text-sm">
                  Our AI-enhanced features will leverage machine learning algorithms to provide
                  intelligent trading insights, automated portfolio management, and predictive
                  analytics to help users make informed trading decisions.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Development Roadmap */}
          <Card className="bg-black border-dex-secondary/30">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <Target className="h-6 w-6 text-dex-primary" />
                Development Roadmap
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-4 h-4 rounded-full bg-dex-positive mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-medium">Phase 1-4.2 ✅ Completed</h4>
                    <p className="text-dex-text-secondary text-sm">
                      Core platform, wallet management, trading interfaces, cross-chain bridge
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-4 h-4 rounded-full bg-dex-primary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-medium">Phase 5 🚧 In Progress</h4>
                    <p className="text-dex-text-secondary text-sm">
                      AI integration, advanced analytics, machine learning models
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-4 h-4 rounded-full bg-dex-text-secondary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-medium">Phase 6 📋 Planned</h4>
                    <p className="text-dex-text-secondary text-sm">
                      Institutional features, advanced order types, API marketplace
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-4 h-4 rounded-full bg-dex-text-secondary mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-white font-medium">Phase 7 🔮 Future</h4>
                    <p className="text-dex-text-secondary text-sm">
                      Decentralized governance, community features, mobile apps
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer - About TechVitta */}
      <Card className="bg-black border-dex-secondary/30 shadow-lg shadow-dex-secondary/10 mt-8">
        <CardHeader>
          <CardTitle className="text-white text-xl">About TechVitta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-dex-text-secondary">
            <p>
              TechVitta is the parent company of V-DEX, specializing in blockchain technology and
              decentralized finance solutions. Founded with a vision to make cryptocurrency trading
              accessible to everyone, TechVitta has been at the forefront of innovation in the blockchain space.
            </p>
            <p>
              Our mission is to provide secure, transparent, and user-friendly platforms that empower
              individuals to participate in the digital economy.
            </p>
            <div className="flex flex-wrap gap-3 pt-4">
              <Button
                variant="outline"
                className="text-white border-dex-secondary/30 min-h-[44px]"
                onClick={() => openExternalLink('https://www.techvitta.in')}
              >
                <ExternalLink size={18} className="mr-2" />
                Visit TechVitta
              </Button>
              <Button
                variant="outline"
                className="text-white border-dex-secondary/30 min-h-[44px]"
                onClick={() => openExternalLink('https://github.com/techvitta')}
              >
                <Github size={18} className="mr-2" />
                GitHub
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4 pt-2 pb-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-10 w-10"
            onClick={() => openExternalLink('https://twitter.com/techvitta')}
          >
            <Twitter className="text-dex-text-secondary" size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-10 w-10"
            onClick={() => openExternalLink('https://linkedin.com/company/techvitta')}
          >
            <Linkedin className="text-dex-text-secondary" size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full h-10 w-10"
            onClick={() => openExternalLink('https://github.com/techvitta')}
          >
            <Github className="text-dex-text-secondary" size={20} />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AboutPage;
