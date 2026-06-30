import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Pressable,
  FlatList,
  Alert,
  Switch,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';
import { useColors } from '@hooks/useColors';
import { useChat } from '@context/ChatContext';
import { useAuth } from '@context/AuthContext';
import { ChromeHeader } from '@components/common';
import { lightHaptic } from '@utils/haptics';
import { sanitizeFirestoreData } from '@services/chat.service';

export function GroupInfoScreen() {
  const colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { user } = useAuth();
  const { activeConversation, leaveGroup } = useChat();

  const [members, setMembers] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  // Group Details
  const groupName = (activeConversation as any)?.name || 'Group Chat';
  const groupImage = (activeConversation as any)?.image;
  const description = (activeConversation as any)?.description || 'No description provided.';
  const admins = (activeConversation as any)?.admins || [];
  const isAdmin = user && auth().currentUser && admins.includes(auth().currentUser?.uid);

  // Load member profile details
  useEffect(() => {
    const fetchMembers = async () => {
      if (!activeConversation) return;
      try {
        const list: any[] = [];
        for (const memberId of activeConversation.participants) {
          const uDoc = await firestore().collection('users').doc(memberId).get();
          if (uDoc.exists) {
            list.push({ id: memberId, ...uDoc.data() });
          } else {
            const dDoc = await firestore().collection('dealers').doc(memberId).get();
            if (dDoc.exists) {
              list.push({ id: memberId, ...dDoc.data(), role: 'dealer' });
            }
          }
        }
        setMembers(list);
      } catch (err) {
        console.error('Failed to load group members:', err);
      }
    };
    void fetchMembers();
  }, [activeConversation]);

  const handleMuteToggle = (value: boolean) => {
    lightHaptic();
    setIsMuted(value);
    Alert.alert('Mute Notifications', value ? 'Group muted.' : 'Group unmuted.');
  };

  const handlePromoteAdmin = async (memberId: string) => {
    lightHaptic();
    Alert.alert('Promote Admin', 'Promote this user to group administrator?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Promote',
        onPress: async () => {
          try {
            const newAdmins = [...admins, memberId];
            await firestore().collection('conversations').doc(activeConversation?.id).update(sanitizeFirestoreData({
              admins: newAdmins,
            }));
            Alert.alert('Success', 'User promoted to administrator.');
          } catch (err) {
            console.error(err);
          }
        },
      },
    ]);
  };

  const handleRemoveMember = async (memberId: string) => {
    lightHaptic();
    Alert.alert('Remove Member', 'Are you sure you want to remove this member?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const newParts = activeConversation?.participants.filter((p) => p !== memberId) || [];
            const newAdmins = admins.filter((a: string) => a !== memberId);
            await firestore().collection('conversations').doc(activeConversation?.id).update(sanitizeFirestoreData({
              participants: newParts,
              admins: newAdmins,
            }));
            setMembers((prev) => prev.filter((m) => m.id !== memberId));
          } catch (err) {
            console.error(err);
          }
        },
      },
    ]);
  };

  const handleLeave = () => {
    lightHaptic();
    Alert.alert('Leave Group', 'Are you sure you want to leave this group?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: async () => {
          if (activeConversation) {
            await leaveGroup(activeConversation.id);
            navigation.popToTop();
          }
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ChromeHeader contentPad={8}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.headerForeground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>Group Info</Text>
        </View>
      </ChromeHeader>

      {/* Main details display */}
      <View style={[styles.detailsCard, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {groupImage ? (
          <Image source={{ uri: groupImage }} style={styles.groupImage} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.muted }]}>
            <Feather name="users" size={32} color={colors.textSecondary} />
          </View>
        )}
        <Text style={[styles.groupName, { color: colors.textPrimary }]}>{groupName}</Text>
        <Text style={[styles.description, { color: colors.textSecondary }]}>{description}</Text>
      </View>

      {/* Group Options Card */}
      <View style={[styles.optionsCard, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.optionRow}>
          <View style={styles.optionLeft}>
            <Feather name="bell-off" size={18} color={colors.textSecondary} />
            <Text style={[styles.optionText, { color: colors.textPrimary }]}>Mute Notifications</Text>
          </View>
          <Switch value={isMuted} onValueChange={handleMuteToggle} trackColor={{ true: colors.primary }} />
        </View>
      </View>

      {/* Members Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {members.length} MEMBERS
        </Text>
      </View>

      {/* Member list */}
      <FlatList
        data={members}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isUserAdmin = admins.includes(item.id);
          const isMe = user && auth().currentUser && item.id === auth().currentUser?.uid;

          return (
            <View style={[styles.memberRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.memberAvatar} />
              ) : (
                <View style={[styles.memberAvatarPlaceholder, { backgroundColor: colors.muted }]}>
                  <Feather name="user" size={14} color={colors.textSecondary} />
                </View>
              )}
              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: colors.textPrimary }]}>
                  {item.name} {isMe && '(You)'}
                </Text>
                {isUserAdmin && <Text style={[styles.adminTag, { color: colors.primary }]}>Admin</Text>}
              </View>

              {isAdmin && !isMe && (
                <View style={styles.adminActions}>
                  {!isUserAdmin && (
                    <Pressable
                      style={[styles.actionBtn, { backgroundColor: `${colors.primary}12` }]}
                      onPress={() => handlePromoteAdmin(item.id)}
                    >
                      <Text style={[styles.actionBtnText, { color: colors.primary }]}>Make Admin</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: `${colors.destructive}12` }]}
                    onPress={() => handleRemoveMember(item.id)}
                  >
                    <Feather name="x" size={14} color={colors.destructive} />
                  </Pressable>
                </View>
              )}
            </View>
          );
        }}
        ListFooterComponent={
          <Pressable
            style={({ pressed }) => [
              styles.leaveBtn,
              { backgroundColor: colors.card, borderBottomColor: colors.border, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={handleLeave}
          >
            <Feather name="log-out" size={18} color={colors.destructive} />
            <Text style={[styles.leaveText, { color: colors.destructive }]}>Leave Group</Text>
          </Pressable>
        }
      />
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
  detailsCard: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  groupImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  groupName: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
  optionsCard: {
    marginVertical: 12,
    borderBottomWidth: 0.5,
    borderTopWidth: 0.5,
    borderColor: 'transparent',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  memberAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  adminTag: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(230,0,18,0.1)',
  },
  adminActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    marginTop: 16,
  },
  leaveText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
});
