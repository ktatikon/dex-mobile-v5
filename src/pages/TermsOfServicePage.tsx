import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, AlertTriangle, Scale, Shield, Coins, Users } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const TermsOfServicePage = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 min-h-[44px] min-w-[44px]"
          onClick={() => navigate('/settings')}
          aria-label="Back to Settings"
        >
          <ArrowLeft className="text-white" size={26} />
        </Button>
        <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
      </div>

      <Card className="bg-dex-dark/80 border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <FileText className="text-dex-primary" size={24} />
            Terms & Conditions
          </CardTitle>
          <p className="text-dex-text-secondary text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-dex-text-secondary text-sm leading-relaxed">
            <p className="mb-4">
              Welcome to DEX Mobile. These Terms of Service ("Terms") govern your use of our cryptocurrency trading platform. 
              By accessing or using our services, you agree to be bound by these Terms.
            </p>
          </div>

          <div className="bg-dex-primary/10 border border-dex-primary/30 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-dex-primary mt-1 flex-shrink-0" size={20} />
              <div>
                <h4 className="text-white font-semibold mb-2">Important Notice</h4>
                <p className="text-dex-text-secondary text-sm">
                  Cryptocurrency trading involves substantial risk of loss. Only trade with funds you can afford to lose. 
                  Past performance does not guarantee future results.
                </p>
              </div>
            </div>
          </div>

          <Separator className="bg-dex-secondary/30" />

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Users className="text-dex-primary mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="text-white font-semibold mb-2">Eligibility</h3>
                <ul className="text-dex-text-secondary text-sm space-y-2 list-disc list-inside ml-4">
                  <li>You must be at least 18 years old</li>
                  <li>You must have legal capacity to enter into contracts</li>
                  <li>You must not be located in a restricted jurisdiction</li>
                  <li>You must comply with all applicable laws and regulations</li>
                  <li>You must complete identity verification (KYC) when required</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Coins className="text-dex-primary mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="text-white font-semibold mb-2">Trading Services</h3>
                <div className="text-dex-text-secondary text-sm space-y-2">
                  <p>Our platform provides access to cryptocurrency trading services including:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Spot trading of digital assets</li>
                    <li>Wallet management and storage</li>
                    <li>Market data and analytics</li>
                    <li>Portfolio tracking and management</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Scale className="text-dex-primary mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="text-white font-semibold mb-2">User Responsibilities</h3>
                <ul className="text-dex-text-secondary text-sm space-y-2 list-disc list-inside ml-4">
                  <li>Maintain the security of your account credentials</li>
                  <li>Provide accurate and up-to-date information</li>
                  <li>Comply with all applicable laws and regulations</li>
                  <li>Not engage in market manipulation or fraudulent activities</li>
                  <li>Report suspicious activities or security breaches</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="text-dex-primary mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="text-white font-semibold mb-2">Prohibited Activities</h3>
                <div className="text-dex-text-secondary text-sm space-y-2">
                  <p>You agree not to:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Use the platform for illegal activities</li>
                    <li>Attempt to manipulate market prices</li>
                    <li>Create multiple accounts to circumvent limits</li>
                    <li>Reverse engineer or hack our systems</li>
                    <li>Violate intellectual property rights</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-dex-secondary/30" />

          <div className="space-y-4">
            <h3 className="text-white font-semibold">Fees and Charges</h3>
            <div className="text-dex-text-secondary text-sm space-y-3">
              <p>
                <strong className="text-white">Trading Fees:</strong> We charge competitive trading fees based on your trading volume. 
                Current fee schedules are available in the app and may be updated with notice.
              </p>
              <p>
                <strong className="text-white">Network Fees:</strong> Blockchain network fees for deposits and withdrawals are 
                determined by the respective networks and are subject to change.
              </p>
              <p>
                <strong className="text-white">Additional Charges:</strong> Additional fees may apply for premium features, 
                expedited services, or regulatory compliance requirements.
              </p>
            </div>
          </div>

          <Separator className="bg-dex-secondary/30" />

          <div className="space-y-4">
            <h3 className="text-white font-semibold">Risk Disclosure</h3>
            <div className="text-dex-text-secondary text-sm space-y-3">
              <p>
                <strong className="text-white">Market Risk:</strong> Cryptocurrency prices are highly volatile and can result in significant losses.
              </p>
              <p>
                <strong className="text-white">Technology Risk:</strong> Blockchain technology and smart contracts may contain bugs or vulnerabilities.
              </p>
              <p>
                <strong className="text-white">Regulatory Risk:</strong> Cryptocurrency regulations may change and affect the availability of services.
              </p>
              <p>
                <strong className="text-white">Liquidity Risk:</strong> Some assets may have limited liquidity, affecting your ability to trade.
              </p>
            </div>
          </div>

          <Separator className="bg-dex-secondary/30" />

          <div className="space-y-4">
            <h3 className="text-white font-semibold">Limitation of Liability</h3>
            <div className="text-dex-text-secondary text-sm space-y-2">
              <p>
                To the maximum extent permitted by law, DEX Mobile and its affiliates shall not be liable for any indirect, 
                incidental, special, or consequential damages arising from your use of our services.
              </p>
              <p>
                Our total liability shall not exceed the amount of fees paid by you in the 12 months preceding the claim.
              </p>
            </div>
          </div>

          <Separator className="bg-dex-secondary/30" />

          <div className="space-y-4">
            <h3 className="text-white font-semibold">Termination</h3>
            <div className="text-dex-text-secondary text-sm space-y-2">
              <p>
                We may suspend or terminate your account at any time for violation of these Terms, suspicious activity, 
                or as required by law. You may close your account at any time by contacting support.
              </p>
            </div>
          </div>

          <Separator className="bg-dex-secondary/30" />

          <div className="space-y-4">
            <h3 className="text-white font-semibold">Contact Information</h3>
            <div className="text-dex-text-secondary text-sm space-y-2">
              <p>
                For questions about these Terms or our services, please contact us:
              </p>
              <div className="bg-dex-secondary/10 p-4 rounded-lg">
                <p><strong className="text-white">Email:</strong> legal@dexmobile.com</p>
                <p><strong className="text-white">Support:</strong> support@dexmobile.com</p>
                <p><strong className="text-white">Company:</strong> TechVitta Solutions</p>
                <p><strong className="text-white">Website:</strong> https://www.techvitta.in</p>
              </div>
            </div>
          </div>

          <div className="bg-dex-primary/10 border border-dex-primary/30 p-4 rounded-lg">
            <p className="text-dex-text-secondary text-xs">
              These Terms may be updated periodically. Material changes will be communicated through the app or via email. 
              Your continued use of DEX Mobile after such modifications constitutes acceptance of the updated Terms.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TermsOfServicePage;
