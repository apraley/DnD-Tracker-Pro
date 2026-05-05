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
    const cities: City[] = [];
    const cityCount = Math.min(10 + ((params.civilizationAbundance || 5) * 2), 30);
    const cityNames = ['Waterdeep', 'Neverwinter', 'Baldur\'s Gate', 'Candlekeep', 'Luskan', 'Triboar', 'Yartar', 'Everlund', 'Silverymoon', 'Sundabar'];
    const govTypes = ['Monarchy', 'Democracy', 'Oligarchy', 'Theocracy', 'Merchant Republic'];
    const economicFocuses = ['Agriculture', 'Mining', 'Trade', 'Fishing', 'Crafting'];

    for (let i = 0; i < cityCount; i++) {
      cities.push({
        id: `city_${i}`,
        name: cityNames[i % cityNames.length],
        population: Math.floor(Math.random() * 50000) + 5000,
        hex_x: Math.floor(Math.random() * 50),
        hex_y: Math.floor(Math.random() * 50),
        governmentType: govTypes[Math.floor(Math.random() * govTypes.length)],
        history: 'A city with a rich and storied past.',
        rulingFactions: [],
        criminalElements: 'Various underworld elements',
        notableCitizens: [],
        economicFocus: economicFocuses[Math.floor(Math.random() * economicFocuses.length)],
        discovered: false
      } as City);
    }

    const pois: PointOfInterest[] = [];
    const poiCount = 20;
    const poiNames = ['The Ancient Dungeon', 'Crystal Caverns', 'Lost Ruins', 'Sacred Shrine', 'Dragon\'s Peak'];
    const poiTypes = ['dungeon', 'ruins', 'natural_wonder', 'shrine', 'settlement'];

    for (let i = 0; i < poiCount; i++) {
      pois.push({
        id: `poi_${i}`,
        name: poiNames[i % poiNames.length],
        type: poiTypes[i % poiTypes.length],
        hex_x: Math.floor(Math.random() * 50),
        hex_y: Math.floor(Math.random() * 50),
        dangerLevel: Math.floor(Math.random() * 20) + 1,
        description: 'A mysterious location waiting to be explored.',
        adventureHooks: [],
        discovered: false
      } as PointOfInterest);
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
    } as World;
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
