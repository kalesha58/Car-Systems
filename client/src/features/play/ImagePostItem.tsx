import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {RFValue} from 'react-native-responsive-fontsize';
import {Colors, Fonts} from '@utils/Constants';
import {screenHeight, screenWidth} from '@utils/Scaling';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import ImageCarousel from './ImageCarousel';
import {IPost} from '../../types/post/IPost';

interface IImagePostItemProps {
  post: IPost;
}

const ImagePostItem: React.FC<IImagePostItemProps> = ({post}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
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
    <View style={styles.container}>
      <View style={styles.userInfoContainer}>
        <Image
          source={
            post.userAvatar
              ? {uri: post.userAvatar}
              : require('@assets/icons/bucket.png')
          }
          style={styles.avatar}
        />
        <CustomText
          fontSize={RFValue(10)}
          fontFamily={Fonts.Medium}
          style={styles.userName}>
          {post.userName || 'Unknown User'}
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
          <View style={[styles.placeholder, {height: imageHeight}]}>
            <Icon name="image-outline" size={RFValue(40)} color={Colors.disabled} />
          </View>
        )}

        <View style={styles.overlayTop}>
          <View style={styles.popularTag}>
            <CustomText
              fontSize={RFValue(7)}
              fontFamily={Fonts.Medium}
              style={styles.popularText}>
              Popular
            </CustomText>
          </View>
          <View style={styles.viewCount}>
            <CustomText
              fontSize={RFValue(8)}
              fontFamily={Fonts.Medium}
              style={styles.viewCountText}>
              {formatNumber(post.likes * 100)}
            </CustomText>
          </View>
        </View>

        <View style={styles.overlayBottom}>
          <TouchableOpacity style={styles.shoppingButton}>
            <Icon name="bag-outline" size={RFValue(12)} color="#fff" />
            <CustomText
              fontSize={RFValue(8)}
              fontFamily={Fonts.Medium}
              style={styles.shoppingText}>
              4 Products
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <View style={styles.descriptionContainer}>
          <CustomText
            fontSize={RFValue(9)}
            fontFamily={Fonts.Regular}
            style={styles.description}
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
              style={styles.actionText}>
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
    backgroundColor: '#000',
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
  userName: {
    color: '#fff',
    flex: 1,
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
  overlayTop: {
    position: 'absolute',
    top: screenHeight * 0.01,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: screenWidth * 0.04,
  },
  popularTag: {
    backgroundColor: 'rgba(0, 123, 255, 0.9)',
    paddingHorizontal: screenWidth * 0.02,
    paddingVertical: screenHeight * 0.003,
    borderRadius: 3,
  },
  popularText: {
    color: '#fff',
  },
  viewCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: screenWidth * 0.02,
    paddingVertical: screenHeight * 0.003,
    borderRadius: 10,
  },
  viewCountText: {
    color: '#fff',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: screenHeight * 0.01,
    right: screenWidth * 0.04,
  },
  shoppingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: screenWidth * 0.02,
    paddingVertical: screenHeight * 0.004,
    borderRadius: 15,
  },
  shoppingText: {
    color: '#fff',
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
  description: {
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: screenWidth * 0.03,
  },
  actionButton: {
    alignItems: 'center',
    gap: 2,
  },
  actionText: {
    color: '#fff',
  },
});

export default ImagePostItem;

