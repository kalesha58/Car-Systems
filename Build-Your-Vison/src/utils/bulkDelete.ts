export interface IBulkDeleteResult {
  succeeded: number;
  failed: number;
}

/**
 * Delete multiple records by calling the single-delete API for each id.
 * Uses allSettled so one failure does not block the rest.
 */
export const bulkDeleteByIds = async (
  ids: string[],
  deleteFn: (id: string) => Promise<unknown>,
): Promise<IBulkDeleteResult> => {
  if (ids.length === 0) {
    return { succeeded: 0, failed: 0 };
  }

  const results = await Promise.allSettled(ids.map((id) => deleteFn(id)));

  return {
    succeeded: results.filter((result) => result.status === 'fulfilled').length,
    failed: results.filter((result) => result.status === 'rejected').length,
  };
};
