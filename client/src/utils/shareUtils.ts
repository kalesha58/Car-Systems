import { Share, Platform } from 'react-native';
import { BASE_URL } from '../service/config';

export interface ShareOptions {
  title?: string;
  message: string;
  url?: string;
}

export const shareContent = async (options: ShareOptions): Promise<boolean> => {
  try {
    const { title, message, url } = options;
    const content = {
      title: title || 'motonode',
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

const getWebBaseUrl = (): string => {
  // Derive the HTTP web domain from the backend api base URL
  return BASE_URL.replace(/\/api$/, '').replace(/\/$/, '');
};

export const shareCategory = async (categoryName: string): Promise<boolean> => {
  return shareContent({
    title: `Check out ${categoryName} on motonode`,
    message: `Browse ${categoryName} products, vehicles, and services on motonode!`,
    url: `${getWebBaseUrl()}/category/${encodeURIComponent(categoryName)}`,
  });
};

export const shareProduct = async (
  productName: string,
  productId: string,
): Promise<boolean> => {
  return shareContent({
    title: `Check out ${productName} on motonode`,
    message: `View ${productName} on motonode!`,
    url: `${getWebBaseUrl()}/product/${productId}`,
  });
};

export const shareStore = async (
  businessName: string,
  dealerId: string,
): Promise<boolean> => {
  return shareContent({
    title: `Visit ${businessName} on motonode`,
    message: `Check out ${businessName}'s store on motonode!`,
    url: getStoreShareUrl(dealerId),
  });
};

export const getStoreShareUrl = (dealerId: string): string => {
  return `${getWebBaseUrl()}/store/${dealerId}`;
};

