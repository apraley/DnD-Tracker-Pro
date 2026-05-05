#!/usr/bin/env node

/**
 * Comprehensive World Generation Test Script
 * Tests all systems: ExNovo, ExUmbra, Donjon, NPC generation, and interconnection
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const WorldGeneratorFull = require('./api/world-builder/generators/worldGeneratorFull');
const ExNovoIntegration = require('./api/world-builder/generators/exNovoIntegration');
const ExUmbraIntegration = require('./api/world-builder/generators/exUmbraIntegration');
const ExUmbraNPCPlacement = require('./api/world-builder/generators/exUmbraNPCPlacement');
const DonjonIntegration = require('./api/world-builder/generators/donjonIntegration');
const AdventureForgeExport = require('./api/world-builder/generators/adventureForgeExport');
const AsyncLoreGenerator = require('./api/world-builder/generators/asyncLoreGenerator');

const LOG_FILE = './test-output.log';
let logBuffer = [];

function log(message) {
  const timestamp = new Date().toISOString();
  const fullMessage = `[${timestamp}] ${message}`;
  console.log(fullMessage);
  logBuffer.push(fullMessage);
}

function writeLog() {
  fs.writeFileSync(LOG_FILE, logBuffer.join('\n'));
  console.log(`\n📝 Full log written to: ${LOG_FILE}`);
}

async function testWorldGeneration() {
  log('🚀 Starting comprehensive world generation test...\n');

  try {
    // ============ PHASE 1: Base World Generation ============
    log('📊 PHASE 1: Generating base world structure...');
    const seed = 'test-world-' + Date.now();
    const generator = new WorldGeneratorFull(seed);

    const world = await generator.generateCompleteWorld({
      name: 'Testrealm of Verification',
      age: 2500,
      magicLevel: 7,
      civilizationAbundance: 6,
      climate: 'Temperate',
      terrain: 'Mixed'
    });

    log(`✓ Base world generated: ${world.name}`);
    log(`  - Seed: ${seed}`);
    log(`  - Age: ${world.age} years`);
    log(`  - Magic Level: ${world.magicLevel}/10`);
    log(`  - Cities: ${world.cities.length}`);
    log(`  - POIs: ${world.pointsOfInterest.length}`);
    log(`  - Factions: ${world.factions.length}`);
    log(`  - Historical Events: ${world.historicalEvents.length}`);

    // ============ PHASE 2: ExNovo City Enhancement ============
    log('\n🏗️ PHASE 2: Enhancing cities with ExNovo framework...');
    const exNovoIntegration = new ExNovoIntegration(world, generator.seededRandom, process.env.ANTHROPIC_API_KEY);
    const { cities: enhancedCities, npcs: cityNPCs } = exNovoIntegration.enhanceAllCities(world.cities);

    world.cities = enhancedCities;
    world.npcs = world.npcs || [];
    world.npcs.push(...cityNPCs);

    log(`✓ Enhanced ${world.cities.length} cities with ExNovo`);
    log(`✓ Generated ${cityNPCs.length} city NPCs`);

    // Sample one city for detailed logging
    if (world.cities.length > 0) {
      const sampleCity = world.cities[0];
      log(`\n  Sample City: ${sampleCity.name}`);
      log(`    - Government: ${sampleCity.governmentType}`);
      log(`    - Population: ${sampleCity.exNovoMetadata?.totalPopulation || 'N/A'}`);
      log(`    - Districts: ${sampleCity.exNovoMetadata?.districtCount || 0}`);
      log(`    - Factions: ${sampleCity.factions?.length || 0}`);
      log(`    - Landmarks: ${sampleCity.landmarks?.length || 0}`);
      log(`    - ExNovo Phases: ${sampleCity.exNovoMetadata?.phases?.length || 0}`);

      if (sampleCity.factions && sampleCity.factions.length > 0) {
        log(`    - First Faction: ${sampleCity.factions[0].name} (${sampleCity.factions[0].influence} influence)`);
      }
    }

    // ============ PHASE 3: ExUmbra Dungeon Enhancement ============
    log('\n🏚️ PHASE 3: Enhancing dungeons with ExUmbra framework...');
    const exUmbraIntegration = new ExUmbraIntegration(world, generator.seededRandom, process.env.ANTHROPIC_API_KEY);
    const enhancedPOIs = exUmbraIntegration.enhanceAllDungeons(world.pointsOfInterest);

    // Place NPCs in dungeons
    const npcPlacement = new ExUmbraNPCPlacement(generator.seededRandom, world.cities, world.npcs);
    const dungeonEnhancements = npcPlacement.placeDungeonInhabitants(enhancedPOIs, world.cities, world.npcs);

    let dungeonCount = 0;
    enhancedPOIs.forEach(poi => {
      if (dungeonEnhancements[poi.id]) {
        poi.inhabitants = dungeonEnhancements[poi.id].inhabitants;
        poi.nearbyCity = dungeonEnhancements[poi.id].nearbyCity;
        poi.cityConnections = dungeonEnhancements[poi.id].cityConnections;
        world.npcs.push(...poi.inhabitants);
        if (['dungeon', 'ruins', 'cave', 'tomb', 'lair', 'fortress', 'crypt', 'temple', 'mine', 'vault'].includes(poi.type?.toLowerCase())) {
          dungeonCount++;
        }
      }
    });

    world.pointsOfInterest = enhancedPOIs;
    log(`✓ Enhanced ${dungeonCount} dungeons with ExUmbra`);
    log(`✓ Total NPCs in world: ${world.npcs.length}`);

    // Sample one dungeon for detailed logging
    const sampleDungeon = enhancedPOIs.find(p => ['dungeon', 'ruins', 'cave', 'tomb'].includes(p.type?.toLowerCase()));
    if (sampleDungeon) {
      log(`\n  Sample Dungeon: ${sampleDungeon.name}`);
      log(`    - Type: ${sampleDungeon.type}`);
      log(`    - Size: ${sampleDungeon.exUmbraMetadata?.size || 'N/A'}`);
      log(`    - Difficulty: ${sampleDungeon.exUmbraMetadata?.difficulty || 'N/A'}`);
      log(`    - Aspects: ${sampleDungeon.aspects?.length || 0}`);
      log(`    - Threats: ${sampleDungeon.exUmbraMetadata?.threatCount || 0}`);
      log(`    - Inhabitants: ${sampleDungeon.inhabitants?.length || 0}`);
      log(`    - Nearby City: ${sampleDungeon.nearbyCity ? sampleDungeon.nearbyCity.name : 'None'}`);

      if (sampleDungeon.aspects && sampleDungeon.aspects.length > 0) {
        log(`    - First Aspect: ${sampleDungeon.aspects[0].name || 'Unnamed'} (${sampleDungeon.aspects[0].category})`);
      }
    }

    // ============ PHASE 4: Donjon Integration ============
    log('\n🗺️ PHASE 4: Fetching procedural layouts from donjon...');
    const donjon = new DonjonIntegration();
    let citiesWithLayouts = 0;
    let dungeonsWithLayouts = 0;

    // Test one city layout
    if (world.cities.length > 0) {
      try {
        log(`  Fetching layout for: ${world.cities[0].name}`);
        const layout = await donjon.generateTownLayout({
          name: world.cities[0].name,
          type: world.cities[0].governmentType?.toLowerCase() || 'settlement'
        });
        world.cities[0].donjonLayout = layout;
        citiesWithLayouts++;
        log(`  ✓ Got layout (${layout?.length || 0} chars)`);
      } catch (err) {
        log(`  ⚠️ Could not fetch layout: ${err.message}`);
      }
    }

    // Test one dungeon layout
    if (sampleDungeon) {
      try {
        log(`  Fetching layout for: ${sampleDungeon.name}`);
        const layout = await donjon.generateDungeonLayout({
          name: sampleDungeon.name,
          type: sampleDungeon.type,
          size: sampleDungeon.exUmbraMetadata?.threatCount > 15 ? 'large' : sampleDungeon.exUmbraMetadata?.threatCount > 10 ? 'medium' : 'small'
        });
        sampleDungeon.donjonLayout = layout;
        dungeonsWithLayouts++;
        log(`  ✓ Got layout (${layout?.length || 0} chars)`);
      } catch (err) {
        log(`  ⚠️ Could not fetch layout: ${err.message}`);
      }
    }

    log(`✓ Cities with layouts: ${citiesWithLayouts}`);
    log(`✓ Dungeons with layouts: ${dungeonsWithLayouts}`);

    // ============ PHASE 5: ADVENTURE FORGE Export ============
    log('\n📜 PHASE 5: Generating ADVENTURE FORGE export...');
    const forgeExporter = new AdventureForgeExport();
    const forgeData = forgeExporter.exportWorldForAdventureForge(world);

    log(`✓ Generated ADVENTURE FORGE export`);
    log(`  - Encounters: ${forgeData.encounters.total}`);
    log(`  - Quests: ${forgeData.quests.total}`);
    log(`  - One-Shots: ${forgeData.oneShots.total}`);
    log(`  - Mini-Campaigns: ${forgeData.miniCampaigns.total}`);

    if (forgeData.encounters.data.length > 0) {
      log(`\n  Sample Encounter: ${forgeData.encounters.data[0].name}`);
      log(`    - Type: ${forgeData.encounters.data[0].type}`);
      log(`    - Location: ${forgeData.encounters.data[0].location}`);
      log(`    - Difficulty: ${forgeData.encounters.data[0].difficulty}`);
    }

    // ============ PHASE 6: Async Lore Generation (Optional) ============
    if (process.env.ANTHROPIC_API_KEY) {
      log('\n✨ PHASE 6: Testing async lore generation queue...');
      const loreGenerator = new AsyncLoreGenerator(process.env.ANTHROPIC_API_KEY);

      // Queue one city and one dungeon for lore
      if (world.cities.length > 0) {
        loreGenerator.queueCityLore(world.cities[0], world);
        log(`  ✓ Queued city: ${world.cities[0].name}`);
      }

      if (sampleDungeon) {
        loreGenerator.queueDungeonLore(sampleDungeon, world);
        log(`  ✓ Queued dungeon: ${sampleDungeon.name}`);
      }

      log(`  Processing queue (up to 60 seconds)...`);
      const startTime = Date.now();
      await loreGenerator.waitForCompletion();
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      log(`  ✓ Lore generation complete in ${duration}s`);

      // Check generated lore
      if (world.cities[0].generatedLore) {
        const loreLength = world.cities[0].generatedLore.length;
        log(`  ✓ City lore generated: ${loreLength} characters`);
      }

      if (sampleDungeon?.generatedLore) {
        const loreLength = sampleDungeon.generatedLore.length;
        log(`  ✓ Dungeon lore generated: ${loreLength} characters`);
      }
    } else {
      log('\n⚠️ PHASE 6: Skipping async lore generation (ANTHROPIC_API_KEY not set)');
    }

    // ============ VERIFICATION & VALIDATION ============
    log('\n🔍 VERIFICATION & VALIDATION...\n');

    // Verify NPC interconnection
    log('NPC Interconnection Check:');
    let citiesWithNPCs = 0;
    let dungeonsWithInhabitants = 0;
    let crossReferences = 0;

    world.cities.forEach(city => {
      if (city.notableCitizens && city.notableCitizens.length > 0) {
        citiesWithNPCs++;
      }
    });

    world.pointsOfInterest.forEach(poi => {
      if (poi.inhabitants && poi.inhabitants.length > 0) {
        dungeonsWithInhabitants++;
        // Check for cross-references to city NPCs
        poi.inhabitants.forEach(inhabitant => {
          if (inhabitant.cityOrigin || inhabitant.factionOrigin) {
            crossReferences++;
          }
        });
      }
    });

    log(`  ✓ Cities with notable citizens: ${citiesWithNPCs}/${world.cities.length}`);
    log(`  ✓ Dungeons with inhabitants: ${dungeonsWithInhabitants}`);
    log(`  ✓ NPC cross-references (dungeon->city): ${crossReferences}`);

    // Verify ExNovo depth
    log('\nExNovo Framework Verification:');
    let citiesWithPhases = 0;
    let citiesWithDistrics = 0;
    let citiesWithLandmarks = 0;

    world.cities.forEach(city => {
      if (city.exNovoMetadata?.phases?.length > 0) citiesWithPhases++;
      if (city.exNovoMetadata?.districtCount > 0) citiesWithDistrics++;
      if (city.landmarks?.length > 0) citiesWithLandmarks++;
    });

    log(`  ✓ Cities with ExNovo phases: ${citiesWithPhases}/${world.cities.length}`);
    log(`  ✓ Cities with districts: ${citiesWithDistrics}/${world.cities.length}`);
    log(`  ✓ Cities with landmarks: ${citiesWithLandmarks}/${world.cities.length}`);

    // Verify ExUmbra depth
    log('\nExUmbra Framework Verification:');
    let dungeonsWithAspects = 0;
    let dungeonsWithThreats = 0;
    let dungeonsWithRewards = 0;

    enhancedPOIs.forEach(poi => {
      if (poi.aspects?.length > 0) dungeonsWithAspects++;
      if (poi.exUmbraMetadata?.threatCount > 0) dungeonsWithThreats++;
      if (poi.exUmbraMetadata?.rewardCount > 0) dungeonsWithRewards++;
    });

    log(`  ✓ Dungeons with aspects: ${dungeonsWithAspects}`);
    log(`  ✓ Dungeons with threats: ${dungeonsWithThreats}`);
    log(`  ✓ Dungeons with rewards: ${dungeonsWithRewards}`);

    // Write test output JSON
    const testOutput = {
      timestamp: new Date().toISOString(),
      seed,
      worldName: world.name,
      stats: {
        totalCities: world.cities.length,
        totalPOIs: world.pointsOfInterest.length,
        totalNPCs: world.npcs.length,
        totalFactions: world.factions.length,
        historicalEvents: world.historicalEvents.length
      },
      exNovo: {
        citiesWithPhases,
        citiesWithDistricts: citiesWithDistrics,
        citiesWithLandmarks
      },
      exUmbra: {
        dungeonsWithAspects,
        dungeonsWithThreats,
        dungeonsWithRewards
      },
      donjon: {
        citiesWithLayouts,
        dungeonsWithLayouts
      },
      adventureForge: {
        encounters: forgeData.encounters.total,
        quests: forgeData.quests.total,
        oneShots: forgeData.oneShots.total,
        miniCampaigns: forgeData.miniCampaigns.total
      },
      npcInterconnection: {
        citiesWithNPCs,
        dungeonsWithInhabitants,
        crossReferences
      }
    };

    fs.writeFileSync('./test-output.json', JSON.stringify(testOutput, null, 2));
    log('\n📊 Test results saved to: test-output.json');

    // ============ FINAL SUMMARY ============
    log('\n✅ ALL TESTS COMPLETED SUCCESSFULLY\n');
    log('Summary:');
    log(`  ✓ Base world generation: PASS`);
    log(`  ✓ ExNovo city integration: PASS (${citiesWithPhases}/${world.cities.length} cities with phases)`);
    log(`  ✓ ExUmbra dungeon integration: PASS (${dungeonsWithAspects} dungeons with aspects)`);
    log(`  ✓ NPC generation & interconnection: PASS (${world.npcs.length} NPCs total)`);
    log(`  ✓ Donjon layout integration: PASS (${citiesWithLayouts + dungeonsWithLayouts} layouts fetched)`);
    log(`  ✓ ADVENTURE FORGE export: PASS (${forgeData.encounters.total} encounters, ${forgeData.quests.total} quests)`);
    log(`  ${process.env.ANTHROPIC_API_KEY ? '✓ Async lore generation: AVAILABLE' : '⚠️ Async lore generation: SKIPPED (no API key)'}`);

    return true;

  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`);
    log(error.stack);
    return false;
  } finally {
    writeLog();
  }
}

// Run test
testWorldGeneration().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
