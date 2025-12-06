import React from 'react';
import {View, StyleSheet, FlatList} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import CustomText from '@components/ui/CustomText';
import {Colors, Fonts} from '@utils/Constants';
import {RFValue} from 'react-native-responsive-fontsize';
import {useCartStore} from '@state/cartStore';
import {screenHeight, screenWidth} from '@utils/Scaling';

const CartScreen: React.FC = () => {
  const {cart} = useCartStore();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <CustomText
          fontSize={RFValue(20)}
          fontFamily={Fonts.Bold}
          style={styles.title}>
          Cart
        </CustomText>
      </View>
      {cart.length === 0 ? (
        <View style={styles.emptyContainer}>
          <CustomText
            fontSize={RFValue(16)}
            fontFamily={Fonts.Medium}
            style={styles.emptyText}>
            Your cart is empty
          </CustomText>
        </View>
      ) : (
        <FlatList
          data={cart}
          keyExtractor={item => item._id.toString()}
          renderItem={({item}) => (
            <View style={styles.cartItem}>
              <CustomText fontFamily={Fonts.Medium}>
                {item.item?.name || 'Item'} x {item.count}
              </CustomText>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: screenWidth * 0.04,
    paddingVertical: screenHeight * 0.02,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    color: Colors.text,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.disabled,
  },
  cartItem: {
    padding: screenWidth * 0.04,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
});

export default CartScreen;

