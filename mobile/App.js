import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';

import MapScreen from './screens/MapScreen';
import TripScreen from './screens/TripScreen';
import HazardsScreen from './screens/HazardsScreen';
import SettingsScreen from './screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);

  useEffect(() => {
    const userId = require('./utils/storage').getUserId();
    setCurrentUser(userId);
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a3a52" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ focused, color, size }) => {
              let iconName;

              if (route.name === 'Map') {
                iconName = focused ? 'map' : 'map-outline';
              } else if (route.name === 'Trip') {
                iconName = focused ? 'navigate' : 'navigate-outline';
              } else if (route.name === 'Hazards') {
                iconName = focused ? 'alert-circle' : 'alert-circle-outline';
              } else if (route.name === 'Settings') {
                iconName = focused ? 'settings' : 'settings-outline';
              }

              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#4caf50',
            tabBarInactiveTintColor: '#999',
            headerShown: true,
            headerStyle: {
              backgroundColor: '#1a3a52'
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: '600'
            }
          })}
        >
          <Tab.Screen
            name="Map"
            component={MapScreen}
            initialParams={{ activeTrip, setActiveTrip, currentUser }}
            options={{
              title: '⛵ Severn River GPS',
              headerTitleAlign: 'center'
            }}
          />
          <Tab.Screen
            name="Trip"
            component={TripScreen}
            initialParams={{ activeTrip, setActiveTrip, currentUser }}
            options={{ title: 'My Trips' }}
          />
          <Tab.Screen
            name="Hazards"
            component={HazardsScreen}
            options={{ title: 'River Hazards' }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: 'Settings' }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}
