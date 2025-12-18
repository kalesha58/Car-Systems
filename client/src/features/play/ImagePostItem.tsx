import React from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { Fonts } from '@utils/Constants';
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
  const { colors } = useTheme();
  const screenHeight = Dimensions.get('window').height;
  const imageHeight = screenHeight * 0.5;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* User Header Section */}
      <View style={[styles.userInfoContainer, { borderBottomColor: colors.border }]}>
        <View style={styles.userInfoLeft}>
          <View style={[styles.avatarContainer, { borderColor: colors.border }]}>
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
            <View style={styles.nameRow}>
              <CustomText
                fontSize={RFValue(12)}
                fontFamily={Fonts.SemiBold}
                style={{ color: colors.text }}
                numberOfLines={1}>
                {post.userName || `User ${post.userId.substring(0, 8)}`}
              </CustomText>
              {post.createdAt && (
                <CustomText
                  fontSize={RFValue(9)}
                  fontFamily={Fonts.Regular}
                  style={{ color: colors.disabled, opacity: 0.9 }}
                  numberOfLines={1}>
                  {new Date(post.createdAt).toLocaleDateString()}
                </CustomText>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Image/Content Section */}
      <View style={styles.imageContainer}>
        {post.images && post.images.length > 0 ? (
          <ImageCarousel images={post.images} height={imageHeight} />
        ) : (
          <View style={[styles.placeholder, { height: imageHeight, backgroundColor: colors.backgroundSecondary }]}>
            <Icon name="image-outline" size={RFValue(48)} color={colors.disabled} />
            <CustomText
              fontSize={RFValue(10)}
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
            fontSize={RFValue(10)}
            fontFamily={Fonts.Regular}
            style={{ color: colors.text }}
            numberOfLines={3}>
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
    marginBottom: screenHeight * 0.018,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.01,
    borderBottomWidth: 1,
  },
  userInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: screenWidth * 0.03,
  },
  avatarContainer: {
    width: screenWidth * 0.085,
    height: screenWidth * 0.085,
    borderRadius: screenWidth * 0.085 / 2,
    borderWidth: 1,
    padding: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: screenWidth * 0.085 / 2,
  },
  userNameContainer: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 10,
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
    paddingTop: screenHeight * 0.01,
    paddingBottom: screenHeight * 0.012,
  },
});

export default ImagePostItem;

