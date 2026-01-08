import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React, {FC, useMemo} from 'react';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {useTheme} from '@hooks/useTheme';
import {IPost} from '../../../types/post/IPost';
import {Dimensions} from 'react-native';

interface PostGridProps {
  posts: IPost[];
  loading?: boolean;
  onPostPress?: (post: IPost) => void;
}

const PostGrid: FC<PostGridProps> = ({posts, loading = false, onPostPress}) => {
  const {colors, isDark} = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const itemSize = screenWidth / 3; // 3 columns with no gap (like Instagram)

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.background,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    postItem: {
      width: itemSize,
      height: itemSize,
      backgroundColor: colors.cardBackground,
    },
    postImage: {
      width: '100%',
      height: '100%',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 40,
    },
    emptyIcon: {
      marginBottom: 16,
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
    loadingContainer: {
      paddingVertical: 40,
      alignItems: 'center',
    },
  });

  const renderPostItem = (item: IPost) => {
    const firstImage = item.images && item.images.length > 0 ? item.images[0] : null;

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.postItem}
        onPress={() => onPostPress?.(item)}
        activeOpacity={0.8}>
        {firstImage ? (
          <Image
            source={{uri: firstImage}}
            style={styles.postImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.postItem, {justifyContent: 'center', alignItems: 'center'}]}>
            <CustomText style={{color: colors.textSecondary, fontSize: RFValue(12)}}>
              No image
            </CustomText>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <CustomText style={{fontSize: RFValue(48), color: colors.textSecondary}}>📷</CustomText>
      </View>
      <CustomText style={styles.emptyTitle}>No Posts Yet</CustomText>
      <CustomText style={styles.emptyText}>
        When you share photos, they'll appear here.
      </CustomText>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.secondary} />
      </View>
    );
  }

  if (posts.length === 0) {
    return renderEmptyState();
  }

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {posts.map((item) => renderPostItem(item))}
      </View>
    </View>
  );
};

export default PostGrid;

