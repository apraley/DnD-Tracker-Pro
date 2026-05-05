// World Builder API Endpoint (All 5 Phases)
const { createClient } = require('@supabase/supabase-js');
const WorldGeneratorFull = require('./world-builder/generators/worldGeneratorFull');
const { Anthropic } = require('@anthropic-ai/sdk');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

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

      case 'queryWorldState':
        return await queryWorldState(req, res, params);

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
    const world = await generator.generateCompleteWorld({
      name: params.name,
      age: params.age,
      magicLevel: params.magicLevel,
      civilizationAbundance: params.civilizationAbundance,
      climate: params.climate,
      terrain: params.terrain,
      planeId: params.planeId
    });

    return res.status(200).json({
      success: true,
      world,
      seed,
      completionLevel: world.generationMetadata.completionLevel,
      message: 'Complete world generated with all 5 phases'
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
