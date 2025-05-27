import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
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
import { ArrowLeft, Loader2, Mail, MessageSquare, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  category: z.string().min(1, 'Please select a category'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const ContactPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: user?.email || '',
      category: '',
      subject: '',
      message: '',
    }
  });

  const selectedCategory = watch('category');

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    try {
      // In a real app, you would send this data to your backend
      console.log('Contact form data:', data);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast({
        title: "Message Sent",
        description: "We've received your message and will respond shortly.",
        variant: "default",
      });

      reset();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 pt-6 pb-24">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="mr-2"
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <ArrowLeft className="text-white" size={26} />
        </Button>
        <h1 className="text-2xl font-bold text-white">Contact Support</h1>
      </div>

      <Card className="bg-black border-dex-secondary/30 mb-6 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white text-xl">Get in Touch</CardTitle>
          <CardDescription className="text-dex-text-secondary text-base">
            Our support team is here to help with any questions or issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-white text-sm">Your Name</Label>
              <Input
                id="name"
                {...register('name')}
                className={`bg-dex-dark border-dex-secondary/30 text-white min-h-[44px] ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email" className="text-white text-sm">Email Address</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                className={`bg-dex-dark border-dex-secondary/30 text-white min-h-[44px] ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category" className="text-white text-sm">Category</Label>
              <Select
                onValueChange={(value) => setValue('category', value)}
                defaultValue={selectedCategory}
              >
                <SelectTrigger
                  id="category"
                  className={`bg-dex-dark border-dex-secondary/30 text-white min-h-[44px] ${errors.category ? 'border-red-500' : ''}`}
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-dex-dark border-dex-secondary/30 text-white">
                  <SelectItem value="account" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">Account Issues</SelectItem>
                  <SelectItem value="trading" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">Trading Problems</SelectItem>
                  <SelectItem value="deposit" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">Deposits & Withdrawals</SelectItem>
                  <SelectItem value="kyc" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">KYC Verification</SelectItem>
                  <SelectItem value="security" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">Security Concerns</SelectItem>
                  <SelectItem value="bug" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">Bug Report</SelectItem>
                  <SelectItem value="feature" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">Feature Request</SelectItem>
                  <SelectItem value="other" className="text-white hover:bg-dex-secondary/20 focus:bg-dex-secondary/20">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subject" className="text-white text-sm">Subject</Label>
              <Input
                id="subject"
                {...register('subject')}
                className={`bg-dex-dark border-dex-secondary/30 text-white min-h-[44px] ${errors.subject ? 'border-red-500' : ''}`}
              />
              {errors.subject && (
                <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="message" className="text-white text-sm">Message</Label>
              <Textarea
                id="message"
                {...register('message')}
                className={`bg-dex-dark border-dex-secondary/30 text-white min-h-[120px] rounded-lg p-3 ${errors.message ? 'border-red-500' : ''}`}
                placeholder="Please describe your issue in detail..."
              />
              {errors.message && (
                <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full font-medium text-base min-h-[44px] mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} className="mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Alternative Contact Methods */}
      <Card className="bg-black border-dex-secondary/30 shadow-lg shadow-dex-secondary/10">
        <CardHeader>
          <CardTitle className="text-white text-xl">Alternative Contact Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border border-dex-secondary/20">
              <Mail className="text-dex-primary" size={24} />
              <div>
                <p className="text-white font-medium">Email Support</p>
                <p className="text-dex-text-secondary text-sm">support@v-dex.com</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-dex-secondary/20">
              <MessageSquare className="text-dex-primary" size={24} />
              <div>
                <p className="text-white font-medium">Live Chat</p>
                <p className="text-dex-text-secondary text-sm">Available 24/7 in the app</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContactPage;
