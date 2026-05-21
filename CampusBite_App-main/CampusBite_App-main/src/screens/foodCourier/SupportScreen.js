import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';

export default function SupportScreen({ navigation }) {
  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@campusbite.com?subject=Food Courier Support');
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+254700000000');
  };

  const handleFAQ = () => {
    Alert.alert('FAQ', 'Frequently Asked Questions:\n\nQ: How do I receive payments?\nA: Earnings are automatically calculated and can be viewed in the Earnings tab.\n\nQ: What happens if I can\'t complete a delivery?\nA: Contact support immediately through this screen.');
  };

  const handleReportIssue = () => {
    Alert.alert('Report Issue', 'Please describe your issue and we will get back to you within 24 hours.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Contact Support', onPress: handleEmailSupport },
    ]);
  };

  const supportOptions = [
    {
      icon: 'mail-outline',
      title: 'Email Support',
      subtitle: 'support@campusbite.com',
      onPress: handleEmailSupport,
    },
    {
      icon: 'call-outline',
      title: 'Call Support',
      subtitle: '+254 700 000 000',
      onPress: handleCallSupport,
    },
    {
      icon: 'chatbubbles-outline',
      title: 'Live Chat',
      subtitle: 'Available 8 AM - 8 PM',
      onPress: () => Alert.alert('Live Chat', 'Live chat is currently unavailable. Please use email or phone support.'),
    },
  ];

  const helpTopics = [
    { icon: 'help-circle-outline', title: 'FAQ', onPress: handleFAQ },
    { icon: 'document-text-outline', title: 'Terms of Service', onPress: () => Alert.alert('Terms', 'Full terms of service will be displayed here.') },
    { icon: 'shield-checkmark-outline', title: 'Privacy Policy', onPress: () => Alert.alert('Privacy', 'Full privacy policy will be displayed here.') },
    { icon: 'alert-circle-outline', title: 'Report an Issue', onPress: handleReportIssue },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ padding: 16 }}>
        {/* Contact Options */}
        <Text style={styles.sectionTitle}>Contact Us</Text>
        {supportOptions.map((option, index) => (
          <TouchableOpacity key={index} style={styles.card} onPress={option.onPress}>
            <View style={styles.iconBox}>
              <Ionicons name={option.icon} size={24} color="#E85D04" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{option.title}</Text>
              <Text style={styles.cardSubtitle}>{option.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        ))}

        {/* Help Topics */}
        <Text style={styles.sectionTitle}>Help Topics</Text>
        {helpTopics.map((topic, index) => (
          <TouchableOpacity key={index} style={styles.listItem} onPress={topic.onPress}>
            <Ionicons name={topic.icon} size={22} color={COLORS.gray} />
            <Text style={styles.listText}>{topic.title}</Text>
            <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
          </TouchableOpacity>
        ))}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#E85D04" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Need immediate help?</Text>
            <Text style={styles.infoText}>Our support team is available 24/7 for urgent delivery issues.</Text>
          </View>
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
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.black, marginTop: 16, marginBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0e8e4',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFF0EB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: COLORS.black },
  cardSubtitle: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#f0e8e4',
  },
  listText: { flex: 1, fontSize: 14, color: COLORS.black, marginLeft: 12 },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF0EB',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoContent: { flex: 1, marginLeft: 12 },
  infoTitle: { fontSize: 14, fontWeight: '600', color: COLORS.black },
  infoText: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
});
