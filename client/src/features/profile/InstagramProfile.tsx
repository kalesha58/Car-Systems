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
import {useFocusEffect} from '@react-navigation/native';
import InstagramProfileHeader from './sections/InstagramProfileHeader';
import PostGrid from './sections/PostGrid';
import VehicleGrid from './sections/VehicleGrid';
import BusinessRegistrationInfo from './sections/BusinessRegistrationInfo';
import {getUserStats, IUserStats} from '@service/profileService';
import {getPosts} from '@service/postService';
import {getUserVehicles} from '@service/vehicleService';
import {getBusinessRegistrationByUserId, IBusinessRegistration} from '@service/dealerService';
import {IPost} from '../../types/post/IPost';
import {IUserVehicle} from '../../types/vehicle/IVehicle';
import {useTranslation} from 'react-i18next';

type TabType = 'posts' | 'vehicles' | 'businessInfo';

const InstagramProfile: React.FC = () => {
  const {user} = useAuthStore();
  const {colors, isDark} = useTheme();
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const isDealer = user?.role?.includes('dealer');
  const [activeTab, setActiveTab] = useState<TabType>(isDealer ? 'businessInfo' : 'posts');
  const [stats, setStats] = useState<IUserStats>({
    postsCount: 0,
    vehiclesCount: 0,
    ordersCount: 0,
  });
  const [posts, setPosts] = useState<IPost[]>([]);
  const [vehicles, setVehicles] = useState<IUserVehicle[]>([]);
  const [businessRegistration, setBusinessRegistration] = useState<IBusinessRegistration | null>(null);
  const [loading, setLoading] = useState(true);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [businessInfoLoading, setBusinessInfoLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      if (isDealer) {
        // For dealers, fetch stats only (no posts)
        const statsData = await getUserStats();
        if (statsData) {
          setStats(statsData);
        }
      } else {
        // For regular users, fetch stats and posts
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
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchBusinessRegistration = async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setBusinessInfoLoading(true);
      }

      if (user?.id) {
        const registration = await getBusinessRegistrationByUserId(user.id);
        setBusinessRegistration(registration);
      }
    } catch (error) {
      console.error('Error fetching business registration:', error);
      setBusinessRegistration(null);
    } finally {
      setBusinessInfoLoading(false);
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
      if (isDealer) {
        fetchBusinessRegistration();
      }
    }
  }, [user?.id, isDealer]);

  useEffect(() => {
    // Fetch vehicles when vehicles tab is selected
    if (activeTab === 'vehicles' && user?.id) {
      fetchVehicles();
    }
    // Fetch business registration when businessInfo tab is selected
    if (activeTab === 'businessInfo' && isDealer && user?.id) {
      fetchBusinessRegistration();
    }
  }, [activeTab, user?.id, isDealer]);

  // Refresh vehicles when screen comes into focus (e.g., after adding a vehicle)
  useFocusEffect(
    React.useCallback(() => {
      if (activeTab === 'vehicles' && user?.id) {
        // Force refresh vehicles when screen is focused
        const refreshVehicles = async () => {
          try {
            setVehiclesLoading(true);
            const vehiclesData = await getUserVehicles();
            if (vehiclesData?.success && vehiclesData?.Response && Array.isArray(vehiclesData.Response)) {
              setVehicles(vehiclesData.Response);
            }
          } catch (error) {
            console.error('Error refreshing vehicles:', error);
          } finally {
            setVehiclesLoading(false);
          }
        };
        refreshVehicles();
      }
      if (activeTab === 'businessInfo' && isDealer && user?.id) {
        fetchBusinessRegistration();
      }
    }, [activeTab, user?.id, isDealer]),
  );

  const handleRefresh = async () => {
    if (activeTab === 'posts') {
      await fetchData(true);
    } else if (activeTab === 'businessInfo' && isDealer) {
      await fetchBusinessRegistration(true);
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
    // Navigate to Play screen to view the post
    navigate('MainTabs', {
      screen: 'Play',
      params: { postId: post.id },
    });
  };

  const handleVehiclePress = (vehicle: IUserVehicle) => {
    navigate('UserVehicleDetail', {vehicleId: vehicle.id});
  };

  const handleSettingsPress = () => {
    // Navigate to settings
    navigate('ProfileSettings');
  };

  const handleAddVehicle = () => {
    navigate('AddUserVehicle');
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
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          paddingBottom: 12,
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
          paddingVertical: 14,
          backgroundColor: colors.background,
          gap: 16,
        },
        gridNavIcon: {
          flex: 1,
          alignItems: 'center',
          paddingVertical: 10,
          borderRadius: 12,
          marginHorizontal: 12,
        },
        gridNavIconActive: {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
        },
        gridNavIconInactive: {
          opacity: 0.4,
        },
        tabIndicator: {
          position: 'absolute',
          bottom: 0,
          width: '40%',
          height: 3,
          backgroundColor: colors.secondary,
          borderRadius: 3,
        },
        floatingButton: {
          position: 'absolute',
          bottom: 24,
          right: 20,
          width: 58,
          height: 58,
          borderRadius: 29,
          backgroundColor: colors.secondary,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: colors.secondary,
          shadowOffset: {
            width: 0,
            height: 6,
          },
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 10,
          zIndex: 1000,
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
          postsCount={isDealer ? undefined : stats.postsCount}
          vehiclesCount={stats.vehiclesCount}
          ordersCount={stats.ordersCount}
          isDealer={isDealer}
        />

        {/* Grid Navigation */}
        <View style={styles.gridNav}>
          {isDealer ? (
            <>
              <TouchableOpacity
                style={[
                  styles.gridNavIcon,
                  activeTab === 'businessInfo' && styles.gridNavIconActive,
                ]}
                onPress={() => setActiveTab('businessInfo')}
                activeOpacity={0.7}>
                <Icon 
                  name={activeTab === 'businessInfo' ? "business" : "business-outline"} 
                  size={RFValue(22)} 
                  color={activeTab === 'businessInfo' ? colors.secondary : colors.text} 
                />
                {activeTab === 'businessInfo' && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.gridNavIcon,
                  activeTab === 'vehicles' && styles.gridNavIconActive,
                ]}
                onPress={() => setActiveTab('vehicles')}
                activeOpacity={0.7}>
                <Icon 
                  name={activeTab === 'vehicles' ? "car" : "car-outline"} 
                  size={RFValue(22)} 
                  color={activeTab === 'vehicles' ? colors.secondary : colors.text} 
                />
                {activeTab === 'vehicles' && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[
                  styles.gridNavIcon,
                  activeTab === 'posts' && styles.gridNavIconActive,
                ]}
                onPress={() => setActiveTab('posts')}
                activeOpacity={0.7}>
                <Icon 
                  name={activeTab === 'posts' ? "grid" : "grid-outline"} 
                  size={RFValue(22)} 
                  color={activeTab === 'posts' ? colors.secondary : colors.text} 
                />
                {activeTab === 'posts' && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.gridNavIcon,
                  activeTab === 'vehicles' && styles.gridNavIconActive,
                ]}
                onPress={() => setActiveTab('vehicles')}
                activeOpacity={0.7}>
                <Icon 
                  name={activeTab === 'vehicles' ? "car" : "car-outline"} 
                  size={RFValue(22)} 
                  color={activeTab === 'vehicles' ? colors.secondary : colors.text} 
                />
                {activeTab === 'vehicles' && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Content Grid */}
        {activeTab === 'posts' ? (
          <PostGrid posts={posts} loading={loading} onPostPress={handlePostPress} />
        ) : activeTab === 'businessInfo' ? (
          <BusinessRegistrationInfo
            businessRegistration={businessRegistration}
            loading={businessInfoLoading}
          />
        ) : (
          <VehicleGrid
            vehicles={vehicles}
            loading={vehiclesLoading}
            refreshing={refreshing}
            onVehiclePress={handleVehiclePress}
          />
        )}
      </ScrollView>

      {/* Floating Add Vehicle Button - Only show when vehicles tab is active */}
      {activeTab === 'vehicles' && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={handleAddVehicle}
          activeOpacity={0.8}>
          <Icon name="add" size={RFValue(28)} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default InstagramProfile;

