import { Skeleton } from './Skeleton';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <Skeleton width="60%" height="24px" borderRadius="0.5rem" />
      <div className="mt-4">
        <Skeleton width="100%" height="32px" borderRadius="0.5rem" />
      </div>
      <div className="mt-2">
        <Skeleton width="80%" height="20px" borderRadius="0.5rem" />
      </div>
    </div>
  );
};
