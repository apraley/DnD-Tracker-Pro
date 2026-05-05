// ExUmbra NPC Placement - Intelligent placement of NPCs in dungeons
// Creates boss monsters, lieutenants, and inhabitants for dungeons/ruins

const { v4: uuidv4 } = require('uuid');

class ExUmbraNPCPlacement {
  constructor(seededRandom, allCities, allNPCs) {
    this.random = seededRandom;
    this.allCities = allCities || [];
    this.allNPCs = allNPCs || [];
  }

  monsterTypes = [
    'Aberration', 'Beast', 'Celestial', 'Construct', 'Dragon', 'Elemental',
    'Fey', 'Fiend', 'Giant', 'Goblinoid', 'Humanoid', 'Monstrosity',
    'Ooze', 'Plant', 'Undead'
  ];

  // Find nearby city for a POI
  findNearbyCity(poi) {
    if (!this.allCities || this.allCities.length === 0) return null;

    let nearest = null;
    let minDist = Infinity;

    this.allCities.forEach(city => {
      const dist = Math.hypot(
        city.hex_x - poi.hex_x,
        city.hex_y - poi.hex_y
      );

      if (dist < minDist) {
        minDist = dist;
        nearest = city;
      }
    });

    return minDist < 15 ? nearest : null; // Within 15 hex distance
  }

  // Check if nearby city has criminals
  getCityChiminalLeader(city) {
    if (!this.allNPCs) return null;

    return this.allNPCs.find(npc =>
      npc.associatedCityId === city.name && npc.role === 'Criminal Element Head'
    );
  }

  // Generate a dungeon monster/inhabitant
  generateDungeonMonster(role = 'minion', dungeonName = 'Dungeon', dangerLevel = 5) {
    const type = this.monsterTypes[Math.floor(this.random() * this.monsterTypes.length)];

    // Level based on danger
    const baseLevel = Math.max(1, Math.floor(dangerLevel / 2));
    const level = baseLevel + Math.floor(this.random() * 3);

    const roleData = {
      boss: { title: 'Boss', level: baseLevel + 5, cr: dangerLevel },
      lieutenant: { title: 'Lieutenant', level: baseLevel + 2, cr: Math.floor(dangerLevel * 0.6) },
      minion: { title: 'Minion', level: baseLevel, cr: Math.floor(dangerLevel * 0.3) }
    };

    const role_info = roleData[role] || roleData.minion;

    return {
      id: uuidv4(),
      name: `${role_info.title} ${this.generateMonsterName(type)}`,
      type: type,
      role: role,
      level: role_info.level,
      cr: role_info.cr,
      title: role_info.title,
      class: type,
      alignment: this.getMonsterAlignment(type),
      ac: 10 + Math.floor(this.random() * 6),
      hp: Math.max(10, role_info.level * (5 + Math.floor(this.random() * 5))),
      str: Math.floor(this.random() * 8) + 10,
      dex: Math.floor(this.random() * 8) + 10,
      con: Math.floor(this.random() * 8) + 10,
      int: Math.floor(this.random() * 6) + 8,
      wis: Math.floor(this.random() * 6) + 10,
      cha: Math.floor(this.random() * 6) + 8,
      description: `${role_info.title} of ${dungeonName}`,
      dungeonInhabitant: true
    };
  }

  // Generate inhabitants for a dungeon/POI
  generateDungeonInhabitants(poi, nearbyCity = null) {
    const inhabitants = [];
    const threatLevel = poi.dangerLevel || 5;

    // 1 Boss/Leader
    inhabitants.push(this.generateDungeonMonster('boss', poi.name, threatLevel));

    // 1-3 Lieutenants
    const lieutenantCount = Math.floor(this.random() * 2) + 1;
    for (let i = 0; i < lieutenantCount; i++) {
      inhabitants.push(this.generateDungeonMonster('lieutenant', poi.name, threatLevel));
    }

    // 2-5 Minions/Trash
    const minionCount = Math.floor(this.random() * 4) + 2;
    for (let i = 0; i < minionCount; i++) {
      inhabitants.push(this.generateDungeonMonster('minion', poi.name, threatLevel));
    }

    return inhabitants;
  }

  // Check for thematic connections between dungeon and nearby city NPCs
  createCityConnectionIfRelevant(dungeon, nearbyCity, inhabitant) {
    if (!nearbyCity) return null;

    // 30% chance to link to a city criminal
    if (inhabitant.role === 'boss' && this.random() > 0.7) {
      const criminalLeader = this.getCityChiminalLeader(nearbyCity);
      if (criminalLeader) {
        return {
          inhabitantId: inhabitant.id,
          linkedCityNPCId: criminalLeader.id,
          relationship: 'These creatures serve under the command of a crime lord from ' + nearbyCity.name,
          discovered: false
        };
      }
    }

    return null;
  }

  // Process all POIs to add inhabitants
  placeDungeonInhabitants(pois, cities = null, npcs = null) {
    if (cities) this.allCities = cities;
    if (npcs) this.allNPCs = npcs;

    const dungeonEnhancements = {};

    pois.forEach(poi => {
      if (poi.type === 'dungeon' || poi.type === 'ruins') {
        const nearbyCity = this.findNearbyCity(poi);
        const inhabitants = this.generateDungeonInhabitants(poi, nearbyCity);

        // Create connections to city NPCs
        const connections = [];
        inhabitants.forEach(inhabitant => {
          const connection = this.createCityConnectionIfRelevant(poi, nearbyCity, inhabitant);
          if (connection) connections.push(connection);
        });

        dungeonEnhancements[poi.id] = {
          inhabitants,
          nearbyCity: nearbyCity?.name || null,
          cityConnections: connections
        };
      }
    });

    return dungeonEnhancements;
  }

  // Helper functions
  generateMonsterName(type) {
    const names = {
      'Aberration': ['Horror', 'Spawn', 'Wraith', 'Maw'],
      'Beast': ['Stalker', 'Brute', 'Devourer', 'Guardian'],
      'Celestial': ['Servant', 'Herald', 'Knight', 'Seraph'],
      'Construct': ['Sentinel', 'Guardian', 'Golem', 'Automaton'],
      'Dragon': ['Wyrm', 'Drake', 'Serpent', 'Ancient One'],
      'Elemental': ['Essence', 'Spirit', 'Embodiment', 'Force'],
      'Fey': ['Sprite', 'Knight', 'Lord', 'Enchanter'],
      'Fiend': ['Demon', 'Devil', 'Lord', 'Prince'],
      'Giant': ['Chieftain', 'Warlord', 'King', 'Tyrant'],
      'Humanoid': ['Warrior', 'Sorcerer', 'Champion', 'Warlord'],
      'Monstrosity': ['Horror', 'Terror', 'Beast', 'Abomination'],
      'Undead': ['Specter', 'Revenant', 'Lich', 'Shade'],
      'Ooze': ['Mass', 'Blob', 'Pudding', 'Slime']
    };

    const nameList = names[type] || ['Creature', 'Entity', 'Being', 'Horror'];
    return nameList[Math.floor(this.random() * nameList.length)];
  }

  getMonsterAlignment(type) {
    const alignments = {
      'Fiend': 'Chaotic Evil',
      'Celestial': 'Lawful Good',
      'Undead': 'Chaotic Evil',
      'Aberration': 'Chaotic Evil',
      'Dragon': 'Varies',
      'Giant': 'Chaotic Evil',
      'Beast': 'Unaligned',
      'Construct': 'Unaligned'
    };

    return alignments[type] || 'Neutral Evil';
  }
}

module.exports = ExUmbraNPCPlacement;
