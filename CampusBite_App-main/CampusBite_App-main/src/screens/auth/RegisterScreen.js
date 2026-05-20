import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import useAuthStore from '../../stores/authStore';
import { COLORS } from '../../constants';

const ROLES = ['consumer', 'vendor', 'rider'];

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'consumer', business_name: '', vendor_type: 'home_based', location: '' });
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.phone || !form.password)
      return Alert.alert('Error', 'Please fill in all required fields.');
    if (form.role === 'vendor' && !form.business_name)
      return Alert.alert('Error', 'Business name is required for vendors.');
    setLoading(true);
    try {
      console.log('RegisterScreen: Attempting registration with:', { ...form, password: '***' });
      const user = await register(form);
      console.log('RegisterScreen: Registration successful, user:', user);
      Alert.alert('Success', 'Account created successfully! You are now logged in.');
    } catch (err) {
      console.error('RegisterScreen: Registration failed:', err.message);
      Alert.alert('Registration Failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Create Account</Text>

        <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor={COLORS.gray} value={form.name} onChangeText={(v) => set('name', v)} />
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor={COLORS.gray} value={form.email} onChangeText={(v) => set('email', v)} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Phone (e.g. 0712345678)" placeholderTextColor={COLORS.gray} value={form.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder="Password (min 6 chars)" placeholderTextColor={COLORS.gray} value={form.password} onChangeText={(v) => set('password', v)} secureTextEntry />

        <Text style={styles.label}>I am a:</Text>
        <View style={styles.roleRow}>
          {ROLES.map((r) => (
            <TouchableOpacity key={r} style={[styles.roleBtn, form.role === r && styles.roleBtnActive]} onPress={() => set('role', r)}>
              <Text style={[styles.roleBtnText, form.role === r && styles.roleBtnTextActive]}>{r.charAt(0).toUpperCase() + r.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {form.role === 'vendor' && (
          <>
            <TextInput style={styles.input} placeholder="Business Name" placeholderTextColor={COLORS.gray} value={form.business_name} onChangeText={(v) => set('business_name', v)} />
            <TextInput style={styles.input} placeholder="Location (optional)" placeholderTextColor={COLORS.gray} value={form.location} onChangeText={(v) => set('location', v)} />
            <Text style={styles.label}>Vendor Type:</Text>
            <View style={styles.roleRow}>
              {['home_based', 'restaurant'].map((t) => (
                <TouchableOpacity key={t} style={[styles.roleBtn, form.vendor_type === t && styles.roleBtnActive]} onPress={() => set('vendor_type', t)}>
                  <Text style={[styles.roleBtnText, form.vendor_type === t && styles.roleBtnTextActive]}>{t === 'home_based' ? 'Home Based' : 'Restaurant'}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Already have an account? <Text style={styles.link}>Log in</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:        { flexGrow: 1, backgroundColor: COLORS.background, padding: 24 },
  title:            { fontSize: 26, fontWeight: 'bold', marginBottom: 24, marginTop: 40, color: COLORS.black },
  label:            { fontSize: 14, color: COLORS.gray, marginBottom: 8, marginTop: 4 },
  input:            { backgroundColor: COLORS.white, borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 15, borderWidth: 1, borderColor: COLORS.lightGray },
  roleRow:          { flexDirection: 'row', gap: 10, marginBottom: 16 },
  roleBtn:          { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.lightGray, backgroundColor: COLORS.white, alignItems: 'center' },
  roleBtnActive:    { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleBtnText:      { color: COLORS.gray, fontWeight: '500' },
  roleBtnTextActive:{ color: COLORS.white },
  button:           { backgroundColor: COLORS.primary, borderRadius: 10, padding: 16, alignItems: 'center', marginBottom: 20, marginTop: 8 },
  buttonText:       { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
  linkText:         { textAlign: 'center', color: COLORS.gray, fontSize: 14 },
  link:             { color: COLORS.primary, fontWeight: 'bold' },
});
