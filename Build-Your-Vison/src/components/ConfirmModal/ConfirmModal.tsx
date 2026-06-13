import { Modal } from '@components/Modal/Modal';
import React, { ReactNode } from 'react';

interface IConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  disabled?: boolean;
}

export const ConfirmModal: React.FC<IConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  disabled = false,
}) => {
  const handleConfirm = () => {
    if (disabled) return;
    onConfirm();
    onClose();
  };

  const getConfirmButtonClasses = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-500 hover:bg-red-600';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600';
      default:
        return 'bg-primary-500 hover:bg-primary-600';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div>
        {typeof message === 'string' ? (
          <p className="mb-6 text-gray-600 dark:text-gray-400">
            {message}
          </p>
        ) : (
          <div className="mb-6">{message}</div>
        )}
        <div className="flex gap-4 justify-end">
          <button
            onClick={onClose}
            disabled={disabled}
            className="px-6 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={disabled}
            className={`px-6 py-2 ${getConfirmButtonClasses()} text-white border-none rounded-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
