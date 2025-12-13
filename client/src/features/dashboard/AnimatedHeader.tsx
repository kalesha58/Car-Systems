import React, { FC } from 'react'
import { useCollapsibleContext } from '@r0b0t3d/react-native-collapsible'
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated'
import Header from '@components/dashboard/Header'


const AnimatedHeader: FC<{ showNotice: () => void; title?: string; subtitle?: string }> = ({ showNotice, title, subtitle }) => {

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
        <Animated.View style={headerAnimatedStyle}>
            <Header showNotice={showNotice} title={title} subtitle={subtitle} />
        </Animated.View>
    )
}

export default AnimatedHeader