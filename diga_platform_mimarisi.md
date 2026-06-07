# Modüler DiGA Platformu – App Mimarisi, Şeması ve Süper Admin Akışı

Bu doküman; hipertansiyon, obezite, aşırı aktif mesane gibi davranış temelli müdahale edilebilecek hastalıklar için kullanılabilecek **modüler DiGA / dijital terapötik uygulama platformu** mimarisini açıklar.

Bu yapı, tek hastalık için yapılmış sabit bir mobil uygulama değildir. Aksine, farklı hastalık alanları için ayrı “app/program” üretilebilen, içerik ve modül tabanlı bir dijital sağlık platformudur.

---

## 1. Genel Platform Mantığı

Bu yapıyı şöyle düşünebiliriz:

> **Süper Admin Paneli = Hastalık bazlı dijital terapi/app üretim fabrikası**  
> **Doktor Paneli = Hastaya uygun programı reçeteleme, izleme ve müdahale paneli**  
> **Mobil App = Hastanın günlük davranış değişikliği, eğitim, takip ve egzersiz uygulaması**

Platformda her hastalık için ayrı ayrı “app/program” oluşturulur.

Örnek hastalık/program yapıları:

| Hastalık / Program | Mobilde Görünen App İçeriği |
|---|---|
| Hipertansiyon | Tansiyon takibi, tuz tüketimi eğitimi, egzersiz, nefes egzersizi, check-in |
| Obezite | Kilo takibi, beslenme günlüğü, davranışsal hedefler, su takibi, eğitim videoları |
| Aşırı Aktif Mesane | İşeme günlüğü, sıvı alımı takibi, pelvik taban egzersizi, hatırlatıcılar |
| Uyku Bozukluğu | Uyku günlüğü, gevşeme egzersizi, uyku hijyeni modülleri |
| Diyabet Öncesi | Glukoz farkındalığı, beslenme, aktivite, kilo takibi |

Buradaki kritik nokta:

**Her hastalık için ayrı yazılım geliştirmek yerine, Süper Admin Paneli üzerinden içerik, modül, soru formu, akış ve hasta takibi yapılandırılabilir.**

---

## 2. Ana Mimari Şema

```text
                      SÜPER ADMIN PANELİ
                              |
                              |
        ------------------------------------------------
        |                      |                       |
   Hastalık Yönetimi      App / Program          Modül & İçerik
                          Yönetimi               Oluşturucu
        |                      |                       |
        ------------------------------------------------
                              |
                              |
                     Klinik Protokol / Akış Motoru
                              |
                              |
       -------------------------------------------------
       |                                               |
  DOKTOR PANELİ                                  MOBİL APP
       |                                               |
  Hasta atama                                  Günlük kullanım
  İlerleme izleme                              Check-in
  Rapor görüntüleme                            Eğitim modülleri
  Risk uyarıları                               Egzersizler
  Mesaj / yönlendirme                          Anketler
```

---

## 3. Süper Admin Paneli Ana Modülleri

### 3.1. Dashboard

Süper admin giriş yaptığında genel tabloyu görür.

| Alan | Açıklama |
|---|---|
| Toplam hastalık/program sayısı | Kaç farklı hastalık app’i var |
| Aktif app sayısı | Yayında olan programlar |
| Taslak app sayısı | Henüz yayına alınmamış içerikler |
| Aktif hasta sayısı | Tüm sistemdeki aktif kullanıcılar |
| Doktor sayısı | Sisteme kayıtlı doktorlar |
| Ortalama tamamlama oranı | Hastaların programları bitirme oranı |
| Günlük check-in oranı | Kullanıcıların düzenli veri girişi |
| Riskli hasta uyarıları | Doktor paneline düşen kritik durumlar |

---

## 4. Hastalık Yönetimi

Süper admin önce “hastalık” oluşturur.

Örnek:

```text
Hastalık Adı: Hipertansiyon
Kategori: Kardiyometabolik Hastalıklar
Davranışsal Müdahale Türü:
- Beslenme
- Egzersiz
- Stres yönetimi
- İlaç öncesi yaşam tarzı değişikliği
- Ölçüm takibi
```

### Hastalık Yönetiminde Alanlar

| Alan | Açıklama |
|---|---|
| Hastalık adı | Hipertansiyon, obezite, aşırı aktif mesane vb. |
| ICD kodu | Tıbbi sınıflama için |
| Kategori | Kardiyoloji, üroloji, metabolizma vb. |
| Hedef kullanıcı | Hasta profili |
| Klinik amaç | Eğitim, izlem, davranış değişikliği |
| Risk seviyesi | Düşük, orta, yüksek |
| Kullanım süresi | 4 hafta, 8 hafta, 12 hafta vb. |
| Doktor onayı gerekli mi? | Evet / Hayır |
| Yayın durumu | Taslak, test, yayında, pasif |

---

## 5. App / Program Yönetimi

Bir hastalığın altında birden fazla app/program olabilir.

Örneğin hipertansiyon için:

```text
Hipertansiyon Başlangıç Programı
Hipertansiyon 8 Haftalık Yaşam Tarzı Programı
Hipertansiyon Tuz Azaltma Programı
Hipertansiyon Stres Yönetimi Programı
```

### App Bilgileri

| Alan | Açıklama |
|---|---|
| App adı | “8 Haftalık Hipertansiyon Destek Programı” |
| Hastalık | Hipertansiyon |
| Program süresi | 56 gün |
| Kullanıcı tipi | Yeni tanı, risk grubu, takip hastası |
| Dil | TR / EN / DE |
| Doktor reçetesi gerekli mi? | Evet / Hayır |
| Mobilde görünen ikon | Program kartı ikonu |
| Açıklama | Hastaya gösterilecek kısa açıklama |
| Klinik açıklama | Doktora gösterilecek teknik açıklama |
| Versiyon | v1.0, v1.1 |
| Yayın durumu | Taslak / Test / Yayında |

---

## 6. Modül Oluşturucu

Burası sistemin en önemli kısmıdır.

Süper admin, modülleri **sürükle-bırak mantığıyla** oluşturur. Google Forms gibi ama sağlık uygulamasına özel daha güçlü bir yapı olarak düşünülmelidir.

### 6.1. Modül Tipleri

| Modül Tipi | Kullanım Amacı |
|---|---|
| Video Modülü | Eğitim videosu, egzersiz videosu |
| Yazılı İçerik Modülü | Makale, bilgilendirme, rehber |
| Soru-Cevap Modülü | Kullanıcıya bilgi verip cevap alma |
| Questionnaire / Anket | Ölçek, semptom formu, takip formu |
| Check-in Modülü | Günlük veri girişi |
| Nefes Egzersizi Modülü | Stres / gevşeme / solunum çalışması |
| Sayaç / Timer Modülü | Nefes tutma, egzersiz süresi |
| Günlük / Diary Modülü | İşeme günlüğü, yemek günlüğü, tansiyon günlüğü |
| Ölçüm Girişi Modülü | Kilo, tansiyon, nabız, bel çevresi |
| Hedef Modülü | Günlük hedef belirleme |
| Hatırlatıcı Modülü | Bildirim, alarm, görev |
| Test / Quiz Modülü | Öğrenme kontrolü |
| Dosya / PDF Modülü | Klinik doküman veya hasta bilgilendirme |
| Onam Modülü | KVKK, aydınlatılmış onam, kullanım onayı |
| Risk Uyarı Modülü | Belirli cevaplarda doktora bildirim |
| Görev Modülü | “Bugün 20 dakika yürüyüş yap” gibi görevler |

---

## 7. Modül Builder Akışı

```text
Süper Admin
   |
   |-- Hastalık seçer
   |
   |-- App / Program seçer
   |
   |-- Yeni modül ekler
          |
          |-- Modül tipi seçer
          |      - Video
          |      - Yazı
          |      - Soru
          |      - Anket
          |      - Check-in
          |      - Nefes egzersizi
          |
          |-- İçeriği girer
          |
          |-- Görünürlük kuralı belirler
          |
          |-- Sıralama yapar
          |
          |-- Önizleme yapar
          |
          |-- Yayına alır
```

---

## 8. Video Modülü Örneği

### Süper Admin Girişi

```text
Modül Tipi: Video
Başlık: Hipertansiyonda Tuz Tüketimi Neden Önemlidir?
Video Linki: YouTube / Vimeo / CDN linki
Açıklama: Bu videoda tuz tüketiminin tansiyon üzerindeki etkisi anlatılır.
HTML İçerik: Video altı açıklama
Tamamlandı sayılması için:
- Videonun %80’i izlenmeli
- Sonrasında 2 soruluk mini quiz çözülmeli
```

### Mobilde Görünüm

```text
[Video]
Hipertansiyonda Tuz Tüketimi Neden Önemlidir?

Kısa açıklama...

Videoyu izle
Tamamladım
```

---

## 9. Yazılı İçerik Modülü

Bu modül HTML editör ile hazırlanır.

### Süper Admin Alanları

| Alan | Açıklama |
|---|---|
| Başlık | İçerik başlığı |
| Kısa açıklama | Mobilde kart altında görünür |
| HTML içerik | Zengin metin editörü |
| Görsel | Opsiyonel |
| Okuma süresi | Otomatik veya manuel |
| Tamamlama şartı | Sayfa sonuna gelme / butona basma |
| Mini soru eklensin mi? | Evet / Hayır |

HTML editörde şunlar olmalı:

```text
- Kalın / italik yazı
- Başlıklar
- Liste
- Tablo
- Görsel ekleme
- Link verme
- Uyarı kutusu
- Bilgilendirme kutusu
- Klinik not kutusu
```

---

## 10. Questionnaire / Anket Oluşturucu

Google Forms benzeri ama klinik akışa bağlı olmalıdır.

### Soru Tipleri

| Soru Tipi | Örnek |
|---|---|
| Tek seçim | Bugün egzersiz yaptınız mı? Evet / Hayır |
| Çoklu seçim | Bugün hangi besinleri tükettiniz? |
| Sayısal giriş | Bugünkü tansiyonunuz kaç? |
| Tarih / saat | Ölçüm zamanı |
| Slider | Ağrı seviyeniz 0-10 arasında kaç? |
| Metin alanı | Bugün kendinizi nasıl hissettiniz? |
| Dosya yükleme | Rapor veya ölçüm fotoğrafı |
| Evet/Hayır | Baş dönmesi yaşadınız mı? |
| Ölçek sorusu | 1-5 arası memnuniyet |
| Matris soru | Günlük semptom tablosu |

### Anket İçinde Kural Yapısı

Örneğin:

```text
Soru: Bugün tansiyonunuz 180/110 üzerinde mi?
Cevap: Evet
Aksiyon:
- Kullanıcıya acil uyarı göster
- Doktor paneline risk bildirimi gönder
- Kullanıcıya “doktorunuza başvurun” metni göster
```

---

## 11. Check-in Modülü

Check-in her app’te default gelir.

Bu modül, Duolingo benzeri **streak** mantığıyla çalışır.

### Check-in Mantığı

```text
Hasta her gün belirlenen verileri girer.
Veri girerse streak +1 olur.
Veri girmezse streak bozulur veya koruma hakkı kullanılır.
Belirli streak seviyelerinde rozet / motivasyon mesajı gösterilir.
```

### Süper Admin Check-in Ayarları

| Alan | Açıklama |
|---|---|
| Check-in başlığı | “Bugünkü sağlık kontrolün” |
| Günlük soru sayısı | 3-10 soru |
| Veri tipi | Tansiyon, kilo, su, işeme sayısı vb. |
| Zorunlu alanlar | Hangi veriler zorunlu |
| Hatırlatma saati | Sabah / akşam |
| Streak aktif mi? | Evet / Hayır |
| Streak bozulma kuralı | 1 gün kaçırırsa sıfırla / tolerans ver |
| Rozet sistemi | 3 gün, 7 gün, 14 gün, 30 gün |
| Doktor uyarı eşiği | Kritik değerlerde bildirim |

---

## 12. Hastalığa Göre Check-in Örnekleri

### Hipertansiyon Check-in

```text
Bugünkü tansiyonunuzu girdiniz mi?
- Sistolik
- Diyastolik
- Nabız
- Tuzlu gıda tükettiniz mi?
- Bugün yürüyüş yaptınız mı?
- Stres seviyeniz kaç?
```

### Obezite Check-in

```text
Bugünkü kilonuz
Su tüketimi
Adım sayısı
Ana öğün sayısı
Atıştırmalık tüketimi
Duygusal yeme oldu mu?
```

### Aşırı Aktif Mesane Check-in

```text
Bugün kaç kez idrara çıktınız?
Ani sıkışma yaşadınız mı?
Gece kaç kez uyandınız?
Sıvı tüketiminiz ne kadardı?
Kaçırma oldu mu?
Pelvik taban egzersizi yaptınız mı?
```

---

## 13. Program Akışı / Journey Builder

Süper admin sadece modül oluşturmaz; bu modülleri **zamana ve kurallara göre sıralar**.

### Akış Mantığı

```text
1. Gün
- Onam formu
- Başlangıç anketi
- Eğitim videosu
- Günlük check-in

2. Gün
- Yazılı içerik
- Hedef belirleme
- Check-in

3. Gün
- Nefes egzersizi
- Soru-cevap
- Check-in

7. Gün
- Haftalık değerlendirme anketi
- Doktora özet rapor
```

### Sürükle-Bırak Akış

```text
Hafta 1
  Gün 1: Başlangıç Anketi
  Gün 1: Eğitim Videosu
  Gün 1-7: Günlük Check-in

Hafta 2
  Gün 8: Davranışsal Hedef Modülü
  Gün 9: Nefes Egzersizi
  Gün 10: Mini Quiz

Hafta 4
  Gün 28: Klinik Değerlendirme Formu
  Gün 28: Doktor Raporu
```

---

## 14. Süper Admin Paneli Menü Yapısı

```text
SÜPER ADMIN PANELİ

1. Dashboard

2. Hastalık Yönetimi
   - Hastalık Listesi
   - Yeni Hastalık Oluştur
   - ICD / Klinik Bilgi
   - Risk Eşikleri
   - Varsayılan Check-in Şablonları

3. App / Program Yönetimi
   - App Listesi
   - Yeni App Oluştur
   - App Detayları
   - Versiyon Yönetimi
   - Yayın Durumu

4. Modül Kütüphanesi
   - Video Modülleri
   - Yazılı İçerik Modülleri
   - Anketler
   - Check-in Modülleri
   - Egzersiz Modülleri
   - Soru-Cevap Modülleri
   - Risk Uyarı Modülleri

5. Modül Builder
   - Sürükle-Bırak Modül Tasarımı
   - HTML Editör
   - Form Builder
   - Önizleme
   - Mobil Görünüm Testi

6. Akış / Journey Builder
   - Günlük Akış
   - Haftalık Akış
   - Koşullu Akış
   - Kilit Açma Kuralları
   - Tamamlama Kuralları

7. Questionnaire Builder
   - Form Oluştur
   - Soru Ekle
   - Skor Hesaplama
   - Risk Kuralı
   - Doktor Bildirimi

8. Check-in Yönetimi
   - Günlük Veri Alanları
   - Streak Ayarları
   - Rozetler
   - Hatırlatıcılar
   - Kritik Değer Eşikleri

9. Doktor Yönetimi
   - Doktor Listesi
   - Kurum / Klinik Atama
   - Yetki Yönetimi
   - Hasta Görme Yetkileri

10. Hasta Yönetimi
   - Hasta Listesi
   - Aktif Programlar
   - Kullanım Durumu
   - Riskli Hastalar

11. Klinik Raporlama
   - Program Tamamlama
   - Check-in Uyumu
   - Semptom Değişimi
   - Hasta Bazlı Rapor
   - Doktor Bazlı Rapor

12. Bildirim Yönetimi
   - Push Bildirimler
   - SMS / E-posta
   - Hatırlatıcı Şablonları
   - Risk Bildirimleri

13. İçerik Onay Süreci
   - Taslak
   - Klinik İnceleme
   - Regülasyon İncelemesi
   - Yayına Hazır
   - Yayında

14. KVKK / GDPR / Onam Yönetimi
   - Aydınlatma Metinleri
   - Açık Rıza Formları
   - Veri Saklama Politikası
   - Kullanıcı Onam Geçmişi

15. Sistem Ayarları
   - Roller
   - Yetkiler
   - Dil Ayarları
   - Tema
   - Loglar
```

---

## 15. Süper Admin Veri Modeli

Temel veri yapısı şöyle olabilir:

```text
Disease
   |
   |-- App / Program
          |
          |-- Version
          |
          |-- Modules
          |      |
          |      |-- Module Type
          |      |-- Content
          |      |-- Rules
          |      |-- Completion Criteria
          |
          |-- Questionnaires
          |      |
          |      |-- Questions
          |      |-- Answers
          |      |-- Scores
          |      |-- Risk Rules
          |
          |-- Check-in Template
          |      |
          |      |-- Fields
          |      |-- Streak Rules
          |      |-- Reminder Rules
          |
          |-- Journey
                 |
                 |-- Day / Week
                 |-- Module Order
                 |-- Conditional Logic
```

---

## 16. Temel Entity Listesi

### 16.1. Disease

```json
{
  "id": "disease_001",
  "name": "Hipertansiyon",
  "category": "Kardiyometabolik",
  "icdCode": "I10",
  "description": "Davranışsal müdahale destek programı",
  "status": "active"
}
```

### 16.2. App / Program

```json
{
  "id": "app_001",
  "diseaseId": "disease_001",
  "name": "8 Haftalık Hipertansiyon Destek Programı",
  "durationDays": 56,
  "requiresDoctorAssignment": true,
  "status": "draft",
  "version": "1.0.0"
}
```

### 16.3. Module

```json
{
  "id": "module_001",
  "appId": "app_001",
  "type": "video",
  "title": "Tuz Tüketimi ve Tansiyon",
  "description": "Tuzun tansiyon üzerindeki etkisi",
  "contentHtml": "<p>Bu bölümde...</p>",
  "videoUrl": "https://...",
  "completionRule": {
    "type": "video_watch_percentage",
    "value": 80
  }
}
```

### 16.4. Questionnaire

```json
{
  "id": "questionnaire_001",
  "appId": "app_001",
  "title": "Başlangıç Değerlendirme Formu",
  "questions": [
    {
      "type": "number",
      "label": "Sistolik tansiyon değeriniz kaç?",
      "required": true
    },
    {
      "type": "single_choice",
      "label": "Bugün baş dönmesi yaşadınız mı?",
      "options": ["Evet", "Hayır"],
      "required": true
    }
  ]
}
```

### 16.5. Rule

```json
{
  "id": "rule_001",
  "condition": "systolic >= 180 OR diastolic >= 110",
  "action": [
    "show_patient_warning",
    "notify_doctor",
    "mark_as_high_risk"
  ]
}
```

---

## 17. Süper Admin İçin Sayfa Sayfa Akış

### 17.1. Yeni Hastalık Oluşturma

```text
Süper Admin > Hastalık Yönetimi > Yeni Hastalık

1. Hastalık adını girer
2. Kategori seçer
3. ICD kodu girer
4. Klinik açıklama ekler
5. Davranışsal müdahale alanlarını seçer
6. Varsayılan risk eşiklerini tanımlar
7. Kaydeder
```

### 17.2. Yeni App / Program Oluşturma

```text
Süper Admin > App Yönetimi > Yeni App

1. Hastalık seçilir
2. App adı girilir
3. Program süresi belirlenir
4. Hedef hasta profili seçilir
5. Doktor ataması gerekli mi belirlenir
6. Varsayılan check-in seçilir
7. Taslak olarak kaydedilir
```

### 17.3. Modül Ekleme

```text
Süper Admin > App Detayı > Modüller > Yeni Modül

1. Modül tipi seçilir
2. Başlık girilir
3. Açıklama girilir
4. HTML içerik eklenir
5. Medya eklenir
6. Tamamlama kuralı belirlenir
7. Görünürlük kuralı belirlenir
8. Kaydedilir
```

### 17.4. Akış Oluşturma

```text
Süper Admin > Journey Builder

1. Gün / hafta bazlı ekran açılır
2. Modül kütüphanesinden modüller sürüklenir
3. Günlere bırakılır
4. Modül sırası belirlenir
5. Kilit açma kuralları tanımlanır
6. Önizleme yapılır
7. Yayına alınır
```

---

## 18. Koşullu Akış Örneği

### Obezite App Örneği

```text
Soru: Son 7 günde duygusal yeme yaşadınız mı?
Cevap: Evet, 3 günden fazla

Sistem aksiyonu:
- "Duygusal Yeme Farkındalık Modülü" açılır.
- Doktora düşük öncelikli bildirim gider.
- Kullanıcıya ekstra günlük egzersiz önerilir.
```

### Hipertansiyon App Örneği

```text
Soru: Tansiyonunuz 180/110 üzerinde mi?
Cevap: Evet

Sistem aksiyonu:
- Kullanıcıya acil uyarı gösterilir.
- Doktor paneline yüksek risk bildirimi gider.
- Günlük program geçici olarak risk ekranına yönlendirilir.
```

### Aşırı Aktif Mesane App Örneği

```text
Soru: Bugün ani sıkışma sayısı 8’den fazla mı?
Cevap: Evet

Sistem aksiyonu:
- Mesane eğitimi modülü açılır.
- Pelvik taban egzersizi hatırlatıcısı artırılır.
- Doktor panelinde semptom artışı olarak işaretlenir.
```

---

## 19. Doktor Paneli ile Bağlantı

Süper admin tarafında oluşturulan app’ler doktor panelinde seçilebilir hale gelir.

### Doktor Akışı

```text
Doktor giriş yapar
   |
   |-- Hasta oluşturur / seçer
   |
   |-- Hastalık seçer
   |
   |-- Uygun DiGA programını seçer
   |
   |-- Hastaya atar
   |
   |-- Hasta mobil app’te programı kullanır
   |
   |-- Doktor ilerlemeyi izler
   |
   |-- Riskli durumlarda bildirim alır
```

### Doktor Panelinde Görülecekler

| Alan | Açıklama |
|---|---|
| Hasta listesi | Doktorun hastaları |
| Aktif program | Hastanın kullandığı app |
| Check-in uyumu | Günlük giriş oranı |
| Streak durumu | Düzenli kullanım |
| Semptom trendi | İyileşme / kötüleşme |
| Risk uyarıları | Kritik değerler |
| Anket sonuçları | Klinik formlar |
| Modül tamamlama | Eğitim / egzersiz tamamlama |
| Rapor | PDF / grafik çıktı |

---

## 20. Mobil App Akışı

Mobil tarafta kullanıcı teknik yapıyı görmez. Sadece kendisine atanmış programı görür.

```text
Hasta giriş yapar
   |
   |-- Onamları kabul eder
   |
   |-- Kendisine atanan programı görür
   |
   |-- Başlangıç anketini doldurur
   |
   |-- Günlük görevleri görür
   |
   |-- Check-in yapar
   |
   |-- Eğitim / egzersiz modüllerini tamamlar
   |
   |-- Streak kazanır
   |
   |-- Gelişimini takip eder
   |
   |-- Gerektiğinde doktoruna yönlendirilir
```

### Mobil Ana Sayfa Örneği

```text
Merhaba Deniz

Bugünkü görevlerin:
[ ] Tansiyon check-in
[ ] Tuz tüketimi videosu
[ ] 3 dakikalık nefes egzersizi

Streak: 6 gün
Haftalık ilerleme: %72
```

---

## 21. Kullanıcı Rolleri

| Rol | Yetki |
|---|---|
| Süper Admin | Tüm sistemi yönetir |
| Klinik İçerik Editörü | Modül ve içerik hazırlar |
| Medikal Onaycı | Klinik doğruluk onayı verir |
| Regülasyon Yetkilisi | KVKK, GDPR, DiGA uyumu kontrol eder |
| Doktor | Hasta atar ve izler |
| Hasta | Mobil app kullanır |
| Kurum Admini | Klinik / hastane bazlı kullanıcıları yönetir |

---

## 22. Yayınlama ve Versiyonlama Mantığı

Bu sistemde versiyonlama çok önemlidir. Çünkü sağlık uygulamasında içerik değiştiğinde geçmiş hasta verileriyle karışmamalıdır.

### Versiyon Akışı

```text
v1.0 Taslak
   |
Klinik onay
   |
Regülasyon onayı
   |
Test yayını
   |
Canlı yayın
   |
v1.1 güncelleme
```

### Önemli Kural

Bir hasta v1.0 programına başladıysa, program ortasında v1.1 değişikliği otomatik uygulanmamalıdır. Admin karar vermelidir:

```text
- Mevcut hastalar v1.0 ile devam etsin
- Yeni hastalar v1.1 kullansın
- Tüm hastalar v1.1’e geçirilsin
```

---

## 23. Süper Admin İçin En Kritik Ekranlar

İlk MVP’de şu ekranlar mutlaka olmalıdır:

```text
1. Hastalık Yönetimi
2. App / Program Yönetimi
3. Modül Builder
4. Questionnaire Builder
5. Check-in Builder
6. Journey Builder
7. Doktor Yönetimi
8. Hasta İzleme Özeti
9. Risk Kuralı Yönetimi
10. Yayınlama / Versiyonlama
```

---

## 24. MVP İçin Öncelikli Modül Tipleri

İlk versiyonda tüm modülleri yapmak yerine şunlarla başlanabilir:

| Öncelik | Modül |
|---|---|
| 1 | Check-in modülü |
| 2 | Questionnaire modülü |
| 3 | Video modülü |
| 4 | Yazılı içerik modülü |
| 5 | Ölçüm girişi modülü |
| 6 | Hatırlatıcı modülü |
| 7 | Risk kuralı modülü |
| 8 | Journey builder |
| 9 | Doktor raporlama |
| 10 | Streak / motivasyon sistemi |

---

## 25. Önerilen Teknik Mimari

```text
Frontend:
- Süper Admin Paneli: React / Next.js
- Doktor Paneli: React / Next.js
- Mobil App: Flutter veya React Native

Backend:
- Node.js / NestJS veya Django
- REST API + gerektiğinde GraphQL
- PostgreSQL
- Redis
- Queue sistemi: BullMQ / RabbitMQ

Storage:
- S3 uyumlu medya depolama
- Video için CDN / Vimeo / özel video altyapısı

Auth:
- JWT / OAuth2
- Role Based Access Control
- 2FA

Analytics:
- Event tracking
- Check-in analytics
- Program completion analytics

Security:
- KVKK / GDPR uyumlu veri saklama
- Audit log
- Encryption at rest
- Encryption in transit
```

---

## 26. Basit Sistem Akışı

```text
Süper Admin hastalık oluşturur
        ↓
Hastalığa bağlı app/program oluşturur
        ↓
Modülleri oluşturur
        ↓
Questionnaire ve check-in tanımlar
        ↓
Journey akışını sürükle-bırak ile belirler
        ↓
Klinik/regülasyon onayından geçirir
        ↓
App’i yayına alır
        ↓
Doktor hastaya programı atar
        ↓
Hasta mobil app’te kullanır
        ↓
Veriler doktor paneline düşer
        ↓
Risk varsa doktor uyarılır
        ↓
Sistem rapor üretir
```

---

## 27. Platformun Kısa Ürün Tanımı

Geliştirilecek platform, davranış temelli müdahale ile yönetilebilen hastalıklar için hastalık bazlı dijital sağlık uygulamalarının oluşturulmasını, yapılandırılmasını, doktora atanmasını ve hasta tarafından mobil uygulama üzerinden kullanılmasını sağlayan modüler bir DiGA yönetim altyapısıdır.

Süper Admin Paneli üzerinden her hastalık için ayrı app/program oluşturulabilir; bu programlara video, yazılı içerik, soru-cevap, anket, check-in, egzersiz, günlük ve risk uyarı modülleri sürükle-bırak yöntemiyle eklenebilir.

Doktor paneli hastaya uygun programı atama, ilerlemeyi izleme ve riskli durumları takip etme imkânı sunarken; mobil uygulama hastaya günlük check-in, eğitim, egzersiz, davranışsal hedefler ve streak tabanlı motivasyon sistemi sağlar.

---

## 28. Önerilen Ürün Adlandırması

İngilizce öneri:

```text
Modular Digital Therapeutics Management Platform
```

Türkçe öneri:

```text
Modüler Dijital Terapötik Uygulama Yönetim Platformu
```
