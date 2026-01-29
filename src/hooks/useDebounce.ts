import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useThrottle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): [T, boolean] {
  const [isThrottled, setIsThrottled] = useState(false);

  const throttledFn = ((...args: Parameters<T>) => {
    if (isThrottled) return;
    
    setIsThrottled(true);
    fn(...args);
    
    setTimeout(() => {
      setIsThrottled(false);
    }, delay);
  }) as T;

  return [throttledFn, isThrottled];
}
