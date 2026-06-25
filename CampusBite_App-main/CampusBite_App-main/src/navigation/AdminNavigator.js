import React, { useState, useEffect, useCallback } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useNavigationState } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import AdminStatsScreen     from '../screens/admin/AdminStatsScreen';
import AdminVendorsScreen   from '../screens/admin/AdminVendorsScreen';
import AdminOrdersScreen    from '../screens/admin/AdminOrdersScreen';
import AdminUsersScreen     from '../screens/admin/AdminUsersScreen';
import AdminApprovalsScreen from '../screens/admin/AdminApprovalsScreen';
import ProfileScreen        from '../screens/shared/ProfileScreen';
import { COLORS }           from '../constants';
import { api }              from '../api';

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
  const [pendingCount, setPendingCount] = useState(0);
  const [orderCount,   setOrderCount]   = useState(0);

  const fetchCounts = useCallback(async () => {
    try {
      const [vRes, cRes, dRes, statsRes] = await Promise.all([
        api.admin.getPendingVendors(),
        api.admin.getPendingFoodCouriers(),
        api.admin.getPendingDocUsers(),
        api.admin.getStats(),
      ]);
      const total =
        (vRes.data.vendors  || []).length +
        (cRes.data.couriers || []).length +
        (dRes.data.users    || []).length;
      setPendingCount(total);
      setOrderCount(statsRes.data?.stats?.orders?.active || 0);
    } catch {
      // silently ignore — badge just won't show
    }
  }, []);

  // Fetch on mount and every 30 seconds
  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  const badge      = pendingCount > 0 ? (pendingCount > 99 ? '99+' : pendingCount) : undefined;
  const orderBadge = orderCount   > 0 ? (orderCount   > 99 ? '99+' : orderCount)   : undefined;

  const badgeStyle = { backgroundColor: COLORS.danger, fontSize: 10, fontWeight: '700', minWidth: 18, height: 18, borderRadius: 9 };

  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: COLORS.primary }}>
      <Tab.Screen
        name="Stats"
        component={AdminStatsScreen}
        options={{ title: 'Stats', headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Approvals"
        component={AdminApprovalsScreen}
        listeners={{ tabPress: () => fetchCounts() }}
        options={{
          title: 'Approvals',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="shield-checkmark-outline" size={size} color={color} />,
          tabBarBadge: badge,
          tabBarBadgeStyle: badgeStyle,
        }}
      />
      <Tab.Screen
        name="Vendors"
        component={AdminVendorsScreen}
        options={{ title: 'Vendors', headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="storefront-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Orders"
        component={AdminOrdersScreen}
        listeners={{ tabPress: () => fetchCounts() }}
        options={{
          title: 'Orders',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="bag-outline" size={size} color={color} />,
          tabBarBadge: orderBadge,
          tabBarBadgeStyle: badgeStyle,
        }}
      />
      <Tab.Screen
        name="Users"
        component={AdminUsersScreen}
        options={{ title: 'Users', headerShown: false, tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }}
      />
    </Tab.Navigator>
  );
}
