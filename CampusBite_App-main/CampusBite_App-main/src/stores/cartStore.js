import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const useCartStore = create((set, get) => ({
  cartItems: [],
  totalAmount: 0,
  itemCount: 0,
  vendorId: null,
  vendorName: null,
  loading: false,

  // Load cart from storage (only used on fresh app start)
  loadCart: async () => {
    const { cartItems } = get();
    // Skip if store already has items (hydrated during same session)
    if (cartItems.length > 0) return;
    set({ loading: true });
    try {
      const storedCart = await AsyncStorage.getItem('cart');
      if (storedCart) {
        const cartData = JSON.parse(storedCart);
        set({
          cartItems:  cartData.items      || [],
          totalAmount: cartData.totalAmount || 0,
          itemCount:   cartData.itemCount   || 0,
          vendorId:    cartData.vendorId    || null,
          vendorName:  cartData.vendorName  || null,
        });
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      set({ loading: false });
    }
  },

  // Save cart to storage
  saveCart: async (items, vendorId, vendorName) => {
    try {
      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount   = items.reduce((sum, item) => sum + item.quantity, 0);
      // Preserve existing vendor info if not explicitly provided
      const state = get();
      const vid   = vendorId   !== undefined ? vendorId   : state.vendorId;
      const vname = vendorName !== undefined ? vendorName : state.vendorName;

      const cartData = {
        items,
        totalAmount,
        itemCount,
        vendorId:   vid,
        vendorName: vname,
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem('cart', JSON.stringify(cartData));
      set({ cartItems: items, totalAmount, itemCount, vendorId: vid, vendorName: vname });
    } catch (error) {
      console.error('Error saving cart:', error);
    }
  },

  // Add item to cart
  addToCart: async (item) => {
    const { cartItems } = get();
    const existingItemIndex = cartItems.findIndex(cartItem => cartItem.id === item.id);
    
    let updatedItems;
    if (existingItemIndex >= 0) {
      // Update quantity if item exists
      updatedItems = cartItems.map((cartItem, index) => 
        index === existingItemIndex 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      );
    } else {
      // Add new item
      updatedItems = [...cartItems, { ...item, quantity: 1 }];
    }
    
    // Capture vendor info from the item so checkout has a vendor_id
    const vid   = item.vendor_id   ?? get().vendorId ?? undefined;
    const vname = item.vendor_name ?? get().vendorName ?? undefined;
    await get().saveCart(updatedItems, vid, vname);
  },

  // Update item quantity
  updateQuantity: async (itemId, quantity) => {
    if (quantity < 1) return;
    
    const { cartItems } = get();
    const updatedItems = cartItems.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    );
    
    await get().saveCart(updatedItems);
  },

  // Remove item from cart
  removeFromCart: async (itemId) => {
    console.log('removeFromCart called with itemId:', itemId);
    const { cartItems } = get();
    console.log('Current cart items before removal:', cartItems);
    
    // Check if item exists
    const itemExists = cartItems.some(item => item.id === itemId);
    console.log('Item exists in cart:', itemExists);
    
    if (!itemExists) {
      console.error('Item not found in cart with ID:', itemId);
      throw new Error('Item not found in cart');
    }
    
    const updatedItems = cartItems.filter(item => item.id !== itemId);
    console.log('Cart items after removal:', updatedItems);
    
    try {
      await get().saveCart(updatedItems);
      console.log('Item removed successfully from cart');
    } catch (error) {
      console.error('Error saving cart after removal:', error);
      throw error;
    }
  },

  // Clear entire cart
  clearCart: async () => {
    try {
      await AsyncStorage.removeItem('cart');
      set({ cartItems: [], totalAmount: 0, itemCount: 0, vendorId: null, vendorName: null });
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  },

  // Get cart items by vendor
  getItemsByVendor: (vendorId) => {
    const { cartItems } = get();
    return cartItems.filter(item => item.vendor_id === vendorId);
  },
}));

export default useCartStore;
