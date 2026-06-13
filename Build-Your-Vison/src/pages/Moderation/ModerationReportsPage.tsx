import { useEffect, useState } from 'react';
import { getModerationReports, IModerationReport, ModerationStatus, updateModerationReport } from '@services/moderationService';

const STATUSES: ModerationStatus[] = ['open', 'under_review', 'actioned', 'dismissed'];

export const ModerationReportsPage = () => {
  const [reports, setReports] = useState<IModerationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ModerationStatus | ''>('');

  const [error, setError] = useState<string | null>(null);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getModerationReports(statusFilter || undefined);
      setReports(data);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ||
        (err as Error)?.message ||
        'Failed to load moderation reports.';
      setError(message);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReports();
  }, [statusFilter]);

  const handleStatusChange = async (id: string, status: ModerationStatus) => {
    await updateModerationReport(id, { status, actionTaken: `Set to ${status}` });
    await loadReports();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Moderation Reports</h1>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as ModerationStatus | '')}
          className="border rounded px-3 py-2"
        >
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {error ? (
        <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-gray-500">Loading reports...</div>
      ) : (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Reason</th>
                <th className="px-3 py-2 text-left">Target</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report._id} className="border-t">
                  <td className="px-3 py-2">{report.targetType}</td>
                  <td className="px-3 py-2">{report.reason}</td>
                  <td className="px-3 py-2">{report.targetId}</td>
                  <td className="px-3 py-2">
                    <select
                      value={report.status}
                      onChange={(event) => handleStatusChange(report._id, event.target.value as ModerationStatus)}
                      className="border rounded px-2 py-1"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">{new Date(report.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-gray-500" colSpan={5}>No moderation reports found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ModerationReportsPage;
