import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import React, {FC} from 'react';
import {Colors, Fonts} from '@utils/Constants';
import CustomText from './CustomText';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {RFValue} from 'react-native-responsive-fontsize';

interface ArrowButtonProps {
  title: string;
  onPress?: () => void;
  price?: number;
  loading?: boolean;
  disabled?: boolean;
}

const ArrowButton: FC<ArrowButtonProps> = ({
  title,
  onPress,
  price,
  loading,
  disabled = false,
}) => {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.btn,
        {justifyContent: price !== 0 ? 'space-between' : 'center'},
        isDisabled && styles.btnDisabled,
      ]}>
      {price != 0 && price && (
        <View>
          <CustomText
            variant="h7"
            style={{color: 'white'}}
            fontFamily={Fonts.Medium}>
            ₹{price.toFixed(1)}
          </CustomText>

          <CustomText
            variant="h9"
            fontFamily={Fonts.Medium}
            style={{color: 'white'}}>
            TOTAL
          </CustomText>
        </View>
      )}

      <View style={styles.flexRow}>
        <CustomText
          variant="h6"
          style={{color: '#fff'}}
          fontFamily={Fonts.Medium}>
          {title}
        </CustomText>
        {loading ? (
          <ActivityIndicator
            color="white"
            style={{marginHorizontal: 5}}
            size="small"
          />
        ) : (
          <Icon name="arrow-right" color="#fff" size={RFValue(25)} />
        )}
      </View>

      
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    backgroundColor: Colors.secondary,
    padding: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 12,
    marginVertical: 10,
    marginHorizontal: 15,
  },
  btnDisabled: {
    backgroundColor: Colors.disabled,
    opacity: 0.6,
  },
  flexRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ArrowButton;
