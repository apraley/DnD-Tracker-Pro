// Interactive Hex Map Component for D&D World Builder
import React, { useState, useRef, useEffect } from 'react';
import { World, City, PointOfInterest } from '../types/world';
import styles from './HexMap.module.css';

interface HexMapProps {
  world: World;
  onHexHover: (hexX: number, hexY: number) => void;
  onHexClick: (entity: City | PointOfInterest) => void;
}

const HexMap: React.FC<HexMapProps> = ({ world, onHexHover, onHexClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredEntity, setHoveredEntity] = useState<City | PointOfInterest | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const HEX_SIZE = 30;
  const HEX_PADDING = 2;

  // Convert cube coordinates to pixel coordinates (pointy-top hex)
  const hexToPixel = (x: number, y: number) => {
    const size = HEX_SIZE;
    const pixelX = size * (3 / 2 * x);
    const pixelY = size * (Math.sqrt(3) / 2 * x + Math.sqrt(3) * y);
    return { pixelX, pixelY };
  };

  // Draw a single hex
  const drawHex = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    size: number,
    color: string
  ) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
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

  // Render the map
  const renderMap = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#E8F4F8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
    ctx.scale(zoom, zoom);

    // Draw hex grid
    for (let x = 0; x < 52; x++) {
      for (let y = 0; y < 52; y++) {
        const { pixelX, pixelY } = hexToPixel(x, y);
        drawHex(ctx, pixelX, pixelY, HEX_SIZE - HEX_PADDING, '#E8F4F8');
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
    const zoomFactor = 0.1;
    const newZoom = e.deltaY < 0 ? zoom + zoomFactor : Math.max(0.5, zoom - zoomFactor);
    setZoom(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPan({ x: pan.x + dx, y: pan.y + dy });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    renderMap();
  }, [world]);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // Handle dragging
    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPan({ x: pan.x + dx, y: pan.y + dy });
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setTooltipPos({ x, y });

    // Check for hover over cities
    let foundEntity: City | PointOfInterest | null = null;

    world.cities.forEach((city) => {
      const { pixelX, pixelY } = hexToPixel(city.hex_x, city.hex_y);
      const canvasX = pixelX + canvas.width / 2;
      const canvasY = pixelY + canvas.height / 2;

      const dist = Math.sqrt((x - canvasX) ** 2 + (y - canvasY) ** 2);
      if (dist < 12) {
        foundEntity = city;
        onHexHover(city.hex_x, city.hex_y);
      }
    });

    if (!foundEntity) {
      world.pointsOfInterest.forEach((poi) => {
        const { pixelX, pixelY } = hexToPixel(poi.hex_x, poi.hex_y);
        const canvasX = pixelX + canvas.width / 2;
        const canvasY = pixelY + canvas.height / 2;

        const dist = Math.sqrt((x - canvasX) ** 2 + (y - canvasY) ** 2);
        if (dist < 12) {
          foundEntity = poi;
          onHexHover(poi.hex_x, poi.hex_y);
        }
      });
    }

    setHoveredEntity(foundEntity || null);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoveredEntity) {
      onHexClick(hoveredEntity);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}>🏠 Reset</button>
        <button onClick={() => setZoom(Math.min(zoom + 0.2, 3))}>🔍+ Zoom In</button>
        <button onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))}>🔍- Zoom Out</button>
        <span className={styles.zoomLevel}>{Math.round(zoom * 100)}%</span>
      </div>

      <canvas
        ref={canvasRef}
        width={1000}
        height={800}
        className={styles.canvas}
        onMouseMove={handleCanvasMouseMove}
        onClick={handleCanvasClick}
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
    </div>
  );
};

export default HexMap;
