import type { Digit, Key } from './state';

/** Клавиши клавиатуры -> команды калькулятора. Цифры обрабатываются отдельно. */
const KEY_MAP: Record<string, Key> = {
  ',': '.',
  '.': '.',
  '+': '+',
  '-': '-',
  '*': '*',
  x: '*',
  X: '*',
  '/': '/',
  '%': '%',
  Enter: 'equals',
  '=': 'equals',
  Backspace: 'back',
  Escape: 'clear',
  Delete: 'clear',
};

export function keyFromEvent(eventKey: string): Key | null {
  if (/^\d$/.test(eventKey)) return eventKey as Digit;
  return KEY_MAP[eventKey] ?? null;
}
