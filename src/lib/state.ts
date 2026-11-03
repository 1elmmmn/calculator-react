/**
 * Состояние калькулятора: правила ввода. Чистый «редьюсер» без DOM и React:
 *   press(state, key) -> новое состояние (старое не изменяется)
 *   view(state)       -> что показывать на экране
 *
 * Выражение хранится строкой во внутреннем виде, например "12.5+3*2".
 */
import * as M from './math';
import type { CalcErrorCode } from './math';

export type Digit = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9';
export type Operator = '+' | '-' | '*' | '/';
export type Key = Digit | Operator | '.' | '%' | 'back' | 'clear' | 'equals';

export interface HistoryEntry {
  expr: string;
  result: number;
}

export interface CalcState {
  expr: string;
  result: number | null;
  done: boolean;
  error: CalcErrorCode | null;
  lastExpr: string;
  /** Запись для истории: появляется в момент нажатия «=». */
  entry: HistoryEntry | null;
}

export interface View {
  expression: string;
  main: string;
  error: boolean;
}

const MAX_DIGITS = 15; // цифр в одном числе

export const MESSAGES: Record<CalcErrorCode, string> = {
  div0: 'Деление на ноль невозможно',
  overflow: 'Слишком большое число',
  syntax: 'Некорректное выражение',
};

const isOp = (c: string): boolean => c !== '' && '+-*/'.includes(c);
const isDigit = (k: string): boolean => /^\d$/.test(k);

/** Начальное состояние. */
export function initial(): CalcState {
  return { expr: '', result: null, done: false, error: null, lastExpr: '', entry: null };
}

/** Состояние «на экране результат» — например, при выборе записи из истории. */
export function restore(value: number): CalcState {
  return { ...initial(), result: value, done: true };
}

/** Число, которое вводится сейчас (хвост из цифр и точки). */
function currentNumber(expr: string): string {
  return /[\d.]*$/.exec(expr)?.[0] ?? '';
}

export function press(state: CalcState, key: Key): CalcState {
  if (key === 'clear') return initial();
  if (state.error && key === 'back') return initial();

  let s = state.error ? initial() : state;

  if (s.done) {
    if (isDigit(key) || key === '.') s = initial(); // новое число — начинаем заново
    else if (isOp(key) || key === '%') s = { ...initial(), expr: M.toPlain(s.result ?? 0) }; // продолжаем с результата
    else return s; // back и повторное «=» ничего не делают
  }

  const expr = s.expr;
  const last = expr.slice(-1);

  if (isDigit(key)) {
    if (last === '%') return s;
    const num = currentNumber(expr);
    if (num === '0') return { ...s, expr: expr.slice(0, -1) + key }; // без ведущих нулей: 007
    if (num.replace('.', '').length >= MAX_DIGITS) return s;
    return { ...s, expr: expr + key };
  }

  if (key === '.') {
    if (last === '%') return s;
    const num = currentNumber(expr);
    if (num.includes('.')) return s; // вторая точка в числе
    return { ...s, expr: expr + (num === '' ? '0.' : '.') };
  }

  if (isOp(key)) {
    if (expr === '') return { ...s, expr: key === '-' ? '-' : '0' + key };
    if (expr === '-') return s;
    if (last === '.') return { ...s, expr: expr.slice(0, -1) + key };
    if (isOp(last)) return { ...s, expr: expr.slice(0, -1) + key }; // замена оператора
    return { ...s, expr: expr + key };
  }

  if (key === '%') {
    if (/\d$/.test(expr)) return { ...s, expr: expr + '%' };
    if (last === '.') return { ...s, expr: expr.slice(0, -1) + '%' };
    return s;
  }

  if (key === 'back') return { ...s, expr: expr.slice(0, -1) };

  if (key === 'equals') {
    let e = expr;
    while (isOp(e.slice(-1)) || e.slice(-1) === '.') e = e.slice(0, -1); // висящий оператор отбрасываем
    if (e === '') return s;
    try {
      const result = M.evaluate(e);
      return { expr: '', result, done: true, error: null, lastExpr: e, entry: { expr: e, result } };
    } catch (err) {
      return { ...initial(), error: err instanceof M.CalcError ? err.code : 'syntax', lastExpr: e };
    }
  }

  return s;
}

/** Последнее вводимое число для крупного экрана. */
function currentOperand(expr: string): string {
  const m = /(\d+\.?\d*|\.\d+)(%?)[+\-*/]?$/.exec(expr);
  if (!m) return expr === '-' ? M.MINUS : '0';
  const negative = expr.startsWith('-') && m.index === 1;
  return (negative ? M.MINUS : '') + M.formatNumberString(m[1] ?? '') + (m[2] ?? '');
}

/** Что показать: expression — мелкая строка, main — крупная. */
export function view(state: CalcState): View {
  if (state.error) {
    return { expression: MESSAGES[state.error], main: 'Ошибка', error: true };
  }
  if (state.done) {
    const expression = state.lastExpr ? M.formatExpression(state.lastExpr) + ' =' : '';
    return { expression, main: M.formatNumber(state.result ?? 0), error: false };
  }
  const hasOperation = /[+\-*/%]/.test(state.expr.replace(/^-/, ''));
  return {
    expression: hasOperation ? M.formatExpression(state.expr) : '',
    main: state.expr === '' ? '0' : currentOperand(state.expr),
    error: false,
  };
}

/** Что копировать в буфер: число без пробелов, с запятой. null — нечего копировать. */
export function copyText(state: CalcState): string | null {
  if (state.error) return null;
  if (state.done) return M.toPlain(state.result ?? 0).replace('.', ',');
  if (state.expr === '') return null;
  return view(state)
    .main.replace(/[\s%]/g, '')
    .replace(M.MINUS, '-');
}
