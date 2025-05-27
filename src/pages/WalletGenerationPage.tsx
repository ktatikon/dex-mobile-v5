import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  Download,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
  Shield,
  Wallet,
  AlertTriangle,
  Check,
} from 'lucide-react';
import {
  generateMnemonic,
  validateMnemonic,
  generateAddressesFromMnemonic,
  encryptSeedPhrase,
  saveGeneratedWallet
} from '@/services/walletGenerationService';

// Define the steps in the wallet generation process
enum GenerationStep {
  INTRO = 'intro',
  CREATE_OR_IMPORT = 'create_or_import',
  GENERATE_SEED = 'generate_seed',
  VERIFY_SEED = 'verify_seed',
  SET_PASSWORD = 'set_password',
  IMPORT_SEED = 'import_seed',
  COMPLETE = 'complete'
}

const WalletGenerationPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // State variables
  const [currentStep, setCurrentStep] = useState<GenerationStep>(GenerationStep.INTRO);
  const [seedPhraseLength, setSeedPhraseLength] = useState<'12' | '24'>('12');
  const [seedPhrase, setSeedPhrase] = useState<string>('');
  const [showSeedPhrase, setShowSeedPhrase] = useState<boolean>(false);
  const [verificationWords, setVerificationWords] = useState<{index: number, word: string}[]>([]);
  const [verificationInputs, setVerificationInputs] = useState<{[key: number]: string}>({});
  const [walletName, setWalletName] = useState<string>('My Wallet');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [importedSeedPhrase, setImportedSeedPhrase] = useState<string>('');
  const [generatedAddresses, setGeneratedAddresses] = useState<{[key: string]: string}>({});
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);



  // Effect to ensure seed phrase is generated when entering the GENERATE_SEED step
  useEffect(() => {
    if (currentStep === GenerationStep.GENERATE_SEED && !seedPhrase) {
      console.log('GENERATE_SEED step detected with empty seed phrase, generating new one');
      handleGenerateSeedPhrase();
    }
  }, [currentStep, seedPhrase]);

  // Recursive function to ensure state updates are processed correctly
  const ensureStateUpdated = (
    newSeedPhrase: string,
    maxAttempts = 5,
    currentAttempt = 0,
    delay = 50
  ) => {
    console.log(`Attempt ${currentAttempt + 1} to update state with seed phrase:`, newSeedPhrase);

    // Set the seed phrase
    setSeedPhrase(newSeedPhrase);

    // Check if we need to retry
    if (currentAttempt < maxAttempts) {
      setTimeout(() => {
        // If seed phrase is still not set, try again recursively
        if (!seedPhrase) {
          console.log(`Seed phrase not set yet, retrying (attempt ${currentAttempt + 1}/${maxAttempts})`);
          ensureStateUpdated(newSeedPhrase, maxAttempts, currentAttempt + 1, delay);
        } else {
          console.log('Seed phrase successfully set, proceeding to next step');
          setCurrentStep(GenerationStep.GENERATE_SEED);
        }
      }, delay);
    } else {
      // Final attempt, force the step change regardless
      console.log('Max attempts reached, forcing step change');
      setCurrentStep(GenerationStep.GENERATE_SEED);
    }
  };

  // Generate a new seed phrase
  const handleGenerateSeedPhrase = () => {
    console.log('Generating seed phrase...');
    try {
      const strength = seedPhraseLength === '24' ? 256 : 128;
      // Explicitly cast strength to the expected type
      const typedStrength = strength as 128 | 256;
      const newSeedPhrase = generateMnemonic(typedStrength);

      if (!newSeedPhrase || newSeedPhrase.trim() === '') {
        throw new Error('Generated seed phrase is empty or invalid');
      }

      console.log('Seed phrase generated successfully, length:', newSeedPhrase.split(' ').length);
      setSeedPhrase(newSeedPhrase);
    } catch (error) {
      console.error('Error in handleGenerateSeedPhrase:', error);
      toast({
        title: 'Error Generating Seed Phrase',
        description: `Failed to generate seed phrase: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  // Set up verification words
  const setupVerification = () => {
    if (!seedPhrase) return;

    const words = seedPhrase.split(' ');
    // Select 3 random words for verification
    const indices: number[] = [];
    while (indices.length < 3) {
      const randomIndex = Math.floor(Math.random() * words.length);
      if (!indices.includes(randomIndex)) {
        indices.push(randomIndex);
      }
    }

    const verificationWords = indices.map(index => ({
      index,
      word: words[index]
    }));

    setVerificationWords(verificationWords);
    setVerificationInputs({});
  };

  // Verify the seed phrase
  const verifySeedPhrase = () => {
    setIsVerifying(true);

    let isValid = true;

    for (const { index, word } of verificationWords) {
      if (verificationInputs[index]?.toLowerCase() !== word.toLowerCase()) {
        isValid = false;
        break;
      }
    }

    if (isValid) {
      setCurrentStep(GenerationStep.SET_PASSWORD);
    } else {
      toast({
        title: 'Verification Failed',
        description: 'The words you entered do not match your seed phrase. Please try again.',
        variant: 'destructive',
      });
    }

    setIsVerifying(false);
  };

  // Validate and import a seed phrase
  const validateAndImportSeedPhrase = () => {
    if (!importedSeedPhrase) {
      toast({
        title: 'Empty Seed Phrase',
        description: 'Please enter a seed phrase.',
        variant: 'destructive',
      });
      return;
    }

    const isValid = validateMnemonic(importedSeedPhrase);

    if (isValid) {
      setSeedPhrase(importedSeedPhrase);
      setCurrentStep(GenerationStep.SET_PASSWORD);
    } else {
      toast({
        title: 'Invalid Seed Phrase',
        description: 'The seed phrase you entered is not valid. Please check and try again.',
        variant: 'destructive',
      });
    }
  };

  // Generate wallet addresses from the seed phrase
  const generateWalletAddresses = async () => {
    console.log('Starting wallet address generation...');
    setIsGenerating(true);

    try {
      console.log('Calling generateAddressesFromMnemonic with seed phrase length:', seedPhrase.split(' ').length);
      const addresses = await generateAddressesFromMnemonic(seedPhrase);
      console.log('Address generation successful:', addresses);
      setGeneratedAddresses(addresses);
      return addresses;
    } catch (error) {
      console.error('Error generating addresses:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Address Generation Error',
        description: `Failed to generate wallet addresses: ${errorMessage}. Please try again.`,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  // Save the generated wallet
  const saveWallet = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to save your wallet.',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Password Mismatch',
        description: 'Passwords do not match. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      // Generate addresses if not already generated
      const addresses = Object.keys(generatedAddresses).length > 0
        ? generatedAddresses
        : await generateWalletAddresses();

      if (!addresses) {
        throw new Error('Failed to generate addresses');
      }

      // Encrypt the seed phrase
      const encryptedSeedPhrase = encryptSeedPhrase(seedPhrase, password);

      // Save the wallet to Supabase
      console.log('Attempting to save wallet with data:', {
        userId: user.id,
        walletName,
        addressesCount: Object.keys(addresses).length
      });

      const wallet = await saveGeneratedWallet(
        user.id,
        walletName,
        encryptedSeedPhrase,
        addresses
      );

      console.log('Wallet save result:', wallet);

      if (wallet) {
        toast({
          title: 'Wallet Created',
          description: 'Your wallet has been created successfully.',
        });
        setCurrentStep(GenerationStep.COMPLETE);
      } else {
        throw new Error('Failed to save wallet - no wallet returned');
      }
    } catch (error) {
      console.error('Error saving wallet:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: 'Save Error',
        description: `Failed to save your wallet: ${errorMessage}. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle next step
  const handleNext = () => {
    switch (currentStep) {
      case GenerationStep.INTRO:
        setCurrentStep(GenerationStep.CREATE_OR_IMPORT);
        break;
      case GenerationStep.CREATE_OR_IMPORT:
        // This step has its own navigation buttons
        break;
      case GenerationStep.GENERATE_SEED:
        setupVerification();
        setCurrentStep(GenerationStep.VERIFY_SEED);
        break;
      case GenerationStep.VERIFY_SEED:
        verifySeedPhrase();
        break;
      case GenerationStep.IMPORT_SEED:
        validateAndImportSeedPhrase();
        break;
      case GenerationStep.SET_PASSWORD:
        saveWallet();
        break;
      case GenerationStep.COMPLETE:
        // Navigate to wallet dashboard and refresh to show the new wallet
        navigate('/wallet-dashboard', { replace: true });
        // Force a page refresh to ensure the new wallet is loaded
        window.location.reload();
        break;
    }
  };

  // Handle creating a new wallet
  const handleCreateNewWallet = () => {
    console.log('handleCreateNewWallet called');

    try {
      // Generate the seed phrase directly
      const strength = seedPhraseLength === '24' ? 256 : 128;
      console.log('Generating seed phrase with strength:', strength);

      // Explicitly cast strength to the expected type
      const typedStrength = strength as 128 | 256;
      const newSeedPhrase = generateMnemonic(typedStrength);

      if (!newSeedPhrase || newSeedPhrase.trim() === '') {
        throw new Error('Generated seed phrase is empty or invalid');
      }

      console.log('Seed phrase generated successfully, length:', newSeedPhrase.split(' ').length);

      // Set the seed phrase first
      setSeedPhrase(newSeedPhrase);

      // Use a timeout to ensure the state update has time to process
      setTimeout(() => {
        console.log('Setting current step to GENERATE_SEED');
        setCurrentStep(GenerationStep.GENERATE_SEED);
      }, 100);
    } catch (error) {
      console.error('Error in handleCreateNewWallet:', error);
      toast({
        title: 'Error Creating Wallet',
        description: `Failed to generate seed phrase: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        variant: 'destructive',
      });
    }
  };

  // Handle back step
  const handleBack = () => {
    switch (currentStep) {
      case GenerationStep.INTRO:
        navigate('/wallet-dashboard');
        break;
      case GenerationStep.CREATE_OR_IMPORT:
        setCurrentStep(GenerationStep.INTRO);
        break;
      case GenerationStep.GENERATE_SEED:
        setCurrentStep(GenerationStep.CREATE_OR_IMPORT);
        break;
      case GenerationStep.VERIFY_SEED:
        setCurrentStep(GenerationStep.GENERATE_SEED);
        break;
      case GenerationStep.IMPORT_SEED:
        setCurrentStep(GenerationStep.CREATE_OR_IMPORT);
        break;
      case GenerationStep.SET_PASSWORD:
        if (importedSeedPhrase) {
          setCurrentStep(GenerationStep.IMPORT_SEED);
        } else {
          setCurrentStep(GenerationStep.VERIFY_SEED);
        }
        break;
      case GenerationStep.COMPLETE:
        // No back from complete
        break;
    }
  };

  // Copy seed phrase to clipboard
  const handleCopySeedPhrase = () => {
    navigator.clipboard.writeText(seedPhrase);
    toast({
      title: 'Copied',
      description: 'Seed phrase copied to clipboard',
    });
  };

  // Download seed phrase as a text file
  const handleDownloadSeedPhrase = () => {
    const element = document.createElement('a');
    const file = new Blob([
      'IMPORTANT: Keep this seed phrase secret and safe.\n\n' +
      'Seed Phrase:\n' +
      seedPhrase + '\n\n' +
      'Date: ' + new Date().toLocaleString() + '\n\n' +
      'WARNING: Anyone with access to this seed phrase can access your funds.'
    ], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'seed-phrase-backup.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Render the current step
  const renderStep = () => {
    switch (currentStep) {
      case GenerationStep.INTRO:
        return renderIntroStep();
      case GenerationStep.CREATE_OR_IMPORT:
        return renderCreateOrImportStep();
      case GenerationStep.GENERATE_SEED:
        return renderGenerateSeedStep();
      case GenerationStep.VERIFY_SEED:
        return renderVerifySeedStep();
      case GenerationStep.IMPORT_SEED:
        return renderImportSeedStep();
      case GenerationStep.SET_PASSWORD:
        return renderSetPasswordStep();
      case GenerationStep.COMPLETE:
        return renderCompleteStep();
      default:
        return renderIntroStep();
    }
  };

  // Render the intro step
  const renderIntroStep = () => (
    <div className="space-y-4">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-dex-primary/20 flex items-center justify-center">
          <Wallet className="h-8 w-8 text-dex-primary" />
        </div>
      </div>

      <h2 className="text-xl font-bold text-white text-center">Create a New Wallet</h2>
      <p className="text-gray-400 text-center">
        Generate a new cryptocurrency wallet or import an existing one using a seed phrase.
      </p>

      <div className="bg-dex-secondary/10 rounded-lg p-4 border border-dex-secondary/20 mt-4">
        <div className="flex items-start gap-3">
          <Shield className="text-dex-primary min-w-[20px] mt-1" size={20} />
          <div>
            <h3 className="text-white font-medium mb-1">Security First</h3>
            <p className="text-sm text-gray-400">
              Your seed phrase is the master key to your wallet. Never share it with anyone and keep it in a safe place.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render the create or import step
  const renderCreateOrImportStep = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white text-center">Choose an Option</h2>
      <p className="text-gray-400 text-center mb-6">
        Create a new wallet or import an existing one.
      </p>

      <div className="grid gap-4">
        <Button
          variant="outline"
          className="h-auto py-6 border-dex-secondary/30 hover:bg-dex-secondary/20"
          onClick={handleCreateNewWallet}
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-dex-primary/20 flex items-center justify-center mb-2">
              <Wallet className="h-6 w-6 text-dex-primary" />
            </div>
            <h3 className="text-white font-medium mb-1">Create New Wallet</h3>
            <p className="text-sm text-gray-400">
              Generate a new seed phrase and create a wallet from scratch.
            </p>
          </div>
        </Button>

        <Button
          variant="outline"
          className="h-auto py-6 border-dex-secondary/30 hover:bg-dex-secondary/20"
          onClick={() => setCurrentStep(GenerationStep.IMPORT_SEED)}
        >
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full bg-dex-primary/20 flex items-center justify-center mb-2">
              <Download className="h-6 w-6 text-dex-primary" />
            </div>
            <h3 className="text-white font-medium mb-1">Import Existing Wallet</h3>
            <p className="text-sm text-gray-400">
              Restore your wallet using an existing seed phrase.
            </p>
          </div>
        </Button>
      </div>
    </div>
  );

  // Render the generate seed step
  const renderGenerateSeedStep = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white text-center">Your Seed Phrase</h2>
      <p className="text-gray-400 text-center">
        This is your wallet's seed phrase. Write it down and keep it in a safe place.
      </p>

      <div className="flex justify-end mb-2">
        <Select
          value={seedPhraseLength}
          onValueChange={(value) => {
            setSeedPhraseLength(value as '12' | '24');
            setSeedPhrase('');
          }}
        >
          <SelectTrigger className="w-[120px] bg-dex-dark border-dex-secondary/30 text-white">
            <SelectValue placeholder="Word count" />
          </SelectTrigger>
          <SelectContent className="bg-dex-tertiary border-dex-secondary/30 text-white">
            <SelectItem value="12">12 words</SelectItem>
            <SelectItem value="24">24 words</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="relative">
        <div
          className={`bg-dex-dark border border-dex-secondary/30 rounded-lg p-4 ${
            !showSeedPhrase ? 'filter blur-sm' : ''
          }`}
        >
          <div className="grid grid-cols-3 gap-2">
            {seedPhrase.split(' ').map((word, index) => (
              <div key={index} className="flex items-center">
                <span className="text-gray-400 mr-2 w-6 text-right">{index + 1}.</span>
                <span className="text-white font-mono">{word}</span>
              </div>
            ))}
          </div>
        </div>

        {!showSeedPhrase && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Button
              variant="outline"
              className="border-dex-secondary/30"
              onClick={() => setShowSeedPhrase(true)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Show Seed Phrase
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          className="flex-1 border-dex-secondary/30"
          onClick={handleGenerateSeedPhrase}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Regenerate
        </Button>
        <Button
          variant="outline"
          className="flex-1 border-dex-secondary/30"
          onClick={handleCopySeedPhrase}
        >
          <Copy className="mr-2 h-4 w-4" />
          Copy
        </Button>
        <Button
          variant="outline"
          className="flex-1 border-dex-secondary/30"
          onClick={handleDownloadSeedPhrase}
        >
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </div>

      <div className="bg-dex-negative/10 rounded-lg p-4 border border-dex-negative/20 mt-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-dex-negative min-w-[20px] mt-1" size={20} />
          <div>
            <h3 className="text-white font-medium mb-1">Important Warning</h3>
            <p className="text-sm text-gray-400">
              Never share your seed phrase with anyone. Anyone with access to your seed phrase can control your funds.
              Make sure to store it in a secure location.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render the verify seed step
  const renderVerifySeedStep = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white text-center">Verify Your Seed Phrase</h2>
      <p className="text-gray-400 text-center">
        To ensure you've saved your seed phrase correctly, please enter the following words.
      </p>

      <div className="space-y-4 mt-6">
        {verificationWords.map(({ index }) => (
          <div key={index} className="space-y-2">
            <Label htmlFor={`word-${index}`} className="text-white">
              Word #{index + 1}
            </Label>
            <Input
              id={`word-${index}`}
              value={verificationInputs[index] || ''}
              onChange={(e) => setVerificationInputs({
                ...verificationInputs,
                [index]: e.target.value
              })}
              className="bg-dex-dark border-dex-secondary/30 text-white"
              placeholder={`Enter word #${index + 1}`}
            />
          </div>
        ))}
      </div>
    </div>
  );

  // Render the import seed step
  const renderImportSeedStep = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white text-center">Import Wallet</h2>
      <p className="text-gray-400 text-center">
        Enter your 12 or 24-word seed phrase to import your existing wallet.
      </p>

      <div className="space-y-2 mt-6">
        <Label htmlFor="seed-phrase" className="text-white">
          Seed Phrase
        </Label>
        <div className="relative">
          <textarea
            id="seed-phrase"
            value={importedSeedPhrase}
            onChange={(e) => setImportedSeedPhrase(e.target.value)}
            className="w-full h-32 bg-dex-dark border border-dex-secondary/30 rounded-lg p-3 text-white resize-none"
            placeholder="Enter your seed phrase with words separated by spaces"
          />
        </div>
        <p className="text-xs text-gray-400">
          Enter all words separated by single spaces. The phrase should be 12 or 24 words long.
        </p>
      </div>

      <div className="bg-dex-negative/10 rounded-lg p-4 border border-dex-negative/20 mt-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-dex-negative min-w-[20px] mt-1" size={20} />
          <div>
            <h3 className="text-white font-medium mb-1">Security Warning</h3>
            <p className="text-sm text-gray-400">
              Make sure you're in a private and secure environment before entering your seed phrase.
              Never share your seed phrase with anyone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render the set password step
  const renderSetPasswordStep = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white text-center">Secure Your Wallet</h2>
      <p className="text-gray-400 text-center">
        Create a password to encrypt your seed phrase and name your wallet.
      </p>

      <div className="space-y-4 mt-6">
        <div className="space-y-2">
          <Label htmlFor="wallet-name" className="text-white">
            Wallet Name
          </Label>
          <Input
            id="wallet-name"
            value={walletName}
            onChange={(e) => setWalletName(e.target.value)}
            className="bg-dex-dark border-dex-secondary/30 text-white"
            placeholder="Enter a name for your wallet"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-white">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-dex-dark border-dex-secondary/30 text-white pr-10"
              placeholder="Enter a strong password"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-white">
            Confirm Password
          </Label>
          <Input
            id="confirm-password"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="bg-dex-dark border-dex-secondary/30 text-white"
            placeholder="Confirm your password"
          />
        </div>
      </div>

      <div className="bg-dex-secondary/10 rounded-lg p-4 border border-dex-secondary/20 mt-4">
        <div className="flex items-start gap-3">
          <Lock className="text-dex-primary min-w-[20px] mt-1" size={20} />
          <div>
            <h3 className="text-white font-medium mb-1">Password Security</h3>
            <p className="text-sm text-gray-400">
              This password will be used to encrypt your seed phrase. Make sure to use a strong password
              that you won't forget. We cannot recover your password if you lose it.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center mt-4">
        <Button
          variant="link"
          className="text-dex-primary hover:text-dex-primary/80"
          onClick={() => navigate('/wallet-diagnostic')}
        >
          <span className="flex items-center">
            <span className="mr-1">Troubleshoot Wallet Issues</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </span>
        </Button>
      </div>
    </div>
  );

  // Render the complete step
  const renderCompleteStep = () => (
    <div className="space-y-4">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-dex-positive/20 flex items-center justify-center">
          <Check className="h-8 w-8 text-dex-positive" />
        </div>
      </div>

      <h2 className="text-xl font-bold text-white text-center">Wallet Created Successfully</h2>
      <p className="text-gray-400 text-center">
        Your new wallet has been created and is ready to use.
      </p>

      <div className="bg-dex-dark border border-dex-secondary/30 rounded-lg p-4 mt-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Wallet Name:</span>
            <span className="text-white font-medium">{walletName}</span>
          </div>

          {Object.entries(generatedAddresses).map(([currency, address]) => (
            <div key={currency} className="flex justify-between">
              <span className="text-gray-400">{currency} Address:</span>
              <span className="text-white font-mono text-sm truncate max-w-[200px]">{address}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-dex-secondary/10 rounded-lg p-4 border border-dex-secondary/20 mt-4">
        <div className="flex items-start gap-3">
          <Shield className="text-dex-primary min-w-[20px] mt-1" size={20} />
          <div>
            <h3 className="text-white font-medium mb-1">Keep Your Wallet Secure</h3>
            <p className="text-sm text-gray-400">
              Remember to keep your seed phrase and password safe. Never share them with anyone.
              You'll need them to recover your wallet if you lose access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </Button>
        <h1 className="text-2xl font-bold text-white">Wallet Generation</h1>
      </div>

      <Card className="bg-black border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
        <CardContent className="pt-6">
          {renderStep()}
        </CardContent>
        <CardFooter className="flex justify-between pt-2 pb-6">
          <Button
            variant="outline"
            className="border-dex-secondary/30"
            onClick={handleBack}
            disabled={currentStep === GenerationStep.COMPLETE}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <Button
            variant="primary"
            onClick={handleNext}
            disabled={
              (currentStep === GenerationStep.GENERATE_SEED && !seedPhrase) ||
              (currentStep === GenerationStep.VERIFY_SEED && Object.keys(verificationInputs).length < verificationWords.length) ||
              (currentStep === GenerationStep.IMPORT_SEED && !importedSeedPhrase) ||
              (currentStep === GenerationStep.SET_PASSWORD && (!password || !confirmPassword || !walletName)) ||
              isGenerating ||
              isVerifying ||
              isSaving
            }
          >
            {isGenerating || isVerifying || isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {isGenerating ? 'Generating...' : isVerifying ? 'Verifying...' : 'Saving...'}
              </>
            ) : (
              <>
                {currentStep === GenerationStep.COMPLETE ? 'Go to Wallet' : 'Continue'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default WalletGenerationPage;
