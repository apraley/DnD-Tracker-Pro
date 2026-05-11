// ADVENTURE FORGE Export - Formats encounters and content for ADVENTURE FORGE integration
class AdventureForgeExport {
  constructor() {
    this.version = '1.0';
  }

  // Format world data for ADVENTURE FORGE export
  exportWorldForAdventureForge(world) {
    const encounters = [];
    const quests = [];
    const oneShots = [];
    const miniCampaigns = [];

    // Generate encounters from dungeons
    for (const poi of world.pointsOfInterest || []) {
      if (this.isDungeonType(poi.type)) {
        // Main encounters from threats
        encounters.push(...this.generateEncountersFromDungeon(poi, world));

        // Mini-encounters (social, puzzles, etc)
        encounters.push(...this.generateMiniEncounters(poi));

        // One-shot adventures
        oneShots.push(this.generateOneShot(poi, world));

        // Quests for the dungeon
        quests.push(...this.generateQuestsForDungeon(poi, world));
      }
    }

    // Generate encounters and quests from cities
    for (const city of world.cities || []) {
      encounters.push(...this.generateCityEncounters(city, world));
      quests.push(...this.generateCityQuests(city, world));
    }

    // Generate mini-campaign hooks
    if (world.historicalEvents && world.historicalEvents.length > 0) {
      miniCampaigns.push(this.generateMiniCampaign(world));
    }

    return {
      worldName: world.name,
      version: this.version,
      metadata: {
        worldAge: world.age,
        magicLevel: world.magicLevel,
        civilization: world.civilizationAbundance,
        generatedAt: new Date().toISOString()
      },
      encounters: {
        total: encounters.length,
        data: encounters
      },
      quests: {
        total: quests.length,
        data: quests
      },
      oneShots: {
        total: oneShots.length,
        data: oneShots
      },
      miniCampaigns: {
        total: miniCampaigns.length,
        data: miniCampaigns
      }
    };
  }

  // Generate encounters from dungeon threats
  generateEncountersFromDungeon(dungeon, world) {
    const encounters = [];

    if (!dungeon.threats || dungeon.threats.length === 0) {
      return encounters;
    }

    dungeon.threats.slice(0, 3).forEach((threat, idx) => {
      encounters.push({
        id: `encounter-${dungeon.id}-${idx}`,
        name: threat.name || `Threat in ${dungeon.name}`,
        location: dungeon.name,
        type: 'Combat',
        difficulty: dungeon.exUmbraMetadata?.difficulty || 'Medium',
        partyLevel: Math.floor((idx + 2) / 2) + 2,
        description: threat.description || `A dangerous encounter in ${dungeon.name}`,
        enemies: [
          {
            name: threat.name,
            type: threat.type || 'Enemy',
            count: threat.dangerLevel || 1,
            cr: Math.min(10, threat.dangerLevel || 2)
          }
        ],
        loot: {
          gold: `${100 * (threat.dangerLevel || 1)}-${300 * (threat.dangerLevel || 1)} gp`,
          magic: threat.dangerLevel >= 3 ? 'Possible magical item' : 'Possible mundane treasure'
        },
        xpReward: `${250 * (threat.dangerLevel || 1)} XP`,
        objective: `Defeat ${threat.name || 'the threat'} in ${dungeon.name}`,
        rewards: `Combat treasure + ${100 * (threat.dangerLevel || 1)} gp`
      });
    });

    return encounters;
  }

  // Generate mini-encounters (social, puzzles, exploration)
  generateMiniEncounters(dungeon) {
    const miniEncounters = [];

    const miniTypes = [
      { type: 'Social', prompt: 'A creature willing to negotiate or share information' },
      { type: 'Puzzle', prompt: 'An ancient mechanism or riddle blocking progress' },
      { type: 'Environmental', prompt: 'A hazard like flooding, collapse, or magical effect' },
      { type: 'Exploration', prompt: 'A hidden chamber with secrets and treasure' }
    ];

    miniTypes.forEach((mini, idx) => {
      miniEncounters.push({
        id: `mini-${dungeon.id}-${idx}`,
        name: `${dungeon.name} - ${mini.type}`,
        location: dungeon.name,
        type: mini.type,
        difficulty: 'Variable',
        description: mini.prompt,
        xpReward: `50-100 XP`,
        rewards: 'Information, clues, or minor treasure'
      });
    });

    return miniEncounters;
  }

  // Generate one-shot adventure from dungeon
  generateOneShot(dungeon, world) {
    return {
      id: `oneshot-${dungeon.id}`,
      title: `The Mystery of ${dungeon.name}`,
      duration: '3-4 hours',
      partyLevel: '4-6',
      setting: `${dungeon.name} in the world of ${world.name}`,
      plot: `Adventurers are drawn to ${dungeon.name} by rumors of treasure, danger, or mystery. Upon arrival, they discover the dungeon is ${dungeon.exUmbraMetadata?.difficulty || 'moderately'} dangerous with ${dungeon.exUmbraMetadata?.aspectCount || 3} major aspects of danger.`,
      act1: {
        title: 'Arrival and Discovery',
        description: 'The party enters the dungeon and encounters the first challenges',
        encounters: 2,
        exploration: true
      },
      act2: {
        title: 'Deepening Danger',
        description: 'The dungeon reveals its secrets and threats increase in intensity',
        encounters: 2,
        revelations: true
      },
      act3: {
        title: 'Final Confrontation',
        description: `The party faces the heart of ${dungeon.name} and its greatest treasures or threats`,
        encounters: 1,
        boss: true
      },
      rewards: {
        xp: `${dungeon.exUmbraMetadata?.threatCount ? dungeon.exUmbraMetadata.threatCount * 250 : 1000} XP`,
        treasure: `${dungeon.exUmbraMetadata?.rewardCount ? dungeon.exUmbraMetadata.rewardCount * 100 : 500} gp equivalent`,
        magic: 'Possible magical items from rewards'
      }
    };
  }

  // Generate quests for dungeon
  generateQuestsForDungeon(dungeon, world) {
    const quests = [];

    const questTemplates = [
      {
        title: `Retrieve the Lost Artifact of ${dungeon.name}`,
        hook: `A valuable artifact is rumored to be hidden within ${dungeon.name}`,
        reward: `500+ gp and potential magical item`
      },
      {
        title: `Clear ${dungeon.name} of its Menace`,
        hook: `Local settlements are threatened by creatures emerging from ${dungeon.name}`,
        reward: `300+ gp from grateful townspeople`
      },
      {
        title: `Investigate the Mysteries of ${dungeon.name}`,
        hook: `A scholar seeks to understand the history and secrets of ${dungeon.name}`,
        reward: `Knowledge, information, and 200+ gp`
      },
      {
        title: `Rescue the Captured in ${dungeon.name}`,
        hook: `Someone valuable has been taken into ${dungeon.name}`,
        reward: `Gratitude, rewards, and 400+ gp`
      }
    ];

    questTemplates.forEach((template, idx) => {
      quests.push({
        id: `quest-${dungeon.id}-${idx}`,
        title: template.title,
        giver: `Someone in a nearby city`,
        hook: template.hook,
        location: dungeon.name,
        objective: `Venture into ${dungeon.name} and complete the objective`,
        difficulty: dungeon.exUmbraMetadata?.difficulty || 'Medium',
        reward: template.reward,
        questGiver: 'NPC'
      });
    });

    return quests;
  }

  // Generate city encounters
  generateCityEncounters(city, world) {
    const encounters = [];

    // Social encounters with NPCs
    if (city.notableCitizens && city.notableCitizens.length > 0) {
      city.notableCitizens.slice(0, 2).forEach((npc, idx) => {
        encounters.push({
          id: `city-encounter-${city.id}-${idx}`,
          name: `Meeting with ${npc.name}`,
          location: city.name,
          type: 'Social',
          difficulty: 'Variable',
          npc: {
            name: npc.name,
            class: npc.class || 'Unknown',
            level: npc.level || '?',
            alignment: npc.alignment || 'Unknown'
          },
          description: `An encounter with a notable citizen of ${city.name}`,
          outcome: 'Quest hook, information, or combat'
        });
      });
    }

    // Faction conflicts
    if (city.factions && city.factions.length > 1) {
      encounters.push({
        id: `city-encounter-${city.id}-faction`,
        name: `Faction Conflict in ${city.name}`,
        location: city.name,
        type: 'Intrigue/Combat',
        difficulty: 'Hard',
        description: `The ${city.factions[0]?.name || 'local'} faction is in conflict with the ${city.factions[1]?.name || 'rival'} faction`,
        objective: 'Choose sides or mediate the conflict',
        rewards: 'Faction favor + 200+ gp'
      });
    }

    return encounters;
  }

  // Generate city quests
  generateCityQuests(city, world) {
    const quests = [];

    const cityQuestTemplates = [
      {
        title: `Guild Contract in ${city.name}`,
        description: `A local guild needs adventurers for a dangerous job`
      },
      {
        title: `Political Intrigue in ${city.name}`,
        description: `Factional conflict requires skilled intervention`
      },
      {
        title: `Investigation in ${city.name}`,
        description: `Someone has gone missing or stolen something valuable`
      },
      {
        title: `Protect ${city.name}`,
        description: `External threats or internal crime threaten the city`
      }
    ];

    cityQuestTemplates.forEach((template, idx) => {
      quests.push({
        id: `city-quest-${city.id}-${idx}`,
        title: template.title,
        giver: city.notableCitizens?.[idx]?.name || `A citizen of ${city.name}`,
        location: city.name,
        objective: template.description,
        difficulty: 'Medium',
        reward: `${150 + idx * 50} gp and city favor`,
        type: 'Urban adventure'
      });
    });

    return quests;
  }

  // Generate mini-campaign
  generateMiniCampaign(world) {
    return {
      id: 'mini-campaign-main',
      title: `The Rise and Fall of ${world.name}`,
      duration: '5-8 sessions',
      partyLevel: '3-8',
      setting: world.name,
      plot: `The world of ${world.name} faces a threat that reaches across cities and dungeons. Adventurers must uncover the truth, gather allies, and stop a catastrophe.`,
      acts: [
        {
          title: 'Act 1: Gathering Shadows',
          description: 'Strange events plague multiple settlements. The party begins investigating.',
          sessions: 2,
          locations: 'Multiple cities'
        },
        {
          title: 'Act 2: Uncovering the Truth',
          description: 'The party discovers the true nature of the threat and its origins.',
          sessions: 2,
          locations: 'Cities and dungeons'
        },
        {
          title: 'Act 3: The Final Conflict',
          description: 'The party confronts the threat and its source of power.',
          sessions: 2,
          locations: 'Final dungeon or world-shaping location'
        }
      ],
      rewards: {
        xp: '3000+ XP per character',
        treasure: '2000+ gp equivalent',
        magic: 'Major magical items',
        impact: 'World-changing consequences'
      }
    };
  }

  // Check if POI is dungeon type
  isDungeonType(type) {
    const dungeonTypes = ['dungeon', 'ruins', 'cave', 'tomb', 'lair', 'fortress', 'crypt', 'temple', 'mine', 'vault'];
    return dungeonTypes.includes(type?.toLowerCase?.() || '');
  }

  // Export as JSON
  exportJSON(data) {
    return JSON.stringify(data, null, 2);
  }

  // Export as CSV for import into other systems
  exportEncountersCSV(encounters) {
    const headers = ['ID', 'Name', 'Type', 'Location', 'Difficulty', 'Description'];
    const rows = encounters.map(e => [
      e.id,
      e.name,
      e.type,
      e.location,
      e.difficulty,
      e.description
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    return csv;
  }
}

module.exports = AdventureForgeExport;
