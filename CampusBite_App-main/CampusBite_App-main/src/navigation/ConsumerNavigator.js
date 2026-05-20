import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen        from '../screens/consumer/HomeScreen';
import VendorDetailScreen from '../screens/consumer/VendorDetailScreen';
import CheckoutScreen    from '../screens/consumer/CheckoutScreen';
import PaymentStatusScreen from '../screens/consumer/PaymentStatusScreen';
import CartScreen         from '../screens/consumer/CartScreen';
import MyOrdersScreen    from '../screens/consumer/MyOrdersScreen';
import OrderDetailScreen from '../screens/consumer/OrderDetailScreen';
import WriteReviewScreen from '../screens/consumer/WriteReviewScreen';
import ProfileScreen     from '../screens/shared/ProfileScreen';
import { COLORS }        from '../constants';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: COLORS.primary }}>
      <Stack.Screen name="Home"          component={HomeScreen}         options={{ headerShown: false }} />
      <Stack.Screen name="VendorDetail"  component={VendorDetailScreen} options={{ title: 'Menu' }} />
      <Stack.Screen name="Checkout"      component={CheckoutScreen}     options={{ title: 'Checkout' }} />
      <Stack.Screen name="PaymentStatus" component={PaymentStatusScreen} options={{ title: 'Payment', headerBackVisible: false }} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: COLORS.primary }}>
      <Stack.Screen name="MyOrders"    component={MyOrdersScreen}    options={{ title: 'My Orders' }} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Detail' }} />
      <Stack.Screen name="WriteReview" component={WriteReviewScreen} options={{ title: 'Write a Review' }} />
    </Stack.Navigator>
  );
}

export default function ConsumerNavigator() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: COLORS.primary, headerShown: false }}>
      <Tab.Screen name="HomeTab"    component={HomeStack}    options={{ title: 'Home',    tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }} />
      <Tab.Screen name="CartTab"    component={CartScreen}    options={{ title: 'Cart',    tabBarIcon: ({ color, size }) => <Ionicons name="cart-outline" size={size} color={color} /> }} />
      <Tab.Screen name="OrdersTab"  component={OrdersStack}  options={{ title: 'Orders',  tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} /> }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile', tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
}
