import { useCallback } from 'react';
import type { HistoryEntry } from '../lib/state';
import { useLocalStorage } from './useLocalStorage';

export const HISTORY_LIMIT = 10;

/** Сохранённые данные считаем недоверенными: оставляем только корректные записи. */
export function parseHistory(raw: unknown): HistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const list: HistoryEntry[] = [];
  for (const item of raw as unknown[]) {
    if (typeof item !== 'object' || item === null) continue;
    const { expr, result } = item as Record<string, unknown>;
    if (typeof expr === 'string' && typeof result === 'number' && Number.isFinite(result)) {
      list.push({ expr, result });
    }
  }
  return list.slice(0, HISTORY_LIMIT);
}

/** История последних вычислений (до 10 записей), хранится в браузере. */
export function useHistory() {
  const [items, setItems] = useLocalStorage<HistoryEntry[]>('history', parseHistory);

  const add = useCallback(
    (entry: HistoryEntry) => {
      setItems((list) => {
        const top = list[0];
        if (top && top.expr === entry.expr && top.result === entry.result) return list;
        return [entry, ...list].slice(0, HISTORY_LIMIT);
      });
    },
    [setItems],
  );

  const clear = useCallback(() => setItems([]), [setItems]);

  return { items, add, clear };
}
