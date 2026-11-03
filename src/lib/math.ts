/**
 * Математика калькулятора: разбор и вычисление выражений без eval().
 * Чистые функции без DOM и React, поэтому их легко тестировать.
 *
 * Грамматика (операторы внутри выражения: + - * / %):
 *   выражение := слагаемое (('+' | '-') слагаемое)*
 *   слагаемое := множитель (('*' | '/') множитель)*
 *   множитель := '-'* число '%'*
 *
 * Процент работает как в обычных калькуляторах:
 *   50%       = 0,5
 *   200 + 10% = 220   (10% от 200 прибавляется к 200)
 *   200 × 10% = 20
 */

export type CalcErrorCode = 'syntax' | 'div0' | 'overflow';

/** Ошибка вычисления. */
export class CalcError extends Error {
  readonly code: CalcErrorCode;

  constructor(code: CalcErrorCode) {
    super(code);
    this.name = 'CalcError';
    this.code = code;
  }
}

const LIMIT = 1e21; // по модулю больше — переполнение
const NNBSP = ' '; // узкий неразрывный пробел для разрядов
export const MINUS = '−';

/**
 * Округление до 15 значащих цифр. Убирает «шум» двоичных дробей:
 * 0.1 + 0.2 = 0.30000000000000004 -> 0.3.
 * 15 цифр (а не меньше), чтобы целые числа до 10^15 оставались точными.
 */
function round(x: number): number {
  const r = Number(x.toPrecision(15));
  return r === 0 ? 0 : r; // заодно убираем -0
}

function check(x: number): number {
  if (!Number.isFinite(x) || Math.abs(x) >= LIMIT) throw new CalcError('overflow');
  return round(x);
}

type Token = { type: 'num'; value: number } | { type: 'op'; value: string };

export function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  const re = /\s*(?:(\d+\.?\d*|\.\d+)|([+\-*/%]))/y;
  let pos = 0;
  while (pos < expr.length) {
    re.lastIndex = pos;
    const m = re.exec(expr);
    if (!m) throw new CalcError('syntax');
    const [, num, op] = m;
    tokens.push(num !== undefined ? { type: 'num', value: Number(num) } : { type: 'op', value: op ?? '' });
    pos = re.lastIndex;
  }
  return tokens;
}

interface Operand {
  value: number;
  percent: boolean;
}

/** Вычисляет выражение вида "12.5+3*2%". Бросает CalcError. */
export function evaluate(expr: string): number {
  const tokens = tokenize(expr);
  let i = 0;

  const isOp = (...ops: string[]): boolean => {
    const t = tokens[i];
    return t !== undefined && t.type === 'op' && ops.includes(t.value);
  };

  const nextOp = (): string => {
    const t = tokens[i++];
    if (t === undefined || t.type !== 'op') throw new CalcError('syntax');
    return t.value;
  };

  function factor(): Operand {
    let sign = 1;
    while (isOp('-')) {
      sign = -sign;
      i++;
    }
    const t = tokens[i];
    if (t === undefined || t.type !== 'num') throw new CalcError('syntax');
    i++;
    let value = t.value;
    let percent = false;
    while (isOp('%')) {
      value /= 100;
      percent = true;
      i++;
    }
    return { value: sign * value, percent };
  }

  function term(): Operand {
    const first = factor();
    let value = first.value;
    let lonePercent = first.percent; // слагаемое состоит только из «число%»
    while (isOp('*', '/')) {
      const op = nextOp();
      const right = factor().value;
      lonePercent = false;
      if (op === '/') {
        if (right === 0) throw new CalcError('div0');
        value = check(value / right);
      } else {
        value = check(value * right);
      }
    }
    return { value, percent: lonePercent };
  }

  let acc = term().value;
  while (isOp('+', '-')) {
    const op = nextOp();
    const right = term();
    // «200 + 10%» — это 10% от 200, а не 0,1
    const operand = right.percent ? acc * right.value : right.value;
    acc = check(op === '+' ? acc + operand : acc - operand);
  }
  if (i < tokens.length) throw new CalcError('syntax');
  return check(acc);
}

/* ---------- форматирование ---------- */

/** "1e+21" / "1.5e-7" -> обычная десятичная запись, чтобы результат можно было продолжить вычислять. */
function expandExponent(s: string): string {
  const m = /^(-?)(\d+)(?:\.(\d+))?e([+-]\d+)$/.exec(s);
  if (!m) return s;
  const [, sign = '', int = '', frac = '', exp = '0'] = m;
  const digits = int + frac;
  const point = int.length + Number(exp);
  if (point <= 0) return sign + '0.' + '0'.repeat(-point) + digits;
  if (point >= digits.length) return sign + digits + '0'.repeat(point - digits.length);
  return sign + digits.slice(0, point) + '.' + digits.slice(point);
}

/** Число -> строка с точкой, которую понимает evaluate(). */
export function toPlain(n: number): string {
  return expandExponent(String(round(n)));
}

/** "1234567.50" -> "1 234 567,50" (строка с точкой на входе). */
export function formatNumberString(str: string): string {
  const [intPart = '', frac] = str.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, NNBSP);
  return frac !== undefined ? grouped + ',' + frac : grouped;
}

/** Число -> строка для экрана: группы по 3 цифры, запятая, длинные числа в экспоненте. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return 'Ошибка';
  const n = round(value);
  const abs = Math.abs(n);
  const sign = n < 0 ? MINUS : '';
  if (abs >= 1e15 || (abs !== 0 && abs < 1e-9)) {
    const exp = Number(abs.toPrecision(10)).toExponential().replace('e+', 'e');
    return sign + exp.replace('.', ',');
  }
  return sign + formatNumberString(toPlain(abs));
}

const OPERATORS: Record<string, string> = {
  '+': ' + ',
  '-': ' ' + MINUS + ' ',
  '*': ' × ',
  '/': ' ÷ ',
  '%': '%',
};

/** Внутреннее выражение "1000+5*2" -> "1 000 + 5 × 2". */
export function formatExpression(expr: string): string {
  return expr
    .replace(/\d+\.?\d*|\.\d+|[+\-*/%]/g, (t, offset: number) => {
      if (t === '-' && offset === 0) return MINUS; // унарный минус в начале
      return OPERATORS[t] ?? formatNumberString(t);
    })
    .trim();
}
