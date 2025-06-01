import { z } from 'zod';

// Profile form validation schema
export const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string()
    .optional()
    .refine(
      (val) => !val || val === '' || /^[+]?[0-9\s\-\(\)]{5,20}$/.test(val),
      {
        message: 'Phone number must be 5-20 characters and contain only digits, spaces, hyphens, parentheses, and optional leading plus sign',
      }
    ),
  birthdate: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  website: z.string().nullable().optional()
    .refine(
      (val) => !val || val.startsWith('http://') || val.startsWith('https://'),
      {
        message: 'Website must start with http:// or https://',
      }
    ),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
