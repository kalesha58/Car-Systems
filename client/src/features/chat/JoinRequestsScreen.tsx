import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '@hooks/useTheme';
import {getJoinRequestsForGroup, approveJoinRequest, rejectJoinRequest} from '@service/chatService';
import {IGroupJoinRequest} from '../../types/chat';
import {useToast} from '@hooks/useToast';

const JoinRequestsScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const {groupId} = route.params as {groupId: string};
  const {colors} = useTheme();
  const {showError, showSuccess} = useToast();

  const [requests, setRequests] = useState<IGroupJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const loadRequests = async () => {
    try {
      const data = await getJoinRequestsForGroup(groupId);
      setRequests(data);
    } catch (error: any) {
      showError(error?.response?.data?.Response?.ReturnMessage || 'Failed to load join requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [groupId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const handleApprove = async (requestId: string) => {
    if (processingIds.has(requestId)) return;

    try {
      setProcessingIds(prev => new Set(prev).add(requestId));
      await approveJoinRequest(requestId);
      showSuccess('Join request approved');
      loadRequests();
    } catch (error: any) {
      showError(error?.response?.data?.Response?.ReturnMessage || 'Failed to approve request');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleReject = async (requestId: string) => {
    if (processingIds.has(requestId)) return;

    try {
      setProcessingIds(prev => new Set(prev).add(requestId));
      await rejectJoinRequest(requestId);
      showSuccess('Join request rejected');
      loadRequests();
    } catch (error: any) {
      showError(error?.response?.data?.Response?.ReturnMessage || 'Failed to reject request');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        listContent: {
          padding: 16,
        },
        requestItem: {
          flexDirection: 'row',
          padding: 16,
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
        requestContent: {
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
          marginBottom: 4,
        },
        requestTime: {
          fontSize: RFValue(10),
          fontFamily: Fonts.Regular,
          color: colors.disabled,
        },
        actionsContainer: {
          flexDirection: 'row',
          gap: 8,
        },
        actionButton: {
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 8,
          minWidth: 80,
          alignItems: 'center',
        },
        approveButton: {
          backgroundColor: colors.secondary,
        },
        rejectButton: {
          backgroundColor: colors.border,
        },
        actionButtonText: {
          fontSize: RFValue(12),
          fontFamily: Fonts.SemiBold,
        },
        approveButtonText: {
          color: colors.white,
        },
        rejectButtonText: {
          color: colors.text,
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
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        },
      }),
    [colors],
  );

  const renderRequestItem = ({item}: {item: IGroupJoinRequest}) => {
    const isProcessing = processingIds.has(item.id);

    return (
      <View style={styles.requestItem}>
        {item.userAvatar ? (
          <Image source={{uri: item.userAvatar}} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Icon name="person" size={RFValue(24)} color={colors.disabled} />
          </View>
        )}
        <View style={styles.requestContent}>
          <CustomText style={styles.userName}>{item.userName || 'Unknown User'}</CustomText>
          {item.userEmail && (
            <CustomText style={styles.userEmail}>{item.userEmail}</CustomText>
          )}
          <CustomText style={styles.requestTime}>Requested {formatDate(item.requestedAt)}</CustomText>
        </View>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleApprove(item.id)}
            disabled={isProcessing}
            activeOpacity={0.7}>
            <CustomText style={[styles.actionButtonText, styles.approveButtonText]}>
              {isProcessing ? '...' : 'Accept'}
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleReject(item.id)}
            disabled={isProcessing}
            activeOpacity={0.7}>
            <CustomText style={[styles.actionButtonText, styles.rejectButtonText]}>
              {isProcessing ? '...' : 'Reject'}
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="checkmark-circle-outline" size={RFValue(64)} color={colors.disabled} />
      <CustomText style={[styles.emptyText, {marginTop: 16}]}>
        No pending join requests
      </CustomText>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Join Requests" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader title="Join Requests" />
      <FlatList
        data={requests}
        renderItem={renderRequestItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.secondary} />
        }
      />
    </View>
  );
};

export default JoinRequestsScreen;


