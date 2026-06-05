import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { api } from '../../api';
import { COLORS } from '../../constants';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) return Alert.alert('Error', 'Please enter your email.');
    setLoading(true);
    try {
      await api.auth.forgotPassword({ email: email.trim() });
      Alert.alert('Code Sent', 'If that email is registered, a 6-digit reset code has been sent.', [
        { text: 'Enter Code', onPress: () => navigation.navigate('ResetPassword', { email: email.trim() }) },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Forgot Password</Text>
      <Text style={styles.subtitle}>Enter your email and we'll send a reset code.</Text>

      <TextInput style={styles.input} placeholder="Email" placeholderTextColor={COLORS.gray}
        value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Reset Code</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>← Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.backgroundAlt, padding: 24, justifyContent: 'center' },
  title:     { fontSize: 26, fontWeight: 'bold', marginBottom: 8, color: COLORS.text },
  subtitle:  { fontSize: 14, color: COLORS.subtext, marginBottom: 32 },
  input:     { backgroundColor: COLORS.card, borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 15, borderWidth: 1, borderColor: COLORS.border },
  button:    { backgroundColor: COLORS.primary, borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 20 },
  buttonText:{ color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  link:      { color: COLORS.primary, textAlign: 'center', fontSize: 14 },
});
