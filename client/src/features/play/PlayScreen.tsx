import React, {useEffect, useState} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {screenHeight, screenWidth} from '@utils/Scaling';
import {Colors, Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import {getPosts} from '@service/postService';
import {IPost} from '../../types/post/IPost';
import ImagePostItem from './ImagePostItem';

const TABS = ['For You', 'Beauty Binge', 'Trends for him', 'Trends for her'];

const PlayScreen: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

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

  const renderPostItem = ({item}: {item: IPost}) => {
    return <ImagePostItem post={item} />;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.secondary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <CustomText fontSize={RFValue(18)} fontFamily={Fonts.Bold} style={styles.title}>
          Play
        </CustomText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}>
          {TABS.map((tab, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.tab,
                selectedTab === index && styles.activeTab,
              ]}
              onPress={() => setSelectedTab(index)}>
              <CustomText
                fontSize={RFValue(10)}
                fontFamily={Fonts.Medium}
                style={
                  selectedTab === index
                    ? [styles.tabText, styles.activeTabText]
                    : styles.tabText
                }>
                {tab}
              </CustomText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPostItem}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: screenWidth * 0.04,
    paddingTop: screenHeight * 0.01,
    paddingBottom: screenHeight * 0.01,
    backgroundColor: '#000',
  },
  title: {
    color: '#fff',
    marginBottom: screenHeight * 0.01,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: screenWidth * 0.04,
  },
  tab: {
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.008,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: Colors.secondary,
  },
  tabText: {
    color: '#fff',
  },
  activeTabText: {
    color: '#fff',
  },
  listContent: {
    paddingBottom: screenHeight * 0.02,
  },
});

export default PlayScreen;

