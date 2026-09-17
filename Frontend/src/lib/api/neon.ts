import { callFunction } from '@/lib/firebase/functions';

export interface NetworkSpaceMatch {
    user_id: string;
    match_count: number;
    shared_interests: string[];
}

interface NetworkMatchesResponse {
    success: boolean;
    data?: NetworkSpaceMatch[];
    error?: string;
}

/**
 * Get network matches for the current user in an event.
 * Calls the getNetworkMatches Cloud Function which queries Neon server-side.
 */
export async function getNetworkMatches(
    eventId: string,
    limit: number = 20,
    offset: number = 0
): Promise<NetworkSpaceMatch[]> {
    const result = await callFunction<
        { eventId: string; limit: number; offset: number },
        NetworkMatchesResponse
    >('getNetworkMatches', { eventId, limit, offset });

    if (!result.success) {
        console.error('getNetworkMatches error:', result.error);
        throw new Error(result.error || 'Failed to fetch network matches');
    }

    return result.data ?? [];
}
