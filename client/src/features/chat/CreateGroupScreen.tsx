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
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@hooks/useTheme';
import {getUsers, createGroupChat} from '@service/chatService';
import {IUserListItem} from '../../types/chat';
import {useToast} from '@hooks/useToast';

const CreateGroupScreen: React.FC = () => {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [users, setUsers] = useState<IUserListItem[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const {colors} = useTheme();
  const navigation = useNavigation();
  const {showError, showSuccess} = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

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

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      showError('Group name is required');
      return;
    }

    if (selectedUsers.size === 0) {
      showError('Please select at least one user');
      return;
    }

    setCreating(true);
    try {
      const chat = await createGroupChat({
        name: groupName.trim(),
        userIds: Array.from(selectedUsers),
        privacy: isPublic ? 'public' : 'private',
      });
      showSuccess('Group created successfully');
      (navigation as any).navigate('ChatMessage', {chatId: chat.id});
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to create group');
    } finally {
      setCreating(false);
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
        checkbox: {
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: colors.border,
          justifyContent: 'center',
          alignItems: 'center',
        },
        checkboxSelected: {
          backgroundColor: colors.secondary,
          borderColor: colors.secondary,
        },
        createButton: {
          backgroundColor: colors.secondary,
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 24,
        },
        createButtonDisabled: {
          opacity: 0.5,
        },
        createButtonText: {
          color: colors.white,
          fontSize: RFValue(16),
          fontFamily: Fonts.SemiBold,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }),
    [colors],
  );

  const renderUserItem = ({item}: {item: IUserListItem}) => {
    const isSelected = selectedUsers.has(item.id);

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => toggleUserSelection(item.id)}
        activeOpacity={0.7}>
        {item.profileImage ? (
          <Image source={{uri: item.profileImage}} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Icon name="person" size={RFValue(24)} color={colors.disabled} />
          </View>
        )}
        <View style={styles.userInfo}>
          <CustomText style={styles.userName}>{item.name}</CustomText>
          <CustomText style={styles.userEmail}>{item.email}</CustomText>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Icon name="checkmark" size={RFValue(16)} color={colors.white} />}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Create Group" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Create Group" />
      <FlatList
        data={users}
        renderItem={renderUserItem}
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

            <CustomText style={styles.sectionTitle}>
              Select Members ({selectedUsers.size})
            </CustomText>
          </View>
        }
        contentContainerStyle={styles.content}
        ListFooterComponent={
          <TouchableOpacity
            style={[
              styles.createButton,
              creating && styles.createButtonDisabled,
            ]}
            onPress={handleCreateGroup}
            disabled={creating || !groupName.trim() || selectedUsers.size === 0}
            activeOpacity={0.8}>
            {creating ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <CustomText style={styles.createButtonText}>Create Group</CustomText>
            )}
          </TouchableOpacity>
        }
      />
    </View>
  );
};

export default CreateGroupScreen;

