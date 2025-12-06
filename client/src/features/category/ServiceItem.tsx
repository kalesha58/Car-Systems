import {View, StyleSheet, Image} from 'react-native';
import React, {FC} from 'react';
import {screenHeight} from '@utils/Scaling';
import {Colors, Fonts} from '@utils/Constants';
import CustomText from '@components/ui/CustomText';
import {RFValue} from 'react-native-responsive-fontsize';
import {IService} from '@types/service/IService';

interface ServiceItemProps {
  item: IService;
  index: number;
}

const ServiceItem: FC<ServiceItemProps> = ({index, item}) => {
  const isSecondColumn = index % 2 !== 0;
  const imageUrl = item.images && item.images.length > 0 ? item.images[0] : '';

  return (
    <View style={[styles.container, {marginRight: isSecondColumn ? 10 : 0}]}>
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image source={{uri: imageUrl}} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage} />
        )}
      </View>

      <View style={styles.content}>
        {item.dealer && (
          <View style={styles.dealerBadge}>
            <CustomText fontSize={RFValue(6)} fontFamily={Fonts.Medium}>
              {item.dealer.businessName}
            </CustomText>
          </View>
        )}

        <CustomText
          fontFamily={Fonts.Medium}
          variant="h8"
          numberOfLines={2}
          style={{marginVertical: 4}}>
          {item.name}
        </CustomText>

        <View style={styles.detailsRow}>
          <CustomText fontSize={RFValue(6)} fontFamily={Fonts.Regular}>
            {item.durationMinutes} mins
          </CustomText>
          {item.homeService && (
            <View style={styles.homeServiceBadge}>
              <CustomText fontSize={RFValue(6)} fontFamily={Fonts.Medium}>
                Home Service
              </CustomText>
            </View>
          )}
        </View>

        <View style={styles.priceContainer}>
          <View>
            <CustomText variant="h8" fontFamily={Fonts.Medium}>
              ₹{item.price?.toLocaleString()}
            </CustomText>
            {item.dealer?.address && (
              <CustomText
                fontSize={RFValue(6)}
                fontFamily={Fonts.Regular}
                style={{opacity: 0.7, marginTop: 2}}>
                {item.dealer.address}
              </CustomText>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '45%',
    borderRadius: 10,
    backgroundColor: '#fff',
    marginBottom: 10,
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  imageContainer: {
    height: screenHeight * 0.12,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.backgroundSecondary,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: 'hidden',
  },
  image: {
    height: '100%',
    width: '100%',
    aspectRatio: 1 / 1,
    resizeMode: 'contain',
  },
  placeholderImage: {
    height: '100%',
    width: '100%',
    backgroundColor: Colors.backgroundSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  dealerBadge: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 4,
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  homeServiceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginTop: 'auto',
  },
});

export default ServiceItem;

