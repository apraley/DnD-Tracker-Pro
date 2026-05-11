// World Builder API Endpoint (All 5 Phases)
const { createClient } = require('@supabase/supabase-js');
const WorldGeneratorFull = require('./world-builder/generators/worldGeneratorFull');
const ExNovoIntegration = require('./world-builder/generators/exNovoIntegration');
const ExUmbraIntegration = require('./world-builder/generators/exUmbraIntegration');
const ExUmbraNPCPlacement = require('./world-builder/generators/exUmbraNPCPlacement');
const DonjonIntegration = require('./world-builder/generators/donjonIntegration');
const { Anthropic } = require('@anthropic-ai/sdk');

// Initialize Supabase only if env vars are available
let supabase = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
  );
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { action, params, worldId } = req.body;

    switch (action) {
      case 'generate':
        return await generateWorld(req, res, params);

      case 'generateCityLore':
        return await generateCityLore(req, res, params);

      case 'generatePOIDescription':
        return await generatePOIDescription(req, res, params);

      case 'getWorld':
        return await getWorld(req, res, worldId);

      case 'saveWorld':
        return await saveWorld(req, res, params);

      case 'listWorlds':
        return await listWorlds(req, res);

      case 'deleteWorld':
        return await deleteWorld(req, res, worldId);

      case 'getRippleEffects':
        return await getRippleEffects(req, res, params);

      case 'getEconomicData':
        return await getEconomicData(req, res, params);

      case 'getWeatherData':
        return await getWeatherData(req, res, params);

      case 'getFactionDetails':
        return await getFactionDetails(req, res, params);

      case 'getHistoricalEvents':
        return await getHistoricalEvents(req, res, params);

      case 'generateHistoricalNarratives':
        return await generateHistoricalNarratives(req, res, params);

      case 'queryWorldState':
        return await queryWorldState(req, res, params);

      case 'generateLoreForEntity':
        return await generateLoreForEntity(req, res, params);

      case 'generateWorldLore':
        return await generateWorldLore(req, res, params);

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('World Builder Error:', error);
    return res.status(500).json({ error: error.message });
  }
};

async function generateWorld(req, res, params) {
  try {
    const seed = params.seed || Date.now().toString();
    const generator = new WorldGeneratorFull(seed);

    // Use full generator (includes all 5 phases)
    let world = await generator.generateCompleteWorld({
      name: params.name,
      age: params.age,
      magicLevel: params.magicLevel,
      civilizationAbundance: params.civilizationAbundance,
      climate: params.climate,
      terrain: params.terrain,
      planeId: params.planeId
    });

    // Integrate ExNovo system for cities
    console.log('🏗️ Integrating ExNovo city-building system...');
    const exNovoIntegration = new ExNovoIntegration(world, generator.seededRandom, process.env.ANTHROPIC_API_KEY);
    const { cities: enhancedCities, npcs: cityNPCs } = exNovoIntegration.enhanceAllCities(world.cities);
    world.cities = enhancedCities;
    world.npcs = world.npcs || [];
    world.npcs.push(...cityNPCs);
    console.log(`✓ Enhanced ${world.cities.length} cities with ExNovo details and generated ${cityNPCs.length} city NPCs`);

    // Integrate ExUmbra system for dungeons
    console.log('🏚️ Integrating ExUmbra dungeon-generation system...');
    const exUmbraIntegration = new ExUmbraIntegration(world, generator.seededRandom, process.env.ANTHROPIC_API_KEY);
    const enhancedPOIs = exUmbraIntegration.enhanceAllDungeons(world.pointsOfInterest);

    // Place NPCs in dungeons
    const npcPlacement = new ExUmbraNPCPlacement(generator.seededRandom, world.cities, world.npcs);
    const dungeonEnhancements = npcPlacement.placeDungeonInhabitants(enhancedPOIs, world.cities, world.npcs);

    // Update POIs with inhabitants
    enhancedPOIs.forEach(poi => {
      if (dungeonEnhancements[poi.id]) {
        poi.inhabitants = dungeonEnhancements[poi.id].inhabitants;
        poi.nearbyCity = dungeonEnhancements[poi.id].nearbyCity;
        poi.cityConnections = dungeonEnhancements[poi.id].cityConnections;
        world.npcs.push(...poi.inhabitants);
      }
    });

    world.pointsOfInterest = enhancedPOIs;
    console.log(`✓ Enhanced ${world.pointsOfInterest.filter(p => p.type === 'dungeon' || p.type === 'ruins').length} dungeons with ExUmbra details`);

    // Integrate donjon procedural layouts
    console.log('🗺️ Fetching procedural layouts from donjon APIs...');
    const donjon = new DonjonIntegration();

    // Add town layouts to cities
    for (let i = 0; i < world.cities.length; i++) {
      try {
        const layout = await donjon.generateTownLayout({
          name: world.cities[i].name,
          type: world.cities[i].governmentType?.toLowerCase() || 'settlement'
        });
        world.cities[i].donjonLayout = layout;
      } catch (err) {
        console.log(`⚠️ Could not fetch layout for ${world.cities[i].name}: ${err.message}`);
      }
    }

    // Add dungeon layouts to POIs
    for (let i = 0; i < world.pointsOfInterest.length; i++) {
      if (['dungeon', 'ruins', 'cave', 'tomb', 'lair', 'fortress', 'crypt', 'temple', 'mine', 'vault'].includes(world.pointsOfInterest[i].type?.toLowerCase())) {
        try {
          const layout = await donjon.generateDungeonLayout({
            name: world.pointsOfInterest[i].name,
            type: world.pointsOfInterest[i].type,
            size: world.pointsOfInterest[i].dangerLevel > 15 ? 'large' : world.pointsOfInterest[i].dangerLevel > 10 ? 'medium' : 'small'
          });
          world.pointsOfInterest[i].donjonLayout = layout;
        } catch (err) {
          console.log(`⚠️ Could not fetch layout for ${world.pointsOfInterest[i].name}: ${err.message}`);
        }
      }
    }
    console.log(`✓ Added procedural layouts to ${world.cities.length} cities and ${world.pointsOfInterest.filter(p => p.donjonLayout).length} dungeons`);

    // Update metadata
    world.generationMetadata = {
      ...world.generationMetadata,
      totalNPCs: world.npcs.length,
      completionLevel: '100% - All 5 Phases + ExNovo + ExUmbra + Donjon Layouts',
      exNovoIntegration: true,
      exUmbraIntegration: true,
      donjonIntegration: true,
      citiesWithLayouts: world.cities.filter(c => c.donjonLayout).length,
      dungeonsWithLayouts: world.pointsOfInterest.filter(p => p.donjonLayout).length
    };

    console.log('✅ World generation complete with ExNovo, ExUmbra, and Donjon integration!');

    return res.status(200).json({
      success: true,
      world,
      seed,
      completionLevel: world.generationMetadata.completionLevel,
      message: 'Complete world generated with all 5 phases + ExNovo + ExUmbra'
    });
  } catch (error) {
    console.error('Generation Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function generateCityLore(req, res, params) {
  const { cityName, civilization, magicLevel, age, lorelMode = 'data_array' } = params;

  try {
    if (lorelMode === 'data_array') {
      // Return a random history from the data array
      const HISTORIES = require('./world-builder/data/histories');
      const history = HISTORIES[Math.floor(Math.random() * HISTORIES.length)];
      return res.status(200).json({
        success: true,
        lore: history.description,
        source: 'data_array',
        theme: history.theme
      });
    } else if (lorelMode === 'claude_ai') {
      // Use Claude to generate lore
      const prompt = `You are a D&D world builder AI. Generate a rich, detailed history for a city called "${cityName}" with the following characteristics:
- Civilization level: ${civilization}/10 (1=isolated, 10=cosmopolitan)
- Magic level: ${magicLevel}/10 (1=no magic, 10=magic everywhere)
- World age: ${age} years old

Write a compelling 150-300 word history that explains how this city came to be, what shaped its culture, and what makes it unique. Include specific historical events, key figures, and conflicts.`;

      const message = await anthropic.messages.create({
        model: 'claude-opus-4-7',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const lore = message.content[0].type === 'text' ? message.content[0].text : '';

      return res.status(200).json({
        success: true,
        lore,
        source: 'claude_ai'
      });
    }
  } catch (error) {
    console.error('Lore Generation Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function generatePOIDescription(req, res, params) {
  const { poiName, poiType, dangerLevel, world, aiGenerate = false } = params;

  try {
    if (!aiGenerate) {
      // Return default description
      const descriptions = {
        dungeon: `A dark, foreboding dungeon carved deep underground. The walls are lined with ancient stone, and the air smells of age and danger.`,
        ruins: `The crumbling remains of a once-great civilization. Moss and vines cover the ancient stones, and secrets lie buried beneath.`,
        natural_wonder: `A magnificent natural formation that defies explanation. Its beauty and power inspire awe in all who witness it.`,
        shrine: `A sacred place of great spiritual significance. The very air seems to hum with divine energy.`,
        settlement: `A small community struggling to survive in this remote and dangerous land.`,
        other: `A location shrouded in mystery and legend, known only to the bravest adventurers.`
      };

      return res.status(200).json({
        success: true,
        description: descriptions[poiType] || descriptions.other,
        source: 'default'
      });
    } else {
      // Use Claude AI
      const prompt = `You are a D&D world builder. Generate a detailed, atmospheric description for a point of interest:
- Name: ${poiName}
- Type: ${poiType}
- Danger Level: ${dangerLevel}/20

Write a 100-200 word description that captures the atmosphere, visual details, and sense of adventure or danger. Make it immersive and evocative.`;

      const message = await anthropic.messages.create({
        model: 'claude-opus-4-7',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const description = message.content[0].type === 'text' ? message.content[0].text : '';

      return res.status(200).json({
        success: true,
        description,
        source: 'claude_ai'
      });
    }
  } catch (error) {
    console.error('POI Description Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function saveWorld(req, res, params) {
  try {
    if (!supabase) {
      return res.status(503).json({
        error: 'Database not configured for this deployment',
        message: 'World data is available in memory during this session'
      });
    }

    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { name, planeId, worldData } = params;

    const { data, error } = await supabase
      .from('worlds')
      .insert([
        {
          name,
          plane_id: planeId,
          age: worldData.age,
          magic_level: worldData.magicLevel,
          civilization_abundance: worldData.civilizationAbundance,
          climate_type: worldData.climate,
          primary_terrain: worldData.terrain,
          world_seed: worldData.worldSeed,
          created_by: userId,
          auto_save_enabled: true
        }
      ])
      .select();

    if (error) throw error;

    // TODO: Save cities, NPCs, POIs to their respective tables
    // For now, we'll just save the world metadata

    return res.status(200).json({
      success: true,
      worldId: data[0].id,
      message: 'World saved successfully'
    });
  } catch (error) {
    console.error('Save Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function getWorld(req, res, worldId) {
  try {
    if (!supabase) {
      return res.status(503).json({
        error: 'Database not configured for this deployment',
        message: 'Generate a new world or configure database access'
      });
    }

    const { data, error } = await supabase
      .from('worlds')
      .select('*')
      .eq('id', worldId)
      .single();

    if (error) throw error;

    // TODO: Fetch associated cities, NPCs, POIs, etc.

    return res.status(200).json({
      success: true,
      world: data
    });
  } catch (error) {
    console.error('Fetch Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function listWorlds(req, res) {
  try {
    if (!supabase) {
      return res.status(200).json({
        success: true,
        worlds: [],
        message: 'Database not configured - no saved worlds available'
      });
    }

    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { data, error } = await supabase
      .from('worlds')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      worlds: data
    });
  } catch (error) {
    console.error('List Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function deleteWorld(req, res, worldId) {
  try {
    if (!supabase) {
      return res.status(503).json({
        error: 'Database not configured for this deployment',
        message: 'Cannot delete worlds without database access'
      });
    }

    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { error } = await supabase
      .from('worlds')
      .delete()
      .eq('id', worldId)
      .eq('created_by', userId);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: 'World deleted successfully'
    });
  } catch (error) {
    console.error('Delete Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Phase 5: Ripple Effects
async function getRippleEffects(req, res, params) {
  try {
    const { eventId, worldId } = params;

    // For now, return structure. Would fetch from DB
    return res.status(200).json({
      success: true,
      rippleEffects: {
        eventId,
        chain: [
          { stage: 1, consequence: 'Primary effect', impact: 'Immediate changes' },
          { stage: 2, consequence: 'Secondary effect', impact: 'Medium-term shifts' },
          { stage: 3, consequence: 'Tertiary effect', impact: 'Long-term transformation' }
        ],
        message: 'Full ripple chain for the event'
      }
    });
  } catch (error) {
    console.error('Ripple Effect Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Economic Data
async function getEconomicData(req, res, params) {
  try {
    const { worldId, commodityId } = params;

    return res.status(200).json({
      success: true,
      economicData: {
        commodities: 'Array of commodities with current prices',
        tradeRoutes: 'Active and inactive trade routes',
        marketTrends: 'Supply/demand analysis',
        profitOpportunities: 'Best trade routes for profit'
      }
    });
  } catch (error) {
    console.error('Economic Data Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Weather Data
async function getWeatherData(req, res, params) {
  try {
    const { worldId, hex_x, hex_y } = params;

    return res.status(200).json({
      success: true,
      weatherData: {
        currentConditions: 'Weather at specified hex',
        forecast: 'Next 7-day forecast',
        hazards: 'Weather-related dangers',
        travelDifficulty: 'How weather affects travel'
      }
    });
  } catch (error) {
    console.error('Weather Data Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Faction Details
async function getFactionDetails(req, res, params) {
  try {
    const { factionId, worldId } = params;

    return res.status(200).json({
      success: true,
      factionDetails: {
        name: 'Faction name',
        type: 'Faction type',
        leadership: 'Leader information',
        members: 'Member count',
        treasury: 'Financial resources',
        agents: 'Known agents and spies',
        reputation: 'Public and hidden reputation',
        allies: 'Allied factions',
        rivals: 'Rival factions',
        secrets: 'Hidden secrets'
      }
    });
  } catch (error) {
    console.error('Faction Details Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Historical Events
async function getHistoricalEvents(req, res, params) {
  try {
    const { worldId } = params;

    return res.status(200).json({
      success: true,
      historicalEvents: {
        events: 'Array of historical events',
        eventChains: 'Ripple chains for each event',
        timeline: 'Chronological ordering',
        worldImpact: 'Total cumulative impact on world'
      }
    });
  } catch (error) {
    console.error('Historical Events Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Generate Historical Narratives using ExUmbra narrative framework
async function generateHistoricalNarratives(req, res, params) {
  try {
    const { world } = params;

    if (!world || !world.historicalEvents || world.historicalEvents.length === 0) {
      return res.status(400).json({ error: 'World must have historical events' });
    }

    // Generate narratives for historical events
    const eventNarratives = [];

    for (const event of world.historicalEvents) {
      try {
        const prompt = `Using the narrative framework from ExUmbra (a dungeon-generation system that emphasizes interconnected storytelling), write a vivid 150-200 word historical account of this world-shaping event:

Event: ${event.title}
Year: ${event.yearOccurred}
Type: ${event.type}
Severity: ${event.severity}/10
Description: ${event.description}

Create a narrative that explains:
1. What led to this event
2. The immediate consequences
3. How it rippled through factions, cities, and economies
4. The lasting impact on the world

Make it dramatic, atmospheric, and suitable for D&D storytelling. Show how this single event created cascading consequences across the world.`;

        const message = await anthropic.messages.create({
          model: 'claude-opus-4-7',
          max_tokens: 512,
          messages: [{ role: 'user', content: prompt }]
        });

        const narrative = message.content[0].type === 'text' ? message.content[0].text : null;

        eventNarratives.push({
          eventId: event.id,
          eventTitle: event.title,
          narrativeWriteup: narrative,
          generatedAt: new Date()
        });

        console.log(`✓ Generated narrative for event: ${event.title}`);
      } catch (eventError) {
        console.error(`Error generating narrative for ${event.title}:`, eventError.message);
        eventNarratives.push({
          eventId: event.id,
          eventTitle: event.title,
          narrativeWriteup: `[Narrative generation failed for: ${event.title}]`,
          error: eventError.message
        });
      }
    }

    return res.status(200).json({
      success: true,
      eventNarratives,
      totalGenerated: eventNarratives.filter(n => !n.error).length,
      totalFailed: eventNarratives.filter(n => n.error).length,
      message: `Generated ${eventNarratives.filter(n => !n.error).length}/${world.historicalEvents.length} historical narratives`
    });
  } catch (error) {
    console.error('Historical Narratives Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Query World State (Complex queries)
async function queryWorldState(req, res, params) {
  try {
    const { worldId, query } = params;

    // Examples of possible queries:
    // "Show me cities with economic crisis"
    // "Which commodities are most profitable right now?"
    // "What historical events shaped this city?"
    // "Are there any active trade wars?"
    // "Which NPCs have the most influence?"

    return res.status(200).json({
      success: true,
      query,
      results: {
        matchingEntities: [],
        relevantEvents: [],
        causedBy: [],
        consequences: [],
        affectedNPCs: [],
        timeline: []
      }
    });
  } catch (error) {
    console.error('World State Query Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Generate lore for a single entity (city or dungeon)
async function generateLoreForEntity(req, res, params) {
  const { entityType, entityName, entityData, world } = params;

  if (!entityType || !entityName || !entityData || !world) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    let prompt = '';

    if (entityType === 'city') {
      const city = entityData;
      prompt = `You are a master storyteller for D&D worlds. Create a rich, detailed historical write-up of ${city.name}.

CITY DATA:
- Government: ${city.governmentType || 'Unknown'}
- Population: ${city.exNovoMetadata?.totalPopulation || city.population || 'Unknown'}
- Districts: ${city.exNovoMetadata?.districtCount || 0}
- Factions: ${city.factions?.map(f => f.name).join(', ') || 'None'}
- Landmarks: ${city.landmarks?.map(l => l.name).join(', ') || 'None'}

WORLD CONTEXT:
- World Age: ${world.age} years
- Magic Level: ${world.magicLevel}/10
- Civilization: ${world.civilizationAbundance}/10

Write a 400-600 word historical narrative including:
1. Foundation Story - How and why was this city founded?
2. Early Development - How did the city grow?
3. Major Events - What historical events shaped it?
4. Current State - What is the city like now?
5. The People - What are the citizens like?
6. Secrets & Mysteries - What lurks in ${city.name}?
7. Adventure Hooks - What would bring adventurers here?

Make it vivid, atmospheric, and suitable for D&D gameplay.`;
    } else if (entityType === 'dungeon') {
      const poi = entityData;
      prompt = `You are an expert dungeon master. Create a comprehensive guide for "${poi.name}".

DUNGEON DATA:
- Type: ${poi.type}
- Difficulty: ${poi.exUmbraMetadata?.difficulty || 'Medium'}
- Size: ${poi.exUmbraMetadata?.size || 'Unknown'}
- Danger Level: ${poi.dangerLevel || 'Unknown'}
- Aspects: ${poi.aspects?.map(a => a.name).join(', ') || 'Unknown'}
- Threats: ${poi.exUmbraMetadata?.threatCount || 0}
- Rewards: ${poi.exUmbraMetadata?.rewardCount || 0}

WORLD CONTEXT:
- World Age: ${world.age} years
- Magic Level: ${world.magicLevel}/10
- Civilization: ${world.civilizationAbundance}/10

Write an 800-1200 word dungeon guide including:
1. Overview - What is this dungeon? Why does it exist?
2. Layout & Architecture - Describe the structure and atmosphere
3. The Aspects - How does each aspect manifest?
4. Major Encounters - Describe 3-4 significant encounters
5. The Heart - The dungeon's most important location
6. Secrets & Mysteries - What can be discovered?
7. Environmental Hazards - Traps and natural dangers
8. Treasure & Rewards - Valuable items and loot
9. Inhabitants - Who/what lives here?
10. Adventure Hooks - How to get parties to enter?

Write in an engaging, atmospheric style suitable for actual gameplay.`;
    } else {
      return res.status(400).json({ error: 'Invalid entity type' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({
        error: 'API key not configured',
        message: 'Set ANTHROPIC_API_KEY environment variable to enable lore generation'
      });
    }

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: entityType === 'city' ? 2000 : 3000,
      messages: [{ role: 'user', content: prompt }]
    });

    const lore = message.content[0]?.type === 'text' ? message.content[0].text : '';

    return res.status(200).json({
      success: true,
      lore,
      entityName,
      entityType
    });
  } catch (error) {
    console.error('Lore Generation Error:', error);
    return res.status(500).json({ error: error.message });
  }
}

// Generate world-level geographic lore using terrain stats and Ex Novo/Ex Umbra frameworks
async function generateWorldLore(req, res, params) {
  const { world } = params;

  if (!world) {
    return res.status(400).json({ error: 'Missing world data' });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error: 'API key not configured',
      message: 'Set ANTHROPIC_API_KEY to enable world lore generation'
    });
  }

  try {
    const stats = world.terrainStats || {};
    const totalHexes = stats.totalHexes || 2601;
    const waterPct = stats.waterPercent || 40;
    const landPct = 100 - waterPct;
    const mountainPct = Math.round(((stats.mountains || 0) / totalHexes) * 100);
    const forestPct = Math.round(((stats.forest || 0) / totalHexes) * 100);
    const grasslandPct = Math.round(((stats.grassland || 0) / totalHexes) * 100);
    const icePct = Math.round(((stats.ice || 0) / totalHexes) * 100);

    const cityNames = (world.cities || []).slice(0, 8).map(c => c.name).join(', ');
    const poiNames = (world.pointsOfInterest || []).slice(0, 6).map(p => `${p.name} (${p.type})`).join(', ');

    const prompt = `You are a master cartographer and lore-keeper writing in the style of Ex Novo (a collaborative city-building framework) and Ex Umbra (a dungeon-generation framework that emphasizes dark, interconnected storytelling).

WORLD DATA:
- Name: ${world.name}
- Age: ${world.age} years old
- Magic Level: ${world.magicLevel}/10
- Civilization: ${world.civilizationAbundance}/10
- Climate: ${world.climate}

GEOGRAPHY (from fractal terrain generation):
- ${waterPct}% water coverage (oceans, seas, rivers)
- ${landPct}% land mass
- ${grasslandPct}% grasslands and coastal plains (where ${world.cities?.length || 0} cities are established)
- ${forestPct}% deep forests and wooded hills
- ${mountainPct}% mountain ranges
- ${icePct}% polar ice and glaciers

SETTLEMENTS: ${cityNames || 'Unknown'}
NOTABLE LOCATIONS: ${poiNames || 'Unknown'}

Write a 600-900 word geographic description of this world that includes:

1. **THE SHAPE OF THE WORLD** — Describe the continents, oceans, island chains, and overall geography. How are the landmasses arranged? Where are the great oceans? Are there narrow straits, sprawling archipelagos, or vast inland seas?

2. **THE GREAT GEOGRAPHIC REGIONS** — Name and describe 3-4 distinct geographic regions (e.g., "The Sunken Reach", "The Thornwall Highlands"). Use the terrain data to ground these.

3. **NATURAL WONDERS** — Describe 2-3 breathtaking natural features (a vast glacial range, a bottomless inland sea, a forest that covers an entire sub-continent). These should feel discovered, not invented.

4. **THE EDGES OF THE MAP** — What lies at the polar ice caps? What is beyond the deep ocean? Use the ${icePct}% ice coverage to describe the frozen wastes.

5. **HOW THE WORLD FEELS** — Atmospheric closing paragraph about what it's like to stand on this world, see its skies, breathe its air.

Write in vivid, evocative prose. This is lore that a DM would read aloud at the start of a campaign. No bullet points — pure narrative.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const lore = message.content[0]?.type === 'text' ? message.content[0].text : '';

    return res.status(200).json({
      success: true,
      lore,
      worldName: world.name,
      terrainStats: stats
    });
  } catch (error) {
    console.error('World Lore Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
