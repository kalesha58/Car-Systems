/**
 * PackageChips
 *
 * Renders Premium / Basic toggle chips for Vehicle Wash.
 * Also renders the delivery mode chips (Home / Dealer Center) for sections
 * that have multiple delivery modes.
 */
import React, {FC} from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import CustomText from '@components/ui/CustomText';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts, Colors} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';

export interface IChipOption {
  value: string;
  label: string;
}

interface PackageChipsProps {
  options: IChipOption[];
  selectedValue: string | null;
  onSelect: (value: string | null) => void;
  label?: string;
}

const PackageChips: FC<PackageChipsProps> = ({options, selectedValue, onSelect, label}) => {
  const {colors} = useTheme();
  const ALL = null;

  return (
    <View style={styles.wrapper}>
      {label && (
        <CustomText
          fontSize={RFValue(9)}
          fontFamily={Fonts.Medium}
          style={{color: colors.text, opacity: 0.6, marginBottom: 4, marginLeft: 16}}>
          {label}
        </CustomText>
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}>
        {/* "All" chip */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => onSelect(ALL)}
          style={[
            styles.chip,
            {
              backgroundColor: selectedValue === null ? Colors.secondary : colors.backgroundSecondary,
              borderColor: selectedValue === null ? Colors.secondary : colors.border,
            },
          ]}>
          <CustomText
            fontSize={RFValue(9)}
            fontFamily={selectedValue === null ? Fonts.SemiBold : Fonts.Medium}
            style={{color: selectedValue === null ? '#fff' : colors.text}}>
            All
          </CustomText>
        </TouchableOpacity>

        {options.map(opt => {
          const active = selectedValue === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              activeOpacity={0.75}
              onPress={() => onSelect(opt.value)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? Colors.secondary : colors.backgroundSecondary,
                  borderColor: active ? Colors.secondary : colors.border,
                },
              ]}>
              <CustomText
                fontSize={RFValue(9)}
                fontFamily={active ? Fonts.SemiBold : Fonts.Medium}
                style={{color: active ? '#fff' : colors.text}}>
                {opt.label}
              </CustomText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 6,
  },
  scroll: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
});

export default PackageChips;
