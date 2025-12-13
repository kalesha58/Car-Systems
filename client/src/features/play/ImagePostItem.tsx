import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { Colors, Fonts } from '@utils/Constants';
import { screenHeight, screenWidth } from '@utils/Scaling';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import ImageCarousel from './ImageCarousel';
import { IPost } from '../../types/post/IPost';
import { useTheme } from '@hooks/useTheme';

interface IImagePostItemProps {
  post: IPost;
}

const ImagePostItem: React.FC<IImagePostItemProps> = ({ post }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const { colors } = useTheme();
  const screenHeight = Dimensions.get('window').height;
  const imageHeight = screenHeight * 0.5;

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  const handleShare = () => {
    // Handle share functionality
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.userInfoContainer}>
        <Image
          source={
            post.userAvatar
              ? { uri: post.userAvatar }
              : require('@assets/icons/bucket.png')
          }
          style={styles.avatar}
        />
        <CustomText
          fontSize={RFValue(10)}
          fontFamily={Fonts.Medium}
          style={{ color: colors.text }}>
          {post.userName || `User ${post.userId.substring(0, 8)}`}
        </CustomText>
        <TouchableOpacity
          style={[
            styles.followButton,
            isFollowing && styles.followingButton,
          ]}
          onPress={handleFollow}>
          <CustomText
            fontSize={RFValue(8)}
            fontFamily={Fonts.Medium}
            style={styles.followButtonText}>
            {isFollowing ? 'Following' : 'Follow'}
          </CustomText>
        </TouchableOpacity>
      </View>

      <View style={styles.imageContainer}>
        {post.images && post.images.length > 0 ? (
          <ImageCarousel images={post.images} height={imageHeight} />
        ) : (
          <View style={[styles.placeholder, { height: imageHeight }]}>
            <Icon name="image-outline" size={RFValue(40)} color={Colors.disabled} />
          </View>
        )}
      </View>

      <View style={styles.actionsContainer}>
        <View style={styles.descriptionContainer}>
          <CustomText
            fontSize={RFValue(9)}
            fontFamily={Fonts.Regular}
            style={{ color: colors.text }}
            numberOfLines={2}>
            {post.text}
          </CustomText>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleLike}>
            <Icon
              name={isLiked ? 'heart' : 'heart-outline'}
              size={RFValue(16)}
              color={isLiked ? '#ff3040' : '#fff'}
            />
            <CustomText
              fontSize={RFValue(8)}
              fontFamily={Fonts.Medium}
              style={{ color: colors.text }}>
              {formatNumber(post.likes + (isLiked ? 1 : 0))}
            </CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}>
            <Icon name="share-outline" size={RFValue(16)} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: screenWidth,
    marginBottom: screenHeight * 0.02,
    paddingBottom: screenHeight * 0.01,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.008,
    gap: screenWidth * 0.02,
  },
  avatar: {
    width: screenWidth * 0.06,
    height: screenWidth * 0.06,
    borderRadius: screenWidth * 0.03,
  },

  followButton: {
    paddingHorizontal: screenWidth * 0.03,
    paddingVertical: screenHeight * 0.004,
    borderRadius: 12,
    backgroundColor: Colors.secondary,
  },
  followingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  followButtonText: {
    color: '#fff',
  },
  imageContainer: {
    position: 'relative',
    marginVertical: screenHeight * 0.005,
  },
  placeholder: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  actionsContainer: {
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.008,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  descriptionContainer: {
    flex: 1,
    marginRight: screenWidth * 0.03,
  },

  actionButtons: {
    flexDirection: 'row',
    gap: screenWidth * 0.03,
  },
  actionButton: {
    alignItems: 'center',
    gap: 2,
  },

});

export default ImagePostItem;

