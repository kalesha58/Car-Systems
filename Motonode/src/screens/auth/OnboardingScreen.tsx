import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Feather from 'react-native-vector-icons/Feather';

import { AuthRoutes } from '@constants/routes';
import { useAuth } from '@context/index';
import { useColors } from '@hooks/useColors';
import { lightHaptic } from '@utils/haptics';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    icon: 'shopping-bag',
    title: "India's Largest Auto Marketplace",
    subtitle:
      'Buy spare parts, riding gear, tyres, batteries — everything for your vehicle in one place.',
    color: '#6D6D6D',
  },
  {
    id: '2',
    icon: 'tool',
    title: 'Book Services Near You',
    subtitle:
      'Find and book trusted mechanics, detailing centers, and wash stations with just a tap.',
    color: '#10B981',
  },
  {
    id: '3',
    icon: 'cpu',
    title: 'AI Powered Automotive Help',
    subtitle:
      'Diagnose problems, find compatible parts, and get expert advice from our AI assistant 24/7.',
    color: '#7C3AED',
  },
  {
    id: '4',
    icon: 'users',
    title: 'Join the Community',
    subtitle:
      "Connect with fellow enthusiasts, share rides, and discover India's best automotive community.",
    color: '#F59E0B',
  },
];

type AuthScreenParamList = {
  [AuthRoutes.Onboarding]: undefined;
  [AuthRoutes.Login]: undefined;
  [AuthRoutes.Signup]: undefined;
  [AuthRoutes.OtpVerify]: undefined;
};

type OnboardingNavigationProp = NativeStackNavigationProp<
  AuthScreenParamList,
  typeof AuthRoutes.Onboarding
>;

export function OnboardingScreen() {
  const colors = useColors();
  const { completeOnboarding } = useAuth();
  const navigation = useNavigation<OnboardingNavigationProp>();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const isLast = activeIndex === SLIDES.length - 1;

  const finish = async () => {
    await completeOnboarding();
    navigation.replace(AuthRoutes.Login);
  };

  const goNext = () => {
    if (isLast) {
      finish();
    } else {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1 });
    }
    lightHaptic();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={[styles.safe, Platform.OS === 'web' && { paddingTop: 67 }]}>
        <Pressable style={styles.skipBtn} onPress={finish}>
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
        </Pressable>

        <Animated.FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false },
          )}
          onMomentumScrollEnd={(e) => {
            setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / width));
          }}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
                <Feather name={item.icon as 'shopping-bag'} size={64} color={item.color} />
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{item.title}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
            </View>
          )}
        />

        <View style={styles.bottom}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => {
              const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [8, 24, 8],
                extrapolate: 'clamp',
              });
              const opacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.4, 1, 0.4],
                extrapolate: 'clamp',
              });
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.dot,
                    { width: dotWidth, opacity, backgroundColor: SLIDES[activeIndex].color },
                  ]}
                />
              );
            })}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.nextBtn,
              { backgroundColor: SLIDES[activeIndex].color, opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={goNext}
          >
            {isLast ? (
              <Text style={styles.nextBtnText}>Get Started</Text>
            ) : (
              <Feather name="arrow-right" size={24} color="#fff" />
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  skipBtn: { alignSelf: 'flex-end', padding: 16, paddingRight: 20 },
  skipText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 36,
  },
  subtitle: { fontSize: 16, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 24 },
  bottom: { paddingHorizontal: 24, paddingBottom: 40, gap: 24, alignItems: 'center' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  nextBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    minWidth: 160,
  },
  nextBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
