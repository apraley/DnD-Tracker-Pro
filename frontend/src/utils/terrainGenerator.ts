/**
 * Client-side fractal terrain generator
 * Ported from worldGenIntegration.js — runs entirely in the browser
 */

export interface HexCell {
  col: number;
  row: number;
  terrainType: number;
}

export interface TerrainStats {
  water: number;
  grassland: number;
  forest: number;
  mountains: number;
  ice: number;
  totalHexes: number;
  waterPercent: number;
}

export interface GeneratedTerrain {
  hexGrid: Record<string, HexCell>;
  stats: TerrainStats;
  seed: number;
}

// Terrain types: 0=deep ocean, 1=shallow water, 2=coast, 3=beach,
//               4=grassland, 5=forest, 6=hills, 7=mountains, 8=high mountains, 9=ice
export const TERRAIN_COLORS: Record<number, string> = {
  0: '#0a2d6e',
  1: '#1a5ca8',
  2: '#2e7fcc',
  3: '#c2a06e',
  4: '#6abf47',
  5: '#2d8a3e',
  6: '#8b6914',
  7: '#7d7d7d',
  8: '#4a4a4a',
  9: '#ddf0f7',
};

export const TERRAIN_NAMES: Record<number, string> = {
  0: 'Deep Ocean', 1: 'Shallow Water', 2: 'Coastline', 3: 'Beach',
  4: 'Grassland', 5: 'Forest', 6: 'Hills', 7: 'Mountains',
  8: 'High Mountains', 9: 'Ice/Snow',
};

function seedRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function generateFractalTerrain(
  width: number, height: number, seed: number, faults: number
): number[] {
  const rng = seedRandom(seed);
  const terrain = new Array(width * height).fill(0);

  for (let f = 0; f < faults; f++) {
    const alpha = (rng() - 0.5) * Math.PI;
    const beta = (rng() - 0.5) * Math.PI;
    const tanBeta = Math.tan(Math.acos(Math.cos(alpha) * Math.cos(beta)));
    const xsi = Math.floor(width / 2 - (width / Math.PI) * beta);
    const flag = rng() > 0.5;

    for (let phi = 0; phi < width / 2; phi++) {
      const theta = Math.floor(
        (height / Math.PI) *
          Math.atan(
            Math.sin((((xsi - phi + width) % width) * Math.PI * 2) / width) * tanBeta
          ) +
          height / 2
      );
      if (theta >= 0 && theta < height) {
        const idx = phi * height + theta;
        if (idx >= 0 && idx < width * height) {
          terrain[idx] += flag ? 1 : -1;
        }
      }
    }
  }

  // Normalize to 0-1
  let min = Infinity, max = -Infinity;
  for (const v of terrain) {
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min || 1;
  return terrain.map(v => (v - min) / range);
}

function elevationToType(elev: number, waterThresh: number, iceThresh: number): number {
  if (elev < waterThresh - 0.2) return 0;
  if (elev < waterThresh - 0.1) return 1;
  if (elev < waterThresh)       return 2;
  if (elev < waterThresh + 0.1) return 3;
  if (elev < waterThresh + 0.3) return 4;
  if (elev < waterThresh + 0.5) return 5;
  if (elev < waterThresh + 0.7) return 6;
  if (elev >= iceThresh)        return 9;
  if (elev < waterThresh + 0.85) return 7;
  return 8;
}

export function generateTerrain(seed: number, percentWater = 40, percentIce = 5): GeneratedTerrain {
  const W = 320, H = 160, HEX = 51;
  const elevation = generateFractalTerrain(W, H, seed, 70);

  const sorted = [...elevation].sort((a, b) => a - b);
  const waterThresh = sorted[Math.floor((percentWater / 100) * sorted.length)];
  const iceThresh   = sorted[Math.floor(((100 - percentIce) / 100) * sorted.length)];

  const scaleX = W / HEX, scaleY = H / HEX;
  const hexGrid: Record<string, HexCell> = {};
  const stats: TerrainStats = { water: 0, grassland: 0, forest: 0, mountains: 0, ice: 0, totalHexes: 0, waterPercent: 0 };

  for (let col = 0; col < HEX; col++) {
    for (let row = 0; row < HEX; row++) {
      const tx = Math.floor(col * scaleX);
      const ty = Math.floor(row * scaleY);
      const idx = tx * H + ty;
      const t = elevationToType(elevation[idx] ?? 0, waterThresh, iceThresh);
      hexGrid[`${col},${row}`] = { col, row, terrainType: t };
      stats.totalHexes++;
      if (t <= 2) stats.water++;
      else if (t <= 4) stats.grassland++;
      else if (t <= 6) stats.forest++;
      else if (t <= 8) stats.mountains++;
      else stats.ice++;
    }
  }
  stats.waterPercent = Math.round((stats.water / stats.totalHexes) * 100);
  return { hexGrid, stats, seed };
}

export function getViableLocations(hexGrid: Record<string, HexCell>) {
  return Object.values(hexGrid).filter(h => h.terrainType >= 4 && h.terrainType <= 6);
}

export function getLandLocations(hexGrid: Record<string, HexCell>) {
  return Object.values(hexGrid).filter(h => h.terrainType >= 3);
}
