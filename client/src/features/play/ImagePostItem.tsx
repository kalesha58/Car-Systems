import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
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
  Alert,
  Pressable,
  ActivityIndicator,
  Image,
  Share,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { RFValue } from 'react-native-responsive-fontsize';
import { Fonts, headerTopInset, fontStyle } from '@utils/Constants';
import { PLAY_UI_FONT, playFeedText } from '@utils/playTypography';
import { screenHeight, screenWidth } from '@utils/Scaling';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import ImageCarousel from './ImageCarousel';
import UserInitialAvatar from './UserInitialAvatar';
import { IPost, IComment } from '../../types/post/IPost';
import { useTheme } from '@hooks/useTheme';
import { blockUser, likePost, unlikePost, addComment, likeComment, unlikeComment, reportContent } from '@service/postService';
import { SOCKET_URL } from '@service/config';
import { io, Socket } from 'socket.io-client';
import { formatRelativeTime } from '@utils/timeUtils';
import { useAuthStore } from '@state/authStore';
import useKeyboardOffsetHeight from '@utils/useKeyboardOffsetHeight';
import { shareContent } from '@utils/shareUtils';
import { navigate } from '@utils/NavigationUtils';
import { withAuth } from '@utils/AuthGuard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

function captionWithoutLeadingUsername(raw: string, userName?: string | null): string {
  const text = (raw || '').trim();
  const name = (userName || '').trim();
  if (!name || !text) return text;
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^@?${escaped}\\s*[:\\-–—]?\\s*`, 'i');
  const next = text.replace(re, '').trim();
  return next.length > 0 ? next : text;
}

interface IImagePostItemProps {
  post: IPost;
  onUserBlocked?: () => void;
  onStoryMutated?: () => void;
}

const ImagePostItem: React.FC<IImagePostItemProps> = ({ post, onUserBlocked, onStoryMutated }) => {
  const { colors, isDark } = useTheme();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const modalInsets = useSafeAreaInsets();
  const keyboardOffsetHeight = useKeyboardOffsetHeight();
  const [isLiked, setIsLiked] = useState(post?.isLiked || false);
  const [isSaved, setIsSaved] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likes || 0);
  const [commentCount, setCommentCount] = useState(post?.comments?.length || 0);
  const [comments, setComments] = useState<IComment[]>(post?.comments || []);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bigHeartScale = useRef(new Animated.Value(0)).current;
  const bigHeartOpacity = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(0)).current;
  const isLikedRef = useRef(isLiked);
  const handleLikeRef = useRef<() => void>(() => {});
  const animateBigHeartRef = useRef<() => void>(() => {});
  const windowDims = Dimensions.get('window');
  const imageHeight = Math.min(windowDims.width * 1.04, windowDims.height * 0.46);
  const commentAvatarSize = Math.round(screenWidth * 0.09);

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
      socket.emit('leavePost', post?.id);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [post?.id]);

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

  const animateBigHeart = () => {
    bigHeartScale.setValue(0);
    bigHeartOpacity.setValue(1);
    Animated.sequence([
      Animated.spring(bigHeartScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(bigHeartOpacity, {
        toValue: 0,
        duration: 200,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };
  animateBigHeartRef.current = animateBigHeart;

  const handleLike = async () => {
    withAuth(async () => {
      const previousLiked = isLiked;
      const previousCount = likeCount;

      // Optimistic update
      setIsLiked(!previousLiked);
      setLikeCount(previousLiked ? previousCount - 1 : previousCount + 1);

      // Animate small heart icon
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
    }, 'Please login to like this post.');
  };
  handleLikeRef.current = handleLike;
  isLikedRef.current = isLiked;

  const onImageDoubleTap = useCallback(() => {
    if (!isLikedRef.current) {
      handleLikeRef.current();
    }
    animateBigHeartRef.current();
  }, []);

  const doubleTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .maxDuration(280)
        .onEnd(() => {
          runOnJS(onImageDoubleTap)();
        }),
    [onImageDoubleTap],
  );

  const handleComment = async () => {
    withAuth(async () => {
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
    }, 'Please login to add a comment.');
  };

  const handleEmojiReaction = (emoji: string) => {
    setCommentText((prev) => prev + emoji);
  };

  const handleCommentLike = async (commentId: string) => {
    withAuth(async () => {
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
    }, 'Please login to like this comment.');
  };

  const handleReply = (commentId: string, userName: string) => {
    withAuth(() => {
      setReplyingTo(commentId);
      setCommentText(`@${userName} `);
    }, 'Please login to reply to this comment.');
  };

  const handleShare = () => {
    withAuth(() => setShareSheetVisible(true), t('play.story.loginToShare'));
  };

  const handleExternalShare = async () => {
    setShareSheetVisible(false);
    try {
      const shareText = post?.text || 'Check out this post!';
      const shareUrl =
        post?.images && post.images.length > 0
          ? `Check out this post with ${post.images.length} image${post.images.length > 1 ? 's' : ''}!`
          : shareText;

      await shareContent({
        title: 'motonode Post',
        message: shareUrl,
        url: post?.id ? `motonode://post/${post.id}` : undefined,
      });
    } catch (error) {
      console.error('Error sharing post:', error);
    }
  };

  const canAddToStatus = (post.images?.length ?? 0) > 0 || Boolean(post.video);
  const thumbUri = post.images?.[0];

  const handleSetAsStatus = () => {
    if (!canAddToStatus) {
      Alert.alert(t('profile.error'), t('play.story.noMedia'));
      return;
    }
    setShareSheetVisible(false);
    const previewUri = post.images?.[0] || post.video || '';
    const mediaType: 'image' | 'video' =
      post.images && post.images.length > 0 ? 'image' : post.video ? 'video' : 'image';
    withAuth(() => {
      navigate('StatusCompose', {
        postId: post.id,
        previewUri,
        authorName: post.userName,
        mediaType,
      });
    }, t('play.story.loginToShare'));
  };

  const handleCopyPostLink = async () => {
    const url = post?.id ? `motonode://post/${post.id}` : '';
    if (!url) return;
    setShareSheetVisible(false);
    try {
      await Share.share({ message: url, title: t('play.story.copyLink') });
    } catch {
      /* user dismissed */
    }
  };

  const handleReportPost = async () => {
    withAuth(async () => {
      try {
        await reportContent({
          targetType: 'post',
          targetId: post.id,
          targetOwnerId: post.userId,
          reason: 'Objectionable content',
        });
        Alert.alert('Reported', 'Thanks. We will review this content.');
      } catch (error) {
        Alert.alert('Error', 'Unable to report content right now.');
      }
    }, 'Please login to report this post.');
  };

  const handleBlockAuthor = async () => {
    withAuth(async () => {
      try {
        await blockUser(post.userId);
        onUserBlocked?.();
        Alert.alert('User blocked', 'This user has been hidden from your feed.');
      } catch (error) {
        Alert.alert('Error', 'Unable to block this user right now.');
      }
    }, 'Please login to block this user.');
  };

  const handleOpenPostActions = () => {
    const actions = [
      { text: 'Report', onPress: handleReportPost },
    ] as Array<{ text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }>;

    if (user?.id !== post.userId) {
      actions.push({ text: 'Block', style: 'destructive', onPress: handleBlockAuthor });
    }

    actions.push({ text: 'Cancel', style: 'cancel', onPress: () => undefined });

    Alert.alert('Post actions', 'Choose an action', actions);
  };

  const renderCommentItem = ({ item }: { item: IComment }) => {
    const isLiked = item.isLiked || false;
    const likes = item.likes || 0;
    const userName = item.userName || `User ${item.userId.substring(0, 8)}`;

    return (
      <View style={[styles.commentItem, { backgroundColor: postBackground }]}>
        <View style={styles.commentLeft}>
          <UserInitialAvatar
            name={item.userName || ''}
            userId={item.userId}
            imageUri={item.userAvatar}
            size={commentAvatarSize}
            borderColor={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)'}
            borderWidth={StyleSheet.hairlineWidth}
            fallbackBackgroundColor={colors.secondary}
            initialsColor={colors.white}
            containerStyle={{ marginRight: screenWidth * 0.03 }}
          />
          <View style={styles.commentContent}>
            <View style={styles.commentHeader}>
              <CustomText
                fontSize={RFValue(11)}
                fontFamily={Fonts.SemiBold}
                style={[playFeedText.username, { color: textColor }]}>
                {userName}
              </CustomText>
              <CustomText
                fontSize={RFValue(9)}
                fontFamily={Fonts.Regular}
                style={[playFeedText.meta, { color: secondaryTextColor, marginLeft: 8 }]}>
                {formatRelativeTime(item.createdAt)}
              </CustomText>
            </View>
            <CustomText
              fontSize={RFValue(11)}
              fontFamily={Fonts.Regular}
              style={[playFeedText.body, { color: textColor, marginTop: 4, lineHeight: RFValue(16) }]}>
              {item.text}
            </CustomText>
            <TouchableOpacity
              style={styles.replyButton}
              activeOpacity={0.7}
              onPress={() => handleReply(item.id, userName)}>
              <CustomText
                fontSize={RFValue(9)}
                fontFamily={Fonts.Medium}
                style={[playFeedText.meta, { color: secondaryTextColor }]}>
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
            size={RFValue(15)}
            color={isLiked ? '#ff3040' : iconColor}
          />
          {likes > 0 && (
            <CustomText
              fontSize={RFValue(9)}
              fontFamily={Fonts.Regular}
              style={[playFeedText.meta, { color: secondaryTextColor, marginLeft: 4 }]}>
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
          fontSize={RFValue(12)}
          fontFamily={Fonts.SemiBold}
          style={[playFeedText.username, { color: textColor, marginBottom: 6 }]}>
          No comments yet
        </CustomText>
        <CustomText
          fontSize={RFValue(10)}
          fontFamily={Fonts.Regular}
          style={[playFeedText.body, { color: secondaryTextColor }]}>
          Start the conversation.
        </CustomText>
      </View>
    );
  };

  if (!post) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: postBackground, borderBottomColor: colors.border },
      ]}>
      {/* Post Header Section - matching reference */}
      <View style={[styles.postHeader, { backgroundColor: postBackground }]}>
        <View style={styles.headerLeft}>
          <UserInitialAvatar
            name={post?.userName || ''}
            userId={post?.userId}
            imageUri={post?.userAvatar}
            size={40}
            borderColor={isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)'}
            borderWidth={StyleSheet.hairlineWidth}
            fallbackBackgroundColor={colors.secondary}
            initialsColor={colors.white}
            containerStyle={{ marginRight: 12 }}
          />
          <View style={styles.userInfo}>
            <CustomText
              fontSize={RFValue(11)}
              fontFamily={Fonts.SemiBold}
              style={[playFeedText.username, { color: textColor }]}
              numberOfLines={1}>
              {post?.userName || `User ${post?.userId?.substring(0, 8) || 'Unknown'}`}
            </CustomText>
            {/* Optional: Music/Audio indicator - can be added if data exists */}
          </View>
        </View>
        <TouchableOpacity onPress={handleOpenPostActions} activeOpacity={0.7}>
          <Icon name="ellipsis-horizontal" size={RFValue(18)} color={iconColor} />
        </TouchableOpacity>
      </View>

      {/* Image/Content Section */}
      <GestureDetector gesture={doubleTapGesture}>
        <View style={styles.imageContainer}>
          {post.images && post.images.length > 0 ? (
            <ImageCarousel images={post.images} width={windowDims.width} height={imageHeight} />
          ) : (
            <View style={[styles.placeholder, { height: imageHeight, backgroundColor: colors.backgroundSecondary }]}>
              <Icon name="image-outline" size={RFValue(48)} color={colors.disabled} />
              <CustomText
                fontSize={RFValue(9)}
                fontFamily={Fonts.Regular}
                style={[playFeedText.meta, { color: colors.disabled, marginTop: 12 }]}>
                No image available
              </CustomText>
            </View>
          )}

          <Animated.View
            pointerEvents="none"
            style={[
              styles.bigHeartContainer,
              {
                opacity: bigHeartOpacity,
                transform: [{ scale: bigHeartScale }],
              },
            ]}>
            <Icon name="heart" size={RFValue(80)} color="#ff3040" />
          </Animated.View>
        </View>
      </GestureDetector>

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
              fontSize={RFValue(10)}
              fontFamily={Fonts.Regular}
              style={[playFeedText.meta, { color: secondaryTextColor, marginLeft: 5 }]}>
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
              fontSize={RFValue(10)}
              fontFamily={Fonts.Regular}
              style={[playFeedText.meta, { color: secondaryTextColor, marginLeft: 5 }]}>
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

      {/* Caption — body only; username is already in the post header */}
      {post?.text && (
        <View style={[styles.captionSection, { backgroundColor: postBackground }]}>
          <CustomText
            fontSize={RFValue(11)}
            fontFamily={Fonts.Regular}
            style={[playFeedText.body, { color: textColor, lineHeight: RFValue(16) }]}>
            {captionWithoutLeadingUsername(post.text, post.userName)}
          </CustomText>
        </View>
      )}

      {/* Share sheet — reference-style bottom sheet */}
      <Modal
        visible={shareSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setShareSheetVisible(false)}>
        <View style={styles.shareOverlayRoot}>
          <Pressable style={styles.shareOverlayDim} onPress={() => setShareSheetVisible(false)} />
          {(() => {
            const shBg = isDark ? '#1c1c1e' : '#ffffff';
            const shInk = isDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.88)';
            const shSub = isDark ? 'rgba(255,255,255,0.46)' : 'rgba(0,0,0,0.42)';
            const shLine = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
            const shField = isDark ? '#262628' : '#f3f4f6';
            const shIcon = shSub;
            const shInset = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
            const shareElev = Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: isDark ? 0.42 : 0.08,
                shadowRadius: 14,
              },
              android: { elevation: 22 },
              default: {},
            });
            return (
              <View
                style={[
                  styles.shareSheetCard,
                  shareElev,
                  {
                    backgroundColor: shBg,
                    paddingBottom: modalInsets.bottom + 12,
                    borderTopColor: shLine,
                  },
                ]}>
                <View style={[styles.shareGrab, { backgroundColor: shSub }]} />
                <View style={styles.shareSheetHeaderRow}>
                  {thumbUri ? (
                    <Image source={{ uri: thumbUri }} style={styles.shareThumb} />
                  ) : (
                    <View style={[styles.shareThumb, styles.shareThumbPlaceholder, { backgroundColor: shField, borderColor: shLine }]}>
                      <Icon name="image-outline" size={RFValue(13)} color={shIcon} />
                    </View>
                  )}
                  <View style={{ flex: 1, marginHorizontal: 10 }}>
                    <CustomText fontSize={RFValue(10)} fontFamily={Fonts.SemiBold} style={{ color: shInk, letterSpacing: -0.1 }}>
                      {t('play.story.sharePost')}
                    </CustomText>
                    {post.userName ? (
                      <CustomText fontSize={RFValue(8)} style={{ color: shSub, marginTop: 2 }} numberOfLines={1}>
                        {t('play.story.sharePostBy', { name: post.userName })}
                      </CustomText>
                    ) : null}
                  </View>
                  <TouchableOpacity onPress={() => setShareSheetVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Icon name="close" size={RFValue(15)} color={shInk} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.shareSearchBar, { backgroundColor: shField, borderColor: shLine }]}>
                  <Icon name="search-outline" size={RFValue(12)} color={shIcon} />
                  <CustomText fontSize={RFValue(9)} style={{ color: shSub, marginLeft: 6 }}>
                    {t('play.story.searchFriends')}
                  </CustomText>
                </View>

                <CustomText style={[styles.shareSectionLabel, { color: shSub }]}>{t('play.story.sendTo')}</CustomText>
                <View style={[styles.sendToRow, { backgroundColor: shField, borderColor: shLine }]}>
                  <Icon name="people-outline" size={RFValue(13)} color={shIcon} />
                  <CustomText fontSize={RFValue(9)} style={{ color: shSub, marginLeft: 8 }}>
                    {t('play.story.noActiveContacts')}
                  </CustomText>
                </View>

                <CustomText style={[styles.shareSectionLabel, { color: shSub, marginTop: 12 }]}>
                  {t('play.story.moreOptions')}
                </CustomText>

                <View style={[styles.shareOptionsGroup, { backgroundColor: shInset, borderColor: shLine }]}>
                  <TouchableOpacity
                    style={[styles.shareOptionRow, { borderBottomColor: shLine }]}
                    onPress={handleSetAsStatus}
                    disabled={!canAddToStatus}
                    activeOpacity={0.75}>
                    <Icon name="time-outline" size={RFValue(13)} color={shIcon} />
                    <CustomText fontSize={RFValue(9)} fontFamily={Fonts.Medium} style={{ color: shInk, marginLeft: 10, flex: 1, opacity: canAddToStatus ? 1 : 0.45 }}>
                      {t('play.story.setAsStatus')}
                    </CustomText>
                    <Icon name="chevron-forward" size={RFValue(12)} color={shSub} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.shareOptionRow, { borderBottomColor: shLine }]}
                    onPress={() => void handleCopyPostLink()}
                    activeOpacity={0.75}>
                    <Icon name="link-outline" size={RFValue(13)} color={shIcon} />
                    <CustomText fontSize={RFValue(9)} fontFamily={Fonts.Medium} style={{ color: shInk, marginLeft: 10, flex: 1 }}>
                      {t('play.story.copyLink')}
                    </CustomText>
                    <Icon name="chevron-forward" size={RFValue(12)} color={shSub} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shareOptionRow}
                    onPress={() => {
                      void handleExternalShare();
                    }}
                    activeOpacity={0.75}>
                    <Icon name="share-social-outline" size={RFValue(13)} color={shIcon} />
                    <CustomText fontSize={RFValue(9)} fontFamily={Fonts.Medium} style={{ color: shInk, marginLeft: 10, flex: 1 }}>
                      {t('play.story.shareVia')}
                    </CustomText>
                    <Icon name="chevron-forward" size={RFValue(12)} color={shSub} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}
        </View>
      </Modal>

      {/* Comment modal — full screen */}
      <Modal
        visible={showCommentModal}
        transparent={false}
        animationType="slide"
        statusBarTranslucent
        {...(Platform.OS === 'ios' ? ({ presentationStyle: 'fullScreen' } as const) : {})}
        onRequestClose={() => {
          setShowCommentModal(false);
          setCommentText('');
        }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalKeyboardRoot}
          keyboardVerticalOffset={0}>
          <Animated.View
            style={[
              styles.modalFullscreen,
              {
                backgroundColor: postBackground,
                transform: [{ translateY: modalTranslateY }],
              },
            ]}
            {...panResponder.panHandlers}>
            <View
              style={[
                styles.modalFullHeader,
                {
                  borderBottomColor: colors.border,
                  paddingTop: headerTopInset(modalInsets.top) + 4,
                },
              ]}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close comments"
                onPress={() => {
                  setShowCommentModal(false);
                  setCommentText('');
                }}
                style={styles.modalHeaderIconSlot}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Icon name="close" size={RFValue(22)} color={textColor} />
              </TouchableOpacity>
              <CustomText
                fontSize={RFValue(13)}
                fontFamily={Fonts.SemiBold}
                style={[playFeedText.username, { color: textColor }]}>
                Comments
              </CustomText>
              <View style={styles.modalHeaderIconSlot} />
            </View>

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

            <Animated.View
              style={[
                styles.inputSection,
                {
                  backgroundColor: postBackground,
                  borderTopColor: colors.border,
                  paddingBottom: Math.max(modalInsets.bottom, 10),
                  transform: [{ translateY: keyboardOffsetHeight > 0 ? -keyboardOffsetHeight : 0 }],
                },
              ]}>
                {/* User Avatar */}
                <UserInitialAvatar
                  name={
                    (user?.name as string) ||
                    (user?.userName as string) ||
                    (user?.fullName as string) ||
                    (typeof user?.email === 'string' ? user.email.split('@')[0] : '') ||
                    ''
                  }
                  userId={(user?.id as string) || undefined}
                  imageUri={(user?.profileImage as string) || null}
                  size={commentAvatarSize}
                  borderColor={isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)'}
                  borderWidth={StyleSheet.hairlineWidth}
                  fallbackBackgroundColor={colors.secondary}
                  initialsColor={colors.white}
                  containerStyle={{ marginRight: screenWidth * 0.03 }}
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
                        <CustomText fontSize={RFValue(14)}>{emoji}</CustomText>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Text Input */}
                  <View style={styles.textInputContainer}>
                    {replyingTo && (
                      <View style={[styles.replyingToIndicator, { backgroundColor: colors.backgroundSecondary }]}>
                        <CustomText
                          fontSize={RFValue(10)}
                          fontFamily={Fonts.Medium}
                          style={[playFeedText.meta, { color: colors.primary }]}>
                          Replying to {comments.find(c => c.id === replyingTo)?.userName || 'user'}
                        </CustomText>
                        <TouchableOpacity
                          onPress={() => {
                            setReplyingTo(null);
                            setCommentText('');
                          }}
                          style={styles.cancelReplyButton}>
                          <Icon name="close" size={RFValue(12)} color={textColor} />
                        </TouchableOpacity>
                      </View>
                    )}
                    <TextInput
                      style={[
                        styles.commentInput,
                        {
                          color: textColor,
                          backgroundColor: colors.backgroundSecondary,
                          fontSize: RFValue(12),
                          fontFamily: PLAY_UI_FONT,
                        },
                      ]}
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
                          <Icon name="hourglass-outline" size={RFValue(16)} color={colors.white} />
                        ) : (
                          <Icon name="send" size={RFValue(16)} color={colors.white} />
                        )}
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => {
                          // Emoji picker - placeholder
                        }}
                        style={styles.emojiPickerButton}
                        activeOpacity={0.7}>
                        <Icon name="happy-outline" size={RFValue(16)} color={textColor} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </Animated.View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: screenWidth,
    marginBottom: 0,
    overflow: 'hidden',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bigHeartContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 10,
  },
  engagementLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
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
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 18,
  },
  modalKeyboardRoot: {
    flex: 1,
  },
  modalFullscreen: {
    flex: 1,
    width: '100%',
  },
  modalFullHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalHeaderIconSlot: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: RFValue(12),
    maxHeight: 100,
    minHeight: 40,
    lineHeight: RFValue(17),
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
  shareOverlayRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  shareOverlayDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  shareSheetCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    maxHeight: screenHeight * 0.52,
  },
  shareGrab: {
    alignSelf: 'center',
    width: 36,
    height: 3,
    borderRadius: 2,
    marginBottom: 10,
  },
  shareSheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  shareThumb: {
    width: 32,
    height: 32,
    borderRadius: 7,
  },
  shareThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  shareSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 10,
  },
  shareSectionLabel: {
    fontSize: RFValue(7),
    ...fontStyle(Fonts.SemiBold),
    letterSpacing: 1,
    marginBottom: 6,
  },
  sendToRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 10,
    paddingVertical: 11,
  },
  shareOptionsGroup: {
    marginTop: 2,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    borderRadius: 10,
  },
  shareOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 10,
  },
});

export default ImagePostItem;

