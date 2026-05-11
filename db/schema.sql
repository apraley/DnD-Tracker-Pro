-- World Builder Database Schema

-- Planets/Worlds
CREATE TABLE IF NOT EXISTS worlds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  plane_id UUID REFERENCES planes(id),
  age INTEGER, -- years
  magic_level INTEGER, -- 1-10 scale
  civilization_abundance INTEGER, -- 1-10 scale
  climate_type VARCHAR(100),
  primary_terrain VARCHAR(100),
  description TEXT,
  world_seed VARCHAR(255), -- for reproducibility
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES auth.users(id),
  campaign_id UUID REFERENCES campaigns(id),
  auto_save_enabled BOOLEAN DEFAULT true,
  last_auto_saved TIMESTAMP
);

-- Planes (Material Plane, Shadowfell, Feywild, etc)
CREATE TABLE IF NOT EXISTS planes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  rules_type VARCHAR(100), -- e.g., "standard", "high-magic", "low-magic"
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cities
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  population INTEGER,
  hex_x INTEGER,
  hex_y INTEGER,
  government_type VARCHAR(100), -- monarchy, democracy, theocracy, etc
  primary_faction_id UUID REFERENCES factions(id),
  history_id UUID REFERENCES histories(id),
  lore TEXT,
  lore_generated_by VARCHAR(50), -- 'data_array' or 'claude_ai'
  discovered_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_world_cities (world_id),
  INDEX idx_hex_location (world_id, hex_x, hex_y)
);

-- Points of Interest
CREATE TABLE IF NOT EXISTS points_of_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  poi_type VARCHAR(100), -- dungeon, ruins, natural wonder, shrine, etc
  hex_x INTEGER,
  hex_y INTEGER,
  description TEXT,
  danger_level INTEGER, -- 1-20 (CR equivalent)
  description_generated_by VARCHAR(50), -- 'data_array' or 'claude_ai'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_world_poi (world_id),
  INDEX idx_hex_poi (world_id, hex_x, hex_y)
);

-- Adventure Hooks/Encounters for POIs
CREATE TABLE IF NOT EXISTS adventure_hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poi_id UUID NOT NULL REFERENCES points_of_interest(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  encounter_type VARCHAR(100), -- combat, exploration, roleplay, puzzle, etc
  difficulty INTEGER, -- 1-20
  reward_type VARCHAR(100), -- treasure, knowledge, faction_favor, etc
  reward_details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_poi_hooks (poi_id)
);

-- NPCs (Gods, Demons, Ghosts, Regular NPCs, Bards, etc)
CREATE TABLE IF NOT EXISTS npcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  npc_type VARCHAR(100), -- god, demon, ghost, angel, bard, merchant, warden, warrior, etc
  race VARCHAR(100),
  class VARCHAR(100),
  background TEXT,
  personality TEXT,
  motivations TEXT,
  lore TEXT,
  associated_city_id UUID REFERENCES cities(id),
  associated_poi_id UUID REFERENCES points_of_interest(id),
  faction_id UUID REFERENCES factions(id),
  -- Combat stats
  level INTEGER,
  armor_class INTEGER,
  hit_points INTEGER,
  strength INTEGER,
  dexterity INTEGER,
  constitution INTEGER,
  intelligence INTEGER,
  wisdom INTEGER,
  charisma INTEGER,
  proficiencies TEXT, -- JSON array
  abilities TEXT, -- JSON array
  -- Role in world
  role_type VARCHAR(100), -- ruler, merchant, criminal_boss, artist, athlete, etc
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_world_npcs (world_id),
  INDEX idx_city_npcs (associated_city_id),
  INDEX idx_faction_npcs (faction_id)
);

-- Factions/Governments
CREATE TABLE IF NOT EXISTS factions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  faction_type VARCHAR(100), -- ruling_government, criminal, merchant_guild, religious, etc
  description TEXT,
  headquarters_city_id UUID REFERENCES cities(id),
  leader_npc_id UUID REFERENCES npcs(id),
  alignment VARCHAR(50), -- lawful good, chaotic evil, etc
  goals TEXT,
  rivals TEXT, -- JSON array of faction IDs
  allies TEXT, -- JSON array of faction IDs
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_world_factions (world_id),
  INDEX idx_faction_type (world_id, faction_type)
);

-- Histories (Large data array of 250+ pre-written histories)
CREATE TABLE IF NOT EXISTS histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  length_years INTEGER,
  theme VARCHAR(100), -- rise, fall, mystery, conflict, transformation, etc
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Historical Events
CREATE TABLE IF NOT EXISTS historical_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  event_type VARCHAR(100), -- war, plague, discovery, cultural_shift, trade_route_established, etc
  title VARCHAR(255) NOT NULL,
  description TEXT,
  year_occurred INTEGER,
  affected_cities TEXT, -- JSON array of city IDs
  affected_factions TEXT, -- JSON array of faction IDs
  triggered_by_npc_id UUID REFERENCES npcs(id),
  consequences TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_world_events (world_id),
  INDEX idx_year_occurred (year_occurred)
);

-- Economic Goods/Commodities
CREATE TABLE IF NOT EXISTS commodities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  base_value INTEGER,
  origin_city_id UUID REFERENCES cities(id),
  current_demand INTEGER, -- 1-10 scale
  current_supply INTEGER, -- 1-10 scale
  price_trend VARCHAR(50), -- rising, falling, stable
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_world_commodities (world_id),
  INDEX idx_origin_city (origin_city_id)
);

-- Trade Routes
CREATE TABLE IF NOT EXISTS trade_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  from_city_id UUID NOT NULL REFERENCES cities(id),
  to_city_id UUID NOT NULL REFERENCES cities(id),
  commodity_id UUID REFERENCES commodities(id),
  distance INTEGER,
  difficulty_level INTEGER, -- 1-20 (safety/difficulty)
  active BOOLEAN DEFAULT true,
  controlling_faction_id UUID REFERENCES factions(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_world_routes (world_id),
  INDEX idx_from_to (from_city_id, to_city_id)
);

-- Weather System
CREATE TABLE IF NOT EXISTS weather_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  region VARCHAR(255), -- hex region or city name
  hex_x INTEGER,
  hex_y INTEGER,
  current_weather VARCHAR(100), -- clear, rainy, snowy, stormy, etc
  temperature INTEGER,
  wind_speed INTEGER,
  humidity INTEGER,
  precipitation_chance INTEGER,
  anomaly_type VARCHAR(100), -- null or specific freak storm type
  anomaly_severity INTEGER, -- 1-10
  season VARCHAR(50),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_world_weather (world_id),
  INDEX idx_hex_weather (world_id, hex_x, hex_y)
);

-- Ripple Effects / Event Chain
CREATE TABLE IF NOT EXISTS ripple_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world_id UUID NOT NULL REFERENCES worlds(id) ON DELETE CASCADE,
  trigger_event_id UUID REFERENCES historical_events(id),
  trigger_type VARCHAR(100), -- song_created, commodity_demand_rise, etc
  trigger_npc_id UUID REFERENCES npcs(id),
  consequence_type VARCHAR(100), -- new_commodity_demand, trade_route_created, npc_death, etc
  consequence_description TEXT,
  affected_entity_type VARCHAR(100), -- city, faction, npc, commodity
  affected_entity_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_world_ripples (world_id),
  INDEX idx_trigger_event (trigger_event_id)
);

-- Campaign integration
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_world_created ON worlds(created_at DESC);
CREATE INDEX idx_world_campaign ON worlds(campaign_id);
CREATE INDEX idx_city_name ON cities(name);
CREATE INDEX idx_npc_name ON npcs(name);
CREATE INDEX idx_faction_name ON factions(name);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_worlds_updated_at BEFORE UPDATE ON worlds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_npcs_updated_at BEFORE UPDATE ON npcs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
Create TRIGGER update_factions_updated_at BEFORE UPDATE ON factions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
