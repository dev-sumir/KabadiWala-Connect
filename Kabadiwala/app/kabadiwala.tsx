import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import ActiveOrderMap from '@/components/Map/ActiveOrderMap';
import { Typography } from '@/components/ui/Typography';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  getSession,
  clearSession,
  getInventory,
  deleteInventoryItem,
  getAllRecyclers,
  createOrder,
  getOrdersForUser,
  InventoryItem,
  UserProfile,
  Order,
  saveUser,
  getUser,
  getRecyclerRates,
  RecyclerRate,
} from '@/utils/db';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/theme';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ListenButton } from '@/components/ui/ListenButton';
import { ProfileModal } from '@/components/ui/ProfileModal';

const content = {
  hi: {
    nav: {
      scan: 'स्कैन',
      items: 'मेरा सामान',
      rate: 'आज का भाव',
      buyer: 'खरीदार',
      orders: 'ऑर्डर्स',
    },
    itemsHeader: 'मेरा सामान',
    itemsEmpty: 'आपकी इन्वेंटरी में अभी कोई सामान नहीं है।',
    itemsEmptySub: 'स्क्रैप या ई-वेस्ट को स्कैन करके कीमती धातुओं का पता लगाएं और यहां जोड़ें।',
    scanNow: 'स्कैन करें',
    totalItems: 'कुल सामान',
    totalWeight: 'कुल वजन',
    totalValue: 'कुल कमाई',
    deleteConfirm: 'क्या आप इस सामान को हटाना चाहते हैं?',
    delete: 'हटाएं',
    cancel: 'रद्द करें',
    ratesHeader: 'आज का बाजार भाव',
    ratesSub: 'ताजा धातु भाव - बाजार दरों के अनुसार दैनिक अपडेट',
    buyerHeader: 'सत्यापित रीसायकल खरीदार',
    buyerSub: 'आपके नजदीकी बड़े डीलर और रीसाइक्लिंग केंद्र',
    callBuyer: 'कॉल करें',
    logout: 'लॉगआउट',
    locating: 'लोकेशन ढूंढी जा रही है...',
    locationDenied: 'लोकेशन की अनुमति नहीं दी गई।',
    buyersNear: 'आपके आस-पास के खरीदार:',
  },
  en: {
    nav: {
      scan: 'Scan',
      items: 'My Items',
      rate: "Today's Rate",
      buyer: 'Buyer',
      orders: 'Orders',
    },
    itemsHeader: 'My Items',
    itemsEmpty: 'No items in your inventory yet.',
    itemsEmptySub: 'Scan scrap or e-waste to analyze precious metals and save them here.',
    scanNow: 'Scan Item',
    totalItems: 'Total Items',
    totalWeight: 'Total Weight',
    totalValue: 'Total Value',
    deleteConfirm: 'Do you want to delete this item?',
    delete: 'Delete',
    cancel: 'Cancel',
    ratesHeader: "Today's Market Rates",
    ratesSub: 'Live scrap metal rates updated daily',
    buyerHeader: 'Verified Recycling Buyers',
    buyerSub: 'Nearby authorized scrap and e-waste processing yards',
    callBuyer: 'Call Buyer',
    logout: 'Logout',
    locating: 'Locating...',
    locationDenied: 'Location permission denied.',
    buyersNear: 'Buyers Near',
    bookNow: 'Book Order',
    activeOrder: 'Active Order Tracking',
    onboardingTitle: 'Complete Your Profile',
    onboardingName: 'Your Name',
    onboardingLoc: 'Fetch Home Location',
    saveProfile: 'Save Profile',
    ordersTitle: 'My Orders',
    pastOrders: 'Past Orders',
    noOrders: 'No orders found.',
  },
};

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return (R * c).toFixed(1);
};

const MARKET_RATES = [
  { nameEn: 'Copper', nameHi: 'तांबा', rate: '780.00', unit: 'kg', icon: 'sparkles' },
  { nameEn: 'Gold', nameHi: 'सोना', rate: '7,250.00', unit: 'g', icon: 'star.fill' },
  { nameEn: 'Silver', nameHi: 'चांदी', rate: '92.00', unit: 'g', icon: 'sparkles' },
  { nameEn: 'Aluminum', nameHi: 'एल्युमिनियम', rate: '215.00', unit: 'kg', icon: 'scale' },
  { nameEn: 'Iron / Steel', nameHi: 'लोहा और स्टील', rate: '38.00', unit: 'kg', icon: 'scale' },
];

export default function KabadiwalaScreen() {
  const { language, setLanguage } = useLanguage();
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  
  const [activeTab, setActiveTab] = useState<'scan' | 'items' | 'rate' | 'buyer' | 'orders'>('items');
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [userPhone, setUserPhone] = useState<string>('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Modals & Forms
  const [showProfile, setShowProfile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userName, setUserName] = useState('');
  
  // Buyer Matching Modal
  const [showBuyerModal, setShowBuyerModal] = useState(false);
  const [selectedBuyer, setSelectedBuyer] = useState<UserProfile | null>(null);
  const [buyerRates, setBuyerRates] = useState<RecyclerRate[]>([]);
  const [isFetchingRates, setIsFetchingRates] = useState(false);

  // Location & B2B states
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [realRecyclers, setRealRecyclers] = useState<(UserProfile & { distance?: string })[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [allOrders, setAllOrders] = useState<Order[]>([]);

  const router = useRouter();

  const t = content[language];

  const loadData = async () => {
    const phone = await getSession();
    if (phone) {
      setUserPhone(phone);
      const user = await getUser(phone);
      if (user) {
        setUserProfile(user);
        if (!user.name) {
          setShowOnboarding(true);
        }
      }
      
      const items = await getInventory(phone);
      setInventory(items);
      const orders = await getOrdersForUser(phone, 'kabadiwala');
      setAllOrders(orders);
      const pending = orders.find(o => o.status === 'pending');
      setActiveOrder(pending || null);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabPress = async (tab: 'scan' | 'items' | 'rate' | 'buyer') => {
    if (tab === 'scan') {
      router.push('/scan');
    } else {
      setActiveTab(tab);
      if (tab === 'items') {
        loadData();
      } else if (tab === 'buyer') {
        loadData(); // refresh active order
        if (!userCoords && !isLocating) {
           setIsLocating(true);
           setLocationError(null);
           try {
             let { status } = await Location.requestForegroundPermissionsAsync();
             if (status !== 'granted') {
               setLocationError(t.locationDenied);
               setIsLocating(false);
               return;
             }
             let location = await Location.getCurrentPositionAsync({});
             let geocode = await Location.reverseGeocodeAsync({
               latitude: location.coords.latitude,
               longitude: location.coords.longitude
             });
             
             setUserCoords(location.coords);
             if (geocode && geocode.length > 0) {
               setUserLocation(`${geocode[0].city || geocode[0].subregion}`);
             } else {
               setUserLocation('Location Found');
             }

             // Fetch actual recyclers
             const recyclers = await getAllRecyclers();
             const mapped = recyclers.map(r => {
               if (r.location && location.coords) {
                 return { ...r, distance: getDistance(location.coords.latitude, location.coords.longitude, r.location.latitude, r.location.longitude) };
               }
               return { ...r, distance: 'Unknown' };
             }).sort((a, b) => parseFloat(a.distance || '999') - parseFloat(b.distance || '999'));
             
             setRealRecyclers(mapped);

           } catch(e) {
             console.error("Location error:", e);
             setLocationError(t.locationDenied);
           } finally {
             setIsLocating(false);
           }
        }
      }
    }
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
      setUserCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      
      let geocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });
      if (geocode && geocode.length > 0) {
        setUserLocation(`${geocode[0].city || geocode[0].subregion}`);
      } else {
        setUserLocation('Location Found');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not fetch location.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSaveOnboarding = async () => {
    if (!userName || !userCoords) {
      Alert.alert('Required', 'Please enter your name and fetch location.');
      return;
    }
    if (userProfile) {
      const updated = { ...userProfile, name: userName, location: userCoords };
      await saveUser(updated);
      setUserProfile(updated);
      setShowOnboarding(false);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert(t.delete, t.deleteConfirm, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          if (userPhone) {
            await deleteInventoryItem(userPhone, itemId);
            loadData();
          }
        },
      },
    ]);
  };

  const handleLogout = async () => {
    await clearSession();
    router.replace('/');
  };

  const handleBuyerTap = async (buyer: UserProfile) => {
    if (inventory.length === 0) {
      Alert.alert('Empty', 'Your inventory is empty.');
      return;
    }
    setSelectedBuyer(buyer);
    setShowBuyerModal(true);
    setIsFetchingRates(true);
    const rates = await getRecyclerRates(buyer.phoneNumber);
    setBuyerRates(rates);
    setIsFetchingRates(false);
  };

  const confirmOrder = async (computedTotalValue: number) => {
    if (!userPhone || inventory.length === 0 || !selectedBuyer) return;
    try {
      const orderId = `ORD-${Date.now().toString().slice(-6)}`;
      const order: Order = {
        id: orderId,
        kabadiwalaPhone: userPhone,
        recyclerPhone: selectedBuyer.phoneNumber,
        items: inventory,
        totalValue: computedTotalValue,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await createOrder(order);
      setActiveOrder(order);
      setAllOrders([order, ...allOrders]);
      setShowBuyerModal(false);
      Alert.alert('Success', 'Order successfully booked with recycler!');
      setActiveTab('orders');
    } catch (e) {
      Alert.alert('Error', 'Could not create order');
    }
  };

  // Compute totals
  const totalWeight = inventory.reduce((sum, item) => sum + (item.totalWeightGrams || 0), 0);
  const totalValuation = inventory.reduce((sum, item) => sum + (item.totalEstimatedValue || 0), 0);

  const statsAudioText = language === 'hi' 
    ? `आज की कुल कमाई ${totalValuation.toFixed(0)} रुपये है, और कुल वजन ${totalWeight.toFixed(0)} ग्राम है। आपके पास कुल ${inventory.length} सामान हैं।`
    : `Today's total earnings are ${totalValuation.toFixed(0)} rupees, and total weight is ${totalWeight.toFixed(0)} grams. You have a total of ${inventory.length} items.`;

  // Material Matching Logic
  const getMatchedMaterials = () => {
    const agg: Record<string, { weightGrams: number, nameEn: string, nameHi: string }> = {};
    inventory.forEach(item => {
      if(item.materials) {
        item.materials.forEach(m => {
          if (!agg[m.nameEn]) {
             agg[m.nameEn] = { weightGrams: 0, nameEn: m.nameEn, nameHi: m.nameHi };
          }
          agg[m.nameEn].weightGrams += m.weightGrams;
        });
      }
    });

    let computedTotalValue = 0;
    const matched = Object.values(agg).map(mat => {
      const rate = buyerRates.find(r => r.nameEn.toLowerCase() === mat.nameEn.toLowerCase());
      let calculatedValue = 0;
      if (rate) {
         const multiplier = rate.rateUnit === 'kg' ? mat.weightGrams / 1000 : mat.weightGrams;
         calculatedValue = rate.rate * multiplier;
      }
      computedTotalValue += calculatedValue;
      return { ...mat, rate, calculatedValue };
    });
    
    return { matched, computedTotalValue };
  };

  const { matched, computedTotalValue } = getMatchedMaterials();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]}>
      {/* Top Header */}
      <View style={[styles.topBar, { backgroundColor: currentColors.surface, borderBottomColor: currentColors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {activeTab !== 'items' && (
            <TouchableOpacity onPress={() => setActiveTab('items')} style={{ padding: 4 }}>
              <IconSymbol name="chevron.left" size={24} color={currentColors.text} />
            </TouchableOpacity>
          )}
          {/* Brand Name */}
          <View style={styles.brandContainer}>
            <Typography variant="labelBadge" color={currentColors.primary} style={{ fontWeight: '800', fontSize: 13, letterSpacing: 0.3 }}>
              KabadiWala Connect
            </Typography>
          </View>
        </View>

        {/* Profile & Compact Language Toggle */}
        <View style={styles.headerRight}>
          <LanguageToggle />
          <TouchableOpacity style={styles.profileBtn} onPress={() => setShowProfile(true)} activeOpacity={0.7}>
            <IconSymbol name="person.crop.circle" size={30} color={currentColors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {activeTab === 'items' && (
          <View>
            <View style={styles.sectionHeaderRow}>
              <View style={{ flex: 1, marginRight: 12, flexDirection: 'row', alignItems: 'center' }}>
                <Typography variant="headlineMd" style={{ fontWeight: '800' }} numberOfLines={1}>
                  {t.itemsHeader}
                </Typography>
                <View style={{ marginLeft: 12 }}>
                  <ListenButton text={statsAudioText} color={currentColors.primary} size={24} />
                </View>
              </View>
              <TouchableOpacity style={[styles.scanBadge, { backgroundColor: currentColors.primary }]} onPress={() => router.push('/scan')}>
                <IconSymbol name="camera.fill" size={16} color="#FFF" />
                <Typography variant="labelBadge" color="#FFF" style={{ marginLeft: 6, fontWeight: '700' }} numberOfLines={1}>
                  {t.scanNow}
                </Typography>
              </TouchableOpacity>
            </View>

            <View style={[styles.statsCard, { backgroundColor: currentColors.surface, shadowColor: currentColors.text }]}>
              <View style={styles.statBox}>
                <Typography variant="labelBadge" color={currentColors.icon} numberOfLines={1}>
                  {t.totalItems}
                </Typography>
                <Typography
                  variant="bodyLg"
                  style={{ fontWeight: '800', marginTop: 4, fontSize: 16 }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {inventory.length}
                </Typography>
              </View>

              <View style={[styles.statDivider, { backgroundColor: currentColors.border }]} />

              <View style={styles.statBox}>
                <Typography variant="labelBadge" color={currentColors.icon} numberOfLines={1}>
                  {t.totalWeight}
                </Typography>
                <Typography
                  variant="bodyLg"
                  style={{ fontWeight: '800', marginTop: 4, fontSize: 16 }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {totalWeight.toFixed(1)} g
                </Typography>
              </View>

              <View style={[styles.statDivider, { backgroundColor: currentColors.border }]} />

              <View style={styles.statBox}>
                <Typography variant="labelBadge" color={currentColors.primary} numberOfLines={1}>
                  {t.totalValue}
                </Typography>
                <Typography
                  variant="bodyLg"
                  color={currentColors.primary}
                  style={{ fontWeight: '800', marginTop: 4, fontSize: 16 }}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  ₹ {totalValuation.toFixed(2)}
                </Typography>
              </View>
            </View>

            {inventory.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: currentColors.surface, borderColor: currentColors.border }]}>
                <IconSymbol name="archivebox" size={54} color={currentColors.icon} />
                <Typography variant="headlineMd" style={{ marginTop: 14, textAlign: 'center', fontWeight: '700' }} numberOfLines={2}>
                  {t.itemsEmpty}
                </Typography>
                <Typography variant="bodyMd" color={currentColors.icon} style={{ marginTop: 6, textAlign: 'center' }} numberOfLines={3}>
                  {t.itemsEmptySub}
                </Typography>
                <TouchableOpacity style={[styles.emptyScanBtn, { backgroundColor: currentColors.primary }]} onPress={() => router.push('/scan')}>
                  <IconSymbol name="camera.fill" size={20} color={currentColors.onPrimary} />
                  <Typography variant="labelAction" color={currentColors.onPrimary} style={{ marginLeft: 8, fontWeight: '700' }} numberOfLines={1}>
                    {t.scanNow}
                  </Typography>
                </TouchableOpacity>
              </View>
            ) : (
              inventory.map((item) => (
                <View key={item.id} style={[styles.itemCard, { backgroundColor: currentColors.surface, shadowColor: currentColors.text }]}>
                  <View style={[styles.itemHeader, { borderBottomColor: currentColors.border }]}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Typography variant="bodyLg" style={{ fontWeight: '700' }} numberOfLines={2}>
                        {language === 'hi' ? item.titleHi : item.titleEn}
                      </Typography>
                      <Typography variant="labelBadge" color={currentColors.icon} style={{ marginTop: 2 }} numberOfLines={1}>
                        {new Date(item.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Typography>
                    </View>

                    <TouchableOpacity onPress={() => handleDeleteItem(item.id)} style={styles.deleteBtn}>
                      <IconSymbol name="trash.fill" size={18} color={currentColors.error} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.itemValuesRow}>
                    <View style={{ flex: 1, paddingRight: 6 }}>
                      <Typography variant="labelBadge" color={currentColors.icon} numberOfLines={1}>
                        {t.totalWeight}
                      </Typography>
                      <Typography variant="labelAction" style={{ fontWeight: '700', marginTop: 2, fontSize: 16 }} numberOfLines={1}>
                        {item.totalWeightGrams} g
                      </Typography>
                    </View>

                    <View style={{ flex: 1, alignItems: 'flex-end', paddingLeft: 6 }}>
                      <Typography variant="labelBadge" color={currentColors.primary} numberOfLines={1}>
                        {t.totalValue}
                      </Typography>
                      <Typography variant="headlineMd" color={currentColors.primary} style={{ fontWeight: '800', marginTop: 2, fontSize: 18 }} numberOfLines={1} adjustsFontSizeToFit>
                        ₹ {item.totalEstimatedValue}
                      </Typography>
                    </View>
                  </View>

                  {item.materials && (
                    <View style={[styles.pillsContainer, { borderTopColor: currentColors.border }]}>
                      {item.materials.map((m, idx) => (
                        <View key={idx} style={[styles.pill, { backgroundColor: currentColors.background }]}>
                          <Typography variant="labelBadge" color={currentColors.text} numberOfLines={1}>
                            {language === 'hi' ? m.nameHi : m.nameEn}: {m.weightGrams} g
                          </Typography>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'rate' && (
          <View>
            <Typography variant="headlineMd" style={{ fontWeight: '800', marginBottom: 4 }} numberOfLines={1}>
              {t.ratesHeader}
            </Typography>
            <Typography variant="bodyMd" color={currentColors.icon} style={{ marginBottom: 16 }} numberOfLines={2}>
              {t.ratesSub}
            </Typography>

            {MARKET_RATES.map((rate, index) => (
              <View key={index} style={[styles.rateCard, { backgroundColor: currentColors.surface, shadowColor: currentColors.text }]}>
                <View style={styles.rateLeft}>
                  <View style={[styles.rateIconCircle, { backgroundColor: currentColors.primary + '20' }]}>
                    <IconSymbol name={rate.icon as any} size={20} color={currentColors.primary} />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Typography variant="bodyLg" style={{ fontWeight: '700' }} numberOfLines={1}>
                      {language === 'hi' ? rate.nameHi : rate.nameEn}
                    </Typography>
                    <Typography variant="labelBadge" color={currentColors.icon} style={{ marginTop: 2 }} numberOfLines={1}>
                      1 {rate.unit}
                    </Typography>
                  </View>
                </View>

                <View style={styles.rateRight}>
                  <Typography variant="headlineMd" color={currentColors.primary} style={{ fontWeight: '800', fontSize: 18 }} numberOfLines={1} adjustsFontSizeToFit>
                    ₹ {rate.rate}
                  </Typography>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'buyer' && (
          <View>
            <Typography variant="headlineMd" style={{ fontWeight: '800', marginBottom: 4 }} numberOfLines={1}>
              {userLocation ? `${t.buyersNear} ${userLocation}` : t.buyerHeader}
            </Typography>
            <Typography variant="bodyMd" color={currentColors.icon} style={{ marginBottom: 16 }} numberOfLines={2}>
              {t.buyerSub}
            </Typography>

            {isLocating && (
              <View style={{ alignItems: 'center', marginVertical: 32 }}>
                <ActivityIndicator size="large" color={currentColors.primary} />
                <Typography variant="bodyMd" color={currentColors.icon} style={{ marginTop: 12 }}>{t.locating}</Typography>
              </View>
            )}

            {locationError && (
              <View style={{ backgroundColor: currentColors.error + '20', padding: 12, borderRadius: 12, marginBottom: 16 }}>
                 <Typography variant="bodyMd" color={currentColors.error}>{locationError}</Typography>
              </View>
            )}

            {!isLocating && realRecyclers.length === 0 && userCoords && (
              <Typography variant="bodyMd" color={currentColors.icon}>No verified recyclers found in this area yet.</Typography>
            )}

            {!isLocating && realRecyclers.map((buyer, index) => (
              <View key={index} style={[styles.buyerCard, { backgroundColor: currentColors.surface, shadowColor: currentColors.text }]}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Typography variant="bodyLg" style={{ fontWeight: '700' }} numberOfLines={1}>
                    {buyer.companyName || 'Verified Recycler'}
                  </Typography>
                  <Typography variant="bodyMd" color={currentColors.icon} style={{ marginTop: 4 }} numberOfLines={2}>
                    {buyer.address || 'Local Yard'} • {buyer.distance} km
                  </Typography>
                </View>

                {inventory.length > 0 && (
                  <TouchableOpacity
                    style={[styles.callBtn, { backgroundColor: currentColors.primary }]}
                    onPress={() => handleBuyerTap(buyer)}
                  >
                    <IconSymbol name="shippingbox.fill" size={18} color={currentColors.onPrimary} />
                    <Typography variant="labelBadge" color={currentColors.onPrimary} style={{ marginLeft: 6, fontWeight: '700' }}>
                      {t.bookNow}
                    </Typography>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {activeTab === 'orders' && (
          <View>
            <Typography variant="headlineMd" style={{ fontWeight: '800', marginBottom: 16 }} numberOfLines={1}>
              {t.ordersTitle}
            </Typography>
            
            {activeOrder && userCoords && (
              <View style={[styles.buyerCard, { marginBottom: 24, overflow: 'hidden', backgroundColor: currentColors.surface, shadowColor: currentColors.text, flexDirection: 'column', alignItems: 'stretch' }]}>
                <View style={{ backgroundColor: currentColors.primary, padding: 12 }}>
                  <Typography variant="headlineMd" color={currentColors.onPrimary} style={{ fontWeight: '800' }}>
                    {t.activeOrder}
                  </Typography>
                </View>
                
                <View style={{ padding: 16 }}>
                  <Typography variant="bodyLg" style={{ fontWeight: '700' }}>
                    Status: {activeOrder.status.toUpperCase()}
                  </Typography>
                  <Typography variant="bodyMd" color={currentColors.icon} style={{ marginTop: 4, marginBottom: 12 }}>
                    Recycler: {activeOrder.recyclerPhone}
                  </Typography>
                  <Typography variant="headlineMd" color={currentColors.primary} style={{ fontWeight: '800' }}>
                    ₹ {activeOrder.totalValue.toFixed(2)}
                  </Typography>
                </View>

                {/* Map View */}
                <ActiveOrderMap 
                  userCoords={userCoords} 
                  recyclerCoords={realRecyclers.find(r => r.phoneNumber === activeOrder.recyclerPhone)?.location} 
                />
              </View>
            )}

            <Typography variant="bodyLg" style={{ fontWeight: '700', marginBottom: 12 }} numberOfLines={1}>
              {t.pastOrders}
            </Typography>
            
            {allOrders.filter(o => o.status !== 'pending').length === 0 ? (
               <Typography variant="bodyMd" color={currentColors.icon}>{t.noOrders}</Typography>
            ) : (
               allOrders.filter(o => o.status !== 'pending').map((order) => (
                 <View key={order.id} style={[styles.buyerCard, { backgroundColor: currentColors.surface, shadowColor: currentColors.text, flexDirection: 'column', alignItems: 'flex-start' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                      <Typography variant="bodyLg" style={{ fontWeight: '700' }}>{order.id}</Typography>
                      <Typography variant="labelBadge" color={currentColors.icon}>
                        {new Date(order.createdAt).toLocaleDateString()}
                      </Typography>
                    </View>
                    <Typography variant="bodyMd" color={currentColors.icon} style={{ marginTop: 4 }}>
                      Status: {order.status}
                    </Typography>
                    <Typography variant="headlineMd" color={currentColors.primary} style={{ fontWeight: '800', marginTop: 8 }}>
                      ₹ {order.totalValue.toFixed(2)}
                    </Typography>
                 </View>
               ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: currentColors.surface, borderTopColor: currentColors.border }]}>
        {/* Scan */}
        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => handleTabPress('scan')}>
          <IconSymbol name="qrcode.viewfinder" size={28} color={activeTab === 'scan' ? currentColors.primary : currentColors.icon} />
          <Typography variant="labelBadge" color={activeTab === 'scan' ? currentColors.primary : currentColors.icon} style={styles.navText}>
            {t.nav.scan}
          </Typography>
        </TouchableOpacity>

        {/* My Items */}
        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => handleTabPress('items')}>
          <IconSymbol name="archivebox" size={28} color={activeTab === 'items' ? currentColors.primary : currentColors.icon} />
          <Typography variant="labelBadge" color={activeTab === 'items' ? currentColors.primary : currentColors.icon} style={styles.navText}>
            {t.nav.items}
          </Typography>
        </TouchableOpacity>

        {/* Today's Rate */}
        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => handleTabPress('rate')}>
          <IconSymbol name="indianrupeesign.circle" size={28} color={activeTab === 'rate' ? currentColors.primary : currentColors.icon} />
          <Typography variant="labelBadge" color={activeTab === 'rate' ? currentColors.primary : currentColors.icon} style={styles.navText}>
            {t.nav.rate}
          </Typography>
        </TouchableOpacity>

        {/* Buyer */}
        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => handleTabPress('buyer')}>
          <IconSymbol name="person.2.fill" size={28} color={activeTab === 'buyer' ? currentColors.primary : currentColors.icon} />
          <Typography variant="labelBadge" color={activeTab === 'buyer' ? currentColors.primary : currentColors.icon} style={styles.navText}>
            {t.nav.buyer}
          </Typography>
        </TouchableOpacity>

        {/* Orders */}
        <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => handleTabPress('orders')}>
          <IconSymbol name="list.bullet.clipboard" size={28} color={activeTab === 'orders' ? currentColors.primary : currentColors.icon} />
          <Typography variant="labelBadge" color={activeTab === 'orders' ? currentColors.primary : currentColors.icon} style={styles.navText}>
            {t.nav.orders}
          </Typography>
        </TouchableOpacity>
      </View>

      {/* Onboarding Modal */}
      <Modal visible={showOnboarding} animationType="slide">
        <SafeAreaView style={[styles.modalSafeArea, { backgroundColor: currentColors.background }]}>
          <View style={styles.modalContent}>
            <Typography variant="headlineLg" style={{ fontWeight: '800', marginBottom: 24 }}>
              {t.onboardingTitle || 'Complete Your Profile'}
            </Typography>

            <Typography variant="labelAction" color={currentColors.icon} style={{ marginBottom: 8 }}>
              {t.onboardingName || 'Your Name'}
            </Typography>
            <TextInput
              style={[styles.input, { color: currentColors.text, borderColor: currentColors.border }]}
              value={userName}
              onChangeText={setUserName}
              placeholder="e.g. Ramesh Kumar"
              placeholderTextColor={currentColors.icon}
            />

            <TouchableOpacity style={[styles.locationBtn, { backgroundColor: currentColors.surfaceVariant }]} onPress={handleFetchLocation} disabled={isLocating}>
              {isLocating ? <ActivityIndicator color={currentColors.onSurfaceVariant} /> : <IconSymbol name="location.fill" size={20} color={currentColors.onSurfaceVariant} />}
              <Typography variant="labelAction" color={currentColors.onSurfaceVariant} style={{ marginLeft: 8 }}>
                {userCoords ? 'Location Fetched!' : (t.onboardingLoc || 'Fetch Location')}
              </Typography>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.saveBtn, { backgroundColor: currentColors.primary }]} onPress={handleSaveOnboarding}>
              <Typography variant="labelAction" color={currentColors.onPrimary}>{t.saveProfile || 'Save Profile'}</Typography>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Buyer Detail Match Modal */}
      <Modal visible={showBuyerModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.buyerModalContainer, { backgroundColor: currentColors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: currentColors.border }]}>
              <View style={{ flex: 1 }}>
                <Typography variant="headlineMd" style={{ fontWeight: '800' }} numberOfLines={1}>
                  {selectedBuyer?.companyName || 'Recycler'}
                </Typography>
                <Typography variant="bodyMd" color={currentColors.icon} numberOfLines={1}>
                  Matching your items to buyer rates
                </Typography>
              </View>
              <TouchableOpacity onPress={() => setShowBuyerModal(false)} style={{ padding: 4 }}>
                <IconSymbol name="xmark.circle.fill" size={24} color={currentColors.icon} />
              </TouchableOpacity>
            </View>

            {isFetchingRates ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={currentColors.primary} />
                <Typography variant="bodyMd" color={currentColors.icon} style={{ marginTop: 12 }}>Fetching custom rates...</Typography>
              </View>
            ) : (
              <ScrollView style={{ padding: 16 }}>
                {matched.map((mat, idx) => (
                  <View key={idx} style={[styles.buyerCard, { backgroundColor: currentColors.surface, shadowColor: currentColors.text, flexDirection: 'column', alignItems: 'stretch' }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                       <Typography variant="bodyLg" style={{ fontWeight: '700' }} numberOfLines={1}>
                         {language === 'hi' ? mat.nameHi : mat.nameEn}
                       </Typography>
                       <Typography variant="labelBadge" color={currentColors.icon}>
                         {mat.weightGrams} g
                       </Typography>
                    </View>
                    
                    {mat.rate ? (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                         <Typography variant="bodyMd" color={currentColors.icon}>
                           Rate: ₹{mat.rate.rate}/{mat.rate.rateUnit}
                         </Typography>
                         <Typography variant="headlineMd" color={currentColors.primary} style={{ fontWeight: '800' }}>
                           ₹{mat.calculatedValue.toFixed(2)}
                         </Typography>
                      </View>
                    ) : (
                      <Typography variant="bodyMd" color={currentColors.error}>
                        Buyer does not accept this material.
                      </Typography>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}

            <View style={[styles.modalFooter, { backgroundColor: currentColors.surface, borderTopColor: currentColors.border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                 <Typography variant="bodyLg" style={{ fontWeight: '700' }}>Total Estimated Deal</Typography>
                 <Typography variant="headlineMd" color={currentColors.primary} style={{ fontWeight: '800' }}>
                   ₹{computedTotalValue.toFixed(2)}
                 </Typography>
              </View>
              <TouchableOpacity 
                style={[styles.callBtn, { backgroundColor: currentColors.primary, justifyContent: 'center', width: '100%', paddingVertical: 14 }]} 
                onPress={() => confirmOrder(computedTotalValue)}
                disabled={isFetchingRates}
              >
                <IconSymbol name="checkmark.seal.fill" size={20} color={currentColors.onPrimary} />
                <Typography variant="labelAction" color={currentColors.onPrimary} style={{ marginLeft: 8, fontWeight: '700' }}>
                  Book Deal
                </Typography>
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
          name={userProfile.name || ''}
          phone={userProfile.phoneNumber}
          role="kabadiwala"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  brandContainer: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  profileBtn: { padding: 2 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    elevation: 2,
  },
  statsCard: {
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statBox: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  statDivider: { width: 1, height: 36 },
  emptyCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
  },
  itemCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  deleteBtn: { padding: 6 },
  itemValuesRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 12 },
  pillsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 8, borderTopWidth: 1 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, maxWidth: '100%' },
  rateCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  rateLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  rateIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rateRight: { alignItems: 'flex-end', minWidth: 80 },
  buyerCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 24,
    paddingTop: 12,
    justifyContent: 'space-around',
    elevation: 16,
  },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  navText: { marginTop: 6, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  modalSafeArea: { flex: 1 },
  modalContent: { flex: 1, padding: 24, justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  locationBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  saveBtn: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
});
