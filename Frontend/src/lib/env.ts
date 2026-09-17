/**
 * Environment Configuration with Runtime Validation
 * 
 * This module provides type-safe access to environment variables with
 * Zod validation. It will throw descriptive errors at startup if
 * required variables are missing or malformed.
 */

import { z } from 'zod';

/**
 * Schema for all environment variables used by the application.
 * All NEXT_PUBLIC_ prefixed variables are available client-side.
 */
const envSchema = z.object({
    // Firebase Configuration
    NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, 'Firebase API Key is required'),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'Firebase Auth Domain is required'),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase Project ID is required'),
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1, 'Firebase Storage Bucket is required'),
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, 'Firebase Messaging Sender ID is required'),
    NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, 'Firebase App ID is required'),
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),

    // Development Settings
    NEXT_PUBLIC_USE_EMULATORS: z.string().optional().transform(val => val === 'true').default(false),

    // App Configuration
    NEXT_PUBLIC_APP_URL: z.string().url('App URL must be a valid URL'),

    // Google Places API
    NEXT_PUBLIC_GOOGLE_PLACES_API_KEY: z.string().min(1, 'Google Places API Key is required'),

    // AWS Configuration for Face Liveness
    NEXT_PUBLIC_AWS_REGION: z.string().min(1, 'AWS Region is required'),
    NEXT_PUBLIC_AWS_COGNITO_IDENTITY_POOL_ID: z.string().min(1, 'AWS Cognito Identity Pool ID is required'),

    // Node environment (automatically set)
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Get the raw environment object for parsing.
 * In the browser, only NEXT_PUBLIC_ prefixed vars are available.
 */
function getEnvObject(): Record<string, string | undefined> {
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
        // In browser, we can only access NEXT_PUBLIC_ vars that were inlined at build time
        // These are accessed via process.env which Next.js replaces at build time
        return {
            NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
            NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
            NEXT_PUBLIC_USE_EMULATORS: process.env.NEXT_PUBLIC_USE_EMULATORS,
            NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
            NEXT_PUBLIC_GOOGLE_PLACES_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY,
            NEXT_PUBLIC_AWS_REGION: process.env.NEXT_PUBLIC_AWS_REGION,
            NEXT_PUBLIC_AWS_COGNITO_IDENTITY_POOL_ID: process.env.NEXT_PUBLIC_AWS_COGNITO_IDENTITY_POOL_ID,
            NODE_ENV: process.env.NODE_ENV,
        };
    }

    // On server, we have access to full process.env
    return process.env as Record<string, string | undefined>;
}

/**
 * Parse and validate environment variables.
 * Will throw a descriptive error if validation fails.
 */
function parseEnv(): Env {
    const envObject = getEnvObject();
    const result = envSchema.safeParse(envObject);

    if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        const errorMessages = Object.entries(errors)
            .map(([field, messages]) => `  ${field}: ${messages?.join(', ')}`)
            .join('\n');

        throw new Error(
            `❌ Environment validation failed:\n${errorMessages}\n\n` +
            'Please check your .env.local file or environment variables.'
        );
    }

    return result.data;
}

/**
 * Validated environment variables.
 * Access this object to get type-safe environment values.
 * 
 * @example
 * import { env } from '@/lib/env';
 * console.log(env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
 */
export const env = parseEnv();

/**
 * Helper to check if we're in development mode
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Helper to check if we're in production mode
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Helper to check if we're in test mode
 */
export const isTest = env.NODE_ENV === 'test';

/**
 * Helper to check if Firebase emulators should be used
 */
export const useEmulators = env.NEXT_PUBLIC_USE_EMULATORS === true;
