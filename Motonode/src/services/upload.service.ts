import { Platform } from 'react-native';

import type { UploadImageInput, UploadImagesResponse } from '../types/upload';

import { postMultipart } from './multipartUpload';

interface PreparedLocalImage {
  processedUri: string;
  mimeType: string;
  fileName: string;
}

function prepareLocalImageUploadParts(
  imageUri: string,
  options?: { fileNamePrefix?: string; fileName?: string; mimeType?: string },
): PreparedLocalImage {
  if (imageUri.startsWith('data:image/')) {
    throw new Error(
      'Base64 image format is not supported. Please select the image again from your gallery.',
    );
  }

  let processedUri = imageUri;
  let fileExtension = 'jpg';
  const isContentUri = imageUri.startsWith('content://');
  const isFileUri = imageUri.startsWith('file://');

  if (Platform.OS === 'ios') {
    if (!imageUri.startsWith('file://') && imageUri.startsWith('/')) {
      processedUri = `file://${imageUri}`;
    }
    const uriParts = imageUri.split('.');
    if (uriParts.length > 1) {
      fileExtension = uriParts.pop()?.split('?')[0] || 'jpg';
    }
  } else if (Platform.OS === 'android') {
    if (isContentUri) {
      processedUri = imageUri;
      fileExtension = 'jpg';
    } else if (isFileUri) {
      processedUri = imageUri;
      const uriParts = imageUri.split('.');
      if (uriParts.length > 1) {
        const ext = uriParts.pop()?.split('?')[0];
        if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext.toLowerCase())) {
          fileExtension = ext.toLowerCase();
        }
      }
    } else if (imageUri.startsWith('/')) {
      processedUri = `file://${imageUri}`;
    }
  }

  const mimeType =
    options?.mimeType ??
    (fileExtension === 'png'
      ? 'image/png'
      : fileExtension === 'jpeg' || fileExtension === 'jpg'
        ? 'image/jpeg'
        : fileExtension === 'gif'
          ? 'image/gif'
          : fileExtension === 'webp'
            ? 'image/webp'
            : 'image/jpeg');

  const prefix = options?.fileNamePrefix ?? 'image';
  const fileName =
    options?.fileName ??
    `${prefix}_${Date.now()}.${fileExtension === 'jpeg' ? 'jpg' : fileExtension}`;

  return { processedUri, mimeType, fileName };
}

function isUploadNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }
  const err = error as { response?: unknown; code?: string; message?: string };
  if (err.response) {
    return false;
  }
  return (
    err.code === 'NETWORK_ERROR' ||
    err.code === 'ERR_NETWORK' ||
    err.code === 'ECONNABORTED' ||
    err.message?.includes('Network Error') === true ||
    err.message?.includes('timeout') === true
  );
}

export async function uploadImage(imageUri: string): Promise<string> {
  const { processedUri, mimeType, fileName } = prepareLocalImageUploadParts(imageUri, {
    fileNamePrefix: 'post',
  });

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('image', {
      uri: processedUri,
      type: mimeType,
      name: fileName,
    } as unknown as Blob);
    return fd;
  };

  const response = await postMultipart<{
    success?: boolean;
    Response?: { url: string; ReturnMessage?: string };
    message?: string;
    error?: string;
  }>('/upload/image', buildFormData, { timeoutMs: 60000 });

  if (response?.success && response.Response?.url) {
    return response.Response.url;
  }

  throw new Error(
    response?.Response?.ReturnMessage ??
      response?.message ??
      response?.error ??
      'Failed to upload image',
  );
}

export async function uploadImagesBatch(images: UploadImageInput[]): Promise<string[]> {
  if (images.length === 0) {
    return [];
  }

  const remoteUrls: string[] = [];
  const localImages: UploadImageInput[] = [];

  for (const img of images) {
    if (img.uri.startsWith('http://') || img.uri.startsWith('https://')) {
      remoteUrls.push(img.uri);
    } else {
      localImages.push(img);
    }
  }

  if (localImages.length === 0) {
    return remoteUrls;
  }

  const uploadSequentially = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const img of localImages) {
      urls.push(await uploadImage(img.uri));
    }
    return urls;
  };

  const buildBatchFormData = () => {
    const fd = new FormData();
    localImages.forEach((img, index) => {
      const { processedUri, mimeType, fileName } = prepareLocalImageUploadParts(img.uri, {
        fileNamePrefix: 'post',
        fileName: img.fileName,
        mimeType: img.type,
      });
      fd.append('images', {
        uri: processedUri,
        name: fileName || `post_${Date.now()}_${index}.jpg`,
        type: mimeType,
      } as unknown as Blob);
    });
    return fd;
  };

  let uploadedUrls: string[];
  try {
    const response = await postMultipart<UploadImagesResponse>(
      '/upload/images',
      buildBatchFormData,
      { timeoutMs: 60000 },
    );

    if (!response?.success || !Array.isArray(response.Response)) {
      const msg =
        response?.Response &&
        typeof response.Response === 'object' &&
        'ReturnMessage' in response.Response
          ? (response.Response as { ReturnMessage?: string }).ReturnMessage
          : 'Failed to upload images';
      throw new Error(msg ?? 'Failed to upload images');
    }

    uploadedUrls = response.Response.map((r) => r.url);
  } catch (batchError: unknown) {
    const status =
      batchError && typeof batchError === 'object' && 'response' in batchError
        ? (batchError as { response?: { status?: number } }).response?.status
        : undefined;
    if (status === 404 || isUploadNetworkError(batchError)) {
      uploadedUrls = await uploadSequentially();
    } else {
      throw batchError;
    }
  }

  if (remoteUrls.length === 0) {
    return uploadedUrls;
  }

  const result: string[] = [];
  let remoteIdx = 0;
  let uploadedIdx = 0;
  for (const img of images) {
    if (img.uri.startsWith('http://') || img.uri.startsWith('https://')) {
      result.push(remoteUrls[remoteIdx++]);
    } else {
      result.push(uploadedUrls[uploadedIdx++]);
    }
  }
  return result;
}
