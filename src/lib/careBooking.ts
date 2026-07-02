export type ServiceType = "cleaning" | "repair";
export type TimeSlot = "morning" | "afternoon";

export interface CareBooking {
  bookingId: string;
  service: ServiceType;
  date: string; // ISO yyyy-mm-dd
  slot: TimeSlot;
  contact: string;
  notes: string;
  createdAt: string; // ISO datetime
}

const STORAGE_KEY = "360care.booking";

export function getBooking(): CareBooking | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CareBooking) : null;
  } catch {
    return null;
  }
}

function generateBookingId(): string {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SVC-${rand}`;
}

export function createBooking(input: {
  service: ServiceType;
  date: string;
  slot: TimeSlot;
  contact: string;
  notes: string;
}): CareBooking {
  const booking: CareBooking = {
    ...input,
    bookingId: generateBookingId(),
    createdAt: new Date().toISOString(),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
  return booking;
}

export function cancelBooking(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
