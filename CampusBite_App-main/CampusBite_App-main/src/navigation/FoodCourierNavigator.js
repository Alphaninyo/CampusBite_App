import React, { useState, useEffect, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { api }                     from '../api';

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
  const insets = useSafeAreaInsets();
  const [availableCount,  setAvailableCount]  = useState(0);
  const [deliveryCount,   setDeliveryCount]   = useState(0);

  const fetchCounts = useCallback(async () => {
    try {
      const [avRes, myRes] = await Promise.all([
        api.orders.getAvailableForFoodCourier(),
        api.orders.getFoodCourierOrders(),
      ]);
      const available = avRes.data?.orders ?? (Array.isArray(avRes.data) ? avRes.data : []);
      const mine      = myRes.data?.orders ?? (Array.isArray(myRes.data) ? myRes.data : []);
      setAvailableCount(available.length);
      setDeliveryCount(mine.filter(o => ['Collected', 'In Transit'].includes(o.status)).length);
    } catch {
      // silently ignore — badges just won't show
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  const badgeStyle     = { backgroundColor: COLORS.danger, fontSize: 10, fontWeight: '700', minWidth: 18, height: 18, borderRadius: 9 };
  const availableBadge = availableCount > 0 ? (availableCount > 99 ? '99+' : availableCount) : undefined;
  const deliveryBadge  = deliveryCount  > 0 ? (deliveryCount  > 99 ? '99+' : deliveryCount)  : undefined;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown:              false,
        tabBarShowLabel:          true,
        tabBarActiveTintColor:    COLORS.primary,
        tabBarInactiveTintColor:  COLORS.gray,
        tabBarStyle:              [styles.tabBar, { height: 64 + (insets.bottom || 12), paddingBottom: insets.bottom || 0 }],
        tabBarLabelStyle:         styles.tabLabel,
        tabBarItemStyle:          styles.tabItem,
      }}
    >
      <Tab.Screen
        name="AvailableTab"
        component={AvailableStack}
        listeners={{ tabPress: () => fetchCounts() }}
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => <Ionicons name="bicycle-outline" size={size} color={color} />,
          tabBarBadge: availableBadge,
          tabBarBadgeStyle: badgeStyle,
        }}
      />
      <Tab.Screen
        name="DeliveriesTab"
        component={EarningsStack}
        listeners={{ tabPress: () => fetchCounts() }}
        options={{
          title: 'Earnings',
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet-outline" size={size} color={color} />,
          tabBarBadge: deliveryBadge,
          tabBarBadgeStyle: badgeStyle,
        }}
      />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor:  COLORS.white,
    borderTopColor:   COLORS.borderWarm,
    borderTopWidth:   1,
    elevation:        12,
    shadowColor:      '#000',
    shadowOffset:     { width: 0, height: -2 },
    shadowOpacity:    0.06,
    shadowRadius:     8,
  },
  tabLabel: {
    fontSize:   11,
    fontWeight: '500',
    marginBottom: 4,
  },
  tabItem: {
    paddingVertical: 4,
  },
});
