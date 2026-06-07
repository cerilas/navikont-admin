import db from '@/lib/db';
import Link from 'next/link';
import JourneySettingsClient from './JourneySettingsClient';

export default async function JourneySettingsPage({ params }: { params: Promise<{ appId: string, journeyId: string }> }) {
  const { appId, journeyId } = await params;

  // Fetch Journey
  const journeyRes = await db.query('SELECT * FROM content_journeys WHERE id = $1 AND app_id = $2', [journeyId, appId]);
  const journey = journeyRes.rows[0];

  if (!journey) {
    return (
      <div className="page-body">
        <div className="container-xl">
          <div className="alert alert-danger">Akış bulunamadı.</div>
          <Link href={`/apps/${appId}/journeys`} className="btn btn-primary">Geri Dön</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header d-print-none">
        <div className="container-xl">
          <div className="row g-2 align-items-center">
            <div className="col">
              <div className="page-pretitle">
                {journey.name}
              </div>
              <h2 className="page-title">
                Akış Ayarları
              </h2>
            </div>
            <div className="col-auto ms-auto d-print-none">
              <div className="btn-list">
                <Link href={`/apps/${appId}/journeys/${journeyId}`} className="btn btn-link">
                  Akış Tasarımcısına Dön
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-body">
        <div className="container-xl">
          <JourneySettingsClient journey={journey} appId={appId} />
        </div>
      </div>
    </>
  );
}
