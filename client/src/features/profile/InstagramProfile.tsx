import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import React, {useState, useEffect, useMemo} from 'react';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {useAuthStore} from '@state/authStore';
import {useTheme} from '@hooks/useTheme';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {navigate} from '@utils/NavigationUtils';
import InstagramProfileHeader from './sections/InstagramProfileHeader';
import PostGrid from './sections/PostGrid';
import {getUserStats, IUserStats} from '@service/profileService';
import {getPosts} from '@service/postService';
import {IPost} from '../../types/post/IPost';
import {useTranslation} from 'react-i18next';

const InstagramProfile: React.FC = () => {
  const {user} = useAuthStore();
  const {colors, isDark} = useTheme();
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const [stats, setStats] = useState<IUserStats>({
    postsCount: 0,
    vehiclesCount: 0,
    ordersCount: 0,
  });
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [statsData, postsData] = await Promise.all([
        getUserStats(),
        getPosts(user?.id),
      ]);

      if (statsData) {
        setStats(statsData);
      }

      if (postsData?.success && postsData?.Response) {
        setPosts(postsData.Response);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const handleRefresh = () => {
    fetchData(true);
  };

  const handlePostPress = (post: IPost) => {
    // Navigate to post detail if needed
    // For now, just log
    console.log('Post pressed:', post.id);
  };

  const handleHamburgerPress = () => {
    // Navigate to settings/profile menu
    // We'll show the settings screen with profile sections
    navigate('ProfileSettings');
  };

  const handleSettingsPress = () => {
    // Navigate to settings
    navigate('ProfileSettings');
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          borderBottomWidth: 0.5,
          borderBottomColor: isDark ? colors.border : '#DBDBDB',
          backgroundColor: colors.background,
        },
        headerLeft: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        headerRight: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        headerButton: {
          padding: 4,
        },
        content: {
          flex: 1,
        },
        gridNav: {
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: 12,
          borderTopWidth: 0.5,
          borderBottomWidth: 0.5,
          borderColor: isDark ? colors.border : '#DBDBDB',
        },
        gridNavIcon: {
          padding: 8,
        },
        gridNavIconActive: {
          borderBottomWidth: 1,
          borderBottomColor: colors.text,
        },
      }),
    [colors, isDark, insets.top],
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleHamburgerPress}
            activeOpacity={0.7}>
            <Icon name="menu" size={RFValue(24)} color={colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleSettingsPress}
            activeOpacity={0.7}>
            <Icon name="settings-outline" size={RFValue(24)} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={isDark ? colors.white : colors.secondary}
            colors={isDark ? [colors.white] : [colors.secondary]}
          />
        }>
        {/* Profile Header with Stats */}
        <InstagramProfileHeader
          postsCount={stats.postsCount}
          vehiclesCount={stats.vehiclesCount}
          ordersCount={stats.ordersCount}
        />

        {/* Grid Navigation */}
        <View style={styles.gridNav}>
          <TouchableOpacity
            style={[styles.gridNavIcon, styles.gridNavIconActive]}
            activeOpacity={0.7}>
            <Icon name="grid" size={RFValue(24)} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Post Grid */}
        <PostGrid posts={posts} loading={loading} onPostPress={handlePostPress} />
      </ScrollView>
    </View>
  );
};

export default InstagramProfile;

