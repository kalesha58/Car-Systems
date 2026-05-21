import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import React, {FC} from 'react';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {useTheme} from '@hooks/useTheme';
import {IPost} from '../../../types/post/IPost';
import SkeletonLoader from '@components/ui/SkeletonLoader';
import {useTranslation} from 'react-i18next';
import {push} from '@utils/NavigationUtils';
import Icon from 'react-native-vector-icons/Ionicons';
import {deletePost} from '@service/postService';
import {useToast} from '@hooks/useToast';

interface PostGridProps {
  posts: IPost[];
  loading?: boolean;
  onPostPress?: (post: IPost) => void;
  /** When true, long-press a cell for edit/delete (own profile). */
  allowManagePosts?: boolean;
  onPostsChanged?: () => void;
}

const HAIR = StyleSheet.hairlineWidth;

function postThumbnailUri(item: IPost): string | null {
  const fromImages = item.images && item.images.length > 0 ? item.images[0] : null;
  if (fromImages) {
    return fromImages;
  }
  const legacy = (item as {mediaUrl?: string}).mediaUrl;
  return legacy ?? null;
}

const PostGrid: FC<PostGridProps> = ({
  posts,
  loading = false,
  onPostPress,
  allowManagePosts = false,
  onPostsChanged,
}) => {
  const {colors} = useTheme();
  const {t} = useTranslation();
  const {showSuccess, showError} = useToast();
  const screenWidth = Dimensions.get('window').width;
  const colW = screenWidth / 3;

  const confirmDeletePost = (post: IPost) => {
    Alert.alert(
      t('profile.deletePostConfirmTitle'),
      t('profile.deletePostConfirmMessage'),
      [
        {text: t('profile.cancel'), style: 'cancel'},
        {
          text: t('profile.deletePost'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(post.id);
              showSuccess(t('profile.postDeleted'));
              onPostsChanged?.();
            } catch (e: unknown) {
              const msg =
                e && typeof e === 'object' && 'message' in e
                  ? String((e as {message?: string}).message)
                  : t('profile.deletePostFailed');
              showError(msg);
            }
          },
        },
      ],
    );
  };

  const openPostManageMenu = (post: IPost) => {
    Alert.alert(
      t('profile.postOptionsTitle'),
      undefined,
      [
        {text: t('profile.cancel'), style: 'cancel'},
        {
          text: t('profile.editPost'),
          onPress: () => push('CreateNewPost', {postId: post.id}),
        },
        {
          text: t('profile.deletePost'),
          style: 'destructive',
          onPress: () => confirmDeletePost(post),
        },
      ],
    );
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: screenWidth,
    },
    postItem: {
      width: colW,
      aspectRatio: 1,
      backgroundColor: colors.cardBackground,
      overflow: 'hidden',
      borderRightWidth: HAIR,
      borderBottomWidth: HAIR,
      borderColor: colors.border,
    },
    postItemLastCol: {
      borderRightWidth: 0,
    },
    postImage: {
      width: '100%',
      height: '100%',
    },
    likesOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      paddingHorizontal: 6,
      paddingVertical: 4,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    likesText: {
      fontSize: RFValue(11),
      fontFamily: Fonts.SemiBold,
      color: '#fff',
      marginLeft: 4,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 56,
      paddingHorizontal: 40,
    },
    emptyTitle: {
      fontSize: RFValue(16),
      fontFamily: Fonts.SemiBold,
      color: colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptyText: {
      fontSize: RFValue(13),
      fontFamily: Fonts.Regular,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    hintText: {
      fontSize: RFValue(11),
      fontFamily: Fonts.Regular,
      color: colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 4,
    },
    skeletonGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      width: screenWidth,
    },
    skeletonItem: {
      width: colW,
      aspectRatio: 1,
      backgroundColor: colors.cardBackground,
      borderRightWidth: HAIR,
      borderBottomWidth: HAIR,
      borderColor: colors.border,
    },
    skeletonLastCol: {
      borderRightWidth: 0,
    },
  });

  const renderPostItem = (item: IPost, index: number) => {
    const uri = postThumbnailUri(item);
    const isLastCol = index % 3 === 2;
    const likeCount = typeof item.likes === 'number' ? item.likes : 0;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.postItem, isLastCol && styles.postItemLastCol]}
        onPress={() => onPostPress?.(item)}
        onLongPress={allowManagePosts ? () => openPostManageMenu(item) : undefined}
        delayLongPress={450}
        activeOpacity={0.85}>
        {uri ? (
          <Image source={{uri}} style={styles.postImage} resizeMode="cover" />
        ) : (
          <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
            <CustomText style={{color: colors.textSecondary, fontSize: RFValue(12)}}>
              No image
            </CustomText>
          </View>
        )}
        <View style={styles.likesOverlay} pointerEvents="none">
          <Icon name="heart" size={RFValue(12)} color="#fff" />
          <CustomText style={styles.likesText}>{likeCount}</CustomText>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <CustomText style={{fontSize: RFValue(48), color: colors.textSecondary, marginBottom: 12}}>
        📷
      </CustomText>
      <CustomText style={styles.emptyTitle}>No Posts Yet</CustomText>
      <CustomText style={styles.emptyText}>
        When you share photos, they'll appear here.
      </CustomText>
    </View>
  );

  if (loading) {
    const skeletonCount = 9;
    return (
      <View style={styles.container}>
        <View style={styles.skeletonGrid}>
          {Array.from({length: skeletonCount}, (_, index) => (
            <View
              key={`skeleton-${index}`}
              style={[styles.skeletonItem, index % 3 === 2 && styles.skeletonLastCol]}>
              <SkeletonLoader width="100%" height="100%" borderRadius={0} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (posts.length === 0) {
    return renderEmptyState();
  }

  return (
    <View style={styles.container}>
      {allowManagePosts ? (
        <CustomText style={styles.hintText}>{t('profile.postLongPressHint')}</CustomText>
      ) : null}
      <View style={styles.grid}>{posts.map((item, index) => renderPostItem(item, index))}</View>
    </View>
  );
};

export default PostGrid;
