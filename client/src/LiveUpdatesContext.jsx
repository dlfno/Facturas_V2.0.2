import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from 'react';

const EVENT_TYPES = ['invoices:changed', 'aliases:changed', 'settings:changed'];

const LiveCtx = createContext(null);

// Provider global: mantiene UNA conexión EventSource y reparte eventos a los
// subscriptores. Expone `subscribe(types, cb)` y el estado `syncing`.
export function LiveUpdatesProvider({ children }) {
  const [syncing, setSyncing] = useState(false);
  const listenersRef = useRef({});
  const syncingTimeoutRef = useRef(null);
  const esRef = useRef(null);

  useEffect(() => {
    const es = new EventSource('/api/events');
    esRef.current = es;

    const flash = () => {
      setSyncing(true);
      clearTimeout(syncingTimeoutRef.current);
      syncingTimeoutRef.current = setTimeout(() => setSyncing(false), 400);
    };

    for (const type of EVENT_TYPES) {
      es.addEventListener(type, (e) => {
        flash();
        const data = safeParse(e.data);
        const subs = listenersRef.current[type];
        if (subs) for (const cb of subs) cb(data);
      });
    }

    es.onerror = () => {
      // EventSource reintenta automáticamente. No hacemos nada aquí.
    };

    return () => {
      es.close();
      clearTimeout(syncingTimeoutRef.current);
    };
  }, []);

  const subscribe = useCallback((types, cb) => {
    const list = Array.isArray(types) ? types : [types];
    for (const t of list) {
      if (!listenersRef.current[t]) listenersRef.current[t] = new Set();
      listenersRef.current[t].add(cb);
    }
    return () => {
      for (const t of list) listenersRef.current[t]?.delete(cb);
    };
  }, []);

  return (
    <LiveCtx.Provider value={{ subscribe, syncing }}>
      {children}
    </LiveCtx.Provider>
  );
}

function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// Hook: se suscribe a los eventos indicados y dispara `onChange` con debounce.
// Pausa cuando la pestaña está en background (visibilityState === 'hidden').
export function useLiveUpdates(types, onChange, debounceMs = 300) {
  const ctx = useContext(LiveCtx);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const typesKey = Array.isArray(types) ? types.join('|') : types;

  useEffect(() => {
    if (!ctx) return;
    let t = null;
    const handler = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      clearTimeout(t);
      t = setTimeout(() => onChangeRef.current?.(), debounceMs);
    };
    const unsub = ctx.subscribe(types, handler);
    return () => {
      unsub();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx, typesKey, debounceMs]);
}

export function useSyncStatus() {
  return useContext(LiveCtx)?.syncing ?? false;
}
