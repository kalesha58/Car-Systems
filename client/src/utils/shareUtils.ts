import {Share, Platform} from 'react-native';

export interface ShareOptions {
  title?: string;
  message: string;
  url?: string;
}

export const shareContent = async (options: ShareOptions): Promise<boolean> => {
  try {
    const {title, message, url} = options;
    const content = {
      title: title || 'Car Connect',
      message: url ? `${message}\n${url}` : message,
    };

    if (Platform.OS === 'android') {
      await Share.share(content);
    } else {
      await Share.share(content, {
        subject: title,
      });
    }
    return true;
  } catch (error) {
    console.error('Error sharing:', error);
    return false;
  }
};

export const shareCategory = async (categoryName: string): Promise<boolean> => {
  return shareContent({
    title: `Check out ${categoryName} on Car Connect`,
    message: `Browse ${categoryName} products, vehicles, and services on Car Connect!`,
    url: `carconnect://category/${categoryName}`,
  });
};

export const shareProduct = async (
  productName: string,
  productId: string,
): Promise<boolean> => {
  return shareContent({
    title: `Check out ${productName} on Car Connect`,
    message: `View ${productName} on Car Connect!`,
    url: `carconnect://product/${productId}`,
  });
};

