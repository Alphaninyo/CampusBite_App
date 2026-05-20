import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useAuthStore from '../../stores/authStore';
import { COLORS } from '../../constants';

export default function LoginScreen({ navigation }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Please enter your email and password.');
    setLoading(true);
    try {
      console.log('LoginScreen: Attempting login with email:', email.trim());
      const user = await login(email.trim(), password);
      console.log('LoginScreen: Login successful, user:', user);
    } catch (err) {
      console.error('LoginScreen: Login failed:', err.message);
      Alert.alert('Login Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoContainer}>
          <Ionicons name="restaurant-outline" size={32} color={COLORS.primary} />
          <Text style={styles.logo}> CampusBite</Text>
        </View>
        <Text style={styles.subtitle}>Order food from campus vendors</Text>

        <TextInput style={styles.input} placeholder="Email" placeholderTextColor={COLORS.gray}
          value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor={COLORS.gray}
          value={password} onChangeText={setPassword} secureTextEntry />

        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Log In</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>Don't have an account? <Text style={styles.link}>Sign up</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flexGrow: 1, backgroundColor: COLORS.background, padding: 24, justifyContent: 'center' },
  logoContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  logo:         { fontSize: 36, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle:     { fontSize: 14, color: COLORS.gray, textAlign: 'center', marginBottom: 40 },
  input:        { backgroundColor: COLORS.white, borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 15, borderWidth: 1, borderColor: COLORS.lightGray },
  forgotText:   { color: COLORS.primary, textAlign: 'right', marginBottom: 20, fontSize: 13 },
  button:       { backgroundColor: COLORS.primary, borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 20 },
  buttonText:   { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  linkText:     { textAlign: 'center', color: COLORS.gray, fontSize: 14 },
  link:         { color: COLORS.primary, fontWeight: 'bold' },
});
