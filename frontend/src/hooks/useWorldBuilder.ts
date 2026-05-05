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

      if (!response.ok) throw new Error('Failed to generate world');
      const data = await response.json();
      setWorld(data.world);
      return data.world;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
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
