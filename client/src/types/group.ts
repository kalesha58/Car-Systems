export type GroupType = 'bikeCarDrive' | 'vanTransportation';
export type GroupPrivacy = 'public' | 'private';

export interface ILocationPoint {
  address: string;
  latitude: number;
  longitude: number;
}

export interface ITripPlan {
  plan: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  startingPoint?: ILocationPoint;
  endingPoint?: ILocationPoint;
}

export interface IVanDetails {
  vanNumber: string;
  license: string;
  vehicleType: string;
}

export interface IGroup {
  id: string;
  name: string;
  description?: string;
  theme?: string;
  type: GroupType;
  ownerId: string;
  privacy: GroupPrivacy;
  joinCode?: string;
  tripPlan?: ITripPlan;
  vanDetails?: IVanDetails;
  groupImage?: string;
  chatEnabled: boolean;
  liveLocationEnabled: boolean;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateGroupRequest {
  name: string;
  description?: string;
  theme?: string;
  type: GroupType;
  privacy?: GroupPrivacy;
  tripPlan?: ITripPlan;
  vanDetails?: IVanDetails;
  groupImage?: string;
  chatEnabled?: boolean;
  liveLocationEnabled?: boolean;
}

export type MemberRole = 'admin' | 'member';
export type MemberStatus = 'active' | 'inactive';

export interface IGroupMember {
  id: string;
  groupId: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: string;
  createdAt: string;
}
