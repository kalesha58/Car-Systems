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
  const [isFollowing, setIsFollowing] = useState(false);
  const { colors } = useTheme();
  const screenHeight = Dimensions.get('window').height;
  const imageHeight = screenHeight * 0.5;

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      {/* User Header Section */}
      <View style={[styles.userInfoContainer, { borderBottomColor: colors.backgroundSecondary }]}>
        <View style={styles.userInfoLeft}>
          <View style={[styles.avatarContainer, { borderColor: colors.backgroundSecondary }]}>
        <Image
          source={
            post.userAvatar
              ? { uri: post.userAvatar }
              : require('@assets/icons/bucket.png')
          }
          style={styles.avatar}
        />
          </View>
          <View style={styles.userNameContainer}>
        <CustomText
              fontSize={RFValue(13)}
              fontFamily={Fonts.SemiBold}
          style={{ color: colors.text }}>
          {post.userName || `User ${post.userId.substring(0, 8)}`}
        </CustomText>
            {post.createdAt && (
              <CustomText
                fontSize={RFValue(10)}
                fontFamily={Fonts.Regular}
                style={{ color: colors.disabled, marginTop: 2 }}>
                {new Date(post.createdAt).toLocaleDateString()}
              </CustomText>
            )}
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.followButton,
            isFollowing && styles.followingButton,
            { backgroundColor: isFollowing ? colors.backgroundSecondary : (colors.primary || Colors.secondary) },
          ]}
          onPress={handleFollow}
          activeOpacity={0.7}>
          <CustomText
            fontSize={RFValue(11)}
            fontFamily={Fonts.SemiBold}
            style={[styles.followButtonText, { color: isFollowing ? colors.text : '#fff' }]}>
            {isFollowing ? 'Following' : 'Follow'}
          </CustomText>
        </TouchableOpacity>
      </View>

      {/* Image/Content Section */}
      <View style={styles.imageContainer}>
        {post.images && post.images.length > 0 ? (
          <ImageCarousel images={post.images} height={imageHeight} />
        ) : (
          <View style={[styles.placeholder, { height: imageHeight, backgroundColor: colors.backgroundSecondary }]}>
            <Icon name="image-outline" size={RFValue(48)} color={colors.disabled} />
            <CustomText
              fontSize={RFValue(12)}
              fontFamily={Fonts.Regular}
              style={{ color: colors.disabled, marginTop: 12 }}>
              No image available
            </CustomText>
          </View>
        )}
      </View>

      {/* Description Section */}
      {post.text && (
        <View style={styles.descriptionContainer}>
          <CustomText
            fontSize={RFValue(13)}
            fontFamily={Fonts.Regular}
            style={{ color: colors.text }}
            numberOfLines={3}>
            <CustomText
              fontSize={RFValue(13)}
              fontFamily={Fonts.SemiBold}
              style={{ color: colors.text }}>
              {post.userName || `User ${post.userId.substring(0, 8)}`}{' '}
            </CustomText>
            {post.text}
          </CustomText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: screenWidth,
    marginBottom: screenHeight * 0.025,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.015,
    borderBottomWidth: 1,
  },
  userInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: screenWidth * 0.03,
  },
  avatarContainer: {
    width: screenWidth * 0.1,
    height: screenWidth * 0.1,
    borderRadius: screenWidth * 0.05,
    borderWidth: 2,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: screenWidth * 0.05,
  },
  userNameContainer: {
    flex: 1,
  },
  followButton: {
    paddingHorizontal: screenWidth * 0.05,
    paddingVertical: screenHeight * 0.01,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  followingButton: {
    borderWidth: 1,
  },
  followButtonText: {
    color: '#fff',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  placeholder: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  descriptionContainer: {
    paddingHorizontal: screenWidth * 0.04,
    paddingBottom: screenHeight * 0.015,
  },
});

export default ImagePostItem;

