import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen          from '../screens/auth/LoginScreen';
import RegisterScreen       from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen  from '../screens/auth/ResetPasswordScreen';
import VerificationScreen   from '../screens/auth/VerificationScreen';
import SubmitInfoScreen     from '../screens/auth/SubmitInfoScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"          component={LoginScreen} />
      <Stack.Screen name="Register"       component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword"  component={ResetPasswordScreen} />
      <Stack.Screen name="Verification"   component={VerificationScreen} />
      <Stack.Screen name="SubmitInfo"     component={SubmitInfoScreen} />
    </Stack.Navigator>
  );
}
