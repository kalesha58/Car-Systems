import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Image,
  Dimensions,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  FlatList,
  ScrollView,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { Fonts } from '@utils/Constants';
import { screenHeight, screenWidth } from '@utils/Scaling';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import ImageCarousel from './ImageCarousel';
import { IPost, IComment } from '../../types/post/IPost';
import { useTheme } from '@hooks/useTheme';
import { likePost, unlikePost, addComment } from '@service/postService';
import { SOCKET_URL } from '@service/config';
import { io, Socket } from 'socket.io-client';
import { formatRelativeTime } from '@utils/timeUtils';
import { useAuthStore } from '@state/authStore';

interface IImagePostItemProps {
  post: IPost;
}

const ImagePostItem: React.FC<IImagePostItemProps> = ({ post }) => {
  const { colors, isDark } = useTheme();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes || 0);
  const [commentCount, setCommentCount] = useState(post.comments?.length || 0);
  const [comments, setComments] = useState<IComment[]>(post.comments || []);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const screenHeight = Dimensions.get('window').height;
  const imageHeight = screenHeight * 0.5;

  // Theme-aware background: black for dark mode, white for light mode (matching reference)
  const postBackground = isDark ? colors.black : colors.white;
  const textColor = isDark ? colors.white : colors.text;
  const iconColor = isDark ? colors.white : colors.text;
  const secondaryTextColor = isDark ? colors.textSecondary : colors.disabled;

  // Set up Socket.io connection for real-time updates
  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      withCredentials: true,
    });

    socketRef.current = socket;

    // Join post room for real-time updates
    socket.emit('joinPost', post.id);

    // Listen for like updates
    socket.on('postLiked', (data: { postId: string; likes: number; isLiked: boolean }) => {
      if (data.postId === post.id) {
        setLikeCount(data.likes);
        // Only update isLiked if it's not our own action (to avoid double updates)
        // The API response will handle our own actions
      }
    });

    // Listen for unlike updates
    socket.on('postUnliked', (data: { postId: string; likes: number; isLiked: boolean }) => {
      if (data.postId === post.id) {
        setLikeCount(data.likes);
      }
    });

    // Listen for comment updates
    socket.on('commentAdded', (data: { postId: string; comment: IComment; commentCount: number }) => {
      if (data.postId === post.id) {
        setCommentCount(data.commentCount);
        // Add new comment to list if it exists
        if (data.comment) {
          setComments((prev) => [...prev, data.comment]);
        }
      }
    });

    return () => {
      socket.emit('leavePost', post.id);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [post.id]);

  // Update local state when post prop changes
  useEffect(() => {
    setIsLiked(post.isLiked || false);
    setLikeCount(post.likes || 0);
    setCommentCount(post.comments?.length || 0);
    setComments(post.comments || []);
  }, [post.isLiked, post.likes, post.comments]);

  const formatCount = (count: number): string => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const handleLike = async () => {
    const previousLiked = isLiked;
    const previousCount = likeCount;

    // Optimistic update
    setIsLiked(!previousLiked);
    setLikeCount(previousLiked ? previousCount - 1 : previousCount + 1);

    // Animate heart icon
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      if (previousLiked) {
        const response = await unlikePost(post.id);
        if (response.success && response.Response) {
          setIsLiked(response.Response.isLiked || false);
          setLikeCount(response.Response.likes || 0);
        }
      } else {
        const response = await likePost(post.id);
        if (response.success && response.Response) {
          setIsLiked(response.Response.isLiked || false);
          setLikeCount(response.Response.likes || 0);
        }
      }
    } catch (error) {
      // Rollback on error
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const previousCount = commentCount;
    const previousComments = [...comments];

    // Optimistic update
    setCommentCount(previousCount + 1);

    try {
      const response = await addComment(post.id, commentText.trim());
      if (response.success && response.Response) {
        setCommentCount(response.Response.comments?.length || 0);
        setComments(response.Response.comments || []);
        setCommentText('');
        // Don't close modal - keep it open to see the comment
      } else {
        // Rollback on error
        setCommentCount(previousCount);
        setComments(previousComments);
      }
    } catch (error) {
      // Rollback on error
      setCommentCount(previousCount);
      setComments(previousComments);
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmojiReaction = (emoji: string) => {
    setCommentText((prev) => prev + emoji);
  };

  const renderCommentItem = ({ item }: { item: IComment }) => {
    return (
      <View style={[styles.commentItem, { backgroundColor: postBackground }]}>
        <View style={styles.commentLeft}>
          <Image
            source={
              item.userAvatar
                ? { uri: item.userAvatar }
                : require('@assets/icons/bucket.png')
            }
            style={styles.commentAvatar}
          />
          <View style={styles.commentContent}>
            <View style={styles.commentHeader}>
              <CustomText
                fontSize={RFValue(13)}
                fontFamily={Fonts.SemiBold}
                style={{ color: textColor }}>
                {item.userName || `User ${item.userId.substring(0, 8)}`}
              </CustomText>
              <CustomText
                fontSize={RFValue(11)}
                fontFamily={Fonts.Regular}
                style={{ color: secondaryTextColor, marginLeft: 8 }}>
                {formatRelativeTime(item.createdAt)}
              </CustomText>
            </View>
            <CustomText
              fontSize={RFValue(13)}
              fontFamily={Fonts.Regular}
              style={{ color: textColor, marginTop: 2 }}>
              {item.text}
            </CustomText>
            <TouchableOpacity style={styles.replyButton} activeOpacity={0.7}>
              <CustomText
                fontSize={RFValue(11)}
                fontFamily={Fonts.Regular}
                style={{ color: secondaryTextColor }}>
                Reply
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity style={styles.commentLikeButton} activeOpacity={0.7}>
          <Icon name="heart-outline" size={RFValue(16)} color={iconColor} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => {
    return (
      <View style={[styles.emptyStateContainer, { backgroundColor: postBackground }]}>
        <CustomText
          fontSize={RFValue(18)}
          fontFamily={Fonts.Bold}
          style={{ color: textColor, marginBottom: 8 }}>
          No comments yet
        </CustomText>
        <CustomText
          fontSize={RFValue(14)}
          fontFamily={Fonts.Regular}
          style={{ color: secondaryTextColor }}>
          Start the conversation.
        </CustomText>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: postBackground }]}>
      {/* Post Header Section - matching reference */}
      <View style={[styles.postHeader, { backgroundColor: postBackground }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Image
              source={
                post.userAvatar
                  ? { uri: post.userAvatar }
                  : require('@assets/icons/bucket.png')
              }
              style={styles.avatar}
            />
          </View>
          <View style={styles.userInfo}>
            <CustomText
              fontSize={RFValue(11)}
              fontFamily={Fonts.SemiBold}
              style={{ color: textColor }}
              numberOfLines={1}>
              {post.userName || `User ${post.userId.substring(0, 8)}`}
            </CustomText>
            {/* Optional: Music/Audio indicator - can be added if data exists */}
          </View>
        </View>
        <TouchableOpacity activeOpacity={0.7}>
          <Icon name="ellipsis-vertical" size={RFValue(16)} color={iconColor} />
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
              fontSize={RFValue(10)}
              fontFamily={Fonts.Regular}
              style={{ color: colors.disabled, marginTop: 12 }}>
              No image available
            </CustomText>
          </View>
        )}
      </View>

      {/* Engagement Section - matching reference with icons and counts */}
      <View style={[styles.engagementSection, { backgroundColor: postBackground }]}>
        <View style={styles.engagementLeft}>
          <TouchableOpacity
            style={styles.engagementButton}
            onPress={handleLike}
            activeOpacity={0.7}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Icon
                name={isLiked ? 'heart' : 'heart-outline'}
                size={RFValue(18)}
                color={isLiked ? '#ff3040' : iconColor}
              />
            </Animated.View>
            <CustomText
              fontSize={RFValue(11)}
              fontFamily={Fonts.Regular}
              style={{ color: textColor, marginLeft: 4 }}>
              {formatCount(likeCount)}
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.engagementButton}
            onPress={() => setShowCommentModal(true)}
            activeOpacity={0.7}>
            <Icon name="chatbubble-outline" size={RFValue(18)} color={iconColor} />
            <CustomText
              fontSize={RFValue(11)}
              fontFamily={Fonts.Regular}
              style={{ color: textColor, marginLeft: 4 }}>
              {formatCount(commentCount)}
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.engagementButton} activeOpacity={0.7}>
            <Icon name="arrow-redo-outline" size={RFValue(18)} color={iconColor} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.saveButton}
          onPress={() => setIsSaved(!isSaved)}
          activeOpacity={0.7}>
          <Icon
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={RFValue(18)}
            color={iconColor}
          />
        </TouchableOpacity>
      </View>

      {/* Caption Section - matching reference */}
      {post.text && (
        <View style={[styles.captionSection, { backgroundColor: postBackground }]}>
          <CustomText
            fontSize={RFValue(11)}
            fontFamily={Fonts.Regular}
            style={{ color: textColor }}>
            <CustomText
              fontSize={RFValue(11)}
              fontFamily={Fonts.SemiBold}
              style={{ color: textColor }}>
              {post.userName || `User ${post.userId.substring(0, 8)}`}{' '}
            </CustomText>
            {post.text}
          </CustomText>
        </View>
      )}

      {/* Comment Modal - Full Screen */}
      <Modal
        visible={showCommentModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowCommentModal(false);
          setCommentText('');
        }}>
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.5)' }]}
          onPress={() => {
            setShowCommentModal(false);
            setCommentText('');
          }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}>
            <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
              <View style={[styles.modalContent, { backgroundColor: postBackground }]}>
              {/* Drag Handle */}
              <View style={[styles.dragHandle, { backgroundColor: secondaryTextColor }]} />

              {/* Header */}
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <TouchableOpacity
                  onPress={() => {
                    setShowCommentModal(false);
                    setCommentText('');
                  }}
                  style={styles.closeButton}
                  activeOpacity={0.7}>
                  <Icon name="close" size={RFValue(24)} color={textColor} />
                </TouchableOpacity>
                <CustomText
                  fontSize={RFValue(16)}
                  fontFamily={Fonts.Bold}
                  style={{ color: textColor }}>
                  Comments
                </CustomText>
                <TouchableOpacity
                  onPress={() => {
                    // Three dots menu - placeholder for future features
                  }}
                  style={styles.menuButton}
                  activeOpacity={0.7}>
                  <Icon name="ellipsis-vertical" size={RFValue(20)} color={textColor} />
                </TouchableOpacity>
              </View>

              {/* Comment List */}
              <FlatList
                data={comments}
                renderItem={renderCommentItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={renderEmptyState}
                contentContainerStyle={[
                  styles.commentListContainer,
                  comments.length === 0 && styles.emptyListContainer,
                ]}
                showsVerticalScrollIndicator={false}
              />

              {/* Bottom Input Section */}
              <View style={[styles.inputSection, { backgroundColor: postBackground, borderTopColor: colors.border }]}>
                {/* User Avatar */}
                <Image
                  source={
                    user?.profileImage
                      ? { uri: user.profileImage }
                      : require('@assets/icons/bucket.png')
                  }
                  style={styles.userAvatar}
                />

                <View style={styles.inputWrapper}>
                  {/* Emoji Reactions Row */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.emojiRow}>
                    {emojiReactions.map((emoji, index) => (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleEmojiReaction(emoji)}
                        style={styles.emojiButton}
                        activeOpacity={0.7}>
                        <CustomText fontSize={RFValue(20)}>{emoji}</CustomText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Text Input */}
                  <View style={styles.textInputContainer}>
                    <TextInput
                      style={[styles.commentInput, { color: textColor, backgroundColor: colors.backgroundSecondary }]}
                      placeholder="Add a comment..."
                      placeholderTextColor={colors.disabled}
                      value={commentText}
                      onChangeText={setCommentText}
                      multiline
                      maxLength={500}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        // Emoji picker - placeholder
                      }}
                      style={styles.emojiPickerButton}
                      activeOpacity={0.7}>
                      <Icon name="happy-outline" size={RFValue(20)} color={textColor} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: screenWidth,
    marginBottom: 0, // No margin between posts - full screen like reference
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.012,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: screenWidth * 0.08,
    height: screenWidth * 0.08,
    borderRadius: screenWidth * 0.08 / 2,
    overflow: 'hidden',
    marginRight: screenWidth * 0.025,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  userInfo: {
    flex: 1,
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
  engagementSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.012,
  },
  engagementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: screenWidth * 0.03,
  },
  engagementButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  saveButton: {
    padding: 4,
  },
  captionSection: {
    paddingHorizontal: screenWidth * 0.04,
    paddingBottom: screenHeight * 0.015,
  },
  modalOverlay: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
    opacity: 0.5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.015,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
    width: 40,
  },
  menuButton: {
    padding: 4,
    width: 40,
    alignItems: 'flex-end',
  },
  commentListContainer: {
    paddingVertical: screenHeight * 0.01,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: screenHeight * 0.2,
  },
  commentItem: {
    flexDirection: 'row',
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.012,
    alignItems: 'flex-start',
  },
  commentLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  commentAvatar: {
    width: screenWidth * 0.08,
    height: screenWidth * 0.08,
    borderRadius: screenWidth * 0.08 / 2,
    marginRight: screenWidth * 0.025,
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyButton: {
    marginTop: 4,
    paddingVertical: 4,
  },
  commentLikeButton: {
    padding: 4,
    marginLeft: 8,
  },
  inputSection: {
    borderTopWidth: 1,
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.012,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userAvatar: {
    width: screenWidth * 0.08,
    height: screenWidth * 0.08,
    borderRadius: screenWidth * 0.08 / 2,
    marginRight: screenWidth * 0.025,
  },
  inputWrapper: {
    flex: 1,
  },
  emojiRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    gap: 8,
  },
  emojiButton: {
    padding: 4,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: RFValue(14),
    fontFamily: Fonts.Regular,
    maxHeight: 100,
    minHeight: 40,
  },
  emojiPickerButton: {
    padding: 4,
  },
});

export default ImagePostItem;

