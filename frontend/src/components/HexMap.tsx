// Interactive Hex Map Component for D&D World Builder
import React, { useState, useRef, useEffect } from 'react';
import { World, City, PointOfInterest } from '../types/world';

interface HexMapProps {
  world: World;
  onHexHover: (hexX: number, hexY: number) => void;
  onHexClick: (entity: City | PointOfInterest) => void;
  mapVisualization?: string;
  highlightedId?: string | null;
}

const HexMap: React.FC<HexMapProps> = ({ world, onHexHover, onHexClick, highlightedId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredEntity, setHoveredEntity] = useState<City | PointOfInterest | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Grid dimensions from world object (variable size); fallback for safety
  // Must be declared before getHexSize to avoid TDZ in production builds
  const MAP_WIDTH  = world.mapWidth  ?? 51;
  const MAP_HEIGHT = world.mapHeight ?? 51;
  const HEX_PADDING = 2;

  // Dynamically calculate hex size based on viewport and grid dimensions
  const getHexSize = () => {
    if (!canvasRef.current) return 8;
    const canvas = canvasRef.current;
    const sizeByWidth  = (canvas.width  * 0.92) / (MAP_WIDTH  * 1.5 + 0.5);
    const sizeByHeight = (canvas.height * 0.92) / (Math.sqrt(3) * (MAP_HEIGHT + 0.5));
    return Math.max(4, Math.min(sizeByWidth, sizeByHeight, 20));
  };

  let HEX_SIZE = getHexSize();

  // Full 15-type color map matching the new terrain generator
  const getTerrainTypeColor = (terrainType: number): string => {
    const colors: Record<number, string> = {
      0:  '#06184f',  // deep ocean
      1:  '#0e3d82',  // ocean
      2:  '#2472b8',  // shallow water
      3:  '#d4bc80',  // beach
      4:  '#1a5c1e',  // tropical forest
      5:  '#2e7d32',  // temperate forest
      6:  '#4a6741',  // boreal / taiga
      7:  '#7cbf3a',  // grassland
      8:  '#b8a435',  // savanna
      9:  '#c9a84c',  // desert
      10: '#8b7040',  // hills
      11: '#868674',  // mountains
      12: '#555555',  // high mountains
      13: '#8fa8a0',  // tundra
      14: '#cce8f0',  // ice sheet
    };
    return colors[terrainType] ?? '#444';
  };

  const getTerrainTypeName = (terrainType: number): string => {
    const names: Record<number, string> = {
      0: 'Deep Ocean', 1: 'Ocean', 2: 'Shallow Water', 3: 'Beach',
      4: 'Tropical Forest', 5: 'Temperate Forest', 6: 'Boreal Forest',
      7: 'Grassland', 8: 'Savanna', 9: 'Desert',
      10: 'Hills', 11: 'Mountains', 12: 'High Mountains',
      13: 'Tundra', 14: 'Ice Sheet',
    };
    return names[terrainType] ?? 'Unknown';
  };

  // Legacy string-based color map (fallback when no hexGrid)
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
    if (terrain === 'Coast' || terrain === 'River') {
      const climateWaterColors: { [key: string]: string } = {
        'Tropical': '#1E90FF', 'Temperate': '#87CEEB',
        'Arid': '#FFE4B5', 'Arctic': '#E0FFFF', 'Volcanic': '#A9A9A9'
      };
      return climateWaterColors[climate] || '#4682B4';
    }
    return terrainColors[terrain] || '#90EE90';
  };

  // Convert offset coordinates to pixel coordinates (flat-top hex, even-q offset)
  const hexToPixel = (col: number, row: number) => {
    const size = HEX_SIZE;
    // Flat-top hexes, even-q offset:
    // - Each column steps right by 3/2 * size
    // - Odd columns are offset DOWN by half a hex height (√3/2 * size)
    const pixelX = size * (3 / 2) * col;
    const pixelY = size * Math.sqrt(3) * (row + (col % 2) * 0.5);

    // Center the map
    const centerOffsetX = -(MAP_WIDTH / 2) * size * (3 / 2);
    const centerOffsetY = -(MAP_HEIGHT / 2) * size * Math.sqrt(3);

    return { pixelX: pixelX + centerOffsetX, pixelY: pixelY + centerOffsetY };
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

  // Get hex color — uses real terrain data from backend if available
  const getHexColor = (col: number, row: number): string => {
    if (world.hexGrid) {
      const hex = (world.hexGrid as Record<string, { terrainType: number }>)[`${col},${row}`];
      if (hex !== undefined) return getTerrainTypeColor(hex.terrainType);
    }
    // Fallback: legacy string-based terrain
    const seed = parseInt(world.worldSeed || '0', 10);
    const hash = Math.abs(seed + col * 73856093 ^ row * 19349663) % 100;
    if (hash < 20) return getTerrainColor('Mountain', world.climate);
    if (hash < 35) return getTerrainColor('Forest', world.climate);
    if (hash < 55) return getTerrainColor('Plains', world.climate);
    if (hash < 70) return getTerrainColor('Coast', world.climate);
    if (hash < 85) return getTerrainColor('River', world.climate);
    return getTerrainColor('Plains', world.climate);
  };

  // Get terrain name for a hex (for tooltips/icons)
  const getHexTerrainName = (col: number, row: number): string => {
    if (world.hexGrid) {
      const hex = (world.hexGrid as Record<string, { terrainType: number }>)[`${col},${row}`];
      if (hex !== undefined) return getTerrainTypeName(hex.terrainType);
    }
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
    // Account for the centering offset: hex (MAP_WIDTH/2, MAP_HEIGHT/2) sits at world-space (0,0)
    const centerCol = Math.round(-pan.x / zoom / (HEX_SIZE * 3 / 2)) + MAP_WIDTH / 2;
    const centerRow = Math.round(-pan.y / zoom / (HEX_SIZE * Math.sqrt(3))) + MAP_HEIGHT / 2;

    for (let col = Math.max(0, centerCol - visibleRange); col < Math.min(MAP_WIDTH, centerCol + visibleRange); col++) {
      for (let row = Math.max(0, centerRow - visibleRange); row < Math.min(MAP_HEIGHT, centerRow + visibleRange); row++) {
        const { pixelX, pixelY } = hexToPixel(col, row);
        const color = getHexColor(col, row);
        drawHex(ctx, pixelX, pixelY, HEX_SIZE - HEX_PADDING, color);

        // Draw topographical icons for terrain
        if (zoom > 0.5) {
          drawTerrainIcon(ctx, pixelX, pixelY, getHexTerrainName(col, row));
        }
      }
    }

    // Draw cities
    world.cities.forEach((city) => {
      const { pixelX, pixelY } = hexToPixel(city.hex_x, city.hex_y);
      drawCityIcon(ctx, pixelX, pixelY);
      if (city.id === highlightedId) {
        ctx.beginPath();
        ctx.arc(pixelX, pixelY, 12, 0, Math.PI * 2);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(pixelX, pixelY, 16, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(212,175,55,0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw POIs
    world.pointsOfInterest.forEach((poi) => {
      const { pixelX, pixelY } = hexToPixel(poi.hex_x, poi.hex_y);
      drawPOIIcon(ctx, pixelX, pixelY, poi.type);
      if (poi.id === highlightedId) {
        ctx.beginPath();
        ctx.arc(pixelX, pixelY, 12, 0, Math.PI * 2);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(pixelX, pixelY, 16, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(212,175,55,0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
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
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const screenX = (e.clientX - rect.left) * scaleX;
    const screenY = (e.clientY - rect.top) * scaleY;

    // Always update tooltip to CSS pixel position (not scaled)
    setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    // Handle dragging
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPan({ x: pan.x + dx, y: pan.y + dy });
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

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

  const mapBtnStyle: React.CSSProperties = {
    background: 'rgba(212,175,55,0.15)',
    border: '1px solid #2e2e42',
    color: '#d4af37',
    borderRadius: 4,
    width: 30,
    height: 30,
    cursor: 'pointer',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0a0a0f', overflow: 'hidden' }}>
      {/* Map controls */}
      <div style={{
        position: 'absolute', bottom: 16, right: 16, zIndex: 20,
        display: 'flex', gap: 6, alignItems: 'center'
      }}>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} style={mapBtnStyle}>🏠</button>
        <button onClick={() => setZoom(Math.min(zoom + 0.25, 4))} style={mapBtnStyle}>＋</button>
        <button onClick={() => setZoom(Math.max(zoom - 0.25, 0.1))} style={mapBtnStyle}>－</button>
        <span style={{ color: '#888', fontSize: 11, fontFamily: 'monospace' }}>{Math.round(zoom * 100)}%</span>
      </div>

      <canvas
        ref={canvasRef}
        width={1200}
        height={900}
        onMouseMove={handleCanvasMouseMove}
        onClick={handleCanvasClick}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', display: 'block', width: '100%', height: '100%' }}
      />

      {hoveredEntity && (
        <div style={{
          position: 'absolute',
          left: `${tooltipPos.x + 12}px`,
          top: `${tooltipPos.y + 12}px`,
          background: 'rgba(15,15,20,0.95)',
          border: '1px solid #d4af37',
          borderRadius: 6,
          padding: '8px 12px',
          pointerEvents: 'none',
          zIndex: 50,
          minWidth: 140,
        }}>
          <div style={{ color: '#d4af37', fontWeight: 'bold', fontSize: 13 }}>
            {('governmentType' in hoveredEntity) ? `🏰 ${hoveredEntity.name}` : `📍 ${hoveredEntity.name}`}
          </div>
          <div style={{ color: '#888', fontSize: 11, marginTop: 2 }}>
            {'governmentType' in hoveredEntity ? (hoveredEntity as City).governmentType : (hoveredEntity as PointOfInterest).type.replace('_',' ')}
          </div>
          <div style={{ color: '#555', fontSize: 10, marginTop: 4, fontStyle: 'italic' }}>Click for details</div>
        </div>
      )}

    </div>
  );
};

export default HexMap;
