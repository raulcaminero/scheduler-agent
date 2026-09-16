/**
 * Google Calendar 2-Way Synchronization Module.
 * Integrates with Google Calendar API (v3) to export appointments
 * and retrieve busy time blocks.
 */

export interface GoogleCalendarEventPayload {
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  clientEmail?: string;
}

export async function createGoogleCalendarEvent(
  accessToken: string,
  calendarId: string = 'primary',
  event: GoogleCalendarEventPayload
): Promise<{ id: string; htmlLink: string } | null> {
  if (!accessToken) {
    return null;
  }

  try {
    const payload = {
      summary: event.summary,
      description: event.description || 'Agendado vía SmartSchedule WhatsApp Bot',
      start: {
        dateTime: event.startTime.toISOString(),
      },
      end: {
        dateTime: event.endTime.toISOString(),
      },
      attendees: event.clientEmail ? [{ email: event.clientEmail }] : undefined,
    };

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[Google Calendar API Error]', res.status, errorText);
      return null;
    }

    const data = await res.json();
    return {
      id: data.id,
      htmlLink: data.htmlLink,
    };
  } catch (error) {
    console.error('Failed to create Google Calendar event:', error);
    return null;
  }
}

export async function getGoogleCalendarBusySlots(
  accessToken: string,
  calendarId: string = 'primary',
  timeMin: Date,
  timeMax: Date
): Promise<{ startTime: Date; endTime: Date }[]> {
  if (!accessToken) {
    return [];
  }

  try {
    const payload = {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: calendarId }],
    };

    const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    const busy = data.calendars?.[calendarId]?.busy || [];

    return busy.map((b: { start: string; end: string }) => ({
      startTime: new Date(b.start),
      endTime: new Date(b.end),
    }));
  } catch (error) {
    console.error('Failed to fetch Google Calendar busy slots:', error);
    return [];
  }
}
