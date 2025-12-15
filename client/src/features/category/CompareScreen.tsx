import React, {FC} from 'react';
import {View, StyleSheet, ScrollView, TouchableOpacity, Image, Alert} from 'react-native';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import Icon from 'react-native-vector-icons/Ionicons';
import {RFValue} from 'react-native-responsive-fontsize';
import {Fonts, Colors} from '@utils/Constants';
import {useTheme} from '@hooks/useTheme';
import {useCompareStore} from '@state/compareStore';
import {screenWidth} from '@utils/Scaling';
import {navigate} from '@utils/NavigationUtils';
import {useToast} from '@hooks/useToast';

const CompareScreen: FC = () => {
  const {colors} = useTheme();
  const {showSuccess} = useToast();
  const {items, removeItem, clearCompare} = useCompareStore();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 100,
    },
    emptyIcon: {
      marginBottom: 20,
      opacity: 0.5,
    },
    itemCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    itemHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    itemImage: {
      width: 80,
      height: 80,
      borderRadius: 8,
      marginRight: 12,
      backgroundColor: colors.backgroundSecondary,
    },
    itemInfo: {
      flex: 1,
    },
    itemName: {
      fontSize: RFValue(16),
      marginBottom: 4,
    },
    itemPrice: {
      fontSize: RFValue(18),
      marginTop: 4,
    },
    removeButton: {
      padding: 4,
    },
    comparisonTable: {
      marginTop: 20,
    },
    tableHeader: {
      flexDirection: 'row',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tableRow: {
      flexDirection: 'row',
      paddingVertical: 12,
      borderBottomWidth: 0.5,
      borderBottomColor: colors.border,
    },
    tableCell: {
      flex: 1,
      paddingHorizontal: 8,
    },
    headerText: {
      fontSize: RFValue(12),
      fontFamily: Fonts.SemiBold,
    },
    cellText: {
      fontSize: RFValue(11),
    },
    clearButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 20,
    },
  });

  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <CustomHeader title="Compare Items" />
        <View style={styles.emptyContainer}>
          <Icon
            name="git-compare-outline"
            size={RFValue(64)}
            color={colors.disabled}
            style={styles.emptyIcon}
          />
          <CustomText
            variant="h5"
            fontFamily={Fonts.SemiBold}
            style={{color: colors.text, marginBottom: 8}}>
            No items to compare
          </CustomText>
          <CustomText
            variant="h6"
            fontFamily={Fonts.Regular}
            style={{color: colors.disabled, textAlign: 'center', paddingHorizontal: 40}}>
            Add items to compare from the categories screen
          </CustomText>
        </View>
      </View>
    );
  }

  const getComparisonFields = () => {
    const fields: string[] = [];
    items.forEach(item => {
      if (item.type === 'product') {
        fields.push('Price', 'Category', 'Brand');
      } else if (item.type === 'vehicle') {
        fields.push('Price', 'Year', 'Fuel Type', 'Transmission');
      } else if (item.type === 'service') {
        fields.push('Price', 'Duration', 'Home Service');
      }
    });
    return Array.from(new Set(fields));
  };

  return (
    <View style={styles.container}>
      <CustomHeader title={`Compare (${items.length})`} />
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {items.map((item, index) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              {item.image && (
                <Image source={{uri: item.image}} style={styles.itemImage} />
              )}
              <View style={styles.itemInfo}>
                <CustomText
                  variant="h5"
                  fontFamily={Fonts.SemiBold}
                  style={styles.itemName}>
                  {item.name}
                </CustomText>
                <CustomText
                  variant="h6"
                  fontFamily={Fonts.Bold}
                  style={[styles.itemPrice, {color: Colors.secondary}]}>
                  ₹{item.price.toLocaleString()}
                </CustomText>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => {
                  removeItem(item.id);
                  showSuccess('Removed from compare');
                }}
                activeOpacity={0.7}>
                <Icon name="close-circle" color="#ff3040" size={RFValue(24)} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => {
                try {
                  navigate('ProductDetail', {productId: item.id});
                } catch {
                  Alert.alert('Details', `${item.type} detail screen coming soon`);
                }
              }}
              activeOpacity={0.7}
              style={{
                marginTop: 12,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: Colors.secondary,
                alignItems: 'center',
              }}>
              <CustomText
                fontSize={RFValue(12)}
                fontFamily={Fonts.SemiBold}
                style={{color: '#fff'}}>
                View Details
              </CustomText>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => {
            clearCompare();
            showSuccess('Compare list cleared');
          }}
          activeOpacity={0.7}>
          <Icon name="trash-outline" color={colors.text} size={RFValue(18)} />
          <CustomText
            variant="h6"
            fontFamily={Fonts.Medium}
            style={{color: colors.text, marginLeft: 8}}>
            Clear All
          </CustomText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default CompareScreen;

