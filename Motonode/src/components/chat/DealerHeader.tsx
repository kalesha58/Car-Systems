import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  ScrollView,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useColors } from '@hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DealerHeaderProps {
  name: string;
  avatar?: string;
  online?: boolean;
  rating?: number;
  businessHours?: string;
  onBack: () => void;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  onMenu?: () => void;
  // Quick action navigation
  onBookService?: () => void;
  onBookTestDrive?: () => void;
  onViewProducts?: () => void;
  onViewStore?: () => void;
  onAskAI?: () => void;
}

export function DealerHeader({
  name,
  avatar,
  online,
  rating,
  businessHours = '9:00 AM - 7:00 PM',
  onBack,
  onVoiceCall,
  onVideoCall,
  onMenu,
  onBookService,
  onBookTestDrive,
  onViewProducts,
  onViewStore,
  onAskAI,
}: DealerHeaderProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top }]}>
      {/* Primary Header Row */}
      <View style={styles.headerMain}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.profileInfo}>
          <View style={styles.avatarWrapper}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.muted }]}>
                <Feather name="briefcase" size={18} color={colors.textSecondary} />
              </View>
            )}
            {online && <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />}
          </View>

          <View style={styles.nameDetails}>
            <View style={styles.titleRow}>
              <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
                {name}
              </Text>
              <View style={[styles.verifiedBadge, { backgroundColor: `${colors.success}12` }]}>
                <Feather name="check-circle" size={11} color={colors.success} />
              </View>
            </View>
            <View style={styles.metaRow}>
              {rating != null ? (
                <View style={styles.ratingRow}>
                  <Feather name="star" size={10} color={colors.starActive} />
                  <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                    {rating.toFixed(1)}
                  </Text>
                </View>
              ) : null}
              <Text style={[styles.metaText, { color: colors.textTertiary }]}>
                {rating != null ? '• ' : ''}
                {businessHours}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={onVoiceCall} style={styles.actionIcon}>
            <Feather name="phone" size={18} color={colors.textPrimary} />
          </Pressable>
          <Pressable onPress={onVideoCall} style={styles.actionIcon}>
            <Feather name="video" size={18} color={colors.textPrimary} />
          </Pressable>
          <Pressable onPress={onMenu} style={styles.actionIcon}>
            <Feather name="more-vertical" size={18} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>

      {/* Quick Access Actions Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickActionsContainer}
      >
        {onBookService && (
          <Pressable style={[styles.quickBtn, { backgroundColor: colors.muted }]} onPress={onBookService}>
            <Feather name="tool" size={14} color={colors.primary} />
            <Text style={[styles.quickBtnText, { color: colors.textPrimary }]}>Book Service</Text>
          </Pressable>
        )}
        {onBookTestDrive && (
          <Pressable style={[styles.quickBtn, { backgroundColor: colors.muted }]} onPress={onBookTestDrive}>
            <Feather name="calendar" size={14} color={colors.primary} />
            <Text style={[styles.quickBtnText, { color: colors.textPrimary }]}>Test Drive</Text>
          </Pressable>
        )}
        {onViewProducts && (
          <Pressable style={[styles.quickBtn, { backgroundColor: colors.muted }]} onPress={onViewProducts}>
            <Feather name="shopping-bag" size={14} color={colors.primary} />
            <Text style={[styles.quickBtnText, { color: colors.textPrimary }]}>Products</Text>
          </Pressable>
        )}
        {onViewStore && (
          <Pressable style={[styles.quickBtn, { backgroundColor: colors.muted }]} onPress={onViewStore}>
            <Feather name="home" size={14} color={colors.primary} />
            <Text style={[styles.quickBtnText, { color: colors.textPrimary }]}>Store</Text>
          </Pressable>
        )}
        {onAskAI && (
          <Pressable style={[styles.quickBtn, { backgroundColor: colors.muted }]} onPress={onAskAI}>
            <Feather name="cpu" size={14} color={colors.primary} />
            <Text style={[styles.quickBtnText, { color: colors.textPrimary }]}>Ask AI</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 0.5,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  headerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backBtn: {
    padding: 6,
    marginRight: 4,
  },
  profileInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  nameDetails: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  name: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    maxWidth: '85%',
  },
  verifiedBadge: {
    padding: 1.5,
    borderRadius: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metaText: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    padding: 6,
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 4,
    gap: 8,
  },
  quickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  quickBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
});
