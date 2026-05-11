/**
 * World Generation Integration
 * Generates realistic fantasy worlds using procedural fractal terrain generation
 * Emscripten-based wrapper for the donjon world generator
 */

/**
 * Fractal world parameters
 */
class WorldGenConfig {
  constructor(options = {}) {
    this.seed = options.seed || Math.floor(Math.random() * 1000000);
    this.numberOfFaults = options.numberOfFaults || 50; // iterations
    this.percentWater = options.percentWater || 30;     // 0-100
    this.percentIce = options.percentIce || 5;          // 0-100
    this.width = options.width || 320;
    this.height = options.height || 160;
  }
}

/**
 * Simplified fractal world generator (procedural terrain)
 * Uses fault-line simulation to create realistic coastlines and terrain
 * Based on the algorithm from John Olsson's worldgen.c
 */
function generateFractalTerrain(config) {
  const { width, height, seed, numberOfFaults, percentWater } = config;

  // Set random seed for reproducibility
  let random = seedRandom(seed);

  // Initialize terrain array - single dimension for width * height
  const terrain = new Array(width * height);
  for (let i = 0; i < width * height; i++) {
    terrain[i] = 0;
  }

  // Apply fault-line simulation
  for (let fault = 0; fault < numberOfFaults; fault++) {
    // Generate random great circle
    // Alpha and Beta define rotation angles
    const alpha = (random() - 0.5) * Math.PI;
    const beta = (random() - 0.5) * Math.PI;

    const tanBeta = Math.tan(Math.acos(Math.cos(alpha) * Math.cos(beta)));
    const xsi = Math.floor(width / 2 - (width / Math.PI) * beta);

    // Apply elevation changes along the great circle
    const flag = random() > 0.5;

    for (let phi = 0; phi < width / 2; phi++) {
      const theta = Math.floor(
        (height / Math.PI) * Math.atan(Math.sin((xsi - phi + width) % width * Math.PI * 2 / width) * tanBeta) +
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

  // Normalize terrain values
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < terrain.length; i++) {
    if (terrain[i] < min) min = terrain[i];
    if (terrain[i] > max) max = terrain[i];
  }

  const range = max - min || 1;
  for (let i = 0; i < terrain.length; i++) {
    terrain[i] = (terrain[i] - min) / range;
  }

  return terrain;
}

/**
 * Seeded random number generator for reproducibility
 */
function seedRandom(seed) {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

/**
 * Convert elevation data to terrain types
 * Returns: 0=deep water, 1=shallow water, 2=coast, 3=beach,
 *          4=grassland, 5=forest, 6=hills, 7=mountains, 8=high mountains, 9=ice/snow
 */
function elevationToTerrainType(elevation, waterThreshold, iceThreshold) {
  if (elevation < waterThreshold - 0.2) return 0; // deep water (blue)
  if (elevation < waterThreshold - 0.1) return 1; // shallow water (cyan)
  if (elevation < waterThreshold) return 2; // coast/transition (light blue)
  if (elevation < waterThreshold + 0.1) return 3; // beach (tan)
  if (elevation < waterThreshold + 0.3) return 4; // grassland (light green)
  if (elevation < waterThreshold + 0.5) return 5; // forest (dark green)
  if (elevation < waterThreshold + 0.7) return 6; // hills (brown)
  if (elevation < waterThreshold + 0.85) return 7; // mountains (gray)
  if (elevation >= iceThreshold) return 9; // ice/snow (white)
  return 8; // high mountains (dark gray)
}

/**
 * Generate a complete fantasy world with realistic terrain data
 */
function generateFantasyWorld(config) {
  const genConfig = new WorldGenConfig(config);

  // Generate elevation data using fractal algorithm
  const elevation = generateFractalTerrain(genConfig);

  // Calculate water/land threshold based on desired percentages
  const sorted = [...elevation].sort((a, b) => a - b);
  const waterIndex = Math.floor((genConfig.percentWater / 100) * sorted.length);
  const waterThreshold = sorted[waterIndex];

  const iceIndex = Math.floor(((100 - genConfig.percentIce) / 100) * sorted.length);
  const iceThreshold = sorted[iceIndex];

  // Convert elevation to terrain types
  const terrainTypes = elevation.map(elev =>
    elevationToTerrainType(elev, waterThreshold, iceThreshold)
  );

  // Generate hex grid from terrain (convert to 51x51 hex grid)
  const hexGrid = terrainToHexGrid(terrainTypes, genConfig.width, genConfig.height);

  return {
    config: genConfig,
    elevation: elevation,
    terrain: terrainTypes,
    hexGrid: hexGrid,
    waterThreshold: waterThreshold,
    iceThreshold: iceThreshold,
    stats: calculateWorldStats(terrainTypes, hexGrid),
  };
}

/**
 * Convert rectangular terrain to hex grid format
 * Maps terrain data to 51x51 hex coordinate system
 */
function terrainToHexGrid(terrain, terrainWidth, terrainHeight) {
  const hexSize = 51;
  const hexGrid = {};

  // Scale terrain to hex grid
  const scaleX = terrainWidth / hexSize;
  const scaleY = terrainHeight / hexSize;

  for (let col = 0; col < hexSize; col++) {
    for (let row = 0; row < hexSize; row++) {
      // Map hex coordinates back to terrain coordinates
      const terrainX = Math.floor(col * scaleX);
      const terrainY = Math.floor(row * scaleY);
      const idx = terrainX * terrainHeight + terrainY;

      hexGrid[`${col},${row}`] = {
        col: col,
        row: row,
        terrainType: terrain[idx] || 0,
        hex_x: col,
        hex_y: row,
      };
    }
  }

  return hexGrid;
}

/**
 * Get terrain name for display
 */
function getTerrainName(terrainType) {
  const names = {
    0: 'Deep Ocean',
    1: 'Shallow Water',
    2: 'Coast',
    3: 'Beach',
    4: 'Grassland',
    5: 'Forest',
    6: 'Hills',
    7: 'Mountains',
    8: 'High Mountains',
    9: 'Ice/Snow',
  };
  return names[terrainType] || 'Unknown';
}

/**
 * Get terrain color for visualization
 */
function getTerrainColor(terrainType) {
  const colors = {
    0: '#0033CC', // deep blue ocean
    1: '#0066FF', // cyan shallow water
    2: '#00CCFF', // light blue coast
    3: '#FFCC99', // tan beach
    4: '#99FF00', // light green grassland
    5: '#339900', // dark green forest
    6: '#996633', // brown hills
    7: '#999999', // gray mountains
    8: '#666666', // dark gray high mountains
    9: '#FFFFFF', // white ice
  };
  return colors[terrainType] || '#CCCCCC';
}

/**
 * Calculate world statistics
 */
function calculateWorldStats(terrain, hexGrid) {
  const stats = {
    water: 0,
    grassland: 0,
    forest: 0,
    mountains: 0,
    ice: 0,
    cities: 0,
    totalHexes: 0,
  };

  for (const hex in hexGrid) {
    const terrainType = hexGrid[hex].terrainType;
    stats.totalHexes++;

    if (terrainType <= 2) stats.water++;
    else if (terrainType === 3 || terrainType === 4) stats.grassland++;
    else if (terrainType === 5 || terrainType === 6) stats.forest++;
    else if (terrainType === 7 || terrainType === 8) stats.mountains++;
    else if (terrainType === 9) stats.ice++;
  }

  stats.waterPercent = Math.round((stats.water / stats.totalHexes) * 100);

  return stats;
}

/**
 * Is terrain hex suitable for city placement?
 * Cities can be placed on grassland, forest, or hills (not mountains, water, or ice)
 */
function isCityViable(terrainType) {
  return terrainType >= 4 && terrainType <= 6; // grassland, forest, hills
}

/**
 * Get viable city hexes from world
 */
function getViableCityLocations(hexGrid) {
  const locations = [];
  for (const hex in hexGrid) {
    if (isCityViable(hexGrid[hex].terrainType)) {
      locations.push({
        col: hexGrid[hex].col,
        row: hexGrid[hex].row,
        terrainType: hexGrid[hex].terrainType,
      });
    }
  }
  return locations;
}

module.exports = {
  WorldGenConfig,
  generateFractalTerrain,
  generateFantasyWorld,
  terrainToHexGrid,
  getTerrainName,
  getTerrainColor,
  calculateWorldStats,
  isCityViable,
  getViableCityLocations,
  seedRandom,
};
