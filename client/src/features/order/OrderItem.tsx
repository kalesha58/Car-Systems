import {View, Text, StyleSheet, Image} from 'react-native';
import React, {FC} from 'react';
import {Colors, Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import UniversalAdd from '@components/ui/UniversalAdd';
import {IProduct} from '../../types/product/IProduct';

interface CartItem {
  _id: string | number;
  item: IProduct;
  count: number;
}

const OrderItem: FC<{item: CartItem}> = ({item}) => {
  const productImage = item?.item?.images?.[0];

  return (
    <View style={styles.flexRow}>
      <View style={styles.imgContainer}>
        {productImage ? (
          <Image source={{uri: productImage}} style={styles.img} />
        ) : null}
      </View>

      <View style={{width: '55%'}}>
        <CustomText numberOfLines={2} variant="h8" fontFamily={Fonts.Medium}>
          {item.item.name}
        </CustomText>
        {item.item.brand && (
          <CustomText variant="h9" style={{opacity: 0.6}}>
            {item.item.brand}
          </CustomText>
        )}
      </View>

      <View style={{width: '20%', alignItems: 'flex-end'}}>
        <UniversalAdd item={item.item} />
        <CustomText
          variant="h8"
          fontFamily={Fonts.Medium}
          style={{alignSelf: 'flex-end', marginTop: 4}}>
          ₹{item.count * item.item.price}
        </CustomText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  img: {
    width: 40,
    height: 40,
  },
  imgContainer: {
    backgroundColor: Colors.backgroundSecondary,
    padding: 10,
    borderRadius: 15,
    width: '17%',
  },
  flexRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderTopWidth: 0.6,
    borderTopColor: Colors.border,
  },
});

export default OrderItem;
