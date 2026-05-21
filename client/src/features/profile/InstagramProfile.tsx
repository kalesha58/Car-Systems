import {
  View,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import React, {useState, useEffect, useMemo} from 'react';
import {RFValue} from 'react-native-responsive-fontsize';
import { Fonts, MIN_TOUCH_TARGET, headerTopInset } from '@utils/Constants';
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
import CustomHeader from '@components/ui/CustomHeader';

type TabType = 'posts' | 'vehicles' | 'businessInfo';

const InstagramProfile: React.FC = () => {
  const {user} = useAuthStore();
  const {colors, isDark} = useTheme();
  const insets = useSafeAreaInsets();
  const {t} = useTranslation();
  const isDealer = user?.role?.includes('dealer');
  const isGuest = user?.isGuest;
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
    if (isGuest) {
      setStats({
        postsCount: 3,
        vehiclesCount: 1,
        ordersCount: 0,
      });
      setPosts([
        {
          id: 'dummy_1',
          caption: 'My Dream Car! 🏎️',
          mediaUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800',
          mediaType: 'image',
          likesCount: 120,
          commentsCount: 12,
          user: { name: 'Guest' },
          createdAt: new Date().toISOString()
        } as any,
        {
          id: 'dummy_2',
          caption: 'Sunday Drive ☀️',
          mediaUrl: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=800',
          mediaType: 'image',
          likesCount: 85,
          commentsCount: 5,
          user: { name: 'Guest' },
          createdAt: new Date().toISOString()
        } as any,
        {
          id: 'dummy_3',
          caption: 'New Wash! ✨',
          mediaUrl: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=80&w=800',
          mediaType: 'image',
          likesCount: 210,
          commentsCount: 18,
          user: { name: 'Guest' },
          createdAt: new Date().toISOString()
        } as any
      ]);
      setLoading(false);
      setRefreshing(false);
      return;
    }

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
    if (isGuest) return;
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

  const refreshPostsAndStats = React.useCallback(async () => {
    if (isGuest || isDealer || !user?.id) {
      return;
    }
    try {
      const [statsData, postsData] = await Promise.all([getUserStats(), getPosts(user.id)]);
      if (statsData) {
        setStats(statsData);
      }
      if (postsData?.success && postsData?.Response) {
        setPosts(postsData.Response);
      }
    } catch (error) {
      console.error('Error refreshing posts:', error);
    }
  }, [isGuest, isDealer, user?.id]);

  const fetchVehicles = async () => {
    if (isGuest) {
      setVehicles([
        {
          id: 'dummy_v1',
          brand: 'Tesla',
          model: 'Model S',
          year: 2023,
          color: 'Midnight Silver',
          vehicleNumber: 'GUEST-001',
          image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&q=80&w=800'
        } as any
      ]);
      return;
    }
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
  }, [user?.id, isDealer, isGuest]);

  useEffect(() => {
    // Fetch vehicles when vehicles tab is selected
    if (activeTab === 'vehicles' && user?.id) {
      fetchVehicles();
    }
    // Fetch business registration when businessInfo tab is selected
    if (activeTab === 'businessInfo' && isDealer && user?.id) {
      fetchBusinessRegistration();
    }
  }, [activeTab, user?.id, isDealer, isGuest]);

  // Refresh vehicles when screen comes into focus (e.g., after adding a vehicle)
  useFocusEffect(
    React.useCallback(() => {
      if (isGuest) {
        return;
      }
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
      if (activeTab === 'posts' && user?.id && !isDealer) {
        void refreshPostsAndStats();
      }
    }, [activeTab, user?.id, isDealer, isGuest, refreshPostsAndStats]),
  );

  const handleRefresh = async () => {
    if (isGuest) {
      setRefreshing(true);
      setTimeout(() => setRefreshing(false), 1000);
      return;
    }
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
    if (isGuest) return;
    // Navigate to Play screen to view the post
    navigate('MainTabs', {
      screen: 'Play',
      params: { postId: post.id },
    });
  };

  const handleVehiclePress = (vehicle: IUserVehicle) => {
    if (isGuest) return;
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
          paddingTop: headerTopInset(insets.top) + 8,
          paddingBottom: 12,
          backgroundColor: colors.background,
        },
        headerRight: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        headerButton: {
          minWidth: MIN_TOUCH_TARGET,
          minHeight: MIN_TOUCH_TARGET,
          justifyContent: 'center',
          alignItems: 'center',
        },
        content: {
          flex: 1,
          backgroundColor: colors.background,
          borderTopLeftRadius: 25,
          borderTopRightRadius: 25,
          overflow: 'hidden',
        },
        gridNav: {
          flexDirection: 'row',
          alignItems: 'stretch',
          backgroundColor: colors.background,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
        gridNavTab: {
          flex: 1,
        },
        gridNavTabInner: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 12,
          position: 'relative',
          minHeight: 48,
        },
        tabIndicator: {
          position: 'absolute',
          bottom: 0,
          alignSelf: 'center',
          width: 52,
          height: 2,
          borderRadius: 1,
          backgroundColor: colors.secondary,
        },
        gridNavIconInactive: {
          opacity: 0.42,
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
    [colors, insets.top],
  );

  const tabRipple =
    Platform.OS === 'android' ? { color: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' } : undefined;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.secondary} />
      <CustomHeader
        title={t('profile.title')}
        showBackButton={false}
        backgroundColor={colors.secondary}
        titleColor={colors.white}
        iconColor={colors.white}
        rightComponent={
          user ? (
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleSettingsPress}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={t('profile.settings')}>
              <Icon name="settings-outline" size={RFValue(22)} color={colors.white} />
            </TouchableOpacity>
          ) : null
        }
      />

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
        {user && (
          <InstagramProfileHeader stats={stats} />
        )}

        {/* Grid Navigation */}
        {user && (
          <View style={styles.gridNav}>
            {isDealer ? (
              <Pressable
                style={styles.gridNavTab}
                onPress={() => setActiveTab('businessInfo')}
                android_ripple={tabRipple}>
                <View style={styles.gridNavTabInner}>
                  <Icon
                    name={activeTab === 'businessInfo' ? 'business' : 'business-outline'}
                    size={RFValue(24)}
                    color={activeTab === 'businessInfo' ? colors.secondary : colors.text}
                    style={activeTab !== 'businessInfo' ? styles.gridNavIconInactive : undefined}
                  />
                  {activeTab === 'businessInfo' ? <View style={styles.tabIndicator} /> : null}
                </View>
              </Pressable>
            ) : (
              <>
                <Pressable
                  style={styles.gridNavTab}
                  onPress={() => setActiveTab('posts')}
                  android_ripple={tabRipple}>
                  <View style={styles.gridNavTabInner}>
                    <Icon
                      name={activeTab === 'posts' ? 'grid' : 'grid-outline'}
                      size={RFValue(24)}
                      color={activeTab === 'posts' ? colors.secondary : colors.text}
                      style={activeTab !== 'posts' ? styles.gridNavIconInactive : undefined}
                    />
                    {activeTab === 'posts' ? <View style={styles.tabIndicator} /> : null}
                  </View>
                </Pressable>
                <Pressable
                  style={styles.gridNavTab}
                  onPress={() => setActiveTab('vehicles')}
                  android_ripple={tabRipple}>
                  <View style={styles.gridNavTabInner}>
                    <Icon
                      name={activeTab === 'vehicles' ? 'car' : 'car-outline'}
                      size={RFValue(24)}
                      color={activeTab === 'vehicles' ? colors.secondary : colors.text}
                      style={activeTab !== 'vehicles' ? styles.gridNavIconInactive : undefined}
                    />
                    {activeTab === 'vehicles' ? <View style={styles.tabIndicator} /> : null}
                  </View>
                </Pressable>
              </>
            )}
          </View>
        )}

        {/* Guest View or Content Grid */}
        {!user ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 40 }}>
            <View style={{ 
              width: 100, 
              height: 100, 
              borderRadius: 50, 
              backgroundColor: colors.backgroundSecondary, 
              justifyContent: 'center', 
              alignItems: 'center',
              marginBottom: 20
            }}>
              <Icon name="person-circle-outline" size={80} color={colors.disabled} />
            </View>
            <CustomText variant="h5" fontFamily={Fonts.Bold} style={{ textAlign: 'center', color: colors.text }}>
              Welcome to Motonode
            </CustomText>
            <CustomText variant="h8" fontFamily={Fonts.Regular} style={{ textAlign: 'center', color: colors.disabled, marginTop: 10, lineHeight: 20 }}>
              Login to see your profile, manage your vehicles, and track your car service history.
            </CustomText>
            
            <TouchableOpacity 
              onPress={() => navigate('CustomerLogin')}
              style={{
                backgroundColor: colors.secondary,
                paddingHorizontal: 40,
                paddingVertical: 14,
                borderRadius: 30,
                marginTop: 30,
                width: '100%',
                alignItems: 'center'
              }}
              activeOpacity={0.8}
            >
              <CustomText variant="h7" fontFamily={Fonts.Bold} style={{ color: colors.white }}>
                Login / Signup
              </CustomText>
            </TouchableOpacity>
          </View>
        ) : activeTab === 'posts' ? (
          <PostGrid
            posts={posts}
            loading={loading}
            onPostPress={handlePostPress}
            allowManagePosts={!isGuest && !isDealer}
            onPostsChanged={refreshPostsAndStats}
          />
        ) : activeTab === 'businessInfo' ? (
          <BusinessRegistrationInfo
            businessRegistration={businessRegistration}
            loading={businessInfoLoading}
            ordersCount={stats.ordersCount}
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
      {activeTab === 'vehicles' && !isGuest && (
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
