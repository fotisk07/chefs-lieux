import { useMemo, useState } from 'react';
import { normalize } from '../game/game';

export default function CapitalPicker({ capitals, onChoose, disabled }: {
  capitals: string[];
  onChoose: (capital: string) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState('');
  const choices = useMemo(() => {
    const needle = normalize(query);
    return capitals
      .filter((capital) => !needle || normalize(capital).includes(needle))
      .sort((a, b) => {
        const aStarts = normalize(a).startsWith(needle) ? 0 : 1;
        const bStarts = normalize(b).startsWith(needle) ? 0 : 1;
        return aStarts - bStarts || a.localeCompare(b, 'fr');
      })
      .slice(0, 8);
  }, [capitals, query]);

  return (
    <div className="capital-picker">
      <label htmlFor="capital-search">Type to find a chef-lieu</label>
      <input
        id="capital-search"
        autoFocus
        autoComplete="off"
        disabled={disabled}
        placeholder="e.g. Bordeaux"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="choices" role="listbox" aria-label="Chefs-lieux">
        {choices.map((capital) => (
          <button key={capital} type="button" role="option" onClick={() => onChoose(capital)} disabled={disabled}>
            {capital}
          </button>
        ))}
        {choices.length === 0 && <p className="muted">No matching chef-lieu</p>}
      </div>
    </div>
  );
}
