import {View, StyleSheet, PanResponder, Dimensions} from 'react-native';
import React, {FC, useRef, useState, useEffect} from 'react';
import {useTheme} from '@hooks/useTheme';
import CustomText from './CustomText';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts} from '@utils/Constants';

interface IPriceRangeSliderProps {
  minValue: number;
  maxValue: number;
  onValueChange: (min: number, max: number) => void;
  initialMin?: number;
  initialMax?: number;
}

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH * 0.6;
const HANDLE_SIZE = 20;

const PriceRangeSlider: FC<IPriceRangeSliderProps> = ({
  minValue,
  maxValue,
  onValueChange,
  initialMin,
  initialMax,
}) => {
  const {colors} = useTheme();
  const [minPosition, setMinPosition] = useState(0);
  const [maxPosition, setMaxPosition] = useState(SLIDER_WIDTH);
  const [isDraggingMin, setIsDraggingMin] = useState(false);
  const [isDraggingMax, setIsDraggingMax] = useState(false);

  useEffect(() => {
    if (initialMin !== undefined && initialMax !== undefined) {
      const minPos = ((initialMin - minValue) / (maxValue - minValue)) * SLIDER_WIDTH;
      const maxPos = ((initialMax - minValue) / (maxValue - minValue)) * SLIDER_WIDTH;
      setMinPosition(Math.max(0, Math.min(minPos, SLIDER_WIDTH)));
      setMaxPosition(Math.max(0, Math.min(maxPos, SLIDER_WIDTH)));
    }
  }, [initialMin, initialMax, minValue, maxValue]);

  const getValueFromPosition = (position: number): number => {
    const ratio = position / SLIDER_WIDTH;
    return Math.round(minValue + ratio * (maxValue - minValue));
  };

  const getPositionFromValue = (value: number): number => {
    const ratio = (value - minValue) / (maxValue - minValue);
    return ratio * SLIDER_WIDTH;
  };

  const currentMin = getValueFromPosition(minPosition);
  const currentMax = getValueFromPosition(maxPosition);

  const minPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDraggingMin(true);
      },
      onPanResponderMove: (evt, gestureState) => {
        const newPosition = Math.max(
          0,
          Math.min(minPosition + gestureState.dx, maxPosition - HANDLE_SIZE),
        );
        setMinPosition(newPosition);
        onValueChange(getValueFromPosition(newPosition), currentMax);
      },
      onPanResponderRelease: () => {
        setIsDraggingMin(false);
      },
    }),
  ).current;

  const maxPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDraggingMax(true);
      },
      onPanResponderMove: (evt, gestureState) => {
        const newPosition = Math.max(
          minPosition + HANDLE_SIZE,
          Math.min(maxPosition + gestureState.dx, SLIDER_WIDTH),
        );
        setMaxPosition(newPosition);
        onValueChange(currentMin, getValueFromPosition(newPosition));
      },
      onPanResponderRelease: () => {
        setIsDraggingMax(false);
      },
    }),
  ).current;

  const styles = StyleSheet.create({
    container: {
      paddingVertical: 20,
    },
    sliderContainer: {
      height: 40,
      justifyContent: 'center',
      position: 'relative',
    },
    track: {
      height: 4,
      backgroundColor: colors.border,
      borderRadius: 2,
    },
    activeTrack: {
      height: 4,
      backgroundColor: colors.secondary,
      borderRadius: 2,
      position: 'absolute',
      left: minPosition,
      width: maxPosition - minPosition,
    },
    handle: {
      width: HANDLE_SIZE,
      height: HANDLE_SIZE,
      borderRadius: HANDLE_SIZE / 2,
      backgroundColor: colors.secondary,
      position: 'absolute',
      top: 10,
      borderWidth: 2,
      borderColor: colors.cardBackground,
    },
    minHandle: {
      left: minPosition - HANDLE_SIZE / 2,
    },
    maxHandle: {
      left: maxPosition - HANDLE_SIZE / 2,
    },
    valueContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    valueText: {
      fontSize: RFValue(12),
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.sliderContainer}>
        <View style={styles.track} />
        <View style={styles.activeTrack} />
        <View
          style={[styles.handle, styles.minHandle]}
          {...minPanResponder.panHandlers}
        />
        <View
          style={[styles.handle, styles.maxHandle]}
          {...maxPanResponder.panHandlers}
        />
      </View>
      <View style={styles.valueContainer}>
        <CustomText
          variant="h6"
          fontFamily={Fonts.Medium}
          style={styles.valueText}
          color={colors.text}>
          ₹{currentMin}
        </CustomText>
        <CustomText
          variant="h6"
          fontFamily={Fonts.Medium}
          style={styles.valueText}
          color={colors.text}>
          ₹{currentMax}
        </CustomText>
      </View>
    </View>
  );
};

export default PriceRangeSlider;

