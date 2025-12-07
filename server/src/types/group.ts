import { GroupType, GroupPrivacy } from '../models/Group';
import { MemberRole, MemberStatus } from '../models/GroupMember';

export interface IVanDetails {
  vanNumber: string;
  license: string;
  vehicleType: string;
}

export interface ITripPlan {
  plan: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
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
  chatEnabled?: boolean;
  liveLocationEnabled?: boolean;
}

export interface IUpdateGroupRequest {
  name?: string;
  description?: string;
  theme?: string;
  privacy?: GroupPrivacy;
  tripPlan?: ITripPlan;
  vanDetails?: IVanDetails;
  chatEnabled?: boolean;
  liveLocationEnabled?: boolean;
}

export interface IGroupResponse {
  Response: IGroup;
}

export interface IGroupsResponse {
  Response: IGroup[];
}

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

export interface IGroupMembersResponse {
  Response: IGroupMember[];
}

export interface IJoinGroupRequest {
  joinCode?: string;
}

export interface IAttendanceRequest {
  isComing: boolean;
}

export interface IDriverConsentRequest {
  consent: boolean;
}


