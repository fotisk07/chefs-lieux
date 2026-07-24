import { useMemo } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import type { DepartmentCollection } from '../types';

export default function FranceMap({
  departments,
  interactive = false,
  targetCode,
  chosenCode,
  reveal = false,
  usedCodes = [],
  compact = false,
  onChoose,
}: {
  departments: DepartmentCollection;
  interactive?: boolean;
  targetCode?: string;
  chosenCode?: string;
  reveal?: boolean;
  usedCodes?: string[];
  compact?: boolean;
  onChoose?: (code: string) => void;
}) {
  const path = useMemo(() => {
    const projection = geoMercator().fitExtent([[24, 20], [696, 630]], departments);
    return geoPath(projection);
  }, [departments]);
  const used = useMemo(() => new Set(usedCodes), [usedCodes]);

  return (
    <svg
      className={`france-map${compact ? ' compact-map' : ''}`}
      viewBox="0 0 720 650"
      role="img"
      aria-label={interactive ? 'Blank clickable map of metropolitan France' : 'Map of metropolitan France'}
    >
      {departments.features.map((feature) => {
        const code = feature.properties.code;
        const isCorrect = reveal && code === targetCode;
        const isWrong = reveal && code === chosenCode && chosenCode !== targetCode;
        const isTarget = !interactive && !reveal && code === targetCode;
        const classes = [
          'department',
          interactive && !reveal ? 'clickable' : '',
          used.has(code) ? 'used' : '',
          isTarget ? 'target' : '',
          isCorrect ? 'correct' : '',
          isWrong ? 'wrong' : '',
        ].filter(Boolean).join(' ');
        return (
          <path
            key={code}
            d={path(feature) ?? undefined}
            className={classes}
            role={interactive && !reveal ? 'button' : undefined}
            tabIndex={interactive && !reveal ? 0 : undefined}
            aria-label={interactive && !reveal ? 'Choose this department' : undefined}
            onClick={() => interactive && !reveal && onChoose?.(code)}
            onKeyDown={(event) => {
              if (interactive && !reveal && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                onChoose?.(code);
              }
            }}
          />
        );
      })}
    </svg>
  );
}
