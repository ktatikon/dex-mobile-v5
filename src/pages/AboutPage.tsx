import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, Github, Twitter, Linkedin } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const AboutPage = () => {
  const navigate = useNavigate();

  const openExternalLink = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="container mx-auto px-4 pt-6 pb-24">
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
        <h1 className="text-2xl font-bold text-white">About</h1>
      </div>

      {/* App Info */}
      <Card className="bg-black border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-dex-primary flex items-center justify-center">
                <span className="text-white font-bold text-xl">V</span>
              </div>
              <div>
                <CardTitle className="text-white text-xl">V-DEX</CardTitle>
                <CardDescription className="text-dex-text-secondary">
                  Version 1.0.0
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-dex-text-secondary mb-4">
            V-DEX is a cutting-edge decentralized exchange platform developed by TechVitta, 
            designed to provide secure, fast, and user-friendly cryptocurrency trading experiences.
          </p>
          <div className="flex flex-wrap gap-3">
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
        </CardContent>
      </Card>

      {/* Blockchain Technology */}
      <Card className="bg-black border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white text-xl">Blockchain Technology</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-dex-text-secondary">
            <p>
              Blockchain technology is a distributed, decentralized ledger that records transactions across multiple computers. 
              This ensures that the record cannot be altered retroactively without the alteration of all subsequent blocks.
            </p>
            <p>
              Key features of blockchain technology include:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="text-white font-medium">Decentralization:</span> No single entity has control over the entire network, making it resistant to censorship and single points of failure.
              </li>
              <li>
                <span className="text-white font-medium">Transparency:</span> All transactions are visible to anyone on the network, creating an unprecedented level of accountability.
              </li>
              <li>
                <span className="text-white font-medium">Immutability:</span> Once data is recorded on the blockchain, it cannot be altered or deleted, ensuring data integrity.
              </li>
              <li>
                <span className="text-white font-medium">Security:</span> Cryptographic techniques secure transactions and control the creation of new units, making blockchain highly secure against fraud and hacking attempts.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Crypto Trading */}
      <Card className="bg-black border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white text-xl">Cryptocurrency Trading</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-dex-text-secondary">
            <p>
              Cryptocurrency trading involves buying, selling, and exchanging digital currencies on specialized platforms. 
              Unlike traditional markets, crypto markets operate 24/7, offering unique opportunities and challenges.
            </p>
            <p>
              Important aspects of crypto trading include:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <span className="text-white font-medium">Market Volatility:</span> Cryptocurrency prices can experience significant fluctuations in short periods, creating both risks and opportunities for traders.
              </li>
              <li>
                <span className="text-white font-medium">Trading Pairs:</span> Cryptocurrencies are typically traded against other cryptocurrencies (like BTC/ETH) or against stablecoins (like BTC/USDT).
              </li>
              <li>
                <span className="text-white font-medium">Order Types:</span> Traders can use various order types including market orders, limit orders, and stop orders to execute their trading strategies.
              </li>
              <li>
                <span className="text-white font-medium">Technical Analysis:</span> Many traders use chart patterns, indicators, and other technical tools to analyze price movements and make trading decisions.
              </li>
              <li>
                <span className="text-white font-medium">Risk Management:</span> Successful traders implement risk management strategies such as position sizing and setting stop-loss orders to protect their capital.
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* About TechVitta */}
      <Card className="bg-black border-dex-secondary/30 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white text-xl">About TechVitta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-dex-text-secondary">
            <p>
              TechVitta is the parent company of V-DEX, specializing in blockchain technology and decentralized finance solutions. 
              Founded with a vision to make cryptocurrency trading accessible to everyone, TechVitta has been at the forefront of innovation in the blockchain space.
            </p>
            <p>
              Our mission is to provide secure, transparent, and user-friendly platforms that empower individuals to participate in the digital economy.
            </p>
            <div className="pt-4">
              <Button
                variant="primary"
                className="w-full font-medium text-base min-h-[44px]"
                onClick={() => openExternalLink('https://www.techvitta.in')}
              >
                <ExternalLink size={18} className="mr-2" />
                Visit TechVitta Website
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
