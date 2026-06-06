# ⛵ Severn River GPS App

A full-featured boat tracking and navigation application for the Severn River in Maryland. Track your trips, avoid hazards, find marinas, and navigate safely.

## Features

### Navigation & Mapping
- Real-time GPS tracking with interactive map
- Severn River navigation channel mapping
- Route recording and trip history
- Leaflet-based web map with custom markers

### Safety Features
- ⚠️ **Hazard Mapping**: Rocks, shallow water, wrecks, cables
- 🪵 **Buoy Markers**: Navigation aids (red/green buoys)
- 🔒 **Lock Information**: Severn River lock details and hours
- 📊 **Severity Levels**: High, medium, low hazard classification

### Trip Management
- Start/end trip tracking
- Store boat name and trip data
- Trip history with timestamps
- Location logging with speed and heading

### Amenities
- 🛟 **Marina Locations**: Full fuel, pump-out, repair services
- ⛽ **Fuel Docks**: Nearby refueling stations
- 🛠️ **Repair Services**: Listed at major marinas

## Project Structure

```
/web                    # React web app
├── components/         # UI components
│   ├── SevernMap.jsx  # Interactive map
│   ├── NavigationBar.jsx
│   └── TripPanel.jsx
├── styles/            # CSS files
└── App.jsx           # Main app

/mobile                # React Native Expo app
├── screens/          # Tab-based navigation
│   ├── MapScreen.js      # Map with tracking
│   ├── TripScreen.js     # Trip management
│   ├── HazardsScreen.js  # Hazard viewer
│   └── SettingsScreen.js
├── utils/            # Storage & helpers
└── App.js

/api
├── gps.js            # GPS API routes
└── index.js          # Express server

/data
└── severn-river.json # River data (hazards, marinas, buoys, locks)
```

## API Endpoints

### River Data
- `GET /api/gps/river-data` - Complete river data
- `GET /api/gps/hazards` - Filter hazards by bounds
- `GET /api/gps/marinas` - Marina locations
- `GET /api/gps/buoys` - Navigation buoys
- `GET /api/gps/locks` - Lock information

### Trip Management
- `POST /api/gps/trip` - Start new trip
- `PATCH /api/gps/trip/:tripId/end` - End trip
- `POST /api/gps/track-location` - Log GPS position
- `GET /api/gps/trip/:tripId/locations` - Get trip path
- `GET /api/gps/user/:userId/trips` - User trip history

## Installation

### Web App
```bash
npm install
npm run dev
# Visit http://localhost:3000
```

### Mobile App (Expo)
```bash
cd mobile
npx expo start
# Scan QR code with Expo Go app
```

## Database Setup

The app uses Supabase for persistent storage. Required tables:

```sql
-- Trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  boat_name TEXT NOT NULL,
  start_location TEXT,
  end_location TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Location tracking
CREATE TABLE location_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  trip_id UUID REFERENCES trips(id),
  latitude DECIMAL NOT NULL,
  longitude DECIMAL NOT NULL,
  speed DECIMAL,
  heading DECIMAL,
  accuracy DECIMAL,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## Environment Variables

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
```

## Severn River Data

### Hazards
Located throughout the river with severity levels:
- **High**: Rocks, wrecks (avoid or very cautious)
- **Medium**: Shallow areas, cables
- **Low**: Minor shallow bars

### Locks
- Severn River Lock with operational hours
- Lockage time: ~30 minutes
- Restrictions on vessel size

### Marinas
- Annapolis Yacht Club
- Severn Sailing Association
- Eastport Yacht Club

### Navigation
- Main channel with depth and width info
- Buoy system for navigation
- Coordinate reference points

## Usage

### Web App
1. Click "Start New Trip"
2. Enter boat name
3. GPS tracking begins automatically
4. View hazards, marinas, buoys on map
5. Click "End Trip" to finish

### Mobile App
1. Tap "Map" to see live location
2. "Trip" tab to manage trips
3. "Hazards" tab to view dangers
4. "Settings" for preferences

## Safety Notes

⚠️ **Always verify chart information independently**
- Don't rely solely on this app for navigation
- Check local weather and conditions
- Consult official NOAA charts
- Contact authorities for emergency

## Features Roadmap

- [ ] Weather integration
- [ ] Tide predictions
- [ ] Offline map caching
- [ ] AIS vessel tracking
- [ ] Speed/fuel consumption analytics
- [ ] Emergency position sharing
- [ ] VHF radio frequency guide
- [ ] User-reported hazards

## License

Internal use only - Boat tracking for Severn River Maryland

## Support

For issues or suggestions:
- Check river conditions at local NOAA office
- Contact Annapolis sailing community
- Emergency: Contact Coast Guard on VHF 16
