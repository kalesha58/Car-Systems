import { Skeleton } from './Skeleton';

interface ISkeletonTableProps {
  rows?: number;
  columns?: number;
}

export const SkeletonTable: React.FC<ISkeletonTableProps> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div
        className="bg-gray-50 dark:bg-slate-900 p-4 border-b-2 border-gray-200 dark:border-gray-700 grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height="20px" borderRadius="0.25rem" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="p-4 border-b border-gray-200 dark:border-gray-700 grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height="16px" borderRadius="0.25rem" />
          ))}
        </div>
      ))}
    </div>
  );
};
