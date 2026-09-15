const dayMonth = new Intl.DateTimeFormat("es-UY", { day: "numeric", month: "short", timeZone: "UTC" });

/** "16 ago – 14 sep" a partir de dos días calendario `YYYY-MM-DD`. */
export function formatDayRange(fromDate: string, toDate: string) {
  const format = (date: string) => dayMonth.format(new Date(`${date}T00:00:00Z`)).replace(".", "");
  return `${format(fromDate)} – ${format(toDate)}`;
}
