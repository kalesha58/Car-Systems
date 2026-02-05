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
  ScrollView,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@hooks/useTheme';
import {getUsers} from '@service/chatService';
import {createGroup} from '@service/groupService';
import {IUserListItem} from '../../types/chat';
import {ICreateGroupRequest, ILocationPoint} from '../../types/group';
import {useToast} from '@hooks/useToast';
import {getCurrentLocationWithAddress} from '@utils/addressUtils';
import {ILocationData} from '../../types/address/IAddress';

const CreateGroupScreen: React.FC = () => {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [users, setUsers] = useState<IUserListItem[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<IUserListItem[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Trip plan fields
  const [plan, setPlan] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [startingPoint, setStartingPoint] = useState<ILocationPoint | null>(null);
  const [endingPoint, setEndingPoint] = useState<ILocationPoint | null>(null);
  const [selectingLocation, setSelectingLocation] = useState<'start' | 'end' | null>(null);
  
  const {colors} = useTheme();
  const navigation = useNavigation();
  const {showError, showSuccess} = useToast();

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

  const handleSelectLocation = async (type: 'start' | 'end') => {
    setSelectingLocation(type);
    try {
      const locationData = await getCurrentLocationWithAddress();
      if (locationData) {
        const locationPoint: ILocationPoint = {
          address: locationData.formattedAddress || locationData.address || 'Current Location',
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        };
        if (type === 'start') {
          setStartingPoint(locationPoint);
        } else {
          setEndingPoint(locationPoint);
        }
      } else {
        showError('Failed to get location');
      }
    } catch (error: any) {
      showError(error?.message || 'Failed to get location');
    } finally {
      setSelectingLocation(null);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      showError('Group name is required');
      return;
    }

    setCreating(true);
    try {
      const tripPlan: ICreateGroupRequest['tripPlan'] = {
        plan: plan.trim() || 'Group trip',
        startDate: startDate || new Date().toISOString(),
        endDate: endDate || new Date().toISOString(),
        startTime: startTime.trim() || undefined,
        endTime: endTime.trim() || undefined,
        startingPoint: startingPoint || undefined,
        endingPoint: endingPoint || undefined,
      };

      const groupData: ICreateGroupRequest = {
        name: groupName.trim(),
        type: 'bikeCarDrive',
        privacy: isPublic ? 'public' : 'private',
        tripPlan,
        chatEnabled: true,
        liveLocationEnabled: true,
      };

      const group = await createGroup(groupData);
      showSuccess('Group created successfully');
      
      // Show friends list after creation
      setShowFriends(true);
    } catch (error: any) {
      showError(error?.response?.data?.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleAddMembers = async () => {
    if (selectedUsers.size === 0) {
      showError('Please select at least one member');
      return;
    }

    // Navigate to group detail or add members
    // For now, just show success
    showSuccess('Members will be added to the group');
    (navigation as any).navigate('Chat', {initialTab: 'groups'});
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
          marginBottom: 16,
        },
        label: {
          fontSize: RFValue(14),
          fontFamily: Fonts.SemiBold,
          marginBottom: 8,
          color: colors.text,
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
        locationButton: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.cardBackground,
          borderRadius: 12,
          padding: 12,
          borderWidth: 1,
          borderColor: colors.border,
          marginTop: 8,
        },
        locationButtonText: {
          fontSize: RFValue(14),
          fontFamily: Fonts.Regular,
          color: colors.text,
          marginLeft: 8,
          flex: 1,
        },
        locationSelected: {
          borderColor: colors.secondary,
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
          color: colors.text,
        },
        sectionTitle: {
          fontSize: RFValue(16),
          fontFamily: Fonts.SemiBold,
          marginBottom: 12,
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
          color: colors.text,
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
        addMembersButton: {
          backgroundColor: colors.secondary,
          borderRadius: 12,
          paddingVertical: 12,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 16,
        },
        addMembersButtonText: {
          color: colors.white,
          fontSize: RFValue(14),
          fontFamily: Fonts.SemiBold,
        },
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
        timeRow: {
          flexDirection: 'row',
          gap: 12,
        },
        timeInput: {
          flex: 1,
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

  const isButtonDisabled = !groupName.trim() || creating;

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

  if (showFriends) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Add Members" />
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
            style={styles.addMembersButton}
            onPress={handleAddMembers}
            disabled={selectedUsers.size === 0}
            activeOpacity={0.8}>
            <CustomText style={styles.addMembersButtonText}>
              Add Selected Members
            </CustomText>
          </TouchableOpacity>
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
      <ScrollView style={styles.content} contentContainerStyle={{paddingBottom: 100}}>
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

        <View style={styles.inputContainer}>
          <CustomText style={styles.label}>Plan Description</CustomText>
          <TextInput
            style={[styles.input, {minHeight: 80, textAlignVertical: 'top'}]}
            value={plan}
            onChangeText={setPlan}
            placeholder="Enter trip plan description"
            placeholderTextColor={colors.disabled}
            multiline
          />
        </View>

        <View style={styles.inputContainer}>
          <CustomText style={styles.label}>Starting Point</CustomText>
          <TouchableOpacity
            style={[styles.locationButton, startingPoint && styles.locationSelected]}
            onPress={() => handleSelectLocation('start')}
            disabled={selectingLocation === 'start'}>
            {selectingLocation === 'start' ? (
              <ActivityIndicator size="small" color={colors.secondary} />
            ) : (
              <Icon name="location-outline" size={RFValue(20)} color={colors.secondary} />
            )}
            <CustomText style={styles.locationButtonText} numberOfLines={1}>
              {startingPoint?.address || 'Select starting point'}
            </CustomText>
            {startingPoint && (
              <Icon name="checkmark-circle" size={RFValue(20)} color={colors.secondary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <CustomText style={styles.label}>Ending Point</CustomText>
          <TouchableOpacity
            style={[styles.locationButton, endingPoint && styles.locationSelected]}
            onPress={() => handleSelectLocation('end')}
            disabled={selectingLocation === 'end'}>
            {selectingLocation === 'end' ? (
              <ActivityIndicator size="small" color={colors.secondary} />
            ) : (
              <Icon name="location-outline" size={RFValue(20)} color={colors.secondary} />
            )}
            <CustomText style={styles.locationButtonText} numberOfLines={1}>
              {endingPoint?.address || 'Select ending point'}
            </CustomText>
            {endingPoint && (
              <Icon name="checkmark-circle" size={RFValue(20)} color={colors.secondary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <CustomText style={styles.label}>Start Date</CustomText>
          <TextInput
            style={styles.input}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.disabled}
          />
        </View>

        <View style={styles.inputContainer}>
          <CustomText style={styles.label}>End Date</CustomText>
          <TextInput
            style={styles.input}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.disabled}
          />
        </View>

        <View style={styles.inputContainer}>
          <CustomText style={styles.label}>Timings</CustomText>
          <View style={styles.timeRow}>
            <TextInput
              style={styles.timeInput}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="Start time (HH:MM)"
              placeholderTextColor={colors.disabled}
            />
            <TextInput
              style={styles.timeInput}
              value={endTime}
              onChangeText={setEndTime}
              placeholder="End time (HH:MM)"
              placeholderTextColor={colors.disabled}
            />
          </View>
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
      </ScrollView>
      
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
            <CustomText style={styles.createButtonText}>
              Create Group
            </CustomText>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default CreateGroupScreen;
