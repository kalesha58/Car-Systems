export interface UploadImageInput {
  uri: string;
  fileName?: string;
  type?: string;
}

export interface UploadImageResult {
  url: string;
  publicId?: string;
}

export interface UploadImagesResponse {
  success?: boolean;
  Response: UploadImageResult[];
}
