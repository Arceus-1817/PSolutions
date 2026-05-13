import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import LedgerScreen from './src/screens/LedgerScreen';
import { initDB } from './src/database';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 🚨 The New Bottom Tab Bar
function AgentTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: '#111318', borderTopColor: '#1e2530', height: 65, paddingBottom: 10 },
        tabBarActiveTintColor: '#00ff88',
        tabBarInactiveTintColor: '#4a5568',
        tabBarIcon: ({ color, size }) => {
          let iconName = route.name === 'Route' ? 'map' : 'wallet';
          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Route" component={HomeScreen} />
      <Tab.Screen name="Ledger" component={LedgerScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    initDB();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        {/* We replace "Home" with our new Tabs! */}
        <Stack.Screen name="Home" component={AgentTabs} /> 
      </Stack.Navigator>
    </NavigationContainer>
  );
}