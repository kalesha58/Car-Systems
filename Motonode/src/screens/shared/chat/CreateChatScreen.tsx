import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';
import { useColors } from '@hooks/useColors';
import { useChat } from '@context/ChatContext';
import { ChromeHeader } from '@components/common';
import { CustomerStackRoutes } from '@constants/routes';
import { lightHaptic } from '@utils/haptics';
import { searchUsers, searchDealers } from '@services/chat.service';
import { verifyDealerForChat } from '@services/chatGate.service';
import { ensureFirebaseReady } from '@services/firebaseAuthBridge';
import { useAuth } from '@context/AuthContext';
import { useMobileVerificationGate } from '@context/MobileVerificationContext';
import { UserSearchListSkeleton } from '@components/loaders';

export function CreateChatScreen() {
  const colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user } = useAuth();
  const { runWithMobileCheck } = useMobileVerificationGate();
  const { createConversation, setActiveConversationId } = useChat();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searchMode, setSearchMode] = useState<'users' | 'dealers'>('users');

  // Trigger search on query change or mode change
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        let searchResults = [];
        if (searchMode === 'users') {
          searchResults = await searchUsers(query);
        } else {
          searchResults = await searchDealers(query);
        }
        setResults(searchResults);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, query.trim() ? 400 : 0);

    return () => clearTimeout(delayDebounce);
  }, [query, searchMode]);

  const handleSelectParticipant = async (participantId: string, role: string) => {
    lightHaptic();
    if (!user || user.isGuest) {
      Alert.alert('Sign in required', 'Please sign in to start a chat.');
      return;
    }

    const isDealerChat = role === 'dealer' || searchMode === 'dealers';
    if (!isDealerChat) {
      await proceedWithChat(participantId, role);
      return;
    }

    await runWithMobileCheck(async () => {
      await proceedWithChat(participantId, role);
    });
  };

  const proceedWithChat = async (participantId: string, role: string) => {
    setLoading(true);
    try {
      const selectedUser = results.find((r) => r.id === participantId);
      if (!selectedUser) return;

      await ensureFirebaseReady(user!.id);

      const isDealer = role === 'dealer' || searchMode === 'dealers';
      let targetUserId = participantId;
      let dealerId: string | undefined;
      let dealerName = selectedUser.name;

      if (isDealer) {
        const dealerInfo = await verifyDealerForChat(participantId);
        targetUserId = dealerInfo.userId;
        dealerId = participantId;
        dealerName = dealerInfo.businessName || selectedUser.name;
      }

      const type = isDealer ? 'dealer' : 'private';
      const convId = await createConversation(targetUserId, type, {
        dealerId,
        participantNames: {
          [user!.id]: user!.name,
          [targetUserId]: dealerName,
        },
      });
      setActiveConversationId(convId);

      if (type === 'dealer') {
        navigation.replace(CustomerStackRoutes.DealerChat);
      } else {
        navigation.replace(CustomerStackRoutes.Chat);
      }
    } catch (err: unknown) {
      console.error('Failed to start chat:', err);
      const message = err instanceof Error ? err.message : 'Please try again.';
      Alert.alert('Unable to start chat', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChromeHeader contentPad={8}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.headerForeground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>New Chat</Text>
        </View>
      </ChromeHeader>

      {/* Mode Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
        <Pressable
          style={[styles.tab, searchMode === 'users' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => {
            lightHaptic();
            setSearchMode('users');
            setResults([]);
          }}
        >
          <Text style={[styles.tabText, { color: searchMode === 'users' ? colors.primary : colors.textSecondary }]}>
            Users
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, searchMode === 'dealers' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
          onPress={() => {
            lightHaptic();
            setSearchMode('dealers');
            setResults([]);
          }}
        >
          <Text style={[styles.tabText, { color: searchMode === 'dealers' ? colors.primary : colors.textSecondary }]}>
            Dealers
          </Text>
        </Pressable>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            placeholder={searchMode === 'users' ? "Search users by name, email, plate..." : "Search dealers..."}
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            autoFocus
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <Feather name="x" size={16} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {loading ? (
        <ScrollView style={{ flex: 1 }}>
          <UserSearchListSkeleton />
        </ScrollView>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.resultRow,
                { backgroundColor: pressed ? colors.muted : colors.card, borderBottomColor: colors.border },
              ]}
              onPress={() => handleSelectParticipant(item.id, item.role || (searchMode === 'dealers' ? 'dealer' : 'user'))}
            >
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.muted }]}>
                  <Feather name="user" size={18} color={colors.textSecondary} />
                </View>
              )}
              <View style={styles.resultDetails}>
                <Text style={[styles.resultName, { color: colors.textPrimary }]}>{item.name}</Text>
                {item.matchedPlate ? (
                  <View style={styles.plateRow}>
                    <Text style={[styles.plateLabel, { color: colors.primary }]}>{item.matchedPlate}</Text>
                    <Text style={[styles.resultSub, { color: colors.textSecondary }]}> • {item.email || item.phone || 'No contact'}</Text>
                  </View>
                ) : (
                  <Text style={[styles.resultSub, { color: colors.textSecondary }]}>{item.email || item.phone || 'No contact details'}</Text>
                )}
              </View>
              <Feather name="message-square" size={18} color={colors.primary} />
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="users" size={40} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {query.trim().length > 0 ? 'No matching profiles found.' : `Type to search for ${searchMode}.`}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    marginLeft: 8,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 0.5,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 0,
  },
  listContent: {
    paddingBottom: 24,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  resultDetails: {
    flex: 1,
  },
  resultName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  resultSub: {
    fontSize: 12,
    marginTop: 2,
  },
  plateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  plateLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
});
