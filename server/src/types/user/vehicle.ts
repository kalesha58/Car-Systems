import { IDealerVehicle, IGetDealerVehiclesRequest } from '../dealer/vehicle';

export interface IDealerInfo {
  id: string;
  businessName: string;
  type: string;
  address: string;
  phone: string;
  gst?: string;
}

export interface IDealerVehicleWithDealer extends IDealerVehicle {
  dealer: IDealerInfo;
}

export interface IGetUserDealerVehiclesRequest extends IGetDealerVehiclesRequest {
  // Extends the base request, can add user-specific filters if needed
}

