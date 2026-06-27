require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const kvkkHtml = `<h4>1. Veri Sorumlusunun Kimliği</h4>
<p>Bu uygulama üzerinden toplanan kişisel verileriniz, "CERİLAS Yüksek Teknoloji Sanayi ve Ticaret AŞ" (VKN: 2061561435) veri sorumlusu sıfatıyla işlenmektedir. İletişim e-posta adresimiz: deniz@cerilas.com</p>

<h4>2. Kişisel Verilerin İşlenme Amacı</h4>
<p>Toplanan kişisel sağlık verileriniz, kimlik ve iletişim bilgileriniz;</p>
<ul>
  <li>Size özel tıbbi programların (görevler, check-inler, egzersizler) sunulması,</li>
  <li>Tedavi sürecinizin doktorunuz tarafından takibi ve iyileştirilmesi,</li>
  <li>Kullanıcı hesabınızın güvenliğinin sağlanması,</li>
</ul>
<p>amacıyla 6698 sayılı Kişisel Verilerin Korunması Kanunu'na (KVKK) uygun olarak işlenmektedir.</p>

<h4>3. Verilerin Aktarılması</h4>
<p>Kişisel verileriniz ve sağlık kayıtlarınız şifrelenmiş (encrypted) sunucularda yüksek güvenlik standartlarıyla korunmaktadır. Verileriniz, yasal zorunluluklar haricinde hiçbir şekilde üçüncü taraflara veya reklam şirketlerine satılmaz ve aktarılmaz. Yalnızca onay verdiğiniz tedavi ekibinizle (doktorlarınızla) paylaşılır.</p>

<h4>4. Veri Toplama Yöntemi ve Hukuki Sebebi</h4>
<p>Verileriniz, uygulamanın içerisindeki check-in formları, anketler ve kendi isteğinizle sağladığınız ölçümler aracılığıyla elektronik ortamda toplanmaktadır. İşleme faaliyeti, "veri sahibinin açık rızası" ve "sağlık hizmetlerinin yürütülmesi" hukuki sebeplerine dayanmaktadır.</p>

<h4>5. İlgili Kişinin Hakları</h4>
<p>KVKK'nın 11. maddesi uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini veya silinmesini talep etme haklarına sahipsiniz. Bu taleplerinizi doğrudan deniz@cerilas.com adresine e-posta göndererek bize iletebilirsiniz.</p>

<h4>İletişim Bilgileri</h4>
<ul>
  <li><strong>Şirket:</strong> CERİLAS Yüksek Teknoloji Sanayi ve Ticaret AŞ</li>
  <li><strong>VKN:</strong> 2061561435</li>
  <li><strong>E-posta:</strong> deniz@cerilas.com</li>
</ul>`;

const termsHtml = `<h4>1. Hizmetin Kapsamı</h4>
<p>NaviKont, hastaların tedavi süreçlerini dijital ortamda takip etmelerini sağlayan bir sağlık asistanıdır. Uygulama içerisindeki tıbbi modüller, anketler ve hatırlatıcılar doktorunuzun planladığı tedaviye destek olmak amacıyla sunulmaktadır.</p>

<h4>2. Tıbbi Tavsiye Değildir</h4>
<p>NaviKont üzerinden sağlanan hiçbir bilgi, doğrudan bir teşhis veya profesyonel tıbbi tavsiye yerine geçmez. Beklenmedik bir sağlık sorunu yaşadığınızda lütfen derhal doktorunuza veya en yakın sağlık kuruluşuna başvurunuz.</p>

<h4>3. Kullanıcı Sorumlulukları</h4>
<p>Kullanıcı, uygulamaya girdiği sağlık verilerinin (su tüketimi, sızıntı miktarı vb.) doğru ve güncel olmasından sorumludur. Yanlış veya eksik bilgi girilmesi, doktorunuzun değerlendirmesini olumsuz etkileyebilir.</p>

<h4>4. Hizmetin Kesintisi</h4>
<p>Sistem güncellemeleri veya teknik arızalar sebebiyle uygulamaya erişimde kısa süreli kesintiler yaşanabilir. Şirketimiz, bu kesintilerden doğabilecek dolaylı zararlardan doğabilecek dolaylı zararlardan sorumlu tutulamaz.</p>`;

(async () => {
  await pool.query('UPDATE core_consent_documents SET content_html = $1, title = $2 WHERE code = $3', [kvkkHtml, 'Gizlilik Politikası ve KVKK Aydınlatma Metni', 'kvkk_general']);
  await pool.query('UPDATE core_consent_documents SET content_html = $1, title = $2 WHERE code = $3', [termsHtml, 'Kullanım Koşulları', 'terms_of_use']);
  console.log('Updated DB with real HTML contents.');
  process.exit(0);
})();
