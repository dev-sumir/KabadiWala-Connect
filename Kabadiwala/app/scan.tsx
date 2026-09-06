import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Text,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Typography } from '@/components/ui/Typography';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/theme';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ListenButton } from '@/components/ui/ListenButton';

const FASTAPI_BASE64_URL = `${process.env.EXPO_PUBLIC_API_URL}/analyze-base64`;

const content = {
  hi: {
    title: 'स्मार्ट एआई स्कैनर',
    subtitle: 'सामान को चौकोर बॉक्स के अंदर रखें',
    analyzing: 'एआई द्वारा ई-वेस्ट की जांच की जा रही है...',
    wait: 'कृपया प्रतीक्षा करें, धातुओं का हिसाब लगाया जा रहा है',
    permissionNeeded: 'कैमरा अनुमति आवश्यक है',
    grantPermission: 'अनुमति दें',
    back: 'वापस',
  },
  en: {
    title: 'Smart AI Scanner',
    subtitle: 'Align scrap/e-waste inside the box',
    analyzing: 'Analyzing E-Waste with AI...',
    wait: 'Calculating metal breakdown & market value',
    permissionNeeded: 'Camera permission is required',
    grantPermission: 'Grant Permission',
    back: 'Back',
  },
};

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [torch, setTorch] = useState<boolean>(false);
  const { language, setLanguage } = useLanguage();
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  const t = content[language as keyof typeof content] || content.en;

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={[styles.container, styles.permissionContainer, { backgroundColor: currentColors.background }]}>
        <IconSymbol name="camera.fill" size={54} color={currentColors.primary} />
        <Typography variant="headlineMd" style={{ marginTop: 16, textAlign: 'center' }}>
          {t.permissionNeeded}
        </Typography>
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: currentColors.primary }]} onPress={requestPermission}>
          <Typography variant="labelAction" color={currentColors.onPrimary}>
            {t.grantPermission}
          </Typography>
        </TouchableOpacity>
        <TouchableOpacity style={styles.textBtn} onPress={() => router.back()}>
          <Typography variant="bodyMd" color={currentColors.icon}>
            {t.back}
          </Typography>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current || isAnalyzing) return;

    try {
      setIsAnalyzing(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.6,
        base64: true,
      });

      if (!photo || !photo.uri) {
        setIsAnalyzing(false);
        return;
      }

      // Try uploading to FastAPI backend via JSON base64
      let analysisData = null;
      try {
        if (photo.base64) {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 12000);

          const response = await fetch(FASTAPI_BASE64_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              imageBase64: photo.base64,
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const resJson = await response.json();
            if (resJson.status === 'error') {
              setIsAnalyzing(false);
              const errMsg = language === 'hi' ? (resJson.messageHi || resJson.messageEn) : (resJson.messageEn || resJson.messageHi);
              Alert.alert(language === 'hi' ? 'स्कैन सूचना' : 'Scan Alert', errMsg || 'Could not recognize scrap.');
              return;
            }
            analysisData = resJson.data;
          } else {
            console.warn('FastAPI responded with HTTP status:', response.status);
          }
        }
      } catch (netErr) {
        console.warn('Could not reach FastAPI server, using on-device ML estimation fallback:', netErr);
      }

      if (!analysisData) {
        setIsAnalyzing(false);
        Alert.alert(
          language === 'hi' ? 'सर्वर संपर्क त्रुटि' : 'Connection Error',
          language === 'hi'
            ? 'एआई सर्वर से संपर्क नहीं हो सका। कृपया इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।'
            : 'Could not reach the AI Vision server. Please check your internet connection and try again.'
        );
        return;
      }

      setIsAnalyzing(false);
      router.push({
        pathname: '/scan-result',
        params: {
          data: JSON.stringify(analysisData),
          imageUri: photo.uri,
        },
      });
    } catch (err: any) {
      setIsAnalyzing(false);
      Alert.alert('Scan Error', err?.message || 'Could not capture photo');
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        enableTorch={torch}
      />

      <SafeAreaView style={styles.overlay}>
        {/* Top Controls */}
        <View style={styles.topBar}>
          <View style={styles.topLeft}>
            <TouchableOpacity style={styles.iconCircle} onPress={() => router.back()}>
              <IconSymbol name="xmark" size={20} color="#FFF" />
            </TouchableOpacity>
            <Typography variant="labelBadge" color="#FFF" style={{ fontWeight: '800', fontSize: 12, marginLeft: 8 }}>
              KabadiWala Connect
            </Typography>
          </View>

          <View style={styles.topRight}>
            <LanguageToggle themeVariant="dark" />
            <TouchableOpacity
              style={[styles.iconCircle, torch && styles.iconCircleActive]}
              onPress={() => setTorch(!torch)}
            >
              <IconSymbol name={torch ? 'bolt.fill' : 'bolt.slash.fill'} size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconCircle}
              onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
            >
              <IconSymbol name="camera.rotate" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Viewfinder Target Box */}
        <View style={styles.viewfinderContainer}>
          <View style={styles.viewfinder}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={[styles.hintBadge, { flexDirection: 'row', alignItems: 'center' }]}>
            <Typography variant="labelAction" color="#FFF" style={{ textAlign: 'center' }}>
              {t.subtitle}
            </Typography>
            <ListenButton text={t.subtitle} color="#FFF" size={18} />
          </View>
        </View>

        {/* Bottom Shutter Action */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={styles.shutterOuter}
            onPress={handleCapture}
            disabled={isAnalyzing}
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>
        </View>

        {/* AI Analysis Loading Overlay */}
        {isAnalyzing && (
          <View style={styles.analyzingOverlay}>
            <View style={[styles.analyzingCard, { backgroundColor: currentColors.surface }]}>
              <ActivityIndicator size="large" color={currentColors.primary} />
              <Typography variant="headlineMd" style={{ marginTop: 16, textAlign: 'center' }}>
                {t.analyzing}
              </Typography>
              <Typography variant="bodyMd" color={currentColors.icon} style={{ marginTop: 6, textAlign: 'center' }}>
                {t.wait}
              </Typography>
            </View>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  primaryBtn: {
    backgroundColor: '#15803D',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  textBtn: {
    marginTop: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleActive: {
    backgroundColor: '#EAB308',
  },
  topLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewfinderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewfinder: {
    width: 280,
    height: 280,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderColor: '#22C55E',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  hintBadge: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 20,
  },
  bottomBar: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  shutterOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#22C55E',
  },
  analyzingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  analyzingCard: {
    backgroundColor: '#FFF',
    width: '90%',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
});
