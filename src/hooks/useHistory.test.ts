import { describe, expect, it } from 'vitest';
import { HISTORY_LIMIT, parseHistory } from './useHistory';

describe('parseHistory', () => {
  it('возвращает пустой список, если сохранено не то', () => {
    expect(parseHistory(undefined)).toEqual([]);
    expect(parseHistory('abc')).toEqual([]);
    expect(parseHistory({ expr: '1+1', result: 2 })).toEqual([]);
  });

  it('оставляет только корректные записи', () => {
    const raw = [
      { expr: '1+1', result: 2 },
      { expr: '2*2', result: Infinity },
      { expr: 3, result: 3 },
      { expr: '4', result: '4' },
      null,
    ];
    expect(parseHistory(raw)).toEqual([{ expr: '1+1', result: 2 }]);
  });

  it(`не хранит больше ${HISTORY_LIMIT} записей`, () => {
    const raw = Array.from({ length: 25 }, (_, i) => ({ expr: `${i}+1`, result: i + 1 }));
    expect(parseHistory(raw)).toHaveLength(HISTORY_LIMIT);
  });
});
