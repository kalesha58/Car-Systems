import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';
import type { IAddress } from '../../types/address';

interface AddressListItemProps {
  address: IAddress;
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
  selectMode?: boolean;
  onSelect?: () => void;
  onSetDefault?: () => void;
  settingDefault?: boolean;
}

function getIconName(iconType: IAddress['iconType']): string {
  if (iconType === 'home') return 'home';
  if (iconType === 'building') return 'briefcase';
  return 'map-pin';
}

export function AddressListItem({
  address,
  onEdit,
  onDelete,
  deleting,
  selectMode,
  onSelect,
  onSetDefault,
  settingDefault,
}: AddressListItemProps) {
  const colors = useColors();

  const cardContent = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: colors.muted }]}>
        <Feather name={getIconName(address.iconType)} size={20} color={colors.primary} />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{address.name}</Text>
          {address.isDefault ? (
            <View style={[styles.badge, { backgroundColor: '#EFF6FF' }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>Default</Text>
            </View>
          ) : onSetDefault ? (
            <Pressable
              onPress={() => {
                lightHaptic();
                onSetDefault();
              }}
              disabled={settingDefault}
              style={[
                styles.badge,
                {
                  backgroundColor: colors.muted,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderStyle: 'dashed',
                },
              ]}
            >
              {settingDefault ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ transform: [{ scale: 0.65 }] }} />
              ) : (
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>Set Default</Text>
              )}
            </Pressable>
          ) : null}
        </View>
        <Text style={[styles.address, { color: colors.textSecondary }]} numberOfLines={3}>
          {address.fullAddress}
        </Text>
        {address.townOrCity || address.pincode ? (
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            {[address.townOrCity, address.state, address.pincode].filter(Boolean).join(', ')}
          </Text>
        ) : null}
      </View>
      {selectMode ? (
        <Feather name="chevron-right" size={20} color={colors.textSecondary} />
      ) : (
        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              lightHaptic();
              onEdit();
            }}
            hitSlop={8}
          >
            <Feather name="edit-2" size={18} color={colors.textSecondary} />
          </Pressable>
          <Pressable
            onPress={() => {
              lightHaptic();
              onDelete();
            }}
            hitSlop={8}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={colors.destructive} />
            ) : (
              <Feather name="trash-2" size={18} color={colors.destructive} />
            )}
          </Pressable>
        </View>
      )}
    </>
  );

  if (selectMode) {
    return (
      <Pressable
        onPress={() => {
          lightHaptic();
          onSelect?.();
        }}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        {cardContent}
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {cardContent}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  address: { fontSize: 13, lineHeight: 18 },
  meta: { fontSize: 12 },
  actions: { gap: 14, paddingTop: 4 },
});
