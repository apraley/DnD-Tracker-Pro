import React from 'react';
import '../styles/NavigationBar.css';

export default function NavigationBar({ activeTrip, onNewTrip, onEndTrip }) {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-title">
          <h1>⛵ Severn River GPS Tracker</h1>
        </div>

        <div className="navbar-content">
          {activeTrip ? (
            <div className="trip-info">
              <span className="trip-status">🔴 TRACKING: {activeTrip.boat_name}</span>
              <button className="btn btn-danger" onClick={onEndTrip}>
                End Trip
              </button>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={onNewTrip}>
              + Start New Trip
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
