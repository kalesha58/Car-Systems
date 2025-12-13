import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { screenHeight, screenWidth } from '@utils/Scaling';
import { Colors, Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import { getPosts } from '@service/postService';
import { IPost } from '../../types/post/IPost';
import ImagePostItem from './ImagePostItem';
import { navigate } from '@utils/NavigationUtils';
import { useTheme } from '@hooks/useTheme';

const PlayScreen: React.FC = () => {
  const { colors } = useTheme();
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchPosts();
    }, []),
  );

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await getPosts();
      if (response.success && response.Response) {
        setPosts(response.Response);
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const renderPostItem = ({ item }: { item: IPost }) => {
    return <ImagePostItem post={item} />;
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerRow}>
          <CustomText fontSize={RFValue(20)} fontFamily={Fonts.Bold} style={{ color: colors.text }}>
            Play
          </CustomText>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: colors.backgroundSecondary }]}
              onPress={() => navigate('Chat')}>
              <Icon name="chatbubble-outline" size={RFValue(18)} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.iconButton, styles.primaryButton, { backgroundColor: colors.primary }]}
              onPress={() => navigate('CreateNewPost')}>
              <Icon name="add" size={RFValue(20)} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.012,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  listContent: {
    paddingBottom: screenHeight * 0.02,
  },
});

export default PlayScreen;

