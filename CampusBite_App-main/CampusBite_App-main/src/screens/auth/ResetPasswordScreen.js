import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { api } from '../../api';
import { COLORS } from '../../constants';

export default function ResetPasswordScreen({ navigation, route }) {
  const [otp, setOtp]               = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading]         = useState(false);
  const email = route.params?.email || '';

  const handleReset = async () => {
    if (!otp || !newPassword) return Alert.alert('Error', 'Please enter the code and new password.');
    if (newPassword.length < 6) return Alert.alert('Error', 'Password must be at least 6 characters.');
    setLoading(true);
    try {
      await api.auth.resetPassword({ email, otp, new_password: newPassword });
      Alert.alert('Success', 'Password reset successfully. Please log in.', [
        { text: 'Log In', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reset Password</Text>
      <Text style={styles.subtitle}>Enter the 6-digit code sent to {email}</Text>

      <TextInput style={styles.input} placeholder="6-digit code" placeholderTextColor={COLORS.gray}
        value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} />
      <TextInput style={styles.input} placeholder="New password" placeholderTextColor={COLORS.gray}
        value={newPassword} onChangeText={setNewPassword} secureTextEntry />

      <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 24, justifyContent: 'center' },
  title:     { fontSize: 26, fontWeight: 'bold', marginBottom: 8, color: COLORS.black },
  subtitle:  { fontSize: 14, color: COLORS.gray, marginBottom: 32 },
  input:     { backgroundColor: COLORS.white, borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 15, borderWidth: 1, borderColor: COLORS.lightGray },
  button:    { backgroundColor: COLORS.primary, borderRadius: 10, padding: 16, alignItems: 'center' },
  buttonText:{ color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});
