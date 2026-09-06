import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet, Easing, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useLanguage } from '@/context/LanguageContext';

interface ListenButtonProps {
  text: string;
  color?: string;
  size?: number;
}

export function ListenButton({ text, color = '#15803D', size = 22 }: ListenButtonProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { language } = useLanguage();
  const scale = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isSpeaking) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.25,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          })
        ])
      );
      animation.start();
    } else {
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    
    return () => {
      if (animation) animation.stop();
    };
  }, [isSpeaking]);
  
  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const handlePress = async () => {
    try {
      if (isSpeaking) {
        if (Platform.OS === 'web') {
          window.speechSynthesis.cancel();
        } else {
          Speech.stop();
        }
        setIsSpeaking(false);
        return;
      }
      
      setIsSpeaking(true);
      
      // Choose appropriate voice/language code
      const speechLanguage = language === 'hi' ? 'hi-IN' : 'en-IN';
      console.log(`Speaking in ${speechLanguage}: ${text}`);
      
      if (Platform.OS === 'web') {
        // Use native Web Speech API directly to avoid expo-speech web bugs
        window.speechSynthesis.cancel(); // clear any stuck utterances
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = speechLanguage;
        utterance.rate = 0.9;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
          console.error("Web Speech error:", e);
          setIsSpeaking(false);
        };
        window.speechSynthesis.speak(utterance);
      } else {
        Speech.stop();
        Speech.speak(text, {
          language: speechLanguage,
          pitch: 1.0,
          rate: 0.9,
          onDone: () => setIsSpeaking(false),
          onStopped: () => setIsSpeaking(false),
          onError: (err) => {
            console.error("Expo Speech error:", err);
            setIsSpeaking(false);
          },
        });
      }
    } catch (err) {
      console.error("Error in speech button:", err);
      setIsSpeaking(false);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={styles.button}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <IconSymbol 
          name="speaker.wave.2.fill" 
          size={size} 
          color={isSpeaking ? "#D97706" : color} 
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
