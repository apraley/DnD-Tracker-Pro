/**
 * Donjon World Builder Integration
 * Fetches procedurally generated world data from Donjon
 */

import { World, City, PointOfInterest } from '../types/world';
import { resetNameGenerator, generateWonderName } from './nameGenerator';

/**
 * Fetch a random world from Donjon World Builder
 * Returns structured data we can enhance with lore generation
 */
export async function fetchDonjonWorld(): Promise<{
  towns: Array<{ name: string; x: number; y: number; type: string }>;
  mapData: string;
}> {
  try {
    // Donjon world builder endpoint
    const response = await fetch('https://donjon.bin.codingislove.com/json/random.php?type=world');
    const data = await response.json();

    return {
      towns: data.towns || [],
      mapData: data.map || ''
    };
  } catch (error) {
    console.error('Failed to fetch Donjon world:', error);
    return { towns: [], mapData: '' };
  }
}

/**
 * Fetch random settlements from Donjon
 */
export async function fetchDonjonTowns(count: number = 20): Promise<Array<{ name: string }>> {
  try {
    const towns: Array<{ name: string }> = [];

    // Fetch multiple towns from Donjon's tavern generator
    for (let i = 0; i < Math.ceil(count / 3); i++) {
      const response = await fetch('https://donjon.bin.codingislove.com/json/tavern.php');
      const data = await response.json();

      if (data.tavernName) {
        towns.push({ name: data.tavernName });
      }
    }

    return towns.slice(0, count);
  } catch (error) {
    console.error('Failed to fetch Donjon towns:', error);
    return [];
  }
}

/**
 * Fetch random dungeon names from Donjon
 */
export async function fetchDonjonDungeonNames(count: number = 20): Promise<Array<{ name: string }>> {
  try {
    const dungeons: Array<{ name: string }> = [];

    // Create dungeon names using Donjon's structure
    for (let i = 0; i < count; i++) {
      const response = await fetch('https://donjon.bin.codingislove.com/json/dungeon.php?type=dungeon&depth=' + Math.floor(Math.random() * 5 + 3));
      const data = await response.json();

      if (data.name) {
        dungeons.push({ name: data.name });
      }
    }

    return dungeons;
  } catch (error) {
    console.error('Failed to fetch Donjon dungeons:', error);
    return [];
  }
}

/**
 * Convert Donjon world data to our World format
 * Enhances Donjon data with natural wonders and other elements
 */
export function convertDonjonToWorld(
  donjonData: any,
  params: any,
  townNames: Array<{ name: string }>,
  dungeonNames: Array<{ name: string }>
): World {
  resetNameGenerator();

  const govTypes = ['Monarchy', 'Democracy', 'Oligarchy', 'Theocracy', 'Merchant Republic'];
  const economicFocuses = ['Agriculture', 'Mining', 'Trade', 'Fishing', 'Crafting'];
  const poiTypes = ['dungeon', 'ruins', 'natural_wonder', 'shrine', 'settlement'];

  // Create cities from Donjon towns
  const cities: City[] = townNames.slice(0, Math.min(15 + (params.civilizationAbundance || 5), 30)).map((town, i) => ({
    id: `city_${i}`,
    name: town.name,
    population: Math.floor(Math.random() * 50000) + 5000,
    hex_x: Math.floor(Math.random() * 50),
    hex_y: Math.floor(Math.random() * 50),
    governmentType: govTypes[Math.floor(Math.random() * govTypes.length)],
    history: 'A city with a storied past.',
    rulingFactions: [],
    criminalElements: 'Various underworld elements',
    notableCitizens: [],
    economicFocus: economicFocuses[Math.floor(Math.random() * economicFocuses.length)],
    discovered: false
  }));

  // Create POIs from Donjon dungeons + add natural wonders
  const pois: PointOfInterest[] = [];

  // Add dungeons from Donjon
  const dungeonCount = Math.min(dungeonNames.length, 10);
  dungeonNames.slice(0, dungeonCount).forEach((dungeon, i) => {
    pois.push({
      id: `poi_dungeon_${i}`,
      name: dungeon.name,
      type: 'dungeon',
      hex_x: Math.floor(Math.random() * 50),
      hex_y: Math.floor(Math.random() * 50),
      dangerLevel: Math.floor(Math.random() * 20) + 1,
      description: 'A dangerous dungeon waiting to be explored.',
      adventureHooks: [],
      discovered: false
    });
  });

  // Add natural wonders to fill out the world
  const wonderCount = 20 - pois.length;
  for (let i = 0; i < wonderCount; i++) {
    pois.push({
      id: `poi_wonder_${i}`,
      name: generateWonderName(),
      type: 'natural_wonder',
      hex_x: Math.floor(Math.random() * 50),
      hex_y: Math.floor(Math.random() * 50),
      dangerLevel: Math.floor(Math.random() * 12) + 1,
      description: 'A natural wonder of the world.',
      adventureHooks: [],
      discovered: false
    });
  }

  return {
    name: params.name || 'Generated World',
    age: params.age || 2500,
    magicLevel: params.magicLevel || 5,
    civilizationAbundance: params.civilizationAbundance || 5,
    climate: params.climate || 'Temperate',
    terrain: params.terrain || 'Forest',
    worldSeed: Math.random().toString(),
    createdAt: new Date(),
    cities,
    pointsOfInterest: pois,
    npcs: [],
    factions: [],
    weatherPatterns: []
  };
}
