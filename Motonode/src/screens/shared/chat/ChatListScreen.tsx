import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';
import { useColors } from '@hooks/useColors';
import { useChat } from '@context/ChatContext';
import { ChromeHeader } from '@components/common';
import { ConversationCard } from '@components/chat/ConversationCard';
import { CustomerStackRoutes } from '@constants/routes';
import { ensureFirebaseReady } from '@services/firebaseAuthBridge';
import { useAuth } from '@context/AuthContext';
import { ConversationListSkeleton } from '@components/loaders';
import { lightHaptic } from '@utils/haptics';
import auth from '@react-native-firebase/auth';

type FilterType = 'all' | 'private' | 'dealer' | 'group';

export function ChatListScreen() {
  const colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { conversations, loadingConversations, setActiveConversationId } = useChat();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // Filter conversations based on query and filter tab
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      // 1. Filter by category tab
      if (activeFilter !== 'all') {
        if (activeFilter === 'group' && conv.type !== 'group') return false;
        if (activeFilter === 'dealer' && conv.type !== 'dealer') return false;
        if (activeFilter === 'private' && (conv.type !== 'private' && conv.type !== 'ai')) return false;
      }

      // 2. Filter by search query
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = conv.otherParticipantName?.toLowerCase().includes(query);
        const lastMsgMatch = conv.lastMessage?.text?.toLowerCase().includes(query);
        const groupNameMatch = conv.type === 'group' && (conv as any).name?.toLowerCase().includes(query);
        return nameMatch || lastMsgMatch || groupNameMatch;
      }

      return true;
    });
  }, [conversations, activeFilter, searchQuery]);

  const handleConversationPress = (convId: string, convType: string) => {
    lightHaptic();
    setActiveConversationId(convId);
    if (convType === 'ai') {
      navigation.navigate(CustomerStackRoutes.AiAssistant);
    } else if (convType === 'dealer') {
      navigation.navigate(CustomerStackRoutes.DealerChat);
    } else {
      navigation.navigate(CustomerStackRoutes.Chat);
    }
  };

  const renderFilterTab = (label: string, value: FilterType) => {
    const isSelected = activeFilter === value;
    return (
      <Pressable
        key={value}
        style={[
          styles.filterTab,
          isSelected && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
        ]}
        onPress={() => {
          lightHaptic();
          setActiveFilter(value);
        }}
      >
        <Text
          style={[
            styles.filterTabText,
            { color: isSelected ? colors.primary : colors.textSecondary },
            isSelected && { fontFamily: 'Inter_600SemiBold' },
          ]}
        >
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChromeHeader contentPad={8}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.headerForeground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>Chats</Text>
          <View style={styles.headerRightActions}>
            <Pressable style={styles.iconBtn} onPress={() => navigation.navigate(CustomerStackRoutes.CreateChat)}>
              <Feather name="edit" size={20} color={colors.headerForeground} />
            </Pressable>
            <Pressable style={styles.iconBtn}>
              <Feather name="more-vertical" size={20} color={colors.headerForeground} />
            </Pressable>
          </View>
        </View>
      </ChromeHeader>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search conversations"
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Feather name="x" size={16} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filters Tab Bar */}
      <View style={[styles.filtersContainer, { borderBottomColor: colors.border }]}>
        {renderFilterTab('All', 'all')}
        {renderFilterTab('Users', 'private')}
        {renderFilterTab('Dealers', 'dealer')}
        {renderFilterTab('Groups', 'group')}
      </View>

      {loadingConversations ? (
        <ScrollView style={{ flex: 1 }}>
          <ConversationListSkeleton />
        </ScrollView>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ConversationCard
              conversation={item}
              currentUserId={auth().currentUser?.uid || ''}
              onPress={() => handleConversationPress(item.id, item.type)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="message-square" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No conversations found.
              </Text>
            </View>
          }
          ListFooterComponent={
            /* Start a Chat card replicating the design mockup */
            <View style={[styles.startChatCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.startChatTitle, { color: colors.textPrimary }]}>Start a Chat</Text>
              <Text style={[styles.startChatSubtitle, { color: colors.textSecondary }]}>
                Chat with users, dealers or create a group
              </Text>

              <Pressable
                style={[styles.startChatRow, { borderBottomColor: colors.border }]}
                onPress={() => {
                  lightHaptic();
                  navigation.navigate(CustomerStackRoutes.CreateChat);
                }}
              >
                <View style={[styles.startChatIconBg, { backgroundColor: `${colors.primary}12` }]}>
                  <Feather name="message-circle" size={18} color={colors.primary} />
                </View>
                <View style={styles.startChatRowContent}>
                  <Text style={[styles.startChatRowText, { color: colors.textPrimary }]}>New Chat</Text>
                  <Feather name="chevron-right" size={16} color={colors.textTertiary} />
                </View>
              </Pressable>

              <Pressable
                style={[styles.startChatRow, { borderBottomColor: colors.border }]}
                onPress={() => {
                  lightHaptic();
                  navigation.navigate(CustomerStackRoutes.CreateGroup);
                }}
              >
                <View style={[styles.startChatIconBg, { backgroundColor: `${colors.primary}12` }]}>
                  <Feather name="users" size={18} color={colors.primary} />
                </View>
                <View style={styles.startChatRowContent}>
                  <Text style={[styles.startChatRowText, { color: colors.textPrimary }]}>New Group</Text>
                  <Feather name="chevron-right" size={16} color={colors.textTertiary} />
                </View>
              </Pressable>

              <Pressable
                style={styles.startChatRow}
                onPress={() => {
                  lightHaptic();
                  navigation.navigate(CustomerStackRoutes.CreateChat);
                }}
              >
                <View style={[styles.startChatIconBg, { backgroundColor: `${colors.primary}12` }]}>
                  <Feather name="map-pin" size={18} color={colors.primary} />
                </View>
                <View style={styles.startChatRowContent}>
                  <Text style={[styles.startChatRowText, { color: colors.textPrimary }]}>Find Dealers</Text>
                  <Feather name="chevron-right" size={16} color={colors.textTertiary} />
                </View>
              </Pressable>
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
    flex: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  filterTab: {
    paddingVertical: 12,
    marginRight: 24,
  },
  filterTabText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  listContent: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  // Start a chat card styles
  startChatCard: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 0.5,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  startChatTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  startChatSubtitle: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginBottom: 16,
  },
  startChatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  startChatIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  startChatRowContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  startChatRowText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
});
