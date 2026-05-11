/**
 * DungeonMap — canvas renderer for a multi-level donjon-style dungeon.
 * Embedded inside the DetailPanel when a dungeon/POI is selected.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { ExUmbraDungeon } from '../utils/exUmbraSimulator';
import type { PointOfInterest } from '../types/world';
import { generateDungeon, ROOM, CORRIDOR, ENTRANCE, STAIR_DN, STAIR_UP,
         ARCH_DOOR, WALL_DOOR, LOCK_DOOR, TRAP_DOOR, SECR_DOOR,
         type DungeonLevel, type DungeonRoom } from '../utils/dungeonGenerator';

interface Props {
  poi: PointOfInterest;
  dungeon: ExUmbraDungeon;
  worldSeed: string;
}

// Room type → fill color
const ROOM_COLORS: Record<string, string> = {
  entrance:  '#1a2a1a',
  boss:      '#2a0a0a',
  treasure:  '#2a2000',
  encounter: '#1a1a2a',
  trap:      '#2a1500',
  lore:      '#0a1a2a',
  stairdown: '#1a1a2a',
  empty:     '#161618',
};

const ROOM_ACCENT: Record<string, string> = {
  entrance: '#27ae60', boss: '#c0392b', treasure: '#d4af37',
  encounter: '#8e44ad', trap: '#e67e22', lore: '#2980b9',
  stairdown: '#7f8c8d', empty: '#444',
};

const DIFF_LABELS = ['', 'Perilous', 'Deadly', 'Lethal', 'Mythic'];
const DIFF_COLORS = ['', '#27ae60', '#d4af37', '#e67e22', '#c0392b'];

const DungeonMap: React.FC<Props> = ({ poi, dungeon, worldSeed }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dungeonData] = useState(() =>
    generateDungeon(poi.id + worldSeed, poi.dangerLevel, dungeon.rooms)
  );
  const [activeLevel, setActiveLevel] = useState(0);
  const [hoveredRoom, setHoveredRoom] = useState<DungeonRoom | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const CANVAS_W = 380, CANVAS_H = 280;
  const level = dungeonData.levels[activeLevel];

  const drawLevel = useCallback((ctx: CanvasRenderingContext2D, lv: DungeonLevel) => {
    const cs = Math.min(CANVAS_W / lv.nCols, CANVAS_H / lv.nRows);
    const padX = (CANVAS_W - cs * lv.nCols) / 2;
    const padY = (CANVAS_H - cs * lv.nRows) / 2;

    // Background
    ctx.fillStyle = '#080810';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Draw each cell
    for (let r = 0; r < lv.nRows; r++) {
      for (let c = 0; c < lv.nCols; c++) {
        const cell = lv.cells[r * lv.nCols + c];
        const x = padX + c * cs, y = padY + r * cs;

        if (!cell) continue; // wall = black (background)

        const isRoom = !!(cell & ROOM);
        const isCorridor = !!(cell & CORRIDOR);
        const isEntrance = !!(cell & ENTRANCE);

        if (isRoom) {
          // Find which room this is
          const roomId = ((cell >>> 16) & 0xFF) - 1;
          const room = lv.rooms[roomId];
          const color = room ? ROOM_COLORS[room.type] ?? '#161618' : '#161618';
          ctx.fillStyle = color;
          ctx.fillRect(x, y, cs + 0.5, cs + 0.5);

          // Subtle grid lines inside rooms
          ctx.strokeStyle = 'rgba(255,255,255,0.03)';
          ctx.lineWidth = 0.3;
          ctx.strokeRect(x, y, cs, cs);
        } else if (isCorridor) {
          ctx.fillStyle = '#111120';
          ctx.fillRect(x, y, cs + 0.5, cs + 0.5);
        }

        if (isEntrance) {
          // Door indicator
          const doorSize = cs * 0.55;
          const dx = x + (cs - doorSize) / 2, dy = y + (cs - doorSize) / 2;
          if (cell & ARCH_DOOR)      { ctx.fillStyle = '#aaaaaa'; ctx.fillRect(dx, dy, doorSize, doorSize); }
          else if (cell & WALL_DOOR) { ctx.fillStyle = '#8b6914'; ctx.fillRect(dx, dy, doorSize, doorSize); }
          else if (cell & LOCK_DOOR) { ctx.fillStyle = '#c0392b'; ctx.fillRect(dx, dy, doorSize, doorSize); }
          else if (cell & TRAP_DOOR) { ctx.fillStyle = '#e67e22'; ctx.fillRect(dx, dy, doorSize, doorSize); }
          else if (cell & SECR_DOOR) { ctx.fillStyle = '#2c2c2c'; ctx.fillRect(dx, dy, doorSize, doorSize); }
        }

        if (cell & STAIR_DN) {
          ctx.fillStyle = '#d4af37';
          ctx.font = `bold ${Math.max(6, cs * 1.2)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('▼', x + cs / 2, y + cs / 2);
        }
        if (cell & STAIR_UP) {
          ctx.fillStyle = '#64b5f6';
          ctx.font = `bold ${Math.max(6, cs * 1.2)}px monospace`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('▲', x + cs / 2, y + cs / 2);
        }
      }
    }

    // Room outlines + labels
    for (const room of lv.rooms) {
      const x = padX + room.c1 * cs, y = padY + room.r1 * cs;
      const w = (room.c2 - room.c1 + 1) * cs, h = (room.r2 - room.r1 + 1) * cs;
      const accent = ROOM_ACCENT[room.type] ?? '#444';

      // Room border
      ctx.strokeStyle = accent + '99';
      ctx.lineWidth = 0.8;
      ctx.strokeRect(x + 0.4, y + 0.4, w - 0.8, h - 0.8);

      // Type icon + label (only when room is large enough)
      if (w >= cs * 5 && h >= cs * 4 && cs >= 3) {
        const cx2 = x + w / 2, cy2 = y + h / 2;
        const fontSize = Math.max(5, Math.min(cs * 1.8, 11));

        // Icon
        const icons: Record<string, string> = {
          entrance: '⬆', boss: '☠', treasure: '★', encounter: '⚔',
          trap: '⚙', lore: '📖', stairdown: '▼', empty: '',
        };
        const icon = icons[room.type] ?? '';
        if (icon && cs >= 4) {
          ctx.font = `${fontSize * 1.3}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = accent + 'cc';
          ctx.fillText(icon, cx2, cy2 - fontSize * 0.6);
        }

        // Label
        if (room.label && cs >= 3) {
          ctx.font = `bold ${fontSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'rgba(0,0,0,0.8)';
          ctx.fillText(room.label, cx2 + 0.5, cy2 + fontSize * 0.8 + 0.5);
          ctx.fillStyle = accent;
          ctx.fillText(room.label, cx2, cy2 + fontSize * 0.8);
        }
      }
    }

    // Level indicator
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillText(`B${lv.level}`, padX + 3.5, padY + 3.5);
    ctx.fillStyle = DIFF_COLORS[lv.difficulty];
    ctx.fillText(`B${lv.level}`, padX + 3, padY + 3);

  }, [CANVAS_W, CANVAS_H]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !level) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawLevel(ctx, level);
  }, [level, drawLevel]);

  // Mouse hover to detect rooms
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !level) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const cs = Math.min(CANVAS_W / level.nCols, CANVAS_H / level.nRows);
    const padX = (CANVAS_W - cs * level.nCols) / 2;
    const padY = (CANVAS_H - cs * level.nRows) / 2;
    const col = Math.floor((mx - padX) / cs);
    const row = Math.floor((my - padY) / cs);

    if (row >= 0 && row < level.nRows && col >= 0 && col < level.nCols) {
      const cell = level.cells[row * level.nCols + col];
      if (cell & ROOM) {
        const roomId = ((cell >>> 16) & 0xFF) - 1;
        setHoveredRoom(level.rooms[roomId] ?? null);
        setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        return;
      }
    }
    setHoveredRoom(null);
  };

  if (!level) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', borderBottom: '1px solid #2e2e42', paddingBottom: 4, marginBottom: 10 }}>
        Dungeon Map
      </div>

      {/* Level tabs */}
      {dungeonData.levels.length > 1 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          {dungeonData.levels.map((lv, i) => (
            <button
              key={i}
              onClick={() => setActiveLevel(i)}
              style={{
                flex: 1, padding: '4px 0', borderRadius: 4, cursor: 'pointer', fontSize: 10,
                fontFamily: 'monospace', letterSpacing: '0.06em',
                background: activeLevel === i ? `${DIFF_COLORS[lv.difficulty]}22` : 'transparent',
                border: `1px solid ${activeLevel === i ? DIFF_COLORS[lv.difficulty] : '#2e2e42'}`,
                color: activeLevel === i ? DIFF_COLORS[lv.difficulty] : '#555',
              }}
            >
              B{lv.level} — {DIFF_LABELS[lv.difficulty]}
            </button>
          ))}
        </div>
      )}

      {/* Canvas */}
      <div style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', border: '1px solid #2e2e42', background: '#080810' }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ display: 'block', width: '100%', height: 'auto', cursor: 'crosshair' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredRoom(null)}
        />

        {/* Room tooltip */}
        {hoveredRoom && (
          <div style={{
            position: 'absolute',
            left: Math.min(tooltipPos.x + 10, 240),
            top: Math.min(tooltipPos.y + 10, 200),
            background: 'rgba(10,10,18,0.97)',
            border: `1px solid ${ROOM_ACCENT[hoveredRoom.type] ?? '#333'}`,
            borderRadius: 6, padding: '6px 10px',
            pointerEvents: 'none', zIndex: 10, maxWidth: 160,
          }}>
            <div style={{ fontSize: 11, fontWeight: 'bold', color: ROOM_ACCENT[hoveredRoom.type] ?? '#ccc', marginBottom: 2 }}>
              {hoveredRoom.label}
            </div>
            {hoveredRoom.description && (
              <div style={{ fontSize: 9, color: '#888', lineHeight: 1.4 }}>{hoveredRoom.description}</div>
            )}
          </div>
        )}
      </div>

      {/* Map key */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', marginTop: 8 }}>
        {[
          { type: 'entrance', label: '⬆ Entrance' }, { type: 'encounter', label: '⚔ Guard Room' },
          { type: 'trap',     label: '⚙ Trap' },     { type: 'lore',      label: '📖 Archive' },
          { type: 'treasure', label: '★ Vault' },     { type: 'boss',      label: '☠ Boss' },
        ].map(({ type, label }) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: 1, background: ROOM_ACCENT[type], flexShrink: 0 }} />
            <span style={{ fontSize: 9, color: '#666' }}>{label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 1, background: '#8b6914' }} />
          <span style={{ fontSize: 9, color: '#666' }}>Door</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 1, background: '#c0392b' }} />
          <span style={{ fontSize: 9, color: '#666' }}>Locked</span>
        </div>
      </div>

      {/* Level info */}
      <div style={{ marginTop: 10, padding: '6px 10px', background: '#111118', borderRadius: 4, border: '1px solid #2e2e42' }}>
        <div style={{ fontSize: 10, color: '#555', fontFamily: 'monospace' }}>
          Level {level.level} · {DIFF_LABELS[level.difficulty]} · {level.rooms.length} rooms
          {dungeonData.levels.length > 1 && ` · ${dungeonData.levels.length} total floors`}
        </div>
      </div>
    </div>
  );
};

export default DungeonMap;
