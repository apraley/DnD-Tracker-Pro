/**
 * Advanced City Map Generator
 *
 * Creates organic, terrain-aware city layouts with:
 * - Varied shapes based on surrounding terrain
 * - Environmental features (rivers, water, forests)
 * - Multiple generation strategies for infinite variety
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
  districtIndex: number; // -1=outside, -2=wall, -3=water, -4=terrain
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
  terrainType?: number;
}

function makeRng(seed: string) {
  let h = (fnv1a(seed)) >>> 0;
  return () => { h = ((Math.imul(1664525, h) + 1013904223) >>> 0); return h / 0x100000000; };
}

export function generateCityMap(
  cityId: string,
  worldSeed: string,
  districts: Array<{ name: string; character: string; establishments: unknown[] }>,
  terrainType?: number,
): CityMapLayout {
  const rng = makeRng(cityId + '|' + worldSeed + '|citymap');
  const W = 27, H = 21;
  const CX = W / 2, CY = H / 2;

  // Vary city radius and shape based on terrain type
  let CITY_R = 8.8, WALL_R = 8.1;
  let generationStrategy = 0;

  if (terrainType !== undefined) {
    // 0=deep ocean, 1=ocean, 2=shallow, 3=beach, 4=tropical forest, 5=temperate forest,
    // 6=boreal, 7=grassland, 8=savanna, 9=desert, 10=hills, 11=mountains, 12=high mountains,
    // 13=tundra, 14=ice sheet

    if (terrainType <= 2) {
      // Water/coastal cities - islands
      CITY_R = 7.5;
      WALL_R = 6.8;
      generationStrategy = 0; // Island clusters
    } else if (terrainType === 3) {
      // Beach city - sprawling
      CITY_R = 9.5;
      WALL_R = 8.8;
      generationStrategy = 1; // Sprawling linear
    } else if ([4, 5, 6].includes(terrainType)) {
      // Forest cities - compact, grown
      CITY_R = 8.0;
      WALL_R = 7.2;
      generationStrategy = 2; // Organic growth
    } else if (terrainType === 7 || terrainType === 8) {
      // Grassland/Savanna - spread out
      CITY_R = 9.2;
      WALL_R = 8.5;
      generationStrategy = 3; // Clustered settlements
    } else if (terrainType === 9) {
      // Desert - compact
      CITY_R = 7.8;
      WALL_R = 7.0;
      generationStrategy = 4; // Packed tight
    } else if ([10, 11, 12].includes(terrainType)) {
      // Mountains - very compact
      CITY_R = 7.2;
      WALL_R = 6.5;
      generationStrategy = 5; // Cliffside
    } else if ([13, 14].includes(terrainType)) {
      // Tundra/Ice - small, tight
      CITY_R = 7.0;
      WALL_R = 6.2;
      generationStrategy = 6; // Harsh compact
    }
  } else {
    generationStrategy = Math.floor(rng() * 7);
  }

  // Generate district seeds using the chosen strategy
  const seeds: DistrictSeed[] = [];

  if (generationStrategy === 0) {
    // Island clusters - multiple small groups
    const groupCount = Math.ceil(districts.length / 2);
    for (let g = 0; g < groupCount; g++) {
      const groupAngle = (g / groupCount) * Math.PI * 2;
      const groupDist = WALL_R * 0.5;
      const groupCX = CX + Math.cos(groupAngle) * groupDist;
      const groupCY = CY + Math.sin(groupAngle) * groupDist;

      const districtsInGroup = Math.ceil(districts.length / groupCount);
      for (let i = 0; i < districtsInGroup && g * districtsInGroup + i < districts.length; i++) {
        const idx = g * districtsInGroup + i;
        const angle = (i / Math.max(1, districtsInGroup - 1)) * Math.PI * 2 + rng() * 0.3;
        const r = rng() * 1.2;
        const col = Math.round(groupCX + Math.cos(angle) * r);
        const row = Math.round(groupCY + Math.sin(angle) * r * 0.85);

        const d = districts[idx];
        seeds.push({
          col: Math.max(2, Math.min(W - 2, col)),
          row: Math.max(2, Math.min(H - 2, row)),
          index: idx,
          name: d.name,
          character: d.character,
          color: DISTRICT_HEX_COLORS[d.character] ?? '#1a1a2a',
          labelColor: DISTRICT_LABEL_COLORS[d.character] ?? '#cccccc',
        });
      }
    }
  } else if (generationStrategy === 1) {
    // Linear sprawl (beach/river cities)
    const angleBase = rng() * Math.PI * 2;
    for (let i = 0; i < districts.length; i++) {
      const t = districts.length > 1 ? i / (districts.length - 1) : 0.5;
      const offset = (t - 0.5) * WALL_R * 1.3;
      const perpOffset = (rng() - 0.5) * WALL_R * 0.6;

      const col = Math.round(CX + Math.cos(angleBase) * offset + Math.sin(angleBase) * perpOffset);
      const row = Math.round(CY + Math.sin(angleBase) * offset + Math.cos(angleBase) * perpOffset * 0.85);

      seeds.push({
        col: Math.max(2, Math.min(W - 2, col)),
        row: Math.max(2, Math.min(H - 2, row)),
        index: i,
        name: districts[i].name,
        character: districts[i].character,
        color: DISTRICT_HEX_COLORS[districts[i].character] ?? '#1a1a2a',
        labelColor: DISTRICT_LABEL_COLORS[districts[i].character] ?? '#cccccc',
      });
    }
  } else if (generationStrategy === 2) {
    // Organic growth (forest cities)
    let curCol = CX, curRow = CY;
    for (let i = 0; i < districts.length; i++) {
      const angle = rng() * Math.PI * 2;
      const dist = 0.8 + rng() * 1.5;
      curCol += Math.cos(angle) * dist;
      curRow += Math.sin(angle) * dist * 0.85;

      // Keep in bounds
      curCol = Math.max(2, Math.min(W - 2, curCol));
      curRow = Math.max(2, Math.min(H - 2, curRow));

      seeds.push({
        col: Math.round(curCol),
        row: Math.round(curRow),
        index: i,
        name: districts[i].name,
        character: districts[i].character,
        color: DISTRICT_HEX_COLORS[districts[i].character] ?? '#1a1a2a',
        labelColor: DISTRICT_LABEL_COLORS[districts[i].character] ?? '#cccccc',
      });
    }
  } else if (generationStrategy === 3) {
    // Clustered settlements
    const clusterCount = Math.max(2, Math.floor(Math.sqrt(districts.length)));
    for (let i = 0; i < districts.length; i++) {
      const clusterIdx = i % clusterCount;
      const clusterAngle = (clusterIdx / clusterCount) * Math.PI * 2;
      const clusterDist = WALL_R * 0.6;
      const clusterCX = CX + Math.cos(clusterAngle) * clusterDist;
      const clusterCY = CY + Math.sin(clusterAngle) * clusterDist;

      const angle = rng() * Math.PI * 2;
      const r = rng() * 1.4;
      const col = Math.round(clusterCX + Math.cos(angle) * r);
      const row = Math.round(clusterCY + Math.sin(angle) * r * 0.85);

      seeds.push({
        col: Math.max(2, Math.min(W - 2, col)),
        row: Math.max(2, Math.min(H - 2, row)),
        index: i,
        name: districts[i].name,
        character: districts[i].character,
        color: DISTRICT_HEX_COLORS[districts[i].character] ?? '#1a1a2a',
        labelColor: DISTRICT_LABEL_COLORS[districts[i].character] ?? '#cccccc',
      });
    }
  } else if (generationStrategy === 4 || generationStrategy === 5 || generationStrategy === 6) {
    // Packed/compact cities (desert, mountain, tundra)
    const gridSize = Math.ceil(Math.sqrt(districts.length));
    const cellSize = (WALL_R * 1.8) / gridSize;
    for (let i = 0; i < districts.length; i++) {
      const gx = i % gridSize;
      const gy = Math.floor(i / gridSize);
      const baseX = CX - (gridSize * cellSize) / 2 + gx * cellSize;
      const baseY = CY - (gridSize * cellSize) / 2 + gy * cellSize;
      const jitter = (rng() - 0.5) * cellSize * 0.4;

      seeds.push({
        col: Math.round(baseX + jitter),
        row: Math.round(baseY + (rng() - 0.5) * cellSize * 0.3),
        index: i,
        name: districts[i].name,
        character: districts[i].character,
        color: DISTRICT_HEX_COLORS[districts[i].character] ?? '#1a1a2a',
        labelColor: DISTRICT_LABEL_COLORS[districts[i].character] ?? '#cccccc',
      });
    }
  }

  // Generate hexes with Voronoi assignment
  const hexes: CityHex[] = [];
  for (let col = 0; col < W; col++) {
    for (let row = 0; row < H; row++) {
      const dx = col - CX, dy = row - CY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > CITY_R) {
        // Outside city
        hexes.push({ col, row, districtIndex: -1, color: '#0a0a14', hasMarker: false, markerColor: '' });
      } else if (dist >= WALL_R) {
        // Wall/boundary
        hexes.push({ col, row, districtIndex: -2, color: '#6b5030', hasMarker: false, markerColor: '' });
      } else {
        // Find nearest district
        let nearestDist = Infinity, nearestIdx = 0;
        for (const s of seeds) {
          const d2 = (col - s.col) ** 2 + (row - s.row) ** 2;
          if (d2 < nearestDist) { nearestDist = d2; nearestIdx = s.index; }
        }

        const hasMarker = dist < WALL_R - 1 && rng() < 0.20;
        const markerColor = hasMarker ? EST_COLORS_LIST[Math.floor(rng() * EST_COLORS_LIST.length)] : '';

        hexes.push({
          col, row,
          districtIndex: nearestIdx,
          color: seeds[nearestIdx]?.color ?? '#1a1a2a',
          hasMarker,
          markerColor,
        });
      }
    }
  }

  return { hexes, seeds, width: W, height: H, cityRadius: CITY_R, terrainType };
}
