import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@hooks/useTheme';
import {getUsers, createDirectChat} from '@service/chatService';
import {IUserListItem} from '../../types/chat';
import {useToast} from '@hooks/useToast';

const UserSelectionScreen: React.FC = () => {
  const [users, setUsers] = useState<IUserListItem[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<IUserListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const {colors} = useTheme();
  const navigation = useNavigation();
  const {showError} = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = users.filter(
        user =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      const data = await getUsers(1, 100);
      setUsers(data.users);
      setFilteredUsers(data.users);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (userId: string) => {
    try {
      const chat = await createDirectChat({userId});
      (navigation as any).navigate('ChatMessage', {chatId: chat.id});
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to create chat');
    }
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        searchContainer: {
          padding: 16,
          backgroundColor: colors.cardBackground,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        searchInput: {
          backgroundColor: colors.background,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          fontSize: RFValue(14),
          fontFamily: Fonts.Regular,
          color: colors.text,
          borderWidth: 1,
          borderColor: colors.border,
        },
        listContent: {
          padding: 16,
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
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        emptyContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 40,
        },
        emptyText: {
          fontSize: RFValue(14),
          fontFamily: Fonts.Regular,
          color: colors.disabled,
          textAlign: 'center',
        },
      }),
    [colors],
  );

  const renderUserItem = ({item}: {item: IUserListItem}) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleSelectUser(item.id)}
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
      <Icon name="chevron-forward" size={RFValue(20)} color={colors.disabled} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Select User" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Select User" />
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={colors.disabled}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
      </View>
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="people-outline" size={RFValue(64)} color={colors.disabled} />
            <CustomText style={[styles.emptyText, {marginTop: 16}]}>
              No users found
            </CustomText>
          </View>
        }
      />
    </View>
  );
};

export default UserSelectionScreen;

