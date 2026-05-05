// Async Lore Generator - Generates detailed lore asynchronously for cities and dungeons
const { Anthropic } = require('@anthropic-ai/sdk');

class AsyncLoreGenerator {
  constructor(claudeApiKey) {
    this.claudeApiKey = claudeApiKey;
    if (claudeApiKey) {
      this.claude = new Anthropic({ apiKey: claudeApiKey });
    }
    this.queue = [];
    this.isProcessing = false;
  }

  // Queue a city for lore generation
  queueCityLore(city, world) {
    this.queue.push({
      type: 'city',
      id: city.id,
      name: city.name,
      city: city,
      world: world
    });

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  // Queue a dungeon for lore generation
  queueDungeonLore(poi, world) {
    this.queue.push({
      type: 'dungeon',
      id: poi.id,
      name: poi.name,
      poi: poi,
      world: world
    });

    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  // Queue multiple cities
  queueCitiesLore(cities, world) {
    cities.forEach(city => this.queueCityLore(city, world));
  }

  // Queue multiple dungeons
  queueDungeonsLore(pois, world) {
    pois.forEach(poi => this.queueDungeonLore(poi, world));
  }

  // Process the queue
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`📜 Starting async lore generation for ${this.queue.length} locations...`);

    while (this.queue.length > 0) {
      const item = this.queue.shift();

      try {
        if (item.type === 'city') {
          await this.generateCityLore(item.city, item.world);
        } else if (item.type === 'dungeon') {
          await this.generateDungeonLore(item.poi, item.world);
        }
      } catch (error) {
        console.error(`Error generating lore for ${item.name}:`, error.message);
        // Continue with next item instead of failing
      }

      // Small delay between requests to avoid rate limiting
      if (this.queue.length > 0) {
        await this.delay(500);
      }
    }

    this.isProcessing = false;
    console.log('✅ Async lore generation complete');
  }

  // Generate city lore
  async generateCityLore(city, world) {
    if (!this.claude) {
      return null;
    }

    try {
      const exNovoMeta = city.exNovoMetadata || {};
      const phases = exNovoMeta.phases || [];
      const phasesSummary = phases.map(p => p.description || p.phase).join('\n  ');

      const prompt = `You are a master storyteller for D&D worlds. Create a rich, detailed historical write-up of ${city.name}.

CITY DATA:
- Government: ${city.governmentType || 'Unknown'}
- Population: ${city.exNovoMetadata?.totalPopulation || city.population}
- Districts: ${exNovoMeta.districtCount || 0}
- Factions: ${city.factions?.map(f => f.name).join(', ') || 'None'}
- Landmarks: ${city.landmarks?.map(l => l.name).join(', ') || 'None'}

GENERATION PHASES:
${phasesSummary}

Write a 400-600 word historical narrative including:
1. Foundation Story - How and why was this city founded?
2. Early Development - How did the city grow?
3. Major Events - What historical events shaped it?
4. Current State - What is the city like now?
5. The People - What are the citizens like?
6. Secrets & Mysteries - What lurks in ${city.name}?
7. Adventure Hooks - What would bring adventurers here?

Make it vivid, atmospheric, and suitable for D&D gameplay.`;

      const message = await this.claude.messages.create({
        model: 'claude-opus-4-7',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });

      const lore = message.content[0].type === 'text' ? message.content[0].text : null;
      city.generatedLore = lore;
      console.log(`✓ Generated lore for city: ${city.name}`);
      return lore;
    } catch (error) {
      console.error(`Error generating lore for ${city.name}:`, error.message);
      return null;
    }
  }

  // Generate dungeon lore
  async generateDungeonLore(poi, world) {
    if (!this.claude) {
      return null;
    }

    try {
      const exUmbraMeta = poi.exUmbraMetadata || {};

      const aspectsText = (poi.aspects || [])
        .map(a => `- ${a.name}`)
        .join('\n');

      const prompt = `You are an expert dungeon master. Create a comprehensive guide for "${poi.name}".

DUNGEON DATA:
- Type: ${poi.type}
- Difficulty: ${exUmbraMeta.difficulty || 'Medium'}
- Size: ${exUmbraMeta.size || 'Unknown'}
- Aspects: ${aspectsText}
- Threats: ${exUmbraMeta.threatCount || 0}
- Rewards: ${exUmbraMeta.rewardCount || 0}

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

      const message = await this.claude.messages.create({
        model: 'claude-opus-4-7',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      });

      const lore = message.content[0].type === 'text' ? message.content[0].text : null;
      poi.generatedLore = lore;
      console.log(`✓ Generated lore for dungeon: ${poi.name}`);
      return lore;
    } catch (error) {
      console.error(`Error generating lore for ${poi.name}:`, error.message);
      return null;
    }
  }

  // Get generation status
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      queueLength: this.queue.length,
      message: this.isProcessing
        ? `Processing... ${this.queue.length} items remaining`
        : this.queue.length > 0
        ? `Queued: ${this.queue.length} items ready to process`
        : 'Idle'
    };
  }

  // Wait for queue to complete
  async waitForCompletion() {
    while (this.isProcessing || this.queue.length > 0) {
      await this.delay(100);
    }
  }

  // Utility delay function
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = AsyncLoreGenerator;
