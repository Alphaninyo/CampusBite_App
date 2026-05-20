import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AdminStatsScreen   from '../screens/admin/AdminStatsScreen';
import AdminVendorsScreen from '../screens/admin/AdminVendorsScreen';
import AdminOrdersScreen  from '../screens/admin/AdminOrdersScreen';
import AdminUsersScreen   from '../screens/admin/AdminUsersScreen';
import ProfileScreen      from '../screens/shared/ProfileScreen';
import { COLORS }         from '../constants';

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: COLORS.primary }}>
      <Tab.Screen name="Stats"   component={AdminStatsScreen}   options={{ title: 'Stats',   tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Vendors" component={AdminVendorsScreen} options={{ title: 'Vendors', tabBarIcon: ({ color, size }) => <Ionicons name="storefront-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Orders"  component={AdminOrdersScreen}  options={{ title: 'Orders',  tabBarIcon: ({ color, size }) => <Ionicons name="clipboard-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Users"   component={AdminUsersScreen}   options={{ title: 'Users',   tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen}      options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}
