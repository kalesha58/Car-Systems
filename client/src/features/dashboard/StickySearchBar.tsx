import { View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { StickyView, useCollapsibleContext } from '@r0b0t3d/react-native-collapsible'
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated'
import SearchBar from '@components/dashboard/SearchBar'
import { useTheme } from '@hooks/useTheme'


const StickySearchBar = () => {
  const {scrollY} = useCollapsibleContext();
  const {colors} = useTheme();

  const getCardBackgroundRGB = () => {
    if (colors.cardBackground === '#ffffff') {
      return {r: 255, g: 255, b: 255};
    } else if (colors.cardBackground === '#1E1E1E') {
      return {r: 30, g: 30, b: 30};
    }
    return {r: 255, g: 255, b: 255};
  };

  const rgb = getCardBackgroundRGB();

  const animatedShadow = useAnimatedStyle(()=>{
    const opacity = interpolate(scrollY.value,[0,140],[0,1])
    return {opacity}
  })

  const backgroundColorChanges = useAnimatedStyle(()=>{
    const opacity = interpolate(scrollY.value,[1,80],[0,1])
    return { backgroundColor: `rgba(${rgb.r},${rgb.g},${rgb.b},${opacity})` }
  })



  const styles = StyleSheet.create({
    shadow:{
        height:15,
        width:'100%',
        borderBottomWidth:1,
        borderBottomColor:colors.border
    }
  });

  return (
    <StickyView style={backgroundColorChanges}>
      <SearchBar />
      <Animated.View style={[styles.shadow,animatedShadow]} />
    </StickyView>
  )
}

export default StickySearchBar