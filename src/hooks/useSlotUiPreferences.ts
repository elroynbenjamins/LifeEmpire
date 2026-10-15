import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Prevent preferences from one life save overwriting another during slot changes. */
export function useSlotUiPreferences<T>(
  key: string,
  initialValue: T,
  parse: (raw: unknown) => T,
): [T, Dispatch<SetStateAction<T>>, boolean] {
  const [value, setValue] = useState<T>(initialValue);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());
  const [readyKey, setReadyKey] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setReadyKey(null);
    setValue(initialValue);
    void AsyncStorage.getItem(key)
      .then(raw => {
        if (!mounted) return;
        let next = initialValue;
        try { next = raw ? parse(JSON.parse(raw)) : initialValue; } catch { /* use defaults */ }
        setValue(next);
        setReadyKey(key);
      })
      .catch(() => { if (mounted) setReadyKey(key); });
    return () => { mounted = false; };
  }, [key]);

  useEffect(() => {
    if (readyKey !== key) return;
    // Serialize rapid changes so an older asynchronous save cannot finish last.
    const nextValue = JSON.stringify(value);
    writeQueue.current = writeQueue.current
      .catch(() => {})
      .then(() => AsyncStorage.setItem(key, nextValue))
      .catch(() => {});
  }, [key, value, readyKey]);

  return [value, setValue, readyKey === key];
}
