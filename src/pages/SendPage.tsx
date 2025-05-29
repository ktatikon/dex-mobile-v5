import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWalletData } from '@/hooks/useWalletData';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  QrCode,
  Upload,
  Info,
  AlertCircle,
  Loader2,
  Check,
  X
} from 'lucide-react';
import TokenIcon from '@/components/TokenIcon';
import EnhancedTokenSelector from '@/components/TokenSelector';
import { formatCurrency } from '@/services/realTimeData';
import { Token, TransactionStatus, TransactionType } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Form validation schema
const sendFormSchema = z.object({
  recipientAddress: z.string()
    .min(10, "Address must be at least 10 characters")
    .max(100, "Address is too long"),
  amount: z.string()
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Amount must be a positive number",
    }),
  memo: z.string().max(150, "Memo must be less than 150 characters").optional(),
});

type SendFormValues = z.infer<typeof sendFormSchema>;

// Fee options
const feeOptions = [
  { value: 'standard', label: 'Standard', time: '10-20 min', fee: '0.0005' },
  { value: 'fast', label: 'Fast', time: '5-10 min', fee: '0.001' },
  { value: 'instant', label: 'Instant', time: '1-2 min', fee: '0.002' },
];

const SendPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { walletTokens, address, refreshData } = useWalletData();

  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [selectedFee, setSelectedFee] = useState('standard');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [tokenError, setTokenError] = useState<string>('');

  // Get preselected token from location state if available
  useEffect(() => {
    if (location.state?.preSelectedToken) {
      setSelectedToken(location.state.preSelectedToken);
    } else if (walletTokens.length > 0) {
      setSelectedToken(walletTokens[0]);
    }
  }, [location.state, walletTokens]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset
  } = useForm<SendFormValues>({
    resolver: zodResolver(sendFormSchema),
    defaultValues: {
      recipientAddress: '',
      amount: '',
      memo: '',
    }
  });

  const watchAmount = watch('amount');

  // Calculate max amount user can send (balance - fee)
  const maxAmount = selectedToken
    ? parseFloat(selectedToken.balance || '0') - parseFloat(getFeeAmount())
    : 0;

  // Get fee amount based on selected fee option
  function getFeeAmount() {
    const feeOption = feeOptions.find(option => option.value === selectedFee);
    return feeOption ? feeOption.fee : '0.0005';
  }

  // Get estimated confirmation time based on selected fee option
  function getEstimatedTime() {
    const feeOption = feeOptions.find(option => option.value === selectedFee);
    return feeOption ? feeOption.time : '10-20 min';
  }

  // Handle setting max amount
  const handleSetMaxAmount = () => {
    if (selectedToken && maxAmount > 0) {
      setValue('amount', maxAmount.toString());
    }
  };

  // Handle QR code scanning
  const handleScanQRCode = () => {
    toast({
      title: "QR Code Scanner",
      description: "This feature will be available soon",
    });
  };

  // Enhanced token validation
  const validateToken = (token: Token | null): string => {
    if (!token) {
      return "Please select a token to send";
    }

    const balance = parseFloat(token.balance || '0');
    if (balance === 0) {
      return "Insufficient token balance";
    }

    const amount = parseFloat(watch('amount') || '0');
    const fee = parseFloat(getFeeAmount());

    if (amount + fee > balance) {
      return "Amount exceeds available balance (including fees)";
    }

    return '';
  };

  // Handle token selection with validation
  const handleTokenSelect = (token: Token) => {
    setSelectedToken(token);
    const error = validateToken(token);
    setTokenError(error);

    // Store token preference in session
    sessionStorage.setItem('preferredToken', JSON.stringify(token));
  };

  // Handle form submission
  const onSubmit = async (data: SendFormValues) => {
    const tokenValidationError = validateToken(selectedToken);
    if (tokenValidationError) {
      setTokenError(tokenValidationError);
      toast({
        title: "Token Selection Error",
        description: tokenValidationError,
        variant: "destructive",
      });
      return;
    }

    // Additional validation for amount
    const amount = parseFloat(data.amount);
    const balance = parseFloat(selectedToken?.balance || '0');
    const fee = parseFloat(getFeeAmount());

    if (amount + fee > balance) {
      toast({
        title: "Insufficient Balance",
        description: "Amount exceeds available balance including network fees",
        variant: "destructive",
      });
      return;
    }

    // Show confirmation dialog
    setShowConfirmation(true);
  };

  // Handle transaction confirmation
  const handleConfirmTransaction = async () => {
    setIsSubmitting(true);

    try {
      // Get form values
      const formValues = watch();

      // In a real implementation, this would call a blockchain API to send the transaction
      // For now, we'll just simulate a transaction by storing it in Supabase

      // Get user ID from auth
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get user's ID from the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (userError) {
        throw new Error("Error fetching user data");
      }

      // Get user's wallet ID
      const { data: walletData, error: walletError } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', userData.id)
        .eq('wallet_type', 'hot')
        .single();

      if (walletError) {
        throw new Error("Error fetching wallet data");
      }

      // Create transaction record
      const transactionId = uuidv4();
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          id: transactionId,
          user_id: userData.id,
          wallet_id: walletData.id,
          transaction_type: TransactionType.SEND,
          from_token_id: selectedToken.id,
          from_amount: formValues.amount,
          to_amount: null,
          timestamp: new Date().toISOString(),
          hash: `0x${Math.random().toString(16).substring(2, 42)}`,
          status: TransactionStatus.PENDING,
        });

      if (txError) {
        throw new Error("Error creating transaction record");
      }

      // Simulate transaction processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Show success message
      setShowConfirmation(false);
      setShowSuccess(true);

      // Reset form
      reset();

      // Refresh wallet data
      refreshData();

    } catch (error: any) {
      console.error('Error processing transaction:', error);
      toast({
        title: "Transaction Failed",
        description: error.message || "An error occurred while processing your transaction",
        variant: "destructive",
      });
      setShowConfirmation(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle success dialog close
  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigate('/wallet-dashboard');
  };

  return (
    <div className="container mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => navigate('/wallet-dashboard')}
        >
          <ArrowLeft className="h-5 w-5 text-white" />
        </Button>
        <h1 className="text-2xl font-bold text-white">Send Crypto</h1>
      </div>

      <Card className="bg-black border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-xl">Send Details</CardTitle>
          <CardDescription className="text-dex-text-secondary">
            Enter the recipient address and amount to send
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Enhanced Token Selection */}
            <div className="grid gap-2">
              <Label htmlFor="token" className="text-white">Select Token *</Label>
              <EnhancedTokenSelector
                tokens={walletTokens}
                selectedToken={selectedToken}
                onSelectToken={handleTokenSelect}
                label="Select Token to Send"
                required={true}
                showBalance={true}
                allowCustomTokens={true}
                placeholder="Search tokens by name or symbol..."
                error={tokenError}
              />
            </div>

            {/* Recipient Address */}
            <div className="grid gap-2">
              <Label htmlFor="recipientAddress" className="text-white">Recipient Address</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="recipientAddress"
                    {...register('recipientAddress')}
                    className={`bg-dex-dark border-dex-secondary/30 text-white min-h-[44px] ${errors.recipientAddress ? 'border-red-500' : ''}`}
                    placeholder="Enter wallet address"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-[44px] border-dex-secondary/30"
                  onClick={handleScanQRCode}
                >
                  <QrCode size={20} />
                </Button>
              </div>
              {errors.recipientAddress && (
                <p className="text-red-500 text-xs mt-1">{errors.recipientAddress.message}</p>
              )}
            </div>

            {/* Amount */}
            <div className="grid gap-2">
              <div className="flex justify-between">
                <Label htmlFor="amount" className="text-white">Amount</Label>
                {selectedToken && (
                  <button
                    type="button"
                    className="text-xs text-dex-primary"
                    onClick={handleSetMaxAmount}
                  >
                    Max: {maxAmount.toFixed(4)} {selectedToken.symbol}
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  {...register('amount')}
                  className={`bg-dex-dark border-dex-secondary/30 text-white min-h-[44px] ${errors.amount ? 'border-red-500' : ''}`}
                  placeholder="0.00"
                  type="number"
                  step="any"
                />
                {selectedToken && (
                  <div className="bg-dex-dark border border-dex-secondary/30 rounded-md px-3 flex items-center min-w-[100px] justify-center">
                    <span className="text-white">{selectedToken.symbol}</span>
                  </div>
                )}
              </div>
              {errors.amount && (
                <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>
              )}
              {selectedToken && watchAmount && !isNaN(parseFloat(watchAmount)) && (
                <p className="text-gray-400 text-xs">
                  ≈ ${(parseFloat(watchAmount) * (selectedToken.price || 0)).toFixed(2)} USD
                </p>
              )}
            </div>

            {/* Network Fee */}
            <div className="grid gap-2">
              <Label className="text-white">Network Fee</Label>
              <div className="grid grid-cols-3 gap-2">
                {feeOptions.map(option => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={selectedFee === option.value ? "primary" : "outline"}
                    className={`min-h-[44px] border-dex-secondary/30 ${selectedFee === option.value ? '' : 'text-white'}`}
                    onClick={() => setSelectedFee(option.value)}
                  >
                    <div className="flex flex-col items-center text-center">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs opacity-80">{option.time}</span>
                    </div>
                  </Button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Fee: {getFeeAmount()} {selectedToken?.symbol}</span>
                <span>≈ ${selectedToken ? (parseFloat(getFeeAmount()) * (selectedToken.price || 0)).toFixed(2) : '0.00'}</span>
              </div>
            </div>

            {/* Memo (Optional) */}
            <div className="grid gap-2">
              <Label htmlFor="memo" className="text-white">Memo (Optional)</Label>
              <Textarea
                id="memo"
                {...register('memo')}
                className="bg-dex-dark border-dex-secondary/30 text-white min-h-[80px] resize-none"
                placeholder="Add a note to this transaction"
              />
              {errors.memo && (
                <p className="text-red-500 text-xs mt-1">{errors.memo.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full font-medium text-base min-h-[44px] mt-6"
              disabled={!selectedToken || isSubmitting}
            >
              <Upload size={18} className="mr-2" />
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Transaction Information Card */}
      <Card className="bg-black border-dex-secondary/30 shadow-lg shadow-dex-secondary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-xl">Transaction Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-dex-text-secondary">
            <div className="flex gap-3">
              <Info className="text-dex-primary min-w-[20px]" size={20} />
              <p>Transaction fees vary based on network congestion and the selected speed option.</p>
            </div>
            <div className="flex gap-3">
              <Info className="text-dex-primary min-w-[20px]" size={20} />
              <p>Always double-check the recipient address before confirming your transaction.</p>
            </div>
            <div className="flex gap-3">
              <AlertCircle className="text-dex-primary min-w-[20px]" size={20} />
              <p>Cryptocurrency transactions are irreversible. Funds sent to the wrong address cannot be recovered.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="bg-dex-dark border-dex-secondary/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Confirm Transaction</DialogTitle>
            <DialogDescription className="text-gray-400">
              Please review the transaction details before confirming
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">From</span>
              <span className="text-white font-medium">{address}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">To</span>
              <span className="text-white font-medium">{watch('recipientAddress')}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Amount</span>
              <div className="flex items-center gap-2">
                {selectedToken && <TokenIcon token={selectedToken} size="xs" />}
                <span className="text-white font-medium">
                  {watch('amount')} {selectedToken?.symbol}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Network Fee</span>
              <span className="text-white font-medium">
                {getFeeAmount()} {selectedToken?.symbol}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Total Amount</span>
              <span className="text-white font-medium">
                {(parseFloat(watch('amount') || '0') + parseFloat(getFeeAmount())).toFixed(6)} {selectedToken?.symbol}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">Estimated Time</span>
              <span className="text-white font-medium">{getEstimatedTime()}</span>
            </div>

            {watch('memo') && (
              <div className="flex justify-between items-start">
                <span className="text-gray-400">Memo</span>
                <span className="text-white font-medium text-right max-w-[200px] break-words">{watch('memo')}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              className="border-dex-secondary/30 text-white min-h-[44px]"
              disabled={isSubmitting}
            >
              <X size={18} className="mr-2" />
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmTransaction}
              className="min-h-[44px]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check size={18} className="mr-2" />
                  Confirm Send
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="bg-dex-dark border-dex-secondary/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Transaction Submitted</DialogTitle>
            <DialogDescription className="text-gray-400">
              Your transaction has been submitted to the network
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-16 h-16 rounded-full bg-dex-positive/20 flex items-center justify-center mb-4">
              <Check size={32} className="text-dex-positive" />
            </div>
            <p className="text-white text-center mb-2">Transaction Pending</p>
            <p className="text-gray-400 text-center text-sm mb-4">
              Your transaction is being processed and will be confirmed shortly
            </p>
            <p className="text-dex-primary text-sm">
              Note: This is a simulated transaction for demonstration purposes
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="primary"
              onClick={handleSuccessClose}
              className="w-full min-h-[44px]"
            >
              Return to Wallet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SendPage;
