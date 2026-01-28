import { View, Text, StyleSheet, Animated as RNAnimated } from 'react-native'
import React, { FC } from 'react'
import { NoticeHeight } from '@utils/Scaling';
import Notice from '@components/dashboard/Notice';
import { useTheme } from '@hooks/useTheme';


const NOTICE_HEIGHT = -(NoticeHeight + 12)


const NoticeAnimation: FC<{ noticePosition: any; children: React.ReactElement }>
    = ({ noticePosition, children }) => {
        const { colors } = useTheme();
        
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <RNAnimated.View style={[styles.noticeContainer, { transform: [{ translateY: noticePosition }] }]}>
                    <Notice />
                </RNAnimated.View>
                <RNAnimated.View style={[styles.contentContainer, {
                    paddingTop: noticePosition.interpolate({
                        inputRange: [NOTICE_HEIGHT, 0],
                        outputRange: [0, NoticeHeight + 20]
                    })
                }]}>
                    {children}
                </RNAnimated.View>
            </View>
        )
    }


const styles = StyleSheet.create({
    noticeContainer: {
        width: '100%',
        zIndex: 999,
        position: 'absolute',
    },
    contentContainer: {
        flex: 1,
        width: '100%'
    },
    container: {
        flex: 1,
    }
})

export default NoticeAnimation