import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PendingApprovalScreen from '../screens/shared/PendingApprovalScreen';
import VerificationScreen    from '../screens/auth/VerificationScreen';
import SubmitInfoScreen      from '../screens/auth/SubmitInfoScreen';

const Stack = createNativeStackNavigator();

export default function PendingNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PendingApproval" component={PendingApprovalScreen} />
      <Stack.Screen name="Verification"    component={VerificationScreen} />
      <Stack.Screen name="SubmitInfo"      component={SubmitInfoScreen} />
    </Stack.Navigator>
  );
}
