// Firebase Cloud Functions wrapper

import { httpsCallable } from 'firebase/functions';
import { getFirebaseFunctions } from './config';

/**
 * Generic function caller for Firebase Cloud Functions
 * All functions are deployed to asia-south1 region
 */
export async function callFunction<TRequest, TResponse>(
    functionName: string,
    data: TRequest
): Promise<TResponse> {
    const callable = httpsCallable<TRequest, TResponse>(getFirebaseFunctions(), functionName);
    try {
        const result = await callable(data);
        console.log(`[Function ${functionName}] Success:`, result.data);
        return result.data;
    } catch (error) {
        console.error(`[Function ${functionName}] Error:`, error);
        throw error;
    }
}

// Re-export for convenience
export { httpsCallable } from 'firebase/functions';
