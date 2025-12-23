import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { RFValue } from 'react-native-responsive-fontsize';
import { Fonts } from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import { useTheme } from '@hooks/useTheme';
import { useSeasonalTheme } from '@hooks/useSeasonalTheme';

const TAB_BAR_HEIGHT = 70;
const ICON_SIZE = 24;

const LiquidTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { colors, isDark } = useTheme();
  const seasonalTheme = useSeasonalTheme();
  const insets = useSafeAreaInsets();

  // Use green (success) color for active tab
  const activeTabColor = colors.success;



  const bottomPadding = Math.max(8, insets.bottom);
  
  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.border,
          shadowColor: '#000',
          shadowOpacity: isDark ? 0.3 : 0.1,
          paddingBottom: bottomPadding,
          minHeight: TAB_BAR_HEIGHT,
        },
      ]}>
      {/* Tab Buttons */}
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const iconSize = ICON_SIZE;
        // Use green (success) color for active icon, disabled color for inactive
        const iconColor = isFocused ? activeTabColor : colors.disabled;
        const labelColor = isFocused ? activeTabColor : colors.disabled;

        // Icon name mapping for route names
        const getIconName = (routeName: string, focused: boolean): string => {
          const iconMap: { [key: string]: { outline: string; filled: string } } = {
            Home: { outline: 'speedometer-outline', filled: 'speedometer' },
            Play: { outline: 'play-circle-outline', filled: 'play-circle' },
            Category: { outline: 'grid-outline', filled: 'grid' },
            Cart: { outline: 'bag-outline', filled: 'bag' },
            Profile: { outline: 'person-outline', filled: 'person' },
            Inventory: { outline: 'cube-outline', filled: 'cube' },
            Orders: { outline: 'receipt-outline', filled: 'receipt' },
          };
          
          const icons = iconMap[routeName] || { outline: 'home-outline', filled: 'home' };
          return focused ? icons.filled : icons.outline;
        };

        // Handle custom icon rendering (like Cart with badge)
        // Convert outline icons to filled icons when active
        const renderIcon = () => {
          if (options.tabBarIcon) {
            const iconElement = options.tabBarIcon({
              color: iconColor,
              size: iconSize,
              focused: isFocused,
            });
            
            // If focused and icon is wrapped in View (like Cart with badge), replace the icon
            if (isFocused && React.isValidElement(iconElement) && iconElement.type === View) {
              const children = React.Children.toArray((iconElement.props as any).children);
              const iconChild = children.find((child: any) => 
                React.isValidElement(child) && child.type === Icon
              ) as React.ReactElement<any> | undefined;
              
              if (iconChild) {
                const filledIconName = getIconName(route.name, true);
                return (
                  <View>
                    <Icon
                      name={filledIconName as any}
                      size={iconSize}
                      color={iconColor}
                    />
                    {children.filter((child: any) => 
                      !(React.isValidElement(child) && child.type === Icon)
                    )}
                  </View>
                );
              }
            }
            
            // If focused and it's a direct Icon, replace with filled version
            if (isFocused && React.isValidElement(iconElement) && iconElement.type === Icon) {
              const filledIconName = getIconName(route.name, true);
              return (
                <Icon
                  name={filledIconName as any}
                  size={iconSize}
                  color={iconColor}
                />
              );
            }
            
            return iconElement;
          }
          // Fallback to default icon
          const iconName = getIconName(route.name, isFocused);
          return (
            <Icon
              name={iconName as any}
              size={iconSize}
              color={iconColor}
            />
          );
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}>
            <View style={styles.tabContent}>
              <View style={styles.iconContainer}>
                {renderIcon()}
              </View>
              <CustomText
                fontSize={RFValue(8)}
                fontFamily={Fonts.Medium}
                style={[
                  styles.tabLabel,
                  {
                    color: labelColor,
                  },
                ]}>
                {label as string}
              </CustomText>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    position: 'relative',
    overflow: 'visible',
    elevation: 8,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowRadius: 8,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  tabContent: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabLabel: {
    textAlign: 'center',
  },
});

export default LiquidTabBar;

