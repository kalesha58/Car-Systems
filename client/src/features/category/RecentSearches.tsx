import React, {FC} from 'react';
import {View, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';
import {useRecentSearchesStore} from '@state/recentSearchesStore';

interface IRecentSearchesProps {
  onSelectSearch: (query: string) => void;
  visible: boolean;
}

const RecentSearches: FC<IRecentSearchesProps> = ({onSelectSearch, visible}) => {
  const {colors} = useTheme();
  const {getRecentSearches, removeSearch, clearSearches} = useRecentSearchesStore();
  const recentSearches = getRecentSearches(5);

  if (!visible || recentSearches.length === 0) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    headerText: {
      fontSize: RFValue(12),
    },
    clearButton: {
      padding: 4,
    },
    scrollView: {
      flexDirection: 'row',
    },
    searchChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchText: {
      fontSize: RFValue(11),
      marginRight: 6,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CustomText
          variant="h7"
          fontFamily={Fonts.SemiBold}
          style={[styles.headerText, {color: colors.text}]}>
          Recent Searches
        </CustomText>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearSearches}
          activeOpacity={0.7}>
          <CustomText
            variant="h8"
            fontFamily={Fonts.Medium}
            style={{color: colors.disabled}}>
            Clear
          </CustomText>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollView}>
        {recentSearches.map((search, index) => (
          <TouchableOpacity
            key={index}
            style={styles.searchChip}
            onPress={() => onSelectSearch(search)}
            activeOpacity={0.7}>
            <Icon name="time-outline" color={colors.text} size={RFValue(14)} />
            <CustomText
              variant="h7"
              fontFamily={Fonts.Medium}
              style={[styles.searchText, {color: colors.text}]}>
              {search}
            </CustomText>
            <TouchableOpacity
              onPress={e => {
                e.stopPropagation();
                removeSearch(search);
              }}
              activeOpacity={0.7}>
              <Icon name="close-circle" color={colors.disabled} size={RFValue(14)} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default RecentSearches;

