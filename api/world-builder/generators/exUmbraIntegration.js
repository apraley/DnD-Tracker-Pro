// ExUmbra Integration - Uses actual ExUmbra framework to generate dungeons
const ExUmbraFramework = require('./exUmbraFramework');
const { Anthropic } = require('@anthropic-ai/sdk');

class ExUmbraIntegration {
  constructor(world, seededRandom, claudeApiKey = null) {
    this.world = world;
    this.random = seededRandom;
    this.claudeApiKey = claudeApiKey;
    this.framework = new ExUmbraFramework(seededRandom);

    if (claudeApiKey) {
      this.claude = new Anthropic({ apiKey: claudeApiKey });
    }
  }

  // Enhance a dungeon/POI using the actual ExUmbra framework
  enhanceDungeonWithExUmbra(poi) {
    // Only enhance if this is a dungeon type POI
    if (!this.isDungeonType(poi.type)) {
      return poi;
    }

    console.log(`🏚️ Enhancing dungeon: ${poi.name} via ExUmbra...`);

    // Generate dungeon through ExUmbra phases
    const exUmbraDungeon = this.framework.generateDungeonThroughExUmbra({
      id: poi.id,
      name: poi.name,
      type: poi.type,
      concept: poi.description || 'A mysterious dungeon waiting to be explored'
    });

    // Merge ExUmbra data into POI
    const enhancedPOI = {
      ...poi,
      ...exUmbraDungeon,

      exUmbraMetadata: {
        generatedVia: 'ExUmbra Framework',
        phases: exUmbraDungeon.exUmbraHistory,
        size: exUmbraDungeon.size,
        difficulty: exUmbraDungeon.difficulty,
        explorationTurns: exUmbraDungeon.explorationTurns,
        aspectCount: exUmbraDungeon.aspects.length,
        featureCount: exUmbraDungeon.features.length,
        threatCount: exUmbraDungeon.threats.length,
        rewardCount: exUmbraDungeon.rewards.length
      },

      hex_x: poi.hex_x,
      hex_y: poi.hex_y,
      dangerLevel: this.calculateDangerLevel(exUmbraDungeon.difficulty),

      architecture: exUmbraDungeon.architecture || [],
      threats: exUmbraDungeon.threats || [],
      rewards: exUmbraDungeon.rewards || [],
      secrets: exUmbraDungeon.secrets || [],
      encounters: exUmbraDungeon.encounters || [],
      heart: exUmbraDungeon.heart || {}
    };

    console.log(`✓ ${poi.name} enhanced: ${exUmbraDungeon.aspects.length} aspects, ${exUmbraDungeon.features.length} features`);

    return enhancedPOI;
  }

  // Enhance all dungeons in POI list
  enhanceAllDungeons(pointsOfInterest) {
    return pointsOfInterest.map(poi => this.enhanceDungeonWithExUmbra(poi));
  }

  // Check if POI is a dungeon type
  isDungeonType(type) {
    const dungeonTypes = ['dungeon', 'ruins', 'cave', 'tomb', 'lair', 'fortress', 'crypt', 'temple', 'mine', 'vault'];
    return dungeonTypes.includes(type?.toLowerCase?.() || '');
  }

  // Calculate danger level from ExUmbra difficulty
  calculateDangerLevel(difficulty) {
    const difficultyMap = {
      'Easy': 5,
      'Medium': 10,
      'Hard': 15,
      'Deadly': 20
    };
    return difficultyMap[difficulty] || 10;
  }

  // Generate detailed dungeon guide using Claude
  async generateDungeonGuideWithClaude(poi) {
    if (!this.claude) {
      console.log(`⚠️ No Claude API key available for ${poi.name} guide`);
      return null;
    }

    try {
      const exUmbraMeta = poi.exUmbraMetadata || {};

      const aspectsText = (poi.aspects || [])
        .map(a => `- ${a.name}: ${a.description}`)
        .join('\n');

      const threatsSummary = poi.threats?.length ? `${poi.threats.length} major threats/enemies` : 'Unknown threats';
      const rewardsSummary = poi.rewards?.length ? `${poi.rewards.length} reward locations` : 'Unknown rewards';
      const secretsSummary = poi.secrets?.length ? `${poi.secrets.length} hidden secrets` : 'Unrevealed mysteries';

      const prompt = `You are an expert dungeon master and game designer. Create a comprehensive dungeon guide for "${poi.name}" as if the entire ExUmbra game was actually played to design it.

DUNGEON DATA FROM EXUMBRA GENERATION:
- Dungeon Type: ${poi.type}
- Size: ${exUmbraMeta.size || 'Unknown'} (Moderate complexity)
- Difficulty: ${exUmbraMeta.difficulty || 'Medium'} (CR encounters for mid-level parties)
- Exploration Turns: ${exUmbraMeta.explorationTurns || 5}
- Features Created: ${exUmbraMeta.featureCount || 0}
- Threats: ${threatsSummary}
- Rewards: ${rewardsSummary}
- Secrets: ${secretsSummary}

ASPECTS (Sources of Danger/Theme):
${aspectsText}

${poi.heart ? `HEART (Central Chamber):
- Name: ${poi.heart.name || 'The Heart'}
- Purpose: ${poi.heart.purpose || 'Central chamber'}
- Inhabitants: ${poi.heart.inhabitants?.length || 0} beings` : ''}

CREATE A FULL DUNGEON GUIDE (800-1200 words) INCLUDING:

1. **Overview** - What is this dungeon? Why does it exist? What's its history?

2. **Layout & Architecture** - Describe the dungeon's structure and visual atmosphere

3. **The Aspects** - For each aspect, explain how it manifests and presents danger

4. **Major Encounters** - Describe 3-4 significant encounters with enemies and loot

5. **The Heart** - The dungeon's most important location and final encounter

6. **Secrets & Mysteries** - Hidden passages, knowledge, and puzzles

7. **Environmental Hazards** - Traps, natural hazards, and magical effects

8. **Treasure & Rewards** - Detailed valuable items and gold

9. **Inhabitants** - Who/what lives here and why

10. **Adventure Hooks** - How to draw parties into the dungeon

Write in an engaging, atmospheric style suitable for actual D&D gameplay.`;

      const message = await this.claude.messages.create({
        model: 'claude-opus-4-7',
        max_tokens: 3000,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return message.content[0].type === 'text' ? message.content[0].text : null;
    } catch (error) {
      console.error(`Error generating guide for ${poi.name}:`, error.message);
      return null;
    }
  }

  // Generate guides for all dungeons (async)
  async generateGuidesForAllDungeons(pointsOfInterest) {
    const pois = [];

    for (const poi of pointsOfInterest) {
      if (!this.isDungeonType(poi.type)) {
        pois.push(poi);
        continue;
      }

      console.log(`📜 Generating dungeon guide for ${poi.name}...`);
      const guide = await this.generateDungeonGuideWithClaude(poi);
      pois.push({
        ...poi,
        exUmbraGuide: guide || 'A dungeon shrouded in mystery, awaiting exploration.'
      });
    }

    return pois;
  }

  // Generate adventure hooks specific to dungeon
  generateDungeonHooks(poi) {
    const hooks = [];

    const hookTemplates = [
      `Locals speak in hushed tones of ${poi.name}. Those who venture inside rarely return...`,
      `A reward has been posted for anyone brave/foolish enough to explore ${poi.name} and retrieve a stolen item.`,
      `A scholar believes ${poi.name} contains ancient knowledge crucial to preventing a coming catastrophe.`,
      `A wizard's apprentice disappeared near ${poi.name} three days ago. The wizard offers great reward for rescue.`,
      `Miners recently broke into ${poi.name} while expanding tunnels. Something dangerous escaped.`,
      `${poi.name} is rumored to contain treasure of such magnitude that kingdoms would wage war for it.`,
      `A cult has taken refuge in ${poi.name} and must be stopped before they complete their ritual.`,
      `The dungeon shifts and changes. Those who entered last week describe a completely different layout than those who entered yesterday.`
    ];

    for (let i = 0; i < Math.min(3, hookTemplates.length); i++) {
      hooks.push({
        id: `dungeon-hook-${i}`,
        title: `Hook ${i + 1}`,
        description: hookTemplates[i],
        difficulty: poi.exUmbraMetadata?.difficulty || 'Medium',
        rewardValue: `${500 + i * 250} gold equivalent + magical treasure`
      });
    }

    return hooks;
  }

  // Generate encounters for ADVENTURE FORGE
  generateEncountersForAdventureForge(poi) {
    const encounters = [];

    for (let i = 0; i < Math.min(3, (poi.threats || []).length); i++) {
      const threat = poi.threats[i];
      encounters.push({
        id: `af-encounter-${poi.id}-${i}`,
        name: threat ? threat.name : `Challenge ${i + 1}`,
        location: `${poi.name} - Chamber ${i + 1}`,
        type: i === poi.threats.length - 1 ? 'Boss Battle' : i === 0 ? 'Introduction' : 'Mid-Dungeon',
        difficulty: poi.exUmbraMetadata?.difficulty || 'Medium',
        partyLevel: Math.floor(i / 2) + 1,
        enemies: this.generateEnemyGroup(threat, poi),
        treasureReward: poi.rewards?.[i] || { type: 'Gold', value: `${100 + i * 100} gp` },
        xpReward: `${250 + i * 250} XP`,
        description: threat ? `${threat.description}` : 'An encounter awaiting brave adventurers'
      });
    }

    return encounters;
  }

  generateEnemyGroup(threat, poi) {
    if (!threat) {
      return [
        {
          name: 'Dungeon Guardian',
          type: 'Enemy',
          count: 1,
          cr: 2,
          loot: '50-100 gp'
        }
      ];
    }

    return [
      {
        name: threat.name,
        type: threat.type || 'Creature',
        count: threat.dangerLevel || 1,
        cr: Math.min(5, threat.dangerLevel || 2),
        loot: `${50 * (threat.dangerLevel || 1)}-${150 * (threat.dangerLevel || 1)} gp`
      }
    ];
  }

  // Generate mini-encounters
  generateMiniEncounters(poi) {
    const miniEncounters = [];

    const miniTemplates = [
      { type: 'Social', description: 'A desperate survivor trapped in the dungeon' },
      { type: 'Puzzle', description: 'An ancient mechanism blocking passage' },
      { type: 'Environmental', description: 'A collapsing ceiling or flooding chamber' },
      { type: 'Social', description: 'A creature willing to negotiate' },
      { type: 'Exploration', description: 'A hidden side chamber with untold secrets' }
    ];

    for (let i = 0; i < Math.min(2, miniTemplates.length); i++) {
      miniEncounters.push({
        id: `mini-encounter-${poi.id}-${i}`,
        name: `${poi.name} - ${miniTemplates[i].type} ${i + 1}`,
        type: miniTemplates[i].type,
        description: miniTemplates[i].description,
        xpReward: `${50 + i * 50} XP`,
        treasureReward: 'Clues or minor items'
      });
    }

    return miniEncounters;
  }

  // Generate loot tables
  generateLootTables(poi) {
    return {
      common: [
        { item: 'Gold coins', value: '10-50 gp', rarity: 'Common' },
        { item: 'Copper trinkets', value: '1-10 gp', rarity: 'Common' },
        { item: 'Cracked gems', value: '5-25 gp', rarity: 'Uncommon' }
      ],
      uncommon: [
        { item: 'Potion of Healing', value: '50 gp', rarity: 'Uncommon' },
        { item: 'Scroll of Magic Missile', value: '75 gp', rarity: 'Uncommon' },
        { item: '+1 Weapon', value: '500+ gp', rarity: 'Uncommon' }
      ],
      rare: poi.rewards?.map(r => ({
        item: r.type,
        value: r.value,
        rarity: r.rarity || 'Rare'
      })) || [
        { item: 'Magical artifact', value: '2000+ gp', rarity: 'Rare' }
      ]
    };
  }
}

module.exports = ExUmbraIntegration;
