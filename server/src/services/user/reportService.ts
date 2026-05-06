import { ContentReport, ReportTargetType } from '../../models/ContentReport';
import { AppError } from '../../utils/errorHandler';

interface ICreateReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  note?: string;
  targetOwnerId?: string;
}

export const createContentReport = async (reporterId: string, data: ICreateReportInput) => {
  if (!data.targetId?.trim()) {
    throw new AppError('Target id is required', 400);
  }
  if (!data.reason?.trim()) {
    throw new AppError('Reason is required', 400);
  }

  const report = await ContentReport.create({
    reporterId,
    targetType: data.targetType,
    targetId: data.targetId.trim(),
    reason: data.reason.trim(),
    note: data.note?.trim(),
    targetOwnerId: data.targetOwnerId?.trim(),
    status: 'open',
  });

  return report;
};
