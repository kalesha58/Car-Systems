import { Modal } from '@components/Modal/Modal';
import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';

interface IBusinessRegistrationViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    id: string;
    businessName: string;
    type: string;
    address: string;
    phone: string;
    gst: string;
    status?: string;
    userId: string;
    createdAt?: string;
    updatedAt?: string;
  } | null;
}

export const BusinessRegistrationViewModal: React.FC<IBusinessRegistrationViewModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  if (!data) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Business Registration Details" size="md">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Header with Icon */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary-500/10 to-secondary-500/10">
            <Building2 size={24} className="text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h3 className="m-0 text-lg font-bold text-slate-900 dark:text-white">
              {data.businessName}
            </h3>
            <p className="m-0 mt-1 text-sm text-slate-500 dark:text-slate-400">
              Business Registration Information
            </p>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Business Name
            </label>
            <p className="text-sm font-medium text-slate-900 dark:text-white m-0">
              {data.businessName}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Business Type
            </label>
            <p className="text-sm font-medium text-slate-900 dark:text-white m-0">
              {data.type}
            </p>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Address
            </label>
            <p className="text-sm font-medium text-slate-900 dark:text-white m-0">
              {data.address}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Phone Number
            </label>
            <p className="text-sm font-medium text-slate-900 dark:text-white m-0">
              {data.phone}
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              GST Number
            </label>
            <p className="text-sm font-medium text-slate-900 dark:text-white m-0">
              {data.gst}
            </p>
          </div>

          {data.status && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Status
              </label>
              <p className="text-sm font-medium text-slate-900 dark:text-white m-0">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    data.status === 'approved'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : data.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {data.status.charAt(0).toUpperCase() + data.status.slice(1)}
                </span>
              </p>
            </div>
          )}

          {data.createdAt && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Created At
              </label>
              <p className="text-sm font-medium text-slate-900 dark:text-white m-0">
                {formatDate(data.createdAt)}
              </p>
            </div>
          )}

          {data.updatedAt && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Last Updated
              </label>
              <p className="text-sm font-medium text-slate-900 dark:text-white m-0">
                {formatDate(data.updatedAt)}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </Modal>
  );
};




