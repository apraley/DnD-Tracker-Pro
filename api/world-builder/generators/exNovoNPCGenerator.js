// ExNovo NPC Generator - Creates NPCs for city governance, factions, and criminal elements
// Based on ExNovo city-building system

const { v4: uuidv4 } = require('uuid');

class ExNovoNPCGenerator {
  constructor(seededRandom) {
    this.random = seededRandom;
  }

  // D&D class distribution
  dndClasses = ['Artificer', 'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk', 'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'];
  races = ['Human', 'Elf', 'Dwarf', 'Halfling', 'Dragonborn', 'Gnome', 'Half-Elf', 'Half-Orc', 'Tiefling'];
  alignments = ['Lawful Good', 'Neutral Good', 'Chaotic Good', 'Lawful Neutral', 'True Neutral', 'Chaotic Neutral', 'Lawful Evil', 'Neutral Evil', 'Chaotic Evil'];

  // Generate ability score (4d6 drop lowest)
  generateAbilityScore() {
    const rolls = [this.random(), this.random(), this.random(), this.random()].map(r => Math.floor(r * 6) + 1);
    rolls.sort((a, b) => b - a);
    return rolls.slice(0, 3).reduce((a, b) => a + b, 0);
  }

  // Generate a single NPC for a city role
  generateCityNPC(cityName, role) {
    const npcClass = this.dndClasses[Math.floor(this.random() * this.dndClasses.length)];
    const race = this.races[Math.floor(this.random() * this.races.length)];
    const alignment = this.alignments[Math.floor(this.random() * this.alignments.length)];
    const level = role === 'leader' ? Math.floor(this.random() * 5) + 8 : Math.floor(this.random() * 4) + 4;

    // Generate ability scores
    const abilities = {
      str: this.generateAbilityScore(),
      dex: this.generateAbilityScore(),
      con: this.generateAbilityScore(),
      int: this.generateAbilityScore(),
      wis: this.generateAbilityScore(),
      cha: this.generateAbilityScore()
    };

    const ac = 10 + Math.floor((abilities.dex - 10) / 2);
    const hp = Math.max(1, Math.floor((abilities.con - 10) / 2) + level * 5);

    // Role-based titles
    const titles = {
      leader: ['Mayor', 'Lord', 'Lady', 'Governor', 'Magistrate', 'Duke', 'Duchess'],
      faction: ['Guild Master', 'Baron', 'Countess', 'Captain', 'Patriarch', 'Matriarch'],
      criminal: ['Guildmaster', 'Kingpin', 'Syndicate Boss', 'Chief', 'Boss', 'Don']
    };

    const roleNames = {
      leader: 'City Leader',
      faction: 'Faction Head',
      criminal: 'Criminal Element Head'
    };

    const title = titles[role][Math.floor(this.random() * titles[role].length)];

    return {
      id: uuidv4(),
      name: this.generateName(),
      race,
      class: npcClass,
      level,
      alignment,
      role: roleNames[role],
      title,
      type: role === 'criminal' ? 'Rogue' : npcClass,
      ac,
      hp,
      str: abilities.str,
      dex: abilities.dex,
      con: abilities.con,
      int: abilities.int,
      wis: abilities.wis,
      cha: abilities.cha,
      associatedCityId: cityName,
      description: `${title} of ${cityName}`
    };
  }

  // Generate NPCs for a city
  generateCityNPCs(city) {
    const npcs = [];

    // 1 City Leader
    npcs.push(this.generateCityNPC(city.name, 'leader'));

    // 1-2 Faction Heads (based on faction count)
    const factionCount = Math.min(2, Math.max(1, Math.floor(city.rulingFactions?.length || 1)));
    for (let i = 0; i < factionCount; i++) {
      npcs.push(this.generateCityNPC(city.name, 'faction'));
    }

    // 1 Criminal Element (if city has criminal aspects)
    if (this.random() > 0.4) {
      npcs.push(this.generateCityNPC(city.name, 'criminal'));
    }

    // 2-4 Notable Citizens (merchants, scholars, etc.)
    const notableCount = Math.floor(this.random() * 3) + 2;
    for (let i = 0; i < notableCount; i++) {
      const npc = this.generateCityNPC(city.name, 'notable');
      npc.role = ['Wealthy Merchant', 'Scholar', 'Craftsperson', 'Artist', 'Innkeeper'][Math.floor(this.random() * 5)];
      npcs.push(npc);
    }

    return npcs;
  }

  // Simple name generation (can be enhanced with a names data file)
  generateName() {
    const firstNames = ['Aldric', 'Beatrice', 'Cedric', 'Delilah', 'Ezra', 'Felicity', 'Garrett', 'Helena', 'Ivan', 'Josephine', 'Kael', 'Lydia', 'Marcus', 'Nora', 'Oliver', 'Piper'];
    const lastNames = ['Blackwood', 'Brightblade', 'Copperfield', 'Darkthorn', 'Emberheart', 'Felstone', 'Goldsmith', 'Hawthorne', 'Ironfoot', 'Jasperwind'];

    const first = firstNames[Math.floor(this.random() * firstNames.length)];
    const last = lastNames[Math.floor(this.random() * lastNames.length)];
    return `${first} ${last}`;
  }
}

module.exports = ExNovoNPCGenerator;
