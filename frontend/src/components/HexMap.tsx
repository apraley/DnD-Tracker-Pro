// Interactive Hex Map Component for D&D World Builder
import React, { useState, useRef, useEffect } from 'react';
import { World, City, PointOfInterest } from '../types/world';
import styles from './HexMap.module.css';

interface HexMapProps {
  world: World;
  onHexHover: (hexX: number, hexY: number) => void;
  onHexClick: (entity: City | PointOfInterest) => void;
  mapVisualization?: string;
}

const HexMap: React.FC<HexMapProps> = ({ world, onHexHover, onHexClick, mapVisualization }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredEntity, setHoveredEntity] = useState<City | PointOfInterest | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showVisualization, setShowVisualization] = useState(false);

  // Dynamically calculate hex size based on viewport
  const getHexSize = () => {
    if (!canvasRef.current) return 30;
    const canvas = canvasRef.current;
    // Try to fit entire 51x51 map in view at 1x zoom
    const mapPixelWidth = canvas.width * 0.9;
    const estimatedHexSize = mapPixelWidth / (52 * 1.5); // Account for hex overlap
    return Math.max(15, Math.min(estimatedHexSize, 40));
  };

  let HEX_SIZE = getHexSize();
  const HEX_PADDING = 2;
  const MAP_WIDTH = 52; // Matches backend 51x51 grid (0-50)
  const MAP_HEIGHT = 52;

  // Terrain color map
  const getTerrainColor = (terrain: string, climate: string): string => {
    const terrainColors: { [key: string]: string } = {
      'Mountain': '#8B7355',
      'Forest': '#228B22',
      'Plains': '#90EE90',
      'Desert': '#F4A460',
      'Swamp': '#556B2F',
      'Coast': '#87CEEB',
      'Valley': '#98FB98',
      'River': '#4682B4'
    };

    const climateWaterColors: { [key: string]: string } = {
      'Tropical': '#1E90FF',
      'Temperate': '#87CEEB',
      'Arid': '#FFE4B5',
      'Arctic': '#E0FFFF',
      'Volcanic': '#A9A9A9'
    };

    // For water/coast areas in any climate
    if (terrain === 'Coast' || terrain === 'River') {
      return climateWaterColors[climate] || '#4682B4';
    }

    return terrainColors[terrain] || '#90EE90';
  };

  // Convert offset coordinates to pixel coordinates (pointy-top hex)
  // Formula: pixelX = size * (3/2 * col), pixelY = size * (√3/2 * col + √3 * row)
  const hexToPixel = (col: number, row: number) => {
    const size = HEX_SIZE;
    const pixelX = size * (3 / 2 * col);
    const pixelY = size * (Math.sqrt(3) / 2 * col + Math.sqrt(3) * row);
    return { pixelX, pixelY };
  };


  // Draw a single hex (pointy-top, centered at centerX, centerY)
  const drawHex = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    size: number,
    color: string
  ) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      // Pointy-top hex: angles start at 0° (right)
      const angle = (Math.PI / 3) * i;
      const x = centerX + size * Math.cos(angle);
      const y = centerY + size * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  // Draw a city icon
  const drawCityIcon = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number
  ) => {
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // Draw a POI icon
  const drawPOIIcon = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    type: string
  ) => {
    const colors: Record<string, string> = {
      dungeon: '#8B0000',
      ruins: '#8B7355',
      natural_wonder: '#228B22',
      shrine: '#4169E1',
      settlement: '#A9A9A9',
      other: '#696969'
    };

    ctx.fillStyle = colors[type] || '#696969';
    ctx.beginPath();
    ctx.rect(centerX - 4, centerY - 4, 8, 8);
    ctx.fill();
  };

  // Draw topographical icons for terrain
  const drawTerrainIcon = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    terrain: string
  ) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 0.5;

    switch (terrain) {
      case 'Mountain':
        // Draw mountain peaks
        ctx.beginPath();
        ctx.moveTo(centerX - 3, centerY + 2);
        ctx.lineTo(centerX - 1, centerY - 2);
        ctx.lineTo(centerX + 1, centerY + 1);
        ctx.lineTo(centerX + 3, centerY - 1);
        ctx.stroke();
        break;
      case 'Forest':
        // Draw trees
        for (let i = 0; i < 2; i++) {
          const x = centerX - 2 + i * 2;
          ctx.beginPath();
          ctx.arc(x, centerY, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'Water':
      case 'River':
        // Draw water waves
        ctx.beginPath();
        ctx.arc(centerX - 1, centerY, 1, 0, Math.PI * 2);
        ctx.arc(centerX + 1, centerY, 1, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'Desert':
        // Draw sand dunes
        ctx.beginPath();
        ctx.arc(centerX, centerY, 1.5, 0, Math.PI);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(centerX + 2, centerY, 1, 0, Math.PI);
        ctx.stroke();
        break;
      case 'Swamp':
        // Draw marsh symbols
        ctx.fillRect(centerX - 2, centerY - 1, 1, 2);
        ctx.fillRect(centerX, centerY - 1, 1, 2);
        ctx.fillRect(centerX + 2, centerY - 1, 1, 2);
        break;
      case 'Coast':
        // Draw beach pattern
        ctx.beginPath();
        ctx.moveTo(centerX - 3, centerY);
        ctx.lineTo(centerX + 3, centerY);
        ctx.stroke();
        break;
    }
  };

  // Determine hex terrain based on world characteristics (simple seeded approach)
  const getHexTerrain = (col: number, row: number): string => {
    const seed = parseInt(world.worldSeed || '0', 10);
    const hash = (seed + col * 73856093 ^ row * 19349663) % 100;

    // Distribute terrain based on world characteristics
    if (world.terrain === 'Mountain') return 'Mountain';
    if (world.terrain === 'Forest') return 'Forest';
    if (world.terrain === 'Desert') return 'Desert';

    // For mixed terrains, create varied landscape
    if (hash < 20) return 'Mountain';
    if (hash < 35) return 'Forest';
    if (hash < 45) return 'Plains';
    if (hash < 55) world.climate === 'Tropical' ? 'Swamp' : 'Plains';
    if (hash < 70) return 'Coast';
    if (hash < 85) return 'River';
    return 'Plains';
  };

  // Render the map with proper coordinate transformations
  const renderMap = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Recalculate hex size for responsive design
    HEX_SIZE = getHexSize();

    // Clear canvas with sky color
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply transformations in order: translate to center → scale (zoom) → apply pan
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(pan.x / zoom, pan.y / zoom);

    // Draw hex grid - only visible hexes to save performance
    const visibleRange = Math.ceil(Math.max(canvas.width, canvas.height) / (2 * HEX_SIZE * zoom)) + 5;
    const centerCol = Math.round(-pan.x / zoom / (HEX_SIZE * 3 / 2));
    const centerRow = Math.round(-pan.y / zoom / (HEX_SIZE * Math.sqrt(3)));

    for (let col = Math.max(0, centerCol - visibleRange); col < Math.min(MAP_WIDTH, centerCol + visibleRange); col++) {
      for (let row = Math.max(0, centerRow - visibleRange); row < Math.min(MAP_HEIGHT, centerRow + visibleRange); row++) {
        const { pixelX, pixelY } = hexToPixel(col, row);
        const terrain = getHexTerrain(col, row);
        const color = getTerrainColor(terrain, world.climate);
        drawHex(ctx, pixelX, pixelY, HEX_SIZE - HEX_PADDING, color);

        // Draw topographical icons for terrain
        if (zoom > 0.5) {
          drawTerrainIcon(ctx, pixelX, pixelY, terrain);
        }
      }
    }

    // Draw cities
    world.cities.forEach((city) => {
      const { pixelX, pixelY } = hexToPixel(city.hex_x, city.hex_y);
      drawCityIcon(ctx, pixelX, pixelY);
    });

    // Draw POIs
    world.pointsOfInterest.forEach((poi) => {
      const { pixelX, pixelY } = hexToPixel(poi.hex_x, poi.hex_y);
      drawPOIIcon(ctx, pixelX, pixelY, poi.type);
    });

    ctx.restore();
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert to world space (before scaling)
    const worldX = (mouseX - canvas.width / 2 - pan.x) / zoom;
    const worldY = (mouseY - canvas.height / 2 - pan.y) / zoom;

    // Update zoom - allow zooming out to 0.15 (see full 51x51 map)
    const zoomFactor = 0.1;
    const newZoom = e.deltaY < 0
      ? Math.min(zoom + zoomFactor, 3)
      : Math.max(0.15, zoom - zoomFactor);

    // Calculate new pan to keep world position under cursor
    const newPanX = mouseX - canvas.width / 2 - worldX * newZoom;
    const newPanY = mouseY - canvas.height / 2 - worldY * newZoom;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom to 2x at this point
    const newZoom = Math.min(zoom + 0.5, 3);
    const worldX = (mouseX - canvas.width / 2 - pan.x) / zoom;
    const worldY = (mouseY - canvas.height / 2 - pan.y) / zoom;

    const newPanX = mouseX - canvas.width / 2 - worldX * newZoom;
    const newPanY = mouseY - canvas.height / 2 - worldY * newZoom;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Re-render when world, zoom, or pan changes
  useEffect(() => {
    renderMap();
  }, [world, zoom, pan]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Handle dragging
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPan({ x: pan.x + dx, y: pan.y + dy });
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    setTooltipPos({ x: screenX, y: screenY });

    // Convert screen coordinates to world coordinates
    // Reverse the transformations: screen → canvas center → remove pan → unscale
    const worldX = (screenX - canvas.width / 2 - pan.x) / zoom;
    const worldY = (screenY - canvas.height / 2 - pan.y) / zoom;

    // Check for hover over cities
    let foundEntity: City | PointOfInterest | null = null;
    const hitRadius = 12 / zoom; // Scale hit radius with zoom

    world.cities.forEach((city) => {
      const { pixelX, pixelY } = hexToPixel(city.hex_x, city.hex_y);
      const dist = Math.sqrt((worldX - pixelX) ** 2 + (worldY - pixelY) ** 2);
      if (dist < hitRadius) {
        foundEntity = city;
        onHexHover(city.hex_x, city.hex_y);
      }
    });

    if (!foundEntity) {
      world.pointsOfInterest.forEach((poi) => {
        const { pixelX, pixelY } = hexToPixel(poi.hex_x, poi.hex_y);
        const dist = Math.sqrt((worldX - pixelX) ** 2 + (worldY - pixelY) ** 2);
        if (dist < hitRadius) {
          foundEntity = poi;
          onHexHover(poi.hex_x, poi.hex_y);
        }
      });
    }

    setHoveredEntity(foundEntity || null);
  };

  const handleCanvasClick = () => {
    if (hoveredEntity) {
      onHexClick(hoveredEntity);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>🏠 Reset</button>
        <button onClick={() => setZoom(Math.min(zoom + 0.2, 3))}>🔍+ Zoom In</button>
        <button onClick={() => setZoom(Math.max(zoom - 0.2, 0.15))}>🔍- Zoom Out</button>
        <span className={styles.zoomLevel}>{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setShowVisualization(!showVisualization)}
          title="Toggle detailed GPT-generated map visualization"
          style={{
            background: showVisualization ? 'rgba(212, 175, 55, 0.5)' : 'rgba(212, 175, 55, 0.2)',
            borderColor: showVisualization ? '#FFD700' : '#FFD700'
          }}
        >
          {showVisualization ? '🗺️ Hide Detail Map' : '🗺️ Show Detail Map'}
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={1000}
        height={800}
        className={styles.canvas}
        onMouseMove={handleCanvasMouseMove}
        onClick={handleCanvasClick}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      />

      {hoveredEntity && (
        <div
          className={styles.tooltip}
          style={{
            left: `${tooltipPos.x + 10}px`,
            top: `${tooltipPos.y + 10}px`
          }}
        >
          <p className={styles.entityName}>
            {('governmentType' in hoveredEntity) ? `🏰 ${hoveredEntity.name}` : `📍 ${hoveredEntity.name}`}
          </p>
          <p className={styles.entityType}>
            {'governmentType' in hoveredEntity ? 'City' : hoveredEntity.type}
          </p>
          <p className={styles.hint}>Click for details</p>
        </div>
      )}

      {showVisualization && (
        <div className={styles.visualizationPanel}>
          {mapVisualization ? (
            <>
              <h3>🗺️ GPT-Generated Map Visualization</h3>
              <div style={{
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                padding: '12px',
                borderRadius: '4px',
                marginBottom: '15px',
                maxHeight: 'calc(80vh - 200px)',
                overflowY: 'auto',
                fontFamily: 'monospace',
                fontSize: '12px',
                lineHeight: '1.5',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word'
              }}>
                {mapVisualization}
              </div>
            </>
          ) : (
            <>
              <h3>🗺️ World Map Details</h3>
              <p><strong>World:</strong> {world.name}</p>
              <p><strong>Age:</strong> {world.age} years</p>
              <p><strong>Climate:</strong> {world.climate}</p>
              <p><strong>Terrain:</strong> {world.terrain}</p>
              <p><strong>Magic Level:</strong> {world.magicLevel}/10</p>
              <p><strong>Civilization:</strong> {world.civilizationAbundance}/10</p>

              {world.generationMetadata && (
                <>
                  <h3>📊 World Statistics</h3>
                  <p>🏰 <strong>Cities:</strong> {world.generationMetadata.totalCities}</p>
                  <p>📍 <strong>Points of Interest:</strong> {world.generationMetadata.totalPOIs}</p>
                  <p>👥 <strong>NPCs:</strong> {world.generationMetadata.totalNPCs}</p>
                  <p>🏛️ <strong>Factions:</strong> {world.generationMetadata.totalFactions}</p>
                  <p>📜 <strong>Historical Events:</strong> {world.generationMetadata.totalHistoricalEvents || 0}</p>
                  <p>📦 <strong>Commodities:</strong> {world.generationMetadata.totalCommodities}</p>
                  <p>🛤️ <strong>Trade Routes:</strong> {world.generationMetadata.totalTradeRoutes}</p>
                </>
              )}

              <h3>🎯 Top Cities</h3>
              {world.cities.slice(0, 3).map((city) => (
                <p key={city.id}>
                  <strong>{city.name}</strong> - {city.governmentType}
                  {city.prosperity_index && ` (Prosperity: ${city.prosperity_index}%)`}
                </p>
              ))}

              <h3>⚔️ Dangers</h3>
              {world.pointsOfInterest.filter(p => p.dangerLevel >= 15).slice(0, 3).map((poi) => (
                <p key={poi.id}>
                  <strong>{poi.name}</strong> - Danger: {poi.dangerLevel}/20
                </p>
              ))}

              <p style={{ marginTop: '20px', fontSize: '11px', opacity: 0.7 }}>
                Hover over hexes to see more details. Click entities for full information.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default HexMap;
