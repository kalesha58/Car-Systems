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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';
import { useColors } from '@hooks/useColors';
import { useChat } from '@context/ChatContext';
import { ChromeHeader } from '@components/common';
import { CustomerStackRoutes } from '@constants/routes';
import { launchImageLibrary } from 'react-native-image-picker';
import { lightHaptic } from '@utils/haptics';
import { searchUsers } from '@services/chat.service';

export function CreateGroupScreen() {
  const colors = useColors();
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const { createGroup, setActiveConversationId } = useChat();

  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [groupImage, setGroupImage] = useState<string | null>(null);
  
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]); // User IDs

  // Load initial users list (mock query or first few profiles)
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const list = await searchUsers(query || ' ');
        setUsers(list);
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setLoading(false);
      }
    };
    void loadUsers();
  }, [query]);

  const selectImage = async () => {
    lightHaptic();
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
    });
    if (result.assets && result.assets[0]?.uri) {
      setGroupImage(result.assets[0].uri);
    }
  };

  const toggleSelectMember = (userId: string) => {
    lightHaptic();
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Required field', 'Please enter a group name.');
      return;
    }

    if (selectedMembers.length === 0) {
      Alert.alert('Required field', 'Please select at least one member to add.');
      return;
    }

    setLoading(true);
    try {
      const convId = await createGroup(groupName.trim(), selectedMembers, groupImage || undefined);
      setActiveConversationId(convId);
      navigation.replace(CustomerStackRoutes.Chat);
    } catch (err) {
      Alert.alert('Error', 'Failed to create group. Please try again.');
      console.error(err);
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
          <Text style={[styles.headerTitle, { color: colors.headerForeground }]}>New Group</Text>
          <Pressable style={styles.createBtn} onPress={handleCreate} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.createBtnText, { color: colors.primary }]}>Create</Text>
            )}
          </Pressable>
        </View>
      </ChromeHeader>

      {/* Group Details Form */}
      <View style={[styles.formContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.avatarRow}>
          <Pressable style={[styles.imagePicker, { backgroundColor: colors.muted }]} onPress={selectImage}>
            {groupImage ? (
              <Image source={{ uri: groupImage }} style={styles.groupImage} />
            ) : (
              <View style={styles.imagePickerPlaceholder}>
                <Feather name="camera" size={20} color={colors.textSecondary} />
                <Text style={[styles.imagePickerText, { color: colors.textSecondary }]}>Add Image</Text>
              </View>
            )}
          </Pressable>

          <View style={styles.inputs}>
            <TextInput
              placeholder="Group Name"
              placeholderTextColor={colors.textTertiary}
              value={groupName}
              onChangeText={setGroupName}
              style={[styles.input, { color: colors.textPrimary, borderBottomColor: colors.border }]}
              maxLength={40}
            />
            <TextInput
              placeholder="Description (optional)"
              placeholderTextColor={colors.textTertiary}
              value={description}
              onChangeText={setDescription}
              style={[styles.input, { color: colors.textPrimary, borderBottomColor: colors.border }]}
              maxLength={150}
            />
          </View>
        </View>
      </View>

      {/* Selected Members Scroll View */}
      {selectedMembers.length > 0 && (
        <View style={[styles.selectedHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
            Members Selected ({selectedMembers.length})
          </Text>
        </View>
      )}

      {/* Search Members Input */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={18} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search members..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
        </View>
      </View>

      {loading && users.length === 0 ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isSelected = selectedMembers.includes(item.id);
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.userRow,
                  { backgroundColor: pressed ? colors.muted : colors.card, borderBottomColor: colors.border },
                ]}
                onPress={() => toggleSelectMember(item.id)}
              >
                {item.avatar ? (
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.muted }]}>
                    <Feather name="user" size={18} color={colors.textSecondary} />
                  </View>
                )}
                <View style={styles.userDetails}>
                  <Text style={[styles.userName, { color: colors.textPrimary }]}>{item.name}</Text>
                  <Text style={[styles.userSub, { color: colors.textSecondary }]}>{item.email || 'No email contact'}</Text>
                </View>
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: colors.border },
                    isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                >
                  {isSelected && <Feather name="check" size={12} color="#fff" />}
                </View>
              </Pressable>
            );
          }}
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
  createBtn: {
    paddingHorizontal: 12,
  },
  createBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  formContainer: {
    padding: 16,
    borderBottomWidth: 0.5,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  imagePicker: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
  },
  groupImage: {
    width: '100%',
    height: '100%',
  },
  imagePickerPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  imagePickerText: {
    fontSize: 9,
    fontFamily: 'Inter_600SemiBold',
  },
  inputs: {
    flex: 1,
    gap: 12,
  },
  input: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    borderBottomWidth: 0.5,
    paddingVertical: 4,
  },
  selectedHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
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
    height: 38,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    paddingVertical: 0,
  },
  listContent: {
    paddingBottom: 24,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  userSub: {
    fontSize: 11,
    marginTop: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
