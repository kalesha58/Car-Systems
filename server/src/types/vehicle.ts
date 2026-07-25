export interface IVehicleDocuments {
  rc?: string;
  insurance?: string;
  pollution?: string;
  dl?: string;
}

export interface IVehicle {
  id: string;
  ownerId: string;
  brand: string;
  model: string;
  numberPlate: string;
  documents: IVehicleDocuments;
  primaryDriverId?: string;
  year?: number;
  color?: string;
  images: string[];
  isOwnVehicle?: boolean;
  relation?: string;
  ownerName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICreateVehicleRequest {
  brand: string;
  model: string;
  numberPlate: string;
  documents?: IVehicleDocuments;
  primaryDriverId?: string;
  year?: number;
  color?: string;
  images: string[];
  isOwnVehicle?: boolean;
  relation?: string;
  ownerName?: string;
}

export interface IUpdateVehicleRequest {
  brand?: string;
  model?: string;
  numberPlate?: string;
  documents?: IVehicleDocuments;
  primaryDriverId?: string;
  year?: number;
  color?: string;
  images?: string[];
  isOwnVehicle?: boolean;
  relation?: string;
  ownerName?: string;
}

export interface IVehicleResponse {
  Response: IVehicle;
}

export interface IVehiclesResponse {
  Response: IVehicle[];
}


