'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase/config';
import { useAuth } from './use-auth';
import type { UserSubscription, StorageUsage } from '@/types/models';

interface UseSubscriptionReturn {
    subscription: UserSubscription | null;
    storage: StorageUsage | null;
    isLoading: boolean;
    usagePercent: number;
    formattedUsed: string;
    formattedLimit: string;
    planName: string;
}

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function useSubscription(): UseSubscriptionReturn {
    const { profile } = useAuth();
    const [subscription, setSubscription] = useState<UserSubscription | null>(null);
    const [storage, setStorage] = useState<StorageUsage | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!profile?.userId) {
            setIsLoading(false);
            return;
        }

        const db = getFirebaseDb();
        let loadedCount = 0;
        const checkLoaded = () => {
            loadedCount++;
            if (loadedCount >= 2) setIsLoading(false);
        };

        const unsubStorage = onSnapshot(
            doc(db, 'users', profile.userId, 'storage', 'usage'),
            (snap) => {
                if (snap.exists()) {
                    setStorage(snap.data() as StorageUsage);
                }
                checkLoaded();
            },
            () => checkLoaded()
        );

        const unsubSubscription = onSnapshot(
            doc(db, 'users', profile.userId, 'subscription', 'current'),
            (snap) => {
                if (snap.exists()) {
                    setSubscription(snap.data() as UserSubscription);
                }
                checkLoaded();
            },
            () => checkLoaded()
        );

        return () => {
            unsubStorage();
            unsubSubscription();
        };
    }, [profile?.userId]);

    const usedBytes = storage?.totalBytesUsed ?? 0;
    const limitBytes = storage?.limit ?? 10 * 1024 * 1024 * 1024; // 10GB free default
    const usagePercent = limitBytes > 0 ? Math.min((usedBytes / limitBytes) * 100, 100) : 0;
    const planName: string = (subscription?.isActive && subscription?.planName) ? subscription.planName : 'Free';

    return {
        subscription,
        storage,
        isLoading,
        usagePercent,
        formattedUsed: formatBytes(usedBytes),
        formattedLimit: formatBytes(limitBytes),
        planName,
    };
}
