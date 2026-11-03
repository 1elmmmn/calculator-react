import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';

const main = () => document.getElementById('main')?.textContent;
const expression = () => document.getElementById('expression')?.textContent;
const button = (name: string) => screen.getByRole('button', { name });

describe('App', () => {
  it('считает по кнопкам: 12 + 3 = 15', async () => {
    const user = userEvent.setup();
    render(<App />);

    for (const name of ['1', '2', 'Плюс', '3', 'Равно']) await user.click(button(name));

    expect(main()).toBe('15');
    expect(expression()).toBe('12 + 3 =');
  });

  it('принимает ввод с клавиатуры и подсвечивает нажатую клавишу', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.keyboard('7');
    expect(button('7')).toHaveClass('is-pressed');

    await user.keyboard('{Escape}2+3*4{Enter}');
    expect(main()).toBe('14');
  });

  it('считает проценты как обычный калькулятор', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.keyboard('200+10%{Enter}');
    expect(main()).toBe('220');
  });

  it('показывает понятную ошибку при делении на ноль и восстанавливается', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.keyboard('5/0{Enter}');
    expect(main()).toBe('Ошибка');
    expect(expression()).toBe('Деление на ноль невозможно');
    expect(screen.getByRole('status')).toHaveTextContent('Деление на ноль невозможно');

    await user.keyboard('7');
    expect(main()).toBe('7');
  });

  it('объявляет результат для скринридеров', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.keyboard('12+3{Enter}');
    expect(screen.getByRole('status')).toHaveTextContent('Результат: 15');
  });

  it('игнорирует посторонние клавиши', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.keyboard('abc');
    expect(main()).toBe('0');
  });

  it('сохраняет историю, продолжает с записи и очищается', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText(/Здесь появятся ваши вычисления/)).toBeInTheDocument();

    await user.keyboard('2+2{Enter}');
    const entry = screen.getByRole('button', { name: /Продолжить с результата 4/ });
    expect(JSON.parse(localStorage.getItem('calculator:history') ?? '[]')).toEqual([{ expr: '2+2', result: 4 }]);

    await user.click(button('Очистить всё'));
    expect(main()).toBe('0');

    await user.click(entry);
    expect(main()).toBe('4');

    await user.click(screen.getByRole('button', { name: 'Очистить' }));
    expect(screen.queryByRole('button', { name: /Продолжить с результата/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Здесь появятся ваши вычисления/)).toBeInTheDocument();
  });

  it('подхватывает историю из localStorage и отбрасывает мусор', () => {
    localStorage.setItem(
      'calculator:history',
      JSON.stringify([{ expr: '1+1', result: 2 }, { expr: 5, result: 'x' }, null, 'строка']),
    );
    render(<App />);

    expect(screen.getAllByRole('button', { name: /Продолжить с результата/ })).toHaveLength(1);
  });

  it('копирует результат в буфер обмена', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.keyboard('1000+5{Enter}');
    await user.click(button('Скопировать результат'));

    expect(await navigator.clipboard.readText()).toBe('1005');
    expect(button('Скопировать результат')).toHaveClass('is-copied');
  });
});
