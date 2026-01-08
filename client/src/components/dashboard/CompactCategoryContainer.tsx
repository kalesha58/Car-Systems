import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import React, { FC } from 'react';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { useTheme } from '@hooks/useTheme';
import { navigate } from '@utils/NavigationUtils';
import type { CategoryType } from '../../types/category/ICategoryItem';

interface CompactCategoryContainerProps {
  data: any[];
  categoryType?: CategoryType;
}

const CompactCategoryContainer: FC<CompactCategoryContainerProps> = ({ data, categoryType = 'products' }) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginVertical: 10,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    text: {
      textAlign: 'center',
    },
    item: {
      width: '22%',
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageContainer: {
      width: '100%',
      height: 52,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
      padding: 4,
      backgroundColor: colors.backgroundSecondary,
      marginBottom: 6,
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'contain',
    },
  });

  const renderItems = (items: any[]) => {
    return (
      <>
        {items?.map((item, index) => {
          return (
            <TouchableOpacity
              key={index}
              style={styles.item}
              activeOpacity={0.7}
              onPress={() => {
                // Navigate to ProductCategories with the appropriate category type
                // Don't include dealerId to show all products
                const categoryId = `all-${categoryType}`;
                navigate('Category', {
                  screen: 'ProductCategories',
                  params: {
                    initialCategoryId: categoryId,
                    initialCategoryType: categoryType,
                    // Explicitly omit dealerId to show all products
                  },
                });
              }}>
              <View style={styles.imageContainer}>
                <Image source={item?.image} style={styles.image} />
              </View>
              <CustomText
                style={styles.text}
                variant="h9"
                fontFamily={Fonts.Regular}
                numberOfLines={2}>
                {item?.name}
              </CustomText>
            </TouchableOpacity>
          );
        })}
      </>
    );
  };

  // Render items in rows of 4
  const renderRows = () => {
    const rows = [];
    for (let i = 0; i < data.length; i += 4) {
      rows.push(
        <View key={i} style={styles.row}>
          {renderItems(data.slice(i, i + 4))}
        </View>
      );
    }
    return rows;
  };

  return <View style={styles.container}>{renderRows()}</View>;
};

export default CompactCategoryContainer;
