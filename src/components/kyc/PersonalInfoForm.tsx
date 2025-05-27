import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useKYC } from '@/contexts/KYCContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';

const personalInfoSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  middleName: z.string().optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  dateOfBirth: z.string().refine(date => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    return (age > 18 || (age === 18 && m >= 0));
  }, 'You must be at least 18 years old'),
  address: z.string().min(5, 'Street address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State/Province is required'),
  postalCode: z.string().min(3, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Valid email is required'),
});

type PersonalInfoFormValues = z.infer<typeof personalInfoSchema>;

const PersonalInfoForm: React.FC = () => {
  const { formData, updatePersonalInfo, goToNextStep } = useKYC();

  const form = useForm<PersonalInfoFormValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: formData.firstName,
      middleName: formData.middleName,
      lastName: formData.lastName,
      dateOfBirth: formData.dateOfBirth,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      postalCode: formData.postalCode,
      country: formData.country,
      phone: formData.phone,
      email: formData.email,
    },
  });

  const onSubmit = (data: PersonalInfoFormValues) => {
    updatePersonalInfo(data);
    goToNextStep();
  };

  return (
    <Card className="bg-dex-dark/80 border-dex-secondary/30 shadow-lg shadow-dex-secondary/10">
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">First Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your first name"
                        className="bg-dex-dark/70 border-dex-secondary/30 text-white min-h-[44px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-dex-primary" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="middleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Middle Name (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your middle name"
                        className="bg-dex-dark/70 border-dex-secondary/30 text-white min-h-[44px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-dex-primary" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Last Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your last name"
                        className="bg-dex-dark/70 border-dex-secondary/30 text-white min-h-[44px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-dex-primary" />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dateOfBirth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Date of Birth</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      className="bg-dex-dark/70 border-dex-secondary/30 text-white min-h-[44px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-dex-primary" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Street Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your street address"
                      className="bg-dex-dark/70 border-dex-secondary/30 text-white min-h-[44px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="text-dex-primary" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">City</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your city"
                        className="bg-dex-dark/70 border-dex-secondary/30 text-white min-h-[44px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-dex-primary" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">State/Province</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your state/province"
                        className="bg-dex-dark/70 border-dex-secondary/30 text-white min-h-[44px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-dex-primary" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Postal Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your postal code"
                        className="bg-dex-dark/70 border-dex-secondary/30 text-white min-h-[44px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-dex-primary" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Country</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your country"
                        className="bg-dex-dark/70 border-dex-secondary/30 text-white min-h-[44px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-dex-primary" />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Phone Number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your phone number"
                        className="bg-dex-dark/70 border-dex-secondary/30 text-white min-h-[44px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-dex-primary" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your email"
                        className="bg-dex-dark/70 border-dex-secondary/30 text-white min-h-[44px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-dex-primary" />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                className="min-h-[44px]"
                onClick={() => window.history.back()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="min-h-[44px]"
              >
                Next Step
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoForm;
