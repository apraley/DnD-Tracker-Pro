// Full World Generator (All 5 Phases)
const WorldGenerator = require('./worldGenerator');
const FactionService = require('../services/factionService');
const CityDetailService = require('../services/cityDetailService');
const AdventureHookService = require('../services/adventureHookService');
const WeatherService = require('../services/weatherService');
const EconomicService = require('../services/economicService');
const RippleEffectService = require('../services/rippleEffectService');

class WorldGeneratorFull extends WorldGenerator {
  async generateCompleteWorld(params) {
    console.log('🌍 Generating complete world with all phases...');

    // Phase 1: Base world generation
    const world = this.generateWorld(params);
    console.log(`✓ Phase 1: Generated ${world.cities.length} cities, ${world.pointsOfInterest.length} POIs`);

    // Phase 2: Deep lore, factions, detailed NPCs
    const factionService = new FactionService(world, world.npcs);
    world.factions = factionService.generateDetailedFactions();

    const cityDetailService = new CityDetailService(world, world.factions, world.npcs);
    world.cities = cityDetailService.enrichCities();

    const adventureHookService = new AdventureHookService();
    world.pointsOfInterest = world.pointsOfInterest.map(poi => ({
      ...poi,
      adventureHooks: adventureHookService.generateDetailedHooks(poi, world)
    }));

    console.log(`✓ Phase 2: Generated ${world.factions.length} factions with details`);
    console.log(`✓ Phase 2: Enriched cities with governments, sports teams, notable citizens`);
    console.log(`✓ Phase 2: Created detailed adventure hooks for all POIs`);

    // Phase 3: Weather & Planes
    const weatherService = new WeatherService(world);
    world.weatherPatterns = weatherService.generateWorldWeather();
    world.planes = this.generatePlanes();

    console.log(`✓ Phase 3: Generated weather patterns for ${world.weatherPatterns.length} regions`);
    console.log(`✓ Phase 3: Created ${world.planes.length} planes`);

    // Phase 4: Economic simulation
    const economicService = new EconomicService(world, world.cities, world.factions);
    world.commodities = economicService.generateCommodities();
    world.tradeRoutes = economicService.generateTradeRoutes();

    console.log(`✓ Phase 4: Generated ${world.commodities.length} commodities with pricing`);
    console.log(`✓ Phase 4: Created ${world.tradeRoutes.length} trade routes with economic factors`);

    // Phase 5: Ripple effects & events
    const rippleService = new RippleEffectService(world);
    world.historicalEvents = rippleService.generateHistoricalEvents();

    // Simulate ripple chains for each event
    world.eventChains = world.historicalEvents.map(event => {
      const chain = rippleService.simulateRippleChain(event);
      return chain;
    });

    // Generate special ripple effects (e.g., bard songs)
    world.specialRipples = {
      bardSong: rippleService.simulateBardSongRipple()
    };

    console.log(`✓ Phase 5: Generated ${world.historicalEvents.length} historical events`);
    console.log(`✓ Phase 5: Created ripple effect chains (cascading consequences)`);

    // Add metadata
    world.generationMetadata = {
      generatedAt: new Date(),
      worldAge: world.age,
      magicLevel: world.magicLevel,
      civilizationLevel: world.civilizationAbundance,
      totalCities: world.cities.length,
      totalPOIs: world.pointsOfInterest.length,
      totalNPCs: world.npcs.length,
      totalFactions: world.factions.length,
      totalCommodities: world.commodities.length,
      totalTradeRoutes: world.tradeRoutes.length,
      totalWeatherPatterns: world.weatherPatterns.length,
      totalHistoricalEvents: world.historicalEvents.length,
      completionLevel: '100% - All 5 Phases'
    };

    console.log('✅ World generation complete!');
    return world;
  }

  generatePlanes() {
    const planeTypes = [
      { name: 'Material Plane', description: 'The world of mortals and physical matter' },
      { name: 'Shadowfell', description: 'A dark mirror of the material plane' },
      { name: 'Feywild', description: 'The whimsical realm of fey and nature' },
      { name: 'Elemental Plane of Fire', description: 'A realm of pure flame and heat' },
      { name: 'Elemental Plane of Water', description: 'An endless ocean of water' },
      { name: 'Elemental Plane of Air', description: 'A sky of infinite winds' },
      { name: 'Elemental Plane of Earth', description: 'A realm of solid stone and crystal' },
      { name: 'Astral Plane', description: 'The silver void between planes' },
      { name: 'Abyss', description: 'The chaotic realm of demons' },
      { name: 'Nine Hells', description: 'The orderly realm of devils' }
    ];

    return planeTypes.map((plane, idx) => ({
      id: `plane_${idx}`,
      ...plane,
      worldsWithin: Math.floor(Math.random() * 3) + 1,
      accessibleFrom: this.pickRandom(['Ritual', 'Portal', 'Natural Gateway', 'Spellcasting', 'Divine Intervention']),
      dangerLevel: Math.floor(Math.random() * 20) + 1,
      inhabited: Math.random() > 0.3
    }));
  }

  pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}

module.exports = WorldGeneratorFull;
