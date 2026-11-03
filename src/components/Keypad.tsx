import type { ReactNode } from 'react';
import type { Key } from '../lib/state';

interface KeyDef {
  key: Key;
  label: ReactNode;
  className?: string;
  aria?: string;
}

const BackIcon = (
  <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
    <path d="M9.5 5.5h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-9L3.5 12z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M12.5 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const KEYS: KeyDef[] = [
  { key: 'clear', label: 'AC', className: 'key--fn', aria: 'Очистить всё' },
  { key: 'back', label: BackIcon, className: 'key--fn', aria: 'Стереть последний символ' },
  { key: '%', label: '%', className: 'key--fn', aria: 'Процент' },
  { key: '/', label: '÷', className: 'key--op', aria: 'Разделить' },

  { key: '7', label: '7' },
  { key: '8', label: '8' },
  { key: '9', label: '9' },
  { key: '*', label: '×', className: 'key--op', aria: 'Умножить' },

  { key: '4', label: '4' },
  { key: '5', label: '5' },
  { key: '6', label: '6' },
  { key: '-', label: '−', className: 'key--op', aria: 'Минус' },

  { key: '1', label: '1' },
  { key: '2', label: '2' },
  { key: '3', label: '3' },
  { key: '+', label: '+', className: 'key--op', aria: 'Плюс' },

  { key: '0', label: '0', className: 'key--wide' },
  { key: '.', label: ',', aria: 'Десятичная запятая' },
  { key: 'equals', label: '=', className: 'key--op', aria: 'Равно' },
];

interface Props {
  flashed: Key | null;
  onPress: (key: Key) => void;
}

export function Keypad({ flashed, onPress }: Props) {
  return (
    <div className="keys" role="group" aria-label="Клавиши">
      {KEYS.map(({ key, label, className, aria }) => {
        const classes = ['key', className, flashed === key ? 'is-pressed' : ''].filter(Boolean).join(' ');
        return (
          <button
            key={key}
            type="button"
            className={classes}
            aria-label={aria}
            onClick={(event) => {
              onPress(key);
              // После клика мышью фокус не держим: иначе Enter повторит эту клавишу.
              if (event.detail > 0) event.currentTarget.blur();
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
