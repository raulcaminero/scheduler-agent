/**
 * Availability calculator.
 * Given an organization's schedule config and existing confirmed appointments,
 * returns the next available workdays and time slots for a given date.
 */

export interface OrgSchedule {
  timezone: string;
  workDays: string;   // e.g. "Mon,Tue,Wed,Thu,Fri"
  startHour: string;  // e.g. "09:00"
  endHour: string;    // e.g. "18:00"
  slotBufferMin: number;
}

export interface ExistingAppointment {
  startTime: Date;
  endTime: Date;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DISPLAY_DAY_NAMES: Record<string, string> = {
  Mon: "Lun",
  Tue: "Mar",
  Wed: "Mié",
  Thu: "Jue",
  Fri: "Vie",
  Sat: "Sáb",
  Sun: "Dom",
};

const MONTH_NAMES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

function parseHour(hhmm: string): { h: number; m: number } {
  const [h, m] = hhmm.split(":").map(Number);
  return { h, m };
}

/** Returns true if the given JS Date falls on a configured workday */
function isWorkDay(date: Date, workDays: string): boolean {
  const dayName = DAY_NAMES[date.getDay()];
  return workDays.split(",").map((d) => d.trim()).includes(dayName);
}

/**
 * Returns the next N available workdays starting from tomorrow.
 * Returns an array of ISO date strings "YYYY-MM-DD".
 */
export function getAvailableDays(org: OrgSchedule, daysAhead = 5): string[] {
  const results: string[] = [];
  const now = new Date();
  const cursor = new Date(now);
  cursor.setDate(cursor.getDate() + 1); // start from tomorrow
  cursor.setHours(0, 0, 0, 0);

  let checked = 0;
  while (results.length < 3 && checked < 30) {
    if (isWorkDay(cursor, org.workDays)) {
      results.push(cursor.toISOString().split("T")[0]);
    }
    cursor.setDate(cursor.getDate() + 1);
    checked++;
  }

  return results;
}

/**
 * Returns all available time slot Date objects for a given date string ("YYYY-MM-DD"),
 * filtered against existing booked appointments.
 * @param durationMin - duration of the service being booked
 */
export function getAvailableSlots(
  org: OrgSchedule,
  existingAppointments: ExistingAppointment[],
  dateStr: string,
  durationMin: number
): Date[] {
  const { h: startH, m: startM } = parseHour(org.startHour);
  const { h: endH, m: endM } = parseHour(org.endHour);

  const [year, month, day] = dateStr.split("-").map(Number);

  // Build all candidate slots from startHour to endHour
  const slots: Date[] = [];
  const slotStep = durationMin + org.slotBufferMin;

  const dayStart = new Date(year, month - 1, day, startH, startM, 0, 0);
  const dayEnd = new Date(year, month - 1, day, endH, endM, 0, 0);

  let cursor = new Date(dayStart);
  while (cursor.getTime() + durationMin * 60_000 <= dayEnd.getTime()) {
    slots.push(new Date(cursor));
    cursor = new Date(cursor.getTime() + slotStep * 60_000);
  }

  // Filter out already booked slots
  const now = new Date();
  return slots.filter((slot) => {
    // Don't show past slots
    if (slot <= now) return false;

    const slotEnd = new Date(slot.getTime() + durationMin * 60_000);

    // Check for overlap with any existing appointment
    const overlaps = existingAppointments.some((appt) => {
      return slot < appt.endTime && slotEnd > appt.startTime;
    });

    return !overlaps;
  });
}

/** Format a Date into a human-readable time string e.g. "9:00 AM" */
export function formatTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = m.toString().padStart(2, "0");
  return `${displayH}:${displayM} ${period}`;
}

/** Format a "YYYY-MM-DD" date string into a human-readable Spanish label e.g. "Lun 15 sep" */
export function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const dayName = DISPLAY_DAY_NAMES[DAY_NAMES[date.getDay()]] || DAY_NAMES[date.getDay()];
  return `${dayName} ${day} ${MONTH_NAMES[month - 1]}`;
}
