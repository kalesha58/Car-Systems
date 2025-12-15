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

  const renderEmptyState = () => (
    <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
      <Icon name="images-outline" size={RFValue(64)} color={colors.disabled} />
      <CustomText
        fontSize={RFValue(18)}
        fontFamily={Fonts.SemiBold}
        style={{ color: colors.text, marginTop: 16, marginBottom: 8 }}>
        No Posts Yet
      </CustomText>
      <CustomText
        fontSize={RFValue(14)}
        fontFamily={Fonts.Regular}
        style={{ color: colors.disabled, textAlign: 'center', paddingHorizontal: 40 }}>
        Start following users to see their posts here
      </CustomText>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.backgroundSecondary }]}>
        <View style={styles.headerRow}>
          <CustomText fontSize={RFValue(24)} fontFamily={Fonts.Bold} style={{ color: colors.text }}>
            Play
          </CustomText>
            <TouchableOpacity
            style={[styles.chatButton, { backgroundColor: Colors.secondary }]}
            onPress={() => navigate('Chat')}
            activeOpacity={0.8}>
            <Icon name="chatbubble" size={RFValue(20)} color={colors.white} />
            <View style={styles.chatBadge}>
              <CustomText
                fontSize={RFValue(8)}
                fontFamily={Fonts.Bold}
                style={{ color: Colors.secondary }}>
                !
              </CustomText>
            </View>
            </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          posts.length === 0 && styles.emptyListContent
        ]}
        ListEmptyComponent={!loading ? renderEmptyState : null}
      />
      
      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: Colors.secondary }]}
        onPress={() => navigate('CreateNewPost')}
        activeOpacity={0.8}>
        <Icon name="add" size={RFValue(28)} color={colors.white} />
      </TouchableOpacity>
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
    paddingHorizontal: screenWidth * 0.05,
    paddingVertical: screenHeight * 0.018,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  chatBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.secondary,
  },
  listContent: {
    paddingBottom: screenHeight * 0.15,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: screenHeight * 0.2,
  },
  fab: {
    position: 'absolute',
    bottom: screenHeight * 0.08,
    right: screenWidth * 0.02,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default PlayScreen;

