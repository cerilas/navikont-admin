const { Client } = require('pg');
require('dotenv').config();

const enrichedContent = {
  'Aşırı Aktif Mesane Nedir?': {
    content: {
      contentHtml: `
        <h2>Aşırı Aktif Mesane (AAM) Nedir?</h2>
        <p>Aşırı aktif mesane, idrar torbasının (mesane) aniden ve istemsiz olarak kasılması sonucu ortaya çıkan, sık sık tuvalete gitme ihtiyacı ve ani sıkışma hissi ile karakterize edilen bir durumdur.</p>
        
        <h3>Temel Belirtiler</h3>
        <ul>
          <li><strong>Ani Sıkışma Hissi (Urgency):</strong> Aniden ortaya çıkan ve ertelenmesi çok zor olan idrar yapma isteği.</li>
          <li><strong>Sık İdrara Çıkma (Frequency):</strong> Gündüzleri 8 kereden fazla idrara çıkma ihtiyacı.</li>
          <li><strong>Gece İdrara Kalkma (Noktüri):</strong> Gece uykudan idrar yapma isteğiyle uyanma (2 veya daha fazla kez).</li>
          <li><strong>Sıkışma Tipi İdrar Kaçırma (Urge Incontinence):</strong> Tuvalete yetişemeden istemsiz olarak idrar kaçırma (her hastada görülmeyebilir).</li>
        </ul>

        <h3>AAM Yönetiminde Davranışsal Terapinin Rolü</h3>
        <p>AAM tedavisinde ilk basamak genellikle davranışsal değişikliklerdir. Bunlar yan etkisizdir ve semptomları büyük ölçüde hafifletebilir:</p>
        <ol>
          <li><strong>Mesane Eğitimi:</strong> Planlı tuvalet aralıkları belirleyerek mesane kapasitesini zamanla artırmak.</li>
          <li><strong>Pelvik Taban Kas Egzersizleri (Kegel):</strong> İstemsiz kasılmaları baskılamak için pelvik kasları güçlendirmek.</li>
          <li><strong>Sıvı ve Diyet Yönetimi:</strong> Kafein, alkol, asitli ve baharatlı gıdalar gibi mesaneyi tahriş eden tetikleyicilerden kaçınmak ve sıvı alımını zamana yaymak.</li>
        </ol>
        <p><strong>Önemli Not:</strong> Bu uygulama, bu davranışsal değişimleri günlük hayatınıza entegre etmeniz için size adım adım rehberlik edecektir.</p>
      `
    }
  },
  'Pelvik Taban Kas Egzersizleri (Kegel)': {
    content: {
      videoUrl: 'https://www.youtube.com/watch?v=12345placeholder',
      title: 'Pelvik Taban Kas Egzersizleri (Kegel) Nasıl Yapılır?',
      descriptionHtml: `
        <p>Pelvik taban kasları, mesaneyi destekleyen ve idrar akışını kontrol eden kaslardır. Bu kasları güçlendirmek, aşırı aktif mesane semptomlarını ve ani sıkışma hissini kontrol altına almanın en etkili yollarından biridir.</p>
        
        <h4>1. Doğru Kasları Bulun</h4>
        <p>Tuvalette idrarınızı yaparken idrar akışını ortasında durdurmaya çalışın. Bunu yaparken kullandığınız kaslar, pelvik taban kaslarınızdır. <em>Not: Bu işlemi sadece kasların yerini bulmak için yapın, sürekli idrar yaparken egzersiz yapmayın.</em></p>
        
        <h4>2. Egzersizi Uygulama Adımları</h4>
        <ul>
          <li>Rahat bir pozisyonda oturun veya uzanın. Nefesinizi tutmayın, düzenli nefes alıp verin.</li>
          <li><strong>Sıkın ve Tutun:</strong> Pelvik taban kaslarınızı sıkın ve içe-yukarı doğru çekiyormuş gibi kasılı tutun. Bu pozisyonda <strong>5 saniye</strong> boyunca bekleyin.</li>
          <li><strong>Gevşeyin:</strong> Kaslarınızı tamamen gevşetin ve <strong>5 saniye</strong> dinlenin. Gevşeme aşaması kasların dinlenmesi için çok önemlidir.</li>
        </ul>

        <h4>3. Günlük Hedefiniz</h4>
        <p>Bu "sık-tut-gevşe" döngüsünü arka arkaya <strong>10 kez</strong> tekrarlayın (Buna 1 set denir).<br>
        Günde en az <strong>3 set</strong> (toplam 30 tekrar) yapmayı hedefleyin: Sabah, öğle ve akşam.</p>
        
        <p><em>İpucu: Sıkışma hissi (urgency) geldiğinde tuvalete koşmak yerine olduğunuz yerde durup arka arkaya 5-6 kez hızlıca pelvik kaslarınızı kasıp gevşetirseniz, mesanenize "rahatla" sinyali göndermiş olursunuz.</em></p>
      `
    }
  },
  'Sıkışma Anında Rahatlama Nefesi': {
    content: {
      inhaleTime: 4,
      holdTime: 7,
      exhaleTime: 8,
      cycles: 4,
      title: 'Sıkışma Anında Rahatlama Nefesi',
      instructionsHtml: `
        <p>Ani sıkışma hissi (urgency) geldiğinde bedenin savaş-kaç mekanizması (sempatik sinir sistemi) devreye girer. Bu durumu sakinleştirmek ve mesane kasılmasını baskılamak için "4-7-8 Nefes Tekniği"ni kullanacağız.</p>
        <ul>
          <li><strong>Adım 1:</strong> Tamamen nefes verin.</li>
          <li><strong>Adım 2:</strong> İçinizden 4'e kadar sayarak burnunuzdan derin ve sessiz bir nefes alın.</li>
          <li><strong>Adım 3:</strong> Nefesinizi tutun ve içinizden 7'ye kadar sayın.</li>
          <li><strong>Adım 4:</strong> Ağzınızdan hafif bir ses çıkararak 8'e kadar sayarak nefesinizi yavaşça verin.</li>
        </ul>
        <p>Bu döngüyü en az 4 kez tekrarlayın. Nefese odaklandığınızda mesanenizdeki kasılma hissinin yavaşça azaldığını fark edeceksiniz.</p>
      `
    }
  },
  'Aşırı Aktif Mesane Bilgi Testi': {
    content: {
      questions: [
        {
          question: "Kafeinli içecekler (kahve, siyah çay, kola) mesane sıkışmasını nasıl etkiler?",
          options: [
            "Kafein mesaneyi sakinleştirir ve kapasitesini artırır.",
            "Kafein güçlü bir mesane uyarıcısıdır (irritan) ve ani sıkışma hissini artırır.",
            "Kafeinin mesane üzerinde hiçbir etkisi yoktur."
          ],
          correctAnswer: 1,
          explanation: "Kafein idrar söktürücü (diüretik) özellik gösterir ve mesane kasını (detrusor) uyararak ani sıkışma ve idrara çıkma sıklığını artırır. Kafein tüketimini azaltmak ilk davranışsal adımlardan biridir."
        },
        {
          question: "Sıvı tüketimi ile ilgili olarak aşırı aktif mesanesi olan bir kişi ne yapmalıdır?",
          options: [
            "Tuvalete daha az gitmek için gün içinde mümkün olduğunca az su içmelidir.",
            "Günde en az 3-4 litre su içerek mesaneyi sürekli yıkamalıdır.",
            "Günde yaklaşık 1.5 - 2 litre sıvıyı gün içine dengeli şekilde yayarak tüketmelidir."
          ],
          correctAnswer: 2,
          explanation: "Sıvı alımını aşırı kısıtlamak idrarın konsantre olmasına (koyulaşmasına) neden olur. Konsantre idrar mesane iç yüzeyini tahriş ederek daha fazla sıkışma hissine yol açar. Yeterli ve dengeli sıvı almak en doğrusudur."
        },
        {
          question: "Gece idrara kalkmayı (noktüri) azaltmak için hangi strateji uygulanmalıdır?",
          options: [
            "Yatmadan hemen önce yatıştırıcı bitki çayları içilmelidir.",
            "Yatmadan en az 2-3 saat önce sıvı alımı tamamen kesilmelidir.",
            "Akşam yemeğinden sonra sadece alkollü içecekler tüketilmelidir."
          ],
          correctAnswer: 1,
          explanation: "Yatmadan 2-3 saat önce sıvı tüketimini durdurmak (ilaç içecek kadar su hariç), gece böbreklerin daha az idrar üretmesini sağlar ve uykuyu bölmenizi engeller."
        },
        {
          question: "Ani ve çok güçlü bir idrar sıkışması (urgency) hissettiğinizde ilk tepkiniz ne olmalıdır?",
          options: [
            "Hemen en yakın tuvalete doğru koşarak hızlıca yürümek.",
            "Olduğunuz yerde durup rahatlamak ve 5-6 kez hızlıca pelvik taban kaslarını sıkıp bırakmak.",
            "Karnınıza baskı yaparak idrarı içeride tutmaya çalışmak."
          ],
          correctAnswer: 1,
          explanation: "Tuvalete koşmak karın içi basıncı artırır ve idrar kaçırmaya neden olabilir. Bunun yerine durun, derin nefes alın ve pelvik kaslarınızı hızlıca kasarak mesanenize 'rahatla' refleksi gönderin. Sıkışma hissi azalınca normal adımlarla tuvalete gidin."
        },
        {
          question: "Pelvik Taban Kas Egzersizlerinin (Kegel) faydasını görmek için ne kadar süre düzenli uygulanması gerekir?",
          options: [
            "1-2 gün içinde hemen sonuç verir.",
            "Sadece sıkıştığım anlarda yapmam yeterlidir.",
            "Kalıcı sonuçlar için en az 6-8 hafta boyunca her gün düzenli yapılmalıdır."
          ],
          correctAnswer: 2,
          explanation: "Diğer tüm kaslar gibi pelvik taban kaslarının da güçlenmesi zaman alır. Klinik faydanın belirgin hale gelmesi genellikle 6 ila 8 haftalık düzenli günlük pratik gerektirir."
        }
      ]
    }
  },
  'Günü Tamamlama Görevleri': {
    content: {
      taskName: "Akşam Mesane Rutini",
      estimatedDuration: 15,
      instructionsHtml: `
        <p>Günü mesanenizi rahatlatarak ve iyi bir gece uykusuna hazırlık yaparak bitirelim. Lütfen aşağıdaki görevleri tamamlayın:</p>
        <ol>
          <li><strong>Sıvı Kısıtlaması:</strong> Yatağa girmeden tam 2 saat önce sıvı alımını durdurun (Eğer almanız gereken ilaçlar varsa, sadece küçük bir yudum su kullanın).</li>
          <li><strong>Mesane Günlüğü Kontrolü:</strong> Gün içinde içtiğiniz içecekleri ve tuvalet ziyaretlerinizi Mesane Günlüğüne eksiksiz kaydettiğinizden emin olun.</li>
          <li><strong>Akşam Egzersizi:</strong> Yatmadan önce sakin bir pozisyonda pelvik taban kas egzersizinizin son setini (10 tekrar) uygulayın.</li>
          <li><strong>Çifte Boşaltım (Double Voiding):</strong> Uyumadan hemen önce tuvalete gidin, mesanenizi boşaltın. 1-2 dakika klozet kapağı kapalıyken bekleyin ve tekrar idrar yapmaya çalışarak mesanenizin tamamen boşaldığından emin olun.</li>
        </ol>
      `
    }
  },
  'Tedavi Uyum Değerlendirmesi': {
    content: {
      questions: [
        {
          question: "Geçtiğimiz 3 gün içerisinde Pelvik Taban (Kegel) egzersizlerinizi hedeflediğiniz sıklıkta yapabildiniz mi?",
          options: [
            "Evet, her gün düzenli 3 set yaptım.",
            "Kısmen, aklıma geldikçe (günde 1-2 set) yaptım.",
            "Hayır, yapmayı unuttum veya vaktim olmadı.",
            "Egzersizleri yaparken ağrı veya rahatsızlık hissettim."
          ]
        },
        {
          question: "Son günlerde kafein tüketim hedefinize (örn. günde maksimum 1 fincan) ne kadar uyabildiniz?",
          options: [
            "Tamamen uydum, kafeini çok sınırlandırdım.",
            "Biraz uydum ama zaman zaman sınırı aştım.",
            "Uyamadım, normal düzenimde çay/kahve tüketmeye devam ettim."
          ]
        },
        {
          question: "Sıkışma hissini baskılama tekniklerini (durma, nefes alma, pelvik kasma) uygularken ne derece zorlanıyorsunuz?",
          options: [
            "Zorlanmıyorum, teknikleri uygulayınca sıkışma hissi geçiyor.",
            "Biraz zorlanıyorum, bazen işe yarıyor bazen yaramıyor.",
            "Çok zorlanıyorum, sıkışma hissi o kadar güçlü ki tekniği yapamıyorum."
          ]
        }
      ]
    }
  }
};

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });
  await client.connect();
  console.log('Connected to database.');

  try {
    for (const [moduleName, newContent] of Object.entries(enrichedContent)) {
      // Find the module ID
      const moduleRes = await client.query('SELECT id FROM content_modules WHERE name = $1', [moduleName]);
      if (moduleRes.rows.length === 0) {
        console.warn(`Module '${moduleName}' not found in DB. Skipping.`);
        continue;
      }
      
      const moduleId = moduleRes.rows[0].id;
      
      // Update the latest version of this module (assuming version 1 or grabbing the highest version)
      const versionRes = await client.query(`
        SELECT id FROM content_module_versions 
        WHERE module_id = $1 
        ORDER BY version_number DESC LIMIT 1
      `, [moduleId]);

      if (versionRes.rows.length === 0) {
        console.warn(`No version found for module '${moduleName}'. Skipping.`);
        continue;
      }

      const versionId = versionRes.rows[0].id;

      await client.query(`
        UPDATE content_module_versions 
        SET content = $1, updated_at = NOW() 
        WHERE id = $2
      `, [JSON.stringify(newContent.content), versionId]);

      console.log(`✅ Enriched content for: ${moduleName}`);
    }

  } catch (err) {
    console.error('Error during enrichment:', err);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

main();
