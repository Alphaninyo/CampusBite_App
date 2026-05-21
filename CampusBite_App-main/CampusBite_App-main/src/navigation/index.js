import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import useAuthStore from '../stores/authStore';
import AuthNavigator        from './AuthNavigator';
import ConsumerNavigator     from './ConsumerNavigator';
import VendorNavigator       from './VendorNavigator';
import FoodCourierNavigator  from './FoodCourierNavigator';
import AdminNavigator        from './AdminNavigator';
import PendingNavigator      from './PendingNavigator';
import { COLORS } from '../constants';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);
  const hydrate = useAuthStore((state) => state.hydrate);
  const setLogoutCallback = useAuthStore((state) => state.setLogoutCallback);
  const [forceUpdate, setForceUpdate] = React.useState(0);

  React.useEffect(() => { hydrate(); }, []);

  // Set up logout callback
  React.useEffect(() => {
    setLogoutCallback(() => {
      console.log('RootNavigator: logout callback triggered');
      setForceUpdate(prev => prev + 1);
    });
  }, [setLogoutCallback]);

  // Add debug logging
  React.useEffect(() => {
    console.log('RootNavigator: user changed to', user);
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Return different NavigationContainers based on auth state
  if (!user) {
    console.log('RootNavigator: Rendering AuthNavigator');
    return (
      <NavigationContainer key={`auth-${forceUpdate}`}>
        <AuthNavigator />
      </NavigationContainer>
    );
  }

  console.log('RootNavigator: Rendering', user.role, 'Navigator');
  const getNavigator = () => {
    switch (user.role) {
      case 'vendor':
        return user.is_approved ? <VendorNavigator /> : <PendingNavigator />;
      case 'food_courier':
        return user.is_approved ? <FoodCourierNavigator /> : <PendingNavigator />;
      case 'admin':
        return <AdminNavigator />;
      default:
        return <ConsumerNavigator />;
    }
  };

  return (
    <NavigationContainer key={`user-${user.role}-${forceUpdate}`}>
      {getNavigator()}
    </NavigationContainer>
  );
}
