import apiClient from './apiClient';

export type ModerationStatus = 'open' | 'under_review' | 'actioned' | 'dismissed';

export interface IModerationReport {
  _id: string;
  reporterId: string;
  targetType: 'post' | 'comment' | 'message' | 'user';
  targetId: string;
  targetOwnerId?: string;
  reason: string;
  note?: string;
  status: ModerationStatus;
  reviewNote?: string;
  actionTaken?: string;
  createdAt: string;
  updatedAt: string;
}

export const getModerationReports = async (status?: ModerationStatus): Promise<IModerationReport[]> => {
  const response = await apiClient.get('/admin/moderation/reports', {
    params: status ? { status } : undefined,
  });
  return response.data.reports || [];
};

export const updateModerationReport = async (
  id: string,
  payload: {
    status: ModerationStatus;
    reviewNote?: string;
    actionTaken?: string;
  },
): Promise<IModerationReport> => {
  const response = await apiClient.patch(`/admin/moderation/reports/${id}`, payload);
  return response.data.report;
};
