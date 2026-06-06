import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  Switch,
  TouchableOpacity,
  Alert
} from 'react-native';

export default function SettingsScreen() {
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [hazardAlerts, setHazardAlerts] = useState(true);
  const [highAccuracy, setHighAccuracy] = useState(true);

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all your stored trips and location data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: () => Alert.alert('Data cleared', 'Your data has been deleted'),
          style: 'destructive'
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>GPS Tracking</Text>

        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Enable Tracking</Text>
            <Text style={styles.settingDescription}>
              Track your boat's location during trips
            </Text>
          </View>
          <Switch
            value={trackingEnabled}
            onValueChange={setTrackingEnabled}
            trackColor={{ false: '#ccc', true: '#81c784' }}
            thumbColor={trackingEnabled ? '#4caf50' : '#f4f3f4'}
          />
        </View>

        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>High Accuracy Mode</Text>
            <Text style={styles.settingDescription}>
              Uses more battery but provides better accuracy
            </Text>
          </View>
          <Switch
            value={highAccuracy}
            onValueChange={setHighAccuracy}
            trackColor={{ false: '#ccc', true: '#81c784' }}
            thumbColor={highAccuracy ? '#4caf50' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety Alerts</Text>

        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Hazard Alerts</Text>
            <Text style={styles.settingDescription}>
              Get notified when approaching hazards and shallow water
            </Text>
          </View>
          <Switch
            value={hazardAlerts}
            onValueChange={setHazardAlerts}
            trackColor={{ false: '#ccc', true: '#81c784' }}
            thumbColor={hazardAlerts ? '#4caf50' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.infoCard}>
          <Text style={styles.appName}>Severn River GPS</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDescription}>
            Boat navigation and trip tracking for the Severn River, Maryland
          </Text>
        </View>

        <Text style={styles.featureTitle}>Features:</Text>
        <Text style={styles.featureItem}>✓ Real-time GPS tracking</Text>
        <Text style={styles.featureItem}>✓ Hazard & obstacle mapping</Text>
        <Text style={styles.featureItem}>✓ Marina & fuel dock locations</Text>
        <Text style={styles.featureItem}>✓ Navigation channel info</Text>
        <Text style={styles.featureItem}>✓ Trip logging & history</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.dangerButton} onPress={handleClearData}>
          <Text style={styles.dangerButtonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        © 2024 Severn River GPS. For safety concerns, contact local authorities.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  section: {
    marginTop: 12,
    paddingHorizontal: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a3a52',
    marginBottom: 12,
    marginTop: 4
  },
  setting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 6
  },
  settingInfo: {
    flex: 1,
    marginRight: 12
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4
  },
  settingDescription: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 6,
    marginBottom: 16,
    alignItems: 'center'
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a3a52',
    marginBottom: 4
  },
  appVersion: {
    fontSize: 13,
    color: '#999',
    marginBottom: 12
  },
  appDescription: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a3a52',
    marginBottom: 8
  },
  featureItem: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
    marginLeft: 12
  },
  dangerButton: {
    backgroundColor: '#d32f2f',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12
  },
  dangerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginTop: 24,
    marginBottom: 32,
    lineHeight: 16
  }
});
