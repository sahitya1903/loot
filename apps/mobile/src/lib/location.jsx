// Where the feed looks. GPS is optional: when permission is denied or GPS is off, the user
// picks an area instead, and the choice is remembered across launches.

import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const STORAGE_KEY = 'loot_location';

/** Manual fallback areas, nearest-first for the demo city. */
export const PRESET_AREAS = [
  { label: 'Indiranagar, Bengaluru', latitude: 12.9719, longitude: 77.6412 },
  { label: 'Koramangala, Bengaluru', latitude: 12.9352, longitude: 77.6245 },
  { label: 'MG Road, Bengaluru', latitude: 12.9756, longitude: 77.6066 },
  { label: 'Bandra West, Mumbai', latitude: 19.0596, longitude: 72.8295 },
  { label: 'Connaught Place, Delhi', latitude: 28.6315, longitude: 77.2167 },
  { label: 'Hitech City, Hyderabad', latitude: 17.4435, longitude: 78.3772 },
];

export const RADIUS_OPTIONS_KM = [2, 5, 10, 25];

/**
 * @typedef {object} FeedLocation
 * @property {number} latitude
 * @property {number} longitude
 * @property {string} label
 * @property {'gps' | 'manual'} source
 */

const LocationContext = createContext(null);

async function load() {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function save(value) {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // not persisted; still used for this session
  }
}

export function LocationProvider({ children }) {
  /** @type {[{ location: FeedLocation | null, radiusKm: number, ready: boolean }, Function]} */
  const [state, setState] = useState({
    location: null,
    radiusKm: 10,
    ready: false,
  });

  useEffect(() => {
    load().then((saved) =>
      setState({
        location: saved?.location ?? null,
        radiusKm: saved?.radiusKm ?? 10,
        ready: true,
      }),
    );
  }, []);

  const update = useCallback((patch) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      save({ location: next.location, radiusKm: next.radiusKm });
      return next;
    });
  }, []);

  /**
   * Asks for permission and reads GPS once.
   * @returns {Promise<{ ok: true, location: FeedLocation } | { ok: false, reason: 'denied' | 'unavailable' }>}
   */
  const locateWithGps = useCallback(async () => {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return { ok: false, reason: 'denied' };
    try {
      const position =
        (await Location.getLastKnownPositionAsync({
          maxAge: 5 * 60_000,
          requiredAccuracy: 500,
        })) ??
        (await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }));
      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        label: 'Current location',
        source: 'gps',
      };
      update({ location });
      return { ok: true, location };
    } catch {
      return { ok: false, reason: 'unavailable' };
    }
  }, [update]);

  const value = useMemo(
    () => ({
      ...state,
      locateWithGps,
      chooseArea: (area) => update({ location: { ...area, source: 'manual' } }),
      setRadiusKm: (radiusKm) => update({ radiusKm }),
    }),
    [state, locateWithGps, update],
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useFeedLocation() {
  const value = useContext(LocationContext);
  if (!value)
    throw new Error('useFeedLocation must be used inside <LocationProvider>');
  return value;
}
