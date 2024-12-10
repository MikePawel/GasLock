export const formatTimeUnits = (totalSeconds: number) => {
  const minutes = totalSeconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;
  const weeks = days / 7;
  const months = days / 30;
  const years = days / 365;

  return {
    minutes: minutes.toFixed(2),
    hours: hours.toFixed(2),
    days: days.toFixed(2),
    weeks: weeks.toFixed(2),
    months: months.toFixed(2),
    years: years.toFixed(2),
  };
};
