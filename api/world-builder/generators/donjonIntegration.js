// Donjon Integration - Fetches procedural town and dungeon layouts from donjon.bin.sh APIs
const https = require('https');

class DonjonIntegration {
  constructor() {
    this.townApiBase = 'https://donjon.bin.sh/fantasy/town/';
    this.dungeonApiBase = 'https://donjon.bin.sh/5e5/dungeon/';
  }

  // Fetch a random town layout from donjon
  async generateTownLayout(params = {}) {
    try {
      const townParams = {
        name: params.name || 'Settlement',
        'type': params.type || 'village',
        ...params
      };

      // Build query string
      const queryString = new URLSearchParams(townParams).toString();
      const url = `${this.townApiBase}?${queryString}`;

      console.log(`🏘️ Fetching town layout from donjon: ${townParams.name}`);
      const response = await this.fetchUrl(url);

      return {
        success: true,
        name: townParams.name,
        layoutData: response,
        source: 'donjon.bin.sh/fantasy/town/',
        description: 'Procedurally generated town layout'
      };
    } catch (error) {
      console.log(`⚠️ Donjon town API unavailable: ${error.message}. Using fallback layout.`);
      return this.generateFallbackTownLayout(params);
    }
  }

  // Fetch a random dungeon layout from donjon
  async generateDungeonLayout(params = {}) {
    try {
      const dungeonParams = {
        name: params.name || 'Dungeon',
        'size': params.size || 'medium',
        'type': params.type || 'standard',
        ...params
      };

      const queryString = new URLSearchParams(dungeonParams).toString();
      const url = `${this.dungeonApiBase}?${queryString}`;

      console.log(`🐉 Fetching dungeon layout from donjon: ${dungeonParams.name}`);
      const response = await this.fetchUrl(url);

      return {
        success: true,
        name: dungeonParams.name,
        layoutData: response,
        source: 'donjon.bin.sh/5e5/dungeon/',
        description: 'Procedurally generated dungeon layout'
      };
    } catch (error) {
      console.log(`⚠️ Donjon dungeon API unavailable: ${error.message}. Using fallback layout.`);
      return this.generateFallbackDungeonLayout(params);
    }
  }

  // Generic HTTPS fetch
  fetchUrl(url) {
    return new Promise((resolve, reject) => {
      https.get(url, { timeout: 10000 }, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
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

  // Fallback town layout when API unavailable
  generateFallbackTownLayout(params) {
    return {
      success: false,
      name: params.name || 'Unnamed Settlement',
      layoutData: this.generateRandomTownDescription(params),
      source: 'local-fallback',
      description: 'Procedurally generated fallback town layout'
    };
  }

  // Fallback dungeon layout when API unavailable
  generateFallbackDungeonLayout(params) {
    return {
      success: false,
      name: params.name || 'Unnamed Dungeon',
      layoutData: this.generateRandomDungeonDescription(params),
      source: 'local-fallback',
      description: 'Procedurally generated fallback dungeon layout'
    };
  }

  // Generate random town description as fallback
  generateRandomTownDescription(params) {
    const sizes = ['hamlet', 'village', 'town', 'city'];
    const types = ['farming', 'trading', 'mining', 'military', 'religious', 'coastal'];

    const size = params.size || sizes[Math.floor(Math.random() * sizes.length)];
    const type = params.type || types[Math.floor(Math.random() * types.length)];
    const population = Math.floor(Math.random() * 5000) + 100;

    return `
# ${params.name || 'Settlement'}

## Overview
A ${size} of ${type} focus with approximately ${population} inhabitants.

## Districts
- Market District: Where goods and services are traded
- Residential Quarter: Homes for the town's inhabitants
- Industrial Area: Crafts, workshops, and manufacturing
- Religious Center: Temple or shrine
- Civic Area: Town hall and meeting places

## Notable Locations
- The Town Square: Central gathering place
- The Market Hall: Primary commerce location
- The Temple/Shrine: Spiritual center
- The Tavern: Social hub
- The Blacksmith: Craftsperson's workshop

## Population
${population} inhabitants with various professions and backgrounds.

## Government
Ruled by local leadership (mayor, council, or appointed official).

## Trade
Primary exports: ${['grain', 'crafts', 'ore', 'fish', 'lumber'][Math.floor(Math.random() * 5)]}
Primary imports: ${['luxury goods', 'metals', 'spices', 'cloth', 'books'][Math.floor(Math.random() * 5)]}
`;
  }

  // Generate random dungeon description as fallback
  generateRandomDungeonDescription(params) {
    const types = ['cavern', 'dungeon', 'ruins', 'catacombs', 'fortress', 'temple'];
    const themes = ['undead', 'creatures', 'magical', 'ancient', 'evil cult', 'natural'];

    const type = params.type || types[Math.floor(Math.random() * types.length)];
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const roomCount = Math.floor(Math.random() * 20) + 5;

    return `
# ${params.name || 'Unnamed Dungeon'}

## Overview
A ${type} with a ${theme} theme. Approximately ${roomCount} rooms and corridors.

## Entrance
The dungeon entrance is ${['obvious and well-known', 'hidden and difficult to find', 'sealed but penetrable', 'recently discovered'][Math.floor(Math.random() * 4)]}.

## Layout
- Multiple interconnected chambers
- A main path through the center
- Side passages and secret areas
- A central chamber or "heart"

## Rooms (${roomCount})
- Guard room with basic defenses
- Treasury or treasure chamber
- Living quarters for inhabitants
- Ritual or ceremonial chamber
- Library or records room
- Prison or holding cells
- Workshops and crafting areas
- Hidden passages and side rooms

## Atmosphere
${['Dark and oppressive', 'Ancient and crumbling', 'Well-maintained but eerie', 'Flooded and damp', 'Volcanic and hot'][Math.floor(Math.random() * 5)]}

## Inhabitants
${theme.charAt(0).toUpperCase() + theme.slice(1)} creatures and entities

## Treasure
Various treasures hidden throughout, with the greatest riches in the heart chamber.

## Threats
- Creatures and denizens
- Magical traps and wards
- Environmental hazards
- Ancient magic
`;
  }

  // Integrate donjon layout with a city
  async integrateLayoutWithCity(city, layout) {
    return {
      ...city,
      donjonLayout: layout,
      layoutSource: layout.source,
      layout Details: layout.layoutData
    };
  }

  // Integrate donjon layout with a dungeon/POI
  async integrateLayoutWithDungeon(poi, layout) {
    return {
      ...poi,
      donjonLayout: layout,
      layoutSource: layout.source,
      layoutDetails: layout.layoutData
    };
  }
}

module.exports = DonjonIntegration;
