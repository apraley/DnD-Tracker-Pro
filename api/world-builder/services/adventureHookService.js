// Advanced Adventure Hooks & Encounters Service
class AdventureHookService {
  generateDetailedHooks(poi, world) {
    const hooks = [];
    const hookCount = 4;
    const hookTypes = this.getHookTypesForPOI(poi.type);

    for (let i = 0; i < hookCount; i++) {
      const template = this.pickRandom(hookTypes);
      hooks.push({
        id: `hook_${poi.id}_${i}`,
        title: template.title,
        description: template.description,
        encounterType: template.encounterType,
        difficulty: Math.floor(Math.random() * 6) + 3, // 3-8 (CR)
        reward: this.generateReward(template.encounterType),
        npcsInvolved: this.generateInvolvedNPCs(),
        requiredSkills: this.generateRequiredSkills(template.encounterType),
        sideEffects: this.generateSideEffects(),
        reward_gold: Math.floor(Math.random() * 500) + 50,
        reward_xp: Math.floor(Math.random() * 2000) + 500,
        story_impact: Math.floor(Math.random() * 100)
      });
    }

    return hooks;
  }

  getHookTypesForPOI(poiType) {
    const hooksMap = {
      dungeon: [
        {
          title: 'The Sealed Vault',
          description: 'Rumors speak of a sealed vault deep within containing lost treasure. The entrance is trapped.',
          encounterType: 'Exploration/Trap Detection'
        },
        {
          title: 'Monster Infestation',
          description: 'A previously cleared dungeon has been reoccupied by dangerous creatures.',
          encounterType: 'Combat/Investigation'
        },
        {
          title: 'The Lost Artifact',
          description: 'An artifact of great power is said to lie in the deepest chambers.',
          encounterType: 'Quest/Combat'
        },
        {
          title: 'Escape the Dungeon',
          description: 'Trapped inside, the party must fight their way out while avoiding collapse.',
          encounterType: 'Survival/Combat'
        }
      ],
      ruins: [
        {
          title: 'Archaeological Discovery',
          description: 'Scholars seek brave adventurers to help excavate an ancient site.',
          encounterType: 'Exploration/Research'
        },
        {
          title: 'Cursed Relics',
          description: 'Items found in the ruins carry ancient curses that must be broken.',
          encounterType: 'Magical/Investigation'
        },
        {
          title: 'The Ancient Guardian',
          description: 'A golem or undead creature guards the ruins, killing those who trespass.',
          encounterType: 'Combat'
        },
        {
          title: 'Lost Civilization\'s Secret',
          description: 'Clues in the ruins point to a civilization\'s hidden legacy.',
          encounterType: 'Investigation/Roleplay'
        }
      ],
      natural_wonder: [
        {
          title: 'Geode of Power',
          description: 'A powerful magical gem lies at the heart of the natural formation.',
          encounterType: 'Exploration/Environmental'
        },
        {
          title: 'Creature Nesting Ground',
          description: 'Rare and dangerous creatures nest here during certain seasons.',
          encounterType: 'Combat/Stealth'
        },
        {
          title: 'Portal to Another Realm',
          description: 'The wonder acts as a natural gateway to another plane of existence.',
          encounterType: 'Exploration/Roleplay'
        },
        {
          title: 'Sacred Pilgrimage',
          description: 'Religious zealots guard this holy place and oppose outsiders.',
          encounterType: 'Roleplay/Combat'
        }
      ],
      shrine: [
        {
          title: 'Divine Quest',
          description: 'A deity has chosen the party for a sacred mission.',
          encounterType: 'Roleplay/Quest'
        },
        {
          title: 'Artifact Theft',
          description: 'A sacred artifact has been stolen from the shrine.',
          encounterType: 'Investigation/Recovery'
        },
        {
          title: 'Heretical Presence',
          description: 'Followers of a rival faith desecrate the holy ground.',
          encounterType: 'Combat/Roleplay'
        },
        {
          title: 'Divine Blessing Needed',
          description: 'Only a blessing from this shrine can save someone or something.',
          encounterType: 'Roleplay/Quest'
        }
      ],
      settlement: [
        {
          title: 'Rescue Mission',
          description: 'Someone in the settlement has been captured or gone missing.',
          encounterType: 'Rescue/Combat'
        },
        {
          title: 'Supply Line Protection',
          description: 'The settlement is under siege; supplies must be brought in.',
          encounterType: 'Escort/Combat'
        },
        {
          title: 'Local Mystery',
          description: 'Strange events plague the settlement; the cause is unknown.',
          encounterType: 'Investigation'
        },
        {
          title: 'Alliance Proposal',
          description: 'The settlement seeks protection or trade agreements.',
          encounterType: 'Roleplay/Negotiation'
        }
      ],
      other: [
        {
          title: 'The Mysterious Phenomenon',
          description: 'Strange occurrences happen in this location.',
          encounterType: 'Investigation'
        },
        {
          title: 'Bandit Camp',
          description: 'Outlaws use this location as a base of operations.',
          encounterType: 'Combat/Stealth'
        },
        {
          title: 'Secret Meeting',
          description: 'Important figures meet here for clandestine purposes.',
          encounterType: 'Roleplay/Intrigue'
        },
        {
          title: 'Treasure Cache',
          description: 'Hidden riches are buried or hidden in this location.',
          encounterType: 'Exploration/Puzzle'
        }
      ]
    };

    return hooksMap[poiType] || hooksMap.other;
  }

  generateReward(encounterType) {
    const rewards = {
      'Combat': ['Defeated creature\'s treasure', 'Magical weapon', 'Rare armor'],
      'Exploration': ['Ancient artifact', 'Map to greater treasure', 'Knowledge of location'],
      'Investigation': ['Information leading elsewhere', 'Recovered item', 'Solved mystery'],
      'Roleplay': ['Ally made', 'Faction favor', 'Quest reward'],
      'Magical': ['Spell scroll', 'Enchanted item', 'Magical knowledge'],
      'Quest': ['Artifact', 'Blessing', 'Special ability']
    };

    for (let type in rewards) {
      if (encounterType.includes(type)) {
        return this.pickRandom(rewards[type]);
      }
    }
    return 'Treasure and experience';
  }

  generateInvolvedNPCs() {
    const npcCount = Math.floor(Math.random() * 3) + 1;
    const npcs = [];
    for (let i = 0; i < npcCount; i++) {
      npcs.push({
        name: this.generateRandomName(),
        role: this.pickRandom(['Ally', 'Enemy', 'Neutral', 'Questgiver', 'Betrayer']),
        importance: Math.floor(Math.random() * 100)
      });
    }
    return npcs;
  }

  generateRequiredSkills(encounterType) {
    const skillMap = {
      'Combat': ['Weapon proficiency', 'Armor proficiency', 'Combat awareness'],
      'Stealth': ['Stealth', 'Perception', 'Disguise'],
      'Exploration': ['Perception', 'Survival', 'Navigation'],
      'Investigation': ['Investigation', 'Insight', 'Arcana'],
      'Magical': ['Arcana', 'Religion', 'Spellcasting'],
      'Roleplay': ['Persuasion', 'Deception', 'Insight'],
      'Puzzle': ['Investigation', 'Intelligence', 'Problem-solving']
    };

    for (let type in skillMap) {
      if (encounterType.includes(type)) {
        return skillMap[type];
      }
    }
    return ['Strength', 'Dexterity', 'Constitution'];
  }

  generateSideEffects() {
    const effects = [
      'Attracts attention of local authorities',
      'Angers a local faction',
      'Causes environmental damage',
      'Releases something dangerous',
      'Attracts bounty hunters',
      'Creates new allies',
      'Triggers chain of events',
      'No major side effects'
    ];
    return this.pickRandom(effects);
  }

  generateRandomName() {
    const names = [
      'Aldric', 'Beatrice', 'Cassian', 'Delilah', 'Ezra', 'Freya',
      'Gideon', 'Hazel', 'Isadora', 'Jasper', 'Kaida', 'Lucius',
      'Minerva', 'Nicolai', 'Ophelia', 'Perseus', 'Quincy', 'Rosalind',
      'Silas', 'Thalia', 'Uther', 'Violet', 'Wyatt', 'Xander'
    ];
    return this.pickRandom(names);
  }

  pickRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
}

module.exports = AdventureHookService;
