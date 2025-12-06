import {View, Text, StyleSheet, FlatList} from 'react-native';
import React, {FC} from 'react';
import {Colors} from '@utils/Constants';
import ProductItem from './ProductItem';
import VehicleItem from './VehicleItem';
import ServiceItem from './ServiceItem';
import {IProduct} from '@types/product/IProduct';
import {IDealerVehicle} from '@types/vehicle/IVehicle';
import {IService} from '@types/service/IService';

type ItemType = IProduct | IDealerVehicle | IService;

interface ProductListProps {
  data: ItemType[];
  itemType?: 'products' | 'vehicles' | 'services';
}

const ProductList: FC<ProductListProps> = ({data, itemType = 'products'}) => {
  const renderItem = ({item, index}: {item: ItemType; index: number}) => {
    if (itemType === 'vehicles') {
      return <VehicleItem item={item as IDealerVehicle} index={index} />;
    }
    if (itemType === 'services') {
      return <ServiceItem item={item as IService} index={index} />;
    }
    return <ProductItem item={item as IProduct} index={index} />;
  };

  return (
    <FlatList
      data={data}
      keyExtractor={item => item.id || (item as any)._id}
      renderItem={renderItem}
      style={styles.container}
      contentContainerStyle={styles.content}
      numColumns={2}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    backgroundColor: Colors.backgroundSecondary,
  },
  content: {
    paddingVertical: 10,
    paddingBottom: 100,
  },
});

export default ProductList;
