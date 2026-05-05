# D&D World Builder Pro 🌍⚔️

A comprehensive AI-assisted world-building system for Dungeons & Dragons campaigns with deep lore generation, interactive hex maps, and interconnected economic/faction systems.

## Project Architecture

### 📁 Project Structure

```
DnD-Tracker-Pro/
├── api/
│   ├── world-builder.js           # Main API endpoint for world generation
│   └── world-builder/
│       ├── generators/
│       │   └── worldGenerator.js  # Core world generation logic
│       ├── services/              # Business logic services (Phase 2+)
│       └── data/
│           ├── histories.js       # 250+ pre-written city histories
│           ├── entities.js        # 200+ NPCs/gods/demons/ghosts
│           └── names.js           # City/POI names and generators
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── HexMap.tsx        # Interactive hex grid map
│   │   │   ├── EntityDetailsModal.tsx  # Detailed info popover
│   │   │   └── WorldGeneratorForm.tsx # World creation form
│   │   ├── hooks/
│   │   │   └── useWorldBuilder.ts # API interaction hook
│   │   ├── types/
│   │   │   └── world.ts          # TypeScript type definitions
│   │   ├── App.tsx               # Main app component
│   │   └── main.tsx              # React entry point
│   └── package.json              # Frontend dependencies
├── db/
│   ├── schema.sql                # Full PostgreSQL schema (all 5 phases)
│   └── migrations/               # Database migration files
├── package.json                  # Root dependencies
└── vercel.json                   # Vercel deployment config
```

## 🚀 Features by Phase

### Phase 1: Core World Generation ✅ (In Progress)
- **World Parameters**:
  - World age (100-5000 years)
  - Magic level (1-10 scale)
  - Civilization abundance (1-10 scale)
  - Climate and terrain types
  - Random or manual generation for each parameter

- **Generated Content**:
  - 10-30 cities with unique properties
  - 20+ points of interest (dungeons, ruins, shrines, etc.)
  - 10+ natural wonders
  - 4 adventure hooks per POI
  - 50+ NPCs/entities placed in the world

- **Interactive Features**:
  - Classic D&D hex grid map (Canvas-based)
  - Hover tooltips showing entity info
  - Click to expand detailed modals
  - Entity lists in sidebar
  - Export world data as JSON

### Phase 2: Deep Lore & Faction Systems
- **City Lore Generation**:
  - 250+ pre-written historical narratives (data array)
  - AI lore generation via Claude API (on demand)
  - Each city gets full history and character
  - Toggle between data-driven and AI modes

- **Faction Systems**:
  - Ruling governments (15+ types)
  - Criminal elements per city
  - Notable citizens (bards, artists, warriors, scholars)
  - Faction relationships (allies, rivals)
  - Sports teams and cultural icons

- **NPC Management**:
  - 200+ entity templates (gods, demons, angels, ghosts, legendary NPCs)
  - Combat-ready stat blocks
  - Personality and motivation tracking
  - Associated cities/POIs
  - Can be added to combat encounters

### Phase 3: Weather & Planes
- **Realistic Weather System**:
  - Hex-by-hex weather simulation
  - Temperature, wind, humidity tracking
  - Seasonal variations
  - 10+ types of weather anomalies (freak storms, earthquakes, etc.)
  - Severity ratings for anomalies

- **Multi-Plane Support**:
  - Generate worlds on different planes (Material Plane, Shadowfell, Feywild, etc.)
  - Plane-specific rules and traits
  - Option to explain party location with AI narration

### Phase 4: Economic Simulation
- **Trade Route System**:
  - Procedural trade routes between cities
  - Commodity tracking (20+ types)
  - Supply and demand mechanics
  - Price fluctuation based on availability
  - Faction control over routes

- **Economic Ripple Effects**:
  - Track economic impact of events
  - Commodity booms/busts affect city wealth
  - Trade routes strengthen based on usage
  - NPCs influence commodity prices

### Phase 5: Event System & API Hooks
- **Ripple Effect Engine**:
  - Event-driven world simulation
  - When a bard writes a song → becomes popular → creates new delicacy demand
  - Demand increases → hunters make more money → trade routes strengthen
  - All changes propagate through connected systems

- **API Integration**:
  - Webhooks for connected apps to listen to world events
  - REST API for querying world state
  - Real-time event streaming
  - Support for cross-app synchronization

## 🛠️ Technology Stack

- **Backend**: Node.js/Express (Vercel serverless)
- **Database**: PostgreSQL (Supabase)
- **Frontend**: React 18 + TypeScript + Vite
- **AI**: Anthropic Claude API (with prompt caching)
- **Map Rendering**: HTML5 Canvas
- **State Management**: React hooks
- **Authentication**: Supabase Auth

## 📊 Data Models

### World Schema
```typescript
World {
  id: UUID
  name: string
  age: number (years)
  magicLevel: number (1-10)
  civilizationAbundance: number (1-10)
  climate: string
  terrain: string
  worldSeed: string
  cities: City[]
  pointsOfInterest: PointOfInterest[]
  npcs: NPC[]
  factions: Faction[]
  weatherPatterns: WeatherPattern[]
  createdAt: timestamp
}
```

### City Schema
```typescript
City {
  id: UUID
  name: string
  population: number
  hex_x, hex_y: hex coordinates
  governmentType: string
  history: string
  rulingFactions: Faction[]
  criminalElements: string
  notableCitizens: NPC[]
  economicFocus: string
}
```

### NPC Schema (Combat-Ready)
```typescript
NPC {
  id: UUID
  name: string
  type: god | demon | angel | ghost | npc
  race: string
  class: string
  level: number
  alignment: string
  // D&D 5e stats
  str, dex, con, int, wis, cha: number
  ac: number
  hp: number
  // World context
  associatedCityId: UUID
  factionId: UUID
}
```

## 🔄 Generation Algorithm

### Seeded Randomization
- All worlds are reproducible via world seed
- Same seed = same world every time
- Allows sharing world seeds with players

### Hex Grid Generation
- Pointy-top hex coordinates
- 50x50 hex grid (2500 potential locations)
- Cities and POIs placed with no overlaps
- Distance-based relationships for trade routes

### Content Assembly
1. Generate world parameters (or accept user input)
2. Create cities based on civilization level
3. Scatter POIs with danger levels
4. Select/generate NPCs from entity pools
5. Build factions around major cities
6. Create trade routes between cities
7. Generate weather patterns across hexes
8. Create historical events that shaped the world

## 📚 Data Arrays (Expandable)

### Histories (250+ pre-written)
- Rise of a city
- Fall and recovery
- Magical discovery
- Historical conflicts
- Transformative events
- Mysteries and legends

### Entities (200+)
- Gods (major/minor deities)
- Demons (demon lords)
- Angels (celestial beings)
- Ghosts (spirits)
- Legendary NPCs (bards, warriors, artificers, etc.)

### Geographic Names
- 50+ city names
- 10+ POI names per type
- 15+ government types
- 15+ faction types

## 🎮 User Workflow

### 1. Create a World
```
User fills form:
  - World name
  - Select or randomize: age, magic level, civilization
  - Select or randomize: climate, terrain
  
System generates:
  - Procedurally placed cities
  - Points of interest
  - NPCs and factions
  - Weather patterns
```

### 2. Explore the Map
```
User hovers over hexes:
  - See entity names and types
  - See hex coordinates
  
User clicks entity:
  - Opens detailed modal
  - Shows history, factions, NPCs
  - Lists adventure hooks
```

### 3. Deep Dive into Cities
```
User clicks a city:
  - Modal shows full history (AI or data-driven)
  - Lists ruling factions
  - Shows notable citizens
  - Reveals criminal elements
  - Displays economic focus
```

### 4. Plan Adventures
```
User clicks POI:
  - Shows danger level
  - Lists 4 adventure hooks
  - Can click to expand each hook
  - Shows associated NPCs
  - Can export encounter data
```

### 5. Export & Share
```
User can:
  - Export world as JSON
  - Share world seed for reproducibility
  - Save to account
  - Generate maps with ChatGPT API (later)
```

## 🔧 API Endpoints

### POST /api/world-builder

**Generate World**
```
{
  action: "generate",
  params: {
    name: "My World",
    age: 2500,
    magicLevel: 7,
    civilizationAbundance: 6,
    climate: "Temperate",
    terrain: "Forest"
  }
}
```

**Generate City Lore**
```
{
  action: "generateCityLore",
  params: {
    cityName: "Waterdeep",
    civilization: 9,
    magicLevel: 8,
    age: 3000,
    lorelMode: "claude_ai" // or "data_array"
  }
}
```

**Save World**
```
{
  action: "saveWorld",
  params: {
    name: "My Campaign World",
    worldData: { ...world object }
  }
}
```

## 📋 Database Migrations

Run this to set up the database:
```bash
psql -U user -d dnd_tracker < db/schema.sql
```

All tables are created with:
- Proper indexes for performance
- Foreign key relationships
- Auto-updating `updated_at` fields
- Support for soft deletes (in Phase 2)

## 🚀 Deployment

### Development
```bash
# Install dependencies
npm install
cd frontend && npm install

# Run dev server
npm run dev
cd frontend && npm run dev
```

### Production
```bash
# Build frontend
cd frontend && npm run build

# Deploy with Vercel (automatic)
vercel deploy
```

## 🎯 Next Steps (Phases 2-5)

- [ ] Complete Phase 2: Deep lore generation, detailed faction systems
- [ ] Complete Phase 3: Weather system, multi-plane support
- [ ] Complete Phase 4: Trade route simulation, economic mechanics
- [ ] Complete Phase 5: Ripple effect engine, cross-app API
- [ ] Add map rendering via ChatGPT API
- [ ] Build NPC stat block export formats
- [ ] Create campaign journal integration
- [ ] Add multiplayer world sharing
- [ ] Build mobile app version

## 📝 Notes

- All world generation is **seeded** for reproducibility
- Data arrays are **easily expandable** (add more histories, entities, names)
- API is **extensible** for connecting other D&D apps
- Frontend is **fully TypeScript** for type safety
- Backend uses **Anthropic Claude** for sophisticated lore generation
- Weather system supports **dynamic anomalies** for story hooks

---

**Built with ❤️ for D&D Dungeon Masters everywhere** 🎲
