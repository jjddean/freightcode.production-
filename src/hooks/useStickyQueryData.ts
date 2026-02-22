import { useEffect, useState } from "react";

const stickyStore = new Map<string, unknown>();

export function useStickyQueryData<T>(key: string, value: T | undefined, initialValue: T): T {
  const [stableValue, setStableValue] = useState<T>(() => {
    if (stickyStore.has(key)) {
      return stickyStore.get(key) as T;
    }
    return initialValue;
  });

  useEffect(() => {
    if (stickyStore.has(key)) {
      setStableValue(stickyStore.get(key) as T);
      return;
    }

    setStableValue(initialValue);
    // We intentionally only reset when the cache key changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (value !== undefined) {
      stickyStore.set(key, value);
      setStableValue(value);
    }
  }, [key, value]);

  if (value !== undefined) {
    return value;
  }

  return stableValue;
}
