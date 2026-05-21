import { View, StyleSheet, Image, type ImageSourcePropType } from 'react-native';
import React, { FC, useMemo } from 'react';
import AutoScroll from '@homielab/react-native-auto-scroll';
import { screenWidth } from '@utils/Scaling';
import { useTheme } from '@hooks/useTheme';

const LOGIN_SLIDER_IMAGES: ImageSourcePropType[] = [
  require('../../assets/category/1.png'),
  require('../../assets/category/2.png'),
  require('../../assets/category/3.png'),
  require('../../assets/category/4.png'),
  require('../../assets/category/5.png'),
  require('../../assets/category/6.png'),
  require('../../assets/category/7.png'),
  require('../../assets/category/8.png'),
  require('../../assets/category/9.png'),
  require('../../assets/category/10.png'),
  require('../../assets/category/11.png'),
  require('../../assets/category/12.png'),
];

const ProductSlider = () => {
  const { colors } = useTheme();

  const rows = useMemo(() => {
    const result = [];
    for (let i = 0; i < LOGIN_SLIDER_IMAGES.length; i += 4) {
      result.push(LOGIN_SLIDER_IMAGES.slice(i, i + 4));
    }
    return result;
  }, []);

  return (
    <View pointerEvents='none'>
        <AutoScroll duration={10000} endPaddingWidth={0} style={styles.autoScroll} >
            <View style={styles.gridContainer}>
                    {rows?.map((row, rowIndex: number) => {
                        return(
                            <MemoizedRow key={rowIndex} row={row} rowIndex={rowIndex} backgroundColor={colors.backgroundSecondary} />
                        )
                    })}
            </View>
        </AutoScroll>
    </View>
  )
}

const Row: FC<{
  row: ImageSourcePropType[];
  rowIndex: number;
  backgroundColor: string;
}> = ({ row, rowIndex, backgroundColor }) => {
    return(
        <View style={styles.row}>
            {row?.map((image,imageIndex)=>{
                const horizontalShift = rowIndex % 2===0 ? -18:18
                return(
                    <View key={imageIndex} style={[styles.itemContainer, { backgroundColor }, {transform:[{translateX:horizontalShift}]}]}>
                        <Image source={image} style={styles.image}/>
                    </View>
                )
            })}
        </View>
    )
}

const MemoizedRow = React.memo(Row)

const styles = StyleSheet.create({
    autoScroll: {
        position: 'absolute',
        zIndex: -2
    },
    gridContainer: {
        justifyContent: 'center',
        overflow: 'visible',
        alignItems: 'center'
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain'
    },
    row: {
        flexDirection: "row",
        marginBottom: 5
    },
    itemContainer: {
        marginBottom: 8,
        marginHorizontal: 10,
        width: screenWidth * 0.26,
        height: screenWidth * 0.26,
        justifyContent: 'center',
        borderRadius: 25,
        alignItems: 'center'
    },
})

export default ProductSlider