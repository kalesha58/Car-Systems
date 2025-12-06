import React, {useState} from 'react';
import {View, StyleSheet, Pressable} from 'react-native';
import CustomText from './CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';

interface ICollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const CollapsibleSection: React.FC<ICollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const {colors} = useTheme();
  const rotation = useSharedValue(defaultExpanded ? 180 : 0);
  const height = useSharedValue(defaultExpanded ? 1 : 0);

  const toggleSection = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    rotation.value = withTiming(newExpanded ? 180 : 0, {duration: 300});
    height.value = withTiming(newExpanded ? 1 : 0, {duration: 300});
  };

  const arrowStyle = useAnimatedStyle(() => {
    return {
      transform: [{rotate: `${rotation.value}deg`}],
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    return {
      opacity: height.value,
      maxHeight: height.value === 1 ? 1000 : 0,
    };
  });

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    content: {
      overflow: 'hidden',
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
  });

  return (
    <View style={styles.container}>
      <Pressable onPress={toggleSection} style={styles.header}>
        <CustomText variant="h5" fontFamily={Fonts.SemiBold}>
          {title}
        </CustomText>
        <Animated.View style={arrowStyle}>
          <Icon
            name="chevron-up"
            size={RFValue(20)}
            color={colors.text}
          />
        </Animated.View>
      </Pressable>
      <Animated.View style={contentStyle}>{children}</Animated.View>
    </View>
  );
};

export default CollapsibleSection;

