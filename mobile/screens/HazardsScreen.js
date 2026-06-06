import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  ActivityIndicator,
  FlatList
} from 'react-native';

export default function HazardsScreen() {
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchHazards();
  }, []);

  const fetchHazards = async () => {
    try {
      const response = await fetch('/api/gps/hazards');
      const data = await response.json();
      setHazards(data);
    } catch (error) {
      console.error('Failed to fetch hazards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return '#d32f2f';
      case 'medium':
        return '#ff6f00';
      default:
        return '#fbc02d';
    }
  };

  const getHazardIcon = (type) => {
    switch (type) {
      case 'rocks':
        return '🪨';
      case 'shallow':
        return '⚠️';
      case 'wreck':
        return '⛵';
      case 'cable':
        return '⚡';
      default:
        return '❌';
    }
  };

  const filtered = filter === 'all' ? hazards : hazards.filter(h => h.severity === filter);

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {['all', 'high', 'medium', 'low'].map(level => (
          <Text
            key={level}
            style={[
              styles.filterTab,
              filter === level && styles.filterTabActive
            ]}
            onPress={() => setFilter(level)}
          >
            {level.toUpperCase()}
          </Text>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4caf50" style={styles.loader} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.hazardCard}>
              <View style={styles.hazardHeader}>
                <Text style={styles.hazardIcon}>{getHazardIcon(item.type)}</Text>
                <View style={styles.hazardInfo}>
                  <Text style={styles.hazardName}>{item.name}</Text>
                  <Text style={styles.hazardType}>{item.type}</Text>
                </View>
                <View
                  style={[
                    styles.severityBadge,
                    { backgroundColor: getSeverityColor(item.severity) }
                  ]}
                >
                  <Text style={styles.severityText}>{item.severity}</Text>
                </View>
              </View>

              <Text style={styles.hazardDescription}>{item.description}</Text>

              <View style={styles.hazardDetails}>
                <Text style={styles.detail}>📍 {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}</Text>
                <Text style={styles.detail}>📏 Depth: {item.depth_feet} ft</Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#1a3a52',
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 8
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    textAlign: 'center',
    borderRadius: 4,
    color: '#ccc',
    fontSize: 12,
    fontWeight: '600'
  },
  filterTabActive: {
    backgroundColor: '#4caf50',
    color: 'white'
  },
  list: {
    padding: 12,
    paddingBottom: 24
  },
  hazardCard: {
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
  hazardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12
  },
  hazardIcon: {
    fontSize: 32
  },
  hazardInfo: {
    flex: 1
  },
  hazardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a3a52',
    marginBottom: 2
  },
  hazardType: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize'
  },
  severityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    minWidth: 60,
    alignItems: 'center'
  },
  severityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  hazardDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12
  },
  hazardDetails: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    gap: 8
  },
  detail: {
    fontSize: 13,
    color: '#666'
  },
  loader: {
    flex: 1,
    justifyContent: 'center'
  }
});
