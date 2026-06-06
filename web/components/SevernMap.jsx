import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import '../styles/Map.css';

const MapContent = ({ activeTrip, currentUser, hazards, marinas, buoys, locks, locations }) => {
  const map = useMap();

  useEffect(() => {
    if (activeTrip && locations.length > 0) {
      const lastLocation = locations[locations.length - 1];
      map.flyTo([lastLocation.latitude, lastLocation.longitude], 14);
    }
  }, [locations, map, activeTrip]);

  return (
    <>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {hazards.map(hazard => (
        <Marker
          key={hazard.id}
          position={[hazard.latitude, hazard.longitude]}
          icon={createHazardIcon(hazard.type)}
        >
          <Popup>
            <div className="popup-content">
              <h4>{hazard.name}</h4>
              <p>Type: {hazard.type}</p>
              <p>Depth: {hazard.depth_feet} ft</p>
              <p>Severity: {hazard.severity}</p>
              <p>{hazard.description}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {marinas.map(marina => (
        <Marker
          key={marina.id}
          position={[marina.latitude, marina.longitude]}
          icon={createMarinaIcon()}
        >
          <Popup>
            <div className="popup-content">
              <h4>{marina.name}</h4>
              <p>Services: {marina.services.join(', ')}</p>
              <p>Capacity: {marina.capacity} boats</p>
              <p>Contact: {marina.contact}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {buoys.map(buoy => (
        <Marker
          key={buoy.id}
          position={[buoy.latitude, buoy.longitude]}
          icon={createBuoyIcon(buoy.color)}
        >
          <Popup>
            <div className="popup-content">
              <h4>{buoy.name}</h4>
              <p>Type: {buoy.type}</p>
              <p>Number: {buoy.number}</p>
              <p>{buoy.description}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {locks.map(lock => (
        <Marker
          key={lock.id}
          position={[lock.latitude, lock.longitude]}
          icon={createLockIcon()}
        >
          <Popup>
            <div className="popup-content">
              <h4>{lock.name}</h4>
              <p>Status: {lock.status}</p>
              <p>Hours: {lock.hours}</p>
              <p>Lockage Time: {lock.lockage_time_minutes} min</p>
              <p>Contact: {lock.contact}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {activeTrip && locations.length > 0 && (
        <>
          <Polyline
            positions={locations.map(loc => [loc.latitude, loc.longitude])}
            color="blue"
            weight={3}
          />
          <Marker position={[locations[locations.length - 1].latitude, locations[locations.length - 1].longitude]}>
            <Popup>Current Position</Popup>
          </Marker>
        </>
      )}
    </>
  );
};

function createHazardIcon(type) {
  const colors = {
    rocks: '#d32f2f',
    shallow: '#ff6f00',
    wreck: '#7b1fa2',
    cable: '#1976d2'
  };
  return L.divIcon({
    className: 'hazard-icon',
    html: `<div style="background-color: ${colors[type] || '#000'}; border-radius: 50%; width: 20px; height: 20px; border: 2px solid white;"></div>`,
    iconSize: [24, 24]
  });
}

function createMarinaIcon() {
  return L.divIcon({
    className: 'marina-icon',
    html: '<div style="background-color: #4caf50; border-radius: 50%; width: 20px; height: 20px; border: 2px solid white;"></div>',
    iconSize: [24, 24]
  });
}

function createBuoyIcon(color) {
  const bgColor = color === 'red' ? '#d32f2f' : '#1976d2';
  return L.divIcon({
    className: 'buoy-icon',
    html: `<div style="background-color: ${bgColor}; border-radius: 50%; width: 16px; height: 16px; border: 2px solid white;"></div>`,
    iconSize: [20, 20]
  });
}

function createLockIcon() {
  return L.divIcon({
    className: 'lock-icon',
    html: '<div style="background-color: #9c27b0; border-radius: 50%; width: 18px; height: 18px; border: 2px solid white;"></div>',
    iconSize: [22, 22]
  });
}

export default function SevernMap({ activeTrip, currentUser }) {
  const [hazards, setHazards] = useState([]);
  const [marinas, setMarinas] = useState([]);
  const [buoys, setBuoys] = useState([]);
  const [locks, setLocks] = useState([]);
  const [locations, setLocations] = useState([]);
  const locationWatchId = useRef(null);

  useEffect(() => {
    const fetchRiverData = async () => {
      const [hazardRes, marinaRes, buoyRes, lockRes] = await Promise.all([
        fetch('/api/gps/hazards'),
        fetch('/api/gps/marinas'),
        fetch('/api/gps/buoys'),
        fetch('/api/gps/locks')
      ]);

      setHazards(await hazardRes.json());
      setMarinas(await marinaRes.json());
      setBuoys(await buoyRes.json());
      setLocks(await lockRes.json());
    };

    fetchRiverData();
  }, []);

  useEffect(() => {
    if (!activeTrip) return;

    if ('geolocation' in navigator) {
      const startTracking = () => {
        locationWatchId.current = navigator.geolocation.watchPosition(
          async (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            const speed = position.coords.speed || 0;
            const heading = position.coords.heading || 0;

            await fetch('/api/gps/track-location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: currentUser,
                latitude,
                longitude,
                speed,
                heading,
                accuracy
              })
            });

            setLocations(prev => [...prev, { latitude, longitude, speed, heading, accuracy }]);
          },
          (error) => console.error('GPS error:', error),
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
        );
      };

      startTracking();
    }

    return () => {
      if (locationWatchId.current !== null) {
        navigator.geolocation.clearWatch(locationWatchId.current);
      }
    };
  }, [activeTrip, currentUser]);

  return (
    <MapContainer center={[38.95, -76.47]} zoom={14} className="map-container">
      <MapContent
        activeTrip={activeTrip}
        currentUser={currentUser}
        hazards={hazards}
        marinas={marinas}
        buoys={buoys}
        locks={locks}
        locations={locations}
      />
    </MapContainer>
  );
}
