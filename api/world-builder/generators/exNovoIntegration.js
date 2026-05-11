// ExNovo Integration - Uses actual ExNovo framework to generate cities
const ExNovoFramework = require('./exNovoFramework');
const ExNovoNPCGenerator = require('./exNovoNPCGenerator');
const { Anthropic } = require('@anthropic-ai/sdk');

class ExNovoIntegration {
  constructor(world, seededRandom, claudeApiKey = null) {
    this.world = world;
    this.random = seededRandom;
    this.claudeApiKey = claudeApiKey;
    this.framework = new ExNovoFramework(seededRandom);
    this.npcGenerator = new ExNovoNPCGenerator(seededRandom);

    if (claudeApiKey) {
      this.claude = new Anthropic({ apiKey: claudeApiKey });
    }
  }

  // Enhance a city using the actual ExNovo framework
  enhanceCityWithExNovo(city) {
    // Generate city through ExNovo phases
    const exNovoCity = this.framework.generateCityThroughExNovo({
      id: city.id,
      name: city.name,
      age: this.world.age,
      size: city.population > 5000 ? 'large' : city.population > 1000 ? 'medium' : 'small',
      developmentPhases: Math.min(Math.floor(this.world.age / 100), 5) || 2
    });

    // Merge ExNovo data into city
    const enhancedCity = {
      ...city,
      // Core city data
      ...exNovoCity,

      // ExNovo metadata
      exNovoMetadata: {
        generatedVia: 'ExNovo Framework',
        phases: exNovoCity.exNovoHistory,
        regionCount: exNovoCity.regions.length,
        districtCount: exNovoCity.districts.length,
        landmarkCount: exNovoCity.landmarks.length,
        factionCount: exNovoCity.factions.length,
        resourceCount: exNovoCity.resources.length,
        totalPopulation: exNovoCity.populationGrowth[exNovoCity.populationGrowth.length - 1]?.population || city.population
      },

      // Combine with original city data
      hex_x: city.hex_x,
      hex_y: city.hex_y,
      governmentType: exNovoCity.governmentType || city.governmentType,
      population: exNovoCity.populationGrowth[exNovoCity.populationGrowth.length - 1]?.population || city.population,

      // Add regions as districts
      regions: (exNovoCity.regions || []).concat(exNovoCity.districts || []),

      // Add ExNovo landmarks
      landmarks: exNovoCity.landmarks || [],

      // Add factions from ExNovo
      factions: exNovoCity.factions || [],

      // Historical events
      historicalEvents: exNovoCity.events || [],

      // Resources discovered
      resources: exNovoCity.resources || [],

      // Founding information
      foundingLocation: exNovoCity.foundingLocation?.name || 'Unknown',
      foundingDecision: exNovoCity.foundingDecision?.name || 'Unknown',
      founderFaction: exNovoCity.founderFaction || 'Unknown'
    };

    // Generate NPCs for the city
    const cityNPCs = this.npcGenerator.generateCityNPCs(enhancedCity);

    // Link NPCs to city
    enhancedCity.notableCitizens = cityNPCs;
    enhancedCity.generatedNPCIds = cityNPCs.map(npc => npc.id);

    // Link faction leaders
    enhancedCity.factions.forEach((faction, idx) => {
      if (idx < cityNPCs.length) {
        faction.leaderId = cityNPCs[idx].id;
        faction.leader = cityNPCs[idx].name;
      }
    });

    return {
      city: enhancedCity,
      npcs: cityNPCs
    };
  }

  // Enhance all cities in the world
  enhanceAllCities(cities) {
    const enhancedCities = [];
    const allNPCs = [];

    cities.forEach((city, idx) => {
      console.log(`🏙️ Enhancing city ${idx + 1}/${cities.length}: ${city.name} via ExNovo...`);
      const { city: enhancedCity, npcs } = this.enhanceCityWithExNovo(city);
      enhancedCities.push(enhancedCity);
      allNPCs.push(...npcs);
      console.log(`✓ ${city.name} enhanced with ${npcs.length} NPCs`);
    });

    return { cities: enhancedCities, npcs: allNPCs };
  }

  // Generate detailed historical and cultural write-up for a city
  async generateCityLoreWithClaude(city) {
    if (!this.claude) {
      console.log('⚠️ No Claude API key available, skipping detailed lore generation');
      return null;
    }

    try {
      const exNovoMeta = city.exNovoMetadata || {};
      const phases = exNovoMeta.phases || [];
      const phasesSummary = phases.map(p => p.description || p.phase).join('\n  ');

      const prompt = `You are a master storyteller for D&D worlds. Using the ExNovo city-building framework, create a rich, detailed historical write-up of ${city.name} as if the entire ExNovo game was actually played to build this city.

CITY DATA FROM EXNOVO GENERATION:
- Founding Location: ${city.foundingLocation || 'Unknown'}
- Founding Decision: ${city.foundingDecision || 'Unknown'}
- Government Type: ${city.governmentType || 'Unknown'}
- Current Population: ${city.exNovoMetadata?.totalPopulation || city.population}
- Districts/Regions: ${city.exNovoMetadata?.districtCount || 0}
- Key Landmarks: ${city.landmarks?.map(l => l.name).join(', ') || 'None yet'}
- Factions: ${city.factions?.map(f => f.name).join(', ') || 'None'}
- Historical Events: ${city.historicalEvents?.length || 0} major events

GENERATION PHASES:
${phasesSummary}

IMPORTANT: Write this as a full-page historical narrative (400-600 words), not as a list. Include:

1. **Foundation Story** - How and why was this city founded? What was special about this location?
2. **The Founder's Vision** - Who founded it and what did they hope to build?
3. **Early Development** - How did the city grow in its first century?
4. **Major Events** - What major historical events shaped the city? (Consider the ${city.historicalEvents?.length || 3} major events)
5. **Current State** - What is the city like now? What factions hold power? What tensions exist?
6. **The People** - What are the citizens like? What makes this city unique?
7. **Secrets & Mysteries** - What hidden dangers or mysteries lurk in ${city.name}?
8. **Adventure Hooks** - What would bring adventurers here? What quests exist?

Write with vivid language and atmosphere suitable for a D&D campaign. Make it feel like a real place with real history.`;

      const message = await this.claude.messages.create({
        model: 'claude-opus-4-7',
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return message.content[0].type === 'text' ? message.content[0].text : null;
    } catch (error) {
      console.error(`Error generating lore for ${city.name}:`, error.message);
      return null;
    }
  }

  // Generate lore for all cities (async operation)
  async generateLoreForAllCities(cities) {
    const citiesWithLore = [];

    for (const city of cities) {
      const lore = await this.generateCityLoreWithClaude(city);
      citiesWithLore.push({
        ...city,
        exNovoLore: lore || 'A mysterious settlement waiting to be discovered by adventurers.'
      });
    }

    return citiesWithLore;
  }

  // Generate adventure hooks for a city
  generateAdventureHooks(city) {
    const hooks = [];

    const hookTemplates = [
      `A member of the ${city.factions?.[0]?.name || 'local'} faction has gone missing and rumors swear they were seen near ${city.landmarks?.[0]?.name || 'the old town center'}.`,
      `Strange activity has been reported in the ${city.regions?.[0]?.name || 'outskirts'}. Livestock disappearing, crops wilting. Locals blame curse or sabotage.`,
      `${city.notableCitizens?.[0]?.name || 'A local merchant'} is hiring adventurers for a dangerous job. The pay is good but questions are asked by no one.`,
      `The city council has announced a competition. Win their favor and substantial coin by completing a dangerous task in the nearby ${city.foundingLocation || 'ruins'}`,
      `A traveling sage whispers of ancient treasure buried beneath ${city.landmarks?.[1]?.name || 'the city'}. The ${city.factions?.[1]?.name || 'merchant guild'} wants it found before anyone else does.`,
      `Cultists have been spotted performing rituals in the catacombs beneath ${city.name}. The city guard seems powerless to stop them...`,
      `A powerful artifact is rumored to be hidden in the vault of ${city.landmarks?.[2]?.name || 'the city treasury'}, guarded by ancient magic.`,
      `The ${city.governmentType || 'ruling faction'} is in crisis. A succession dispute threatens civil war. Adventurers might tip the balance.`
    ];

    for (let i = 0; i < Math.min(4, hookTemplates.length); i++) {
      hooks.push({
        id: `hook-${i}`,
        title: `Hook ${i + 1}`,
        description: hookTemplates[i],
        difficulty: i < 2 ? 'Medium' : 'Hard',
        rewards: `${100 * (i + 1)} gold and valuable information`
      });
    }

    return hooks;
  }

  // Generate secrets and rumors
  generateSecretsAndRumors(city) {
    const secrets = [];

    const secretTemplates = [
      `The true ruler is not ${city.governmentType || 'the government'}, but ${city.notableCitizens?.[0]?.name || 'an unknown shadow figure'} who pulls strings from the shadows.`,
      `${city.landmarks?.[0]?.name || 'A key landmark'} is actually a portal to another dimension, sealed long ago by ancient magic.`,
      `${city.notableCitizens?.[1]?.name || 'One of the city leaders'} is actually a vampire/undead/cultist/spy working for an outside power.`,
      `The city was built on top of an ancient burial ground. The dead do not rest peacefully here.`,
      `A terrible plague once nearly destroyed ${city.name}, and many believe a curse still lingers.`,
      `${city.resources?.[0]?.name || 'A key resource'} is more valuable than anyone realizes. Wars have been fought for less.`,
      `The ${city.factions?.[0]?.name || 'ruling faction'} guilty of a terrible crime they've hidden for decades.`
    ];

    for (let i = 0; i < Math.min(3, secretTemplates.length); i++) {
      secrets.push({
        id: `secret-${i}`,
        category: ['Political', 'Magical', 'Historical'][i % 3],
        secret: secretTemplates[i],
        discoveryDifficulty: 'Difficult'
      });
    }

    return secrets;
  }
}

module.exports = ExNovoIntegration;
