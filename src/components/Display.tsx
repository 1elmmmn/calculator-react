import { useEffect, useRef } from 'react';
import type { View } from '../lib/state';

interface Props {
  view: View;
  copied: boolean;
  onCopy: () => void;
}

/** Размер шрифта зависит от длины числа: длинные числа не вылезают за экран. */
function sizeFor(length: number): string {
  if (length <= 7) return '1';
  if (length <= 9) return '2';
  if (length <= 12) return '3';
  if (length <= 16) return '4';
  return '5';
}

export function Display({ view, copied, onCopy }: Props) {
  const expressionRef = useRef<HTMLParagraphElement>(null);

  // Длинное выражение: показываем его конец.
  useEffect(() => {
    const el = expressionRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [view.expression]);

  return (
    <div className="display">
      <button
        type="button"
        className={copied ? 'copy is-copied' : 'copy'}
        aria-label="Скопировать результат"
        title="Скопировать результат"
        onClick={onCopy}
      >
        <svg className="copy__icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <rect x="8.5" y="8.5" width="11" height="11" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M15.5 8.5v-1a2.5 2.5 0 0 0-2.5-2.5H7.5A2.5 2.5 0 0 0 5 7.5V13a2.5 2.5 0 0 0 2.5 2.5h1"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
        <svg className="copy__done" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <p id="expression" ref={expressionRef} className="display__expr">
        {view.expression}
      </p>
      <p id="main" className={view.error ? 'display__main is-error' : 'display__main'} data-size={sizeFor(view.main.length)}>
        {view.main}
      </p>
    </div>
  );
}
