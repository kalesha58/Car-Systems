import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useAuthStore} from '@state/authStore';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@hooks/useTheme';
import {getUsers} from '@service/chatService';
import {getGroupById, getGroupMembers, addGroupMembers} from '@service/groupService';
import {getLiveLocations} from '@service/chatService';
import {IUserListItem} from '../../types/chat';
import {IGroup, IGroupMember} from '../../types/group';
import {useToast} from '@hooks/useToast';

const GroupDetailScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {groupId} = (route.params as any) || {};
  const {user} = useAuthStore();
  const {colors} = useTheme();
  const {showError, showSuccess} = useToast();

  const [group, setGroup] = useState<IGroup | null>(null);
  const [members, setMembers] = useState<IGroupMember[]>([]);
  const [liveLocations, setLiveLocations] = useState<any[]>([]);
  const [users, setUsers] = useState<IUserListItem[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<IUserListItem[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addingMembers, setAddingMembers] = useState(false);

  useEffect(() => {
    if (groupId) {
      loadGroupData();
    }
  }, [groupId]);

  useEffect(() => {
    if (showAddMembers) {
      loadUsers();
    }
  }, [showAddMembers]);

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

  // Poll for live locations when group is loaded
  useEffect(() => {
    if (!group || !group.liveLocationEnabled) return;

    const interval = setInterval(() => {
      loadLiveLocations();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [group]);

  const loadGroupData = async () => {
    try {
      const [groupData, membersData] = await Promise.all([
        getGroupById(groupId),
        getGroupMembers(groupId),
      ]);
      setGroup(groupData);
      setMembers(membersData);
      if (groupData.liveLocationEnabled) {
        await loadLiveLocations();
      }
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to load group');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadLiveLocations = async () => {
    try {
      const locations = await getLiveLocations(groupId);
      setLiveLocations(locations);
    } catch (error) {
      // Silently fail for live locations
    }
  };

  const loadUsers = async () => {
    try {
      const data = await getUsers(1, 100);
      // Filter out existing members
      const memberIds = new Set(members.map(m => m.userId));
      const availableUsers = data.users.filter(u => !memberIds.has(u.id));
      setUsers(availableUsers);
      setFilteredUsers(availableUsers);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to load users');
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadGroupData();
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

  const handleAddMembers = async () => {
    if (selectedUsers.size === 0) {
      showError('Please select at least one member');
      return;
    }

    setAddingMembers(true);
    try {
      await addGroupMembers(groupId, Array.from(selectedUsers));
      showSuccess('Members added successfully');
      setShowAddMembers(false);
      setSelectedUsers(new Set());
      await loadGroupData();
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to add members');
    } finally {
      setAddingMembers(false);
    }
  };

  const getMemberLiveLocation = (userId: string) => {
    return liveLocations.find(loc => loc.userId === userId);
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
        planBox: {
          backgroundColor: colors.cardBackground,
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
          borderWidth: 1,
          borderColor: colors.border,
        },
        planTitle: {
          fontSize: RFValue(16),
          fontFamily: Fonts.SemiBold,
          marginBottom: 12,
          color: colors.text,
        },
        planText: {
          fontSize: RFValue(14),
          fontFamily: Fonts.Regular,
          color: colors.text,
          marginBottom: 8,
        },
        planDetail: {
          fontSize: RFValue(12),
          fontFamily: Fonts.Regular,
          color: colors.disabled,
          marginTop: 4,
        },
        sectionTitle: {
          fontSize: RFValue(16),
          fontFamily: Fonts.SemiBold,
          marginBottom: 12,
          marginTop: 8,
          color: colors.text,
        },
        searchInput: {
          backgroundColor: colors.cardBackground,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 12,
          fontSize: RFValue(14),
          fontFamily: Fonts.Regular,
          color: colors.text,
          borderWidth: 1,
          borderColor: colors.border,
          marginBottom: 16,
        },
        memberItem: {
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
        memberInfo: {
          flex: 1,
        },
        memberName: {
          fontSize: RFValue(16),
          fontFamily: Fonts.SemiBold,
          marginBottom: 4,
          color: colors.text,
        },
        memberRole: {
          fontSize: RFValue(12),
          fontFamily: Fonts.Regular,
          color: colors.disabled,
        },
        liveLocationBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.secondary + '20',
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 8,
          marginTop: 4,
        },
        liveLocationText: {
          fontSize: RFValue(10),
          fontFamily: Fonts.Medium,
          color: colors.secondary,
          marginLeft: 4,
        },
        addButton: {
          backgroundColor: colors.secondary,
          borderRadius: 12,
          paddingVertical: 12,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 16,
        },
        addButtonText: {
          color: colors.white,
          fontSize: RFValue(14),
          fontFamily: Fonts.SemiBold,
        },
        userItem: {
          flexDirection: 'row',
          padding: 12,
          marginBottom: 12,
          backgroundColor: colors.cardBackground,
          borderRadius: 12,
          alignItems: 'center',
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
      }),
    [colors],
  );

  const renderMember = ({item}: {item: IGroupMember}) => {
    const liveLocation = getMemberLiveLocation(item.userId);
    const isCurrentUser = item.userId === user?.id;

    return (
      <View style={styles.memberItem}>
        {item.userAvatar ? (
          <Image source={{uri: item.userAvatar}} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Icon name="person" size={RFValue(24)} color={colors.disabled} />
          </View>
        )}
        <View style={styles.memberInfo}>
          <CustomText style={styles.memberName}>
            {item.userName || 'Unknown'} {isCurrentUser && '(You)'}
          </CustomText>
          <CustomText style={styles.memberRole}>
            {item.role === 'admin' ? 'Admin' : 'Member'}
          </CustomText>
          {liveLocation && (
            <View style={styles.liveLocationBadge}>
              <Icon name="location" size={RFValue(12)} color={colors.secondary} />
              <CustomText style={styles.liveLocationText}>Live Location Active</CustomText>
            </View>
          )}
        </View>
      </View>
    );
  };

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
        <View style={styles.memberInfo}>
          <CustomText style={styles.memberName}>{item.name}</CustomText>
          <CustomText style={styles.memberRole}>{item.email}</CustomText>
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
        <CustomHeader title="Group Details" />
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      </View>
    );
  }

  if (!group) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Group Details" />
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40}}>
          <CustomText style={{color: colors.disabled}}>Group not found</CustomText>
        </View>
      </View>
    );
  }

  if (showAddMembers) {
    return (
      <View style={styles.container}>
        <CustomHeader
          title="Add Members"
          onBackPress={() => setShowAddMembers(false)}
        />
        <View style={styles.content}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search friends..."
            placeholderTextColor={colors.disabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <CustomText style={styles.sectionTitle}>
            Select Members ({selectedUsers.size})
          </CustomText>
          <FlatList
            data={filteredUsers}
            renderItem={renderUserItem}
            keyExtractor={item => item.id}
            style={{maxHeight: '70%'}}
          />
          <TouchableOpacity
            style={[styles.addButton, addingMembers && {opacity: 0.6}]}
            onPress={handleAddMembers}
            disabled={addingMembers || selectedUsers.size === 0}
            activeOpacity={0.8}>
            {addingMembers ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <CustomText style={styles.addButtonText}>
                Add Selected Members
              </CustomText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader
        title={group.name}
        rightComponent={
          group.ownerId === user?.id ? (
            <TouchableOpacity
              onPress={() => setShowAddMembers(true)}
              style={{padding: 8}}
              activeOpacity={0.7}>
              <Icon name="person-add-outline" size={RFValue(24)} color={colors.secondary} />
            </TouchableOpacity>
          ) : null
        }
      />
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.secondary} />
        }>
        {group.tripPlan && (
          <View style={styles.planBox}>
            <CustomText style={styles.planTitle}>Trip Plan</CustomText>
            <CustomText style={styles.planText}>{group.tripPlan.plan}</CustomText>
            {group.tripPlan.startingPoint && (
              <CustomText style={styles.planDetail}>
                📍 Start: {group.tripPlan.startingPoint.address}
              </CustomText>
            )}
            {group.tripPlan.endingPoint && (
              <CustomText style={styles.planDetail}>
                🎯 End: {group.tripPlan.endingPoint.address}
              </CustomText>
            )}
            {group.tripPlan.startDate && (
              <CustomText style={styles.planDetail}>
                📅 {new Date(group.tripPlan.startDate).toLocaleDateString()}
                {group.tripPlan.endDate && ` - ${new Date(group.tripPlan.endDate).toLocaleDateString()}`}
              </CustomText>
            )}
            {group.tripPlan.startTime && group.tripPlan.endTime && (
              <CustomText style={styles.planDetail}>
                ⏰ {group.tripPlan.startTime} - {group.tripPlan.endTime}
              </CustomText>
            )}
          </View>
        )}

        <CustomText style={styles.sectionTitle}>
          Members ({members.length})
        </CustomText>
        <FlatList
          data={members}
          renderItem={renderMember}
          keyExtractor={item => item.id}
          scrollEnabled={false}
        />
      </ScrollView>
    </View>
  );
};

export default GroupDetailScreen;
