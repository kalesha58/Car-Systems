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
  KeyboardAvoidingView,
  Platform,
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
      // Navigate back to Chat screen with groups tab selected
      (navigation as any).navigate('Chat', {initialTab: 'groups'});
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
          paddingBottom: 100, // Add padding for fixed button
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
        createButtonContainer: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.background,
          paddingHorizontal: 16,
          paddingVertical: 12,
          paddingBottom: Platform.OS === 'ios' ? 20 : 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        },
        createButton: {
          backgroundColor: colors.secondary,
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: 'center',
          justifyContent: 'center',
        },
        createButtonDisabled: {
          backgroundColor: colors.border,
          opacity: 0.6,
        },
        createButtonText: {
          color: colors.white,
          fontSize: RFValue(16),
          fontFamily: Fonts.SemiBold,
        },
        createButtonTextDisabled: {
          color: colors.disabled,
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

  const isButtonDisabled = !groupName.trim() || selectedUsers.size === 0 || creating;

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
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
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
      />
      
      {/* Fixed button at bottom */}
      <View style={styles.createButtonContainer}>
        <TouchableOpacity
          style={[
            styles.createButton,
            isButtonDisabled && styles.createButtonDisabled,
          ]}
          onPress={handleCreateGroup}
          disabled={isButtonDisabled}
          activeOpacity={0.8}>
          {creating ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <CustomText style={[
              styles.createButtonText,
              ...(isButtonDisabled ? [styles.createButtonTextDisabled] : [])
            ]}>
              Create Group
            </CustomText>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default CreateGroupScreen;

