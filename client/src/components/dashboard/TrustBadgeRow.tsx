import React, {FC} from 'react';
import {View, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import CustomText from '@components/ui/CustomText';
import {Fonts} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';
import {RFValue} from 'react-native-responsive-fontsize';

interface Badge {
  icon: string;
  label: string;
  color: string;
}

const BADGES: Badge[] = [
  {icon: 'shield-checkmark-outline', label: 'Certified\nMechanics', color: '#1976D2'},
  {icon: 'star-outline',             label: 'Top Rated\nService',   color: '#F59E0B'},
  {icon: 'location-outline',         label: 'Available\nNearby',    color: '#16A34A'},
];

const TrustBadgeRow: FC = () => {
  const {colors} = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'stretch',
      marginTop: 6,
      marginBottom: 16,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 16,
      paddingVertical: 14,
      paddingHorizontal: 8,
    },
    badge: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    divider: {
      width: 1,
      alignSelf: 'stretch',
      backgroundColor: colors.border || colors.disabled || '#E5E7EB',
      marginVertical: 4,
      opacity: 0.6,
    },
    iconCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 7,
    },
    label: {
      textAlign: 'center',
      color: colors.text,
      lineHeight: RFValue(12),
      opacity: 0.85,
    },
  });

  return (
    <View style={styles.container}>
      {BADGES.map((badge, index) => (
        <React.Fragment key={badge.icon}>
          <View style={styles.badge}>
            <View style={[styles.iconCircle, {backgroundColor: badge.color + '18'}]}>
              <Icon
                name={badge.icon}
                size={RFValue(18)}
                color={badge.color}
              />
            </View>
            <CustomText
              variant="h9"
              fontFamily={Fonts.SemiBold}
              style={styles.label}
              numberOfLines={2}>
              {badge.label}
            </CustomText>
          </View>
          {index < BADGES.length - 1 && <View style={styles.divider} />}
        </React.Fragment>
      ))}
    </View>
  );
};

export default TrustBadgeRow;
