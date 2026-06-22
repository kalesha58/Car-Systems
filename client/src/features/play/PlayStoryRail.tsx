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
import { useTranslation } from 'react-i18next';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { playFeedText, playFontSize, playIconSize } from '@utils/playTypography';
import UserInitialAvatar from './UserInitialAvatar';
import { IStoryFeedEntry } from '../../types/story/IStory';
import { useTheme } from '@hooks/useTheme';
import Icon from 'react-native-vector-icons/Ionicons';

const RING = 68;
const INNER = 62;
const AVATAR = 56;

interface PlayStoryRailProps {
  entries: IStoryFeedEntry[];
  loading?: boolean;
  onSelectEntry: (entry: IStoryFeedEntry) => void;
}

const PlayStoryRail: React.FC<PlayStoryRailProps> = ({ entries, loading, onSelectEntry }) => {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation();

  const renderItem: ListRenderItem<IStoryFeedEntry> = ({ item }) => {
    const ownEmpty = item.isOwn && item.itemCount === 0;
    const showGradientRing = item.isOwn ? item.itemCount > 0 : item.itemCount > 0 && item.hasUnseen;
    const ringColors = showGradientRing
      ? [colors.secondary, '#FF6B6B', '#FFD93D', colors.secondary]
      : [isDark ? '#444' : '#ccc', isDark ? '#555' : '#ddd'];

    const label = item.isOwn
      ? ownEmpty
        ? t('play.story.addStatusLabel')
        : t('play.story.yourStory')
      : (item.userName || '').split(' ')[0] || t('play.story.user');

    const avatarBlock = (
      <View style={styles.avatarStack}>
        <UserInitialAvatar
          name={item.userName || ''}
          userId={item.userId}
          imageUri={item.userAvatar}
          size={AVATAR}
          borderWidth={0}
          fallbackBackgroundColor={colors.secondary}
          initialsColor={colors.white}
        />
        {ownEmpty ? (
          <View style={[styles.addBadge, { backgroundColor: colors.secondary, borderColor: colors.background }]}>
            <Icon name="add" size={playIconSize(12)} color={colors.white} />
          </View>
        ) : null}
      </View>
    );

    return (
      <TouchableOpacity
        style={styles.cell}
        activeOpacity={0.85}
        onPress={() => onSelectEntry(item)}
        accessibilityRole="button"
        accessibilityLabel={label}>
        {ownEmpty ? (
          <View
            style={[
              styles.dashedRing,
              {
                width: RING,
                height: RING,
                borderRadius: RING / 2,
                borderColor: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.28)',
                backgroundColor: colors.background,
              },
            ]}>
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
              {avatarBlock}
            </View>
          </View>
        ) : (
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
              {avatarBlock}
            </View>
          </LinearGradient>
        )}
        <CustomText
          numberOfLines={1}
          fontSize={playFontSize(8)}
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
        keyExtractor={(entry) => `${entry.isOwn ? 'own' : 'u'}-${entry.userId}`}
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
  },
  cell: {
    alignItems: 'center',
    marginRight: 12,
  },
  ringOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dashedRing: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  ringInner: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  avatarStack: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBadge: {
    position: 'absolute',
    right: -4,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  loaderRow: {
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});

export default PlayStoryRail;
