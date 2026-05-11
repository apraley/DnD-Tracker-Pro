// Interactive Hex Map Component for D&D World Builder
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { World, City, PointOfInterest } from '../types/world';

type AddEntityType = 'city' | 'poi' | 'dungeon';

interface HexMapProps {
  world: World;
  onHexHover: (hexX: number, hexY: number) => void;
  onHexClick: (entity: City | PointOfInterest) => void;
  onAddEntity?: (col: number, row: number, type: AddEntityType) => void;
  centerOn?: { col: number; row: number; _t?: number } | null;
  mapVisualization?: string;
  highlightedId?: string | null;
}

interface ContextMenu {
  screenX: number;
  screenY: number;
  col: number;
  row: number;
}

const HexMap: React.FC<HexMapProps> = ({ world, onHexHover, onHexClick, onAddEntity, centerOn, highlightedId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredEntity, setHoveredEntity] = useState<City | PointOfInterest | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [showLegend, setShowLegend] = useState(true);

  // Keep a ref so the centerOn animation can read the current pan without stale closures
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);

  // Grid dimensions from world object (variable size); fallback for safety
  // Must be declared before getHexSize to avoid TDZ in production builds
  const MAP_WIDTH  = world.mapWidth  ?? 51;
  const MAP_HEIGHT = world.mapHeight ?? 51;
  const HEX_PADDING = 0;

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


  // Convert canvas pixel (screen) coordinates back to hex col/row
  const pixelToHex = useCallback((screenX: number, screenY: number): { col: number; row: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { col: 0, row: 0 };
    const scaleX = canvas.width / canvas.getBoundingClientRect().width;
    const scaleY = canvas.height / canvas.getBoundingClientRect().height;
    const sx = screenX * scaleX;
    const sy = screenY * scaleY;
    // Reverse the transforms: screen → canvas-centre → remove pan → unscale
    const worldX = (sx - canvas.width / 2 - pan.x) / zoom;
    const worldY = (sy - canvas.height / 2 - pan.y) / zoom;
    // Reverse hexToPixel:
    //   pixelX = size * 3/2 * col + centerOffsetX  →  col = (worldX - centerOffsetX) / (size * 3/2)
    const centerOffsetX = -(MAP_WIDTH / 2) * HEX_SIZE * (3 / 2);
    const centerOffsetY = -(MAP_HEIGHT / 2) * HEX_SIZE * Math.sqrt(3);
    const col = Math.round((worldX - centerOffsetX) / (HEX_SIZE * 1.5));
    const clampedCol = Math.max(0, Math.min(MAP_WIDTH - 1, col));
    const row = Math.round((worldY - centerOffsetY) / (HEX_SIZE * Math.sqrt(3)) - (clampedCol % 2) * 0.5);
    return {
      col: clampedCol,
      row: Math.max(0, Math.min(MAP_HEIGHT - 1, row)),
    };
  }, [pan, zoom, HEX_SIZE, MAP_WIDTH, MAP_HEIGHT]);

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
    ctx.stroke(); // strokeStyle/lineWidth set once per frame in renderMap
  };

  // Draw a city icon — radius scales inversely with zoom so it stays constant on screen
  const drawCityIcon = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number
  ) => {
    const r = Math.max(2, 6 / zoom);
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = Math.max(0.5, 2 / zoom);
    ctx.stroke();
  };

  // Draw a POI icon — size scales inversely with zoom
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
      geographical_landmark: '#6A5ACD',
      shrine: '#4169E1',
      settlement: '#A9A9A9',
      cave: '#5C4033',
      tomb: '#4A4A6A',
      crypt: '#3D3D5C',
      lair: '#8B2500',
      other: '#696969'
    };

    const half = Math.max(1.5, 4 / zoom);
    ctx.fillStyle = colors[type] || '#696969';
    ctx.beginPath();
    ctx.rect(centerX - half, centerY - half, half * 2, half * 2);
    ctx.fill();
  };

  // Draw topographical icons for terrain using numeric terrain types
  const drawTerrainIcon = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    terrainType: number,
    hexSize: number
  ) => {
    // Only draw when hexes are large enough to see the icon
    if (hexSize * zoom < 5) return;

    const s = Math.max(1, hexSize * 0.35);
    const lw = Math.max(0.2, s * 0.12);

    switch (terrainType) {
      case 11: // Mountains
      case 12: { // High Mountains
        // Triangle peak
        ctx.fillStyle = terrainType === 12 ? 'rgba(80,80,90,0.35)' : 'rgba(0,0,0,0.22)';
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(centerX - s, centerY + s * 0.55);
        ctx.lineTo(centerX, centerY - s * 0.9);
        ctx.lineTo(centerX + s, centerY + s * 0.55);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        if (terrainType === 12) {
          // Snow cap
          ctx.fillStyle = 'rgba(255,255,255,0.65)';
          ctx.beginPath();
          ctx.moveTo(centerX - s * 0.3, centerY - s * 0.28);
          ctx.lineTo(centerX, centerY - s * 0.9);
          ctx.lineTo(centerX + s * 0.3, centerY - s * 0.28);
          ctx.closePath();
          ctx.fill();
        }
        break;
      }
      case 10: { // Hills
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.beginPath();
        ctx.ellipse(centerX - s * 0.4, centerY + s * 0.15, s * 0.6, s * 0.45, 0, Math.PI, 0);
        ctx.ellipse(centerX + s * 0.4, centerY + s * 0.15, s * 0.5, s * 0.38, 0, Math.PI, 0);
        ctx.fill();
        break;
      }
      case 4:  // Tropical Forest
      case 5:  // Temperate Forest
      case 6: { // Boreal Forest
        const treeColor = terrainType === 4
          ? 'rgba(0,50,0,0.30)'
          : terrainType === 5
          ? 'rgba(0,40,0,0.25)'
          : 'rgba(20,30,20,0.30)';
        ctx.fillStyle = treeColor;
        const offsets = [-s * 0.55, 0, s * 0.55];
        for (const ox of offsets) {
          ctx.beginPath();
          ctx.arc(centerX + ox, centerY, s * 0.40, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 9: { // Desert — dune arcs
        ctx.strokeStyle = 'rgba(140,90,0,0.38)';
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.arc(centerX - s * 0.45, centerY + s * 0.1, s * 0.45, Math.PI, 0);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(centerX + s * 0.3, centerY + s * 0.2, s * 0.30, Math.PI, 0);
        ctx.stroke();
        break;
      }
      case 14: { // Ice Sheet — snowflake spokes
        ctx.strokeStyle = 'rgba(140,200,255,0.50)';
        ctx.lineWidth = lw;
        for (let a = 0; a < 6; a++) {
          const ang = (Math.PI / 3) * a;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(centerX + Math.cos(ang) * s * 0.75, centerY + Math.sin(ang) * s * 0.75);
          ctx.stroke();
        }
        break;
      }
      case 13: { // Tundra — stubby grass tufts
        ctx.strokeStyle = 'rgba(90,110,105,0.38)';
        ctx.lineWidth = lw;
        const tufts = [-s * 0.45, 0, s * 0.45];
        for (const ox of tufts) {
          ctx.beginPath();
          ctx.moveTo(centerX + ox, centerY + s * 0.3);
          ctx.lineTo(centerX + ox, centerY - s * 0.4);
          ctx.stroke();
        }
        break;
      }
      case 8: { // Savanna — tall grass stalks
        ctx.strokeStyle = 'rgba(110,85,0,0.35)';
        ctx.lineWidth = lw;
        const stalks = [-s * 0.5, -s * 0.15, s * 0.2, s * 0.5];
        for (const ox of stalks) {
          const h = s * (0.5 + Math.abs(ox / s) * 0.2);
          ctx.beginPath();
          ctx.moveTo(centerX + ox, centerY + s * 0.3);
          ctx.lineTo(centerX + ox, centerY + s * 0.3 - h);
          ctx.stroke();
        }
        break;
      }
      case 3: { // Beach — wave line
        ctx.strokeStyle = 'rgba(150,120,50,0.38)';
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(centerX - s * 0.75, centerY);
        ctx.bezierCurveTo(
          centerX - s * 0.25, centerY - s * 0.25,
          centerX + s * 0.25, centerY + s * 0.25,
          centerX + s * 0.75, centerY
        );
        ctx.stroke();
        break;
      }
      // 0-2 (water), 7 (grassland) — no icon needed (color is sufficient)
      default:
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

    // Border stays visually 1px regardless of zoom.
    // lineWidth is in canvas-space, so dividing by zoom cancels the scale.
    ctx.strokeStyle = '#1a1a2a';
    ctx.lineWidth = 1 / zoom;

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

        // Draw topographical icons — use numeric terrain type directly
        if (HEX_SIZE * zoom > 5 && world.hexGrid) {
          const hex = (world.hexGrid as Record<string, { terrainType: number }>)[`${col},${row}`];
          if (hex !== undefined) {
            drawTerrainIcon(ctx, pixelX, pixelY, hex.terrainType, HEX_SIZE);
          }
        }
      }
    }

    // Draw cities
    world.cities.forEach((city) => {
      const { pixelX, pixelY } = hexToPixel(city.hex_x, city.hex_y);
      drawCityIcon(ctx, pixelX, pixelY);
      if (city.id === highlightedId) {
        const r1 = Math.max(6, 12 / zoom);
        const r2 = Math.max(8, 16 / zoom);
        ctx.beginPath();
        ctx.arc(pixelX, pixelY, r1, 0, Math.PI * 2);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = Math.max(1, 3 / zoom);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(pixelX, pixelY, r2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(212,175,55,0.4)';
        ctx.lineWidth = Math.max(0.5, 2 / zoom);
        ctx.stroke();
      }
    });

    // Draw POIs
    world.pointsOfInterest.forEach((poi) => {
      const { pixelX, pixelY } = hexToPixel(poi.hex_x, poi.hex_y);
      drawPOIIcon(ctx, pixelX, pixelY, poi.type);
      if (poi.id === highlightedId) {
        const r1 = Math.max(6, 12 / zoom);
        const r2 = Math.max(8, 16 / zoom);
        ctx.beginPath();
        ctx.arc(pixelX, pixelY, r1, 0, Math.PI * 2);
        ctx.strokeStyle = '#d4af37';
        ctx.lineWidth = Math.max(1, 3 / zoom);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(pixelX, pixelY, r2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(212,175,55,0.4)';
        ctx.lineWidth = Math.max(0.5, 2 / zoom);
        ctx.stroke();
      }
    });

    ctx.restore();

    // ── World name overlay (screen-space, drawn after restore so it ignores zoom/pan) ──
    const title = world.name;
    ctx.save();
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillText(title, 17, 17);
    // Gold text
    ctx.fillStyle = '#d4af37';
    ctx.fillText(title, 15, 15);
    // Subtitle: seed + stats
    const sub = `Seed ${world.worldSeed} · ${world.terrainStats?.waterPercent ?? '?'}% ocean · Magic ${world.magicLevel}/10`;
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillText(sub, 17, 42);
    ctx.fillStyle = '#888899';
    ctx.fillText(sub, 15, 40);
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
      : Math.max(1.0, zoom - zoomFactor);

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

  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!onAddEntity) return; // no handler wired up — skip menu
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const { col, row } = pixelToHex(sx, sy);
    setContextMenu({ screenX: e.clientX, screenY: e.clientY, col, row });
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

  // Smooth-pan to a hex when centerOn changes (sidebar click)
  useEffect(() => {
    if (!centerOn) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = getHexSize();
    const mapW = world.mapWidth ?? 51;
    const mapH = world.mapHeight ?? 51;

    // Replicate hexToPixel formula to get world-space center of the target hex
    const centerOffsetX = -(mapW / 2) * size * (3 / 2);
    const centerOffsetY = -(mapH / 2) * size * Math.sqrt(3);
    const targetWorldX = size * (3 / 2) * centerOn.col + centerOffsetX;
    const targetWorldY = size * Math.sqrt(3) * (centerOn.row + (centerOn.col % 2) * 0.5) + centerOffsetY;

    // Pan so the hex sits at canvas centre; bump zoom to at least 1.5 if zoomed out
    const currentZoom = zoomRef.current;
    const targetZoom  = Math.max(currentZoom, 1.5);
    const targetPanX  = -targetWorldX * targetZoom;
    const targetPanY  = -targetWorldY * targetZoom;

    const startPan  = { ...panRef.current };
    const startZoom = currentZoom;
    const startTime = performance.now();
    const DURATION  = 420; // ms

    let rafId: number;
    const animate = (now: number) => {
      const t    = Math.min(1, (now - startTime) / DURATION);
      const ease = 1 - Math.pow(1 - t, 3); // cubic ease-out
      setPan({
        x: startPan.x + (targetPanX - startPan.x) * ease,
        y: startPan.y + (targetPanY - startPan.y) * ease,
      });
      setZoom(startZoom + (targetZoom - startZoom) * ease);
      if (t < 1) rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [centerOn]);

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
    if (contextMenu) { setContextMenu(null); return; }
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

  // ── Legend data ────────────────────────────────────────────────────────────
  const TERRAIN_LEGEND = [
    // Water
    { color: '#06184f', label: 'Deep Ocean' },
    { color: '#0e3d82', label: 'Ocean' },
    { color: '#2472b8', label: 'Shallow Water' },
    { color: '#d4bc80', label: 'Beach / Shoreline' },
    // Vegetation
    { color: '#1a5c1e', label: 'Tropical Forest' },
    { color: '#2e7d32', label: 'Temperate Forest' },
    { color: '#4a6741', label: 'Boreal Forest / Taiga' },
    { color: '#7cbf3a', label: 'Grassland' },
    { color: '#b8a435', label: 'Savanna' },
    { color: '#c9a84c', label: 'Desert' },
    // Elevation
    { color: '#8b7040', label: 'Hills' },
    { color: '#868674', label: 'Mountains' },
    { color: '#555555', label: 'High Mountains' },
    // Cold
    { color: '#8fa8a0', label: 'Tundra' },
    { color: '#cce8f0', label: 'Ice Sheet' },
  ];

  const MARKER_LEGEND = [
    { shape: 'circle', color: '#FFD700', border: '#000', label: 'City / Settlement' },
    { shape: 'square', color: '#8B0000', border: 'none', label: 'Dungeon / Ruins / Cave / Lair' },
    { shape: 'square', color: '#228B22', border: 'none', label: 'Natural Wonder' },
    { shape: 'square', color: '#6A5ACD', border: 'none', label: 'Geographical Landmark' },
    { shape: 'square', color: '#4169E1', border: 'none', label: 'Shrine' },
    { shape: 'square', color: '#A9A9A9', border: 'none', label: 'Minor Settlement / Other' },
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0a0a0f', overflow: 'hidden' }}>
      {/* Map controls */}
      <div style={{
        position: 'absolute', bottom: 16, right: 16, zIndex: 20,
        display: 'flex', gap: 6, alignItems: 'center'
      }}>
        <button
          onClick={() => setShowLegend(v => !v)}
          style={{ ...mapBtnStyle, width: 'auto', padding: '0 8px', fontSize: 11, gap: 4, display: 'flex' }}
          title="Toggle map legend"
        >
          🗺 KEY
        </button>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} style={mapBtnStyle}>🏠</button>
        <button onClick={() => setZoom(Math.min(zoom + 0.25, 4))} style={mapBtnStyle}>＋</button>
        <button onClick={() => setZoom(Math.max(zoom - 0.25, 1.0))} style={mapBtnStyle}>－</button>
        <span style={{ color: '#888', fontSize: 11, fontFamily: 'monospace' }}>{Math.round(zoom * 100)}%</span>
      </div>

      {/* ── Map Legend ── */}
      {showLegend && (
        <div style={{
          position: 'absolute',
          bottom: 56,
          right: 16,
          zIndex: 30,
          background: 'rgba(10,10,18,0.94)',
          border: '1px solid #2e2e42',
          borderRadius: 8,
          padding: '10px 12px',
          width: 210,
          backdropFilter: 'blur(4px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
          maxHeight: 'calc(100% - 100px)',
          overflowY: 'auto',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ color: '#d4af37', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Map Key
            </span>
            <button
              onClick={() => setShowLegend(false)}
              style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 14, padding: 0, lineHeight: 1 }}
            >✕</button>
          </div>

          {/* Terrain section */}
          <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Terrain</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 12 }}>
            {TERRAIN_LEGEND.map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                {/* Hex-shaped swatch using clip-path */}
                <div style={{
                  width: 14,
                  height: 14,
                  background: color,
                  clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                  flexShrink: 0,
                  border: '1px solid rgba(255,255,255,0.08)',
                }} />
                <span style={{ color: '#c8c8d8', fontSize: 11 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #2a2a3a', marginBottom: 10 }} />

          {/* Markers section */}
          <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Markers</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
            {MARKER_LEGEND.map(({ shape, color, border, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                {shape === 'circle' ? (
                  <div style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: color,
                    border: `1.5px solid ${border}`,
                    flexShrink: 0,
                  }} />
                ) : (
                  <div style={{
                    width: 11,
                    height: 11,
                    background: color,
                    flexShrink: 0,
                    borderRadius: 1,
                  }} />
                )}
                <span style={{ color: '#c8c8d8', fontSize: 11 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #2a2a3a', marginBottom: 8 }} />

          {/* Controls tip */}
          <div style={{ fontSize: 10, color: '#555566', lineHeight: 1.5 }}>
            <div>🖱 Scroll to zoom · Drag to pan</div>
            <div>🖱 Double-click to zoom in</div>
            {onAddEntity && <div>🖱 Right-click to add city / POI</div>}
          </div>
        </div>
      )}

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
        onContextMenu={handleContextMenu}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', display: 'block', width: '100%', height: '100%' }}
      />

      {hoveredEntity && !contextMenu && (
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

      {/* ── Right-click context menu ── */}
      {contextMenu && onAddEntity && (
        <div
          style={{
            position: 'fixed',
            left: contextMenu.screenX,
            top: contextMenu.screenY,
            background: 'rgba(12,12,18,0.97)',
            border: '1px solid #3a3a55',
            borderRadius: 8,
            padding: '6px 0',
            zIndex: 200,
            minWidth: 190,
            boxShadow: '0 4px 24px rgba(0,0,0,0.7)',
          }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <div style={{
            padding: '4px 14px 6px',
            fontSize: 10,
            color: '#666',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            borderBottom: '1px solid #2a2a3a',
            marginBottom: 4,
          }}>
            Hex ({contextMenu.col}, {contextMenu.row})
          </div>
          {([
            { type: 'city',    icon: '🏙️', label: 'Add City' },
            { type: 'poi',     icon: '📍', label: 'Add Point of Interest' },
            { type: 'dungeon', icon: '⚔️', label: 'Add Dungeon' },
          ] as { type: AddEntityType; icon: string; label: string }[]).map(item => (
            <button
              key={item.type}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                width: '100%',
                background: 'none',
                border: 'none',
                color: '#d4d4e8',
                fontSize: 13,
                padding: '7px 14px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(212,175,55,0.12)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              onClick={() => {
                onAddEntity(contextMenu.col, contextMenu.row, item.type);
                setContextMenu(null);
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}

    </div>
  );
};

export default HexMap;
