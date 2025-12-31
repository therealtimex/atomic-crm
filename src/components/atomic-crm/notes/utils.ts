// Server-based UTC timestamp (single source of truth)
// DateTimeInput will handle local time display conversion automatically
export const getCurrentDate = () => {
  return new Date().toISOString();
};

export const formatNoteDate = (dateString: string) => {
  const date = new Date(dateString);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date.toISOString();
};
