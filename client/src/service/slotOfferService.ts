import { appAxios } from './apiInterceptors';

export interface ISlotOffer {
  id: string;
  slotId: string;
  serviceId: string;
  targetBookingId: string;
  slotDate: string;
  slotStartTime: string;
  status: string;
}

export const acceptSlotOffer = async (offerId: string): Promise<ISlotOffer> => {
  const response = await appAxios.post<{
    success: boolean;
    Response: { offer: ISlotOffer };
  }>(`/user/slot-offers/${offerId}/accept`);
  return response.data.Response.offer;
};

export const declineSlotOffer = async (offerId: string): Promise<ISlotOffer> => {
  const response = await appAxios.post<{
    success: boolean;
    Response: { offer: ISlotOffer };
  }>(`/user/slot-offers/${offerId}/decline`);
  return response.data.Response.offer;
};
