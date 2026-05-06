import { ContentReport, ReportStatus } from '../../models/ContentReport';
import { NotFoundError } from '../../utils/errorHandler';

export const listModerationReports = async (status?: ReportStatus) => {
  const query = status ? { status } : {};
  return ContentReport.find(query).sort({ createdAt: -1 }).lean();
};

export const updateModerationReport = async (
  reportId: string,
  reviewerId: string,
  data: { status: ReportStatus; reviewNote?: string; actionTaken?: string },
) => {
  const report = await ContentReport.findById(reportId);
  if (!report) {
    throw new NotFoundError('Report not found');
  }

  report.status = data.status;
  report.reviewNote = data.reviewNote?.trim();
  report.actionTaken = data.actionTaken?.trim();
  report.reviewedBy = reviewerId;
  report.reviewedAt = new Date();
  await report.save();
  return report;
};
