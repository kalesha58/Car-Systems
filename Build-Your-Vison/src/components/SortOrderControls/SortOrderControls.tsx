import { Button } from '@components/Button/Button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ISortOrderControlsProps {
  index: number;
  total: number;
  disabled?: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export const SortOrderControls = ({
  index,
  total,
  disabled = false,
  onMoveUp,
  onMoveDown,
}: ISortOrderControlsProps) => {
  const isFirst = index === 0;
  const isLast = index === total - 1;

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <span title="Move up">
        <Button
          variant="secondary"
          size="sm"
          onClick={onMoveUp}
          disabled={disabled || isFirst}
        >
          <ChevronUp size={14} />
        </Button>
      </span>
      <span title="Move down">
        <Button
          variant="secondary"
          size="sm"
          onClick={onMoveDown}
          disabled={disabled || isLast}
        >
          <ChevronDown size={14} />
        </Button>
      </span>
    </div>
  );
};
