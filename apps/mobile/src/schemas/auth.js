import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().trim().email('Enter a valid email.'),
    password: z.string().min(1, 'Enter your password.'),
});

export const forgotPasswordSchema = z.object({
    email: z.string().trim().email('Enter a valid email.'),
});

export const resetPasswordSchema = z
    .object({
        password: z
            .string()
            .min(8, 'Password must be at least 8 characters.')
            .regex(/[A-Z]/, 'Include an uppercase letter.')
            .regex(/[a-z]/, 'Include a lowercase letter.')
            .regex(/[0-9]/, 'Include a number.'),
        confirmPassword: z.string().min(1, 'Confirm your password.'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match.',
        path: ['confirmPassword'],
    });
