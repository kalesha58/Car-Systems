import { StyleSheet } from 'react-native';

export const cardShadow = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
}).shadow;

export const elevatedCardShadow = StyleSheet.create({
  shadow: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
}).shadow;
