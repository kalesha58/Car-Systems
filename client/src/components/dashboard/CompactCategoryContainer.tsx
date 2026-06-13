import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import React, { FC } from 'react';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { useTheme } from '@hooks/useTheme';
import { navigate } from '@utils/NavigationUtils';
import type { CategoryType, StoreCategoryTile } from '../../types/category/ICategoryItem';

const MONGO_OBJECT_ID = /^[a-f\d]{24}$/i;

interface CompactCategoryContainerProps {
  data: StoreCategoryTile[];
  categoryType?: CategoryType;
}

const CompactCategoryContainer: FC<CompactCategoryContainerProps> = ({
  data,
  categoryType = 'products',
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginVertical: 10,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 14,
    },
    text: {
      textAlign: 'center',
    },
    item: {
      width: '23%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageContainer: {
      width: '100%',
      height: 72,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 10,
      padding: 6,
      backgroundColor: colors.backgroundSecondary,
      marginBottom: 6,
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
  });


  const navigateForTile = (item: StoreCategoryTile) => {
    if (item.id && MONGO_OBJECT_ID.test(item.id)) {
      // Store tiles are Mongo product categories regardless of visual row (tileGroup)
      navigate('Category', {
        screen: 'ProductCategories',
        params: {
          initialCategoryId: item.id,
          initialCategoryType: 'products',
        },
      });
      return;
    }
    const categoryId = `all-${categoryType}`;
    navigate('Category', {
      screen: 'ProductCategories',
      params: {
        initialCategoryId: categoryId,
        initialCategoryType: categoryType,
      },
    });
  };

  const renderImage = (item: StoreCategoryTile) => {
    const src = item.image;
    if (src && typeof src === 'object' && 'uri' in src && src.uri) {
      return <Image source={src} style={styles.image} />;
    }
    const initial = item.name?.trim()?.charAt(0)?.toUpperCase() || '?';
    return (
      <CustomText
        variant="h4"
        fontFamily={Fonts.SemiBold}
        style={{ color: colors.textSecondary, opacity: 0.55 }}>
        {initial}
      </CustomText>
    );
  };

  const renderItems = (items: StoreCategoryTile[]) => {
    return (
      <>
        {items?.map((item, index) => {
          return (
            <TouchableOpacity
              key={`${item.id}-${index}`}
              style={styles.item}
              activeOpacity={0.7}
              onPress={() => navigateForTile(item)}>
              <View style={styles.imageContainer}>{renderImage(item)}</View>
              <CustomText style={styles.text} variant="h9" fontFamily={Fonts.Regular} numberOfLines={2}>
                {item?.name}
              </CustomText>
            </TouchableOpacity>
          );
        })}
      </>
    );
  };

  const renderRows = () => {
    const rows = [];
    for (let i = 0; i < data.length; i += 4) {
      rows.push(
        <View key={i} style={styles.row}>
          {renderItems(data.slice(i, i + 4))}
        </View>,
      );
    }
    return rows;
  };

  return <View style={styles.container}>{renderRows()}</View>;
};

export default CompactCategoryContainer;
