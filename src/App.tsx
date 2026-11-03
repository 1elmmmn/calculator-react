import { useCallback, useEffect, useState } from 'react';
import { Display } from './components/Display';
import { History } from './components/History';
import { Keypad } from './components/Keypad';
import { useHistory } from './hooks/useHistory';
import { useTransient } from './hooks/useTransient';
import { keyFromEvent } from './lib/keys';
import { copyText, initial, press as applyKey, restore, view } from './lib/state';
import type { CalcState, HistoryEntry, Key } from './lib/state';

export default function App() {
  const [state, setState] = useState<CalcState>(initial);
  const [announcement, setAnnouncement] = useState('');
  const [flashed, flash] = useTransient<Key>(110);
  const [copied, markCopied] = useTransient<true>(1400);
  const history = useHistory();

  const press = useCallback(
    (key: Key) => {
      const next = applyKey(state, key);
      if (next === state) return;
      setState(next);
      if (next.entry && next.entry !== state.entry) history.add(next.entry);
      if (key === 'equals') {
        const v = view(next);
        setAnnouncement(next.error ? v.expression : `Результат: ${v.main}`);
      }
    },
    [state, history],
  );

  // Ввод с клавиатуры: нажатая клавиша подсвечивается и на экране.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      // Enter и пробел на сфокусированной кнопке выполняют саму кнопку.
      const target = event.target;
      if (target instanceof Element && target.closest('button') && (event.key === 'Enter' || event.key === ' ')) return;
      const key = keyFromEvent(event.key);
      if (!key) return;
      event.preventDefault();
      flash(key);
      press(key);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [press, flash]);

  const copy = async () => {
    const text = copyText(state);
    if (text === null) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return; // буфер недоступен (например, файл открыт без https): молча ничего не делаем
    }
    markCopied(true);
    setAnnouncement(`Скопировано: ${text}`);
  };

  const pick = (entry: HistoryEntry) => setState(restore(entry.result));

  return (
    <>
      <main className="page">
        <header className="intro">
          <h1>Калькулятор</h1>
          <p className="lede">
            Работает и мышью, и с клавиатуры: цифры, <kbd>+</kbd> <kbd>-</kbd> <kbd>*</kbd> <kbd>/</kbd> <kbd>%</kbd>,{' '}
            <kbd>Enter</kbd>, <kbd>Backspace</kbd> и <kbd>Esc</kbd>.
          </p>
        </header>

        <div className="layout">
          <section className="calc" aria-label="Калькулятор">
            <Display view={view(state)} copied={copied !== null} onCopy={copy} />
            <p id="announce" className="sr-only" role="status">
              {announcement}
            </p>
            <Keypad flashed={flashed} onPress={press} />
          </section>

          <History items={history.items} onPick={pick} onClear={history.clear} />
        </div>
      </main>

      <footer className="foot">
        Вычисления выполняет собственный разбор выражений: <code>eval()</code> не используется. Интерфейс написан на React и
        TypeScript.
      </footer>
    </>
  );
}
