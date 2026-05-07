/**
 * Client-side terrain generator — fractional Brownian motion (fBm) noise.
 * Replaces the broken fault-line algorithm.
 * Deterministic: same seed always produces the same world.
 */

export interface HexCell {
  col: number;
  row: number;
  terrainType: number;
  hex_x: number;
  hex_y: number;
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

// Terrain type constants
// 0=deep ocean, 1=shallow water, 2=coast, 3=beach,
// 4=grassland, 5=forest, 6=hills, 7=mountains, 8=high mountains, 9=ice

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

// ─── Hash-based smooth value noise ───────────────────────────────────────────
// Completely deterministic by (ix, iy, seed) — no PRNG state.

function hash2(ix: number, iy: number, seed: number): number {
  let h = ((seed * 2246822519) ^ (ix * 374761393) ^ (iy * 668265263)) >>> 0;
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 0x100000000;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function valueNoise(nx: number, ny: number, seed: number): number {
  const ix = Math.floor(nx), iy = Math.floor(ny);
  const fx = nx - ix, fy = ny - iy;
  const ux = smoothstep(fx), uy = smoothstep(fy);
  const v00 = hash2(ix,     iy,     seed);
  const v10 = hash2(ix + 1, iy,     seed);
  const v01 = hash2(ix,     iy + 1, seed);
  const v11 = hash2(ix + 1, iy + 1, seed);
  return v00 + (v10 - v00) * ux + (v01 - v00) * uy + (v00 - v10 - v01 + v11) * ux * uy;
}

// 5-octave fBm — gives organic, fractal-looking terrain
function fbm(nx: number, ny: number, seed: number): number {
  const v =
    1.000 * valueNoise(nx *  2, ny *  2, seed)       +
    0.500 * valueNoise(nx *  4, ny *  4, seed + 137) +
    0.250 * valueNoise(nx *  8, ny *  8, seed + 271) +
    0.125 * valueNoise(nx * 16, ny * 16, seed + 409) +
    0.062 * valueNoise(nx * 32, ny * 32, seed + 547);
  return v / 1.937; // sum of weights → normalise to ~[0,1]
}

// ─── Elevation → terrain type ─────────────────────────────────────────────────
// Thresholds are nine percentile boundary values (t[0]…t[8]):
//   t[0]: deep ocean → shallow water
//   t[1]: shallow water → coastline
//   t[2]: coastline → beach
//   t[3]: beach → grassland
//   t[4]: grassland → forest
//   t[5]: forest → hills
//   t[6]: hills → mountains
//   t[7]: mountains → high mountains
//   t[8]: anything at or above this → ice/snow

function elevationToType(elev: number, t: number[]): number {
  if (elev >= t[8]) return 9; // ice / snow
  if (elev < t[0])  return 0; // deep ocean
  if (elev < t[1])  return 1; // shallow water
  if (elev < t[2])  return 2; // coastline
  if (elev < t[3])  return 3; // beach
  if (elev < t[4])  return 4; // grassland
  if (elev < t[5])  return 5; // forest
  if (elev < t[6])  return 6; // hills
  if (elev < t[7])  return 7; // mountains
  return 8;                    // high mountains
}

// ─── Main generator ───────────────────────────────────────────────────────────

export function generateTerrain(seed: number, percentWater = 40, percentIce = 5): GeneratedTerrain {
  const HEX = 51;
  const elev = new Float32Array(HEX * HEX);

  // ── Continental shape generator ───────────────────────────────────────────
  // Strategy: domain-warped mid-frequency noise creates 2-4 organic landmasses.
  //  1. Two low-frequency value-noise layers warp the sampling coordinates —
  //     this bends the continental boundaries into irregular coastline shapes.
  //  2. A mid-frequency fBm sampled at the warped coords produces 2-4 high regions
  //     (continents) separated by low regions (oceans).
  //  3. Fine-detail fBm is blended in for local terrain variety (hills, bays, etc.).
  //  4. A soft edge fade reduces elevation near the map border so the world doesn't
  //     end abruptly (but is mild enough to allow coastal hexes anywhere).

  for (let col = 0; col < HEX; col++) {
    for (let row = 0; row < HEX; row++) {
      const nx = col / (HEX - 1); // [0..1]
      const ny = row / (HEX - 1);

      // Domain warp: offset the sample coords so continent outlines are jagged/organic
      const warpX = valueNoise(nx * 2.1, ny * 2.1, seed + 500) - 0.5; // [-0.5, 0.5]
      const warpY = valueNoise(nx * 2.1, ny * 2.1, seed + 501) - 0.5;

      // Mid-frequency fBm sampled at warped coords → 2–4 distinct landmasses
      // Frequency 2.5 means ~2.5 oscillations across the map width, giving ~2-4 peaks
      const cx = nx * 2.5 + warpX * 0.6;
      const cy = ny * 2.5 + warpY * 0.6;
      const continental = fbm(cx, cy, seed + 1000);

      // Fine detail fBm for local terrain variation (coastline roughness, mountains)
      const detail = fbm(nx, ny, seed);

      // Soft border fade: gently push map edges toward ocean without forcing a single central island.
      // Uses a squared smoothstep so edges are ocean-leaning but interior is unconstrained.
      const bx = Math.min(nx, 1 - nx) * 4; // 0 at edge → 1 at quarter-in → stays 1
      const by = Math.min(ny, 1 - ny) * 4;
      const border = Math.min(1, bx) * Math.min(1, by); // 0..1, 0 at corners
      const fade = Math.pow(border, 0.4);               // gentle: 0 at edges, ~1 inside

      elev[col * HEX + row] = (continental * 0.55 + detail * 0.45) * (0.6 + 0.4 * fade);
    }
  }

  // Build percentile-based thresholds so terrain variety is guaranteed
  // regardless of the actual fBm value range.
  const sorted = Array.from(elev).sort((a, b) => a - b);
  const n = sorted.length;
  const p = (frac: number) => sorted[Math.min(n - 1, Math.floor(frac * n))];

  const wF = percentWater / 100;   // fraction of hexes that are water (default 0.40)
  const iF = percentIce   / 100;   // fraction of hexes that are ice   (default 0.05)
  const lF = 1 - wF - iF;          // fraction of hexes that are land  (default 0.55)

  // Nine threshold values dividing the elevation range into 10 terrain bands.
  // Water subtypes occupy [0, wF):  deep=lower 50%, shallow=50-80%, coast=80-100%
  // Land subtypes occupy [wF, 1-iF): proportional slices of lF
  // Ice occupies [1-iF, 1]
  const thresholds: number[] = [
    p(wF * 0.50),              // [0] deep → shallow
    p(wF * 0.80),              // [1] shallow → coast
    p(wF),                     // [2] coast → beach
    p(wF + lF * 0.05),         // [3] beach → grassland  (~3% of hexes are beach)
    p(wF + lF * 0.28),         // [4] grassland → forest (~23% grassland)
    p(wF + lF * 0.52),         // [5] forest → hills     (~24% forest)
    p(wF + lF * 0.72),         // [6] hills → mountains  (~20% hills)
    p(wF + lF * 0.87),         // [7] mountains → highmtn(~15% mountains)
    p(1 - iF),                 // [8] highmtn → ice      ( ~8% high mtn, 5% ice)
  ];

  const hexGrid: Record<string, HexCell> = {};
  const stats: TerrainStats = {
    water: 0, grassland: 0, forest: 0, mountains: 0, ice: 0,
    totalHexes: 0, waterPercent: 0,
  };

  for (let col = 0; col < HEX; col++) {
    for (let row = 0; row < HEX; row++) {
      const e = elev[col * HEX + row];
      const t = elevationToType(e, thresholds);
      // hex_x / hex_y mirror col / row so both names work downstream
      hexGrid[`${col},${row}`] = { col, row, terrainType: t, hex_x: col, hex_y: row };
      stats.totalHexes++;
      if (t <= 2)      stats.water++;
      else if (t <= 4) stats.grassland++;
      else if (t <= 6) stats.forest++;
      else if (t <= 8) stats.mountains++;
      else             stats.ice++;
    }
  }

  stats.waterPercent = Math.round((stats.water / stats.totalHexes) * 100);
  return { hexGrid, stats, seed };
}

// ─── Location helpers ─────────────────────────────────────────────────────────

export function getViableLocations(hexGrid: Record<string, HexCell>): HexCell[] {
  return Object.values(hexGrid).filter(h => h.terrainType >= 4 && h.terrainType <= 6);
}

export function getLandLocations(hexGrid: Record<string, HexCell>): HexCell[] {
  return Object.values(hexGrid).filter(h => h.terrainType >= 3);
}
