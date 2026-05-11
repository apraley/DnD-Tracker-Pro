// ExUmbra Framework Implementation
// Implements the actual ExUmbra dungeon-generation system as described in the ExUmbra PDF

class ExUmbraFramework {
  constructor(seededRandom) {
    this.random = seededRandom;
  }

  // ExUmbra Tables and Mechanics
  dungeonCardPrompts = [
    'Giant', 'Chains & Ropes', 'Portal', 'Treasure Hoard', 'Bones', 'Water',
    'Fire', 'Crystals', 'Darkness', 'Trapped Door', 'Ritual Circle', 'Statues',
    'Throne', 'Library', 'Torture Chamber', 'Throne Room', 'Treasury', 'Laboratory',
    'Garden', 'Prison', 'Bridge', 'Chasm', 'Shaft', 'Passage',
    'Ancient Runes', 'Altar', 'Sarcophagus', 'Artifact', 'Guardian', 'Servant'
  ];

  dungeonCardAdjectives = {
    'Giant': ['Ravenous?', 'Slothful?', 'Gentle?', 'Ancient?', 'Young?'],
    'Chains & Ropes': ['Fragile?', 'Treasured?', 'Cruel?', 'Ornate?', 'Rusted?'],
    'Portal': ['Open?', 'Inscrutable?', 'Impossible?', 'Guarded?', 'Sealed?'],
    'Treasure Hoard': ['Cursed?', 'Hidden?', 'Legendary?', 'Trap-filled?', 'Obvious?'],
    'Water': ['Calm?', 'Raging?', 'Poisoned?', 'Luminous?', 'Frozen?'],
    'Fire': ['Controlled?', 'Wild?', 'Divine?', 'Magical?', 'Spreading?']
  };

  // Dungeon sizes affect number of exploration turns
  sizes = [
    { size: 1, turns: 3, description: 'Small dungeon (few rooms)' },
    { size: 2, turns: 4, description: 'Modest dungeon' },
    { size: 3, turns: 5, description: 'Medium dungeon' },
    { size: 4, turns: 6, description: 'Large dungeon' },
    { size: 5, turns: 7, description: 'Very large dungeon' }
  ];

  // Dungeon difficulties
  difficulties = [
    { level: 1, name: 'Easy', threatMultiplier: 0.5, rewardMultiplier: 0.5 },
    { level: 2, name: 'Medium', threatMultiplier: 1.0, rewardMultiplier: 1.0 },
    { level: 3, name: 'Hard', threatMultiplier: 1.5, rewardMultiplier: 1.5 },
    { level: 4, name: 'Deadly', threatMultiplier: 2.0, rewardMultiplier: 2.0 }
  ];

  // Dungeon Aspects - sources of danger
  aspectCategories = {
    inhabitants: [
      'Undead guardians protecting ancient tombs',
      'Mindless creatures (oozes, slimes) that consume everything',
      'Organized monster tribes with hierarchies',
      'Cultists pursuing forbidden rituals',
      'Aberrations from other planes',
      'Magical constructs left by ancient wizards',
      'Elementals bound to specific locations',
      'Intelligent beings with their own goals',
      'Swarms of insects or vermin',
      'Dragons or other ancient creatures'
    ],
    natural: [
      'Collapsing architecture and falling stone',
      'Flooding and water hazards',
      'Extreme temperatures (fire, cold)',
      'Toxic gases and poisonous air',
      'Biological hazards (fungi, molds)',
      'Thin air at high altitudes',
      'Unstable ground and sinkholes',
      'Earthquakes and tremors',
      'Darkness and poor visibility',
      'Slippery surfaces and ice'
    ],
    magical: [
      'Magical auras that warp reality',
      'Curse effects on those who enter',
      'Temporal anomalies (time distortion)',
      'Planar rifts and dimensional tears',
      'Magical wards and protective spells',
      'Arcane traps and triggers',
      'Enchanted items (helpful or hostile)',
      'Scrying and magical surveillance',
      'Summoning circles and portals',
      'Dead magic zones or wild magic'
    ],
    hazards: [
      'Deadly mechanical traps',
      'Poison and disease',
      'Starvation and dehydration',
      'Loud noises attracting attention',
      'Bloodhounds tracking intruders',
      'Alarms and warning systems',
      'Pitfalls and bottomless pits',
      'Crushing walls and ceiling traps',
      'Disintegration hazards',
      'Petrification threats'
    ]
  };

  // Feature prompts - used with aspects to generate features
  featurePrompts = [
    'A barrier or wall blocking progress',
    'A creature or group of creatures',
    'A source of danger or threat',
    'Evidence of previous inhabitants',
    'A valuable discovery or treasure sign',
    'A clue or hint about the dungeon',
    'A choice or decision point',
    'A puzzle or locked mechanism',
    'An environmental hazard',
    'A sign of the aspect\'s influence'
  ];

  // Threats - dangerous enemies and hazards
  threatTypes = [
    { name: 'Boss-level enemy', danger: 'Deadly', hp: '100+', abilities: 'Multiple attack types' },
    { name: 'Elite enemy', danger: 'Hard', hp: '50-100', abilities: 'Powerful special abilities' },
    { name: 'Minion group', danger: 'Medium', hp: '10-50 each', abilities: 'Basic attacks' },
    { name: 'Environmental threat', danger: 'Variable', trigger: 'Location-based' },
    { name: 'Trap with teeth', danger: 'Hard', trigger: 'Mechanical or magical' },
    { name: 'Curse or curse effect', danger: 'Lingering', effect: 'Persistent penalty' }
  ];

  // Rewards - treasure and loot
  rewardTypes = [
    { type: 'Gold/Treasure', amount: '100-1000 gold equivalent', rarity: 'Common' },
    { type: 'Magical Item', rarity: 'Uncommon', plusValue: '+1 to +2' },
    { type: 'Legendary Item', rarity: 'Rare', plusValue: '+3 or special property' },
    { type: 'Artifact', rarity: 'Legendary', effect: 'World-changing power' },
    { type: 'Knowledge/Information', rarity: 'Variable', value: 'Plot-relevant' },
    { type: 'NPC Ally', rarity: 'Rare', benefit: 'Companion or informant' }
  ];

  // Generate a complete dungeon through ExUmbra phases
  generateDungeonThroughExUmbra(params) {
    const dungeon = {
      id: params.id,
      name: params.name,
      type: params.type || 'ruins',
      exUmbraHistory: [],
      aspects: [],
      guidLines: [],
      architecture: [],
      features: [],
      threats: [],
      rewards: [],
      inhabitants: [],
      encounterLevel: 'Medium'
    };

    // Discussion Phase (implicit)
    dungeon.exUmbraHistory.push({
      phase: 'Discussion',
      description: `Dungeon concept: ${params.concept || 'Unknown labyrinth'}`
    });

    // Planning Phase: Define size, difficulty, and aspects
    this.planningPhase(dungeon, params);

    // Foundation Phase: Create guide lines and heart placeholder
    this.foundationPhase(dungeon, params);

    // Discovery Phase: Explore and detail the dungeon
    this.discoveryPhase(dungeon, params);

    // Cleanup Phase: Final details
    this.cleanupPhase(dungeon, params);

    return dungeon;
  }

  planningPhase(dungeon, params) {
    // Determine size (affects exploration turns)
    const sizeRoll = Math.floor(this.random() * this.sizes.length);
    dungeon.size = this.sizes[sizeRoll].size;
    dungeon.explorationTurns = this.sizes[sizeRoll].turns;
    dungeon.exUmbraHistory.push({
      phase: 'Planning',
      step: 'Size',
      result: `${dungeon.size} (${this.sizes[sizeRoll].description})`
    });

    // Determine difficulty
    const diffRoll = Math.floor(this.random() * this.difficulties.length);
    const difficulty = this.difficulties[diffRoll];
    dungeon.difficulty = difficulty.name;
    dungeon.threatMultiplier = difficulty.threatMultiplier;
    dungeon.rewardMultiplier = difficulty.rewardMultiplier;
    dungeon.exUmbraHistory.push({ step: 'Difficulty', result: difficulty.name });

    // Generate Aspects - minimum 3 + 1 per 6 size
    const minAspects = 3 + Math.floor(dungeon.size / 6);
    dungeon.aspects = [];

    // Add at least one inhabitant aspect
    const inhabitantAspect = this.aspectCategories.inhabitants[
      Math.floor(this.random() * this.aspectCategories.inhabitants.length)
    ];
    dungeon.aspects.push({
      id: 'aspect-0',
      category: 'inhabitants',
      name: inhabitantAspect,
      description: `The dungeon is inhabited by: ${inhabitantAspect}`
    });

    // Add at least one environmental/natural aspect
    const naturalAspect = this.aspectCategories.natural[
      Math.floor(this.random() * this.aspectCategories.natural.length)
    ];
    dungeon.aspects.push({
      id: 'aspect-1',
      category: 'natural',
      name: naturalAspect,
      description: `Natural hazard: ${naturalAspect}`
    });

    // Add remaining aspects (mix of categories)
    for (let i = 2; i < minAspects; i++) {
      const categories = Object.keys(this.aspectCategories);
      const category = categories[Math.floor(this.random() * categories.length)];
      const categoryAspects = this.aspectCategories[category];
      const aspect = categoryAspects[Math.floor(this.random() * categoryAspects.length)];

      dungeon.aspects.push({
        id: `aspect-${i}`,
        category: category,
        name: aspect,
        description: `${category}: ${aspect}`
      });
    }

    dungeon.exUmbraHistory.push({
      step: 'Aspects',
      result: `${dungeon.aspects.length} aspects defined`,
      details: dungeon.aspects.map(a => a.name)
    });
  }

  foundationPhase(dungeon, params) {
    // Create guide lines (abstract structure guides)
    dungeon.guidLines = [];
    for (let i = 0; i < 4 + Math.floor(dungeon.size * 1.5); i++) {
      dungeon.guidLines.push({
        id: `guideline-${i}`,
        type: this.random() > 0.5 ? 'straight' : 'curved',
        description: `Guide line ${i + 1} for structuring exploration`
      });
    }

    // Create heart placeholder (central room location)
    dungeon.heart = {
      id: 'heart',
      placeholder: true,
      description: 'The heart of the dungeon - will be detailed in discovery phase',
      purpose: 'Central chamber or final encounter location'
    };

    dungeon.exUmbraHistory.push({
      phase: 'Foundation',
      guidLinesCreated: dungeon.guidLines.length,
      heartPlaced: true
    });
  }

  discoveryPhase(dungeon, params) {
    const explorationTurns = dungeon.explorationTurns;
    let threatTokens = Math.floor(explorationTurns * dungeon.threatMultiplier * 5);
    let rewardTokens = Math.floor(explorationTurns * dungeon.rewardMultiplier * 3);

    for (let turn = 0; turn < explorationTurns; turn++) {
      // Halfway through: Tremor turn (major change)
      if (turn === Math.floor(explorationTurns / 2)) {
        this.tremorTurn(dungeon);
      }

      // If at heart turn (special collaborative turn)
      if (turn === Math.floor(explorationTurns / 2) + 1) {
        this.heartTurn(dungeon);
      }

      // Regular exploration turn
      const card = this.drawDungeonCard();
      const aspect = dungeon.aspects[Math.floor(this.random() * dungeon.aspects.length)];

      const feature = {
        turn: turn,
        cardPrompt: card,
        aspect: aspect.name,
        name: this.generateFeatureName(card, aspect),
        description: `A ${card.toLowerCase()} feature related to: ${aspect.name}`,
        complexity: Math.floor(this.random() * 3) + 1 // 1-3
      };

      dungeon.features.push(feature);

      // Add threats (enemy creatures, traps)
      if (threatTokens > 0 && this.random() > 0.4) {
        const threatCount = Math.floor(this.random() * 2) + 1;
        const spent = Math.min(threatCount * 2, threatTokens);
        threatTokens -= spent;

        dungeon.threats.push({
          turn: turn,
          name: this.generateThreatName(aspect),
          type: this.threatTypes[Math.floor(this.random() * this.threatTypes.length)].name,
          description: `A threat related to ${aspect.name}`,
          dangerLevel: Math.floor(spent / 2) + 1
        });
      }

      // Add rewards (treasure, artifacts)
      if (rewardTokens > 0 && this.random() > 0.5) {
        const spent = Math.min(Math.floor(this.random() * 3) + 1, rewardTokens);
        rewardTokens -= spent;

        dungeon.rewards.push({
          turn: turn,
          type: this.rewardTypes[Math.floor(this.random() * this.rewardTypes.length)].type,
          value: Math.floor(spent * 50) + ' gold equivalent',
          rarity: spent >= 3 ? 'Rare' : spent >= 2 ? 'Uncommon' : 'Common'
        });
      }
    }

    dungeon.exUmbraHistory.push({
      phase: 'Discovery',
      explorationTurns: explorationTurns,
      featuresCreated: dungeon.features.length,
      threatsPlaced: dungeon.threats.length,
      rewardsPlaced: dungeon.rewards.length
    });
  }

  tremorTurn(dungeon) {
    dungeon.tremor = {
      type: 'Dungeon-wide change',
      event: this.tremorEvents()[Math.floor(this.random() * this.tremorEvents().length)],
      description: 'A massive shift in the dungeon\'s structure or inhabitants'
    };
  }

  heartTurn(dungeon) {
    // The heart (final chamber) gets detailed and populated
    dungeon.heart = {
      id: 'heart',
      placeholder: false,
      name: this.generateHeartName(),
      purpose: this.heartPurposes()[Math.floor(this.random() * this.heartPurposes().length)],
      description: 'The heart of the dungeon - central chamber or final confrontation',
      inhabitants: this.generateHeartInhabitants(),
      treasure: this.heartTreasure()
    };
  }

  cleanupPhase(dungeon, params) {
    // Add finishing touches
    dungeon.secrets = this.generateSecrets(dungeon);
    dungeon.encounters = this.generateEncounters(dungeon);

    dungeon.exUmbraHistory.push({
      phase: 'Cleanup',
      secretsAdded: dungeon.secrets.length,
      encountersDesigned: dungeon.encounters.length,
      complete: true
    });
  }

  // Helper methods
  drawDungeonCard() {
    return this.dungeonCardPrompts[Math.floor(this.random() * this.dungeonCardPrompts.length)];
  }

  generateFeatureName(card, aspect) {
    const features = [
      `The ${card} Chamber`,
      `${card} Guardians`,
      `Ancient ${card}`,
      `Mysterious ${card}`,
      `Trapped ${card}`,
      `Sacred ${card}`,
      `Cursed ${card}`
    ];
    return features[Math.floor(this.random() * features.length)];
  }

  generateThreatName(aspect) {
    const threats = [
      `Guardian of ${aspect.name}`,
      `Creature defending the ${aspect.name}`,
      `Ancient ${aspect.name} trap`,
      `Manifestation of ${aspect.name}`,
      `Servant protecting ${aspect.name}`
    ];
    return threats[Math.floor(this.random() * threats.length)];
  }

  tremorEvents() {
    return [
      'Collapse: Entire sections of the dungeon collapse',
      'Flood: Water suddenly fills lower chambers',
      'Awakening: Ancient guardians awaken and move',
      'Rupture: A barrier or seal breaks open',
      'Convergence: Multiple forces collide',
      'Transformation: The dungeon transforms physically'
    ];
  }

  heartPurposes() {
    return [
      'Throne room of the dungeon\'s ruler',
      'Ancient ritual chamber',
      'Treasury and treasure vault',
      'Sanctuary of a powerful artifact',
      'Prison for something terrible',
      'Source of the dungeon\'s power'
    ];
  }

  generateHeartName() {
    const names = [
      'The Grand Hall',
      'The Obsidian Chamber',
      'The Throne Room',
      'The Sacred Sanctum',
      'The Vault of Ages',
      'The Core of Power'
    ];
    return names[Math.floor(this.random() * names.length)];
  }

  generateHeartInhabitants() {
    const count = Math.floor(this.random() * 3) + 1;
    const inhabitants = [];
    for (let i = 0; i < count; i++) {
      inhabitants.push({
        type: 'Guardian or Inhabitant',
        power: Math.floor(this.random() * 4) + 1,
        description: 'A powerful being dwelling in the heart'
      });
    }
    return inhabitants;
  }

  heartTreasure() {
    return {
      type: 'Artifact or Major Treasure',
      value: 'Priceless',
      description: 'The greatest treasure the dungeon has to offer'
    };
  }

  generateSecrets(dungeon) {
    const secrets = [];
    for (let i = 0; i < Math.floor(this.random() * 2) + 1; i++) {
      secrets.push({
        id: `secret-${i}`,
        description: 'A hidden truth about the dungeon',
        discovery: 'Hidden until revealed by exploration'
      });
    }
    return secrets;
  }

  generateEncounters(dungeon) {
    const encounters = [];
    const threatCount = Math.min(dungeon.threats.length, 3);
    for (let i = 0; i < threatCount; i++) {
      encounters.push({
        id: `encounter-${i}`,
        threat: dungeon.threats[i] ? dungeon.threats[i].name : 'Unknown',
        location: `Feature ${Math.floor(this.random() * dungeon.features.length)}`,
        difficulty: 'Medium to Hard'
      });
    }
    return encounters;
  }
}

module.exports = ExUmbraFramework;
