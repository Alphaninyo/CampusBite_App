import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants';
import useCartStore from '../../stores/cartStore';

export default function CartScreen({ navigation }) {
  const { cartItems, totalAmount, itemCount, loading, updateQuantity, removeFromCart, loadCart } = useCartStore();

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleRemoveItem = (itemId) => {
    console.log('Attempting to remove item with ID:', itemId);
    console.log('Current cart items:', cartItems);
    
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Calling removeFromCart with ID:', itemId);
              
              // Try the store method first
              await removeFromCart(itemId);
              console.log('Item removed successfully');
              Alert.alert('Success', 'Item removed from cart');
              
            } catch (error) {
              console.error('Error removing item:', error);
              
              // Fallback: Direct manipulation
              try {
                const { cartItems } = useCartStore.getState();
                const updatedItems = cartItems.filter(item => item.id !== itemId);
                console.log('Fallback: Filtering items directly:', updatedItems);
                
                // Update store directly
                useCartStore.getState().saveCart(updatedItems);
                Alert.alert('Success', 'Item removed from cart (fallback method)');
                
              } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                Alert.alert('Error', `Failed to remove item: ${error.message}`);
              }
            }
          }
        }
      ]
    );
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      updateQuantity(itemId, newQuantity);
    } catch (error) {
      Alert.alert('Error', 'Failed to update quantity. Please try again.');
    }
  };

  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Cart Empty', 'Please add items to your cart before checkout');
      return;
    }
    
    // Check if Checkout screen exists, otherwise show a message
    try {
      navigation.navigate('Checkout');
    } catch (error) {
      Alert.alert(
        'Checkout Coming Soon',
        'Checkout functionality is being developed. Your cart items are saved and ready for checkout.',
        [{ text: 'OK', onPress: () => {} }]
      );
    }
  };

  const CartItemCard = ({ item }) => (
    <View style={styles.cartItem}>
      <Image 
        source={{ uri: item.image || 'https://via.placeholder.com/60x60/FF6B6B/FFFFFF?text=Food' }} 
        style={styles.itemImage}
        defaultSource={{ uri: 'https://via.placeholder.com/60x60/FF6B6B/FFFFFF?text=Food' }}
      />
      <View style={styles.itemDetails}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.vendorName}>{item.vendor_name || 'Vendor'}</Text>
        <Text style={styles.itemPrice}>KES {item.price}</Text>
        <Text style={styles.itemTotal}>Total: KES {item.price * item.quantity}</Text>
      </View>
      <View style={styles.itemActions}>
        <View style={styles.quantityControls}>
          <TouchableOpacity 
            style={[styles.quantityBtn, item.quantity <= 1 && styles.quantityBtnDisabled]}
            onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
            disabled={item.quantity <= 1}
          >
            <Ionicons name="remove-outline" size={18} color={item.quantity <= 1 ? COLORS.gray : COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity 
            style={styles.quantityBtn}
            onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
          >
            <Ionicons name="add-outline" size={18} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity 
          style={styles.removeBtn}
          onPress={() => handleRemoveItem(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={COLORS.gray} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add items from vendors to get started</Text>
          <TouchableOpacity 
            style={styles.shopBtn}
            onPress={() => navigation.navigate('HomeTab')}
          >
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cartContent}>
          <FlatList
            data={cartItems}
            renderItem={({ item }) => <CartItemCard item={item} />}
            keyExtractor={(item) => item.id.toString()}
            style={styles.cartList}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              <View style={styles.summarySection}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>KES {totalAmount}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery Fee</Text>
                  <Text style={styles.summaryValue}>KES 150</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>KES {totalAmount + 150}</Text>
                </View>
              </View>
            }
          />
          
          <View style={styles.checkoutSection}>
            <TouchableOpacity 
              style={styles.checkoutBtn}
              onPress={proceedToCheckout}
            >
              <Text style={styles.checkoutBtnText}>
                Proceed to Checkout ({cartItems.length} items)
              </Text>
              <Text style={styles.checkoutBtnAmount}>
                KES {totalAmount + 150}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 32,
  },
  shopBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  shopBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  cartContent: {
    flex: 1,
  },
  cartList: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  cartItem: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: COLORS.iconBg,
  },
  itemDetails: {
    flex: 1,
    marginRight: 8,
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 2,
  },
  vendorName: {
    fontSize: 12,
    color: COLORS.gray,
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  itemTotal: {
    fontSize: 12,
    color: COLORS.black,
    fontWeight: '600',
    marginTop: 2,
  },
  itemActions: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.iconBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBtnDisabled: {
    backgroundColor: COLORS.lightGray,
    opacity: 0.5,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.black,
    marginHorizontal: 8,
  },
  removeBtn: {
    padding: 6,
    alignSelf: 'center',
  },
  summarySection: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.borderWarm,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.black,
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderWarm,
    paddingTop: 10,
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  checkoutSection: {
    backgroundColor: COLORS.white,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderWarm,
  },
  checkoutBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  checkoutBtnAmount: {
    color: COLORS.white,
    fontSize: 12,
    opacity: 0.9,
  },
});
