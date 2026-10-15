// Session state: restores the saved session on launch, signs in with phone OTP, and
// signs out (locally and on the server). The API, not this file, decides what a user can do.

import {
  ApiError,
  getMe,
  hasSession,
  logout,
  sendOtp,
  verifyOtp,
} from '@loot/shared';
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { onSessionExpired } from './api';

const AuthContext = createContext(null);

/** @typedef {'loading' | 'signedOut' | 'signedIn'} AuthStatus */

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState({ status: 'loading', user: null });

  const signedOut = useCallback(() => {
    queryClient.clear();
    setState({ status: 'signedOut', user: null });
  }, [queryClient]);

  // Restore: a stored session is only trusted once /v1/me accepts it.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!(await hasSession()))
        return !cancelled && setState({ status: 'signedOut', user: null });
      try {
        const { user } = await getMe();
        if (!cancelled) setState({ status: 'signedIn', user });
      } catch (err) {
        if (cancelled) return;
        // Offline at launch: keep the session and let screens show their own errors.
        if (err instanceof ApiError && err.status === 401)
          setState({ status: 'signedOut', user: null });
        else setState({ status: 'signedIn', user: null, offline: true });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => onSessionExpired(signedOut), [signedOut]);

  const refreshUser = useCallback(async () => {
    const { user } = await getMe();
    setState({ status: 'signedIn', user });
    return user;
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      requestCode: (phoneNumber) => sendOtp({ phoneNumber }),
      async signIn(phoneNumber, code) {
        const { user, isNewUser } = await verifyOtp({ phoneNumber, code });
        setState({ status: 'signedIn', user });
        return { user, isNewUser };
      },
      async signOut() {
        await logout();
        signedOut();
      },
      refreshUser,
    }),
    [state, signedOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}

/** True for professional accounts that have finished business onboarding. */
export function isBusiness(user) {
  return user?.accountType === 'professional' && Boolean(user.businessId);
}
