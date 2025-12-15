import {View, Text, StyleSheet, FlatList, RefreshControl} from 'react-native';
import React, {FC} from 'react';
import ProductItem from './ProductItem';
import VehicleItem from './VehicleItem';
import ServiceItem from './ServiceItem';
import ProductListItem from './ProductListItem';
import VehicleListItem from './VehicleListItem';
import ServiceListItem from './ServiceListItem';
import ProductItemSkeleton from './ProductItemSkeleton';
import VehicleItemSkeleton from './VehicleItemSkeleton';
import ServiceItemSkeleton from './ServiceItemSkeleton';
import {IProduct} from '@types/product/IProduct';
import {IDealerVehicle} from '@types/vehicle/IVehicle';
import {IService} from '@types/service/IService';
import {useTheme} from '@hooks/useTheme';
import {ViewMode} from './ViewToggle';

type ItemType = IProduct | IDealerVehicle | IService;

interface ProductListProps {
  data: ItemType[];
  itemType?: 'products' | 'vehicles' | 'services';
  loading?: boolean;
  viewMode?: ViewMode;
  onRefresh?: () => void;
  refreshing?: boolean;
}

const ProductList: FC<ProductListProps> = ({
  data,
  itemType = 'products',
  loading = false,
  viewMode = 'grid',
  onRefresh,
  refreshing = false,
}) => {
  const {colors} = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      height: '100%',
      backgroundColor: colors.backgroundSecondary,
    },
    content: {
      paddingVertical: 10,
      paddingBottom: 100,
    },
    listContent: {
      paddingBottom: 100,
    },
    skeletonContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingVertical: 10,
      paddingBottom: 100,
    },
  });

  const getItemType = (item: ItemType): 'products' | 'vehicles' | 'services' => {
    // If itemType is provided, use it
    if (itemType) {
      return itemType;
    }

    // Determine type from item properties
    const itemAny = item as any;
    
    // IDealerVehicle has vehicleModel and year as distinguishing properties
    if (itemAny.vehicleModel !== undefined && itemAny.year !== undefined) {
      return 'vehicles';
    }
    
    // IService has durationMinutes and homeService as distinguishing properties
    if (itemAny.durationMinutes !== undefined && itemAny.homeService !== undefined) {
      return 'services';
    }
    
    // Default to products
    return 'products';
  };

  const renderItem = ({item, index}: {item: ItemType; index: number}) => {
    const detectedType = getItemType(item);
    
    // For list view, use list components
    if (viewMode === 'list') {
      if (detectedType === 'products') {
        return <ProductListItem item={item as IProduct} />;
      }
      if (detectedType === 'vehicles') {
        return <VehicleListItem item={item as IDealerVehicle} />;
      }
      if (detectedType === 'services') {
        return <ServiceListItem item={item as IService} />;
      }
    }
    
    // Grid view for all types
    if (detectedType === 'vehicles') {
      return <VehicleItem item={item as IDealerVehicle} index={index} />;
    }
    if (detectedType === 'services') {
      return <ServiceItem item={item as IService} index={index} />;
    }
    return <ProductItem item={item as IProduct} index={index} />;
  };

  const renderSkeleton = ({index}: {index: number}) => {
    if (itemType === 'vehicles') {
      return <VehicleItemSkeleton index={index} />;
    }
    if (itemType === 'services') {
      return <ServiceItemSkeleton index={index} />;
    }
    return <ProductItemSkeleton index={index} />;
  };

  if (loading) {
    // Show 6 skeleton items
    const skeletonData = Array.from({length: 6}, (_, i) => ({id: `skeleton-${i}`, index: i}));
    return (
      <View style={styles.container}>
        <View style={styles.skeletonContainer}>
          {skeletonData.map((item, index) => (
            <React.Fragment key={item.id}>
              {renderSkeleton({index})}
            </React.Fragment>
          ))}
        </View>
      </View>
    );
  }

  return (
    <FlatList
      key={viewMode === 'list' ? 'list-view' : 'grid-view'}
      data={data}
      keyExtractor={item => item.id || (item as any)._id}
      renderItem={renderItem}
      style={styles.container}
      contentContainerStyle={viewMode === 'list' ? styles.listContent : styles.content}
      numColumns={viewMode === 'list' ? 1 : 2}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.secondary}
          />
        ) : undefined
      }
    />
  );
};

export default ProductList;
