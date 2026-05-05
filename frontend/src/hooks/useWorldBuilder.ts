// Hook for world builder API interactions
import { useState } from 'react';
import { World, WorldParams, City, PointOfInterest } from '../types/world';

export const useWorldBuilder = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [world, setWorld] = useState<World | null>(null);

  const generateWorld = async (params: WorldParams) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/world-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          params
        })
      });

      if (!response.ok) throw new Error('API not available, generating locally...');
      const data = await response.json();
      setWorld(data.world);
      return data.world;
    } catch (err) {
      // Fallback: Generate world locally
      console.log('Using local world generation...');
      const world = generateLocalWorld(params);
      setWorld(world);
      return world;
    } finally {
      setLoading(false);
    }
  };

  const generateLocalWorld = (params: WorldParams): World => {
    const cities = [];
    const cityCount = Math.min(10 + (params.civilizationAbundance! * 2), 30);

    for (let i = 0; i < cityCount; i++) {
      cities.push({
        id: `city_${i}`,
        name: ['Waterdeep', 'Neverwinter', 'Baldur\'s Gate', 'Candlekeep', 'Luskan', 'Triboar', 'Yartar', 'Everlund', 'Silverymoon', 'Sundabar'][i % 10],
        population: Math.floor(Math.random() * 50000) + 5000,
        hex_x: Math.floor(Math.random() * 50),
        hex_y: Math.floor(Math.random() * 50),
        governmentType: ['Monarchy', 'Democracy', 'Oligarchy', 'Theocracy', 'Merchant Republic'][Math.floor(Math.random() * 5)],
        history: 'A city with a rich and storied past.',
        rulingFactions: [],
        criminalElements: 'Various underworld elements',
        notableCitizens: [],
        economicFocus: ['Agriculture', 'Mining', 'Trade', 'Fishing', 'Crafting'][Math.floor(Math.random() * 5)],
        discovered: false
      });
    }

    const pois = [];
    const poiCount = 20;

    for (let i = 0; i < poiCount; i++) {
      pois.push({
        id: `poi_${i}`,
        name: ['The Ancient Dungeon', 'Crystal Caverns', 'Lost Ruins', 'Sacred Shrine', 'Dragon\'s Peak'][i % 5],
        type: ['dungeon', 'ruins', 'natural_wonder', 'shrine', 'settlement'][i % 5],
        hex_x: Math.floor(Math.random() * 50),
        hex_y: Math.floor(Math.random() * 50),
        dangerLevel: Math.floor(Math.random() * 20) + 1,
        description: 'A mysterious location waiting to be explored.',
        adventureHooks: [],
        discovered: false
      });
    }

    const npcs = [];
    for (let i = 0; i < 20; i++) {
      npcs.push({
        id: `npc_${i}`,
        name: ['Aldric', 'Beatrice', 'Cassian', 'Delilah', 'Ezra'][i % 5],
        type: 'npc',
        race: 'Human',
        alignment: 'Neutral Good',
        description: 'An interesting character.',
        influence: 'Has some local influence'
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
      npcs,
      factions: [],
      weatherPatterns: []
    };
  };

  const generateCityLore = async (cityName: string, civilization: number, magicLevel: number, age: number, mode: 'data_array' | 'claude_ai' = 'data_array') => {
    try {
      const response = await fetch('/api/world-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generateCityLore',
          params: { cityName, civilization, magicLevel, age, lorelMode: mode }
        })
      });

      if (!response.ok) throw new Error('Failed to generate lore');
      const data = await response.json();
      return data.lore;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    }
  };

  const saveWorld = async (name: string, worldData: World) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/world-builder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'current-user-id' // Replace with actual user ID from auth
        },
        body: JSON.stringify({
          action: 'saveWorld',
          params: { name, worldData }
        })
      });

      if (!response.ok) throw new Error('Failed to save world');
      const data = await response.json();
      return data.worldId;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    world,
    loading,
    error,
    generateWorld,
    generateCityLore,
    saveWorld
  };
};
