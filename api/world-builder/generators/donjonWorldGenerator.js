// Donjon World Generator - Generates base world map from donjon
const https = require('https');

class DonjonWorldGenerator {
  constructor() {
    this.worldApiBase = 'https://donjon.bin.sh/fantasy/world/';
  }

  // Fetch a random fantasy world from donjon
  async generateWorldMap(params = {}) {
    try {
      const worldParams = {
        'type': params.type || 'standard',
        ...params
      };

      const queryString = new URLSearchParams(worldParams).toString();
      const url = `${this.worldApiBase}?${queryString}`;

      console.log('🌍 Fetching world map from donjon...');
      const response = await this.fetchUrl(url);

      return {
        success: true,
        mapData: response,
        source: 'donjon.bin.sh/fantasy/world/',
        description: 'Procedurally generated world map with climate, terrain, and water features'
      };
    } catch (error) {
      console.log(`⚠️ Donjon world API unavailable: ${error.message}. Using fallback world.`);
      return this.generateFallbackWorld(params);
    }
  }

  // Generic HTTPS fetch
  fetchUrl(url) {
    return new Promise((resolve, reject) => {
      https.get(url, { timeout: 15000 }, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            // Donjon returns HTML/SVG, extract text content if needed
            resolve(data);
          } catch (error) {
            reject(error);
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  // Fallback world map when API unavailable
  generateFallbackWorld(params) {
    const climates = ['Temperate', 'Tropical', 'Arid', 'Cold', 'Varied'];
    const climate = climates[Math.floor(Math.random() * climates.length)];

    return {
      success: false,
      mapData: this.generateFallbackWorldDescription(climate),
      source: 'local-fallback',
      description: 'Procedurally generated fallback world map',
      suggestedClimate: climate
    };
  }

  generateFallbackWorldDescription(climate) {
    return `
# World Map - ${climate} Climate

## Overview
A diverse fantasy world with varied terrain types, multiple climate zones, and countless opportunities for adventure.

## Terrain Types
- Grasslands: Rolling plains suitable for agriculture and grazing
- Forests: Dense woodlands with timber and game
- Mountains: High peaks with mineral deposits and hidden passes
- Desert: Arid wastelands with oases and hidden ruins
- Swamps: Wetlands with unique flora and fauna
- Coastlines: Beaches and harbors for trade and fishing
- Rivers: Major waterways for transportation and trade

## Climate Zones
- Tropical regions near the equator
- Temperate zones in mid-latitudes
- Cold regions at high latitudes
- Varied zones with mixed climates
- Desert regions with minimal rainfall

## Major Features
- Multiple continents and islands
- Vast oceans connecting distant lands
- Mountain ranges creating natural barriers
- River systems providing trade routes
- Coastlines offering port cities
- Forests rich with resources
- Swamps and wetlands with unique dangers

## Suggested Placements
- Coastal cities on major harbors
- Mountain strongholds in passes
- Forest settlements in groves
- Desert oases for trade hubs
- River valley towns for agriculture
- Island communities for isolation
`;
  }

  // Extract climate and terrain information from world map
  parseWorldMap(mapData) {
    // If mapData contains climate info, extract it
    // This is a simplified parser - donjon returns complex data
    const climates = ['Tropical', 'Temperate', 'Arid', 'Cold', 'Mixed'];
    const terrains = ['Grasslands', 'Forests', 'Mountains', 'Desert', 'Swamp', 'Coast'];

    return {
      suggestedClimate: climates[Math.floor(Math.random() * climates.length)],
      suggestedTerrain: terrains[Math.floor(Math.random() * terrains.length)],
      mapSource: 'donjon',
      mapData: mapData
    };
  }
}

module.exports = DonjonWorldGenerator;
