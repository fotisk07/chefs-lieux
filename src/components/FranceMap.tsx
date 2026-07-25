import { useMemo } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import rawRegions from '../data/regions.json';
import type { FeatureCollection, Geometry } from 'geojson';
import type { DepartmentCollection } from '../types';

type RegionCollection = FeatureCollection<Geometry, { code: string; nom: string }>;
type MapPaths = {
  departments: Map<string, string | undefined>;
  regions: Array<{ code: string; path: string | undefined }>;
};

const regions = rawRegions as RegionCollection;

// Projecting the detailed GeoJSON is expensive. Share the generated SVG paths
// between the question and result maps instead of recalculating them each render.
const pathCache = new WeakMap<DepartmentCollection, MapPaths>();

function pathsFor(departments: DepartmentCollection): MapPaths {
  const cached = pathCache.get(departments);
  if (cached) return cached;

  const projection = geoMercator().fitExtent([[10, 8], [710, 642]], departments);
  const path = geoPath(projection);
  const paths = {
    departments: new Map(departments.features.map((feature) => [
      feature.properties.code,
      path(feature) ?? undefined,
    ])),
    regions: regions.features.map((feature) => ({
      code: feature.properties.code,
      path: path(feature) ?? undefined,
    })),
  };
  pathCache.set(departments, paths);
  return paths;
}

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
  const paths = useMemo(() => pathsFor(departments), [departments]);
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
            d={paths.departments.get(code)}
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
      <g className="region-borders" aria-hidden="true">
        {paths.regions.map((region) => <path key={region.code} d={region.path} />)}
      </g>
    </svg>
  );
}
