import React, {FC} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';
import {screenHeight, screenWidth} from '@utils/Scaling';

interface IEmptyStateProps {
  hasSearchQuery: boolean;
  searchQuery?: string;
  onClearFilters?: () => void;
  onClearSearch?: () => void;
}

const EmptyState: FC<IEmptyStateProps> = ({
  hasSearchQuery,
  searchQuery,
  onClearFilters,
  onClearSearch,
}) => {
  const {colors} = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingVertical: screenHeight * 0.15,
    },
    icon: {
      marginBottom: 20,
      opacity: 0.5,
    },
    title: {
      marginBottom: 12,
      textAlign: 'center',
    },
    message: {
      textAlign: 'center',
      marginBottom: 24,
      opacity: 0.7,
    },
    suggestionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 20,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 8,
    },
    suggestionText: {
      marginLeft: 8,
    },
  });

  if (hasSearchQuery) {
    return (
      <View style={styles.container}>
        <Icon
          name="search-outline"
          size={RFValue(64)}
          color={colors.disabled}
          style={styles.icon}
        />
        <CustomText
          variant="h5"
          fontFamily={Fonts.SemiBold}
          style={[styles.title, {color: colors.text}]}>
          No results found
        </CustomText>
        <CustomText
          variant="h6"
          fontFamily={Fonts.Regular}
          style={[styles.message, {color: colors.textSecondary}]}>
          We couldn't find any items matching "{searchQuery}"
        </CustomText>
        <View>
          <TouchableOpacity
            style={styles.suggestionButton}
            onPress={onClearSearch}
            activeOpacity={0.7}>
            <Icon name="close-circle-outline" color={colors.text} size={RFValue(18)} />
            <CustomText
              variant="h6"
              fontFamily={Fonts.Medium}
              style={[styles.suggestionText, {color: colors.text}]}>
              Clear Search
            </CustomText>
          </TouchableOpacity>
          {onClearFilters && (
            <TouchableOpacity
              style={styles.suggestionButton}
              onPress={onClearFilters}
              activeOpacity={0.7}>
              <Icon name="filter-outline" color={colors.text} size={RFValue(18)} />
              <CustomText
                variant="h6"
                fontFamily={Fonts.Medium}
                style={[styles.suggestionText, {color: colors.text}]}>
                Clear Filters
              </CustomText>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Icon
        name="cube-outline"
        size={RFValue(64)}
        color={colors.disabled}
        style={styles.icon}
      />
      <CustomText
        variant="h5"
        fontFamily={Fonts.SemiBold}
        style={[styles.title, {color: colors.text}]}>
        No items available
      </CustomText>
      <CustomText
        variant="h6"
        fontFamily={Fonts.Regular}
        style={[styles.message, {color: colors.textSecondary}]}>
        Try adjusting your filters or browse other categories
      </CustomText>
      {onClearFilters && (
        <TouchableOpacity
          style={styles.suggestionButton}
          onPress={onClearFilters}
          activeOpacity={0.7}>
          <Icon name="refresh-outline" color={colors.text} size={RFValue(18)} />
          <CustomText
            variant="h6"
            fontFamily={Fonts.Medium}
            style={[styles.suggestionText, {color: colors.text}]}>
            Clear Filters
          </CustomText>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default EmptyState;

