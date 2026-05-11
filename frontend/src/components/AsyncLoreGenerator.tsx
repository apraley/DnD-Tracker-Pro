import { useState, useEffect } from 'react';
import { World, City, PointOfInterest } from '../types/world';
import './AsyncLoreGenerator.css';

interface AsyncLoreGeneratorProps {
  world: World;
  onLoreGenerated: (updatedWorld: World) => void;
}

interface GenerationProgress {
  total: number;
  completed: number;
  currentItem: string;
  itemsQueued: Array<{ id: string; name: string; type: 'city' | 'dungeon' }>;
  isProcessing: boolean;
  startTime?: number;
  estimatedTimeRemaining?: number;
}

export default function AsyncLoreGeneratorUI({ world, onLoreGenerated, apiKey }: AsyncLoreGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress>({
    total: 0,
    completed: 0,
    currentItem: '',
    itemsQueued: [],
    isProcessing: false,
    startTime: undefined,
    estimatedTimeRemaining: undefined
  });
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Auto-select all by default
  useEffect(() => {
    const allIds = new Set<string>();
    world.cities.forEach(city => allIds.add(`city-${city.id}`));
    world.pointsOfInterest.forEach(poi => allIds.add(`poi-${poi.id}`));
    setSelectedItems(allIds);
  }, [world]);

  const handleToggleItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedItems.size === world.cities.length + world.pointsOfInterest.length) {
      setSelectedItems(new Set());
    } else {
      const allIds = new Set<string>();
      world.cities.forEach(city => allIds.add(`city-${city.id}`));
      world.pointsOfInterest.forEach(poi => allIds.add(`poi-${poi.id}`));
      setSelectedItems(allIds);
    }
  };

  const startGeneration = async () => {
    // Build queue
    const queue: Array<{ id: string; name: string; type: 'city' | 'dungeon'; data: City | PointOfInterest }> = [];

    selectedItems.forEach(id => {
      if (id.startsWith('city-')) {
        const cityId = id.replace('city-', '');
        const city = world.cities.find(c => c.id === cityId);
        if (city && !city.generatedLore) {
          queue.push({ id: city.id, name: city.name, type: 'city', data: city });
        }
      } else if (id.startsWith('poi-')) {
        const poiId = id.replace('poi-', '');
        const poi = world.pointsOfInterest.find(p => p.id === poiId);
        if (poi && !poi.generatedLore) {
          queue.push({ id: poi.id, name: poi.name, type: 'dungeon', data: poi });
        }
      }
    });

    if (queue.length === 0) {
      alert('No items without lore selected, or all selected items already have lore.');
      return;
    }

    setProgress({
      total: queue.length,
      completed: 0,
      currentItem: queue[0].name,
      itemsQueued: queue.map(item => ({ id: item.id, name: item.name, type: item.type })),
      isProcessing: true,
      startTime: Date.now(),
      estimatedTimeRemaining: queue.length * 8 // ~8 seconds per item
    });

    // Make a copy of the world to update
    const updatedWorld = JSON.parse(JSON.stringify(world)) as World;

    try {
      // Process queue sequentially
      for (let i = 0; i < queue.length; i++) {
        const item = queue[i];

        try {
          const lore = await generateLore(item.name, item.type, item.data, world);

          if (item.type === 'city') {
            const cityIndex = updatedWorld.cities.findIndex(c => c.id === item.id);
            if (cityIndex !== -1) {
              updatedWorld.cities[cityIndex].generatedLore = lore;
            }
          } else {
            const poiIndex = updatedWorld.pointsOfInterest.findIndex(p => p.id === item.id);
            if (poiIndex !== -1) {
              updatedWorld.pointsOfInterest[poiIndex].generatedLore = lore;
            }
          }

          // Update progress
          const elapsedSeconds = (Date.now() - (progress.startTime || Date.now())) / 1000;
          const avgTimePerItem = elapsedSeconds / (i + 1);
          const remainingItems = queue.length - (i + 1);
          const estimatedRemaining = Math.ceil(avgTimePerItem * remainingItems);

          setProgress(prev => ({
            ...prev,
            completed: i + 1,
            currentItem: i + 1 < queue.length ? queue[i + 1].name : 'Finalizing...',
            estimatedTimeRemaining: estimatedRemaining
          }));

          // Small delay between requests to avoid rate limiting
          if (i < queue.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error) {
          console.error(`Error generating lore for ${item.name}:`, error);
          // Continue with next item instead of failing
        }
      }

      // Save the updated world
      onLoreGenerated(updatedWorld);

      setProgress(prev => ({
        ...prev,
        isProcessing: false,
        currentItem: 'Complete! ✨'
      }));
    } catch (error) {
      console.error('Lore generation error:', error);
      alert(`Error during lore generation: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProgress(prev => ({ ...prev, isProcessing: false }));
    }
  };

  const generateLore = async (_name: string, type: 'city' | 'dungeon', entityData: City | PointOfInterest, world: World): Promise<string> => {
    // Call backend API to generate lore
    const response = await fetch('/api/world-builder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generateLoreForEntity',
        params: {
          entityType: type,
          entityName: entityData.name,
          entityData: entityData,
          world: world
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.statusText}`);
    }

    const responseData = await response.json();
    const lore = responseData.lore || '';
    return lore;
  };

  const progressPercent = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
  const allSelected = selectedItems.size === world.cities.length + world.pointsOfInterest.length;
  const noneSelected = selectedItems.size === 0;

  return (
    <>
      <button
        className="lore-gen-btn"
        onClick={() => setIsOpen(true)}
        title="Generate detailed lore for cities and dungeons using Claude AI"
      >
        ✨ Generate Lore
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => !progress.isProcessing && setIsOpen(false)}>
          <div className="lore-gen-modal" onClick={e => e.stopPropagation()}>
            <button
              className="close-btn"
              onClick={() => !progress.isProcessing && setIsOpen(false)}
              disabled={progress.isProcessing}
            >
              ✕
            </button>

            <h2>✨ Async Lore Generation</h2>
            <p className="modal-subtitle">
              Generate detailed historical write-ups for cities and dungeon guides
            </p>

            {!progress.isProcessing ? (
              <>
                {/* Selection Section */}
                <div className="selection-section">
                  <div className="selection-header">
                    <h3>Select Items to Generate</h3>
                    <button
                      className="select-toggle-btn"
                      onClick={handleToggleAll}
                    >
                      {allSelected ? 'Deselect All' : noneSelected ? 'Select All' : 'Toggle All'}
                    </button>
                  </div>

                  <div className="selection-list">
                    <div className="selection-category">
                      <h4>🏰 Cities ({world.cities.length})</h4>
                      {world.cities.map(city => (
                        <label key={`city-${city.id}`} className="selection-item">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(`city-${city.id}`)}
                            onChange={() => handleToggleItem(`city-${city.id}`)}
                            disabled={progress.isProcessing}
                          />
                          <span>{city.name}</span>
                          {city.generatedLore && <span className="has-lore">✓ Has lore</span>}
                        </label>
                      ))}
                    </div>

                    <div className="selection-category">
                      <h4>🏚️ Dungeons ({world.pointsOfInterest.length})</h4>
                      {world.pointsOfInterest.map(poi => (
                        <label key={`poi-${poi.id}`} className="selection-item">
                          <input
                            type="checkbox"
                            checked={selectedItems.has(`poi-${poi.id}`)}
                            onChange={() => handleToggleItem(`poi-${poi.id}`)}
                            disabled={progress.isProcessing}
                          />
                          <span>{poi.name}</span>
                          {poi.generatedLore && <span className="has-lore">✓ Has lore</span>}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="selection-stats">
                    <span>{selectedItems.size} items selected</span>
                  </div>
                </div>

                {/* Start Button */}
                <button
                  className="btn btn-primary start-btn"
                  onClick={startGeneration}
                  disabled={noneSelected}
                >
                  Start Generation
                </button>
              </>
            ) : (
              <>
                {/* Progress Section */}
                <div className="progress-section">
                  <div className="progress-header">
                    <h3>Generating Lore...</h3>
                    <span className="progress-count">
                      {progress.completed} / {progress.total}
                    </span>
                  </div>

                  <div className="progress-bar-container">
                    <div
                      className="progress-bar"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="progress-percent">{Math.round(progressPercent)}%</div>

                  <div className="current-item">
                    <strong>Current:</strong> {progress.currentItem}
                  </div>

                  {progress.estimatedTimeRemaining !== undefined && progress.estimatedTimeRemaining > 0 && (
                    <div className="eta">
                      <strong>Estimated time remaining:</strong>{' '}
                      {progress.estimatedTimeRemaining < 60
                        ? `${progress.estimatedTimeRemaining}s`
                        : `${Math.ceil(progress.estimatedTimeRemaining / 60)}m`}
                    </div>
                  )}

                  {progress.completed === progress.total && (
                    <div className="completion-message">
                      ✨ All lore generated successfully!
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
