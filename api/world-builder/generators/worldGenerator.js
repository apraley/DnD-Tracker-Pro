// Core World Generation Engine
const HISTORIES = require('../data/histories');
const ENTITIES = require('../data/entities');
const {
  CITY_NAMES,
  POI_NAMES,
  GOVERNMENT_TYPES,
  FACTION_TYPES,
  ADVENTURE_HOOK_TEMPLATES,
  WEATHER_CONDITIONS,
  ANOMALIES,
  TERRAIN_TYPES,
  CLIMATE_TYPES
} = require('../data/names');

class WorldGenerator {
  constructor(seed) {
    this.seed = seed;
    this.rng = this.seededRandom(seed);
  }

  seededRandom(seed) {
    return function() {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
  }

  random(min = 0, max = 1) {
    if (typeof min === 'number' && typeof max === 'number') {
      return Math.floor(this.rng() * (max - min + 1)) + min;
    }
    return this.rng();
  }

  pickRandom(array) {
    return array[Math.floor(this.rng() * array.length)];
  }

  generateWorld(params) {
    const world = {
      name: params.name || `Generated World ${Date.now()}`,
      age: params.age !== undefined ? params.age : this.random(100, 5000),
      magicLevel: params.magicLevel !== undefined ? params.magicLevel : this.random(1, 10),
      civilizationAbundance: params.civilizationAbundance !== undefined ? params.civilizationAbundance : this.random(1, 10),
      climate: params.climate || this.pickRandom(CLIMATE_TYPES),
      terrain: params.terrain || this.pickRandom(TERRAIN_TYPES),
      worldSeed: this.seed,
      createdAt: new Date(),
      cities: [],
      pointsOfInterest: [],
      npcs: [],
      factions: [],
      weatherPatterns: []
    };

    // Generate cities based on civilization abundance
    const cityCount = Math.min(10 + (world.civilizationAbundance * 2), 30);
    world.cities = this.generateCities(cityCount, world);

    // Generate POIs
    const poiCount = 20 + Math.floor(world.civilizationAbundance * 2);
    world.pointsOfInterest = this.generatePointsOfInterest(poiCount, world);

    // Generate NPCs/Entities
    world.npcs = this.generateNPCs(world.civilizationAbundance, world);

    // Generate Factions
    world.factions = this.generateFactions(world);

    // Generate Weather Patterns
    world.weatherPatterns = this.generateWeatherPatterns(world);

    return world;
  }

  generateCities(count, world) {
    const cities = [];
    const usedCoords = new Set();

    for (let i = 0; i < count; i++) {
      let hex_x, hex_y;
      // Ensure no duplicate coordinates
      do {
        hex_x = this.random(0, 50);
        hex_y = this.random(0, 50);
      } while (usedCoords.has(`${hex_x},${hex_y}`));
      usedCoords.add(`${hex_x},${hex_y}`);

      const city = {
        id: `city_${i}`,
        name: this.pickRandom(CITY_NAMES),
        population: Math.floor(this.random(1000, 50000) * (world.civilizationAbundance / 5)),
        hex_x,
        hex_y,
        governmentType: this.pickRandom(GOVERNMENT_TYPES),
        historyId: this.pickRandom(HISTORIES).id,
        history: this.pickRandom(HISTORIES).description,
        rulingFactions: [],
        criminalElements: this.generateCriminalElements(),
        notableCitizens: [],
        economicFocus: this.generateEconomicFocus(),
        discovered: false
      };

      cities.push(city);
    }

    return cities;
  }

  generatePointsOfInterest(count, world) {
    const pois = [];
    const usedCoords = new Set();

    const poiTypes = Object.keys(POI_NAMES);

    for (let i = 0; i < count; i++) {
      let hex_x, hex_y;
      do {
        hex_x = this.random(0, 50);
        hex_y = this.random(0, 50);
      } while (usedCoords.has(`${hex_x},${hex_y}`));
      usedCoords.add(`${hex_x},${hex_y}`);

      const poiType = this.pickRandom(poiTypes);
      const poi = {
        id: `poi_${i}`,
        name: this.pickRandom(POI_NAMES[poiType]),
        type: poiType,
        hex_x,
        hex_y,
        dangerLevel: this.random(1, 20),
        description: this.generatePOIDescription(poiType, world),
        adventureHooks: this.generateAdventureHooks(4),
        discovered: false
      };

      pois.push(poi);
    }

    return pois;
  }

  generatePOIDescription(poiType, world) {
    const templates = {
      dungeon: `An ancient dungeon filled with dangers. The air is thick with magic level ${world.magicLevel}. Strange inscriptions cover the walls.`,
      ruins: `Crumbling ruins of a forgotten civilization. Moss and vines cover the ancient stones.`,
      natural_wonder: `A breathtaking natural formation shaped by ages of wind and water.`,
      shrine: `A sacred place of worship, weathered by time but still radiating sanctity.`,
      settlement: `A small community eking out a living in this remote location.`,
      other: `An enigmatic location shrouded in mystery and legend.`
    };
    return templates[poiType] || templates.other;
  }

  generateAdventureHooks(count) {
    const hooks = [];
    for (let i = 0; i < count; i++) {
      const template = this.pickRandom(ADVENTURE_HOOK_TEMPLATES);
      hooks.push({
        title: template.title,
        description: template.description,
        encounterType: template.encounterType,
        difficulty: this.random(1, 20)
      });
    }
    return hooks;
  }

  generateNPCs(civilizationLevel, world) {
    const npcs = [];
    const npcCount = Math.min(15 + civilizationLevel * 3, 50);

    for (let i = 0; i < npcCount; i++) {
      const entity = this.pickRandom(ENTITIES);
      const npc = {
        id: `npc_${i}`,
        ...entity,
        associatedCityId: world.cities[this.random(0, world.cities.length - 1)]?.id,
        createdAt: new Date()
      };
      npcs.push(npc);
    }

    return npcs;
  }

  generateFactions(world) {
    const factions = [];
    const factionCount = 5 + Math.floor(world.cities.length / 3);

    for (let i = 0; i < factionCount; i++) {
      const type = this.pickRandom(FACTION_TYPES);
      const headQuartersCity = this.pickRandom(world.cities);

      const faction = {
        id: `faction_${i}`,
        name: `The ${this.generateFactionName()}`,
        type,
        description: `A ${type.toLowerCase()} with influence across the realm.`,
        headquartersId: headQuartersCity.id,
        alignment: this.pickRandom(['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil']),
        members: [],
        rivals: [],
        allies: []
      };

      factions.push(faction);
    }

    return factions;
  }

  generateFactionName() {
    const prefixes = ['Crimson', 'Silver', 'Black', 'Golden', 'Iron', 'Shadow', 'Twilight', 'Dawn'];
    const suffixes = ['Guard', 'Circle', 'Council', 'Order', 'Guild', 'Brotherhood', 'Sisterhood', 'Alliance'];
    return `${this.pickRandom(prefixes)} ${this.pickRandom(suffixes)}`;
  }

  generateWeatherPatterns(world) {
    const patterns = [];
    const hexCount = 25; // Sample a grid

    for (let i = 0; i < hexCount; i++) {
      const pattern = {
        id: `weather_${i}`,
        hex_x: this.random(0, 50),
        hex_y: this.random(0, 50),
        currentWeather: this.pickRandom(WEATHER_CONDITIONS),
        temperature: this.random(-20, 120),
        windSpeed: this.random(0, 40),
        humidity: this.random(0, 100),
        anomaly: null
      };

      // 10% chance of anomaly
      if (this.random() < 0.1) {
        pattern.anomaly = this.pickRandom(ANOMALIES);
      }

      patterns.push(pattern);
    }

    return patterns;
  }

  generateEconomicFocus() {
    const focuses = ['Agriculture', 'Mining', 'Trade', 'Fishing', 'Crafting', 'Magic', 'Mercenary Work', 'Lumber'];
    return this.pickRandom(focuses);
  }

  generateCriminalElements() {
    const crimeTypes = ['Thieves Guild', 'Smuggling Ring', 'Bandit Gang', 'Corrupt Officials', 'Drug Trade'];
    return this.pickRandom(crimeTypes);
  }
}

module.exports = WorldGenerator;
