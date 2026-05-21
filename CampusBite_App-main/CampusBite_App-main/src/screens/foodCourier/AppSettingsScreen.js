import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { COLORS } from '../../constants';
import useAuthStore from '../../stores/authStore';

export default function AppSettingsScreen({ navigation }) {
  const { user, logout } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => await logout() },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'This action cannot be undone. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Info', 'Account deletion requires contacting support.') },
    ]);
  };

  const settingsSections = [
    {
      title: 'Notifications',
      items: [
        {
          icon: 'notifications-outline',
          label: 'Push Notifications',
          value: notificationsEnabled,
          onToggle: setNotificationsEnabled,
        },
        {
          icon: 'mail-outline',
          label: 'Email Notifications',
          value: true,
          onToggle: () => Alert.alert('Info', 'Email notifications are managed in your account settings.'),
        },
      ],
    },
    {
      title: 'Location',
      items: [
        {
          icon: 'location-outline',
          label: 'Location Services',
          value: locationEnabled,
          onToggle: setLocationEnabled,
        },
      ],
    },
    {
      title: 'Appearance',
      items: [
        {
          icon: 'moon-outline',
          label: 'Dark Mode',
          value: darkMode,
          onToggle: setDarkMode,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          icon: 'person-outline',
          label: 'Edit Profile',
          onPress: () => navigation.navigate('EditProfile', { user }),
          showArrow: true,
        },
        {
          icon: 'lock-closed-outline',
          label: 'Change Password',
          onPress: () => Alert.alert('Change Password', 'Password reset link will be sent to your email.'),
          showArrow: true,
        },
      ],
    },
    {
      title: 'About',
      items: [
        {
          icon: 'information-circle-outline',
          label: 'App Version',
          value: '1.0.0',
          showArrow: false,
        },
        {
          icon: 'document-text-outline',
          label: 'Terms of Service',
          onPress: () => Alert.alert('Terms', 'Terms of Service content here.'),
          showArrow: true,
        },
        {
          icon: 'shield-checkmark-outline',
          label: 'Privacy Policy',
          onPress: () => Alert.alert('Privacy', 'Privacy Policy content here.'),
          showArrow: true,
        },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 24 }}>
        {settingsSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => (
                <View key={itemIndex} style={[styles.item, itemIndex < section.items.length - 1 && styles.itemBorder]}>
                  <View style={styles.itemLeft}>
                    <View style={styles.iconBox}>
                      <Ionicons name={item.icon} size={20} color="#E85D04" />
                    </View>
                    <Text style={styles.itemLabel}>{item.label}</Text>
                  </View>
                  {item.onToggle !== undefined ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: '#E5E7EB', true: '#E85D04' }}
                      thumbColor={COLORS.white}
                    />
                  ) : item.showArrow !== false ? (
                    <TouchableOpacity onPress={item.onPress} disabled={!item.onPress}>
                      <Ionicons name={item.onPress ? 'chevron-forward' : 'chevron-forward'} size={20} color={COLORS.gray} />
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.itemValue}>{item.value}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#E85D04" />
            <Text style={styles.dangerText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={20} color="#DC2626" />
            <Text style={[styles.dangerText, { color: '#DC2626' }]}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF8F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#f0e8e4',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.black },
  scrollView: { flex: 1 },
  section: { marginTop: 16, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.gray, marginBottom: 8, textTransform: 'uppercase' },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0e8e4',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: '#f0e8e4' },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFF0EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: { fontSize: 15, color: COLORS.black },
  itemValue: { fontSize: 14, color: COLORS.gray },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0e8e4',
  },
  dangerText: { fontSize: 15, fontWeight: '600', color: '#E85D04' },
});
