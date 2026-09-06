import React from 'react';
import { View, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from './Typography';
import { IconSymbol } from './icon-symbol';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/theme';
import { clearSession } from '@/utils/db';
import { useRouter } from 'expo-router';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
  name: string;
  phone: string;
  role: 'kabadiwala' | 'recycler';
}

export function ProfileModal({ visible, onClose, name, phone, role }: ProfileModalProps) {
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const handleLogout = async () => {
    onClose();
    await clearSession();
    router.replace('/');
  };

  const currentColors = Colors[theme];
  const primaryColor = role === 'kabadiwala' ? currentColors.primary : currentColors.secondary;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: currentColors.surface }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <IconSymbol name="chevron.left" size={24} color={currentColors.icon} />
              <Typography variant="bodyLg" color={currentColors.icon} style={{ marginLeft: 6 }}>Back</Typography>
            </TouchableOpacity>
            <Typography variant="headlineMd" style={{ fontWeight: '800' }}>
              My Profile
            </Typography>
            <View style={{ width: 60 }} />
          </View>

          <View style={styles.content}>
            <View style={styles.profileInfo}>
              <View style={[styles.avatar, { backgroundColor: primaryColor + '20' }]}>
                <IconSymbol name="person.crop.circle.fill" size={60} color={primaryColor} />
              </View>
              <Typography variant="headlineLgMobile" style={{ marginTop: 12, fontWeight: '700' }}>
                {name || 'Unknown User'}
              </Typography>
              <Typography variant="bodyMd" color={currentColors.icon} style={{ marginTop: 4 }}>
                +91 {phone}
              </Typography>
              <View style={[styles.badge, { backgroundColor: primaryColor }]}>
                <Typography variant="labelBadge" color="#FFF" style={{ textTransform: 'capitalize' }}>
                  {role}
                </Typography>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: currentColors.background, borderColor: currentColors.border }]}
                onPress={toggleTheme}
              >
                <IconSymbol name={theme === 'light' ? 'moon.fill' : 'sun.max.fill'} size={20} color={currentColors.text} />
                <Typography variant="bodyLg" style={{ marginLeft: 12, flex: 1, fontWeight: '600' }}>
                  {theme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
                </Typography>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: currentColors.error + '15', borderColor: currentColors.error + '30', marginTop: 12 }]}
                onPress={handleLogout}
              >
                <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color={currentColors.error} />
                <Typography variant="bodyLg" color={currentColors.error} style={{ marginLeft: 12, flex: 1, fontWeight: '600' }}>
                  Logout
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  closeBtn: {
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actions: {
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
});
