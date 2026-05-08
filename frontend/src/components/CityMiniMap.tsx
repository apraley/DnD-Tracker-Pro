/**
 * CityMiniMap — small canvas hex map showing a city's districts.
 * Embedded inside the DetailPanel when a city is selected.
 */
import React, { useRef, useEffect, useState } from 'react';
import { generateCityMap, DISTRICT_LIGHT_COLORS, DISTRICT_LABEL_COLORS } from '../utils/cityMapGenerator';

interface Props {
  cityId: string;
  worldSeed: string;
  districts: Array<{ name: string; character: string; establishments: unknown[] }>;
  cityName: string;
  terrainType?: number;
}

const CityMiniMap: React.FC<Props> = ({ cityId, worldSeed, districts, cityName, terrainType }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [layout] = useState(() => generateCityMap(cityId, worldSeed, districts, terrainType));
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);

  const CANVAS_W = 380, CANVAS_H = 240;
  const EXPANDED_W = 600, EXPANDED_H = 500;

  // Function to draw the city map on any canvas
  const drawCityMap = (canvas: HTMLCanvasElement, canvasW: number, canvasH: number) => {
    const ctx = canvas.getContext('2d')!;
    if (!ctx) return;

    const { hexes, seeds, width: W, height: H } = layout;

    // Hex size to fit the grid
    const hexSize = Math.min(
      (canvasW * 0.88) / (W * 1.5 + 0.5),
      (canvasH * 0.88) / (Math.sqrt(3) * (H + 0.5)),
    );

    const offX = canvasW / 2 - (W / 2) * hexSize * 1.5;
    const offY = canvasH / 2 - (H / 2) * hexSize * Math.sqrt(3);

    function hexCenter(col: number, row: number) {
      const x = offX + hexSize * 1.5 * col + hexSize;
      const y = offY + hexSize * Math.sqrt(3) * (row + (col % 2) * 0.5) + hexSize;
      return { x, y };
    }

    function drawHex(cx: number, cy: number, size: number, fill: string, stroke: string, lineWidth: number) {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i;
        const px = cx + size * Math.cos(a), py = cy + size * Math.sin(a);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }

    // Background
    ctx.fillStyle = '#080810';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Draw hexes
    for (const hex of hexes) {
      const { x, y } = hexCenter(hex.col, hex.row);
      const size = hexSize - 0.3;

      if (hex.districtIndex === -1) {
        drawHex(x, y, size, '#0a0a14', '#0a0a14', 0.5);
      } else if (hex.districtIndex === -2) {
        // Wall
        drawHex(x, y, size, '#6b5030', '#8a6a3a', 0.8);
      } else {
        const seed = layout.seeds[hex.districtIndex];
        const baseColor = seed?.color ?? '#1a1a2a';
        const isHovered = seed?.character === hoveredDistrict;
        const lightColor = DISTRICT_LIGHT_COLORS[seed?.character ?? ''] ?? '#333';
        const fill = isHovered ? lightColor : baseColor;
        drawHex(x, y, size, fill, isHovered ? '#ffffff33' : '#ffffff11', 0.5);

        // Establishment marker
        if (hex.hasMarker) {
          ctx.beginPath();
          ctx.arc(x, y, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = hex.markerColor || '#d4af37';
          ctx.fill();
        }
      }
    }

    // District labels at seed centers
    for (const seed of seeds) {
      const { x, y } = hexCenter(seed.col, seed.row);
      const labelColor = DISTRICT_LABEL_COLORS[seed.character] ?? '#ccc';
      // Small dot at seed
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = labelColor;
      ctx.fill();

      // Label
      ctx.font = `bold ${Math.max(6, hexSize * 0.65)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillText(seed.name, x + 0.5, y + hexSize * 1.6 + 0.5);
      ctx.fillStyle = labelColor;
      ctx.fillText(seed.name, x, y + hexSize * 1.6);
    }

    // City name watermark at bottom
    ctx.font = `bold 11px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(212,175,55,0.5)';
    ctx.fillText(cityName.toUpperCase(), canvasW / 2, canvasH - 4);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawCityMap(canvas, expanded ? EXPANDED_W : CANVAS_W, expanded ? EXPANDED_H : CANVAS_H);
  }, [layout, hoveredDistrict, cityName, expanded]);

  // Handle canvas click to expand
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    // Find which district was clicked
    const { hexes, seeds, width: W, height: H } = layout;
    const hexSize = Math.min(
      (CANVAS_W * 0.88) / (W * 1.5 + 0.5),
      (CANVAS_H * 0.88) / (Math.sqrt(3) * (H + 0.5)),
    );

    // Simple click detection: expand on click
    setExpanded(true);
  };

  if (expanded) {
    return (
      <div style={{ marginBottom: 20 }}>
        {/* Expanded overlay */}
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#16161d',
            border: '2px solid #d4af37',
            borderRadius: 8,
            padding: 20,
            maxWidth: EXPANDED_W + 40,
            maxHeight: EXPANDED_H + 40,
            overflow: 'auto',
            boxShadow: '0 0 60px rgba(0,0,0,0.8)',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: '1px solid #2e2e42',
            }}>
              <div>
                <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase' }}>
                  {cityName} — District Map
                </div>
                <div style={{ fontSize: 14, color: '#d4af37', fontWeight: 'bold', marginTop: 4 }}>
                  Click a district to explore
                </div>
              </div>
              <button
                onClick={() => setExpanded(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid #2e2e42',
                  color: '#666',
                  borderRadius: 4,
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                  fontSize: 16,
                }}
              >✕</button>
            </div>

            {/* Expanded canvas with hover tracking */}
            <div
              style={{
                borderRadius: 6,
                overflow: 'hidden',
                border: '1px solid #2e2e42',
                marginBottom: 16,
                cursor: 'pointer',
              }}
              onMouseMove={(e) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const x = (e.clientX - rect.left) * (EXPANDED_W / rect.width);
                const y = (e.clientY - rect.top) * (EXPANDED_H / rect.height);

                // Find which district is under the cursor
                const { hexes, seeds, width: W, height: H } = layout;
                const hexSize = Math.min(
                  (EXPANDED_W * 0.88) / (W * 1.5 + 0.5),
                  (EXPANDED_H * 0.88) / (Math.sqrt(3) * (H + 0.5)),
                );
                const offX = EXPANDED_W / 2 - (W / 2) * hexSize * 1.5;
                const offY = EXPANDED_H / 2 - (H / 2) * hexSize * Math.sqrt(3);

                function hexCenter(col: number, row: number) {
                  return {
                    x: offX + hexSize * 1.5 * col + hexSize,
                    y: offY + hexSize * Math.sqrt(3) * (row + (col % 2) * 0.5) + hexSize,
                  };
                }

                // Check distance to each seed
                let closestSeed = null;
                let closestDist = hexSize * 2;
                for (const seed of seeds) {
                  const { x: cx, y: cy } = hexCenter(seed.col, seed.row);
                  const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
                  if (dist < closestDist) {
                    closestDist = dist;
                    closestSeed = seed;
                  }
                }

                setHoveredDistrict(closestSeed?.character || null);
              }}
              onMouseLeave={() => setHoveredDistrict(null)}
            >
              <canvas
                width={EXPANDED_W}
                height={EXPANDED_H}
                ref={canvasRef}
                style={{ display: 'block', width: '100%', height: 'auto' }}
              />
            </div>

            {/* Districts clickable list */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}>
              {layout.seeds.map(seed => (
                <button
                  key={seed.index}
                  onClick={() => setSelectedDistrict(seed.name)}
                  style={{
                    background: selectedDistrict === seed.name ? `${seed.color}66` : seed.color + '33',
                    border: `2px solid ${seed.color}99`,
                    borderRadius: 4,
                    padding: '8px 12px',
                    color: '#e2e2e8',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 'bold',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = `${seed.color}99`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = selectedDistrict === seed.name ? `${seed.color}66` : seed.color + '33';
                  }}
                >
                  {seed.name}
                </button>
              ))}
            </div>

            {/* Info about selected district */}
            {selectedDistrict && (
              <div style={{
                marginTop: 16,
                padding: 12,
                background: '#1e1e28',
                borderLeft: '3px solid #d4af37',
                borderRadius: 4,
                fontSize: 12,
                color: '#b8b8c8',
              }}>
                <strong>{selectedDistrict}</strong> selected. Click 🏪 Explore in the districts section below to see establishments.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Header */}
      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', borderBottom: '1px solid #2e2e42', paddingBottom: 4, marginBottom: 10 }}>
        City Map — Districts (Click to expand 🔍)
      </div>

      {/* Canvas */}
      <div
        onClick={handleCanvasClick}
        style={{
          position: 'relative',
          borderRadius: 6,
          overflow: 'hidden',
          border: '1px solid #2e2e42',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#d4af37'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#2e2e42'; }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
      </div>

      {/* District legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 8px', marginTop: 8 }}>
        {layout.seeds.map(seed => (
          <div
            key={seed.index}
            onMouseEnter={() => setHoveredDistrict(seed.character)}
            onMouseLeave={() => setHoveredDistrict(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, cursor: 'default',
              padding: '2px 6px', borderRadius: 4,
              background: hoveredDistrict === seed.character ? `${DISTRICT_LIGHT_COLORS[seed.character] ?? '#333'}22` : 'transparent',
              border: `1px solid ${hoveredDistrict === seed.character ? (DISTRICT_LIGHT_COLORS[seed.character] ?? '#333') + '66' : 'transparent'}`,
              transition: 'all 0.15s',
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: 1, background: DISTRICT_LIGHT_COLORS[seed.character] ?? '#666', flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: '#888', whiteSpace: 'nowrap' }}>{seed.name}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 8, height: 8, borderRadius: 1, background: '#6b5030' }} />
          <span style={{ fontSize: 9, color: '#666' }}>City Wall</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#e67e22', flexShrink: 0 }} />
          <span style={{ fontSize: 9, color: '#666' }}>Establishment</span>
        </div>
      </div>
    </div>
  );
};

export default CityMiniMap;
