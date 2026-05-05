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
          backgroundColor: colors.secondary,
        },
        contentContainer: {
          flex: 1,
          backgroundColor: colors.background,
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          overflow: 'hidden',
        },
        searchContainer: {
          padding: 16,
          paddingBottom: 8,
        },
        searchWrapper: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.backgroundSecondary,
          borderRadius: 12,
          paddingHorizontal: 12,
          borderWidth: 1,
          borderColor: colors.border,
        },
        searchInput: {
          flex: 1,
          paddingVertical: 10,
          fontSize: RFValue(12),
          fontFamily: Fonts.Regular,
          color: colors.text,
          marginLeft: 8,
        },
        listContent: {
          paddingBottom: 20,
        },
        userItem: {
          flexDirection: 'row',
          paddingVertical: 12,
          paddingHorizontal: 16,
          alignItems: 'center',
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.border,
        },
        avatar: {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: colors.backgroundSecondary,
          marginRight: 12,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: colors.border,
        },
        avatarImage: {
          width: 44,
          height: 44,
          borderRadius: 22,
          marginRight: 12,
        },
        userInfo: {
          flex: 1,
        },
        userName: {
          fontSize: RFValue(12),
          fontFamily: Fonts.SemiBold,
          color: colors.text,
        },
        userEmail: {
          fontSize: RFValue(10),
          fontFamily: Fonts.Regular,
          color: colors.textSecondary,
          marginTop: 2,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
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
          <Icon name="person" size={RFValue(20)} color={colors.disabled} />
        </View>
      )}
      <View style={styles.userInfo}>
        <CustomText style={styles.userName}>{item.name}</CustomText>
        <CustomText style={styles.userEmail}>{item.email}</CustomText>
      </View>
      <Icon name="chevron-forward" size={RFValue(18)} color={colors.border} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader
          title="Select User"
          backgroundColor={colors.secondary}
          titleColor={colors.white}
          iconColor={colors.white}
        />
        <View style={styles.contentContainer}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.secondary} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader
        title="Select User"
        backgroundColor={colors.secondary}
        titleColor={colors.white}
        iconColor={colors.white}
      />
      <View style={styles.contentContainer}>
        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <Icon name="search-outline" size={RFValue(14)} color={colors.disabled} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              placeholderTextColor={colors.disabled}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
          </View>
        </View>
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
    </View>
  );
};

export default UserSelectionScreen;


