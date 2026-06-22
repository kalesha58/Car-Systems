const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Current calendar date YYYY-MM-DD in Asia/Kolkata */
export const getISTDateString = (date: Date = new Date()): string => {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Minutes since midnight in IST */
export const getISTMinutesNow = (): number => {
  const ist = new Date(Date.now() + IST_OFFSET_MS);
  return ist.getUTCHours() * 60 + ist.getUTCMinutes();
};

export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/** True when the slot's end time has passed for the given date (IST). */
export const isSlotEndTimePassed = (dateStr: string, endTime: string): boolean => {
  const todayIST = getISTDateString();
  if (dateStr < todayIST) {
    return true;
  }
  if (dateStr > todayIST) {
    return false;
  }
  return getISTMinutesNow() >= timeToMinutes(endTime);
};
