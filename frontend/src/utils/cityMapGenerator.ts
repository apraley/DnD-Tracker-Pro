/**
 * City Mini-Map Generator
 * Voronoi-seeded hex district layout with establishment markers.
 */
import { fnv1a } from './establishmentGenerator';

export const DISTRICT_HEX_COLORS: Record<string, string> = {
  merchant: '#7a5c00', slum: '#3d2314', dockside: '#0a3470',
  'wealthy-residential': '#14401a', religious: '#3d0a5c',
  military: '#6b0000', academic: '#0a3d25', industrial: '#2e180a',
  entertainment: '#7a2e00', arcane: '#0a1240', financial: '#6b4e00',
  'foreign-quarter': '#1a262b', mixed: '#12341a',
};

export const DISTRICT_LIGHT_COLORS: Record<string, string> = {
  merchant: '#b8860b', slum: '#5c3d2e', dockside: '#1565c0',
  'wealthy-residential': '#1b5e20', religious: '#6a1b9a',
  military: '#b71c1c', academic: '#1b5e20', industrial: '#4e342e',
  entertainment: '#e65100', arcane: '#1a237e', financial: '#c77700',
  'foreign-quarter': '#37474f', mixed: '#2e7d32',
};

export const DISTRICT_LABEL_COLORS: Record<string, string> = {
  merchant: '#ffd54f', slum: '#a1887f', dockside: '#64b5f6',
  'wealthy-residential': '#81c784', religious: '#ce93d8',
  military: '#ef9a9a', academic: '#80cbc4', industrial: '#bcaaa4',
  entertainment: '#ffb74d', arcane: '#9fa8da', financial: '#ffe082',
  'foreign-quarter': '#90a4ae', mixed: '#a5d6a7',
};

const EST_MARKER_COLORS: Record<string, string> = {
  tavern: '#e67e22', inn: '#27ae60', blacksmith: '#e74c3c',
  general_store: '#95a5a6', magic_shop: '#8e44ad', temple: '#f39c12',
  guildhall: '#2980b9', gambling_den: '#d35400', thieves_guild: '#555',
  apothecary: '#2ecc71', alchemist: '#9b59b6', library: '#2471a3',
};
const EST_COLORS_LIST = Object.values(EST_MARKER_COLORS);

export interface CityHex {
  col: number; row: number;
  districtIndex: number; // -1=outside, -2=wall
  color: string;
  hasMarker: boolean;
  markerColor: string;
}

export interface DistrictSeed {
  col: number; row: number;
  index: number; name: string; character: string;
  color: string; labelColor: string;
}

export interface CityMapLayout {
  hexes: CityHex[];
  seeds: DistrictSeed[];
  width: number; height: number;
  cityRadius: number;
}

function makeRng(seed: string) {
  let h = (fnv1a(seed)) >>> 0;
  return () => { h = ((Math.imul(1664525, h) + 1013904223) >>> 0); return h / 0x100000000; };
}

export function generateCityMap(
  cityId: string,
  worldSeed: string,
  districts: Array<{ name: string; character: string; establishments: unknown[] }>,
): CityMapLayout {
  const rng = makeRng(cityId + '|' + worldSeed + '|citymap');
  const W = 27, H = 21;
  const CX = W / 2, CY = H / 2;
  const CITY_R = 8.8, WALL_R = 8.1;

  // Generate random district seeds with more organic distribution
  const seeds: DistrictSeed[] = districts.map((d, i) => {
    // Use multiple placement strategies to create variety
    const placementType = Math.floor(rng() * 3);
    let col: number, row: number;

    if (placementType === 0) {
      // Random blob placement (most organic)
      const angle = rng() * Math.PI * 2;
      const r = rng() * WALL_R * 0.7;
      col = Math.round(CX + Math.cos(angle) * r);
      row = Math.round(CY + Math.sin(angle) * r * 0.85);
    } else if (placementType === 1) {
      // Clustered around center with some offset
      const offsetX = (rng() - 0.5) * WALL_R * 1.2;
      const offsetY = (rng() - 0.5) * WALL_R * 1.0;
      col = Math.round(CX + offsetX);
      row = Math.round(CY + offsetY);
    } else {
      // Grid-ish but rotated and jittered
      const gridSize = Math.ceil(Math.sqrt(districts.length));
      const gridX = i % gridSize;
      const gridY = Math.floor(i / gridSize);
      const baseX = CX - (gridSize * 2.5) / 2 + gridX * 2.5;
      const baseY = CY - (gridSize * 2.0) / 2 + gridY * 2.0;
      const jitterX = (rng() - 0.5) * 1.5;
      const jitterY = (rng() - 0.5) * 1.5;
      col = Math.round(baseX + jitterX);
      row = Math.round(baseY + jitterY);
    }

    // Clamp to valid area
    col = Math.max(2, Math.min(W - 2, col));
    row = Math.max(2, Math.min(H - 2, row));

    return {
      col, row,
      index: i, name: d.name, character: d.character,
      color: DISTRICT_HEX_COLORS[d.character] ?? '#1a1a2a',
      labelColor: DISTRICT_LABEL_COLORS[d.character] ?? '#cccccc',
    };
  });

  const hexes: CityHex[] = [];
  for (let col = 0; col < W; col++) {
    for (let row = 0; row < H; row++) {
      const dx = col - CX, dy = row - CY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > CITY_R) {
        hexes.push({ col, row, districtIndex: -1, color: '#0a0a14', hasMarker: false, markerColor: '' });
        continue;
      }
      if (dist >= WALL_R) {
        hexes.push({ col, row, districtIndex: -2, color: '#5a4020', hasMarker: false, markerColor: '' });
        continue;
      }
      let nearestDist = Infinity, nearestIdx = 0;
      for (const s of seeds) {
        const d2 = (col - s.col) ** 2 + (row - s.row) ** 2;
        if (d2 < nearestDist) { nearestDist = d2; nearestIdx = s.index; }
      }
      const hasMarker = dist < WALL_R - 1 && rng() < 0.20;
      const markerColor = hasMarker ? EST_COLORS_LIST[Math.floor(rng() * EST_COLORS_LIST.length)] : '';
      hexes.push({ col, row, districtIndex: nearestIdx, color: seeds[nearestIdx]?.color ?? '#1a1a2a', hasMarker, markerColor });
    }
  }
  return { hexes, seeds, width: W, height: H, cityRadius: CITY_R };
}
