import { expect, test } from 'vitest';
import * as S from './state';
import type { Key } from './state';

const NB = '\u202f';
const MINUS = '\u2212';

/** Нажать клавиши подряд: run('1', '2', '+', '3', 'equals'). */
const run = (...keys: Key[]) => keys.reduce((state, key) => S.press(state, key), S.initial());
const digits = (str: string) => [...str] as Key[];

test('ввод чисел: ведущие нули, точка', () => {
  expect(run('0', '0', '7').expr).toBe('7');
  expect(run('0', '.', '5').expr).toBe('0.5');
  expect(run('.').expr).toBe('0.');
  expect(run('1', '.', '2', '.').expr).toBe('1.2');
  expect(run('1', '.', '5', '+', '2', '.', '5').expr).toBe('1.5+2.5');
});

test('ограничение длины числа', () => {
  const s = run(...digits('1234567890123456789'));
  expect(s.expr).toBe('123456789012345');
});

test('операторы: замена, ввод в пустом выражении', () => {
  expect(run('5', '+', '*').expr).toBe('5*');
  expect(run('+').expr).toBe('0+');
  expect(run('-').expr).toBe('-');
  expect(run('-', '5').expr).toBe('-5');
  expect(run('-', '*').expr).toBe('-');
  expect(run('5', '.', '+').expr).toBe('5+');
});

test('сложение и продолжение вычислений с результата', () => {
  const s = run('1', '2', '+', '3', 'equals');
  expect(s.done).toBe(true);
  expect(s.result).toBe(15);
  expect(s.entry).toEqual({ expr: '12+3', result: 15 });

  const next = run('2', '+', '2', 'equals', '*', '3', 'equals');
  expect(next.result).toBe(12);
});

test('цифра после результата начинает новое число', () => {
  const s = run('2', '+', '2', 'equals', '7');
  expect(s.done).toBe(false);
  expect(s.expr).toBe('7');
});

test('повторное «=» и «←» после результата ничего не меняют', () => {
  const s = run('2', '+', '2', 'equals');
  expect(S.press(s, 'equals')).toBe(s);
  expect(S.press(s, 'back')).toBe(s);
});

test('«=» с висящим оператором и пустое выражение', () => {
  expect(run('5', '+', 'equals').result).toBe(5);
  const empty = run('equals');
  expect(empty.done).toBe(false);
  expect(run('-', 'equals').done).toBe(false);
});

test('стирание последнего символа', () => {
  expect(run('1', '2', 'back').expr).toBe('1');
  expect(run('back').expr).toBe('');
});

test('проценты: ввод и вычисление', () => {
  expect(run(...digits('200'), '+', '1', '0', '%', 'equals').result).toBe(220);
  expect(run('+', '%').expr).toBe('0+');
  expect(run('5', '%', '7').expr).toBe('5%');
  expect(run('1', '0', '0', 'equals', '%').expr).toBe('100%');
  expect(run('1', '0', '0', 'equals', '%', 'equals').result).toBe(1);
});

test('ошибки: сообщение, восстановление', () => {
  const err = run('5', '/', '0', 'equals');
  expect(err.error).toBe('div0');
  const v = S.view(err);
  expect(v.main).toBe('Ошибка');
  expect(v.expression).toBe(S.MESSAGES.div0);
  expect(v.error).toBe(true);

  expect(S.press(err, '7').expr).toBe('7');
  expect(S.press(err, '7').error).toBe(null);
  expect(S.press(err, 'back').expr).toEqual('');
  expect(S.press(err, '+').expr).toBe('0+');
});

test('clear сбрасывает всё, даже после ошибки', () => {
  expect(run('5', '/', '0', 'equals', 'clear')).toEqual(S.initial());
  expect(run('1', '+', '2', 'clear')).toEqual(S.initial());
});

test('дробные результаты без шума', () => {
  const s = run('0', '.', '1', '+', '0', '.', '2', 'equals');
  expect(s.result).toBe(0.3);
  expect(S.press(s, '*').expr).toBe('0.3*');
});

test('состояние не изменяется на месте', () => {
  const s = Object.freeze(S.initial());
  expect(() => S.press(s, '1')).not.toThrow();
  expect(s.expr).toBe('');
});

test('view: пустой экран, ввод, результат', () => {
  expect(S.view(S.initial())).toEqual({ expression: '', main: '0', error: false });
  expect(S.view(run('1', '2', '3', '4'))).toEqual({ expression: '', main: `1${NB}234`, error: false });

  const typing = S.view(run('1', '2', '+', '3'));
  expect(typing.expression).toBe('12 + 3');
  expect(typing.main).toBe('3');

  const afterOp = S.view(run('1', '2', '+'));
  expect(afterOp.expression).toBe('12 +');
  expect(afterOp.main).toBe('12');

  const done = S.view(run('1', '2', '+', '3', 'equals'));
  expect(done.expression).toBe('12 + 3 =');
  expect(done.main).toBe('15');
});

test('view: отрицательные числа и проценты', () => {
  expect(S.view(run('-', '5')).main).toBe(`${MINUS}5`);
  expect(S.view(run('-', '5', '+')).expression).toBe(`${MINUS}5 +`);
  expect(S.view(run('5', '0', '%')).main).toBe('50%');
  expect(S.view(run('-')).main).toBe(MINUS);
});

test('restore: показать результат из истории', () => {
  const s = S.restore(1234.5);
  expect(S.view(s).main).toBe(`1${NB}234,5`);
  expect(S.press(s, '+').expr).toBe('1234.5+');
});

test('copyText: что уходит в буфер обмена', () => {
  expect(S.copyText(run('1', '2', '+', '3', 'equals'))).toBe('15');
  expect(S.copyText(S.restore(1234.5))).toBe('1234,5');
  expect(S.copyText(run('1', '2', '3', '4'))).toBe('1234');
  expect(S.copyText(S.initial())).toBe(null);
  expect(S.copyText(run('5', '/', '0', 'equals'))).toBe(null);
});
