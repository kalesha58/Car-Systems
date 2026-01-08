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
import VehicleGrid from './sections/VehicleGrid';
import {getUserStats, IUserStats} from '@service/profileService';
import {getPosts} from '@service/postService';
import {getUserVehicles} from '@service/vehicleService';
import {IPost} from '../../types/post/IPost';
import {IUserVehicle} from '../../types/vehicle/IVehicle';
import {useTranslation} from 'react-i18next';

type TabType = 'posts' | 'vehicles';

const InstagramProfile: React.FC = () => {
  const {user} = useAuthStore();
  const {colors, isDark} = useTheme();
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('posts');
  const [stats, setStats] = useState<IUserStats>({
    postsCount: 0,
    vehiclesCount: 0,
    ordersCount: 0,
  });
  const [posts, setPosts] = useState<IPost[]>([]);
  const [vehicles, setVehicles] = useState<IUserVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
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

  const fetchVehicles = async () => {
    // Only fetch if not already loaded
    if (vehicles.length > 0) {
      return;
    }

    try {
      setVehiclesLoading(true);
      const vehiclesData = await getUserVehicles();
      if (vehiclesData?.success && vehiclesData?.Response && Array.isArray(vehiclesData.Response)) {
        setVehicles(vehiclesData.Response);
      }
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setVehiclesLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  useEffect(() => {
    // Fetch vehicles when vehicles tab is selected
    if (activeTab === 'vehicles' && user?.id) {
      fetchVehicles();
    }
  }, [activeTab, user?.id]);

  const handleRefresh = async () => {
    if (activeTab === 'posts') {
      await fetchData(true);
    } else {
      // Refresh vehicles
      try {
        setRefreshing(true);
        const vehiclesData = await getUserVehicles();
        if (vehiclesData?.success && vehiclesData?.Response && Array.isArray(vehiclesData.Response)) {
          setVehicles(vehiclesData.Response);
        }
      } catch (error) {
        console.error('Error refreshing vehicles:', error);
      } finally {
        setRefreshing(false);
      }
    }
  };

  const handlePostPress = (post: IPost) => {
    // Navigate to post detail if needed
    // For now, just log
    console.log('Post pressed:', post.id);
  };

  const handleVehiclePress = (vehicle: IUserVehicle) => {
    // Navigate to vehicle detail if needed
    // For now, just log
    console.log('Vehicle pressed:', vehicle.id);
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
          justifyContent: 'flex-end',
          paddingHorizontal: 16,
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          borderBottomWidth: 0.5,
          borderBottomColor: isDark ? colors.border : '#DBDBDB',
          backgroundColor: colors.background,
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
          gap: 32,
        },
        gridNavIcon: {
          padding: 8,
          position: 'relative',
        },
        gridNavIconActive: {
          borderBottomWidth: 1,
          borderBottomColor: colors.text,
        },
        gridNavIconInactive: {
          opacity: 0.5,
        },
      }),
    [colors, isDark, insets.top],
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
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
            style={[
              styles.gridNavIcon,
              activeTab === 'posts' ? styles.gridNavIconActive : styles.gridNavIconInactive,
            ]}
            onPress={() => setActiveTab('posts')}
            activeOpacity={0.7}>
            <Icon name="grid" size={RFValue(24)} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.gridNavIcon,
              activeTab === 'vehicles' ? styles.gridNavIconActive : styles.gridNavIconInactive,
            ]}
            onPress={() => setActiveTab('vehicles')}
            activeOpacity={0.7}>
            <Icon name="car" size={RFValue(24)} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Content Grid */}
        {activeTab === 'posts' ? (
          <PostGrid posts={posts} loading={loading} onPostPress={handlePostPress} />
        ) : (
          <VehicleGrid
            vehicles={vehicles}
            loading={vehiclesLoading}
            refreshing={refreshing}
            onVehiclePress={handleVehiclePress}
          />
        )}
      </ScrollView>
    </View>
  );
};

export default InstagramProfile;

