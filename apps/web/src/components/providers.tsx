'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, type ReactNode } from 'react';
import { getFirebaseAuth } from '@/lib/firebase/config';
import { useAuth, ThemeProvider } from '@/hooks';
import { SmoothScrollProvider } from '@/components/providers/SmoothScrollProvider';

interface ProvidersProps {
    children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    // Initialize auth listener globally to persist across navigation
    useAuth();

    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000,
                retry: 1,
            },
        },
    }));

    // Expose Firebase auth helpers to window for debugging
    useEffect(() => {
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
            (window as unknown as Record<string, unknown>).getToken = async () => {
                try {
                    const auth = getFirebaseAuth();
                    if (auth.currentUser) {
                        const token = await auth.currentUser.getIdToken();
                        console.log('Firebase ID Token:', token);
                        return token;
                    } else {
                        console.log('No user signed in');
                        return null;
                    }
                } catch (err) {
                    console.error('Error getting token:', err);
                    return null;
                }
            };

            (window as unknown as Record<string, unknown>).getUser = () => {
                const auth = getFirebaseAuth();
                console.log('Current user:', auth.currentUser);
                return auth.currentUser;
            };

            console.log('🔧 Debug helpers available: getToken(), getUser()');
        }
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <SmoothScrollProvider>
                    {children}
                </SmoothScrollProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

