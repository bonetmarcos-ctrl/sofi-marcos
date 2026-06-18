export const toISODate = (value) => {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
};

export const todayISO = () => toISODate(new Date());

export const daysBetween = (start, end) =>
  Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000));

export const dateRange = (start, end) => {
  const result = [];
  const cursor = new Date(`${start}T12:00:00`);
  const finish = new Date(`${end}T12:00:00`);

  while (cursor <= finish) {
    result.push(toISODate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
};

export const addMonths = (yearMonth, months) => {
  const [year, month] = yearMonth.split("-").map(Number);
  const date = new Date(year, month - 1 + months, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};