import { NextRequest, NextResponse } from 'next/server';
import { processPendingReminders } from '@/lib/reminders';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const secret = process.env.CRON_SECRET || 'smartschedule_cron_secret';

    // Optional secret check if CRON_SECRET is configured
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const result = await processPendingReminders();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error('Error in cron/reminders route:', error);
    return NextResponse.json({ error: 'Error al procesar recordatorios' }, { status: 500 });
  }
}
