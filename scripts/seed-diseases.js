const { Client } = require('pg');
const crypto = require('crypto');
require('dotenv').config();

const diseases = [
  {
    name: 'Hipertansiyon',
    slug: 'hipertansiyon',
    icd_code: 'I10',
    risk_level: 'medium',
    status: 'active',
    description: 'Esansiyel (primer) hipertansiyon. Günlük tuz alımının azaltılması, fiziksel aktivitenin artırılması ve stres yönetimi gibi yaşam tarzı değişiklikleriyle kontrol altına alınabilir.',
    clinical_goal: 'Kan basıncını sistolik < 140 mmHg ve diyastolik < 90 mmHg seviyelerinin altında tutmak.'
  },
  {
    name: 'Obezite',
    slug: 'obezite',
    icd_code: 'E66',
    risk_level: 'medium',
    status: 'active',
    description: 'Aşırı kilo ve obezite. Kalori takibi, davranışsal beslenme terapisi, sürdürülebilir egzersiz alışkanlıkları kazanma süreçleriyle tedavi desteklenir.',
    clinical_goal: 'Vücut ağırlığında %5-10 oranında sağlıklı ve kalıcı azalma sağlamak.'
  },
  {
    name: 'Aşırı Aktif Mesane',
    slug: 'asiri-aktif-mesane',
    icd_code: 'N32.81',
    risk_level: 'low',
    status: 'active',
    description: 'Mesane eğitimi, pelvik taban kas egzersizleri (Kegel) ve sıvı alımı planlaması gibi davranışsal tedavilerle idrar kaçırma ve sık idrara çıkma semptomlarını azaltma.',
    clinical_goal: 'Günlük acil idrara çıkma ve idrar kaçırma atak sıklığını azaltmak.'
  },
  {
    name: 'Depresyon ve Anksiyete',
    slug: 'depresyon-anksiyete',
    icd_code: 'F41.2',
    risk_level: 'medium',
    status: 'active',
    description: 'Hafif ve orta düzeyde depresif nöbetler ile anksiyete bozukluğu. Bilişsel Davranışçı Terapi (BDT) yöntemleri, günlük duygu durumu takibi ve nefes/gevşeme egzersizleri.',
    clinical_goal: 'Anksiyete ve depresif belirti skorlarında klinik olarak anlamlı düşüş sağlamak.'
  },
  {
    name: 'Uykusuzluk (İnsomnia)',
    slug: 'insomnia',
    icd_code: 'G47.0',
    risk_level: 'low',
    status: 'active',
    description: 'Uykuya dalma ve uykuyu sürdürme bozukluğu. Uyku hijyeni eğitimi, uyku kısıtlama terapisi ve gevşeme egzersizleri gibi bilişsel davranışçı insomni terapisi (CBT-I) protokolleri.',
    clinical_goal: 'Uyku kalitesini artırmak ve uykuya dalma süresini 30 dakikanın altına indirmek.'
  },
  {
    name: 'İrritabl Bağırsak Sendromu (İBS)',
    slug: 'ibs',
    icd_code: 'K58',
    risk_level: 'low',
    status: 'active',
    description: 'Hassas bağırsak sendromu. Düşük FODMAP diyeti takibi, bağırsak odaklı gevşeme egzersizleri ve semptom-tetikleyici takibi içeren davranışsal yaklaşım.',
    clinical_goal: 'Karın ağrısı, şişkinlik ve dışkılama düzensizliği semptomlarını azaltmak.'
  },
  {
    name: 'Migren',
    slug: 'migren',
    icd_code: 'G43',
    risk_level: 'low',
    status: 'active',
    description: 'Migren atakları ve kronik baş ağrısı yönetimi. Tetikleyici analizi, stres azaltma teknikleri ve atak günlüğü tutarak ilaç dışı profilaksi sağlama.',
    clinical_goal: 'Aylık migren atak sıklığını ve şiddetini azaltmak.'
  },
  {
    name: 'Tinnitus (Kulak Çınlaması)',
    slug: 'tinnitus',
    icd_code: 'H93.1',
    risk_level: 'low',
    status: 'active',
    description: 'Kronik kulak çınlaması. Bilişsel davranışçı habituasyon (alışma) terapisi, ses terapisi eşleştirmesi ve dikkat dağıtma egzersizleri.',
    clinical_goal: 'Tinnitusun günlük yaşam kalitesi üzerindeki olumsuz etkilerini ve ilişkili stresi azaltmak.'
  },
  {
    name: 'Tip 2 Diyabet',
    slug: 'tip-2-diyabet',
    icd_code: 'E11',
    risk_level: 'medium',
    status: 'active',
    description: 'İnsülin dışı bağımlı diyabet. Karbonhidrat sayımı, glisemik indeks takibi, düzenli fiziksel aktivite teşviki ve kilo yönetimi.',
    clinical_goal: 'HbA1c seviyelerini hedef aralıkta (%6.5 - %7) tutmak.'
  },
  {
    name: 'Kronik Bel Ağrısı',
    slug: 'kronik-bel-agrisi',
    icd_code: 'M54.5',
    risk_level: 'low',
    status: 'active',
    description: 'Spesifik olmayan kronik bel ağrısı. Aktivite modifikasyonu, düzenli postür egzersizleri, korku-kaçınma davranışlarının azaltılması.',
    clinical_goal: 'Ağrı skorunu düşürmek, günlük hareketliliği ve fonksiyonel kapasiteyi artırmak.'
  },
  {
    name: 'Meme Kanseri Sonrası Destek',
    slug: 'meme-kanseri-destek',
    icd_code: 'C50',
    risk_level: 'medium',
    status: 'active',
    description: 'Meme kanseri tedavisi gören veya tamamlayan hastalar için yaşam kalitesi desteği. Kanserle ilişkili yorgunluk (fatigue) yönetimi, orta düzey fiziksel egzersiz ve mindfulness.',
    clinical_goal: 'Tedavi sonrası yorgunluk hissini azaltmak ve psikolojik dayanıklılığı artırmak.'
  },
  {
    name: 'Panik Bozukluk',
    slug: 'panik-bozukluk',
    icd_code: 'F41.0',
    risk_level: 'medium',
    status: 'active',
    description: 'Agorafobili veya agorafobisiz panik bozukluk. Panik atak anında solunum kontrolü, maruz bırakma (exposure) ödevleri ve panik döngüsü psiko eğitimi.',
    clinical_goal: 'Panik atak sıklığını ve atak sırasındaki felaketleştirici düşünceleri azaltmak.'
  },
  {
    name: 'Nikotin Bağımlılığı',
    slug: 'nikotin-bagimliligi',
    icd_code: 'F17',
    risk_level: 'low',
    status: 'active',
    description: 'Tütün kullanımına bağlı nikotin bağımlılığı. Tetikleyici yönetimi, sigara içme isteği ile başa çıkma stratejileri, davranışsal pekiştireçler ve motivasyonel destek.',
    clinical_goal: 'Sigarayı tamamen bırakmak ve nüks (relapse) oranını minimize etmek.'
  }
];

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  console.log('Connected to database.');

  for (const disease of diseases) {
    const checkRes = await client.query('SELECT id FROM medical_diseases WHERE slug = $1', [disease.slug]);
    if (checkRes.rows.length > 0) {
      const id = checkRes.rows[0].id;
      await client.query(`
        UPDATE medical_diseases
        SET name = $1, icd_code = $2, risk_level = $3, status = $4, description = $5, clinical_goal = $6, updated_at = NOW()
        WHERE id = $7
      `, [disease.name, disease.icd_code, disease.risk_level, disease.status, disease.description, disease.clinical_goal, id]);
      console.log(`Updated disease: ${disease.name} (${disease.slug})`);
    } else {
      const newId = crypto.randomUUID();
      await client.query(`
        INSERT INTO medical_diseases (id, name, slug, icd_code, risk_level, status, description, clinical_goal)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [newId, disease.name, disease.slug, disease.icd_code, disease.risk_level, disease.status, disease.description, disease.clinical_goal]);
      console.log(`Inserted disease: ${disease.name} (${disease.slug})`);
    }
  }

  await client.end();
  console.log('Database seeding complete.');
}

main().catch(console.error);
