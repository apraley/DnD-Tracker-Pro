/**
 * World Generator — Plate Tectonic + Climate Model
 *
 * Pipeline:
 *  1. Random grid size (landscape aspect ratio, 100–180 wide)
 *  2. Voronoi plate assignment  → base elevation (oceanic vs continental)
 *  3. Plate-boundary analysis   → mountain ranges, trenches, mid-ocean ridges
 *  4. fBm detail noise          → coastline roughness, local relief
 *  5. Percentile thresholds     → guaranteed water/land split
 *  6. Moisture BFS from coast   → how far inland precipitation reaches
 *  7. Latitude climate bands    → tropical / temperate / polar zones
 *  8. Biome assignment          → elevation + moisture + latitude → terrain type
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface HexCell {
  col: number;
  row: number;
  terrainType: number;
  hex_x: number;
  hex_y: number;
}

export interface TerrainStats {
  water: number;
  grassland: number;   // grassland + savanna + desert + beach
  forest: number;      // tropical + temperate + boreal
  mountains: number;   // hills + mountains + high mountains
  ice: number;         // tundra + ice sheet
  totalHexes: number;
  waterPercent: number;
}

export interface GeneratedTerrain {
  hexGrid: Record<string, HexCell>;
  stats: TerrainStats;
  seed: number;
  width: number;
  height: number;
}

// ─── Terrain type constants ───────────────────────────────────────────────────
//  0  deep ocean        7  grassland
//  1  ocean             8  savanna
//  2  shallow water     9  desert
//  3  beach            10  hills
//  4  tropical forest  11  mountains
//  5  temperate forest 12  high mountains
//  6  boreal forest    13  tundra
//                      14  ice sheet

export const TERRAIN_COLORS: Record<number, string> = {
  0:  '#06184f',   // deep ocean
  1:  '#0e3d82',   // ocean
  2:  '#2472b8',   // shallow water
  3:  '#d4bc80',   // beach
  4:  '#1a5c1e',   // tropical forest
  5:  '#2e7d32',   // temperate forest
  6:  '#4a6741',   // boreal / taiga
  7:  '#7cbf3a',   // grassland
  8:  '#b8a435',   // savanna
  9:  '#c9a84c',   // desert
  10: '#8b7040',   // hills
  11: '#868674',   // mountains
  12: '#555555',   // high mountains
  13: '#8fa8a0',   // tundra
  14: '#cce8f0',   // ice sheet
};

export const TERRAIN_NAMES: Record<number, string> = {
  0: 'Deep Ocean', 1: 'Ocean', 2: 'Shallow Water', 3: 'Beach',
  4: 'Tropical Forest', 5: 'Temperate Forest', 6: 'Boreal Forest',
  7: 'Grassland', 8: 'Savanna', 9: 'Desert',
  10: 'Hills', 11: 'Mountains', 12: 'High Mountains',
  13: 'Tundra', 14: 'Ice Sheet',
};

// ─── Hash / noise primitives ──────────────────────────────────────────────────

function hash2(ix: number, iy: number, seed: number): number {
  let h = ((seed * 2246822519) ^ (ix * 374761393) ^ (iy * 668265263)) >>> 0;
  h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 0x100000000;
}

function smoothstep(t: number): number { return t * t * (3 - 2 * t); }

export function valueNoise(nx: number, ny: number, seed: number): number {
  const ix = Math.floor(nx), iy = Math.floor(ny);
  const fx = nx - ix,       fy = ny - iy;
  const ux = smoothstep(fx), uy = smoothstep(fy);
  const v00 = hash2(ix,     iy,     seed);
  const v10 = hash2(ix + 1, iy,     seed);
  const v01 = hash2(ix,     iy + 1, seed);
  const v11 = hash2(ix + 1, iy + 1, seed);
  return v00 + (v10 - v00) * ux + (v01 - v00) * uy + (v00 - v10 - v01 + v11) * ux * uy;
}

function fbm(nx: number, ny: number, seed: number): number {
  return (
    1.000 * valueNoise(nx *  2, ny *  2, seed)       +
    0.500 * valueNoise(nx *  4, ny *  4, seed + 137) +
    0.250 * valueNoise(nx *  8, ny *  8, seed + 271) +
    0.125 * valueNoise(nx * 16, ny * 16, seed + 409) +
    0.062 * valueNoise(nx * 32, ny * 32, seed + 547)
  ) / 1.937;
}

// Simple seeded LCG — used for plate placement so it's deterministic
function makeRng(seed: number) {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return () => {
    s = ((Math.imul(1664525, s) + 1013904223) >>> 0);
    return s / 0x100000000;
  };
}

// ─── Climate / terrain config system ─────────────────────────────────────────

export interface TerrainConfig {
  /** Percent of hexes that become water (clamped 10–70) */
  percentWater: number;
  /** >0 = more polar/ice (lat thresholds shift toward equator), <0 = less */
  polarBias: number;
  /** Added to moisture value; positive = wetter overall */
  moistureBias: number;
  /** Lat threshold for the tropical/subtropical boundary (default 0.18) */
  tropicalWidth: number;
  /** Fraction of tectonic plates that are oceanic (default 0.55) */
  oceanicBias: number;
  /** Added to base plate elevation; positive = more mountains overall */
  elevationBias: number;
}

/** Base config per Climate dropdown value */
const CLIMATE_CONFIGS: Record<string, TerrainConfig> = {
  'Temperate':            { percentWater: 40, polarBias:  0.00, moistureBias:  0.00, tropicalWidth: 0.18, oceanicBias: 0.55, elevationBias:  0.00 },
  'Tropical':             { percentWater: 55, polarBias: -0.22, moistureBias:  0.18, tropicalWidth: 0.32, oceanicBias: 0.65, elevationBias: -0.03 },
  'Arid':                 { percentWater: 22, polarBias: -0.10, moistureBias: -0.28, tropicalWidth: 0.12, oceanicBias: 0.35, elevationBias:  0.00 },
  'Cold':                 { percentWater: 38, polarBias:  0.20, moistureBias: -0.12, tropicalWidth: 0.12, oceanicBias: 0.50, elevationBias:  0.03 },
  'Eternal Spring':       { percentWater: 35, polarBias: -0.32, moistureBias:  0.12, tropicalWidth: 0.24, oceanicBias: 0.50, elevationBias:  0.00 },
  'Volatile':             { percentWater: 45, polarBias:  0.05, moistureBias:  0.00, tropicalWidth: 0.18, oceanicBias: 0.55, elevationBias:  0.12 },
  'Cursed':               { percentWater: 50, polarBias:  0.05, moistureBias: -0.05, tropicalWidth: 0.15, oceanicBias: 0.60, elevationBias:  0.05 },
  'Magically Stabilized': { percentWater: 38, polarBias: -0.05, moistureBias:  0.05, tropicalWidth: 0.20, oceanicBias: 0.50, elevationBias:  0.00 },
};

/** Per-terrain modifier layered on top of the climate base */
const TERRAIN_MODIFIERS: Record<string, Partial<TerrainConfig>> = {
  'Forest':    { percentWater:  0, polarBias:  0.00, moistureBias:  0.18, elevationBias: -0.03 },
  'Mountain':  { percentWater: -5, polarBias:  0.00, moistureBias: -0.05, elevationBias:  0.15 },
  'Plains':    { percentWater:  0, polarBias:  0.00, moistureBias:  0.00, elevationBias: -0.08 },
  'Desert':    { percentWater: -8, polarBias: -0.05, moistureBias: -0.22, elevationBias:  0.00 },
  'Swamp':     { percentWater:  5, polarBias:  0.00, moistureBias:  0.22, elevationBias: -0.05 },
  'Tundra':    { percentWater:  0, polarBias:  0.20, moistureBias: -0.18, elevationBias:  0.00 },
  'Coastline': { percentWater: 10, polarBias:  0.00, moistureBias:  0.10, elevationBias: -0.05, oceanicBias: 0.10 },
  'Hills':     { percentWater:  0, polarBias:  0.00, moistureBias: -0.05, elevationBias:  0.08 },
  'Valley':    { percentWater: -5, polarBias:  0.00, moistureBias:  0.05, elevationBias: -0.05 },
  'Badlands':  { percentWater: -8, polarBias:  0.00, moistureBias: -0.18, elevationBias:  0.05 },
  'Grassland': { percentWater:  0, polarBias:  0.00, moistureBias:  0.05, elevationBias: -0.05 },
  'Savanna':   { percentWater:  0, polarBias: -0.05, moistureBias: -0.05, elevationBias:  0.00 },
  'Mixed':     { percentWater:  0, polarBias:  0.00, moistureBias:  0.00, elevationBias:  0.00 },
};

export function buildTerrainConfig(climate: string, terrain: string): TerrainConfig {
  const base = CLIMATE_CONFIGS[climate] ?? CLIMATE_CONFIGS['Temperate'];
  const mod  = TERRAIN_MODIFIERS[terrain] ?? TERRAIN_MODIFIERS['Mixed'];
  return {
    percentWater:  Math.max(10, Math.min(70, base.percentWater  + (mod.percentWater  ?? 0))),
    polarBias:     base.polarBias     + (mod.polarBias     ?? 0),
    moistureBias:  base.moistureBias  + (mod.moistureBias  ?? 0),
    tropicalWidth: base.tropicalWidth + (mod.tropicalWidth ?? 0),
    oceanicBias:   Math.max(0.20, Math.min(0.85, base.oceanicBias + (mod.oceanicBias ?? 0))),
    elevationBias: base.elevationBias + (mod.elevationBias ?? 0),
  };
}

// ─── Main generator ───────────────────────────────────────────────────────────

export function generateTerrain(seed: number, climate = 'Temperate', terrain = 'Mixed'): GeneratedTerrain {
  const cfg = buildTerrainConfig(climate, terrain);
  const rng = makeRng(seed);

  // 1. ── Grid size (landscape, randomly chosen) ──────────────────────────────
  const WIDTHS = [100, 120, 140, 160, 180];
  const W = WIDTHS[Math.floor(rng() * WIDTHS.length)];
  const H = Math.round(W * 0.56);   // ~16:9 landscape

  // 2. ── Plate generation ────────────────────────────────────────────────────
  const numPlates = 8 + Math.floor(rng() * 5); // 8–12
  const plates = Array.from({ length: numPlates }, (_, id) => ({
    id,
    cx: rng() * W,
    cy: rng() * H,
    isOceanic: rng() < cfg.oceanicBias,
    driftX: (rng() - 0.5) * 2,
    driftY: (rng() - 0.5) * 2,
  }));

  // 3. ── Per-hex elevation from plate tectonics + fBm detail ─────────────────
  const elev    = new Float32Array(W * H);
  const plateOf = new Uint8Array(W * H);

  for (let col = 0; col < W; col++) {
    for (let row = 0; row < H; row++) {
      const idx = col * H + row;

      // Voronoi: nearest and second-nearest plate distances
      let d1 = Infinity, d2 = Infinity, p1 = 0, p2 = -1;
      for (let p = 0; p < numPlates; p++) {
        const dx = col - plates[p].cx, dy = row - plates[p].cy;
        const d  = dx * dx + dy * dy; // squared — fine for comparison
        if (d < d1) { d2 = d1; p2 = p1; d1 = d; p1 = p; }
        else if (d < d2) { d2 = d; p2 = p; }
      }
      plateOf[idx] = p1;

      // Base elevation from plate type (+ global elevation bias from config)
      const plate = plates[p1];
      let e = (plate.isOceanic ? 0.27 : 0.61) + cfg.elevationBias;

      // Boundary proximity (in actual hex units)
      const borderDist = (Math.sqrt(d2) - Math.sqrt(d1));
      const borderFactor = Math.max(0, 1 - borderDist / 9); // falls off over ~9 hexes

      if (borderFactor > 0 && p2 >= 0) {
        const nb = plates[p2];
        // Direction from plate center toward neighbour plate center
        const tx  = nb.cx - plate.cx, ty = nb.cy - plate.cy;
        const tLen = Math.sqrt(tx * tx + ty * ty) || 1;
        const tnx = tx / tLen, tny = ty / tLen;
        // Relative drift projected onto the boundary direction → convergence
        const conv = (plate.driftX - nb.driftX) * tnx + (plate.driftY - nb.driftY) * tny;

        if (!plate.isOceanic && !nb.isOceanic) {
          // Continental collision → tall mountain range
          if (conv > 0) e += borderFactor * conv * 0.50;
        } else if (!plate.isOceanic && nb.isOceanic) {
          // Subduction: volcanic arc on continental side
          if (conv > 0) e += borderFactor * conv * 0.35;
        } else if (plate.isOceanic && !nb.isOceanic) {
          // Subduction: trench on oceanic side
          if (conv > 0) e -= borderFactor * conv * 0.18;
        } else {
          // Oceanic–oceanic: mid-ocean ridge (subtle)
          e += borderFactor * 0.07;
        }
      }

      // fBm detail (domain-warped for organic coastlines)
      const nx = col / (W - 1), ny = row / (H - 1);
      const wx = valueNoise(nx * 2.5, ny * 2.5, seed + 500) - 0.5;
      const wy = valueNoise(nx * 2.5, ny * 2.5, seed + 501) - 0.5;
      const detail = fbm(nx * 3 + wx * 0.4, ny * 3 + wy * 0.4, seed);

      // Soft border fade so map edges are ocean-leaning (no abrupt clipping)
      const bx   = Math.min(col, W - 1 - col) / (W * 0.12);
      const by   = Math.min(row, H - 1 - row) / (H * 0.12);
      const fade = Math.pow(Math.min(1, bx) * Math.min(1, by), 0.5);

      elev[idx] = (e * 0.62 + detail * 0.38) * (0.55 + 0.45 * fade);
    }
  }

  // 4. ── Percentile thresholds → guaranteed water/land split ─────────────────
  const sorted = Array.from(elev).sort((a, b) => a - b);
  const n = sorted.length;
  const p = (f: number) => sorted[Math.min(n - 1, Math.floor(f * n))];

  const wF = cfg.percentWater / 100;
  const deepT    = p(wF * 0.40);
  const oceanT   = p(wF * 0.75);
  const shallowT = p(wF);

  // Land elevation band breakpoints (fraction of the land portion 0..1)
  const beachT   = p(wF + (1 - wF) * 0.04);
  const flatTopT = p(wF + (1 - wF) * 0.66);
  const hillT    = p(wF + (1 - wF) * 0.82);
  const mtnT     = p(wF + (1 - wF) * 0.93);

  // 5. ── Water type pass + water-distance BFS setup ──────────────────────────
  const isWater = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) {
    isWater[i] = elev[i] <= shallowT ? 1 : 0;
  }

  // BFS: distance from nearest water hex (Manhattan-ish via 4-connectivity)
  const coastDist = new Float32Array(W * H).fill(1e9);
  const queue: number[] = [];
  for (let col = 0; col < W; col++) {
    for (let row = 0; row < H; row++) {
      const idx = col * H + row;
      if (isWater[idx]) { coastDist[idx] = 0; queue.push(idx); }
    }
  }
  let qi = 0;
  while (qi < queue.length) {
    const idx = queue[qi++];
    const col = Math.floor(idx / H);
    const row = idx % H;
    const d   = coastDist[idx] + 1;
    for (const [dc, dr] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nc = col + dc, nr = row + dr;
      if (nc < 0 || nc >= W || nr < 0 || nr >= H) continue;
      const ni = nc * H + nr;
      if (coastDist[ni] > d) { coastDist[ni] = d; queue.push(ni); }
    }
  }

  let maxDist = 1;
  for (let i = 0; i < W * H; i++) if (coastDist[i] < 1e9 && coastDist[i] > maxDist) maxDist = coastDist[i];

  // 6. ── Biome assignment ────────────────────────────────────────────────────
  const hexGrid: Record<string, HexCell> = {};
  const stats: TerrainStats = {
    water: 0, grassland: 0, forest: 0, mountains: 0, ice: 0,
    totalHexes: 0, waterPercent: 0,
  };

  for (let col = 0; col < W; col++) {
    for (let row = 0; row < H; row++) {
      const idx = col * H + row;
      const e   = elev[idx];
      // lat: 0 = equator (map centre), 1 = polar (map top/bottom)
      const lat = Math.abs(row / (H - 1) - 0.5) * 2;
      // moisture: 1 = coastal, 0 = deep interior; scaled by latitude (tropics wetter)
      const rawMoist = 1 - Math.min(1, coastDist[idx] / (maxDist * 0.65));
      const latMoist = 1 - Math.max(0, (lat - 0.20) / 0.50); // tropics/temp wetter than poles
      const moisture = Math.max(0, Math.min(1,
        rawMoist * 0.65 + latMoist * 0.35 + cfg.moistureBias
      ));

      // ── Lat zone thresholds (all driven by polarBias + tropicalWidth) ────────
      // polarBias > 0 → thresholds shift lower → polar zones expand toward equator
      // polarBias < 0 → thresholds shift higher → polar zones shrink
      const pb = cfg.polarBias;
      const iceLatT    = Math.max(0.30, Math.min(0.92, 0.68 - pb * 0.85));
      const mtnLatT    = Math.max(0.35, Math.min(0.95, 0.72 - pb * 0.85));
      const hillLatT   = Math.max(0.40, Math.min(0.98, 0.78 - pb * 0.85));
      const arcticLatT = Math.max(0.45, Math.min(0.99, 0.83 - pb * 0.85));
      const borealLatT = iceLatT;  // boreal/tundra split matches ice threshold
      // Tropical band boundary (cfg.tropicalWidth default 0.18)
      const tropT  = cfg.tropicalWidth;
      const subT   = tropT + 0.20;  // subtropical starts 0.20 lat above tropical
      const tempT  = subT  + 0.30;  // temperate starts 0.30 lat above subtropical

      let t: number;

      if (e <= deepT)         { t = 0; }  // deep ocean
      else if (e <= oceanT)   { t = 1; }  // ocean
      else if (e <= shallowT) { t = 2; }  // shallow water
      else if (e <= beachT)   { t = 3; }  // beach
      else if (e >= mtnT) {
        // High elevation: glaciated peaks only near poles
        t = lat > iceLatT ? 14 : 12;
      } else if (e >= hillT) {
        t = lat > mtnLatT ? 13 : 11;
      } else if (e >= flatTopT) {
        t = lat > hillLatT ? 13 : 10;
      } else {
        // Flat land — latitude zone + moisture → biome
        if (lat > arcticLatT) {
          t = 13;  // arctic tundra
        } else if (lat > borealLatT) {
          t = moisture > 0.35 ? 6 : 13;  // boreal forest or tundra
        } else if (lat > tempT) {
          // Temperate band
          if (moisture > 0.55) t = 5;
          else if (moisture > 0.25) t = 7;
          else t = 9;
        } else if (lat > subT) {
          // Subtropical (dry belt)
          if (moisture > 0.52) t = 5;
          else if (moisture > 0.28) t = 8;
          else t = 9;
        } else {
          // Tropical band
          if (moisture > 0.48) t = 4;
          else if (moisture > 0.22) t = 8;
          else t = 9;
        }
      }

      hexGrid[`${col},${row}`] = { col, row, terrainType: t, hex_x: col, hex_y: row };
      stats.totalHexes++;

      if (t <= 2)               stats.water++;
      else if (t >= 4 && t <= 6) stats.forest++;
      else if (t >= 10 && t <= 12) stats.mountains++;
      else if (t >= 13)          stats.ice++;
      else                        stats.grassland++;  // 3 (beach), 7-9 (grass/sav/desert)
    }
  }

  stats.waterPercent = Math.round((stats.water / stats.totalHexes) * 100);
  return { hexGrid, stats, seed, width: W, height: H };
}

// ─── Location helpers ─────────────────────────────────────────────────────────

export function getViableLocations(hexGrid: Record<string, HexCell>): HexCell[] {
  // Cities prefer flat land: beach(3) through hills(10), excluding mountains/ice
  return Object.values(hexGrid).filter(h => h.terrainType >= 3 && h.terrainType <= 10);
}

export function getLandLocations(hexGrid: Record<string, HexCell>): HexCell[] {
  return Object.values(hexGrid).filter(h => h.terrainType >= 3);
}
