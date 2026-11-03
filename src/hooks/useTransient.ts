import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Значение, которое само сбрасывается в null через `ms` миллисекунд.
 * Нужно для коротких подсветок: «клавиша нажата», «скопировано».
 */
export function useTransient<T>(ms: number) {
  const [value, setValue] = useState<T | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const trigger = useCallback(
    (next: T) => {
      setValue(next);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setValue(null), ms);
    },
    [ms],
  );

  return [value, trigger] as const;
}
