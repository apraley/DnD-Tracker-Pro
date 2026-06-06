import React, { useState, useEffect } from 'react';
import SevernMap from './components/SevernMap';
import TripPanel from './components/TripPanel';
import NavigationBar from './components/NavigationBar';
import './styles/App.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [showTripPanel, setShowTripPanel] = useState(false);
  const [trips, setTrips] = useState([]);

  useEffect(() => {
    const userId = localStorage.getItem('userId') || 'demo-user';
    setCurrentUser(userId);
  }, []);

  const handleStartTrip = async (boatName) => {
    const response = await fetch('/api/gps/trip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser,
        boatName,
        startLocation: 'Severn River, Maryland'
      })
    });

    const { trip } = await response.json();
    setActiveTrip(trip);
    setShowTripPanel(false);
  };

  const handleEndTrip = async () => {
    if (!activeTrip) return;

    const response = await fetch(`/api/gps/trip/${activeTrip.id}/end`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endLocation: 'Severn River, Maryland'
      })
    });

    const { trip } = await response.json();
    setTrips([trip, ...trips]);
    setActiveTrip(null);
  };

  return (
    <div className="app">
      <NavigationBar
        activeTrip={activeTrip}
        onNewTrip={() => setShowTripPanel(true)}
        onEndTrip={handleEndTrip}
      />

      <div className="main-content">
        <SevernMap activeTrip={activeTrip} currentUser={currentUser} />

        {showTripPanel && (
          <TripPanel
            onStartTrip={handleStartTrip}
            onClose={() => setShowTripPanel(false)}
          />
        )}
      </div>
    </div>
  );
}
