export interface IUploadImageInput {
  uri: string;
  fileName?: string;
  type?: string;
}

export interface IUploadImageResult {
  url: string;
  publicId: string;
}

export interface IUploadImagesResponse {
  success: boolean;
  Response: IUploadImageResult[];
}
