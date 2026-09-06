import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { saveSession, saveUser, getUser } from '@/utils/db';
import { auth } from '@/utils/firebaseConfig';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { ListenButton } from '@/components/ui/ListenButton';
import { useLanguage } from '@/context/LanguageContext';

const content = {
  hi: {
    enterOtp: "OTP दर्ज करें",
    otpSent: "OTP भेजा गया",
    listenText: "कृपया अपने फोन पर भेजा गया 6 अंकों का OTP दर्ज करें",
    secure: "सुरक्षित • OTP समाप्त होगा",
    invalidOtp: "अमान्य OTP। कृपया पुनः प्रयास करें।",
  },
  en: {
    enterOtp: "Enter OTP",
    otpSent: "OTP sent to",
    listenText: "Please enter the 6 digit OTP sent to your phone",
    secure: "Secure • OTP will expire in",
    invalidOtp: "Invalid OTP. Please try again.",
  },
};

export default function OTPScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawPhone = (params.phoneNumber as string) || '9876543210';
  const role = (params.role as string) || 'kabadiwala';
  const { language } = useLanguage();
  const t = content[language as keyof typeof content] || content.en;

  // Format phone number as "+91 98765 43210"
  const formattedPhone =
    rawPhone.length === 10
      ? `+91 ${rawPhone.slice(0, 5)} ${rawPhone.slice(5)}`
      : `+91 ${rawPhone}`;

  // 6-digit OTP state for Firebase
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState(120);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // References for the 6 input boxes
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  // Subtle security shield breathing & radar ripple animation
  const shieldScale = useRef(new Animated.Value(1)).current;
  const rippleScale = useRef(new Animated.Value(0.95)).current;
  const rippleOpacity = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    // 1. Subtle rhythmic breathing for the shield badge
    const breatheAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shieldScale, {
          toValue: 1.04,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(shieldScale, {
          toValue: 1.0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // 2. Subtle expanding radar pulse ring behind the dashed border
    const rippleAnimation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(rippleScale, {
            toValue: 1.18,
            duration: 2200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(rippleOpacity, {
            toValue: 0.0,
            duration: 2200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(rippleScale, {
            toValue: 0.95,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(rippleOpacity, {
            toValue: 0.45,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    breatheAnimation.start();
    rippleAnimation.start();

    // Firebase Phone Auth Setup
    const sendOTP = async () => {
      // Add a tiny delay to ensure React Native Web has fully attached the View to the DOM
      setTimeout(async () => {
        try {
          if (Platform.OS === 'web') {
            if (!document.getElementById('recaptcha-container')) {
              console.warn("Recaptcha container not found");
              setErrorMessage("Recaptcha container not loaded. Please refresh.");
              return;
            }
            
            // Fix for "reCAPTCHA client element has been removed" error on re-renders
            if ((window as any).recaptchaVerifier) {
              try {
                (window as any).recaptchaVerifier.clear();
              } catch (e) {}
              (window as any).recaptchaVerifier = null;
            }

            if (!(window as any).recaptchaVerifier) {
              (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
              });
            }
            const appVerifier = (window as any).recaptchaVerifier;
            const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
            setConfirmationResult(result);
          } else {
            console.warn("Firebase Recaptcha requires a DOM environment. If running on native iOS/Android in Expo Go, this requires a WebView wrapper or react-native-firebase dev build.");
          }
        } catch (error: any) {
          console.error('Firebase Phone Auth error:', error);
          if (error.code === 'auth/billing-not-enabled') {
            setErrorMessage("Firebase Billing not enabled. Enter any 6 digits to bypass login for now.");
            // Setup a mock confirmation result so they can proceed in the app
            setConfirmationResult({
              confirm: async () => {
                console.log("Mock verification successful");
                return { user: { uid: 'mock-user-123' } };
              }
            } as any);
          } else {
            setErrorMessage(error.message);
          }
        }
      }, 500); // 500ms delay to ensure DOM is ready
    };

    sendOTP();

    return () => {
      breatheAnimation.stop();
      rippleAnimation.stop();
    };
  }, []);

  // 2-minute countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Handle digit typing & auto-advance
  const handleOtpChange = (value: string, index: number) => {
    // Only accept numeric input
    const cleanValue = value.replace(/[^0-9]/g, '');
    const newOtp = [...otp];

    if (cleanValue.length > 0) {
      // Take the last character typed
      newOtp[index] = cleanValue[cleanValue.length - 1];
      setOtp(newOtp);

      // Auto-advance to next input
      if (index < 5) {
        inputRefs[index + 1].current?.focus();
      } else {
        // When 6th digit is typed, perform verification
        handleVerify(newOtp.join(''));
      }
    } else {
      newOtp[index] = '';
      setOtp(newOtp);
    }
  };

  // Handle backspace navigation
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = async (enteredOtp?: string) => {
    const code = enteredOtp || otp.join('');
    if (code.length === 6) {
      try {
        if (confirmationResult) {
          // Verify with Firebase
          await confirmationResult.confirm(code);
        } else if (Platform.OS !== 'web') {
           // Mock bypass for native Expo Go testing if Firebase is uninitialized
           console.log("Native fallback verification for testing");
        }
        
        // Complete login process
        let user = await getUser(rawPhone);
        if (!user) {
          user = {
            phoneNumber: rawPhone,
            role: role as 'kabadiwala' | 'recycler',
            createdAt: new Date().toISOString(),
          };
          await saveUser(user);
        }
        await saveSession(rawPhone);

        if (user.role === 'kabadiwala') {
          router.replace('/kabadiwala');
        } else {
          router.replace('/recycler');
        }
      } catch (error: any) {
        console.error("OTP Verification failed", error);
        setErrorMessage(t.invalidOtp);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#15803D" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.contentWrapper}
      >
        {/* Top Header */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="chevron-left" size={32} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>KabadiWala Connect</Text>
            <Text style={styles.headerSubtitle}>कबाड़ीवाला</Text>
          </View>

          {/* Spacer for symmetry */}
          <View style={styles.placeholder} />
        </View>

        {/* Center Content */}
        <View style={styles.mainContent}>
          {/* Animated Shield Container */}
          <View style={styles.shieldContainer}>
            {/* Subtle Expanding Security Glow Ring */}
            <Animated.View
              style={[
                styles.rippleRing,
                {
                  transform: [{ scale: rippleScale }],
                  opacity: rippleOpacity,
                },
              ]}
            />

            {/* Dashed Circle with Shield Lock */}
            <Animated.View
              style={[
                styles.shieldDashedOuter,
                {
                  transform: [{ scale: shieldScale }],
                },
              ]}
            >
              <View style={styles.shieldInner}>
                <MaterialCommunityIcons
                  name="shield-lock-outline"
                  size={54}
                  color="#FFFFFF"
                />
              </View>
            </Animated.View>
          </View>

          {/* Heading and Subtitle */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
            <Text style={[styles.enterOtpText, { marginBottom: 0 }]}>{t.enterOtp}</Text>
            <ListenButton text={t.listenText} color="#FFFFFF" size={24} />
          </View>
          <Text style={styles.otpSentText}>
            {t.otpSent} <Text style={styles.phoneBold}>{formattedPhone}</Text>
          </Text>
          
          {/* Required by Firebase Web Recaptcha */}
          <View nativeID="recaptcha-container" />

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          {/* 6 OTP Input Boxes */}
          <View style={styles.otpBoxesRow}>
            {otp.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={inputRefs[idx]}
                style={[
                  styles.otpBox,
                  digit ? styles.otpBoxFilled : null,
                ]}
                value={digit}
                onChangeText={(val) => handleOtpChange(val, idx)}
                onKeyPress={(e) => handleKeyPress(e, idx)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                textAlign="center"
                autoFocus={idx === 0}
              />
            ))}
          </View>
        </View>

        {/* Footer Security Badge & Timer */}
        <View style={styles.footer}>
          <MaterialIcons name="lock" size={14} color="#FFFFFF" style={styles.lockIcon} />
          <Text style={styles.footerText}>
            {t.secure} {formatTimer(timerSeconds)}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#15803D', // Exact rich forest green from design
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 6,
    paddingBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  titleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  placeholder: {
    width: 44,
  },
  mainContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 20,
  },
  shieldContainer: {
    width: 124,
    height: 124,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 26,
  },
  rippleRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
    borderColor: '#86EFAC',
    backgroundColor: 'rgba(134, 239, 172, 0.12)',
  },
  shieldDashedOuter: {
    width: 106,
    height: 106,
    borderRadius: 53,
    borderWidth: 1.8,
    borderColor: '#4ADE80', // Lighter dashed green line
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(21, 128, 61, 0.35)',
  },
  shieldInner: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  enterOtpText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  otpSentText: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.88)',
    textAlign: 'center',
    marginBottom: 36,
  },
  phoneBold: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  errorText: {
    color: '#FECDD3',
    marginBottom: 16,
    textAlign: 'center',
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8, // reduced gap to fit 6 boxes
  },
  otpBox: {
    width: 48, // reduced width to fit 6 boxes
    height: 56, // adjusted height
    borderRadius: 14,
    borderWidth: 1.8,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  otpBoxFilled: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Platform.OS === 'ios' ? 20 : 28,
  },
  lockIcon: {
    marginRight: 6,
    opacity: 0.9,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.88)',
    letterSpacing: 0.2,
  },
});
