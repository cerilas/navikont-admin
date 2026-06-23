'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Stats {
  enrollmentsOverTime: { month: string; count: string }[];
  topConditions: { name: string; count: string }[];
  notificationStats: { status: string; count: string }[];
  modulesByType: { name: string; code: string; count: string }[];
  checkinCount: number;
  questionnaireCount: number;
  journeyStepCount: number;
  activePatients: number;
  totalPatients: number;
  recentlyActive: number;
}

const MONTH_NAMES: Record<string, string> = {
  '01': 'Oca', '02': 'Şub', '03': 'Mar', '04': 'Nis',
  '05': 'May', '06': 'Haz', '07': 'Tem', '08': 'Ağu',
  '09': 'Eyl', '10': 'Eki', '11': 'Kas', '12': 'Ara',
};

function formatMonth(ym: string) {
  const [year, month] = ym.split('-');
  return `${MONTH_NAMES[month] || month} ${year.slice(2)}`;
}

/* ── Notification donut colour map ── */
const NOTIF_COLORS: Record<string, string> = {
  read: '#2fb344',
  sent: '#206bc4',
  unread: '#f59f00',
  failed: '#d63939',
};
const NOTIF_LABELS: Record<string, string> = {
  read: 'Okundu',
  sent: 'Gönderildi',
  unread: 'Okunmadı',
  failed: 'Başarısız',
};

/* ── Module type icon colour palette ── */
const MODULE_COLORS = [
  '#206bc4', '#2fb344', '#ae3ec9', '#d63939', '#f59f00',
  '#0ca678', '#4263eb', '#f76707', '#e64980', '#495057',
  '#20c997', '#845ef7', '#fd7e14', '#15aabf', '#868e96',
];

export default function AppDashboardClient({ stats }: { stats: Stats }) {
  const [notifHover, setNotifHover] = useState<string | null>(null);

  /* ── Hasta Kayıt Trendi (Area) ── */
  const enrollmentData = stats.enrollmentsOverTime.map((item) => ({
    name: formatMonth(item.month),
    Hasta: parseInt(item.count, 10),
  }));

  /* ── Hastalık Dağılımı (Horizontal Bar) ── */
  const conditionData = stats.topConditions.map((item) => ({
    name: item.name.length > 25 ? item.name.slice(0, 22) + '…' : item.name,
    fullName: item.name,
    Hasta: parseInt(item.count, 10),
  }));

  /* ── Bildirim Durumları (Donut) ── */
  const notifData = stats.notificationStats
    .map((n) => ({
      name: NOTIF_LABELS[n.status] || n.status,
      key: n.status,
      value: parseInt(n.count, 10),
    }))
    .filter((n) => n.value > 0);
  const totalNotif = notifData.reduce((s, n) => s + n.value, 0);

  /* ── Modül Türleri (Horizontal Bar) ── */
  const moduleData = stats.modulesByType
    .map((m) => ({
      name: m.name.replace(' Modülü', ''),
      count: parseInt(m.count, 10),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  /* ── Hasta Katılım Oranı ── */
  const engagementRate = stats.totalPatients > 0
    ? Math.round((stats.recentlyActive / stats.totalPatients) * 100)
    : 0;

  return (
    <>
      {/* ────────── ROW 1: Mini KPI Cards ────────── */}
      <div className="row row-cards mt-4">
        {/* Active Engagement */}
        <div className="col-sm-6 col-lg-3">
          <div className="card card-sm">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-auto">
                  <span className="bg-primary text-white avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0 -4 -4h-4a4 4 0 0 0 -4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0 -3 -3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  </span>
                </div>
                <div className="col">
                  <div className="font-weight-medium">
                    {stats.recentlyActive} / {stats.totalPatients}
                  </div>
                  <div className="text-muted">Son 7 Gün Aktif</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Checkin Submissions */}
        <div className="col-sm-6 col-lg-3">
          <div className="card card-sm">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-auto">
                  <span className="bg-green text-white avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3l8 -8"></path><path d="M20 12v6a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h9"></path></svg>
                  </span>
                </div>
                <div className="col">
                  <div className="font-weight-medium">{stats.checkinCount}</div>
                  <div className="text-muted">Check-in Yanıtı</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Questionnaire Submissions */}
        <div className="col-sm-6 col-lg-3">
          <div className="card card-sm">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-auto">
                  <span className="bg-azure text-white avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v4a1 1 0 0 0 1 1h4"></path><path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z"></path><path d="M9 14l2 2l4 -4"></path></svg>
                  </span>
                </div>
                <div className="col">
                  <div className="font-weight-medium">{stats.questionnaireCount}</div>
                  <div className="text-muted">Anket Yanıtı</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Journey Steps */}
        <div className="col-sm-6 col-lg-3">
          <div className="card card-sm">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-auto">
                  <span className="bg-purple text-white avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                  </span>
                </div>
                <div className="col">
                  <div className="font-weight-medium">{stats.journeyStepCount}</div>
                  <div className="text-muted">Tedavi Adımı</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ────────── ROW 2: Trend + Bildirim Donut ────────── */}
      <div className="row row-cards mt-3">
        {/* Hasta Kayıt Trendi – Area */}
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Hasta Kayıt Trendi</h3>
              <div className="card-actions">
                <span className="badge bg-blue-lt">Son 12 Ay</span>
              </div>
            </div>
            <div className="card-body">
              {enrollmentData.length > 0 ? (
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <AreaChart data={enrollmentData} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#206bc4" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#206bc4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e6e7e9" />
                      <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#666' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#666' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,.12)' }}
                        labelStyle={{ fontWeight: 600 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="Hasta"
                        stroke="#206bc4"
                        strokeWidth={2.5}
                        fill="url(#gradBlue)"
                        dot={{ r: 4, fill: '#206bc4', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 6 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center text-muted py-5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-2 text-muted"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                  <div>Henüz yeterli kayıt verisi yok</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bildirim Dağılımı – Donut */}
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Bildirim Durumları</h3>
              <div className="card-actions">
                <span className="badge bg-blue-lt">{totalNotif} Toplam</span>
              </div>
            </div>
            <div className="card-body d-flex flex-column align-items-center">
              {notifData.length > 0 ? (
                <>
                  <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={notifData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          dataKey="value"
                          paddingAngle={3}
                          onMouseEnter={(_, idx) => setNotifHover(notifData[idx].key)}
                          onMouseLeave={() => setNotifHover(null)}
                        >
                          {notifData.map((entry, index) => (
                            <Cell
                              key={entry.key}
                              fill={NOTIF_COLORS[entry.key] || '#868e96'}
                              opacity={notifHover === null || notifHover === entry.key ? 1 : 0.4}
                              style={{ transition: 'opacity .2s', cursor: 'pointer' }}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,.12)' }}
                          formatter={(value: any) => [`${value} bildirim`, '']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="d-flex flex-wrap justify-content-center gap-3 mt-2">
                    {notifData.map((n) => (
                      <div key={n.key} className="d-flex align-items-center gap-1" style={{ fontSize: 13 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: NOTIF_COLORS[n.key] || '#868e96', display: 'inline-block' }}></span>
                        <span className="text-muted">{n.name}</span>
                        <strong>{n.value}</strong>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-muted py-5">Bildirim verisi yok</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ────────── ROW 3: Modül Dağılımı + Hastalıklar + Katılım ────────── */}
      <div className="row row-cards mt-3">
        {/* Modül Türleri – Horizontal Bar */}
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">İçerik Türlerine Göre Modüller</h3>
            </div>
            <div className="card-body">
              {moduleData.length > 0 ? (
                <div style={{ width: '100%', height: 280 }}>
                  <ResponsiveContainer>
                    <BarChart data={moduleData} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e6e7e9" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#666' }} axisLine={false} tickLine={false} />
                      <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12, fill: '#333' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,.12)' }}
                        formatter={(value: any) => [`${value} modül`, '']}
                      />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                        {moduleData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={MODULE_COLORS[index % MODULE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center text-muted py-5">Modül verisi yok</div>
              )}
            </div>
          </div>
        </div>

        {/* Hastalık Dağılımı */}
        <div className="col-lg-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">En Sık Görülen Tanılar</h3>
            </div>
            <div className="card-body">
              {conditionData.length > 0 ? (
                <div className="space-y-3">
                  {conditionData.map((c, i) => {
                    const maxVal = Math.max(...conditionData.map((d) => d.Hasta));
                    const pct = maxVal > 0 ? Math.round((c.Hasta / maxVal) * 100) : 0;
                    return (
                      <div key={i} className="mb-3">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="text-muted" style={{ fontSize: 13 }} title={c.fullName}>{c.name}</span>
                          <strong style={{ fontSize: 13 }}>{c.Hasta} hasta</strong>
                        </div>
                        <div className="progress progress-sm">
                          <div
                            className="progress-bar"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: MODULE_COLORS[i % MODULE_COLORS.length],
                              transition: 'width 0.6s ease',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-muted py-5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-2 text-muted"><path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572"></path></svg>
                  <div>Teşhis kaydı bulunmuyor</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ────────── ROW 4: Engagement Gauge ────────── */}
      <div className="row row-cards mt-3 mb-4">
        <div className="col-lg-4">
          <div className="card">
            <div className="card-body text-center py-4">
              <div className="mx-auto mb-3" style={{ position: 'relative', width: 120, height: 120 }}>
                <svg viewBox="0 0 120 120" width="120" height="120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="#e6e7e9" strokeWidth="10" />
                  <circle
                    cx="60" cy="60" r="52"
                    fill="none"
                    stroke={engagementRate >= 60 ? '#2fb344' : engagementRate >= 30 ? '#f59f00' : '#d63939'}
                    strokeWidth="10"
                    strokeDasharray={`${(engagementRate / 100) * 327} 327`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dasharray 1s ease' }}
                  />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                  <div className="h1 m-0" style={{ lineHeight: 1 }}>{engagementRate}%</div>
                </div>
              </div>
              <h3 className="mb-1">Hasta Katılım Oranı</h3>
              <div className="text-muted">Son 7 günde uygulamayı açan hasta oranı</div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Hızlı Özet</h3>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-6 col-md-3">
                  <div className="text-center">
                    <div className="h1 m-0 text-primary">{stats.totalPatients}</div>
                    <div className="text-muted" style={{ fontSize: 13 }}>Toplam Hasta</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-center">
                    <div className="h1 m-0 text-green">{stats.activePatients}</div>
                    <div className="text-muted" style={{ fontSize: 13 }}>Aktif Hasta</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-center">
                    <div className="h1 m-0 text-azure">{totalNotif}</div>
                    <div className="text-muted" style={{ fontSize: 13 }}>Gönderilen Bildirim</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-center">
                    <div className="h1 m-0 text-purple">{stats.checkinCount + stats.questionnaireCount}</div>
                    <div className="text-muted" style={{ fontSize: 13 }}>Toplam Form Yanıtı</div>
                  </div>
                </div>
              </div>
              <hr className="my-3" />
              <div className="row g-3">
                <div className="col-6 col-md-3">
                  <div className="text-center">
                    <div className="h2 m-0">{stats.checkinCount}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>Check-in</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-center">
                    <div className="h2 m-0">{stats.questionnaireCount}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>Anket</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-center">
                    <div className="h2 m-0">{moduleData.reduce((a, b) => a + b.count, 0)}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>Toplam Modül</div>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="text-center">
                    <div className="h2 m-0">{stats.journeyStepCount}</div>
                    <div className="text-muted" style={{ fontSize: 12 }}>Tedavi Adımı</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
