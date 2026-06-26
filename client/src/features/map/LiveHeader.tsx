import {View, StyleSheet, Pressable, StatusBar} from 'react-native';
import React, {FC} from 'react';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuthStore} from '@state/authStore';
import {navigate} from '@utils/NavigationUtils';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';
import {Fonts, MIN_TOUCH_TARGET} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';

const LiveHeader: FC<{
  type: 'Customer' | 'Delivery';
  title: string;
  secondTitle: string;
}> = ({title, type, secondTitle}) => {
  const isCustomer = type === 'Customer';
  const {colors} = useTheme();

  const {currentOrder, setCurrentOrder} = useAuthStore();

  return (
    <SafeAreaView style={{backgroundColor: colors.secondary}} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.secondary} />
      <View style={[styles.headerContainer, {backgroundColor: colors.secondary, borderBottomWidth: 0}]}>
        <Pressable
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
          style={styles.backButton}
          onPress={() => {
            if (isCustomer) {
              navigate('MainTabs');
              // Clear currentOrder if order is delivered or cancelled
              const orderStatus = currentOrder?.status?.toUpperCase() || '';
              if (
                orderStatus === 'DELIVERED' || 
                orderStatus === 'CANCELLED_BY_USER' || 
                orderStatus === 'CANCELLED_BY_DEALER' ||
                orderStatus === 'REFUND_COMPLETED'
              ) {
                setCurrentOrder(null);
              }
              return;
            }
            navigate('DeliveryDashboard');
          }}>
          <Icon
            name="chevron-back"
            size={RFValue(16)}
            color={colors.white}
          />
        </Pressable>

        <CustomText
          variant="h8"
          fontFamily={Fonts.Medium}
          style={{color: '#f0f0f0'}}>
          {title}
        </CustomText>

        <CustomText
          variant="h4"
          fontFamily={Fonts.SemiBold}
          style={{color: colors.white}}>
          {secondTitle}
        </CustomText>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    justifyContent: 'center',
    paddingVertical: 10,
    alignItems: 'center',
    paddingHorizontal: MIN_TOUCH_TARGET + 12,
  },
  backButton: {
    position: 'absolute',
    left: 12,
    top: 10,
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LiveHeader;
