import React, {FC} from 'react';
import {View, StyleSheet, TouchableOpacity, ScrollView} from 'react-native';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts, Colors} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';

interface ISuggestionsProps {
  onSelectSuggestion: (query: string) => void;
  visible: boolean;
}

const popularSearches = [
  'Car parts',
  'Engine oil',
  'Brake pads',
  'Tires',
  'Battery',
  'Accessories',
];

const Suggestions: FC<ISuggestionsProps> = ({onSelectSuggestion, visible}) => {
  const {colors} = useTheme();

  if (!visible) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    section: {
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: RFValue(12),
      marginBottom: 8,
    },
    scrollView: {
      flexDirection: 'row',
    },
    suggestionChip: {
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
    suggestionText: {
      fontSize: RFValue(11),
      marginLeft: 6,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <CustomText
          variant="h7"
          fontFamily={Fonts.SemiBold}
          style={[styles.sectionTitle, {color: colors.text}]}>
          Popular Searches
        </CustomText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollView}>
          {popularSearches.map((search, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionChip}
              onPress={() => onSelectSuggestion(search)}
              activeOpacity={0.7}>
              <Icon name="trending-up-outline" color={Colors.secondary} size={RFValue(14)} />
              <CustomText
                variant="h7"
                fontFamily={Fonts.Medium}
                style={[styles.suggestionText, {color: colors.text}]}>
                {search}
              </CustomText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

export default Suggestions;

