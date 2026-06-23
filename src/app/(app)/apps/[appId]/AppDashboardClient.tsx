'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function AppDashboardClient({ stats }: { stats: any }) {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  // format patient enrollment data
  const enrollmentData = stats.enrollmentsOverTime.map((item: any) => ({
    name: item.month,
    Hasta: parseInt(item.count, 10)
  }));

  const conditionData = stats.topConditions.map((item: any) => ({
    name: item.name,
    Hasta: parseInt(item.count, 10)
  }));

  const activityData = [
    { name: 'Bildirimler', value: parseInt(stats.activities.notifications, 10) },
    { name: 'Anketler', value: parseInt(stats.activities.questionnaires, 10) },
    { name: 'Check-inler', value: parseInt(stats.activities.checkins, 10) }
  ].filter(item => item.value > 0);

  return (
    <div className="row row-deck row-cards mt-3">
      {/* Hasta Kayıt Trendi */}
      <div className="col-lg-8">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Aylık Hasta Kayıt Trendi</h3>
          </div>
          <div className="card-body">
            {enrollmentData.length > 0 ? (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={enrollmentData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="Hasta" stroke="#206bc4" strokeWidth={3} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center text-muted py-5">Henüz yeterli veri yok</div>
            )}
          </div>
        </div>
      </div>

      {/* Aktivite Dağılımı */}
      <div className="col-lg-4">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Uygulama Etkileşimleri</h3>
          </div>
          <div className="card-body d-flex justify-content-center align-items-center">
            {activityData.length > 0 ? (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={activityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent = 0 }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {activityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center text-muted py-5">Henüz aktivite verisi yok</div>
            )}
          </div>
        </div>
      </div>

      {/* En Çok Atanan Koşullar */}
      <div className="col-lg-12">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">En Sık Görülen Hastalıklar / Koşullar</h3>
          </div>
          <div className="card-body">
            {conditionData.length > 0 ? (
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={conditionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Hasta" fill="#2fb344" radius={[4, 4, 0, 0]} barSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center text-muted py-5">Bu uygulama için teşhis kaydı bulunmuyor</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
