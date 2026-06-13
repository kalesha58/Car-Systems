export type SortDirection = 'up' | 'down';

/**
 * Move an item up or down in a sorted list and persist new sortOrder values (1-based).
 */
export const moveSortableItem = async <T extends { id: string }>(
  items: T[],
  index: number,
  direction: SortDirection,
  updateSortOrder: (id: string, sortOrder: number) => Promise<unknown>,
): Promise<void> => {
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= items.length) {
    return;
  }

  const reordered = [...items];
  [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

  await Promise.all(reordered.map((item, idx) => updateSortOrder(item.id, idx + 1)));
};

export const sortBySortOrderThenName = <T extends { sortOrder: number; name: string }>(
  items: T[],
): T[] => [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
