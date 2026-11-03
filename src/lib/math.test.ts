import { expect, test } from 'vitest';
import * as M from './math';

const NB = '\u202f'; // узкий неразрывный пробел между разрядами
const MINUS = '\u2212';

const ev = (s: string) => M.evaluate(s);
const code = (s: string): string | null => {
  try {
    M.evaluate(s);
  } catch (e) {
    return e instanceof M.CalcError ? e.code : null;
  }
  return null;
};

test('приоритет операций и порядок слева направо', () => {
  expect(ev('2+3*4')).toBe(14);
  expect(ev('2*3+4*5')).toBe(26);
  expect(ev('10-4-3')).toBe(3);
  expect(ev('8/4/2')).toBe(1);
  expect(ev('7')).toBe(7);
});

test('дроби без шума двоичной арифметики', () => {
  expect(ev('0.1+0.2')).toBe(0.3);
  expect(ev('0.1*3')).toBe(0.3);
  expect(ev('1/3')).toBe(0.333333333333333);
  expect(ev('5.+1')).toBe(6);
  expect(ev('0.1+0.7')).toBe(0.8);
  expect(ev('1.1*1.1')).toBe(1.21);
  expect(ev('4.35*100')).toBe(435);
});

test('большие целые считаются точно', () => {
  expect(ev('999999999999*99')).toBe(98999999999901);
  expect(ev('123456789*1000')).toBe(123456789000);
});

test('унарный минус', () => {
  expect(ev('-5+3')).toBe(-2);
  expect(ev('5*-3')).toBe(-15);
  expect(ev('--5')).toBe(5);
  expect(ev('0-0')).toBe(0);
  expect(Object.is(ev('-0'), 0)).toBeTruthy();
});

test('проценты работают как на обычном калькуляторе', () => {
  expect(ev('50%')).toBe(0.5);
  expect(ev('200+10%')).toBe(220);
  expect(ev('200-10%')).toBe(180);
  expect(ev('200*10%')).toBe(20);
  expect(ev('50%+1')).toBe(1.5);
  expect(ev('100+10%+10%')).toBe(121);
});

test('ошибки: деление на ноль, синтаксис, переполнение', () => {
  expect(code('5/0')).toBe('div0');
  expect(code('0/0')).toBe('div0');
  expect(code('5+')).toBe('syntax');
  expect(code('')).toBe('syntax');
  expect(code('*5')).toBe('syntax');
  expect(code('%')).toBe('syntax');
  expect(code('1.2.3')).toBe('syntax');
  expect(code('1e5')).toBe('syntax');
  expect(code('alert(1)')).toBe('syntax');
  expect(code('999999999999999*999999999999999')).toBe('overflow');
});

test('toPlain: обычная запись без экспоненты', () => {
  expect(M.toPlain(0.1 + 0.2)).toBe('0.3');
  expect(M.toPlain(-0.5)).toBe('-0.5');
  expect(M.toPlain(1e21)).toBe('1000000000000000000000');
  expect(M.toPlain(1.5e-7)).toBe('0.00000015');
  expect(M.toPlain(0)).toBe('0');
});

test('formatNumber: разряды, запятая, минус, экспонента', () => {
  expect(M.formatNumber(0)).toBe('0');
  expect(M.formatNumber(999)).toBe('999');
  expect(M.formatNumber(1234567.5)).toBe(`1${NB}234${NB}567,5`);
  expect(M.formatNumber(-1234.5)).toBe(`${MINUS}1${NB}234,5`);
  expect(M.formatNumber(1 / 3)).toBe('0,333333333333333');
  expect(M.formatNumber(1e15)).toBe('1e15');
  expect(M.formatNumber(1.5e-10)).toBe('1,5e-10');
  expect(M.formatNumber(NaN)).toBe('Ошибка');
});

test('formatExpression: читаемая запись выражения', () => {
  expect(M.formatExpression('1000+5*2/4-1')).toBe(`1${NB}000 + 5 × 2 ÷ 4 ${MINUS} 1`);
  expect(M.formatExpression('-5+3')).toBe(`${MINUS}5 + 3`);
  expect(M.formatExpression('50%+10%')).toBe('50% + 10%');
  expect(M.formatExpression('5.')).toBe('5,');
  expect(M.formatExpression('12.50*2')).toBe('12,50 × 2');
});
