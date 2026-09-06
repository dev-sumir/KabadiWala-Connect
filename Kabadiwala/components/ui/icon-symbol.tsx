// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'checkmark.circle.fill': 'check-circle',
  'arrow.right.circle.fill': 'arrow-circle-right',
  'minus': 'remove',
  'plus': 'add',
  'speaker.wave.2.fill': 'volume-up',
  'chevron.left': 'chevron-left',
  'check': 'check',
  'phone.portrait': 'smartphone',
  'mic': 'mic',
  'lock': 'lock',
  'shield.check': 'verified-user',
  'star.fill': 'star',
  'scale': 'monitor-weight',
  'banknote': 'payments',
  'headphones': 'support-agent',
  'rupee': 'currency-rupee',
  'arrow.right': 'arrow-forward',
  'call': 'call',
  'qrcode.viewfinder': 'qr-code-scanner',
  'archivebox': 'inventory',
  'indianrupeesign.circle': 'currency-rupee',
  'person.2.fill': 'handshake',
  'person.crop.circle': 'account-circle',
  'camera.fill': 'camera-alt',
  'bolt.fill': 'flash-on',
  'bolt.slash.fill': 'flash-off',
  'camera.rotate': 'flip-camera-android',
  'trash.fill': 'delete',
  'sparkles': 'auto-awesome',
  'xmark': 'close',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
