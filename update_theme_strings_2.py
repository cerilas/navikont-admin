import re

path = '/Users/deniz/Documents/Navikont/navikont/navikont/Theme.swift'
with open(path, 'r') as f:
    content = f.read()

new_entries = """
        "Yeni Şifre (Tekrar)": "New Password (Confirm)",
        "Bildirimleri sessiz al": "Mute notifications",
        "Görev ve egzersiz hatırlatmaları": "Task and exercise reminders",
        "KVKK metni": "KVKK Consent",
        "Sık sorulan sorular": "Frequently asked questions",
        "Eski Şifre": "Old Password",
        "5. İlgili Kişinin Hakları": "5. Rights of the Data Subject",
        "Her Şey Yolunda": "Everything is Fine",
        "Tamamlanan": "Completed",
        "Klinik Uyarı": "Clinical Warning",
        "Su İçme Hatırlatıcıları": "Water Reminders",
        "Açık": "On",
        "Günlük Hatırlatıcılar": "Daily Reminders",
        "Haftalık raporlar ve makaleler": "Weekly reports and articles",
        "Toplam Görev": "Total Tasks",
        "Sağlık ve Fiziksel Bilgiler": "Health & Physical Info",
        "4. Veri Toplama Yöntemi ve Hukuki Sebebi": "4. Data Collection Method and Legal Reason",
        "Şifre ve Güvenlik": "Password & Security",
        "1. Veri Sorumlusunun Kimliği": "1. Identity of the Data Controller",
        "Şifre değiştir": "Change password",
        "Yardım Merkezi": "Help Center",
        "Bildirimler": "Notifications",
        "Program Günü": "Program Day",
        "Boy, kilo, kan grubu": "Height, weight, blood type",
        "Düzenli sıvı alımı takibi": "Regular fluid intake tracking",
        "E-posta Bültenleri": "Email Newsletters",
        "Sessiz Mod": "Silent Mode",
        "2. Kişisel Verilerin İşlenme Amacı": "2. Purpose of Processing Personal Data",
        "3. Verilerin Aktarılması": "3. Transfer of Data",
        "Yeni Şifre": "New Password",
        "Gizlilik Politikası": "Privacy Policy",
        "Veri Bekleniyor": "Pending Data",
        "Günaydın ": "Good morning ",
        "Tünaydın ": "Good afternoon ",
        "İyi akşamlar ": "Good evening ",
        "İyi geceler ": "Good night ",
        "Aydınlık": "Light",
        "Karanlık": "Dark",
        "Otomatik": "Auto",
        "Sistem": "System",
        "Ana Sayfa": "Home",
        "Profil": "Profile"
"""

content = content.replace('"Sıkça Sorulan Sorular (SSS)": "Frequently Asked Questions (FAQ)",', 
                          '"Sıkça Sorulan Sorular (SSS)": "Frequently Asked Questions (FAQ)",' + new_entries)

with open(path, 'w') as f:
    f.write(content)

