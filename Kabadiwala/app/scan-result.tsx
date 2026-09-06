import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Typography } from '@/components/ui/Typography';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getSession, addInventoryItem, InventoryItem } from '@/utils/db';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/theme';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { ListenButton } from '@/components/ui/ListenButton';

const content = {
  hi: {
    header: 'जांच परिणाम',
    estimatedValue: 'अनुमानित कमाई',
    confidence: 'एआई सटीकता',
    totalWeight: 'कुल वजन',
    materialsHeader: 'निकाली जा सकने वाली धातुएं',
    rateLabel: 'दर',
    retake: 'दोबारा स्कैन करें',
    addToInventory: 'इन्वेंटरी में जोड़ें',
    saving: 'इन्वेंटरी में जोड़ा जा रहा है...',
    successTitle: 'सफलतापूर्वक जोड़ा गया!',
    successMsg: 'यह सामान आपकी इन्वेंटरी (मेरा सामान) में जुड़ चुका है।',
  },
  en: {
    header: 'Analysis Result',
    estimatedValue: 'Estimated Value',
    confidence: 'AI Confidence',
    totalWeight: 'Total Weight',
    materialsHeader: 'Extractable Precious Metals',
    rateLabel: 'Rate',
    retake: 'Scan Again',
    addToInventory: 'Add to Inventory',
    saving: 'Adding to Inventory...',
    successTitle: 'Added to Inventory!',
    successMsg: 'This item has been saved to your inventory (My Items).',
  },
};

export default function ScanResultScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { language, setLanguage } = useLanguage();
  const { theme } = useTheme();
  const currentColors = Colors[theme];
  const [isSaving, setIsSaving] = useState(false);

  const t = content[language as keyof typeof content] || content.en;

  // Parse analysis data
  const data = params.data ? JSON.parse(params.data as string) : null;
  const imageUri = params.imageUri as string | undefined;

  const audioText = data 
    ? (language === 'hi'
      ? `इस तस्वीर में ${data.titleHi} है। इसका कुल वजन ${data.totalWeightGrams} ग्राम है, और अनुमानित कीमत ${data.totalEstimatedValue} रुपये है।`
      : `In this picture, there is ${data.titleEn}. Its total weight is ${data.totalWeightGrams} grams, and the estimated value is ${data.totalEstimatedValue} rupees.`)
    : "";

  if (!data) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Typography variant="bodyLg" color={currentColors.text}>No data available</Typography>
        <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: currentColors.primary }]} onPress={() => router.back()}>
          <Typography variant="labelAction" color={currentColors.onPrimary}>Back</Typography>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleAddToInventory = async () => {
    try {
      setIsSaving(true);
      const phone = (await getSession()) || 'guest_user';

      const inventoryItem: InventoryItem = {
        id: `item_${Date.now()}`,
        titleEn: data.titleEn,
        titleHi: data.titleHi,
        totalWeightGrams: data.totalWeightGrams,
        totalEstimatedValue: data.totalEstimatedValue,
        materials: data.materials,
        imageUri: imageUri,
        createdAt: new Date().toISOString(),
      };

      await addInventoryItem(phone, inventoryItem);
      setIsSaving(false);

      Alert.alert(t.successTitle, t.successMsg, [
        {
          text: 'OK',
          onPress: () => {
            // Navigate back to kabadiwala dashboard
            router.replace('/kabadiwala');
          },
        },
      ]);
    } catch (err: any) {
      setIsSaving(false);
      Alert.alert('Error', err?.message || 'Could not save item to inventory');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: currentColors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={[styles.backButton, { backgroundColor: currentColors.surfaceVariant }]} onPress={() => router.back()}>
              <IconSymbol name="chevron.left" size={24} color={currentColors.onSurfaceVariant} />
            </TouchableOpacity>
            <View style={{ marginLeft: 10 }}>
              <Typography variant="labelBadge" color={currentColors.primary} style={{ fontWeight: '800', fontSize: 11, letterSpacing: 0.3 }}>
                KabadiWala Connect
              </Typography>
              <Typography variant="headlineMd" style={{ fontWeight: '700', fontSize: 18 }}>
                {t.header}
              </Typography>
            </View>
          </View>

          <LanguageToggle />
        </View>

        {/* Captured Photo Preview Card */}
        {imageUri && (
          <View style={[styles.imageCard, { backgroundColor: currentColors.surfaceVariant }]}>
            <Image source={{ uri: imageUri }} style={styles.previewImage} contentFit="cover" />
            <View style={[styles.confidenceBadge, { backgroundColor: currentColors.surface }]}>
              <IconSymbol name="sparkles" size={16} color={currentColors.primary} />
              <Typography variant="labelBadge" color={currentColors.primary} style={{ marginLeft: 6, fontWeight: '700' }}>
                {data.confidence}% {t.confidence}
              </Typography>
            </View>
          </View>
        )}

        {/* Item Title & Value Card */}
        <View style={[styles.valueCard, { backgroundColor: currentColors.surface, shadowColor: currentColors.text }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Typography variant="headlineLg" style={{ fontWeight: '800', flex: 1, marginRight: 8 }} numberOfLines={2} adjustsFontSizeToFit>
              {language === 'hi' ? data.titleHi : data.titleEn}
            </Typography>
            <ListenButton text={audioText} color={currentColors.primary} size={28} />
          </View>

          <View style={[styles.statRow, { borderTopColor: currentColors.border }]}>
            <View style={styles.statItem}>
              <Typography variant="labelBadge" color={currentColors.icon} numberOfLines={1}>
                {t.totalWeight}
              </Typography>
              <Typography variant="headlineMd" style={{ fontWeight: '700', marginTop: 4, fontSize: 18 }} numberOfLines={1} adjustsFontSizeToFit>
                {data.totalWeightGrams} g
              </Typography>
            </View>

            <View style={[styles.statDivider, { backgroundColor: currentColors.border }]} />

            <View style={styles.statItem}>
              <Typography variant="labelBadge" color={currentColors.primary} numberOfLines={1}>
                {t.estimatedValue}
              </Typography>
              <Typography variant="headlineLg" color={currentColors.primary} style={{ fontWeight: '800', marginTop: 4, fontSize: 22 }} numberOfLines={1} adjustsFontSizeToFit>
                ₹ {data.totalEstimatedValue}
              </Typography>
            </View>
          </View>
        </View>

        {/* Metals Breakdown Section */}
        <View style={[styles.materialsCard, { backgroundColor: currentColors.surface, shadowColor: currentColors.text }]}>
          <View style={[styles.materialsHeader, { borderBottomColor: currentColors.border }]}>
            <IconSymbol name="scale" size={20} color={currentColors.primary} />
            <Typography variant="bodyLg" style={{ marginLeft: 8, fontWeight: '700' }} numberOfLines={1}>
              {t.materialsHeader}
            </Typography>
          </View>

          {data.materials &&
            data.materials.map((mat: any, index: number) => (
              <View key={index} style={[styles.materialRow, { borderBottomColor: currentColors.border }]}>
                <View style={styles.materialLeft}>
                  <View style={[styles.materialDot, { backgroundColor: currentColors.primary }]} />
                  <View style={{ flex: 1 }}>
                    <Typography variant="bodyLg" style={{ fontWeight: '700' }} numberOfLines={1}>
                      {language === 'hi' ? mat.nameHi : mat.nameEn}
                    </Typography>
                    <Typography variant="labelBadge" color={currentColors.icon} style={{ marginTop: 2 }} numberOfLines={1}>
                      {t.rateLabel}: ₹ {mat.rate}/{mat.rateUnit}
                    </Typography>
                  </View>
                </View>

                <View style={styles.materialRight}>
                  <Typography variant="labelAction" style={{ fontWeight: '700', fontSize: 16 }} numberOfLines={1}>
                    {mat.weightGrams} g
                  </Typography>
                  <Typography variant="labelBadge" color={currentColors.primary} style={{ fontWeight: '700', marginTop: 2 }} numberOfLines={1}>
                    ₹ {mat.estimatedValue}
                  </Typography>
                </View>
              </View>
            ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: currentColors.primary }, isSaving && { opacity: 0.7 }]}
            onPress={handleAddToInventory}
            disabled={isSaving}
          >
            <IconSymbol name="archivebox" size={22} color={currentColors.onPrimary} />
            <Typography variant="labelAction" color={currentColors.onPrimary} style={{ marginLeft: 8, fontWeight: '700' }}>
              {isSaving ? t.saving : t.addToInventory}
            </Typography>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: currentColors.surfaceVariant }]} onPress={() => router.back()}>
            <IconSymbol name="camera.fill" size={20} color={currentColors.onSurfaceVariant} />
            <Typography variant="labelAction" color={currentColors.onSurfaceVariant} style={{ marginLeft: 8 }}>
              {t.retake}
            </Typography>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    height: 200,
    position: 'relative',
    marginBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  confidenceBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#FFF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  valueCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  statItem: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  materialsCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  materialsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  materialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  materialLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  materialDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#15803D',
    marginRight: 10,
  },
  materialRight: {
    alignItems: 'flex-end',
    minWidth: 75,
  },
  actionsContainer: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#15803D',
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  secondaryBtn: {
    backgroundColor: '#E2E8F0',
    flexDirection: 'row',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
