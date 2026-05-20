import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AvailableOrdersScreen from '../screens/rider/AvailableOrdersScreen';
import MyDeliveriesScreen    from '../screens/rider/MyDeliveriesScreen';
import RiderOrderDetailScreen from '../screens/rider/RiderOrderDetailScreen';
import ProfileScreen         from '../screens/shared/ProfileScreen';
import { COLORS }            from '../constants';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AvailableStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: COLORS.primary }}>
      <Stack.Screen name="AvailableOrders"    component={AvailableOrdersScreen}  options={{ title: 'Available Orders' }} />
      <Stack.Screen name="RiderOrderDetail"   component={RiderOrderDetailScreen} options={{ title: 'Order Detail' }} />
    </Stack.Navigator>
  );
}

function DeliveriesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: COLORS.primary }}>
      <Stack.Screen name="MyDeliveries"     component={MyDeliveriesScreen}     options={{ title: 'My Deliveries' }} />
      <Stack.Screen name="RiderOrderDetail" component={RiderOrderDetailScreen} options={{ title: 'Order Detail' }} />
    </Stack.Navigator>
  );
}

export default function RiderNavigator() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: COLORS.primary, headerShown: false }}>
      <Tab.Screen name="AvailableTab"  component={AvailableStack}  options={{ title: 'Available', tabBarIcon: ({ color, size }) => <Ionicons name="bicycle-outline" size={size} color={color} /> }} />
      <Tab.Screen name="DeliveriesTab" component={DeliveriesStack} options={{ title: 'Mine',      tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} /> }} />
      <Tab.Screen name="ProfileTab"    component={ProfileScreen}   options={{ title: 'Profile',   tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}
