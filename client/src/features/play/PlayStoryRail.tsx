import React from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ListRenderItem,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTranslation } from 'react-i18next';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { playFeedText } from '@utils/playTypography';
import UserInitialAvatar from './UserInitialAvatar';
import { IStoryFeedEntry } from '../../types/story/IStory';
import { useTheme } from '@hooks/useTheme';

const RING = 76;
const INNER = 70;
const AVATAR = 62;

interface PlayStoryRailProps {
  entries: IStoryFeedEntry[];
  loading?: boolean;
  onSelectEntry: (entry: IStoryFeedEntry) => void;
}

const PlayStoryRail: React.FC<PlayStoryRailProps> = ({ entries, loading, onSelectEntry }) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const renderItem: ListRenderItem<IStoryFeedEntry> = ({ item }) => {
    const showRing = item.isOwn || (item.itemCount > 0 && item.hasUnseen);
    const ringColors = showRing
      ? [colors.secondary, '#FF6B6B', '#FFD93D', colors.secondary]
      : [isDark ? '#444' : '#ccc', isDark ? '#555' : '#ddd'];

    const label = item.isOwn
      ? t('play.story.yourStory')
      : (item.userName || '').split(' ')[0] || t('play.story.user');

    return (
      <TouchableOpacity
        style={styles.cell}
        activeOpacity={0.85}
        onPress={() => onSelectEntry(item)}
        accessibilityRole="button"
        accessibilityLabel={label}>
        <LinearGradient
          colors={ringColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.ringOuter, { width: RING, height: RING, borderRadius: RING / 2 }]}>
          <View
            style={[
              styles.ringInner,
              {
                width: INNER,
                height: INNER,
                borderRadius: INNER / 2,
                backgroundColor: colors.background,
              },
            ]}>
            <UserInitialAvatar
              name={item.userName || ''}
              userId={item.userId}
              imageUri={item.userAvatar}
              size={AVATAR}
              borderWidth={0}
              fallbackBackgroundColor={colors.secondary}
              initialsColor={colors.white}
            />
          </View>
        </LinearGradient>
        <CustomText
          numberOfLines={1}
          fontSize={RFValue(9)}
          fontFamily={Fonts.Medium}
          style={[
            playFeedText.meta,
            { color: colors.text, marginTop: 6, maxWidth: RING + 8, textAlign: 'center' },
          ]}>
          {label}
        </CustomText>
      </TouchableOpacity>
    );
  };

  if (loading && entries.length === 0) {
    return (
      <View style={[styles.loaderRow, { borderBottomColor: colors.border }]}>
        <ActivityIndicator size="small" color={colors.secondary} />
      </View>
    );
  }

  if (entries.length === 0) {
    return null;
  }

  return (
    <View style={[styles.wrap, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
      <FlatList
        horizontal
        data={entries}
        keyExtractor={(item) => `${item.isOwn ? 'own' : 'u'}-${item.userId}`}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 10,
    gap: 4,
  },
  cell: {
    alignItems: 'center',
    marginRight: 12,
  },
  ringOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  loaderRow: {
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

export default PlayStoryRail;
