import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from 'react-native-vector-icons/Feather';

import { CustomerStackRoutes } from '@constants/routes';
import { useToast } from '@context/index';
import { useColors } from '@hooks/useColors';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';
import { getBlockedUsers, unblockUser, type BlockedUser } from '@services/block.service';
import { getApiErrorMessage } from '@utils/apiHelpers';
import { lightHaptic, successHaptic } from '@utils/haptics';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.BlockedAccounts
>;

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function BlockedAccountsScreen({ navigation }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const bottomPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await getBlockedUsers();
      setBlocked(result);
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Failed to load blocked accounts'), 'error');
      setBlocked([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  const handleUnblock = (user: BlockedUser) => {
    lightHaptic();
    Alert.alert(
      'Unblock account',
      `${user.name} will be able to message you again. Continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              setUnblockingId(user.id);
              await unblockUser(user.id);
              successHaptic();
              setBlocked((prev) => prev.filter((item) => item.id !== user.id));
              showToast(`${user.name} unblocked`, 'success');
            } catch (error) {
              showToast(getApiErrorMessage(error, 'Failed to unblock account'), 'error');
            } finally {
              setUnblockingId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.secondary, paddingTop: topPad + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Blocked Accounts</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 24 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load();
              }}
              tintColor={colors.primary}
            />
          }
        >
          {blocked.length === 0 ? (
            <View style={styles.empty}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
                <Feather name="slash" size={28} color={colors.textTertiary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No blocked accounts
              </Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Accounts you block won't be able to message you. You can unblock them here at any
                time.
              </Text>
            </View>
          ) : (
            <>
              <Text style={[styles.hint, { color: colors.textSecondary }]}>
                {blocked.length} {blocked.length === 1 ? 'account is' : 'accounts are'} blocked.
                Blocked accounts can't message you.
              </Text>

              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {blocked.map((user, index) => (
                  <View
                    key={user.id}
                    style={[
                      styles.row,
                      index < blocked.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: colors.divider,
                      },
                    ]}
                  >
                    {user.avatar ? (
                      <Image source={{ uri: user.avatar }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: colors.muted }]}>
                        <Text style={[styles.avatarText, { color: colors.textSecondary }]}>
                          {getInitials(user.name)}
                        </Text>
                      </View>
                    )}

                    <View style={styles.textWrap}>
                      <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>
                        {user.name}
                      </Text>
                      <Text style={[styles.meta, { color: colors.textSecondary }]}>
                        {user.isDealer ? 'Dealer' : 'Customer'}
                      </Text>
                    </View>

                    <Pressable
                      style={({ pressed }) => [
                        styles.unblockBtn,
                        { borderColor: colors.primary, opacity: pressed ? 0.7 : 1 },
                      ]}
                      disabled={unblockingId === user.id}
                      onPress={() => handleUnblock(user)}
                    >
                      {unblockingId === user.id ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Text style={[styles.unblockText, { color: colors.primary }]}>Unblock</Text>
                      )}
                    </Pressable>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  headerSpacer: { width: 32 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 12 },
  hint: { fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 16 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  textWrap: { flex: 1 },
  name: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 2 },
  unblockBtn: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 7,
    minWidth: 78,
    alignItems: 'center',
  },
  unblockText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 10 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginTop: 4 },
  emptyText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 24,
  },
});
