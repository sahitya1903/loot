// Socket.io client: one connection per signed-in session. Screens say which loot and area
// they show; the server pushes counters, new nearby loot and redemption updates. Everything
// here is an enhancement — screens still load over REST and poll while disconnected.

import {
  MAX_WATCHED_LOOT,
  REALTIME_EVENTS,
  getLootCounters,
  haversineKm,
  queryKeys,
} from '@loot/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { io } from 'socket.io-client';
import { API_URL, currentAccessToken } from './api';

const RealtimeContext = createContext(null);

/** Latest counters per loot id, readable from any component. */
function createCounterStore() {
  const counters = new Map();
  const listeners = new Set();
  return {
    get: (id) => counters.get(id),
    set(value) {
      counters.set(value.lootId, value);
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const chunks = (ids) => {
  const out = [];
  for (let i = 0; i < ids.length; i += MAX_WATCHED_LOOT)
    out.push(ids.slice(i, i + MAX_WATCHED_LOOT));
  return out;
};

export function RealtimeProvider({ enabled, children }) {
  const queryClient = useQueryClient();
  const [connected, setConnected] = useState(false);
  const [nearbyNew, setNearbyNew] = useState([]);
  const socketRef = useRef(null);
  const watchCounts = useRef(new Map());
  const area = useRef(null);
  const store = useMemo(() => createCounterStore(), []);

  useEffect(() => {
    if (!enabled) return undefined;
    const socket = io(API_URL, {
      transports: ['websocket'],
      // Read on every (re)connect, so a refreshed access token is picked up.
      auth: (cb) =>
        currentAccessToken().then((token) => cb(token ? { token } : {})),
      reconnectionDelayMax: 10_000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Rooms don't survive a reconnect: re-send everything this client watches.
      for (const lootIds of chunks([...watchCounts.current.keys()]))
        socket.emit(REALTIME_EVENTS.watchLoot, { lootIds });
      if (area.current) socket.emit(REALTIME_EVENTS.watchArea, area.current);
    });
    socket.on('disconnect', () => setConnected(false));
    socket.on('connect_error', () => setConnected(false));
    socket.on(REALTIME_EVENTS.lootCounters, (counters) => store.set(counters));
    socket.on(REALTIME_EVENTS.lootPublished, (item) => {
      const here = area.current;
      if (
        here &&
        haversineKm(
          here.latitude,
          here.longitude,
          item.latitude,
          item.longitude,
        ) > here.radiusKm
      )
        return;
      setNearbyNew((list) =>
        list.some((i) => i.id === item.id)
          ? list
          : [item, ...list].slice(0, 20),
      );
    });
    socket.on(REALTIME_EVENTS.redemptionUpdated, ({ redemption }) => {
      queryClient.setQueryData(queryKeys.loot.redemption(redemption.lootId), {
        redemption,
      });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [enabled, queryClient, store]);

  const value = useMemo(
    () => ({
      connected,
      store,
      nearbyNew,
      clearNearbyNew: () => setNearbyNew([]),
      watch(ids) {
        const fresh = [];
        for (const id of ids) {
          const count = watchCounts.current.get(id) ?? 0;
          watchCounts.current.set(id, count + 1);
          if (count === 0) fresh.push(id);
        }
        if (fresh.length && socketRef.current?.connected) {
          for (const lootIds of chunks(fresh))
            socketRef.current.emit(REALTIME_EVENTS.watchLoot, { lootIds });
        }
      },
      unwatch(ids) {
        const gone = [];
        for (const id of ids) {
          const count = (watchCounts.current.get(id) ?? 1) - 1;
          if (count <= 0) {
            watchCounts.current.delete(id);
            gone.push(id);
          } else watchCounts.current.set(id, count);
        }
        if (gone.length && socketRef.current?.connected) {
          for (const lootIds of chunks(gone))
            socketRef.current.emit(REALTIME_EVENTS.unwatchLoot, { lootIds });
        }
      },
      watchArea(next) {
        area.current = next;
        setNearbyNew([]);
        if (socketRef.current?.connected) {
          socketRef.current.emit(REALTIME_EVENTS.watchArea, {
            latitude: next.latitude,
            longitude: next.longitude,
          });
        }
      },
    }),
    [connected, store, nearbyNew],
  );

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

function useRealtime() {
  const value = useContext(RealtimeContext);
  if (!value)
    throw new Error('Realtime hooks must be used inside <RealtimeProvider>');
  return value;
}

/** Watches these loot ids while the calling screen is mounted. */
export function useWatchLoot(ids) {
  const { watch, unwatch } = useRealtime();
  const key = ids.join(',');
  useEffect(() => {
    const list = key ? key.split(',') : [];
    watch(list);
    return () => unwatch(list);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` stands in for `ids`
  }, [key]);
}

/** Announces newly live loot within `radiusKm` of this point. */
export function useWatchArea(location, radiusKm) {
  const { watchArea, nearbyNew, clearNearbyNew } = useRealtime();
  const latitude = location?.latitude;
  const longitude = location?.longitude;
  useEffect(() => {
    if (latitude != null && longitude != null)
      watchArea({ latitude, longitude, radiusKm });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- watchArea changes identity on every render
  }, [latitude, longitude, radiusKm]);
  return { nearbyNew, clearNearbyNew };
}

/**
 * Live counters for one loot: pushed over the socket, or polled over REST every
 * `pollMs` while the socket is down. Returns null until either has data.
 */
export function useLiveCounters(lootId, { pollMs = 15_000 } = {}) {
  const { store, connected } = useRealtime();
  useWatchLoot(lootId ? [lootId] : []);
  const pushed = useSyncExternalStore(store.subscribe, () => store.get(lootId));
  const polled = useQuery({
    queryKey: queryKeys.loot.counters(lootId),
    queryFn: () => getLootCounters({ lootId }).then((r) => r.counters),
    enabled: Boolean(lootId) && !connected,
    refetchInterval: pollMs,
  });
  return pushed ?? (connected ? null : (polled.data ?? null));
}

/** Pushed counters for a feed card, or null (the card keeps its REST values). */
export function useCountersFor(lootId) {
  const { store } = useRealtime();
  return useSyncExternalStore(store.subscribe, () => store.get(lootId));
}

export function useRealtimeStatus() {
  return useRealtime().connected;
}
