import React, { FC, ReactNode } from 'react'
import { View, StyleSheet } from 'react-native'
import { useCollapsibleContext } from '@r0b0t3d/react-native-collapsible'
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated'
import Header from '@components/dashboard/Header'


const AnimatedHeader: FC<{ 
  showNotice: () => void; 
  title?: string; 
  subtitle?: string;
  rightComponent?: ReactNode;
}> = ({ showNotice, title, subtitle, rightComponent }) => {

    const { scrollY } = useCollapsibleContext()

    const headerAnimatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [0, 120],
            [1, 0]
        )
        return { opacity }
    })

    return (
        <Animated.View style={[styles.container, headerAnimatedStyle]}>
            <View style={styles.headerWrapper}>
                <Header showNotice={showNotice} title={title} subtitle={subtitle} />
            </View>
            {rightComponent && (
                <View style={styles.rightComponent}>
                    {rightComponent}
                </View>
            )}
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        width: '100%',
    },
    headerWrapper: {
        flex: 1,
    },
    rightComponent: {
        position: 'absolute',
        right: 10,
        top: 10,
        zIndex: 10,
    },
})

export default AnimatedHeader