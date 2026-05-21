import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import AvailableOrdersScreen       from '../screens/foodCourier/AvailableOrdersScreen';
import MyDeliveriesScreen          from '../screens/foodCourier/MyDeliveriesScreen';
import FoodCourierOrderDetailScreen from '../screens/foodCourier/RiderOrderDetailScreen';
import FoodCourierProfileScreen    from '../screens/foodCourier/FoodCourierProfileScreen';
import NotificationsScreen         from '../screens/foodCourier/NotificationsScreen';
import EditProfileScreen           from '../screens/foodCourier/EditProfileScreen';
import SupportScreen               from '../screens/foodCourier/SupportScreen';
import CustomerFeedbackScreen       from '../screens/foodCourier/CustomerFeedbackScreen';
import AppSettingsScreen           from '../screens/foodCourier/AppSettingsScreen';
import { COLORS }                  from '../constants';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function AvailableStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: COLORS.primary }}>
      <Stack.Screen name="AvailableOrders"      component={AvailableOrdersScreen}       options={{ headerShown: false }} />
      <Stack.Screen name="FoodCourierOrderDetail" component={FoodCourierOrderDetailScreen} options={{ title: 'Order Detail' }} />
      <Stack.Screen name="Notifications"        component={NotificationsScreen}        options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function EarningsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: COLORS.primary }}>
      <Stack.Screen name="MyDeliveries"           component={MyDeliveriesScreen}          options={{ headerShown: false }} />
      <Stack.Screen name="FoodCourierOrderDetail" component={FoodCourierOrderDetailScreen} options={{ title: 'Order Detail' }} />
      <Stack.Screen name="Notifications"         component={NotificationsScreen}        options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="FoodCourierProfile" component={FoodCourierProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications"       component={NotificationsScreen}       options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile"        component={EditProfileScreen}        options={{ headerShown: false }} />
      <Stack.Screen name="Support"            component={SupportScreen}            options={{ headerShown: false }} />
      <Stack.Screen name="CustomerFeedback"   component={CustomerFeedbackScreen}   options={{ headerShown: false }} />
      <Stack.Screen name="AppSettings"        component={AppSettingsScreen}        options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

export default function FoodCourierNavigator() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: COLORS.primary, headerShown: false }}>
      <Tab.Screen name="AvailableTab"  component={AvailableStack} options={{ title: 'Tasks',    tabBarIcon: ({ color, size }) => <Ionicons name="bicycle-outline" size={size} color={color} /> }} />
      <Tab.Screen name="DeliveriesTab" component={EarningsStack}  options={{ title: 'Earnings', tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" size={size} color={color} /> }} />
      <Tab.Screen name="ProfileTab"    component={ProfileStack}   options={{ title: 'Profile',  tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}
