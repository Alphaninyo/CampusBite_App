import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform, Image, Switch, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import useAuthStore from '../../stores/authStore';
import { api } from '../../api';
import { COLORS } from '../../constants';

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuthStore();
  const [name, setName]   = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(true);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving]       = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(true);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showLiveChat, setShowLiveChat] = useState(false);
  const [showTutorials, setShowTutorials] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState(null);
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [faqSearchText, setFaqSearchText] = useState('');
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [supportRating, setSupportRating] = useState(0);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [showRefundPolicy, setShowRefundPolicy] = useState(false);
  
  // Settings states
  const [notifications, setNotifications] = useState(true);
  const [locationServices, setLocationServices] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoOrder, setAutoOrder] = useState(false);

  // User statistics fetched from API
  const [userStats, setUserStats] = useState({
    totalOrders: 0,
    favoriteVendor: 'N/A',
    memberSince: user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A',
  });

  // Recent activity from real orders
  const [recentActivity, setRecentActivity] = useState([]);

  // Fetch real stats and activity from the API
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
      setLoading(false);

      // Fetch order stats
      (async () => {
        try {
          const { data } = await api.orders.getMyOrders();
          const orders = data.orders || [];

          // Count total orders
          const totalOrders = orders.length;

          // Find favorite vendor (most ordered from)
          const vendorCounts = {};
          orders.forEach(order => {
            const name = order.vendor?.business_name || 'Unknown';
            vendorCounts[name] = (vendorCounts[name] || 0) + 1;
          });
          const favoriteVendor = Object.entries(vendorCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

          setUserStats({
            totalOrders,
            favoriteVendor,
            memberSince: user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A',
          });

          // Build recent activity from orders (latest 5)
          const activity = orders.slice(0, 5).map((order, index) => ({
            id: order.id || index + 1,
            vendor: order.vendor?.business_name || 'Order',
            item: `${order.status} - KES ${order.total_amount}`,
            date: new Date(order.created_at).toLocaleDateString(),
            time: new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: order.status,
            type: order.status === 'Delivered' ? 'profile' : 'account',
            action: 'order',
          }));
          setRecentActivity(activity);
        } catch (err) {
          console.log('Could not fetch order stats:', err.message);
        }
      })();
    } else {
      setLoading(true);
    }
  }, [user]);

  // FAQ Data
  const faqData = [
    {
      id: 1,
      category: 'Orders',
      question: 'How do I place an order?',
      answer: 'Browse vendors from the home screen, select items you want, add them to your cart, and proceed to checkout. You can pay via M-Pesa when prompted.'
    },
    {
      id: 2,
      category: 'Orders',
      question: 'Can I cancel my order?',
      answer: 'Yes, you can cancel your order before it\'s been confirmed by the vendor. Go to Orders tab, find your order and tap "Cancel Order".'
    },
    {
      id: 3,
      category: 'Orders',
      question: 'How do I track my order?',
      answer: 'Go to the Orders tab and select your active order. You\'ll see real-time status updates from "Preparing" to "Delivered".'
    },
    {
      id: 4,
      category: 'Payment',
      question: 'What payment methods are accepted?',
      answer: 'We currently accept M-Pesa payments. More payment options will be added soon.'
    },
    {
      id: 5,
      category: 'Payment',
      question: 'Is my payment information secure?',
      answer: 'Yes, all payments are processed through secure M-Pesa integration. We don\'t store your payment details on our servers.'
    },
    {
      id: 6,
      category: 'Account',
      question: 'How do I update my profile?',
      answer: 'Go to Profile tab, tap "Edit Profile" section, update your information and save changes.'
    },
    {
      id: 7,
      category: 'Account',
      question: 'Can I change my email address?',
      answer: 'For security reasons, email changes require contacting support. Use the "Contact Support" option in Help & Support.'
    },
    {
      id: 8,
      category: 'Delivery',
      question: 'What are the delivery areas?',
      answer: 'We deliver to all campus areas including hostels, academic blocks, library, and student center.'
    },
    {
      id: 9,
      category: 'Delivery',
      question: 'How long does delivery take?',
      answer: 'Delivery typically takes 15-45 minutes depending on vendor preparation time and your location.'
    },
    {
      id: 10,
      category: 'General',
      question: 'How do I become a vendor?',
      answer: 'Download the app and sign up as a vendor. Your application will be reviewed within 24-48 hours.'
    }
  ];

  const handleContactSupport = async () => {
    if (!contactSubject || !contactMessage) {
      Alert.alert('Error', 'Please fill in both subject and message fields.');
      return;
    }
    
    setSaving(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', 'Your message has been sent to our support team. We\'ll respond within 24 hours.');
      setContactSubject('');
      setContactMessage('');
      setShowContactForm(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReportIssue = (issueType) => {
    setContactSubject(`Report: ${issueType}`);
    setContactMessage(`I'm reporting an issue with: ${issueType}\n\nPlease describe the issue here...`);
    setShowContactForm(true);
  };

  // Tutorial data
  const tutorials = [
    {
      id: 1,
      title: 'How to Place Your First Order',
      duration: '2 min',
      type: 'video',
      description: 'Learn the complete process from browsing to checkout',
      steps: [
        'Browse vendors on home screen',
        'Select items you want to order',
        'Review your cart',
        'Proceed to checkout',
        'Pay with M-Pesa'
      ]
    },
    {
      id: 2,
      title: 'Tracking Your Order',
      duration: '1 min',
      type: 'guide',
      description: 'Monitor your order from preparation to delivery',
      steps: [
        'Go to Orders tab',
        'Select your active order',
        'View real-time status updates',
        'Contact rider if needed'
      ]
    },
    {
      id: 3,
      title: 'Managing Your Profile',
      duration: '1 min',
      type: 'guide',
      description: 'Update your personal information and preferences',
      steps: [
        'Go to Profile tab',
        'Tap Edit Profile section',
        'Update your information',
        'Save changes'
      ]
    }
  ];

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    
    const newMessage = {
      id: Date.now(),
      text: chatInput,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    };
    
    setChatMessages([...chatMessages, newMessage]);
    setChatInput('');
    
    // Simulate support response
    setTimeout(() => {
      const supportResponse = {
        id: Date.now() + 1,
        text: 'Thank you for your message. A support agent will be with you shortly.',
        sender: 'support',
        timestamp: new Date().toLocaleTimeString()
      };
      setChatMessages(prev => [...prev, supportResponse]);
    }, 1000);
  };

  const handleRateSupport = (rating) => {
    setSupportRating(rating);
    Alert.alert('Thank You!', `You rated our support ${rating} stars. Your feedback helps us improve!`);
  };

  const filteredFAQs = faqData.filter(faq => 
    faq.question.toLowerCase().includes(faqSearchText.toLowerCase()) ||
    faq.answer.toLowerCase().includes(faqSearchText.toLowerCase()) ||
    faq.category.toLowerCase().includes(faqSearchText.toLowerCase())
  );

  const handleUpdateProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.auth.updateProfile({ name, phone });
      updateUser({ name: data.user.name, phone: data.user.phone });
      Alert.alert('Success', 'Profile updated.');
      setShowEditProfile(false);
    } catch (err) {
      Alert.alert('Error', err?.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) return Alert.alert('Error', 'All password fields are required.');
    if (newPw.length < 6) return Alert.alert('Error', 'New password must be at least 6 characters.');
    if (newPw !== confirmPw) return Alert.alert('Error', 'New passwords do not match.');
    
    setSaving(true);
    try {
      await api.auth.updatePassword({ current_password: currentPw, new_password: newPw });
      Alert.alert('Success', 'Password changed successfully.');
      setCurrentPw(''); 
      setNewPw('');
      setConfirmPw('');
      setShowPasswordChange(false);
    } catch (err) {
      // Handle specific error for incorrect current password
      if (err.message?.includes('current password') || err.response?.status === 401) {
        Alert.alert('Error', 'Current password is incorrect. Please try again.');
      } else {
        Alert.alert('Error', err.message || 'Failed to change password. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = () => {
    Alert.alert('Profile Picture', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Allow camera access to take a photo.');
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled && result.assets?.[0]?.uri) {
            setProfileImage({ uri: result.assets[0].uri });
          }
        },
      },
      {
        text: 'Choose from Gallery',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission needed', 'Allow access to your photo library to update your profile picture.');
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled && result.assets?.[0]?.uri) {
            setProfileImage({ uri: result.assets[0].uri });
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleLogout = async () => {
    console.log('Logout button pressed');
    try {
      if (Platform.OS === 'web') {
        const confirmed = window.confirm('Are you sure you want to logout?');
        console.log('Confirmation result (web):', confirmed);
        if (confirmed) {
          console.log('Logout confirmed (web), calling logout function');
          await logout();
          console.log('Logout completed (web)');
        }
      } else {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              console.log('Logout confirmed (mobile), calling logout function');
              await logout();
              console.log('Logout completed (mobile)');
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Profile Header Component
const ProfileHeader = () => (
  <View style={styles.profileHeader}>
    <View style={styles.profileImageContainer}>
      <Image 
        source={profileImage || { uri: 'https://via.placeholder.com/120x120/E85D04/FFFFFF?text=' + (name?.charAt(0)?.toUpperCase() || 'U') }} 
        style={styles.profileImage} 
      />
      <TouchableOpacity style={styles.editImageOverlay} onPress={handleImageUpload}>
        <Ionicons name="camera-outline" size={20} color={COLORS.white} />
      </TouchableOpacity>
    </View>
    <View style={styles.profileInfo}>
      <Text style={styles.profileName}>{name || 'User'}</Text>
      <Text style={styles.profileRole}>{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}</Text>
      <Text style={styles.memberSince}>Member since {userStats.memberSince}</Text>
    </View>
  </View>
);

// Simplified Stats Component
const StatsSection = () => (
  <View style={styles.statsContainer}>
    <View style={styles.statItem}>
      <Ionicons name="receipt-outline" size={24} color={COLORS.primary} />
      <Text style={styles.statNumber}>{userStats.totalOrders}</Text>
      <Text style={styles.statLabel}>Total Orders</Text>
    </View>
    <View style={styles.statItem}>
      <Ionicons name="heart-outline" size={24} color={COLORS.primary} />
      <Text style={styles.statNumber} numberOfLines={1}>{userStats.favoriteVendor}</Text>
      <Text style={styles.statLabel}>Favorite</Text>
    </View>
  </View>
);

// Recent Activity Component
const RecentActivitySection = () => {
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('All');
  
  const activityTypes = ['All', 'Profile', 'Security', 'Account', 'Settings'];
  
  const getFilteredActivities = () => {
    if (selectedFilter === 'All') {
      return recentActivity;
    }
    return recentActivity.filter(activity => 
      activity.type === selectedFilter.toLowerCase()
    );
  };
  
  const getActivityIcon = (type) => {
    switch (type) {
      case 'profile': return 'person-outline';
      case 'security': return 'lock-closed-outline';
      case 'account': return 'settings-outline';
      case 'settings': return 'options-outline';
      default: return 'time-outline';
    }
  };
  
  const getActivityIconColor = (type) => {
    switch (type) {
      case 'profile': return COLORS.success;
      case 'security': return COLORS.warning;
      case 'account': return COLORS.info;
      case 'settings': return COLORS.primary;
      default: return COLORS.gray;
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return COLORS.success;
      case 'In Transit': return COLORS.warning;
      case 'Preparing': return COLORS.info;
      case 'Completed': return COLORS.success;
      default: return COLORS.gray;
    }
  };
  
  const handleActivityPress = (activity) => {
    if (activity.type === 'profile') {
      setShowEditProfile(true);
    } else if (activity.type === 'security') {
      setShowPasswordChange(true);
    } else if (activity.type === 'settings') {
      setShowSettings(true);
    } else if (activity.type === 'account') {
      setShowEditProfile(true);
    }
  };
  
  const activitiesToShow = showAllActivities ? getFilteredActivities() : getFilteredActivities().slice(0, 5);
  
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <TouchableOpacity onPress={() => setShowAllActivities(!showAllActivities)}>
          <Text style={styles.seeAllText}>{showAllActivities ? 'Show Less' : 'See All'}</Text>
        </TouchableOpacity>
      </View>
      
      {/* Activity Type Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.activityFiltersContainer}>
        {activityTypes.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.activityFilterBtn, selectedFilter === filter && styles.activityFilterBtnActive]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[styles.activityFilterText, selectedFilter === filter && styles.activityFilterTextActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <View style={styles.recentActivityContainer}>
        {activitiesToShow.map((activity) => (
          <TouchableOpacity 
            key={activity.id} 
            style={styles.activityItem} 
            onPress={() => handleActivityPress(activity)}
          >
            <View style={[styles.activityIcon, { backgroundColor: getActivityIconColor(activity.type) + '20' }]}>
              <Ionicons 
                name={getActivityIcon(activity.type)} 
                size={18} 
                color={getActivityIconColor(activity.type)} 
              />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>{activity.item}</Text>
              <Text style={styles.activityVendor}>{activity.vendor}</Text>
              <Text style={styles.activityTime}>{activity.date} • {activity.time}</Text>
            </View>
            <View style={[styles.activityStatus, { backgroundColor: getStatusColor(activity.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(activity.status) }]}>
                {activity.status}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      
      {!showAllActivities && getFilteredActivities().length > 5 && (
        <TouchableOpacity 
          style={styles.loadMoreBtn}
          onPress={() => setShowAllActivities(true)}
        >
          <Text style={styles.loadMoreText}>Load More Activities</Text>
          <Ionicons name="chevron-down-outline" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Edit Profile section is inlined in the return to prevent re-mount on typing

// Settings Component
const SettingsSection = () => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Settings</Text>
      <TouchableOpacity onPress={() => setShowSettings(!showSettings)}>
        <Ionicons name={showSettings ? 'chevron-up-outline' : 'chevron-down-outline'} size={24} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
    
    {showSettings && (
      <View style={styles.settingsForm}>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications-outline" size={20} color={COLORS.primary} />
            <Text style={styles.settingLabel}>Push Notifications</Text>
          </View>
          <Switch value={notifications} onValueChange={setNotifications} />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="location-outline" size={20} color={COLORS.primary} />
            <Text style={styles.settingLabel}>Location Services</Text>
          </View>
          <Switch value={locationServices} onValueChange={setLocationServices} />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="moon-outline" size={20} color={COLORS.primary} />
            <Text style={styles.settingLabel}>Dark Mode</Text>
          </View>
          <Switch value={darkMode} onValueChange={setDarkMode} />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="refresh-outline" size={20} color={COLORS.primary} />
            <Text style={styles.settingLabel}>Auto-reorder</Text>
          </View>
          <Switch value={autoOrder} onValueChange={setAutoOrder} />
        </View>
      </View>
    )}
  </View>
);

// Quick Actions Component
const QuickActionsSection = () => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Quick Actions</Text>
    <View style={styles.quickActionsContainer}>
      <TouchableOpacity style={styles.quickAction} onPress={() => setShowPasswordChange(!showPasswordChange)}>
        <Ionicons name="lock-closed-outline" size={24} color={COLORS.primary} />
        <Text style={styles.quickActionText}>Change Password</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('OrdersTab')}>
        <Ionicons name="receipt-outline" size={24} color={COLORS.primary} />
        <Text style={styles.quickActionText}>Order History</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('CartTab')}>
        <Ionicons name="cart-outline" size={24} color={COLORS.primary} />
        <Text style={styles.quickActionText}>My Cart</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.quickAction} onPress={() => setShowHelpSupport(true)}>
        <Ionicons name="help-circle-outline" size={24} color={COLORS.primary} />
        <Text style={styles.quickActionText}>Help & Support</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// Password Change section is inlined in the return to prevent re-mount on typing

// Help & Support Modal Component
const HelpSupportModal = () => (
  showHelpSupport && (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Help & Support</Text>
          <TouchableOpacity onPress={() => setShowHelpSupport(false)}>
            <Ionicons name="close-outline" size={24} color={COLORS.black} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          {/* Quick Help Options */}
          <View style={styles.helpSection}>
            <Text style={styles.helpSectionTitle}>Quick Help</Text>
            <TouchableOpacity style={styles.helpOption} onPress={() => { setShowFAQ(true); setShowHelpSupport(false); }}>
              <Ionicons name="help-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.helpOptionText}>Frequently Asked Questions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpOption} onPress={() => { setShowLiveChat(true); setShowHelpSupport(false); }}>
              <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
              <Text style={styles.helpOptionText}>Live Chat Support</Text>
              <View style={[styles.chatStatus, { backgroundColor: isOnline ? COLORS.success : COLORS.gray }]} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpOption} onPress={() => { setShowTutorials(true); setShowHelpSupport(false); }}>
              <Ionicons name="play-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.helpOptionText}>Video Tutorials</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpOption} onPress={() => { setShowContactForm(true); setShowHelpSupport(false); }}>
              <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
              <Text style={styles.helpOptionText}>Contact Support</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpOption} onPress={() => handleReportIssue('App Bug')}>
              <Ionicons name="bug-outline" size={20} color={COLORS.primary} />
              <Text style={styles.helpOptionText}>Report a Bug</Text>
            </TouchableOpacity>
          </View>

          {/* Report Issue Categories */}
          <View style={styles.helpSection}>
            <Text style={styles.helpSectionTitle}>Report an Issue</Text>
            <TouchableOpacity style={styles.helpOption} onPress={() => handleReportIssue('Order Problem')}>
              <Ionicons name="receipt-outline" size={20} color={COLORS.warning} />
              <Text style={styles.helpOptionText}>Order Issue</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpOption} onPress={() => handleReportIssue('Payment Problem')}>
              <Ionicons name="card-outline" size={20} color={COLORS.warning} />
              <Text style={styles.helpOptionText}>Payment Issue</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpOption} onPress={() => handleReportIssue('Delivery Problem')}>
              <Ionicons name="bicycle-outline" size={20} color={COLORS.warning} />
              <Text style={styles.helpOptionText}>Delivery Issue</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpOption} onPress={() => handleReportIssue('Account Problem')}>
              <Ionicons name="person-outline" size={20} color={COLORS.warning} />
              <Text style={styles.helpOptionText}>Account Issue</Text>
            </TouchableOpacity>
          </View>

          {/* Emergency Support */}
          <View style={styles.helpSection}>
            <Text style={styles.helpSectionTitle}>Emergency Support</Text>
            <TouchableOpacity style={[styles.helpOption, styles.emergencyOption]} onPress={() => handleReportIssue('Urgent Issue')}>
              <Ionicons name="alert-circle-outline" size={20} color={COLORS.danger} />
              <Text style={styles.helpOptionText}>Report Urgent Issue</Text>
            </TouchableOpacity>
            <View style={styles.contactInfo}>
              <Ionicons name="call-outline" size={20} color={COLORS.danger} />
              <Text style={styles.contactText}>Emergency Hotline: +254 800 000 000</Text>
            </View>
            <View style={styles.contactInfo}>
              <Ionicons name="flash-outline" size={20} color={COLORS.warning} />
              <Text style={styles.contactText}>Priority Response Available</Text>
            </View>
          </View>

          {/* Contact Information */}
          <View style={styles.helpSection}>
            <Text style={styles.helpSectionTitle}>Contact Information</Text>
            <View style={styles.contactInfo}>
              <Ionicons name="call-outline" size={20} color={COLORS.primary} />
              <Text style={styles.contactText}>+254 700 000 000</Text>
            </View>
            <View style={styles.contactInfo}>
              <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
              <Text style={styles.contactText}>support@campusbite.com</Text>
            </View>
            <View style={styles.contactInfo}>
              <Ionicons name="time-outline" size={20} color={COLORS.primary} />
              <Text style={styles.contactText}>24/7 Support Available</Text>
            </View>
          </View>

          {/* Social Media */}
          <View style={styles.helpSection}>
            <Text style={styles.helpSectionTitle}>Connect With Us</Text>
            <TouchableOpacity style={styles.helpOption}>
              <Ionicons name="logo-facebook" size={20} color={COLORS.primary} />
              <Text style={styles.helpOptionText}>Facebook</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpOption}>
              <Ionicons name="logo-instagram" size={20} color={COLORS.primary} />
              <Text style={styles.helpOptionText}>Instagram</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpOption}>
              <Ionicons name="logo-twitter" size={20} color={COLORS.primary} />
              <Text style={styles.helpOptionText}>Twitter</Text>
            </TouchableOpacity>
          </View>

          {/* Feedback Section */}
          <View style={styles.helpSection}>
            <Text style={styles.helpSectionTitle}>Rate Our Support</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.ratingLabel}>How would you rate your support experience?</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => handleRateSupport(star)}>
                    <Ionicons 
                      name={star <= supportRating ? 'star' : 'star-outline'} 
                      size={24} 
                      color={star <= supportRating ? COLORS.warning : COLORS.gray} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Legal Links */}
          <View style={styles.helpSection}>
            <Text style={styles.helpSectionTitle}>Legal</Text>
            <TouchableOpacity style={styles.helpOption} onPress={() => { setShowPrivacyPolicy(true); setShowHelpSupport(false); }}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.gray} />
              <Text style={styles.helpOptionText}>Privacy Policy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpOption} onPress={() => { setShowTermsOfService(true); setShowHelpSupport(false); }}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.gray} />
              <Text style={styles.helpOptionText}>Terms of Service</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.helpOption} onPress={() => { setShowRefundPolicy(true); setShowHelpSupport(false); }}>
              <Ionicons name="document-text-outline" size={20} color={COLORS.gray} />
              <Text style={styles.helpOptionText}>Refund Policy</Text>
            </TouchableOpacity>
          </View>

          {/* App Info */}
          <View style={styles.helpSection}>
            <Text style={styles.helpSectionTitle}>About CampusBite</Text>
            <View style={styles.appInfo}>
              <Text style={styles.appVersion}>Version 1.0.0</Text>
              <Text style={styles.appDescription}>Your campus food delivery companion</Text>
              <Text style={styles.appCopyright}>© 2024 CampusBite. All rights reserved.</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  )
);

// FAQ Modal Component
const FAQModal = () => (
  showFAQ && (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Frequently Asked Questions</Text>
          <TouchableOpacity onPress={() => { setShowFAQ(false); setSelectedFAQ(null); }}>
            <Ionicons name="close-outline" size={24} color={COLORS.black} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          {selectedFAQ ? (
            <View style={styles.faqDetail}>
              <Text style={styles.faqQuestion}>{selectedFAQ.question}</Text>
              <Text style={styles.faqAnswer}>{selectedFAQ.answer}</Text>
              <TouchableOpacity style={styles.backButton} onPress={() => setSelectedFAQ(null)}>
                <Ionicons name="arrow-back-outline" size={20} color={COLORS.primary} />
                <Text style={styles.backButtonText}>Back to FAQ</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={20} color={COLORS.gray} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search FAQs..."
                  placeholderTextColor={COLORS.gray}
                  value={faqSearchText}
                  onChangeText={setFaqSearchText}
                />
                {faqSearchText.length > 0 && (
                  <TouchableOpacity onPress={() => setFaqSearchText('')}>
                    <Ionicons name="close-circle-outline" size={20} color={COLORS.gray} />
                  </TouchableOpacity>
                )}
              </View>

              {faqSearchText.length > 0 ? (
                <View>
                  <Text style={styles.searchResultsTitle}>Search Results</Text>
                  {filteredFAQs.length > 0 ? (
                    filteredFAQs.map(faq => (
                      <TouchableOpacity 
                        key={faq.id} 
                        style={styles.faqItem} 
                        onPress={() => setSelectedFAQ(faq)}
                      >
                        <Text style={styles.faqItemQuestion}>{faq.question}</Text>
                        <Ionicons name="chevron-forward-outline" size={16} color={COLORS.gray} />
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.noResultsText}>No FAQs found matching your search.</Text>
                  )}
                </View>
              ) : (
                ['Orders', 'Payment', 'Account', 'Delivery', 'General'].map(category => (
                  <View key={category} style={styles.faqCategory}>
                    <Text style={styles.faqCategoryTitle}>{category}</Text>
                    {faqData.filter(faq => faq.category === category).map(faq => (
                      <TouchableOpacity 
                        key={faq.id} 
                        style={styles.faqItem} 
                        onPress={() => setSelectedFAQ(faq)}
                      >
                        <Text style={styles.faqItemQuestion}>{faq.question}</Text>
                        <Ionicons name="chevron-forward-outline" size={16} color={COLORS.gray} />
                      </TouchableOpacity>
                    ))}
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  )
);

// Live Chat Modal Component
const LiveChatModal = () => (
  showLiveChat && (
    <View style={styles.modalOverlay}>
      <View style={styles.chatModalContent}>
        <View style={styles.modalHeader}>
          <View style={styles.chatHeaderInfo}>
            <Text style={styles.modalTitle}>Live Chat Support</Text>
            <View style={[styles.chatStatusIndicator, { backgroundColor: isOnline ? COLORS.success : COLORS.gray }]} />
            <Text style={styles.chatStatusText}>{isOnline ? 'Online' : 'Offline'}</Text>
          </View>
          <TouchableOpacity onPress={() => setShowLiveChat(false)}>
            <Ionicons name="close-outline" size={24} color={COLORS.black} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.chatMessagesContainer}>
          <ScrollView style={styles.chatMessages} showsVerticalScrollIndicator={false}>
            {chatMessages.length === 0 && (
              <View style={styles.chatWelcome}>
                <Ionicons name="chatbubble-outline" size={48} color={COLORS.primary} />
                <Text style={styles.chatWelcomeText}>Welcome to CampusBite Support!</Text>
                <Text style={styles.chatWelcomeSubtext}>How can we help you today?</Text>
              </View>
            )}
            {chatMessages.map((message) => (
              <View key={message.id} style={[styles.chatMessage, message.sender === 'user' ? styles.userMessage : styles.supportMessage]}>
                <Text style={styles.chatMessageText}>{message.text}</Text>
                <Text style={styles.chatMessageTime}>{message.timestamp}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.chatInputContainer}>
          <TextInput
            style={styles.chatInput}
            value={chatInput}
            onChangeText={setChatInput}
            placeholder="Type your message..."
            placeholderTextColor={COLORS.gray}
            multiline
          />
          <TouchableOpacity style={styles.chatSendButton} onPress={handleSendMessage}>
            <Ionicons name="send-outline" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
);

// Tutorials Modal Component
const TutorialsModal = () => (
  showTutorials && (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Video Tutorials</Text>
          <TouchableOpacity onPress={() => setShowTutorials(false)}>
            <Ionicons name="close-outline" size={24} color={COLORS.black} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          {tutorials.map((tutorial) => (
            <TouchableOpacity key={tutorial.id} style={styles.tutorialItem}>
              <View style={styles.tutorialIcon}>
                <Ionicons name={tutorial.type === 'video' ? 'play-circle' : 'book-outline'} size={32} color={COLORS.primary} />
              </View>
              <View style={styles.tutorialInfo}>
                <Text style={styles.tutorialTitle}>{tutorial.title}</Text>
                <Text style={styles.tutorialDescription}>{tutorial.description}</Text>
                <View style={styles.tutorialMeta}>
                  <Ionicons name="time-outline" size={14} color={COLORS.gray} />
                  <Text style={styles.tutorialDuration}>{tutorial.duration}</Text>
                  <Ionicons name="list-outline" size={14} color={COLORS.gray} />
                  <Text style={styles.tutorialSteps}>{tutorial.steps.length} steps</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color={COLORS.gray} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  )
);

// Privacy Policy Modal Component
const PrivacyPolicyModal = () => (
  showPrivacyPolicy && (
    <View style={styles.modalOverlay}>
      <View style={styles.legalModalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Privacy Policy</Text>
          <TouchableOpacity onPress={() => setShowPrivacyPolicy(false)}>
            <Ionicons name="close-outline" size={24} color={COLORS.black} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          <Text style={styles.legalLastUpdated}>Last Updated: January 1, 2024</Text>
          
          <View style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>1. Information We Collect</Text>
            <Text style={styles.legalText}>
              We collect information you provide directly to us, such as when you create an account, place an order, or contact us for support.
            </Text>
            <Text style={styles.legalSubTitle}>Personal Information:</Text>
            <Text style={styles.legalText}>• Name and contact information</Text>
            <Text style={styles.legalText}>• Delivery address</Text>
            <Text style={styles.legalText}>• Phone number and email</Text>
            <Text style={styles.legalText}>• Payment information (processed securely)</Text>
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>2. How We Use Your Information</Text>
            <Text style={styles.legalText}>
              We use the information we collect to provide, maintain, and improve our services:
            </Text>
            <Text style={styles.legalText}>• Process and fulfill your orders</Text>
            <Text style={styles.legalText}>• Communicate with you about your orders</Text>
            <Text style={styles.legalText}>• Provide customer support</Text>
            <Text style={styles.legalText}>• Improve our services and develop new features</Text>
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>3. Information Sharing</Text>
            <Text style={styles.legalText}>
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent.
            </Text>
            <Text style={styles.legalText}>• Vendors receive only order-related information</Text>
            <Text style={styles.legalText}>• Delivery partners receive delivery details only</Text>
            <Text style={styles.legalText}>• Payment processors handle payment information securely</Text>
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>4. Data Security</Text>
            <Text style={styles.legalText}>
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </Text>
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>5. Your Rights</Text>
            <Text style={styles.legalText}>• Access and update your personal information</Text>
            <Text style={styles.legalText}>• Delete your account and personal data</Text>
            <Text style={styles.legalText}>• Opt-out of marketing communications</Text>
            <Text style={styles.legalText}>• Request a copy of your data</Text>
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>6. Contact Us</Text>
            <Text style={styles.legalText}>
              If you have questions about this Privacy Policy, please contact us at:
            </Text>
            <Text style={styles.legalText}>Email: privacy@campusbite.com</Text>
            <Text style={styles.legalText}>Phone: +254 700 000 000</Text>
          </View>
        </ScrollView>
      </View>
    </View>
  )
);

// Terms of Service Modal Component
const TermsOfServiceModal = () => (
  showTermsOfService && (
    <View style={styles.modalOverlay}>
      <View style={styles.legalModalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Terms of Service</Text>
          <TouchableOpacity onPress={() => setShowTermsOfService(false)}>
            <Ionicons name="close-outline" size={24} color={COLORS.black} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          <Text style={styles.legalLastUpdated}>Last Updated: January 1, 2024</Text>
          
          <View style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.legalText}>
              By using CampusBite, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
            </Text>
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>2. Service Description</Text>
            <Text style={styles.legalText}>
              CampusBite is a food delivery platform that connects users with local vendors for campus food delivery services.
            </Text>
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>3. User Responsibilities</Text>
            <Text style={styles.legalText}>• Provide accurate and complete information</Text>
            <Text style={styles.legalText}>• Maintain the security of your account</Text>
            <Text style={styles.legalText}>• Use the service for lawful purposes only</Text>
            <Text style={styles.legalText}>• Respect vendors and delivery personnel</Text>
            <Text style={styles.legalText}>• Pay for all orders placed through the platform</Text>
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>4. Ordering and Payment</Text>
            <Text style={styles.legalText}>
              All orders are subject to availability and acceptance by vendors. Payment is processed securely through M-Pesa or other approved payment methods.
            </Text>
            <Text style={styles.legalText}>• Prices are subject to change without notice</Text>
            <Text style={styles.legalText}>• Delivery fees may apply based on location</Text>
            <Text style={styles.legalText}>• Orders can be cancelled before vendor confirmation</Text>
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>5. Delivery Services</Text>
            <Text style={styles.legalText}>
              Delivery times are estimates and may vary based on vendor preparation time, order volume, and other factors.
            </Text>
            <Text style={styles.legalText}>• We are not responsible for delays beyond our control</Text>
            <Text style={styles.legalText}>• Delivery personnel are independent contractors</Text>
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>6. Prohibited Activities</Text>
            <Text style={styles.legalText}>• Using the service for fraudulent purposes</Text>
            <Text style={styles.legalText}>• Interfering with or disrupting the service</Text>
            <Text style={styles.legalText}>• Violating applicable laws or regulations</Text>
            <Text style={styles.legalText}>• Harassing vendors or delivery personnel</Text>
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>7. Limitation of Liability</Text>
            <Text style={styles.legalText}>
              CampusBite shall not be liable for any indirect, incidental, or consequential damages arising from your use of our service.
            </Text>
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>8. Service Modifications</Text>
            <Text style={styles.legalText}>
              We reserve the right to modify or discontinue the service at any time without prior notice.
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  )
);

// Refund Policy Modal Component
const RefundPolicyModal = () => (
  showRefundPolicy && (
    <View style={styles.modalOverlay}>
      <View style={styles.legalModalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Refund Policy</Text>
          <TouchableOpacity onPress={() => setShowRefundPolicy(false)}>
            <Ionicons name="close-outline" size={24} color={COLORS.black} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          <Text style={styles.legalLastUpdated}>Last Updated: January 1, 2024</Text>
          
          <View style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>1. Refund Eligibility</Text>
            <Text style={styles.legalText}>
              Refunds are available under specific circumstances to ensure customer satisfaction while protecting our vendors and delivery partners.
            </Text>
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>2. Full Refund Scenarios</Text>
            <Text style={styles.legalText}>You may be eligible for a full refund if:</Text>
            <Text style={styles.legalText}>• Order was cancelled before vendor confirmation</Text>
            <Text style={styles.legalText}>• Items delivered are significantly different from ordered items</Text>
            <Text style={styles.legalText}>• Food quality issues reported within 30 minutes of delivery</Text>
            <Text style={styles.legalText}>• Order was never delivered due to platform error</Text>
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>3. Partial Refund Scenarios</Text>
            <Text style={styles.legalText}>Partial refunds may be issued for:</Text>
            <Text style={styles.legalText}>• Missing items from your order</Text>
            <Text style={styles.legalText}>• Incorrect item quantities</Text>
            <Text style={styles.legalText}>• Significant delivery delays (over 45 minutes)</Text>
            <Text style={styles.legalText}>• Minor food quality issues</Text>
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>4. Non-Refundable Situations</Text>
            <Text style={styles.legalText}>Refunds are not available for:</Text>
            <Text style={styles.legalText}>• Orders cancelled after vendor confirmation</Text>
            <Text style={styles.legalText}>• Customer provided incorrect delivery information</Text>
            <Text style={styles.legalText}>• Customer was unavailable to receive delivery</Text>
            <Text style={styles.legalText}>• Change of mind after order preparation</Text>
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>5. Refund Request Process</Text>
            <Text style={styles.legalText}>To request a refund:</Text>
            <Text style={styles.legalText}>1. Contact us within 1 hour of delivery</Text>
            <Text style={styles.legalText}>2. Provide order details and reason for refund</Text>
            <Text style={styles.legalText}>3. Include photo evidence if applicable</Text>
            <Text style={styles.legalText}>4. Wait for our review (typically within 24 hours)</Text>
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>6. Refund Methods</Text>
            <Text style={styles.legalText}>• M-Pesa refunds to original payment method</Text>
            <Text style={styles.legalText}>• CampusBite wallet credits for future orders</Text>
            <Text style={styles.legalText}>• Voucher codes for future use</Text>
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>7. Processing Time</Text>
            <Text style={styles.legalText}>
              Refund processing typically takes 3-5 business days, depending on your payment method and bank processing times.
            </Text>
          </View>

          <View style={styles.legalSection}>
            <Text style={styles.legalSectionTitle}>8. Contact for Refunds</Text>
            <Text style={styles.legalText}>
              For refund inquiries, please contact:
            </Text>
            <Text style={styles.legalText}>Email: refunds@campusbite.com</Text>
            <Text style={styles.legalText}>Phone: +254 700 000 000</Text>
            <Text style={styles.legalText}>Available: 24/7</Text>
          </View>
        </ScrollView>
      </View>
    </View>
  )
);

// Contact Form Modal Component
const ContactFormModal = () => (
  showContactForm && (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Contact Support</Text>
          <TouchableOpacity onPress={() => setShowContactForm(false)}>
            <Ionicons name="close-outline" size={24} color={COLORS.black} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          <Text style={styles.contactFormLabel}>Subject</Text>
          <TextInput 
            style={styles.contactFormInput} 
            value={contactSubject}
            onChangeText={setContactSubject}
            placeholder="What is this about?"
            placeholderTextColor={COLORS.gray}
          />
          
          <Text style={styles.contactFormLabel}>Message</Text>
          <TextInput 
            style={[styles.contactFormInput, styles.contactFormTextArea]}
            value={contactMessage}
            onChangeText={setContactMessage}
            placeholder="Describe your issue or question..."
            placeholderTextColor={COLORS.gray}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          
          <TouchableOpacity style={styles.sendButton} onPress={handleContactSupport} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.sendButtonText}>Send Message</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.contactFormInfo}>
            <Text style={styles.contactFormInfoText}>
              We typically respond within 24 hours. For urgent issues, please call our support line.
            </Text>
          </View>
        </ScrollView>
      </View>
    </View>
  )
);

  // Show loading state while user data is loading
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
  <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}>
    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" nestedScrollEnabled={true}>
      <ProfileHeader />
      <StatsSection />
      <RecentActivitySection />
      {/* Edit Profile - inlined to prevent focus loss on typing */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={() => setShowEditProfile(!showEditProfile)}>
            <Ionicons name={showEditProfile ? 'chevron-up-outline' : 'chevron-down-outline'} size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        
        {showEditProfile && (
          <View style={styles.editForm}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Enter your name" />
            
            <Text style={styles.label}>Phone Number</Text>
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="Enter phone number" />
            
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="Enter email" editable={false} />
            
            <TouchableOpacity style={styles.button} onPress={handleUpdateProfile} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save Changes</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>
      <SettingsSection />
      {/* Password Change - inlined to prevent focus loss on typing */}
      {showPasswordChange && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Password</Text>
          <View style={styles.passwordForm}>
            <TextInput 
              style={styles.input} 
              placeholder="Current password" 
              placeholderTextColor={COLORS.gray} 
              value={currentPw} 
              onChangeText={setCurrentPw} 
              secureTextEntry 
            />
            <TextInput 
              style={styles.input} 
              placeholder="New password" 
              placeholderTextColor={COLORS.gray} 
              value={newPw} 
              onChangeText={setNewPw} 
              secureTextEntry 
            />
            <TextInput 
              style={styles.input} 
              placeholder="Confirm new password" 
              placeholderTextColor={COLORS.gray} 
              value={confirmPw} 
              onChangeText={setConfirmPw} 
              secureTextEntry 
            />
            <TouchableOpacity style={styles.button} onPress={handleChangePassword} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update Password</Text>}
            </TouchableOpacity>
          </View>
        </View>
      )}
      <QuickActionsSection />
      
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={COLORS.danger} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
    
    {/* Modals */}
    <HelpSupportModal />
    <FAQModal />
    <LiveChatModal />
    <TutorialsModal />
    <PrivacyPolicyModal />
    <TermsOfServiceModal />
    <RefundPolicyModal />
    <ContactFormModal />
  </KeyboardAvoidingView>
);
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background, 
  },
  
  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
  
  // Profile Header
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: COLORS.white,
    margin: 12,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
    alignSelf: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  editImageOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 12,
    color: COLORS.gray,
  },
  
  // Simplified Stats Section
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.white,
    margin: 12,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  
  // Recent Activity Styles
  seeAllText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
  },
  activityFiltersContainer: {
    paddingHorizontal: 0,
    marginBottom: 12,
  },
  activityFilterBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  activityFilterBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  activityFilterText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
  },
  activityFilterTextActive: {
    color: COLORS.white,
  },
  recentActivityContainer: {
    marginTop: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    marginBottom: 8,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 2,
  },
  activityVendor: {
    fontSize: 12,
    color: COLORS.primary,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: COLORS.gray,
  },
  activityStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  loadMoreText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '500',
    marginRight: 6,
  },
  
  // Section Styles
  section: {
    backgroundColor: COLORS.white,
    margin: 12,
    marginTop: 0,
    marginBottom: 8,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  
    
  // Edit Profile Form
  editForm: {
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
  
  // Settings
  settingsForm: {
    marginTop: 8,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    color: COLORS.black,
    marginLeft: 10,
  },
  
  // Quick Actions
  quickActionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAction: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: COLORS.black,
    marginLeft: 10,
    fontWeight: '500',
  },
  
  // Password Form
  passwordForm: {
    marginTop: 8,
  },
  
  // Logout Button
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
    margin: 12,
    marginBottom: 20,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.danger,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  logoutText: {
    color: COLORS.danger,
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
  },
  
  // Modal Styles
  scrollView: {
    flex: 1,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    elevation: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  
  // Help & Support Styles
  helpSection: {
    marginBottom: 24,
  },
  helpSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 12,
  },
  helpOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    marginBottom: 8,
  },
  helpOptionText: {
    fontSize: 14,
    color: COLORS.black,
    marginLeft: 12,
    flex: 1,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  contactText: {
    fontSize: 14,
    color: COLORS.black,
    marginLeft: 12,
  },
  appInfo: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 10,
  },
  appVersion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  appDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    color: COLORS.gray,
  },
  
  // FAQ Styles
  faqCategory: {
    marginBottom: 20,
  },
  faqCategoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
  },
  faqItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: 6,
  },
  faqItemQuestion: {
    fontSize: 14,
    color: COLORS.black,
    flex: 1,
    marginRight: 8,
  },
  faqDetail: {
    padding: 16,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 8,
  },
  
  // Contact Form Styles
  contactFormLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 6,
    fontWeight: '500',
  },
  contactFormInput: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  contactFormTextArea: {
    height: 120,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  sendButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  contactFormInfo: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 8,
  },
  contactFormInfoText: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 16,
  },
  
  // Additional Help & Support Styles
  chatStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  emergencyOption: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  ratingContainer: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 10,
  },
  ratingLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 12,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  
  // FAQ Search Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 12,
  },
  noResultsText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    padding: 20,
  },
  
  // Live Chat Styles
  chatModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '90%',
    height: '70%',
    elevation: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatStatusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  chatStatusText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
  },
  chatMessagesContainer: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  chatMessages: {
    flex: 1,
    padding: 16,
  },
  chatWelcome: {
    alignItems: 'center',
    padding: 40,
  },
  chatWelcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  chatWelcomeSubtext: {
    fontSize: 14,
    color: COLORS.gray,
  },
  chatMessage: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userMessage: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  supportMessage: {
    backgroundColor: COLORS.background,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  chatMessageText: {
    fontSize: 14,
    color: COLORS.black,
  },
  chatMessageTime: {
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 4,
  },
  chatInputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  chatInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 100,
  },
  chatSendButton: {
    backgroundColor: COLORS.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Tutorials Styles
  tutorialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    marginBottom: 12,
  },
  tutorialIcon: {
    backgroundColor: COLORS.white,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tutorialInfo: {
    flex: 1,
  },
  tutorialTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  tutorialDescription: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
  },
  tutorialMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tutorialDuration: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
    marginRight: 12,
  },
  tutorialSteps: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
  },
  
  // Legal Document Styles
  legalModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    width: '95%',
    height: '85%',
    elevation: 10,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  legalLastUpdated: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  legalSection: {
    marginBottom: 24,
  },
  legalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 12,
  },
  legalSubTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    marginTop: 12,
    marginBottom: 8,
  },
  legalText: {
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 20,
    marginBottom: 8,
  },
});
