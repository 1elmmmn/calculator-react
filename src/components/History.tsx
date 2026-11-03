import { formatExpression, formatNumber } from '../lib/math';
import type { HistoryEntry } from '../lib/state';

interface Props {
  items: HistoryEntry[];
  onPick: (entry: HistoryEntry) => void;
  onClear: () => void;
}

export function History({ items, onPick, onClear }: Props) {
  return (
    <aside className="history" aria-labelledby="history-title">
      <div className="row">
        <h2 id="history-title">История</h2>
        {items.length > 0 && (
          <button type="button" className="link-btn" onClick={onClear}>
            Очистить
          </button>
        )}
      </div>
      {items.length === 0 && (
        <p className="muted">Здесь появятся ваши вычисления. Нажмите на запись, чтобы продолжить с её результата.</p>
      )}
      <ul className="history__list">
        {items.map((item) => {
          const expr = formatExpression(item.expr) + ' =';
          const result = formatNumber(item.result);
          return (
            <li key={item.expr + '=' + item.result}>
              <button type="button" aria-label={`Продолжить с результата ${result} (${expr})`} onClick={() => onPick(item)}>
                <span className="history__expr">{expr}</span>
                <span className="history__result">{result}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
