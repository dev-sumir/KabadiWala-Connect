import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { getUser, saveUser, saveSession } from '@/utils/db';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ListenButton } from '@/components/ui/ListenButton';

const content = {
  hi: {
    valueBanner: "कचरा नहीं, कमाई है! सही दाम, तुरंत भुगतान",
    inputLabel: "मोबाइल नंबर दर्ज करें",
    digitsBadge: "10 अंक",
    secureLogin: "सुरक्षित लॉगिन • आपके नंबर पर तुरंत OTP कोड आएगा",
    proceedBtn: "आगे बढ़ें",
    trustBannerTitle: "10,000+ कबाड़ी भाइयों का भरोसा",
    trustBannerDesc: "पूरे भारत में सुरक्षित तौल एवं दैनिक नकद भुगतान",
    footerScale: "सटीक वजन",
    footerMoney: "तुरंत पैसा",
    footerSupport: "मदद केंद्र",
  },
  en: {
    valueBanner: "Waste is wealth! Best price, instant payment",
    inputLabel: "Enter mobile number",
    digitsBadge: "10 digits",
    secureLogin: "Secure login • OTP will be sent instantly",
    proceedBtn: "Proceed",
    trustBannerTitle: "Trusted by 10,000+ Partners",
    trustBannerDesc: "Secure weighing & daily cash payments across India",
    footerScale: "Accurate Weight",
    footerMoney: "Instant Cash",
    footerSupport: "Help Center",
  }
};

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const { language, setLanguage } = useLanguage();
  const [role, setRole] = useState<'kabadiwala' | 'recycler'>('kabadiwala');
  const router = useRouter();

  const handleLogin = async () => {
    if (phoneNumber.length >= 10) {
      router.push({
        pathname: '/otp',
        params: {
          phoneNumber,
          role,
        },
      });
    }
  };

  const t = content[language];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#F8FAFC' }]}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Top Bar */}
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <Typography variant="labelBadge" color="#15803D" style={{ fontWeight: '800', fontSize: 13, letterSpacing: 0.3 }}>
                KabadiWala Connect
              </Typography>
            </View>
            <LanguageToggle />
          </View>

          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoWrapper}>
               <Image 
                  source={require('@/assets/images/logo.png')}
                  style={styles.logoImage}
               />
            </View>
            
            <Typography variant="headlineLg" style={styles.title}>KabadiWala Connect</Typography>
            <Typography variant="labelBadge" style={styles.subtitle}>कबाड़ीवाला कनेक्ट</Typography>
          </View>

          {/* Value Banner */}
          <View style={styles.valueBanner}>
            <IconSymbol name="rupee" size={18} color="#D97706" />
            <Typography variant="bodyMd" style={styles.valueBannerText}>
              {t.valueBanner}
            </Typography>
            <ListenButton text={t.valueBanner} color="#15803D" size={20} />
          </View>

          {/* Login Card Wrapper */}
          <View style={styles.loginCardWrapper}>
            <View style={styles.tabsContainer}>
              <TouchableOpacity 
                style={[styles.tab, role === 'kabadiwala' ? styles.activeTab : styles.inactiveTab]} 
                onPress={() => setRole('kabadiwala')}
                activeOpacity={1}
              >
                <Typography variant="labelAction" color={role === 'kabadiwala' ? '#15803D' : '#64748B'}>KabadiWala</Typography>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.tab, role === 'recycler' ? styles.activeTab : styles.inactiveTab]} 
                onPress={() => setRole('recycler')}
                activeOpacity={1}
              >
                <Typography variant="labelAction" color={role === 'recycler' ? '#15803D' : '#64748B'}>Recycler</Typography>
              </TouchableOpacity>
            </View>

            <View style={styles.loginCard}>
            <View style={styles.loginCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <IconSymbol name="phone.portrait" size={20} color="#15803D" />
                <Typography variant="labelAction" color="#0F172A" style={{ marginLeft: 8 }}>{t.inputLabel}</Typography>
              </View>
              <ListenButton text={t.inputLabel} color="#64748B" size={18} />
            </View>

            <View style={styles.inputContainer}>
              <IconSymbol name="call" size={20} color="#475569" />
              <Typography variant="headlineMd" style={styles.countryCode}>+91</Typography>
              <View style={styles.inputDivider} />
              <TextInput
                style={styles.input}
                placeholder="98765 43210"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={10}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
              />
              <TouchableOpacity style={styles.micButton}>
                <IconSymbol name="mic" size={20} color="#0284C7" />
              </TouchableOpacity>
            </View>

            <View style={styles.secureTextRow}>
              <IconSymbol name="lock" size={14} color="#15803D" />
              <Typography variant="bodyMd" color="#475569" style={{ marginLeft: 6, fontSize: 13 }}>
                {t.secureLogin}
              </Typography>
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, { opacity: phoneNumber.length >= 10 ? 1 : 0.6 }]}
              onPress={handleLogin}
              disabled={phoneNumber.length < 10}
            >
              <IconSymbol name="checkmark.circle.fill" size={24} color="#FFF" />
              <Typography variant="labelAction" color="#FFF" style={{ marginLeft: 8, marginRight: 8 }}>{t.proceedBtn}</Typography>
              <IconSymbol name="arrow.right" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          </View>

          {/* Trust Banner */}
          <View style={styles.trustBanner}>
            <View style={styles.trustHeader}>
              <IconSymbol name="shield.check" size={20} color="#15803D" />
              <Typography variant="bodyLg" color="#0F172A" style={{ marginLeft: 8, fontWeight: '700' }}>{t.trustBannerTitle}</Typography>
            </View>
            
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(i => (
                <IconSymbol key={i} name="star.fill" size={20} color="#D97706" style={{ marginHorizontal: 2 }} />
              ))}
              <Typography variant="labelAction" color="#0F172A" style={{ marginLeft: 8 }}>4.9 / 5</Typography>
            </View>
            
            <Typography variant="bodyMd" color="#475569" style={{ textAlign: 'center' }}>
              {t.trustBannerDesc}
            </Typography>
          </View>

        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <IconSymbol name="scale" size={16} color="#15803D" />
            <Typography variant="labelBadge" color="#475569" style={{ marginLeft: 4 }}>{t.footerScale}</Typography>
          </View>
          <View style={styles.footerDot} />
          <View style={styles.footerItem}>
            <IconSymbol name="banknote" size={16} color="#15803D" />
            <Typography variant="labelBadge" color="#475569" style={{ marginLeft: 4 }}>{t.footerMoney}</Typography>
          </View>
          <View style={styles.footerDot} />
          <View style={styles.footerItem}>
            <IconSymbol name="headphones" size={16} color="#15803D" />
            <Typography variant="labelBadge" color="#475569" style={{ marginLeft: 4 }}>{t.footerSupport}</Typography>
          </View>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    alignItems: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voiceAssist: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0369A1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  logoImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  logoBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#92400E',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  title: {
    color: '#0F172A',
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#15803D',
    marginTop: 4,
    letterSpacing: 1,
    textAlign: 'center',
  },
  valueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    width: '100%',
    justifyContent: 'center',
  },
  valueBannerText: {
    marginLeft: 8,
    color: '#334155',
    fontWeight: '500',
    flex: 1,
  },
  loginCardWrapper: {
    width: '100%',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  activeTab: {
    backgroundColor: '#FFF',
  },
  inactiveTab: {
    backgroundColor: '#E2E8F0',
  },
  loginCard: {
    backgroundColor: '#FFF',
    width: '100%',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    padding: 20,
  },
  loginCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  digitsBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 64,
    marginBottom: 16,
  },
  countryCode: {
    marginLeft: 8,
    color: '#0F172A',
  },
  inputDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  micButton: {
    backgroundColor: '#E0F2FE',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secureTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    justifyContent: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#15803D',
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trustBanner: {
    backgroundColor: '#EFF6FF',
    width: '100%',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    width: '100%',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 16,
  }
});
