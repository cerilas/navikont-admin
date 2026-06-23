import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// This endpoint is intended to be called by the mobile app
// to update the patient's last active timestamp for a specific enrollment.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { enrollmentId } = body;

    if (!enrollmentId) {
      return NextResponse.json({ error: 'enrollmentId is required' }, { status: 400 });
    }

    // Update the last_active_at timestamp for the specific enrollment
    const res = await db.query(`
      UPDATE patient_app_enrollments
      SET last_active_at = NOW()
      WHERE id = $1
      RETURNING id, last_active_at
    `, [enrollmentId]);

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      last_active_at: res.rows[0].last_active_at 
    });
  } catch (error: any) {
    console.error('Error updating last active at:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
