import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Eye, Lock, Database, Globe, Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const PrivacyPolicyPage = () => {
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
        <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
      </div>

      <Card className="bg-dex-dark/80 border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-3">
            <Shield className="text-dex-primary" size={24} />
            Your Privacy Matters
          </CardTitle>
          <p className="text-dex-text-secondary text-sm">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-dex-text-secondary text-sm leading-relaxed">
            <p className="mb-4">
              At DEX Mobile, we are committed to protecting your privacy and ensuring the security of your personal information. 
              This Privacy Policy explains how we collect, use, and safeguard your data when you use our cryptocurrency trading platform.
            </p>
          </div>

          <Separator className="bg-dex-secondary/30" />

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Database className="text-dex-primary mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="text-white font-semibold mb-2">Information We Collect</h3>
                <ul className="text-dex-text-secondary text-sm space-y-2 list-disc list-inside ml-4">
                  <li>Personal identification information (name, email, phone number)</li>
                  <li>Identity verification documents for KYC compliance</li>
                  <li>Wallet addresses and transaction history</li>
                  <li>Device information and usage analytics</li>
                  <li>Location data for regulatory compliance</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Eye className="text-dex-primary mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="text-white font-semibold mb-2">How We Use Your Information</h3>
                <ul className="text-dex-text-secondary text-sm space-y-2 list-disc list-inside ml-4">
                  <li>To provide and maintain our trading services</li>
                  <li>To verify your identity and comply with regulations</li>
                  <li>To process transactions and prevent fraud</li>
                  <li>To send important notifications about your account</li>
                  <li>To improve our services and user experience</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Lock className="text-dex-primary mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="text-white font-semibold mb-2">Data Security</h3>
                <div className="text-dex-text-secondary text-sm space-y-2">
                  <p>We implement industry-standard security measures to protect your data:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>End-to-end encryption for sensitive data</li>
                    <li>Secure cloud storage with access controls</li>
                    <li>Regular security audits and monitoring</li>
                    <li>Multi-factor authentication requirements</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Globe className="text-dex-primary mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="text-white font-semibold mb-2">International Transfers</h3>
                <p className="text-dex-text-secondary text-sm">
                  Your data may be transferred to and processed in countries other than your own. 
                  We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="text-dex-primary mt-1 flex-shrink-0" size={20} />
              <div>
                <h3 className="text-white font-semibold mb-2">Your Rights</h3>
                <div className="text-dex-text-secondary text-sm space-y-2">
                  <p>Under GDPR and other privacy laws, you have the right to:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Access your personal data</li>
                    <li>Correct inaccurate information</li>
                    <li>Request deletion of your data</li>
                    <li>Object to data processing</li>
                    <li>Data portability</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <Separator className="bg-dex-secondary/30" />

          <div className="space-y-4">
            <h3 className="text-white font-semibold">Cryptocurrency-Specific Considerations</h3>
            <div className="text-dex-text-secondary text-sm space-y-3">
              <p>
                <strong className="text-white">Blockchain Transparency:</strong> Cryptocurrency transactions are recorded on public blockchains. 
                While wallet addresses may be pseudonymous, transaction history is publicly visible.
              </p>
              <p>
                <strong className="text-white">Regulatory Compliance:</strong> We may be required to share information with regulatory authorities 
                for anti-money laundering (AML) and know-your-customer (KYC) compliance.
              </p>
              <p>
                <strong className="text-white">Third-Party Services:</strong> We integrate with blockchain networks and may use third-party 
                services for wallet connectivity, which have their own privacy policies.
              </p>
            </div>
          </div>

          <Separator className="bg-dex-secondary/30" />

          <div className="space-y-4">
            <h3 className="text-white font-semibold">Contact Information</h3>
            <div className="text-dex-text-secondary text-sm space-y-2">
              <p>
                If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:
              </p>
              <div className="bg-dex-secondary/10 p-4 rounded-lg">
                <p><strong className="text-white">Email:</strong> privacy@dexmobile.com</p>
                <p><strong className="text-white">Address:</strong> TechVitta Solutions, India</p>
                <p><strong className="text-white">Website:</strong> https://www.techvitta.in</p>
              </div>
            </div>
          </div>

          <div className="bg-dex-primary/10 border border-dex-primary/30 p-4 rounded-lg">
            <p className="text-dex-text-secondary text-xs">
              This Privacy Policy may be updated periodically. We will notify you of any material changes through the app or via email. 
              Your continued use of DEX Mobile after such modifications constitutes acceptance of the updated Privacy Policy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicyPage;
