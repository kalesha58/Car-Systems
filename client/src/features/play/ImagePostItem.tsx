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
  PanResponder,
  GestureResponderEvent,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { Fonts } from '@utils/Constants';
import { screenHeight, screenWidth } from '@utils/Scaling';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import ImageCarousel from './ImageCarousel';
import { IPost, IComment } from '../../types/post/IPost';
import { useTheme } from '@hooks/useTheme';
import { likePost, unlikePost, addComment, likeComment, unlikeComment } from '@service/postService';
import { SOCKET_URL } from '@service/config';
import { io, Socket } from 'socket.io-client';
import { formatRelativeTime } from '@utils/timeUtils';
import { useAuthStore } from '@state/authStore';
import useKeyboardOffsetHeight from '@utils/useKeyboardOffsetHeight';
import { shareContent } from '@utils/shareUtils';

interface IImagePostItemProps {
  post: IPost;
}

const ImagePostItem: React.FC<IImagePostItemProps> = ({ post }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const keyboardOffsetHeight = useKeyboardOffsetHeight();
  const [isLiked, setIsLiked] = useState(post?.isLiked || false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likes || 0);
  const [commentCount, setCommentCount] = useState(post?.comments?.length || 0);
  const [comments, setComments] = useState<IComment[]>(post?.comments || []);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const modalTranslateY = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get('window').height;
  const imageHeight = screenHeight * 0.5;
  
  // Pan responder for swipe down to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          modalTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          // Dismiss modal if swiped down more than 100px
          Animated.timing(modalTranslateY, {
            toValue: screenHeight,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            setShowCommentModal(false);
            setCommentText('');
            setReplyingTo(null);
            modalTranslateY.setValue(0);
          });
        } else {
          // Snap back
          Animated.spring(modalTranslateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Emoji reactions for quick input
  const emojiReactions = ['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'];

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
    if (post?.id) {
      socket.emit('joinPost', post.id);
    }

    // Listen for like updates from other users
    socket.on('postLiked', (data: { postId: string; likes: number; isLiked: boolean }) => {
      if (data.postId === post?.id) {
        // Update like count immediately when any user likes the post
        setLikeCount(data.likes);
        // Note: isLiked is user-specific, so we don't update it here
        // Each user can independently like/unlike the same post
        // The API response handles our own like/unlike actions
      }
    });

    // Listen for unlike updates from other users
    socket.on('postUnliked', (data: { postId: string; likes: number; isLiked: boolean }) => {
      if (data.postId === post?.id) {
        // Update like count immediately when any user unlikes the post
        setLikeCount(data.likes);
        // Note: isLiked remains unchanged for other users
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
    if (!post) return;
    setIsLiked(post.isLiked || false);
    setLikeCount(post.likes || 0);
    setCommentCount(post.comments?.length || 0);
    setComments(post.comments || []);
  }, [post?.isLiked, post?.likes, post?.comments]);

  // Listen for comment like updates
  useEffect(() => {
    if (!socketRef.current || !post?.id) return;

    const socket = socketRef.current;

    socket.on('commentLiked', (data: { postId: string; commentId: string; likes: number; isLiked: boolean }) => {
      if (data.postId === post.id) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === data.commentId
              ? { ...comment, likes: data.likes, isLiked: data.isLiked }
              : comment
          )
        );
      }
    });

    socket.on('commentUnliked', (data: { postId: string; commentId: string; likes: number; isLiked: boolean }) => {
      if (data.postId === post.id) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === data.commentId
              ? { ...comment, likes: data.likes, isLiked: data.isLiked }
              : comment
          )
        );
      }
    });

    return () => {
      socket.off('commentLiked');
      socket.off('commentUnliked');
    };
  }, [post?.id]);

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
      if (!post?.id) return;
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
    if (!commentText.trim() || isSubmitting || !post?.id) return;

    setIsSubmitting(true);
    const previousCount = commentCount;
    const previousComments = [...comments];
    const replyToId = replyingTo;

    // Optimistic update
    setCommentCount(previousCount + 1);

    try {
      // Remove @username prefix if replying
      const textToSend = replyingTo ? commentText.replace(/^@\w+\s/, '').trim() : commentText.trim();
      const response = await addComment(post.id, textToSend, replyToId || undefined);
      if (response.success && response.Response) {
        setCommentCount(response.Response.comments?.length || 0);
        setComments(response.Response.comments || []);
        setCommentText('');
        setReplyingTo(null);
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

  const handleCommentLike = async (commentId: string) => {
    if (!post?.id) return;

    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const previousLiked = comment.isLiked || false;
    const previousCount = comment.likes || 0;

    // Optimistic update
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              isLiked: !previousLiked,
              likes: previousLiked ? previousCount - 1 : previousCount + 1,
            }
          : c
      )
    );

    try {
      if (previousLiked) {
        await unlikeComment(post.id, commentId);
      } else {
        await likeComment(post.id, commentId);
      }
      // Real-time update will handle the state update via socket
    } catch (error) {
      // Rollback on error
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                isLiked: previousLiked,
                likes: previousCount,
              }
            : c
        )
      );
      console.error('Error toggling comment like:', error);
    }
  };

  const handleReply = (commentId: string, userName: string) => {
    setReplyingTo(commentId);
    setCommentText(`@${userName} `);
  };

  const handleShare = async () => {
    try {
      const shareText = post?.text || 'Check out this post!';
      const shareUrl = post?.images && post.images.length > 0 
        ? `Check out this post with ${post.images.length} image${post.images.length > 1 ? 's' : ''}!`
        : shareText;
      
      await shareContent({
        title: 'Car Connect Post',
        message: shareUrl,
        url: post?.id ? `carconnect://post/${post.id}` : undefined,
      });
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const renderCommentItem = ({ item }: { item: IComment }) => {
    const isLiked = item.isLiked || false;
    const likes = item.likes || 0;
    const userName = item.userName || `User ${item.userId.substring(0, 8)}`;
    
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
                fontSize={RFValue(12)}
                fontFamily={Fonts.SemiBold}
                style={{ color: textColor }}>
                {userName}
              </CustomText>
              <CustomText
                fontSize={RFValue(10)}
                fontFamily={Fonts.Regular}
                style={{ color: secondaryTextColor, marginLeft: 8 }}>
                {formatRelativeTime(item.createdAt)}
              </CustomText>
            </View>
            <CustomText
              fontSize={RFValue(12)}
              fontFamily={Fonts.Regular}
              style={{ color: textColor, marginTop: 4, lineHeight: RFValue(18) }}>
              {item.text}
            </CustomText>
            <TouchableOpacity 
              style={styles.replyButton} 
              activeOpacity={0.7}
              onPress={() => handleReply(item.id, userName)}>
              <CustomText
                fontSize={RFValue(10)}
                fontFamily={Fonts.Medium}
                style={{ color: secondaryTextColor }}>
                Reply
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.commentLikeButton} 
          activeOpacity={0.7}
          onPress={() => handleCommentLike(item.id)}>
          <Icon 
            name={isLiked ? 'heart' : 'heart-outline'} 
            size={RFValue(16)} 
            color={isLiked ? '#ff3040' : iconColor} 
          />
          {likes > 0 && (
            <CustomText
              fontSize={RFValue(10)}
              fontFamily={Fonts.Regular}
              style={{ color: secondaryTextColor, marginLeft: 4 }}>
              {likes}
            </CustomText>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => {
    return (
      <View style={[styles.emptyStateContainer, { backgroundColor: postBackground }]}>
        <CustomText
          fontSize={RFValue(14)}
          fontFamily={Fonts.SemiBold}
          style={{ color: textColor, marginBottom: 6 }}>
          No comments yet
        </CustomText>
        <CustomText
          fontSize={RFValue(12)}
          fontFamily={Fonts.Regular}
          style={{ color: secondaryTextColor }}>
          Start the conversation.
        </CustomText>
      </View>
    );
  };

  if (!post) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: postBackground }]}>
      {/* Post Header Section - matching reference */}
      <View style={[styles.postHeader, { backgroundColor: postBackground }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarContainer}>
            <Image
              source={
                post?.userAvatar
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
              {post?.userName || `User ${post?.userId?.substring(0, 8) || 'Unknown'}`}
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
            onPress={() => {
              console.log('Opening comment modal, showCommentModal will be:', true);
              setShowCommentModal(true);
            }}
            activeOpacity={0.7}>
            <Icon name="chatbubble-outline" size={RFValue(18)} color={iconColor} />
            <CustomText
              fontSize={RFValue(11)}
              fontFamily={Fonts.Regular}
              style={{ color: textColor, marginLeft: 4 }}>
              {formatCount(commentCount)}
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.engagementButton} 
            activeOpacity={0.7}
            onPress={handleShare}>
            <Icon name="arrow-redo-outline" size={RFValue(18)} color={iconColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Caption Section - matching reference */}
      {post?.text && (
        <View style={[styles.captionSection, { backgroundColor: postBackground }]}>
          <CustomText
            fontSize={RFValue(11)}
            fontFamily={Fonts.Regular}
            style={{ color: textColor }}>
            <CustomText
              fontSize={RFValue(11)}
              fontFamily={Fonts.SemiBold}
              style={{ color: textColor }}>
              {post?.userName || `User ${post?.userId?.substring(0, 8) || 'Unknown'}`}{' '}
            </CustomText>
            {post.text}
          </CustomText>
        </View>
      )}

      {/* Comment Modal - Full Screen */}
      <Modal
        visible={showCommentModal}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => {
          setShowCommentModal(false);
          setCommentText('');
        }}>
        <View style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.7)' }]}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalBackdrop}
            onPress={() => {
              setShowCommentModal(false);
              setCommentText('');
            }}
          />
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.modalContainer}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
            <Animated.View 
              style={[
                styles.modalContent, 
                { 
                  backgroundColor: postBackground,
                  transform: [{ translateY: modalTranslateY }]
                }
              ]}
              {...panResponder.panHandlers}>
              {/* Drag Handle */}
              <View style={[styles.dragHandle, { backgroundColor: secondaryTextColor }]} />

              {/* Header */}
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <View style={styles.closeButton} />
                <CustomText
                  fontSize={RFValue(13)}
                  fontFamily={Fonts.SemiBold}
                  style={{ color: textColor }}>
                  Comments
                </CustomText>
                <View style={styles.menuButton} />
              </View>

              {/* Comment List */}
              <View style={styles.commentListWrapper}>
                <FlatList
                  data={comments}
                  renderItem={renderCommentItem}
                  keyExtractor={(item) => item.id}
                  ListEmptyComponent={renderEmptyState}
                  contentContainerStyle={[
                    styles.commentListContainer,
                    comments.length === 0 && styles.emptyListContainer,
                  ]}
                  style={styles.commentList}
                  showsVerticalScrollIndicator={false}
                />
              </View>

              {/* Bottom Input Section */}
              <Animated.View 
                style={[
                  styles.inputSection, 
                  { 
                    backgroundColor: postBackground, 
                    borderTopColor: colors.border,
                    transform: [{ translateY: keyboardOffsetHeight > 0 ? -keyboardOffsetHeight : 0 }]
                  }
                ]}>
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
                        <CustomText fontSize={RFValue(16)}>{emoji}</CustomText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Text Input */}
                  <View style={styles.textInputContainer}>
                    {replyingTo && (
                      <View style={[styles.replyingToIndicator, { backgroundColor: colors.backgroundSecondary }]}>
                        <CustomText
                          fontSize={RFValue(11)}
                          fontFamily={Fonts.Medium}
                          style={{ color: colors.primary }}>
                          Replying to {comments.find(c => c.id === replyingTo)?.userName || 'user'}
                        </CustomText>
                        <TouchableOpacity
                          onPress={() => {
                            setReplyingTo(null);
                            setCommentText('');
                          }}
                          style={styles.cancelReplyButton}>
                          <Icon name="close" size={RFValue(14)} color={textColor} />
                        </TouchableOpacity>
                      </View>
                    )}
                    <TextInput
                      style={[styles.commentInput, { color: textColor, backgroundColor: colors.backgroundSecondary, fontSize: RFValue(13) }]}
                      placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
                      placeholderTextColor={colors.disabled}
                      value={commentText}
                      onChangeText={setCommentText}
                      multiline
                      maxLength={500}
                      onSubmitEditing={handleComment}
                      returnKeyType="send"
                      blurOnSubmit={false}
                    />
                    {commentText.trim().length > 0 ? (
                      <TouchableOpacity
                        onPress={handleComment}
                        style={[styles.sendButton, { backgroundColor: colors.primary }]}
                        activeOpacity={0.7}
                        disabled={isSubmitting}>
                        {isSubmitting ? (
                          <Icon name="hourglass-outline" size={RFValue(18)} color={colors.white} />
                        ) : (
                          <Icon name="send" size={RFValue(18)} color={colors.white} />
                        )}
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          // Emoji picker - placeholder
                        }}
                        style={styles.emojiPickerButton}
                        activeOpacity={0.7}>
                        <Icon name="happy-outline" size={RFValue(18)} color={textColor} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Animated.View>
            </View>
          </KeyboardAvoidingView>
        </View>
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
  replyingToIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  cancelReplyButton: {
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
    justifyContent: 'flex-end',
    position: 'relative',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContent: {
    width: '100%',
    height: screenHeight * 0.9,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
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
  commentListWrapper: {
    flex: 1,
  },
  commentList: {
    flex: 1,
  },
  commentListContainer: {
    paddingVertical: screenHeight * 0.01,
    flexGrow: 1,
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
    paddingVertical: screenHeight * 0.015,
    alignItems: 'flex-start',
  },
  commentLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  commentAvatar: {
    width: screenWidth * 0.09,
    height: screenWidth * 0.09,
    borderRadius: screenWidth * 0.09 / 2,
    marginRight: screenWidth * 0.03,
  },
  commentContent: {
    flex: 1,
    paddingRight: screenWidth * 0.02,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  replyButton: {
    marginTop: 6,
    paddingVertical: 4,
  },
  commentLikeButton: {
    padding: 6,
    marginLeft: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  inputSection: {
    borderTopWidth: 1,
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.015,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  userAvatar: {
    width: screenWidth * 0.09,
    height: screenWidth * 0.09,
    borderRadius: screenWidth * 0.09 / 2,
    marginRight: screenWidth * 0.03,
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
    padding: 6,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: RFValue(13),
    fontFamily: Fonts.Regular,
    maxHeight: 100,
    minHeight: 40,
    lineHeight: RFValue(18),
  },
  emojiPickerButton: {
    padding: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

export default ImagePostItem;

