import {View, StyleSheet} from 'react-native';
import React, {useEffect, useState} from 'react';
import {useCartStore} from '@state/cartStore';
import {useSavedForLaterStore} from '@state/savedForLaterStore';
import EnhancedOrderItem from './EnhancedOrderItem';
import DeliveryTimeEstimate from '../cart/DeliveryTimeEstimate';
import {getProductById} from '@service/productService';
import {IProduct} from '../../types/product/IProduct';
import {useTheme} from '@hooks/useTheme';

const EnhancedOrderList = () => {
  const cartItems = useCartStore(state => state.cart);
  const {updateItemStock} = useCartStore();
  const {moveToCart} = useSavedForLaterStore();
  const [productStocks, setProductStocks] = useState<Record<string, number>>({});
  const {colors} = useTheme();

  useEffect(() => {
    fetchProductStocks();
  }, [cartItems]);

  const fetchProductStocks = async () => {
    const stocks: Record<string, number> = {};
    await Promise.all(
      cartItems.map(async item => {
        try {
          const productId = item.item?.id || item._id;
          if (productId) {
            const response = await getProductById(productId.toString());
            if (response?.data?.data) {
              const stock = response.data.data.stock || 999;
              stocks[productId.toString()] = stock;
              updateItemStock(productId, stock);
            }
          }
        } catch (error) {
          console.log('Error fetching product stock:', error);
          stocks[item._id.toString()] = 999; // Default stock
        }
      }),
    );
    setProductStocks(stocks);
  };

  const handleRemove = (item: any) => {
    // Item already removed by EnhancedOrderItem
  };

  const handleSaveForLater = (item: any) => {
    // Item already saved by EnhancedOrderItem
  };

  if (cartItems.length === 0) {
    return null;
  }

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      borderRadius: 15,
      marginBottom: 15,
      overflow: 'hidden',
    },
  });

  return (
    <View style={styles.container}>
      <DeliveryTimeEstimate />
      
      {cartItems.map((item, index) => {
        const productId = item.item?.id || item._id;
        const stock = productStocks[productId?.toString()] || item.stock || item.maxStock || 999;
        
        return (
          <EnhancedOrderItem
            key={item._id ? item._id.toString() : `cart-item-${index}`}
            item={item}
            onRemove={handleRemove}
            onSaveForLater={handleSaveForLater}
            maxStock={stock}
            showStockWarning={true}
          />
        );
      })}
    </View>
  );
};

export default EnhancedOrderList;
