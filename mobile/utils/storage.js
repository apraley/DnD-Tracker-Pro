import AsyncStorage from '@react-native-async-storage/async-storage';

export const getUserId = async () => {
  try {
    let userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      userId = `user_${Date.now()}`;
      await AsyncStorage.setItem('userId', userId);
    }
    return userId;
  } catch (error) {
    console.error('Failed to get user ID:', error);
    return `user_${Date.now()}`;
  }
};

export const saveTrip = async (trip) => {
  try {
    const trips = await getTrips();
    await AsyncStorage.setItem('trips', JSON.stringify([trip, ...trips]));
  } catch (error) {
    console.error('Failed to save trip:', error);
  }
};

export const getTrips = async () => {
  try {
    const trips = await AsyncStorage.getItem('trips');
    return trips ? JSON.parse(trips) : [];
  } catch (error) {
    console.error('Failed to get trips:', error);
    return [];
  }
};

export const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem('settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

export const getSettings = async () => {
  try {
    const settings = await AsyncStorage.getItem('settings');
    return settings ? JSON.parse(settings) : { trackingEnabled: true, hazardAlerts: true };
  } catch (error) {
    console.error('Failed to get settings:', error);
    return { trackingEnabled: true, hazardAlerts: true };
  }
};
