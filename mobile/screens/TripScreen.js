import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator
} from 'react-native';

export default function TripScreen({ route }) {
  const { activeTrip, setActiveTrip, currentUser } = route.params || {};
  const [trips, setTrips] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [boatName, setBoatName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, []);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/gps/user/${currentUser}/trips`);
      const data = await response.json();
      setTrips(data);
    } catch (error) {
      console.error('Failed to fetch trips:', error);
      Alert.alert('Error', 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrip = async () => {
    if (!boatName.trim()) {
      Alert.alert('Error', 'Please enter a boat name');
      return;
    }

    try {
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
      setBoatName('');
      setShowForm(false);
      setTrips([trip, ...trips]);
    } catch (error) {
      Alert.alert('Error', 'Failed to start trip');
    }
  };

  const handleEndTrip = async () => {
    if (!activeTrip) return;

    try {
      const response = await fetch(`/api/gps/trip/${activeTrip.id}/end`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endLocation: 'Severn River, Maryland'
        })
      });

      const { trip } = await response.json();
      setActiveTrip(null);
      setTrips([trip, ...trips.filter(t => t.id !== activeTrip.id)]);
    } catch (error) {
      Alert.alert('Error', 'Failed to end trip');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {activeTrip ? (
          <View style={styles.activeTripInfo}>
            <Text style={styles.activeTrip}>🔴 TRACKING: {activeTrip.boat_name}</Text>
            <TouchableOpacity
              style={[styles.button, styles.endTripBtn]}
              onPress={handleEndTrip}
            >
              <Text style={styles.buttonText}>End Trip</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.newTripBtn]}
            onPress={() => setShowForm(!showForm)}
          >
            <Text style={styles.buttonText}>+ Start New Trip</Text>
          </TouchableOpacity>
        )}
      </View>

      {showForm && (
        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter boat name"
            value={boatName}
            onChangeText={setBoatName}
            placeholderTextColor="#999"
          />
          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.button, styles.submitBtn]}
              onPress={handleStartTrip}
            >
              <Text style={styles.buttonText}>Start</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.cancelBtn]}
              onPress={() => {
                setShowForm(false);
                setBoatName('');
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#4caf50" style={styles.loader} />
      ) : (
        <ScrollView style={styles.tripsList}>
          {trips.length === 0 ? (
            <Text style={styles.emptyText}>No trips yet. Start one to get going!</Text>
          ) : (
            trips.map(trip => (
              <View key={trip.id} style={styles.tripCard}>
                <Text style={styles.tripName}>{trip.boat_name}</Text>
                <Text style={styles.tripDate}>
                  {new Date(trip.started_at).toLocaleDateString()}
                </Text>
                {trip.ended_at && (
                  <Text style={styles.tripStatus}>✓ Completed</Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: '#1a3a52',
    padding: 16,
    paddingTop: 12
  },
  activeTripInfo: {
    gap: 12
  },
  activeTrip: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500'
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center'
  },
  newTripBtn: {
    backgroundColor: '#4caf50'
  },
  endTripBtn: {
    backgroundColor: '#d32f2f'
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
    color: '#333'
  },
  formButtons: {
    flexDirection: 'row',
    gap: 8
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#4caf50'
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#999'
  },
  tripsList: {
    flex: 1,
    padding: 12
  },
  tripCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  tripName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a3a52',
    marginBottom: 4
  },
  tripDate: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8
  },
  tripStatus: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: '500'
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 32
  },
  loader: {
    flex: 1,
    justifyContent: 'center'
  }
});
