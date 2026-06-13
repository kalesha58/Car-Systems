import { View, StyleSheet } from 'react-native'
import React, { FC } from 'react'
import { NoticeHeight } from '@utils/Scaling'
import CustomText from '@components/ui/CustomText'
import { Fonts, headerTopInset } from '@utils/Constants'
import { Defs, G, Path, Svg, Use } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useVisualEffectsStore } from '@state/visualEffectsStore'

/** SVG path for the notice bottom wave (local to this screen). */
const NOTICE_WAVE_PATH =
  'M 0 2000 0 500 Q 62.5 280 125 500 t 125 0 125 0 125 0 125 0 125 0 125 0 125 0 125 0 125 0 125 0 125 0   125 0 125 0 125 0  125 0 125 0 125 0  125 0 125 0 125 0  125 0 125 0 125 0  125 0 125 0 125 0  125 0 125 0 125 0  125 0 125 0 125 0  125 0 125 0 125 0  125 0 125 0 125 0  125 0 125 0 125 0 v1000 z'

const Notice: FC = () => {
    const insets = useSafeAreaInsets()
    const rainNotice = useVisualEffectsStore(state => state.config.rainNotice)

    return (
        <View style={{ height: NoticeHeight }}>
            <View style={styles.container}>
                <View style={styles.noticeContainer}>
                    <View style={{ padding: 10, paddingTop: headerTopInset(insets?.top || 0) + 6 }}>
                        <CustomText style={styles.heading} variant='h8' fontFamily={Fonts.SemiBold}>
                            {rainNotice.title}
                        </CustomText>
                        <CustomText variant='h9' style={styles.textCenter}>
                            {rainNotice.subtitle}
                        </CustomText>
                    </View>
                </View>
            </View>

            <Svg
                width='100%'
                height='35'
                fill='#CCD5E4'
                viewBox='0 0 4000 1000'
                preserveAspectRatio='none'
                style={styles.wave}
            >
                <Defs>
                    <Path id='wavepath' d={NOTICE_WAVE_PATH} />
                </Defs>
                <G>
                    <Use href="#wavepath" y="321" />
                </G>
            </Svg>


        </View>
    )
}


const styles = StyleSheet.create({
    container: {
        backgroundColor: '#CCD5E4'
    },
    noticeContainer: {
        justifyContent: "center",
        alignItems: 'center',
        backgroundColor: '#CCD5E4'
    },
    textCenter: {
        textAlign: 'center',
        marginBottom: 8,

    },
    heading: {
        color: '#2D3875',
        marginBottom: 8,
        textAlign: 'center',
    },
    wave:{
        width:'100%',
        transform:[{rotateX:'180deg'}]
    }
})
export default Notice