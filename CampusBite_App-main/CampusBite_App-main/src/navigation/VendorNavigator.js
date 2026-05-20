import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import VendorDashboardScreen from '../screens/vendor/VendorDashboardScreen';
import VendorOrdersScreen from '../screens/vendor/VendorOrdersScreen';
import VendorOrderDetailScreen from '../screens/vendor/VendorOrderDetailScreen';
import MenuScreen            from '../screens/vendor/MenuScreen';
import AddMenuItemScreen     from '../screens/vendor/AddMenuItemScreen';
import EditMenuItemScreen    from '../screens/vendor/EditMenuItemScreen';
import VendorProfileScreen   from '../screens/vendor/VendorProfileScreen';
import { COLORS }            from '../constants';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={VendorDashboardScreen} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrdersList"        component={VendorOrdersScreen} />
      <Stack.Screen name="VendorOrderDetail" component={VendorOrderDetailScreen} options={{ headerShown: true, title: 'Order Detail', headerTintColor: COLORS.primary }} />
    </Stack.Navigator>
  );
}

function MenuStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Menu"        component={MenuScreen} />
      <Stack.Screen name="AddMenuItem" component={AddMenuItemScreen} options={{ headerShown: true, title: 'Add Item', headerTintColor: COLORS.primary }} />
      <Stack.Screen name="EditMenuItem" component={EditMenuItemScreen} options={{ headerShown: true, title: 'Edit Item', headerTintColor: COLORS.primary }} />
    </Stack.Navigator>
  );
}

export default function VendorNavigator() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: COLORS.primary, headerShown: false }}>
      <Tab.Screen name="HomeTab"    component={HomeStack}    options={{ title: 'Home',    tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }} />
      <Tab.Screen name="OrdersTab"  component={OrdersStack}  options={{ title: 'Orders',  tabBarIcon: ({ color, size }) => <Ionicons name="clipboard-outline" size={size} color={color} /> }} />
      <Tab.Screen name="MenuTab"    component={MenuStack}    options={{ title: 'Menu',    tabBarIcon: ({ color, size }) => <Ionicons name="restaurant-outline" size={size} color={color} /> }} />
      <Tab.Screen name="ProfileTab" component={VendorProfileScreen} options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}
