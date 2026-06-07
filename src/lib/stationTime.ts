export const STATION_TIME_ZONE = "America/Denver";
export const STATION_TIME_LABEL = "Mountain Time";

const stationParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: STATION_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
};

export const stationDateInput = (date: Date) => {
  const parts = stationParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
};

export const stationDateTimeInput = (value?: string) => {
  if (!value) return "";
  const parts = stationParts(new Date(value));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};

export const stationInputToIso = (value: string) => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return value;

  const [, year, month, day, hour, minute] = match.map(Number);
  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute);
  let timestamp = desiredUtc;

  for (let index = 0; index < 2; index += 1) {
    const parts = stationParts(new Date(timestamp));
    const representedUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    timestamp += desiredUtc - representedUtc;
  }

  return new Date(timestamp).toISOString();
};

export const formatStationDateTime = (value?: string, includeDate = true) => {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: STATION_TIME_ZONE,
    ...(includeDate ? { month: "short", day: "numeric", year: "numeric" } : {}),
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(value));
};

export const stationMinutesIntoDay = (value: string) => {
  const parts = stationParts(new Date(value));
  return Number(parts.hour) * 60 + Number(parts.minute);
};
