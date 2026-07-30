import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import VendorDashboardScreen       from '../screens/vendor/VendorDashboardScreen';
import VendorNotificationsScreen   from '../screens/vendor/VendorNotificationsScreen';
import VendorOrdersScreen from '../screens/vendor/VendorOrdersScreen';
import VendorOrderDetailScreen from '../screens/vendor/VendorOrderDetailScreen';
import MenuScreen            from '../screens/vendor/MenuScreen';
import AddMenuItemScreen     from '../screens/vendor/AddMenuItemScreen';
import EditMenuItemScreen    from '../screens/vendor/EditMenuItemScreen';
import VendorProfileScreen      from '../screens/vendor/VendorProfileScreen';
import VendorSettingsScreen     from '../screens/vendor/VendorSettingsScreen';
import VendorPromoCodesScreen  from '../screens/vendor/VendorPromoCodesScreen';
import { useTheme }            from '../contexts/ThemeContext';
import { api }                 from '../api';

const ACTIVE_VENDOR_STATUSES = ['Received', 'Preparing', 'Ready'];

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const stackScreenOptions = (COLORS) => ({
  headerTintColor: COLORS.primary,
  headerStyle:      { backgroundColor: COLORS.card },
  headerTitleStyle: { color: COLORS.text },
});

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard"             component={VendorDashboardScreen} />
      <Stack.Screen name="VendorNotifications"   component={VendorNotificationsScreen} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  const { colors: COLORS } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrdersList"        component={VendorOrdersScreen} />
      <Stack.Screen name="VendorOrderDetail" component={VendorOrderDetailScreen} options={{ headerShown: true, title: 'Order Detail', ...stackScreenOptions(COLORS) }} />
    </Stack.Navigator>
  );
}

function MenuStack() {
  const { colors: COLORS } = useTheme();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Menu"             component={MenuScreen} />
      <Stack.Screen name="AddMenuItem"      component={AddMenuItemScreen}     options={{ headerShown: true, title: 'Add Item',    ...stackScreenOptions(COLORS) }} />
      <Stack.Screen name="EditMenuItem"     component={EditMenuItemScreen}    options={{ headerShown: true, title: 'Edit Item',   ...stackScreenOptions(COLORS) }} />
      <Stack.Screen name="PromoCodes"       component={VendorPromoCodesScreen} options={{ headerShown: true, title: 'Promo Codes', ...stackScreenOptions(COLORS) }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VendorProfile"   component={VendorProfileScreen} />
      <Stack.Screen name="VendorSettings"  component={VendorSettingsScreen} />
    </Stack.Navigator>
  );
}

export default function VendorNavigator() {
  const { colors: COLORS } = useTheme();
  const styles = useMemo(() => makeStyles(COLORS), [COLORS]);
  const insets = useSafeAreaInsets();
  const [orderCount, setOrderCount] = useState(0);

  const fetchOrderCount = useCallback(async () => {
    try {
      const res    = await api.orders.getVendorOrders();
      const orders = res.data?.orders ?? (Array.isArray(res.data) ? res.data : []);
      setOrderCount(orders.filter(o => ACTIVE_VENDOR_STATUSES.includes(o.status)).length);
    } catch {
      // silently ignore — badge just won't show
    }
  }, []);

  useEffect(() => {
    fetchOrderCount();
    const interval = setInterval(fetchOrderCount, 30000);
    return () => clearInterval(interval);
  }, [fetchOrderCount]);

  const orderBadge = orderCount > 0 ? (orderCount > 99 ? '99+' : orderCount) : undefined;
  const badgeStyle = { backgroundColor: COLORS.danger, fontSize: 10, fontWeight: '700', minWidth: 18, height: 18, borderRadius: 9 };

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
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: 'Home', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }} />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersStack}
        listeners={{ tabPress: () => fetchOrderCount() }}
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => <Ionicons name="bag-outline" size={size} color={color} />,
          tabBarBadge: orderBadge,
          tabBarBadgeStyle: badgeStyle,
        }}
      />
      <Tab.Screen name="MenuTab"    component={MenuStack}    options={{ title: 'Menu',    tabBarIcon: ({ color, size }) => <Ionicons name="restaurant-outline" size={size} color={color} /> }} />
      <Tab.Screen name="ProfileTab" component={ProfileStack} options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}

const makeStyles = (COLORS) => StyleSheet.create({
  tabBar: {
    backgroundColor:  COLORS.card,
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
