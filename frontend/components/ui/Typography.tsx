import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Colors, Typography as ThemeTypography, Fonts } from '@/constants/theme';

export type TypographyVariant = keyof typeof ThemeTypography;

interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  lightColor?: string;
  darkColor?: string;
}

export function Typography({
  style,
  variant = 'bodyMd',
  lightColor,
  darkColor,
  color,
  ...rest
}: TypographyProps) {
  const { theme } = useTheme();
  
  // Resolve color
  const colorFromProps = theme === 'light' ? lightColor : darkColor;
  const resolvedColor = color || colorFromProps || Colors[theme].text;

  // Resolve typography styles
  const typographyStyles = ThemeTypography[variant];

  return (
    <Text
      style={[
        { color: resolvedColor, fontFamily: Fonts.sans },
        typographyStyles,
        style,
      ]}
      {...rest}
    />
  );
}
