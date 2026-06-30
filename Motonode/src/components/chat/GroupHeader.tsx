import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
} from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import { useColors } from '@hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface GroupHeaderProps {
  name: string;
  avatar?: string;
  memberCount: number;
  membersNames?: string;
  onBack: () => void;
  onHeaderPress: () => void;
  onMenu?: () => void;
}

export function GroupHeader({
  name,
  avatar,
  memberCount,
  membersNames = '',
  onBack,
  onHeaderPress,
  onMenu,
}: GroupHeaderProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      style={[styles.container, { backgroundColor: colors.card, borderBottomColor: colors.border, paddingTop: insets.top }]}
      onPress={onHeaderPress}
    >
      <View style={styles.headerRow}>
        <Pressable onPress={onBack} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.groupInfo}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.muted }]}>
              <Feather name="users" size={18} color={colors.textSecondary} />
            </View>
          )}

          <View style={styles.nameDetails}>
            <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={[styles.members, { color: colors.textTertiary }]} numberOfLines={1}>
              {membersNames ? membersNames : `${memberCount} members`}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable onPress={onHeaderPress} style={styles.actionIcon} hitSlop={4}>
            <Feather name="info" size={18} color={colors.textPrimary} />
          </Pressable>
          <Pressable onPress={onMenu} style={styles.actionIcon} hitSlop={4}>
            <Feather name="more-vertical" size={18} color={colors.textPrimary} />
          </Pressable>
        </View>
      </View>
    </Pressable>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backBtn: {
    padding: 6,
    marginRight: 4,
  },
  groupInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  nameDetails: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    maxWidth: '85%',
  },
  members: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    padding: 6,
  },
});
