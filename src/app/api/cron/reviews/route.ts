import { NextRequest, NextResponse } from 'next/server';
import { processPostAppointmentReviews } from '@/lib/reviews';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const secret = process.env.CRON_SECRET || 'smartschedule_cron_secret';

    if (process.env.CRON_SECRET && authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const result = await processPostAppointmentReviews();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error: any) {
    console.error('Error in cron/reviews route:', error);
    return NextResponse.json({ error: 'Error al procesar encuestas de satisfacción' }, { status: 500 });
  }
}
