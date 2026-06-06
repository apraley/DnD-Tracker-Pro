import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Button, Alert, Text, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';

export default function MapScreen({ route }) {
  const { activeTrip, setActiveTrip, currentUser } = route.params || {};
  const [location, setLocation] = useState(null);
  const [locations, setLocations] = useState([]);
  const [hazards, setHazards] = useState([]);
  const [marinas, setMarinas] = useState([]);
  const [buoys, setBuoys] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const locationWatchId = useRef(null);

  const severnMapRegion = {
    latitude: 38.95,
    longitude: -76.47,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05
  };

  useEffect(() => {
    const requestPermissions = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location access is required');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      setLocation(currentLocation.coords);
      setLoading(false);
    };

    requestPermissions();
  }, []);

  useEffect(() => {
    const fetchRiverData = async () => {
      try {
        const [hazardRes, marinaRes, buoyRes] = await Promise.all([
          fetch('/api/gps/hazards'),
          fetch('/api/gps/marinas'),
          fetch('/api/gps/buoys')
        ]);

        setHazards(await hazardRes.json());
        setMarinas(await marinaRes.json());
        setBuoys(await buoyRes.json());
      } catch (error) {
        console.error('Failed to fetch river data:', error);
      }
    };

    fetchRiverData();
  }, []);

  useEffect(() => {
    if (!activeTrip) return;

    const startTracking = async () => {
      locationWatchId.current = Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10
        },
        async (position) => {
          const { latitude, longitude, accuracy, speed, heading } = position.coords;
          setLocation({ latitude, longitude, accuracy });
          setLocations(prev => [...prev, { latitude, longitude }]);

          await fetch('/api/gps/track-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser,
              latitude,
              longitude,
              speed: speed || 0,
              heading: heading || 0,
              accuracy
            })
          }).catch(err => console.error('Tracking error:', err));
        }
      );
    };

    startTracking();

    return () => {
      if (locationWatchId.current) {
        locationWatchId.current.then(subscription => subscription.remove());
      }
    };
  }, [activeTrip, currentUser]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4caf50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={severnMapRegion}
      >
        {location && (
          <Marker
            coordinate={{ latitude: location.latitude, longitude: location.longitude }}
            title="Your Position"
            pinColor="blue"
          />
        )}

        {hazards.map(hazard => (
          <Marker
            key={hazard.id}
            coordinate={{
              latitude: hazard.latitude,
              longitude: hazard.longitude
            }}
            title={hazard.name}
            description={`Type: ${hazard.type}`}
            pinColor="red"
          />
        ))}

        {marinas.map(marina => (
          <Marker
            key={marina.id}
            coordinate={{
              latitude: marina.latitude,
              longitude: marina.longitude
            }}
            title={marina.name}
            description="Marina"
            pinColor="green"
          />
        ))}

        {buoys.map(buoy => (
          <Marker
            key={buoy.id}
            coordinate={{
              latitude: buoy.latitude,
              longitude: buoy.longitude
            }}
            title={buoy.name}
            pinColor={buoy.color === 'red' ? 'red' : 'blue'}
          />
        ))}

        {locations.length > 1 && (
          <Polyline
            coordinates={locations}
            strokeColor="#4caf50"
            strokeWidth={3}
          />
        )}
      </MapView>

      <View style={styles.controls}>
        {activeTrip ? (
          <Button
            title="End Trip"
            onPress={() => setActiveTrip(null)}
            color="#d32f2f"
          />
        ) : (
          <Button
            title="Start Trip"
            onPress={() => setActiveTrip({ id: Date.now(), boat_name: 'My Boat' })}
            color="#4caf50"
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  map: {
    flex: 1
  },
  controls: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  }
});
