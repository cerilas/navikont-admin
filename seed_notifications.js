const { Pool } = require('pg');
const crypto = require('crypto');
const pool = new Pool({ connectionString: 'postgresql://postgres:sKCBeqpAXLrEjZXwRoezFtDRYQLIsvPb@acela.proxy.rlwy.net:42498/railway' });

const appId = '3ee42ade-0563-4eae-9c37-65b878667446';

const templates = [
  // PUSH NOTIFICATIONS
  {
    code: 'push_daily_reminder',
    channel: 'push',
    title: 'Merhaba {{patient_name}} 👋',
    body: 'Bugünkü pelvik taban egzersizlerini yapmayı unutma. Günlük hedeflerini tamamla, sağlığına katkı sağla!',
    vars: ['{{patient_name}}']
  },
  {
    code: 'push_doctor_message',
    channel: 'push',
    title: '{{doctor_name}} Seni Bekliyor 👨‍⚕️',
    body: 'Doktorun {{doctor_name}} tarafından atanmış tamamlanmamış bir modülün var. Lütfen {{app_name}} uygulamasını kontrol et.',
    vars: ['{{doctor_name}}', '{{app_name}}']
  },
  {
    code: 'push_inactivity_alert',
    channel: 'push',
    title: 'Seni Özledik! 🥺',
    body: 'Bir süredir {{app_name}} uygulamasına girmedin. Tedavi sürecinde geri kalmamak için kaldığın yerden devam et!',
    vars: ['{{app_name}}']
  },
  // IN APP NOTIFICATIONS
  {
    code: 'in_app_welcome',
    channel: 'in_app',
    title: 'Tedavi Sürecine Hoş Geldin! 🎉',
    body: 'Sevgili {{patient_name}}, {{doctor_name}} ile birlikte harika bir ilerleme kaydedeceğiz. Bugünün görevlerine hemen göz at.',
    vars: ['{{patient_name}}', '{{doctor_name}}']
  },
  {
    code: 'in_app_streak_milestone',
    channel: 'in_app',
    title: 'Harika Gidiyorsun! 🔥',
    body: 'Sevgili {{patient_name}}, üst üste hedeflerini başarıyla tamamlıyorsun! Bu disiplinin iyileşme sürecini hızlandıracak. Durmak yok!',
    vars: ['{{patient_name}}']
  },
  {
    code: 'in_app_new_module',
    channel: 'in_app',
    title: 'Yeni Bir Aşama Açıldı! 🔓',
    body: 'Tedavinde yeni bir seviyeye geçtin. Sırada senin için özel hazırlanan {{app_name}} eğitim modülleri var. Hemen keşfet!',
    vars: ['{{app_name}}']
  }
];

async function seed() {
  try {
    for (const t of templates) {
      const res = await pool.query(
        'SELECT id FROM content_notification_templates WHERE app_id = $1 AND code = $2',
        [appId, t.code]
      );
      if (res.rows.length === 0) {
        await pool.query(`
          INSERT INTO content_notification_templates (id, app_id, code, channel, title_template, body_template, variables, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, true)
        `, [crypto.randomUUID(), appId, t.code, t.channel, t.title, t.body, JSON.stringify(t.vars)]);
        console.log(`Inserted ${t.code}`);
      } else {
        await pool.query(`
          UPDATE content_notification_templates 
          SET title_template=$1, body_template=$2, variables=$3
          WHERE id=$4
        `, [t.title, t.body, JSON.stringify(t.vars), res.rows[0].id]);
        console.log(`Updated ${t.code}`);
      }
    }
    console.log('Seed completed.');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

seed();
