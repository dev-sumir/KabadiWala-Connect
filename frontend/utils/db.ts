import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/utils/firebase';

export interface UserProfile {
  phoneNumber: string;
  role: 'kabadiwala' | 'recycler';
  createdAt: string;
  updatedAt?: string;
  name?: string; // Used by Kabadiwala
  // Recycler specific fields
  companyName?: string;
  location?: { latitude: number; longitude: number };
  address?: string;
}

export interface InventoryMaterial {
  nameEn: string;
  nameHi: string;
  weightGrams: number;
  rate: number;
  rateUnit: string;
  estimatedValue: number;
}

export interface InventoryItem {
  id: string;
  titleEn: string;
  titleHi: string;
  totalWeightGrams: number;
  totalEstimatedValue: number;
  materials: InventoryMaterial[];
  imageUri?: string;
  createdAt: string;
}

export interface RecyclerRate {
  id: string;
  nameEn: string;
  nameHi: string;
  rate: number;
  rateUnit: string;
}

export interface Order {
  id: string;
  kabadiwalaPhone: string;
  recyclerPhone: string;
  items: InventoryItem[];
  totalValue: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

const USERS_KEY = '@users_db';
const CURRENT_SESSION_KEY = '@current_session';
const INVENTORY_PREFIX = '@inventory_';

/**
 * Get all users stored locally in AsyncStorage
 */
export const getAllLocalUsers = async (): Promise<Record<string, UserProfile>> => {
  try {
    const data = await AsyncStorage.getItem(USERS_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.warn('Error fetching local users:', error);
    return {};
  }
};

/**
 * Save user locally to AsyncStorage
 */
export const saveUserLocally = async (user: UserProfile): Promise<void> => {
  try {
    const users = await getAllLocalUsers();
    users[user.phoneNumber] = user;
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch (error) {
    console.warn('Error saving user locally:', error);
  }
};

/**
 * Get a user by phone number (Offline-First)
 */
export const getUser = async (phoneNumber: string): Promise<UserProfile | null> => {
  const localUsers = await getAllLocalUsers();
  const cachedUser = localUsers[phoneNumber] || null;

  try {
    const cloudFetchPromise = (async () => {
      const userDocRef = doc(db, 'users', phoneNumber);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const cloudUser = docSnap.data() as UserProfile;
        await saveUserLocally(cloudUser);
        return cloudUser;
      }
      return null;
    })();

    const timeoutPromise = new Promise<null>((resolve) => 
      setTimeout(() => resolve(null), 2500)
    );

    const result = await Promise.race([cloudFetchPromise, timeoutPromise]);
    if (result) {
      return result;
    }
  } catch (err) {
    console.log('Operating in offline mode:', err);
  }

  return cachedUser;
};

/**
 * Create or update a user profile
 */
export const saveUser = async (user: UserProfile): Promise<void> => {
  const updatedUser: UserProfile = {
    ...user,
    updatedAt: new Date().toISOString(),
  };

  await saveUserLocally(updatedUser);

  try {
    const userDocRef = doc(db, 'users', user.phoneNumber);
    await setDoc(userDocRef, updatedUser, { merge: true });
  } catch (error) {
    console.warn('Saved user locally. Will sync to cloud when online:', error);
  }
};

/**
 * Save current active session
 */
export const saveSession = async (phoneNumber: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(CURRENT_SESSION_KEY, phoneNumber);
  } catch (error) {
    console.error('Error saving session:', error);
  }
};

/**
 * Get current active session
 */
export const getSession = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(CURRENT_SESSION_KEY);
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

/**
 * Clear current active session (Logout)
 */
export const clearSession = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(CURRENT_SESSION_KEY);
  } catch (error) {
    console.error('Error clearing session:', error);
  }
};

// ==========================================
// INVENTORY MANAGEMENT (Offline-First)
// ==========================================

/**
 * Get local inventory for a phone number
 */
export const getLocalInventory = async (phoneNumber: string): Promise<InventoryItem[]> => {
  try {
    const data = await AsyncStorage.getItem(`${INVENTORY_PREFIX}${phoneNumber}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.warn('Error reading local inventory:', error);
    return [];
  }
};

/**
 * Save local inventory list
 */
export const saveLocalInventory = async (phoneNumber: string, items: InventoryItem[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(`${INVENTORY_PREFIX}${phoneNumber}`, JSON.stringify(items));
  } catch (error) {
    console.warn('Error saving local inventory:', error);
  }
};

/**
 * Get user inventory (Offline-First: Local Cache + Firestore Sync)
 */
export const getInventory = async (phoneNumber: string): Promise<InventoryItem[]> => {
  const localItems = await getLocalInventory(phoneNumber);

  try {
    const cloudFetch = async () => {
      const colRef = collection(db, 'users', phoneNumber, 'inventory');
      const snap = await getDocs(colRef);
      const items: InventoryItem[] = [];
      snap.forEach((doc) => {
        items.push(doc.data() as InventoryItem);
      });
      if (items.length > 0) {
        await saveLocalInventory(phoneNumber, items);
        return items;
      }
      return null;
    };

    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
    const cloudResult = await Promise.race([cloudFetch(), timeout]);
    if (cloudResult) return cloudResult;
  } catch (e) {
    console.log('Using local inventory cache:', e);
  }

  return localItems;
};

/**
 * Add an item to user's inventory
 */
export const addInventoryItem = async (phoneNumber: string, item: InventoryItem): Promise<void> => {
  // 1. Save locally immediately
  const localItems = await getLocalInventory(phoneNumber);
  const updatedItems = [item, ...localItems];
  await saveLocalInventory(phoneNumber, updatedItems);

  // 2. Sync with cloud Firestore
  try {
    const docRef = doc(db, 'users', phoneNumber, 'inventory', item.id);
    await setDoc(docRef, item);
    console.log('Inventory item synced to Firestore!');
  } catch (e) {
    console.warn('Item stored locally; will sync to cloud when online:', e);
  }
};

/**
 * Delete an item from inventory
 */
export const deleteInventoryItem = async (phoneNumber: string, itemId: string): Promise<void> => {
  const localItems = await getLocalInventory(phoneNumber);
  const updated = localItems.filter((i) => i.id !== itemId);
  await saveLocalInventory(phoneNumber, updated);

  try {
    const docRef = doc(db, 'users', phoneNumber, 'inventory', itemId);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('Deleted locally; cloud delete queued:', e);
  }
};

// ==========================================
// RECYCLER & B2B MARKETPLACE
// ==========================================

export const getAllRecyclers = async (): Promise<UserProfile[]> => {
  try {
    const colRef = collection(db, 'users');
    const snap = await getDocs(colRef);
    const recyclers: UserProfile[] = [];
    snap.forEach((doc) => {
      const data = doc.data() as UserProfile;
      if (data.role === 'recycler' && data.companyName) {
        recyclers.push(data);
      }
    });
    return recyclers;
  } catch (error) {
    console.error('Error fetching recyclers:', error);
    return [];
  }
};

export const getRecyclerRates = async (phoneNumber: string): Promise<RecyclerRate[]> => {
  try {
    const colRef = collection(db, 'users', phoneNumber, 'rates');
    const snap = await getDocs(colRef);
    const rates: RecyclerRate[] = [];
    snap.forEach((doc) => {
      rates.push(doc.data() as RecyclerRate);
    });
    return rates;
  } catch (error) {
    console.error('Error fetching recycler rates:', error);
    return [];
  }
};

export const saveRecyclerRate = async (phoneNumber: string, rate: RecyclerRate): Promise<void> => {
  try {
    const docRef = doc(db, 'users', phoneNumber, 'rates', rate.id);
    await setDoc(docRef, rate);
  } catch (error) {
    console.error('Error saving recycler rate:', error);
  }
};

export const deleteRecyclerRate = async (phoneNumber: string, rateId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'users', phoneNumber, 'rates', rateId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting recycler rate:', error);
  }
};

export const createOrder = async (order: Order): Promise<void> => {
  try {
    const docRef = doc(db, 'orders', order.id);
    await setDoc(docRef, order);
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
};

export const getOrdersForUser = async (phoneNumber: string, role: 'kabadiwala' | 'recycler'): Promise<Order[]> => {
  try {
    const colRef = collection(db, 'orders');
    const snap = await getDocs(colRef);
    const orders: Order[] = [];
    snap.forEach((doc) => {
      const order = doc.data() as Order;
      if (role === 'kabadiwala' && order.kabadiwalaPhone === phoneNumber) {
        orders.push(order);
      } else if (role === 'recycler' && order.recyclerPhone === phoneNumber) {
        orders.push(order);
      }
    });
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

export const updateOrderStatus = async (orderId: string, status: 'pending' | 'completed' | 'cancelled'): Promise<void> => {
  try {
    const docRef = doc(db, 'orders', orderId);
    await setDoc(docRef, { status, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};
