import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const AMLInformation: React.FC = () => {
  return (
    <Card className="bg-dex-dark/80 border-dex-secondary/30 shadow-lg shadow-dex-secondary/10">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-dex-primary/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-dex-primary" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-3">
              Anti-Money Laundering (AML) Service
            </h3>
            <p className="text-gray-300 mb-4 leading-relaxed">
              By using our AML service, you can check suspicious wallets for illegal activity. 
              This will help you protect your money from scammers and ensure compliance with 
              financial regulations.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4">
              {/* Protection Feature */}
              <div className="flex items-start gap-3 p-3 bg-dex-secondary/10 rounded-lg border border-dex-secondary/20">
                <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">
                    Fraud Protection
                  </h4>
                  <p className="text-xs text-gray-400">
                    Identify addresses associated with scams, phishing, and fraudulent activities
                  </p>
                </div>
              </div>

              {/* Compliance Feature */}
              <div className="flex items-start gap-3 p-3 bg-dex-secondary/10 rounded-lg border border-dex-secondary/20">
                <Shield className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">
                    Regulatory Compliance
                  </h4>
                  <p className="text-xs text-gray-400">
                    Meet AML requirements and maintain compliance with financial regulations
                  </p>
                </div>
              </div>

              {/* Risk Assessment Feature */}
              <div className="flex items-start gap-3 p-3 bg-dex-secondary/10 rounded-lg border border-dex-secondary/20">
                <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">
                    Risk Assessment
                  </h4>
                  <p className="text-xs text-gray-400">
                    Get detailed risk scores and recommendations for each address
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-300">
                    <strong>Supported Networks:</strong> Ethereum, Bitcoin, Polygon, BSC, Arbitrum, Optimism, Avalanche, and Fantom
                  </p>
                  <p className="text-xs text-blue-400 mt-1">
                    Results are based on blockchain analysis, community reports, and regulatory databases
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AMLInformation;
