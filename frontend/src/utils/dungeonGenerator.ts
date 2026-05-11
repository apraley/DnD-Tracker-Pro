/**
 * Dungeon Generator — Inspired by donjon.bin.sh
 * https://donjon.bin.sh/code/dungeon/dungeon.pl
 *
 * Generates a grid-based dungeon with rooms, winding corridors,
 * doors, and multiple levels of increasing difficulty.
 */
import { fnv1a } from './establishmentGenerator';

// ─── Cell bitmask ─────────────────────────────────────────────────────────────
export const NOTHING   = 0x00000000;
export const BLOCKED   = 0x00000001;
export const ROOM      = 0x00000002;
export const CORRIDOR  = 0x00000004;
export const PERIM     = 0x00000010;
export const ENTRANCE  = 0x00000020;
export const ARCH_DOOR = 0x00000040;
export const WALL_DOOR = 0x00000080;
export const LOCK_DOOR = 0x00000100;
export const TRAP_DOOR = 0x00000200;
export const SECR_DOOR = 0x00000400;
export const STAIR_DN  = 0x00000800;
export const STAIR_UP  = 0x00001000;
export const ROOM_ID   = 0x00FF0000; // bits 16-23: room index + 1 (0 = no room)

export const OPENSPACE = ROOM | CORRIDOR;
export const DOOR_ANY  = ARCH_DOOR | WALL_DOOR | LOCK_DOOR | TRAP_DOOR | SECR_DOOR;

// ─── Types ────────────────────────────────────────────────────────────────────
export type RoomType = 'entrance' | 'boss' | 'treasure' | 'encounter' | 'trap' | 'lore' | 'empty' | 'stairdown';

export interface DungeonRoom {
  id: number;
  r1: number; c1: number; // top-left
  r2: number; c2: number; // bottom-right
  rCenter: number; cCenter: number;
  type: RoomType;
  label: string;
  description: string;
}

export interface DungeonStair {
  row: number; col: number;
  direction: 'up' | 'down';
  targetLevel: number;
}

export interface DungeonLevel {
  level: number;          // 1-based
  difficulty: 1 | 2 | 3 | 4;
  nRows: number;
  nCols: number;
  cells: Int32Array;      // [row * nCols + col] = bitmask
  rooms: DungeonRoom[];
  stairs: DungeonStair[];
}

export interface GeneratedDungeon {
  levels: DungeonLevel[];
  dangerLevel: number;
}

// ─── Seeded RNG ───────────────────────────────────────────────────────────────
function makeRng(seed: number) {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return () => { s = ((Math.imul(1664525, s) + 1013904223) >>> 0); return s / 0x100000000; };
}

// ─── Room type sequence ───────────────────────────────────────────────────────
function buildRoomTypes(count: number): RoomType[] {
  if (count === 0) return [];
  const types: RoomType[] = ['entrance'];
  for (let i = 1; i < count - 1; i++) {
    const r = i / (count - 1);
    if (r < 0.15)      types.push('lore');
    else if (r < 0.30) types.push('encounter');
    else if (r < 0.45) types.push('trap');
    else if (r < 0.60) types.push('encounter');
    else if (r < 0.70) types.push('lore');
    else if (r < 0.80) types.push('empty');
    else if (r < 0.90) types.push('trap');
    else               types.push('encounter');
  }
  if (count >= 3) types[count - 2] = 'treasure';
  types.push('boss');
  return types;
}

// ─── Direction vectors (N, S, E, W) ──────────────────────────────────────────
const DIRS = [[-1, 0], [1, 0], [0, 1], [0, -1]];

// ─── Single level generator ───────────────────────────────────────────────────
function generateLevel(
  levelNum: number,
  difficulty: 1 | 2 | 3 | 4,
  baseSeed: number,
  targetRooms: number,
  exRooms: Array<{ role: string; name: string; description: string }>,
  hasStairsUp: boolean,
  hasStairsDown: boolean,
): DungeonLevel {
  const rng = makeRng(baseSeed + levelNum * 9973);
  const ROWS = 56, COLS = 84;
  const cells = new Int32Array(ROWS * COLS);

  const at  = (r: number, c: number) => cells[r * COLS + c];
  const set = (r: number, c: number, flags: number) => { cells[r * COLS + c] |= flags; };
  const clr = (r: number, c: number, flags: number) => { cells[r * COLS + c] &= ~flags; };

  // Block borders
  for (let r = 0; r < ROWS; r++) {
    set(r, 0, BLOCKED); set(r, COLS - 1, BLOCKED);
  }
  for (let c = 0; c < COLS; c++) {
    set(0, c, BLOCKED); set(ROWS - 1, c, BLOCKED);
  }

  // ── Place rooms ──────────────────────────────────────────────────────────
  const rooms: DungeonRoom[] = [];
  const minRoomW = 4, maxRoomW = 10;
  const minRoomH = 3, maxRoomH = 7;

  for (let attempts = 0; attempts < 600 && rooms.length < targetRooms; attempts++) {
    const rw = minRoomW + Math.floor(rng() * (maxRoomW - minRoomW + 1));
    const rh = minRoomH + Math.floor(rng() * (maxRoomH - minRoomH + 1));
    // Align to odd coords (donjon style — ensures maze connections work)
    const r1 = 1 + Math.floor(rng() * Math.floor((ROWS - rh - 2) / 2)) * 2;
    const c1 = 1 + Math.floor(rng() * Math.floor((COLS - rw - 2) / 2)) * 2;
    const r2 = r1 + rh - 1, c2 = c1 + rw - 1;
    if (r2 >= ROWS - 1 || c2 >= COLS - 1) continue;

    // Check for overlap (include 1-cell perimeter)
    let blocked = false;
    for (let r = r1 - 1; r <= r2 + 1 && !blocked; r++)
      for (let c = c1 - 1; c <= c2 + 1 && !blocked; c++)
        if (at(r, c) & (ROOM | PERIM)) blocked = true;
    if (blocked) continue;

    const id = rooms.length;
    // Carve room
    for (let r = r1; r <= r2; r++)
      for (let c = c1; c <= c2; c++)
        set(r, c, ROOM | ((id + 1) << 16));

    // Mark perimeter (for corridor connection detection)
    for (let r = r1 - 1; r <= r2 + 1; r++) {
      set(r, c1 - 1, PERIM); set(r, c2 + 1, PERIM);
    }
    for (let c = c1 - 1; c <= c2 + 1; c++) {
      set(r1 - 1, c, PERIM); set(r2 + 1, c, PERIM);
    }

    rooms.push({
      id, r1, c1, r2, c2,
      rCenter: Math.floor((r1 + r2) / 2),
      cCenter: Math.floor((c1 + c2) / 2),
      type: 'empty', label: '', description: '',
    });
  }

  // ── Assign room types ─────────────────────────────────────────────────────
  const typeSeq = buildRoomTypes(rooms.length);
  const roleMap: Record<string, { name: string; description: string }> = {};
  for (const er of exRooms) roleMap[er.role] = { name: er.name, description: er.description };

  rooms.forEach((room, i) => {
    room.type = typeSeq[i] ?? 'empty';
    switch (room.type) {
      case 'entrance':  room.label = 'Entrance';                                             break;
      case 'boss':      room.label = roleMap['boss']?.name    ?? 'Boss Chamber';             break;
      case 'treasure':  room.label = roleMap['reward']?.name  ?? 'Treasure Vault';           break;
      case 'trap':      room.label = roleMap['hazard']?.name  ?? 'Trapped Hall';             break;
      case 'lore':      room.label = roleMap['lore']?.name    ?? 'Ancient Archives';         break;
      case 'encounter': room.label = roleMap['encounter']?.name ?? 'Guard Room';             break;
      case 'stairdown': room.label = 'Stairs Down';                                         break;
      default:          room.label = 'Empty Chamber';
    }
    room.description = (roleMap[room.type === 'encounter' ? 'encounter'
                                 : room.type === 'lore'   ? 'lore'
                                 : room.type === 'boss'   ? 'boss'
                                 : room.type === 'treasure'? 'reward'
                                 : room.type === 'trap'   ? 'hazard'
                                 : '']?.description) ?? '';
  });

  // ── Generate corridors (maze-fill, then connect rooms via scouting) ───────
  // Use a simple winding maze fill on the non-room cells, then connect
  // room centers to the maze using tunnels.

  // Step 1: Fill every unset odd-coord cell with maze corridors (recursive backtracker)
  const mazeStack: [number, number][] = [];
  // Find a free odd cell to start
  for (let r = 1; r < ROWS - 1 && mazeStack.length === 0; r += 2) {
    for (let c = 1; c < COLS - 1 && mazeStack.length === 0; c += 2) {
      if (at(r, c) === NOTHING) { set(r, c, CORRIDOR); mazeStack.push([r, c]); }
    }
  }

  while (mazeStack.length > 0) {
    const [r, c] = mazeStack[mazeStack.length - 1];
    // Shuffle directions
    const dirs = [...DIRS].sort(() => rng() - 0.5);
    let moved = false;
    for (const [dr, dc] of dirs) {
      const nr = r + dr * 2, nc = c + dc * 2;
      if (nr < 1 || nr >= ROWS - 1 || nc < 1 || nc >= COLS - 1) continue;
      if (at(nr, nc) !== NOTHING) continue;
      // Carve through the wall between
      set(r + dr, c + dc, CORRIDOR);
      set(nr, nc, CORRIDOR);
      mazeStack.push([nr, nc]);
      moved = true;
      break;
    }
    if (!moved) mazeStack.pop();
  }

  // Step 2: Connect each room to the nearest corridor/room cell by tunneling
  for (const room of rooms) {
    const startR = room.rCenter, startC = room.cCenter;
    // BFS to find nearest CORRIDOR cell, then tunnel from room edge to it
    // Simple approach: just carve L-shaped tunnel from room center outward
    let found = false;
    const tunnelDirs = [...DIRS].sort(() => rng() - 0.5);
    for (const [dr, dc] of tunnelDirs) {
      if (found) break;
      for (let step = 1; step < Math.max(ROWS, COLS); step++) {
        const nr = startR + dr * step, nc = startC + dc * step;
        if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) break;
        const cell = at(nr, nc);
        if (cell & (ROOM | CORRIDOR)) {
          if ((cell & ROOM) && ((cell >>> 16) & 0xFF) === room.id + 1) continue; // same room
          // Carve from room edge to here
          for (let s = 1; s <= step; s++) {
            const tr = startR + dr * s, tc = startC + dc * s;
            if (!(at(tr, tc) & ROOM)) set(tr, tc, CORRIDOR);
          }
          found = true;
          break;
        }
      }
    }
  }

  // Step 3: Add doors at room entrances (where CORRIDOR meets PERIM of a room)
  for (const room of rooms) {
    const doorSpots: [number, number][] = [];
    for (const [dr, dc] of DIRS) {
      // Walk perimeter edge
      if (dr === -1 || dr === 1) {
        const r = dr === -1 ? room.r1 - 1 : room.r2 + 1;
        for (let c = room.c1; c <= room.c2; c++) {
          if (at(r, c) & CORRIDOR) doorSpots.push([r, c]);
        }
      } else {
        const c = dc === -1 ? room.c1 - 1 : room.c2 + 1;
        for (let r = room.r1; r <= room.r2; r++) {
          if (at(r, c) & CORRIDOR) doorSpots.push([r, c]);
        }
      }
    }
    for (const [dr2, dc2] of doorSpots) {
      const roll = rng();
      let doorType: number;
      if (roll < 0.40)      doorType = ARCH_DOOR;
      else if (roll < 0.70) doorType = WALL_DOOR;
      else if (roll < 0.85) doorType = LOCK_DOOR;
      else if (roll < 0.94) doorType = TRAP_DOOR;
      else                  doorType = SECR_DOOR;
      set(dr2, dc2, ENTRANCE | doorType);
    }
  }

  // Step 4: Remove dead ends (cells with only one open neighbor)
  for (let pass = 0; pass < 3; pass++) {
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (!(at(r, c) & CORRIDOR)) continue;
        let openNeighbors = 0;
        for (const [dr, dc] of DIRS) {
          if (at(r + dr, c + dc) & OPENSPACE) openNeighbors++;
        }
        if (openNeighbors <= 1) clr(r, c, CORRIDOR);
      }
    }
  }

  // ── Place stairs ──────────────────────────────────────────────────────────
  const stairs: DungeonStair[] = [];
  if (hasStairsUp && rooms.length > 0) {
    const r = rooms[0];
    const sr = r.r1 + 1, sc = r.c1 + 1;
    set(sr, sc, STAIR_UP);
    stairs.push({ row: sr, col: sc, direction: 'up', targetLevel: levelNum - 1 });
  }
  if (hasStairsDown && rooms.length > 0) {
    const r = rooms[rooms.length - 1];
    const sr = Math.min(r.r2 - 1, ROWS - 2), sc = Math.min(r.c2 - 1, COLS - 2);
    set(sr, sc, STAIR_DN);
    // Mark last room as stairdown if not boss
    if (rooms.length >= 2) rooms[rooms.length - 2].type = 'stairdown';
    stairs.push({ row: sr, col: sc, direction: 'down', targetLevel: levelNum + 1 });
  }

  return { level: levelNum, difficulty, nRows: ROWS, nCols: COLS, cells, rooms, stairs };
}

// ─── Main entry point ─────────────────────────────────────────────────────────
export function generateDungeon(
  seed: string,
  dangerLevel: number,
  exRooms: Array<{ role: string; name: string; description: string }>,
): GeneratedDungeon {
  const baseSeed = fnv1a(seed + '|dungeon') >>> 0;
  const totalLevels = dangerLevel <= 5 ? 1 : dangerLevel <= 10 ? 2 : dangerLevel <= 15 ? 3 : 4;

  const levels: DungeonLevel[] = [];
  for (let lvl = 1; lvl <= totalLevels; lvl++) {
    const ratio = lvl / totalLevels;
    const difficulty = (ratio <= 0.25 ? 1 : ratio <= 0.50 ? 2 : ratio <= 0.75 ? 3 : 4) as 1 | 2 | 3 | 4;
    const targetRooms = 6 + Math.floor(lvl * 2.5) + Math.floor(dangerLevel / 5);
    const hasUp   = lvl > 1;
    const hasDown = lvl < totalLevels;
    levels.push(generateLevel(lvl, difficulty, baseSeed, targetRooms, exRooms, hasUp, hasDown));
  }

  return { levels, dangerLevel };
}
