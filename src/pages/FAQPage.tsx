import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ChevronDown, ChevronUp, Search } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';

const FAQPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');

  const faqCategories = [
    {
      title: "Getting Started",
      items: [
        {
          question: "How do I create an account?",
          answer: "To create an account, click on the 'Sign Up' button on the login screen. Fill in your email address, create a password, and provide the required personal information. Verify your email address by clicking the link sent to your inbox, and you're ready to go!"
        },
        {
          question: "Is KYC verification required?",
          answer: "Yes, KYC (Know Your Customer) verification is required to comply with financial regulations and to protect our platform from fraudulent activities. You can complete the KYC process by navigating to Settings > KYC Verification and following the instructions."
        },
        {
          question: "How long does KYC verification take?",
          answer: "KYC verification typically takes 1-3 business days. Once your documents are submitted, our team will review them and update your verification status. You'll receive a notification when the process is complete."
        }
      ]
    },
    {
      title: "Trading & Wallet",
      items: [
        {
          question: "How do I deposit funds?",
          answer: "To deposit funds, navigate to the Wallet section and click on 'Deposit'. Select your preferred cryptocurrency, and you'll be provided with a wallet address. Send your funds to this address. Depending on the blockchain network, it may take a few minutes to a few hours for your deposit to be confirmed."
        },
        {
          question: "What trading pairs are available?",
          answer: "We offer a wide range of trading pairs including BTC/USDT, ETH/USDT, BTC/ETH, and many more. You can view all available trading pairs in the Market section of the app."
        },
        {
          question: "How are trading fees calculated?",
          answer: "Trading fees are calculated as a percentage of your trade value. Our standard fee is 0.1% for makers and 0.2% for takers. VIP users and high-volume traders may qualify for reduced fees. You can view the complete fee schedule in the 'Fees' section."
        },
        {
          question: "What is the minimum withdrawal amount?",
          answer: "Minimum withdrawal amounts vary by cryptocurrency. For example, the minimum withdrawal for BTC is 0.001 BTC, and for ETH it's 0.01 ETH. These minimums are in place to ensure that withdrawal fees don't exceed the withdrawal amount."
        }
      ]
    },
    {
      title: "Security",
      items: [
        {
          question: "How secure is my account?",
          answer: "We implement industry-leading security measures including encryption, two-factor authentication, and regular security audits. Your funds are stored in cold wallets, which are offline and not accessible via the internet, providing maximum security against hacking attempts."
        },
        {
          question: "What should I do if I suspect unauthorized access?",
          answer: "If you suspect unauthorized access to your account, immediately change your password, enable two-factor authentication if not already enabled, and contact our support team. We recommend reviewing your account activity and ensuring your email account is also secure."
        },
        {
          question: "How can I enable two-factor authentication?",
          answer: "To enable two-factor authentication, go to Settings > Security and toggle on the 'Two-Factor Authentication' option. Follow the instructions to set up an authenticator app on your mobile device. This adds an extra layer of security to your account."
        }
      ]
    },
    {
      title: "Technical Issues",
      items: [
        {
          question: "What should I do if the app is not working?",
          answer: "If you're experiencing issues with the app, try the following troubleshooting steps: 1) Restart the app, 2) Check your internet connection, 3) Clear the app cache, 4) Update to the latest version, 5) Restart your device. If the problem persists, please contact our support team."
        },
        {
          question: "Why is my transaction pending?",
          answer: "Transactions may remain in a pending state due to network congestion, insufficient gas fees (for Ethereum-based transactions), or verification requirements. Most pending transactions will eventually complete, but if a transaction has been pending for an unusually long time, please contact support."
        }
      ]
    }
  ];

  // Filter FAQ items based on search query
  const filteredFAQs = searchQuery.trim() === '' 
    ? faqCategories 
    : faqCategories.map(category => ({
        ...category,
        items: category.items.filter(item => 
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
          item.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.items.length > 0);

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
        <h1 className="text-2xl font-bold text-white">FAQ</h1>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dex-text-secondary" size={18} />
        <Input
          type="text"
          placeholder="Search FAQ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-dex-dark border-dex-secondary/30 text-white pl-10 min-h-[44px] rounded-lg"
        />
      </div>

      {filteredFAQs.length === 0 ? (
        <Card className="bg-black border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
          <CardContent className="p-8 text-center">
            <p className="text-dex-text-secondary text-lg">No results found for "{searchQuery}"</p>
            <p className="text-dex-text-secondary mt-2">Try a different search term or browse the categories below.</p>
          </CardContent>
        </Card>
      ) : (
        filteredFAQs.map((category, index) => (
          <Card key={index} className="bg-black border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
            <CardHeader>
              <CardTitle className="text-white text-xl">{category.title}</CardTitle>
              {searchQuery.trim() !== '' && (
                <CardDescription className="text-dex-text-secondary text-base">
                  {category.items.length} result{category.items.length !== 1 ? 's' : ''}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {category.items.map((item, itemIndex) => (
                  <AccordionItem 
                    key={itemIndex} 
                    value={`item-${index}-${itemIndex}`}
                    className="border-b border-dex-secondary/20 last:border-0"
                  >
                    <AccordionTrigger className="text-white font-medium py-4 hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-dex-text-secondary pb-4">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ))
      )}

      {/* Contact Support */}
      <Card className="bg-black border-dex-secondary/30 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white text-xl">Still Have Questions?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-dex-text-secondary mb-4">
            If you couldn't find the answer you were looking for, our support team is here to help.
          </p>
          <Button
            variant="primary"
            className="w-full font-medium text-base min-h-[44px]"
            onClick={() => navigate('/contact')}
          >
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FAQPage;
