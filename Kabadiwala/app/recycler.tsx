import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Typography } from '@/components/ui/Typography';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  getSession,
  getUser,
  saveUser,
  getRecyclerRates,
  saveRecyclerRate,
  deleteRecyclerRate,
  getOrdersForUser,
  updateOrderStatus,
  UserProfile,
  RecyclerRate,
  Order,
} from '@/utils/db';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/theme';
import { ProfileModal } from '@/components/ui/ProfileModal';

const MASTER_MATERIALS = [
  { id: 'copper', nameEn: 'Copper' },
  { id: 'gold', nameEn: 'Gold' },
  { id: 'silver', nameEn: 'Silver' },
  { id: 'aluminum', nameEn: 'Aluminum' },
  { id: 'iron', nameEn: 'Iron / Steel' },
  { id: 'brass', nameEn: 'Brass' },
  { id: 'plastic_pet', nameEn: 'Plastic (PET Bottles)' },
  { id: 'plastic_hdpe', nameEn: 'Plastic (HDPE)' },
  { id: 'ewaste_laptop', nameEn: 'E-Waste (Laptops)' },
  { id: 'ewaste_mobile', nameEn: 'E-Waste (Mobile Phones)' },
  { id: 'ewaste_pcb', nameEn: 'E-Waste (Circuit Boards)' },
  { id: 'paper_newspaper', nameEn: 'Paper (Newspaper)' },
  { id: 'paper_cardboard', nameEn: 'Paper (Cardboard/Carton)' },
  { id: 'glass_bottles', nameEn: 'Glass (Bottles)' },
];

export default function RecyclerScreen() {
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'rates' | 'orders'>('rates');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [location, setLocation] = useState<any>(null);

  const [rates, setRates] = useState<RecyclerRate[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const [selectedMat, setSelectedMat] = useState(MASTER_MATERIALS[0]);
  const [customRate, setCustomRate] = useState('');
  const [rateUnit, setRateUnit] = useState('kg');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const phone = await getSession();
    if (!phone) {
      router.replace('/');
      return;
    }
    const user = await getUser(phone);
    if (user) {
      setUserProfile(user);
      if (!user.companyName) {
        setShowOnboarding(true);
      } else {
        loadRates(phone);
        loadOrders(phone);
      }
    }
  };

  const loadRates = async (phone: string) => {
    const data = await getRecyclerRates(phone);
    setRates(data);
  };

  const loadOrders = async (phone: string) => {
    const data = await getOrdersForUser(phone, 'recycler');
    setOrders(data);
  };

  const handleFetchLocation = async () => {
    setIsLocating(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Allow location to proceed.');
        setIsLocating(false);
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      Alert.alert('Success', 'Location fetched successfully.');
    } catch (e) {
      Alert.alert('Error', 'Could not fetch location.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSaveOnboarding = async () => {
    if (!companyName || !location) {
      Alert.alert('Required', 'Please enter company name and fetch location.');
      return;
    }
    if (userProfile) {
      const updated = { ...userProfile, companyName, location };
      await saveUser(updated);
      setUserProfile(updated);
      setShowOnboarding(false);
      loadRates(updated.phoneNumber);
      loadOrders(updated.phoneNumber);
    }
  };

  const handleAddRate = async () => {
    if (!customRate) return;
    if (userProfile) {
      const newRate: RecyclerRate = {
        id: selectedMat.id,
        nameEn: selectedMat.nameEn,
        nameHi: selectedMat.nameEn, // Keeping same since we dropped Hindi
        rate: parseFloat(customRate),
        rateUnit: rateUnit,
      };
      await saveRecyclerRate(userProfile.phoneNumber, newRate);
      setCustomRate('');
      setShowAddModal(false);
      loadRates(userProfile.phoneNumber);
    }
  };

  const handleDeleteRate = async (rateId: string) => {
    if (userProfile) {
      await deleteRecyclerRate(userProfile.phoneNumber, rateId);
      loadRates(userProfile.phoneNumber);
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'completed');
    if (userProfile) loadOrders(userProfile.phoneNumber);
  };

  const handleLogout = async () => {
    await clearSession();
    router.replace('/');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]}>
      <View style={[styles.topBar, { backgroundColor: currentColors.surface, borderBottomColor: currentColors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
            <IconSymbol name="chevron.left" size={24} color={currentColors.text} />
          </TouchableOpacity>
          <View style={styles.brandContainer}>
            <Typography variant="labelAction" color={currentColors.secondary} style={{ fontWeight: '800' }}>
              KabadiWala Connect
            </Typography>
            <Typography variant="labelBadge" color={currentColors.icon}>
              Recycler
            </Typography>
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowProfile(true)} style={{ padding: 4 }}>
          <IconSymbol name="person.crop.circle" size={30} color={currentColors.secondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'rates' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <Typography variant="headlineMd" style={{ fontWeight: '800' }}>
                Your Accepted Materials
              </Typography>
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: currentColors.secondary }]} onPress={() => setShowAddModal(true)}>
                <IconSymbol name="plus" size={16} color="#FFF" />
                <Typography variant="labelAction" color="#FFF" style={{ marginLeft: 6 }}>
                  Add New
                </Typography>
              </TouchableOpacity>
            </View>

            {rates.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
                <Typography variant="bodyLg" color={currentColors.icon}>No materials added yet.</Typography>
              </View>
            ) : (
              rates.map(r => (
                <View key={r.id} style={[styles.rateCard, { backgroundColor: currentColors.surface }]}>
                  <View style={{ flex: 1 }}>
                    <Typography variant="bodyLg" style={{ fontWeight: '700' }}>
                      {r.nameEn}
                    </Typography>
                    <Typography variant="bodyMd" color={currentColors.secondary} style={{ marginTop: 4 }}>
                      ₹ {r.rate} / {r.rateUnit}
                    </Typography>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteRate(r.id)} style={{ padding: 8 }}>
                    <IconSymbol name="trash.fill" size={20} color={currentColors.error} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'orders' && (
          <View>
            <Typography variant="headlineMd" style={{ fontWeight: '800', marginBottom: 16 }}>
              Incoming Orders
            </Typography>

            {orders.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
                <Typography variant="bodyLg" color={currentColors.icon}>No new orders right now.</Typography>
              </View>
            ) : (
              orders.map(o => (
                <View key={o.id} style={[styles.orderCard, { backgroundColor: currentColors.surface }]}>
                  <View style={[styles.orderHeader, { borderBottomColor: currentColors.border }]}>
                    <Typography variant="bodyMd" color={currentColors.icon}>ID: {o.id.slice(-6)}</Typography>
                    <View style={[styles.badge, o.status === 'completed' && { backgroundColor: currentColors.successBackground }]}>
                      <Typography variant="labelBadge" color={o.status === 'completed' ? currentColors.successBorder : currentColors.tertiary}>
                        {o.status.toUpperCase()}
                      </Typography>
                    </View>
                  </View>
                  <Typography variant="bodyLg" style={{ fontWeight: '700', marginTop: 12 }}>
                    Kabadiwala Phone: {o.kabadiwalaPhone}
                  </Typography>
                  <Typography variant="headlineMd" color={currentColors.secondary} style={{ fontWeight: '800', marginTop: 8 }}>
                    Total: ₹ {o.totalValue}
                  </Typography>
                  
                  {o.status === 'pending' && (
                    <TouchableOpacity style={[styles.completeBtn, { backgroundColor: currentColors.primary }]} onPress={() => handleCompleteOrder(o.id)}>
                      <IconSymbol name="checkmark.circle.fill" size={18} color={currentColors.onPrimary} />
                      <Typography variant="labelAction" color={currentColors.onPrimary} style={{ marginLeft: 6 }}>
                        Complete Order
                      </Typography>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Nav */}
      <View style={[styles.bottomNav, { backgroundColor: currentColors.surface, borderTopColor: currentColors.border }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('rates')}>
          <IconSymbol name="list.bullet.clipboard" size={24} color={activeTab === 'rates' ? currentColors.secondary : currentColors.icon} />
          <Typography variant="labelBadge" color={activeTab === 'rates' ? currentColors.secondary : currentColors.icon} style={{ marginTop: 4 }}>
            My Rates
          </Typography>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('orders')}>
          <IconSymbol name="shippingbox.fill" size={24} color={activeTab === 'orders' ? currentColors.secondary : currentColors.icon} />
          <Typography variant="labelBadge" color={activeTab === 'orders' ? currentColors.secondary : currentColors.icon} style={{ marginTop: 4 }}>
            Orders
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Onboarding Modal */}
      <Modal visible={showOnboarding} animationType="slide">
        <SafeAreaView style={[styles.modalSafeArea, { backgroundColor: currentColors.background }]}>
          <View style={styles.modalContent}>
            <Typography variant="headlineLg" style={{ fontWeight: '800', marginBottom: 24 }}>
              Set Up Your Business
            </Typography>

            <Typography variant="labelAction" color={currentColors.icon} style={{ marginBottom: 8 }}>
              Company Name
            </Typography>
            <TextInput
              style={[styles.input, { color: currentColors.text, borderColor: currentColors.border }]}
              value={companyName}
              onChangeText={setCompanyName}
              placeholder="e.g. EcoRecycle Metal Yard"
              placeholderTextColor={currentColors.icon}
            />

            <TouchableOpacity style={[styles.locationBtn, { backgroundColor: currentColors.surfaceVariant }]} onPress={handleFetchLocation} disabled={isLocating}>
              {isLocating ? <ActivityIndicator color={currentColors.onSurfaceVariant} /> : <IconSymbol name="location.fill" size={20} color={currentColors.onSurfaceVariant} />}
              <Typography variant="labelAction" color={currentColors.onSurfaceVariant} style={{ marginLeft: 8 }}>
                {location ? 'Location Fetched!' : 'Fetch Location'}
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: currentColors.secondary }]} onPress={handleSaveOnboarding}>
              <Typography variant="labelAction" color="#FFF">Save Profile</Typography>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Add Rate Modal */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.dialog, { backgroundColor: currentColors.surface }]}>
            <Typography variant="headlineMd" style={{ fontWeight: '800', marginBottom: 16 }}>
              Add Material Rate
            </Typography>
            
            <ScrollView style={{ maxHeight: 200, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {MASTER_MATERIALS.map(m => (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.pill,
                      { backgroundColor: currentColors.background },
                      selectedMat.id === m.id && [styles.pillActive, { backgroundColor: currentColors.secondary + '20', borderColor: currentColors.secondary }]
                    ]}
                    onPress={() => setSelectedMat(m)}
                  >
                    <Typography variant="bodyMd" color={selectedMat.id === m.id ? currentColors.secondary : currentColors.icon}>
                      {m.nameEn}
                    </Typography>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TextInput
              style={[styles.input, { color: currentColors.text, borderColor: currentColors.border }]}
              value={customRate}
              onChangeText={setCustomRate}
              placeholder="Price (e.g. 150)"
              placeholderTextColor={currentColors.icon}
              keyboardType="numeric"
            />
            
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
              <TouchableOpacity style={[styles.dialogBtn, { backgroundColor: currentColors.background, borderColor: currentColors.border, borderWidth: 1 }]} onPress={() => setShowAddModal(false)}>
                <Typography variant="labelAction" color={currentColors.text}>Cancel</Typography>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dialogBtn, { backgroundColor: currentColors.secondary }]} onPress={handleAddRate}>
                <Typography variant="labelAction" color="#FFF">Save</Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Profile Modal */}
      {userProfile && (
        <ProfileModal
          visible={showProfile}
          onClose={() => setShowProfile(false)}
          name={userProfile.companyName || ''}
          phone={userProfile.phoneNumber}
          role="recycler"
        />
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  brandContainer: { flexDirection: 'row', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  addBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  rateCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  badge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completeBtn: {
    backgroundColor: '#15803D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  emptyCard: {
    padding: 24,
    backgroundColor: '#FFF',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  navItem: { flex: 1, alignItems: 'center' },
  modalSafeArea: { flex: 1, backgroundColor: '#FFF' },
  modalContent: { flex: 1, padding: 24, justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  locationBtn: {
    backgroundColor: '#0F172A',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: '#0284C7',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  dialog: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 16,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  pillActive: {
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#0284C7',
  },
  dialogBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});
