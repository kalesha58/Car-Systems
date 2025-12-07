import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Switch,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@hooks/useTheme';
import {useAuthStore} from '@state/authStore';
import {getChatById, getUsers, editGroupChat} from '@service/chatService';
import {IChat, IUserListItem} from '../../types/chat';
import {useToast} from '@hooks/useToast';

const EditGroupScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {chatId} = route.params as {chatId: string};
  const {user} = useAuthStore();
  const {colors} = useTheme();
  const {showError, showSuccess} = useToast();

  const [chat, setChat] = useState<IChat | null>(null);
  const [groupName, setGroupName] = useState('');
  const [users, setUsers] = useState<IUserListItem[]>([]);
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState<Set<string>>(new Set());
  const [selectedUsersToRemove, setSelectedUsersToRemove] = useState<Set<string>>(new Set());
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadChat();
    loadUsers();
  }, []);

  const loadChat = async () => {
    try {
      const data = await getChatById(chatId);
      setChat(data);
      setGroupName(data.groupName || '');
      setIsPublic(data.groupId ? false : false); // Will be updated when we get group details
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to load chat');
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getUsers(1, 100);
      setUsers(data.users);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserToAdd = (userId: string) => {
    setSelectedUsersToAdd(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
        // Remove from remove list if it was there
        setSelectedUsersToRemove(prevRemove => {
          const newRemoveSet = new Set(prevRemove);
          newRemoveSet.delete(userId);
          return newRemoveSet;
        });
      }
      return newSet;
    });
  };

  const toggleUserToRemove = (userId: string) => {
    if (userId === user?.id) {
      Alert.alert('Cannot remove yourself', 'You cannot remove yourself from the group.');
      return;
    }
    setSelectedUsersToRemove(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
        // Remove from add list if it was there
        setSelectedUsersToAdd(prevAdd => {
          const newAddSet = new Set(prevAdd);
          newAddSet.delete(userId);
          return newAddSet;
        });
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!groupName.trim()) {
      showError('Group name is required');
      return;
    }

    setSaving(true);
    try {
      await editGroupChat(chatId, {
        name: groupName.trim(),
        userIdsToAdd: Array.from(selectedUsersToAdd),
        userIdsToRemove: Array.from(selectedUsersToRemove),
        privacy: isPublic ? 'public' : 'private',
      });
      showSuccess('Group updated successfully');
      navigation.goBack();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to update group');
    } finally {
      setSaving(false);
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          padding: 16,
        },
        inputContainer: {
          marginBottom: 24,
        },
        label: {
          fontSize: RFValue(14),
          fontFamily: Fonts.SemiBold,
          marginBottom: 8,
        },
        input: {
          backgroundColor: colors.cardBackground,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          fontSize: RFValue(14),
          fontFamily: Fonts.Regular,
          color: colors.text,
          borderWidth: 1,
          borderColor: colors.border,
        },
        privacyContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 16,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: colors.border,
          marginBottom: 16,
        },
        privacyText: {
          fontSize: RFValue(14),
          fontFamily: Fonts.Regular,
        },
        sectionTitle: {
          fontSize: RFValue(16),
          fontFamily: Fonts.SemiBold,
          marginBottom: 12,
          marginTop: 8,
        },
        userItem: {
          flexDirection: 'row',
          padding: 12,
          marginBottom: 12,
          backgroundColor: colors.cardBackground,
          borderRadius: 12,
          alignItems: 'center',
        },
        avatar: {
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: colors.border,
          marginRight: 12,
          justifyContent: 'center',
          alignItems: 'center',
        },
        avatarImage: {
          width: 50,
          height: 50,
          borderRadius: 25,
        },
        userInfo: {
          flex: 1,
        },
        userName: {
          fontSize: RFValue(16),
          fontFamily: Fonts.SemiBold,
          marginBottom: 4,
        },
        userEmail: {
          fontSize: RFValue(12),
          fontFamily: Fonts.Regular,
          color: colors.disabled,
        },
        actionButton: {
          padding: 8,
        },
        saveButton: {
          backgroundColor: colors.secondary,
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 24,
        },
        saveButtonDisabled: {
          opacity: 0.5,
        },
        saveButtonText: {
          color: colors.white,
          fontSize: RFValue(16),
          fontFamily: Fonts.SemiBold,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        memberBadge: {
          backgroundColor: colors.secondary,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
          marginLeft: 8,
        },
        memberBadgeText: {
          color: colors.white,
          fontSize: RFValue(10),
          fontFamily: Fonts.SemiBold,
        },
      }),
    [colors, user?.id],
  );

  const currentMemberIds = chat?.participants || [];
  const membersToShow = users.filter(u => currentMemberIds.includes(u.id));
  const nonMembers = users.filter(u => !currentMemberIds.includes(u.id));

  const renderUserItem = ({item}: {item: IUserListItem; isMember?: boolean}) => {
    const isMember = currentMemberIds.includes(item.id);
    const isSelectedToAdd = selectedUsersToAdd.has(item.id);
    const isSelectedToRemove = selectedUsersToRemove.has(item.id);
    const isOwner = item.id === user?.id;

    return (
      <View style={styles.userItem}>
        {item.profileImage ? (
          <Image source={{uri: item.profileImage}} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Icon name="person" size={RFValue(24)} color={colors.disabled} />
          </View>
        )}
        <View style={styles.userInfo}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <CustomText style={styles.userName}>{item.name}</CustomText>
            {isMember && (
              <View style={styles.memberBadge}>
                <CustomText style={styles.memberBadgeText}>Member</CustomText>
              </View>
            )}
            {isOwner && (
              <View style={[styles.memberBadge, {backgroundColor: colors.primary}]}>
                <CustomText style={styles.memberBadgeText}>Owner</CustomText>
              </View>
            )}
          </View>
          <CustomText style={styles.userEmail}>{item.email}</CustomText>
        </View>
        {isMember && !isOwner && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => toggleUserToRemove(item.id)}
            activeOpacity={0.7}>
            <Icon
              name={isSelectedToRemove ? 'close-circle' : 'remove-circle-outline'}
              size={RFValue(24)}
              color={isSelectedToRemove ? colors.secondary : colors.disabled}
            />
          </TouchableOpacity>
        )}
        {!isMember && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => toggleUserToAdd(item.id)}
            activeOpacity={0.7}>
            <Icon
              name={isSelectedToAdd ? 'checkmark-circle' : 'add-circle-outline'}
              size={RFValue(24)}
              color={isSelectedToAdd ? colors.secondary : colors.disabled}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Edit Group" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Edit Group" />
      <FlatList
        data={[...membersToShow, ...nonMembers]}
        renderItem={({item}) => renderUserItem({item})}
        keyExtractor={item => item.id}
        ListHeaderComponent={
          <View style={styles.content}>
            <View style={styles.inputContainer}>
              <CustomText style={styles.label}>Group Name</CustomText>
              <TextInput
                style={styles.input}
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Enter group name"
                placeholderTextColor={colors.disabled}
              />
            </View>

            <View style={styles.privacyContainer}>
              <CustomText style={styles.privacyText}>Public Group</CustomText>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{false: colors.border, true: colors.secondary}}
                thumbColor={colors.white}
              />
            </View>

            <CustomText style={styles.sectionTitle}>Members</CustomText>
          </View>
        }
        contentContainerStyle={styles.content}
        ListFooterComponent={
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving || !groupName.trim()}
            activeOpacity={0.8}>
            {saving ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <CustomText style={styles.saveButtonText}>Save Changes</CustomText>
            )}
          </TouchableOpacity>
        }
      />
    </View>
  );
};

export default EditGroupScreen;

