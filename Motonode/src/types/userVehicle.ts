export interface VehicleDocuments {
  rc?: string;
  insurance?: string;
  pollution?: string;
  dl?: string;
}

export interface UserVehicle {
  id: string;
  ownerId: string;
  brand: string;
  model: string;
  numberPlate: string;
  documents?: VehicleDocuments;
  primaryDriverId?: string;
  year?: number;
  color?: string;
  images: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVehicleRequest {
  brand: string;
  model: string;
  numberPlate: string;
  documents?: VehicleDocuments;
  primaryDriverId?: string;
  year?: number;
  color?: string;
  images: string[];
}

export interface UpdateVehicleRequest {
  brand?: string;
  model?: string;
  numberPlate?: string;
  documents?: VehicleDocuments;
  primaryDriverId?: string;
  year?: number;
  color?: string;
  images?: string[];
}

export interface UserVehicleResponse {
  success?: boolean;
  Response: UserVehicle;
}

export interface UserVehiclesResponse {
  success?: boolean;
  Response: UserVehicle[];
}
