import React, { useState, useRef, useEffect } from 'react';
import { World, City, PointOfInterest } from '../types/world';
import styles from './InteractiveMap.module.css';

interface InteractiveMapProps {
  world: World;
  mapImageUrl: string | null;
  onEntityClick: (entity: City | PointOfInterest) => void;
  onMapImageLoad?: (url: string) => void;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({
  world,
  mapImageUrl,
  onEntityClick,
  onMapImageLoad
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mapImage, setMapImage] = useState<HTMLImageElement | null>(null);
  const [hoveredEntity, setHoveredEntity] = useState<City | PointOfInterest | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Load the map image
  useEffect(() => {
    if (mapImageUrl) {
      const img = new Image();
      img.onload = () => {
        setMapImage(img);
        onMapImageLoad?.(mapImageUrl);
      };
      img.onerror = () => {
        console.error('Failed to load map image');
      };
      img.src = mapImageUrl;
    }
  }, [mapImageUrl, onMapImageLoad]);

  // Render the map
  useEffect(() => {
    if (!canvasRef.current || !mapImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(canvas.width / 2 + pan.x, canvas.height / 2 + pan.y);
    ctx.scale(zoom, zoom);

    // Draw the map image centered
    const imgWidth = mapImage.width;
    const imgHeight = mapImage.height;
    ctx.drawImage(mapImage, -imgWidth / 2, -imgHeight / 2);

    // Draw city markers
    world.cities.forEach((city) => {
      const x = (city.hex_x - 25) * 20;
      const y = (city.hex_y - 25) * 20;

      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw POI markers
    world.pointsOfInterest.forEach((poi) => {
      const x = (poi.hex_x - 25) * 20;
      const y = (poi.hex_y - 25) * 20;

      const colors: Record<string, string> = {
        dungeon: '#8B0000',
        ruins: '#8B7355',
        natural_wonder: '#228B22',
        shrine: '#4169E1',
        settlement: '#A9A9A9',
        other: '#696969'
      };

      ctx.fillStyle = colors[poi.type] || '#696969';
      ctx.beginPath();
      ctx.rect(x - 6, y - 6, 12, 12);
      ctx.fill();
    });

    ctx.restore();
  }, [mapImage, world, zoom, pan]);

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
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDragging) {
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPan({ x: pan.x + dx, y: pan.y + dy });
      setDragStart({ x: e.clientX, y: e.clientY });
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTooltipPos({ x, y });

    // Check for hover over entities
    let foundEntity: City | PointOfInterest | null = null;

    world.cities.forEach((city) => {
      const cx = (city.hex_x - 25) * 20;
      const cy = (city.hex_y - 25) * 20;

      const canvasX = canvas.width / 2 + pan.x + cx * zoom;
      const canvasY = canvas.height / 2 + pan.y + cy * zoom;

      const dist = Math.sqrt((x - canvasX) ** 2 + (y - canvasY) ** 2);
      if (dist < 12) {
        foundEntity = city;
      }
    });

    if (!foundEntity) {
      world.pointsOfInterest.forEach((poi) => {
        const cx = (poi.hex_x - 25) * 20;
        const cy = (poi.hex_y - 25) * 20;

        const canvasX = canvas.width / 2 + pan.x + cx * zoom;
        const canvasY = canvas.height / 2 + pan.y + cy * zoom;

        const dist = Math.sqrt((x - canvasX) ** 2 + (y - canvasY) ** 2);
        if (dist < 12) {
          foundEntity = poi;
        }
      });
    }

    setHoveredEntity(foundEntity);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    if (hoveredEntity) {
      onEntityClick(hoveredEntity);
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
        width={1200}
        height={800}
        className={styles.canvas}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
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

export default InteractiveMap;
