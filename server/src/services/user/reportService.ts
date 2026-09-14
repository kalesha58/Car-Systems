import { ContentReport, ReportTargetType } from '../../models/ContentReport';
import { AppError, ConflictError } from '../../utils/errorHandler';

const VALID_TARGET_TYPES: ReportTargetType[] = ['post', 'comment', 'message', 'user', 'review'];

interface ICreateReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  note?: string;
  targetOwnerId?: string;
}

export const createContentReport = async (reporterId: string, data: ICreateReportInput) => {
  if (!VALID_TARGET_TYPES.includes(data.targetType)) {
    throw new AppError('Invalid target type', 400);
  }

  const targetId = data.targetId?.trim();
  const reason = data.reason?.trim();
  const targetOwnerId = data.targetOwnerId?.trim();

  if (!targetId) {
    throw new AppError('Target id is required', 400);
  }
  if (!reason) {
    throw new AppError('Reason is required', 400);
  }

  if (data.targetType === 'user' && targetId === reporterId) {
    throw new AppError('You cannot report yourself', 400);
  }
  if (targetOwnerId && targetOwnerId === reporterId) {
    throw new AppError('You cannot report your own content', 400);
  }

  const existing = await ContentReport.findOne({
    reporterId,
    targetType: data.targetType,
    targetId,
    status: { $in: ['open', 'under_review'] },
  });

  if (existing) {
    throw new ConflictError('You have already reported this');
  }

  const report = await ContentReport.create({
    reporterId,
    targetType: data.targetType,
    targetId,
    reason,
    note: data.note?.trim(),
    targetOwnerId,
    status: 'open',
  });

  return report;
};
